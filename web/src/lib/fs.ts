import { codedName } from "@/lib/labels";
import type { Coded, Haushalt, TreeNode } from "@/lib/data";

/** Build a 2-level TreeNode (funk1 > funk2, or art0 > art1) from a Haushalt so TreeExplorer can render it. */
export function codedTree(h: Haushalt, kind: "funk" | "art", label = "Spese"): TreeNode {
  const l1 = kind === "funk" ? h.funk1 : h.art0;
  const l2 = kind === "funk" ? h.funk2 : h.art1;
  const total = kind === "funk" ? h.total_ausgaben : sumValues(Object.values(l1));
  let id = 1;
  const node = (c: Coded, level: number, children: TreeNode[]): TreeNode => ({ id: id++, name: codedName(c), level, unit: "CHF", values: c.values, children });
  const children = Object.values(l1).map((c) => node(c, 2, Object.values(l2).filter((k) => k.code.startsWith(c.code) && k.code !== c.code).map((k) => node(k, 3, []))));
  return { id: 0, name: label, level: 1, unit: "CHF", values: total, children };
}

export function sumValues(items: Coded[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of items) for (const [y, v] of Object.entries(c.values)) out[y] = (out[y] ?? 0) + v;
  return out;
}

export function perCapita(v: number | undefined | null, pop: number | undefined | null): number | null {
  return v && pop ? v / pop : null;
}

export function years(h: Haushalt): number[] {
  return Object.keys(h.total_ausgaben).map(Number).sort();
}

/** Spending by type, second level directly (Personale, Beni e servizi, Contributi…), zero rows dropped. */
export function natureTree(h: Haushalt, label = "Spese"): TreeNode {
  let id = 1;
  const children = Object.values(h.art1).filter((c) => Object.values(c.values).some((v) => v)).map((c) => ({ id: id++, name: codedName(c), level: 2, unit: "CHF", values: c.values, children: [] as TreeNode[] }));
  return { id: 0, name: label, level: 1, unit: "CHF", values: sumValues(Object.values(h.art0)), children };
}
