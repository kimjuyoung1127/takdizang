/** AI 생성 탭 — 우측 패널 내 탭으로 표시, 텍스트/이미지 생성 + 결과 드래그 칩 */
"use client";

import { useState, useCallback } from "react";
import { Sparkles, Loader2, X, GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { toast } from "sonner";
import { generateBlockText } from "@/lib/api-client";
import { BLOCK_TYPE_LABELS } from "@/lib/constants";
import type { BlockType } from "@/types/blocks";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

const TONE_PRESETS = [
  { value: "formal", label: "공식적" },
  { value: "casual", label: "캐주얼" },
  { value: "playful", label: "재미있게" },
  { value: "premium", label: "프리미엄" },
  { value: "friendly", label: "친근하게" },
] as const;

const TEXT_BLOCK_TYPES: BlockType[] = [
  "text-block", "selling-point", "review", "faq", "banner-strip",
  "image-text", "spec-table", "cta", "usage-steps", "notice",
  "price-promo", "trust-badge",
];

export interface AiGeneratedResult {
  id: string;
  type: "text" | "image";
  blockType: string;
  data: Record<string, unknown>;
  label: string;
  timestamp: number;
}

interface AiGenerateTabProps {
  projectId: string;
}

function summarizeResult(data: Record<string, unknown>): string {
  const headline = data.headline ?? data.text ?? data.title;
  if (typeof headline === "string" && headline.length > 0) {
    return headline.length > 30 ? headline.slice(0, 30) + "…" : headline;
  }
  return "AI 결과";
}

let resultCounter = 0;

function ResultChip({ result }: { result: AiGeneratedResult }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `ai-result-${result.id}`,
    data: {
      type: "ai-result",
      resultType: result.type,
      blockType: result.blockType,
      data: result.data,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex cursor-grab items-center gap-2 rounded-xl border border-[rgb(214_199_184_/_0.55)] ${WORKSPACE_SURFACE.panelStrong} px-3 py-2 text-xs transition-all hover:border-[rgb(230_182_169_/_0.8)] hover:shadow-sm ${isDragging ? "opacity-40" : ""}`}
      title="캔버스 필드로 드래그하여 적용"
    >
      <GripVertical className="h-3 w-3 shrink-0 text-[var(--takdi-text-subtle)]" />
      <span className={`min-w-0 flex-1 truncate ${WORKSPACE_TEXT.body}`}>{result.label}</span>
      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
        result.type === "text" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
      }`}>
        {result.type === "text" ? "텍스트" : "이미지"}
      </span>
    </div>
  );
}

export function AiGenerateTab({ projectId }: AiGenerateTabProps) {
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [blockType, setBlockType] = useState<string>("text-block");
  const [tone, setTone] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AiGeneratedResult[]>([]);

  const handleGenerate = useCallback(async () => {
    if (loading) return;

    if (activeTab === "text") {
      setLoading(true);
      try {
        const res = await generateBlockText(projectId, {
          blockType,
          tone: tone ?? undefined,
          userPrompt: prompt.trim() || undefined,
        });
        setResults(prev => [...prev, {
          id: `ai-${Date.now()}-${++resultCounter}`,
          type: "text",
          blockType,
          data: res.result,
          label: summarizeResult(res.result),
          timestamp: Date.now(),
        }]);
      } catch {
        toast.error("AI 문구 생성에 실패했어요. 다시 시도해주세요");
      } finally {
        setLoading(false);
      }
    } else {
      toast.info("이미지 생성은 블록 속성 패널에서 이용해주세요");
    }
  }, [loading, activeTab, projectId, blockType, tone, prompt]);

  const handleRemoveResult = useCallback((id: string) => {
    setResults(prev => prev.filter(r => r.id !== id));
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <div className="space-y-3">
        {/* Type toggle */}
        <div className="flex rounded-lg border border-[rgb(214_199_184_/_0.55)] bg-white/60">
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`flex-1 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${
              activeTab === "text" ? `${WORKSPACE_CONTROL.accentButton}` : `${WORKSPACE_TEXT.muted} hover:text-[#4D433D]`
            }`}
          >
            텍스트
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("image")}
            className={`flex-1 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${
              activeTab === "image" ? `${WORKSPACE_CONTROL.accentButton}` : `${WORKSPACE_TEXT.muted} hover:text-[#4D433D]`
            }`}
          >
            이미지
          </button>
        </div>

        {/* Controls */}
        {activeTab === "text" && (
          <div className="space-y-2">
            <select
              value={blockType}
              onChange={(e) => setBlockType(e.target.value)}
              className={`w-full rounded-xl px-2.5 py-1.5 text-xs ${WORKSPACE_CONTROL.input}`}
            >
              {TEXT_BLOCK_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {BLOCK_TYPE_LABELS[bt]}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-1.5">
              {TONE_PRESETS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(tone === t.value ? null : t.value)}
                  disabled={loading}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    tone === t.value
                      ? WORKSPACE_CONTROL.accentButton
                      : `${WORKSPACE_CONTROL.subtleButton} shadow-none`
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <input
            type="text"
            placeholder={activeTab === "text" ? "원하는 스타일이나 방향을 입력하세요" : "이미지 설명을 입력하세요"}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !loading) void handleGenerate(); }}
            disabled={loading}
            className={`w-full rounded-xl px-3 py-2 text-xs ${WORKSPACE_CONTROL.input}`}
          />
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={loading}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium ${WORKSPACE_CONTROL.accentButton} disabled:opacity-50`}
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                생성하기
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-medium ${WORKSPACE_TEXT.muted}`}>
                결과 ({results.length}개)
              </span>
              <button
                type="button"
                onClick={() => setResults([])}
                className={`text-[10px] ${WORKSPACE_TEXT.muted} hover:text-[#4D433D]`}
              >
                모두 지우기
              </button>
            </div>
            <p className={`text-[9px] ${WORKSPACE_TEXT.muted}`}>캔버스 필드로 드래그하여 적용</p>
            <div className="flex flex-col gap-2">
              {results.map((result) => (
                <div key={result.id} className="group relative">
                  <ResultChip result={result} />
                  <button
                    type="button"
                    onClick={() => handleRemoveResult(result.id)}
                    className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
