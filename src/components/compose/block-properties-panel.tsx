/** 블록 속성 패널 — 선택된 블록의 타입별 동적 편집 필드 (18종 블록 지원, ImagePicker + FontPicker + 블록별 컨트롤) */
"use client";

import type { Block, TextOverlay } from "@/types/blocks";
import { BLOCK_TYPE_LABELS } from "@/lib/constants";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";
import { useCompose } from "./compose-context";
import { ImagePicker } from "./image-picker";
import { ColorStylePicker, ImageFilterControls, SceneComposeAction, ModelComposeAction, RemoveBgAction, FontPicker, ImageGenerateAction } from "./shared";
import { BlockTextGenerator } from "./shared/block-text-generator";
import { Plus, Trash2 } from "lucide-react";

const OVERLAY_ALIGN_PRESETS = [
  { label: "↖", x: 15, y: 15, title: "좌상" },
  { label: "↑", x: 50, y: 15, title: "상단 중앙" },
  { label: "↗", x: 85, y: 15, title: "우상" },
  { label: "←", x: 15, y: 50, title: "좌측 중앙" },
  { label: "●", x: 50, y: 50, title: "정중앙" },
  { label: "→", x: 85, y: 50, title: "우측 중앙" },
  { label: "↙", x: 15, y: 85, title: "좌하" },
  { label: "↓", x: 50, y: 85, title: "하단 중앙" },
  { label: "↘", x: 85, y: 85, title: "우하" },
];

interface BlockPropertiesPanelProps {
  block: Block | null;
  onUpdate: (id: string, patch: Partial<Block>) => void;
}

const CTA_STYLE_PRESETS = [
  { value: "default", label: "기본", color: "#ffffff" },
  { value: "gradient", label: "그라디언트", color: "#6366f1" },
  { value: "dark", label: "다크", color: "#111827" },
  { value: "minimal", label: "미니멀", color: "#f9fafb" },
];

const REVIEW_STYLE_PRESETS = [
  { value: "card", label: "카드", color: "#f3f4f6" },
  { value: "quote", label: "인용", color: "#a5b4fc" },
  { value: "minimal", label: "미니멀", color: "#ffffff" },
  { value: "bubble", label: "말풍선", color: "#e0e7ff" },
];

export function BlockPropertiesPanel({ block, onUpdate }: BlockPropertiesPanelProps) {
  const { projectId } = useCompose();

  if (!block) {
    return (
      <div className="flex w-80 flex-col border-l border-[rgb(212_196_181_/_0.55)] bg-[rgb(251_248_244_/_0.72)] text-[var(--takdi-text)] backdrop-blur-xl [&_input:not([type='checkbox']):not([type='color'])]:rounded-2xl [&_input:not([type='checkbox']):not([type='color'])]:border-[rgb(228_217_205_/_0.92)] [&_input:not([type='checkbox']):not([type='color'])]:bg-[rgb(255_255_255_/_0.9)] [&_input:not([type='checkbox']):not([type='color'])]:text-[var(--takdi-text)] [&_input:not([type='checkbox']):not([type='color'])]:outline-none [&_input:not([type='checkbox']):not([type='color'])]:focus:border-[var(--takdi-accent)] [&_select]:rounded-2xl [&_select]:border-[rgb(228_217_205_/_0.92)] [&_select]:bg-[rgb(255_255_255_/_0.9)] [&_select]:text-[var(--takdi-text)] [&_select]:outline-none [&_select]:focus:border-[var(--takdi-accent)]">
        <div className="border-b border-[rgb(214_199_184_/_0.62)] px-5 py-4">
          <p className="takdi-kicker">Block settings</p>
          <h2 className={`mt-3 text-sm font-semibold tracking-[-0.03em] ${WORKSPACE_TEXT.title}`}>설정</h2>
        </div>
        <div className={`flex flex-1 items-center justify-center p-4 text-center text-sm ${WORKSPACE_TEXT.muted}`}>
          <div>
            <p className="mb-2">블록을 선택하면</p>
            <p>설정을 변경할 수 있습니다</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-80 flex-col border-l border-[rgb(212_196_181_/_0.55)] bg-[rgb(251_248_244_/_0.72)] text-[var(--takdi-text)] backdrop-blur-xl [&_input:not([type='checkbox']):not([type='color'])]:rounded-2xl [&_input:not([type='checkbox']):not([type='color'])]:border-[rgb(228_217_205_/_0.92)] [&_input:not([type='checkbox']):not([type='color'])]:bg-[rgb(255_255_255_/_0.9)] [&_input:not([type='checkbox']):not([type='color'])]:text-[var(--takdi-text)] [&_input:not([type='checkbox']):not([type='color'])]:outline-none [&_input:not([type='checkbox']):not([type='color'])]:focus:border-[var(--takdi-accent)] [&_select]:rounded-2xl [&_select]:border-[rgb(228_217_205_/_0.92)] [&_select]:bg-[rgb(255_255_255_/_0.9)] [&_select]:text-[var(--takdi-text)] [&_select]:outline-none [&_select]:focus:border-[var(--takdi-accent)]">
      <div className="border-b border-[rgb(214_199_184_/_0.62)] px-5 py-4">
        <p className="takdi-kicker">Block settings</p>
        <h2 className={`mt-3 text-sm font-semibold tracking-[-0.03em] ${WORKSPACE_TEXT.title}`}>
          {BLOCK_TYPE_LABELS[block.type]} 설정
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {/* Common: visibility */}
        <label className="mb-4 flex items-center gap-2 text-sm text-[var(--takdi-text-muted)]">
          <input
            type="checkbox"
            checked={block.visible}
            onChange={(e) => onUpdate(block.id, { visible: e.target.checked })}
            className="rounded border-[rgb(212_199_184_/_0.92)]"
          />
          표시
        </label>

        {/* hero */}
        {block.type === "hero" && (
          <div className="space-y-3">
            <Field label="이미지">
              <ImagePicker
                projectId={projectId}
                currentUrl={block.imageUrl}
                onImageChange={(url) => onUpdate(block.id, { imageUrl: url })}
              />
            </Field>
            <ImageFilterControls
              filters={block.imageFilters}
              onChange={(f) => onUpdate(block.id, { imageFilters: f })}
            />
            <SceneComposeAction
              projectId={projectId}
              imageUrl={block.imageUrl}
              onImageChange={(url) => onUpdate(block.id, { imageUrl: url })}
            />
            <ModelComposeAction
              projectId={projectId}
              imageUrl={block.imageUrl}
              onImageChange={(url) => onUpdate(block.id, { imageUrl: url })}
            />
            <RemoveBgAction
              projectId={projectId}
              imageUrl={block.imageUrl}
              onImageChange={(url) => onUpdate(block.id, { imageUrl: url })}
            />
            <ImageGenerateAction
              projectId={projectId}
              onImageChange={(url) => onUpdate(block.id, { imageUrl: url })}
            />

            {/* Overlay editor */}
            <div className="border-t border-[rgb(214_199_184_/_0.36)] pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs font-medium ${WORKSPACE_TEXT.body}`}>텍스트 오버레이</span>
                <button
                  onClick={() => {
                    const newOvl: TextOverlay = {
                      id: `ovl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                      text: "새 텍스트",
                      x: 50, y: 50, fontSize: 24, color: "#ffffff", fontWeight: "bold", textAlign: "center",
                    };
                    onUpdate(block.id, { overlays: [...block.overlays, newOvl] });
                  }}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${WORKSPACE_CONTROL.accentTint}`}
                >
                  <Plus className="h-3 w-3" />
                  추가
                </button>
              </div>
              <p className={`mb-2 text-[10px] ${WORKSPACE_TEXT.muted}`}>캔버스에서 텍스트를 드래그하여 위치 변경</p>
              {block.overlays.map((overlay) => (
                <div key={overlay.id} className={`mb-2 rounded-[20px] p-2 ${WORKSPACE_SURFACE.softInset}`}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <input
                      type="text"
                      value={overlay.text}
                      onChange={(e) =>
                        onUpdate(block.id, {
                          overlays: block.overlays.map((o) =>
                            o.id === overlay.id ? { ...o, text: e.target.value } : o,
                          ),
                        })
                      }
                      className="flex-1 px-2 py-1 text-xs"
                    />
                    <button
                      onClick={() =>
                        onUpdate(block.id, { overlays: block.overlays.filter((o) => o.id !== overlay.id) })
                      }
                      className={`ml-1 rounded-full p-1 ${WORKSPACE_TEXT.muted} hover:text-[var(--takdi-accent-strong)]`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  {/* Quick align presets — 9-point grid */}
                  <div className="mb-1.5">
                    <label className={`text-[10px] ${WORKSPACE_TEXT.muted}`}>빠른 정렬</label>
                    <div className="mt-0.5 grid grid-cols-3 gap-0.5">
                      {OVERLAY_ALIGN_PRESETS.map((preset) => (
                        <button
                          key={preset.title}
                          onClick={() =>
                            onUpdate(block.id, {
                              overlays: block.overlays.map((o) =>
                                o.id === overlay.id ? { ...o, x: preset.x, y: preset.y } : o,
                              ),
                            })
                          }
                          className={`rounded border px-1 py-0.5 text-[10px] transition-colors ${
                            overlay.x === preset.x && overlay.y === preset.y
                              ? "border-[rgb(236_197_183_/_0.95)] bg-[rgb(248_231_226_/_0.95)] text-[var(--takdi-accent-strong)]"
                              : "border-[rgb(214_199_184_/_0.74)] text-[var(--takdi-text-muted)] hover:border-[rgb(236_197_183_/_0.84)] hover:bg-[rgb(248_231_226_/_0.42)]"
                          }`}
                          title={preset.title}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div>
                      <label className={WORKSPACE_TEXT.muted}>X (%)</label>
                      <input
                        type="number" min={0} max={100}
                        value={overlay.x}
                        onChange={(e) =>
                          onUpdate(block.id, {
                            overlays: block.overlays.map((o) =>
                              o.id === overlay.id ? { ...o, x: Number(e.target.value) } : o,
                            ),
                          })
                        }
                        className="w-full px-1 py-0.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className={WORKSPACE_TEXT.muted}>Y (%)</label>
                      <input
                        type="number" min={0} max={100}
                        value={overlay.y}
                        onChange={(e) =>
                          onUpdate(block.id, {
                            overlays: block.overlays.map((o) =>
                              o.id === overlay.id ? { ...o, y: Number(e.target.value) } : o,
                            ),
                          })
                        }
                        className="w-full px-1 py-0.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className={WORKSPACE_TEXT.muted}>크기</label>
                      <input
                        type="number" min={12} max={120}
                        value={overlay.fontSize}
                        onChange={(e) =>
                          onUpdate(block.id, {
                            overlays: block.overlays.map((o) =>
                              o.id === overlay.id ? { ...o, fontSize: Number(e.target.value) } : o,
                            ),
                          })
                        }
                        className="w-full px-1 py-0.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className={WORKSPACE_TEXT.muted}>색상</label>
                      <input
                        type="color"
                        value={overlay.color}
                        onChange={(e) =>
                          onUpdate(block.id, {
                            overlays: block.overlays.map((o) =>
                              o.id === overlay.id ? { ...o, color: e.target.value } : o,
                            ),
                          })
                        }
                        className="h-5 w-full cursor-pointer rounded-xl border border-[rgb(214_199_184_/_0.74)]"
                      />
                    </div>
                    <div>
                      <label className={WORKSPACE_TEXT.muted}>굵기</label>
                      <select
                        value={overlay.fontWeight}
                        onChange={(e) =>
                          onUpdate(block.id, {
                            overlays: block.overlays.map((o) =>
                              o.id === overlay.id ? { ...o, fontWeight: e.target.value as "normal" | "bold" } : o,
                            ),
                          })
                        }
                        className="w-full px-1 py-0.5 text-xs"
                      >
                        <option value="normal">보통</option>
                        <option value="bold">굵게</option>
                      </select>
                    </div>
                    <div>
                      <label className={WORKSPACE_TEXT.muted}>정렬</label>
                      <select
                        value={overlay.textAlign}
                        onChange={(e) =>
                          onUpdate(block.id, {
                            overlays: block.overlays.map((o) =>
                              o.id === overlay.id ? { ...o, textAlign: e.target.value as "left" | "center" | "right" } : o,
                            ),
                          })
                        }
                        className="w-full px-1 py-0.5 text-xs"
                      >
                        <option value="left">왼쪽</option>
                        <option value="center">가운데</option>
                        <option value="right">오른쪽</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-1">
                    <label className={`text-[10px] ${WORKSPACE_TEXT.muted}`}>글꼴</label>
                    <FontPicker
                      value={overlay.fontFamily ?? "default"}
                      onChange={(v) =>
                        onUpdate(block.id, {
                          overlays: block.overlays.map((o) =>
                            o.id === overlay.id ? { ...o, fontFamily: v } : o,
                          ),
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* text-block */}
        {block.type === "text-block" && (
          <div className="space-y-3">
            <BlockTextGenerator
              blockType="text-block"
              onResult={(r) => {
                const res = r as { headline?: string; body?: string };
                onUpdate(block.id, {
                  ...(res.headline ? { heading: res.headline } : {}),
                  ...(res.body ? { body: res.body } : {}),
                });
              }}
              renderPreview={(r) => {
                const res = r as { headline?: string; body?: string };
                return (
                  <div className="space-y-1">
                    {res.headline && <p className="font-semibold text-[var(--takdi-text)]">{res.headline}</p>}
                    {res.body && <p className="text-[var(--takdi-text-muted)]">{res.body}</p>}
                  </div>
                );
              }}
            />
            <Field label="글꼴">
              <FontPicker
                value={block.fontFamily ?? "default"}
                onChange={(v) => onUpdate(block.id, { fontFamily: v })}
              />
            </Field>
            <Field label="정렬">
              <select
                value={block.align}
                onChange={(e) => onUpdate(block.id, { align: e.target.value as "left" | "center" | "right" })}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              >
                <option value="left">왼쪽</option>
                <option value="center">가운데</option>
                <option value="right">오른쪽</option>
              </select>
            </Field>
            <Field label="글꼴 크기">
              <select
                value={block.fontSize ?? "base"}
                onChange={(e) => onUpdate(block.id, { fontSize: e.target.value as "sm" | "base" | "lg" | "xl" })}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              >
                <option value="sm">작게 (14px)</option>
                <option value="base">보통 (16px)</option>
                <option value="lg">크게 (18px)</option>
                <option value="xl">매우 크게 (20px)</option>
              </select>
            </Field>
          </div>
        )}

        {/* image-text */}
        {block.type === "image-text" && (
          <div className="space-y-3">
            <Field label="글꼴">
              <FontPicker
                value={block.fontFamily ?? "default"}
                onChange={(v) => onUpdate(block.id, { fontFamily: v })}
              />
            </Field>
            <Field label="이미지 위치">
              <select
                value={block.imagePosition}
                onChange={(e) => onUpdate(block.id, { imagePosition: e.target.value as "left" | "right" })}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              >
                <option value="left">왼쪽</option>
                <option value="right">오른쪽</option>
              </select>
            </Field>
            <Field label="이미지">
              <ImagePicker
                projectId={projectId}
                currentUrl={block.imageUrl}
                onImageChange={(url) => onUpdate(block.id, { imageUrl: url })}
              />
            </Field>
            <ImageFilterControls
              filters={block.imageFilters}
              onChange={(f) => onUpdate(block.id, { imageFilters: f })}
            />
            <SceneComposeAction
              projectId={projectId}
              imageUrl={block.imageUrl}
              onImageChange={(url) => onUpdate(block.id, { imageUrl: url })}
            />
            <ModelComposeAction
              projectId={projectId}
              imageUrl={block.imageUrl}
              onImageChange={(url) => onUpdate(block.id, { imageUrl: url })}
            />
            <RemoveBgAction
              projectId={projectId}
              imageUrl={block.imageUrl}
              onImageChange={(url) => onUpdate(block.id, { imageUrl: url })}
            />
            <ImageGenerateAction
              projectId={projectId}
              onImageChange={(url) => onUpdate(block.id, { imageUrl: url })}
            />
          </div>
        )}

        {/* image-full */}
        {block.type === "image-full" && (
          <div className="space-y-3">
            <Field label="이미지">
              <ImagePicker
                projectId={projectId}
                currentUrl={block.imageUrl}
                onImageChange={(url) => onUpdate(block.id, { imageUrl: url })}
              />
            </Field>
            <ImageFilterControls
              filters={block.imageFilters}
              onChange={(f) => onUpdate(block.id, { imageFilters: f })}
            />
            <SceneComposeAction
              projectId={projectId}
              imageUrl={block.imageUrl}
              onImageChange={(url) => onUpdate(block.id, { imageUrl: url })}
            />
            <ModelComposeAction
              projectId={projectId}
              imageUrl={block.imageUrl}
              onImageChange={(url) => onUpdate(block.id, { imageUrl: url })}
            />
            <RemoveBgAction
              projectId={projectId}
              imageUrl={block.imageUrl}
              onImageChange={(url) => onUpdate(block.id, { imageUrl: url })}
            />
            <ImageGenerateAction
              projectId={projectId}
              onImageChange={(url) => onUpdate(block.id, { imageUrl: url })}
            />
          </div>
        )}

        {/* image-grid */}
        {block.type === "image-grid" && (
          <div className="space-y-3">
            <Field label="열 수">
              <select
                value={block.columns}
                onChange={(e) => onUpdate(block.id, { columns: Number(e.target.value) as 2 | 3 })}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              >
                <option value={2}>2열</option>
                <option value={3}>3열</option>
              </select>
            </Field>
            <Field label="이미지 모양">
              <select
                value={block.shape ?? "square"}
                onChange={(e) => onUpdate(block.id, { shape: e.target.value as "square" | "rounded" | "circle" })}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              >
                <option value="square">사각형</option>
                <option value="rounded">둥근 모서리</option>
                <option value="circle">원형</option>
              </select>
            </Field>
            <ImageFilterControls
              filters={block.imageFilters}
              onChange={(f) => onUpdate(block.id, { imageFilters: f })}
            />
          </div>
        )}

        {/* divider */}
        {block.type === "divider" && (
          <div className="space-y-3">
            <Field label="스타일">
              <select
                value={block.style}
                onChange={(e) => onUpdate(block.id, { style: e.target.value as "line" | "space" | "dot" })}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              >
                <option value="line">선</option>
                <option value="space">여백</option>
                <option value="dot">점</option>
              </select>
            </Field>
            <Field label="높이 (px)">
              <input
                type="number"
                value={block.height}
                onChange={(e) => onUpdate(block.id, { height: Number(e.target.value) })}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                min={8}
                max={200}
              />
            </Field>
          </div>
        )}

        {/* selling-point */}
        {block.type === "selling-point" && (
          <div className="space-y-3">
            <BlockTextGenerator
              blockType="selling-point"
              onResult={(r) => {
                const res = r as { items?: Array<{ title: string; description: string }> };
                if (res.items) {
                  onUpdate(block.id, {
                    items: res.items.slice(0, 4).map((item, i) => ({
                      ...block.items[i],
                      icon: block.items[i]?.icon ?? "star",
                      title: item.title,
                      description: item.description,
                    })),
                  });
                }
              }}
              renderPreview={(r) => {
                const res = r as { items?: Array<{ title: string; description: string }> };
                return (
                  <ul className="space-y-1">
                    {res.items?.map((item, i) => (
                      <li key={i}><span className="font-medium">{item.title}</span> — {item.description}</li>
                    ))}
                  </ul>
                );
              }}
            />
            <Field label="레이아웃">
              <select
                value={block.layout ?? "grid"}
                onChange={(e) => onUpdate(block.id, { layout: e.target.value as "grid" | "horizontal" })}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              >
                <option value="grid">그리드 (2열)</option>
                <option value="horizontal">가로 나열</option>
              </select>
            </Field>
            <p className={`text-xs ${WORKSPACE_TEXT.muted}`}>
              핵심 장점 {block.items.length}개 (최대 4개) — 아래 블록에서 직접 수정
            </p>
          </div>
        )}

        {/* spec-table */}
        {block.type === "spec-table" && (
          <div className="space-y-3">
            <p className={`text-xs ${WORKSPACE_TEXT.muted}`}>행 {block.rows.length}개 — 아래 블록에서 직접 수정</p>
          </div>
        )}

        {/* comparison */}
        {block.type === "comparison" && (
          <div className="space-y-3">
            <Field label="Before 이미지">
              <ImagePicker
                projectId={projectId}
                currentUrl={block.before.imageUrl}
                onImageChange={(url) => onUpdate(block.id, { before: { ...block.before, imageUrl: url } })}
              />
            </Field>
            <Field label="After 이미지">
              <ImagePicker
                projectId={projectId}
                currentUrl={block.after.imageUrl}
                onImageChange={(url) => onUpdate(block.id, { after: { ...block.after, imageUrl: url } })}
              />
            </Field>
            <ImageFilterControls
              filters={block.imageFilters}
              onChange={(f) => onUpdate(block.id, { imageFilters: f })}
            />
          </div>
        )}

        {/* review */}
        {block.type === "review" && (
          <div className="space-y-3">
            <BlockTextGenerator
              blockType="review"
              onResult={(r) => {
                const res = r as { reviews?: Array<{ reviewer: string; rating: number; text: string }> };
                if (res.reviews) {
                  onUpdate(block.id, {
                    reviews: res.reviews.map((rev) => ({
                      author: rev.reviewer,
                      rating: rev.rating,
                      text: rev.text,
                    })),
                  });
                }
              }}
              renderPreview={(r) => {
                const res = r as { reviews?: Array<{ reviewer: string; rating: number; text: string }> };
                return (
                  <ul className="space-y-1.5">
                    {res.reviews?.map((rev, i) => (
                      <li key={i}>
                        <span className="font-medium">{rev.reviewer}</span>{" "}
                        <span className="text-amber-500">{"★".repeat(rev.rating)}</span>
                        <p className="text-[var(--takdi-text-muted)]">{rev.text}</p>
                      </li>
                    ))}
                  </ul>
                );
              }}
            />
            <ColorStylePicker
              label="표시 스타일"
              value={block.displayStyle ?? "card"}
              presets={REVIEW_STYLE_PRESETS}
              onChange={(v) => onUpdate(block.id, { displayStyle: v as "card" | "quote" | "minimal" | "bubble" })}
            />
            <p className={`text-xs ${WORKSPACE_TEXT.muted}`}>
              리뷰 {block.reviews.length}개 — 아래 블록에서 직접 수정
            </p>
          </div>
        )}

        {/* cta */}
        {block.type === "cta" && (
          <div className="space-y-3">
            <ColorStylePicker
              label="스타일 프리셋"
              value={block.ctaStyle ?? "default"}
              presets={CTA_STYLE_PRESETS}
              onChange={(v) => onUpdate(block.id, { ctaStyle: v as "default" | "gradient" | "dark" | "minimal" })}
            />
            <Field label="버튼 URL">
              <input
                type="text"
                value={block.buttonUrl}
                onChange={(e) => onUpdate(block.id, { buttonUrl: e.target.value })}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              />
            </Field>
            <Field label="배경색 직접 설정">
              <input
                type="color"
                value={block.bgColor || "#ffffff"}
                onChange={(e) => onUpdate(block.id, { bgColor: e.target.value })}
                className="h-8 w-full cursor-pointer rounded border border-gray-200"
              />
            </Field>
            <Field label="버튼색 직접 설정">
              <input
                type="color"
                value={block.buttonColor || "#4f46e5"}
                onChange={(e) => onUpdate(block.id, { buttonColor: e.target.value })}
                className="h-8 w-full cursor-pointer rounded border border-gray-200"
              />
            </Field>
          </div>
        )}

        {/* usage-steps */}
        {block.type === "usage-steps" && (
          <div className="space-y-3">
            <p className={`text-xs ${WORKSPACE_TEXT.muted}`}>
              단계 {block.steps.length}개 (최대 6개) — 아래 블록에서 직접 수정
            </p>
          </div>
        )}

        {/* video */}
        {block.type === "video" && (
          <div className="space-y-3">
            <Field label="파일 형식">
              <select
                value={block.mediaType ?? "mp4"}
                onChange={(e) => onUpdate(block.id, { mediaType: e.target.value as "mp4" | "gif" })}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              >
                <option value="mp4">영상 (MP4)</option>
                <option value="gif">GIF</option>
              </select>
            </Field>
            <Field label="포스터 이미지">
              <ImagePicker
                projectId={projectId}
                currentUrl={block.posterUrl}
                onImageChange={(url) => onUpdate(block.id, { posterUrl: url })}
              />
            </Field>
          </div>
        )}

        {/* faq */}
        {block.type === "faq" && (
          <div className="space-y-3">
            <BlockTextGenerator
              blockType="faq"
              onResult={(r) => {
                const res = r as { items?: Array<{ question: string; answer: string }> };
                if (res.items) {
                  onUpdate(block.id, {
                    items: res.items.map((item) => ({
                      id: `faq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                      question: item.question,
                      answer: item.answer,
                    })),
                  });
                }
              }}
              renderPreview={(r) => {
                const res = r as { items?: Array<{ question: string; answer: string }> };
                return (
                  <ul className="space-y-1.5">
                    {res.items?.map((item, i) => (
                      <li key={i}>
                        <p className="font-medium">Q. {item.question}</p>
                        <p className="text-[var(--takdi-text-muted)]">A. {item.answer}</p>
                      </li>
                    ))}
                  </ul>
                );
              }}
            />
            <p className={`text-xs ${WORKSPACE_TEXT.muted}`}>
              질문 {block.items.length}개 (최대 10개) — 아래 블록에서 직접 수정
            </p>
          </div>
        )}

        {/* notice */}
        {block.type === "notice" && (
          <div className="space-y-3">
            <Field label="스타일">
              <select
                value={block.noticeStyle ?? "default"}
                onChange={(e) => onUpdate(block.id, { noticeStyle: e.target.value as "default" | "compact" })}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              >
                <option value="default">기본</option>
                <option value="compact">간결</option>
              </select>
            </Field>
            <p className={`text-xs ${WORKSPACE_TEXT.muted}`}>
              항목 {block.items.length}개 (최대 8개) — 아래 블록에서 직접 수정
            </p>
          </div>
        )}

        {/* banner-strip */}
        {block.type === "banner-strip" && (
          <div className="space-y-3">
            <BlockTextGenerator
              blockType="banner-strip"
              onResult={(r) => {
                const res = r as { text?: string; subtext?: string };
                onUpdate(block.id, {
                  ...(res.text ? { text: res.text } : {}),
                  ...(res.subtext ? { subtext: res.subtext } : {}),
                });
              }}
              renderPreview={(r) => {
                const res = r as { text?: string; subtext?: string };
                return (
                  <div className="space-y-0.5">
                    {res.text && <p className="font-semibold text-[var(--takdi-text)]">{res.text}</p>}
                    {res.subtext && <p className="text-[var(--takdi-text-muted)]">{res.subtext}</p>}
                  </div>
                );
              }}
            />
            <Field label="배경색">
              <input
                type="color"
                value={block.bgColor || "#4f46e5"}
                onChange={(e) => onUpdate(block.id, { bgColor: e.target.value })}
                className="h-8 w-full cursor-pointer rounded border border-gray-200"
              />
            </Field>
            <Field label="텍스트색">
              <input
                type="color"
                value={block.textColor || "#ffffff"}
                onChange={(e) => onUpdate(block.id, { textColor: e.target.value })}
                className="h-8 w-full cursor-pointer rounded border border-gray-200"
              />
            </Field>
          </div>
        )}

        {/* price-promo */}
        {block.type === "price-promo" && (
          <div className="space-y-3">
            <p className={`text-xs ${WORKSPACE_TEXT.muted}`}>
              할인율 자동 계산 — 아래 블록에서 가격 직접 수정
            </p>
          </div>
        )}

        {/* trust-badge */}
        {block.type === "trust-badge" && (
          <div className="space-y-3">
            <p className={`text-xs ${WORKSPACE_TEXT.muted}`}>
              뱃지 {block.badges.length}개 (최대 8개) — 아래 블록에서 직접 수정
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--takdi-text-subtle)]">{label}</label>
      {children}
    </div>
  );
}
