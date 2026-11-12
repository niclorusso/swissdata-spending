import { geo, gemeinden, ktGemeinden, KT_WITH_ALL_GEMEINDEN, popGemeinden, type Gemeinde, type KtGemeinde, type KtGemeinden, type Measure } from "@/lib/data";
import { bbox, touches } from "@/lib/geo";
import { kantonName } from "@/lib/labels";
import { currentLang } from "@/lib/lang";

export type ComuneProfile = { id: string; name: string; kt: string; pop: number | null; aff?: Gemeinde; kant?: KtGemeinde; kantMeta?: { year: number; measures: Measure[] } };

/** BFS number ranges are per canton only for some cantons; we only need TI and ZH here. */
export function inKanton(bfs: number, kt: string): boolean {
  return kt === "zh" ? bfs >= 1 && bfs <= 299 : kt === "ti" ? bfs >= 5001 && bfs <= 5399 : false;
}

/** Every municipality for which at least one source publishes individual accounts. */
export function allProfiles(): Record<string, ComuneProfile> {
  const out: Record<string, ComuneProfile> = {};
  const pop = popGemeinden().data.population;
  for (const g of Object.values(gemeinden().data.gemeinden)) {
    if (!Object.keys(g.aufwand).length) continue;
    const id = String(g.bfs_nr);
    const lastY = String(Math.max(...Object.keys(g.aufwand).map(Number)));
    out[id] = { id, name: g.name, kt: g.kanton.toLowerCase(), pop: pop[id]?.values[lastY] ?? null, aff: g };
  }
  for (const kt of KT_WITH_ALL_GEMEINDEN) {
    const s = ktGemeinden(kt).data;
    for (const [id, g] of Object.entries(s.gemeinden)) {
      out[id] = { ...(out[id] ?? { id, name: g.name, kt, pop: g.pop }), kant: g, kantMeta: { year: s.year, measures: s.measures } };
      if (g.pop) out[id].pop = g.pop;
    }
  }
  return out;
}

/** Shapes, lakes and neighbours for the municipal map of one canton. */
export function kantonMap(kt: string, s: KtGemeinden) {
  const g = geo().data;
  const ids = Object.keys(g.municipalities).filter((id) => inKanton(Number(id), kt));
  const shapes = ids.map((id) => ({ id, d: g.municipalities[id] }));
  const box = bbox([g.cantons[kt]]);
  const lakes = g.lakes.filter((d) => touches(d, box));
  const context = Object.entries(g.cantons).filter(([k, d]) => k !== kt && touches(d, box)).map(([, d]) => d);
  const missing = ids.filter((id) => !s.gemeinden[id]);
  return { viewBox: box, shapes, lakes, context, missing };
}

export const kantonLabel = (kt: string) => (currentLang() === "en" ? `Canton of ${kantonName(kt)}` : `Canton ${kantonName(kt)}`);

/** Italian names people actually type; the sources use the official local name. */
const ALIAS: Record<string, string[]> = {
  "Zürich": ["Zurigo", "Zurich"], "Genève": ["Ginevra", "Geneva"], "Bern": ["Berna", "Berne"], "Luzern": ["Lucerna", "Lucerne"], "Chur": ["Coira"], "Lausanne": ["Losanna"],
  "St. Gallen": ["San Gallo"], "Fribourg": ["Friburgo"], "Solothurn": ["Soletta"], "Schaffhausen": ["Sciaffusa"], "Zug": ["Zugo"],
  "Schwyz": ["Svitto"], "Glarus": ["Glarona"], "Biel/Bienne": ["Bienne"], "Sion": ["Sitten"], "Brig-Glis": ["Briga"], "Neuchâtel": ["Neuchatel"],
  "Winterthur": ["Winterthur"], "Köniz": ["Koniz"], "St. Moritz": ["San Maurizio"],
};
export type SearchEntry = { id: string; name: string; kt: string; alt?: string[]; hint?: string; href?: string };

export function searchItems(): SearchEntry[] {
  const out: SearchEntry[] = [];
  const en = currentLang() === "en";
  for (const p of Object.values(allProfiles())) {
    out.push({ id: p.id, name: p.name, kt: p.kt, alt: en ? ALIAS[p.name]?.slice().reverse() : ALIAS[p.name] });
    for (const part of p.kant?.merged_from ?? []) {
      if (part.name !== p.name) out.push({ id: `${p.id}-${part.name}`, name: part.name, kt: p.kt, hint: en ? `now ${p.name}` : `oggi ${p.name}`, href: `/comuni/${p.id}/` });
    }
  }
  // Basilea non ha conti comunali propri: i compiti della città sono svolti dal Cantone.
  out.push({ id: "bs-stadt", name: "Basel", kt: "bs", alt: ["Basilea"], hint: en ? "accounts are in the canton's" : "conti nel Cantone", href: "/cantoni/bs/" });
  return out.sort((a, b) => a.name.localeCompare(b.name, "it"));
}

/** The municipalities of the same canton closest in population, for a "compare with" row. */
export function peersOf(p: ComuneProfile, n = 4): ComuneProfile[] {
  const all = Object.values(allProfiles()).filter((q) => q.kt === p.kt && q.id !== p.id && q.pop && (p.kant ? q.kant : q.aff));
  return all.sort((a, b) => Math.abs((a.pop ?? 0) - (p.pop ?? 0)) - Math.abs((b.pop ?? 0) - (p.pop ?? 0))).slice(0, n).sort((a, b) => (b.pop ?? 0) - (a.pop ?? 0));
}

export const KT_ADJ: Record<string, string> = { ti: "ticinesi", zh: "zurighesi" };
/** "Comuni ticinesi" / "municipalities in Ticino" */
export const ktMunicipalities = (kt: string) => (currentLang() === "en" ? `municipalities in ${kantonName(kt)}` : `Comuni ${KT_ADJ[kt] ?? ""}`.trim());
