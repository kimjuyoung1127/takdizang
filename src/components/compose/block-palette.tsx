/** 블록 팔레트 — 18종 블록 카드, 클릭 또는 드래그로 캔버스에 추가 */
"use client";

import {
  ImageIcon,
  Grid,
  Type,
  Columns,
  Table,
  GitCompare,
  MessageSquare,
  Minus,
  Video,
  MousePointerClick,
  Star,
  Crown,
  ListOrdered,
  CircleQuestionMark,
  CircleAlert,
  Ribbon,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import type { Block, BlockType } from "@/types/blocks";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

interface BlockPaletteProps {
  onAddBlock: (block: Block) => void;
  onPreviewBlock?: (block: Block) => void;
}

interface BlockTemplate {
  type: BlockType;
  label: string;
  desc: string;
  icon: React.ElementType;
  create: () => Block;
}

let paletteIdCounter = 0;
function nextId() {
  return `blk-${Date.now()}-${++paletteIdCounter}`;
}

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  {
    type: "hero",
    label: "메인 배너",
    desc: "상단에 크게 보여줄 대표 이미지예요",
    icon: Crown,
    create: () => ({
      id: nextId(),
      type: "hero",
      visible: true,
      imageUrl: "",
      overlays: [{ id: `ovl-${Date.now()}`, text: "메인 타이틀", x: 50, y: 50, fontSize: 32, color: "#ffffff", fontWeight: "bold", textAlign: "center" }],
    }),
  },
  {
    type: "selling-point",
    label: "핵심 장점",
    desc: "제품의 장점을 카드로 한눈에 보여줘요",
    icon: Star,
    create: () => ({
      id: nextId(),
      type: "selling-point",
      visible: true,
      items: [
        { icon: "star", title: "핵심 포인트", description: "설명을 입력하세요" },
      ],
    }),
  },
  {
    type: "image-full",
    label: "전체 이미지",
    desc: "화면 가득 채우는 이미지 한 장",
    icon: ImageIcon,
    create: () => ({
      id: nextId(),
      type: "image-full",
      visible: true,
      imageUrl: "",
      overlays: [],
    }),
  },
  {
    type: "image-grid",
    label: "이미지 모음",
    desc: "여러 장의 이미지를 격자로 보여줘요",
    icon: Grid,
    create: () => ({
      id: nextId(),
      type: "image-grid",
      visible: true,
      images: [],
      columns: 2,
    }),
  },
  {
    type: "text-block",
    label: "텍스트",
    desc: "제목과 본문 텍스트",
    icon: Type,
    create: () => ({
      id: nextId(),
      type: "text-block",
      visible: true,
      heading: "제목",
      body: "본문 내용을 입력하세요.",
      align: "left",
      fontSize: "base",
    }),
  },
  {
    type: "image-text",
    label: "이미지+텍스트",
    desc: "이미지 옆에 설명을 함께 넣어요",
    icon: Columns,
    create: () => ({
      id: nextId(),
      type: "image-text",
      visible: true,
      imageUrl: "",
      imagePosition: "left",
      heading: "제목",
      body: "설명을 입력하세요.",
    }),
  },
  {
    type: "spec-table",
    label: "제품 사양표",
    desc: "제품 스펙을 깔끔한 표로 정리해요",
    icon: Table,
    create: () => ({
      id: nextId(),
      type: "spec-table",
      visible: true,
      title: "제품 사양",
      rows: [{ label: "항목", value: "값" }],
    }),
  },
  {
    type: "comparison",
    label: "비교",
    desc: "Before / After를 나란히 비교해요",
    icon: GitCompare,
    create: () => ({
      id: nextId(),
      type: "comparison",
      visible: true,
      title: "Before & After",
      before: { label: "Before", imageUrl: "" },
      after: { label: "After", imageUrl: "" },
    }),
  },
  {
    type: "review",
    label: "리뷰",
    desc: "고객 후기를 카드로 보여줘요",
    icon: MessageSquare,
    create: () => ({
      id: nextId(),
      type: "review",
      visible: true,
      title: "고객 리뷰",
      reviews: [{ author: "고객", rating: 5, text: "만족합니다!" }],
      displayStyle: "card",
    }),
  },
  {
    type: "divider",
    label: "구분선",
    desc: "섹션 사이에 구분선을 넣어요",
    icon: Minus,
    create: () => ({
      id: nextId(),
      type: "divider",
      visible: true,
      style: "line",
      height: 32,
    }),
  },
  {
    type: "video",
    label: "영상",
    desc: "영상이나 GIF를 삽입해요",
    icon: Video,
    create: () => ({
      id: nextId(),
      type: "video",
      visible: true,
      videoUrl: "",
      posterUrl: "",
      mediaType: "mp4",
    }),
  },
  {
    type: "cta",
    label: "구매 유도",
    desc: "구매 버튼과 안내 문구를 넣어요",
    icon: MousePointerClick,
    create: () => ({
      id: nextId(),
      type: "cta",
      visible: true,
      text: "지금 구매하세요",
      subtext: "한정 특가 진행 중",
      buttonLabel: "구매하기",
      buttonUrl: "#",
      ctaStyle: "default",
    }),
  },
  {
    type: "usage-steps",
    label: "사용 방법",
    desc: "단계별로 사용법을 안내해요",
    icon: ListOrdered,
    create: () => ({
      id: nextId(),
      type: "usage-steps",
      visible: true,
      title: "사용 방법",
      steps: [
        { imageUrl: "", label: "STEP 1", description: "설명을 입력하세요" },
        { imageUrl: "", label: "STEP 2", description: "설명을 입력하세요" },
        { imageUrl: "", label: "STEP 3", description: "설명을 입력하세요" },
      ],
    }),
  },
  {
    type: "faq",
    label: "FAQ",
    desc: "자주 묻는 질문과 답변을 정리해요",
    icon: CircleQuestionMark,
    create: () => ({
      id: nextId(),
      type: "faq",
      visible: true,
      title: "자주 묻는 질문",
      items: [
        { question: "배송은 얼마나 걸리나요?", answer: "주문 후 1~3일 이내 출고됩니다." },
        { question: "교환/반품이 가능한가요?", answer: "수령 후 7일 이내 교환/반품 가능합니다." },
      ],
    }),
  },
  {
    type: "notice",
    label: "공지/안내",
    desc: "배송·교환·환불 등 안내사항을 넣어요",
    icon: CircleAlert,
    create: () => ({
      id: nextId(),
      type: "notice",
      visible: true,
      title: "안내 사항",
      items: [
        { icon: "truck", text: "무료배송 (도서산간 추가비용)" },
        { icon: "refresh", text: "수령 후 7일 이내 교환/반품 가능" },
        { icon: "shield", text: "정품 보증" },
      ],
    }),
  },
  {
    type: "banner-strip",
    label: "띠배너",
    desc: "화면 전체를 가로지르는 강조 배너예요",
    icon: Ribbon,
    create: () => ({
      id: nextId(),
      type: "banner-strip",
      visible: true,
      text: "무료배송 | 오늘만 특가",
      subtext: "",
      bgColor: "#4f46e5",
      textColor: "#ffffff",
    }),
  },
  {
    type: "price-promo",
    label: "가격/프로모션",
    desc: "할인 정보와 가격을 눈에 띄게 보여줘요",
    icon: Tag,
    create: () => ({
      id: nextId(),
      type: "price-promo",
      visible: true,
      productName: "상품명을 입력하세요",
      originalPrice: 39900,
      salePrice: 29900,
      badge: "한정특가",
      expiresLabel: "",
    }),
  },
  {
    type: "trust-badge",
    label: "인증/뱃지",
    desc: "인증 마크와 수상 이력을 보여줘요",
    icon: ShieldCheck,
    create: () => ({
      id: nextId(),
      type: "trust-badge",
      visible: true,
      title: "인증 및 수상",
      badges: [
        { icon: "check-circle", label: "KC 인증" },
        { icon: "shield", label: "안전 검증" },
        { icon: "award", label: "올해의 상품" },
      ],
    }),
  },
];

function DraggablePaletteItem({ tmpl, onAddBlock, onPreviewBlock }: { tmpl: BlockTemplate; onAddBlock: (block: Block) => void; onPreviewBlock?: (block: Block) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${tmpl.type}`,
    data: { type: "palette-item", blockType: tmpl.type, create: tmpl.create },
  });
  const Icon = tmpl.icon;

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => (onPreviewBlock ?? onAddBlock)(tmpl.create())}
      className={`takdi-panel-strong flex flex-col items-center gap-2 rounded-[1.25rem] p-3 text-center transition-all ${WORKSPACE_CONTROL.ghostButton} hover:-translate-y-0.5 hover:border-[rgb(241_200_190_/_0.92)] hover:bg-[rgb(248_231_226_/_0.9)] hover:text-[var(--takdi-accent-strong)] ${isDragging ? "opacity-40" : ""}`}
      title={tmpl.desc}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-[1rem] ${WORKSPACE_CONTROL.accentTint}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-[11px] font-semibold leading-tight">{tmpl.label}</span>
    </button>
  );
}

export function BlockPalette({ onAddBlock, onPreviewBlock }: BlockPaletteProps) {
  return (
    <div className="flex w-64 flex-col border-r border-[rgb(212_196_181_/_0.55)] bg-[rgb(239_231_220_/_0.62)] backdrop-blur-xl">
      <div className="border-b border-[rgb(214_199_184_/_0.62)] px-4 py-4">
        <p className="takdi-kicker">Block library</p>
        <h2 className={`mt-3 text-sm font-semibold tracking-[-0.03em] ${WORKSPACE_TEXT.title}`}>블록 선택</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {BLOCK_TEMPLATES.map((tmpl) => (
            <DraggablePaletteItem key={tmpl.type} tmpl={tmpl} onAddBlock={onAddBlock} onPreviewBlock={onPreviewBlock} />
          ))}
        </div>
      </div>
    </div>
  );
}
