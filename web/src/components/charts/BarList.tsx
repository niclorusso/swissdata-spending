import { chf, num, share as fmtShare } from "@/lib/format";
import { ha } from "@/lib/lang-server";

export type BarItem = { label: string; value: number; sub?: string; href?: string; color?: string };

/** Horizontal bar list, single hue (magnitude), direct labels, tabular values. */
export function BarList({ items, total, max, unit = "chf", showShare = true, negativeNote }: { items: BarItem[]; total?: number; max?: number; unit?: "chf" | "num"; showShare?: boolean; negativeNote?: string }) {
  const m = max ?? Math.max(...items.map((i) => Math.abs(i.value)), 1);
  return (
    <ol className="space-y-2.5" data-reveal="bars">
      {items.map((i, idx) => {
        const w = Math.max(0, Math.min(100, (Math.abs(i.value) / m) * 100));
        const share = total ? (i.value / total) * 100 : null;
        const label = i.href ? <a className="link" href={ha(i.href)}>{i.label}</a> : i.label;
        return (
          <li key={idx} className="text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0">{label}{i.sub && <span className="text-faint"> · {i.sub}</span>}{i.value < 0 && negativeNote && <span className="text-faint"> · {negativeNote}</span>}</span>
              <span className="tabular whitespace-nowrap shrink-0 text-muted">
                {unit === "chf" ? chf(i.value) : num(i.value)}
                {showShare && share !== null && <span className="text-faint"> · {fmtShare(share)} %</span>}
              </span>
            </div>
            <div className="bar mt-1.5">
              <div className="bar-fill" style={{ width: `${w}%`, background: i.value < 0 ? "var(--faint)" : i.color ?? "var(--s1)", ["--i" as string]: idx }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
