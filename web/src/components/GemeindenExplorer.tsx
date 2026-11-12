"use client";
import { useMemo, useState } from "react";
import { GeoMap, type Shape } from "@/components/charts/GeoMap";
import { useL } from "@/lib/useLang";

export type ExplorerMeasure = { key: string; label: string; unit: "chf" | "pct"; note: string; diverging?: boolean };
export type ExplorerRow = { id: string; name: string; pop: number | null; values: Record<string, number | null>; href?: string; flag?: string };

/** One map, several measures: pick the measure, read the map, find a municipality in the table below. */
export function GemeindenExplorer({ viewBox, shapes, lakes, context, measures, rows }: { viewBox: number[]; shapes: Shape[]; lakes: string[]; context: string[]; measures: ExplorerMeasure[]; rows: ExplorerRow[] }) {
  const { formatUnit, num, T, h, lang } = useL();
  const [key, setKey] = useState(measures[0].key);
  const [q, setQ] = useState("");
  const [sort, setSortRaw] = useState<{ key: string; desc: boolean }>({ key: measures[0].key, desc: true });
  const [all, setAll] = useState(false);
  const setSort = (key: string) => setSortRaw((s) => ({ key, desc: s.key === key ? !s.desc : key !== "name" }));
  const m = measures.find((x) => x.key === key)!;
  const data = useMemo(() => Object.fromEntries(rows.map((r) => [r.id, { name: r.name, value: r.values[key] ?? null, sub: `${num(r.pop)} ${lang === "en" ? "inhabitants" : "abitanti"}${r.flag ? ` · ${r.flag}` : ""}`, href: r.href }])), [rows, key, num, lang]);
  const list = useMemo(() => rows.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (sort.desc ? 1 : -1) * (sort.key === "name" ? b.name.localeCompare(a.name, "it") : sort.key === "pop" ? (b.pop ?? 0) - (a.pop ?? 0) : (b.values[sort.key] ?? -Infinity) - (a.values[sort.key] ?? -Infinity))), [rows, q, sort]);
  const shown = all || q ? list : list.slice(0, 25);
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={T("Misura", "Measure")}>
        {measures.map((x) => (
          <button key={x.key} type="button" role="tab" aria-selected={x.key === key} onClick={() => { setKey(x.key); setSortRaw({ key: x.key, desc: true }); }}
            className="chip">{x.label}</button>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">{m.note}.</p>
      <div className="mt-4 grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3"><GeoMap viewBox={viewBox} shapes={shapes} data={data} unit={m.unit} legendTitle={m.label} lakes={lakes} context={context} stroke={0.6} diverging={m.diverging} /></div>
        <div className="lg:col-span-2">
          <div className="eyebrow">{T("I valori più alti", "Highest values")}</div>
          <ol className="mt-2 space-y-1.5 text-sm">
            {[...rows].filter((r) => r.values[key] !== null && r.values[key] !== undefined).sort((a, b) => (b.values[key] as number) - (a.values[key] as number)).slice(0, 8).map((r, i) => (
              <li key={r.id} className="flex items-baseline justify-between gap-3 border-b border-border/70 pb-1">
                <span className="truncate"><span className="text-faint tabular mr-2">{i + 1}</span>{r.href ? <a className="hover:text-accent" href={h(r.href)}>{r.name}</a> : r.name}</span>
                <span className="tabular font-medium whitespace-nowrap shrink-0">{formatUnit(r.values[key] as number, m.unit)}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 eyebrow">{T("I valori più bassi", "Lowest values")}</div>
          <ol className="mt-2 space-y-1.5 text-sm">
            {[...rows].filter((r) => r.values[key] !== null && r.values[key] !== undefined).sort((a, b) => (a.values[key] as number) - (b.values[key] as number)).slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-baseline justify-between gap-3 border-b border-border/70 pb-1">
                <span className="truncate">{r.href ? <a className="hover:text-accent" href={h(r.href)}>{r.name}</a> : r.name}</span>
                <span className="tabular font-medium whitespace-nowrap shrink-0">{formatUnit(r.values[key] as number, m.unit)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
        <input className="field px-3 py-2 w-64" placeholder={T("Cerca un Comune…", "Find a municipality…")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={T("Cerca un Comune", "Find a municipality")} />
        <span className="text-muted">{lang === "en" ? `${num(list.length)} ${list.length === 1 ? "municipality" : "municipalities"} · click a heading to sort` : `${list.length === 1 ? "1 Comune" : `${num(list.length)} Comuni`} · clicca un'intestazione per ordinare`}</span>
      </div>
      <div className="mt-3 overflow-x-auto border-t border-border">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted">
            <tr><Th k="name" label={T("Comune", "Municipality")} sort={sort} setSort={setSort} left /><Th k="pop" label={T("Abitanti", "Inhabitants")} sort={sort} setSort={setSort} />{measures.map((x) => <Th key={x.key} k={x.key} label={x.label} sort={sort} setSort={setSort} hide={x.key !== key} />)}</tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="py-1.5 pr-3">{r.href ? <a className="link" href={h(r.href)}>{r.name}</a> : r.name}{r.flag && <span className="text-faint text-xs"> · {r.flag}</span>}</td>
                <td className="py-1.5 pr-3 text-right tabular text-muted">{num(r.pop)}</td>
                {measures.map((x) => <td key={x.key} className={`py-1.5 pr-3 text-right tabular whitespace-nowrap ${x.key === key ? "font-semibold" : "hidden md:table-cell"}`}>{r.values[x.key] === null || r.values[x.key] === undefined ? "–" : formatUnit(r.values[x.key] as number, x.unit)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && <p className="mt-4 text-sm text-muted">{T("Nessun Comune trovato per", "No municipality found for")} «{q}».</p>}
      {!all && !q && list.length > 25 && <button type="button" onClick={() => setAll(true)} className="btn-ghost mt-4">{lang === "en" ? `Show all ${num(list.length)} municipalities` : `Mostra tutti i ${num(list.length)} Comuni`}</button>}
    </div>
  );
}

function Th({ k, label, sort, setSort, left = false, hide = false }: { k: string; label: string; sort: { key: string; desc: boolean }; setSort: (k: string) => void; left?: boolean; hide?: boolean }) {
  const on = sort.key === k;
  return (
    <th className={`py-2 pr-3 font-medium align-bottom ${left ? "text-left" : "text-right"} ${hide ? "hidden md:table-cell" : ""}`} aria-sort={on ? (sort.desc ? "descending" : "ascending") : undefined}>
      <button type="button" onClick={() => setSort(k)} className={`${left ? "text-left" : "text-right"} ${on ? "text-foreground" : "hover:text-foreground"}`}>{label}{on ? (sort.desc ? " ↓" : " ↑") : ""}</button>
    </th>
  );
}
