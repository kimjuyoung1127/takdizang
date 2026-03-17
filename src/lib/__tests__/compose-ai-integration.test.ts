/** Compose AI 통합 기능 테스트 — 비용 0원, 순수 로직 검증 */

import { describe, it, expect } from "vitest";

// ══════════════════════════════════════
// 1. usage-guard: 새 이벤트 타입 + COST_ESTIMATES
// ══════════════════════════════════════

describe("usage-guard 이벤트 체계", () => {
  // Dynamic import to avoid Supabase init at module level
  let FREE_LIMITS: Record<string, number>;
  let COST_ESTIMATES: Record<string, number>;

  it("모듈 로드 가능", async () => {
    // usage-guard는 getSupabaseAdmin을 import하므로 direct import 대신 파일 파싱
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../usage-guard.ts"),
      "utf-8",
    );

    // FREE_LIMITS 파싱
    const limitsMatch = content.match(
      /const FREE_LIMITS[^{]*\{([^}]+)\}/s,
    );
    expect(limitsMatch).toBeTruthy();
    const limitsBody = limitsMatch![1];

    // COST_ESTIMATES 파싱
    const costMatch = content.match(
      /export const COST_ESTIMATES[^{]*\{([^}]+)\}/s,
    );
    expect(costMatch).toBeTruthy();

    // 문자열에서 키 추출
    const extractKeys = (body: string) =>
      [...body.matchAll(/(\w+):/g)].map((m) => m[1]);

    const limitKeys = extractKeys(limitsBody);
    const costKeys = extractKeys(costMatch![1]);

    FREE_LIMITS = Object.fromEntries(limitKeys.map((k) => [k, 1]));
    COST_ESTIMATES = Object.fromEntries(costKeys.map((k) => [k, 0.01]));
  });

  it("scene_compose_start가 FREE_LIMITS에 존재", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(path.resolve(__dirname, "../usage-guard.ts"), "utf-8");
    expect(content).toContain("scene_compose_start:");
    // model_compose_start과 분리되어 있어야 함
    expect(content).toContain("model_compose_start:");
  });

  it("block_text_generate가 FREE_LIMITS에 존재 (한도 30)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(path.resolve(__dirname, "../usage-guard.ts"), "utf-8");
    expect(content).toMatch(/block_text_generate:\s*30/);
  });

  it("text_rewrite가 FREE_LIMITS에 존재 (한도 20)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(path.resolve(__dirname, "../usage-guard.ts"), "utf-8");
    expect(content).toMatch(/text_rewrite:\s*20/);
  });

  it("COST_ESTIMATES가 export되어 있음", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(path.resolve(__dirname, "../usage-guard.ts"), "utf-8");
    expect(content).toContain("export const COST_ESTIMATES");
  });

  it("모든 FREE_LIMITS 이벤트에 대응하는 COST_ESTIMATES 존재", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(path.resolve(__dirname, "../usage-guard.ts"), "utf-8");

    const limitsMatch = content.match(/const FREE_LIMITS[^{]*\{([^}]+)\}/s);
    const costMatch = content.match(/export const COST_ESTIMATES[^{]*\{([^}]+)\}/s);
    expect(limitsMatch).toBeTruthy();
    expect(costMatch).toBeTruthy();

    const extractKeys = (body: string) =>
      [...body.matchAll(/(\w+):/g)].map((m) => m[1]);

    const limitKeys = extractKeys(limitsMatch![1]);
    const costKeys = extractKeys(costMatch![1]);

    for (const key of limitKeys) {
      expect(costKeys).toContain(key);
    }
  });
});

// ══════════════════════════════════════
// 2. generate/route.ts: compose 블록 변환 조건
// ══════════════════════════════════════

describe("generate route — compose 조건", () => {
  it("editorMode 참조가 없어야 함", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/projects/[id]/generate/route.ts"),
      "utf-8",
    );
    expect(content).not.toContain("editorMode");
  });

  it("options.mode === 'compose' 조건이 있어야 함", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/projects/[id]/generate/route.ts"),
      "utf-8",
    );
    expect(content).toContain('options.mode === "compose"');
  });

  it("costEstimate가 usageLedger.create에 포함됨", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/projects/[id]/generate/route.ts"),
      "utf-8",
    );
    expect(content).toContain("costEstimate:");
  });
});

// ══════════════════════════════════════
// 3. generate-block-text: mock fallback + rewrite mode
// ══════════════════════════════════════

describe("generate-block-text route 구조", () => {
  let content: string;

  it("파일 로드", async () => {
    const fs = await import("fs");
    const path = await import("path");
    content = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/projects/[id]/generate-block-text/route.ts"),
      "utf-8",
    );
    expect(content).toBeTruthy();
  });

  it("mock fallback이 구현됨 (isMockMode)", () => {
    expect(content).toContain("isMockMode()");
    expect(content).toContain("MOCK_RESULTS");
  });

  it("14종 블록 타입 mock 데이터 존재", () => {
    // MOCK_RESULTS 객체에 해당 키가 있는지 확인
    expect(content).toContain("MOCK_RESULTS");
    const expectedTypes = [
      "text-block", "selling-point", "review", "faq", "banner-strip",
      "image-text", "spec-table", "cta", "usage-steps", "notice",
      "price-promo", "trust-badge", "comparison", "image-grid",
    ];
    // MOCK_RESULTS 블록 추출
    const mockMatch = content.match(/const MOCK_RESULTS[\s\S]*?\n\};/);
    expect(mockMatch).toBeTruthy();
    const mockBlock = mockMatch![0];
    for (const t of expectedTypes) {
      // 키가 따옴표 있거나 없을 수 있음 (e.g. "text-block": vs cta:)
      const hasQuoted = mockBlock.includes(`"${t}"`);
      const hasUnquoted = mockBlock.includes(`${t}:`);
      expect(hasQuoted || hasUnquoted).toBe(true);
    }
  });

  it("rewriteMode 파라미터 처리", () => {
    expect(content).toContain("rewriteMode");
    expect(content).toContain("existingText");
  });

  it("rewrite 3종 모드 존재 (tone/translate/shorten)", () => {
    expect(content).toContain('"tone"');
    expect(content).toContain('"translate"');
    expect(content).toContain('"shorten"');
  });

  it("rewrite 시 eventType이 text_rewrite", () => {
    expect(content).toContain('"text_rewrite"');
    expect(content).toContain('"block_text_generate"');
  });

  it("checkUsageLimit 호출", () => {
    expect(content).toContain("checkUsageLimit");
  });

  it("usageLedger.create 호출 + costEstimate", () => {
    expect(content).toContain("usageLedger.create");
    expect(content).toContain("COST_ESTIMATES[eventType]");
  });

  it("USE_MOCK=true 또는 GEMINI_API_KEY 없으면 mock", () => {
    expect(content).toContain('process.env.USE_MOCK === "true"');
    expect(content).toContain("!process.env.GEMINI_API_KEY");
  });
});

// ══════════════════════════════════════
// 4. 라우트별 이벤트 타입 정합성
// ══════════════════════════════════════

describe("라우트별 이벤트 타입 + costEstimate 정합성", () => {
  const routes = [
    { path: "scene-compose", expectedEvent: "scene_compose_start", expectedLimit: "scene_compose_start" },
    { path: "marketing-script", expectedEvent: "marketing_script_start", expectedLimit: "marketing_script_start" },
    { path: "thumbnail", expectedEvent: "thumbnail_start", expectedLimit: "thumbnail_start" },
    { path: "model-compose", expectedEvent: "model_compose_start", expectedLimit: "model_compose_start" },
    { path: "remove-bg", expectedEvent: "remove_bg_start", expectedLimit: "remove_bg_start" },
    { path: "generate-images", expectedEvent: "image_generation_start", expectedLimit: "image_generation_start" },
  ];

  // export는 별도 테스트 (checkUsageLimit 없음 — 무료 기능)
  it("export: eventType=export_start, costEstimate 존재 (checkUsageLimit 없음)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routeContent = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/projects/[id]/export/route.ts"),
      "utf-8",
    );
    expect(routeContent).toContain('eventType: "export_start"');
    expect(routeContent).toContain("costEstimate:");
  });

  for (const route of routes) {
    it(`${route.path}: eventType=${route.expectedEvent}, checkUsageLimit=${route.expectedLimit}, costEstimate 존재`, async () => {
      const fs = await import("fs");
      const path = await import("path");
      const content = fs.readFileSync(
        path.resolve(__dirname, `../../app/api/projects/[id]/${route.path}/route.ts`),
        "utf-8",
      );

      expect(content).toContain(`eventType: "${route.expectedEvent}"`);
      expect(content).toContain(`checkUsageLimit(workspaceId, "${route.expectedLimit}")`);
      expect(content).toContain("costEstimate:");
    });
  }
});

// ══════════════════════════════════════
// 5. api-client: bulkGenerateContent + rewrite opts
// ══════════════════════════════════════

describe("api-client 확장", () => {
  let content: string;

  it("파일 로드", async () => {
    const fs = await import("fs");
    const path = await import("path");
    content = fs.readFileSync(
      path.resolve(__dirname, "../api-client.ts"),
      "utf-8",
    );
    expect(content).toBeTruthy();
  });

  it("bulkGenerateContent 함수 존재", () => {
    expect(content).toContain("export async function bulkGenerateContent");
  });

  it("bulkGenerateContent 흐름: updateContent → startGenerate → startGenerateImages → getBlocks", () => {
    // 함수 본문 추출
    const fnMatch = content.match(
      /export async function bulkGenerateContent[\s\S]*?^}/m,
    );
    expect(fnMatch).toBeTruthy();
    const fnBody = fnMatch![0];

    expect(fnBody).toContain("updateContent(projectId, { briefText })");
    expect(fnBody).toContain("startGenerate(projectId");
    expect(fnBody).toContain("startGenerateImages(projectId");
    expect(fnBody).toContain("getBlocks(projectId)");
  });

  it("bulkGenerateContent에 콜백 (onTextStart/onTextDone/onImagesStart/onImagesDone) 지원", () => {
    expect(content).toContain("onTextStart");
    expect(content).toContain("onTextDone");
    expect(content).toContain("onImagesStart");
    expect(content).toContain("onImagesDone");
  });

  it("generateBlockText에 rewriteMode/existingText 파라미터", () => {
    expect(content).toContain("rewriteMode");
    expect(content).toContain("existingText");
  });

  it("pollUntilDone 헬퍼 존재", () => {
    expect(content).toContain("pollUntilDone");
  });
});

// ══════════════════════════════════════
// 6. UI 컴포넌트 구조 검증
// ══════════════════════════════════════

describe("UI 컴포넌트 구조 — quick-actions.tsx", () => {
  let content: string;

  it("파일 로드", async () => {
    const fs = await import("fs");
    const path = await import("path");
    content = fs.readFileSync(
      path.resolve(__dirname, "../../components/compose/quick-actions.tsx"),
      "utf-8",
    );
    expect(content).toBeTruthy();
  });

  it('"use client" 지시어', () => {
    expect(content).toContain('"use client"');
  });

  it("QuickActions 컴포넌트 export", () => {
    expect(content).toContain("export function QuickActions");
  });

  it("buildQuickActions 팩토리 export", () => {
    expect(content).toContain("export function buildQuickActions");
  });

  it("17개 액션 정의", () => {
    const ids = [
      "bulk-draft", "block-text", "text-rewrite", "fill-empty", "add-variation",
      "image-gen", "scene-compose", "model-compose", "remove-bg",
      "video-render", "thumbnail", "script",
      "save", "preview", "export", "design-check", "templates",
    ];
    for (const id of ids) {
      expect(content).toContain(`id: "${id}"`);
    }
  });

  it("한국어 라벨 사용", () => {
    expect(content).toContain("한 번에 초안 만들기");
    expect(content).toContain("AI 문구 생성");
    expect(content).toContain("텍스트 다시 쓰기");
    expect(content).toContain("빈 칸 채우기");
    expect(content).toContain("비슷한 버전 추가");
    expect(content).toContain("배경 합성");
    expect(content).toContain("모델컷 합성");
    expect(content).toContain("배경 제거");
  });

  it("크레딧 표시", () => {
    expect(content).toContain('credit:');
  });

  it("상태 기반 비활성 (status-generated)", () => {
    expect(content).toContain('"status-generated"');
    expect(content).toContain("초안을 만들면 사용할 수 있어요");
  });

  it("키보드 탐색 (ArrowUp/Down, Enter, Escape)", () => {
    expect(content).toContain('"ArrowDown"');
    expect(content).toContain('"ArrowUp"');
    expect(content).toContain('"Enter"');
    expect(content).toContain('"Escape"');
  });
});

describe("UI 컴포넌트 구조 — draft-generator-dialog.tsx", () => {
  let content: string;

  it("파일 로드", async () => {
    const fs = await import("fs");
    const path = await import("path");
    content = fs.readFileSync(
      path.resolve(__dirname, "../../components/compose/draft-generator-dialog.tsx"),
      "utf-8",
    );
    expect(content).toBeTruthy();
  });

  it('"use client" 지시어', () => {
    expect(content).toContain('"use client"');
  });

  it("DraftGeneratorDialog 컴포넌트 export", () => {
    expect(content).toContain("export function DraftGeneratorDialog");
  });

  it("비용 안내 표시", () => {
    expect(content).toContain("약 15 크레딧 소요");
  });

  it("교체 경고 표시", () => {
    expect(content).toContain("현재 블록이 새 초안으로 교체됩니다");
  });

  it("bulkGenerateContent 호출", () => {
    expect(content).toContain("bulkGenerateContent");
  });

  it("4단계 phase (input → generating-text → generating-images → complete)", () => {
    expect(content).toContain('"input"');
    expect(content).toContain('"generating-text"');
    expect(content).toContain('"generating-images"');
    expect(content).toContain('"complete"');
    expect(content).toContain('"error"');
  });

  it("카테고리 선택 (PRODUCT_CATEGORIES)", () => {
    expect(content).toContain("PRODUCT_CATEGORIES");
  });
});

describe("UI 컴포넌트 구조 — block-context-menu.tsx", () => {
  let content: string;

  it("파일 로드", async () => {
    const fs = await import("fs");
    const path = await import("path");
    content = fs.readFileSync(
      path.resolve(__dirname, "../../components/compose/block-context-menu.tsx"),
      "utf-8",
    );
    expect(content).toBeTruthy();
  });

  it('"use client" 지시어', () => {
    expect(content).toContain('"use client"');
  });

  it("BlockContextMenu 컴포넌트 export", () => {
    expect(content).toContain("export function BlockContextMenu");
  });

  it("AI 섹션 라벨", () => {
    expect(content).toContain("AI 문구 생성");
    expect(content).toContain("텍스트 다시 쓰기");
    expect(content).toContain("AI 이미지 생성");
    expect(content).toContain("배경 합성");
    expect(content).toContain("모델컷 합성");
    expect(content).toContain("배경 제거");
  });

  it("편집 섹션 라벨", () => {
    expect(content).toContain("비슷한 버전 추가");
    expect(content).toContain("복제");
    expect(content).toContain("삭제");
    expect(content).toContain("위로 이동");
    expect(content).toContain("아래로 이동");
  });

  it("빠른 실행 바로가기 (Ctrl+K)", () => {
    expect(content).toContain("빠른 실행");
    expect(content).toContain("Ctrl+K");
  });

  it("텍스트/이미지 블록 타입 분기", () => {
    expect(content).toContain("TEXT_BLOCK_TYPES");
    expect(content).toContain("IMAGE_BLOCK_TYPES");
  });

  it("크레딧 비용 표시", () => {
    expect(content).toContain('credit="3"');
    expect(content).toContain('credit="8"');
    expect(content).toContain('credit="10"');
  });
});

// ══════════════════════════════════════
// 7. compose-shell 통합
// ══════════════════════════════════════

describe("compose-shell 통합", () => {
  let content: string;

  it("파일 로드", async () => {
    const fs = await import("fs");
    const path = await import("path");
    content = fs.readFileSync(
      path.resolve(__dirname, "../../components/compose/compose-shell.tsx"),
      "utf-8",
    );
    expect(content).toBeTruthy();
  });

  it("새 컴포넌트 import", () => {
    expect(content).toContain("QuickActions");
    expect(content).toContain("DraftGeneratorDialog");
    expect(content).toContain("BlockContextMenu");
  });

  it("3개 새 state", () => {
    expect(content).toContain("commandPaletteOpen");
    expect(content).toContain("bulkGenerateOpen");
    expect(content).toContain("contextMenu");
  });

  it("Ctrl+K 핸들러가 input 가드 바깥에 있음", () => {
    // Ctrl+K는 tagName 체크 전에 나와야 함
    const ctrlKIdx = content.indexOf('event.key === "k"');
    const tagNameIdx = content.indexOf('element.tagName === "INPUT"');
    expect(ctrlKIdx).toBeGreaterThan(0);
    expect(tagNameIdx).toBeGreaterThan(0);
    expect(ctrlKIdx).toBeLessThan(tagNameIdx);
  });

  it("handleFillEmpty 핸들러", () => {
    expect(content).toContain("handleFillEmpty");
  });

  it("handleAddVariation 핸들러", () => {
    expect(content).toContain("handleAddVariation");
  });

  it("handleDuplicateBlock 핸들러", () => {
    expect(content).toContain("handleDuplicateBlock");
  });

  it("handleMoveBlock 핸들러", () => {
    expect(content).toContain("handleMoveBlock");
  });

  it("handleBulkDraftComplete 핸들러", () => {
    expect(content).toContain("handleBulkDraftComplete");
  });

  it("handleContextMenu 핸들러", () => {
    expect(content).toContain("handleContextMenu");
  });

  it("기존 기능 보존 — DnD", () => {
    expect(content).toContain("DndContext");
    expect(content).toContain("handleDragEnd");
    expect(content).toContain("handleDragStart");
  });

  it("기존 기능 보존 — Undo/Redo", () => {
    expect(content).toContain("handleUndo");
    expect(content).toContain("handleRedo");
    expect(content).toContain("undoStack");
    expect(content).toContain("redoStack");
  });

  it("기존 기능 보존 — 자동저장", () => {
    expect(content).toContain("autoSaveTimer");
    expect(content).toContain("30_000");
  });

  it("onContextMenu를 BlockCanvas에 전달", () => {
    expect(content).toContain("onContextMenu={handleContextMenu}");
  });

  it("onQuickActions를 ComposeToolbar에 전달", () => {
    expect(content).toContain("onQuickActions");
  });
});

// ══════════════════════════════════════
// 8. block-canvas onContextMenu
// ══════════════════════════════════════

describe("block-canvas onContextMenu 통합", () => {
  let content: string;

  it("파일 로드", async () => {
    const fs = await import("fs");
    const path = await import("path");
    content = fs.readFileSync(
      path.resolve(__dirname, "../../components/compose/block-canvas.tsx"),
      "utf-8",
    );
    expect(content).toBeTruthy();
  });

  it("onContextMenu prop 정의 (BlockCanvasProps)", () => {
    expect(content).toContain("onContextMenu?: (e: React.MouseEvent, blockId: string, blockType: string) => void");
  });

  it("onContextMenu prop 정의 (SortableBlockProps)", () => {
    const matches = content.match(/onContextMenu\?/g);
    expect(matches).toBeTruthy();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  it("onContextMenu를 SortableBlock div에 연결", () => {
    expect(content).toContain("onContextMenu={(e)");
    expect(content).toContain("e.preventDefault()");
  });

  it("memo 비교에 onContextMenu 포함", () => {
    expect(content).toContain("prev.onContextMenu === next.onContextMenu");
  });
});

// ══════════════════════════════════════
// 9. compose-toolbar Ctrl+K 버튼
// ══════════════════════════════════════

describe("compose-toolbar 빠른 실행 버튼", () => {
  let content: string;

  it("파일 로드", async () => {
    const fs = await import("fs");
    const path = await import("path");
    content = fs.readFileSync(
      path.resolve(__dirname, "../../components/compose/compose-toolbar.tsx"),
      "utf-8",
    );
    expect(content).toBeTruthy();
  });

  it("onQuickActions prop", () => {
    expect(content).toContain("onQuickActions");
  });

  it("빠른 실행 버튼 라벨", () => {
    expect(content).toContain("빠른 실행");
  });

  it("Ctrl+K 단축키 힌트", () => {
    expect(content).toContain("⌘K");
  });

  it("Search 아이콘 import", () => {
    expect(content).toContain("Search");
  });
});
