import type { Coded, Haushalt, TreeNode } from "@/lib/data";
import type { TreeItem } from "@/components/charts/Treemap";
import { codedName, it } from "@/lib/labels";

/** TreeNode (EFV Bundeshaushalt) -> TreeItem for one year, Italian labels with the German original as `sub`. */
export function treeItems(node: TreeNode, year: string, dict?: Record<string, string>): TreeItem {
  const name = it(node.name, dict);
  const kids = node.children.map((c) => treeItems(c, year, dict)).filter((c) => c.value > 0);
  return { name, value: node.values[year] ?? 0, sub: name !== node.name ? node.name : undefined, children: kids.length ? kids : undefined };
}

/** Haushalt (Finanzstatistik) functions -> TreeItem for one year: funk1 > funk2. */
export function haushaltItems(h: Haushalt, year: string, label: string): TreeItem {
  const l2 = Object.values(h.funk2);
  const children = Object.values(h.funk1).map((c: Coded) => ({
    name: codedName(c), sub: c.de ?? undefined, value: c.values[year] ?? 0,
    children: l2.filter((k) => k.code.startsWith(c.code)).map((k) => ({ name: codedName(k), sub: k.de ?? undefined, value: k.values[year] ?? 0 })).filter((k) => k.value > 0),
  })).filter((c) => c.value > 0);
  return { name: label, value: h.total_ausgaben[year] ?? 0, children };
}
