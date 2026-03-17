/** POST /api/projects/:id/generate-block-text — 블록 타입별 AI 문구 생성 */
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { getWorkspaceId, ensureWorkspaceScope } from "@/lib/workspace-guard";
import { checkUsageLimit, UsageLimitError, COST_ESTIMATES } from "@/lib/usage-guard";
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

  "image-text": `Write a product image-text section with:
- heading: attention-grabbing title (max 20 chars)
- body: persuasive description (60-120 chars)
Return as JSON: { "heading": "...", "body": "..." }
Write in the same language as the context.`,

  "spec-table": `Write a product specification table with:
- title: section title (max 15 chars)
- rows: 4-6 spec rows, each with label (max 10 chars) and value (max 20 chars)
Return as JSON: { "title": "...", "rows": [{ "label": "...", "value": "..." }] }
Write in the same language as the context.`,

  cta: `Write a call-to-action section for this product:
- text: main CTA headline (max 20 chars)
- subtext: supporting message (max 30 chars)
- buttonLabel: action button text (max 10 chars)
Return as JSON: { "text": "...", "subtext": "...", "buttonLabel": "..." }
Write in the same language as the context.`,

  "usage-steps": `Write 3-4 usage steps for this product. Each step has:
- label: step name (max 10 chars)
- description: one-line explanation (max 30 chars)
Also write a section title (max 15 chars).
Return as JSON: { "title": "...", "steps": [{ "label": "...", "description": "..." }] }
Write in the same language as the context.`,

  notice: `Write 3-5 notice/caution items for this product:
- title: section title (max 15 chars)
- items: each with text (max 40 chars)
Return as JSON: { "title": "...", "items": [{ "text": "..." }] }
Write in the same language as the context.`,

  "price-promo": `Write promotional copy for a price/discount section:
- badge: discount badge text (max 10 chars, e.g. "특가", "SALE")
- expiresLabel: urgency/expiry message (max 20 chars, e.g. "오늘만 이 가격!")
Return as JSON: { "badge": "...", "expiresLabel": "..." }
Write in the same language as the context.`,

  "trust-badge": `Write trust badge labels for this product:
- title: section title (max 15 chars)
- badges: 3-4 trust indicators, each with label (max 12 chars)
Return as JSON: { "title": "...", "badges": [{ "label": "..." }] }
Write in the same language as the context.`,

  comparison: `Write comparison labels for a before/after section:
- title: section title (max 15 chars)
- beforeLabel: "before" label (max 10 chars)
- afterLabel: "after" label (max 10 chars)
Return as JSON: { "title": "...", "beforeLabel": "...", "afterLabel": "..." }
Write in the same language as the context.`,

  "image-grid": `Write captions for a product image grid (3-4 images):
- captions: short descriptive caption for each image (max 15 chars each)
Return as JSON: { "captions": ["...", "...", "..."] }
Write in the same language as the context.`,
};

/** Mock fallback — API 키 없이 테스트용 샘플 데이터 */
const MOCK_RESULTS: Record<string, unknown> = {
  "text-block": { headline: "[목] 특별한 상품", body: "이 제품은 테스트용 목업 데이터입니다. 실제 AI 생성 결과가 아닙니다." },
  "selling-point": { items: [{ title: "고품질", description: "엄선된 재료로 제작" }, { title: "합리적", description: "가성비 최고의 선택" }, { title: "신뢰", description: "10년 전통의 브랜드" }] },
  review: { reviews: [{ reviewer: "김테스", rating: 5, text: "목업 리뷰입니다. 실제 사용 후기가 아닙니다." }, { reviewer: "박샘플", rating: 4, text: "테스트용 리뷰 텍스트입니다." }, { reviewer: "이데모", rating: 5, text: "mock 모드에서 생성된 샘플 리뷰." }] },
  faq: { items: [{ question: "이 데이터는 실제인가요?", answer: "아닙니다. USE_MOCK=true 또는 GEMINI_API_KEY 미설정 시 반환되는 테스트 데이터입니다." }, { question: "실제 AI 결과를 보려면?", answer: "GEMINI_API_KEY를 설정하고 USE_MOCK을 제거하세요." }, { question: "비용이 발생하나요?", answer: "mock 모드에서는 AI API 비용이 발생하지 않습니다." }] },
  "banner-strip": { text: "[목] 특가 이벤트", subtext: "테스트용 배너 텍스트입니다" },
  "image-text": { heading: "[목] 제품 소개", body: "이 텍스트는 mock 모드에서 생성된 테스트 데이터입니다." },
  "spec-table": { title: "제품 사양", rows: [{ label: "재질", value: "테스트용" }, { label: "크기", value: "000×000mm" }, { label: "무게", value: "000g" }, { label: "원산지", value: "대한민국" }] },
  cta: { text: "[목] 지금 구매하세요", subtext: "테스트용 CTA 텍스트입니다", buttonLabel: "구매하기" },
  "usage-steps": { title: "사용 방법", steps: [{ label: "1단계", description: "포장을 개봉합니다" }, { label: "2단계", description: "제품을 꺼냅니다" }, { label: "3단계", description: "사용합니다" }] },
  notice: { title: "유의사항", items: [{ text: "이것은 테스트 데이터입니다" }, { text: "실제 제품 정보가 아닙니다" }, { text: "mock 모드에서 자동 생성됨" }] },
  "price-promo": { badge: "[목] 특가", expiresLabel: "테스트 이벤트 진행 중!" },
  "trust-badge": { title: "신뢰 인증", badges: [{ label: "테스트 인증" }, { label: "목업 마크" }, { label: "샘플 뱃지" }] },
  comparison: { title: "비교", beforeLabel: "이전", afterLabel: "이후" },
  "image-grid": { captions: ["목업 이미지 1", "목업 이미지 2", "목업 이미지 3"] },
};

function isMockMode(): boolean {
  return process.env.USE_MOCK === "true" || !process.env.GEMINI_API_KEY;
}

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
  "image-text": {
    type: "OBJECT",
    properties: {
      heading: { type: "STRING" },
      body: { type: "STRING" },
    },
    required: ["heading", "body"],
  },
  "spec-table": {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      rows: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            label: { type: "STRING" },
            value: { type: "STRING" },
          },
          required: ["label", "value"],
        },
      },
    },
    required: ["title", "rows"],
  },
  cta: {
    type: "OBJECT",
    properties: {
      text: { type: "STRING" },
      subtext: { type: "STRING" },
      buttonLabel: { type: "STRING" },
    },
    required: ["text", "subtext", "buttonLabel"],
  },
  "usage-steps": {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      steps: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            label: { type: "STRING" },
            description: { type: "STRING" },
          },
          required: ["label", "description"],
        },
      },
    },
    required: ["title", "steps"],
  },
  notice: {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      items: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING" },
          },
          required: ["text"],
        },
      },
    },
    required: ["title", "items"],
  },
  "price-promo": {
    type: "OBJECT",
    properties: {
      badge: { type: "STRING" },
      expiresLabel: { type: "STRING" },
    },
    required: ["badge", "expiresLabel"],
  },
  "trust-badge": {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      badges: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            label: { type: "STRING" },
          },
          required: ["label"],
        },
      },
    },
    required: ["title", "badges"],
  },
  comparison: {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      beforeLabel: { type: "STRING" },
      afterLabel: { type: "STRING" },
    },
    required: ["title", "beforeLabel", "afterLabel"],
  },
  "image-grid": {
    type: "OBJECT",
    properties: {
      captions: {
        type: "ARRAY",
        items: { type: "STRING" },
      },
    },
    required: ["captions"],
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
    const rewriteMode = body.rewriteMode as "tone" | "translate" | "shorten" | undefined;
    const existingText = body.existingText as string | undefined;

    if (!blockType || !BLOCK_PROMPTS[blockType]) {
      return jsonError(`Unsupported block type: ${blockType}`, 400);
    }

    const isRewrite = !!(rewriteMode && existingText);
    const eventType = isRewrite ? "text_rewrite" : "block_text_generate";

    const workspaceId = await getWorkspaceId();
    await checkUsageLimit(workspaceId, eventType);

    const project = await prisma.project.findUnique({
      where: { id },
      select: { workspaceId: true, briefText: true, name: true },
    });
    if (!project) return jsonNotFound("Project");

    try {
      await ensureWorkspaceScope(project.workspaceId);
    } catch {
      return jsonError("Forbidden", 403);
    }

    let result: unknown;

    if (isMockMode()) {
      // Mock fallback — AI API 비용 없이 테스트
      await new Promise((r) => setTimeout(r, 300)); // 약간의 딜레이로 실제감
      result = MOCK_RESULTS[blockType] ?? { text: `[목] ${blockType} 샘플` };
    } else {
      const apiKey = process.env.GEMINI_API_KEY!;

      let prompt: string;

      if (isRewrite) {
        const modeInstructions: Record<string, string> = {
          tone: `Rewrite the following text with a ${tone ?? "casual"} tone. Keep the same structure and meaning but change the style.\nTone: ${TONE_INSTRUCTIONS[tone ?? "casual"] ?? "Use a casual, conversational tone."}`,
          translate: "Translate the following text. If it's in Korean, translate to English. If it's in English, translate to Korean. Keep the same structure.",
          shorten: "Shorten the following text to be more concise while keeping the key message. Aim for 50-70% of the original length.",
        };
        const instruction = modeInstructions[rewriteMode!] ?? modeInstructions.tone;
        prompt = [
          instruction,
          "",
          `Output must match the JSON schema for block type "${blockType}".`,
          "",
          "Text to rewrite:",
          existingText!,
        ].join("\n");
      } else {
        const productContext = context || project.briefText || project.name || "일반 상품";
        const toneInstruction = tone && TONE_INSTRUCTIONS[tone] ? `\nTone: ${TONE_INSTRUCTIONS[tone]}` : "";
        const userInstruction = userPrompt?.trim() ? `\nAdditional instructions: ${userPrompt.trim()}` : "";
        prompt = [
          BLOCK_PROMPTS[blockType],
          toneInstruction,
          userInstruction,
          "",
          "Product context:",
          productContext,
        ].join("\n");
      }

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

      result = JSON.parse(text);
    }

    await prisma.usageLedger.create({
      data: {
        workspaceId,
        eventType,
        detail: { projectId: id, blockType, ...(isRewrite ? { rewriteMode } : {}) },
        costEstimate: COST_ESTIMATES[eventType] ?? null,
      },
    });

    return jsonOk({ blockType, result });
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return jsonError(error.message, 429);
    }
    console.error("POST /api/projects/[id]/generate-block-text error:", error);
    return jsonError("Internal server error", 500);
  }
}
