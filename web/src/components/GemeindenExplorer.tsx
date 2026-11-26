"use client";
import { lazy, Suspense, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { GeoMap, titleWithUnit, type Shape } from "@/components/charts/GeoMap";

// Loaded only where an explorer is shown: the other canton pages do not download the plot.
const ScatterPlot = lazy(() => import("@/components/charts/ScatterPlot").then((m) => ({ default: m.ScatterPlot })));

// The measures chosen (map, horizontal axis, vertical axis) are kept in the address as ?misura=…&x=…&y=…, so they survive the language switch and can be linked.
const URL_EVENT = "explorer-url";
const subscribeUrl = (cb: () => void) => { window.addEventListener("popstate", cb); window.addEventListener(URL_EVENT, cb); return () => { window.removeEventListener("popstate", cb); window.removeEventListener(URL_EVENT, cb); }; };
const setParams = (p: Record<string, string>) => {
  const u = new URL(window.location.href);
  for (const [k, v] of Object.entries(p)) u.searchParams.set(k, v);
  window.history.replaceState(window.history.state, "", u);
  window.dispatchEvent(new Event(URL_EVENT));
};
/** The year a note names, if it names exactly one: "Gettito fiscale per abitante nel 2022: …" -> "2022". */
const yearIn = (note: string) => { const y = [...new Set(note.match(/\b(?:19|20)\d{2}\b/g) ?? [])]; return y.length === 1 ? y[0] : null; };
import { useL } from "@/lib/useLang";

export type ExplorerMeasure = { key: string; label: string; unit: "chf" | "pct"; note: string; diverging?: boolean };
export type ExplorerRow = { id: string; name: string; pop: number | null; values: Record<string, number | null>; href?: string; flag?: string };

/**
 * One map, several measures: pick the measure, read the map, find a municipality in the table below.
 * The scatter plot puts two of the same measures side by side. Map, plot and table share one highlighted municipality.
 * The plot's caption gives, for each axis, the note of the measure (with the year it refers to) and says when the two years differ.
 * `source` is the source line of the snapshot the measures come from, repeated under the plot.
 */
export function GemeindenExplorer({ viewBox, shapes, lakes, context, measures, rows, source }: { viewBox: number[]; shapes: Shape[]; lakes: string[]; context: string[]; measures: ExplorerMeasure[]; rows: ExplorerRow[]; source?: ReactNode }) {
  const { formatUnit, num, T, h, lang } = useL();
  const search = useSyncExternalStore(subscribeUrl, () => window.location.search, () => "");
  const fromUrl = useMemo(() => { const p = new URLSearchParams(search); const ok = (k: string) => { const v = p.get(k); return v && measures.some((x) => x.key === v) ? v : null; }; return { key: ok("misura"), x: ok("x"), y: ok("y") }; }, [search, measures]);
  const key = fromUrl.key ?? measures[0].key;
  const [q, setQ] = useState("");
  // Until a heading is clicked the table follows the measure of the map, highest first.
  const [sortRaw, setSortRaw] = useState<{ key: string; desc: boolean } | null>(null);
  const sort = useMemo(() => sortRaw ?? { key, desc: true }, [sortRaw, key]);
  const [all, setAll] = useState(false);
  const setSort = (k: string) => setSortRaw({ key: k, desc: sort.key === k ? !sort.desc : k !== "name" });
  const m = measures.find((x) => x.key === key)!;
  const data = useMemo(() => Object.fromEntries(rows.map((r) => [r.id, { name: r.name, value: r.values[key] ?? null, sub: `${num(r.pop)} ${lang === "en" ? "inhabitants" : "abitanti"}${r.flag ? ` · ${r.flag}` : ""}`, href: r.href }])), [rows, key, num, lang]);
  const list = useMemo(() => rows.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (sort.desc ? 1 : -1) * (sort.key === "name" ? b.name.localeCompare(a.name, "it") : sort.key === "pop" ? (b.pop ?? 0) - (a.pop ?? 0) : (b.values[sort.key] ?? -Infinity) - (a.values[sort.key] ?? -Infinity))), [rows, q, sort]);
  const shown = all || q ? list : list.slice(0, 25);
  // Scatter plot: two measures, one dot per municipality that has both values.
  const [active, setActive] = useState<string | null>(null);
  // Two different measures: what the address asks for when it is valid, otherwise the first two that are free.
  const xy = useMemo<[string, string]>(() => {
    const free = (not: string | null) => (measures.find((m) => m.key !== not) ?? measures[0]).key;
    const x = fromUrl.x ?? free(fromUrl.y);
    const y = fromUrl.y && fromUrl.y !== x ? fromUrl.y : free(x);
    return [x, y];
  }, [fromUrl, measures]);
  const pick = (axis: 0 | 1, k: string) => { if (k !== xy[1 - axis]) setParams(axis === 0 ? { x: k, y: xy[1] } : { x: xy[0], y: k }); };
  const mx = measures.find((x) => x.key === xy[0])!, my = measures.find((x) => x.key === xy[1])!;
  const yearX = yearIn(mx.note), yearY = yearIn(my.note);
  const has = (v: number | null | undefined): v is number => v !== null && v !== undefined;
  const points = useMemo(() => rows.flatMap((r) => { const x = r.values[xy[0]], y = r.values[xy[1]]; return has(x) && has(y) ? [{ id: r.id, name: r.name, x, y }] : []; }), [rows, xy]);
  const left = rows.length - points.length;
  const count = lang === "en" ? `${num(points.length)} of ${num(rows.length)} municipalities` : `${num(points.length)} Comuni su ${num(rows.length)}`;
  const xTitle = titleWithUnit(mx.label, mx.unit), yTitle = titleWithUnit(my.label, my.unit);
  const activeRow = active ? rows.find((r) => r.id === active) : undefined;
  const activePoint = active ? points.find((p) => p.id === active) : undefined;
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={T("Misura", "Measure")}>
        {measures.map((x) => (
          <button key={x.key} type="button" role="tab" aria-selected={x.key === key} onClick={() => { setParams({ misura: x.key }); setSortRaw(null); }}
            className="chip">{x.label}</button>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">{m.note}.</p>
      <div className="mt-4 grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3"><GeoMap viewBox={viewBox} shapes={shapes} data={data} unit={m.unit} legendTitle={m.label} lakes={lakes} context={context} stroke={0.6} diverging={m.diverging} highlight={active} onActive={setActive} /></div>
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
      <div className="mt-10 border-t border-border pt-6" data-scatter>
        <h3 className="text-xl leading-tight">{T("Due misure a confronto", "Two measures compared")}</h3>
        <p className="mt-1.5 text-sm text-muted max-w-3xl leading-relaxed">{T("Ogni punto è un Comune. Passa su un punto, o toccalo, per leggere i valori: lo stesso Comune è segnato sulla mappa e nella tabella.", "Each dot is a municipality. Hover over a dot, or tap it, to read the values: the same municipality is marked on the map and in the table.")}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm">
          {([0, 1] as const).map((axis) => (
            <label key={axis} className="flex flex-col gap-1 min-w-0 max-w-full">
              <span className="eyebrow">{axis === 0 ? T("Asse orizzontale", "Horizontal axis") : T("Asse verticale", "Vertical axis")}</span>
              <select className="field px-3 py-2 max-w-full" value={xy[axis]} onChange={(e) => pick(axis, e.target.value)} data-axis={axis === 0 ? "x" : "y"}>
                {measures.map((x) => <option key={x.key} value={x.key} disabled={x.key === xy[1 - axis]}>{x.label}</option>)}
              </select>
            </label>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted" data-scatter-count>{count}.{left > 0 && <> {lang === "en" ? `For ${num(left)} ${left === 1 ? "municipality" : "municipalities"} one of the two values is missing.` : `Per ${num(left)} ${left === 1 ? "Comune" : "Comuni"} manca uno dei due valori.`}</>}</p>
        <div className="mt-4">
          <Suspense fallback={<div className="w-full rounded-xl bg-surface-2 animate-pulse" style={{ height: 400 }} />}><ScatterPlot points={points} xTitle={xTitle} yTitle={yTitle} xUnit={mx.unit} yUnit={my.unit} active={active} onActive={setActive}
            description={lang === "en"
              ? `Scatter plot, one dot per municipality, ${count}. Horizontal axis: ${xTitle}${yearX ? `, ${yearX}` : ""}. Vertical axis: ${yTitle}${yearY ? `, ${yearY}` : ""}. The values of every municipality are in the table below.`
              : `Diagramma a dispersione, un punto per Comune, ${count}. Asse orizzontale: ${xTitle}${yearX ? `, ${yearX}` : ""}. Asse verticale: ${yTitle}${yearY ? `, ${yearY}` : ""}. I valori di ogni Comune sono nella tabella qui sotto.`} /></Suspense>
        </div>
        <p className="mt-2 min-h-[2.75rem] text-sm" aria-live="polite" data-scatter-readout>
          {activeRow && activePoint && <><span className="font-semibold">{activeRow.name}</span> · {mx.label}: <span className="tabular font-medium">{formatUnit(activePoint.x, mx.unit)}</span> · {my.label}: <span className="tabular font-medium">{formatUnit(activePoint.y, my.unit)}</span></>}
          {activeRow && !activePoint && <><span className="font-semibold">{activeRow.name}</span> · <span className="text-muted">{T("non è nel grafico: manca uno dei due valori", "not in the plot: one of the two values is missing")}</span></>}
        </p>
        <ul className="mt-1 space-y-1 text-sm text-muted max-w-3xl leading-relaxed" data-scatter-notes>
          <li data-note="x" data-year={yearX ?? undefined}><span className="text-foreground">{T("Asse orizzontale", "Horizontal axis")}: {mx.label}.</span> {mx.note}.</li>
          <li data-note="y" data-year={yearY ?? undefined}><span className="text-foreground">{T("Asse verticale", "Vertical axis")}: {my.label}.</span> {my.note}.</li>
          {yearX && yearY && yearX !== yearY && <li data-note="years" className="text-foreground">{T("I due valori si riferiscono ad anni diversi", "The two values refer to different years")}: {mx.label} {yearX}, {my.label} {yearY}.</li>}
        </ul>
        {source}
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
              <tr key={r.id} data-row={r.id} data-active={r.id === active ? "true" : undefined} className={`border-t border-border ${r.id === active ? "bg-surface-2" : ""}`}
                onMouseEnter={() => setActive(r.id)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(r.id)} onBlur={() => setActive(null)}>
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
