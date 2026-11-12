import type { Metadata } from "next";
import { kennzahlen, lastRechnung, tree, type TreeNode } from "@/lib/data";
import { chf, pct } from "@/lib/format";
import Link from "@/components/L";
import { it } from "@/lib/labels";
import { BarList } from "@/components/charts/BarList";
import { SourceBadge } from "@/components/SourceBadge";
import { TreeExplorer } from "@/components/charts/TreeExplorer";
import { TimeSeries, type Row } from "@/components/charts/TimeSeries";
import { Card, Note, Page, Stat, StatGrid } from "@/components/ui";
import { Treemap } from "@/components/charts/Treemap";
import { FlowSankey, type FlowLink, type FlowNode } from "@/components/charts/FlowSankey";
import { treeItems } from "@/lib/viz";
import { getLang, T } from "@/lib/lang-server";

export const metadata: Metadata = { title: "Confederazione: spese, entrate, debito" };

function rowsFor(children: TreeNode[], years: number[], top = 7): { rows: Row[]; series: string[] } {
  const last = String(years.filter((y) => children.some((c) => (c.values[String(y)] ?? null) !== null)).at(-1));
  const sorted = [...children].sort((a, b) => (b.values[last] ?? 0) - (a.values[last] ?? 0));
  const main = sorted.slice(0, top);
  const rest = sorted.slice(top);
  const other = T("Altro", "Other");
  const series = [...main.map((c) => it(c.name)), ...(rest.length ? [other] : [])];
  const rows = years.map((y) => {
    const r: Row = { year: y };
    for (const c of main) r[it(c.name)] = c.values[String(y)] === undefined ? null : c.values[String(y)];
    if (rest.length) r[other] = rest.reduce((s, c) => s + (c.values[String(y)] ?? 0), 0);
    return r;
  }).filter((r) => main.some((c) => r[it(c.name)] !== null));
  return { rows, series };
}

export default function Confederazione() {
  const en = getLang() === "en";
  const S = { spese: T("Spese", "Spending"), entrate: T("Entrate", "Revenue"), lordo: T("Debito lordo", "Gross debt"), qs: T("Quota di spesa (% PIL)", "Spending ratio (% of GDP)"), qf: T("Quota fiscale (% PIL)", "Tax ratio (% of GDP)"), qd: T("Debito lordo (% PIL)", "Gross debt (% of GDP)") };
  const aufg = tree("bund-ausgaben-aufgabengebiet");
  const art = tree("bund-ausgaben-art");
  const ein = tree("bund-einnahmen");
  const kz = kennzahlen();
  const years = aufg.meta.years ?? [];
  const ys = aufg.meta.year_status ?? {};
  const yR = lastRechnung(aufg.meta);
  const y = String(yR);
  const root = aufg.data.tree[0];
  const { rows: sRows, series: sSeries } = rowsFor(root.children, years);
  const einRoot = ein.data.tree[0];
  const laufende = einRoot.children.find((c) => c.name === "Laufende Einnahmen");
  const fisk = laufende?.children.find((c) => c.name === "Fiskaleinnahmen");
  const { rows: eRows, series: eSeries } = rowsFor(fisk?.children ?? [], years, 6);
  const k = kz.data.series;
  // second level directly: "spese correnti / d'investimento" alone says nothing
  const artRoot = art.data.tree[0];
  const natureRoot = { ...artRoot, children: artRoot.children.flatMap((c) => (c.children.length ? c.children.flatMap((d) => (d.children.length > 1 && d.name === "Eigenausgaben" ? d.children : [d])) : [c])) };
  const kRows: Row[] = years.map((yy) => ({ year: yy, [S.spese]: root.values[String(yy)] ?? null, [S.entrate]: einRoot.values[String(yy)] ?? null }));
  const dRows: Row[] = years.map((yy) => ({ year: yy, [S.lordo]: k["Bruttoschulden"]?.values[String(yy)] ?? null }));
  const qRows: Row[] = years.map((yy) => ({ year: yy, [S.qs]: k["Ausgabenquote"]?.values[String(yy)] ?? null, [S.qf]: k["Steuerquote"]?.values[String(yy)] ?? null, [S.qd]: k["Schuldenquote brutto"]?.values[String(yy)] ?? null }));

  // Sankey: entrate (imposte L3 + altre entrate L2) -> Confederazione -> settori di compito
  const nodes: FlowNode[] = [];
  const links: FlowLink[] = [];
  const add = (n: FlowNode) => { nodes.push(n); return nodes.length - 1; };
  const inTotal = einRoot.values[y] ?? 0;
  const inCands: { name: string; v: number }[] = [];
  for (const c of fisk?.children ?? []) inCands.push({ name: it(c.name), v: c.values[y] ?? 0 });
  for (const c of laufende?.children.filter((c) => c.name !== "Fiskaleinnahmen") ?? []) inCands.push({ name: it(c.name), v: c.values[y] ?? 0 });
  for (const c of einRoot.children.filter((c) => c.name !== "Laufende Einnahmen")) inCands.push({ name: it(c.name), v: c.values[y] ?? 0 });
  const big = inCands.filter((c) => c.v >= inTotal * 0.02).sort((a, b) => b.v - a.v);
  const smallSum = inCands.filter((c) => c.v > 0 && c.v < inTotal * 0.02).reduce((s, c) => s + c.v, 0);
  const otherIn = en ? `Other revenue (${inCands.length - big.length} items)` : `Altre entrate (${inCands.length - big.length} voci)`;
  const inNodes = big.map((c) => ({ i: add({ name: c.name, side: "in" as const, amount: c.v }), v: c.v }));
  if (smallSum > 0) inNodes.push({ i: add({ name: otherIn, side: "in", amount: smallSum }), v: smallSum });
  const hub = add({ name: `${T("Confederazione", "Confederation")} ${yR}`, side: "hub", amount: root.values[y] ?? 0 });
  const outTotal = root.values[y] ?? 0;
  const outAll = [...root.children].map((c) => ({ name: it(c.name), v: c.values[y] ?? 0 })).filter((c) => c.v > 0).sort((a, b) => b.v - a.v);
  const outBig = outAll.filter((c) => c.v >= outTotal * 0.02);
  const outSmall = outAll.filter((c) => c.v < outTotal * 0.02);
  for (const n of inNodes) links.push({ source: n.i, target: hub, value: n.v });
  for (const c of outBig) links.push({ source: hub, target: add({ name: c.name, side: "out", amount: c.v }), value: c.v });
  if (outSmall.length) { const v = outSmall.reduce((s, c) => s + c.v, 0); links.push({ source: hub, target: add({ name: `${T("Altri settori", "Other areas")} (${outSmall.length})`, side: "out", amount: v }), value: v }); }
  const inList = [...big.map((c) => ({ label: c.name, value: c.v })), ...(smallSum > 0 ? [{ label: otherIn, value: smallSum }] : [])];

  return (
    <Page kicker={T("Confederazione", "Confederation")} title={en ? `The federal budget ${yR}` : `Il bilancio federale ${yR}`} lead={en
      ? <p>Spending by area, revenue and debt of the Confederation. Closed accounts up to {yR}; 2026–2027 are budget and 2028–2030 financial plan, always on a grey background in the charts.</p>
      : <p>Spese per settore, entrate e debito della Confederazione. Consuntivi fino al {yR}; 2026–2027 sono preventivo e 2028–2030 piano finanziario, sempre su fondo grigio nei grafici.</p>}>
      <StatGrid>
        <Stat label={`${S.spese} ${yR}`} value={chf(root.values[y])} sub={`${pct(k["Ausgabenquote"]?.values[y])} ${T("del PIL", "of GDP")}`} />
        <Stat label={`${S.entrate} ${yR}`} value={chf(einRoot.values[y])} sub={`${T("di cui fiscali", "of which taxes")} ${chf(fisk?.values[y])}`} />
        <Stat label={`${T("Risultato", "Result")} ${yR}`} value={`${(k["Finanzierungssaldo"]?.values[y] ?? 0) >= 0 ? "+" : ""}${chf(k["Finanzierungssaldo"]?.values[y])}`} sub={T("entrate meno spese", "revenue minus spending")} />
        <Stat label={`${S.lordo} ${yR}`} value={chf(k["Bruttoschulden"]?.values[y])} sub={`${pct(k["Schuldenquote brutto"]?.values[y])} ${T("del PIL", "of GDP")}`} />
      </StatGrid>
      <Note>{en
        ? <>These are the figures of the federal budget. In the comparison with cantons and municipalities the Confederation appears with a higher amount, because the financial statistics add the special accounts. <Link className="link" href="/metodo/">Why two figures</Link>.</>
        : <>Queste sono le cifre del bilancio federale. Nel confronto con Cantoni e Comuni la Confederazione compare con un importo più alto, perché la statistica finanziaria aggiunge i conti speciali. <Link className="link" href="/metodo/">Perché due cifre</Link>.</>}</Note>

      <Card title={en ? `Revenue and spending of the Confederation, ${yR}` : `Entrate e spese della Confederazione, ${yR}`} subtitle={en ? `On the left ${chf(einRoot.values[y], { digits: 1 })} of revenue, on the right ${chf(root.values[y], { digits: 1 })} of spending. Thickness is proportional to the amount.` : `A sinistra ${chf(einRoot.values[y], { digits: 1 })} di entrate, a destra ${chf(root.values[y], { digits: 1 })} di spese. Lo spessore è proporzionale all'importo.`}>
        <div className="hidden md:block"><FlowSankey nodes={nodes} links={links} /></div>
        <div className="md:hidden space-y-6">
          <div><div className="eyebrow mb-3">{S.entrate}</div><BarList items={inList} total={einRoot.values[y] ?? 0} /></div>
          <div><div className="eyebrow mb-3">{S.spese}</div><BarList items={outAll.map((c) => ({ label: c.name, value: c.v }))} total={outTotal} /></div>
        </div>
        <SourceBadge meta={ein.meta} />
      </Card>

      <Card title={en ? `Spending ${yR} by area` : `Le spese ${yR} per settore`} subtitle={T("La Confederazione classifica le sue spese in 12 settori. Ogni rettangolo è un settore: più è grande, più costa. Clicca per aprire le sotto-voci.", "The Confederation sorts its spending into 12 areas. Each rectangle is an area: the larger it is, the more it costs. Click to open the sub-items.")}>
        <Treemap root={treeItems(root, y)} unitLabel={T("consuntivo", "actuals")} />
        <SourceBadge meta={aufg.meta} compact />
      </Card>

      <Note title={T("Tre voci da non fraintendere", "Three items easy to misread")}>{T("«Finanze e imposte» sono soprattutto le quote d'imposta versate ai Cantoni, la perequazione finanziaria e gli interessi sul debito. «Premesse istituzionali e finanziarie» sono Parlamento, tribunali, amministrazione generale e statistica. «Sanità» è piccola perché i contributi per la riduzione dei premi di cassa malati sono contati nella previdenza sociale.", "«Finances and taxes» is mostly the shares of tax revenue paid to the cantons, fiscal equalisation and interest on the debt. «Institutional and financial conditions» is Parliament, courts, general administration and statistics. «Health» is small because the contributions that reduce health-insurance premiums are counted under social welfare.")}</Note>

      <Card title={T("Come è cambiata la spesa, 1990–2030", "How spending has changed, 1990–2030")} subtitle={T("I sette settori maggiori più «Altro». Su fondo grigio, preventivo e piano finanziario.", "The seven largest areas plus «Other». On a grey background, budget and financial plan.")}>
        <TimeSeries rows={sRows} series={sSeries} yearStatus={ys} kind="stacked" height={360} />
        <SourceBadge meta={aufg.meta} compact />
      </Card>

      <Card title={T("Tutte le voci, anno per anno", "Every item, year by year")} subtitle={T("Scegli l'anno, anche tra preventivo e piano finanziario, e apri un settore per vedere le sotto-voci.", "Pick the year, including budget and financial plan, and open an area to see its sub-items.")}>
        <TreeExplorer root={root} years={years} yearStatus={ys} defaultYear={yR} />
        <SourceBadge meta={aufg.meta} />
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card title={T("Per che cosa: personale, acquisti, contributi", "On what: staff, purchases, contributions")} subtitle={T("Dal 2023, con il nuovo modello contabile. Apri una voce per il dettaglio.", "From 2023, with the new accounting model. Open an item for the detail.")}>
          <TreeExplorer root={natureRoot} years={art.meta.years ?? []} yearStatus={art.meta.year_status ?? {}} defaultYear={yR} />
          <SourceBadge meta={art.meta} />
        </Card>
        <Card title={S.entrate} subtitle={T("Per tipo di entrata; apri «Entrate correnti» per le singole imposte", "By type of revenue; open «Current revenue» for the single taxes")}>
          <TreeExplorer root={einRoot} years={years} yearStatus={ys} defaultYear={yR} />
          <SourceBadge meta={ein.meta} />
        </Card>
      </div>

      <Card title={T("Le entrate fiscali nel tempo", "Tax revenue over time")} subtitle={T("Imposta federale diretta, IVA, imposta preventiva e le altre imposte principali", "Direct federal tax, VAT, withholding tax and the other main taxes")}>
        <TimeSeries rows={eRows} series={eSeries} yearStatus={ys} kind="stacked" height={320} />
        <SourceBadge meta={ein.meta} compact />
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card title={T("Spese ed entrate", "Spending and revenue")} subtitle={T("Totali per anno", "Totals per year")}>
          <TimeSeries rows={kRows} series={[S.spese, S.entrate]} yearStatus={ys} height={280} colors={["var(--s2)", "var(--s1)"]} />
        </Card>
        <Card title={T("Debito lordo della Confederazione", "Gross debt of the Confederation")} subtitle={T("In franchi, a fine anno.", "In francs, at year end.")}>
          <TimeSeries rows={dRows} series={[S.lordo]} yearStatus={ys} height={280} colors={["var(--s8)"]} />
        </Card>
      </div>
      <Card title={T("Quote sul PIL", "Ratios to GDP")} subtitle={T("Quota di spesa, quota fiscale e debito lordo in % del PIL nominale", "Spending ratio, tax ratio and gross debt in % of nominal GDP")}>
        <TimeSeries rows={qRows} series={[S.qs, S.qf, S.qd]} yearStatus={ys} unit="pct" height={280} colors={["var(--s2)", "var(--s1)", "var(--s8)"]} />
        <SourceBadge meta={kz.meta} />
      </Card>
      <p className="text-muted"><Link className="link" href="/confederazione/unita/">{T("Personale, consulenze e informatica ufficio per ufficio", "Staff, consultancy and IT office by office")} →</Link></p>
    </Page>
  );
}
