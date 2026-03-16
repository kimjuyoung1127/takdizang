/** ModelComposeAction - 컴포즈 블록 내 AI 모델컷 합성 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { startModelCompose, pollModelCompose, getProjectAssets, type AssetRecord } from "@/lib/api-client";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";
import { AppImage } from "@/components/ui/app-image";

interface Props {
  projectId: string;
  imageUrl: string;
  onImageChange: (url: string) => void;
}

const POLL_INTERVAL = 2000;

export function ModelComposeAction({ projectId, imageUrl, onImageChange }: Props) {
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
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

  const handleCompose = useCallback(async () => {
    if (running) return;

    setRunning(true);
    abortRef.current = false;

    try {
      const { jobId } = await startModelCompose(projectId, {
        assetId: selectedAssetId ?? undefined,
        prompt: prompt.trim() || undefined,
      });

      while (!abortRef.current) {
        await waitForNextPoll();
        if (abortRef.current) break;

        const result = await pollModelCompose(projectId, jobId);

        if (result.job.status === "done") {
          const resultAssets = (result as { assets?: Array<{ filePath: string }> }).assets;
          if (resultAssets?.[0]?.filePath) {
            onImageChange(resultAssets[0].filePath);
            toast.success("모델컷 합성이 완료되었습니다.");
            setOpen(false);
          }
          break;
        }

        if (result.job.status === "failed") {
          throw new Error(result.job.error || "모델컷 합성에 실패했습니다.");
        }
      }
    } catch (error) {
      if (!abortRef.current) {
        toast.error(error instanceof Error ? error.message : "모델컷 합성에 실패했습니다.");
      }
    } finally {
      setRunning(false);
    }
  }, [projectId, selectedAssetId, prompt, onImageChange, running, waitForNextPoll]);

  if (!imageUrl) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.accentTint} hover:bg-[#F6DFD8]`}
      >
        <UserRound className="h-3.5 w-3.5" />
        모델컷 합성
      </button>
    );
  }

  return (
    <div className={`space-y-2 rounded-2xl p-3 ${WORKSPACE_SURFACE.softInset}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${WORKSPACE_TEXT.accent}`}>모델컷 합성</span>
        {!running && (
          <button type="button" onClick={() => setOpen(false)} className={`text-[10px] ${WORKSPACE_TEXT.muted} hover:text-[#4D433D]`}>
            닫기
          </button>
        )}
      </div>

      <p className={`text-[10px] ${WORKSPACE_TEXT.muted}`}>
        현재 이미지에 AI 모델을 합성합니다. 참조할 에셋을 선택하면 더 정확한 결과를 얻을 수 있습니다.
      </p>

      {assets.length > 0 && (
        <div className="grid grid-cols-4 gap-1">
          {assets.slice(0, 8).map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => setSelectedAssetId(asset.id === selectedAssetId ? null : asset.id)}
              disabled={running}
              className={`aspect-square overflow-hidden rounded-xl border transition ${
                asset.id === selectedAssetId
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
      )}

      <input
        type="text"
        placeholder="원하는 모델 스타일이나 포즈를 입력하세요"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !running) {
            handleCompose();
          }
        }}
        disabled={running}
        className={`w-full rounded-2xl px-3 py-2 text-xs ${WORKSPACE_CONTROL.input}`}
      />

      <button
        type="button"
        onClick={handleCompose}
        disabled={running}
        className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.accentButton} disabled:opacity-50`}
      >
        {running ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            합성 중...
          </>
        ) : (
          <>
            <UserRound className="h-3.5 w-3.5" />
            모델컷 합성 시작
          </>
        )}
      </button>
    </div>
  );
}
