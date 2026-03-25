/** ImageUploadZone - 클릭으로 이미지 업로드 또는 프로젝트/워크스페이스 에셋 선택 */
"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, ImageIcon, Loader2, FolderOpen, Globe } from "lucide-react";
import { toast } from "sonner";
import { useCompose } from "../compose-context";
import { uploadAsset } from "@/lib/api-client";
import { AssetGrid } from "./asset-grid";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

interface ImageUploadZoneProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
  className?: string;
  placeholderText?: string;
  aspectRatio?: string;
  objectFit?: "cover" | "contain";
  imageFilter?: string;
}

export function ImageUploadZone({
  imageUrl,
  onImageChange,
  className = "",
  placeholderText = "클릭하여 이미지 업로드",
  aspectRatio,
  objectFit = "cover",
  imageFilter,
}: ImageUploadZoneProps) {
  const { projectId } = useCompose();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [assetView, setAssetView] = useState<"none" | "project" | "workspace">("none");

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    fileRef.current?.click();
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const result = await uploadAsset(projectId, file, { sourceType: "uploaded" });
        onImageChange(result.asset.filePath);
      } catch {
        toast.error("이미지를 올리지 못했어요. 다시 시도해주세요.");
      } finally {
        setUploading(false);
      }
    },
    [projectId, onImageChange],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (fileRef.current) fileRef.current.value = "";
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) handleFile(file);
    },
    [handleFile],
  );

  const handleAssetSelect = useCallback(
    (filePath: string) => {
      onImageChange(filePath);
      setAssetView("none");
    },
    [onImageChange],
  );

  if (assetView !== "none") {
    return (
      <div
        className={`overflow-hidden rounded-[24px] ${WORKSPACE_SURFACE.panelStrong} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[rgb(214_199_184_/_0.4)] px-3 py-2">
          <div className="flex gap-1">
            <button
              onClick={() => setAssetView("project")}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                assetView === "project"
                  ? "bg-[rgb(248_231_226_/_0.92)] text-[var(--takdi-accent-strong)]"
                  : `${WORKSPACE_TEXT.muted} hover:text-[var(--takdi-text)]`
              }`}
            >
              프로젝트 파일
            </button>
            <button
              onClick={() => setAssetView("workspace")}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                assetView === "workspace"
                  ? "bg-[rgb(248_231_226_/_0.92)] text-[var(--takdi-accent-strong)]"
                  : `${WORKSPACE_TEXT.muted} hover:text-[var(--takdi-text)]`
              }`}
            >
              전체 에셋
            </button>
          </div>
          <button
            onClick={() => setAssetView("none")}
            className={`text-xs ${WORKSPACE_TEXT.muted} hover:text-[var(--takdi-text)]`}
          >
            닫기
          </button>
        </div>
        <div className="max-h-[280px] overflow-y-auto p-2">
          <AssetGrid
            projectId={projectId}
            scope={assetView}
            onSelect={handleAssetSelect}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group/upload relative cursor-pointer overflow-hidden ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt=""
            className={`h-full w-full ${objectFit === "contain" ? "object-contain" : "object-cover"}`}
            style={imageFilter ? { filter: imageFilter } : undefined}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover/upload:opacity-100">
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${WORKSPACE_SURFACE.panelStrong}`}>
              <Upload className="h-3.5 w-3.5" />
              이미지 교체
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setAssetView("project"); }}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${WORKSPACE_SURFACE.panelStrong} hover:bg-white`}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              에셋 선택
            </button>
          </div>
        </>
      ) : (
        <div className="flex h-full min-h-[120px] flex-col items-center justify-center border-2 border-dashed border-[rgb(213_204_195_/_0.92)] bg-[rgb(248_244_239_/_0.92)] transition-colors hover:border-[rgb(236_197_183_/_0.95)] hover:bg-[rgb(248_231_226_/_0.5)]">
          {uploading ? (
            <Loader2 className={`h-8 w-8 animate-spin ${WORKSPACE_TEXT.accent}`} />
          ) : (
            <>
              <button
                onClick={handleClick}
                className={`flex flex-col items-center gap-2 rounded-2xl px-5 py-3 transition-colors ${WORKSPACE_CONTROL.accentTint} hover:bg-[rgb(246_223_216_/_0.9)]`}
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm font-medium">이미지 업로드</span>
              </button>
              <p className={`mt-2 text-[11px] ${WORKSPACE_TEXT.muted}`}>또는 파일을 끌어다 놓으세요</p>
              <div className="mt-2 flex gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); setAssetView("project"); }}
                  className={`flex items-center gap-1 rounded-2xl px-2.5 py-1.5 text-[11px] ${WORKSPACE_CONTROL.subtleButton}`}
                >
                  <FolderOpen className="h-3 w-3" />
                  프로젝트 파일
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setAssetView("workspace"); }}
                  className={`flex items-center gap-1 rounded-2xl px-2.5 py-1.5 text-[11px] ${WORKSPACE_CONTROL.subtleButton}`}
                >
                  <Globe className="h-3 w-3" />
                  전체 에셋
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {uploading && imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
