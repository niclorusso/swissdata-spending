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
  return { title: T(`Appalti federali ${year}: elenco dei contratti`, `Federal contracts ${year}: list of contracts`) };
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
      ? <p>{num(v.n)} contracts of {num(50000)} francs and above, worth {chf(v.total_chf, { digits: 1 })} over their whole duration, with {num(v.n_suppliers)} suppliers.</p>
      : <p>{num(v.n)} contratti da {num(50000)} franchi in su, per {chf(v.total_chf, { digits: 1 })} sull&apos;intera durata, con {num(v.n_suppliers)} fornitori.</p>}>
      <nav className="flex flex-wrap gap-2" aria-label={T("Anno", "Year")}>
        {Object.keys(p.data.years).sort().map((yy) => (
          <Link key={yy} href={`/appalti/${yy}/`} aria-current={Number(yy) === y ? "page" : undefined} className="chip tabular">{yy}</Link>
        ))}
      </nav>
      <p className="text-sm text-muted max-w-3xl" data-reveal="up">{en
        ? <>The list holds the contracts of {y} whose amount is published.{v.no_amount ? <> {v.no_amount === 1 ? "One contract is" : `${v.no_amount} contracts are`} in the official file without an amount and {v.no_amount === 1 ? "is" : "are"} not listed.</> : null}{v.late_additions.n ? <> The file also has a sheet of later publications: {num(v.late_additions.n)} contracts of earlier lists whose amount was raised, for {chf(v.late_additions.chf_added, { digits: 2 })} more in all. They are not in this list nor in the total.</> : null} Supplier names are as written in the official list: the same company can appear under more than one spelling.</>
        : <>L&apos;elenco riporta i contratti del {y} con un importo pubblicato.{v.no_amount ? <> {v.no_amount === 1 ? "Un contratto è" : `${v.no_amount} contratti sono`} nel file ufficiale senza importo e non {v.no_amount === 1 ? "è elencato" : "sono elencati"}.</> : null}{v.late_additions.n ? <> Il file ha anche un foglio di ripubblicazioni: {num(v.late_additions.n)} contratti di elenchi precedenti il cui importo è stato aumentato, per {chf(v.late_additions.chf_added, { digits: 2 })} in più in tutto. Non sono in questo elenco né nel totale.</> : null} I nomi dei fornitori sono quelli scritti nell&apos;elenco ufficiale: la stessa azienda può comparire con più grafie.</>}</p>
      <Card>
        <ProcTable year={y} />
        <SourceBadge meta={s.meta} />
      </Card>
    </Page>
  );
}
