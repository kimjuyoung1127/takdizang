/** Quick Actions palette (Ctrl+K) — Compose 에디터 빠른 실행 */
"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  CopyPlus,
  Download,
  Eraser,
  Eye,
  FileText,
  Film,
  ImagePlus,
  LayoutTemplate,
  Pencil,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wand2,
} from "lucide-react";
import { WORKSPACE_SURFACE, WORKSPACE_TEXT, WORKSPACE_CONTROL } from "@/lib/workspace-surface";

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  resultType?: "텍스트" | "이미지" | "영상" | "혼합";
  credit?: string;
  icon: React.ReactNode;
  condition: "always" | "block-selected" | "text-block" | "image-block" | "status-generated";
  onExecute: () => void;
}

interface QuickActionsProps {
  open: boolean;
  onClose: () => void;
  actions: QuickAction[];
  selectedBlockId: string | null;
  selectedBlockType: string | null;
  projectStatus: string;
}

const RESULT_PILL_COLORS: Record<string, string> = {
  "텍스트": "bg-blue-100 text-blue-700",
  "이미지": "bg-emerald-100 text-emerald-700",
  "영상": "bg-purple-100 text-purple-700",
  "혼합": "bg-amber-100 text-amber-700",
};

function isTextBlockType(type: string | null): boolean {
  if (!type) return false;
  return ["text-block", "selling-point", "review", "faq", "banner-strip", "image-text", "spec-table", "cta", "usage-steps", "notice", "price-promo", "trust-badge", "comparison"].includes(type);
}

function isImageBlockType(type: string | null): boolean {
  if (!type) return false;
  return ["hero", "image-text", "image-grid", "comparison"].includes(type);
}

export function QuickActions({ open, onClose, actions, selectedBlockId, selectedBlockType, projectStatus }: QuickActionsProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isGenerated = projectStatus === "generated" || projectStatus === "exported";

  const filteredActions = useMemo(() => {
    const available = actions.filter((action) => {
      switch (action.condition) {
        case "always":
          return true;
        case "block-selected":
          return !!selectedBlockId;
        case "text-block":
          return !!selectedBlockId && isTextBlockType(selectedBlockType);
        case "image-block":
          return !!selectedBlockId && isImageBlockType(selectedBlockType);
        case "status-generated":
          return true; // Always show but dim if not ready
        default:
          return true;
      }
    });

    if (!query.trim()) return available;

    const q = query.toLowerCase();
    return available.filter(
      (a) => a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.id.includes(q),
    );
  }, [actions, selectedBlockId, selectedBlockType, query]);

  const isDisabled = useCallback(
    (action: QuickAction) => {
      if (action.condition === "status-generated" && !isGenerated) return true;
      return false;
    },
    [isGenerated],
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filteredActions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const action = filteredActions[activeIndex];
        if (action && !isDisabled(action)) {
          action.onExecute();
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [activeIndex, filteredActions, isDisabled, onClose],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className={`relative w-[480px] rounded-2xl border border-[rgb(214_199_184_/_0.55)] ${WORKSPACE_SURFACE.panelStrong} shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-[rgb(214_199_184_/_0.35)] px-4 py-3">
          <Search className={`h-4 w-4 ${WORKSPACE_TEXT.muted}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="어떤 작업을 할까요?"
            className={`flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--takdi-text-subtle)] ${WORKSPACE_TEXT.body}`}
          />
          <kbd className={`rounded-md border px-1.5 py-0.5 text-[10px] ${WORKSPACE_TEXT.muted}`}>Ctrl+K</kbd>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1">
          {filteredActions.length === 0 ? (
            <div className={`px-4 py-8 text-center text-sm ${WORKSPACE_TEXT.muted}`}>
              일치하는 작업이 없어요
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const disabled = isDisabled(action);
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => {
                    if (!disabled) {
                      action.onExecute();
                      onClose();
                    }
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    idx === activeIndex
                      ? "bg-[rgb(246_238_230_/_0.7)]"
                      : "hover:bg-[rgb(246_238_230_/_0.4)]"
                  } ${disabled ? "opacity-40" : ""}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${WORKSPACE_SURFACE.panelStrong}`}>
                    {action.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium ${WORKSPACE_TEXT.body}`}>{action.label}</div>
                    <div className={`truncate text-xs ${WORKSPACE_TEXT.muted}`}>
                      {disabled ? "먼저 초안을 만들어주세요" : action.description}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {action.resultType && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${RESULT_PILL_COLORS[action.resultType] ?? ""}`}>
                        {action.resultType}
                      </span>
                    )}
                    {action.credit && (
                      <span className={`text-[10px] ${WORKSPACE_TEXT.muted}`}>~{action.credit}</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className={`flex items-center gap-4 border-t border-[rgb(214_199_184_/_0.35)] px-4 py-2 text-[10px] ${WORKSPACE_TEXT.muted}`}>
          <span>↑↓ 탐색</span>
          <span>Enter 실행</span>
          <span>Esc 닫기</span>
        </div>
      </div>
    </div>
  );
}

/** Default action definitions factory */
export function buildQuickActions(handlers: {
  onBulkDraft: () => void;
  onBlockText: () => void;
  onTextRewrite: () => void;
  onFillEmpty: () => void;
  onAddVariation: () => void;
  onImageGen: () => void;
  onSceneCompose: () => void;
  onModelCompose: () => void;
  onRemoveBg: () => void;
  onVideoRender: () => void;
  onThumbnail: () => void;
  onScript: () => void;
  onSave: () => void;
  onPreview: () => void;
  onExport: () => void;
  onDesignCheck: () => void;
  onTemplates: () => void;
}): QuickAction[] {
  return [
    { id: "bulk-draft", label: "한 번에 초안 만들기", description: "설명만 입력하면 전체 텍스트+이미지를 만들어요", resultType: "혼합", credit: "15", icon: <Sparkles className="h-4 w-4 text-[var(--takdi-accent)]" />, condition: "always", onExecute: handlers.onBulkDraft },
    { id: "block-text", label: "AI로 문구 만들기", description: "선택한 블록에 AI 텍스트를 생성해요", resultType: "텍스트", credit: "3", icon: <Pencil className="h-4 w-4 text-blue-500" />, condition: "block-selected", onExecute: handlers.onBlockText },
    { id: "text-rewrite", label: "다른 톤으로 다시 쓰기", description: "톤 변경, 번역, 축약을 해요", resultType: "텍스트", credit: "3", icon: <RefreshCw className="h-4 w-4 text-blue-500" />, condition: "text-block", onExecute: handlers.onTextRewrite },
    { id: "fill-empty", label: "빈 칸 채우기", description: "비어있는 텍스트를 AI로 한 번에 채워요", resultType: "텍스트", credit: "3×N", icon: <Sparkles className="h-4 w-4 text-amber-500" />, condition: "always", onExecute: handlers.onFillEmpty },
    { id: "add-variation", label: "비슷한 버전 만들기", description: "블록을 복제하고 AI로 내용을 바꿔요", resultType: "혼합", credit: "3", icon: <CopyPlus className="h-4 w-4 text-violet-500" />, condition: "block-selected", onExecute: handlers.onAddVariation },
    { id: "image-gen", label: "AI로 이미지 만들기", description: "설명을 입력하면 이미지를 만들어요", resultType: "이미지", credit: "10", icon: <ImagePlus className="h-4 w-4 text-emerald-500" />, condition: "always", onExecute: handlers.onImageGen },
    { id: "scene-compose", label: "배경 바꾸기", description: "이미지의 배경을 다른 장면으로 바꿔요", resultType: "이미지", credit: "8", icon: <Wand2 className="h-4 w-4 text-emerald-500" />, condition: "image-block", onExecute: handlers.onSceneCompose },
    { id: "model-compose", label: "모델 착용 합성", description: "AI가 모델 착용 이미지를 만들어요", resultType: "이미지", credit: "8", icon: <UserRound className="h-4 w-4 text-emerald-500" />, condition: "image-block", onExecute: handlers.onModelCompose },
    { id: "remove-bg", label: "배경 제거", description: "이미지 배경을 깔끔하게 제거해요", resultType: "이미지", credit: "3", icon: <Eraser className="h-4 w-4 text-emerald-500" />, condition: "image-block", onExecute: handlers.onRemoveBg },
    { id: "video-render", label: "영상 만들기", description: "숏폼 영상을 만들어요", resultType: "영상", icon: <Film className="h-4 w-4 text-purple-500" />, condition: "status-generated", onExecute: handlers.onVideoRender },
    { id: "thumbnail", label: "썸네일 만들기", description: "AI가 썸네일을 만들어요", resultType: "이미지", credit: "5", icon: <ImagePlus className="h-4 w-4 text-purple-500" />, condition: "status-generated", onExecute: handlers.onThumbnail },
    { id: "script", label: "마케팅 문구 만들기", description: "SNS에 올릴 마케팅 문구를 만들어요", resultType: "텍스트", credit: "5", icon: <FileText className="h-4 w-4 text-purple-500" />, condition: "status-generated", onExecute: handlers.onScript },
    { id: "save", label: "저장", description: "Ctrl+S", icon: <Save className="h-4 w-4" />, condition: "always", onExecute: handlers.onSave },
    { id: "preview", label: "미리보기", description: "완성된 결과를 미리 확인해요", icon: <Eye className="h-4 w-4" />, condition: "always", onExecute: handlers.onPreview },
    { id: "export", label: "내보내기", description: "이미지, 카드뉴스, HTML로 내보내요", icon: <Download className="h-4 w-4" />, condition: "always", onExecute: handlers.onExport },
    { id: "design-check", label: "디자인 검사", description: "빠뜨린 항목이 없는지 확인해요", icon: <ShieldCheck className="h-4 w-4" />, condition: "always", onExecute: handlers.onDesignCheck },
    { id: "templates", label: "템플릿", description: "템플릿으로 빠르게 시작해요", icon: <LayoutTemplate className="h-4 w-4" />, condition: "always", onExecute: handlers.onTemplates },
  ];
}
