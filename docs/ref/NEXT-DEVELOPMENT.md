# 다음 개발 항목

Last Updated: 2026-03-17 (KST)

---

## 1. 페이지 로딩 성능 최적화

### 빌드 분석 결과 (2026-03-17 실측)

| 페이지 | First Load JS | 페이지 청크 | 등급 |
|---|---|---|---|
| 홈 `/` | 201KB | 1.1KB | 🟢 |
| 프로젝트 `/projects` | 200KB | 0.2KB | 🟢 |
| Landing | 106KB | 0.2KB | 🟢 |
| Login/Signup | 162KB | 1.7KB | 🟢 |
| Result | 164KB | 3.7KB | 🟢 |
| Settings/Workspace | 194KB | 0.2KB | 🟢 |
| **Compose** | **206KB** | **35.7KB** | 🟡 |
| **Preview** | **208KB** | **70.2KB** | 🔴 |
| **Editor** | **218KB** | **75.1KB** | 🔴 |

### 대형 청크 맵

| 청크 | 크기 | 내용 | 격리 상태 |
|---|---|---|---|
| html2canvas | 221KB | 캡처 기능 | ✅ lazy import (`await import`) |
| Radix UI | 211KB | shadcn/ui 기반 | 공유 (회피 불가) |
| React framework | 185KB | React 코어 | 공유 (필수) |
| Supabase | 180KB | 인증+데이터 | 공유 (필수) |
| @xyflow/react | 174KB | 노드 에디터 | ✅ Editor만 격리 |
| Remotion | 162KB | 영상 플레이어 | ✅ 클릭 시 lazy import |
| JSZip | 93KB | ZIP 내보내기 | ✅ lazy import |

### 이미 최적화된 항목
- Compose/Editor: `next/dynamic` + `loading.tsx` 스켈레톤
- html2canvas, JSZip: 런타임 `await import()` lazy 로드
- Remotion Player: 2단계 지연 로드 (클릭 시만)
- @xyflow: Editor 페이지에만 격리
- 서버 컴포넌트 데이터 페칭, 폰트 `display: "swap"`

### 개선 가능 항목 (우선순위)

#### P1: Compose 블록 렌더러 동적 분할
- **현재**: block-dispatch.tsx에서 18종 블록 렌더러를 정적 import → Compose 페이지 청크 118KB
- **개선**: `React.lazy` 또는 `next/dynamic`으로 블록 타입별 분할
- **예상 효과**: Compose 초기 로드 30-40% 감소
```tsx
// 현재: import { HeroBlockRenderer } from "./block-renderers/hero-block";
// 개선: const HeroBlockRenderer = dynamic(() => import("./block-renderers/hero-block"));
```

#### P2: Compose AI 도구 모달 동적 분할
- **현재**: AiToolDialog, DraftGeneratorDialog 등이 ComposeShell에서 정적 import
- **개선**: `next/dynamic`으로 모달 열릴 때만 로드
- **예상 효과**: Compose 번들 10-15% 감소

#### P3: GlobalDebugNav 프로덕션 제거
- **현재**: `return null`이지만 번들에 포함
- **개선**: `next/dynamic`으로 감싸거나 빌드 시 제거

#### P4: `/projects` 페이지 `loading.tsx` 추가
- **현재**: 프로젝트 목록 페이지에 loading 스켈레톤 없음
- **개선**: loading.tsx 추가

#### P5: 이미지 `<img>` → `next/image` 전환
- **현재**: Compose/Editor/Result에서 `<img>` 직접 사용
- **개선**: `next/image`의 `Image` 컴포넌트로 전환 (WebP, 적응형 크기)
- **예상 효과**: 이미지 로드 50% 개선

### 테스트 방법
1. `npm run build` → 라우트별 번들 크기 비교 (before/after)
2. Chrome DevTools → Lighthouse Performance (LCP, FCP, TTI)
3. Chrome DevTools → Network 탭 → 페이지 전환 시 청크 로드 시간
4. Chrome DevTools → Coverage 탭 → 미사용 JS 비율
5. Vercel Speed Insights → 실제 유저 Core Web Vitals

---

## 2. 에디터(구조보기) 업그레이드

### 현재 상태
- Simple 모드 제거 완료 → 구조보기(React Flow)가 메인
- 가이드형 모드: 구조 읽기 전용 + 검증/복구 UI 유지
- 자유형 모드: 노드 추가/복제/엣지 편집 가능

### Tier 1 — 바로 도입 가능 (React Flow 내장)
| 패턴 | 출처 | 효과 |
|---|---|---|
| NodeToolbar | React Flow 내장 | 노드 선택 시 "실행/비활성화/복제/삭제" 컨텍스트 버튼 |
| EdgeLabelRenderer | React Flow 내장 | 엣지 위에 데이터 타입 라벨 |
| 엣지 색상 코딩 | Unreal Blueprint | 텍스트=파랑, 이미지=보라, 오디오=초록 |

### Tier 2 — 중간 난이도 (커스텀 구현)
| 패턴 | 출처 | 효과 |
|---|---|---|
| 캔버스 더블클릭 노드 검색 | ComfyUI | 팔레트 안 열어도 빠른 노드 추가 |
| 노드 Mute/Bypass | Blender, Houdini | 삭제 없이 단계 건너뛰기 (M키) |
| Sticky Note | n8n, Houdini | 캔버스에 메모 (프롬프트 힌트, 브리프) |
| 개별 노드 테스트 실행 | LangFlow, n8n | 전체 파이프라인 안 돌리고 1개만 재실행 |
| 인라인 파라미터 편집 | LangFlow | 우측 패널 안 가도 노드 내에서 바로 설정 |

### Tier 3 — 장기
| 패턴 | 출처 | 효과 |
|---|---|---|
| 워크플로우 템플릿 | ComfyUI, Figma | "쇼츠 기본", "제품소개" 프리셋 저장/불러오기 |
| 프레임/그룹핑 | Blender, ComfyUI | 노드를 영역별로 묶어 시각 정리 |
| 실행 히스토리 | n8n | 과거 실행 결과 비교/롤백 |
| 노드 위 리치 프리뷰 | TouchDesigner | 텍스트/오디오 파형/비디오 썸네일 노드 표면에 |

---

## 3. 인프라/배포

### 완료
- [x] Vercel 배포: https://takdizang.vercel.app
- [x] 환경변수 설정 (USE_MOCK=true)

### 미완료
- [ ] Vercel `NEXT_PUBLIC_APP_URL` 환경변수 추가
- [ ] Supabase Auth URL 설정 (Site URL + Redirect URLs)
- [ ] Supabase migration 적용 (5개 SQL 파일)
- [ ] Google OAuth 설정
- [ ] `GEMINI_API_KEY`, `KIE_API_KEY` 활성화
- [ ] `USE_MOCK` 제거 (프로덕션 전환)
- [ ] SUPABASE_SERVICE_ROLE_KEY 로테이션 (노출됨)

---

## 4. 기능 백로그

| ID | 기능 | 상태 | 비고 |
|---|---|---|---|
| COMPOSE-005 | 상품 URL 자동 채움 | Not Started | URL → 크롤링 → 블록 자동 채움 |
| COMPOSE-006 | 버전 히스토리 | Not Started | 저장 이력 비교/복원 |
| LANDING-001 | 커스텀 마케팅 랜딩 | Deferred | `/landing` 별도 |
| DEPLOY-002 | Supabase Auth URL 설정 | Not Started | |
| DEPLOY-003 | Supabase migration 적용 | Not Started | |
