/** «Quanto pesa?»: the items a visitor can highlight. Each one is a line of the FFA functional classification (model FS),
 *  read for general government (`staat`) in fs-haushalte: two digits = a line of the file, one digit = a task area (sum of its lines).
 *  An item that is not a line of that table is not offered (interest on the debt, for example, exists only in the table by type).
 *  Every item has a fixed address, /quanto-pesa/<slug>/ (the same slug in English): `old` lists the names the prototype used
 *  in ?voce=… links, which the chooser page sends on to the fixed address. */
export type VoceDef = { slug: string; old?: string; code: string; it: string; en: string };

/** In the order of the classification codes. */
export const VOCI: VoceDef[] = [
  { slug: "relazioni-estero", old: "estero", code: "03", it: "Quanto pesano le relazioni con l’estero sulla spesa pubblica?", en: "How much do foreign relations weigh in public spending?" },
  { slug: "sicurezza-pubblica", code: "11", it: "Quanto pesa la sicurezza pubblica sulla spesa pubblica?", en: "How much does public security weigh in public spending?" },
  { slug: "difesa", code: "16", it: "Quanto pesa la difesa sulla spesa pubblica?", en: "How much does defence weigh in public spending?" },
  { slug: "scuola-obbligo", code: "21", it: "Quanto pesa la scuola dell’obbligo sulla spesa pubblica?", en: "How much does compulsory school weigh in public spending?" },
  { slug: "universita", code: "27", it: "Quanto pesano le università sulla spesa pubblica?", en: "How much do universities weigh in public spending?" },
  // Shorter than the others: with «sulla spesa pubblica» the title passes 70 characters, too long for a social card.
  { slug: "cultura-sport", old: "cultura", code: "3", it: "Quanto pesano cultura, sport, ricreazione e religione?", en: "How much do culture, sport, leisure and church weigh?" },
  { slug: "ospedali", code: "41", it: "Quanto pesano gli ospedali e le case di cura sulla spesa pubblica?", en: "How much do hospitals and nursing homes weigh in public spending?" },
  { slug: "vecchiaia", code: "53", it: "Quanto pesano vecchiaia e superstiti sulla spesa pubblica?", en: "How much do old age and survivors weigh in public spending?" },
  { slug: "aiuto-sociale-asilo", old: "asilo", code: "57", it: "Quanto pesano l’aiuto sociale e l’asilo sulla spesa pubblica?", en: "How much do social assistance and asylum weigh in public spending?" },
  { slug: "strade", code: "61", it: "Quanto pesa la circolazione stradale sulla spesa pubblica?", en: "How much does road traffic weigh in public spending?" },
  { slug: "trasporti-pubblici", code: "62", it: "Quanto pesano i trasporti pubblici sulla spesa pubblica?", en: "How much does public transport weigh in public spending?" },
  { slug: "agricoltura", code: "81", it: "Quanto pesa l’agricoltura sulla spesa pubblica?", en: "How much does agriculture weigh in public spending?" },
];

/** Slug of the fixed page for a ?voce=… value (current or old name), or null. */
export const slugFor = (v: string | null): string | null => (v ? VOCI.find((d) => d.slug === v || d.old === v)?.slug ?? null : null);

/** Plainer Italian for a few names of the FFA code list (typos and «+» included there). */
export const NAME_IT: Record<string, string> = {
  "48": "R&S in materia di sanità",
  "53": "Vecchiaia e superstiti",
  "57": "Aiuto sociale e asilo",
};

/** English names where the site's own differs from the FFA's title: task area 3 keeps the FFA's words (its lines include the media). */
export const NAME_EN: Record<string, string> = {
  "3": "Culture, sport and leisure, church",
};

/** Share of the total: one decimal; below 0.1 % two, so a small line never reads «0.0 %»; below 0.01 % «< 0.01 %».
 *  `pct` is the site's formatter for the page's language. */
export const shareOf = (pct: (v: number, digits: number) => string, fraction: number): string => {
  const p = fraction * 100;
  return p >= 0.1 ? pct(p, 1) : p >= 0.01 ? pct(p, 2) : `< ${pct(0.01, 2)}`;
};

export type QpCell = { code: string; name: string; value: number };
export type QpGroup = QpCell & { cells: QpCell[] };
/** `scope`: one plain line on what the classification puts in the item, with the pages it comes from (null when not confirmed). */
export type QpSource = { label: string; url: string };
export type QpVoce = { slug: string; code: string; name: string; question: string; value: number; group: { code: string; name: string }; scope: { text: string; sources: QpSource[] } | null };
export type QpData = {
  year: string; total: number; cellSum: number; groups: QpGroup[]; voci: QpVoce[];
  source: { fileUrl: string; fileDate: string | null; statusDate: string | null; register: string; method: QpSource };
};
