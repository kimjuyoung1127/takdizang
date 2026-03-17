/** 한 번에 초안 만들기 다이얼로그 */
"use client";

import { useState, useCallback } from "react";
import { AlertTriangle, Loader2, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { bulkGenerateContent } from "@/lib/api-client";
import type { BlockDocument } from "@/types/blocks";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

type Phase = "input" | "generating-text" | "generating-images" | "complete" | "error";

interface DraftGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onComplete: (doc: BlockDocument) => void;
}

export function DraftGeneratorDialog({ open, onClose, projectId, onComplete }: DraftGeneratorDialogProps) {
  const [briefText, setBriefText] = useState("");
  const [category, setCategory] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [blockCount, setBlockCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = useCallback(async () => {
    if (!briefText.trim()) return;

    const confirmed = window.confirm("현재 블록이 새 초안으로 교체됩니다. 계속하시겠습니까?");
    if (!confirmed) return;

    setPhase("generating-text");
    setErrorMsg("");

    try {
      const doc = await bulkGenerateContent(
        projectId,
        briefText.trim(),
        { category: category || undefined },
        {
          onTextStart: () => setPhase("generating-text"),
          onTextDone: () => {},
          onImagesStart: () => setPhase("generating-images"),
          onImagesDone: () => {},
        },
      );

      setBlockCount(doc.blocks.length);
      setPhase("complete");
      onComplete(doc);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "알 수 없는 오류");
      setPhase("error");
    }
  }, [briefText, category, projectId, onComplete]);

  const handleClose = useCallback(() => {
    if (phase === "generating-text" || phase === "generating-images") return; // 생성 중엔 닫기 불가
    setPhase("input");
    setBriefText("");
    setCategory("");
    setErrorMsg("");
    onClose();
  }, [onClose, phase]);

  const handleRetry = useCallback(() => {
    setPhase("input");
    setErrorMsg("");
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className={`relative w-[520px] rounded-2xl border border-[rgb(214_199_184_/_0.55)] ${WORKSPACE_SURFACE.panelStrong} shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[rgb(214_199_184_/_0.35)] px-6 py-4">
          <Sparkles className="h-5 w-5 text-[#D97C67]" />
          <h2 className={`text-base font-semibold ${WORKSPACE_TEXT.title}`}>한 번에 초안 만들기</h2>
        </div>

        <div className="px-6 py-4">
          {/* Input Phase */}
          {phase === "input" && (
            <div className="space-y-4">
              <div className={`rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs ${WORKSPACE_TEXT.body}`}>
                약 15 크레딧 소요 (텍스트 5 + 이미지 10)
              </div>

              <div>
                <label className={`mb-1.5 block text-xs font-medium ${WORKSPACE_TEXT.body}`}>상품/브랜드 설명</label>
                <textarea
                  value={briefText}
                  onChange={(e) => setBriefText(e.target.value)}
                  placeholder="상품이나 브랜드를 설명해주세요..."
                  rows={4}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-1 focus:ring-[#D97C67] ${WORKSPACE_CONTROL.input}`}
                />
              </div>

              <div>
                <label className={`mb-1.5 block text-xs font-medium ${WORKSPACE_TEXT.body}`}>카테고리 (선택)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${WORKSPACE_CONTROL.input}`}
                >
                  <option value="">자동 감지</option>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className={`flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50/60 px-3 py-2 text-xs ${WORKSPACE_TEXT.body}`}>
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                현재 블록이 새 초안으로 교체됩니다
              </div>

              <Button
                onClick={() => void handleGenerate()}
                disabled={!briefText.trim()}
                className="w-full rounded-xl bg-[#D97C67] text-white hover:bg-[#CF705A]"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                초안 만들기
              </Button>
            </div>
          )}

          {/* Generating Phase */}
          {(phase === "generating-text" || phase === "generating-images") && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                {phase === "generating-text" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#D97C67]" />
                ) : (
                  <Check className="h-5 w-5 text-emerald-500" />
                )}
                <span className={`text-sm ${phase === "generating-text" ? "font-medium" : WORKSPACE_TEXT.muted}`}>
                  텍스트 생성 중...
                </span>
              </div>
              <div className="flex items-center gap-3">
                {phase === "generating-images" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#D97C67]" />
                ) : (
                  <div className={`h-5 w-5 rounded-full border-2 ${WORKSPACE_TEXT.muted}`} />
                )}
                <span className={`text-sm ${phase === "generating-images" ? "font-medium" : WORKSPACE_TEXT.muted}`}>
                  이미지 생성 중...
                </span>
              </div>
              <p className={`text-center text-xs ${WORKSPACE_TEXT.muted}`}>잠시만 기다려 주세요...</p>
            </div>
          )}

          {/* Complete Phase */}
          {phase === "complete" && (
            <div className="space-y-4 py-4 text-center">
              <div className="flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <p className={`text-sm font-medium ${WORKSPACE_TEXT.body}`}>
                초안이 완성되었습니다! ({blockCount}개 블록)
              </p>
              <Button onClick={handleClose} className="rounded-xl bg-[#D97C67] text-white hover:bg-[#CF705A]">
                확인
              </Button>
            </div>
          )}

          {/* Error Phase */}
          {phase === "error" && (
            <div className="space-y-4 py-4">
              <div className={`rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 text-sm text-red-700`}>
                {errorMsg}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1 rounded-xl">
                  닫기
                </Button>
                <Button onClick={handleRetry} className="flex-1 rounded-xl bg-[#D97C67] text-white hover:bg-[#CF705A]">
                  다시 시도
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
