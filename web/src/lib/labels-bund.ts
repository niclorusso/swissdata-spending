import { CATEGORY_EN, UNIT_CODE_EN, UNIT_EN } from "@/lib/labels-en";
import { currentLang, type Lang } from "@/lib/lang";
/** Italian for the German names in the federal sources. Official Italian names where they exist. */

/** Budget items below the first level (spese per settore, per natura, entrate). */
export const BUDGET_IT: Record<string, string> = {
  // settori, secondo livello
  "Unterstützung Legislative und Exekutive": "Parlamento e Consiglio federale", "Steuerpolitik": "Politica fiscale e riscossione delle imposte",
  "Ressourcen- und Verwaltungssteuerung": "Gestione delle risorse e dell'amministrazione", "Interne Dienstleistungen": "Servizi interni",
  "Auswertung und Erhebung von Daten": "Rilevazione e analisi di dati (statistica)", "Allgemeines Rechtswesen": "Diritto generale",
  "Gerichte und Strafverfolgung": "Tribunali e perseguimento penale", "Politische Beziehungen": "Relazioni politiche",
  "Entwicklungshilfe (Süd- und Ostländer)": "Aiuto allo sviluppo (Paesi del Sud e dell'Est)", "Wirtschaftliche Beziehungen": "Relazioni economiche",
  "Hilfe an Ostländer und Erweiterung der EU": "Aiuto ai Paesi dell'Est e allargamento dell'UE", "Militärische Landesverteidigung": "Difesa militare",
  "Bevölkerungsschutz und Zivildienst": "Protezione della popolazione e servizio civile", "Polizei, Strafvollzug, Nachrichtendienst": "Polizia, esecuzione delle pene, servizio informazioni",
  "Grenzkontrollen": "Controlli alla frontiera", "Berufsbildung": "Formazione professionale", "Hochschulen": "Scuole universitarie",
  "Grundlagenforschung": "Ricerca di base", "Angewandte Forschung": "Ricerca applicata", "Übriges Bildungswesen": "Altra formazione",
  "Kulturerhaltung": "Conservazione della cultura", "Kulturförderung": "Promozione della cultura", "Sport": "Sport", "Medienpolitik": "Politica dei media",
  "Altersversicherung": "Assicurazione vecchiaia (AVS)", "Invalidenversicherung": "Assicurazione invalidità (AI)",
  "Krankenversicherung": "Assicurazione malattie (riduzione dei premi)", "Ergänzungsleistungen": "Prestazioni complementari",
  "Militärversicherung": "Assicurazione militare", "Arbeitslosenversicherung / Arbeitsvermittlung": "Assicurazione disoccupazione e collocamento",
  "Sozialer Wohnungsbau / Wohnbauförderung": "Alloggi sociali e promozione dell'alloggio", "Migration": "Migrazione", "Familienpolitik, Gleichstellung": "Politica familiare, uguaglianza",
  "Strassenverkehr": "Traffico stradale", "Schienenverkehr und öffentlicher Verkehr": "Ferrovia e trasporti pubblici", "Luftfahrt": "Aviazione",
  "Umwelt": "Ambiente", "Schutz vor Naturgefahren": "Protezione dai pericoli naturali", "Naturschutz": "Protezione della natura", "Raumordnung": "Assetto del territorio",
  "Wirtschaftsordnung": "Ordinamento economico", "Standortförd., Regionalpolitik, wirtsch. Landesversorgung": "Promozione economica, politica regionale, approvvigionamento del Paese",
  "Energie": "Energia", "Anteile an Bundeseinnahmen": "Quote dei Cantoni alle entrate federali",
  "Geldbeschaffung, Vermögens- und Schuldenverwaltung": "Interessi e gestione del debito", "Finanzausgleich": "Perequazione finanziaria",
  // spese per natura
  "Lohnausgaben": "Stipendi", "Sozialausgaben": "Contributi sociali del datore di lavoro", "Übrige Personalausgaben": "Altre spese per il personale",
  "Betriebs- und Rüstungsausgaben": "Spese d'esercizio e d'armamento", "Beratung und externe Dienstleistungen": "Consulenza e servizi esterni", "Informatik": "Informatica",
  "Betriebsausgaben der Armee": "Spese d'esercizio dell'esercito", "Liegenschaften und Mieten": "Immobili e affitti", "Übrige Sach- und Betriebsausgaben": "Altre spese per beni e servizi",
  "Ausgaben Beschaffung und Ausrüstung": "Acquisti ed equipaggiamento", "Ausgaben Rüstungsmaterial": "Materiale d'armamento",
  "Transferausgaben": "Trasferimenti (contributi versati ad altri)", "Einlagen in Spezialfonds und Spezialfinanzierungen": "Versamenti in fondi speciali",
  "Spezialfonds mit eigener Rechnung": "Fondi speciali con conto proprio", "Spezialfonds der Bundesrechnung": "Fondi speciali nel conto della Confederazione", "Spezialfinanzierungen": "Finanziamenti speciali",
  "Beiträge an eigene Instititionen": "Contributi a istituzioni proprie", "Beiträge an dezentrale Verwaltungseinheiten": "Contributi a unità decentralizzate (per es. politecnici)",
  "Beiträge an Bundesunternehmen": "Contributi a imprese della Confederazione", "Bundesbeiträge an Sozialversicherungen": "Contributi alle assicurazioni sociali",
  "Anteile der Sozialversicherungen an Bundeseinnahmen": "Quote delle assicurazioni sociali alle entrate federali", "Beiträge an Kantone und Gemeinden": "Contributi a Cantoni e Comuni",
  "Kantonsanteile an Bundeseinnahmen": "Quote dei Cantoni alle entrate federali", "Übrige Beiträge an Kantone": "Altri contributi ai Cantoni", "Übrige Beiträge an Gemeinden": "Altri contributi ai Comuni",
  "Dritte": "Terzi", "Internationale Organisationen": "Organizzazioni internazionali", "Rückverteilung Lenkungsabgaben": "Ridistribuzione delle tasse d'incentivazione",
  "Übrige Beiträge an Dritte": "Altri contributi a terzi", "Zinsausgaben": "Interessi", "Bruttozinsausgaben": "Interessi lordi", "Negative Zinsausgaben": "Interessi negativi",
  "Übrige Finanzausgaben": "Altre spese finanziarie", "Sachanlagen und Vorräte": "Opere, beni durevoli e scorte", "Liegenschaften": "Immobili", "Mobilien": "Beni mobili", "Vorräte": "Scorte",
  "Nationalstrassen": "Strade nazionali", "Rüstungsmaterial": "Materiale d'armamento", "Immaterielle Anlagen": "Beni immateriali (software, licenze)", "Darlehen": "Mutui",
  "A.o. Investitionsausgaben Darlehen": "Mutui straordinari", "Beteiligungen": "Partecipazioni", "A.o. Investitionsausgaben Beteiligungen": "Partecipazioni straordinarie",
  "Eigene Investitionsbeiträge": "Contributi propri agli investimenti",
  // entrate
  "Übrige Erträge aus Regalien und Konzessionen": "Altri ricavi da regalie e concessioni", "Entgelte für Benutzungen und Dienstleistungen": "Tasse d'uso e prestazioni di servizi",
  "Verkäufe": "Vendite", "Rückerstattungen": "Rimborsi", "Übrige Entgelte": "Altri ricavi", "Liegenschafteneinnahmen": "Entrate da immobili",
  "Gewinne auf Sach- und immateriellen Anlagen": "Utili su beni materiali e immateriali", "Einnahmen aus Drittmitteln und Kofinanzierungen": "Mezzi di terzi e cofinanziamenti",
  "Übrige verschiedene Einnahmen": "Altre entrate varie", "Kursgewinne": "Utili di cambio", "Gewinne auf Darlehen und Beteiligungen": "Utili su mutui e partecipazioni",
  "Verschiedene Finanzeinnahmen": "Entrate finanziarie varie", "Veräusserung von Verwaltungsvermögen": "Vendita di beni amministrativi", "Veräusserung immaterielle Anlagen": "Vendita di beni immateriali",
  "Rückzahlung Darlehen": "Rimborso di mutui", "Veräusserung Beteiligungen": "Vendita di partecipazioni", "Rückzahlung eigener Investitionsbeiträge": "Rimborso di contributi agli investimenti",
  "Durchlaufende Investitionsbeiträge": "Contributi agli investimenti da riversare", "Dividendeneinnahmen": "Dividendi", "Ausserordentliche Investitionseinnahmen": "Entrate straordinarie da investimenti",
  "Erhaltene Drittmittel": "Mezzi di terzi ricevuti",
};

/** Administrative units: Italian name (with the Italian abbreviation where one is in common use). */
export const UNIT_IT: Record<string, string> = {
  "Bundesversammlung": "Assemblea federale", "Bundesrat": "Consiglio federale", "Bundeskanzlei": "Cancelleria federale (CaF)", "Bundesgericht": "Tribunale federale",
  "Bundesstrafgericht": "Tribunale penale federale", "Bundesverwaltungsgericht": "Tribunale amministrativo federale", "Aufsichtsbehörde über die Bundesanwaltschaft": "Autorità di vigilanza sul Ministero pubblico della Confederazione",
  "Bundesanwaltschaft": "Ministero pubblico della Confederazione (MPC)", "Bundespatentgericht": "Tribunale federale dei brevetti",
  "Eidg. Departement für auswärtige Angelegenheiten (VE)": "Dipartimento federale degli affari esteri (DFAE)", "Direktion für Entwicklung und Zusammenarbeit": "Direzione dello sviluppo e della cooperazione (DSC)",
  "Bundesreisezentrale": "Centrale viaggi della Confederazione", "Informatik EDA": "Informatica DFAE", "Generalsekretariat EDI": "Segreteria generale DFI",
  "Eidg. Büro für die Gleichstellung von Frau und Mann": "Ufficio federale per l'uguaglianza fra donna e uomo (UFU)", "Schweizerisches Bundesarchiv": "Archivio federale svizzero (AFS)",
  "Bundesamt für Kultur": "Ufficio federale della cultura (UFC)", "Schweizerische Nationalbibliothek": "Biblioteca nazionale svizzera", "Bundesamt für Meteorologie und Klimatologie": "MeteoSvizzera",
  "Bundesamt für Gesundheit": "Ufficio federale della sanità pubblica (UFSP)", "Bundesamt für Statistik": "Ufficio federale di statistica (UST)", "Bundesamt für Sozialversicherungen": "Ufficio federale delle assicurazioni sociali (UFAS)",
  "Staatssekretariat für Bildung und Forschung": "Segreteria di Stato per l'educazione e la ricerca (fino al 2012)", "Bundesamt für Lebensmittelsicherheit und Veterinärwesen": "Ufficio federale della sicurezza alimentare e di veterinaria (USAV)",
  "Institut für Virologie und Immunologie": "Istituto di virologia e di immunologia (IVI)", "Generalsekretariat EJPD": "Segreteria generale DFGP", "Bundesamt für Justiz": "Ufficio federale di giustizia (UFG)",
  "Bundesamt für Polizei": "Ufficio federale di polizia (fedpol)", "Schweizerisches Institut für Rechtsvergleichung": "Istituto svizzero di diritto comparato", "Bundesamt für Metrologie": "Ufficio federale di metrologia",
  "Eidgenössische Spielbankenkommission": "Commissione federale delle case da gioco", "Staatssekretariat für Migration": "Segreteria di Stato della migrazione (SEM)",
  "Informatik Service Center ISC-EJPD": "Centro servizi informatici DFGP", "Generalsekretariat VBS": "Segreteria generale DDPS",
  "Unabhängige Aufsichtsbehörde über die ND Tätigkeiten": "Autorità di vigilanza indipendente sulle attività informative", "Nachrichtendienst des Bundes": "Servizio delle attività informative della Confederazione (SIC)",
  "Bundesamt für Sport": "Ufficio federale dello sport (UFSPO)", "Bundesamt für Cybersicherheit": "Ufficio federale della cibersicurezza (UFCS)", "Bundesamt für Bevölkerungsschutz": "Ufficio federale della protezione della popolazione (UFPP)",
  "Staatssekretariat für Sicherheitspolitik": "Segreteria di Stato della politica di sicurezza (SEPOS)", "Verteidigung": "Difesa (esercito)", "Bundesamt für Rüstung armasuisse": "Ufficio federale dell'armamento (armasuisse)",
  "armasuisse Wissenschaft und Technologie": "armasuisse Scienza e tecnologia", "armasuisse Immobilien": "armasuisse Immobili", "Bundesamt für Landestopografie swisstopo": "Ufficio federale di topografia (swisstopo)",
  "Generalsekretariat EFD": "Segreteria generale DFF", "Eidgenössische Finanzverwaltung": "Amministrazione federale delle finanze (AFF)", "Zentrale Ausgleichsstelle": "Ufficio centrale di compensazione (UCC)",
  "Eidgenössische Münzstätte Swissmint": "Zecca federale Swissmint", "Staatssekretariat für internationale Finanzfragen": "Segreteria di Stato per le questioni finanziarie internazionali (SFI)",
  "Eidgenössische Steuerverwaltung": "Amministrazione federale delle contribuzioni (AFC)", "Bundesamt für Zoll und Grenzsicherheit": "Ufficio federale della dogana e della sicurezza dei confini (UDSC)",
  "Informatiksteuerungsorgan des Bundes": "Organo direzione informatica della Confederazione (fino al 2020)", "Bundesamt für Informatik und Telekommunikation": "Ufficio federale dell'informatica e della telecomunicazione (UFIT)",
  "Eidgenössische Finanzkontrolle": "Controllo federale delle finanze (CDF)", "Eidgenössische Bankenkommission": "Commissione federale delle banche (fino al 2008)", "Eidgenössisches Personalamt": "Ufficio federale del personale (UFPER)",
  "Bundesamt für Bauten und Logistik": "Ufficio federale delle costruzioni e della logistica (UFCL)", "Bundesamt für Privatversicherungen": "Ufficio federale delle assicurazioni private (fino al 2008)",
  "Generalsekretariat WBF": "Segreteria generale DEFR", "Staatssekretariat für Wirtschaft": "Segreteria di Stato dell'economia (SECO)", "Bundesamt für Berufsbildung und Technologie": "Ufficio federale della formazione professionale e della tecnologia (fino al 2012)",
  "Bundesamt für Landwirtschaft": "Ufficio federale dell'agricoltura (UFAG)", "Agroscope": "Agroscope", "Nationalgestüt Avenches": "Istituto nazionale di allevamento equino di Avenches",
  "Bundesamt für Veterinärwesen": "Ufficio federale di veterinaria (fino al 2013)", "Institut für Viruskrankheiten und Immunprophylaxe": "Istituto di virologia e immunoprofilassi (fino al 2013)",
  "Bundesamt für wirtschaftliche Landesversorgung": "Ufficio federale per l'approvvigionamento economico del Paese (UFAE)", "Bundesamt für Wohnungswesen": "Ufficio federale delle abitazioni (UFAB)",
  "Wettbewerbskommission": "Commissione della concorrenza (COMCO)", "Bundesamt für Zivildienst": "Ufficio federale del servizio civile (CIVI)", "Schweizerische Akkreditierungsstelle": "Servizio di accreditamento svizzero (SAS)",
  "Staatssekretariat für Bildung, Forschung und Innovation": "Segreteria di Stato per la formazione, la ricerca e l'innovazione (SEFRI)", "Kommission für Technologie und Innovation": "Commissione per la tecnologia e l'innovazione (fino al 2017)",
  "Information Service Center WBF": "Centro servizi informatici DEFR", "Generalsekretariat UVEK": "Segreteria generale DATEC", "Bundesamt für Verkehr": "Ufficio federale dei trasporti (UFT)",
  "Bundesamt für Zivilluftfahrt": "Ufficio federale dell'aviazione civile (UFAC)", "Bundesamt für Energie": "Ufficio federale dell'energia (UFE)", "Bundesamt für Strassen": "Ufficio federale delle strade (USTRA)",
  "Bundesamt für Kommunikation": "Ufficio federale delle comunicazioni (UFCOM)", "Bundesamt für Umwelt": "Ufficio federale dell'ambiente (UFAM)", "Bundesamt für Raumentwicklung": "Ufficio federale dello sviluppo territoriale (ARE)",
  "Hauptabteilung für die Sicherheit der Kernanlagen": "Divisione principale della sicurezza degli impianti nucleari (fino al 2008)", "Schweizerische Sicherheitsuntersuchungsstelle": "Servizio d'inchiesta svizzero sulla sicurezza (SISI)",
  "Regulierungsbehörden Infrastruktur": "Autorità di regolazione delle infrastrutture",
};

/** Contracting units as abbreviated in the contract lists (German abbreviation -> Italian name). */
export const UNIT_CODE_IT: Record<string, string> = {
  "ALV": "Assicurazione contro la disoccupazione (SECO)", "ARE": "Sviluppo territoriale (ARE)", "ASTRA": "Strade (USTRA)", "Agroscope": "Agroscope", "BABS": "Protezione della popolazione (UFPP)",
  "BAFU": "Ambiente (UFAM)", "BAG": "Sanità pubblica (UFSP)", "BAK": "Cultura (UFC)", "BAKOM": "Comunicazioni (UFCOM)", "BAR": "Archivio federale", "BASPO": "Sport (UFSPO)", "BAV": "Trasporti (UFT)",
  "BAZG": "Dogana e sicurezza dei confini (UDSC)", "BAZL": "Aviazione civile (UFAC)", "BBL": "Costruzioni e logistica (UFCL)", "BFE": "Energia (UFE)", "BFS": "Statistica (UST)",
  "BIT": "Informatica e telecomunicazione (UFIT)", "BJ": "Giustizia (UFG)", "BK": "Cancelleria federale", "BLV": "Sicurezza alimentare e veterinaria (USAV)", "BLW": "Agricoltura (UFAG)", "BR": "Consiglio federale",
  "BSV": "Assicurazioni sociali (UFAS)", "BWL": "Approvvigionamento economico (UFAE)", "BWO": "Abitazioni (UFAB)", "Bahninfrastrukturfonds": "Fondo per l'infrastruttura ferroviaria",
  "EBG": "Uguaglianza fra donna e uomo (UFU)", "EDA": "Affari esteri (DFAE)", "EFK": "Controllo delle finanze (CDF)", "EFV": "Amministrazione delle finanze (AFF)", "EPA": "Personale (UFPER)",
  "ESBK": "Commissione delle case da gioco", "ESTV": "Contribuzioni (AFC)", "GS-EDI": "Segreteria generale DFI", "GS-EFD": "Segreteria generale DFF", "GS-EJPD": "Segreteria generale DFGP",
  "GS-UVEK": "Segreteria generale DATEC", "GS-VBS": "Segreteria generale DDPS", "GS-WBF": "Segreteria generale DEFR", "ISC-EJPD": "Centro servizi informatici DFGP", "ISCeco": "Centro servizi informatici DEFR",
  "IVI": "Istituto di virologia e di immunologia", "MeteoSchweiz": "MeteoSvizzera", "NAF": "Fondo per le strade nazionali (FOSTRA)", "PARL": "Servizi del Parlamento", "RegInfra": "Autorità di regolazione delle infrastrutture",
  "SAS": "Servizio di accreditamento", "SBFI": "Formazione, ricerca e innovazione (SEFRI)", "SECO": "Economia (SECO)", "SEM": "Migrazione (SEM)", "SIF": "Questioni finanziarie internazionali (SFI)",
  "SIR": "Istituto di diritto comparato", "SUST": "Servizio d'inchiesta sulla sicurezza (SISI)", "Swissmint": "Zecca federale Swissmint", "V": "Difesa (esercito)", "WEKO": "Commissione della concorrenza (COMCO)",
  "ZAS": "Ufficio centrale di compensazione (UCC)", "ZIVI": "Servizio civile (CIVI)", "ar Immo": "armasuisse Immobili", "ar W+T": "armasuisse Scienza e tecnologia", "armasuisse": "armasuisse (armamento)",
  "fedpol": "Polizia federale (fedpol)", "swisstopo": "Topografia (swisstopo)",
};

/** Procurement categories. A contract can carry several, separated by "|" in the source. */
const CATEGORY_IT: Record<string, string> = {
  "Luftfahrtsysteme": "Sistemi aeronautici", "Bauten Nationalstrassen, Bauleistungen (Werkverträge)": "Strade nazionali: lavori di costruzione", "Bauten Nationalstrassen, Honorare": "Strade nazionali: onorari",
  "Bauten Nationalstrassen, Betrieb und Unterhalt": "Strade nazionali: esercizio e manutenzione", "IKT für die Bestandteile der Nationalstrassen": "Strade nazionali: informatica e telecomunicazioni",
  "Informatikdienstleistungen im Bereich IKT, exkl. Personalverleih": "Servizi informatici", "Militärische Bauten, Bauleistungen": "Edifici militari: lavori di costruzione", "Militärische Bauten, Honorare": "Edifici militari: onorari",
  "Militärische Bauten, Betrieb Immobilien": "Edifici militari: gestione degli immobili", "Fahrzeuge": "Veicoli", "Diverse Dienstleistungen für die öffentliche Verwaltung": "Servizi vari per l'amministrazione",
  "Waffen, Munition, Sprengstoffe": "Armi, munizioni, esplosivi", "Zivile Bauten, Bauleistungen": "Edifici civili: lavori di costruzione", "Zivile Bauten, Honorare": "Edifici civili: onorari",
  "Zivile Bauten, Betrieb und Instandsetzung": "Edifici civili: esercizio e manutenzione", "Umsetzung und Begleitung von Projekten der internationalen Zusammenarbeit": "Progetti di cooperazione internazionale",
  "Aufklärungs- und Auswertesysteme": "Sistemi di ricognizione e di analisi", "Software und Lizenzen": "Software e licenze", "Beratungs- und Unterstützungs-DL im Fachbereich, exkl. IKT": "Consulenza specialistica (non informatica)",
  "Bekleidung": "Abbigliamento", "Hardware": "Hardware", "Brennstoffe": "Combustibili e carburanti", "Maschinen und Apparate": "Macchine e apparecchi", "Führungs- und Informatiksysteme": "Sistemi di condotta e informatici (esercito)",
  "Publikationen inkl. Agenturleistungen": "Pubblicazioni e agenzie di comunicazione", "Ausbildungssysteme (Simulatoren)": "Sistemi d'istruzione (simulatori)", "Software für militärische Systeme (inkl. Lizenzen)": "Software per sistemi militari",
  "Forschung, Auftragsforschung": "Ricerca su mandato", "Dienstleistungen im Zusammenhang mit Personentransporten, Hotels, usw.": "Viaggi, trasporto di persone, alberghi", "Medizinische Produkte und Pharmabereich": "Prodotti medici e farmaci",
  "Dienstleistungen für Betrieb und Unterhalt von Gütern, militärisch": "Manutenzione di materiale militare", "Dienstleistungen für Betrieb und Unterhalt von Gütern, zivil": "Manutenzione di beni civili",
  "Managements- und Organisationsberatung inkl. Unterstützung sowie Coaching": "Consulenza di gestione e organizzazione", "Sicherheitsdokumente": "Documenti di sicurezza (passaporti, carte)", "Aus- und Weiterbildung": "Formazione e perfezionamento",
  "Informationsarbeit": "Informazione al pubblico", "Expertisen, Rechtsgutachten": "Perizie e pareri giuridici", "Textilien": "Tessili", "Personalverleih und temporäres Personal, exkl. Bereich IKT": "Personale a prestito (non informatico)",
  "Personalverleih und temporäres Personal im Bereich IKT": "Personale a prestito informatico", "Postdienste": "Servizi postali", "Transportdienstleistungen für Güter und Waren": "Trasporto di merci", "Telekommunikation": "Telecomunicazioni",
  "Printgeräte": "Stampanti", "Güter für spezifische Anwendungsbereiche": "Beni per usi specifici", "Stromerzeugungsaggregate": "Gruppi elettrogeni", "SW-Pflege und HW-Wartung": "Manutenzione di software e hardware",
  "Sprach- und Übersetzungsdienstleistungen": "Servizi linguistici e traduzioni", "Nahrungsmittel und Getränke": "Alimentari e bevande", "Büro- und Raumausstattung zivile Verwaltung": "Arredo di uffici", "Bürotechnik": "Macchine per ufficio",
  "Chemie": "Prodotti chimici", "Übrige Fahrzeuge und Transportmittel": "Altri veicoli e mezzi di trasporto", "Politikorientierte Beratung": "Consulenza politica", "Güter und Dienstleistungen im Zusammenhang mit Sport und Erholung": "Sport e tempo libero",
  "Lokomotiven und rollendes Material": "Locomotive e materiale rotabile", "Kurierdienste": "Servizi di corriere", "Büromaterial und allgemeines Verbrauchs- und Hausdienstmaterial": "Materiale d'ufficio e di consumo",
  "Nicht zugeordnet": "Non attribuito",
};

/** "A | B" -> "Italian A · Italian B" (unknown lines stay as they are). */
export function categoryIt(object: string | null | undefined, lang: Lang = currentLang()): string {
  if (!object) return "–";
  const dict = lang === "en" ? CATEGORY_EN : CATEGORY_IT;
  return Array.from(new Set(object.split(/\s*\|\s*|\n/).map((s) => s.trim()).filter(Boolean).map((s) => dict[s] ?? s))).join(" · ");
}
export const unitIt = (name: string, lang: Lang = currentLang()) => (lang === "en" ? UNIT_EN[name] : UNIT_IT[name]) ?? name;
export const unitCodeIt = (code: string | null | undefined, lang: Lang = currentLang()) => (code ? (lang === "en" ? UNIT_CODE_EN[code] : UNIT_CODE_IT[code]) ?? code : "–");
