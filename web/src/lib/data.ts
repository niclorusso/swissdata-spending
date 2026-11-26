import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { apos } from "@/lib/format";

export type Meta = {
  id: string; title: string; publisher: string; publisher_url: string; source_url: string; landing_url: string;
  license: string; frequency: string; level: string; unit: string; data_date: string;
  published_at: string | null; retrieved_at: string | null; checked_at: string | null; sha256: string | null;
  notes: string; coverage: string; generated_at: string; years?: number[]; year_status?: Record<string, string>;
  /** Snapshots built from several files list each one. */
  files?: { label: string; url: string; published_at: string | null; retrieved_at: string; sha256: string }[];
};
export type Snapshot<T> = { meta: Meta; data: T };
export type TreeNode = { id: number; name: string; level: number; unit: string; values: Record<string, number | null>; children: TreeNode[] };
export type Series = { id: number; unit: string; topic: string; values: Record<string, number | null> };
export type Unit = { level: number; departement: string; name: string; values: Record<string, Record<string, number | null>> };
/** One row of a ranking. A supplier row that merges several spellings (data/supplier-aliases.json) lists them in `variants`. */
export type Top = { name: string | null; chf: number; n: number; variants?: { name: string; chf: number; n: number }[] };
export type ProcYear = {
  total_chf: number; n: number; n_suppliers: number; by_department: Top[]; by_procedure: Top[]; top_suppliers: Top[];
  top_units: Top[]; top_objects: Top[]; identical_rows: { n: number; chf: number }; late_additions: { n: number; chf_added: number }; no_amount: number;
  largest: { supplier: string; object: string; chf: number }; source_url: string; dataset_url: string; retrieved_at: string; published_at: string | null; sha256: string;
};
export type ProcRow = { dep: string; unit: string; supplier: string; plz: string | null; ort: string | null; object: string; procedure: string; start: string | null; end: string | null; chf: number };

const SNAP = join(process.cwd(), "..", "data", "snapshots");

export function loadSnapshot<T>(id: string): Snapshot<T> {
  return JSON.parse(readFileSync(join(SNAP, `${id}.json`), "utf8")) as Snapshot<T>;
}
export function loadLedger(): Record<string, Meta> {
  return JSON.parse(readFileSync(join(process.cwd(), "..", "data", "source-ledger.json"), "utf8"));
}
export function listSnapshots(): string[] {
  return readdirSync(SNAP).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
}

export const tree = (id: string) => loadSnapshot<{ tree: TreeNode[] }>(id);
export const kennzahlen = () => loadSnapshot<{ series: Record<string, Series> }>("bund-kennzahlen");
export const units = () => loadSnapshot<{ units: Unit[] }>("bund-verwaltungseinheiten");
/** Each spelling of each group of data/supplier-aliases.json with its contracts and value per year (computed by the ETL). */
/** `apart`: contracts of a spelling that joins its group only before a date (`only_before`) and stay apart because they start later. */
export type SupplierGroupTotals = { name: string; variants: { name: string; years: Record<string, { chf: number; n: number }>; apart?: { n: number; chf: number } }[] };
export const procurement = () => loadSnapshot<{ years: Record<string, ProcYear>; top_suppliers_all: Top[]; supplier_groups: SupplierGroupTotals[] }>("bund-beschaffungen");

// ---- Spellings of the same supplier (data/supplier-aliases.json, checked in the commercial register) ----
type Text = { it: string; en: string };
/** How a spelling matches the register: current name, registered translation, former name (or its translation), or the name without legal form. */
export type AliasMatch = "name" | "translation" | "former" | "former-translation" | "no-legal-form";
export type AliasGroup = {
  name: string; uid: string; register_name: string; seat: string; register_status: string; register_url: string; zefix_id: number; checked: string;
  branch_of?: { name: string; uid: string }; note?: Text;
  /** Changes of name from the register: date of the entry and of its publication in the SOGC; `before` when only an upper bound is known. */
  renamed?: { from: string; to: string; register_date?: string; sogc_date?: string; sogc_publication?: string; before?: string }[];
  /** `former_name`: the old name a spelling stands for; `only_before`: the spelling joins the group only for contracts that start before this date. */
  variants: { name: string; match: AliasMatch; register_name?: string; lang?: "de" | "fr" | "it" | "en"; former_name?: string; only_before?: string }[];
};
export type SupplierAliases = { about: Text; rule: Text; scope: Text; source: { name: string; url: string; checked: string }; groups: AliasGroup[]; not_merged: { names: string[]; why: Text }[] };
export const supplierAliases = () => JSON.parse(readFileSync(join(process.cwd(), "..", "data", "supplier-aliases.json"), "utf8")) as SupplierAliases;

/** The single contracts of a year worth at least `min` francs, largest first (read from the full list of that year). */
export function bigContracts(year: number | string, min = 1e9): ProcRow[] {
  return loadSnapshot<{ rows: ProcRow[] }>(`bund-beschaffungen-${year}`).data.rows.filter((r) => r.chf >= min).sort((a, b) => b.chf - a.chf);
}

/** Latest year with a value for a node (used for "consuntivo" headline numbers). */
export function lastRechnung(meta: Meta): number {
  const ys = Object.entries(meta.year_status ?? {}).filter(([, s]) => s === "R").map(([y]) => Number(y));
  return Math.max(...ys);
}

// ---- Finanzstatistik (Cantoni / Comuni / assicurazioni sociali) ----
export type Coded = { code: string; de?: string | null; it?: string | null; fr?: string | null; values: Record<string, number> };
export type Haushalt = {
  hh: string; total_ausgaben: Record<string, number>; total_einnahmen: Record<string, number>;
  funk1: Record<string, Coded>; funk2: Record<string, Coded>; art1: Record<string, Coded>; art0: Record<string, Coded>;
  year_status: Record<string, "R" | "V" | "P">;
};
export type Gemeinde = { bfs_nr: number; kanton: string; name: string; years: number[]; aufwand: Record<string, number>; ertrag: Record<string, number>; investitionen: Record<string, number>; funk1: Record<string, Coded> };
export type Population = { name: string; values: Record<string, number> };

export const haushalte = () => loadSnapshot<{ haushalte: Record<string, Haushalt> }>("fs-haushalte");
/** Names of municipalities are shown with the typographic apostrophe (Collina d’Oro, Sant’Antonino); the files keep the straight one. */
export const gemeinden = () => {
  const s = loadSnapshot<{ gemeinden: Record<string, Gemeinde> }>("fs-gemeinden-5000");
  for (const g of Object.values(s.data.gemeinden)) g.name = apos(g.name);
  return s;
};
export const popKantone = () => loadSnapshot<{ population: Record<string, Population> }>("bfs-bevoelkerung-kantone");
export type Merger = { date: string; parts: { bfs: number; name: string }[] };
export type PopGemeinden = { population: Record<string, Population>; boundaries_as_of: string; mergers: Record<string, Merger[]>; dissolved: Record<string, { date: string; into: number; into_name: string }> };
let popG: Snapshot<PopGemeinden> | null = null;
export const popGemeinden = () => (popG ??= (() => {
  const s = loadSnapshot<PopGemeinden>("bfs-bevoelkerung-gemeinden"), d = s.data;
  for (const p of Object.values(d.population)) p.name = apos(p.name);
  for (const ms of Object.values(d.mergers)) for (const m of ms) for (const q of m.parts) q.name = apos(q.name);
  for (const x of Object.values(d.dissolved)) x.into_name = apos(x.into_name);
  return s;
})());

/** Inhabitants of a municipality at the end of `year`, on the territory the accounts of that year refer to.
 *  The FSO table gives every year on the boundaries of one date (`boundaries_as_of`): if the municipality took in others after `year`,
 *  its figure for `year` includes them, and if it was merged into another one it has no figure at all. In both cases there is no
 *  population that matches the accounts, so none is returned and `why` says what happened. */
export const popGemeindenMeta = () => popGemeinden().meta;
export function popForAccounts(bfs: number | string, year: number | string): { pop: number | null; why?: { kind: "grew"; date: string; names: string[] } | { kind: "dissolved"; date: string; into: string } } {
  const d = popGemeinden().data;
  const id = String(bfs), end = `${year}-12-31`;
  const gone = d.dissolved[id];
  if (gone && !d.population[id]) return { pop: null, why: { kind: "dissolved", date: gone.date, into: gone.into_name } };
  const later = (d.mergers[id] ?? []).filter((m) => m.date > end);
  if (later.length) return { pop: null, why: { kind: "grew", date: later[0].date, names: later.flatMap((m) => m.parts.filter((q) => String(q.bfs) !== id).map((q) => q.name)) } };
  return { pop: d.population[id]?.values[String(year)] ?? null };
}

/** Last year flagged as consuntivo (R) for a Haushalt. */
export function lastR(h: Haushalt): number {
  return Math.max(...Object.entries(h.year_status).filter(([, s]) => s === "R").map(([y]) => Number(y)));
}

// ---- Aggregati principali (stato dei dati, debito, quote) ----
/** `aggregates._bip.bip` is the nominal GDP of the same file, in francs. */
export type MainAgg = { status: Record<string, Record<string, "R" | "V" | "P">>; aggregates: Record<string, Record<string, Record<string, number>>> };
export const hauptaggregate = () => loadSnapshot<MainAgg>("fs-hauptaggregate");

// ---- Confini per le mappe ----
export type Geo = { viewBox: number[]; cantons: Record<string, string>; canton_centroids: Record<string, number[]>; municipalities: Record<string, string>; municipality_centroids: Record<string, [number, number]>; lakes: string[] };
export const geo = () => loadSnapshot<Geo>("geo-grenzen");

// ---- Tutti i Comuni di un Cantone (statistiche cantonali: TI, ZH) ----
export type Measure = { key: string; label: string; unit: "chf" | "pct"; note: string; diverging?: boolean };
export type KtGemeinde = {
  name: string; pop: number | null; values: Record<string, number | null>; water_included?: boolean;
  merged_from?: { name: string; pop: number; moltiplicatore: number }[] | null; abs?: Record<string, number>;
  funk?: Record<string, number>; series?: Record<string, Record<string, number>>; steuerfuss_latest?: { year: number; value: number } | null;
  /** Ticino: the two official multipliers (individuals, companies); "coordinato" is the source's computed average, shown nowhere as a rate. */
  moltiplicatori?: { year: number; pf: number; pg: number; coordinato: number } | null;
};
export type KtGemeinden = { year: number; kanton: string; measures: Measure[]; gemeinden: Record<string, KtGemeinde> };
export const KT_WITH_ALL_GEMEINDEN = ["ti", "zh"] as const;
export const ktGemeinden = (kt: string) => {
  const s = loadSnapshot<KtGemeinden>(`gemeinden-${kt}`);
  for (const g of Object.values(s.data.gemeinden)) { g.name = apos(g.name); for (const q of g.merged_from ?? []) q.name = apos(q.name); }
  return s;
};
