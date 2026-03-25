# compose/
상세페이지 블록 에디터(`/projects/:id/compose`) 전용 컴포넌트.

## Files
- `compose-shell.tsx` — 3패널 레이아웃 쉘 + DndContext 래퍼 (팔레트↔캔버스 통합 드래그) + 자동 저장 + Undo/Redo + AI 도구 모달 관리
- `compose-context.tsx` — ComposeProvider + useCompose() 훅 (projectId, theme, projectStatus 전달)
- `compose-toolbar.tsx` — 상단 도구바 (저장, 미리보기, 내보내기, AI 도구 드롭다운, 디자인 점검, 전체 수정, 모바일/데스크탑 전환 토글, 플랫폼 선택)
- `block-palette.tsx` — 좌측 18종 블록 팔레트 (클릭 추가 + useDraggable 드래그 추가)
- `block-canvas.tsx` — SortableContext 기반 세로 정렬 캔버스 (DndContext는 compose-shell, insertIndex 삽입 인디케이터, useDroppable 드롭존, 가드레일+자동수정, lockLayout, 모바일 375px 프리뷰)
- `block-dispatch.tsx` — 편집/미리보기 공용 블록 타입 디스패처 (`readOnly` 지원)
- `block-surface-frame.tsx` — 편집/결과/내보내기 공용 표면 래퍼 (platform width + mobile shell + theme CSS 변수)
- `block-properties-panel.tsx` — 우측 블록 타입별 동적 설정 패널 (ImagePicker + FontPicker + ColorStylePicker + ImageGenerateAction, 오버레이 편집기)
- `right-panel.tsx` — 우측 탭 패널 (속성 + AI 생성 탭, AiGenerateTab 통합)
- `ai-tool-dialog.tsx` — AI 도구 모달 (영상 렌더링·썸네일·마케팅 스크립트, 툴바 드롭다운에서 호출)
- `image-picker.tsx` — 이미지 선택/교체 팝오버 (파일 업로드 + URL 입력)
- `text-overlay-editor.tsx` — 텍스트 오버레이 편집기 (드래그 위치, 글꼴, 크기, 색상, 굵기) — 레거시, hero-block에 직접 구현으로 대체
- `theme-picker.tsx` — 7종 테마 프리셋 선택 + 커스텀 색상 편집
- `export-dialog.tsx` — 다매체 내보내기 다이얼로그 (단일/분할ZIP/카드뉴스/HTML 4모드)
- `block-preview.tsx` — 공통 블록 렌더러 기반 readOnly 프리뷰 (forwardRef 지원, 결과 페이지에서 캡처용)
- `brief-builder.tsx` — 제로 프롬프트 브리프 빌더 (카테고리/프레임워크3종/훅스타일4종/무드보드/레이아웃 선택)
- `moodboard-picker.tsx` — 카테고리별 무드보드 스타일 선택 타일
- `guardrail-indicator.tsx` — 가드레일 위반 경고 아이콘 + 자동 수정 버튼 (블록 우측)
- `card-news-layout.tsx` — 카드뉴스 1080×1080 슬라이드 레이아웃

## Sub-folders
- `block-renderers/` — 13종 블록 렌더러 (개별 파일)
- `shared/` — 공용 재사용 컴포넌트 (EditableText, ImageUploadZone, VideoUploadZone, ColorStylePicker, FontPicker, AssetGrid 등)

## Mobile
- md(768px) 미만: BlockPalette/RightPanel → Sheet overlay, FAB 버튼으로 접근
- Canvas: 모바일 전체 화면
- 블록 선택 시 모바일에서 자동으로 속성 Sheet 열기
- 데스크탑(md+): 기존 3패널 레이아웃 유지

## DnD Architecture
- `DndContext`는 **compose-shell.tsx**에서 관리 (팔레트+캔버스 통합)
- `block-palette.tsx`: 각 아이템에 `useDraggable` (id: `palette-{type}`, data: palette-item)
- `block-canvas.tsx`: `SortableContext` (기존 블록 정렬) + `useDroppable` 드롭존 (블록 사이)
- `compose-shell.tsx`: `handleDragEnd`에서 palette-item vs 기존 블록 분기 처리

## Convention
- 모든 파일 `"use client"` (dnd-kit + 인터랙션)
- 블록 타입: `src/types/blocks.ts` 정의 참조
- API: `src/lib/api-client.ts`의 `getBlocks`/`saveBlocks`/`uploadAsset` 사용
- 이미지 업로드: `useCompose()` → projectId → `uploadAsset()`
- 글꼴: `FONT_PRESETS` (15종) + `getFontFamily()` 헬퍼 (`src/lib/constants.ts`)
- UI 라벨 한글 (Korean-first)
- 키보드 단축키: Ctrl+S (저장), Ctrl+Z (실행 취소), Ctrl+Shift+Z (다시 실행), Delete (블록 삭제), ESC (삽입 인디케이터 해제)
