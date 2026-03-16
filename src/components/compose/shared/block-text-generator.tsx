/** BlockTextGenerator - 블록별 AI 문구 생성 확장 패널 (톤 프리셋 + 프롬프트 + 미리보기 + 재생성) */
"use client";

import { useState, type ReactNode } from "react";
import { Sparkles, Loader2, X, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";
import { useCompose } from "../compose-context";
import { generateBlockText } from "@/lib/api-client";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

const TONE_PRESETS = [
  { value: "formal", label: "공식적" },
  { value: "casual", label: "캐주얼" },
  { value: "playful", label: "재미있게" },
  { value: "premium", label: "프리미엄" },
  { value: "friendly", label: "친근하게" },
] as const;

interface BlockTextGeneratorProps {
  blockType: string;
  context?: string;
  onResult: (result: Record<string, unknown>) => void;
  renderPreview?: (result: Record<string, unknown>) => ReactNode;
  label?: string;
}

export function BlockTextGenerator({
  blockType,
  context,
  onResult,
  renderPreview,
  label = "AI로 작성",
}: BlockTextGeneratorProps) {
  const { projectId } = useCompose();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);

  async function handleGenerate() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await generateBlockText(projectId, {
        blockType,
        context,
        tone: selectedTone ?? undefined,
        userPrompt: userPrompt.trim() || undefined,
      });
      setPreview(res.result);
    } catch {
      toast.error("AI 문구 생성에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!preview) return;
    onResult(preview);
    toast.success("AI 문구가 적용되었습니다");
    setPreview(null);
    setOpen(false);
  }

  function handleRegenerate() {
    setPreview(null);
    handleGenerate();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${WORKSPACE_CONTROL.accentTint} hover:bg-[rgb(246_223_216_/_0.9)]`}
      >
        <Sparkles className={`h-3.5 w-3.5 ${WORKSPACE_TEXT.accent}`} />
        {label}
      </button>
    );
  }

  return (
    <div className={`space-y-2.5 rounded-2xl p-3 ${WORKSPACE_SURFACE.softInset}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${WORKSPACE_TEXT.accent}`}>AI 문구 생성</span>
        {!loading && (
          <button
            type="button"
            onClick={() => { setOpen(false); setPreview(null); }}
            className={`text-[10px] ${WORKSPACE_TEXT.muted} hover:text-[#4D433D]`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Tone presets */}
      <div className="flex flex-wrap gap-1">
        {TONE_PRESETS.map((tone) => (
          <button
            key={tone.value}
            type="button"
            onClick={() => setSelectedTone(selectedTone === tone.value ? null : tone.value)}
            disabled={loading}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
              selectedTone === tone.value
                ? WORKSPACE_CONTROL.accentButton
                : `${WORKSPACE_CONTROL.subtleButton} shadow-none`
            }`}
          >
            {tone.label}
          </button>
        ))}
      </div>

      {/* User prompt input */}
      <input
        type="text"
        placeholder="원하는 스타일이나 방향을 입력하세요"
        value={userPrompt}
        onChange={(e) => setUserPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !loading) {
            handleGenerate();
          }
        }}
        disabled={loading}
        className={`w-full rounded-2xl px-3 py-2 text-xs ${WORKSPACE_CONTROL.input}`}
      />

      {/* Generate button */}
      {!preview && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.accentButton} disabled:opacity-50`}
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
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-2">
          <div className={`rounded-xl border border-[rgb(214_199_184_/_0.5)] bg-white/80 p-2.5 text-xs`}>
            {renderPreview ? renderPreview(preview) : (
              <pre className="whitespace-pre-wrap text-[11px] text-[var(--takdi-text)]">
                {JSON.stringify(preview, null, 2)}
              </pre>
            )}
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleApply}
              className={`flex flex-1 items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.accentButton}`}
            >
              <Check className="h-3.5 w-3.5" />
              적용하기
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={loading}
              className={`flex flex-1 items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.subtleButton} disabled:opacity-50`}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              다시 생성
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
