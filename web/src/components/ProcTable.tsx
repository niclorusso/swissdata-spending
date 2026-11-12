"use client";
import { useEffect, useMemo, useState } from "react";
import type { ProcRow } from "@/lib/data";
import { depCode, verfahren } from "@/lib/labels";
import { BASE } from "@/lib/lang";
import { useL } from "@/lib/useLang";
import { categoryIt, unitCodeIt } from "@/lib/labels-bund";

type SortKey = "chf" | "start" | "supplier" | "unit";
type Row = ProcRow & { unitIt: string; cat: string; hay: string };
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Client-side search over the full per-year contract list (fetched from /data/…json). Searches Italian and German. */
export function ProcTable({ year }: { year: number }) {
  const { chf, date, num, plural, T, lang } = useL();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [dep, setDep] = useState("all");
  const [proc, setProc] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "chf", desc: true });
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    fetch(`${BASE}/data/bund-beschaffungen-${year}.json`).then((r) => r.json()).then((j) => setRows((j.data.rows as ProcRow[]).map((r) => {
      const unitIt = unitCodeIt(r.unit, lang), cat = categoryIt(r.object, lang);
      return { ...r, unitIt, cat, hay: norm([r.supplier, r.unit, unitIt, r.object, cat, r.ort].join(" ")) };
    }))).catch((e) => setErr(String(e)));
  }, [year, lang]);

  const deps = useMemo(() => Array.from(new Set((rows ?? []).map((r) => r.dep))).sort(), [rows]);
  const procs = useMemo(() => Array.from(new Set((rows ?? []).map((r) => r.procedure))).sort(), [rows]);
  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = norm(q.trim());
    const f = rows.filter((r) => (dep === "all" || r.dep === dep) && (proc === "all" || r.procedure === proc) && (!needle || r.hay.includes(needle)));
    const dir = sort.desc ? -1 : 1;
    return f.sort((a, b) => dir * (sort.key === "chf" ? a.chf - b.chf : sort.key === "start" ? (a.start ?? "").localeCompare(b.start ?? "") : sort.key === "unit" ? a.unitIt.localeCompare(b.unitIt, "it") : (a.supplier ?? "").localeCompare(b.supplier ?? "", "it")));
  }, [rows, q, dep, proc, sort]);
  const sum = filtered.reduce((s, r) => s + r.chf, 0);
  const th = (key: SortKey, label: string, cls = "") => (
    <th className={`py-2 pr-3 font-medium ${cls}`} aria-sort={sort.key === key ? (sort.desc ? "descending" : "ascending") : undefined}>
      <button type="button" onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key === "chf" || key === "start" }))} className={sort.key === key ? "text-foreground" : "hover:text-foreground"}>{label}{sort.key === key ? (sort.desc ? " ↓" : " ↑") : ""}</button>
    </th>
  );

  if (err) return <p className="text-sm text-muted">{T("I dati non si sono caricati. Ricarica la pagina.", "The data did not load. Reload the page.")}</p>;
  if (!rows) return <p className="text-sm text-muted">{T("Carico i contratti del", "Loading the contracts of")} {year}…</p>;
  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center text-sm">
        <input type="search" className="field px-4 py-2.5 w-full md:w-80" placeholder={T("Cerca fornitore, ufficio, categoria, luogo…", "Search supplier, office, category, place…")} aria-label={T("Cerca tra i contratti", "Search the contracts")} value={q} onChange={(e) => { setQ(e.target.value); setLimit(50); }} />
        <select className="field px-3 py-2.5 max-w-full" value={dep} onChange={(e) => setDep(e.target.value)} aria-label={T("Dipartimento", "Department")}>
          <option value="all">{T("Tutti i dipartimenti", "All departments")}</option>
          {deps.map((d) => <option key={d} value={d}>{depCode(d, lang)}</option>)}
        </select>
        <select className="field px-3 py-2.5 max-w-full" value={proc} onChange={(e) => setProc(e.target.value)} aria-label={T("Procedura", "Procedure")}>
          <option value="all">{T("Tutte le procedure", "All procedures")}</option>
          {procs.map((p) => <option key={p} value={p}>{verfahren(p, lang)}</option>)}
        </select>
        <span className="text-muted md:ml-auto tabular">{plural(filtered.length, T("contratto", "contract"), T("contratti", "contracts"))} · {chf(sum)}</span>
      </div>
      {filtered.length === 0 ? <p className="mt-6 text-sm text-muted">{T("Nessun contratto per", "No contract for")} «{q}». {T("La ricerca guarda fornitore, ufficio, categoria e luogo.", "The search covers supplier, office, category and place.")}</p> : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                {th("supplier", T("Fornitore", "Supplier"))}
                {th("unit", T("Committente", "Buyer"), "hidden md:table-cell")}
                <th className="py-2 pr-3 font-medium hidden lg:table-cell">{T("Procedura", "Procedure")}</th>
                {th("start", T("Inizio contratto", "Contract start"), "hidden md:table-cell whitespace-nowrap")}
                {th("chf", T("Valore (IVA incl.)", "Value (incl. VAT)"), "text-right whitespace-nowrap")}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, limit).map((r, i) => (
                <tr key={i} className="border-t border-border align-top">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{r.supplier}{r.ort && <span className="font-normal text-faint"> · {r.ort}</span>}</div>
                    <div className="text-muted text-xs mt-0.5">{r.cat}</div>
                    <div className="text-muted text-xs md:hidden">{r.unitIt} · {date(r.start)}</div>
                  </td>
                  <td className="py-2 pr-3 hidden md:table-cell">{r.unitIt}</td>
                  <td className="py-2 pr-3 hidden lg:table-cell text-muted">{verfahren(r.procedure, lang)}</td>
                  <td className="py-2 pr-3 whitespace-nowrap text-muted hidden md:table-cell">{date(r.start)}</td>
                  <td className="py-2 pr-0 md:pr-3 text-right tabular whitespace-nowrap font-medium">{chf(r.chf)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length > limit && (
        <button type="button" className="btn-ghost mt-4" onClick={() => setLimit((l) => l + 200)}>{T("Mostra altri", "Show more")} ({num(filtered.length - limit)} {T("rimanenti", "left")})</button>
      )}
    </div>
  );
}
