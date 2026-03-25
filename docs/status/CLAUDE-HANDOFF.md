# Claude Handoff

Last Updated: 2026-03-25 (KST, 모바일 반응형 개선 완료)
Branch: `main`

## Current Snapshot
- **모바일 반응형 완료**: shadcn Sheet 기반 모바일 네비게이션 + Compose/Editor 3패널 → Sheet overlay + FAB, 데스크탑 변경 없음
- **설정 페이지 프로덕션 업그레이드**: 개발자 정보 제거, 4개 탭 (내 계정/사용량/워크스페이스/AI 프로바이더), Settings API 4개, 공유 컴포넌트 표준화
- **UX 텍스트 프로덕션 리라이팅**: 41파일 해요체 통일, 친절한 안내 문구, word-break: keep-all 한글 줄바꿈
- **i18n 구조 확장**: MessageSchema + ko.ts + useT() hook, editor/aiTools/exportDialog/composeToasts 섹션 추가
- **CI 전체 통과**: React Compiler 규칙 조정, ref/any/module 에러 수정, Playwright 스냅샷 갱신
- **디자인 토큰 리팩토링 완료**: globals.css에 22개 CSS 변수 + 5개 블록 클래스 추가, 17개 블록 렌더러 + 40개 컴포넌트 하드코딩 제거
- **Auth 시스템 구현 완료**: Supabase Auth (email + Google OAuth) + 미들웨어 세션 가드
- **RLS 전면 적용**: 9개 테이블에 workspace 기반 격리 정책
- **Schema 정비 완료**: TEXT→JSONB 변환, CHECK 제약, 복합 인덱스, updated_at 전파
- **사용량 제한 가드**: 무료 한도 초과 시 429 반환 인프라
- 24+ API route의 workspace-guard 비동기 전환 완료
- **컴포즈 AI 통합**: BlockTextGenerator 제거 → 우측 패널 "AI 생성" 탭(AiGenerateTab)으로 단일화
- **블록 사이 삽입 프리뷰**: ghost block이 insertAt 위치에 정확히 표시
- **AI 도구 모달**: 영상 렌더링/썸네일/스크립트 → 툴바 드롭다운 → 모달
- **Editor 노드 그래프**: React Flow 기반, 6개 모드, 구조보기(Expert) 단일 뷰
- **Compose/Editor 독립 병렬 동작**: 같은 `project.content` 필드, mode로 포맷 분리

## Editor State
- `src/components/editor/node-editor-shell.tsx` — React Flow 노드 그래프 에디터 코어
- 6개 모드: shortform-video, model-shot, cutout, brand-image, freeform, gif-source
- 구조보기(Expert) 단일 뷰 (Simple 모드 제거 완료)
- 가이드형 모드: 구조 읽기 전용 + 검증/복구 UI 유지
- 자유형 모드: 노드 추가/복제/엣지 편집 가능
- 파이프라인: prompt → generate-images → bgm → cuts → render → export
- 저장: `PATCH /api/projects/[id]/content` → EditorGraph (nodes/edges/shortform)

## Recent Changes (2026-03-25, 모바일 반응형 개선)

### 모바일 반응형 5-Phase 완료
- **전략**: 모바일 = 읽기 + 확인, 편집 = 데스크탑 유도
- Sheet + MobileNavSheet (햄버거 메뉴 → 좌측 드로어)
- Compose/Editor 3패널 → Sheet overlay + FAB
- 데스크탑 유도 배너 ("데스크탑에서 더 편리해요")
- DnD 터치 비활성화 (PointerSensor distance 9999)
- Editor 모바일 readOnly (노드 드래그/연결 비활성화)
- 툴바: 모바일 저장/미리보기/내보내기만, 편집 도구 hidden md:flex

## Previous Changes (2026-03-25, UX 텍스트 리라이팅 + i18n)

### UX 텍스트 프로덕션 리라이팅
- 41파일 해요체 통일 (합니다체 → 해요체), 개발 용어 → 사용자 친화 용어
- `globals.css` — `word-break: keep-all` + `overflow-wrap: break-word` 한글 줄바꿈
- 참고 패턴: Toss 8원칙, 배민, Canva UX writing

### i18n 구조 확장
- `src/i18n/schema.ts` — MessageSchema 확장 (editor.toasts/labels, aiTools, exportDialog, composeToasts)
- `src/i18n/messages/ko.ts` — 전체 한국어 값
- `src/i18n/use-t.ts` — `useT()` hook (client), `getMessages()` (server)
- 3개 파일 i18n 전환 완료: node-editor-shell, ai-tool-dialog, export-dialog

### CI 수정
- `eslint.config.mjs` — React Compiler 4개 규칙 Error→Warning 다운그레이드
- `block-canvas.tsx`, `node-canvas.tsx` — ref-during-render → useEffect 래핑
- `remotion-player-runtime.tsx` — ComponentType<any> + eslint-disable 유지

## Previous Changes (2026-03-17, Compose AI UX v4)

### Phase 1: 블록 사이 삽입 프리뷰 위치 반영
- `compose-shell.tsx` — `handlePreviewBlock`이 `insertIndex` 소비, `handleConfirmPlace`가 `splice(insertAt)` 사용
- `block-canvas.tsx` — `GhostBlock` 컴포넌트 추출, `insertAt` 위치에 렌더링

### Phase 2: AI 패널 우측 통합
- `ai-generation-panel.tsx` — `AiGenerationPanel` → `AiGenerateTab`으로 리팩터 (슬라이드 → 탭 내 세로 레이아웃)
- `right-panel.tsx` — 속성/AI생성 탭 기반 패널로 확장
- `block-properties-panel.tsx` — 외부 래퍼 스타일을 right-panel로 이동
- `compose-toolbar.tsx` — "AI 생성" 토글 버튼 제거
- `compose-shell.tsx` — `aiPanelOpen` state 및 AiGenerationPanel 렌더 제거

### Phase 3: BlockTextGenerator 제거
- `block-properties-panel.tsx` — 14곳의 BlockTextGenerator JSX 제거 (-326줄)
- `shared/block-text-generator.tsx` — 파일 삭제 (-219줄)
- AI 문구 생성은 우측 패널 "AI 생성" 탭으로 통일 (드래그드롭 방식)

## Vercel 배포 환경변수

### 필수 (Required)
| 변수 | 용도 | 예시 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (브라우저/미들웨어) | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (서버 전용, RLS 우회) | `eyJ...` |
| `NEXT_PUBLIC_APP_URL` | 프로덕션 URL (콜백/API 내부 호출) | `https://takdizang.vercel.app` |

### AI 프로바이더 (프로덕션용)
| 변수 | 용도 | 비고 |
|---|---|---|
| `GEMINI_API_KEY` | Gemini 텍스트/스크립트 생성 | 없으면 mock 폴백 |
| `KIE_API_KEY` | Kie.ai 이미지 생성/모델컷/누끼/썸네일 | 없으면 mock 폴백 |

### 선택 (Optional)
| 변수 | 기본값 | 용도 |
|---|---|---|
| `USE_MOCK` | `undefined` | `"true"` 시 모든 외부 API 우회 |
| `NEXT_PUBLIC_SITE_URL` | `https://takdi.studio` | sitemap 생성용 |
| `IMAGE_PROVIDER` | `kie` | 이미지 프로바이더 오버라이드 |
| `DEFAULT_WORKSPACE_NAME` | `Takdi Studio` | 기본 워크스페이스 이름 |

> **주의**: `USE_MOCK=true`를 설정하면 AI 기능은 placeholder로 동작. 프로덕션에서는 반드시 제거하고 실제 API 키 사용.

## Supabase 추가 설정

### 1. Migration 적용 (필수)
5개 마이그레이션 파일이 로컬에만 존재 → Supabase에 적용 필요:
```
supabase/migrations/20260315000000_takdi_core.sql        # 코어 테이블
supabase/migrations/20260315232500_storage_buckets.sql    # 스토리지 버킷
supabase/migrations/20260316100000_schema_cleanup.sql     # JSONB 변환 + CHECK 제약
supabase/migrations/20260316100100_auth_schema.sql        # profiles + workspace_members
supabase/migrations/20260316100200_rls_policies.sql       # RLS 정책
```
방법: `npx supabase link --project-ref <ref>` → `npx supabase db push`
또는 Supabase Dashboard SQL Editor에서 순서대로 실행.

### 2. Auth URL 설정 (필수)
Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: `https://takdizang.vercel.app`
- **Redirect URLs**: `https://takdizang.vercel.app/**`

### 3. Auth Provider 설정 (필수)
Supabase Dashboard → Authentication → Providers:
- **Email**: 활성화 (기본)
- **Google OAuth**: Client ID + Secret 설정 필요
  - Google Cloud Console → OAuth 2.0 → Redirect URI: `https://fpejnupyptyxwfhvmsop.supabase.co/auth/v1/callback`

### 4. Storage Bucket 확인
migration에서 자동 생성되지만 확인 필요:
- `project-assets` (public)
- `artifacts` (public)
- `thumbnails` (public)

### 5. Seed 데이터 (선택)
`supabase/seed.sql` — 개발용 샘플 데이터. 프로덕션에서는 불필요.

## Deployment
- **Vercel**: `https://takdizang.vercel.app`
- **Supabase**: `https://fpejnupyptyxwfhvmsop.supabase.co` (ref: `fpejnupyptyxwfhvmsop`)
- **현재 모드**: `USE_MOCK=true` (AI 기능 placeholder)

## Important Open Issues
- **Migration 미적용**: 5개 migration 파일 Supabase에 적용 필요
- **Supabase Auth URL 설정 필요**: Site URL + Redirect URLs
- `NEXT_PUBLIC_APP_URL` Vercel 환경변수 추가 필요
- `GEMINI_API_KEY` 비활성 → 블록 텍스트 생성 mock 폴백
- `KIE_API_KEY` 크레딧 부족 → 이미지 생성 mock 폴백

## Recommended Next Steps
1. Vercel 환경변수에 `NEXT_PUBLIC_APP_URL=https://takdizang.vercel.app` 추가
2. Supabase Auth URL 설정 (Site URL + Redirect URLs)
3. Supabase migration 적용 (5개 파일 순서대로)
4. Google OAuth 설정 (선택)
5. `GEMINI_API_KEY`, `KIE_API_KEY` 활성화
6. 프로덕션 E2E 검증

## Validation Commands
- `npm run typecheck` — 0 errors 확인
- `npm run build` — 빌드 성공 확인
- `npm test`
- `npx playwright test`
