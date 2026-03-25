/** 블록 우클릭 컨텍스트 메뉴 */
"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  CopyPlus,
  Eraser,
  ImagePlus,
  Pencil,
  RefreshCw,
  Trash2,
  UserRound,
  Wand2,
} from "lucide-react";
import { WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

export interface ContextMenuPosition {
  x: number;
  y: number;
  blockId: string;
  blockType: string;
}

interface BlockContextMenuProps {
  position: ContextMenuPosition | null;
  onClose: () => void;
  onBlockText: (blockId: string) => void;
  onTextRewrite: (blockId: string) => void;
  onImageGen: (blockId: string) => void;
  onSceneCompose: (blockId: string) => void;
  onModelCompose: (blockId: string) => void;
  onRemoveBg: (blockId: string) => void;
  onAddVariation: (blockId: string) => void;
  onDuplicate: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onMoveUp: (blockId: string) => void;
  onMoveDown: (blockId: string) => void;
}

const TEXT_BLOCK_TYPES = new Set([
  "text-block", "selling-point", "review", "faq", "banner-strip",
  "image-text", "spec-table", "cta", "usage-steps", "notice",
  "price-promo", "trust-badge", "comparison",
]);

const IMAGE_BLOCK_TYPES = new Set([
  "hero", "image-text", "image-grid", "comparison",
]);

function MenuDivider() {
  return <div className="my-1 h-px bg-[rgb(214_199_184_/_0.35)]" />;
}

function MenuItem({
  icon,
  label,
  shortcut,
  credit,
  destructive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  credit?: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[rgb(246_238_230_/_0.5)] ${
        destructive ? "text-red-500" : WORKSPACE_TEXT.body
      }`}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {credit && <span className={`text-[10px] ${WORKSPACE_TEXT.muted}`}>~{credit}</span>}
      {shortcut && <kbd className={`rounded border px-1 py-0.5 text-[9px] ${WORKSPACE_TEXT.muted}`}>{shortcut}</kbd>}
    </button>
  );
}

function MenuSectionLabel({ label }: { label: string }) {
  return (
    <div className={`px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider ${WORKSPACE_TEXT.muted}`}>
      {label}
    </div>
  );
}

export function BlockContextMenu({
  position,
  onClose,
  onBlockText,
  onTextRewrite,
  onImageGen,
  onSceneCompose,
  onModelCompose,
  onRemoveBg,
  onAddVariation,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: BlockContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!position) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [position, onClose]);

  // Adjust position to stay within viewport
  const adjustedPosition = useCallback(() => {
    if (!position) return { top: 0, left: 0 };
    const menuWidth = 220;
    const menuHeight = 400;
    const { x, y } = position;
    return {
      top: Math.min(y, window.innerHeight - menuHeight),
      left: Math.min(x, window.innerWidth - menuWidth),
    };
  }, [position]);

  if (!position) return null;

  const { blockId, blockType } = position;
  const isTextBlock = TEXT_BLOCK_TYPES.has(blockType);
  const isImageBlock = IMAGE_BLOCK_TYPES.has(blockType);
  const pos = adjustedPosition();

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 w-52 rounded-xl border border-[rgb(214_199_184_/_0.55)] ${WORKSPACE_SURFACE.panelStrong} py-1 shadow-xl`}
      style={{ top: pos.top, left: pos.left }}
    >
      {/* AI Section */}
      <MenuSectionLabel label="AI" />
      {isTextBlock && (
        <MenuItem
          icon={<Pencil className="h-3.5 w-3.5 text-blue-500" />}
          label="AI로 문구 만들기"
          credit="3"
          onClick={() => { onBlockText(blockId); onClose(); }}
        />
      )}
      {isTextBlock && (
        <MenuItem
          icon={<RefreshCw className="h-3.5 w-3.5 text-blue-500" />}
          label="다른 톤으로 다시 쓰기"
          credit="3"
          onClick={() => { onTextRewrite(blockId); onClose(); }}
        />
      )}
      {isImageBlock && (
        <MenuItem
          icon={<ImagePlus className="h-3.5 w-3.5 text-emerald-500" />}
          label="AI로 이미지 만들기"
          credit="10"
          onClick={() => { onImageGen(blockId); onClose(); }}
        />
      )}
      {isImageBlock && (
        <MenuItem
          icon={<Wand2 className="h-3.5 w-3.5 text-emerald-500" />}
          label="배경 바꾸기"
          credit="8"
          onClick={() => { onSceneCompose(blockId); onClose(); }}
        />
      )}
      {isImageBlock && (
        <MenuItem
          icon={<UserRound className="h-3.5 w-3.5 text-emerald-500" />}
          label="모델 착용 합성"
          credit="8"
          onClick={() => { onModelCompose(blockId); onClose(); }}
        />
      )}
      {isImageBlock && (
        <MenuItem
          icon={<Eraser className="h-3.5 w-3.5 text-emerald-500" />}
          label="배경 제거"
          credit="3"
          onClick={() => { onRemoveBg(blockId); onClose(); }}
        />
      )}

      <MenuDivider />

      {/* Edit Section */}
      <MenuSectionLabel label="편집" />
      <MenuItem
        icon={<CopyPlus className="h-3.5 w-3.5" />}
        label="비슷한 버전 만들기"
        credit="3"
        onClick={() => { onAddVariation(blockId); onClose(); }}
      />
      <MenuItem
        icon={<Copy className="h-3.5 w-3.5" />}
        label="복제"
        onClick={() => { onDuplicate(blockId); onClose(); }}
      />
      <MenuItem
        icon={<Trash2 className="h-3.5 w-3.5" />}
        label="삭제"
        destructive
        onClick={() => { onDelete(blockId); onClose(); }}
      />
      <MenuItem
        icon={<ArrowUp className="h-3.5 w-3.5" />}
        label="위로 이동"
        onClick={() => { onMoveUp(blockId); onClose(); }}
      />
      <MenuItem
        icon={<ArrowDown className="h-3.5 w-3.5" />}
        label="아래로 이동"
        onClick={() => { onMoveDown(blockId); onClose(); }}
      />

    </div>
  );
}
