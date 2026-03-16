# Feature Matrix

Last Updated: 2026-03-16 (KST, 컴포즈 AI 생성 허브 통합)
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
| QA-003 | Marketing-script artifact smoke | Blocked | codex | Blocked by leaked/disabled Gemini API key |
| QA-004 | Export artifact smoke | In Progress | codex | Waiting on upstream providers |
| QA-005 | Playwright visual regression tests | Done | claude | 4 pages × 3 viewports, baseline snapshots saved |
| LANDING-001 | Custom marketing landing page | Deferred | unassigned | `/landing` intentionally left open |
| UI-001 | DB seed data insertion | Done | claude | 8 projects + 10 assets + 3 templates + 12 usage + 4 jobs + 3 exports |
| UI-002 | Landing page text improvement | Done | claude | 개발자 placeholder → 사용자 대상 소개 문구 |
| UI-003 | Sidebar Mac Mini+NAS card removal | Done | claude | 불필요한 인프라 카드 제거 |
| UI-004 | Mode card spacing/height fix | Done | claude | min-h-[168px], p-6, max 4열 그리드 |
| UI-005 | Settings SummaryCard height uniformity | Done | claude | min-h-[140px] 추가 |
| COMPOSE-001 | Workspace asset browser | Done | claude | `GET /api/workspace/assets` + AssetGrid scope 모드 |
| COMPOSE-002 | Block-level AI text generation | Done | claude | 5개 블록 타입 × Gemini 전용 프롬프트 |
| COMPOSE-003 | Model compose in-block integration | Done | claude | ModelComposeAction → hero/image-full/image-text |
| COMPOSE-004 | Remove-bg in-block integration | Done | claude | RemoveBgAction → hero/image-full/image-text |
| COMPOSE-005 | Product URL auto-fill | Not Started | unassigned | URL → 상품 정보 크롤링 → 블록 자동 채움 |
| COMPOSE-006 | Version history | Not Started | unassigned | 저장 이력 비교/복원 |
| COMPOSE-007 | Block text generation UX (tone/prompt/preview) | Done | claude | 톤 프리셋 5종 + 자유 프롬프트 + 미리보기/재생성 플로우 |
| COMPOSE-008 | Model compose prompt input | Done | claude | 스타일/포즈 프롬프트 입력 → briefText와 결합 |
| COMPOSE-009 | AI image generation in-block | Done | claude | ImageGenerateAction → hero/image-full/image-text |
| COMPOSE-010 | AI Hub right panel (tab split) | Done | claude | 속성/AI허브 탭, 이미지·영상·썸네일·스크립트 4섹션 + status 가드 |
