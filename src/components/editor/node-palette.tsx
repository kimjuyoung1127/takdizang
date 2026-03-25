"use client";

import {
  Download,
  Eraser,
  Film,
  ImageIcon,
  Music,
  Scissors,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";
import {
  DEFAULT_MODE_CONFIG,
  MODE_NODE_CONFIG,
  NODE_TYPE_DESCS,
  NODE_TYPE_LABELS,
  type FlowNodeType,
} from "@/lib/constants";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

const NODE_ICONS: Record<FlowNodeType, React.ElementType> = {
  prompt: Sparkles,
  "generate-images": ImageIcon,
  bgm: Music,
  cuts: Scissors,
  render: Film,
  export: Download,
  "upload-image": Upload,
  "remove-bg": Eraser,
  "model-compose": UserRound,
};

const ALL_NODE_TYPES: FlowNodeType[] = [
  "upload-image",
  "prompt",
  "generate-images",
  "remove-bg",
  "model-compose",
  "bgm",
  "cuts",
  "render",
  "export",
];

interface NodePaletteProps {
  mode: string;
  disabled?: boolean;
}

export function NodePalette({ mode, disabled = false }: NodePaletteProps) {
  const config = MODE_NODE_CONFIG[mode] ?? DEFAULT_MODE_CONFIG;
  const allowed = new Set(config.allowedNodes);
  const visibleNodes = ALL_NODE_TYPES.filter((type) => allowed.has(type));

  function onDragStart(event: React.DragEvent, nodeType: string, label: string) {
    event.dataTransfer.setData("application/reactflow-type", nodeType);
    event.dataTransfer.setData("application/reactflow-label", label);
    event.dataTransfer.effectAllowed = "move";
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-[rgb(212_196_181_/_0.55)] bg-[rgb(239_231_220_/_0.62)] backdrop-blur-xl md:w-72">
      <div className="border-b border-[rgb(214_199_184_/_0.62)] px-5 py-5">
        <p className="takdi-kicker">Pipeline blocks</p>
        <h2 className={`mt-3 text-lg font-semibold tracking-[-0.03em] ${WORKSPACE_TEXT.title}`}>작업 단계</h2>
        <p className={`mt-2 text-sm leading-6 ${WORKSPACE_TEXT.muted}`}>
          {disabled ? "가이드형 모드에서는 구조를 확인만 할 수 있어요." : "필요한 단계를 캔버스로 드래그해서 추가하세요."}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {visibleNodes.map((type) => {
          const label = NODE_TYPE_LABELS[type];
          const desc = NODE_TYPE_DESCS[type];
          const Icon = NODE_ICONS[type];

          return (
            <div
              key={type}
              draggable={!disabled}
              onDragStart={(event) => {
                if (disabled) {
                  event.preventDefault();
                  return;
                }
                onDragStart(event, type, label);
              }}
              className={`group takdi-panel-strong flex items-start gap-3 rounded-[1.35rem] p-3.5 transition-all ${
                disabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-grab hover:-translate-y-0.5 hover:border-[rgb(234_196_178_/_0.88)] hover:bg-[rgb(255_255_255_/_0.96)] active:cursor-grabbing"
              }`}
              title={desc}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] ${WORKSPACE_CONTROL.accentTint}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${WORKSPACE_TEXT.title}`}>{label}</span>
                <span className={`mt-1 block text-[11px] leading-5 ${WORKSPACE_TEXT.muted} opacity-70 transition-opacity group-hover:opacity-100`}>
                  {desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
