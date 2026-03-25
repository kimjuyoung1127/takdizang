/** AiToolDialog - 영상 렌더링 / 썸네일 / 마케팅 스크립트 AI 도구 모달 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Film,
  Image as ImageIcon,
  FileText,
  Loader2,
  Download,
  Copy,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/use-t";
import {
  startRender,
  pollRenderStatus,
  startGenerateThumbnail,
  pollGenerateThumbnail,
  startGenerateMarketingScript,
  pollGenerateMarketingScript,
} from "@/lib/api-client";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";
import type { MessageSchema } from "@/i18n/schema";

interface AiToolDialogProps {
  open: boolean;
  toolType: "video" | "thumbnail" | "script" | null;
  projectId: string;
  onClose: () => void;
}

const POLL_INTERVAL = 2000;

export function AiToolDialog({ open, toolType, projectId, onClose }: AiToolDialogProps) {
  const { messages } = useT();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !toolType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(32_26_23_/_0.35)] backdrop-blur-sm" onClick={onClose}>
      <div
        className={`relative w-full max-w-md rounded-[28px] ${WORKSPACE_SURFACE.panelStrong} p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className={`absolute right-4 top-4 ${WORKSPACE_TEXT.muted} hover:text-[var(--takdi-text)]`}
        >
          <X className="h-4 w-4" />
        </button>

        {toolType === "video" && <VideoRenderTool projectId={projectId} messages={messages} />}
        {toolType === "thumbnail" && <ThumbnailTool projectId={projectId} messages={messages} />}
        {toolType === "script" && <MarketingScriptTool projectId={projectId} messages={messages} />}
      </div>
    </div>
  );
}

function VideoRenderTool({ projectId, messages }: { projectId: string; messages: MessageSchema }) {
  const [running, setRunning] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const abortRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    abortRef.current = true;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
  }, []);

  const handleRender = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setDownloadUrl(null);
    abortRef.current = false;

    try {
      await startRender(projectId);

      while (!abortRef.current) {
        await new Promise<void>((resolve) => {
          pollTimerRef.current = setTimeout(resolve, POLL_INTERVAL);
        });
        if (abortRef.current) break;

        const result = await pollRenderStatus(projectId);
        if (result.status === "done") {
          const artifact = result.artifact as { filePath?: string } | undefined;
          if (artifact?.filePath) setDownloadUrl(artifact.filePath);
          toast.success(messages.aiTools.videoRender.successToast);
          break;
        }
        if (result.status === "failed") {
          throw new Error("영상을 만들지 못했어요. 다시 시도해주세요.");
        }
      }
    } catch (error) {
      if (!abortRef.current) toast.error(error instanceof Error ? error.message : messages.aiTools.videoRender.failedToast);
    } finally {
      setRunning(false);
    }
  }, [projectId, running]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Film className={`h-5 w-5 ${WORKSPACE_TEXT.accent}`} />
        <h3 className={`text-sm font-semibold ${WORKSPACE_TEXT.title}`}>{messages.aiTools.videoRender.title}</h3>
      </div>
      <p className={`text-xs ${WORKSPACE_TEXT.muted}`}>{messages.aiTools.videoRender.description}</p>
      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.subtleButton}`}
        >
          <Download className="h-3.5 w-3.5" />
          {messages.aiTools.videoRender.downloadLabel}
        </a>
      )}
      <button
        type="button"
        onClick={handleRender}
        disabled={running}
        className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-medium ${WORKSPACE_CONTROL.accentButton} disabled:opacity-50`}
      >
        {running ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" />{messages.aiTools.videoRender.buttonRunning}</>
        ) : (
          <><Film className="h-3.5 w-3.5" />{messages.aiTools.videoRender.buttonStart}</>
        )}
      </button>
    </div>
  );
}

function ThumbnailTool({ projectId, messages }: { projectId: string; messages: MessageSchema }) {
  const [running, setRunning] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const abortRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    abortRef.current = true;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setResultUrl(null);
    abortRef.current = false;

    try {
      const { jobId } = await startGenerateThumbnail(projectId);

      while (!abortRef.current) {
        await new Promise<void>((resolve) => {
          pollTimerRef.current = setTimeout(resolve, POLL_INTERVAL);
        });
        if (abortRef.current) break;

        const result = await pollGenerateThumbnail(projectId, jobId);
        if (result.job.status === "done") {
          const artifacts = (result as { artifacts?: Array<{ filePath: string }> }).artifacts;
          if (artifacts?.[0]?.filePath) setResultUrl(artifacts[0].filePath);
          toast.success(messages.aiTools.thumbnail.successToast);
          break;
        }
        if (result.job.status === "failed") {
          throw new Error(result.job.error || messages.aiTools.thumbnail.failedToast);
        }
      }
    } catch (error) {
      if (!abortRef.current) toast.error(error instanceof Error ? error.message : messages.aiTools.thumbnail.failedToast);
    } finally {
      setRunning(false);
    }
  }, [projectId, running]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className={`h-5 w-5 ${WORKSPACE_TEXT.accent}`} />
        <h3 className={`text-sm font-semibold ${WORKSPACE_TEXT.title}`}>{messages.aiTools.thumbnail.title}</h3>
      </div>
      {resultUrl && (
        <div className="space-y-1.5">
          <div className="overflow-hidden rounded-xl border border-[rgb(214_199_184_/_0.5)]">
            <img src={resultUrl} alt="썸네일" className="w-full object-contain" />
          </div>
          <a
            href={resultUrl}
            download
            className={`flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.subtleButton}`}
          >
            <Download className="h-3.5 w-3.5" />
            다운로드
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={running}
        className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-medium ${WORKSPACE_CONTROL.accentButton} disabled:opacity-50`}
      >
        {running ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" />{messages.aiTools.thumbnail.buttonRunning}</>
        ) : (
          <><ImageIcon className="h-3.5 w-3.5" />{resultUrl ? messages.aiTools.thumbnail.buttonRegenerate : messages.aiTools.thumbnail.buttonGenerate}</>
        )}
      </button>
    </div>
  );
}

function MarketingScriptTool({ projectId, messages }: { projectId: string; messages: MessageSchema }) {
  const [running, setRunning] = useState(false);
  const [scriptText, setScriptText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    abortRef.current = true;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setScriptText(null);
    abortRef.current = false;

    try {
      const { jobId } = await startGenerateMarketingScript(projectId);

      while (!abortRef.current) {
        await new Promise<void>((resolve) => {
          pollTimerRef.current = setTimeout(resolve, POLL_INTERVAL);
        });
        if (abortRef.current) break;

        const result = await pollGenerateMarketingScript(projectId, jobId);
        if (result.job.status === "done") {
          const artifacts = (result as { artifacts?: Array<{ metadata?: string }> }).artifacts;
          if (artifacts?.[0]?.metadata) {
            try {
              const parsed = typeof artifacts[0].metadata === "string"
                ? JSON.parse(artifacts[0].metadata)
                : artifacts[0].metadata;
              const script = parsed?.script;
              if (script) {
                const lines: string[] = [];
                if (script.hook) lines.push(`[Hook] ${script.hook}`);
                if (script.body) lines.push(`\n${script.body}`);
                if (script.cta) lines.push(`\n[CTA] ${script.cta}`);
                if (script.hashtags?.length) lines.push(`\n${script.hashtags.join(" ")}`);
                setScriptText(lines.join("\n"));
              }
            } catch {
              setScriptText(messages.aiTools.marketingScript.parseFailed);
            }
          }
          toast.success(messages.aiTools.marketingScript.successToast);
          break;
        }
        if (result.job.status === "failed") {
          throw new Error(result.job.error || messages.aiTools.marketingScript.failedToast);
        }
      }
    } catch (error) {
      if (!abortRef.current) toast.error(error instanceof Error ? error.message : messages.aiTools.marketingScript.failedToast);
    } finally {
      setRunning(false);
    }
  }, [projectId, running]);

  const handleCopy = useCallback(async () => {
    if (!scriptText) return;
    await navigator.clipboard.writeText(scriptText);
    setCopied(true);
    toast.success(messages.aiTools.marketingScript.copiedToast);
    setTimeout(() => setCopied(false), 2000);
  }, [scriptText]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className={`h-5 w-5 ${WORKSPACE_TEXT.accent}`} />
        <h3 className={`text-sm font-semibold ${WORKSPACE_TEXT.title}`}>{messages.aiTools.marketingScript.title}</h3>
      </div>
      {scriptText && (
        <div className="space-y-1.5">
          <div className="rounded-xl border border-[rgb(214_199_184_/_0.5)] bg-white/80 p-2.5">
            <pre className="whitespace-pre-wrap text-[11px] text-[var(--takdi-text)]">{scriptText}</pre>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.subtleButton}`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? messages.aiTools.marketingScript.copiedButton : messages.aiTools.marketingScript.copyButton}
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={running}
        className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-medium ${WORKSPACE_CONTROL.accentButton} disabled:opacity-50`}
      >
        {running ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" />{messages.aiTools.marketingScript.buttonRunning}</>
        ) : (
          <><FileText className="h-3.5 w-3.5" />{scriptText ? messages.aiTools.marketingScript.buttonRegenerate : messages.aiTools.marketingScript.buttonGenerate}</>
        )}
      </button>
    </div>
  );
}
