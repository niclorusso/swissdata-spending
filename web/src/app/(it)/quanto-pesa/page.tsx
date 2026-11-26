import type { Metadata } from "next";
import { Suspense } from "react";
import { haushalte, hauptaggregate, lastR, type Coded } from "@/lib/data";
import { codedName } from "@/lib/labels";
import { getLang, T } from "@/lib/lang-server";
import { NAME_IT, VOCI, type QpData, type QpGroup } from "@/lib/quanto-pesa";
import { SITE } from "@/lib/site";
import { QuantoPesa, QuantoPesaFromUrl } from "@/components/QuantoPesa";

// Reachable by address only while the owner decides: not in the navigation, not indexed.
export const metadata: Metadata = { title: "Quanto pesa?", robots: { index: false, follow: false } };

/** All spending of general government by function in the last year of actuals, from one table (fs-haushalte, `staat`). */
function build(): QpData {
  const en = getLang() === "en";
  const fs = haushalte();
  const staat = fs.data.haushalte["staat"];
  const year = String(lastR(staat));
  if (staat.year_status[year] !== "R") throw new Error(`[quanto-pesa] ${year} is not actuals for staat`);
  const total = staat.total_ausgaben[year];
  const name = (c: Coded) => (en ? codedName(c, "en") : NAME_IT[c.code] ?? codedName(c, "it")).trim();
  const lines = Object.values(staat.funk2);
  const groups: QpGroup[] = Object.values(staat.funk1).map((g) => ({
    code: g.code, name: name(g), value: g.values[year] ?? 0,
    cells: lines.filter((c) => c.code.length === 2 && c.code.startsWith(g.code)).map((c) => ({ code: c.code, name: name(c), value: c.values[year] ?? 0 }))
      .filter((c) => c.value > 0).sort((a, b) => b.value - a.value),
  })).filter((g) => g.value > 0).sort((a, b) => b.value - a.value);

  // The cells are the two-digit lines of the file, each rounded to the franc by the pipeline: their sum may differ from the total
  // by rounding only (at most half a franc per line). Anything more means a line is missing or counted twice.
  const cells = groups.flatMap((g) => g.cells);
  const sum = cells.reduce((s, c) => s + c.value, 0);
  if (Math.abs(sum - total) > cells.length / 2) throw new Error(`[quanto-pesa] cells add up to ${sum}, total is ${total}`);

  const voci = VOCI.map((v) => {
    const g = groups.find((x) => x.code === v.code[0]);
    const value = v.code.length === 1 ? g?.value : g?.cells.find((c) => c.code === v.code)?.value;
    if (!g || !value) throw new Error(`[quanto-pesa] ${v.code} (${v.slug}) is not a line of the table in ${year}`);
    const own = v.code.length === 1 ? g : g.cells.find((c) => c.code === v.code)!;
    return { slug: v.slug, code: v.code, name: own.name, question: en ? v.en : v.it, value, group: { code: g.code, name: g.name } };
  });

  return {
    year, total, groups, voci,
    source: { fileUrl: fs.meta.publisher_url, fileDate: fs.meta.published_at, statusDate: hauptaggregate().meta.published_at, register: "/fonti/#fs-haushalte" },
  };
}

export default function QuantoPesaPage() {
  const data = build();
  const suffix = T(SITE.name, SITE.nameEn);
  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 md:pt-14 pb-10">
      {/* The item comes from the address (?voce=difesa): the static page carries the neutral view, the browser shows the item. */}
      <Suspense fallback={<QuantoPesa data={data} slug={null} titleSuffix={suffix} />}>
        <QuantoPesaFromUrl data={data} titleSuffix={suffix} />
      </Suspense>
    </main>
  );
}
