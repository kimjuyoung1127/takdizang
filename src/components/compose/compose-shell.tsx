/** Compose editor shell with DnD, autosave, templates, and guarded navigation. */
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  formatAppliedAutomaticFixes,
  formatComposeDocumentSaveFailed,
  formatDesignIssuesNeedAttention,
  formatFavoriteTemplateSaveFailed,
  formatTemplateApplied,
} from "@/i18n/format";
import { useT } from "@/i18n/use-t";
import type { Block, BlockDocument, ThemePalette } from "@/types/blocks";
import { saveBlocks, saveComposeTemplate } from "@/lib/api-client";
import { PLATFORM_WIDTHS, BLOCK_TYPE_LABELS } from "@/lib/constants";
import { BlockPalette } from "./block-palette";
import { BlockCanvas } from "./block-canvas";
import { RightPanel } from "./right-panel";
import { ComposeToolbar } from "./compose-toolbar";
import { ComposeProvider } from "./compose-context";
import { ExportDialog } from "./export-dialog";
import { BriefBuilder } from "./brief-builder";
import { LeaveComposeDialog } from "./leave-compose-dialog";
import { SaveTemplateDialog } from "./save-template-dialog";
import { validateBlocks, autoFixAllBlocks } from "@/lib/design-guardrails";
import { BLOCK_TEMPLATES } from "./block-palette";
import { AiToolDialog } from "./ai-tool-dialog";
import { AiGenerationPanel } from "./ai-generation-panel";
import { DraftGeneratorDialog } from "./draft-generator-dialog";
import { BlockContextMenu, type ContextMenuPosition } from "./block-context-menu";
import { generateBlockText } from "@/lib/api-client";
import { WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

const UNDO_COALESCE_MS = 400;

interface ComposeShellProps {
  projectId: string;
  projectName: string;
  initialDoc: BlockDocument;
  projectStatus?: string;
}

function formatSavedTime() {
  return new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function hashDoc(doc: BlockDocument) {
  return JSON.stringify(doc);
}

function extractAiFieldValue(
  data: Record<string, unknown>,
  fieldName: string,
  type: string,
): unknown {
  if (type === "text") {
    const mapping: Record<string, string> = {
      heading: "headline",
      body: "body",
      text: "text",
      subtext: "subtext",
      buttonLabel: "buttonLabel",
    };
    return data[mapping[fieldName] ?? fieldName];
  }
  if (type === "image") {
    return data.imageUrl ?? data.url;
  }
}

export function ComposeShell({ projectId, projectName, initialDoc, projectStatus = "draft" }: ComposeShellProps) {
  const router = useRouter();
  const { messages } = useT();
  const [blocks, setBlocks] = useState<Block[]>(initialDoc.blocks);
  const [platform, setPlatform] = useState(initialDoc.platform.name || "coupang");
  const [theme, setTheme] = useState<ThemePalette | undefined>(initialDoc.theme);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [draggingLabel, setDraggingLabel] = useState<string | null>(null);
  const [aiToolType, setAiToolType] = useState<"video" | "thumbnail" | "script" | null>(null);
  const [bulkGenerateOpen, setBulkGenerateOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const [pendingBlock, setPendingBlock] = useState<{ block: Block; insertAt: number } | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const platformRef = useRef(platform);
  platformRef.current = platform;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoStack = useRef<Block[][]>([]);
  const redoStack = useRef<Block[][]>([]);
  const lastUndoHashRef = useRef(JSON.stringify(initialDoc.blocks));
  const lastUndoAtRef = useRef(0);
  const savedDocHashRef = useRef(hashDoc(initialDoc));

  const selectedBlock = blocks.find((block) => block.id === selectedBlockId) ?? null;

  const buildDoc = useCallback((): BlockDocument => ({
    format: "blocks",
    blocks: blocksRef.current,
    platform: {
      width: PLATFORM_WIDTHS[platformRef.current] ?? 780,
      name: platformRef.current,
    },
    theme: themeRef.current,
    version: 1,
  }), []);

  const currentDocHash = hashDoc({
    format: "blocks",
    blocks,
    platform: {
      width: PLATFORM_WIDTHS[platform] ?? 780,
      name: platform,
    },
    theme,
    version: 1,
  });
  const isDirty = currentDocHash !== savedDocHashRef.current;

  const persistDoc = useCallback(async (opts?: { toastOnSuccess?: boolean }) => {
    if (saving) {
      return false;
    }

    setSaving(true);
    try {
      const doc = buildDoc();
      await saveBlocks(projectId, doc);
      savedDocHashRef.current = hashDoc(doc);
      setLastSaved(formatSavedTime());
      if (opts?.toastOnSuccess !== false) {
        toast.success(messages.composeShared.composeDocumentSaved);
      }
      return true;
    } catch (error) {
      toast.error(formatComposeDocumentSaveFailed(
        messages,
        error instanceof Error ? error.message : "알 수 없는 오류",
      ));
      return false;
    } finally {
      setSaving(false);
    }
  }, [buildDoc, messages.composeShared, projectId, saving]);

  const pushUndo = useCallback((prev: Block[]) => {
    const nextHash = JSON.stringify(prev);
    const now = Date.now();
    if (nextHash === lastUndoHashRef.current) {
      return;
    }
    if (now - lastUndoAtRef.current < UNDO_COALESCE_MS) {
      return;
    }
    undoStack.current = [...undoStack.current.slice(-49), prev];
    redoStack.current = [];
    lastUndoHashRef.current = nextHash;
    lastUndoAtRef.current = now;
  }, []);

  const resetHistory = useCallback((nextBlocks: Block[]) => {
    undoStack.current = [];
    redoStack.current = [];
    lastUndoHashRef.current = JSON.stringify(nextBlocks);
    lastUndoAtRef.current = Date.now();
  }, []);

  const handleSave = useCallback(async () => {
    await persistDoc();
  }, [persistDoc]);

  const handleUndo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (prev) {
      redoStack.current.push(blocksRef.current);
      lastUndoHashRef.current = "";
      setBlocks(prev);
    }
  }, []);

  const handleRedo = useCallback(() => {
    const next = redoStack.current.pop();
    if (next) {
      undoStack.current.push(blocksRef.current);
      lastUndoHashRef.current = "";
      setBlocks(next);
    }
  }, []);

  const handleBlocksChange = useCallback((newBlocks: Block[]) => {
    pushUndo(blocksRef.current);
    setBlocks(newBlocks);
  }, [pushUndo]);

  const handleUpdateBlock = useCallback((id: string, patch: Partial<Block>) => {
    pushUndo(blocksRef.current);
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, ...patch } as Block : block)),
    );
  }, [pushUndo]);

  const handleAddBlock = useCallback((block: Block) => {
    pushUndo(blocksRef.current);
    if (insertIndex !== null) {
      setBlocks((prev) => {
        const next = [...prev];
        next.splice(insertIndex, 0, block);
        return next;
      });
      setInsertIndex(null);
    } else {
      setBlocks((prev) => [...prev, block]);
    }
    setSelectedBlockId(block.id);
  }, [insertIndex, pushUndo]);

  const handleInsertBlock = useCallback((index: number) => {
    setInsertIndex(index);
  }, []);

  const handlePlatformChange = useCallback((name: string) => {
    setPlatform(name);
  }, []);

  const handlePreview = useCallback(async () => {
    const didSave = await persistDoc({ toastOnSuccess: false });
    if (didSave) {
      const previewParams = new URLSearchParams();
      if (mobilePreview) {
        previewParams.set("mobile", "1");
      }
      const previewPath = previewParams.size > 0
        ? `/projects/${projectId}/result?${previewParams.toString()}`
        : `/projects/${projectId}/result`;
      window.open(previewPath, "_blank");
    }
  }, [mobilePreview, persistDoc, projectId]);

  const handleDesignCheck = useCallback(() => {
    const violations = validateBlocks(blocks);
    if (violations.length === 0) {
      toast.success(messages.composeShared.designCheckPassed);
    } else {
      toast.warning(formatDesignIssuesNeedAttention(messages, violations.length));
    }
  }, [blocks, messages]);

  const handleAutoFixAll = useCallback(() => {
    const createCta = () => BLOCK_TEMPLATES.find((item) => item.type === "cta")!.create();
    const { blocks: fixedBlocks, fixCount } = autoFixAllBlocks(blocks, createCta);
    if (fixCount === 0) {
      toast.success(messages.composeShared.noFixesNeeded);
      return;
    }

    pushUndo(blocksRef.current);
    setBlocks(fixedBlocks);
    toast.success(formatAppliedAutomaticFixes(messages, fixCount));
  }, [blocks, messages, pushUndo]);

  const handleExport = useCallback(() => {
    setExportOpen(true);
  }, []);

  const handleOpenSaveTemplate = useCallback(() => {
    setSaveTemplateOpen(true);
  }, []);

  const handleSaveTemplate = useCallback(async (name: string) => {
    if (templateSaving) {
      return;
    }

    setTemplateSaving(true);
    try {
      await saveComposeTemplate({
        name,
        snapshot: buildDoc(),
        sourceProjectId: projectId,
      });
      setSaveTemplateOpen(false);
      toast.success(messages.composeShared.favoriteTemplateSaved);
    } catch (error) {
      toast.error(formatFavoriteTemplateSaveFailed(
        messages,
        error instanceof Error ? error.message : "알 수 없는 오류",
      ));
    } finally {
      setTemplateSaving(false);
    }
  }, [buildDoc, messages, projectId, templateSaving]);

  const handleApplyTemplate = useCallback((doc: BlockDocument, sourceLabel?: string) => {
    const shouldReplace = !isDirty || window.confirm(messages.composeShared.replaceCurrentComposeConfirm);
    if (!shouldReplace) {
      return false;
    }

    resetHistory(doc.blocks);
    setBlocks(doc.blocks);
    setPlatform(doc.platform.name || "coupang");
    setTheme(doc.theme);
    setSelectedBlockId(null);
    setInsertIndex(null);
    setLastSaved(null);
    toast.success(formatTemplateApplied(messages, sourceLabel));
    return true;
  }, [isDirty, messages, resetHistory]);

  const handleGoHome = useCallback(() => {
    if (saving) {
      toast.message(messages.composeShared.saveInProgress);
      return;
    }

    if (!isDirty) {
      router.push("/");
      return;
    }

    setLeaveOpen(true);
  }, [isDirty, messages.composeShared, router, saving]);

  const handleDiscardAndLeave = useCallback(() => {
    setLeaveOpen(false);
    router.push("/");
  }, [router]);

  const handleSaveAndLeave = useCallback(async () => {
    const didSave = await persistDoc({ toastOnSuccess: false });
    if (!didSave) {
      return;
    }

    setLeaveOpen(false);
    router.push("/");
  }, [persistDoc, router]);

  const handleContextMenu = useCallback((e: React.MouseEvent, blockId: string, blockType: string) => {
    setContextMenu({ x: e.clientX, y: e.clientY, blockId, blockType });
    setSelectedBlockId(blockId);
  }, []);

  const handleDuplicateBlock = useCallback((blockId: string) => {
    const block = blocksRef.current.find((b) => b.id === blockId);
    if (!block) return;
    pushUndo(blocksRef.current);
    const clone = { ...JSON.parse(JSON.stringify(block)), id: `blk-${Date.now()}-dup` };
    const idx = blocksRef.current.findIndex((b) => b.id === blockId);
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
    setSelectedBlockId(clone.id);
  }, [pushUndo]);

  const handleMoveBlock = useCallback((blockId: string, direction: "up" | "down") => {
    const idx = blocksRef.current.findIndex((b) => b.id === blockId);
    if (idx < 0) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= blocksRef.current.length) return;
    pushUndo(blocksRef.current);
    setBlocks((prev) => {
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, [pushUndo]);

  const handleFillEmpty = useCallback(async () => {
    const hasEmptyText = (block: Block): boolean => {
      if ("headline" in block && !block.headline) return true;
      if ("body" in block && !block.body) return true;
      if ("text" in block && !block.text) return true;
      return false;
    };
    const emptyBlocks = blocksRef.current.filter(hasEmptyText);
    if (emptyBlocks.length === 0) {
      toast.info("빈 칸이 없습니다");
      return;
    }
    const confirmed = window.confirm(`${emptyBlocks.length}개 블록을 채웁니다 (약 ${emptyBlocks.length * 3} 크레딧)`);
    if (!confirmed) return;
    pushUndo(blocksRef.current);
    for (const block of emptyBlocks) {
      try {
        const { result } = await generateBlockText(projectId, { blockType: block.type });
        setBlocks((prev) =>
          prev.map((b) => (b.id === block.id ? { ...b, ...result } as Block : b)),
        );
      } catch (err) {
        toast.error(`블록 생성 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
        break;
      }
    }
    toast.success(`${emptyBlocks.length}개 블록의 빈 칸을 채웠습니다`);
  }, [projectId, pushUndo]);

  const handleAddVariation = useCallback(async (blockId: string) => {
    const block = blocksRef.current.find((b) => b.id === blockId);
    if (!block) return;
    try {
      const { result } = await generateBlockText(projectId, {
        blockType: block.type,
        context: JSON.stringify(block),
        userPrompt: "같은 구조, 다른 내용으로 변형해주세요",
      });
      pushUndo(blocksRef.current);
      const clone: Block = { ...JSON.parse(JSON.stringify(block)), id: `blk-${Date.now()}-var`, ...result } as Block;
      const idx = blocksRef.current.findIndex((b) => b.id === blockId);
      setBlocks((prev) => {
        const next = [...prev];
        next.splice(idx + 1, 0, clone);
        return next;
      });
      setSelectedBlockId(clone.id);
      toast.success("변형 블록을 추가했습니다");
    } catch (err) {
      toast.error(`변형 생성 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
    }
  }, [projectId, pushUndo]);

  const handleBulkDraftComplete = useCallback((doc: import("@/types/blocks").BlockDocument) => {
    resetHistory(doc.blocks);
    setBlocks(doc.blocks);
    if (doc.platform?.name) setPlatform(doc.platform.name);
    if (doc.theme) setTheme(doc.theme);
    setSelectedBlockId(null);
    setInsertIndex(null);
  }, [resetHistory]);

  const handlePreviewBlock = useCallback((block: Block) => {
    setPendingBlock({ block, insertAt: blocks.length });
  }, [blocks.length]);

  const handleConfirmPlace = useCallback(() => {
    if (!pendingBlock) return;
    pushUndo(blocksRef.current);
    setBlocks(prev => [...prev, pendingBlock.block]);
    setSelectedBlockId(pendingBlock.block.id);
    setPendingBlock(null);
  }, [pendingBlock, pushUndo]);

  const handleCancelPlace = useCallback(() => {
    setPendingBlock(null);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === "palette-item") {
      const blockType = data.blockType as string;
      setDraggingLabel(BLOCK_TYPE_LABELS[blockType as keyof typeof BLOCK_TYPE_LABELS] ?? blockType);
      return;
    }
    if (data?.type === "ai-result") {
      setDraggingLabel(`AI ${data.resultType === "text" ? "텍스트" : "이미지"}`);
      return;
    }

    const block = blocksRef.current.find((item) => item.id === event.active.id);
    if (block) {
      setDraggingLabel(BLOCK_TYPE_LABELS[block.type] ?? block.type);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDraggingLabel(null);
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeData = active.data.current;

    if (activeData?.type === "palette-item") {
      const create = activeData.create as () => Block;
      const overData = over.data.current;
      const newBlock = create();
      pushUndo(blocksRef.current);

      if (overData?.type === "drop-zone") {
        const dropIndex = overData.index as number;
        setBlocks((prev) => {
          const next = [...prev];
          next.splice(dropIndex, 0, newBlock);
          return next;
        });
      } else {
        const overIndex = blocksRef.current.findIndex((block) => block.id === over.id);
        if (overIndex >= 0) {
          setBlocks((prev) => {
            const next = [...prev];
            next.splice(overIndex + 1, 0, newBlock);
            return next;
          });
        } else {
          setBlocks((prev) => [...prev, newBlock]);
        }
      }

      setSelectedBlockId(newBlock.id);
      setInsertIndex(null);
      return;
    }

    // AI 결과 칩 → 개별 필드 드롭
    if (activeData?.type === "ai-result") {
      const overData = over.data.current;
      if (overData?.type === "ai-field-drop") {
        const { blockId, fieldName, acceptTypes } = overData as {
          blockId: string; fieldName: string; acceptTypes: string[];
        };
        const { resultType, data } = activeData as {
          resultType: string; data: Record<string, unknown>;
        };

        if (!acceptTypes.includes(resultType)) {
          toast.error(
            resultType === "text"
              ? "텍스트 결과는 이미지 필드에 적용할 수 없어요"
              : "이미지 결과는 텍스트 필드에 적용할 수 없어요",
          );
          return;
        }

        const value = extractAiFieldValue(data, fieldName, resultType);
        if (value !== undefined) {
          handleUpdateBlock(blockId, { [fieldName]: value });
          toast.success("AI 결과가 적용되었어요");
        }
      }
      return;
    }

    if (active.id === over.id) {
      return;
    }

    const overData = over.data.current;
    if (overData?.type === "drop-zone") {
      const dropIndex = overData.index as number;
      const oldIndex = blocksRef.current.findIndex((block) => block.id === active.id);
      if (oldIndex >= 0) {
        pushUndo(blocksRef.current);
        setBlocks((prev) => {
          const next = [...prev];
          const [removed] = next.splice(oldIndex, 1);
          const insertAt = dropIndex > oldIndex ? dropIndex - 1 : dropIndex;
          next.splice(insertAt, 0, removed);
          return next;
        });
      }
      return;
    }

    const oldIndex = blocksRef.current.findIndex((block) => block.id === active.id);
    const newIndex = blocksRef.current.findIndex((block) => block.id === over.id);
    if (oldIndex >= 0 && newIndex >= 0) {
      pushUndo(blocksRef.current);
      setBlocks((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  }, [pushUndo]);

  useEffect(() => {
    if (!isDirty) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      return;
    }

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(async () => {
      try {
        const doc = buildDoc();
        await saveBlocks(projectId, doc);
        savedDocHashRef.current = hashDoc(doc);
        setLastSaved(formatSavedTime());
      } catch {
        toast.error(messages.composeShared.autosaveFailed, { id: "autosave-fail" });
      }
    }, 30_000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [buildDoc, currentDocHash, isDirty, messages.composeShared, projectId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const element = event.target as HTMLElement;
      if (
        element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA" ||
        element.tagName === "SELECT" ||
        element.isContentEditable
      ) {
        return;
      }

      if (event.ctrlKey && event.key === "s") {
        event.preventDefault();
        void handleSave();
      } else if (event.ctrlKey && event.shiftKey && event.key === "Z") {
        event.preventDefault();
        handleRedo();
      } else if (event.ctrlKey && event.key === "z") {
        event.preventDefault();
        handleUndo();
      } else if (event.key === "Escape") {
        if (pendingBlock) {
          event.preventDefault();
          setPendingBlock(null);
        } else if (insertIndex !== null) {
          event.preventDefault();
          setInsertIndex(null);
        }
      } else if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedBlockId) {
          event.preventDefault();
          handleBlocksChange(blocks.filter((block) => block.id !== selectedBlockId));
          setSelectedBlockId(null);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [blocks, handleBlocksChange, handleRedo, handleSave, handleUndo, insertIndex, pendingBlock, selectedBlockId]);

  return (
    <ComposeProvider projectId={projectId} theme={theme} projectStatus={projectStatus}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={`flex h-screen flex-col ${WORKSPACE_SURFACE.page}`}>
          <ComposeToolbar
            projectId={projectId}
            projectName={projectName}
            platformName={platform}
            onPlatformChange={handlePlatformChange}
            onGoHome={handleGoHome}
            onSave={handleSave}
            onPreview={handlePreview}
            onExport={handleExport}
            onSaveTemplate={handleOpenSaveTemplate}
            onAiGenerate={() => setBriefOpen(true)}
            onToggleAiPanel={() => setAiPanelOpen(prev => !prev)}
            aiPanelOpen={aiPanelOpen}
            onDesignCheck={handleDesignCheck}
            onAutoFixAll={handleAutoFixAll}
            onAiVideoRender={() => setAiToolType("video")}
            onAiThumbnail={() => setAiToolType("thumbnail")}
            onAiScript={() => setAiToolType("script")}
            aiToolsEnabled={projectStatus === "generated" || projectStatus === "exported"}
            mobilePreview={mobilePreview}
            onMobilePreviewToggle={() => setMobilePreview((prev) => !prev)}
            isSaving={saving}
            isDirty={isDirty}
            isTemplateSaving={templateSaving}
            lastSaved={lastSaved}
            theme={theme}
            onThemeChange={setTheme}
          />

          <AiGenerationPanel
            open={aiPanelOpen}
            onClose={() => setAiPanelOpen(false)}
            projectId={projectId}
          />

          <div className="flex flex-1 overflow-hidden">
            <BlockPalette onAddBlock={handleAddBlock} onPreviewBlock={handlePreviewBlock} />

            <BlockCanvas
              ref={canvasRef}
              blocks={blocks}
              selectedBlockId={selectedBlockId}
              platformWidth={PLATFORM_WIDTHS[platform] ?? 780}
              mobilePreview={mobilePreview}
              exporting={exportOpen}
              insertIndex={insertIndex}
              onBlocksChange={handleBlocksChange}
              onSelectBlock={setSelectedBlockId}
              onInsertBlock={handleInsertBlock}
              onUpdateBlock={handleUpdateBlock}
              onContextMenu={handleContextMenu}
              pendingBlock={pendingBlock?.block}
              onConfirmPlace={handleConfirmPlace}
              onCancelPlace={handleCancelPlace}
            />

            <RightPanel
              block={selectedBlock}
              onUpdate={handleUpdateBlock}
            />
          </div>
        </div>

        <DragOverlay>
          {draggingLabel ? (
            <div className={`flex items-center gap-2 rounded-2xl px-4 py-2 ${WORKSPACE_SURFACE.panelStrong}`}>
              <span className={`text-sm font-medium ${WORKSPACE_TEXT.accent}`}>{draggingLabel}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        projectName={projectName}
        platformName={platform}
        captureRef={canvasRef}
        platformWidth={PLATFORM_WIDTHS[platform] ?? 780}
        blocks={blocks}
      />
      <BriefBuilder
        open={briefOpen}
        currentPlatformName={platform}
        onClose={() => setBriefOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />
      <SaveTemplateDialog
        open={saveTemplateOpen}
        defaultName={`${projectName} ${messages.composeShared.templateSuffix}`}
        saving={templateSaving}
        onClose={() => setSaveTemplateOpen(false)}
        onSubmit={(name) => void handleSaveTemplate(name)}
      />
      <AiToolDialog
        open={aiToolType !== null}
        toolType={aiToolType}
        projectId={projectId}
        onClose={() => setAiToolType(null)}
      />
      <LeaveComposeDialog
        open={leaveOpen}
        saving={saving}
        onClose={() => setLeaveOpen(false)}
        onDiscard={handleDiscardAndLeave}
        onSaveAndLeave={() => void handleSaveAndLeave()}
      />
      <DraftGeneratorDialog
        open={bulkGenerateOpen}
        onClose={() => setBulkGenerateOpen(false)}
        projectId={projectId}
        onComplete={handleBulkDraftComplete}
      />
      <BlockContextMenu
        position={contextMenu}
        onClose={() => setContextMenu(null)}
        onBlockText={(id) => setSelectedBlockId(id)}
        onTextRewrite={(id) => setSelectedBlockId(id)}
        onImageGen={(id) => setSelectedBlockId(id)}
        onSceneCompose={(id) => setSelectedBlockId(id)}
        onModelCompose={(id) => setSelectedBlockId(id)}
        onRemoveBg={(id) => setSelectedBlockId(id)}
        onAddVariation={(id) => void handleAddVariation(id)}
        onDuplicate={handleDuplicateBlock}
        onDelete={(id) => {
          handleBlocksChange(blocks.filter((b) => b.id !== id));
          setSelectedBlockId(null);
        }}
        onMoveUp={(id) => handleMoveBlock(id, "up")}
        onMoveDown={(id) => handleMoveBlock(id, "down")}
      />
    </ComposeProvider>
  );
}
