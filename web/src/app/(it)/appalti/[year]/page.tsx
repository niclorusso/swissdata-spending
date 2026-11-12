import type { Metadata } from "next";
import Link from "@/components/L";
import { loadSnapshot, procurement, type ProcRow } from "@/lib/data";
import { chf, num } from "@/lib/format";
import { SourceBadge } from "@/components/SourceBadge";
import { ProcTable } from "@/components/ProcTable";
import { Card, Page } from "@/components/ui";
import { getLang, T } from "@/lib/lang-server";

export function generateStaticParams() {
  return Object.keys(procurement().data.years).map((year) => ({ year }));
}

export async function generateMetadata({ params }: PageProps<"/appalti/[year]">): Promise<Metadata> {
  const { year } = await params;
  return { title: T(`Appalti federali ${year}: elenco completo`, `Federal contracts ${year}: full list`) };
}

export default async function AppaltiAnno({ params }: PageProps<"/appalti/[year]">) {
  const { year } = await params;
  const y = Number(year);
  const en = getLang() === "en";
  const s = loadSnapshot<{ rows: ProcRow[] }>(`bund-beschaffungen-${y}`);
  const p = procurement();
  const v = p.data.years[String(y)];
  return (
    <Page kicker={T("Appalti", "Procurement")} back={{ href: "/appalti/", label: T("Riepilogo per anno", "Summary by year") }} title={en ? `Contracts signed in ${y}` : `I contratti firmati nel ${y}`} lead={en
      ? <p>{num(v.n)} contracts of 50,000 francs and above, worth {chf(v.total_chf, { digits: 1 })} over their whole duration, with {num(v.n_suppliers)} suppliers.</p>
      : <p>{num(v.n)} contratti da 50 000 franchi in su, per {chf(v.total_chf, { digits: 1 })} sull&apos;intera durata, con {num(v.n_suppliers)} fornitori.</p>}>
      <nav className="flex flex-wrap gap-2" aria-label={T("Anno", "Year")}>
        {Object.keys(p.data.years).sort().map((yy) => (
          <Link key={yy} href={`/appalti/${yy}/`} aria-current={Number(yy) === y ? "page" : undefined} className="chip tabular">{yy}</Link>
        ))}
      </nav>
      <Card>
        <ProcTable year={y} />
        <SourceBadge meta={s.meta} />
      </Card>
    </Page>
  );
}
