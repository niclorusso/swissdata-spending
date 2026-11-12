import type { Metadata } from "next";
import Link from "@/components/L";
import { loadLedger, type Meta } from "@/lib/data";
import { date, dateTime } from "@/lib/format";
import { Card, Page } from "@/components/ui";
import { getLang, T } from "@/lib/lang-server";

export const metadata: Metadata = { title: "Registro delle fonti" };
const LEVELS: [string, string, string][] = [["gesamt", "Tutti i livelli", "All levels"], ["bund", "Confederazione", "Confederation"], ["kantone", "Cantoni", "Cantons"], ["gemeinden", "Comuni", "Municipalities"], ["sozialversicherungen", "Assicurazioni sociali", "Social insurance"]];

/** English text of each entry. {0}, {1}… are the numbers of the Italian text, in order, so counts and years follow the data. */
type En = { title: string; coverage: string; notes?: string };
const STATUS_NOTE = "up to {0}: actuals; {1}: budget; from {2}: financial plan";
const PROC: En = { title: "Confederation – contracts ≥ 50,000 CHF, {2} contracts", coverage: "{0} contracts of the central Federal Administration, year {1}", notes: "Art. 27 Public Procurement Ordinance: publication of contracts ≥ 50,000 CHF; the following file can contain later publications (sheet 'Nachpublikationen', not included)." };
const EN: Record<string, En> = {
  "bfs-bevoelkerung-gemeinden": { title: "Permanent resident population on 31 December by municipality", coverage: "{0} municipalities (current municipal boundaries), {1}", notes: "Same STAT-TAB database as the cantons; key = FSO number of the municipality." },
  "bfs-bevoelkerung-kantone": { title: "Permanent resident population on 31 December, Switzerland and cantons", coverage: "Switzerland + 26 cantons, STATPOP/ESPOP, used for per-inhabitant values", notes: "STAT-TAB database; component «Population on 31 December», all nationalities and sexes." },
  "bund-ausgaben-art": { title: "Confederation – spending by type", coverage: "Current and investment spending by economic type (staff, goods and services, transfers…), {0}", notes: STATUS_NOTE },
  "bund-ausgaben-aufgabengebiet": { title: "Confederation – spending by task area", coverage: "Spending of the Confederation in {0} task areas and sub-areas, {1}", notes: STATUS_NOTE },
  "bund-beschaffungen": { title: "Confederation – contracts ≥ 50,000 CHF (summary)", coverage: "{0} contracts, {1} suppliers, {2} bn CHF in {3} years", notes: "The dataset 'Beschaffungen 2024' on opendata.swiss contains the 2023 contracts (the year in the title is the year of publication)." },
  "bund-beschaffungen-2021": PROC, "bund-beschaffungen-2022": PROC, "bund-beschaffungen-2023": PROC, "bund-beschaffungen-2024": PROC,
  "bund-einnahmen": { title: "Confederation – revenue", coverage: "Revenue of the Confederation by type (direct federal tax, VAT, withholding tax…), {0}", notes: STATUS_NOTE },
  "bund-kennzahlen": { title: "Confederation – indicators and debt brake", coverage: "Spending ratio, tax ratio, gross/net debt, financing balance, nominal GDP, {0}", notes: STATUS_NOTE },
  "bund-verwaltungseinheiten": { title: "Confederation – staff, consultancy and IT by administrative unit", coverage: "{0} administrative units in {1} departments + authorities and courts: staff costs, external consultancy, IT and full-time positions, {2}", notes: STATUS_NOTE },
  "fs-gemeinden-5000": { title: "Financial statistics – municipalities with at least 5,000 inhabitants, accounts per municipality", coverage: "{2} municipalities, current spending by function, revenue, investment, {3}", notes: "Income statement (current spending and revenue), not the financing account: totals cannot be added to the «expenditure» of the financial statistics. The last year can be incomplete for some municipalities." },
  "fs-hauptaggregate": { title: "Financial statistics – main aggregates, debt and data status by level", coverage: "Revenue, expenditure and balance; Maastricht debt, net debt and ratios to GDP for general government, Confederation, cantons, municipalities and social insurance; for each year the FFA's indication of whether the figure is actuals, partial or forecast", notes: "The status of each year (actuals, partial data, forecast) is the one declared by the FFA in the «source» column of the file." },
  "fs-haushalte": { title: "Financial statistics – Confederation, cantons, municipalities and social insurance", coverage: "{0} bodies/aggregates: general government, Confederation, 26 cantons, municipalities by canton, canton + municipalities, 6 branches of social insurance; spending by function (2 levels) and type, revenue; {4}", notes: "Swiss financial statistics, harmonised data not directly comparable with the accounts published by the single cantons. Municipal surveys are partly estimated from a sample (FFA FAQ)." },
  "gemeinden-ti": { title: "Ticino – accounts of all municipalities, {0}", coverage: "{0} municipalities of Ticino in {1}, brought to today's {2}: operating expenses, result, net investment, net public debt, tax multiplier, tax resources", notes: "The municipalities the source marks with [*] include the water supply in their accounts, which the others keep separately: this affects the comparison of spending. The municipality is identified by name and matched to its FSO number. Municipalities merged after 2024 (Lema, Giornico with Bodio, Quinto with Prato Leventina) are added up in today's municipality; for them tax resources are not calculated and the multiplier is given only if it was the same in all merged municipalities." },
  "gemeinden-zh": { title: "Zurich – financial indicators of all municipalities, {0}", coverage: "{0} municipalities of Zurich: net cost of services by function, net assets/debt, net investment, result, tax multiplier, tax strength", notes: "Basis «consolidated municipality»: the accounts of school municipalities are assigned pro rata to the political municipalities. One CSV file per indicator (ID 378, 420–431, 828) plus the file of tax multipliers." },
  "geo-grenzen": { title: "Generalised boundaries of cantons, municipalities and lakes ({0})", coverage: "{0} cantons, {1} municipalities, {2} lakes", notes: "Boundaries generalised for display, not for measurement." },
};
const nums = (s?: string | null) => (s ?? "").match(/\d+(?:[.,]\d+)?(?:–\d+)?/g) ?? [];
const fill = (tpl: string, src?: string | null) => { const n = nums(src); return tpl.replace(/\{(\d)\}/g, (_, i) => n[Number(i)] ?? ""); };
const FREQ: [RegExp, string][] = [[/2 volte l'anno/, "twice a year"], [/annuale/, "yearly"], [/marzo: consuntivo; agosto: preventivo e piano finanziario/, "March: actuals; August: budget and financial plan"], [/febbraio\/marzo e agosto\/settembre/, "February/March and August/September"], [/marzo, agosto/, "March, August"], [/settembre dell'anno successivo/, "September of the following year"], [/agosto/, "August"]];
const PERIOD: [RegExp, string][] = [[/Rechnung/g, "actuals"], [/Voranschlag/g, "budget"], [/Finanzplan/g, "financial plan"], [/consuntivi: Confederazione/, "actuals: Confederation"], [/Cantoni/, "cantons"], [/Comuni/, "municipalities"], [/assicurazioni sociali/, "social insurance"], [/anni successivi = dati parziali o previsioni AFF/, "later years = partial data or FFA forecasts"], [/Steuerfuss fino al/, "tax multiplier up to"], [/stato dei Comuni/, "municipal boundaries of"]];
const LICENSE: [RegExp, string][] = [[/opendata\.swiss: Freie Nutzung\. Quellenangabe ist Pflicht.*/, "Free use, the source must be cited (opendata.swiss)"], [/opendata\.swiss: Freie Nutzung \(terms_open\)/, "Free use (opendata.swiss)"], [/nessuna licenza indicata dalla fonte; citazione della fonte/, "no licence stated by the source; source cited"], [/Geodati: fonte/, "Geodata: source"], [/codice swiss-maps/, "swiss-maps code"]];
const map = (rules: [RegExp, string][], s?: string | null) => rules.reduce((t, [re, to]) => t.replace(re, to), s ?? "");

/** The pipeline keeps the publishers' own (German) wording; the page shows it in Italian. */
const IT: [RegExp, string][] = [
  [/opendata\.swiss: Freie Nutzung\. Quellenangabe ist Pflicht( \(terms_by\))?\.?( \(OPEN-BY-ASK per alcune tabelle\))?/g, "Uso libero, con obbligo di citare la fonte (opendata.swiss)"],
  [/opendata\.swiss: Freie Nutzung \(terms_open\)/g, "Uso libero (opendata.swiss)"],
  [/Rechnung \(consuntivo\)/g, "consuntivo"], [/Voranschlag \(preventivo\)/g, "preventivo"], [/Finanzplan \(piano finanziario\)/g, "piano finanziario"],
  [/Rechnung/g, "consuntivo"], [/Voranschlag/g, "preventivo"], [/Finanzplan/g, "piano finanziario"],
  [/anno <= /g, "fino al "], [/>= /g, "dal "], [/«Steuerfuss»|Steuerfüsse|Steuerfuss/g, "moltiplicatore d'imposta"],
  [/«Konsolidierte Gemeinde»/g, "«Comune consolidato»"], [/\(Aufwand\)/g, ""], [/Conto economico HRM2 \(Aufwand\/Ertrag\)/g, "Conto economico (spese e ricavi correnti)"],
  [/modello FS \(statistica finanziaria svizzera\)/gi, "statistica finanziaria svizzera"], [/ \(modello FS\)/g, ""], [/ \(modello GFS\)/g, ""], [/cubo STAT-TAB/g, "banca dati STAT-TAB"],
  [/«Rechnung \/ Vorhandene Daten \/ Prognosen»|\(Rechnung \/ Vorhandene Daten \/ Prognosen\)/g, "(consuntivo, dati parziali, previsione)"],
];
const PUB: Record<string, string> = {
  "Statistisches Amt des Kantons Zürich": "Ufficio di statistica del Canton Zurigo",
  "Bundesamt für Statistik (BFS)": "Ufficio federale di statistica (UST)",
};
const tr = (s?: string | null) => IT.reduce((t, [re, to]) => t.replace(re, to), s ?? "").replace(/\b(\d{2,3})(\d{3})(?= (contratti|fornitori|Comuni))/g, "$1’$2");
const PUB_EN: [string, string][] = [["EFV", "Federal Finance Administration (FFA)"], ["BFS", "Federal Statistical Office (FSO)"], ["BKB", "Federal Procurement Conference (BKB)"], ["Sezione degli enti locali", "Canton Ticino, Local Authorities Section (SEL)"], ["Statistisches Amt des Kantons Zürich", "Statistical Office of the Canton of Zurich"], ["GEOSTAT", "Federal Statistical Office (FSO), GEOSTAT / swisstopo"]];
const publisherEn = (p: string) => PUB_EN.find(([k]) => p.includes(k))?.[1] ?? p;
const publisher = (p: string) => { const parts = p.split(" / "); const it = (parts.length > 1 ? parts[parts.length - 1] : p).replace(/, via .*$/, ""); return PUB[it] ?? PUB[parts[0]] ?? it; };

function Row({ m }: { m: Meta }) {
  const en = getLang() === "en";
  const e = en ? EN[m.id] : undefined;
  const title = e ? fill(e.title, m.title) : tr(m.title);
  const coverage = e ? fill(e.coverage, m.coverage) : tr(m.coverage);
  const notes = e ? (e.notes ? fill(e.notes, m.notes) : "") : m.notes ? tr(m.notes) : "";
  return (
    <li id={m.id} className="py-4 border-t border-border scroll-mt-6">
      <div className="grid md:grid-cols-5 gap-x-8 gap-y-2">
        <div className="md:col-span-3">
          <div className="font-semibold">{title}</div>
          <p className="text-sm text-muted mt-0.5">{coverage}</p>
          {notes && (
            <details className="mt-1.5 text-sm text-muted"><summary className="cursor-pointer text-foreground/80">{T("Note", "Notes")}</summary><p className="mt-1">{notes}</p></details>
          )}
        </div>
        <dl className="md:col-span-2 text-sm grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-0.5 content-start">
          <dt className="text-muted">{T("Chi pubblica", "Publisher")}</dt><dd><a className="link" href={m.publisher_url}>{en ? publisherEn(m.publisher) : publisher(m.publisher)}</a></dd>
          <dt className="text-muted">{T("Periodo", "Period")}</dt><dd>{en ? map(PERIOD, m.data_date) : tr(m.data_date)}</dd>
          {m.published_at && <><dt className="text-muted">{T("Pubblicato", "Published")}</dt><dd>{date(m.published_at)}</dd></>}
          <dt className="text-muted">{T("Scaricato", "Downloaded")}</dt><dd>{date(m.retrieved_at)}</dd>
          <dt className="text-muted">{T("Verificato", "Checked")}</dt><dd title={dateTime(m.checked_at)}>{date(m.checked_at)}</dd>
          <dt className="text-muted">{T("Aggiornamento", "Updated")}</dt><dd>{en ? map(FREQ, m.frequency) : m.frequency}</dd>
          <dt className="text-muted">{T("Licenza", "Licence")}</dt><dd>{en ? map(LICENSE, m.license) : tr(m.license)}</dd>
          <dt className="text-muted">File</dt><dd><a className="link" href={m.source_url}>{T("scarica l'originale", "download the original")}</a> · <a className="link" href={m.landing_url}>{T("pagina della fonte", "source page")}</a></dd>
          {m.sha256 && <><dt className="text-muted">{T("Impronta", "Fingerprint")}</dt><dd className="font-mono text-xs text-faint break-all" title={T("SHA-256 del file scaricato", "SHA-256 of the downloaded file")}>{m.sha256.slice(0, 16)}…</dd></>}
        </dl>
      </div>
    </li>
  );
}

export default function Fonti() {
  const en = getLang() === "en";
  const ledger = Object.values(loadLedger());
  return (
    <Page kicker={T("Metodo", "Method")} back={{ href: "/metodo/", label: T("Come leggere i numeri", "How to read the figures") }} title={T("Registro delle fonti", "Register of sources")} lead={en
      ? <p>Every figure on the site comes from an official file, listed here with who publishes it, the period it covers, when it was downloaded and when it was last checked. The fingerprint (SHA-256) lets you verify that the file is the same. The pages of the federal sources are in German.</p>
      : <p>Ogni dato del sito viene da un file ufficiale, elencato qui con chi lo pubblica, il periodo che copre, quando è stato scaricato e quando è stato controllato l&apos;ultima volta. L&apos;impronta (SHA-256) permette di verificare che il file sia lo stesso. Le pagine delle fonti federali sono in tedesco.</p>}>
      {LEVELS.map(([lvl, labelIt, labelEn]) => {
        const label = en ? labelEn : labelIt;
        const rows = ledger.filter((m) => m.level === lvl).sort((a, b) => a.title.localeCompare(b.title, "it"));
        if (!rows.length) return null;
        return (
          <Card key={lvl} title={label}>
            <ul className="-mt-4">{rows.map((m) => <Row key={m.id} m={m} />)}</ul>
          </Card>
        );
      })}
      <Card title={T("Fonti che mancano", "Missing sources")}>
        <ul className="text-sm list-disc pl-5 space-y-1.5 text-muted">
          <li>{T("Sussidi federali per beneficiario: l'AFF li mostra in una dashboard, senza file scaricabile.", "Federal subsidies by recipient: the FFA shows them in a dashboard, with no downloadable file.")}</li>
          <li>{T("Appalti di Cantoni e Comuni: simap.ch dà accesso ai dati solo su richiesta.", "Contracts of cantons and municipalities: simap.ch gives access to the data only on request.")}</li>
          <li>{T("Aziende partecipate della Confederazione e dei Cantoni: non esiste un elenco strutturato.", "Companies owned by the Confederation and the cantons: there is no structured list.")}</li>
          <li>{T("Conti dei singoli Comuni negli altri Cantoni: alcuni portali cantonali li pubblicano (Turgovia, Lucerna), non sono ancora integrati.", "Accounts of single municipalities in the other cantons: some cantonal portals publish them (Thurgau, Lucerne), they are not integrated yet.")}</li>
        </ul>
      </Card>
      <p className="text-sm text-muted"><Link className="link" href="/metodo/">{T("Come leggere i numeri", "How to read the figures")}</Link></p>
    </Page>
  );
}
