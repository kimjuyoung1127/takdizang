import type { FlowNodeType } from "@/lib/constants";

export type EditorEditingPolicy = "guided-readonly" | "guided-limited" | "freeform";

export interface UserFacingNodeStatus {
  label: string;
  tone: "idle" | "working" | "done" | "error";
}

export interface ModeSurfaceConfig {
  stepOrder?: FlowNodeType[];
  editingPolicy: EditorEditingPolicy;
  cardinality?: Partial<Record<FlowNodeType, number>>;
  allowDuplicateTypes: boolean;
  allowEdgeEditing: boolean;
  allowNodeDuplication: boolean;
  allowNodeInsertion: boolean;
}

export interface SurfaceNodeDataLike {
  nodeType?: string;
  status?: string;
  briefText?: unknown;
  uploadedAssetId?: unknown;
  previewImages?: unknown;
}

export const MODE_SURFACE_CONFIG: Record<string, ModeSurfaceConfig> = {
  "shortform-video": {
    stepOrder: ["prompt", "generate-images", "bgm", "cuts", "render", "export"],
    editingPolicy: "guided-readonly",
    cardinality: {
      prompt: 1,
      "generate-images": 1,
      bgm: 1,
      cuts: 1,
      render: 1,
      export: 1,
    },
    allowDuplicateTypes: false,
    allowEdgeEditing: false,
    allowNodeDuplication: false,
    allowNodeInsertion: false,
  },
  "model-shot": {
    stepOrder: ["upload-image", "prompt", "model-compose", "export"],
    editingPolicy: "guided-readonly",
    cardinality: {
      "upload-image": 1,
      prompt: 1,
      "model-compose": 1,
      export: 1,
    },
    allowDuplicateTypes: false,
    allowEdgeEditing: false,
    allowNodeDuplication: false,
    allowNodeInsertion: false,
  },
  cutout: {
    stepOrder: ["upload-image", "remove-bg", "export"],
    editingPolicy: "guided-readonly",
    cardinality: {
      "upload-image": 1,
      "remove-bg": 1,
      export: 1,
    },
    allowDuplicateTypes: false,
    allowEdgeEditing: false,
    allowNodeDuplication: false,
    allowNodeInsertion: false,
  },
  "brand-image": {
    stepOrder: ["prompt", "generate-images", "export"],
    editingPolicy: "guided-readonly",
    cardinality: {
      prompt: 1,
      "generate-images": 1,
      export: 1,
    },
    allowDuplicateTypes: false,
    allowEdgeEditing: false,
    allowNodeDuplication: false,
    allowNodeInsertion: false,
  },
  freeform: {
    editingPolicy: "freeform",
    allowDuplicateTypes: true,
    allowEdgeEditing: true,
    allowNodeDuplication: true,
    allowNodeInsertion: true,
  },
  "gif-source": {
    editingPolicy: "freeform",
    allowDuplicateTypes: true,
    allowEdgeEditing: true,
    allowNodeDuplication: true,
    allowNodeInsertion: true,
  },
};

const DEFAULT_SURFACE_CONFIG: ModeSurfaceConfig = {
  editingPolicy: "freeform",
  allowDuplicateTypes: true,
  allowEdgeEditing: true,
  allowNodeDuplication: true,
  allowNodeInsertion: true,
};


export function getModeSurfaceConfig(mode: string): ModeSurfaceConfig {
  return MODE_SURFACE_CONFIG[mode] ?? DEFAULT_SURFACE_CONFIG;
}

export function isGuidedMode(mode: string): boolean {
  return getModeSurfaceConfig(mode).editingPolicy !== "freeform";
}

export function getMaxCountForNodeType(mode: string, nodeType: FlowNodeType): number | null {
  const cardinality = getModeSurfaceConfig(mode).cardinality;
  if (!cardinality) {
    return null;
  }
  return cardinality[nodeType] ?? null;
}


function hasPromptValue(nodeData?: SurfaceNodeDataLike | null) {
  return typeof nodeData?.briefText === "string" && nodeData.briefText.trim().length > 0;
}

function hasUploadedAsset(nodeData?: SurfaceNodeDataLike | null) {
  return typeof nodeData?.uploadedAssetId === "string" && nodeData.uploadedAssetId.length > 0;
}

export function getUserFacingNodeStatus(nodeData?: SurfaceNodeDataLike | null): UserFacingNodeStatus {
  const nodeType = nodeData?.nodeType;
  const rawStatus = nodeData?.status;

  if (nodeType === "upload-image") {
    return hasUploadedAsset(nodeData)
      ? { label: "업로드 완료", tone: "done" }
      : { label: "업로드 필요", tone: "idle" };
  }

  if (nodeType === "prompt") {
    return hasPromptValue(nodeData)
      ? { label: "입력 완료", tone: "done" }
      : { label: "입력 필요", tone: "idle" };
  }

  if (nodeType === "export") {
    if (rawStatus === "generating" || rawStatus === "running") {
      return { label: "내보내는 중", tone: "working" };
    }
    if (rawStatus === "exported" || rawStatus === "done") {
      return { label: "내보내기 완료", tone: "done" };
    }
    if (rawStatus === "failed" || rawStatus === "error") {
      return { label: "오류", tone: "error" };
    }
    return { label: "저장 전", tone: "idle" };
  }

  if (nodeType === "model-compose") {
    if (rawStatus === "generating" || rawStatus === "running") {
      return { label: "합성 중", tone: "working" };
    }
    if (rawStatus === "generated" || rawStatus === "done") {
      return { label: "합성 완료", tone: "done" };
    }
    if (rawStatus === "failed" || rawStatus === "error") {
      return { label: "오류", tone: "error" };
    }
    return { label: "실행 전", tone: "idle" };
  }

  if (nodeType === "remove-bg") {
    if (rawStatus === "generating" || rawStatus === "running") {
      return { label: "배경 제거 중", tone: "working" };
    }
    if (rawStatus === "generated" || rawStatus === "done") {
      return { label: "배경 제거 완료", tone: "done" };
    }
    if (rawStatus === "failed" || rawStatus === "error") {
      return { label: "오류", tone: "error" };
    }
    return { label: "실행 전", tone: "idle" };
  }

  if (nodeType === "generate-images") {
    if (rawStatus === "generating" || rawStatus === "running") {
      return { label: "생성 중", tone: "working" };
    }
    if (rawStatus === "generated" || rawStatus === "done") {
      return { label: "생성 완료", tone: "done" };
    }
    if (rawStatus === "failed" || rawStatus === "error") {
      return { label: "오류", tone: "error" };
    }
    return { label: "실행 전", tone: "idle" };
  }

  if (nodeType === "render") {
    if (rawStatus === "generating" || rawStatus === "running") {
      return { label: "렌더링 중", tone: "working" };
    }
    if (rawStatus === "generated" || rawStatus === "done") {
      return { label: "렌더링 완료", tone: "done" };
    }
    if (rawStatus === "failed" || rawStatus === "error") {
      return { label: "오류", tone: "error" };
    }
    return { label: "실행 전", tone: "idle" };
  }

  if (nodeType === "bgm") {
    const bgmValue = (nodeData as { filePath?: unknown } | undefined)?.filePath;
    return typeof bgmValue === "string" && bgmValue.length > 0
      ? { label: "설정 완료", tone: "done" }
      : { label: "설정 전", tone: "idle" };
  }

  if (nodeType === "cuts") {
    if (rawStatus === "generated" || rawStatus === "done") {
      return { label: "편집 완료", tone: "done" };
    }
    return { label: "확인 전", tone: "idle" };
  }

  if (rawStatus === "failed" || rawStatus === "error") {
    return { label: "오류", tone: "error" };
  }
  if (rawStatus === "generated" || rawStatus === "done" || rawStatus === "exported") {
    return { label: "완료", tone: "done" };
  }
  if (rawStatus === "generating" || rawStatus === "running") {
    return { label: "진행 중", tone: "working" };
  }
  return { label: "준비 전", tone: "idle" };
}
