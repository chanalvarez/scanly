import { cn } from "@/lib/utils";

interface StockBarProps {
  count: number;
  max?: number;
}

export function StockBar({ count, max = 20 }: StockBarProps) {
  const pct = Math.min((count / max) * 100, 100);

  const color =
    count < 5
      ? "bg-red-500"
      : count < 10
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          "min-w-[2rem] text-right text-sm font-semibold tabular-nums",
          count < 5 ? "text-red-400" : count < 10 ? "text-amber-400" : "text-emerald-400"
        )}
      >
        {count}
      </span>
    </div>
  );
}
