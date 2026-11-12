"use client";
import { useMemo, useState } from "react";
import type { Unit } from "@/lib/data";
import { depName } from "@/lib/labels";
import { useL } from "@/lib/useLang";
import { unitIt } from "@/lib/labels-bund";

type Key = "personal" | "beratung" | "informatik" | "fte";
const COLS: { key: Key; label: string; en: string; wide?: boolean }[] = [
  { key: "personal", label: "Spese per il personale", en: "Staff costs" }, { key: "fte", label: "Posti a tempo pieno", en: "Full-time positions" },
  { key: "beratung", label: "Consulenza esterna", en: "External consultancy", wide: true }, { key: "informatik", label: "Informatica", en: "IT", wide: true },
];
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function UnitsTable({ units, years, defaultYear, yearStatus = {} }: { units: Unit[]; years: number[]; defaultYear: number; yearStatus?: Record<string, string> }) {
  const { chf, num, status, T, lang, en } = useL();
  const [year, setYear] = useState(defaultYear);
  const [sort, setSort] = useState<{ key: Key; desc: boolean }>({ key: "personal", desc: true });
  const [dep, setDep] = useState<string>("all");
  const [q, setQ] = useState("");
  const y = String(year);
  const deps = useMemo(() => Array.from(new Set(units.filter((u) => u.level === 2).map((u) => u.departement))), [units]);
  const rows = useMemo(() => units
    .filter((u) => u.level === 3 && COLS.some((c) => (u.values[c.key]?.[y] ?? 0) > 0))
    .filter((u) => dep === "all" || u.departement === dep)
    .filter((u) => !q || norm(`${u.name} ${unitIt(u.name, lang)}`).includes(norm(q)))
    .sort((a, b) => (sort.desc ? 1 : -1) * ((b.values[sort.key]?.[y] ?? -1) - (a.values[sort.key]?.[y] ?? -1))), [units, dep, q, sort, y, lang]);
  const bund = units.find((u) => u.level === 1);
  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center text-sm">
        <input type="search" className="field px-4 py-2.5 w-full md:w-72" placeholder={T("Cerca un ufficio (es. dogane, sanità)…", "Find an office (e.g. customs, health)…")} aria-label={T("Cerca un ufficio", "Find an office")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="field px-3 py-2.5" value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label={T("Anno", "Year")}>
          {years.map((yy) => <option key={yy} value={yy}>{yy}{yearStatus[String(yy)] && yearStatus[String(yy)] !== "R" ? ` · ${status(yearStatus[String(yy)])}` : ""}</option>)}
        </select>
        <select className="field px-3 py-2.5 max-w-full" value={dep} onChange={(e) => setDep(e.target.value)} aria-label={T("Dipartimento", "Department")}>
          <option value="all">{T("Tutti i dipartimenti", "All departments")}</option>
          {deps.map((d) => <option key={d} value={d}>{depName(d, lang)}</option>)}
        </select>
      </div>
      <p className="mt-3 text-sm text-muted">{en
        ? <>{rows.length} {rows.length === 1 ? "office" : "offices"}. Confederation total {y}: {chf(bund?.values.personal?.[y])} for staff{bund?.values.fte?.[y] ? `, ${num(bund.values.fte[y])} full-time positions` : ""}.{yearStatus[y] && yearStatus[y] !== "R" ? ` ${y} is ${status(yearStatus[y])}, not closed accounts.` : ""}</>
        : <>{rows.length} {rows.length === 1 ? "ufficio" : "uffici"}. Totale Confederazione {y}: {chf(bund?.values.personal?.[y])} per il personale{bund?.values.fte?.[y] ? `, ${num(bund.values.fte[y])} posti a tempo pieno` : ""}.{yearStatus[y] && yearStatus[y] !== "R" ? ` Il ${y} è ${status(yearStatus[y])}, non un consuntivo.` : ""}</>}</p>
      {rows.length === 0 ? <p className="mt-6 text-sm text-muted">{T("Nessun ufficio per", "No office for")} «{q}».</p> : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">{T("Ufficio", "Office")}</th>
                {COLS.map((c) => (
                  <th key={c.key} className={`py-2 pr-3 font-medium text-right ${c.wide ? "hidden md:table-cell" : ""}`} aria-sort={sort.key === c.key ? (sort.desc ? "descending" : "ascending") : undefined}>
                    <button type="button" className={`text-right ${sort.key === c.key ? "text-foreground" : "hover:text-foreground"}`} onClick={() => setSort((s) => ({ key: c.key, desc: s.key === c.key ? !s.desc : true }))}>{en ? c.en : c.label}{sort.key === c.key ? (sort.desc ? " ↓" : " ↑") : ""}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.departement + u.name} className="border-t border-border align-top">
                  <td className="py-2 pr-3">{unitIt(u.name, lang)}<div className="text-xs text-faint">{depName(u.departement, lang).split(" – ")[0]}</div></td>
                  {COLS.map((c) => (
                    <td key={c.key} className={`py-2 pr-3 text-right tabular whitespace-nowrap ${c.wide ? "hidden md:table-cell" : ""}`}>{c.key === "fte" ? num(u.values.fte?.[y], 0) : chf(u.values[c.key]?.[y])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
