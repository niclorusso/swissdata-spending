import { BUDGET_IT } from "@/lib/labels-bund";
import * as EN from "@/lib/labels-en";
import { currentLang, type Lang } from "@/lib/lang";
/** Italian labels for the official German category names (official EFV Italian terminology where it exists). */
export const AUFGABENGEBIET_IT: Record<string, string> = {
  "Ausgaben nach Aufgabengebiet": "Spese per settore di compito",
  "Institutionelle und finanzielle Voraussetzungen": "Premesse istituzionali e finanziarie",
  "Beziehungen zum Ausland - Internationale Zusammenarbeit": "Estero e cooperazione internazionale",
  "Sicherheit": "Sicurezza",
  "Bildung und Forschung": "Formazione e ricerca",
  "Kultur und Freizeit": "Cultura e tempo libero",
  "Gesundheit": "Sanità",
  "Soziale Wohlfahrt": "Previdenza sociale",
  "Verkehr": "Trasporti",
  "Umwelt und Raumordnung": "Ambiente e assetto del territorio",
  "Landwirtschaft und Ernährung": "Agricoltura e alimentazione",
  "Wirtschaft": "Economia",
  "Finanzen und Steuern": "Finanze e imposte",
  // Ausgaben nach Art
  "Ausgaben nach Art": "Spese per natura",
  "Laufende Ausgaben": "Spese correnti",
  "Investitionsausgaben": "Spese d'investimento",
  "Eigenausgaben": "Spese proprie",
  "Personalausgaben": "Spese per il personale",
  "Sach- und Betriebsausgaben": "Spese per beni e servizi e d'esercizio",
  "Rüstungsausgaben": "Spese per l'armamento",
  "Laufende Transferausgaben": "Spese correnti di trasferimento",
  "Finanzausgaben": "Spese finanziarie",
  "Anteile Dritter an Bundeseinnahmen": "Quote di terzi alle entrate della Confederazione",
  "Entschädigungen an Gemeinwesen": "Indennizzi a enti pubblici",
  "Beiträge an eigene Institutionen": "Contributi a istituzioni proprie",
  "Beiträge an Dritte": "Contributi a terzi",
  "Beiträge an Sozialversicherungen": "Contributi alle assicurazioni sociali",
  "Investitionsbeiträge": "Contributi agli investimenti",
  "Sachinvestitionen": "Investimenti materiali",
  "Darlehen und Beteiligungen": "Mutui e partecipazioni",
  // Einnahmen
  "Einnahmen": "Entrate",
  "Laufende Einnahmen": "Entrate correnti",
  "Investitionseinnahmen": "Entrate da investimenti",
  "Fiskaleinnahmen": "Entrate fiscali",
  "Direkte Bundessteuer": "Imposta federale diretta",
  "Direkte Bundessteuer und Ergänzungssteuer": "Imposta federale diretta",
  "Übrige Fiskaleinnahmen": "Altre entrate fiscali",
  "Spielbankenabgabe": "Tassa sulle case da gioco",
  "Lenkungsabgaben": "Tasse d'incentivazione",
  "Schwerverkehrsabgabe": "Tassa sul traffico pesante",
  "Nationalstrassenabgabe": "Contrassegno autostradale",
  "Automobilsteuer": "Imposta sugli autoveicoli",
  "Biersteuer": "Imposta sulla birra",
  "Alkoholsteuer": "Imposta sull'alcol",
  "Übrige Einnahmen": "Altre entrate",
  "Wehrpflichtersatzabgabe": "Tassa d'esenzione dall'obbligo militare",
  "Ausserordentliche Einnahmen": "Entrate straordinarie",
  "Konzessionsabgaben (inkl. Anteil am RG der EAV bis 2024)": "Tasse di concessione",
  "Gewinnausschüttung SNB": "Distribuzione dell'utile BNS",
  "Beteiligungseinnahmen": "Entrate da partecipazioni",
  "Zinseinnahmen": "Entrate da interessi",
  "Gebühren": "Emolumenti",
  "Kantonsbeiträge": "Contributi dei Cantoni",
  "EU Zinsbesteuerung": "Fiscalità del risparmio UE",
  "Verrechnungssteuer": "Imposta preventiva",
  "Stempelabgaben": "Tasse di bollo",
  "Mehrwertsteuer": "Imposta sul valore aggiunto",
  "Übrige Verbrauchssteuern": "Altre imposte di consumo",
  "Mineralölsteuer": "Imposta sugli oli minerali",
  "Tabaksteuer": "Imposta sul tabacco",
  "Verkehrsabgaben": "Tasse sul traffico",
  "Zölle": "Dazi",
  "Regalien und Konzessionen": "Regalie e concessioni",
  "Entgelte": "Ricavi e tasse",
  "Finanzeinnahmen": "Entrate finanziarie",
  "Verschiedene Einnahmen": "Entrate varie",
  "Nichtfiskalische Einnahmen": "Entrate non fiscali",
};

export const DEPARTEMENT_SHORT: Record<string, string> = {
  "Bund": "Confederazione",
  "Behörden und Gerichte": "Autorità e tribunali",
  "Eidg. Departement für auswärtige Angelegenheiten": "DFAE – Affari esteri",
  "Eidg. Departement des Innern": "DFI – Interno",
  "Eidg. Justiz- und Polizeidepartement": "DFGP – Giustizia e polizia",
  "Eidg. Dep. für Verteidigung, Bevölkerungsschutz und Sport": "DDPS – Difesa, protezione della popolazione e sport",
  "Eidg. Finanzdepartement": "DFF – Finanze",
  "Eidg. Departement für Wirtschaft, Bildung und Forschung": "DEFR – Economia, formazione e ricerca",
  "Eidg. Dep. für Umwelt, Verkehr, Energie und Kommunikation": "DATEC – Ambiente, trasporti, energia e comunicazioni",
};

export const DEP_CODE_IT: Record<string, string> = {
  "PARL, BR, BK": "Parlamento, Consiglio federale, Cancelleria",
  "EDA": "DFAE – Affari esteri", "EDI": "DFI – Interno", "EJPD": "DFGP – Giustizia e polizia",
  "VBS": "DDPS – Difesa", "EFD": "DFF – Finanze", "WBF": "DEFR – Economia, formazione e ricerca",
  "UVEK": "DATEC – Ambiente, trasporti, energia", "BGer": "Tribunale federale", "Gerichte": "Tribunali",
};

export const VERFAHREN_IT: Record<string, string> = {
  "Offenes Verfahren": "Procedura aperta",
  "Selektives Verfahren": "Procedura selettiva",
  "Einladungsverfahren": "Procedura mediante invito",
  "Freihändiges Verfahren": "Incarico diretto (trattativa privata)",
};

/** Name of a federal budget item (German in the source) in the language of the page. Browser components pass `lang`. */
export function it(name: string, dict: Record<string, string> = AUFGABENGEBIET_IT, lang: Lang = currentLang()): string {
  if (lang === "en") return EN.AUFGABENGEBIET_EN[name] ?? EN.BUDGET_EN[name] ?? EN.UNIT_EN[name] ?? EN.DEPARTEMENT_SHORT_EN[name] ?? name;
  return dict[name] ?? BUDGET_IT[name] ?? name;
}
export const depName = (name: string, lang: Lang = currentLang()) => (lang === "en" ? EN.DEPARTEMENT_SHORT_EN[name] : DEPARTEMENT_SHORT[name]) ?? name;
export const depCode = (code: string | null | undefined, lang: Lang = currentLang()) => (lang === "en" ? EN.DEP_CODE_EN[code ?? ""] : DEP_CODE_IT[code ?? ""]) ?? code ?? "–";
export const verfahren = (name: string | null | undefined, lang: Lang = currentLang()) => (lang === "en" ? EN.VERFAHREN_EN[name ?? ""] : VERFAHREN_IT[name ?? ""]) ?? name ?? "–";
export const svName = (key: string, lang: Lang = currentLang()) => (lang === "en" ? EN.SV_EN[key] : SV_IT[key]) ?? key;
export const objectName = (object: string, lang: Lang = currentLang()): string | undefined => (lang === "en" ? EN.OBJECT_EN[object] : OBJECT_IT[object]);
/** Label and reading note of a municipal measure (the snapshots carry the Italian ones). */
export const measureText = (kt: string, m: { key: string; label: string; note: string }, lang: Lang = currentLang()) => (lang === "en" ? EN.MEASURE_EN[`${kt}:${m.key}`] ?? m : m);

export const KANTONE: { id: string; name: string; nameIt: string }[] = [
  { id: "zh", name: "Zürich", nameIt: "Zurigo" }, { id: "be", name: "Bern", nameIt: "Berna" }, { id: "lu", name: "Luzern", nameIt: "Lucerna" },
  { id: "ur", name: "Uri", nameIt: "Uri" }, { id: "sz", name: "Schwyz", nameIt: "Svitto" }, { id: "ow", name: "Obwalden", nameIt: "Obvaldo" },
  { id: "nw", name: "Nidwalden", nameIt: "Nidvaldo" }, { id: "gl", name: "Glarus", nameIt: "Glarona" }, { id: "zg", name: "Zug", nameIt: "Zugo" },
  { id: "fr", name: "Fribourg", nameIt: "Friburgo" }, { id: "so", name: "Solothurn", nameIt: "Soletta" }, { id: "bs", name: "Basel-Stadt", nameIt: "Basilea Città" },
  { id: "bl", name: "Basel-Landschaft", nameIt: "Basilea Campagna" }, { id: "sh", name: "Schaffhausen", nameIt: "Sciaffusa" },
  { id: "ar", name: "Appenzell Ausserrhoden", nameIt: "Appenzello Esterno" }, { id: "ai", name: "Appenzell Innerrhoden", nameIt: "Appenzello Interno" },
  { id: "sg", name: "St. Gallen", nameIt: "San Gallo" }, { id: "gr", name: "Graubünden", nameIt: "Grigioni" }, { id: "ag", name: "Aargau", nameIt: "Argovia" },
  { id: "tg", name: "Thurgau", nameIt: "Turgovia" }, { id: "ti", name: "Ticino", nameIt: "Ticino" }, { id: "vd", name: "Vaud", nameIt: "Vaud" },
  { id: "vs", name: "Valais", nameIt: "Vallese" }, { id: "ne", name: "Neuchâtel", nameIt: "Neuchâtel" }, { id: "ge", name: "Genève", nameIt: "Ginevra" },
  { id: "ju", name: "Jura", nameIt: "Giura" },
];
export const kantonName = (id: string, lang: Lang = currentLang()) => (lang === "en" ? EN.KANTON_EN[id.toLowerCase()] : KANTONE.find((k) => k.id === id.toLowerCase())?.nameIt) ?? id.toUpperCase();

export const SV_IT: Record<string, string> = {
  sv_ahv: "AVS – assicurazione vecchiaia e superstiti", sv_iv: "AI – assicurazione invalidità", sv_eo: "IPG – indennità di perdita di guadagno",
  sv_alv: "AD – assicurazione contro la disoccupazione", sv_fl: "Assegni familiari nell'agricoltura", sv_mat_ge: "Assicurazione maternità (Ginevra)", sv: "Assicurazioni sociali (totale)",
};

/** Oggetto dei contratti più grandi, per dire in italiano che cosa è stato comprato. */
export const OBJECT_IT: Record<string, string> = {
  "Luftfahrtsysteme": "sistemi aeronautici",
  "Bauten Nationalstrassen, Bauleistungen (Werkverträge)": "lavori sulle strade nazionali",
  "Fahrzeuge": "veicoli",
};

/** Plainer wording for official category names that a general reader would misread. */
const PLAIN: Record<string, string> = {
  "Economia nazionale": "Economia (agricoltura, turismo, energia)", "Economia pubblica": "Economia (agricoltura, turismo, energia)",
  "Uscite": "Spese correnti", "Uscite per investimenti": "Investimenti",
  "Uscite per il personale": "Personale", "Uscite per beni e servizi e altre uscite d’esercizio": "Beni, servizi e spese d'esercizio",
  "Uscite finanziarie": "Interessi e spese finanziarie", "Uscite di riversamento": "Contributi versati ad altri (Comuni, enti, persone)",
  "Uscite straordinarie": "Spese straordinarie", "Investimenti materiali": "Opere e beni durevoli", "Contributi agli investimenti": "Contributi a investimenti di altri",
  "Traffico e telecomunicazioni": "Trasporti e comunicazione",
};
export const plain = (s: string | null | undefined, fallback = ""): string => (s ? PLAIN[s] ?? s : fallback);
/** Name of a category of the financial statistics (function or type of spending) in the language of the page. */
export const codedName = (c: { code: string; de?: string | null; it?: string | null }, lang: Lang = currentLang()): string =>
  lang === "en" ? (c.de ? EN.FS_EN[c.de] ?? c.de : c.code) : plain(c.it, c.de ?? c.code);
