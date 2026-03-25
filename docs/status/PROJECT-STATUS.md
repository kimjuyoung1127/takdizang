# Takdizang Project Status

Last Updated: 2026-03-25 (KST, UX 텍스트 리라이팅 + i18n)

## Latest Update

### 설정 페이지 프로덕션 업그레이드 (2026-03-25)
- **개발자 정보 제거**: 시스템 정보(Next.js/Supabase 버전), 저장소 정보(DB URL, 업로드 경로) 완전 제거
- **4개 탭 구조**: 내 계정(프로필/비밀번호/연결계정), 사용량(월간+타입별 프로그레스바), 워크스페이스(이름편집/통계), AI 프로바이더(연결 상태)
- **Settings API 4개**: profile GET/PATCH, avatar POST, workspace PATCH, password POST
- **공유 컴포넌트 표준화**: SummaryCard, InlineEdit, UsageProgressBar, .takdi-activity-item

### UX 텍스트 프로덕션 리라이팅 + i18n (2026-03-25)
- **해요체 통일**: 41파일의 합니다체/개발 용어 → 해요체/사용자 친화 용어로 리라이팅
- **한글 줄바꿈**: `globals.css`에 `word-break: keep-all` + `overflow-wrap: break-word`
- **i18n 구조 확장**: `MessageSchema` + `ko.ts` + `useT()` hook, editor/aiTools/exportDialog/composeToasts 섹션
- **CI 전체 통과**: React Compiler 규칙 조정, ref 패턴 수정, Playwright 스냅샷 갱신
- **테스트**: 9파일 181테스트 통과, Playwright 12개 시각 테스트 통과

### Design Token Refactoring (2026-03-25)
- **CSS 변수 22개 추가**: `--takdi-radius-*` (4단계), block-state 색상 (5개), shadow scale (4개), accent-tint/soft/inset/delete 토큰
- **블록 공통 클래스**: `.takdi-block`, `.takdi-block-selected`, `.takdi-block-selected-fill`, `.takdi-block-default`, `.takdi-add-button`
- **17개 블록 렌더러 통일**: 반복되던 선택/호버/기본 상태 inline 스타일 → CSS 클래스 1줄로 치환
- **40+ 파일 하드코딩 제거**: hex/rgb arbitrary Tailwind → `var(--takdi-*)` 참조
- **시각 변경 0**: 모든 값은 기존 하드코딩과 동일, 참조 방식만 변경
- **의도적 보류**: gradient hex (auth/cta), Remotion/React Flow 런타임, workspace-surface.ts 내부 rgb (68파일 의존)

### Compose AI UX v4 (2026-03-17)
- **블록 사이 삽입 프리뷰**: "+" 클릭 → 팔레트 클릭 → 해당 위치에 ghost 프리뷰 표시 (기존: 항상 맨 끝)
- **AI 패널 우측 통합**: 툴바 아래 슬라이드 패널 제거 → 우측 패널 "속성/AI 생성" 탭으로 통합
- **BlockTextGenerator 제거**: 14개 블록의 인라인 AI 생성 제거 (-548줄) → AI 생성 탭(드래그드롭 방식)으로 단일화
- **속성 패널 순수화**: 블록 설정(글꼴, 정렬, 색상, 이미지 등)만 담당

### 프로덕션 로드맵 Phase 0+1+2 (2026-03-16)
- **Phase 0 — Schema 정비**: TEXT→JSONB 변환 + GIN 인덱스, CHECK 제약, 복합 인덱스 3개, 4개 테이블 updated_at 추가
- **Phase 1 — Auth + Middleware + RLS**: profiles/workspace_members + 자동 프로비저닝 트리거, @supabase/ssr 기반 서버/브라우저 클라이언트, Next.js middleware, 로그인/회원가입, workspace-guard async 리라이트, 9개 테이블 RLS, /uploads 인증 보호
- **Phase 2 — Usage Limit**: 무료 한도 가드 (월간 이벤트 타입별 제한)
- **JSONB 호환성**: parseJsonField 유틸 + 20+ 파일의 JSON.parse/stringify 안전 전환

### 이전 업데이트 (2026-03-16)
- 컴포즈 블록별 AI 생성 UX 리팩토링 (16개 블록 인라인 AI)
- AI 허브 탭 제거 → 툴바 드롭다운/모달로 이전
- UI 완성도 개선 (seed 데이터, 랜딩 페이지, 사이드바)
- Playwright 시각 테스트 환경 구축

### 이전 업데이트 (2026-03-15)
- Takdi-style docs operating process 도입
- Supabase 런타임 데이터 레이어 전환 완료
- Supabase Storage 업로드/아티팩트 마이그레이션 완료

## Current Phase

### Compose — 상세페이지(블록) 편집 허브
- **우측 탭 패널**: "속성" (블록 설정) + "AI 생성" (텍스트 생성 → 드래그드롭 적용)
- **프로젝트 레벨 AI 도구**: 영상 렌더링/썸네일/마케팅 스크립트는 툴바 드롭다운 → 모달
- 18종 블록 팔레트, DnD 정렬/삽입, 블록 사이 ghost 프리뷰
- `PUT /api/projects/[id]/blocks`로 BlockDocument 저장

### Editor — 영상·이미지 파이프라인 허브
- React Flow 기반 노드 그래프 에디터
- 6개 모드: shortform-video, model-shot, cutout, brand-image, freeform, gif-source
- 구조보기(Expert) 단일 뷰 (Simple 모드 제거 완료, 가이드형/자유형 분리)
- 전체 파이프라인 실행: prompt → generate-images → bgm → cuts → render → export
- `PATCH /api/projects/[id]/content`로 EditorGraph 저장

> Compose와 Editor는 독립 병렬 동작. 런타임 상태 공유 없음.

## Current Snapshot
- App routes:
  - `/` (홈), `/projects` (탐색기), `/workspace` (허브), `/settings`, `/landing`
  - project subroutes: `compose`, `editor`, `preview`, `result`
  - auth routes: `/login`, `/signup`, `/auth/callback`
- API surface: 30+ route handlers (Settings API 5개 포함)
- 컴포즈 AI 기능: AiGenerateTab (드래그드롭) + SceneCompose + ModelCompose + RemoveBg + ImageGenerate + AI Tool Dialog
- 에디터 기능: React Flow 노드 에디터 × 6개 모드 + 구조보기 단일 뷰 + 파이프라인 실행
- Playwright visual test: 12개 (4 pages × 3 viewports)

## Validation
- `npm run build`
- `npm run typecheck` — 에러 0
- `npm test` — 9파일 181테스트 통과
- Settings API: profile, avatar, workspace, password
- `npx playwright test` — 12개 시각 테스트 통과 (스냅샷 갱신 완료)

## Known Risks
- Kie API 크레딧 부족으로 이미지 생성 mock 폴백
- Gemini API 키 비활성 → 텍스트 생성 mock 폴백
- 5개 Supabase migration 로컬에만 존재 (미적용)

## Deployment
- **Vercel**: `https://takdizang.vercel.app` (USE_MOCK=true)
- **Supabase**: `fpejnupyptyxwfhvmsop` project

## Next Actions
1. Vercel `NEXT_PUBLIC_APP_URL` 환경변수 추가
2. Supabase Auth URL 설정 (Site URL + Redirect URLs)
3. Supabase migration 적용 (5개 파일)
4. Google OAuth 설정 (선택)
5. `GEMINI_API_KEY`, `KIE_API_KEY` 활성화 → E2E 검증
6. 프로덕션 모니터링 + 버그 수정
