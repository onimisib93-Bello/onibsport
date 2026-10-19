import type { ReactNode } from "react";

export interface BarListItem {
  key: string;
  label: ReactNode;
  value: number;
  /** Optional icon or marker before the label. */
  icon?: ReactNode;
  href?: string;
}

/**
 * Ranked list with a proportional bar behind each row. The value and share
 * are always written out, so nothing depends on reading the bar length.
 */
export default function BarList({ items, total, empty = "No data yet for this period." }: { items: BarListItem[]; total?: number; empty?: string }) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value));
  const sum = total ?? items.reduce((s, i) => s + i.value, 0);

  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const row = (
          <>
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 rounded-lg bg-[#5b43c4]/[0.12]"
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
            <span className="relative flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
              {item.icon}
              <span className="truncate">{item.label}</span>
            </span>
            <span className="relative ml-auto flex shrink-0 items-baseline gap-2 pl-3 text-sm">
              <span className="font-semibold tabular-nums text-ink">{item.value.toLocaleString()}</span>
              <span className="w-10 text-right text-xs tabular-nums text-muted">{sum ? Math.round((item.value / sum) * 100) : 0}%</span>
            </span>
          </>
        );
        return (
          <li key={item.key}>
            {item.href ? (
              <a href={item.href} className="relative flex items-center rounded-lg px-2.5 py-1.5 hover:bg-paper">
                {row}
              </a>
            ) : (
              <div className="relative flex items-center rounded-lg px-2.5 py-1.5">{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
