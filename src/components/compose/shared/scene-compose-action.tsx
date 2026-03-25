"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { pollSceneCompose, startSceneCompose } from "@/lib/api-client";
import { SCENE_CATEGORIES, SCENE_TEMPLATES, type SceneTemplate } from "@/lib/scene-templates";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

interface Props {
  projectId: string;
  imageUrl: string;
  onImageChange: (url: string) => void;
}

const POLL_INTERVAL = 2000;

export function SceneComposeAction({ projectId, imageUrl, onImageChange }: Props) {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("studio");
  const abortRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoryTemplates = useMemo(
    () => SCENE_TEMPLATES.filter((template) => template.category === selectedCategory),
    [selectedCategory],
  );

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

  const handleSelectTemplate = useCallback((template: SceneTemplate) => {
    setPrompt(template.prompt);
  }, []);

  const handleCompose = useCallback(async () => {
    if (!prompt.trim() || !imageUrl || running) {
      return;
    }

    setRunning(true);
    abortRef.current = false;

    try {
      const { jobId } = await startSceneCompose(projectId, {
        imageUrl,
        scenePrompt: prompt.trim(),
      });

      while (!abortRef.current) {
        await waitForNextPoll();
        if (abortRef.current) {
          break;
        }

        const result = await pollSceneCompose(projectId, jobId);

        if (result.job.status === "done") {
          const assets = (result as { assets?: Array<{ filePath: string }> }).assets;
          if (assets?.[0]?.filePath) {
            onImageChange(assets[0].filePath);
            toast.success("배경 합성이 완료됐어요");
            setOpen(false);
            setPrompt("");
          }
          break;
        }

        if (result.job.status === "failed") {
          throw new Error(result.job.error || "배경 합성에 실패했어요. 다시 시도해주세요.");
        }
      }
    } catch (error) {
      if (!abortRef.current) {
        toast.error(error instanceof Error ? error.message : "배경 합성에 실패했어요. 다시 시도해주세요.");
      }
    } finally {
      if (!abortRef.current) {
        setRunning(false);
      } else {
        setRunning(false);
      }
    }
  }, [imageUrl, onImageChange, projectId, prompt, running, waitForNextPoll]);

  if (!imageUrl) {
    return null;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.accentTint} hover:bg-[#F6DFD8]`}
      >
        <Wand2 className="h-3.5 w-3.5" />
        배경 합성
      </button>
    );
  }

  return (
    <div className={`space-y-2 rounded-2xl p-3 ${WORKSPACE_SURFACE.softInset}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${WORKSPACE_TEXT.accent}`}>배경 합성</span>
        {!running ? (
          <button type="button" onClick={() => setOpen(false)} className={`text-[10px] ${WORKSPACE_TEXT.muted} hover:text-[var(--takdi-text)]`}>
            닫기
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1">
        {SCENE_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setSelectedCategory(category.id)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
              selectedCategory === category.id
                ? WORKSPACE_CONTROL.accentButton
                : `${WORKSPACE_CONTROL.subtleButton} shadow-none`
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1">
        {categoryTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => handleSelectTemplate(template)}
            disabled={running}
            className={`rounded-2xl border px-2 py-1.5 text-left text-[11px] transition-colors ${
              prompt === template.prompt
                ? WORKSPACE_CONTROL.accentTint
                : `${WORKSPACE_CONTROL.subtleButton} shadow-none`
            }`}
          >
            {template.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="원하는 배경 분위기나 공간을 입력하세요"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !running) {
            handleCompose();
          }
        }}
        disabled={running}
        className={`w-full rounded-2xl px-3 py-2 text-xs ${WORKSPACE_CONTROL.input}`}
      />

      <button
        type="button"
        onClick={handleCompose}
        disabled={running || !prompt.trim()}
        className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.accentButton} disabled:opacity-50`}
      >
        {running ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            합성 중...
          </>
        ) : (
          <>
            <Wand2 className="h-3.5 w-3.5" />
            배경 합성 시작
          </>
        )}
      </button>
    </div>
  );
}
