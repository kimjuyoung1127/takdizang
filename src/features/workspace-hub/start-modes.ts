/** Shared start-mode definitions used by home, global launcher, and direct upload entry. */
import type { ProjectMode } from "@/types";

export interface StartModeDefinition {
  mode: ProjectMode;
  label: string;
  description: string;
  editorMode: "flow" | "compose";
}

export const START_MODE_DEFINITIONS: StartModeDefinition[] = [
  {
    mode: "compose",
    label: "상세페이지 제작",
    description: "블록을 조합해서 상품 상세페이지를 만들어요",
    editorMode: "compose",
  },
  {
    mode: "shortform-video",
    label: "숏폼 영상",
    description: "단계별로 따라가며 숏폼 영상을 만들어요",
    editorMode: "flow",
  },
  {
    mode: "model-shot",
    label: "모델 촬영",
    description: "AI가 모델 착용 이미지를 합성해줘요",
    editorMode: "flow",
  },
  {
    mode: "cutout",
    label: "누끼",
    description: "이미지 배경을 깔끔하게 제거해요",
    editorMode: "flow",
  },
  {
    mode: "brand-image",
    label: "브랜드 이미지",
    description: "브랜드에 맞는 이미지를 제작해요",
    editorMode: "flow",
  },
  {
    mode: "gif-source",
    label: "GIF",
    description: "움직이는 GIF를 빠르게 만들어요",
    editorMode: "flow",
  },
  {
    mode: "freeform",
    label: "자유 형식",
    description: "원하는 대로 자유롭게 작업해요",
    editorMode: "flow",
  },
];

export function getProjectStartDestination(mode: StartModeDefinition["mode"]) {
  return mode === "compose" ? "compose" : "editor";
}
