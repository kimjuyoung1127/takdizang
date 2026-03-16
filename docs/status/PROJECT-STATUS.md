# Takdizang Project Status

Last Updated: 2026-03-16 (KST, 컴포즈 AI 생성 허브 통합)

## Latest Update

### 컴포즈 AI 생성 허브 통합 (2026-03-16)
- **블록 텍스트 생성 UX 개선**: 톤 프리셋 5종(공식적/캐주얼/재미있게/프리미엄/친근하게) + 자유 프롬프트 + 미리보기/재생성 플로우
- **모델컷 합성 프롬프트 추가**: 에셋 선택 + 스타일/포즈 프롬프트 입력 가능
- **AI 이미지 생성 블록 통합**: hero/image-full/image-text 블록에서 프롬프트 → 이미지 생성 → 적용
- **AI 허브 패널 (우측 탭)**: 속성/AI허브 탭 분리, 이미지 생성·영상 렌더링·썸네일·마케팅 스크립트 4개 섹션
- **Status 가드**: generated/exported 상태에서만 AI 허브 기능 활성, 미달 시 비활성 + 안내

### UI 완성도 개선 (2026-03-16)
- DB seed 데이터 삽입: 8개 프로젝트, 10개 에셋, 3개 템플릿, 12개 사용 이벤트, 4개 잡, 3개 내보내기
- 랜딩 페이지 텍스트를 사용자 대상 소개 문구로 교체
- 사이드바 "Mac Mini + NAS" 카드 제거
- 모드 카드 여백/높이 조정 (min-h-[168px], p-6)
- 설정 페이지 SummaryCard 높이 균일화 (min-h-[140px])
- 홈 그리드 2xl:grid-cols-8 제거 → 최대 4열로 제한

### 컴포즈 에디터 개선 (2026-03-16)
- **워크스페이스 에셋 브라우저**: 다른 프로젝트 에셋을 컴포즈 블록에서 선택 가능
  - `GET /api/workspace/assets` API 추가
  - AssetGrid에 workspace scope 모드 추가
  - ImageUploadZone에 "프로젝트 파일" / "전체 에셋" 탭
- **블록별 AI 문구 생성**: text-block, selling-point, review, faq, banner-strip 5개 블록
  - `POST /api/projects/[id]/generate-block-text` API 추가
  - Gemini 블록 타입별 전용 프롬프트 + JSON 스키마 강제
- **모델컷 합성 블록 내 통합**: hero/image-full/image-text 블록에서 직접 실행
  - ModelComposeAction 컴포넌트 (비동기 폴링)
- **배경 제거 블록 내 통합**: 이미지 블록에서 원클릭 배경 제거
  - RemoveBgAction 컴포넌트

### Playwright 시각 테스트 환경 (2026-03-16)
- playwright.config.ts + e2e/visual/pages.spec.ts 추가
- desktop (1440×900), tablet (768×1024), mobile (375×812) 3개 뷰포트
- home, settings, landing, projects 4개 페이지 스크린샷 기준선 저장

### 이전 업데이트 (2026-03-15)
- Takdi-style docs operating process 도입
- Supabase 런타임 데이터 레이어 전환 완료
- Supabase Storage 업로드/아티팩트 마이그레이션 완료
- 스토리지 스모크 테스트 완료

## Current Phase
- 컴포즈 페이지가 모든 AI 기능의 중앙 허브 역할 수행 (에디터 기능 대체)
- 우측 패널 탭 분리: 블록 속성 편집 + AI 생성 허브
- 블록 텍스트 생성에 톤/프롬프트 제어 + 미리보기/재생성 UX 추가
- 이미지 블록에서 직접 AI 이미지 생성 가능

## Current Snapshot
- App routes available:
  - `/` (홈 — 8개 모드 카드 + 최근 프로젝트 + 템플릿)
  - `/projects` (프로젝트 탐색기)
  - `/workspace` (워크스페이스 허브)
  - `/settings` (런타임/스토리지/운영 현황)
  - `/landing` (마케팅 랜딩)
  - project subroutes: `compose`, `editor`, `preview`, `result`
- API surface: 25개 route handlers (기존 23 + workspace/assets, generate-block-text)
- 컴포즈 블록 AI 기능: Scene Compose + Model Compose + Remove BG + Block Text Generator + Image Generate + AI Hub Panel
- Playwright visual test: 12개 (4 pages × 3 viewports)

## Validation
- `npm run build`
- `npm run typecheck` — 에러 0
- `npm test` — 8파일 104테스트 통과
- `npx playwright test` — 12개 시각 테스트 통과

## Known Risks
- Kie API 크레딧 부족으로 썸네일 스모크 차단
- Gemini API 키 leak 플래그로 마케팅 스크립트 스모크 차단
- Windows/.next 캐시 불안정 → `.next` 삭제 후 재빌드로 복구

## Next Actions
1. `GEMINI_API_KEY` 활성화 후 블록 텍스트 생성 + AI 허브 E2E 확인
2. `KIE_API_KEY` 충전/교체 후 이미지 생성 + 모델컷 + 썸네일 E2E 확인
3. AI 허브 영상 렌더링/마케팅 스크립트 E2E 확인
4. 컴포즈 에디터 추가 기능 검토: 상품 URL 자동 채움, 버전 히스토리
