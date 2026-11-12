import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export type Meta = {
  id: string; title: string; publisher: string; publisher_url: string; source_url: string; landing_url: string;
  license: string; frequency: string; level: string; unit: string; data_date: string;
  published_at: string | null; retrieved_at: string | null; checked_at: string | null; sha256: string | null;
  notes: string; coverage: string; generated_at: string; years?: number[]; year_status?: Record<string, string>;
};
export type Snapshot<T> = { meta: Meta; data: T };
export type TreeNode = { id: number; name: string; level: number; unit: string; values: Record<string, number | null>; children: TreeNode[] };
export type Series = { id: number; unit: string; topic: string; values: Record<string, number | null> };
export type Unit = { level: number; departement: string; name: string; values: Record<string, Record<string, number | null>> };
export type Top = { name: string | null; chf: number; n: number };
export type ProcYear = {
  total_chf: number; n: number; n_suppliers: number; by_department: Top[]; by_procedure: Top[]; top_suppliers: Top[];
  top_units: Top[]; top_objects: Top[]; identical_rows: { n: number; chf: number }; late_additions: { n: number; chf_added: number };
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
export const procurement = () => loadSnapshot<{ years: Record<string, ProcYear>; top_suppliers_all: Top[] }>("bund-beschaffungen");

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
export const gemeinden = () => loadSnapshot<{ gemeinden: Record<string, Gemeinde> }>("fs-gemeinden-5000");
export const popKantone = () => loadSnapshot<{ population: Record<string, Population> }>("bfs-bevoelkerung-kantone");
export const popGemeinden = () => loadSnapshot<{ population: Record<string, Population> }>("bfs-bevoelkerung-gemeinden");

/** Last year flagged as consuntivo (R) for a Haushalt. */
export function lastR(h: Haushalt): number {
  return Math.max(...Object.entries(h.year_status).filter(([, s]) => s === "R").map(([y]) => Number(y)));
}

// ---- Aggregati principali (stato dei dati, debito, quote) ----
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
};
export type KtGemeinden = { year: number; kanton: string; measures: Measure[]; gemeinden: Record<string, KtGemeinde> };
export const KT_WITH_ALL_GEMEINDEN = ["ti", "zh"] as const;
export const ktGemeinden = (kt: string) => loadSnapshot<KtGemeinden>(`gemeinden-${kt}`);
