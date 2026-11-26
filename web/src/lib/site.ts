/** Name of the site and of the family it belongs to, in one place. */
export const SITE = {
  brand: "SwissData", parentUrl: "https://swissdata-platform.ch", url: "https://spending.swissdata-platform.ch",
  section: "Spesa pubblica", sectionEn: "Public spending",
  name: "SwissData · Spesa pubblica", nameEn: "SwissData · Public spending",
};

/** The three SwissData sites, in the order every header and footer of the family lists them.
 *  `it` / `en`: the name in the switcher of the header. `long`: the name in the footer block. `text`: one line on what the site holds. */
export const FAMILY = [
  { id: "sd", url: "https://swissdata-platform.ch", it: "Indicatori", en: "Indicators", long: { it: "Indicatori", en: "Indicators" },
    text: { it: "Indicatori su economia, popolazione e società, con quiz e confronto tra Cantoni.", en: "Indicators on the economy, population and society, with a quiz and a comparison of cantons." } },
  { id: "parl", url: "https://parliament.swissdata-platform.ch", it: "Parlamento", en: "Parliament", long: { it: "Parlamento", en: "Parliament" },
    text: { it: "Il Consiglio nazionale, votazione per votazione.", en: "The National Council, vote by vote." } },
  { id: "spend", url: "https://spending.swissdata-platform.ch", it: "Spesa", en: "Spending", long: { it: "Spesa pubblica", en: "Public spending" },
    text: { it: "Quanto spendono Confederazione, Cantoni e Comuni, e per che cosa.", en: "How much the Confederation, cantons and municipalities spend, and on what." } },
] as const;
export const THIS_SITE = "spend";
