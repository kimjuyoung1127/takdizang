"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Bookmark,
  Download,
  ExternalLink,
  Eye,
  Film,
  Image as ImageIcon,
  FileText,
  LayoutTemplate,
  Loader2,
  Monitor,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSavedAt } from "@/i18n/format";
import { useT } from "@/i18n/use-t";
import { PLATFORM_PRESETS } from "@/lib/constants";
import type { ThemePalette } from "@/types/blocks";
import { ThemePicker } from "./theme-picker";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

interface ComposeToolbarProps {
  projectId: string;
  projectName: string;
  platformName: string;
  onPlatformChange: (platform: string) => void;
  onGoHome: () => void;
  onSave: () => void;
  onPreview: () => void;
  onExport: () => void;
  onSaveTemplate: () => void;
  onAiGenerate?: () => void;
  onDesignCheck?: () => void;
  onAutoFixAll?: () => void;
  onAiVideoRender?: () => void;
  onAiThumbnail?: () => void;
  onAiScript?: () => void;
  aiToolsEnabled?: boolean;
  mobilePreview?: boolean;
  onMobilePreviewToggle?: () => void;
  isSaving: boolean;
  isDirty: boolean;
  isTemplateSaving?: boolean;
  lastSaved: string | null;
  theme?: ThemePalette;
  onThemeChange: (theme: ThemePalette | undefined) => void;
}

export function ComposeToolbar({
  projectId,
  projectName,
  platformName,
  onPlatformChange,
  onGoHome,
  onSave,
  onPreview,
  onExport,
  onSaveTemplate,
  onAiGenerate,
  onDesignCheck,
  onAutoFixAll,
  onAiVideoRender,
  onAiThumbnail,
  onAiScript,
  aiToolsEnabled,
  mobilePreview,
  onMobilePreviewToggle,
  isSaving,
  isDirty,
  isTemplateSaving,
  lastSaved,
  theme,
  onThemeChange,
}: ComposeToolbarProps) {
  const { messages } = useT();

  return (
    <div className="flex h-16 items-center justify-between border-b border-[rgb(212_196_181_/_0.55)] bg-[rgb(247_241_234_/_0.72)] px-4 backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onGoHome}
          className={`flex h-9 w-9 items-center justify-center rounded-2xl border text-sm font-bold transition ${WORKSPACE_CONTROL.darkChip}`}
          title={isDirty ? messages.composeShared.backHomeWithUnsaved : messages.composeShared.backHome}
        >
          T
        </button>
        <div className="min-w-0">
          <p className="takdi-kicker">Compose studio</p>
          <h1 className={`mt-1 truncate text-sm font-semibold ${WORKSPACE_TEXT.title}`}>{projectName}</h1>
          <p className={`text-[10px] ${WORKSPACE_TEXT.muted}`}>
            {isDirty ? messages.composeShared.unsavedChanges : messages.composeShared.allChangesSaved}
          </p>
        </div>
        <Link
          href={`/projects/${projectId}/editor`}
          className={`flex items-center gap-1 text-xs ${WORKSPACE_TEXT.muted} hover:text-[#D97C67]`}
        >
          <ExternalLink className="h-3 w-3" />
          작업 자동화
        </Link>
      </div>

      <div className="relative flex items-center gap-3">
        <ThemePicker currentTheme={theme} onThemeChange={onThemeChange} />
        <label className={`text-xs ${WORKSPACE_TEXT.body}`}>{messages.composeShared.platform}</label>
        <select
          value={platformName}
          onChange={(event) => onPlatformChange(event.target.value)}
          className={`rounded-2xl px-3 py-1.5 text-xs ${WORKSPACE_CONTROL.input}`}
        >
          {PLATFORM_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label} ({preset.width}px)
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        {onAiGenerate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAiGenerate}
            className={`flex items-center gap-1 rounded-2xl text-xs ${WORKSPACE_TEXT.accent} hover:text-[#CF705A]`}
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            {messages.common.actions.templates}
          </Button>
        )}
        {aiToolsEnabled && (onAiVideoRender || onAiThumbnail || onAiScript) && (
          <AiToolsDropdown
            onVideoRender={onAiVideoRender}
            onThumbnail={onAiThumbnail}
            onScript={onAiScript}
          />
        )}
        {onDesignCheck && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDesignCheck}
            className={`flex items-center gap-1 rounded-2xl text-xs ${WORKSPACE_CONTROL.ghostButton}`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {messages.common.actions.check}
          </Button>
        )}
        {onAutoFixAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAutoFixAll}
            className="flex items-center gap-1 rounded-2xl text-xs text-[#B8794E] hover:bg-[#F8F0E6] hover:text-[#9D6640]"
          >
            <Wrench className="h-3.5 w-3.5" />
            {messages.common.actions.autoFix}
          </Button>
        )}
        {onMobilePreviewToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobilePreviewToggle}
            className={`flex items-center gap-1 rounded-2xl text-xs ${
              mobilePreview
                ? `${WORKSPACE_CONTROL.accentTint}`
                : WORKSPACE_CONTROL.ghostButton
            }`}
          >
            {mobilePreview ? (
              <>
                <Monitor className="h-3.5 w-3.5" />
                {messages.common.actions.desktop}
              </>
            ) : (
              <>
                <Smartphone className="h-3.5 w-3.5" />
                {messages.common.actions.mobile}
              </>
            )}
          </Button>
        )}
        {lastSaved && <span className={`mr-2 text-[10px] ${WORKSPACE_TEXT.muted}`}>{formatSavedAt(messages, lastSaved)}</span>}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSaveTemplate}
          disabled={Boolean(isTemplateSaving)}
          className="flex items-center gap-1 rounded-2xl text-xs text-[#8E6C4C] hover:bg-[#F7EFE5] hover:text-[#6F5136]"
        >
          {isTemplateSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bookmark className="h-3.5 w-3.5" />}
          {messages.composeShared.favorite}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className={`flex items-center gap-1 rounded-2xl text-xs ${WORKSPACE_CONTROL.ghostButton}`}
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {messages.common.actions.save}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreview}
          className={`flex items-center gap-1 rounded-2xl text-xs ${WORKSPACE_CONTROL.ghostButton}`}
        >
          <Eye className="h-3.5 w-3.5" />
          {messages.common.actions.preview}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          className={`flex items-center gap-1 rounded-2xl text-xs ${WORKSPACE_CONTROL.ghostButton}`}
        >
          <Download className="h-3.5 w-3.5" />
          {messages.common.actions.export}
        </Button>
      </div>
    </div>
  );
}

function AiToolsDropdown({
  onVideoRender,
  onThumbnail,
  onScript,
}: {
  onVideoRender?: () => void;
  onThumbnail?: () => void;
  onScript?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1 rounded-2xl text-xs ${WORKSPACE_TEXT.accent} hover:text-[#CF705A]`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI 도구
      </Button>
      {open && (
        <div className={`absolute right-0 top-full z-50 mt-1 w-48 rounded-2xl border border-[rgb(214_199_184_/_0.55)] ${WORKSPACE_SURFACE.panelStrong} shadow-lg`}>
          {onVideoRender && (
            <button
              type="button"
              onClick={() => { onVideoRender(); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs transition-colors hover:bg-[rgb(246_238_230_/_0.5)] ${WORKSPACE_TEXT.body}`}
            >
              <Film className="h-3.5 w-3.5" />
              영상 렌더링
            </button>
          )}
          {onThumbnail && (
            <button
              type="button"
              onClick={() => { onThumbnail(); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs transition-colors hover:bg-[rgb(246_238_230_/_0.5)] ${WORKSPACE_TEXT.body}`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              썸네일 생성
            </button>
          )}
          {onScript && (
            <button
              type="button"
              onClick={() => { onScript(); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs transition-colors hover:bg-[rgb(246_238_230_/_0.5)] ${WORKSPACE_TEXT.body}`}
            >
              <FileText className="h-3.5 w-3.5" />
              마케팅 스크립트
            </button>
          )}
        </div>
      )}
    </div>
  );
}
