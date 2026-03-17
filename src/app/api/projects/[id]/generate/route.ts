import { prisma } from "@/lib/prisma";
import { getWorkspaceId, ensureWorkspaceScope } from "@/lib/workspace-guard";
import { checkUsageLimit, UsageLimitError } from "@/lib/usage-guard";
import { jsonOk, jsonError, jsonNotFound } from "@/lib/api-response";
import type { GenerationResult } from "@/types";
import type { BlockDocument } from "@/types/blocks";
import {
  parseEditorGraph,
  serializeProjectContent,
  upsertShortformSections,
  getShortformStateFromContent,
} from "@/lib/shortform-state";
import { generateWithGemini } from "@/services/gemini-generator";
import { parseBrief } from "@/services/brief-parser";
import { sectionsToBlocks } from "@/services/section-to-blocks";

/**
 * POST /api/projects/:id/generate
 * Start async text generation. Returns 202 with jobId; client polls GET for status.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const workspaceId = await getWorkspaceId();
    await checkUsageLimit(workspaceId, "generation_start");

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
          workspaceId: true,
          status: true,
          briefText: true,
          mode: true,
          content: true,
        },
      });
    if (!project) return jsonNotFound("Project");

    try {
      await ensureWorkspaceScope(project.workspaceId);
    } catch {
      return jsonError("Forbidden: workspace scope violation", 403);
    }

    // Status guard: only draft or failed can generate
    if (project.status !== "draft" && project.status !== "failed") {
      return jsonError("Project status must be 'draft' or 'failed' to generate", 409);
    }

    // Create job + transition to generating
    const job = await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: { status: "generating" },
      });

      const newJob = await tx.generationJob.create({
        data: {
          projectId: id,
          status: "queued",
          provider: body.provider ?? "gemini",
          input: {
            briefText: project.briefText,
            mode: project.mode,
          },
        },
      });

      await tx.usageLedger.create({
        data: {
          workspaceId,
          eventType: "generation_start",
          detail: { projectId: id, jobId: newJob.id },
        },
      });

      return newJob;
    });

    // Fire-and-forget: start background processing
    processGeneration(job.id, id, project.briefText ?? "", {
      apiKey: body.apiKey,
      mode: project.mode ?? "freeform",
      category: body.category,
      existingContent: project.content,
    }).catch((err) => {
      console.error("Background generation error:", err);
    });

    return jsonOk({ jobId: job.id, status: "queued" }, 202);
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return jsonError(error.message, 429);
    }
    console.error("POST /api/projects/[id]/generate error:", error);
    return jsonError("Internal server error", 500);
  }
}

/**
 * GET /api/projects/:id/generate?jobId=xxx
 * Poll text generation job status.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return jsonError("Missing jobId query parameter", 400);
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        workspaceId: true,
        status: true,
        content: true,
      },
    });
    if (!project) return jsonNotFound("Project");

    try {
      await ensureWorkspaceScope(project.workspaceId);
    } catch {
      return jsonError("Forbidden: workspace scope violation", 403);
    }

    const job = await prisma.generationJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        projectId: true,
        status: true,
        provider: true,
        error: true,
        startedAt: true,
        doneAt: true,
      },
    });

    if (!job || job.projectId !== id) {
      return jsonNotFound("GenerationJob");
    }

    return jsonOk({
      job: {
        id: job.id,
        status: job.status,
        provider: job.provider,
        error: job.error,
        startedAt: job.startedAt,
        doneAt: job.doneAt,
      },
      ...(job.status === "done"
        ? { project: { status: project.status, content: project.content } }
        : {}),
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/generate error:", error);
    return jsonError("Internal server error", 500);
  }
}

/**
 * Background processing: generate text sections via Gemini with brief-parser fallback.
 */
async function processGeneration(
  jobId: string,
  projectId: string,
  briefText: string,
  options: { apiKey?: string; mode: string; category?: string; existingContent?: string | null }
) {
  try {
    // job → running
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "running", startedAt: new Date() },
    });

    // Gemini call with brief-parser fallback
    let generationOutput: GenerationResult;
    try {
      generationOutput = await generateWithGemini(briefText, {
        apiKey: options.apiKey,
        mode: options.mode,
        category: options.category,
      });
    } catch (geminiError) {
      console.warn("Gemini failed, falling back to brief-parser:", geminiError);
      const parsed = parseBrief(briefText);
      generationOutput =
        parsed.sections.length > 0
          ? parsed
          : {
              sections: [
                {
                  headline: "Untitled",
                  body: briefText,
                  imageSlot: "slot-1",
                  styleKey: "default",
                },
              ],
            };
    }

    // If compose mode, convert sections to blocks
    let contentToSave: unknown;
    if (options.mode === "compose") {
      const blockDoc: BlockDocument = {
        format: "blocks",
        blocks: sectionsToBlocks(generationOutput.sections, options.category),
        platform: { width: 780, name: "coupang" },
        version: 1,
      };
      contentToSave = blockDoc;
    } else {
      const savedGraph = parseEditorGraph(options.existingContent);
      const nextShortform = upsertShortformSections(
        getShortformStateFromContent(options.existingContent),
        generationOutput.sections,
      );
      contentToSave = savedGraph
        ? serializeProjectContent({
            nodes: savedGraph.nodes,
            edges: savedGraph.edges,
            shortform: nextShortform,
          })
        : ({
            sections: generationOutput.sections,
            shortform: nextShortform,
          });
    }

    // project content save + job done
    await prisma.$transaction([
      prisma.project.update({
        where: { id: projectId },
        data: {
          status: "generated",
          content: contentToSave,
        },
      }),
      prisma.generationJob.update({
        where: { id: jobId },
        data: {
          status: "done",
          output: generationOutput,
          doneAt: new Date(),
        },
      }),
    ]);
  } catch (error) {
    // job + project failed
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "failed", error: String(error), doneAt: new Date() },
    });
    await prisma.project
      .update({ where: { id: projectId }, data: { status: "failed" } })
      .catch(() => {});
  }
}
