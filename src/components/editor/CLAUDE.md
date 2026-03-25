# editor/
노드 에디터(`/projects/:id/editor`) 전용 컴포넌트.

## Files
- `node-editor-shell.tsx` — 3단 패널 쉘 + 키보드 단축키 + 자동 저장 + 토스트 알림 + 프로젝트 이름 인라인 편집 + mode prop 전달 + executePipeline 기반 동적 실행
- `floating-toolbar.tsx` — 플로팅 액션 바 (한글 툴팁, 파이프라인 단계 표시, 마지막 저장 시각, mode 인식, 글로벌 비율 토글 9:16/1:1/16:9)
- `node-palette.tsx` — 좌측 작업 단계 팔레트 (모드별 노드 필터링, MODE_NODE_CONFIG 기반)
- `node-canvas.tsx` — React Flow 캔버스 (Delete 키, 빈 캔버스 온보딩, 우클릭 메뉴, 미니맵, Undo/Redo, 엣지 발광 glow-active/glow-done)
- `takdi-node.tsx` — 커스텀 React Flow 노드 (아이콘 + 라벨 + StatusBadge + Handle + 인라인 미리보기: previewText/previewImages)
- `inline-lightbox.tsx` — 이미지 확대 오버레이 (노드 인라인 썸네일 클릭 시 표시, Esc 닫기)
- `properties-panel.tsx` — 우측 설정 패널 (설정/파일/기록/비용 탭, 비선택 시 프로젝트 요약 + 단축키 가이드, 상태 한글 표시, 노드별 비율 UI 제거됨)
- `bottom-logger.tsx` — 하단 접힘/펼침 작업 기록 패널
- `asset-upload.tsx` — BYOI 이미지/BGM 파일 업로드 컴포넌트

## Mobile
- md(768px) 미만: NodePalette/PropertiesPanel → Sheet overlay, FAB 버튼으로 접근
- Canvas: 모바일 전체 화면 + fitView 자동 적용
- 데스크탑(md+): 기존 3패널 레이아웃 유지

## Convention
- 모든 파일 `"use client"` (React Flow + 인터랙션)
- 모든 UI 라벨 한글 (Korean-first)
- API 호출: `src/lib/api-client.ts` 래퍼 사용
- 노드 타입 키: `prompt` (구 `generate`), `generate-images`, `bgm`, `cuts`, `render`, `export`, `upload-image`, `remove-bg`, `model-compose`
- 모드별 노드 설정: `src/lib/constants.ts`의 `MODE_NODE_CONFIG` 참조
- 하위 호환: `takdi-node.tsx` ICONS 맵에 `generate`와 `prompt` 둘 다 등록
- 키보드 단축키: Ctrl+S (저장), Ctrl+Enter (전체 실행), Esc (중지), Delete (노드 삭제), Ctrl+Z (실행 취소), Ctrl+Shift+Z (다시 실행)
