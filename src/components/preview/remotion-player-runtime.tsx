"use client";

import { type ComponentType, useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WORKSPACE_CONTROL, WORKSPACE_TEXT } from "@/lib/workspace-surface";
import type { CompositionId, RemotionInputProps } from "@/types";
import { COMPOSITIONS } from "./remotion-preview-config";

const COMPOSITION_LOADERS: Record<
  CompositionId,
  () => Promise<ComponentType<RemotionInputProps>>
> = {
  "TakdiVideo-916": async () => (await import("@/remotion/TakdiVideo916")).TakdiVideo916,
  "TakdiVideo-1x1": async () => (await import("@/remotion/TakdiVideo1x1")).TakdiVideo1x1,
  "TakdiVideo-169": async () => (await import("@/remotion/TakdiVideo169")).TakdiVideo169,
};

export interface RemotionPlayerRuntimeProps {
  compositionId: CompositionId;
  inputProps: RemotionInputProps;
}

export function RemotionPlayerRuntime({
  compositionId,
  inputProps,
}: RemotionPlayerRuntimeProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [PlayerComponent, setPlayerComponent] = useState<ComponentType<any> | null>(null);
  const [CompositionComponent, setCompositionComponent] =
    useState<ComponentType<RemotionInputProps> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    setStatus("loading");
    setErrorMessage(null);

    const loadPlayer = PlayerComponent
      ? Promise.resolve(PlayerComponent)
      : import("@remotion/player").then((module) => module.Player);

    Promise.all([loadPlayer, COMPOSITION_LOADERS[compositionId]()])
      .then(([loadedPlayer, loadedComposition]) => {
        if (!active) {
          return;
        }

        setPlayerComponent(() => loadedPlayer);
        setCompositionComponent(() => loadedComposition);
        setStatus("ready");
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setCompositionComponent(null);
        setStatus("error");
        setErrorMessage("Remotion preview runtime을 준비하지 못했습니다.");
      });

    return () => {
      active = false;
    };
  }, [PlayerComponent, compositionId, retryKey]);

  const composition = COMPOSITIONS[compositionId];

  if (status !== "ready" || !PlayerComponent || !CompositionComponent) {
    return (
      <div
        className={cn(
          "takdi-overlay-card mx-auto flex w-full flex-col items-center justify-center rounded-[28px] p-6 text-center",
          composition.maxWidthClassName,
        )}
      >
        <div
          className={cn(
            "takdi-overlay-card-soft flex w-full items-center justify-center overflow-hidden rounded-[24px] border border-dashed",
            composition.aspectClassName,
          )}
        >
          <div className={`space-y-3 px-6 ${WORKSPACE_TEXT.body}`}>
            {status === "error" ? (
              <>
                <div className="takdi-overlay-icon mx-auto flex size-12 items-center justify-center rounded-full">
                  <AlertTriangle className="size-5" />
                </div>
                <p className={`text-sm font-semibold ${WORKSPACE_TEXT.title}`}>{errorMessage}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRetryKey((current) => current + 1)}
                  className={`rounded-full ${WORKSPACE_CONTROL.subtleButton}`}
                >
                  <RefreshCw className="size-4" />
                  다시 시도
                </Button>
              </>
            ) : (
              <>
                <div className="takdi-overlay-chip mx-auto flex size-12 items-center justify-center rounded-full">
                  <LoaderCircle className="size-5 animate-spin" />
                </div>
                <p className={`text-sm font-semibold ${WORKSPACE_TEXT.title}`}>Loading preview runtime</p>
                <p className={`text-xs ${WORKSPACE_TEXT.muted}`}>
                  `@remotion/player`와 {composition.label} composition을 불러오는 중입니다.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto w-full", composition.maxWidthClassName)}>
      <PlayerComponent
        component={CompositionComponent}
        inputProps={{
          ...inputProps,
          templateKey: composition.label,
        }}
        durationInFrames={inputProps.totalDurationFrames ?? 150}
        compositionWidth={composition.width}
        compositionHeight={composition.height}
        fps={30}
        controls
        loop
        style={{
          width: "100%",
          borderRadius: "1.5rem",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
