import type { Metadata } from "next";
import Link from "@/components/L";
import { gemeinden, ktGemeinden, popGemeinden } from "@/lib/data";
import { allProfiles, kantonLabel, ktMunicipalities, peersOf } from "@/lib/comuni";
import { chf, formatUnit, num } from "@/lib/format";
import { codedName, measureText } from "@/lib/labels";
import { getLang, T } from "@/lib/lang-server";
import { SourceBadge } from "@/components/SourceBadge";
import { BarList } from "@/components/charts/BarList";
import { TimeSeries, type Row } from "@/components/charts/TimeSeries";
import { Card, Note, Page, Stat, StatGrid } from "@/components/ui";

export function generateStaticParams() {
  return Object.keys(allProfiles()).map((id) => ({ id }));
}
export async function generateMetadata({ params }: PageProps<"/comuni/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = allProfiles()[id];
  return { title: `${p.name} (${p.kt.toUpperCase()}): ${T("i conti del Comune", "the municipality's accounts")}` };
}

const ZH_FUNK_EN: Record<string, string> = { "Ambiente e territorio": "Environment and planning", "Amministrazione generale": "General administration", "Cultura, sport e tempo libero": "Culture, sport and leisure", "Economia": "Economy", "Formazione": "Education", "Ordine pubblico e sicurezza": "Public order and safety", "Sanità": "Health", "Sicurezza sociale": "Social security", "Trasporti": "Transport" };
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };

function SectionHead({ title, sub }: { title: string; sub: React.ReactNode }) {
  return (
    <div data-reveal="up">
      <h2 className="text-3xl md:text-4xl leading-tight">{title}</h2>
      <p className="mt-1 text-muted max-w-3xl">{sub}</p>
    </div>
  );
}

export default async function Comune({ params }: PageProps<"/comuni/[id]">) {
  const { id } = await params;
  const p = allProfiles()[id];
  const pg = popGemeinden().data.population[id];
  const aff = p.aff;
  const kant = p.kant;
  const km = p.kantMeta;
  const en = getLang() === "en";
  const munis = ktMunicipalities(p.kt);
  const S = { sc: T("Spese correnti", "Current spending"), rc: T("Ricavi correnti", "Current revenue"), dn: T("Debito netto per abitante", "Net debt per inhabitant"), mo: T("Moltiplicatore", "Tax multiplier") };
  const ord = (n: number) => (en ? `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}` : `${n}°`);
  const peersAll = kant ? Object.values(ktGemeinden(p.kt).data.gemeinden) : [];
  const similar = peersOf(p);

  const yA = aff ? String(Math.max(...Object.keys(aff.aufwand).map(Number))) : null;
  const affRows: Row[] = aff ? aff.years.filter((y) => aff.aufwand[String(y)]).map((y) => ({ year: y, [S.sc]: aff.aufwand[String(y)] ?? null, [S.rc]: aff.ertrag[String(y)] ?? null })) : [];
  const popA = yA ? pg?.values[yA] : null;
  const stf = kant?.series?.steuerfuss ? Object.entries(kant.series.steuerfuss) : [];
  const stfFlat = stf.length > 0 && new Set(stf.map(([, v]) => v)).size === 1;

  return (
    <Page kicker={`${T("Comune", "Municipality")} · ${kantonLabel(p.kt)}`} back={{ href: `/cantoni/${p.kt}/${kant ? "#comuni" : ""}`, label: kantonLabel(p.kt) }} title={p.name}
      lead={en
        ? <p>{num(p.pop)} inhabitants.{kant?.merged_from ? <> Formed after {km?.year} by the merger of {kant.merged_from.map((q) => `${q.name} (${num(q.pop)} inhabitants)`).join(", ")}.</> : null}</p>
        : <p>{num(p.pop)} abitanti.{kant?.merged_from ? <> Nato dopo il {km?.year} dall&apos;aggregazione di {kant.merged_from.map((q) => `${q.name} (${num(q.pop)} abitanti)`).join(", ")}.</> : null}</p>}>

      {kant && km && (
        <>
          <SectionHead title={en ? `The ${km.year} accounts, according to the canton` : `I conti ${km.year}, secondo il Cantone`} sub={en ? <>Cantonal statistics, the same for all {munis}. The rank starts from the highest value: 1st is the municipality with the largest figure.</> : <>Statistica cantonale, uguale per tutti i {munis}. La posizione parte dal valore più alto: 1° è il Comune con la cifra maggiore.</>} />
          {kant.merged_from && <Note title={T("Comune aggregato", "Merged municipality")}>{en
            ? <>The {km.year} accounts are the sum of the {kant.merged_from.length} municipalities merged into {p.name}.{kant.values.moltiplicatore ? <> All had a tax multiplier of {num(kant.values.moltiplicatore)} %.</> : null} Tax resources are not calculated for the new municipality.</>
            : <>I conti {km.year} sono la somma dei {kant.merged_from.length} Comuni confluiti in {p.name}.{kant.values.moltiplicatore ? <> Tutti avevano un moltiplicatore del {num(kant.values.moltiplicatore)} %.</> : null} Le risorse fiscali non sono calcolate per il nuovo Comune.</>}</Note>}
          <StatGrid cols={3}>
            {km.measures.map((m0) => {
              const m = { ...m0, ...measureText(p.kt, m0) };
              const v = kant.values[m.key];
              const all = peersAll.map((q) => q.values[m.key]).filter((x): x is number => x !== null && x !== undefined);
              const ranked = [...all].sort((a, b) => b - a);
              const rank = v === null || v === undefined ? null : ranked.indexOf(v) + 1;
              return (
                <Stat key={m.key} label={m.label} value={v === null || v === undefined ? T("non disponibile", "not available") : formatUnit(v, m.unit)}
                  sub={<>{rank ? <><strong className="text-foreground">{ord(rank)} {T("su", "of")} {ranked.length}</strong> {munis} · {T("mediana", "median")} {formatUnit(Math.round(median(all)), m.unit)}<br /></> : null}{m.note}.</>} />
              );
            })}
          </StatGrid>
          {kant.water_included && <Note>{T("I conti di questo Comune comprendono l'acqua potabile, che in altri Comuni è tenuta in un'azienda separata: le spese risultano più alte.", "The accounts of this municipality include drinking water, which other municipalities keep in a separate utility: spending comes out higher.")}</Note>}
          {kant.abs && (
            <Card title={`${T("Importi totali", "Total amounts")}, ${km.year}`}>
              <table className="w-full max-w-xl text-sm">
                <tbody>
                  {([[T("Spese operative", "Operating expenses"), kant.abs.spese], [T("Ricavi operativi", "Operating revenue"), kant.abs.ricavi], [T("Investimenti netti", "Net investment"), kant.abs.netinv], [en ? `Net debt at the end of ${km.year}` : `Debito netto a fine ${km.year}`, kant.abs.debito]] as [string, number][]).map(([l, v]) => (
                    <tr key={l} className="border-b border-border"><td className="py-2 pr-4">{l}</td><td className="py-2 text-right tabular font-medium">{chf(v, { digits: 1 })}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-sm text-muted max-w-xl">{T("Il risultato d'esercizio comprende anche spese e ricavi finanziari: non è la differenza tra le prime due righe.", "The annual result also includes financial expenses and revenue: it is not the difference between the first two rows.")}</p>
              <SourceBadge meta={ktGemeinden(p.kt).meta} />
            </Card>
          )}
          {kant.funk && (
            <Card title={en ? `What each service costs per inhabitant, ${km.year}` : `Quanto costa ogni servizio per abitante, ${km.year}`} subtitle={T("Spese meno ricavi propri di ogni servizio, in franchi per abitante.", "Spending minus each service's own income, in francs per inhabitant.")}>
              <BarList items={Object.entries(kant.funk).map(([label, value]) => ({ label: en ? ZH_FUNK_EN[label] ?? label : label, value })).sort((a, b) => b.value - a.value)} total={Object.values(kant.funk).reduce((s, v) => s + v, 0)} negativeNote={T("ricavi superiori alle spese", "income above spending")} />
              <SourceBadge meta={ktGemeinden(p.kt).meta} />
            </Card>
          )}
          {kant.series && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card title={S.dn} subtitle={T("In franchi per abitante. Sotto zero, il Comune ha più averi che debiti.", "In francs per inhabitant. Below zero, the municipality has more assets than debts.")}>
                <TimeSeries rows={Object.entries(kant.series.debito_pc ?? {}).map(([y, v]) => ({ year: Number(y), [S.dn]: v }))} series={[S.dn]} height={240} zero />
              </Card>
              <Card title={T("Moltiplicatore d'imposta", "Tax multiplier")} subtitle={T("Percentuale dell'imposta cantonale che il Comune preleva (in tedesco «Steuerfuss»).", "Percentage of the cantonal tax that the municipality levies (in German «Steuerfuss»).")}>
                {stfFlat ? <p className="display text-3xl">{en ? <>Unchanged at {num(stf[0][1])} % from {stf[0][0]} to {stf.at(-1)![0]}.</> : <>Invariato al {num(stf[0][1])} % dal {stf[0][0]} al {stf.at(-1)![0]}.</>}</p>
                  : <TimeSeries rows={stf.map(([y, v]) => ({ year: Number(y), [S.mo]: v }))} series={[S.mo]} unit="pct" height={240} />}
              </Card>
            </div>
          )}
        </>
      )}

      {aff && yA && (
        <>
          <SectionHead title={en ? `The ${yA} accounts, according to the Confederation` : `I conti ${yA}, secondo la Confederazione`} sub={en
            ? (kant
              ? <>Federal statistics (FFA), available only for the larger municipalities. The two sources count different items, so these figures do not match the canton&apos;s above{p.kt === "zh" ? ": federal spending is gross, the cantonal cost subtracts the services' income" : ""}.</>
              : <>Federal statistics (FFA), published for municipalities that have or have had at least 5,000 inhabitants.</>)
            : (kant
              ? <>Statistica federale (AFF), disponibile solo per i Comuni più grandi. Le due fonti contano voci diverse, quindi queste cifre non coincidono con quelle del Cantone qui sopra{p.kt === "zh" ? ": le spese federali sono lorde, il costo cantonale toglie i ricavi dei servizi" : ""}.</>
              : <>Statistica federale (AFF), pubblicata per i Comuni che hanno o hanno avuto almeno 5 000 abitanti.</>)} />
          <StatGrid>
            <Stat label={`${S.sc} ${yA}`} value={chf(aff.aufwand[yA])} sub={T("conto economico, senza investimenti", "income statement, without investment")} />
            <Stat label={T("Per abitante", "Per inhabitant")} value={chf(popA ? aff.aufwand[yA] / popA : null)} sub={`${num(popA)} ${T("abitanti", "inhabitants")}`} />
            <Stat label={`${S.rc} ${yA}`} value={chf(aff.ertrag[yA])} sub={`${(aff.ertrag[yA] ?? 0) >= aff.aufwand[yA] ? T("avanzo", "surplus") : T("disavanzo", "deficit")} ${T("di", "of")} ${chf(Math.abs((aff.ertrag[yA] ?? 0) - aff.aufwand[yA]))}`} />
            <Stat label={`${T("Investimenti", "Investment")} ${yA}`} value={chf(aff.investitionen[yA])} sub={T("uscite lorde", "gross outlays")} />
          </StatGrid>
          <Card title={`${T("Per che cosa", "On what")}, ${yA}`} subtitle={en ? <>Current spending by function. «Finances and taxes» gathers fiscal equalisation, interest and expenses not assigned to a service (<Link className="link" href="/metodo/">details</Link>).</> : <>Spese correnti per funzione. «Finanze e imposte» raccoglie perequazione, interessi e spese non attribuite a un servizio (<Link className="link" href="/metodo/">dettagli</Link>).</>}>
            <BarList items={Object.values(aff.funk1).map((c) => ({ label: codedName(c), value: c.values[yA] ?? 0 })).filter((c) => c.value > 0).sort((a, b) => b.value - a.value)} total={aff.aufwand[yA]} />
            <SourceBadge meta={gemeinden().meta} />
          </Card>
          <Card title={T("Spese e ricavi correnti nel tempo", "Current spending and revenue over time")} subtitle={T("In franchi. Un picco isolato indica di solito un'operazione contabile straordinaria.", "In francs. A single spike usually marks an extraordinary accounting operation.")}>
            <TimeSeries rows={affRows} series={[S.sc, S.rc]} height={280} colors={["var(--s2)", "var(--s1)"]} />
            <SourceBadge meta={gemeinden().meta} />
          </Card>
        </>
      )}

      {similar.length > 0 && (
        <section className="border-t border-border pt-6">
          <h2 className="text-2xl">{T("Confronta con Comuni di dimensione simile", "Compare with municipalities of similar size")}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {similar.map((q) => <li key={q.id}><Link href={`/comuni/${q.id}/`} className="chip">{q.name} <span className="text-faint">· {num(q.pop)} {T("ab.", "inh.")}</span></Link></li>)}
          </ul>
          <p className="mt-5 text-sm text-muted"><Link className="link" href={`/cantoni/${p.kt}/${kant ? "#comuni" : ""}`}>{kant ? (en ? `All ${munis} on the map` : `Tutti i ${munis} sulla mappa`) : kantonLabel(p.kt)}</Link> · <Link className="link" href="/comuni/">{T("Cerca un altro Comune", "Find another municipality")}</Link> · <Link className="link" href="/metodo/">{T("Come leggere i numeri", "How to read the figures")}</Link></p>
        </section>
      )}
    </Page>
  );
}
