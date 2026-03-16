/** POST /api/projects/:id/generate-block-text — 블록 타입별 AI 문구 생성 */
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { ensureWorkspaceScope } from "@/lib/workspace-guard";
import { jsonOk, jsonError, jsonNotFound } from "@/lib/api-response";

const MODEL = "gemini-2.5-flash";

const TONE_INSTRUCTIONS: Record<string, string> = {
  formal: "Use a formal, professional tone. Polished and authoritative.",
  casual: "Use a casual, conversational tone. Relaxed and approachable.",
  playful: "Use a playful, fun tone. Energetic and creative.",
  premium: "Use a luxurious, premium tone. Elegant and exclusive.",
  friendly: "Use a warm, friendly tone. Inviting and personable.",
};

const BLOCK_PROMPTS: Record<string, string> = {
  "text-block": `Write a product detail section with:
- headline: attention-grabbing title (max 20 chars)
- body: persuasive description (60-120 chars)
Write in the same language as the context.`,

  "selling-point": `Write 3 selling points for this product. Each point has:
- title: benefit keyword (max 8 chars)
- description: one-line explanation (max 30 chars)
Return as JSON: { "items": [{ "title": "...", "description": "..." }] }
Write in the same language as the context.`,

  review: `Write 3 realistic customer reviews for this product. Each review has:
- reviewer: a Korean name (2-3 chars)
- rating: number 4-5
- text: natural review text (30-80 chars)
Return as JSON: { "reviews": [{ "reviewer": "...", "rating": 5, "text": "..." }] }
Write in Korean.`,

  faq: `Write 3 frequently asked questions about this product. Each has:
- question: natural question (max 40 chars)
- answer: helpful answer (40-100 chars)
Return as JSON: { "items": [{ "question": "...", "answer": "..." }] }
Write in the same language as the context.`,

  "banner-strip": `Write a promotional banner message for this product:
- text: main banner text (max 20 chars)
- subtext: supporting detail (max 30 chars)
Return as JSON: { "text": "...", "subtext": "..." }
Write in the same language as the context.`,
};

const RESPONSE_SCHEMAS: Record<string, object> = {
  "text-block": {
    type: "OBJECT",
    properties: {
      headline: { type: "STRING" },
      body: { type: "STRING" },
    },
    required: ["headline", "body"],
  },
  "selling-point": {
    type: "OBJECT",
    properties: {
      items: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            description: { type: "STRING" },
          },
          required: ["title", "description"],
        },
      },
    },
    required: ["items"],
  },
  review: {
    type: "OBJECT",
    properties: {
      reviews: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            reviewer: { type: "STRING" },
            rating: { type: "NUMBER" },
            text: { type: "STRING" },
          },
          required: ["reviewer", "rating", "text"],
        },
      },
    },
    required: ["reviews"],
  },
  faq: {
    type: "OBJECT",
    properties: {
      items: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            question: { type: "STRING" },
            answer: { type: "STRING" },
          },
          required: ["question", "answer"],
        },
      },
    },
    required: ["items"],
  },
  "banner-strip": {
    type: "OBJECT",
    properties: {
      text: { type: "STRING" },
      subtext: { type: "STRING" },
    },
    required: ["text", "subtext"],
  },
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const blockType = body.blockType as string;
    const context = body.context as string | undefined;
    const tone = body.tone as string | undefined;
    const userPrompt = body.userPrompt as string | undefined;

    if (!blockType || !BLOCK_PROMPTS[blockType]) {
      return jsonError(`Unsupported block type: ${blockType}`, 400);
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: { workspaceId: true, briefText: true, name: true },
    });
    if (!project) return jsonNotFound("Project");

    try {
      ensureWorkspaceScope(project.workspaceId);
    } catch {
      return jsonError("Forbidden", 403);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonError("GEMINI_API_KEY not configured", 500);
    }

    const productContext = context || project.briefText || project.name || "일반 상품";
    const toneInstruction = tone && TONE_INSTRUCTIONS[tone] ? `\nTone: ${TONE_INSTRUCTIONS[tone]}` : "";
    const userInstruction = userPrompt?.trim() ? `\nAdditional instructions: ${userPrompt.trim()}` : "";
    const prompt = [
      BLOCK_PROMPTS[blockType],
      toneInstruction,
      userInstruction,
      "",
      "Product context:",
      productContext,
    ].join("\n");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMAS[blockType],
      },
    });

    const text = response.text;
    if (!text) {
      return jsonError("Empty response from AI", 500);
    }

    const result = JSON.parse(text);
    return jsonOk({ blockType, result });
  } catch (error) {
    console.error("POST /api/projects/[id]/generate-block-text error:", error);
    return jsonError("Internal server error", 500);
  }
}
