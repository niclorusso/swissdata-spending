import { codedName } from "@/lib/labels";
import { getLang, T } from "@/lib/lang-server";
import type { Metadata } from "next";
import Link from "@/components/L";
import { gemeinden, haushalte, ktGemeinden, lastR, popForAccounts, popGemeindenMeta } from "@/lib/data";
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
  const H = haushalte().data.haushalte;
  const yG = lastR(H["gdn"]);
  const rows: GemRow[] = Object.values(g.data.gemeinden).map((m): GemRow | null => {
    const cands = m.years.filter((v) => v <= yG && m.aufwand[String(v)]);
    if (!cands.length) return null;
    const y = String(Math.max(...cands));
    const pop = popForAccounts(m.bfs_nr, y).pop;
    const top = Object.values(m.funk1).filter((f) => f.code !== "9").sort((a, b) => (b.values[y] ?? 0) - (a.values[y] ?? 0))[0];
    return { bfs: m.bfs_nr, kt: m.kanton, name: m.name, year: y, pop, aufwand: m.aufwand[y], pc: perCapita(m.aufwand[y], pop), ertrag: m.ertrag[y] ?? null, inv: m.investitionen[y] ?? null, top: top ? codedName(top) : null, topShare: top ? (top.values[y] ?? 0) / (m.aufwand[y] || 1) : 0 };
  }).filter((r): r is GemRow => r !== null && Number(r.year) === yG);
  const current = rows;
  const noPop = rows.filter((r) => r.pop === null).map((r) => r.name);
  const withPop = rows.length - noPop.length;
  const totPop = current.reduce((s, r) => s + (r.pop ?? 0), 0);
  const profiles = allProfiles();
  const nAll = Object.keys(profiles).length;
  const items = searchItems();
  const ti = ktGemeinden("ti").data, zh = ktGemeinden("zh").data;
  const mapData = Object.fromEntries(current.map((r) => [String(r.bfs), { name: `${r.name} (${r.kt})`, value: r.pc, sub: r.pop === null ? chf(r.aufwand) : `${chf(r.aufwand)} · ${num(r.pop)} ${T("abitanti", "inhabitants")}`, note: r.pop === null ? T("non calcolabile: Comune aggregato", "not computable: merged municipality") : undefined, href: `/comuni/${r.bfs}/` }]));

  return (
    <Page kicker={T("Comuni", "Municipalities")} title={T("I conti, Comune per Comune", "The accounts, municipality by municipality")} lead={en
      ? <p>Swiss municipalities spent {chf(H["gdn"].total_ausgaben[String(yG)], { digits: 1 })} in {yG}. The Confederation publishes individual accounts only for municipalities with at least {num(5000)} inhabitants; Ticino and Zurich publish those of all their municipalities. There are {num(nAll)} pages here.</p>
      : <p>I Comuni svizzeri hanno speso {chf(H["gdn"].total_ausgaben[String(yG)], { digits: 1 })} nel {yG}. La Confederazione pubblica i conti singoli solo dei Comuni con almeno {num(5000)} abitanti; Ticino e Zurigo pubblicano quelli di tutti i loro Comuni. Qui ci sono {num(nAll)} schede.</p>}>
      <ComuneSearch items={items} />
      <StatGrid>
        <Stat label={T("Comuni con una scheda", "Municipalities with a page")} value={num(nAll)} sub={en ? `out of about ${num(2100)}` : `su circa ${num(2100)}`} />
        <Stat label={T("Nella statistica federale", "In the federal statistics")} value={num(current.length)} sub={en
          ? `${yG} accounts published by the FFA. ${num(withPop)} of them have ${num(totPop)} inhabitants in all${noPop.length ? `; ${noPop.join(", ")} are not counted, because they were merged after ${yG} and have no population of their own` : ""}`
          : `conti ${yG} pubblicati dall'AFF. ${num(withPop)} di questi hanno in tutto ${num(totPop)} abitanti${noPop.length ? `; ${noPop.join(", ")} non sono contati, perché aggregati dopo il ${yG} e senza una popolazione propria` : ""}`} />
        <Stat label="Ticino" value={num(Object.keys(ti.gemeinden).length)} sub={<Link className="link" href="/cantoni/ti/#comuni">{T("tutti i Comuni", "all municipalities")}, {ti.year} →</Link>} />
        <Stat label={T("Zurigo", "Zurich")} value={num(Object.keys(zh.gemeinden).length)} sub={<Link className="link" href="/cantoni/zh/#comuni">{T("tutti i Comuni", "all municipalities")}, {zh.year} →</Link>} />
      </StatGrid>
      <div data-reveal="up"><SourceBadge meta={g.meta} also={popGemeindenMeta()} /></div>

      <Card title={`${T("Spese correnti per abitante", "Current spending per inhabitant")}, ${yG}`} subtitle={T(`I Comuni con almeno ${num(5000)} abitanti. In grigio i Comuni per cui l'AFF non pubblica conti singoli. Clicca un Comune per la scheda.`, `Municipalities with at least ${num(5000)} inhabitants. In grey, the municipalities for which the FFA publishes no individual accounts. Click a municipality for its page.`)}>
        <MuniMapCH data={mapData} legendTitle={T("CHF per abitante", "CHF per inhabitant")} />
        <div className="mt-5"><Note>{noPop.length > 0 ? (en ? `No value per inhabitant for ${noPop.join(", ")}: they were merged after ${yG} and the population is published only within the new boundaries. ` : `Nessun valore per abitante per ${noPop.join(", ")}: sono stati aggregati dopo il ${yG} e la popolazione è pubblicata solo nei nuovi confini. `) : ""}{T("Le spese correnti sono quelle del conto economico, senza investimenti. Comprendono ammortamenti, versamenti alla perequazione e spese straordinarie: un valore molto alto può dipendere da una sola operazione dell'anno. I compiti affidati ai Comuni cambiano da Cantone a Cantone.", "Current spending is that of the income statement, without investment. It includes depreciation, payments into fiscal equalisation and extraordinary expenses: a very high value can come from a single operation in that year. The tasks given to municipalities change from canton to canton.")}</Note></div>
        <SourceBadge meta={g.meta} also={popGemeindenMeta()} />
      </Card>

      <Card title={en ? `The ${num(rows.length)} municipalities in the federal statistics, ${yG}` : `I ${num(rows.length)} Comuni della statistica federale, ${yG}`} subtitle={T(`Sono i Comuni che hanno o hanno avuto almeno ${num(5000)} abitanti. Ordina per colonna, filtra per Cantone, cerca per nome. La colonna «Prima funzione» non considera «Finanze e imposte».`, `These are the municipalities that have or have had at least ${num(5000)} inhabitants. Sort by column, filter by canton, search by name. The column «Largest function» leaves out «Finances and taxes».`)}>
        <GemeindenTable rows={rows} more={{ TI: { n: Object.keys(ti.gemeinden).length, href: "/cantoni/ti/#comuni" }, ZH: { n: Object.keys(zh.gemeinden).length, href: "/cantoni/zh/#comuni" } }} />
        <SourceBadge meta={g.meta} also={popGemeindenMeta()} />
      </Card>
    </Page>
  );
}
