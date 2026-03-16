/** POST /api/projects/:id/model-compose — 모델 합성 (Provider + 참조 이미지) */

import { prisma } from "@/lib/prisma";
import { getWorkspaceId, ensureWorkspaceScope } from "@/lib/workspace-guard";
import { jsonOk, jsonError, jsonNotFound } from "@/lib/api-response";
import { getProvider, getProviderLabel } from "@/services/providers/registry";
import { downloadImageAsBase64 } from "@/services/kie-generator";
import { saveGeneratedImage } from "@/lib/save-generated-image";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const assetId: string | undefined = body.assetId;
  const aspectRatio: string = body.aspectRatio ?? "1:1";
  const userPrompt: string | undefined = body.prompt;

  if (!assetId) {
    return jsonError("Missing assetId", 400);
  }

  try {
    const workspaceId = getWorkspaceId();

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return jsonNotFound("Project");

    try {
      ensureWorkspaceScope(project.workspaceId);
    } catch {
      return jsonError("Forbidden: workspace scope violation", 403);
    }

    const sourceAsset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!sourceAsset || sourceAsset.projectId !== id) {
      return jsonError("Asset not found or not in this project", 404);
    }

    // Extract prompt from project content
    let promptText = "";
    try {
      const content = JSON.parse(project.content ?? "{}");
      promptText = content.briefText ?? project.briefText ?? "";
    } catch {
      promptText = project.briefText ?? "";
    }

    // Combine project brief with user-provided prompt
    if (userPrompt?.trim()) {
      promptText = promptText ? `${promptText}\n\n${userPrompt.trim()}` : userPrompt.trim();
    }

    if (!promptText) {
      return jsonError("프롬프트가 비어있습니다. 프롬프트를 먼저 입력해 주세요.", 400);
    }

    const job = await prisma.$transaction(async (tx) => {
      const newJob = await tx.generationJob.create({
        data: {
          projectId: id,
          status: "queued",
          provider: `${getProviderLabel()}-model-compose`,
          input: JSON.stringify({ assetId, aspectRatio, promptText }),
        },
      });

      await tx.usageLedger.create({
        data: {
          workspaceId,
          eventType: "model_compose_start",
          detail: JSON.stringify({ projectId: id, jobId: newJob.id, assetId }),
        },
      });

      return newJob;
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const imageUrl = `${baseUrl}/${sourceAsset.filePath.replace(/\\/g, "/")}`;

    processModelCompose(job.id, id, promptText, imageUrl, aspectRatio).catch((err) => {
      console.error("Background model-compose error:", err);
    });

    return jsonOk({ jobId: job.id, status: "queued" }, 202);
  } catch (error) {
    console.error("POST /api/projects/[id]/model-compose error:", error);
    return jsonError("Internal server error", 500);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return jsonError("Missing jobId query parameter", 400);
  }

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return jsonNotFound("Project");

    try {
      ensureWorkspaceScope(project.workspaceId);
    } catch {
      return jsonError("Forbidden: workspace scope violation", 403);
    }

    const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
    if (!job || job.projectId !== id) {
      return jsonNotFound("GenerationJob");
    }

    let assets: unknown[] = [];
    if (job.status === "done" && job.output) {
      try {
        const output = JSON.parse(job.output);
        const assetIds = (output.assets ?? []).map((a: { assetId: string }) => a.assetId);
        assets = await prisma.asset.findMany({
          where: { id: { in: assetIds } },
          select: { id: true, filePath: true, mimeType: true, sourceType: true },
        });
      } catch {
        // best-effort
      }
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
      ...(job.status === "done" ? { assets } : {}),
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/model-compose error:", error);
    return jsonError("Internal server error", 500);
  }
}

async function processModelCompose(
  jobId: string,
  projectId: string,
  promptText: string,
  imageUrl: string,
  aspectRatio: string,
) {
  try {
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "running", startedAt: new Date() },
    });

    const provider = getProvider();
    const result = await provider.textToImage({
      prompt: promptText,
      aspectRatio,
      imageInput: [imageUrl],
    });

    const img = await downloadImageAsBase64(result.imageUrls[0]);
    const saved = await saveGeneratedImage(
      projectId,
      img.imageBytes,
      img.mimeType,
      "model-compose",
    );

    await prisma.$transaction([
      prisma.project.update({
        where: { id: projectId },
        data: { status: "generated" },
      }),
      prisma.generationJob.update({
        where: { id: jobId },
        data: {
          status: "done",
          output: JSON.stringify({ assets: [saved] }),
          doneAt: new Date(),
        },
      }),
    ]);
  } catch (error) {
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "failed", error: String(error), doneAt: new Date() },
    });
  }
}
