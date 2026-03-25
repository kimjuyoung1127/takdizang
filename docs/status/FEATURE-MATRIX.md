# Feature Matrix

Last Updated: 2026-03-25 (KST, UX 텍스트 리라이팅 + i18n 반영)
Status enum: `Not Started | In Progress | Done | Blocked | Deferred`

| ID | Feature | Status | Owner | Notes |
|---|---|---|---|---|
| DOCS-001 | Takdi-style docs process import | Done | codex | Root `CLAUDE.md` + `docs/status` + `docs/ref` added |
| INFRA-001 | Takdi UI/route copy into separate repo | Done | codex | Public repo keeps Takdi screens and route structure |
| INFRA-002 | Supabase-backed Prisma compatibility adapter | Done | codex | `src/lib/prisma.ts` maps Prisma API onto Supabase |
| INFRA-003 | Prisma removal from runtime | Done | codex | Runtime uses Supabase directly |
| INFRA-004 | Ollama removal | Done | codex | Local LLM dependency removed |
| INFRA-005 | ComfyUI removal | Done | codex | Local image provider stack removed |
| INFRA-006 | Kie-only image provider registry | Done | codex | Provider registry favors Kie for image generation |
| INFRA-007 | Supabase storage buckets | Done | codex | `project-assets`, `artifacts`, `thumbnails` buckets |
| INFRA-008 | `/uploads` proxy over Supabase Storage | Done | codex | UI consumes `/uploads/...`, backend serves from Storage |
| INFRA-009 | Project deletion storage cleanup | Done | codex | DB delete clears storage prefix |
| QA-001 | Storage smoke test | Done | codex | Project create/upload/view/delete validated |
| QA-002 | Thumbnail artifact smoke | Blocked | codex | Blocked by Kie credit insufficiency |
| QA-003 | Marketing-script artifact smoke | Blocked | codex | Blocked by disabled Gemini API key |
| QA-004 | Export artifact smoke | In Progress | codex | Waiting on upstream providers |
| QA-005 | Playwright visual regression tests | Done | claude | 4 pages × 3 viewports, baseline snapshots saved |
| LANDING-001 | Custom marketing landing page | Deferred | unassigned | `/landing` intentionally left open |
| UI-001 | DB seed data insertion | Done | claude | 8 projects + 10 assets + 3 templates + 12 usage + 4 jobs + 3 exports |
| UI-002 | Landing page text improvement | Done | claude | 개발자 placeholder → 사용자 대상 소개 문구 |
| UI-003 | Sidebar Mac Mini+NAS card removal | Done | claude | 불필요한 인프라 카드 제거 |
| UI-004 | Mode card spacing/height fix | Done | claude | min-h-[168px], p-6, max 4열 그리드 |
| UI-005 | Settings SummaryCard height uniformity | Done | claude | min-h-[140px] 추가 |
| COMPOSE-001 | Workspace asset browser | Done | claude | `GET /api/workspace/assets` + AssetGrid scope 모드 |
| COMPOSE-002 | Block-level AI text generation | Done | claude | AiGenerateTab 단일 통합 (드래그드롭 방식) |
| COMPOSE-003 | Model compose in-block integration | Done | claude | ModelComposeAction → hero/image-full/image-text |
| COMPOSE-004 | Remove-bg in-block integration | Done | claude | RemoveBgAction → hero/image-full/image-text |
| COMPOSE-005 | Product URL auto-fill | Not Started | unassigned | URL → 상품 정보 크롤링 → 블록 자동 채움 |
| COMPOSE-006 | Version history | Not Started | unassigned | 저장 이력 비교/복원 |
| COMPOSE-007 | Block text generation UX (tone/prompt/preview) | Done | claude | AiGenerateTab: 톤 프리셋 5종 + 자유 프롬프트 + 결과 드래그칩 |
| COMPOSE-008 | Model compose prompt input | Done | claude | 스타일/포즈 프롬프트 입력 → briefText와 결합 |
| COMPOSE-009 | AI image generation in-block | Done | claude | ImageGenerateAction → hero/image-full/image-text + image-grid/comparison |
| COMPOSE-010 | AI Hub → right panel tab refactor | Done | claude | 우측 패널 "속성/AI 생성" 탭 통합, 툴바 AI 도구 드롭다운/모달 유지 |
| COMPOSE-011 | BlockTextGenerator removal | Done | claude | 14개 블록 인라인 AI 제거 → AiGenerateTab으로 단일화 (-548줄) |
| COMPOSE-012 | Insert preview at position | Done | claude | ghost block이 insertAt 위치에 표시 (기존: 항상 맨 끝) |
| SCHEMA-001 | TEXT→JSONB migration | Done | claude | content, input, output, metadata, snapshot, detail → JSONB + GIN indexes |
| SCHEMA-002 | CHECK constraints | Done | claude | project status/mode, job status 표준화 |
| SCHEMA-003 | Composite indexes + updated_at | Done | claude | 4개 테이블 updated_at 추가, 3개 복합 인덱스 |
| AUTH-001 | Auth schema (profiles + workspace_members) | Done | claude | profiles, workspace_members, auto-provisioning trigger |
| AUTH-002 | Supabase SSR auth clients | Done | claude | server.ts, browser.ts + @supabase/ssr 패키지 |
| AUTH-003 | Next.js middleware (session guard) | Done | claude | 미인증 → /login redirect, public 경로 허용 |
| AUTH-004 | Login/signup pages | Done | claude | email/password + Google OAuth, (auth) route group |
| AUTH-005 | workspace-guard async rewrite | Done | claude | getAuthContext() 기반, 24+ API route await 전환 |
| AUTH-006 | RLS policies | Done | claude | 9개 테이블 RLS, get_my_workspace_ids() 헬퍼 |
| AUTH-007 | /uploads auth protection | Done | claude | 세션 체크 추가 |
| AUTH-008 | Sidebar profile + logout | Done | claude | 아바타/이름 표시, 로그아웃 버튼 |
| USAGE-001 | Usage limit guard | Done | claude | 월간 사용량 체크, free-tier 한도 |
| JSONB-001 | JSON.parse/stringify JSONB compatibility | Done | claude | parseJsonField 유틸 + 20+ 파일 안전 파싱 전환 |
| EDITOR-001 | React Flow 노드 그래프 에디터 | Done | claude | node-editor-shell.tsx 기반 그래프 편집 |
| EDITOR-002 | 6개 모드별 파이프라인 실행 | Done | claude | shortform-video, model-shot, cutout, brand-image, freeform, gif-source |
| EDITOR-003 | 구조보기(Expert) 단일 뷰 | Done | claude | Simple 모드 제거 완료, 가이드형 읽기전용 + 자유형 편집 |
| EDITOR-004 | 가이드 그래프 검증 + 자동 복구 UI | Done | claude | 누락 노드/엣지 감지 → 자동 복구 |
| EDITOR-005 | ~~Step Editor 위저드~~ | Removed | claude | Simple 모드와 함께 제거 (b385eca) |
| EDITOR-006 | Remotion 프리뷰 (3비율) + 내보내기 폴링 | Done | claude | 9:16, 1:1, 16:9 비율 + 렌더링 상태 폴링 |
| EDITOR-007 | 에셋 업로드 (이미지/BGM) | Done | claude | 인라인 라이트박스 + BGM 업로드 |
| EDITOR-008 | Undo/Redo (50 스택) + 자동저장 (30초) | Done | claude | Compose와 동일 패턴 |
| EDITOR-009 | 프로젝트 이름 인라인 편집 | Done | claude | 에디터 헤더 내 편집 |
| EDITOR-010 | 키보드 단축키 | Done | claude | Ctrl+S/Enter/Z, Esc, Delete |
| TOKEN-001 | Design token CSS variable foundation | Done | claude | globals.css에 22개 --takdi-* 변수 + @theme inline radius 매핑 |
| TOKEN-002 | Block state CSS classes | Done | claude | .takdi-block, .takdi-block-selected/-fill/-default, .takdi-add-button |
| TOKEN-003 | Block renderer token unification (17 files) | Done | claude | 하드코딩 selected/hover/default → CSS 클래스 통일 |
| TOKEN-004 | Remaining component token migration (40+ files) | Done | claude | hex/rgb → var() 참조 (compose, layout, home, auth) |
| UX-001 | UX 텍스트 프로덕션 리라이팅 | Done | claude | 41파일 해요체 통일, 개발 용어→사용자 친화 용어 |
| UX-002 | 한글 줄바꿈 (word-break: keep-all) | Done | claude | globals.css + overflow-wrap: break-word |
| UX-003 | i18n 구조 확장 | Done | claude | MessageSchema + ko.ts + useT() hook, 4개 섹션 |
| UX-004 | Playwright 스냅샷 갱신 | Done | claude | 12개 PNG 베이스라인 재생성 (4페이지 × 3뷰포트) |
| SETTINGS-001 | 설정 페이지 탭 구조 전환 | Done | claude | 개발자 정보 제거, 4개 탭 (내 계정/사용량/워크스페이스/프로바이더) |
| SETTINGS-002 | 프로필 편집 + 아바타 업로드 | Done | claude | GET/PATCH profile, POST avatar, InlineEdit 컴포넌트 |
| SETTINGS-003 | 타입별 사용량 프로그레스바 | Done | claude | FREE_LIMITS 10개 타입별 used/limit 시각화 |
| SETTINGS-004 | AI 프로바이더 연결 상태 | Done | claude | Kie.ai/Gemini/Remotion 상태 카드 (env vars 기반) |
| SHARED-001 | 공유 컴포넌트 표준화 | Done | claude | SummaryCard, InlineEdit, UsageProgressBar, .takdi-activity-item |
| MOBILE-001 | 모바일 네비게이션 (Sheet + 햄버거 메뉴) | Done | claude | shadcn Sheet + MobileNavSheet, md 미만 햄버거 메뉴 |
| MOBILE-002 | 일반 페이지 반응형 폴리싱 | Done | claude | viewport export, overflow-x clip, min-w 수정, 툴바 모바일 축소 |
| MOBILE-003 | Compose 모바일 레이아웃 | Done | claude | 3패널 → Sheet overlay + FAB (palette left, properties right) |
| MOBILE-004 | Editor 모바일 레이아웃 | Done | claude | 3패널 → Sheet overlay + FAB, fitView 자동 적용 |
| MOBILE-005 | 모바일 반응형 문서 + 테스트 검증 | Done | claude | 9파일 181테스트 통과, 빌드 성공, 문서 정합성 |
| MOBILE-006 | Compose/Editor 툴바 정리 + 데스크탑 유도 배너 | Done | claude | 모바일 저장/미리보기/내보내기만, 편집 도구 hidden md:flex |
| MOBILE-007 | DnD 터치 비활성화 + 읽기 모드 강화 | Done | claude | PointerSensor 모바일 비활성화, GripVertical 숨김, Editor readOnly |
| DEPLOY-001 | Vercel 배포 | Done | jason | https://takdizang.vercel.app (USE_MOCK=true) |
| DEPLOY-002 | Supabase Auth URL 설정 | Not Started | jason | Site URL + Redirect URLs 설정 필요 |
| DEPLOY-003 | Supabase migration 적용 | Not Started | jason | 5개 SQL 파일 순서대로 실행 |
