"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ImageIcon, LayoutGrid, Music } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppImage } from "@/components/ui/app-image";
import { StatusBadge } from "@/components/ui/status-badge";
import { AssetUpload } from "./asset-upload";
import { getUserFacingNodeStatus } from "@/lib/editor-surface";
import { NODE_TYPE_LABELS, PRODUCT_CATEGORIES } from "@/lib/constants";
import { getProjectAssets, type AssetRecord } from "@/lib/api-client";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";
import type { NodeData } from "./node-canvas";
import type { ShortformProjectState } from "@/types";
import { cn } from "@/lib/utils";

interface UploadedAsset {
  id: string;
  filePath: string;
  type: "image" | "bgm";
  durationMs?: number | null;
  bpm?: number | null;
}

interface PropertiesPanelProps {
  mode: string;
  selectedNodeId?: string | null;
  selectedNodeData?: NodeData | null;
  onNodeDataChange?: (nodeId: string, patch: Partial<NodeData>) => void;
  projectId?: string;
  projectName?: string;
  nodeCount?: number;
  projectBriefText: string;
  onProjectBriefTextChange: (value: string) => void;
  allowBgm?: boolean;
  shortformState?: ShortformProjectState | null;
  onShortformStateChange?: (
    updater: ShortformProjectState | null | ((prev: ShortformProjectState | null) => ShortformProjectState | null),
  ) => void;
}

const ASSET_SELECTED =
  "border-[rgb(236_197_183_/_0.95)] ring-2 ring-[rgb(243_212_203_/_0.92)] shadow-[0_14px_28px_rgba(217,124,103,0.14)]";
const ASSET_IDLE =
  "border-[rgb(214_199_184_/_0.72)] hover:border-[rgb(236_197_183_/_0.84)]";
const CONTROL_PILL =
  `inline-flex items-center justify-center rounded-full ${WORKSPACE_CONTROL.subtleButton}`;

function EmptyPanel({ projectName, nodeCount }: { projectName?: string; nodeCount?: number }) {
  return (
    <aside className={`flex h-full w-full flex-col border-l md:w-[24rem] border-[rgb(212_196_181_/_0.55)] ${WORKSPACE_SURFACE.panelMuted} backdrop-blur-xl`}>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10">
        <div className="takdi-overlay-icon flex h-14 w-14 items-center justify-center rounded-3xl">
          <LayoutGrid className="h-7 w-7" />
        </div>
        <div className="text-center">
          <p className={`text-base font-semibold ${WORKSPACE_TEXT.title}`}>{projectName ?? "프로젝트"}</p>
          <p className={`mt-2 text-sm ${WORKSPACE_TEXT.body}`}>작업 단계 {nodeCount ?? 0}개</p>
          <p className={`mt-4 text-sm leading-6 ${WORKSPACE_TEXT.muted}`}>
            단계 카드를 선택하면 설정과 현재 상태를 확인할 수 있어요.
          </p>
        </div>
      </div>
    </aside>
  );
}

function sortCuts(state: ShortformProjectState) {
  return [...state.cuts].sort((left, right) => left.order - right.order);
}

export function PropertiesPanel({
  mode,
  selectedNodeId,
  selectedNodeData,
  onNodeDataChange,
  projectId,
  projectName,
  nodeCount,
  projectBriefText,
  onProjectBriefTextChange,
  allowBgm = true,
  shortformState,
  onShortformStateChange,
}: PropertiesPanelProps) {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [recentUploads, setRecentUploads] = useState<UploadedAsset[]>([]);

  const refreshAssets = useCallback(async () => {
    if (!projectId) return;
    try {
      const response = await getProjectAssets(projectId);
      setAssets(response.assets);
    } catch {
      // ignore asset refresh failure
    }
  }, [projectId]);

  useEffect(() => {
    void refreshAssets();
  }, [refreshAssets]);

  const handleUploadComplete = useCallback((asset: UploadedAsset) => {
    setRecentUploads((prev) => [asset, ...prev].slice(0, 8));
    void refreshAssets();

    if (asset.type === "image" && selectedNodeId && selectedNodeData?.nodeType === "upload-image") {
      onNodeDataChange?.(selectedNodeId, {
        uploadedAssetId: asset.id,
        uploadedFilePath: asset.filePath,
        status: "generated",
        previewImages: [asset.filePath],
      });
    }

    if (asset.type === "bgm" && mode === "shortform-video") {
      onShortformStateChange?.((current) => {
        if (!current) return current;
        if (selectedNodeId && selectedNodeData?.nodeType === "bgm") {
          onNodeDataChange?.(selectedNodeId, { filePath: asset.filePath, status: "generated" });
        }
        return {
          ...current,
          bgm: {
            assetId: asset.id,
            filePath: asset.filePath,
            durationMs: asset.durationMs ?? null,
            bpm: asset.bpm ?? null,
          },
        };
      });
    }
  }, [mode, onNodeDataChange, onShortformStateChange, refreshAssets, selectedNodeData?.nodeType, selectedNodeId]);

  const selectedNodeType = selectedNodeData?.nodeType;
  const statusInfo = getUserFacingNodeStatus(selectedNodeData ?? { label: "", nodeType: "prompt", status: "draft" });
  const title =
    selectedNodeData?.label ??
    (selectedNodeType ? NODE_TYPE_LABELS[selectedNodeType as keyof typeof NODE_TYPE_LABELS] : undefined) ??
    "작업 단계";
  const previewImages = Array.isArray(selectedNodeData?.previewImages)
    ? selectedNodeData.previewImages.filter((value): value is string => typeof value === "string")
    : [];
  const imageAssets = assets.filter((asset) => asset.mimeType?.startsWith("image/"));
  const bgmAssets = assets.filter((asset) => asset.mimeType?.startsWith("audio/"));
  const assignedBySlot = useMemo(
    () => new Map(shortformState?.sceneAssignments.map((assignment) => [assignment.imageSlot, assignment]) ?? []),
    [shortformState?.sceneAssignments],
  );
  const orderedCuts = useMemo(
    () => (shortformState ? sortCuts(shortformState) : []),
    [shortformState],
  );

  const updateShortform = useCallback(
    (updater: (current: ShortformProjectState) => ShortformProjectState) => {
      onShortformStateChange?.((current) => {
        if (!current) return current;
        const next = updater(current);
        if (selectedNodeId && selectedNodeType === "generate-images") {
          onNodeDataChange?.(selectedNodeId, {
            previewImages: next.sceneAssignments.map((item) => item.filePath),
            status: next.sceneAssignments.length > 0 ? "generated" : "draft",
          });
        }
        if (selectedNodeId && selectedNodeType === "cuts") {
          onNodeDataChange?.(selectedNodeId, { status: next.cuts.some((cut) => cut.enabled) ? "generated" : "draft" });
        }
        return next;
      });
    },
    [onNodeDataChange, onShortformStateChange, selectedNodeId, selectedNodeType],
  );

  if (!selectedNodeId || !selectedNodeData) {
    return <EmptyPanel projectName={projectName} nodeCount={nodeCount} />;
  }

  const settingsBody = (
    <div className="space-y-5">
      <div className={`rounded-3xl p-4 ${WORKSPACE_SURFACE.softInset}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${WORKSPACE_TEXT.title}`}>{title}</p>
            <p className={`mt-2 text-sm leading-6 ${WORKSPACE_TEXT.body}`}>현재 단계의 입력과 상태를 확인합니다.</p>
          </div>
          <StatusBadge status={selectedNodeData.status ?? "draft"} label={statusInfo.label} tone={statusInfo.tone} />
        </div>
      </div>

      {selectedNodeData.nodeType === "prompt" ? (
        <div className="space-y-4">
          <textarea
            value={projectBriefText}
            onChange={(event) => {
              const nextValue = event.target.value;
              onProjectBriefTextChange(nextValue);
              onNodeDataChange?.(selectedNodeId, { briefText: nextValue });
            }}
            rows={8}
            className={`w-full rounded-2xl px-4 py-3 text-sm leading-6 ${WORKSPACE_CONTROL.input}`}
            placeholder="제품명, 타깃, USP, CTA를 적으면 shortform 섹션으로 정리합니다."
          />
          <select
            value={(selectedNodeData.category as string) ?? ""}
            onChange={(event) => onNodeDataChange?.(selectedNodeId, { category: event.target.value || undefined })}
            className={`h-11 w-full rounded-2xl px-3 text-sm ${WORKSPACE_CONTROL.input}`}
          >
            <option value="">자동</option>
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {mode === "shortform-video" && shortformState && selectedNodeData.nodeType === "generate-images" ? (
        <div className="space-y-4">
          <AssetUpload projectId={projectId ?? ""} allowImages allowBgm={false} onUploadComplete={handleUploadComplete} />
          <div className={`rounded-2xl p-4 ${WORKSPACE_SURFACE.softInset}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${WORKSPACE_TEXT.muted}`}>레퍼런스 이미지</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {imageAssets.map((asset) => {
                const active = shortformState.referenceAssetIds.includes(asset.id);
                return (
                  <button
                    key={`reference-${asset.id}`}
                    type="button"
                    onClick={() =>
                      updateShortform((current) => {
                        const next = new Set(current.referenceAssetIds);
                        if (next.has(asset.id)) next.delete(asset.id);
                        else if (next.size < 3) next.add(asset.id);
                        return { ...current, referenceAssetIds: Array.from(next) };
                      })
                    }
                    className={cn("overflow-hidden rounded-2xl border transition-all", active ? ASSET_SELECTED : ASSET_IDLE)}
                  >
                    <AppImage src={asset.previewPath ?? asset.filePath} alt={asset.filePath} width={96} height={96} className="h-20 w-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
          {shortformState.sections.map((section) => (
            <div key={section.imageSlot} className={`rounded-2xl p-4 ${WORKSPACE_SURFACE.softInset}`}>
              <p className={`text-sm font-semibold ${WORKSPACE_TEXT.title}`}>{section.headline}</p>
              <p className={`mt-1 text-xs ${WORKSPACE_TEXT.body}`}>{section.body}</p>
              {assignedBySlot.get(section.imageSlot)?.filePath ? (
                <AppImage
                  src={assignedBySlot.get(section.imageSlot)!.filePath}
                  alt={section.headline}
                  width={240}
                  height={160}
                  className="mt-3 h-28 w-full rounded-2xl object-cover"
                />
              ) : null}
              <div className="mt-3 grid grid-cols-3 gap-3">
                {imageAssets.map((asset) => (
                  <button
                    key={`${section.imageSlot}-${asset.id}`}
                    type="button"
                    onClick={() =>
                      updateShortform((current) => ({
                        ...current,
                        generationMode: "demo",
                        sceneAssignments: [
                          ...current.sceneAssignments.filter((item) => item.imageSlot !== section.imageSlot),
                          {
                            imageSlot: section.imageSlot,
                            assetId: asset.id,
                            filePath: asset.filePath,
                            source: current.referenceAssetIds.includes(asset.id) ? "reference" : "manual",
                          },
                        ],
                      }))
                    }
                    className={cn(
                      "overflow-hidden rounded-2xl border transition-all",
                      assignedBySlot.get(section.imageSlot)?.assetId === asset.id ? ASSET_SELECTED : ASSET_IDLE,
                    )}
                  >
                    <AppImage src={asset.previewPath ?? asset.filePath} alt={asset.filePath} width={96} height={96} className="h-20 w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {mode === "shortform-video" && shortformState && selectedNodeData.nodeType === "bgm" ? (
        <div className="space-y-4">
          <AssetUpload projectId={projectId ?? ""} allowImages={false} allowBgm onUploadComplete={handleUploadComplete} />
          {shortformState.bgm ? (
            <div className={`rounded-2xl p-4 ${WORKSPACE_SURFACE.softInset}`}>
              <p className={`text-sm font-semibold ${WORKSPACE_TEXT.title}`}>현재 BGM</p>
              <p className={`mt-2 text-sm ${WORKSPACE_TEXT.body}`}>{shortformState.bgm.filePath.split("/").pop()}</p>
            </div>
          ) : null}
          {bgmAssets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() =>
                updateShortform((current) => ({
                  ...current,
                  bgm: { assetId: asset.id, filePath: asset.filePath, durationMs: current.bgm?.durationMs ?? null, bpm: current.bgm?.bpm ?? null },
                }))
              }
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border px-4 py-3 transition-all",
                shortformState.bgm?.assetId === asset.id
                  ? `bg-[rgb(248_231_226_/_0.65)] ${ASSET_SELECTED}`
                  : `bg-white/82 ${ASSET_IDLE}`,
              )}
            >
              <span className={`truncate text-sm ${WORKSPACE_TEXT.title}`}>{asset.filePath.split("/").pop()}</span>
              <Music className={`h-4 w-4 ${WORKSPACE_TEXT.muted}`} />
            </button>
          ))}
        </div>
      ) : null}

      {mode === "shortform-video" && shortformState && selectedNodeData.nodeType === "cuts" ? (
        <div className="space-y-4">
          {orderedCuts.map((cut, index) => (
            <div key={cut.imageSlot} className={`rounded-2xl p-4 ${WORKSPACE_SURFACE.softInset}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-sm font-semibold ${WORKSPACE_TEXT.title}`}>{shortformState.sections.find((item) => item.imageSlot === cut.imageSlot)?.headline ?? cut.imageSlot}</p>
                  <p className={`mt-1 text-xs ${WORKSPACE_TEXT.muted}`}>장면 {index + 1}</p>
                </div>
                <label className={`flex items-center gap-2 text-xs ${WORKSPACE_TEXT.body}`}>
                  <input
                    type="checkbox"
                    checked={cut.enabled}
                    onChange={(event) =>
                      updateShortform((current) => ({
                        ...current,
                        cuts: sortCuts(current).map((item) => item.imageSlot === cut.imageSlot ? { ...item, enabled: event.target.checked } : item),
                      }))
                    }
                  />
                  사용
                </label>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={() => index > 0 && updateShortform((current) => {
                  const items = sortCuts(current);
                  [items[index - 1], items[index]] = [items[index], items[index - 1]];
                  return { ...current, cuts: items.map((item, order) => ({ ...item, order })) };
                })} className={`${CONTROL_PILL} h-9 w-9 p-0`}><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => index < orderedCuts.length - 1 && updateShortform((current) => {
                  const items = sortCuts(current);
                  [items[index + 1], items[index]] = [items[index], items[index + 1]];
                  return { ...current, cuts: items.map((item, order) => ({ ...item, order })) };
                })} className={`${CONTROL_PILL} h-9 w-9 p-0`}><ArrowDown className="h-3.5 w-3.5" /></button>
                <select
                  value={String(cut.durationMs)}
                  onChange={(event) =>
                    updateShortform((current) => ({
                      ...current,
                      cuts: sortCuts(current).map((item) => item.imageSlot === cut.imageSlot ? { ...item, durationMs: Number(event.target.value) } : item),
                    }))
                  }
                  className={`ml-auto h-10 rounded-2xl px-3 text-sm ${WORKSPACE_CONTROL.input}`}
                >
                  {[2000, 3000, 4000, 5000, 6000].map((duration) => (
                    <option key={duration} value={duration}>{duration / 1000}초</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {previewImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {previewImages.map((imagePath) => (
            <AppImage key={imagePath} src={imagePath} alt={title} width={140} height={140} className="h-32 w-full rounded-2xl border border-[rgb(214_199_184_/_0.72)] object-cover shadow-[0_12px_26px_rgba(55,40,30,0.08)]" />
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <aside className={`flex h-full w-full flex-col border-l md:w-[24rem] border-[rgb(212_196_181_/_0.55)] ${WORKSPACE_SURFACE.panelMuted} backdrop-blur-xl`}>
      <div className="border-b border-[rgb(214_199_184_/_0.62)] px-6 py-5">
        <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${WORKSPACE_TEXT.muted}`}>
          <LayoutGrid className="h-3.5 w-3.5" />
          단계 설정
        </div>
        <h2 className={`mt-3 text-lg font-semibold ${WORKSPACE_TEXT.title}`}>{title}</h2>
        <p className={`mt-1 text-sm ${WORKSPACE_TEXT.body}`}>{projectName ?? "프로젝트"}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {(
          <Tabs defaultValue="settings" className="flex-1">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl border border-[rgb(214_199_184_/_0.82)] bg-[rgb(248_241_232_/_0.82)] p-1">
              <TabsTrigger value="settings" className="gap-2 rounded-2xl text-xs data-[state=active]:border-[rgb(241_200_190_/_0.95)] data-[state=active]:bg-[rgb(248_231_226_/_0.96)] data-[state=active]:text-[var(--takdi-accent-strong)]"><LayoutGrid className="h-3.5 w-3.5" />작업 내용</TabsTrigger>
              <TabsTrigger value="assets" className="gap-2 rounded-2xl text-xs data-[state=active]:border-[rgb(241_200_190_/_0.95)] data-[state=active]:bg-[rgb(248_231_226_/_0.96)] data-[state=active]:text-[var(--takdi-accent-strong)]"><ImageIcon className="h-3.5 w-3.5" />파일</TabsTrigger>
            </TabsList>
            <TabsContent value="settings" className="mt-5">{settingsBody}</TabsContent>
            <TabsContent value="assets" className="mt-5 space-y-4">
              {projectId ? (
                <>
                  <AssetUpload projectId={projectId} allowImages allowBgm={allowBgm} onUploadComplete={handleUploadComplete} />
                  {(recentUploads.length > 0 ? recentUploads : assets.map((asset) => ({
                    id: asset.id,
                    filePath: asset.filePath,
                    type: asset.mimeType?.startsWith("audio/") ? ("bgm" as const) : ("image" as const),
                  }))).map((asset) => (
                    <div key={asset.id} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm ${WORKSPACE_SURFACE.inset} ${WORKSPACE_TEXT.body}`}>
                      {asset.type === "image" ? <ImageIcon className="h-4 w-4 text-[var(--takdi-text-subtle)]" /> : <Music className="h-4 w-4 text-[var(--takdi-text-subtle)]" />}
                      <span className="truncate">{asset.filePath.split("/").pop() ?? asset.filePath}</span>
                    </div>
                  ))}
                </>
              ) : (
                <p className={`text-sm leading-6 ${WORKSPACE_TEXT.muted}`}>프로젝트를 불러온 뒤 파일을 올릴 수 있어요.</p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </aside>
  );
}
