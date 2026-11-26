# Fonti dati (mappa, verificata il 2026-11-26)

Legenda: ✅ usata nel sito · 🟡 machine-readable, non ancora integrata · 🔴 solo PDF/dashboard, nessun file aperto.

## Confederazione

| Stato | Dataset | URL | Formato | Note |
|---|---|---|---|---|
| ✅ | Bundesfinanzen – Gesamthaushalt (spese per settore, per natura, entrate, bilancio, freno all'indebitamento, indicatori) | https://www.efv.admin.ch/dam/de/sd-web/m9aWXSnsRvNO/bundeshaushalt_de.csv | CSV, 5 MB | 1990–2030. Nessuna colonna consuntivo/preventivo: dedotto dall'anno (≤2025 R, 2026–27 VA, ≥2028 FP). Aggiornato marzo e agosto. |
| ✅ | Bundesfinanzen – Institutionen (personale, consulenza, IT, FTE per unità amministrativa) | https://www.efv.admin.ch/dam/de/sd-web/LheAU2Ioeux7/institutionen_de.csv | CSV, 1 MB | 87 unità amministrative in 8 gruppi (7 dipartimenti più autorità e tribunali), 2007–2030 |
| ✅ | Beschaffungen ≥ 50 000 CHF der zentralen Bundesverwaltung (contratti 2021–2025, un file per anno) | https://opendata.swiss/de/organization/bkb · elenco dei file: https://www.bkb.admin.ch/de/bekanntgabe-der-beschaffungen-ab-50-000-franken | XLSX | Su opendata.swiss un dataset per anno di contratto (…-20211, -20221, -20231, -20241, -2025). File 2025 pubblicato il 18.09.2026. |
| 🟡 | Serie storiche XLSX del bilancio | https://www.efv.admin.ch/de/zeitreihen-bundeshaushalt | XLSX | Stesse serie del CSV; contengono anche il 2022 come pubblicato nel 2023 (prima della riesposizione). |
| 🟡 | Staatsrechnungen 1850–2014 (Archivio federale, LINDAS) | https://culture.ld.admin.ch/sfa/StateAccounts_Office/9 | SPARQL su https://lindas.admin.ch/query | Storico per ufficio/funzione. |
| 🟡 | Perequazione finanziaria (ZA/RA/LA per Cantone, 2008–2027) | https://www.efv.admin.ch/de/zahlen-tabellen-berichte-finanzausgleich | XLSX per anno | URL con hash che cambiano a ogni ripubblicazione. |
| 🔴 | Banca dati dei sussidi federali (~500 sussidi, ~43 mld) | https://www.data.finance.admin.ch/superset/dashboard/subventionen/ | Dashboard Superset | Nessun CSV/API; il Subventionsbericht è PDF. |
| 🔴 | Partecipazioni della Confederazione (22 enti) | https://www.efv.admin.ch/de/unternehmen-anstalten-bundes | HTML/PDF | Nessun elenco strutturato. |
| 🔴 | simap.ch (bandi e aggiudicazioni di tutti i livelli) | https://www.simap.ch/api-doc | API REST su richiesta | Serve richiesta di client API; nessun bulk. |

## Cantoni, Comuni, assicurazioni sociali (AFF Finanzstatistik)

Indice: https://www.efv.admin.ch/de/finanzstatistik-daten (anche /de/fs-daten, che reindirizza) · file sotto `https://www.data.finance.admin.ch/static/assets/datasets/fs_dashboard/` (il server rifiuta client senza header browser).

| Stato | Dataset | File | Granularità | Anni |
|---|---|---|---|---|
| ✅ | Standardauswertungen FS/GFS | `standardauswertung.csv` (+ `_codelist.csv`) | ogni Cantone (`ktn_zh`…), Comuni aggregati per Cantone (`gdn_zh`…), rami AS (`sv_ahv`, `sv_iv`, `sv_eo`, `sv_alv`, `sv_fl`, `sv_mat_ge`), `bund`, `staat` | 1990–2025 |
| ✅ | Comuni ≥ 5 000 abitanti | `gdn_ab_5000-d.csv` | 435 Comuni singoli, conto × funzione | 2008–2024 |
| 🟡 | Finanzierungsrechnung Sachgruppe × Funktion | `fir_art_funk.csv` (1,3 GB) | bund/ktn/gdn/sv + Cantone+Comuni per Cantone | 1990–2025 |
| ✅ | Hauptaggregate + previsioni (stato degli anni, debito, quote, PIL) | `main_extern.csv` | settori | 1990–2030; sostituito dall'AFF il 22.09.2026 (PIL e quote rivisti) |
| 🟡 | Tutte le tabelle XLSX | `zip-d.zip` (101 MB, 194 file) | idem | |

Nota: l'AFF rileva integralmente città, capoluoghi e Cantoni con < 30 Comuni; per gli altri Comuni stima campionaria. Non esiste un file ufficiale con tutti i ~2 100 Comuni singolarmente: servono i portali cantonali.

## Portali cantonali con conti dei Comuni riga per riga

| Cantone | File | Licenza |
|---|---|---|
| TG | https://data.tg.ch/api/explore/v2.1/catalog/datasets/dfs-fv-32/exports/csv (Gemeinderechnungen 2025; 2020–24: dfs-fv-25/28/29/30/31); Stato: dfs-fv-10, dfs-fv-27 | CC BY 4.0 / CC0 |
| LU | https://www.data.lustat.ch/gefis-lu-jr.csv (Comune × funzione × genere HRM2, 2019–2025) | terms_by_ask |
| ZH | https://www.web.statistik.zh.ch/ogd/data/KANTON_ZUERICH_gpfi_jahresrechung_politischeGemeinden.csv; ✅ usati: indicatori `KANTON_ZUERICH_<id>.csv` (378, 420–431, 828) e `steuerfuesse/kanton_zuerich_stf_timeseries.csv`. 🟡 Forza fiscale 2025: solo nel workbook https://daten.statistik.zh.ch/ogd/daten/ressourcen/KTZH_00000005_00001148.xlsx (foglio SKRAFT2025), l'indicatore 378 arriva al 2024 | terms_by |
| BS | https://statistik.bs.ch/files/webtabellen/t18-1-04.xlsx (Stato per funzione 1990–2025) | n.d. |
| GE | https://statistique.ge.ch/tel/domaines/18/18_02/T_18_02_1_12.xlsx (Stato), T_18_02_2_01.xlsx (45 Comuni) | n.d. |
| TI | https://m3.ti.ch/DFE/DR/USTAT/allegati/tabella/T_180203_11C.xlsx | n.d. |
| BE | http://finsta4.apps.be.ch/report/ (interattivo, export da UI) | – |
| AG | Gemeindefinanzen e-dossier XLSX (indicatori per Comune) | – |
| VD, SG | interattivi (MicroStrategy / STADA2), nessun bulk | – |

## Assicurazioni sociali (UFAS)

- GRSV tabelle 2–16 (XLSX, ultimo anno 2023): https://www.bsv.admin.ch/de/svs (es. `GRSV_CGAS_6.xlsx` per ramo).
- Alternativa già tidy e più recente: `standardauswertung.csv` con `hh = sv_*` (fino al 2025). ✅ usata.

## Sanità (UST)

- STAT-TAB API: `https://www.pxweb.bfs.admin.ch/api/v1/de/<cubo>/<cubo>.px` (POST JSON-stat2).
- Tabelle XLSX costi e finanziamento 1995–2020: https://dam-api.bfs.admin.ch/hub/api/dam/assets/22324820/master. Edizione 2024 pubblicata ma ID non trovato.

## Anagrafica e popolazione

- Comuni (AGVCH REST, CSV): https://www.agvchapp.bfs.admin.ch/api/communes/snapshot?date=01-01-2026 (2 110 Comuni, 26 Cantoni).
- Popolazione per Cantone/Comune (STATPOP, cubo `px-x-0102020000_201`): API https://www.pxweb.bfs.admin.ch/api/v1/de/px-x-0102020000_201/px-x-0102020000_201.px (una GET restituisce solo la descrizione); tabella completa: https://www.pxweb.bfs.admin.ch/DownloadFile.aspx?file=px-x-0102020000_201. Tutti gli anni sui confini indicati nel file («Gemeindestand per 6.4.2025»).
- Mutazioni dei Comuni (AGVCH, CSV): https://www.agvchapp.bfs.admin.ch/api/communes/mutations?startPeriod=02-01-2008&endPeriod=06-04-2025&includeTerritoryExchange=false ✅ usata per sapere quali Comuni sono stati aggregati dopo l'anno dei conti.

## Cosa esisteva già (e perché non basta)

- Datenportal AFF (Superset): aggregati, non open source, senza date di verifica.
- SRF "Persönlicher Steuerrechner": dati 2010–2016, repo fermo al 2019.
- Visualizzazioni cantonali (BE finanzviz, ZH Gemeindefinanzportrait, VD tableau de bord): un Cantone alla volta.
- IntelliProcure (Uni Berna): appalti, servizio non aperto.
