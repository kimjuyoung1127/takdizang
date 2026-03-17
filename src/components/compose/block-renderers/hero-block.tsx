/** 히어로 블록 — 전체 이미지 + 텍스트 오버레이 드래그 위치 편집 */
"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import type { HeroBlock as HeroBlockType } from "@/types/blocks";
import { getFontFamily } from "@/lib/constants";
import { WORKSPACE_SURFACE } from "@/lib/workspace-surface";
import { ImageUploadZone, EditableText, buildFilterStyle } from "../shared";
import { AiDropField } from "../shared/ai-drop-field";

interface Props {
  block: HeroBlockType;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<HeroBlockType>) => void;
  readOnly?: boolean;
}

const BASE_WIDTH = 780; // reference width for fontSize scaling

export function HeroBlockRenderer({ block, selected, onSelect, onUpdate, readOnly }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontScale, setFontScale] = useState(1);

  // Responsive font scaling based on container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? BASE_WIDTH;
      setFontScale(Math.min(1, width / BASE_WIDTH));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const overlaysRef = useRef(block.overlays);
  overlaysRef.current = block.overlays;

  const handleOverlayDrag = useCallback(
    (e: React.MouseEvent, overlayId: string, overlayEl: HTMLDivElement) => {
      // Skip drag if clicking on editable text (allow text editing)
      const target = e.target as HTMLElement;
      if (target.isContentEditable || target.closest("[contenteditable]")) return;

      e.preventDefault();
      e.stopPropagation();
      const container = containerRef.current;
      if (!container || readOnly) return;

      const rect = container.getBoundingClientRect();
      const overlay = overlaysRef.current.find((o) => o.id === overlayId);
      if (!overlay) return;

      const overlayX = (overlay.x / 100) * rect.width;
      const overlayY = (overlay.y / 100) * rect.height;
      const offsetX = e.clientX - rect.left - overlayX;
      const offsetY = e.clientY - rect.top - overlayY;
      let lastX = overlay.x;
      let lastY = overlay.y;

      function onMouseMove(ev: MouseEvent) {
        const r = container!.getBoundingClientRect();
        lastX = Math.round(Math.max(0, Math.min(100, ((ev.clientX - r.left - offsetX) / r.width) * 100)));
        lastY = Math.round(Math.max(0, Math.min(100, ((ev.clientY - r.top - offsetY) / r.height) * 100)));
        // Direct DOM update for smooth visual feedback (commits on mouseup)
        overlayEl.style.left = `${lastX}%`;
        overlayEl.style.top = `${lastY}%`;
      }

      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.userSelect = "";
        // Single state update + single undo entry on drop
        onUpdate({
          overlays: overlaysRef.current.map((o) =>
            o.id === overlayId ? { ...o, x: lastX, y: lastY } : o,
          ),
        });
      }

      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [onUpdate, readOnly],
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full cursor-pointer overflow-hidden rounded-[28px] border transition-colors ${
        selected
          ? "border-[rgb(236_197_183_/_0.95)] shadow-[0_16px_36px_rgba(217,124,103,0.12)]"
          : `${WORKSPACE_SURFACE.panel} hover:border-[rgb(215_201_188_/_0.94)]`
      }`}
      onClick={onSelect}
      style={{ minHeight: 300 }}
    >
      {readOnly ? (
        block.imageUrl ? (
          <img src={block.imageUrl} alt="Hero" className="h-full w-full object-cover" style={{ minHeight: 300, filter: buildFilterStyle(block.imageFilters) }} />
        ) : (
          <div className="flex h-full min-h-[300px] items-center justify-center bg-[linear-gradient(140deg,rgba(248,231,226,0.95),rgba(239,229,243,0.88))] text-[var(--takdi-text-subtle)]">
            <p className="text-sm">히어로 이미지</p>
          </div>
        )
      ) : (
        <AiDropField blockId={block.id} fieldName="imageUrl" acceptTypes={["image"]}
          onApply={(url) => onUpdate({ imageUrl: url })}>
          <ImageUploadZone
            imageUrl={block.imageUrl}
            onImageChange={(url) => onUpdate({ imageUrl: url })}
            className="min-h-[300px]"
            placeholderText="히어로 이미지를 업로드하세요"
            imageFilter={buildFilterStyle(block.imageFilters)}
          />
        </AiDropField>
      )}

      {/* Text overlays — draggable (click text to edit, drag non-text area to move) */}
      {block.overlays.map((overlay) => (
        <div
          key={overlay.id}
          className={`absolute ${readOnly ? "select-none" : "cursor-move select-none"} ${selected && !readOnly ? "rounded border border-dashed border-white/50 bg-black/10 px-1 hover:border-white/80" : ""}`}
          style={{
            left: `${overlay.x}%`,
            top: `${overlay.y}%`,
            transform: "translate(-50%, -50%)",
            fontSize: Math.round(overlay.fontSize * fontScale),
            color: overlay.color,
            fontWeight: overlay.fontWeight,
            fontFamily: getFontFamily(overlay.fontFamily),
            textAlign: overlay.textAlign,
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            maxWidth: "80%",
          }}
          onMouseDown={!readOnly ? (e) => handleOverlayDrag(e, overlay.id, e.currentTarget as HTMLDivElement) : undefined}
        >
          <EditableText
            value={overlay.text}
            placeholder="텍스트 입력"
            onChange={(newText) => {
              onUpdate({
                overlays: block.overlays.map((o) =>
                  o.id === overlay.id ? { ...o, text: newText } : o,
                ),
              });
            }}
            tag="span"
            readOnly={readOnly}
          />
        </div>
      ))}
    </div>
  );
}
