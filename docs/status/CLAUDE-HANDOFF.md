# Claude Handoff

Last Updated: 2026-03-16 (KST, 컴포즈 AI 생성 허브 통합)
Branch: `main`

## Current Snapshot
- 컴포즈 페이지를 모든 AI 기능의 중앙 허브로 확장 완료
- 우측 패널 탭 분리: 속성 편집 ↔ AI 허브
- 블록 텍스트 생성 UX 개선: 톤 5종 + 프롬프트 + 미리보기/재생성
- 모델컷 합성에 스타일/포즈 프롬프트 입력 추가
- 이미지 블록(hero/image-full/image-text)에서 직접 AI 이미지 생성 가능
- AI 허브 패널: 이미지 생성 / 영상 렌더링 / 썸네일 / 마케팅 스크립트 4개 섹션
- Status 가드: generated/exported 상태에서만 AI 허브 기능 활성

## Recent Changes (2026-03-16, AI Hub)
### 수정 파일
- `src/app/api/projects/[id]/generate-block-text/route.ts` — tone/userPrompt 파라미터 추가
- `src/app/api/projects/[id]/model-compose/route.ts` — prompt 파라미터 추가
- `src/lib/api-client.ts` — generateBlockText, startModelCompose 시그니처 확장
- `src/components/compose/shared/block-text-generator.tsx` — 확장 패널 리라이트
- `src/components/compose/shared/model-compose-action.tsx` — 프롬프트 입력 추가
- `src/components/compose/block-properties-panel.tsx` — renderPreview + ImageGenerateAction
- `src/components/compose/compose-shell.tsx` — RightPanel 교체 + 탭 state
- `src/components/compose/compose-context.tsx` — projectStatus 추가
- `src/app/projects/[id]/compose/page.tsx` — projectStatus 전달

### 신규 파일
- `src/components/compose/shared/image-generate-action.tsx` — AI 이미지 생성 액션
- `src/components/compose/ai-hub-panel.tsx` — AI 허브 패널 (4섹션 아코디언)
- `src/components/compose/right-panel.tsx` — 탭 래퍼 (속성/AI허브)

## Important Open Issues
- `GEMINI_API_KEY` 주석 처리 상태 → 블록 텍스트 생성 실제 호출 불가
- `KIE_API_KEY` 크레딧 부족 → 이미지 생성/모델컷/썸네일 실제 호출 불가
- `generate-images` API에 `status === "generated"` 가드 → 블록 내 ImageGenerateAction에서 draft 프로젝트일 때 409 발생 가능

## Recommended Next Steps
1. `GEMINI_API_KEY` 활성화 → 블록 텍스트 생성 E2E 확인
2. `KIE_API_KEY` 충전 → 이미지 생성/모델컷/썸네일 E2E 확인
3. `generate-images` status 가드 완화 검토 (컴포즈 블록 내 호출 시)
4. 영상 렌더링 / 마케팅 스크립트 AI 허브 E2E 확인

## Validation Commands
- `npm run build`
- `npm run typecheck`
- `npm test`
- `npx playwright test`
