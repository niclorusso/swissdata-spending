import Link from "@/components/L";
import type { ReactNode } from "react";
import { geo, haushalte, hauptaggregate, kennzahlen, ktGemeinden, lastR, lastRechnung, popKantone, procurement, tree } from "@/lib/data";
import { allProfiles, kantonMap, searchItems } from "@/lib/comuni";
import { chf, num, pct } from "@/lib/format";
import { KANTONE, codedName, it as aufgIt, kantonName, objectName } from "@/lib/labels";
import { getLang, T } from "@/lib/lang-server";
import { perCapita } from "@/lib/fs";
import { SourceBadge } from "@/components/SourceBadge";
import { BarList } from "@/components/charts/BarList";
import { GeoMap } from "@/components/charts/GeoMap";
import { Note } from "@/components/ui";
import { ComuneSearch } from "@/components/ComuneSearch";
import { CountUp } from "@/components/CountUp";
import { LiveCounter } from "@/components/LiveCounter";

function Path({ kicker, title, text, href, cta, links, children }: { kicker: string; title: string; text: ReactNode; href: string; cta: string; links?: { href: string; label: string }[]; children: ReactNode }) {
  return (
    <section className="grid md:grid-cols-5 gap-x-12 gap-y-7 py-14 md:py-20 items-start">
      <div className="md:col-span-2 md:sticky md:top-24" data-reveal="up">
        <div className="kicker">{kicker}</div>
        <h2 className="mt-3 text-4xl md:text-[2.75rem] leading-[1.05] text-balance">{title}</h2>
        <p className="mt-4 text-muted leading-relaxed">{text}</p>
        <Link href={href} className="btn mt-6">{cta} <span aria-hidden>→</span></Link>
        {links && <div className="mt-5 flex flex-wrap gap-2 text-sm">{links.map((l) => <Link key={l.href} href={l.href} className="chip">{l.label}</Link>)}</div>}
      </div>
      <div className="md:col-span-3 card p-5 md:p-7" data-reveal="up" style={{ ["--d" as string]: 1 }}>{children}</div>
    </section>
  );
}

export default function Home() {
  const en = getLang() === "en";
  const fs = haushalte();
  const H = fs.data.haushalte;
  const main = hauptaggregate();
  const A = main.data.aggregates;
  const staat = H["staat"];
  const yS = String(lastR(staat));
  const total = staat.total_ausgaben[yS];
  const popCH = popKantone().data.population["CH"]?.values[yS];
  const perHead = perCapita(total, popCH) ?? 0;
  const quota = A["staat"]?.["staatsquote"]?.[yS];
  const nextY = String(Number(yS) + 1);
  const forecast = A["staat"]?.["ausgaben"]?.[nextY];
  const leap = Number(yS) % 4 === 0 && (Number(yS) % 100 !== 0 || Number(yS) % 400 === 0);
  const perSecond = total / ((leap ? 366 : 365) * 86400);

  const funk = Object.values(staat.funk1).map((c) => ({ label: codedName(c), value: c.values[yS] ?? 0 })).sort((a, b) => b.value - a.value);
  const levels = ([["bund", T("Confederazione", "Confederation"), "/confederazione/"], ["ktn", T("Cantoni", "Cantons"), "/cantoni/"], ["gdn", T("Comuni", "Municipalities"), "/comuni/"], ["sv", T("Assicurazioni sociali", "Social insurance"), "/assicurazioni-sociali/"]] as const)
    .map(([k, label, href]) => ({ label, value: H[k].total_ausgaben[yS] ?? 0, href }));
  const levelSum = levels.reduce((s, l) => s + l.value, 0);
  const levelMax = Math.max(...levels.map((l) => l.value));

  // Confederazione
  const aufg = tree("bund-ausgaben-aufgabengebiet");
  const kz = kennzahlen().data.series;
  const yB = String(lastRechnung(aufg.meta));
  const bund = aufg.data.tree[0];
  const bundTop = [...bund.children].sort((a, b) => (b.values[yB] ?? 0) - (a.values[yB] ?? 0)).slice(0, 5);
  const saldo = kz["Finanzierungssaldo"]?.values[yB] ?? 0;

  // Cantoni
  const g = geo().data;
  const yK = String(lastR(H["ktn"]));
  const pop = popKantone().data.population;
  const kRows = KANTONE.map((k) => {
    const both = H[`ktn_gdn_${k.id}`].total_ausgaben[yK];
    const p = pop[k.id.toUpperCase()]?.values[yK];
    return { ...k, nameIt: kantonName(k.id), pc: perCapita(both, p), both, p };
  });
  const kSorted = [...kRows].sort((a, b) => (b.pc ?? 0) - (a.pc ?? 0));
  const mapData = Object.fromEntries(kRows.map((r) => [r.id, { name: r.nameIt, value: r.pc, sub: en ? `Canton and municipalities: ${chf(r.both)} · ${num(r.p)} inhabitants` : `Cantone e Comuni: ${chf(r.both)} · ${num(r.p)} abitanti`, href: `/cantoni/${r.id}/` }]));

  // Comuni
  const profiles = allProfiles();
  const nProfiles = Object.keys(profiles).length;
  const items = searchItems();
  const ti = ktGemeinden("ti");
  const tiMap = kantonMap("ti", ti.data);
  const tiData = Object.fromEntries(Object.entries(ti.data.gemeinden).map(([id, v]) => [id, { name: v.name, value: v.values["spese_pc"] ?? null, sub: `${num(v.pop)} ${T("abitanti", "inhabitants")}`, href: `/comuni/${id}/` }]));

  // Appalti
  const proc = procurement();
  const py = Object.keys(proc.data.years).sort().at(-1)!;
  const lp = proc.data.years[py];

  // Assicurazioni sociali
  const sv = H["sv"];
  const ySV = String(lastR(sv));

  return (
    <main>
      <section className="hero" data-theme="dark">
        <div className="mx-auto max-w-6xl px-4 grid lg:grid-cols-12 gap-x-10 gap-y-10 pt-14 pb-16 md:pt-20 md:pb-24">
          <div className="lg:col-span-7">
            <div className="kicker" data-reveal="up">{T("Spesa pubblica svizzera · consuntivo", "Swiss public spending · actuals")} {yS}</div>
            <h1 className="mt-5" data-reveal="up" style={{ ["--d" as string]: 1 }}>
              <span className="block text-2xl md:text-[2rem] leading-tight font-medium tracking-tight text-muted text-balance">{en ? `In ${yS} Swiss public bodies spent` : `Nel ${yS} gli enti pubblici svizzeri hanno speso`}</span>
              <span className="hero-num block mt-3"><CountUp text={num(total / 1e9)} duration={1800} /></span>
              <span className="block mt-2 text-4xl md:text-6xl leading-none">{T("miliardi di franchi.", "billion francs.")}</span>
            </h1>
            <p className="mt-6 text-lg text-muted leading-relaxed max-w-xl" data-reveal="up" style={{ ["--d" as string]: 2 }}>
              {en
                ? <>The total covers the Confederation, cantons, municipalities and social insurance, counted once.{forecast ? <> For {nextY} the Federal Finance Administration forecasts {chf(forecast, { digits: 0 })}.</> : null}</>
                : <>Il totale comprende Confederazione, Cantoni, Comuni e assicurazioni sociali, contati una volta sola.{forecast ? <> Per il {nextY} l&apos;Amministrazione federale delle finanze prevede {chf(forecast, { digits: 0 })}.</> : null}</>}
            </p>
            <div className="mt-7 grid grid-cols-3 gap-3 max-w-xl" data-reveal="up" style={{ ["--d" as string]: 3 }}>
              {[[chf(perHead), T("per abitante all'anno", "per inhabitant per year")], [chf(perHead / 365), T("per abitante al giorno", "per inhabitant per day")], ...(quota ? [[pct(quota * 100), T("del PIL", "of GDP")]] : [])].map(([v, l]) => (
                <div key={l} className="glass px-3.5 py-3">
                  <div className="display text-base sm:text-xl md:text-2xl leading-none whitespace-nowrap"><CountUp text={v} /></div>
                  <div className="mt-1.5 text-xs text-muted leading-snug">{l}</div>
                </div>
              ))}
            </div>
            <p className="mt-5 flex items-center gap-2.5 text-sm text-muted" data-reveal="up" style={{ ["--d" as string]: 4 }}>
              <span className="live-dot shrink-0" aria-hidden />
              <span>{T("Da quando hai aperto questa pagina:", "Since you opened this page:")} <strong className="text-foreground"><LiveCounter perSecond={perSecond} /> CHF</strong> <span className="text-faint">· {en ? `on average ${num(perSecond)} CHF per second in ${yS}` : `in media ${num(perSecond)} CHF al secondo nel ${yS}`}</span></span>
            </p>
            <div className="mt-8 max-w-xl" data-reveal="up" style={{ ["--d" as string]: 5 }}>
              <label className="block text-sm font-semibold mb-2">{T("Quanto spende il tuo Comune?", "How much does your municipality spend?")}</label>
              <ComuneSearch items={items} />
              <div className="mt-5 flex flex-wrap gap-3">
                <a href="#chi-spende" className="btn">{T("Chi spende", "Who spends")} <span aria-hidden>↓</span></a>
                <Link href="/metodo/" className="btn-ghost">{T("Come leggere i numeri", "How to read the figures")}</Link>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 glass p-5 md:p-7 self-start" data-reveal="up" style={{ ["--d" as string]: 3 }}>
            <div className="eyebrow">{T("Spesa per funzione", "Spending by function")} ({yS})</div>
            <div className="mt-5"><BarList items={funk} total={total} /></div>
            <SourceBadge meta={fs.meta} compact />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
      <section id="chi-spende" className="grid md:grid-cols-5 gap-x-12 gap-y-7 py-14 md:py-20 items-start">
        <div className="md:col-span-2" data-reveal="up">
          <div className="kicker">{T("I quattro livelli", "The four levels")}</div>
          <h2 className="mt-3 text-4xl md:text-[2.75rem] leading-[1.05]">{T("Chi spende", "Who spends")}</h2>
          <p className="mt-4 text-muted leading-relaxed">{T("I Cantoni spendono più della Confederazione. Le assicurazioni sociali (AVS, AI, IPG, AD) spendono più dei Comuni.", "The cantons spend more than the Confederation. Social insurance (AHV, IV, EO, ALV) spends more than the municipalities.")}</p>
          <div className="mt-5"><Note>{en
            ? <>The four levels add up to {chf(levelSum, { digits: 0 })}, more than the total of {chf(total, { digits: 0 })}: transfers from one level to another appear twice. The consolidated total counts them once.</>
            : <>La somma dei quattro livelli fa {chf(levelSum, { digits: 0 })}, più del totale di {chf(total, { digits: 0 })}: i trasferimenti da un livello all&apos;altro compaiono due volte. Il totale consolidato li conta una volta.</>}</Note></div>
        </div>
        <div className="md:col-span-3 grid sm:grid-cols-2 gap-3 md:gap-4" data-reveal="bars">
          {levels.map((l, i) => (
            <Link key={l.href} href={l.href} className="card card-link p-5 block" data-reveal="up" style={{ ["--d" as string]: i }}>
              <div className="flex items-center justify-between text-sm text-muted"><span>{l.label}</span><span aria-hidden>→</span></div>
              <div className="display mt-3 text-4xl leading-none"><CountUp text={chf(l.value, { unit: false })} /></div>
              <div className="bar mt-4"><div className="bar-fill" style={{ width: `${(l.value / levelMax) * 100}%`, background: "var(--s1)", ["--i" as string]: i * 3 }} /></div>
              <div className="mt-2 text-xs text-faint">{en ? `spending ${yS}, in francs` : `uscite ${yS}, in franchi`}</div>
            </Link>
          ))}
          <div className="sm:col-span-2"><SourceBadge meta={fs.meta} compact /></div>
        </div>
      </section>
      <Path kicker={T("Cantoni", "Cantons")} title={T("Quanto spende ogni Cantone per abitante", "How much each canton spends per inhabitant")} href="/cantoni/" cta={T("Confronta i Cantoni", "Compare the cantons")}
        text={en
          ? <>Canton and municipalities together, divided by the inhabitants ({yK}), without the Confederation and social insurance. The highest is {kSorted[0].nameIt} with {chf(kSorted[0].pc)}, the lowest {kSorted.at(-1)!.nameIt} with {chf(kSorted.at(-1)!.pc)}.</>
          : <>Cantone e Comuni insieme, divisi per gli abitanti ({yK}), senza Confederazione e assicurazioni sociali. Il massimo è {kSorted[0].nameIt} con {chf(kSorted[0].pc)}, il minimo {kSorted.at(-1)!.nameIt} con {chf(kSorted.at(-1)!.pc)}.</>}
        links={[{ href: "/cantoni/ti/", label: "Ticino" }, { href: "/cantoni/zh/", label: kantonName("zh") }, { href: "/cantoni/gr/", label: kantonName("gr") }]}>
        <GeoMap viewBox={g.viewBox} shapes={Object.entries(g.cantons).map(([id, d]) => ({ id, d }))} data={mapData} legendTitle={`${T("Spesa per abitante", "Spending per inhabitant")}, ${yK}`} lakes={g.lakes} labels={g.canton_centroids} stroke={1.2} />
        <SourceBadge meta={fs.meta} compact />
      </Path>

      <Path kicker={T("Confederazione", "Confederation")} title={en ? `${chf(bund.values[yB], { digits: 1 })} of spending in ${yB}` : `${chf(bund.values[yB], { digits: 1 })} di uscite nel ${yB}`} href="/confederazione/" cta={T("Apri il bilancio federale", "Open the federal budget")}
        text={en
          ? <>One third goes to social welfare. {yB} closed with a {saldo >= 0 ? "surplus" : "deficit"} of {chf(Math.abs(saldo))}. This is the figure of the federal budget; in the comparison between levels above the Confederation counts for more because the funds for railways and roads are added (<Link className="link" href="/metodo/">why</Link>).</>
          : <>Un terzo va alla previdenza sociale. Il {yB} si è chiuso con {chf(Math.abs(saldo))} di {saldo >= 0 ? "avanzo" : "disavanzo"}. È la cifra del bilancio federale; nel confronto tra livelli qui sopra la Confederazione conta di più perché si aggiungono i fondi per ferrovie e strade (<Link className="link" href="/metodo/">perché</Link>).</>}
        links={[{ href: "/confederazione/unita/", label: T("Uffici federali", "Federal offices") }, { href: "/appalti/", label: T("Appalti", "Procurement") }]}>
        <div className="eyebrow mb-4">{T("I cinque settori maggiori", "The five largest areas")}, {yB}</div>
        <BarList items={bundTop.map((c) => ({ label: aufgIt(c.name), value: c.values[yB] ?? 0 }))} total={bund.values[yB] ?? 0} />
        <SourceBadge meta={aufg.meta} compact />
      </Path>

      <Path kicker={T("Comuni", "Municipalities")} title={T("Ticino e Zurigo, Comune per Comune", "Ticino and Zurich, municipality by municipality")} href="/cantoni/ti/#comuni" cta={T("Apri la mappa del Ticino", "Open the map of Ticino")}
        text={en
          ? <>The Confederation publishes the accounts of single municipalities only above 5,000 inhabitants. Ticino and Zurich publish those of all of them: spending, debt, tax multiplier, investment. In all, {num(nProfiles)} municipalities have a page.</>
          : <>La Confederazione pubblica i conti dei singoli Comuni solo sopra i 5 000 abitanti. Ticino e Zurigo pubblicano quelli di tutti: spese, debito, moltiplicatore, investimenti. In tutto {num(nProfiles)} Comuni hanno una scheda.</>}
        links={[{ href: "/cantoni/zh/#comuni", label: T("Mappa di Zurigo", "Map of Zurich") }, { href: "/comuni/", label: T("Tutti i Comuni con dati", "All municipalities with data") }]}>
        <div className="eyebrow mb-3">{T("Spese operative per abitante, Comuni ticinesi", "Operating expenses per inhabitant, municipalities in Ticino")}, {ti.data.year}</div>
        <div className="max-w-md mx-auto"><GeoMap viewBox={tiMap.viewBox} shapes={tiMap.shapes} data={tiData} legendTitle={T("Spese operative per abitante", "Operating expenses per inhabitant")} lakes={tiMap.lakes} context={tiMap.context} stroke={0.6} /></div>
        <SourceBadge meta={ti.meta} compact />
      </Path>

      <section className="grid md:grid-cols-2 gap-4 md:gap-6 py-14 md:py-20">
        <Link href="/assicurazioni-sociali/" className="card card-link p-6 md:p-8 block" data-reveal="up">
          <div className="kicker">{T("Assicurazioni sociali", "Social insurance")}</div>
          <h2 className="mt-3 text-3xl md:text-4xl leading-[1.08] text-balance">{en ? `${chf(sv.total_ausgaben[ySV], { digits: 1 })} in ${ySV} across AHV, IV, EO and ALV` : `${chf(sv.total_ausgaben[ySV], { digits: 1 })} nel ${ySV} tra AVS, AI, IPG e AD`}</h2>
          <p className="mt-4 text-muted leading-relaxed">{en ? `The AHV (old-age insurance) alone spent ${chf(H["sv_ahv"].total_ausgaben[ySV], { digits: 1 })}. Pension funds and health insurers are not public accounts and are not included.` : `L'AVS da sola ha speso ${chf(H["sv_ahv"].total_ausgaben[ySV], { digits: 1 })}. Casse pensioni e casse malati non sono conti pubblici e non sono incluse.`}</p>
          <span className="btn mt-6">{T("Apri le assicurazioni sociali", "Open social insurance")} <span aria-hidden>→</span></span>
        </Link>
        <Link href="/appalti/" className="card card-link p-6 md:p-8 block" data-reveal="up" style={{ ["--d" as string]: 1 }}>
          <div className="kicker">{T("Appalti federali", "Federal procurement")}</div>
          <h2 className="mt-3 text-3xl md:text-4xl leading-[1.08] text-balance">{en ? `${num(lp.n)} contracts signed in ${py}` : `${num(lp.n)} contratti firmati nel ${py}`}</h2>
          <p className="mt-4 text-muted leading-relaxed">{en
            ? <>They are worth {chf(lp.total_chf, { digits: 1 })} over their whole duration, not in {py} alone. The largest: {lp.largest.supplier}, {chf(lp.largest.chf)}{objectName(lp.largest.object) ? ` for ${objectName(lp.largest.object)}` : ""}. The list covers contracts of 50,000 francs and above of the central Federal Administration.</>
            : <>Valgono {chf(lp.total_chf, { digits: 1 })} sull&apos;intera durata, non sul solo {py}. Il più grande: {lp.largest.supplier}, {chf(lp.largest.chf)}{objectName(lp.largest.object) ? ` per ${objectName(lp.largest.object)}` : ""}. L&apos;elenco copre i contratti da 50 000 franchi in su dell&apos;Amministrazione federale centrale.</>}</p>
          <span className="btn mt-6">{T("Cerca tra i contratti", "Search the contracts")} <span aria-hidden>→</span></span>
        </Link>
      </section>

      <section className="py-14 md:py-20">
        <div data-reveal="up">
          <div className="kicker">{T("Limiti", "Limits")}</div>
          <h2 className="mt-3 text-4xl md:text-[2.75rem] leading-[1.05]">{T("Cosa non c'è", "What is missing")}</h2>
        </div>
        <ul className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-sm text-muted leading-relaxed">
          {(en ? [
            ["Federal subsidies by recipient", "The FFA shows them in a dashboard, with no downloadable file."],
            ["Contracts of cantons and municipalities", "simap.ch gives access to the data only on request."],
            ["Municipalities below 5,000 inhabitants outside Ticino and Zurich", "For them only the totals by canton exist."],
            ["Public companies", "SBB, Swiss Post, Swisscom and the cantonal companies have no structured list of accounts."],
          ] : [
            ["Sussidi federali per beneficiario", "L'AFF li mostra in una dashboard, senza file scaricabile."],
            ["Appalti di Cantoni e Comuni", "simap.ch dà accesso ai dati solo su richiesta."],
            ["Comuni sotto i 5 000 abitanti fuori da Ticino e Zurigo", "Per loro esistono solo i totali per Cantone."],
            ["Aziende pubbliche", "FFS, Posta, Swisscom e le aziende cantonali non hanno un elenco strutturato dei conti."],
          ]).map(([t, d], i) => (
            <li key={t} className="tile !p-5" data-reveal="up" style={{ ["--d" as string]: i }}>
              <strong className="block text-base text-foreground leading-snug">{t}</strong>
              <span className="block mt-2">{d}</span>
            </li>
          ))}
        </ul>
      </section>
      </div>
    </main>
  );
}
