/** RemoveBgAction - 컴포즈 블록 내 AI 배경 제거 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Eraser } from "lucide-react";
import { toast } from "sonner";
import { startRemoveBg, pollRemoveBg, getProjectAssets, type AssetRecord } from "@/lib/api-client";
import { WORKSPACE_CONTROL, WORKSPACE_TEXT } from "@/lib/workspace-surface";

interface Props {
  projectId: string;
  imageUrl: string;
  onImageChange: (url: string) => void;
}

const POLL_INTERVAL = 2000;

export function RemoveBgAction({ projectId, imageUrl, onImageChange }: Props) {
  const [running, setRunning] = useState(false);
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

  const waitForNextPoll = useCallback(() => {
    return new Promise<void>((resolve) => {
      pollTimerRef.current = setTimeout(() => {
        pollTimerRef.current = null;
        resolve();
      }, POLL_INTERVAL);
    });
  }, []);

  const handleRemoveBg = useCallback(async () => {
    if (running || !imageUrl) return;

    setRunning(true);
    abortRef.current = false;

    try {
      // Find asset ID from the current imageUrl
      const { assets } = await getProjectAssets(projectId);
      const matchingAsset = assets.find((a: AssetRecord) => a.filePath === imageUrl);

      const { jobId } = await startRemoveBg(projectId, {
        assetId: matchingAsset?.id,
      });

      while (!abortRef.current) {
        await waitForNextPoll();
        if (abortRef.current) break;

        const result = await pollRemoveBg(projectId, jobId);

        if (result.job.status === "done") {
          const resultAssets = (result as { assets?: Array<{ filePath: string }> }).assets;
          if (resultAssets?.[0]?.filePath) {
            onImageChange(resultAssets[0].filePath);
            toast.success("배경을 깔끔하게 제거했어요");
          }
          break;
        }

        if (result.job.status === "failed") {
          throw new Error(result.job.error || "배경을 제거하지 못했어요. 다시 시도해주세요.");
        }
      }
    } catch (error) {
      if (!abortRef.current) {
        toast.error(error instanceof Error ? error.message : "배경을 제거하지 못했어요. 다시 시도해주세요.");
      }
    } finally {
      setRunning(false);
    }
  }, [projectId, imageUrl, onImageChange, running, waitForNextPoll]);

  if (!imageUrl) return null;

  return (
    <button
      type="button"
      onClick={handleRemoveBg}
      disabled={running}
      className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.accentTint} hover:bg-[#F6DFD8] disabled:opacity-50`}
    >
      {running ? (
        <>
          <Loader2 className={`h-3.5 w-3.5 animate-spin ${WORKSPACE_TEXT.accent}`} />
          배경 제거 중...
        </>
      ) : (
        <>
          <Eraser className="h-3.5 w-3.5" />
          배경 제거
        </>
      )}
    </button>
  );
}
