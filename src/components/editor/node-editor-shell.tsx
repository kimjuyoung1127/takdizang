"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Edge, Node } from "@xyflow/react";
import { AlertTriangle, Home, LayoutPanelTop, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { FloatingToolbar } from "./floating-toolbar";
import { NodeCanvas, type NodeCanvasHandle, type NodeData } from "./node-canvas";
import { NodePalette } from "./node-palette";
import { PropertiesPanel } from "./properties-panel";
import { Button } from "@/components/ui/button";
import { MODE_NODE_CONFIG } from "@/lib/constants";
import {
  pollExport,
  startExport,
  updateContent,
  type JobPollResponse,
} from "@/lib/api-client";
import {
  repairEditorGraph,
  validateEditorGraph,
} from "@/lib/editor-graph";
import {
  getModeSurfaceConfig,
  isGuidedMode,
} from "@/lib/editor-surface";
import {
  applyShortformRenderArtifacts,
  hasSceneAssignmentsForAllSections,
  serializeProjectContent,
  upsertShortformSections,
} from "@/lib/shortform-state";
import { executePipeline } from "@/lib/pipeline-executor";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";
import type { ShortformProjectState } from "@/types";

interface NodeEditorShellProps {
  projectId: string;
  projectName: string;
  mode: string;
  initialBriefText: string;
  initialGraph?: {
    nodes: Node[];
    edges: Edge[];
  } | null;
  initialShortformState?: ShortformProjectState | null;
}

type PipelineStep = "idle" | "running" | "generating" | "imaging" | "done" | "error";

type CanvasSnapshot = {
  nodes: Node[];
  edges: Edge[];
};

const EMPTY_SNAPSHOT: CanvasSnapshot = { nodes: [], edges: [] };

function GuidedGraphRecoveryPanel({
  mode,
  issueMessages,
  repairStepLabels,
  onRepair,
}: {
  mode: string;
  issueMessages: string[];
  repairStepLabels: string[];
  onRepair: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center px-6 pb-6 pt-28">
      <div className={`w-full max-w-3xl rounded-[32px] p-8 ${WORKSPACE_SURFACE.panelStrong}`}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[rgb(230_203_177_/_0.9)] bg-[rgb(247_239_229_/_0.96)] text-[rgb(184_121_78)]">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[rgb(184_121_78)]">구조 복구 필요</p>
            <h2 className={`mt-2 text-2xl font-semibold ${WORKSPACE_TEXT.title}`}>
              {mode} 모드의 저장된 그래프가 가이드형 규칙과 맞지 않습니다.
            </h2>
            <p className={`mt-3 text-sm leading-6 ${WORKSPACE_TEXT.body}`}>
              이 모드는 단계형 자동화 편집기입니다. 단계 중복이나 임의 연결이 포함되면 결과가 불명확해질 수 있어
              편집과 실행을 잠시 막고 복구를 먼저 안내합니다.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className={`rounded-3xl p-5 ${WORKSPACE_SURFACE.softInset}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${WORKSPACE_TEXT.muted}`}>감지된 문제</p>
            <ul className={`mt-4 space-y-3 text-sm leading-6 ${WORKSPACE_TEXT.body}`}>
              {issueMessages.map((message, index) => (
                <li key={`${index}-${message}`}>{message}</li>
              ))}
            </ul>
          </div>

          <div className={`rounded-3xl p-5 ${WORKSPACE_SURFACE.softInset}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${WORKSPACE_TEXT.muted}`}>복구 후 구조</p>
            <ol className={`mt-4 space-y-2 text-sm ${WORKSPACE_TEXT.body}`}>
              {repairStepLabels.map((label, index) => (
                <li key={label}>
                  {index + 1}. {label}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className={`mt-8 flex items-center justify-between gap-4 rounded-3xl px-5 py-4 ${WORKSPACE_CONTROL.accentTint}`}>
          <p className="text-sm text-[rgb(140_90_75)]">기본 구조로 되돌리되, 각 단계의 첫 번째 유효 데이터는 최대한 보존합니다.</p>
          <Button type="button" onClick={onRepair} className={`gap-2 rounded-full ${WORKSPACE_CONTROL.accentButton}`}>
            <RefreshCcw className="h-4 w-4" />
            기본 구조로 복구
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NodeEditorShell({
  projectId,
  projectName,
  mode,
  initialBriefText,
  initialGraph,
  initialShortformState,
}: NodeEditorShellProps) {
  const guidedMode = isGuidedMode(mode);

  const [name, setName] = useState(projectName);
  const [editingName, setEditingName] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>("idle");
  const [globalRatio, setGlobalRatio] = useState("9:16");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [projectBriefText, setProjectBriefText] = useState(initialBriefText);
  const [canvasSnapshot, setCanvasSnapshot] = useState<CanvasSnapshot>(initialGraph ?? EMPTY_SNAPSHOT);
  const [shortformState, setShortformState] = useState<ShortformProjectState | null>(initialShortformState ?? null);

  const canvasRef = useRef<NodeCanvasHandle>(null);
  const canvasStateRef = useRef<CanvasSnapshot>(initialGraph ?? EMPTY_SNAPSHOT);
  const briefTextRef = useRef(initialBriefText);
  const abortRef = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedShortformRef = useRef(false);

  const graphValidation = useMemo(
    () => validateEditorGraph(mode, canvasSnapshot.nodes, canvasSnapshot.edges),
    [canvasSnapshot.edges, canvasSnapshot.nodes, mode],
  );
  const guidedReadOnlyStructure = guidedMode;
  const invalidGuidedGraph = guidedMode && !graphValidation.valid;
  const repairStepLabels = (graphValidation.repairedSnapshot?.nodes ?? []).map(
    (node) => ((node.data as NodeData).label ?? ""),
  );

  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId) {
      return null;
    }
    const selectedNode = canvasSnapshot.nodes.find((node) => node.id === selectedNodeId);
    return (selectedNode?.data as NodeData | undefined) ?? null;
  }, [canvasSnapshot.nodes, selectedNodeId]);

  const setProjectBriefTextWithRef = useCallback((nextValue: string) => {
    briefTextRef.current = nextValue;
    setProjectBriefText(nextValue);
  }, []);

  const syncProjectState = useCallback(async (overrides?: { name?: string }) => {
    const payload: {
      name?: string;
      content: string;
      briefText: string;
    } = {
      content: serializeProjectContent({
        nodes: canvasStateRef.current.nodes,
        edges: canvasStateRef.current.edges,
        shortform: mode === "shortform-video" ? shortformState : null,
      }),
      briefText: briefTextRef.current,
    };

    if (overrides?.name) {
      payload.name = overrides.name;
    }

    await updateContent(projectId, payload);
    setLastSaved(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
  }, [mode, projectId, shortformState]);

  const handleStateChange = useCallback((nodes: Node[], edges: Edge[]) => {
    const nextSnapshot = { nodes, edges };
    canvasStateRef.current = nextSnapshot;
    setCanvasSnapshot(nextSnapshot);

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    const nextValidation = validateEditorGraph(mode, nodes, edges);
    if (guidedMode && !nextValidation.valid) {
      return;
    }

    autoSaveTimer.current = setTimeout(async () => {
      try {
        const validation = validateEditorGraph(mode, canvasStateRef.current.nodes, canvasStateRef.current.edges);
        if (guidedMode && !validation.valid) {
          return;
        }
        await syncProjectState();
      } catch {
        // Best-effort auto-save.
      }
    }, 30_000);
  }, [guidedMode, mode, syncProjectState]);

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleNodeDataChange = useCallback((nodeId: string, patch: Partial<NodeData>) => {
    canvasRef.current?.updateNodeData(nodeId, patch);
  }, []);

  const handleShortformStateChange = useCallback(
    (
      updater:
        | ShortformProjectState
        | null
        | ((prev: ShortformProjectState | null) => ShortformProjectState | null),
    ) => {
      setShortformState((current) => (typeof updater === "function" ? updater(current) : updater));
    },
    [],
  );

  useEffect(() => {
    if (mode !== "shortform-video") {
      return;
    }
    if (!mountedShortformRef.current) {
      mountedShortformRef.current = true;
      return;
    }
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await syncProjectState();
      } catch {
        // Best-effort auto-save.
      }
    }, 30_000);
  }, [mode, shortformState, syncProjectState]);

  const pollUntilDone = useCallback(async (pollFn: () => Promise<JobPollResponse>, label: string) => {
    const interval = 2000;
    const maxPolls = 150;

    for (let index = 0; index < maxPolls; index += 1) {
      if (abortRef.current) {
        throw new Error("중단");
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
      const result = await pollFn();
      if (result.job.status === "done") {
        return result;
      }
      if (result.job.status === "failed") {
        throw new Error(result.job.error ?? `${label} 실패`);
      }
    }

    throw new Error(`${label} 시간 초과`);
  }, []);

  const ensureRunnableGraph = useCallback(() => {
    const validation = validateEditorGraph(mode, canvasStateRef.current.nodes, canvasStateRef.current.edges);
    if (guidedMode && !validation.valid) {
      toast.error("저장된 구조에 문제가 있어 먼저 복구가 필요합니다.");
      return false;
    }
    return true;
  }, [guidedMode, mode]);

  const handleRunAll = useCallback(async () => {
    if (pipelineStep === "running") {
      return;
    }
    if (!ensureRunnableGraph()) {
      return;
    }

    abortRef.current = false;
    setPipelineStep("running");
    canvasRef.current?.resetEdgeGlow();

    try {
      await syncProjectState();

      const { nodes, edges } = canvasStateRef.current;
      const uploadNode = nodes.find((node) => (node.data as NodeData).nodeType === "upload-image");
      const uploadedAssetId = (uploadNode?.data as NodeData | undefined)?.uploadedAssetId as string | undefined;
      const promptNode = nodes.find((node) => (node.data as NodeData).nodeType === "prompt");
      const category = (promptNode?.data as NodeData | undefined)?.category as string | undefined;
      const manualSceneReady = mode === "shortform-video" && hasSceneAssignmentsForAllSections(shortformState);

      await executePipeline(
        projectId,
        nodes,
        edges,
        {
          onStepStart: (nodeId) => {
            canvasRef.current?.updateNodeData(nodeId, { status: "generating" });
          },
          onStepDone: (nodeId, result) => {
            const node = nodes.find((candidate) => candidate.id === nodeId);
            const nodeType = (node?.data as NodeData | undefined)?.nodeType;
            const patch: Partial<NodeData> = { status: "generated" };

            if (nodeType === "prompt") {
              patch.previewText = briefTextRef.current.trim().slice(0, 90);
              if (mode === "shortform-video") {
                const project = (result as Record<string, unknown>).project as { content?: string } | undefined;
                if (project?.content) {
                  try {
                    const parsed = (typeof project.content === "string" ? JSON.parse(project.content) : project.content) as { sections?: ShortformProjectState["sections"] };
                    const sections = Array.isArray(parsed?.sections) ? parsed.sections : [];
                    if (sections.length > 0) {
                      setShortformState((current) => upsertShortformSections(current, sections));
                    }
                  } catch {
                    // Best-effort hydrate from generation response.
                  }
                }
              }
            }

            if (nodeType === "generate-images" || nodeType === "remove-bg" || nodeType === "model-compose") {
              const assets = (result as Record<string, unknown>).assets as
                | { id?: string; filePath?: string; imageSlot?: string; sourceType?: string }[]
                | undefined;
              if (assets?.length) {
                patch.previewImages = assets
                  .map((asset) => asset.filePath)
                  .filter((path): path is string => Boolean(path));
              }

              if (nodeType === "generate-images" && mode === "shortform-video" && assets?.length) {
                setShortformState((current) => {
                  if (!current) {
                    return current;
                  }

                  const replacements = new Map(
                    assets
                      .filter(
                        (
                          asset,
                        ): asset is { id: string; filePath: string; imageSlot: string; sourceType?: string } =>
                          Boolean(asset.id && asset.filePath && asset.imageSlot),
                      )
                      .map((asset) => [
                        asset.imageSlot,
                        {
                          imageSlot: asset.imageSlot,
                          assetId: asset.id,
                          filePath: asset.filePath,
                          source: (asset.sourceType === "generated" ? "generated" : "manual") as "generated" | "manual",
                        },
                      ]),
                  );

                  if (replacements.size === 0) {
                    return current;
                  }

                  return {
                    ...current,
                    generationMode: "ai",
                    sceneAssignments: [
                      ...current.sceneAssignments.filter((assignment) => !replacements.has(assignment.imageSlot)),
                      ...Array.from(replacements.values()),
                    ],
                  };
                });
              }
            }

            if (nodeType === "export") {
              patch.status = "exported";
            }

            if (nodeType === "render" && mode === "shortform-video") {
              const artifacts = (result as Record<string, unknown>).artifacts as
                | { id?: string; filePath?: string; metadata?: string | null }[]
                | undefined;
              if (artifacts?.length) {
                setShortformState((current) => {
                  const normalized = artifacts.flatMap((artifact) => {
                    if (!artifact.id || !artifact.filePath) {
                      return [];
                    }

                    let templateKey: "9:16" | "1:1" | "16:9" | null = null;
                    if (artifact.metadata) {
                      try {
                        const parsed = (typeof artifact.metadata === "string" ? JSON.parse(artifact.metadata) : artifact.metadata) as { templateKey?: string };
                        if (parsed.templateKey === "9:16" || parsed.templateKey === "1:1" || parsed.templateKey === "16:9") {
                          templateKey = parsed.templateKey;
                        }
                      } catch {
                        // ignore malformed metadata
                      }
                    }

                    return templateKey
                      ? [{ templateKey, artifactId: artifact.id, filePath: artifact.filePath }]
                      : [];
                  });

                  return applyShortformRenderArtifacts(current, normalized);
                });
              }
            }

            canvasRef.current?.updateNodeData(nodeId, patch);
          },
          onStepError: (nodeId) => {
            canvasRef.current?.updateNodeData(nodeId, { status: "failed" });
          },
          onSkip: () => {},
          onEdgeActivate: (edgeId) => canvasRef.current?.setEdgeGlow(edgeId, "active"),
          onEdgeDone: (edgeId) => canvasRef.current?.setEdgeGlow(edgeId, "done"),
          shouldAbort: () => abortRef.current,
          addLog: () => {},
        },
        {
          ratio: globalRatio,
          uploadedAssetId,
          category,
          manualSceneReady,
          referenceAssetIds: shortformState?.referenceAssetIds,
        },
      );

      if (!abortRef.current) {
        await syncProjectState();
        setPipelineStep("done");
        toast.success("작업이 완료되었습니다. 미리보기 또는 내보내기를 진행하세요.");
      }
    } catch (error) {
      if (!abortRef.current) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류";
        setPipelineStep("error");
        toast.error(`실행 실패: ${message}`);
      }
    }
  }, [ensureRunnableGraph, globalRatio, mode, pipelineStep, projectId, shortformState, syncProjectState]);

  const handleStop = useCallback(() => {
    abortRef.current = true;
    setPipelineStep("idle");
    canvasRef.current?.resetEdgeGlow();
    toast("현재 작업을 중단했습니다.");
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) {
      return;
    }
    if (!ensureRunnableGraph()) {
      return;
    }

    setSaving(true);
    try {
      await syncProjectState();
      toast.success("저장되었습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "저장 실패";
      toast.error(`저장 실패: ${message}`);
    } finally {
      setSaving(false);
    }
  }, [ensureRunnableGraph, saving, syncProjectState]);

  const handlePreview = useCallback(() => {
    if (!ensureRunnableGraph()) {
      return;
    }

    try {
      window.open(`/projects/${projectId}/preview?templateKey=${encodeURIComponent(globalRatio)}`, "_blank");
    } catch (error) {
      const message = error instanceof Error ? error.message : "미리보기 준비 실패";
      toast.error(`미리보기 실패: ${message}`);
    }
  }, [ensureRunnableGraph, globalRatio, projectId]);

  const handleExport = useCallback(async () => {
    if (exporting) {
      return;
    }
    if (!ensureRunnableGraph()) {
      return;
    }

    setExporting(true);
    try {
      await syncProjectState();
      canvasRef.current?.updateNodesByType("export", { status: "generating" });
      const job = await startExport(projectId);
      await pollUntilDone(() => pollExport(projectId, job.jobId), "내보내기");
      canvasRef.current?.updateNodesByType("export", { status: "exported" });
      await syncProjectState();
      toast.success("내보내기가 완료되었습니다.");
    } catch (error) {
      canvasRef.current?.updateNodesByType("export", { status: "failed" });
      const message = error instanceof Error ? error.message : "내보내기 실패";
      toast.error(`내보내기 실패: ${message}`);
    } finally {
      setExporting(false);
    }
  }, [ensureRunnableGraph, exporting, pollUntilDone, projectId, syncProjectState]);

  const handleNameBlur = useCallback(async () => {
    setEditingName(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === projectName) {
      setName(projectName);
      return;
    }

    try {
      await syncProjectState({ name: trimmed });
      toast.success("프로젝트 이름이 변경되었습니다.");
    } catch {
      setName(projectName);
      toast.error("이름 변경에 실패했습니다.");
    }
  }, [name, projectName, syncProjectState]);

  const handleRecoverGraph = useCallback(async () => {
    const repairedSnapshot = repairEditorGraph(mode, canvasStateRef.current.nodes, canvasStateRef.current.edges);
    canvasStateRef.current = repairedSnapshot;
    setCanvasSnapshot(repairedSnapshot);
    canvasRef.current?.replaceGraph(repairedSnapshot);
    setSelectedNodeId(repairedSnapshot.nodes[0]?.id ?? null);

    try {
      await syncProjectState();
      toast.success("가이드형 기본 구조로 복구했습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "복구 저장 실패";
      toast.error(`복구 저장 실패: ${message}`);
    }
  }, [mode, syncProjectState]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable) {
        return;
      }

      if (event.ctrlKey && event.key === "s") {
        event.preventDefault();
        handleSave();
      } else if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        handleRunAll();
      } else if (event.key === "Escape" && pipelineStep === "running") {
        event.preventDefault();
        handleStop();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRunAll, handleSave, handleStop, pipelineStep]);

  const handleRestrictionViolation = useCallback((message: string) => {
    toast.error(message);
  }, []);

  const isRunning = pipelineStep === "running" || pipelineStep === "generating" || pipelineStep === "imaging";
  const issueMessages = graphValidation.issues.map((issue) => issue.message);

  return (
    <div className={`flex h-screen ${WORKSPACE_SURFACE.page}`}>
      <NodePalette mode={mode} disabled={guidedReadOnlyStructure} />

      <div className="relative flex-1">
        <div className="absolute left-4 top-6 z-20">
          <div className="flex flex-col items-start gap-2">
            {editingName ? (
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                  if (event.key === "Escape") {
                    setName(projectName);
                    setEditingName(false);
                  }
                }}
                autoFocus
                className={`w-[min(320px,40vw)] rounded-2xl px-3 py-2 text-sm font-semibold ${WORKSPACE_CONTROL.input}`}
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className={`max-w-[min(320px,40vw)] truncate rounded-2xl px-3 py-2 text-sm font-semibold transition hover:bg-white ${WORKSPACE_SURFACE.panelStrong} ${WORKSPACE_TEXT.body}`}
                title="프로젝트 이름 변경"
              >
                {name}
              </button>
            )}

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition hover:bg-white ${WORKSPACE_SURFACE.panelStrong} ${WORKSPACE_TEXT.body}`}
                title="홈으로 이동"
              >
                <Home className="h-4 w-4" />
                홈
              </Link>

              <Link
                href={`/projects/${projectId}/compose`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition hover:bg-white ${WORKSPACE_SURFACE.panelStrong} ${WORKSPACE_TEXT.body}`}
                title="상세페이지 편집기로 이동"
              >
                <LayoutPanelTop className="h-4 w-4" />
                상세페이지
              </Link>
            </div>
          </div>
        </div>

        <FloatingToolbar
          mode={mode}
          ratio={globalRatio}
          helperText={
            guidedReadOnlyStructure && !invalidGuidedGraph
              ? "가이드형 모드입니다.\n이 모드는 단계당 1개만 사용됩니다."
              : null
          }
          onRatioChange={setGlobalRatio}
          onRunAll={handleRunAll}
          onStop={handleStop}
          onSave={handleSave}
          onPreview={handlePreview}
          onExport={handleExport}
          runningState={{
            isRunning,
            isSaving: saving,
            isExporting: exporting,
          }}
          pipelineStep={pipelineStep}
          lastSaved={lastSaved}
          actionsDisabled={invalidGuidedGraph}
        />

        <NodeCanvas
          ref={canvasRef}
          mode={mode}
          initialSnapshot={initialGraph ?? undefined}
          className="h-full w-full"
          readOnlyStructure={guidedReadOnlyStructure || invalidGuidedGraph}
          canInsertNodes={!guidedReadOnlyStructure && !guidedMode}
          canDuplicateNodes={!guidedReadOnlyStructure && !guidedMode}
          canEditEdges={!guidedReadOnlyStructure && !guidedMode}
          onRestrictionViolation={handleRestrictionViolation}
          onStateChange={handleStateChange}
          onNodeSelect={(nodeId) => handleNodeSelect(nodeId)}
        />

        {invalidGuidedGraph ? (
          <GuidedGraphRecoveryPanel
            mode={mode}
            issueMessages={issueMessages}
            repairStepLabels={repairStepLabels}
            onRepair={handleRecoverGraph}
          />
        ) : null}
      </div>

      <PropertiesPanel
        mode={mode}
        selectedNodeId={invalidGuidedGraph ? null : selectedNodeId}
        selectedNodeData={invalidGuidedGraph ? null : selectedNodeData}
        onNodeDataChange={handleNodeDataChange}
        projectId={projectId}
        projectName={name}
        nodeCount={canvasSnapshot.nodes.length}
        projectBriefText={projectBriefText}
        onProjectBriefTextChange={setProjectBriefTextWithRef}
        allowBgm={(MODE_NODE_CONFIG[mode] ?? MODE_NODE_CONFIG.freeform).allowedNodes.includes("bgm")}
        shortformState={shortformState}
        onShortformStateChange={handleShortformStateChange}
      />
    </div>
  );
}
