"use client";

import { type CSSProperties, forwardRef, memo, useCallback, useEffect, useMemo, useRef } from "react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { EyeOff, GripVertical, Plus, X } from "lucide-react";
import type { Block } from "@/types/blocks";
import {
  autoFixBlock,
  getBlockViolations,
  type GuardrailViolation,
  validateBlocks,
} from "@/lib/design-guardrails";
import { useCompose } from "./compose-context";
import { BlockDispatch } from "./block-dispatch";
import { BlockSurfaceFrame } from "./block-surface-frame";
import { GuardrailIndicator } from "./guardrail-indicator";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

interface BlockCanvasProps {
  blocks: Block[];
  selectedBlockId: string | null;
  platformWidth: number;
  mobilePreview?: boolean;
  exporting?: boolean;
  insertIndex?: number | null;
  onBlocksChange: (blocks: Block[]) => void;
  onSelectBlock: (id: string | null) => void;
  onInsertBlock: (index: number) => void;
  onUpdateBlock: (id: string, patch: Partial<Block>) => void;
  onContextMenu?: (e: React.MouseEvent, blockId: string, blockType: string) => void;
  pendingBlock?: { block: Block; insertAt: number } | null;
  onConfirmPlace?: () => void;
  onCancelPlace?: () => void;
}

interface SortableBlockProps {
  block: Block;
  selected: boolean;
  violations: GuardrailViolation[];
  onSelectBlock: (id: string | null) => void;
  onDeleteBlock: (id: string) => void;
  onUpdateBlock: (id: string, patch: Partial<Block>) => void;
  onAutoFixBlock: (blockId: string, violation: GuardrailViolation) => void;
  onContextMenu?: (e: React.MouseEvent, blockId: string, blockType: string) => void;
}

const EMPTY_VIOLATIONS: GuardrailViolation[] = [];

function SortableBlock({
  block,
  selected,
  violations,
  onSelectBlock,
  onDeleteBlock,
  onUpdateBlock,
  onAutoFixBlock,
  onContextMenu,
}: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: block.lockLayout,
  });

  const handleSelect = useCallback(() => {
    onSelectBlock(block.id);
  }, [block.id, onSelectBlock]);

  const handleDelete = useCallback(() => {
    onDeleteBlock(block.id);
  }, [block.id, onDeleteBlock]);

  const handleToggleVisibility = useCallback(() => {
    onUpdateBlock(block.id, { visible: !block.visible });
  }, [block.id, block.visible, onUpdateBlock]);

  const handleUpdate = useCallback(
    (patch: Partial<Block>) => {
      onUpdateBlock(block.id, patch);
    },
    [block.id, onUpdateBlock],
  );

  const handleAutoFix = useCallback(
    (violation: GuardrailViolation) => {
      onAutoFixBlock(block.id, violation);
    },
    [block.id, onAutoFixBlock],
  );

  const style = useMemo<CSSProperties>(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }),
    [isDragging, transform, transition],
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, block.id, block.type);
      }}
    >
      <div className="absolute -left-10 top-2 z-10 hidden flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
        <button
          {...attributes}
          {...listeners}
          type="button"
          className={`flex h-7 w-7 items-center justify-center rounded-xl ${WORKSPACE_SURFACE.panelStrong} ${
            block.lockLayout ? "cursor-not-allowed text-[rgb(201_192_182_/_0.9)]" : "cursor-grab text-[var(--takdi-text-subtle)] hover:text-[var(--takdi-text)]"
          }`}
          title={block.lockLayout ? "Locked block" : "Drag to reorder"}
          disabled={block.lockLayout}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleDelete();
          }}
          className={`flex h-7 w-7 items-center justify-center rounded-xl ${WORKSPACE_SURFACE.panelStrong} text-[var(--takdi-text-subtle)] hover:text-red-500`}
          title="Delete block"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleToggleVisibility();
          }}
          className={`flex h-7 w-7 items-center justify-center rounded-xl ${WORKSPACE_SURFACE.panelStrong} ${
            block.visible ? "text-[var(--takdi-text-subtle)] hover:text-[var(--takdi-text)]" : "text-amber-500"
          }`}
          title={block.visible ? "Hide block" : "Show block"}
        >
          <EyeOff className="h-4 w-4" />
        </button>
      </div>

      <div className={!block.visible ? "opacity-40" : ""}>
        <BlockDispatch block={block} selected={selected} onSelect={handleSelect} onUpdate={handleUpdate} />
      </div>

      <GuardrailIndicator violations={violations} onAutoFix={handleAutoFix} />
    </div>
  );
}

const MemoSortableBlock = memo(SortableBlock, (prev, next) => {
  return (
    prev.block === next.block &&
    prev.selected === next.selected &&
    prev.violations === next.violations &&
    prev.onSelectBlock === next.onSelectBlock &&
    prev.onDeleteBlock === next.onDeleteBlock &&
    prev.onUpdateBlock === next.onUpdateBlock &&
    prev.onAutoFixBlock === next.onAutoFixBlock &&
    prev.onContextMenu === next.onContextMenu
  );
});

function GhostBlock({ block, onConfirm, onCancel }: { block: Block; onConfirm?: () => void; onCancel?: () => void }) {
  return (
    <div className="relative rounded-[28px] border-2 border-dashed border-[var(--takdi-block-border-selected)] opacity-60">
      <BlockDispatch block={block} selected={false} onSelect={() => {}} onUpdate={() => {}} readOnly />
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-[var(--takdi-accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--takdi-accent-strong)] transition-colors"
        >
          배치
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[var(--takdi-inset-border)] bg-white px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </div>
  );
}

function InsertButton({ index, active, onClick }: { index: number; active: boolean; onClick: () => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: `drop-zone-${index}`, data: { type: "drop-zone", index } });

  if (active) {
    return (
      <div className="flex items-center justify-center py-2">
          <div className="flex w-full animate-pulse items-center justify-center rounded-2xl border-2 border-dashed border-[var(--takdi-block-border-selected)] bg-[var(--takdi-accent-tint-bg)]/70 py-3">
            <span className={`text-xs font-medium ${WORKSPACE_TEXT.accent}`}>블록을 여기에 넣습니다</span>
          </div>
      </div>
    );
  }

  return (
      <div ref={setNodeRef} className="group/insert flex items-center justify-center py-1">
        <div className={`w-full transition-all ${isOver ? "py-2" : ""}`}>
          {isOver ? (
          <div className="flex w-full items-center justify-center rounded-2xl border-2 border-dashed border-[var(--takdi-block-border-selected)] bg-[var(--takdi-accent-tint-bg)] py-3">
            <span className={`text-xs font-medium ${WORKSPACE_TEXT.accent}`}>여기에 블록을 놓으세요</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={onClick}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-[var(--takdi-inset-border)] text-[var(--takdi-text-subtle)] opacity-0 transition-opacity hover:border-[var(--takdi-accent)] hover:text-[var(--takdi-accent-strong)] group-hover/insert:opacity-100"
              title="블록 추가"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const BlockCanvas = forwardRef<HTMLDivElement, BlockCanvasProps>(function BlockCanvas(
  {
    blocks,
    selectedBlockId,
    platformWidth,
    mobilePreview,
    exporting,
    insertIndex,
    onBlocksChange,
    onSelectBlock,
    onInsertBlock,
    onUpdateBlock,
    onContextMenu,
    pendingBlock,
    onConfirmPlace,
    onCancelPlace,
  },
  ref,
) {
  const { theme } = useCompose();
  const blocksRef = useRef(blocks);
  const selectedBlockIdRef = useRef(selectedBlockId);
  useEffect(() => { blocksRef.current = blocks; });
  useEffect(() => { selectedBlockIdRef.current = selectedBlockId; });

  const violations = useMemo(() => validateBlocks(blocks), [blocks]);
  const violationsByBlockId = useMemo(() => {
    const map = new Map<string, GuardrailViolation[]>();

    for (const block of blocks) {
      const blockViolations = getBlockViolations(block.id, violations);
      map.set(block.id, blockViolations.length > 0 ? blockViolations : EMPTY_VIOLATIONS);
    }

    return map;
  }, [blocks, violations]);

  const canvasWidth = mobilePreview ? 375 : platformWidth;

  const handleAutoFix = useCallback(
    (blockId: string, violation: GuardrailViolation) => {
      const block = blocksRef.current.find((candidate) => candidate.id === blockId);
      if (!block) {
        return;
      }

      const fixedBlock = autoFixBlock(block, violation);
      if (fixedBlock !== block) {
        onUpdateBlock(blockId, fixedBlock);
      }
    },
    [onUpdateBlock],
  );

  const handleDelete = useCallback(
    (blockId: string) => {
      onBlocksChange(blocksRef.current.filter((block) => block.id !== blockId));
      if (selectedBlockIdRef.current === blockId) {
        onSelectBlock(null);
      }
    },
    [onBlocksChange, onSelectBlock],
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.36),transparent_22%),linear-gradient(180deg,rgba(244,238,230,0.88),rgba(239,231,220,0.76))] p-8" onClick={() => onSelectBlock(null)}>
      {mobilePreview ? (
        <div className={`mx-auto mb-2 text-center text-[10px] font-medium ${WORKSPACE_TEXT.muted}`}>Mobile preview (375px)</div>
      ) : null}

      <BlockSurfaceFrame
        ref={ref}
        platformWidth={platformWidth}
        mobilePreview={mobilePreview}
        theme={theme}
        onClick={(event) => event.stopPropagation()}
      >
        <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
          {!exporting ? <InsertButton index={0} active={insertIndex === 0} onClick={() => onInsertBlock(0)} /> : null}

          {blocks.map((block, index) => (
            <div key={block.id}>
              {pendingBlock && pendingBlock.insertAt === index && !exporting && (
                <GhostBlock block={pendingBlock.block} onConfirm={onConfirmPlace} onCancel={onCancelPlace} />
              )}

              {exporting ? (
                <div className={!block.visible ? "hidden" : ""} data-block-id={block.id} {...(!block.visible ? { "data-hidden": true } : {})}>
                  <BlockDispatch
                    block={block}
                    selected={false}
                    onSelect={() => {}}
                    onUpdate={(patch) => onUpdateBlock(block.id, patch)}
                    readOnly
                  />
                </div>
              ) : (
                <MemoSortableBlock
                  block={block}
                  selected={selectedBlockId === block.id}
                  violations={violationsByBlockId.get(block.id) ?? EMPTY_VIOLATIONS}
                  onSelectBlock={onSelectBlock}
                  onDeleteBlock={handleDelete}
                  onUpdateBlock={onUpdateBlock}
                  onAutoFixBlock={handleAutoFix}
                  onContextMenu={onContextMenu}
                />
              )}

              {!exporting ? (
                <InsertButton index={index + 1} active={insertIndex === index + 1} onClick={() => onInsertBlock(index + 1)} />
              ) : null}
            </div>
          ))}
        </SortableContext>

        {pendingBlock && pendingBlock.insertAt >= blocks.length && !exporting && (
          <GhostBlock block={pendingBlock.block} onConfirm={onConfirmPlace} onCancel={onCancelPlace} />
        )}

        {blocks.length === 0 && !pendingBlock ? (
          <div className={`flex h-64 items-center justify-center text-center ${WORKSPACE_TEXT.muted}`}>
            <div>
              <p className="mb-2 text-lg font-medium">아직 블록이 없습니다</p>
              <p className="text-sm">왼쪽 패널에서 블록을 추가하거나 캔버스로 끌어오세요.</p>
            </div>
          </div>
        ) : null}
      </BlockSurfaceFrame>
    </div>
  );
});
