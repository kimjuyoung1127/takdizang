/** CTA 블록 — EditableText + 스타일 프리셋 4종 */
"use client";

import type { CtaBlock } from "@/types/blocks";
import { WORKSPACE_SURFACE } from "@/lib/workspace-surface";
import { EditableText } from "../shared";
import { AiDropField } from "../shared/ai-drop-field";

interface Props {
  block: CtaBlock;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<CtaBlock>) => void;
  readOnly?: boolean;
}

const STYLE_CONFIG = {
  default: {
    bg: "bg-[linear-gradient(160deg,rgba(255,251,246,0.96),rgba(248,241,232,0.92))]",
    text: "text-[var(--takdi-text)]",
    sub: "text-[var(--takdi-text-muted)]",
    btn: "bg-[var(--takdi-accent)] text-white shadow-[0_18px_32px_rgba(217,124,103,0.2)]",
  },
  gradient: {
    bg: "bg-[linear-gradient(120deg,#d97c67,#c96d5c,#8d5c85)]",
    text: "text-white",
    sub: "text-white/80",
    btn: "bg-white text-[var(--takdi-accent-strong)]",
  },
  dark: {
    bg: "bg-[linear-gradient(135deg,#2b2420,#46362d)]",
    text: "text-white",
    sub: "text-white/70",
    btn: "border border-white/20 bg-[rgba(255,255,255,0.14)] text-white",
  },
  minimal: {
    bg: "bg-[rgb(248_241_232_/_0.72)]",
    text: "text-[var(--takdi-text)]",
    sub: "text-[var(--takdi-text-muted)]",
    btn: "border border-[rgb(214_199_184_/_0.82)] bg-[rgb(255_255_255_/_0.72)] text-[var(--takdi-text)]",
  },
};

export function CtaBlockRenderer({ block, selected, onSelect, onUpdate, readOnly }: Props) {
  const ctaStyle = block.ctaStyle ?? "default";
  const config = STYLE_CONFIG[ctaStyle];
  const customBg = block.bgColor ? { backgroundColor: block.bgColor } : undefined;
  const customBtnColor = block.buttonColor ? { backgroundColor: block.buttonColor } : undefined;

  return (
    <div
      className={`w-full overflow-hidden rounded-[28px] border transition-colors ${
        selected
          ? "border-[rgb(236_197_183_/_0.95)] shadow-[0_16px_36px_rgba(217,124,103,0.12)]"
          : `${WORKSPACE_SURFACE.panel} hover:border-[rgb(215_201_188_/_0.94)]`
      }`}
      onClick={onSelect}
    >
      <div className={`py-8 text-center ${customBg ? "" : config.bg}`} style={customBg}>
        <AiDropField blockId={block.id} fieldName="text" acceptTypes={["text"]}
          onApply={(v) => onUpdate({ text: v })}>
          <EditableText
            value={block.text}
            placeholder="지금 바로 시작하세요"
            onChange={(v) => onUpdate({ text: v })}
            className={`mb-2 text-xl font-bold ${config.text}`}
            tag="h3"
            readOnly={readOnly}
          />
        </AiDropField>
        <AiDropField blockId={block.id} fieldName="subtext" acceptTypes={["text"]}
          onApply={(v) => onUpdate({ subtext: v })}>
          <EditableText
            value={block.subtext}
            placeholder="보조 문구"
            onChange={(v) => onUpdate({ subtext: v })}
            className={`mb-4 text-sm ${config.sub}`}
            tag="p"
            readOnly={readOnly}
          />
        </AiDropField>
        <button
          type="button"
          className={`rounded-full px-8 py-3 text-sm font-semibold ${customBtnColor ? "" : config.btn}`}
          style={customBtnColor}
          onClick={(e) => e.stopPropagation()}
        >
          {readOnly ? (
            block.buttonLabel || "구매하기"
          ) : (
            <EditableText
              value={block.buttonLabel}
              placeholder="구매하기"
              onChange={(v) => onUpdate({ buttonLabel: v })}
              className="inline"
              tag="span"
            />
          )}
        </button>
      </div>
    </div>
  );
}
