"use client";
import { useMemo, useState } from "react";
import type { TreeNode } from "@/lib/data";
import { useL } from "@/lib/useLang";
import { it } from "@/lib/labels";

/** Year picker + drill-down bar list for a hierarchical spending tree (settori > sotto-settori). */
export function TreeExplorer({ root, years, yearStatus, defaultYear, labelDict }: { root: TreeNode; years: number[]; yearStatus: Record<string, string>; defaultYear: number; labelDict?: Record<string, string> }) {
  const { chf, share, status, T, lang } = useL();
  const [year, setYear] = useState(defaultYear);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const y = String(year);
  const total = root.values[y] ?? 0;
  const children = useMemo(() => [...root.children].filter((c) => (c.values[y] ?? null) !== null).sort((a, b) => (b.values[y] ?? 0) - (a.values[y] ?? 0)), [root, y]);
  const max = Math.max(...children.map((c) => Math.abs(c.values[y] ?? 0)), 1);
  const prevY = String(year - 1);
  const yearsWithData = years.filter((yy) => (root.values[String(yy)] ?? null) !== null);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="text-muted">{T("Anno", "Year")}</label>
        <select className="field px-3 py-1.5" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {yearsWithData.map((yy) => (
            <option key={yy} value={yy}>{yy} · {status(yearStatus[String(yy)])}</option>
          ))}
        </select>
        <span className="text-muted">{T("Totale", "Total")} <strong className="text-foreground tabular">{chf(total)}</strong> ({status(yearStatus[y])})</span>
      </div>
      <ol className="mt-4 space-y-2.5" data-reveal="bars">
        {children.map((c) => {
          const v = c.values[y] ?? 0;
          const prev = c.values[prevY];
          const delta = prev ? ((v - prev) / prev) * 100 : null;
          const isOpen = !!open[c.id];
          const kidsAll = [...c.children].filter((k) => (k.values[y] ?? null) !== null && k.values[y] !== 0).sort((a, b) => (b.values[y] ?? 0) - (a.values[y] ?? 0));
          const kids = kidsAll.length > 1 ? kidsAll : [];
          return (
            <li key={c.id} className="text-sm">
              <button type="button" onClick={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))} className="w-full text-left" aria-expanded={isOpen}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0">
                    <span className="text-faint mr-1">{kids.length ? (isOpen ? "▾" : "▸") : "·"}</span>
                    {it(c.name, labelDict, lang)}
                    
                  </span>
                  <span className="tabular whitespace-nowrap shrink-0 text-muted">
                    {chf(v)} <span className="text-faint">· {total ? share((v / total) * 100) : "–"} %</span>
                    {delta !== null && <span className={`ml-2 ${delta >= 0 ? "text-foreground/70" : "text-foreground/70"}`}>{delta >= 0 ? "+" : ""}{share(delta)} %</span>}
                  </span>
                </div>
                <div className="bar mt-1.5">
                  <div className="bar-fill" style={{ width: `${(Math.abs(v) / max) * 100}%`, background: "var(--s1)", transitionDelay: "0ms", transitionProperty: "transform, width" }} />
                </div>
              </button>
              {isOpen && kids.length > 0 && (
                <ol className="ml-5 mt-2 mb-3 space-y-1.5 border-l border-border pl-3">
                  {kids.map((k) => (
                    <li key={k.id} className="flex items-baseline justify-between gap-3 text-xs">
                      <span className="min-w-0">{it(k.name, labelDict, lang)}</span>
                      <span className="tabular text-muted whitespace-nowrap shrink-0">{chf(k.values[y])} <span className="text-faint">· {v ? share(((k.values[y] ?? 0) / v) * 100) : "–"} %</span></span>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-faint">{T("L'ultima cifra è la variazione rispetto all'anno prima. Le voci con ▸ si aprono.", "The last figure is the change from the year before. Items with ▸ open.")}</p>
    </div>
  );
}
