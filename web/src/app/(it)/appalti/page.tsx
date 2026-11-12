import type { Metadata } from "next";
import Link from "@/components/L";
import { procurement } from "@/lib/data";
import { chf, num, plural } from "@/lib/format";
import { depCode, verfahren } from "@/lib/labels";
import { getLang, T } from "@/lib/lang-server";
import { unitCodeIt } from "@/lib/labels-bund";
import { SourceBadge } from "@/components/SourceBadge";
import { BarList } from "@/components/charts/BarList";
import { TimeSeries } from "@/components/charts/TimeSeries";
import { Card, Note, Page, Stat, StatGrid } from "@/components/ui";

export const metadata: Metadata = { title: "Appalti della Confederazione ≥ 50 000 CHF" };

export default function Appalti() {
  const en = getLang() === "en";
  const p = procurement();
  const years = Object.keys(p.data.years).map(Number).sort();
  const last = years.at(-1)!;
  const ly = p.data.years[String(last)];
  const totalAll = years.reduce((s, y) => s + p.data.years[String(y)].total_chf, 0);
  const procNames = Array.from(new Set(years.flatMap((y) => p.data.years[String(y)].by_procedure.map((b) => b.name ?? "–"))));
  const procRows = years.map((y) => {
    const r: Record<string, number | string | null> = { year: y };
    for (const n of procNames) r[verfahren(n)] = p.data.years[String(y)].by_procedure.find((b) => (b.name ?? "–") === n)?.chf ?? 0;
    return r;
  });
  return (
    <Page kicker={T("Appalti", "Procurement")} title={T("I contratti della Confederazione", "The Confederation's contracts")} lead={en
      ? <p>Every year the central Federal Administration publishes the list of contracts of 50,000 francs and above: buyer, supplier, object, procedure and value. Over {years.length} years that is {num(years.reduce((s, y) => s + p.data.years[String(y)].n, 0))} contracts worth {chf(totalAll, { digits: 1 })}.</p>
      : <p>Ogni anno l&apos;Amministrazione federale centrale pubblica l&apos;elenco dei contratti da 50 000 franchi in su: committente, fornitore, oggetto, procedura e valore. In {years.length} anni sono {num(years.reduce((s, y) => s + p.data.years[String(y)].n, 0))} contratti per {chf(totalAll, { digits: 1 })}.</p>}>
      <StatGrid>
        {years.map((y) => (
          <Stat key={y} label={en ? `Contracts signed in ${y}` : `Contratti firmati nel ${y}`} value={chf(p.data.years[String(y)].total_chf, { digits: 1 })} sub={<Link className="link" href={`/appalti/${y}/`}>{num(p.data.years[String(y)].n)} {T("contratti", "contracts")}, {num(p.data.years[String(y)].n_suppliers)} {T("fornitori", "suppliers")} →</Link>} />
        ))}
      </StatGrid>
      <Note>{en
        ? <>The value is that of the contract over its whole duration, recorded in the year of signature: it is not the spending of that year. {years.reduce((a, b) => (p.data.years[String(a)].total_chf > p.data.years[String(b)].total_chf ? a : b))} is so high because of a single contract: {p.data.years["2022"]?.largest.supplier}, {chf(p.data.years["2022"]?.largest.chf, { digits: 1 })}. <Link className="link" href="/metodo/">Other limits of the list</Link>.</>
        : <>Il valore è quello del contratto sull&apos;intera durata, registrato nell&apos;anno della firma: non è la spesa dell&apos;anno. Il {years.reduce((a, b) => (p.data.years[String(a)].total_chf > p.data.years[String(b)].total_chf ? a : b))} è così alto per un solo contratto: {p.data.years["2022"]?.largest.supplier}, {chf(p.data.years["2022"]?.largest.chf, { digits: 1 })}. <Link className="link" href="/metodo/">Altri limiti dell&apos;elenco</Link>.</>}</Note>

      <Card title={T("Come sono stati assegnati i contratti", "How the contracts were awarded")} subtitle={T("Valore dei contratti firmati in ogni anno, per tipo di procedura. Nel 2022 i due grandi contratti per sistemi aeronautici con il governo statunitense (US Air Force e US Army) sono registrati come procedura mediante invito.", "Value of the contracts signed in each year, by type of procedure. In 2022 the two large contracts for aviation systems with the US government (US Air Force and US Army) are recorded as invitation procedure.")}>
        <TimeSeries rows={procRows} series={procNames.map((n) => verfahren(n))} kind="stacked" height={300} />
      </Card>
      <div className="grid md:grid-cols-2 gap-6">
        <Card title={`${T("Per dipartimento", "By department")}, ${last}`}>
          <BarList items={ly.by_department.map((d) => ({ label: depCode(d.name), value: d.chf, sub: plural(d.n, T("contratto", "contract"), T("contratti", "contracts")) }))} total={ly.total_chf} />
        </Card>
        <Card title={`${T("Per procedura", "By procedure")}, ${last}`}>
          <BarList items={ly.by_procedure.map((d) => ({ label: verfahren(d.name), value: d.chf, sub: plural(d.n, T("contratto", "contract"), T("contratti", "contracts")) }))} total={ly.total_chf} />
        </Card>
        <Card title={`${T("Primi 25 fornitori", "Top 25 suppliers")}, ${last}`}>
          <BarList items={ly.top_suppliers.slice(0, 25).map((d) => ({ label: d.name ?? "–", value: d.chf, sub: plural(d.n, T("contratto", "contract"), T("contratti", "contracts")) }))} total={ly.total_chf} />
        </Card>
        <Card title={`${T("Primi 25 committenti", "Top 25 buyers")}, ${last}`}>
          <BarList items={ly.top_units.slice(0, 25).map((d) => ({ label: unitCodeIt(d.name), value: d.chf, sub: plural(d.n, T("contratto", "contract"), T("contratti", "contracts")) }))} total={ly.total_chf} />
        </Card>
      </div>
      <Card title={en ? `Top 50 suppliers, ${years[0]}–${last} cumulative` : `Primi 50 fornitori, ${years[0]}–${last} cumulato`}>
        <BarList items={p.data.top_suppliers_all.slice(0, 50).map((d) => ({ label: d.name ?? "–", value: d.chf, sub: plural(d.n, T("contratto", "contract"), T("contratti", "contracts")) }))} total={totalAll} />
        <SourceBadge meta={p.meta} />
      </Card>
      <Card title={T("Elenchi completi per anno", "Full lists by year")}>
        <ul className="text-sm space-y-1">
          {years.map((y) => {
            const v = p.data.years[String(y)];
            return (
              <li key={y}>
                <Link className="underline" href={`/appalti/${y}/`}>{T("Contratti", "Contracts")} {y}</Link>: {num(v.n)} {T("righe", "rows")} · <a className="underline text-muted" href={v.source_url}>{T("file originale", "original file")}</a> · <a className="underline text-muted" href={v.dataset_url}>{T("scheda", "dataset page")}</a>
              </li>
            );
          })}
        </ul>
      </Card>
    </Page>
  );
}
