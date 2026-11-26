import type { Metadata } from "next";
import { haushalte, hauptaggregate, lastR, type Coded } from "@/lib/data";
import { chf, pct } from "@/lib/format";
import { codedName } from "@/lib/labels";
import { getLang } from "@/lib/lang-server";
import { prefix } from "@/lib/lang";
import { NAME_EN, NAME_IT, shareOf, VOCI, type QpData, type QpGroup } from "@/lib/quanto-pesa";
import { SITE } from "@/lib/site";
import { absolute } from "@/lib/url";

/** What each offered item contains. The FFA's financial statistics classify spending by function as HRM2 does «but for a few
 *  exceptions» (FFA, Methoden und Konzepte der Finanzstatistik der Schweiz, 2021, section 4.3, p. 47), and the content of every
 *  function is written in Annex B of «Kontenrahmen und funktionale Gliederung HRM2» (SRS-CSPCP, version 18 of 11.12.2025).
 *  Each line below only restates that annex, with the pages where the functions named stand, and for hospitals the FFA's sector
 *  rules (Methoden, p. 29: cantonal hospitals and homes; p. 31: communal ones, both S11, outside general government).
 *  `{28}` is replaced by the amount of line 28 (research) in the year shown. An item without an entry gets no line. */
const HRM2 = "https://www.srs-cspcp.ch/sites/default/files/pages/srs-cspcp-kontenrahmen-und-funktionale-gliederung-hrm2-v18_2025_12_11-clean.pdf";
const METHODS = "https://www.efv.admin.ch/dam/de/sd-web/ga-UaT4b-h22/fs-methoden-d.pdf";
/** Pages of Annex B (page n of the annex is page n + 65 of the PDF; the link opens the first one). */
const annex = (a: number, b?: number) => {
  const pp = b ? `pp. ${a}–${b}` : `p. ${a}`;
  return { it: `HRM2, allegato B, ${pp}`, en: `HRM2, Annex B, ${pp}`, url: `${HRM2}#page=${a + 65}` };
};
const methods = (...ps: number[]) => ({ it: `AFF, metodi, ${ps.length > 1 ? "pp." : "p."} ${ps.join(", ")}`, en: `FFA, methods, ${ps.length > 1 ? "pp." : "p."} ${ps.join(", ")}`, url: `${METHODS}#page=${ps[0]}` });
const SCOPE: Record<string, { it: string; en: string; src: { it: string; en: string; url: string }[] }> = {
  // 031 (embassies, contributions to international organisations; Umfasst nicht 163 Militärhilfe), 032, 033, 034 on p. 4; 035 Osthilfe on p. 5
  "03": {
    it: "Relazioni con l’estero: comprende ambasciate e consolati, contributi a organizzazioni internazionali, aiuto umanitario, cooperazione allo sviluppo e aiuto ai Paesi dell’Est; non l’aiuto militare all’estero (difesa).",
    en: "Foreign relations: includes embassies and consulates, contributions to international organisations, humanitarian aid, development cooperation and aid to the transition countries of the East; not military aid abroad (defence).",
    src: [annex(4, 5)],
  },
  // 111, 112, 113 and 12 on p. 5; courts 12, prisons 13 and fire service 15 are lines of their own
  "11": {
    it: "Sicurezza pubblica: comprende polizia, controllo del traffico stradale e uffici cantonali della circolazione e della navigazione; tribunali, carceri e pompieri sono voci a parte.",
    en: "Public security: includes police, road traffic control and the cantonal road traffic and navigation offices; courts, prisons and fire services are separate lines.",
    src: [annex(5)],
  },
  // 161, 162 (insb. Zivilschutz; Umfasst nicht Feuerwehr 150) on p. 6; 163 on p. 7
  "16": {
    it: "Difesa: comprende difesa militare, protezione civile, aiuto militare all’estero e contributi a missioni internazionali di pace; i pompieri sono una voce a parte.",
    en: "Defence: includes military defence, civil protection, military aid abroad and contributions to international peacekeeping; fire services are a separate line.",
    src: [annex(6, 7)],
  },
  // 21 (elf Jahre) and 211 on p. 7; 212, 213, 214, 217 Schulliegenschaften, 218 (Umfasst nicht Kinderhorte und -krippen 545) on p. 8
  "21": {
    it: "Scuola dell’obbligo: comprende gli undici anni dalla scuola dell’infanzia al secondario I, gli edifici scolastici, le scuole di musica di questo livello, la custodia diurna e la mensa scolastica; non le scuole speciali né gli asili nido.",
    en: "Compulsory school: includes the eleven years from kindergarten to lower secondary, school buildings, music schools at that level, day care and school meals; not special schools nor crèches.",
    src: [annex(7, 8)],
  },
  // 271, 272, 273 and 28 Forschung on p. 11 (each of 271–273: Umfasst nicht Erwachsenenbildung, Weiterbildung 299, p. 12)
  "27": {
    it: "Università: comprende università cantonali, politecnici federali, alte scuole pedagogiche e scuole universitarie professionali, con le borse di studio per i loro studenti; non la formazione degli adulti e continua. La ricerca è una voce a parte (Ricerca, {28}).",
    en: "Universities: includes cantonal universities, the federal institutes of technology, universities of teacher education and of applied sciences, with grants for their students; not adult and continuing education. Research is a separate line (Research, {28}).",
    src: [annex(11, 12)],
  },
  // 311, 312 (Umfasst nicht Festlichkeiten für Tourismuswerbung 840) on p. 12; 321, 322 (Umfasst nicht Musikschulen 214), 329, 331 Film, 332 Massenmedien on p. 13; 341, 342, 350 on p. 14
  "3": {
    it: "Cultura, sport e ricreazione, religione: comprende musei, monumenti, biblioteche, musica e teatro, cinema e mass media, sport, tempo libero e chiese; non le scuole di musica né le feste soprattutto turistiche.",
    en: "Culture, sport and leisure, church: includes museums, monuments, libraries, music and theatre, film and mass media, sport, leisure and churches; not music schools nor festivities held mainly for tourism.",
    src: [annex(12, 14)],
  },
  // Methoden p. 29 (cantonal Spitäler, Heime: S11) and p. 31 (communal Spitäler/Kliniken, Alters- und Pflegeheime: S11). In the FFA file by
  // nature and function (fir_art_funk.csv, staat, 2024) function 41 is 14.97 bn: 3634 + 3635 contributions 13.31 bn, 3614 compensation
  // 0.87 bn, investment (own, loans, participations, investment contributions) 0.78 bn; the Confederation and social insurance spend nothing on it.
  // 411 on p. 14; 412, 413 and 421 ambulante Krankenpflege (line 42) on p. 15.
  "41": {
    it: "Ospedali e case di cura: la voce conta quanto Cantoni e Comuni versano a ospedali e case di cura (contributi, indennità, investimenti), non quanto costano gli ospedali; per l’AFF ospedali e case di cura sono fuori dallo Stato. Comprende le cliniche psichiatriche, non le cure a domicilio.",
    en: "Hospitals and nursing homes: the line counts what cantons and municipalities pay to hospitals and care homes (contributions, compensation, investment), not what hospitals cost; the FFA places hospitals and care homes outside general government. It includes psychiatric clinics, not home care.",
    src: [methods(29, 31), annex(14, 15)],
  },
  // 531 (AHVG; Beiträge der öffentlichen Hand; Ausgleichskassen), 532, 533, 534 (Umfasst nicht Pflegeheime 412), 535: all on p. 17
  "53": {
    it: "Vecchiaia e superstiti: comprende l’AVS (casse di compensazione, contributi pubblici), le prestazioni complementari all’AVS, prestazioni per pensionati e alloggi per anziani senza cure; non le case con cure (ospedali e case di cura).",
    en: "Old age and survivors: includes the AHV (compensation funds, public contributions), supplementary benefits to the AHV, benefits for pensioners and housing for the elderly without care; not homes with care (hospitals and nursing homes).",
    src: [annex(17)],
  },
  // 571 (Umfasst nicht EL IV 522, EL AHV 532), 572, 573, 579: all on p. 18
  "57": {
    it: "Aiuto sociale e asilo: comprende l’aiuto sociale secondo le leggi cantonali, gli aiuti cantonali in aggiunta ad AVS e AI, l’asilo e i rifugiati; non le prestazioni complementari ad AVS e AI.",
    en: "Social assistance and asylum: includes social assistance under cantonal law, cantonal allowances on top of the AHV and IV, asylum and refugees; not the supplementary benefits to the AHV and IV.",
    src: [annex(18)],
  },
  // 611, 612, 613 (each: Umfasst nicht Verkehrssicherheit 112, Strassenverkehrsamt 113), 615 Gemeindestrassen (with parking), 619: all on p. 19
  "61": {
    it: "Circolazione stradale: comprende costruzione, manutenzione ed esercizio di strade nazionali, cantonali e comunali, con i posteggi; non il controllo del traffico né gli uffici della circolazione (sicurezza pubblica).",
    en: "Road traffic: includes building, maintaining and running national, cantonal and municipal roads, car parks included; not traffic control nor road traffic offices (public security).",
    src: [annex(19)],
  },
  // 621 «Bahninfrastruktur Öffentliche Verkehrsinfrastruktur» (Bau, Unterhalt, Beschaffungen), 622, 629: all on p. 20
  "62": {
    it: "Trasporti pubblici: comprende l’infrastruttura, anche ferroviaria (costruzione, manutenzione, acquisti), e i contributi d’esercizio di Confederazione e Cantoni alle FFS e alle imprese concessionarie del traffico regionale.",
    en: "Public transport: includes infrastructure, rail included (construction, maintenance, purchases), and operating contributions of the Confederation and cantons to SBB and licensed companies in regional transport.",
    src: [annex(20)],
  },
  // 811, 812 on p. 22; 815, 816 Direktzahlungen, 817 (Umfasst nicht Familienzulagen 541), 818, 82 Forstwirtschaft, 83 on p. 23
  "81": {
    it: "Agricoltura: comprende pagamenti diretti, misure su prezzi e redditi agricoli, promozione delle vendite, miglioramenti strutturali, allevamento e colture; non selvicoltura, caccia e pesca né gli assegni familiari agricoli.",
    en: "Agriculture: includes direct payments, measures on farm prices and incomes, sales promotion, structural improvements, livestock and crops; not forestry, hunting and fishing nor family allowances in farming.",
    src: [annex(22, 23)],
  },
};

/** All spending of general government by function in the last year of actuals, from one table (fs-haushalte, `staat`). */
export function quantoPesaData(): QpData {
  const en = getLang() === "en";
  const fs = haushalte();
  const staat = fs.data.haushalte["staat"];
  const year = String(lastR(staat));
  if (staat.year_status[year] !== "R") throw new Error(`[quanto-pesa] ${year} is not actuals for staat`);
  const total = staat.total_ausgaben[year];
  const name = (c: Coded) => (en ? NAME_EN[c.code] ?? codedName(c, "en") : NAME_IT[c.code] ?? codedName(c, "it")).trim();
  const lines = Object.values(staat.funk2);
  const groups: QpGroup[] = Object.values(staat.funk1).map((g) => ({
    code: g.code, name: name(g), value: g.values[year] ?? 0,
    cells: lines.filter((c) => c.code.length === 2 && c.code.startsWith(g.code)).map((c) => ({ code: c.code, name: name(c), value: c.values[year] ?? 0 }))
      .filter((c) => c.value > 0).sort((a, b) => b.value - a.value),
  })).filter((g) => g.value > 0).sort((a, b) => b.value - a.value);

  // The cells are the two-digit lines of the file, each rounded to the franc by the pipeline: their sum may differ from the total
  // by rounding only (at most half a franc per line). Anything more means a line is missing or counted twice.
  const cells = groups.flatMap((g) => g.cells);
  const cellSum = cells.reduce((s, c) => s + c.value, 0);
  if (Math.abs(cellSum - total) > cells.length / 2) throw new Error(`[quanto-pesa] cells add up to ${cellSum}, total is ${total}`);
  // The same check for each task area: its lines add up to the figure the file gives for the area.
  for (const g of groups) {
    const s = g.cells.reduce((a, c) => a + c.value, 0);
    if (Math.abs(s - g.value) > g.cells.length / 2) throw new Error(`[quanto-pesa] lines of area ${g.code} add up to ${s}, the area is ${g.value}`);
  }

  const voci = VOCI.map((v) => {
    const g = groups.find((x) => x.code === v.code[0]);
    const own = v.code.length === 1 ? g : g?.cells.find((c) => c.code === v.code);
    if (!g || !own?.value) throw new Error(`[quanto-pesa] ${v.code} (${v.slug}) is not a line of the table in ${year}`);
    const s = SCOPE[v.code];
    return {
      slug: v.slug, code: v.code, name: own.name, question: en ? v.en : v.it, value: own.value, group: { code: g.code, name: g.name },
      scope: s ? { text: (en ? s.en : s.it).replace("{28}", chf(staat.funk2["28"]?.values[year])), sources: s.src.map((x) => ({ label: en ? x.en : x.it, url: x.url })) } : null,
    };
  });

  return {
    year, total, cellSum, groups, voci,
    source: {
      fileUrl: fs.meta.publisher_url, fileDate: fs.meta.published_at, statusDate: hauptaggregate().meta.published_at, register: "/fonti/#fs-haushalte",
      method: { label: en ? "FFA, Methoden und Konzepte der Finanzstatistik, p. 47" : "AFF, Methoden und Konzepte der Finanzstatistik, p. 47", url: `${METHODS}#page=47` },
    },
  };
}

/** Title, description and social card of the chooser (slug null) or of one item: the card names the item and the figure. */
export function quantoPesaMetadata(slug: string | null): Metadata {
  const lang = getLang();
  const en = lang === "en";
  const d = quantoPesaData();
  const v = slug ? d.voci.find((x) => x.slug === slug) : null;
  if (slug && !v) throw new Error(`[quanto-pesa] no item ${slug}`);
  const whole = en ? "of public spending by the Confederation, cantons, municipalities and social insurance" : "della spesa pubblica di Confederazione, Cantoni, Comuni e assicurazioni sociali";
  const src = en ? "Source: Federal Finance Administration, financial statistics." : "Fonte: Amministrazione federale delle finanze, statistica finanziaria.";
  const title = v ? v.question : en ? "How much does it weigh? Every item of public spending" : "Quanto pesa? Ogni voce della spesa pubblica";
  const description = v
    ? `${v.name}: ${chf(v.value)}, ${shareOf(pct, v.value / d.total)} ${whole} ${en ? "in" : "nel"} ${d.year}. ${src}`
    : en
      ? `Pick an item and see what it weighs in the ${chf(d.total, { digits: 1 })} of public spending by the Confederation, cantons, municipalities and social insurance in ${d.year}. ${src}`
      : `Scegli una voce e vedi quanto pesa sui ${chf(d.total, { digits: 1 })} di spesa pubblica di Confederazione, Cantoni, Comuni e assicurazioni sociali nel ${d.year}. ${src}`;
  const path = (l: "it" | "en") => prefix(l, v ? `/quanto-pesa/${v.slug}/` : "/quanto-pesa/");
  const url = absolute(path(lang));
  return {
    title, description,
    alternates: { canonical: url, languages: { it: absolute(path("it")), en: absolute(path("en")) } },
    openGraph: { type: "website", url, title, description, siteName: en ? SITE.nameEn : SITE.name, locale: en ? "en_GB" : "it_CH" },
    twitter: { card: "summary", title, description },
  };
}
