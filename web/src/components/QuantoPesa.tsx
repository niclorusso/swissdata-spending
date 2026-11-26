"use client";
import { Fragment, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useL } from "@/lib/useLang";
import { WeightTreemap } from "@/components/charts/WeightTreemap";
import { shareOf, slugFor, type QpData } from "@/lib/quanto-pesa";

/** «Quanto pesa?»: the chooser (slug null) or the page of one item, /quanto-pesa/<slug>/. `sourceLine`: the site's source line
 *  (SourceBadge, a server component), drawn by the page. */
export function QuantoPesa({ data, slug, sourceLine }: { data: QpData; slug: string | null; sourceLine: ReactNode }) {
  const { en, T, chf, chfFull, num, pct, date, link, h } = useL();
  const router = useRouter();
  const { year, total, cellSum, groups, voci, source } = data;
  const voce = voci.find((v) => v.slug === slug) ?? null;
  const share = (fraction: number) => shareOf(pct, fraction);
  const whole = T("della spesa pubblica di Confederazione, Cantoni, Comuni e assicurazioni sociali", "of public spending by the Confederation, cantons, municipalities and social insurance");
  const isOn = (code: string) => !!voce && (code === voce.code || (voce.code.length === 1 && code.startsWith(voce.code)));
  const page = (s: string) => `/quanto-pesa/${s}/`;
  const nCells = groups.reduce((n, g) => n + g.cells.length, 0);

  // What the item contains, and the source. Wide screens: under the sentence. Narrower ones: under the map, so that on a phone the
  // question, the answer, the chooser and the highlighted box come first.
  const about = (
    <>
      {voce?.scope && (
        <p className="mt-3 text-sm text-muted leading-snug max-w-3xl">{voce.scope.text}{" "}
          <span className="text-faint">({voce.scope.sources.map((x, i) => <Fragment key={x.url}>{i > 0 && "; "}<a className="underline hover:text-accent whitespace-nowrap" href={x.url} target="_blank" rel="noreferrer">{x.label}</a></Fragment>)})</span>
        </p>
      )}
      {sourceLine}
    </>
  );

  // Links of the prototype carried the item in the address (?voce=difesa): the chooser sends them on to the item's own page.
  useEffect(() => {
    if (slug) return;
    const s = slugFor(new URLSearchParams(window.location.search).get("voce"));
    if (s) window.location.replace(h(page(s)));
  }, [slug, h]);

  return (
    <>
      <div className="grid lg:grid-cols-12 gap-x-10 gap-y-4 sm:gap-y-6 items-start">
        <div className="lg:col-span-4 lg:sticky lg:top-20">
          <header>
            {/* one span: the kicker is a flex row, and its words must wrap as one line of text */}
            <div className="kicker"><span>{voce ? <Link href={link("/quanto-pesa/")} className="hover:underline">{T("Quanto pesa?", "How much does it weigh?")}</Link> : T("Quanto pesa?", "How much does it weigh?")} · {T("consuntivo", "actuals")} {year}</span></div>
            <h1 className="mt-2 sm:mt-4 text-[1.5rem] sm:text-4xl md:text-5xl lg:text-[2.4rem] leading-[1.1] max-w-4xl text-balance">{voce ? voce.question : T("Quanto pesa una voce sulla spesa pubblica?", "How much does one item weigh in public spending?")}</h1>
            <p className="mt-2 sm:mt-4 text-[1.05rem] sm:text-lg md:text-xl lg:text-lg max-w-3xl leading-snug sm:leading-relaxed">
              {voce
                ? <><strong>{voce.name}</strong>: <strong className="tabular whitespace-nowrap">{chf(voce.value)}</strong>, <strong className="tabular whitespace-nowrap">{share(voce.value / total)}</strong> {whole} {T("nel", "in")} {year}.</>
                : <span className="text-muted">{en
                  ? <>Pick an item: the map shows what it weighs in the {chf(total, { digits: 1 })} of public spending by the Confederation, cantons, municipalities and social insurance in {year}.</>
                  : <>Scegli una voce: la mappa mostra quanto pesa sui {chf(total, { digits: 1 })} di spesa pubblica di Confederazione, Cantoni, Comuni e assicurazioni sociali nel {year}.</>}</span>}
            </p>
            <div className="hidden lg:block">{about}</div>
          </header>

          {/* Phones: one native list, so the map stays in the first screen. Wider screens: every item in sight, as links. */}
          <label className="mt-3 flex items-center gap-3 sm:hidden">
            <span className="text-sm font-semibold shrink-0">{T("Voce", "Item")}</span>
            <select className="field min-w-0 flex-1 px-3 py-2 text-base" value={voce?.slug ?? ""} onChange={(e) => e.target.value && router.push(link(page(e.target.value)), { scroll: false })}>
              {!voce && <option value="" disabled>{T("Scegli una voce", "Pick an item")}</option>}
              {voci.map((v) => <option key={v.slug} value={v.slug}>{v.name}</option>)}
            </select>
          </label>
          <noscript>
            <p className="mt-3 text-sm sm:hidden">{T("Ogni voce ha il suo indirizzo (anche i vecchi link con «?voce=»):", "Every item has its own address (old links with «?voce=» too):")}{" "}
              {voci.map((v, i) => <Fragment key={v.slug}>{i > 0 && " · "}<a className="underline" href={h(page(v.slug))}>{v.name}</a></Fragment>)}
            </p>
          </noscript>
          <nav className="mt-6 hidden sm:flex flex-wrap gap-2" aria-label={T("Scegli una voce", "Pick an item")}>
            {voci.map((v) => (
              <Link key={v.slug} href={link(page(v.slug))} scroll={false} className="chip !py-1 !px-3" aria-current={v.slug === voce?.slug ? "page" : undefined}>{v.name}</Link>
            ))}
          </nav>
        </div>

        <section className="lg:col-span-8 card p-3 sm:p-5 md:p-6" aria-label={T("Mappa della spesa pubblica", "Map of public spending")}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-2 sm:mb-3 text-sm">
            <span className="font-semibold">{T("Spesa pubblica", "Public spending")} {year}</span>
            <span className="text-muted tabular">{chf(total, { digits: 1 })} · {pct(100, 0)}</span>
          </div>
          <WeightTreemap groups={groups} total={total}
            highlight={voce ? { code: voce.code, name: voce.name, value: voce.value, amount: chf(voce.value), share: share(voce.value / total) } : null}
            ariaLabel={voce ? `${T("Mappa della spesa pubblica", "Map of public spending")} ${year}: ${voce.name}, ${share(voce.value / total)}` : `${T("Mappa della spesa pubblica", "Map of public spending")} ${year}`}
            fmt={{ cell: (v, s) => `${chf(v, { unit: false })} · ${share(s)}`, aria: (n, v, s) => `${n}: ${chf(v)}, ${share(s)}` }} />
          <div className="lg:hidden">{about}</div>
          <p className="mt-3 text-xs text-faint leading-relaxed">{T(
            "Area = importo. Ogni riquadro è una voce, gli spazi più larghi tra i riquadri separano i settori. I riquadri piccoli hanno il nome solo passandoci sopra, toccandoli o con il tasto Tab; tutte le voci sono nella tabella qui sotto.",
            "Area = amount. Each box is a line, the wider gaps between boxes separate the task areas. Small boxes show their name only on hover, tap or Tab; every line is in the table below.")}</p>
          <p className="mt-2 text-xs text-faint leading-relaxed">
            {en
              ? <>Method: spending by function of general government (Confederation, cantons, municipalities and social insurance) in the financial statistics of the FFA, FS model. The total is consolidated by the FFA: money one body pays to another is counted once. Each box is a two-digit line of the file; task areas (one digit) and shares are added up and divided by the site. The {nCells} lines add up to {chfFull(cellSum)}, the FFA total is {chfFull(total)}{cellSum !== total ? <>: the difference of {num(Math.abs(cellSum - total))} CHF comes from rounding each line to the franc</> : null}. File: <a className="underline hover:text-accent" href={source.fileUrl} target="_blank" rel="noreferrer">standardauswertung.csv</a>, as of {date(source.fileDate)}. {year} is the last year the FFA gives as actuals for general government (main_extern.csv, as of {date(source.statusDate)}).</>
              : <>Metodo: uscite per funzione dello Stato nel suo insieme (Confederazione, Cantoni, Comuni e assicurazioni sociali) nella statistica finanziaria dell’AFF, modello FS. Il totale è consolidato dall’AFF: i soldi che un ente versa a un altro sono contati una volta sola. Ogni riquadro è una voce a due cifre del file; i settori (una cifra) e le quote sono somme e divisioni fatte dal sito. Le {nCells} voci sommano a {chfFull(cellSum)}, il totale dell’AFF è {chfFull(total)}{cellSum !== total ? <>: la differenza di {num(Math.abs(cellSum - total))} CHF viene dall’arrotondamento di ogni voce al franco</> : null}. File: <a className="underline hover:text-accent" href={source.fileUrl} target="_blank" rel="noreferrer">standardauswertung.csv</a>, stato {date(source.fileDate)}. Il {year} è l’ultimo anno che l’AFF dà come consuntivo per lo Stato (main_extern.csv, stato {date(source.statusDate)}).</>}
            {voce && <> {voce.code.length === 2
              ? (en ? <>{voce.name} is line {voce.code} of task area {voce.group.code}, «{voce.group.name}».</> : <>{voce.name} è la voce {voce.code} del settore {voce.group.code}, «{voce.group.name}».</>)
              : (en ? <>{voce.name} is task area {voce.code}, the sum of its {groups.find((g) => g.code === voce.code)?.cells.length} lines.</> : <>{voce.name} è il settore {voce.code}, somma delle sue {groups.find((g) => g.code === voce.code)?.cells.length} voci.</>)}</>}
            {" "}{en
              ? <>What each line contains follows the functional classification of HRM2, which the FFA applies «but for a few exceptions» (<a className="underline hover:text-accent" href={source.method.url} target="_blank" rel="noreferrer">{source.method.label}</a>).</>
              : <>Che cosa contiene ogni voce segue la classificazione funzionale HRM2, che l’AFF applica «salvo poche eccezioni» (<a className="underline hover:text-accent" href={source.method.url} target="_blank" rel="noreferrer">{source.method.label}</a>).</>}
            {" "}<a className="underline hover:text-accent" href={h(source.register)}>{T("Registro delle fonti", "Register of sources")}</a>.
          </p>
        </section>
      </div>

      <section className="card p-4 sm:p-5 md:p-7 mt-6">
        <div className="overflow-x-auto">
          <table className="w-full max-w-3xl text-[13px] sm:text-sm">
            <caption className="text-left mb-3">
              <span className="block text-xl md:text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)" }}>{T("Tutte le voci", "Every line")}, {year}</span>
              <span className="block text-xs text-muted mt-1">{T("Importi in milioni di franchi. In grassetto i settori, sotto ciascuno le sue voci.", "Amounts in millions of francs. Task areas in bold, each followed by its lines.")}</span>
            </caption>
            <thead className="text-left text-xs text-muted">
              <tr>
                <th scope="col" className="py-2 pr-2 font-medium">{T("Voce", "Line")}</th>
                <th scope="col" className="py-2 pl-2 font-medium text-right whitespace-nowrap">{T("mio CHF", "CHF mn")}</th>
                <th scope="col" className="py-2 pl-2 sm:pl-4 font-medium text-right">{T("Quota", "Share")}</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g.code}>
                  <tr className={`border-t border-border font-semibold ${isOn(g.code) ? "bg-accent-soft" : ""}`}>
                    <th scope="row" className="py-2 pr-2 text-left align-top"><span className="text-faint tabular mr-1.5">{g.code}</span> {g.name}</th>
                    <td className="py-2 pl-2 text-right tabular whitespace-nowrap align-top">{num(g.value / 1e6, 1)}</td>
                    <td className="py-2 pl-2 sm:pl-4 text-right tabular whitespace-nowrap align-top">{share(g.value / total)}</td>
                  </tr>
                  {g.cells.map((c) => (
                    <tr key={c.code} className={isOn(c.code) ? "bg-accent-soft font-semibold" : "text-muted"}>
                      <th scope="row" className={`py-1.5 pr-2 pl-3 sm:pl-5 text-left align-top ${isOn(c.code) ? "font-semibold" : "font-normal"}`}><span className="text-faint tabular mr-1.5">{c.code}</span> {c.name}</th>
                      <td className="py-1.5 pl-2 text-right tabular whitespace-nowrap align-top">{num(c.value / 1e6, 1)}</td>
                      <td className="py-1.5 pl-2 sm:pl-4 text-right tabular whitespace-nowrap align-top">{share(c.value / total)}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-foreground font-semibold">
                <th scope="row" className="py-2 pr-2 text-left">{T("Totale", "Total")}</th>
                <td className="py-2 pl-2 text-right tabular whitespace-nowrap">{num(total / 1e6, 1)}</td>
                <td className="py-2 pl-2 sm:pl-4 text-right tabular whitespace-nowrap">{pct(100, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </>
  );
}
