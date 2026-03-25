/** ImageGenerateAction - 블록 내 AI 이미지 생성 액션 (프롬프트 → 이미지 생성 → 블록 적용) */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Check, X } from "lucide-react";
import { toast } from "sonner";
import { startGenerateImages, pollGenerateImages, getProjectAssets, type AssetRecord } from "@/lib/api-client";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";
import { AppImage } from "@/components/ui/app-image";

interface Props {
  projectId: string;
  onImageChange: (url: string) => void;
  label?: string;
}

const POLL_INTERVAL = 2000;
const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
];

export function ImageGenerateAction({ projectId, onImageChange, label }: Props) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [selectedRefIds, setSelectedRefIds] = useState<string[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const abortRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    abortRef.current = true;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getProjectAssets(projectId)
      .then((res) => {
        if (!cancelled) {
          setAssets(res.assets.filter((a) => a.mimeType?.startsWith("image/")));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [projectId, open]);

  const waitForNextPoll = useCallback(() => {
    return new Promise<void>((resolve) => {
      pollTimerRef.current = setTimeout(() => {
        pollTimerRef.current = null;
        resolve();
      }, POLL_INTERVAL);
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (running) return;

    setRunning(true);
    setResultUrl(null);
    abortRef.current = false;

    try {
      const { jobId } = await startGenerateImages(projectId, {
        aspectRatio,
        referenceAssetIds: selectedRefIds.length > 0 ? selectedRefIds : undefined,
        styleParams: prompt.trim() ? { userPrompt: prompt.trim() } : undefined,
      });

      while (!abortRef.current) {
        await waitForNextPoll();
        if (abortRef.current) break;

        const result = await pollGenerateImages(projectId, jobId);

        if (result.job.status === "done") {
          const resultAssets = (result as { assets?: Array<{ filePath: string }> }).assets;
          if (resultAssets?.[0]?.filePath) {
            setResultUrl(resultAssets[0].filePath);
          }
          break;
        }

        if (result.job.status === "failed") {
          throw new Error(result.job.error || "이미지를 만들지 못했어요. 다시 시도해주세요.");
        }
      }
    } catch (error) {
      if (!abortRef.current) {
        toast.error(error instanceof Error ? error.message : "이미지를 만들지 못했어요. 다시 시도해주세요.");
      }
    } finally {
      setRunning(false);
    }
  }, [projectId, aspectRatio, selectedRefIds, prompt, running, waitForNextPoll]);

  const handleApply = useCallback(() => {
    if (!resultUrl) return;
    onImageChange(resultUrl);
    toast.success("이미지를 적용했어요");
    setOpen(false);
    setResultUrl(null);
    setPrompt("");
  }, [resultUrl, onImageChange]);

  const handleRegenerate = useCallback(() => {
    setResultUrl(null);
    handleGenerate();
  }, [handleGenerate]);

  const toggleRefAsset = useCallback((id: string) => {
    setSelectedRefIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev,
    );
  }, []);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.accentTint} hover:bg-[#F6DFD8]`}
      >
        <ImagePlus className="h-3.5 w-3.5" />
        {label ?? "AI 이미지 생성"}
      </button>
    );
  }

  return (
    <div className={`space-y-2 rounded-2xl p-3 ${WORKSPACE_SURFACE.softInset}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${WORKSPACE_TEXT.accent}`}>{label ?? "AI 이미지 생성"}</span>
        {!running && (
          <button
            type="button"
            onClick={() => { setOpen(false); setResultUrl(null); }}
            className={`text-[10px] ${WORKSPACE_TEXT.muted} hover:text-[var(--takdi-text)]`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Prompt input */}
      <input
        type="text"
        placeholder="원하는 이미지를 설명해주세요"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !running) {
            handleGenerate();
          }
        }}
        disabled={running}
        className={`w-full rounded-2xl px-3 py-2 text-xs ${WORKSPACE_CONTROL.input}`}
      />

      {/* Reference assets (collapsible) */}
      {assets.length > 0 && (
        <div>
          <p className={`mb-1 text-[10px] ${WORKSPACE_TEXT.muted}`}>
            참조 에셋 선택 (최대 3개, 선택사항)
          </p>
          <div className="grid grid-cols-4 gap-1">
            {assets.slice(0, 8).map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => toggleRefAsset(asset.id)}
                disabled={running}
                className={`aspect-square overflow-hidden rounded-xl border transition ${
                  selectedRefIds.includes(asset.id)
                    ? "border-[rgb(236_197_183_/_0.95)] ring-2 ring-[var(--takdi-accent)]"
                    : "border-[rgb(214_199_184_/_0.74)]"
                }`}
              >
                <AppImage
                  src={asset.previewPath ?? asset.filePath}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Aspect ratio */}
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] ${WORKSPACE_TEXT.muted}`}>비율:</span>
        {ASPECT_RATIOS.map((ar) => (
          <button
            key={ar.value}
            type="button"
            onClick={() => setAspectRatio(ar.value)}
            disabled={running}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
              aspectRatio === ar.value
                ? WORKSPACE_CONTROL.accentButton
                : `${WORKSPACE_CONTROL.subtleButton} shadow-none`
            }`}
          >
            {ar.label}
          </button>
        ))}
      </div>

      {/* Result preview */}
      {resultUrl && (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-[rgb(214_199_184_/_0.5)]">
            <AppImage
              src={resultUrl}
              alt="생성된 이미지"
              width={256}
              height={256}
              className="w-full object-contain"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleApply}
              className={`flex flex-1 items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.accentButton}`}
            >
              <Check className="h-3.5 w-3.5" />
              이 이미지 적용
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={running}
              className={`flex flex-1 items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.subtleButton} disabled:opacity-50`}
            >
              {running ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              재생성
            </button>
          </div>
        </div>
      )}

      {/* Generate button (shown when no result) */}
      {!resultUrl && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={running}
          className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.accentButton} disabled:opacity-50`}
        >
          {running ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <ImagePlus className="h-3.5 w-3.5" />
              생성하기
            </>
          )}
        </button>
      )}
    </div>
  );
}
