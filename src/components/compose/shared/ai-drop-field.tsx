/** AiDropField — EditableText/ImageUploadZone 래퍼로 AI 결과 드롭 가능하게 만드는 컴포넌트 */
"use client";

import { type ReactNode } from "react";
import { useDroppable, useDndContext } from "@dnd-kit/core";

interface AiDropFieldProps {
  blockId: string;
  fieldName: string;
  acceptTypes: ("text" | "image")[];
  onApply: (value: string) => void;
  children: ReactNode;
}

export function AiDropField({ blockId, fieldName, acceptTypes, onApply, children }: AiDropFieldProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${blockId}-field-${fieldName}`,
    data: { type: "ai-field-drop", blockId, fieldName, acceptTypes },
  });

  const { active } = useDndContext();
  const activeData = active?.data.current;
  const isAiDrag = activeData?.type === "ai-result";
  const isCompatible = isAiDrag && acceptTypes.includes(activeData.resultType as "text" | "image");

  return (
    <div
      ref={setNodeRef}
      className={[
        "relative transition-all rounded-lg",
        isAiDrag && isCompatible && !isOver && "ring-2 ring-blue-400 ring-dashed",
        isAiDrag && !isCompatible && "opacity-40",
        isOver && isCompatible && "ring-2 ring-blue-500 bg-blue-50/30",
      ].filter(Boolean).join(" ")}
    >
      {children}
      {isOver && isCompatible && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-blue-100/50">
          <span className="text-xs font-medium text-blue-600">여기에 놓기</span>
        </div>
      )}
    </div>
  );
}
