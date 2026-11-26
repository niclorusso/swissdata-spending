import type { Metadata } from "next";
import Link from "@/components/L";
import { loadSnapshot, procurement, supplierAliases, type ProcRow } from "@/lib/data";
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
  // The spellings of the same company (data/supplier-aliases.json) that occur in this year: the search finds all of them from any one.
  // A spelling valid only before a date (an old name that went to another company) is left out if a contract of the year starts on or after it.
  const names = new Set(s.data.rows.map((r) => r.supplier));
  const lateOnes = (n: string, before: string) => s.data.rows.some((r) => r.supplier === n && !(r.start && r.start < before));
  // The name of the group goes in too, so that the current name of a renamed company finds the contracts written with the old one.
  const groups = supplierAliases().groups.map((g) => {
    const present = g.variants.filter((x) => names.has(x.name) && !(x.only_before && lateOnes(x.name, x.only_before))).map((x) => x.name);
    return present.length ? Array.from(new Set([g.name, ...present])) : [];
  }).filter((g) => g.length > 1);
  return (
    <Page kicker={T("Appalti", "Procurement")} back={{ href: "/appalti/", label: T("Riepilogo per anno", "Summary by year") }} title={en ? `Contracts signed in ${y}` : `I contratti firmati nel ${y}`} lead={en
      ? <p>{num(v.n)} contracts of 50,000 francs and above, worth {chf(v.total_chf, { digits: 1 })} over their whole duration, with {num(v.n_suppliers)} different supplier names, as written in the list.</p>
      : <p>{num(v.n)} contratti da 50 000 franchi in su, per {chf(v.total_chf, { digits: 1 })} sull&apos;intera durata, con {num(v.n_suppliers)} nomi di fornitori diversi, così come scritti nell&apos;elenco.</p>}>
      <nav className="flex flex-wrap gap-2" aria-label={T("Anno", "Year")}>
        {Object.keys(p.data.years).sort().map((yy) => (
          <Link key={yy} href={`/appalti/${yy}/`} aria-current={Number(yy) === y ? "page" : undefined} className="chip tabular">{yy}</Link>
        ))}
      </nav>
      <p className="text-sm text-muted max-w-3xl" data-reveal="up">{en
        ? <>The list holds the contracts of {y} whose amount is published.{v.no_amount ? <> {v.no_amount === 1 ? "One contract is" : `${v.no_amount} contracts are`} in the official file without an amount and {v.no_amount === 1 ? "is" : "are"} not listed.</> : null}{v.late_additions.n ? <> The file also has a sheet of later publications: {num(v.late_additions.n)} contracts of earlier lists whose amount was raised, for {chf(v.late_additions.chf_added, { digits: 2 })} more in all. They are not in this list nor in the total.</> : null} Each contract carries the supplier&apos;s name as written in the official list, where the same company sometimes appears under different spellings; the search also finds the other spellings of the same company (same UID number): <Link className="link" href="/appalti/grafie/">list of equivalences</Link>.</>
        : <>L&apos;elenco riporta i contratti del {y} con un importo pubblicato.{v.no_amount ? <> {v.no_amount === 1 ? "Un contratto è" : `${v.no_amount} contratti sono`} nel file ufficiale senza importo e non {v.no_amount === 1 ? "è elencato" : "sono elencati"}.</> : null}{v.late_additions.n ? <> Il file ha anche un foglio di ripubblicazioni: {num(v.late_additions.n)} contratti di elenchi precedenti il cui importo è stato aumentato, per {chf(v.late_additions.chf_added, { digits: 2 })} in più in tutto. Non sono in questo elenco né nel totale.</> : null} Ogni contratto porta il nome del fornitore com&apos;è scritto nell&apos;elenco ufficiale, dove la stessa ditta compare a volte con grafie diverse; la ricerca trova anche le altre grafie della stessa ditta (stesso numero IDI): <Link className="link" href="/appalti/grafie/">elenco delle equivalenze</Link>.</>}</p>
      <Card>
        <ProcTable year={y} groups={groups} />
        <SourceBadge meta={s.meta} />
      </Card>
    </Page>
  );
}
