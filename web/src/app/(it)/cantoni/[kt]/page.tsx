import type { Metadata } from "next";
import { gemeinden, haushalte, ktGemeinden, KT_WITH_ALL_GEMEINDEN, lastR, popGemeinden, popKantone } from "@/lib/data";
import { kantonLabel, kantonMap } from "@/lib/comuni";
import { GemeindenExplorer } from "@/components/GemeindenExplorer";
import { chf, num } from "@/lib/format";
import { KANTONE, kantonName, measureText } from "@/lib/labels";
import { getLang, T } from "@/lib/lang-server";
import { codedTree, natureTree, perCapita, years } from "@/lib/fs";
import { SourceBadge } from "@/components/SourceBadge";
import { BarList } from "@/components/charts/BarList";
import { TreeExplorer } from "@/components/charts/TreeExplorer";
import { TimeSeries, type Row } from "@/components/charts/TimeSeries";
import { Card, Note, Page, Stat, StatGrid } from "@/components/ui";
import { Treemap } from "@/components/charts/Treemap";
import { haushaltItems } from "@/lib/viz";

export function generateStaticParams() {
  return KANTONE.map((k) => ({ kt: k.id }));
}
export async function generateMetadata({ params }: PageProps<"/cantoni/[kt]">): Promise<Metadata> {
  const { kt } = await params;
  return { title: T(`Canton ${kantonName(kt)}: spese del Cantone e dei Comuni`, `Canton of ${kantonName(kt)}: spending of the canton and its municipalities`) };
}

export default async function Kanton({ params }: PageProps<"/cantoni/[kt]">) {
  const { kt } = await params;
  const en = getLang() === "en";
  const S = { ktn: T("Cantone", "Canton"), gdn: T("Comuni", "Municipalities"), pc: T("Cantone + Comuni per abitante", "Canton + municipalities per inhabitant"), sk: T("Spese del Cantone", "Canton spending"), sg: T("Spese dei Comuni", "Municipal spending") };
  const fs = haushalte();
  const H = fs.data.haushalte;
  const ktn = H[`ktn_${kt}`], gdn = H[`gdn_${kt}`], both = H[`ktn_gdn_${kt}`];
  const pop = popKantone().data.population[kt.toUpperCase()];
  const yK = lastR(ktn), yG = lastR(gdn);
  const y = String(yK);
  const p = pop?.values[y];
  const ys = years(ktn);
  const status = { ...gdn.year_status, ...Object.fromEntries(Object.entries(ktn.year_status).filter(([, s]) => s === "R")) };
  const rows: Row[] = ys.map((yy) => ({ year: yy, [S.ktn]: ktn.total_ausgaben[String(yy)] ?? null, [S.gdn]: gdn.total_ausgaben[String(yy)] ?? null }));
  const pcRows: Row[] = ys.map((yy) => ({ year: yy, [S.pc]: perCapita(both.total_ausgaben[String(yy)], pop?.values[String(yy)]) }));
  const gem = Object.values(gemeinden().data.gemeinden).filter((g) => g.kanton === kt.toUpperCase());
  const pg = popGemeinden().data.population;
  const gemRows = gem.map((g) => {
    const yy = String(Math.max(...g.years.filter((v) => v <= yG && g.aufwand[String(v)])));
    const pp = pg[String(g.bfs_nr)]?.values[yy];
    return { ...g, y: yy, aufwand: g.aufwand[yy], pc: perCapita(g.aufwand[yy], pp), pop: pp };
  }).filter((g) => g.aufwand && Number(g.y) === yG).sort((a, b) => (b.pc ?? 0) - (a.pc ?? 0));

  const hasAll = (KT_WITH_ALL_GEMEINDEN as readonly string[]).includes(kt);
  const all = hasAll ? ktGemeinden(kt) : null;
  const map = all ? kantonMap(kt, all.data) : null;
  const allRows = all ? Object.entries(all.data.gemeinden).map(([id, v]) => ({ id, name: v.name, pop: v.pop, values: v.values, href: `/comuni/${id}/`, flag: v.merged_from ? T("aggregato dopo il 2024", "merged after 2024") : undefined })) : [];

  return (
    <Page kicker={S.ktn} back={{ href: "/cantoni/", label: T("Tutti i Cantoni", "All cantons") }} title={kantonLabel(kt)} lead={en
      ? <p>Spending of the canton and its municipalities according to the financial statistics of the Federal Finance Administration (FFA). Latest closed accounts: canton {yK}, municipalities {yG}.{hasAll && <> Further down, <a className="link" href="#comuni">all {allRows.length} municipalities one by one</a>.</>}</p>
      : <p>Spese del Cantone e dei suoi Comuni secondo la statistica finanziaria dell&apos;AFF. Ultimo consuntivo: Cantone {yK}, Comuni {yG}.{hasAll && <> Più sotto, <a className="link" href="#comuni">tutti i {allRows.length} Comuni uno per uno</a>.</>}</p>}>
      <StatGrid>
        <Stat label={`${S.sk} ${yK}`} value={chf(ktn.total_ausgaben[y])} sub={`${T("entrate", "revenue")} ${chf(ktn.total_einnahmen[y])}`} />
        <Stat label={`${S.sg} ${yK}`} value={chf(gdn.total_ausgaben[y])} sub={gdn.year_status[y] === "R" ? T("tutti i Comuni del Cantone", "all municipalities of the canton") : T("dato non definitivo", "not final")} />
        <Stat label={`${T("Cantone + Comuni", "Canton + municipalities")} ${yK}`} value={chf(both.total_ausgaben[y])} sub={T("trasferimenti tra Cantone e Comuni contati una volta", "transfers between canton and municipalities counted once")} />
        <Stat label={T("Per abitante", "Per inhabitant")} value={chf(perCapita(both.total_ausgaben[y], p))} sub={`${num(p)} ${T("abitanti al", "inhabitants on")} 31.12.${yK}`} />
      </StatGrid>
      <Note>{T("Questi importi seguono lo schema armonizzato dell'AFF e comprendono gli investimenti: non coincidono con le cifre del consuntivo pubblicato dal Cantone, che usa un perimetro suo.", "These amounts follow the harmonised scheme of the FFA and include investment: they do not match the figures of the accounts published by the canton, which uses its own scope.")}</Note>

      {all && map && (
        <div id="comuni" className="scroll-mt-6">
          <Card title={en ? `All ${allRows.length} municipalities` : `Tutti i ${allRows.length} Comuni`} subtitle={T("Scegli una misura: mappa, classifica e tabella cambiano insieme. Clicca un Comune per la sua scheda.", "Pick a measure: map, ranking and table change together. Click a municipality for its page.")}>
            <GemeindenExplorer viewBox={map.viewBox} shapes={map.shapes} lakes={map.lakes} context={map.context} measures={all.data.measures.map((m) => ({ ...m, ...measureText(kt, m) }))} rows={allRows} />
            {kt === "ti" && <div className="mt-5"><Note>{en
              ? <>In {allRows.filter((r) => all.data.gemeinden[r.id].water_included).length} municipalities the accounts include drinking water, which the others keep separately: spending per inhabitant is not fully comparable. Lema, Giornico and Quinto add up the municipalities that merged into them after 2024.</>
              : <>In {allRows.filter((r) => all.data.gemeinden[r.id].water_included).length} Comuni i conti comprendono l&apos;acqua potabile, che negli altri è tenuta a parte: le spese per abitante non sono del tutto confrontabili. Lema, Giornico e Quinto sommano i Comuni che vi sono confluiti dopo il 2024.</>}</Note></div>}
            {kt === "zh" && <div className="mt-5"><Note>{T("Il costo netto dei servizi è la spesa meno i ricavi propri di ogni servizio: è la parte da coprire con le imposte. I conti dei Comuni scolastici sono attribuiti ai Comuni politici.", "The net cost of services is spending minus each service's own income: it is the part to be covered by taxes. The accounts of school municipalities are assigned to the political municipalities.")}</Note></div>}
            <SourceBadge meta={all.meta} />
          </Card>
        </div>
      )}

      <Card title={en ? `The ${chf(both.total_ausgaben[y])} of canton and municipalities by function (${yK})` : `I ${chf(both.total_ausgaben[y])} di Cantone e Comuni per funzione (${yK})`} subtitle={T("Ogni rettangolo è una funzione: più è grande, più costa. Clicca per aprire le sotto-funzioni.", "Each rectangle is a function: the larger it is, the more it costs. Click to open the sub-functions.")}>
        <Treemap root={haushaltItems(both, y, `${kantonLabel(kt)} + ${T("Comuni", "municipalities")}`)} unitLabel={both.year_status[y] === "R" ? T("consuntivo", "actuals") : T("dato non definitivo", "not final")} />
        <SourceBadge meta={fs.meta} compact />
      </Card>

      <Card title={T("Le spese del Cantone, anno per anno", "The canton's spending, year by year")} subtitle={T("Scegli l'anno e apri una voce per il dettaglio.", "Pick the year and open an item for the detail.")}>
        <TreeExplorer root={codedTree(ktn, "funk", S.sk)} years={ys} yearStatus={ktn.year_status} defaultYear={yK} />
        <SourceBadge meta={fs.meta} />
      </Card>
      <div className="grid md:grid-cols-2 gap-6">
        <Card title={T("Le spese dei Comuni, anno per anno", "Municipal spending, year by year")} subtitle={T("Tutti i Comuni del Cantone sommati.", "All municipalities of the canton added up.")}>
          <TreeExplorer root={codedTree(gdn, "funk", S.sg)} years={years(gdn)} yearStatus={gdn.year_status} defaultYear={yG} />
        </Card>
        <Card title={T("Per che cosa spende il Cantone", "What the canton spends on")} subtitle={T("Personale, acquisti, contributi versati ad altri, investimenti.", "Staff, purchases, contributions paid to others, investment.")}>
          <TreeExplorer root={natureTree(ktn, S.sk)} years={ys} yearStatus={ktn.year_status} defaultYear={yK} />
        </Card>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card title={T("Cantone e Comuni nel tempo", "Canton and municipalities over time")}>
          <TimeSeries rows={rows} series={[S.ktn, S.gdn]} yearStatus={status} height={280} />
        </Card>
        <Card title={T("Spesa per abitante nel tempo", "Spending per inhabitant over time")} subtitle={T("Cantone e Comuni insieme, in franchi dell'anno, senza correzione per il rincaro.", "Canton and municipalities together, in francs of each year, not adjusted for inflation.")}>
          <TimeSeries rows={pcRows} series={[S.pc]} yearStatus={status} height={280} />
        </Card>
      </div>
      {!all && gemRows.length > 0 && (
        <Card title={en ? `The ${gemRows.length} municipalities with individual accounts, ${yG}` : `I ${gemRows.length} Comuni con conti singoli, ${yG}`} subtitle={T("Spese correnti per abitante dei Comuni che l'AFF rileva uno per uno, di regola sopra i 5 000 abitanti. Un valore molto alto può dipendere da una spesa straordinaria dell'anno o da pochi residenti rispetto a turisti e case di vacanza.", "Current spending per inhabitant of the municipalities the FFA records one by one, as a rule above 5,000 inhabitants. A very high value can come from a one-off expense in that year or from few residents compared with tourists and holiday homes.")}>
          <BarList items={gemRows.map((g) => ({ label: g.name, value: g.pc ?? 0, sub: `${chf(g.aufwand)} · ${num(g.pop)} ${T("ab.", "inh.")} · ${g.y}`, href: `/comuni/${g.bfs_nr}/` }))} showShare={false} />
          <SourceBadge meta={gemeinden().meta} />
        </Card>
      )}
    </Page>
  );
}
