# compose/shared/
블록 에디터 공용 재사용 컴포넌트.

## Files
- `editable-text.tsx` — contentEditable + data-placeholder 자동 표시/클리어
- `image-upload-zone.tsx` — 이미지 업로드 영역 (명시적 "이미지 업로드" 버튼 + 드래그 드롭 + 프로젝트 파일 선택, useCompose로 projectId 접근)
- `video-upload-zone.tsx` — 영상/GIF 업로드 영역 (실패 시 toast 알림)
- `color-style-picker.tsx` — 프리셋 색상/스타일 선택기
- `asset-grid.tsx` — 프로젝트/워크스페이스 에셋 썸네일 그리드 (scope="project"|"workspace" 모드, 프로젝트별 그룹 표시)
- `image-filter-controls.tsx` — 밝기/대비/채도 CSS 필터 슬라이더 + buildFilterStyle() 헬퍼
- `scene-compose-action.tsx` — AI 배경 합성 액션 (장면 프롬프트 입력 + 비동기 폴링)
- `model-compose-action.tsx` — AI 모델컷 합성 액션 (에셋 선택 + 스타일/포즈 프롬프트 + 비동기 폴링)
- `remove-bg-action.tsx` — AI 배경 제거 원클릭 액션 (비동기 폴링)
- `block-text-generator.tsx` — **삭제됨** (AI 생성 탭으로 통합, right-panel.tsx의 AiGenerateTab 참조)
- `image-generate-action.tsx` — AI 이미지 생성 액션 (프롬프트 + 참조 에셋 + 비율 선택 + 비동기 폴링 + 미리보기/적용/재생성)
- `font-picker.tsx` — 실시간 프리뷰 포함 글꼴 선택 팝오버 (15종 FONT_PRESETS, 카테고리 탭)
- `index.ts` — barrel export

## Convention
- 모든 파일 `"use client"` 지시어 필수
- 업로드 컴포넌트는 `useCompose()` 훅으로 projectId 접근
- API: `@/lib/api-client`의 `uploadAsset` 사용
- 로딩 상태 표시 필수 (Loader2 스피너)
- `readOnly` prop 지원 (해당 시)
