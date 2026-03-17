/** 이미지+텍스트 블록 — ImageUploadZone + EditableText + fontFamily */
"use client";

import type { ImageTextBlock as ImageTextBlockType } from "@/types/blocks";
import { getFontFamily } from "@/lib/constants";
import { WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";
import { ImageUploadZone, EditableText, buildFilterStyle } from "../shared";
import { AiDropField } from "../shared/ai-drop-field";

interface Props {
  block: ImageTextBlockType;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<ImageTextBlockType>) => void;
  readOnly?: boolean;
}

export function ImageTextBlockRenderer({ block, selected, onSelect, onUpdate, readOnly }: Props) {
  const imgSide = readOnly ? (
    <div className={`flex aspect-square w-1/2 items-center justify-center overflow-hidden rounded-[24px] bg-[rgb(248_241_232_/_0.72)]`}>
      {block.imageUrl ? (
        <img src={block.imageUrl} alt="" className="h-full w-full object-cover" style={buildFilterStyle(block.imageFilters) ? { filter: buildFilterStyle(block.imageFilters) } : undefined} />
      ) : (
        <div className={`text-center ${WORKSPACE_TEXT.muted}`}>
          <p className="text-xs">이미지</p>
        </div>
      )}
    </div>
  ) : (
    <div className="w-1/2">
      <AiDropField blockId={block.id} fieldName="imageUrl" acceptTypes={["image"]}
        onApply={(url) => onUpdate({ imageUrl: url })}>
        <div className="overflow-hidden rounded-[24px]">
          <ImageUploadZone
            imageUrl={block.imageUrl}
            onImageChange={(url) => onUpdate({ imageUrl: url })}
            className="aspect-square"
            placeholderText="이미지 업로드"
            imageFilter={buildFilterStyle(block.imageFilters)}
          />
        </div>
      </AiDropField>
    </div>
  );

  const fontStyle = getFontFamily(block.fontFamily);

  const textSide = (
    <div className="flex w-1/2 flex-col justify-center p-4" style={{ fontFamily: fontStyle }}>
      <AiDropField blockId={block.id} fieldName="heading" acceptTypes={["text"]}
        onApply={(v) => onUpdate({ heading: v })}>
        <EditableText
          value={block.heading}
          placeholder="제목을 입력하세요"
          onChange={(v) => onUpdate({ heading: v })}
          className={`mb-2 text-lg font-bold ${WORKSPACE_TEXT.title}`}
          tag="h3"
          readOnly={readOnly}
        />
      </AiDropField>
      <AiDropField blockId={block.id} fieldName="body" acceptTypes={["text"]}
        onApply={(v) => onUpdate({ body: v })}>
        <EditableText
          value={block.body}
          placeholder="설명을 입력하세요"
          onChange={(v) => onUpdate({ body: v })}
          className={`text-sm leading-relaxed ${WORKSPACE_TEXT.body}`}
          tag="p"
          readOnly={readOnly}
        />
      </AiDropField>
    </div>
  );

  return (
    <div
      className={`flex w-full gap-4 rounded-[28px] border p-4 transition-colors ${
        selected
          ? "border-[rgb(236_197_183_/_0.95)] bg-[rgb(255_249_245_/_0.96)] shadow-[0_16px_36px_rgba(217,124,103,0.12)]"
          : `${WORKSPACE_SURFACE.panel} hover:border-[rgb(215_201_188_/_0.94)]`
      }`}
      onClick={onSelect}
    >
      {block.imagePosition === "left" ? (
        <>
          {imgSide}
          {textSide}
        </>
      ) : (
        <>
          {textSide}
          {imgSide}
        </>
      )}
    </div>
  );
}
