/** 앱 전역 공유 상수 — 라벨 맵, 설정값 등 */

import type { BlockType } from "@/types/blocks";

/** 플로우 에디터 노드 타입 */
export type FlowNodeType = "prompt" | "generate-images" | "bgm" | "cuts" | "render" | "export" | "upload-image" | "remove-bg" | "model-compose";

/** 모드별 허용 노드 + 초기 파이프라인 설정 */
export interface ModeNodeConfig {
  allowedNodes: FlowNodeType[];
  initialPipeline: FlowNodeType[];
}

/** 모드→노드 매핑 */
export const MODE_NODE_CONFIG: Record<string, ModeNodeConfig> = {
  "shortform-video": {
    allowedNodes: ["prompt", "generate-images", "bgm", "cuts", "render", "export"],
    initialPipeline: ["prompt", "generate-images", "bgm", "cuts", "render", "export"],
  },
  "brand-image": {
    allowedNodes: ["prompt", "generate-images", "export"],
    initialPipeline: ["prompt", "generate-images", "export"],
  },
  cutout: {
    allowedNodes: ["upload-image", "remove-bg", "export"],
    initialPipeline: ["upload-image", "remove-bg", "export"],
  },
  "model-shot": {
    allowedNodes: ["upload-image", "prompt", "model-compose", "export"],
    initialPipeline: ["upload-image", "prompt", "model-compose", "export"],
  },
  "gif-source": {
    allowedNodes: ["prompt", "generate-images", "render", "export"],
    initialPipeline: ["prompt", "generate-images", "render", "export"],
  },
  freeform: {
    allowedNodes: ["prompt", "generate-images", "bgm", "cuts", "render", "export"],
    initialPipeline: ["prompt", "generate-images", "render", "export"],
  },
};

export const DEFAULT_MODE_CONFIG: ModeNodeConfig = MODE_NODE_CONFIG["freeform"];

/** 노드 타입 → 한글 라벨 */
export const NODE_TYPE_LABELS: Record<FlowNodeType, string> = {
  prompt: "내용 입력",
  "generate-images": "이미지 생성",
  bgm: "배경음악",
  cuts: "장면 편집",
  render: "영상/GIF 만들기",
  export: "내보내기",
  "upload-image": "이미지 업로드",
  "remove-bg": "배경 제거",
  "model-compose": "모델 합성",
};

/** 노드 타입 → 설명 */
export const NODE_TYPE_DESCS: Record<FlowNodeType, string> = {
  prompt: "만들고 싶은 내용을 입력해주세요",
  "generate-images": "입력한 내용으로 이미지를 만들어요",
  bgm: "영상에 어울리는 배경음악을 설정해요",
  cuts: "장면 순서와 전환 효과를 편집해요",
  render: "영상이나 GIF로 합성해요",
  export: "완성된 파일을 내보내요",
  "upload-image": "사용할 상품 이미지를 올려주세요",
  "remove-bg": "이미지 배경을 자동으로 제거해요",
  "model-compose": "AI가 모델 착용 이미지를 합성해요",
};

/** 프로젝트 모드 → 한글 라벨 */
export const MODE_LABELS: Record<string, string> = {
  compose: "상세페이지",
  "shortform-video": "숏폼 영상",
  "model-shot": "모델 촬영",
  cutout: "누끼",
  "brand-image": "브랜드 이미지",
  "gif-source": "GIF",
  freeform: "자유 형식",
};

/** 상품 카테고리 → 라벨 (F1: 카테고리별 프롬프트) */
export const PRODUCT_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "fashion", label: "패션/의류" },
  { value: "beauty", label: "뷰티/스킨케어" },
  { value: "food", label: "식품/음료" },
  { value: "baby", label: "유아/아동" },
  { value: "electronics", label: "전자/가전" },
  { value: "home", label: "홈/리빙" },
];

/** 플랫폼 프리셋 (E1: 추가 플랫폼) */
export const PLATFORM_PRESETS: Array<{ value: string; label: string; width: number }> = [
  { value: "coupang", label: "쿠팡", width: 780 },
  { value: "naver", label: "네이버", width: 860 },
  { value: "11st", label: "11번가", width: 800 },
  { value: "gmarket", label: "G마켓", width: 860 },
  { value: "ssg", label: "SSG", width: 750 },
  { value: "own", label: "자사몰 (커스텀)", width: 900 },
];

/** 플랫폼 이름 → 너비 매핑 */
export const PLATFORM_WIDTHS: Record<string, number> = Object.fromEntries(
  PLATFORM_PRESETS.map((p) => [p.value, p.width]),
);

/** 테마 프리셋 (A1: 글로벌 컬러 팔레트) */
export const THEME_PRESETS: Array<{ name: string; label: string; palette: import("@/types/blocks").ThemePalette }> = [
  { name: "default", label: "기본", palette: { primary: "#4f46e5", secondary: "#6366f1", background: "#ffffff", text: "#111827", accent: "#f59e0b" } },
  { name: "warm", label: "따뜻한", palette: { primary: "#dc2626", secondary: "#f97316", background: "#fffbeb", text: "#1c1917", accent: "#eab308" } },
  { name: "cool", label: "시원한", palette: { primary: "#0284c7", secondary: "#06b6d4", background: "#f0f9ff", text: "#0c4a6e", accent: "#8b5cf6" } },
  { name: "nature", label: "자연", palette: { primary: "#16a34a", secondary: "#65a30d", background: "#f7fee7", text: "#14532d", accent: "#ca8a04" } },
  { name: "luxury", label: "럭셔리", palette: { primary: "#1f2937", secondary: "#6b7280", background: "#fafafa", text: "#111827", accent: "#d97706" } },
  { name: "pastel", label: "파스텔", palette: { primary: "#ec4899", secondary: "#a78bfa", background: "#fdf2f8", text: "#4a044e", accent: "#60a5fa" } },
  { name: "mono", label: "모노톤", palette: { primary: "#374151", secondary: "#6b7280", background: "#ffffff", text: "#111827", accent: "#374151" } },
];

/** 카테고리별 설득 구조 블록 시퀀스 (심리학 기반 AIDA 매핑) */
export const PERSUASION_SEQUENCES: Record<string, BlockType[]> = {
  fashion: ["hero", "banner-strip", "selling-point", "image-grid", "comparison", "usage-steps", "review", "spec-table", "faq", "notice", "cta"],
  beauty: ["hero", "trust-badge", "selling-point", "usage-steps", "image-text", "spec-table", "review", "faq", "notice", "cta"],
  electronics: ["hero", "spec-table", "comparison", "selling-point", "image-grid", "review", "faq", "notice", "cta"],
  food: ["hero", "trust-badge", "image-full", "selling-point", "usage-steps", "spec-table", "review", "faq", "notice", "cta"],
  baby: ["hero", "trust-badge", "selling-point", "image-text", "usage-steps", "spec-table", "review", "faq", "notice", "cta"],
  home: ["hero", "image-full", "selling-point", "comparison", "spec-table", "review", "faq", "notice", "cta"],
  default: ["hero", "selling-point", "image-text", "image-full", "spec-table", "review", "faq", "notice", "cta"],
};

/** 설득 프레임워크 — 블록 배치 순서 정의 */
export type PersuasionFramework = "aida" | "pas-korean" | "pastor";

export const PERSUASION_FRAMEWORKS: Array<{
  value: PersuasionFramework;
  label: string;
  desc: string;
  sequence: BlockType[];
}> = [
  {
    value: "aida",
    label: "AIDA",
    desc: "주의→관심→욕구→행동 (기본)",
    sequence: ["hero", "selling-point", "image-text", "image-full", "spec-table", "review", "cta"],
  },
  {
    value: "pas-korean",
    label: "한국형 PAS",
    desc: "문제인식→공감→솔루션→라이프스타일→디테일→리뷰→행동",
    sequence: ["hero", "text-block", "selling-point", "image-full", "spec-table", "review", "cta"],
  },
  {
    value: "pastor",
    label: "PASTOR",
    desc: "문제→강화→솔루션→증거→추천→행동",
    sequence: ["hero", "text-block", "selling-point", "comparison", "review", "cta"],
  },
];

/** 감성 훅 문구 라이브러리 — 카테고리 × 스타일 프리셋 */
export type HookStyle = "empathy" | "shock" | "question" | "story";

export const HOOK_STYLES: Array<{ value: HookStyle; label: string }> = [
  { value: "empathy", label: "공감형" },
  { value: "shock", label: "충격형" },
  { value: "question", label: "질문형" },
  { value: "story", label: "스토리형" },
];

export const HOOK_LIBRARY: Record<string, Record<HookStyle, string>> = {
  fashion: {
    empathy: "매일 뭐 입을지 고민하는 당신을 위해",
    shock: "이 퀄리티에 이 가격, 실화입니다",
    question: "올 시즌, 당신의 스타일은 준비되셨나요?",
    story: "하나의 옷이 하루를 바꾸는 순간",
  },
  beauty: {
    empathy: "피부 고민 많은 당신, 이제 걱정 마세요",
    shock: "단 7일 만에 달라진 피부결",
    question: "피부 고민, 언제까지 참으실 건가요?",
    story: "자신감을 되찾은 그녀의 뷰티 루틴",
  },
  food: {
    empathy: "바쁜 하루, 제대로 된 한 끼가 그리울 때",
    shock: "이 맛을 이 가격에? 지금이 기회입니다",
    question: "오늘 저녁, 뭐 먹을지 고민이세요?",
    story: "엄마의 식탁에서 시작된 이야기",
  },
  baby: {
    empathy: "우리 아이에게 가장 좋은 것만 주고 싶은 마음",
    shock: "유해 성분 0%, 안심할 수 있는 선택",
    question: "아이에게 정말 안전한 제품인가요?",
    story: "두 아이 엄마가 직접 골랐습니다",
  },
  electronics: {
    empathy: "기술이 일상을 편하게 만들어 줍니다",
    shock: "이 스펙에 이 가격, 실화입니다",
    question: "아직도 불편한 제품을 쓰고 계신가요?",
    story: "개발자가 직접 만든, 진짜 쓸모있는 제품",
  },
  home: {
    empathy: "집에서 보내는 시간이 더 특별해지도록",
    shock: "공간이 달라지면 삶이 달라집니다",
    question: "우리 집, 이대로 괜찮을까요?",
    story: "작은 변화로 시작된 인테리어 이야기",
  },
};

/** 톤 프리셋 (제로 프롬프트 브리프 빌더용) */
export const TONE_PRESETS: Array<{ value: string; label: string; desc: string }> = [
  { value: "professional", label: "전문적", desc: "신뢰감 있고 정보가 풍부한 톤" },
  { value: "friendly", label: "친근한", desc: "편안하고 다가가기 쉬운 톤" },
  { value: "luxury", label: "럭셔리", desc: "고급스럽고 세련된 톤" },
  { value: "playful", label: "발랄한", desc: "활기차고 재미있는 톤" },
];

/** 타겟 오디언스 프리셋 (제로 프롬프트 브리프 빌더용) */
export const TARGET_AUDIENCE: Array<{ value: string; label: string }> = [
  { value: "20s-female", label: "20대 여성" },
  { value: "30s-female", label: "30대 여성" },
  { value: "20s-male", label: "20대 남성" },
  { value: "30s-male", label: "30대 남성" },
  { value: "parents", label: "부모/양육자" },
  { value: "all", label: "전연령" },
];

/** 글꼴 프리셋 (15종 한국어 웹폰트) */
export interface FontPreset {
  value: string;
  label: string;
  family: string;
  category: "gothic" | "serif" | "display";
}

export const FONT_PRESETS: FontPreset[] = [
  { value: "default", label: "기본 (시스템)", family: "sans-serif", category: "gothic" },
  { value: "noto-sans", label: "Noto Sans KR", family: "var(--font-sans)", category: "gothic" },
  { value: "pretendard", label: "Pretendard", family: "'Pretendard'", category: "gothic" },
  { value: "nanum-gothic", label: "나눔고딕", family: "'Nanum Gothic'", category: "gothic" },
  { value: "spoqa-han-sans", label: "스포카 한 산스", family: "'Spoqa Han Sans Neo'", category: "gothic" },
  { value: "wanted-sans", label: "Wanted Sans", family: "'Wanted Sans'", category: "gothic" },
  { value: "suit", label: "SUIT", family: "'SUIT'", category: "gothic" },
  { value: "gmarket-sans", label: "G마켓 산스", family: "'GmarketSans'", category: "gothic" },
  { value: "noto-serif", label: "Noto Serif KR", family: "var(--font-serif)", category: "serif" },
  { value: "nanum-myeongjo", label: "나눔명조", family: "'Nanum Myeongjo'", category: "serif" },
  { value: "gowun-batang", label: "고운바탕", family: "'Gowun Batang'", category: "serif" },
  { value: "ibm-plex-serif", label: "IBM Plex Sans KR", family: "'IBM Plex Sans KR'", category: "serif" },
  { value: "black-han-sans", label: "블랙한산스", family: "'Black Han Sans'", category: "display" },
  { value: "jua", label: "주아", family: "'Jua'", category: "display" },
  { value: "do-hyeon", label: "도현", family: "'Do Hyeon'", category: "display" },
];

/** 글꼴 value → CSS font-family 매핑 */
export function getFontFamily(value?: string): string | undefined {
  if (!value || value === "default") return undefined;
  const preset = FONT_PRESETS.find((f) => f.value === value);
  return preset ? `${preset.family}, sans-serif` : undefined;
}

export const LAZY_FONT_STYLESHEETS = [
  "https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&family=Nanum+Myeongjo:wght@400;700&family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;700&family=Black+Han+Sans&family=Jua&family=Do+Hyeon&display=swap",
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css",
  "https://cdn.jsdelivr.net/gh/spoqa/spoqa-han-sans@latest/css/SpoqaHanSansNeo.css",
  "https://cdn.jsdelivr.net/gh/sun-typeface/SUIT/fonts/variable/woff2/SUIT-Variable.css",
  "https://cdn.jsdelivr.net/gh/niceplugin/WantedSans/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.min.css",
  "https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSans.css",
] as const;

/** 블록 타입 → 한글 라벨 */
export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  hero: "메인 배너",
  "selling-point": "핵심 장점",
  "image-full": "전체 이미지",
  "image-grid": "이미지 모음",
  "text-block": "텍스트",
  "image-text": "이미지+텍스트",
  "spec-table": "제품 사양표",
  comparison: "비교",
  review: "리뷰",
  divider: "구분선",
  video: "영상",
  cta: "구매 유도",
  "usage-steps": "사용 방법",
  faq: "FAQ",
  notice: "공지/안내",
  "banner-strip": "띠배너",
  "price-promo": "가격/프로모션",
  "trust-badge": "인증/뱃지",
};
