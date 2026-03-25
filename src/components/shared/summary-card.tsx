/** 통계 요약 카드 — 설정/워크스페이스/홈에서 재사용 */

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
}

export function SummaryCard({ title, value, description }: SummaryCardProps) {
  return (
    <div className="takdi-panel-strong min-h-[140px] rounded-[1.8rem] p-6">
      <p className="takdi-stat-label">{title}</p>
      <p className="takdi-stat-value mt-3">{value}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--takdi-text-muted)]">{description}</p>
    </div>
  );
}
