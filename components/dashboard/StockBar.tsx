import { cn } from "@/lib/utils";

interface StockBarProps {
  count: number;
  max?: number;
  threshold?: number;
}

export function StockBar({ count, max = 20, threshold = 5 }: StockBarProps) {
  const pct = Math.min((count / max) * 100, 100);

  const color =
    count < threshold
      ? "bg-red-500"
      : count < threshold * 2
      ? "bg-amber-500"
      : "bg-emerald-500";

  const textColor =
    count < threshold
      ? "text-red-400"
      : count < threshold * 2
      ? "text-amber-400"
      : "text-emerald-400";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("min-w-[2rem] text-right text-sm font-semibold tabular-nums", textColor)}>
        {count}
      </span>
    </div>
  );
}
