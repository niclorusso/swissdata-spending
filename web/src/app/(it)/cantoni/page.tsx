import type { Metadata } from "next";
import Link from "@/components/L";
import { geo, haushalte, lastR, popKantone } from "@/lib/data";
import { chf, num, pct } from "@/lib/format";
import { KANTONE, codedName, kantonName } from "@/lib/labels";
import { getLang, T } from "@/lib/lang-server";
import { perCapita } from "@/lib/fs";
import { SourceBadge } from "@/components/SourceBadge";
import { BarList } from "@/components/charts/BarList";
import { TimeSeries, type Row } from "@/components/charts/TimeSeries";
import { Card, Note, Page, Stat, StatGrid } from "@/components/ui";
import { GeoMap } from "@/components/charts/GeoMap";

export const metadata: Metadata = { title: "Cantoni: spese, pro capite, per funzione" };

export default function Cantoni() {
  const en = getLang() === "en";
  const fs = haushalte();
  const pop = popKantone();
  const H = fs.data.haushalte;
  const yK = lastR(H["ktn"]);            // ultimo consuntivo dei Cantoni
  const yG = lastR(H["gdn"]);            // ultimo consuntivo dei Comuni
  const y = String(yK);
  const staat = H["staat"];
  const yS = String(lastR(staat));
  const g = geo().data;
  const levels = [["bund", T("Confederazione", "Confederation")], ["ktn", T("Cantoni", "Cantons")], ["gdn", T("Comuni", "Municipalities")], ["sv", T("Assicurazioni sociali", "Social insurance")]] as const;
  const allYears = Object.keys(staat.total_ausgaben).map(Number).sort();
  const levelRows: Row[] = allYears.map((yy) => ({ year: yy, ...Object.fromEntries(levels.map(([k, l]) => [l, H[k].total_ausgaben[String(yy)] ?? null])) }));
  const ys = staat.year_status;

  const rows = KANTONE.map((k) => {
    const kt = H[`ktn_${k.id}`], gd = H[`gdn_${k.id}`], kg = H[`ktn_gdn_${k.id}`];
    const p = pop.data.population[k.id.toUpperCase()]?.values[y];
    const top = Object.values(kt.funk1).filter((f) => f.code !== "9").sort((a, b) => (b.values[y] ?? 0) - (a.values[y] ?? 0))[0];
    return { ...k, nameIt: kantonName(k.id), kt: kt.total_ausgaben[y], gd: gd.total_ausgaben[y], kg: kg.total_ausgaben[y], pop: p, pc: perCapita(kg.total_ausgaben[y], p), top: top ? codedName(top) : undefined, topShare: top ? (top.values[y] ?? 0) / (kt.total_ausgaben[y] || 1) : 0 };
  }).sort((a, b) => (b.pc ?? 0) - (a.pc ?? 0));
  const maxPc = Math.max(...rows.map((r) => r.pc ?? 0));

  return (
    <Page kicker={T("Cantoni e Comuni", "Cantons and municipalities")} title={T("I 26 Cantoni a confronto", "The 26 cantons compared")} lead={en
      ? <p>Spending of each canton and its municipalities according to the financial statistics of the Federal Finance Administration (FFA), which bring all accounts to the same scheme. Latest closed accounts: cantons {yK}, municipalities {yG}.</p>
      : <p>Spese di ogni Cantone e dei suoi Comuni secondo la statistica finanziaria dell&apos;AFF, che riporta tutti i conti allo stesso schema. Ultimo consuntivo: Cantoni {yK}, Comuni {yG}.</p>}>
      <StatGrid cols={5}>
        <Stat label={`${T("Spesa pubblica totale", "Total public spending")} ${yS}`} value={chf(staat.total_ausgaben[yS])} sub={T("tutti i livelli insieme", "all levels together")} />
        {levels.map(([k, l]) => <Stat key={k} label={`${l} ${yS}`} value={chf(H[k].total_ausgaben[yS])} sub={`${T("entrate", "revenue")} ${chf(H[k].total_einnahmen[yS])}`} />)}
      </StatGrid>

      <Note>{en
        ? <>The sum of the four levels ({chf(levels.reduce((t, [k]) => t + (H[k].total_ausgaben[yS] ?? 0), 0), { digits: 0 })}) is higher than the total because the money one level pays to another, for example federal contributions to the cantons, is counted twice.</>
        : <>La somma dei quattro livelli ({chf(levels.reduce((t, [k]) => t + (H[k].total_ausgaben[yS] ?? 0), 0), { digits: 0 })}) è più alta del totale perché i soldi che un livello versa a un altro, per esempio i contributi federali ai Cantoni, sono contati due volte.</>}</Note>

      <Card title={`${T("Spesa per abitante", "Spending per inhabitant")}, ${yK}`} subtitle={T("Cantone e suoi Comuni insieme, divisi per la popolazione. Clicca un Cantone per il dettaglio.", "Canton and its municipalities together, divided by the population. Click a canton for the detail.")}>
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3"><GeoMap viewBox={g.viewBox} shapes={Object.entries(g.cantons).map(([id, d]) => ({ id, d }))} data={Object.fromEntries(rows.map((r) => [r.id, { name: r.nameIt, value: r.pc, sub: en ? `Canton ${chf(r.kt)} · municipalities ${chf(r.gd)} · ${num(r.pop)} inhabitants` : `Cantone ${chf(r.kt)} · Comuni ${chf(r.gd)} · ${num(r.pop)} abitanti`, href: `/cantoni/${r.id}/` }]))} legendTitle={`${T("Spesa per abitante", "Spending per inhabitant")}, ${yK}`} lakes={g.lakes} labels={g.canton_centroids} stroke={1.2} /></div>
          <div className="lg:col-span-2 max-h-[460px] overflow-y-auto pr-2"><BarList items={rows.map((r) => ({ label: r.nameIt, value: r.pc ?? 0, href: `/cantoni/${r.id}/` }))} max={maxPc} showShare={false} /></div>
        </div>
        <div className="mt-5"><Note>{T("Un valore alto non indica spreco. A Basilea Città il Cantone svolge anche i compiti della città, e i Cantoni di montagna hanno pochi abitanti su un territorio vasto.", "A high value does not mean waste. In Basel-Stadt the canton also does the city's tasks, and mountain cantons have few inhabitants on a large territory.")}</Note></div>
        <SourceBadge meta={fs.meta} />
      </Card>

      <Card title={T("I quattro livelli dal 1990", "The four levels since 1990")} subtitle={T("Spese di ogni livello. I versamenti da un livello all'altro sono contati in entrambi.", "Spending of each level. Payments from one level to another are counted in both.")}>
        <TimeSeries rows={levelRows} series={levels.map(([, l]) => l)} yearStatus={ys} kind="stacked" height={320} />
        <SourceBadge meta={fs.meta} compact />
      </Card>

      <Card title={en ? `The 26 cantons in figures, ${yK}` : `I 26 Cantoni in cifre, ${yK}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left eyebrow">
              <tr><th className="py-2 pr-3 font-medium">{T("Cantone", "Canton")}</th><th className="py-2 pr-3 font-medium text-right hidden md:table-cell">{T("Spese Cantone", "Canton spending")}</th><th className="py-2 pr-3 font-medium text-right hidden md:table-cell">{T("Spese Comuni", "Municipal spending")}</th><th className="py-2 pr-3 font-medium text-right">{T("Cantone + Comuni", "Canton + municipalities")}</th><th className="py-2 pr-3 font-medium text-right hidden md:table-cell">{T("Abitanti", "Inhabitants")}</th><th className="py-2 pr-3 font-medium text-right">{T("Pro capite", "Per inhabitant")}</th><th className="py-2 pr-3 font-medium hidden md:table-cell">{T("Prima funzione (Cantone)", "Largest function (canton)")}</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="py-1.5 pr-3"><Link className="underline" href={`/cantoni/${r.id}/`}>{r.nameIt}</Link> <span className="text-faint">{r.id.toUpperCase()}</span></td>
                  <td className="py-1.5 pr-3 text-right tabular hidden md:table-cell">{chf(r.kt)}</td><td className="py-1.5 pr-3 text-right tabular hidden md:table-cell">{chf(r.gd)}</td><td className="py-1.5 pr-3 text-right tabular">{chf(r.kg)}</td>
                  <td className="py-1.5 pr-3 text-right tabular hidden md:table-cell">{num(r.pop)}</td><td className="py-1.5 pr-3 text-right tabular font-medium">{chf(r.pc)}</td>
                  <td className="py-1.5 pr-3 text-muted hidden md:table-cell">{r.top} <span className="text-faint">· {pct(r.topShare * 100, 0)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceBadge meta={pop.meta} compact />
      </Card>
    </Page>
  );
}
