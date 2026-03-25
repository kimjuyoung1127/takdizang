/** 사용량 프로그레스바 — 타입별 used/limit 시각화 */

import { cn } from "@/lib/utils";

interface UsageProgressBarProps {
  label: string;
  used: number;
  limit: number;
  costPerUnit?: number;
}

export function UsageProgressBar({ label, used, limit, costPerUnit }: UsageProgressBarProps) {
  const ratio = limit > 0 ? used / limit : 0;
  const percent = Math.min(ratio * 100, 100);

  const barColor =
    ratio >= 1
      ? "bg-red-500"
      : ratio >= 0.8
        ? "bg-amber-500"
        : "bg-[var(--takdi-accent)]";

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-[var(--takdi-text)]">{label}</span>
        <span className="text-xs text-[var(--takdi-text-subtle)]">
          {used} / {limit} 사용
          {costPerUnit != null && ` · 건당 $${costPerUnit.toFixed(2)}`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[rgb(232_219_206_/_0.5)]">
        <div
          className={cn("h-full rounded-full transition-all duration-300", barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
