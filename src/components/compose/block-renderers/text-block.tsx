/** 텍스트 블록 — 제목 + 본문 (EditableText + fontFamily) */
"use client";

import type { TextBlockBlock } from "@/types/blocks";
import { getFontFamily } from "@/lib/constants";
import { WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";
import { EditableText } from "../shared";
import { AiDropField } from "../shared/ai-drop-field";

interface Props {
  block: TextBlockBlock;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<TextBlockBlock>) => void;
  readOnly?: boolean;
}

const FONT_SIZE_CLASS: Record<string, string> = {
  sm: "text-xs",
  base: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

export function TextBlockRenderer({ block, selected, onSelect, onUpdate, readOnly }: Props) {
  const bodySizeClass = FONT_SIZE_CLASS[block.fontSize ?? "base"];
  const fontStyle = getFontFamily(block.fontFamily);

  return (
    <div
      className={`w-full rounded-[28px] border p-6 transition-colors ${
        selected
          ? "border-[rgb(236_197_183_/_0.95)] bg-[rgb(255_249_245_/_0.96)] shadow-[0_16px_36px_rgba(217,124,103,0.12)]"
          : `${WORKSPACE_SURFACE.panel} hover:border-[rgb(215_201_188_/_0.94)]`
      }`}
      onClick={onSelect}
      style={{ textAlign: block.align, fontFamily: fontStyle }}
    >
      <AiDropField blockId={block.id} fieldName="heading" acceptTypes={["text"]}
        onApply={(v) => onUpdate({ heading: v })}>
        <EditableText
          value={block.heading}
          placeholder="제목을 입력하세요"
          onChange={(v) => onUpdate({ heading: v })}
          className={`mb-3 text-xl font-bold ${WORKSPACE_TEXT.title}`}
          tag="h2"
          readOnly={readOnly}
        />
      </AiDropField>
      <AiDropField blockId={block.id} fieldName="body" acceptTypes={["text"]}
        onApply={(v) => onUpdate({ body: v })}>
        <EditableText
          value={block.body}
          placeholder="본문을 입력하세요"
          onChange={(v) => onUpdate({ body: v })}
          className={`whitespace-pre-wrap ${bodySizeClass} leading-relaxed ${WORKSPACE_TEXT.body}`}
          tag="p"
          readOnly={readOnly}
        />
      </AiDropField>
    </div>
  );
}
