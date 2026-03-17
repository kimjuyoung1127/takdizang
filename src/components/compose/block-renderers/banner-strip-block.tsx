/** 띠배너 블록 — 전체폭 배경색 + 텍스트 강조 */
"use client";

import type { BannerStripBlock } from "@/types/blocks";
import { WORKSPACE_SURFACE } from "@/lib/workspace-surface";
import { EditableText } from "../shared";
import { AiDropField } from "../shared/ai-drop-field";

interface Props {
  block: BannerStripBlock;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<BannerStripBlock>) => void;
  readOnly?: boolean;
}

export function BannerStripBlockRenderer({ block, selected, onSelect, onUpdate, readOnly }: Props) {
  const bgColor = block.bgColor || "#4f46e5";
  const textColor = block.textColor || "#ffffff";

  return (
    <div
      className={`w-full overflow-hidden rounded-[28px] border transition-colors ${
        selected
          ? "border-[rgb(236_197_183_/_0.95)] shadow-[0_16px_36px_rgba(217,124,103,0.12)]"
          : `${WORKSPACE_SURFACE.panel} hover:border-[rgb(215_201_188_/_0.94)]`
      }`}
      onClick={onSelect}
    >
      <div
        className="px-6 py-4 text-center"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <AiDropField blockId={block.id} fieldName="text" acceptTypes={["text"]}
          onApply={(v) => onUpdate({ text: v })}>
          <EditableText
            value={block.text}
            placeholder="무료배송 | 오늘만 특가"
            onChange={(v) => onUpdate({ text: v })}
            className="text-base font-bold"
            style={{ color: textColor }}
            tag="p"
            readOnly={readOnly}
          />
        </AiDropField>
        {(block.subtext || !readOnly) && (
          <AiDropField blockId={block.id} fieldName="subtext" acceptTypes={["text"]}
            onApply={(v) => onUpdate({ subtext: v })}>
            <EditableText
              value={block.subtext ?? ""}
              placeholder="보조 문구를 입력하세요"
              onChange={(v) => onUpdate({ subtext: v })}
              className="mt-1 text-xs opacity-80"
              style={{ color: textColor }}
              tag="p"
              readOnly={readOnly}
            />
          </AiDropField>
        )}
      </div>
    </div>
  );
}
