# 컴포즈 에디터 개선 체크리스트

> 자기리뷰 → 구현 → 커밋 사이클로 진행. 각 페이즈 완료 시 체크 표시.

---

## 자기리뷰 결과

### 현재 강점
- 18개 블록 타입으로 이커머스 상세페이지 커버리지 우수
- Scene Compose(배경 합성) AI 기능 존재
- BriefBuilder 가이드 템플릿으로 빈 화면 → 완성 UX 제공
- 디자인 가드레일 자동 검증/수정 시스템

### 개선 완료된 약점
- ~~**모드 간 연계 없음**~~ → 워크스페이스 에셋 브라우저 + 모델컷/누끼 블록 내 통합
- ~~**AI 텍스트 생성 부재**~~ → 5개 블록 타입별 AI 문구 생성
- ~~**프로젝트 간 에셋 격리**~~ → 워크스페이스 scope 에셋 조회
- ~~**모델컷 AI 미노출**~~ → ModelComposeAction 컴포넌트
- ~~**handoff API 미사용**~~ → RemoveBgAction으로 누끼 직접 실행 가능

---

## Phase 1: 워크스페이스 에셋 브라우저 (모드 간 에셋 공유) ✅

### 커밋: `81e366d` feat(compose): 워크스페이스 에셋 브라우저 추가

### 체크리스트
- [x] `GET /api/workspace/assets` API 라우트 생성 — 워크스페이스 전체 에셋 조회
- [x] `AssetGrid`에 `scope: "project" | "workspace"` prop 추가
- [x] `ImageUploadZone`에 "프로젝트 파일" / "전체 에셋" 탭 추가
- [x] 에셋 소스 표시 (프로젝트명 + sourceType 배지 + mode 라벨)
- [x] TypeScript 타입 체크 통과
- [x] 기존 vitest 테스트 통과
- [x] 자기리뷰: 탭 전환 시에만 fetch, workspace guard 적용 확인

---

## Phase 2: 블록별 AI 문구 생성 ✅

### 커밋: `c5b45b8` feat(compose): 블록별 AI 문구 생성 기능 추가

### 체크리스트
- [x] `POST /api/projects/[id]/generate-block-text` API 라우트 생성
- [x] Gemini 프롬프트: 블록 타입별 전용 프롬프트 (text-block, selling-point, review, faq, banner-strip)
- [x] `BlockTextGenerator` 공용 컴포넌트 생성 (Sparkles 아이콘 + 로딩 상태)
- [x] `block-properties-panel.tsx`에 5개 블록 타입 패널에 연결
- [x] 생성 결과를 블록 데이터에 자동 적용 (onUpdate 호출)
- [x] TypeScript 타입 체크 통과
- [x] 기존 vitest 테스트 통과
- [x] 자기리뷰: 블록 타입별 JSON 스키마 강제, 에러 toast, 프로젝트 briefText 컨텍스트 활용

---

## Phase 3+4: 모델컷 합성 & 배경 제거 블록 내 통합 ✅

### 커밋: `b953102` feat(compose): 모델컷 합성 및 배경 제거 블록 내 통합

### 체크리스트
- [x] `ModelComposeAction` 컴포넌트 생성 (SceneComposeAction 패턴)
- [x] 에셋 선택 UI (프로젝트 이미지 참조 가능)
- [x] `RemoveBgAction` 컴포넌트 생성 (원클릭 배경 제거)
- [x] `block-properties-panel.tsx`에 hero/image-full/image-text 3개 블록에 추가
- [x] startModelCompose/pollModelCompose, startRemoveBg/pollRemoveBg 비동기 폴링
- [x] 결과 이미지를 블록 imageUrl에 자동 적용
- [x] TypeScript 타입 체크 통과
- [x] 기존 vitest 테스트 통과
- [x] 자기리뷰: SceneCompose와 UI 일관성 OK, 폴링 2초 간격 OK, imageUrl 없으면 미노출

---

## Phase 5: 통합 테스트 & 최종 리뷰 ✅

### 체크리스트
- [x] 전체 TypeScript 타입 체크 (`npx tsc --noEmit`) — 에러 0
- [x] 전체 vitest (`npx vitest run`) — 8파일 104테스트 통과
- [x] 자기리뷰 최종:
  - [x] 새 컴포넌트가 기존 디자인 시스템(WORKSPACE_CONTROL/SURFACE/TEXT)과 일관성 있음
  - [x] API 에러 시 toast.error로 사용자 피드백 제공
  - [x] 폴링 중 컴포넌트 언마운트 시 abortRef + clearTimeout으로 정리
  - [x] 버튼에 disabled 상태, title 속성 적용

---

## 수정 파일 요약

### 신규 파일 (5개)
- `src/app/api/workspace/assets/route.ts`
- `src/app/api/projects/[id]/generate-block-text/route.ts`
- `src/components/compose/shared/block-text-generator.tsx`
- `src/components/compose/shared/model-compose-action.tsx`
- `src/components/compose/shared/remove-bg-action.tsx`

### 수정 파일 (4개)
- `src/lib/api-client.ts` — getWorkspaceAssets, generateBlockText 추가
- `src/components/compose/shared/asset-grid.tsx` — workspace scope 지원
- `src/components/compose/shared/image-upload-zone.tsx` — 프로젝트/워크스페이스 탭
- `src/components/compose/shared/index.ts` — barrel export 추가
- `src/components/compose/block-properties-panel.tsx` — AI 버튼 5종 연결
