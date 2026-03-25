/** VideoUploadZone - 영상/GIF 업로드 영역 */
"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCompose } from "../compose-context";
import { uploadAsset } from "@/lib/api-client";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

interface VideoUploadZoneProps {
  videoUrl: string;
  posterUrl?: string;
  onVideoChange: (url: string) => void;
  className?: string;
  mediaType?: "mp4" | "gif";
}

export function VideoUploadZone({
  videoUrl,
  posterUrl,
  onVideoChange,
  className = "",
  mediaType = "mp4",
}: VideoUploadZoneProps) {
  const { projectId } = useCompose();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const accept = mediaType === "gif" ? "image/gif" : "video/mp4,video/webm,video/*";

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    fileRef.current?.click();
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const result = await uploadAsset(projectId, file, { sourceType: "uploaded", skipValidation: true });
        onVideoChange(result.asset.filePath);
      } catch {
        toast.error("영상을 올리지 못했어요. 다시 시도해주세요.");
      } finally {
        setUploading(false);
      }
    },
    [projectId, onVideoChange],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (fileRef.current) fileRef.current.value = "";
    },
    [handleFile],
  );

  return (
    <div
      className={`group/upload relative cursor-pointer overflow-hidden ${className}`}
      onClick={handleClick}
    >
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />

      {videoUrl ? (
        <>
          {mediaType === "gif" ? (
            <img src={videoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <video src={videoUrl} poster={posterUrl} controls className="w-full rounded" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/upload:opacity-100">
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${WORKSPACE_SURFACE.panelStrong} ${WORKSPACE_TEXT.body}`}>
              <Upload className="h-3.5 w-3.5" />
              영상 교체
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-48 items-center justify-center border-2 border-dashed border-[rgb(213_204_195_/_0.92)] bg-[rgb(248_244_239_/_0.92)] transition-colors hover:border-[rgb(236_197_183_/_0.95)] hover:bg-[rgb(248_231_226_/_0.4)]">
          {uploading ? (
            <Loader2 className={`h-8 w-8 animate-spin ${WORKSPACE_TEXT.accent}`} />
          ) : (
            <div className={`text-center ${WORKSPACE_TEXT.muted}`}>
              <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl ${WORKSPACE_CONTROL.accentTint}`}>
                <Video className="h-7 w-7" />
              </div>
              <p className="text-xs">클릭하여 {mediaType === "gif" ? "GIF" : "영상"} 업로드</p>
            </div>
          )}
        </div>
      )}

      {uploading && videoUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
