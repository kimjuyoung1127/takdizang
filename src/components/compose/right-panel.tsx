/** RightPanel - 우측 탭 패널 (속성 + AI 생성) */
"use client";

import { useState } from "react";
import { Sparkles, SlidersHorizontal } from "lucide-react";
import type { Block } from "@/types/blocks";
import { BlockPropertiesPanel } from "./block-properties-panel";
import { AiGenerateTab } from "./ai-generation-panel";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

interface RightPanelProps {
  block: Block | null;
  onUpdate: (id: string, patch: Partial<Block>) => void;
  projectId: string;
}

type RightPanelTab = "properties" | "ai-generate";

export function RightPanel({ block, onUpdate, projectId }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<RightPanelTab>("properties");

  return (
    <div className="flex w-80 flex-col border-l border-[rgb(212_196_181_/_0.55)] bg-[rgb(251_248_244_/_0.72)] text-[var(--takdi-text)] backdrop-blur-xl [&_input:not([type='checkbox']):not([type='color'])]:rounded-2xl [&_input:not([type='checkbox']):not([type='color'])]:border-[rgb(228_217_205_/_0.92)] [&_input:not([type='checkbox']):not([type='color'])]:bg-[rgb(255_255_255_/_0.9)] [&_input:not([type='checkbox']):not([type='color'])]:text-[var(--takdi-text)] [&_input:not([type='checkbox']):not([type='color'])]:outline-none [&_input:not([type='checkbox']):not([type='color'])]:focus:border-[var(--takdi-accent)] [&_select]:rounded-2xl [&_select]:border-[rgb(228_217_205_/_0.92)] [&_select]:bg-[rgb(255_255_255_/_0.9)] [&_select]:text-[var(--takdi-text)] [&_select]:outline-none [&_select]:focus:border-[var(--takdi-accent)]">
      {/* Tab header */}
      <div className="flex border-b border-[rgb(214_199_184_/_0.62)]">
        <button
          type="button"
          onClick={() => setActiveTab("properties")}
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors ${
            activeTab === "properties"
              ? `${WORKSPACE_TEXT.title} border-b-2 border-[var(--takdi-accent)]`
              : `${WORKSPACE_TEXT.muted} hover:text-[#4D433D]`
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          속성
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ai-generate")}
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors ${
            activeTab === "ai-generate"
              ? `${WORKSPACE_TEXT.accent} border-b-2 border-[var(--takdi-accent)]`
              : `${WORKSPACE_TEXT.muted} hover:text-[#4D433D]`
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI 생성
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "properties" && <BlockPropertiesPanel block={block} onUpdate={onUpdate} />}
      {activeTab === "ai-generate" && <AiGenerateTab projectId={projectId} />}
    </div>
  );
}
