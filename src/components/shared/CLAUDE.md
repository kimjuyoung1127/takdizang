# shared/
페이지 간 재사용되는 공통 UI 컴포넌트.

## Files
- `summary-card.tsx`: 통계 요약 카드 (takdi-panel-strong + stat-label/value)
- `inline-edit.tsx`: 텍스트 인라인 편집 (클릭→input→Enter 저장)
- `usage-progress-bar.tsx`: 사용량 프로그레스바 (used/limit, 80%↑주황, 100%빨강)

## Convention
- 특정 페이지에 종속되지 않는 공통 패턴만 이 폴더에 배치
- shadcn/ui 프리미티브와 takdi 디자인 토큰을 함께 사용
- 각 컴포넌트는 독립적 — 상위 상태나 context에 의존하지 않음
