/** AI Hub Panel - 컴포즈 우측 AI 기능 중앙 허브 (이미지 생성, 영상 렌더링, 썸네일, 마케팅 스크립트) */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Film,
  Image as ImageIcon,
  FileText,
  Loader2,
  ChevronDown,
  ChevronRight,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  startGenerateImages,
  pollGenerateImages,
  startRender,
  pollRenderStatus,
  startGenerateThumbnail,
  pollGenerateThumbnail,
  startGenerateMarketingScript,
  pollGenerateMarketingScript,
} from "@/lib/api-client";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

interface AIHubPanelProps {
  projectId: string;
  projectStatus: string;
}

const POLL_INTERVAL = 2000;

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
];

type SectionId = "image" | "video" | "thumbnail" | "script";

export function AIHubPanel({ projectId, projectStatus }: AIHubPanelProps) {
  const [openSections, setOpenSections] = useState<Set<SectionId>>(new Set(["image"]));

  const toggleSection = useCallback((id: SectionId) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isGenerated = projectStatus === "generated" || projectStatus === "exported";

  return (
    <div className="flex w-80 flex-col border-l border-[rgb(212_196_181_/_0.55)] bg-[rgb(251_248_244_/_0.72)] text-[var(--takdi-text)] backdrop-blur-xl">
      <div className="border-b border-[rgb(214_199_184_/_0.62)] px-5 py-4">
        <p className="takdi-kicker">AI Hub</p>
        <h2 className={`mt-3 text-sm font-semibold tracking-[-0.03em] ${WORKSPACE_TEXT.title}`}>
          AI 생성 허브
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <HubSection
          id="image"
          icon={<ImagePlus className="h-4 w-4" />}
          title="AI 이미지 생성"
          open={openSections.has("image")}
          onToggle={() => toggleSection("image")}
          disabled={!isGenerated}
          disabledMessage="먼저 텍스트 생성이 필요합니다"
        >
          <ImageGenerateSection projectId={projectId} />
        </HubSection>

        <HubSection
          id="video"
          icon={<Film className="h-4 w-4" />}
          title="영상 렌더링"
          open={openSections.has("video")}
          onToggle={() => toggleSection("video")}
          disabled={!isGenerated}
          disabledMessage="먼저 텍스트 생성이 필요합니다"
        >
          <VideoRenderSection projectId={projectId} />
        </HubSection>

        <HubSection
          id="thumbnail"
          icon={<ImageIcon className="h-4 w-4" />}
          title="썸네일 생성"
          open={openSections.has("thumbnail")}
          onToggle={() => toggleSection("thumbnail")}
          disabled={!isGenerated}
          disabledMessage="먼저 텍스트 생성이 필요합니다"
        >
          <ThumbnailSection projectId={projectId} />
        </HubSection>

        <HubSection
          id="script"
          icon={<FileText className="h-4 w-4" />}
          title="마케팅 스크립트"
          open={openSections.has("script")}
          onToggle={() => toggleSection("script")}
          disabled={!isGenerated}
          disabledMessage="먼저 텍스트 생성이 필요합니다"
        >
          <MarketingScriptSection projectId={projectId} />
        </HubSection>
      </div>
    </div>
  );
}

/* ── Accordion section wrapper ── */

function HubSection({
  id: _id,
  icon,
  title,
  open,
  onToggle,
  disabled,
  disabledMessage,
  children,
}: {
  id: SectionId;
  icon: React.ReactNode;
  title: string;
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
  disabledMessage?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[rgb(214_199_184_/_0.36)]">
      <button
        type="button"
        onClick={disabled ? undefined : onToggle}
        className={`flex w-full items-center gap-2.5 px-5 py-3 text-left text-sm font-medium transition-colors ${
          disabled
            ? `${WORKSPACE_TEXT.muted} cursor-not-allowed opacity-50`
            : `${WORKSPACE_TEXT.body} hover:bg-[rgb(246_238_230_/_0.5)]`
        }`}
      >
        {icon}
        <span className="flex-1">{title}</span>
        {disabled ? null : open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
      {disabled && (
        <p className={`px-5 pb-2 text-[10px] ${WORKSPACE_TEXT.muted}`}>{disabledMessage}</p>
      )}
      {!disabled && open && <div className="px-5 pb-4 pt-1">{children}</div>}
    </div>
  );
}

/* ── Image Generate Section ── */

function ImageGenerateSection({ projectId }: { projectId: string }) {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
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
      const { jobId } = await startGenerateImages(projectId, {
        aspectRatio,
        styleParams: prompt.trim() ? { userPrompt: prompt.trim() } : undefined,
      });

      while (!abortRef.current) {
        await new Promise<void>((resolve) => {
          pollTimerRef.current = setTimeout(resolve, POLL_INTERVAL);
        });
        if (abortRef.current) break;

        const result = await pollGenerateImages(projectId, jobId);
        if (result.job.status === "done") {
          const assets = (result as { assets?: Array<{ filePath: string }> }).assets;
          if (assets?.[0]?.filePath) {
            setResultUrl(assets[0].filePath);
            toast.success("이미지가 생성되었습니다.");
          }
          break;
        }
        if (result.job.status === "failed") {
          throw new Error(result.job.error || "이미지 생성 실패");
        }
      }
    } catch (error) {
      if (!abortRef.current) toast.error(error instanceof Error ? error.message : "이미지 생성 실패");
    } finally {
      setRunning(false);
    }
  }, [projectId, aspectRatio, prompt, running]);

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="원하는 이미지를 설명해주세요"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !running) handleGenerate(); }}
        disabled={running}
        className={`w-full rounded-2xl px-3 py-2 text-xs ${WORKSPACE_CONTROL.input}`}
      />
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] ${WORKSPACE_TEXT.muted}`}>비율:</span>
        {ASPECT_RATIOS.map((ar) => (
          <button
            key={ar.value}
            type="button"
            onClick={() => setAspectRatio(ar.value)}
            disabled={running}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
              aspectRatio === ar.value ? WORKSPACE_CONTROL.accentButton : `${WORKSPACE_CONTROL.subtleButton} shadow-none`
            }`}
          >
            {ar.label}
          </button>
        ))}
      </div>
      {resultUrl && (
        <div className={`overflow-hidden rounded-xl border border-[rgb(214_199_184_/_0.5)]`}>
          <img src={resultUrl} alt="생성된 이미지" className="w-full object-contain" />
        </div>
      )}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={running}
        className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.accentButton} disabled:opacity-50`}
      >
        {running ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" />생성 중...</>
        ) : (
          <><ImagePlus className="h-3.5 w-3.5" />{resultUrl ? "다시 생성" : "생성하기"}</>
        )}
      </button>
    </div>
  );
}

/* ── Video Render Section ── */

function VideoRenderSection({ projectId }: { projectId: string }) {
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
          if (artifact?.filePath) {
            setDownloadUrl(artifact.filePath);
          }
          toast.success("영상 렌더링이 완료되었습니다.");
          break;
        }
        if (result.status === "failed") {
          throw new Error("영상 렌더링에 실패했습니다.");
        }
      }
    } catch (error) {
      if (!abortRef.current) toast.error(error instanceof Error ? error.message : "영상 렌더링 실패");
    } finally {
      setRunning(false);
    }
  }, [projectId, running]);

  return (
    <div className="space-y-2">
      <p className={`text-[10px] ${WORKSPACE_TEXT.muted}`}>Remotion 기반으로 영상을 렌더링합니다.</p>
      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.subtleButton}`}
        >
          <Download className="h-3.5 w-3.5" />
          영상 다운로드
        </a>
      )}
      <button
        type="button"
        onClick={handleRender}
        disabled={running}
        className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.accentButton} disabled:opacity-50`}
      >
        {running ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" />렌더링 중...</>
        ) : (
          <><Film className="h-3.5 w-3.5" />렌더링 시작</>
        )}
      </button>
    </div>
  );
}

/* ── Thumbnail Section ── */

function ThumbnailSection({ projectId }: { projectId: string }) {
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
          if (artifacts?.[0]?.filePath) {
            setResultUrl(artifacts[0].filePath);
          }
          toast.success("썸네일이 생성되었습니다.");
          break;
        }
        if (result.job.status === "failed") {
          throw new Error(result.job.error || "썸네일 생성 실패");
        }
      }
    } catch (error) {
      if (!abortRef.current) toast.error(error instanceof Error ? error.message : "썸네일 생성 실패");
    } finally {
      setRunning(false);
    }
  }, [projectId, running]);

  return (
    <div className="space-y-2">
      {resultUrl && (
        <div className="space-y-1.5">
          <div className={`overflow-hidden rounded-xl border border-[rgb(214_199_184_/_0.5)]`}>
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
        className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.accentButton} disabled:opacity-50`}
      >
        {running ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" />생성 중...</>
        ) : (
          <><ImageIcon className="h-3.5 w-3.5" />{resultUrl ? "다시 생성" : "생성하기"}</>
        )}
      </button>
    </div>
  );
}

/* ── Marketing Script Section ── */

function MarketingScriptSection({ projectId }: { projectId: string }) {
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
              const parsed = JSON.parse(artifacts[0].metadata);
              const script = parsed.script;
              if (script) {
                const lines: string[] = [];
                if (script.hook) lines.push(`[Hook] ${script.hook}`);
                if (script.body) lines.push(`\n${script.body}`);
                if (script.cta) lines.push(`\n[CTA] ${script.cta}`);
                if (script.hashtags?.length) lines.push(`\n${script.hashtags.join(" ")}`);
                setScriptText(lines.join("\n"));
              }
            } catch {
              setScriptText("스크립트 파싱 실패");
            }
          }
          toast.success("마케팅 스크립트가 생성되었습니다.");
          break;
        }
        if (result.job.status === "failed") {
          throw new Error(result.job.error || "스크립트 생성 실패");
        }
      }
    } catch (error) {
      if (!abortRef.current) toast.error(error instanceof Error ? error.message : "스크립트 생성 실패");
    } finally {
      setRunning(false);
    }
  }, [projectId, running]);

  const handleCopy = useCallback(async () => {
    if (!scriptText) return;
    await navigator.clipboard.writeText(scriptText);
    setCopied(true);
    toast.success("클립보드에 복사되었습니다.");
    setTimeout(() => setCopied(false), 2000);
  }, [scriptText]);

  return (
    <div className="space-y-2">
      {scriptText && (
        <div className="space-y-1.5">
          <div className={`rounded-xl border border-[rgb(214_199_184_/_0.5)] bg-white/80 p-2.5`}>
            <pre className="whitespace-pre-wrap text-[11px] text-[var(--takdi-text)]">{scriptText}</pre>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.subtleButton}`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "복사됨" : "복사하기"}
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={running}
        className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ${WORKSPACE_CONTROL.accentButton} disabled:opacity-50`}
      >
        {running ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" />생성 중...</>
        ) : (
          <><FileText className="h-3.5 w-3.5" />{scriptText ? "다시 생성" : "생성하기"}</>
        )}
      </button>
    </div>
  );
}
