/** RightPanel - 우측 패널 탭 래퍼 (속성 | AI 허브) */
"use client";

import type { Block } from "@/types/blocks";
import { BlockPropertiesPanel } from "./block-properties-panel";
import { AIHubPanel } from "./ai-hub-panel";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

type RightTab = "properties" | "ai-hub";

interface RightPanelProps {
  activeTab: RightTab;
  onTabChange: (tab: RightTab) => void;
  block: Block | null;
  onUpdate: (id: string, patch: Partial<Block>) => void;
  projectId: string;
  projectStatus: string;
}

export function RightPanel({
  activeTab,
  onTabChange,
  block,
  onUpdate,
  projectId,
  projectStatus,
}: RightPanelProps) {
  return (
    <div className="flex w-80 flex-col">
      {/* Tab header */}
      <div className={`flex border-b border-l border-[rgb(212_196_181_/_0.55)] bg-[rgb(251_248_244_/_0.72)] backdrop-blur-xl`}>
        <button
          type="button"
          onClick={() => onTabChange("properties")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
            activeTab === "properties"
              ? `${WORKSPACE_TEXT.accent} border-b-2 border-[var(--takdi-accent)]`
              : `${WORKSPACE_TEXT.muted} hover:text-[var(--takdi-text)]`
          }`}
        >
          속성
        </button>
        <button
          type="button"
          onClick={() => onTabChange("ai-hub")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
            activeTab === "ai-hub"
              ? `${WORKSPACE_TEXT.accent} border-b-2 border-[var(--takdi-accent)]`
              : `${WORKSPACE_TEXT.muted} hover:text-[var(--takdi-text)]`
          }`}
        >
          AI 허브
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "properties" ? (
        <BlockPropertiesPanel block={block} onUpdate={onUpdate} />
      ) : (
        <AIHubPanel projectId={projectId} projectStatus={projectStatus} />
      )}
    </div>
  );
}
