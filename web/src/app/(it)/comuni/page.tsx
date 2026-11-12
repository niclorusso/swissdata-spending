import { codedName } from "@/lib/labels";
import { getLang, T } from "@/lib/lang-server";
import type { Metadata } from "next";
import Link from "@/components/L";
import { gemeinden, haushalte, ktGemeinden, lastR, popGemeinden } from "@/lib/data";
import { allProfiles, searchItems } from "@/lib/comuni";
import { chf, num } from "@/lib/format";
import { perCapita } from "@/lib/fs";
import { SourceBadge } from "@/components/SourceBadge";
import { GemeindenTable, type GemRow } from "@/components/GemeindenTable";
import { MuniMapCH } from "@/components/MuniMapCH";
import { ComuneSearch } from "@/components/ComuneSearch";
import { Card, Note, Page, Stat, StatGrid } from "@/components/ui";

export const metadata: Metadata = { title: "Comuni: i conti Comune per Comune" };

export default function Comuni() {
  const en = getLang() === "en";
  const g = gemeinden();
  const pg = popGemeinden().data.population;
  const H = haushalte().data.haushalte;
  const yG = lastR(H["gdn"]);
  const rows: GemRow[] = Object.values(g.data.gemeinden).map((m): GemRow | null => {
    const cands = m.years.filter((v) => v <= yG && m.aufwand[String(v)]);
    if (!cands.length) return null;
    const y = String(Math.max(...cands));
    const pop = pg[String(m.bfs_nr)]?.values[y] ?? null;
    const top = Object.values(m.funk1).filter((f) => f.code !== "9").sort((a, b) => (b.values[y] ?? 0) - (a.values[y] ?? 0))[0];
    return { bfs: m.bfs_nr, kt: m.kanton, name: m.name, year: y, pop, aufwand: m.aufwand[y], pc: perCapita(m.aufwand[y], pop), ertrag: m.ertrag[y] ?? null, inv: m.investitionen[y] ?? null, top: top ? codedName(top) : null, topShare: top ? (top.values[y] ?? 0) / (m.aufwand[y] || 1) : 0 };
  }).filter((r): r is GemRow => r !== null && Number(r.year) === yG);
  const current = rows;
  const totPop = current.reduce((s, r) => s + (r.pop ?? 0), 0);
  const profiles = allProfiles();
  const nAll = Object.keys(profiles).length;
  const items = searchItems();
  const ti = ktGemeinden("ti").data, zh = ktGemeinden("zh").data;
  const mapData = Object.fromEntries(current.map((r) => [String(r.bfs), { name: `${r.name} (${r.kt})`, value: r.pc, sub: `${chf(r.aufwand)} · ${num(r.pop)} ${T("abitanti", "inhabitants")}`, href: `/comuni/${r.bfs}/` }]));

  return (
    <Page kicker={T("Comuni", "Municipalities")} title={T("I conti, Comune per Comune", "The accounts, municipality by municipality")} lead={en
      ? <p>Swiss municipalities spent {chf(H["gdn"].total_ausgaben[String(yG)], { digits: 1 })} in {yG}. The Confederation publishes individual accounts only for municipalities with at least 5,000 inhabitants; Ticino and Zurich publish those of all their municipalities. There are {num(nAll)} pages here.</p>
      : <p>I Comuni svizzeri hanno speso {chf(H["gdn"].total_ausgaben[String(yG)], { digits: 1 })} nel {yG}. La Confederazione pubblica i conti singoli solo dei Comuni con almeno 5 000 abitanti; Ticino e Zurigo pubblicano quelli di tutti i loro Comuni. Qui ci sono {num(nAll)} schede.</p>}>
      <ComuneSearch items={items} />
      <StatGrid>
        <Stat label={T("Comuni con una scheda", "Municipalities with a page")} value={num(nAll)} sub={T("su circa 2 100", "out of about 2,100")} />
        <Stat label={T("Nella statistica federale", "In the federal statistics")} value={num(current.length)} sub={en ? `${yG} accounts published by the FFA, ${num(totPop)} inhabitants` : `conti ${yG} pubblicati dall'AFF, ${num(totPop)} abitanti`} />
        <Stat label="Ticino" value={num(Object.keys(ti.gemeinden).length)} sub={<Link className="link" href="/cantoni/ti/#comuni">{T("tutti i Comuni", "all municipalities")}, {ti.year} →</Link>} />
        <Stat label={T("Zurigo", "Zurich")} value={num(Object.keys(zh.gemeinden).length)} sub={<Link className="link" href="/cantoni/zh/#comuni">{T("tutti i Comuni", "all municipalities")}, {zh.year} →</Link>} />
      </StatGrid>

      <Card title={`${T("Spese correnti per abitante", "Current spending per inhabitant")}, ${yG}`} subtitle={T("I Comuni con almeno 5 000 abitanti. In grigio i Comuni per cui l'AFF non pubblica conti singoli. Clicca un Comune per la scheda.", "Municipalities with at least 5,000 inhabitants. In grey, the municipalities for which the FFA publishes no individual accounts. Click a municipality for its page.")}>
        <MuniMapCH data={mapData} legendTitle={T("CHF per abitante", "CHF per inhabitant")} />
        <div className="mt-5"><Note>{T("Le spese correnti sono quelle del conto economico, senza investimenti. Comprendono ammortamenti, versamenti alla perequazione e spese straordinarie: un valore molto alto può dipendere da una sola operazione dell'anno. I compiti affidati ai Comuni cambiano da Cantone a Cantone.", "Current spending is that of the income statement, without investment. It includes depreciation, payments into fiscal equalisation and extraordinary expenses: a very high value can come from a single operation in that year. The tasks given to municipalities change from canton to canton.")}</Note></div>
        <SourceBadge meta={g.meta} />
      </Card>

      <Card title={en ? `The ${num(rows.length)} municipalities in the federal statistics, ${yG}` : `I ${num(rows.length)} Comuni della statistica federale, ${yG}`} subtitle={T("Sono i Comuni che hanno o hanno avuto almeno 5 000 abitanti. Ordina per colonna, filtra per Cantone, cerca per nome. La colonna «Prima funzione» non considera «Finanze e imposte».", "These are the municipalities that have or have had at least 5,000 inhabitants. Sort by column, filter by canton, search by name. The column «Largest function» leaves out «Finances and taxes».")}>
        <GemeindenTable rows={rows} more={{ TI: { n: Object.keys(ti.gemeinden).length, href: "/cantoni/ti/#comuni" }, ZH: { n: Object.keys(zh.gemeinden).length, href: "/cantoni/zh/#comuni" } }} />
        <SourceBadge meta={g.meta} />
      </Card>
    </Page>
  );
}
