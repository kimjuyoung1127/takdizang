/** Client-side typed fetch wrappers for all Takdi API endpoints. */
import type { ExportArtifactType, MarketingScript, ProjectMode } from "@/types";

type JsonBody = Record<string, unknown> | object;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (body as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

function post<T>(url: string, body?: JsonBody): Promise<T> {
  return request<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function patch<T>(url: string, body: JsonBody): Promise<T> {
  return request<T>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function get<T>(url: string): Promise<T> {
  return request<T>(url);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// --- Project ---

export interface CreateProjectData {
  name?: string;
  mode?: ProjectMode;
  briefText?: string;
  templateKey?: string;
}

export function createProject(data: CreateProjectData) {
  return post<{ id: string }>("/api/projects", data);
}

export function deleteProject(projectId: string) {
  return request<{ ok: boolean }>(`/api/projects/${projectId}`, {
    method: "DELETE",
  });
}

// --- Content ---

export interface UpdateContentData {
  name?: string;
  content?: string;
  briefText?: string;
  mode?: ProjectMode;
  templateKey?: string;
}

export function updateContent(projectId: string, data: UpdateContentData) {
  return patch<{ id: string }>(`/api/projects/${projectId}/content`, data);
}

// --- Blocks ---

export function getBlocks(projectId: string) {
  return get<import("@/types/blocks").BlockDocument>(`/api/projects/${projectId}/blocks`);
}

export function saveBlocks(projectId: string, doc: import("@/types/blocks").BlockDocument) {
  return request<{ ok: boolean }>(`/api/projects/${projectId}/blocks`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
}

// --- Compose Templates ---

export interface ComposeTemplateSummary {
  id: string;
  name: string;
  previewTitle: string | null;
  blockCount: number;
  sourceProjectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComposeTemplateDetail extends ComposeTemplateSummary {
  snapshot: import("@/types/blocks").BlockDocument;
}

export interface InstantiatedTemplateProject {
  id: string;
  name: string;
  mode: string | null;
  status: string;
  updatedAt: string;
}

export function listComposeTemplates() {
  return get<{ templates: ComposeTemplateSummary[] }>("/api/compose-templates");
}

export function getComposeTemplate(templateId: string) {
  return get<{ template: ComposeTemplateDetail }>(`/api/compose-templates/${templateId}`);
}

export function saveComposeTemplate(data: {
  name: string;
  snapshot: import("@/types/blocks").BlockDocument;
  sourceProjectId?: string;
}) {
  return post<{ template: ComposeTemplateSummary }>("/api/compose-templates", data);
}

export function deleteComposeTemplate(templateId: string) {
  return request<{ ok: boolean }>(`/api/compose-templates/${templateId}`, {
    method: "DELETE",
  });
}

export function instantiateComposeTemplate(templateId: string, data?: { name?: string }) {
  return post<{ project: InstantiatedTemplateProject }>(
    `/api/compose-templates/${templateId}/instantiate`,
    data ?? {},
  );
}

// --- Generate (text) ---

export interface AsyncJobResponse {
  jobId: string;
  status: string;
}

export interface JobPollResponse {
  job: { id: string; status: string; error?: string; startedAt?: string; doneAt?: string };
  [key: string]: unknown;
}

export function startGenerate(projectId: string, opts?: { provider?: string; apiKey?: string; category?: string }) {
  return post<AsyncJobResponse>(`/api/projects/${projectId}/generate`, opts);
}

export function pollGenerate(projectId: string, jobId: string) {
  return get<JobPollResponse>(`/api/projects/${projectId}/generate?jobId=${jobId}`);
}

// --- Generate Images ---

export function startGenerateImages(
  projectId: string,
  opts?: {
    slots?: string[];
    apiKey?: string;
    aspectRatio?: string;
    styleParams?: Record<string, string>;
    referenceAssetIds?: string[];
  },
) {
  return post<AsyncJobResponse>(`/api/projects/${projectId}/generate-images`, opts);
}

export function pollGenerateImages(projectId: string, jobId: string) {
  return get<JobPollResponse>(`/api/projects/${projectId}/generate-images?jobId=${jobId}`);
}

// --- Remotion Render ---

export function startRender(projectId: string, opts?: { compositionId?: string; templateKey?: string }) {
  return post<AsyncJobResponse>(`/api/projects/${projectId}/remotion/render`, opts);
}

export function pollRenderStatus(projectId: string) {
  return get<{ jobId: string; status: string; artifact?: unknown; artifacts?: unknown[] }>(
    `/api/projects/${projectId}/remotion/status`,
  );
}

// --- Preview ---

export function setupPreview(projectId: string, templateKey: string) {
  return post<{ compositionId: string; inputProps: unknown; previewReady: boolean }>(
    `/api/projects/${projectId}/remotion/preview`,
    { templateKey },
  );
}

// --- Export ---

export function startExport(projectId: string, opts?: { type?: string }) {
  return post<AsyncJobResponse>(`/api/projects/${projectId}/export`, opts);
}

export function pollExport(projectId: string, jobId: string) {
  return get<JobPollResponse>(`/api/projects/${projectId}/export?jobId=${jobId}`);
}

// --- Remove Background ---

export function startRemoveBg(projectId: string, opts?: { assetId?: string }) {
  return post<AsyncJobResponse>(`/api/projects/${projectId}/remove-bg`, opts);
}

export function pollRemoveBg(projectId: string, jobId: string) {
  return get<JobPollResponse>(`/api/projects/${projectId}/remove-bg?jobId=${jobId}`);
}

// --- Model Compose ---

export function startModelCompose(
  projectId: string,
  opts?: { assetId?: string; aspectRatio?: string; prompt?: string },
) {
  return post<AsyncJobResponse>(`/api/projects/${projectId}/model-compose`, opts);
}

export function pollModelCompose(projectId: string, jobId: string) {
  return get<JobPollResponse>(`/api/projects/${projectId}/model-compose?jobId=${jobId}`);
}

// --- Scene Compose ---

export function startSceneCompose(
  projectId: string,
  opts: { imageUrl: string; scenePrompt: string; aspectRatio?: string },
) {
  return post<AsyncJobResponse>(`/api/projects/${projectId}/scene-compose`, opts);
}

export function pollSceneCompose(projectId: string, jobId: string) {
  return get<JobPollResponse>(`/api/projects/${projectId}/scene-compose?jobId=${jobId}`);
}

// --- Assets ---

export interface AssetRecord {
  id: string;
  filePath: string;
  previewPath?: string;
  mimeType: string | null;
  sourceType: string;
  preserveOriginal?: boolean;
  width?: number;
  height?: number;
  createdAt: string;
}

export function getProjectAssets(projectId: string) {
  return get<{ assets: AssetRecord[] }>(`/api/projects/${projectId}/assets`);
}

export function uploadAsset(
  projectId: string,
  file: File,
  opts?: { sourceType?: string; preserveOriginal?: boolean; skipValidation?: boolean },
) {
  const form = new FormData();
  form.append("file", file);
  if (opts?.sourceType) form.append("sourceType", opts.sourceType);
  if (opts?.preserveOriginal) form.append("preserveOriginal", "true");
  if (opts?.skipValidation) form.append("skipValidation", "true");
  return request<{ asset: AssetRecord; validation?: unknown }>(
    `/api/projects/${projectId}/assets`,
    { method: "POST", body: form },
  );
}

// --- Workspace assets ---

export interface WorkspaceAssetGroup {
  projectId: string;
  projectName: string;
  projectMode: string | null;
  assets: AssetRecord[];
}

export function getWorkspaceAssets() {
  return get<{ groups: WorkspaceAssetGroup[] }>("/api/workspace/assets");
}

// --- Block text generation ---

export function generateBlockText(
  projectId: string,
  opts: {
    blockType: string;
    context?: string;
    tone?: string;
    userPrompt?: string;
    rewriteMode?: "tone" | "translate" | "shorten";
    existingText?: string;
  },
) {
  return post<{ blockType: string; result: Record<string, unknown> }>(
    `/api/projects/${projectId}/generate-block-text`,
    opts,
  );
}

// --- Bulk Generate Content (text + images) ---

const POLL_INTERVAL = 2000;
const POLL_MAX = 120;

async function pollUntilDone(
  pollFn: () => Promise<JobPollResponse>,
): Promise<JobPollResponse> {
  for (let i = 0; i < POLL_MAX; i++) {
    const res = await pollFn();
    if (res.job.status === "done") return res;
    if (res.job.status === "failed") throw new ApiError(500, res.job.error ?? "Job failed");
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
  throw new ApiError(504, "Job timed out");
}

export interface BulkGenerateCallbacks {
  onTextStart?: () => void;
  onTextDone?: () => void;
  onImagesStart?: () => void;
  onImagesDone?: () => void;
}

export async function bulkGenerateContent(
  projectId: string,
  briefText: string,
  opts?: { category?: string; aspectRatio?: string },
  callbacks?: BulkGenerateCallbacks,
): Promise<import("@/types/blocks").BlockDocument> {
  // 1. Save briefText
  await updateContent(projectId, { briefText });

  // 2. Generate text
  callbacks?.onTextStart?.();
  const { jobId: genJobId } = await startGenerate(projectId, { category: opts?.category });
  await pollUntilDone(() => pollGenerate(projectId, genJobId));
  callbacks?.onTextDone?.();

  // 3. Generate images
  callbacks?.onImagesStart?.();
  const { jobId: imgJobId } = await startGenerateImages(projectId, { aspectRatio: opts?.aspectRatio ?? "1:1" });
  await pollUntilDone(() => pollGenerateImages(projectId, imgJobId));
  callbacks?.onImagesDone?.();

  // 4. Fetch blocks
  return getBlocks(projectId);
}

// --- BGM ---

export function uploadBgm(projectId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return request<{ asset: { id: string; filePath: string }; analysis?: unknown }>(
    `/api/projects/${projectId}/bgm`,
    { method: "POST", body: form },
  );
}

// --- Cuts Handoff ---

export function cutHandoff(projectId: string, data: { selectedImageId: string; preserveOriginal?: boolean }) {
  return post<{ project: unknown; selectedAsset: unknown }>(`/api/projects/${projectId}/cuts/handoff`, data);
}

// --- Usage ---

export interface UsageSummary {
  workspaceId: string;
  summary: {
    totalEvents: number;
    generationCount: number;
    exportCount: number;
    totalEstimatedCost: number;
  };
}

export function fetchUsage() {
  return get<UsageSummary>("/api/usage/me");
}

// --- Shortform Artifacts ---

export interface ExportArtifactRecord {
  id: string;
  type: ExportArtifactType;
  filePath: string;
  metadata: string | object | null;
  createdAt: string;
}

export function startGenerateThumbnail(projectId: string, opts?: { templateKey?: string }) {
  return post<AsyncJobResponse>(`/api/projects/${projectId}/thumbnail`, opts);
}

export function pollGenerateThumbnail(projectId: string, jobId: string) {
  return get<JobPollResponse>(`/api/projects/${projectId}/thumbnail?jobId=${jobId}`);
}

export function startGenerateMarketingScript(projectId: string, opts?: { templateKey?: string }) {
  return post<AsyncJobResponse>(`/api/projects/${projectId}/marketing-script`, opts);
}

export function pollGenerateMarketingScript(projectId: string, jobId: string) {
  return get<JobPollResponse>(`/api/projects/${projectId}/marketing-script?jobId=${jobId}`);
}

export function parseArtifactMetadata<T>(artifact: Pick<ExportArtifactRecord, "metadata">): T | null {
  if (!artifact.metadata) {
    return null;
  }

  if (typeof artifact.metadata !== "string") {
    return artifact.metadata as T;
  }

  try {
    return JSON.parse(artifact.metadata) as T;
  } catch {
    return null;
  }
}

export interface MarketingScriptArtifactPayload {
  script: MarketingScript;
}
