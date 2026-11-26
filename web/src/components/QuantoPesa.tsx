"use client";
import { Fragment, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useL } from "@/lib/useLang";
import { WeightTreemap } from "@/components/charts/WeightTreemap";
import type { QpData } from "@/lib/quanto-pesa";

/** The item named in the address (?voce=difesa), so one answer can be shared as a link. */
export function QuantoPesaFromUrl({ data, titleSuffix }: { data: QpData; titleSuffix: string }) {
  return <QuantoPesa data={data} slug={useSearchParams().get("voce")} titleSuffix={titleSuffix} />;
}

export function QuantoPesa({ data, slug, titleSuffix }: { data: QpData; slug: string | null; titleSuffix: string }) {
  const { en, T, chf, num, pct, date, link, h } = useL();
  const router = useRouter();
  const { year, total, groups, voci, source } = data;
  const voce = voci.find((v) => v.slug === slug) ?? null;
  /** One decimal; below 0.1 % two, so a small line never reads «0.0 %». */
  const share = (fraction: number) => {
    const p = fraction * 100;
    return p >= 0.1 ? pct(p, 1) : p >= 0.01 ? pct(p, 2) : `< ${pct(0.01, 2)}`;
  };
  const whole = T("della spesa pubblica di Confederazione, Cantoni, Comuni e assicurazioni sociali", "of public spending by the Confederation, cantons, municipalities and social insurance");
  const title = voce ? voce.question : T("Quanto pesa?", "How much does it weigh?");
  // The tab title names the item. The page metadata writes its own title once more after start-up, so it is set again whenever it changes.
  useEffect(() => {
    const want = `${title} · ${titleSuffix}`;
    const apply = () => { if (document.title !== want) document.title = want; };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => mo.disconnect();
  }, [title, titleSuffix]);
  const isOn = (code: string) => !!voce && (code === voce.code || (voce.code.length === 1 && code.startsWith(voce.code)));
  const href = (s: string) => link(`/quanto-pesa/?voce=${s}`);

  return (
    <>
      <div className="grid lg:grid-cols-12 gap-x-10 gap-y-6 items-start">
        <div className="lg:col-span-4 lg:sticky lg:top-20">
          <header>
            <div className="kicker">{T("Quanto pesa?", "How much does it weigh?")} · {T("consuntivo", "actuals")} {year}</div>
            <h1 className="mt-3 sm:mt-4 text-[1.75rem] sm:text-4xl md:text-5xl lg:text-[2.4rem] leading-[1.08] max-w-4xl text-balance">{title}</h1>
            <p className="mt-3 sm:mt-4 text-[1.05rem] sm:text-lg md:text-xl lg:text-lg max-w-3xl leading-relaxed">
              {voce
                ? <><strong>{voce.name}</strong>: <strong className="tabular whitespace-nowrap">{chf(voce.value)}</strong>, <strong className="tabular whitespace-nowrap">{share(voce.value / total)}</strong> {whole} {T("nel", "in")} {year}.</>
                : <span className="text-muted">{en
                  ? <>Pick an item: the map shows what it weighs in the {chf(total, { digits: 1 })} of public spending by the Confederation, cantons, municipalities and social insurance in {year}.</>
                  : <>Scegli una voce: la mappa mostra quanto pesa sui {chf(total, { digits: 1 })} di spesa pubblica di Confederazione, Cantoni, Comuni e assicurazioni sociali nel {year}.</>}</span>}
            </p>
            <p className="mt-3 text-xs text-faint leading-relaxed max-w-3xl">
              {T("Fonte", "Source")}: {T("Amministrazione federale delle finanze, statistica finanziaria", "Federal Finance Administration, financial statistics")}, {T("Standardauswertungen FS/GFS", "Standardauswertungen FS/GFS (standard evaluations)")}, <a className="underline hover:text-accent" href={source.fileUrl} target="_blank" rel="noreferrer">standardauswertung.csv</a> · {year}, {T("stato", "as of")} {date(source.fileDate)}
            </p>
          </header>

          {/* Phones: one native list, so the map stays near the top. Wider screens: every item in sight. */}
          <label className="mt-4 flex items-center gap-3 sm:hidden">
            <span className="text-sm font-semibold shrink-0">{T("Voce", "Item")}</span>
            <select className="field min-w-0 flex-1 px-3 py-2 text-base" value={voce?.slug ?? ""} onChange={(e) => router.replace(href(e.target.value), { scroll: false })}>
              {!voce && <option value="" disabled>–</option>}
              {voci.map((v) => <option key={v.slug} value={v.slug}>{v.name}</option>)}
            </select>
          </label>
          <nav className="mt-6 hidden sm:flex flex-wrap gap-2" aria-label={T("Scegli una voce", "Pick an item")}>
            {voci.map((v) => (
              <Link key={v.slug} href={href(v.slug)} scroll={false} replace className="chip !py-1 !px-3" aria-current={v.slug === voce?.slug ? "page" : undefined}>{v.name}</Link>
            ))}
          </nav>
        </div>

        <section className="lg:col-span-8 card p-3 sm:p-5 md:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3 text-sm">
            <span className="font-semibold">{T("Spesa pubblica", "Public spending")} {year}</span>
            <span className="text-muted tabular">{chf(total, { digits: 1 })} · 100 %</span>
          </div>
          <WeightTreemap groups={groups} total={total}
            highlight={voce ? { code: voce.code, name: voce.name, value: voce.value, line2: `${chf(voce.value)} · ${share(voce.value / total)}` } : null}
            ariaLabel={voce ? `${T("Mappa della spesa pubblica", "Map of public spending")} ${year}: ${voce.name}, ${share(voce.value / total)}` : `${T("Mappa della spesa pubblica", "Map of public spending")} ${year}`}
            fmt={{ cell: (v, s) => `${chf(v, { unit: false })} · ${share(s)}`, aria: (n, v, s) => `${n}: ${chf(v)}, ${share(s)}` }} />
          <p className="mt-3 text-xs text-faint leading-relaxed">{T(
            "Area = importo. Ogni riquadro è una voce, le linee bianche più spesse separano i settori. Passa sopra o tocca un riquadro per il nome; tutte le voci sono nella tabella qui sotto.",
            "Area = amount. Each box is a line, the thicker white lines separate the task areas. Hover over or tap a box for its name; every line is in the table below.")}</p>
          <p className="mt-2 text-xs text-faint leading-relaxed">
            {en
              ? <>Method: spending by function of general government (Confederation, cantons, municipalities and social insurance) in the financial statistics of the FFA, FS model. The total is consolidated by the FFA: money one body pays to another is counted once. Each box is a two-digit line of the file; task areas (one digit) and shares are added up and divided by the site. {year} is the last year the FFA gives as actuals for general government (main_extern.csv, as of {date(source.statusDate)}).</>
              : <>Metodo: uscite per funzione dello Stato nel suo insieme (Confederazione, Cantoni, Comuni e assicurazioni sociali) nella statistica finanziaria dell&apos;AFF, modello FS. Il totale è consolidato dall&apos;AFF: i soldi che un ente versa a un altro sono contati una volta sola. Ogni riquadro è una voce a due cifre del file; i settori (una cifra) e le quote sono somme e divisioni fatte dal sito. Il {year} è l&apos;ultimo anno che l&apos;AFF dà come consuntivo per lo Stato (main_extern.csv, stato {date(source.statusDate)}).</>}
            {voce && <> {voce.code.length === 2
              ? (en ? <>{voce.name} is line {voce.code} of task area {voce.group.code}, «{voce.group.name}».</> : <>{voce.name} è la voce {voce.code} del settore {voce.group.code}, «{voce.group.name}».</>)
              : (en ? <>{voce.name} is task area {voce.code}, the sum of its {groups.find((g) => g.code === voce.code)?.cells.length} lines.</> : <>{voce.name} è il settore {voce.code}, somma delle sue {groups.find((g) => g.code === voce.code)?.cells.length} voci.</>)}</>}
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
                <td className="py-2 pl-2 sm:pl-4 text-right tabular whitespace-nowrap">100 %</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </>
  );
}
