import type { Metadata } from "next";
import Link from "@/components/L";
import { gemeinden, ktGemeinden, popForAccounts, popGemeindenMeta } from "@/lib/data";
import { allProfiles, kantonLabel, ktMunicipalities, peersOf } from "@/lib/comuni";
import { chf, date, formatUnit, num, pctAuto } from "@/lib/format";
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
  // Inhabitants on the territory the accounts refer to: none if the municipality was merged after the year of the accounts.
  const popRef = yA ? popForAccounts(id, yA) : { pop: null };
  const popA = popRef.pop;
  const why = popRef.why;
  const whyText = !why ? null : why.kind === "dissolved"
    ? (en ? `merged into ${why.into} on ${date(why.date)}: the Federal Statistical Office no longer publishes its inhabitants` : `confluito in ${why.into} il ${date(why.date)}: l'Ufficio federale di statistica non pubblica più i suoi abitanti`)
    : (en ? `the ${yA} accounts are of ${p.name} before it took in ${why.names.join(", ")} on ${date(why.date)}; the population is published only for the merged municipality` : `i conti ${yA} sono di ${p.name} prima dell'aggregazione con ${why.names.join(", ")} del ${date(why.date)}; la popolazione è pubblicata solo per il Comune aggregato`);
  const stf = kant?.series?.steuerfuss ? Object.entries(kant.series.steuerfuss) : [];
  // Zurich: a second (third) multiplier applies in the part of the municipality that belongs to another school municipality.
  const stfMore = kant?.series ? (["steuerfuss_2", "steuerfuss_3"] as const).map((k) => kant.series![k]).filter((x): x is Record<string, number> => !!x && Object.entries(x).some(([y, v]) => kant.series!.steuerfuss?.[y] !== v)) : [];
  const stfFlat = stf.length > 0 && new Set(stf.map(([, v]) => v)).size === 1 && stfMore.length === 0;
  const mo2 = (i: number) => (en ? `${S.mo} ${i + 2}` : `${S.mo} ${i + 2}`);
  const mp = kant?.moltiplicatori;
  // Federal file: current revenue minus current spending. The FFA publishes the two amounts, not a result: the subtraction is the site's.
  const diffA = aff && yA ? (aff.ertrag[yA] ?? 0) - aff.aufwand[yA] : 0;
  // The canton's own result for the year of the federal accounts, as the cantonal source publishes it (Ticino: francs; Zurich: francs per inhabitant).
  const kantResult = kant && km && yA && String(km.year) === yA && !kant.merged_from
    ? (p.kt === "ti" && kant.abs?.risultato !== undefined ? { v: kant.abs.risultato, text: chf(Math.abs(kant.abs.risultato), { digits: 1 }), ref: T("Sezione degli enti locali, Statistica finanziaria dei comuni, tabella 9", "Local Authorities Section, financial statistics of the municipalities, table 9") }
      : p.kt === "zh" && typeof kant.values.risultato_pc === "number" ? { v: kant.values.risultato_pc, text: `${chf(Math.abs(kant.values.risultato_pc))} ${T("per abitante", "per inhabitant")}`, ref: T("Amt für Statistik und Daten del Canton Zurigo, indicatore 828", "Amt für Statistik und Daten of the Canton of Zurich, indicator 828") }
      : null)
    : null;

  return (
    <Page kicker={`${T("Comune", "Municipality")} · ${kantonLabel(p.kt)}`} back={{ href: `/cantoni/${p.kt}/${kant ? "#comuni" : ""}`, label: kantonLabel(p.kt) }} title={p.name}
      lead={en
        ? <p>{why && !kant ? (why.kind === "dissolved" ? <>Municipality {whyText}.</> : <>{num(p.pop)} inhabitants at the end of {yA} within today&apos;s boundaries, which include {why.names.join(", ")} (merged on {date(why.date)}).</>) : <>{num(p.pop)} inhabitants.</>}{kant?.merged_from ? <> Formed after {km?.year} by the merger of {kant.merged_from.map((q) => `${q.name} (${num(q.pop)} inhabitants)`).join(", ")}.</> : null}</p>
        : <p>{why && !kant ? (why.kind === "dissolved" ? <>Comune {whyText}.</> : <>{num(p.pop)} abitanti a fine {yA} nei confini attuali, che comprendono {why.names.join(", ")} (aggregazione del {date(why.date)}).</>) : <>{num(p.pop)} abitanti.</>}{kant?.merged_from ? <> Nato dopo il {km?.year} dall&apos;aggregazione di {kant.merged_from.map((q) => `${q.name} (${num(q.pop)} abitanti)`).join(", ")}.</> : null}</p>}>

      {kant && km && (
        <>
          <SectionHead title={en ? `The ${km.year} accounts, according to the canton` : `I conti ${km.year}, secondo il Cantone`} sub={en ? <>Cantonal statistics, the same for all {munis}. The rank starts from the highest value: 1st is the municipality with the largest figure.</> : <>Statistica cantonale, uguale per tutti i {munis}. La posizione parte dal valore più alto: 1° è il Comune con la cifra maggiore.</>} />
          {kant.merged_from && <Note title={T("Comune aggregato", "Merged municipality")}>{en
            ? <>The {km.year} accounts are the sum of the {kant.merged_from.length} municipalities merged into {p.name}.{kant.values.moltiplicatore ? <> All had a tax multiplier of {pctAuto(kant.values.moltiplicatore)}.</> : null} Tax resources are not calculated for the new municipality.</>
            : <>I conti {km.year} sono la somma dei {kant.merged_from.length} Comuni confluiti in {p.name}.{kant.values.moltiplicatore ? <> Tutti avevano un moltiplicatore del {pctAuto(kant.values.moltiplicatore)}.</> : null} Le risorse fiscali non sono calcolate per il nuovo Comune.</>}</Note>}
          <StatGrid cols={3}>
            {km.measures.map((m0) => {
              const m = { ...m0, ...measureText(p.kt, m0) };
              const v = kant.values[m.key];
              const all = peersAll.map((q) => q.values[m.key]).filter((x): x is number => x !== null && x !== undefined);
              const ranked = [...all].sort((a, b) => b - a);
              const rank = v === null || v === undefined ? null : ranked.indexOf(v) + 1;
              return (
                <Stat key={m.key} label={m.label} value={v === null || v === undefined ? T("non disponibile", "not available") : formatUnit(v, m.unit)}
                  sub={<>{m.key === "moltiplicatore" && mp ? <><strong className="text-foreground">{T("Persone giuridiche", "Companies")}: {formatUnit(mp.pg, "pct")}</strong> ({mp.year})<br /></> : null}
                    {m.key === "steuerfuss" && stfMore.some((x) => x[String(km.year)] !== undefined) ? <><strong className="text-foreground">{T("Secondo moltiplicatore", "Second multiplier")}: {stfMore.filter((x) => x[String(km.year)] !== undefined).map((x) => formatUnit(x[String(km.year)], "pct")).join(", ")}</strong> ({T("secondo il Comune scolastico", "depending on the school municipality")})<br /></> : null}
                    {rank ? <><strong className="text-foreground">{ord(rank)} {T("su", "of")} {ranked.length}</strong> {munis} · {T("mediana", "median")} {formatUnit(Math.round(median(all)), m.unit)} ({T("posizione e mediana calcolate dal sito", "rank and median computed by the site")})<br /></> : null}{m.note}.</>} />
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
                <SourceBadge meta={ktGemeinden(p.kt).meta} />
              </Card>
              <Card title={T("Moltiplicatore d'imposta", "Tax multiplier")} subtitle={<>{T("Percentuale dell'imposta cantonale semplice che il Comune preleva, senza imposta di culto (in tedesco «Steuerfuss», in percento della «einfache Staatssteuer»).", "Percentage of the simple cantonal tax that the municipality levies, without church tax (in German «Steuerfuss», in per cent of the «einfache Staatssteuer»).")}{stfMore.length > 0 ? T(" Il Comune ha avuto più di un moltiplicatore, secondo il Comune scolastico.", " The municipality has had more than one multiplier, depending on the school municipality.") : ""}</>}>
                {stfFlat ? <p className="display text-3xl">{en ? <>Unchanged at {pctAuto(stf[0][1])} from {stf[0][0]} to {stf.at(-1)![0]}.</> : <>Invariato al {pctAuto(stf[0][1])} dal {stf[0][0]} al {stf.at(-1)![0]}.</>}</p>
                  : <TimeSeries rows={stf.map(([y, v]) => ({ year: Number(y), [S.mo]: v, ...Object.fromEntries(stfMore.map((x, i) => [mo2(i), x[y] ?? null])) }))} series={[S.mo, ...stfMore.map((_, i) => mo2(i))]} unit="pct" height={240} />}
                <SourceBadge meta={ktGemeinden(p.kt).meta} />
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
              : <>Federal statistics (FFA), published for municipalities that have or have had at least {num(5000)} inhabitants.</>)
            : (kant
              ? <>Statistica federale (AFF), disponibile solo per i Comuni più grandi. Le due fonti contano voci diverse, quindi queste cifre non coincidono con quelle del Cantone qui sopra{p.kt === "zh" ? ": le spese federali sono lorde, il costo cantonale toglie i ricavi dei servizi" : ""}.</>
              : <>Statistica federale (AFF), pubblicata per i Comuni che hanno o hanno avuto almeno {num(5000)} abitanti.</>)} />
          <StatGrid>
            <Stat label={`${S.sc} ${yA}`} value={chf(aff.aufwand[yA])} sub={T("conto economico, senza investimenti", "income statement, without investment")} />
            <Stat label={T("Per abitante", "Per inhabitant")} value={popA ? chf(aff.aufwand[yA] / popA) : T("non calcolabile", "not computable")} sub={popA ? `${num(popA)} ${T("abitanti al", "inhabitants on")} 31.12.${yA}; ${T("divisione fatta dal sito", "division made by the site")}` : whyText ?? T("popolazione non disponibile", "population not available")} />
            <Stat label={`${S.rc} ${yA}`} value={chf(aff.ertrag[yA])} sub={en
              ? `revenue minus spending: ${diffA >= 0 ? "+" : ""}${chf(diffA)}, a subtraction made by the site on the FFA's harmonised figures; the FFA publishes no result for single municipalities`
              : `ricavi meno spese: ${diffA >= 0 ? "+" : ""}${chf(diffA)}, sottrazione fatta dal sito sulle cifre armonizzate dell'AFF; l'AFF non pubblica un risultato per i singoli Comuni`} />
            <Stat label={`${T("Investimenti", "Investment")} ${yA}`} value={chf(aff.investitionen[yA])} sub={T("uscite lorde", "gross outlays")} />
          </StatGrid>
          <div data-reveal="up"><SourceBadge meta={gemeinden().meta} also={popA ? popGemeindenMeta() : undefined} /></div>
          {kantResult && (
            <Note title={T("Il risultato secondo il Cantone", "The result according to the canton")}>{p.kt === "zh"
              ? (en
                ? <>The canton publishes the {yA} result of the consolidated municipality, school municipalities included: a {kantResult.v >= 0 ? "surplus" : "deficit"} of {kantResult.text} (Canton of Zurich, indicator 828, «Ertrags-/Aufwandüberschuss»). The canton gives it per inhabitant only; the site does not turn it into a total, because the file does not say which population it was divided by. This result and the subtraction above ({diffA >= 0 ? "+" : ""}{chf(diffA)}) follow different accounting rules: the federal financial statistics harmonise the accounts of all municipalities, the canton publishes the result of the consolidated municipality. The reason for the difference between the two figures in this municipality is not published.</>
                : <>Il Cantone pubblica il risultato {yA} del Comune consolidato, compresi i Comuni scolastici: un {kantResult.v >= 0 ? "avanzo" : "disavanzo"} di {kantResult.text} (Cantone di Zurigo, indicatore 828, «Ertrags-/Aufwandüberschuss»). Il Cantone lo dà solo per abitante; il sito non lo trasforma in un totale, perché il file non dice per quale popolazione è stato diviso. Questo risultato e la sottrazione qui sopra ({diffA >= 0 ? "+" : ""}{chf(diffA)}) seguono regole contabili diverse: la statistica finanziaria federale armonizza i conti di tutti i Comuni, il Cantone pubblica il risultato del Comune consolidato. Il motivo della differenza tra le due cifre per questo Comune non è pubblicato.</>)
              : (en
                ? <>The canton publishes the municipality&apos;s {yA} «risultato totale d&apos;esercizio»: a {kantResult.v >= 0 ? "surplus" : "deficit"} of {kantResult.text} (Local Authorities Section, financial statistics of the municipalities {yA}, table 9 «Conto economico (senza imputazioni interne)», last column). It includes financial and extraordinary items. The difference above ({diffA >= 0 ? "+" : ""}{chf(diffA)}) is computed by the site on the accounts as the FFA brings them to its common scheme, which sorts some items differently: the two figures can differ, also in sign.</>
                : <>Il Cantone pubblica il «risultato totale d&apos;esercizio» {yA} del Comune: un {kantResult.v >= 0 ? "avanzo" : "disavanzo"} di {kantResult.text} (Sezione degli enti locali, Statistica finanziaria dei comuni {yA}, tabella 9 «Conto economico (senza imputazioni interne)», ultima colonna). Comprende le voci finanziarie e straordinarie. La differenza qui sopra ({diffA >= 0 ? "+" : ""}{chf(diffA)}) è calcolata dal sito sui conti come l&apos;AFF li riporta al suo schema comune, che classifica alcune voci in modo diverso: le due cifre possono differire, anche nel segno.</>)}</Note>
          )}
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
