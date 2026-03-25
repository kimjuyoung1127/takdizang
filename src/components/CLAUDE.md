# components/
UI 컴포넌트 루트 — 하위 폴더별로 기능 단위 분리.

## Folders
- `ui/` — shadcn/ui 기반 공통 UI 프리미티브
- `layout/` — 앱 공유 레이아웃 (사이드바, 헤더)
- `home/` — Home 화면 전용 컴포넌트
- `editor/` — 노드 에디터 전용 컴포넌트
- `preview/` — 영상 프리뷰 컴포넌트 (Remotion Player)
- `compose/` — 상세페이지 블록 에디터 컴포넌트 (dnd-kit, 18종 블록, AI 문구/모델컷/누끼 통합)
- `shared/` — 페이지 간 재사용 공통 컴포넌트 (SummaryCard, InlineEdit, UsageProgressBar)

## Convention
- 새 컴포넌트는 기능별 하위 폴더에 배치
- 클라이언트 컴포넌트는 `"use client"` 지시어 필수
- 파일 첫줄에 JSDoc 설명 주석 (`/** ... */`)
