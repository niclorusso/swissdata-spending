"use client";
import { useMemo, useState } from "react";
import { useL } from "@/lib/useLang";

export type GemRow = { bfs: number; kt: string; name: string; year: string; pop: number | null; aufwand: number; pc: number | null; ertrag: number | null; inv: number | null; top: string | null; topShare: number };
type Key = "pc" | "aufwand" | "pop" | "name" | "inv";

export function GemeindenTable({ rows, more = {} }: { rows: GemRow[]; more?: Record<string, { n: number; href: string }> }) {
  const { chf, num, T, h, en } = useL();
  const [all, setAll] = useState(false);
  const [q, setQ] = useState("");
  const [kt, setKt] = useState("all");
  const [sort, setSort] = useState<Key>("pc");
  const kts = useMemo(() => Array.from(new Set(rows.map((r) => r.kt))).sort(), [rows]);
  const list = useMemo(() => rows
    .filter((r) => (kt === "all" || r.kt === kt) && (!q || r.name.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : ((b[sort] ?? -1) as number) - ((a[sort] ?? -1) as number)), [rows, q, kt, sort]);
  const th = (k: Key, label: string, right = true, wide = false) => (
    <th className={`py-2 pr-3 font-medium ${right ? "text-right" : ""} ${wide ? "hidden md:table-cell" : ""}`}><button type="button" onClick={() => setSort(k)} className={sort === k ? "underline text-foreground" : ""}>{label}</button></th>
  );
  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center text-sm">
        <input className="field px-3 py-2 w-56" placeholder={T("Cerca Comune…", "Find a municipality…")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="field px-3 py-2" value={kt} onChange={(e) => setKt(e.target.value)}>
          <option value="all">{T("Tutti i Cantoni", "All cantons")}</option>
          {kts.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <span className="text-muted ml-auto">{num(list.length)} {T("Comuni", "municipalities")}</span>
      </div>
      {more[kt] && <p className="mt-3 text-sm border-l-2 border-accent pl-3">{T("Qui ci sono solo i Comuni più grandi.", "Only the larger municipalities are listed here.")} <a className="link" href={h(more[kt].href)}>{en ? `All ${more[kt].n} municipalities of the canton, with a map →` : `Tutti i ${more[kt].n} Comuni del Cantone, con mappa →`}</a></p>}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left eyebrow">
            <tr>{th("name", T("Comune", "Municipality"), false)}{th("pop", T("Abitanti", "Inhabitants"))}{th("aufwand", T("Spese correnti", "Current spending"))}{th("pc", T("Per abitante", "Per inhabitant"))}{th("inv", T("Investimenti", "Investment"), true, true)}<th className="py-2 pr-3 font-medium hidden md:table-cell">{T("Prima funzione", "Largest function")}</th></tr>
          </thead>
          <tbody>
            {(all || q || kt !== "all" ? list : list.slice(0, 30)).map((r) => (
              <tr key={r.bfs} id={`g${r.bfs}`} className="border-t border-border">
                <td className="py-1.5 pr-3"><a className="link" href={h(`/comuni/${r.bfs}/`)}>{r.name}</a> <span className="text-faint">{r.kt}</span></td>
                                <td className="py-1.5 pr-3 text-right tabular">{num(r.pop)}</td>
                <td className="py-1.5 pr-3 text-right tabular">{chf(r.aufwand)}</td>
                <td className="py-1.5 pr-3 text-right tabular font-medium">{chf(r.pc)}</td>
                <td className="py-1.5 pr-3 text-right tabular hidden md:table-cell">{chf(r.inv)}</td>
                <td className="py-1.5 pr-3 text-muted hidden md:table-cell">{r.top} <span className="text-faint">· {num(r.topShare * 100, 0)} %</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!all && !q && kt === "all" && list.length > 30 && <button type="button" onClick={() => setAll(true)} className="btn-ghost mt-4">{en ? `Show all ${num(list.length)} municipalities` : `Mostra tutti i ${num(list.length)} Comuni`}</button>}
    </div>
  );
}
