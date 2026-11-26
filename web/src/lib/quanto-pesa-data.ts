import type { Metadata } from "next";
import { haushalte, hauptaggregate, lastR, type Coded } from "@/lib/data";
import { chf, pct } from "@/lib/format";
import { codedName } from "@/lib/labels";
import { getLang } from "@/lib/lang-server";
import { prefix } from "@/lib/lang";
import { NAME_IT, shareOf, VOCI, type QpData, type QpGroup } from "@/lib/quanto-pesa";
import { SITE } from "@/lib/site";
import { absolute } from "@/lib/url";

/** What each offered item contains. The FFA's financial statistics classify spending by function as HRM2 does «but for a few
 *  exceptions» (FFA, Methoden und Konzepte der Finanzstatistik der Schweiz, 2021, section 4.3, p. 47), and the content of every
 *  function is written in Annex B of «Kontenrahmen und funktionale Gliederung HRM2» (SRS-CSPCP, version 18 of 11.12.2025).
 *  Each line below only restates that annex (and, for hospitals, the FFA's sector rule); the three-digit functions named are those
 *  the FFA lists under the line in its nomenclature (web_arten_funk_dfie.xlsx, sheet fs_funk). An item without an entry gets no line. */
const HRM2 = "https://www.srs-cspcp.ch/sites/default/files/pages/srs-cspcp-kontenrahmen-und-funktionale-gliederung-hrm2-v18_2025_12_11-clean.pdf";
const METHODS = "https://www.efv.admin.ch/dam/de/sd-web/ga-UaT4b-h22/fs-methoden-d.pdf";
/** Annex B page n is page n + 65 of the PDF. */
const annex = (n: number) => ({ it: `HRM2, allegato B, p. ${n}`, en: `HRM2, Annex B, p. ${n}`, url: `${HRM2}#page=${n + 65}` });
const SCOPE: Record<string, { it: string; en: string; src: { it: string; en: string; url: string }[] }> = {
  // 031 (Umfasst nicht 161, 163), 032, 033, 034; 593 «Hilfsaktionen im Ausland (Caritas, HEKS, IKRK)» sits under 59
  "03": {
    it: "Relazioni con l’estero: comprende ambasciate e consolati, contributi a organizzazioni internazionali, aiuto umanitario e cooperazione allo sviluppo; non l’aiuto militare (difesa) né i contributi a enti come Caritas o CICR.",
    en: "Foreign relations: includes embassies and consulates, contributions to international organisations, humanitarian aid and development cooperation; not military aid (defence) nor contributions to bodies such as Caritas or the ICRC.",
    src: [annex(4)],
  },
  // 111, 112, 113; courts 12, prisons 13, fire service 15
  "11": {
    it: "Sicurezza pubblica: comprende polizia, controllo del traffico stradale e uffici cantonali della circolazione e della navigazione; tribunali, carceri e pompieri sono voci a parte.",
    en: "Public security: includes police, road traffic control and the cantonal road traffic and navigation offices; courts, prisons and fire services are separate lines.",
    src: [annex(5)],
  },
  // 161, 162 (insb. Zivilschutz; Umfasst nicht Feuerwehr 150), 163
  "16": {
    it: "Difesa: comprende difesa militare, protezione civile, aiuto militare all’estero e contributi a missioni internazionali di pace; i pompieri sono una voce a parte.",
    en: "Defence: includes military defence, civil protection, military aid abroad and contributions to international peacekeeping; fire services are a separate line.",
    src: [annex(6)],
  },
  // 21 (elf Jahre), 211, 212, 213, 214, 218 (Umfasst nicht Kinderhorte und -krippen 545); special schools 22
  "21": {
    it: "Scuola dell’obbligo: comprende gli undici anni dalla scuola dell’infanzia al secondario I, scuole di musica di questo livello, custodia diurna e mensa scolastica; non le scuole speciali né gli asili nido.",
    en: "Compulsory school: includes the eleven years from kindergarten to lower secondary, music schools at that level, day care and school meals; not special schools nor crèches.",
    src: [annex(7)],
  },
  // 271, 272, 273 (each: Umfasst nicht Erwachsenenbildung, Weiterbildung, Berufsberatung 299)
  "27": {
    it: "Università: comprende università cantonali, politecnici federali, alte scuole pedagogiche e scuole universitarie professionali, con le borse di studio per i loro studenti; non la formazione degli adulti e continua.",
    en: "Universities: includes cantonal universities, the federal institutes of technology, universities of teacher education and of applied sciences, with grants for their students; not adult and continuing education.",
    src: [annex(11)],
  },
  // 311, 312, 321, 322 (Umfasst nicht Musikschulen 214), 329, 331, 332, 341, 342, 350; festivities for tourism 840
  "3": {
    it: "Cultura, sport, tempo libero e religione: comprende musei, monumenti, biblioteche, musica e teatro, cinema e media, sport, tempo libero e chiese; non le scuole di musica né le feste soprattutto turistiche.",
    en: "Culture, sport, leisure and religion: includes museums, monuments, libraries, music and theatre, film and media, sport, leisure and churches; not music schools nor festivities held mainly for tourism.",
    src: [annex(12)],
  },
  // 411 (incl. GWL), 412 (24-Stunden-Betrieb), 413; home care 421 under 42. Methods p. 29: «werden alle kantonalen Spitäler und Heime als Marktproduzenten eingestuft»
  "41": {
    it: "Ospedali e case di cura: comprende ospedali (anche prestazioni d’interesse generale), cliniche psichiatriche, case di cura e per anziani aperte giorno e notte; non le cure a domicilio. Nella statistica ospedali e case cantonali non fanno parte dello Stato.",
    en: "Hospitals and nursing homes: includes hospitals (services of general interest too), psychiatric clinics, care and old-age homes open day and night; not home care. In the statistics, cantonal hospitals and homes are not part of general government.",
    src: [annex(14), { it: "AFF, metodi, p. 29", en: "FFA, methods, p. 29", url: `${METHODS}#page=29` }],
  },
  // 531 (AHVG; Beiträge der öffentlichen Hand; Ausgleichskassen), 532, 533, 534 (Umfasst nicht Pflegeheime 412), 535
  "53": {
    it: "Vecchiaia e superstiti: comprende l’AVS (casse di compensazione, contributi pubblici), le prestazioni complementari all’AVS, prestazioni per pensionati e alloggi per anziani senza cure; non le case con cure (ospedali e case di cura).",
    en: "Old age and survivors: includes the AHV (compensation funds, public contributions), supplementary benefits to the AHV, benefits for pensioners and housing for the elderly without care; not homes with care (hospitals and nursing homes).",
    src: [annex(17)],
  },
  // 571 (Umfasst nicht EL IV 522, EL AHV 532), 572, 573, 579
  "57": {
    it: "Aiuto sociale e asilo: comprende l’aiuto sociale secondo le leggi cantonali, gli aiuti cantonali in aggiunta ad AVS e AI, l’asilo e i rifugiati; non le prestazioni complementari ad AVS e AI.",
    en: "Social assistance and asylum: includes social assistance under cantonal law, cantonal allowances on top of the AHV and IV, asylum and refugees; not the supplementary benefits to the AHV and IV.",
    src: [annex(18)],
  },
  // 611, 612, 613 (each: Umfasst nicht Verkehrssicherheit 112, Strassenverkehrsamt 113), 619 (incl. Parkplätze)
  "61": {
    it: "Circolazione stradale: comprende costruzione, manutenzione ed esercizio di strade nazionali, cantonali e altre strade e posteggi; non il controllo del traffico né gli uffici della circolazione (sicurezza pubblica).",
    en: "Road traffic: includes building, maintaining and running national, cantonal and other roads and car parks; not traffic control nor road traffic offices (public security).",
    src: [annex(19)],
  },
  // 621 «Bahninfrastruktur Öffentliche Verkehrsinfrastruktur» (Bau, Unterhalt, Beschaffungen), 622, 629
  "62": {
    it: "Trasporti pubblici: comprende l’infrastruttura, anche ferroviaria, e i contributi d’esercizio di Confederazione e Cantoni alle FFS e alle imprese concessionarie del traffico regionale.",
    en: "Public transport: includes infrastructure, rail included, and operating contributions of the Confederation and cantons to SBB and licensed companies in regional transport.",
    src: [annex(20)],
  },
  // 811-818 (816 Direktzahlungen; 817 Umfasst nicht Familienzulagen 541); forestry 82, hunting and fishing 83
  "81": {
    it: "Agricoltura: comprende pagamenti diretti, misure su prezzi e redditi agricoli, promozione delle vendite, miglioramenti strutturali, allevamento e colture; non selvicoltura, caccia e pesca né gli assegni familiari agricoli.",
    en: "Agriculture: includes direct payments, measures on farm prices and incomes, sales promotion, structural improvements, livestock and crops; not forestry, hunting and fishing nor family allowances in farming.",
    src: [annex(22)],
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
  const name = (c: Coded) => (en ? codedName(c, "en") : NAME_IT[c.code] ?? codedName(c, "it")).trim();
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
      scope: s ? { text: en ? s.en : s.it, sources: s.src.map((x) => ({ label: en ? x.en : x.it, url: x.url })) } : null,
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
