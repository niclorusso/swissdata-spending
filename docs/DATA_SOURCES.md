# Fonti dati (mappa, verificata il 2026-09-09)

Legenda: ✅ usata nel sito · 🟡 machine-readable, non ancora integrata · 🔴 solo PDF/dashboard, nessun file aperto.

## Confederazione

| Stato | Dataset | URL | Formato | Note |
|---|---|---|---|---|
| ✅ | Bundesfinanzen – Gesamthaushalt (spese per settore, per natura, entrate, bilancio, freno all'indebitamento, indicatori) | https://www.efv.admin.ch/dam/de/sd-web/m9aWXSnsRvNO/bundeshaushalt_de.csv | CSV, 5 MB | 1990–2030. Nessuna colonna consuntivo/preventivo: dedotto dall'anno (≤2025 R, 2026–27 VA, ≥2028 FP). Aggiornato marzo e agosto. |
| ✅ | Bundesfinanzen – Institutionen (personale, consulenza, IT, FTE per unità amministrativa) | https://www.efv.admin.ch/dam/de/sd-web/LheAU2Ioeux7/institutionen_de.csv | CSV, 1 MB | 95 unità, 2007–2030 |
| ✅ | Beschaffungen ≥ 50 000 CHF der zentralen Bundesverwaltung (contratti 2021, 2022, 2023) | https://opendata.swiss/de/organization/bkb | XLSX | Il dataset "2024" contiene i contratti 2023. |
| ✅ | Verträge ab 50 000 Franken 2024 | https://www.bkb.admin.ch/dam/de/sd-web/mhYFV5ZlNhYV/Vertr%C3%A4ge%20ab%2050%20000%20Franken%202024%20DE.xlsx | XLSX | Non ancora su opendata.swiss. |
| 🟡 | Serie storiche XLSX del bilancio | https://www.efv.admin.ch/de/zeitreihen-bundeshaushalt | XLSX | Ridondanti rispetto al CSV. |
| 🟡 | Staatsrechnungen 1850–2014 (Archivio federale, LINDAS) | https://culture.ld.admin.ch/sfa/StateAccounts_Office/9 | SPARQL su https://lindas.admin.ch/query | Storico per ufficio/funzione. |
| 🟡 | Perequazione finanziaria (ZA/RA/LA per Cantone, 2008–2027) | https://www.efv.admin.ch/de/zahlen-tabellen-berichte-finanzausgleich | XLSX per anno | URL con hash che cambiano a ogni ripubblicazione. |
| 🔴 | Banca dati dei sussidi federali (~500 sussidi, ~43 mld) | https://www.data.finance.admin.ch/superset/dashboard/subventionen/ | Dashboard Superset | Nessun CSV/API; il Subventionsbericht è PDF. |
| 🔴 | Partecipazioni della Confederazione (22 enti) | https://www.efv.admin.ch/de/unternehmen-anstalten-bundes | HTML/PDF | Nessun elenco strutturato. |
| 🔴 | simap.ch (bandi e aggiudicazioni di tutti i livelli) | https://www.simap.ch/api-doc | API REST su richiesta | Serve richiesta di client API; nessun bulk. |

## Cantoni, Comuni, assicurazioni sociali (AFF Finanzstatistik)

Indice: https://www.efv.admin.ch/de/fs-daten · file sotto `https://www.data.finance.admin.ch/static/assets/datasets/fs_dashboard/` (il server rifiuta client senza header browser).

| Stato | Dataset | File | Granularità | Anni |
|---|---|---|---|---|
| ✅ | Standardauswertungen FS/GFS | `standardauswertung.csv` (+ `_codelist.csv`) | ogni Cantone (`ktn_zh`…), Comuni aggregati per Cantone (`gdn_zh`…), rami AS (`sv_ahv`, `sv_iv`, `sv_eo`, `sv_alv`, `sv_fl`, `sv_mat_ge`), `bund`, `staat` | 1990–2025 |
| ✅ | Comuni ≥ 5 000 abitanti | `gdn_ab_5000-d.csv` | 432 Comuni singoli, conto × funzione | 2008–2023 |
| 🟡 | Finanzierungsrechnung Sachgruppe × Funktion | `fir_art_funk.csv` (1,3 GB) | bund/ktn/gdn/sv + Cantone+Comuni per Cantone | 1990–2025 |
| 🟡 | Hauptaggregate + previsioni | `main_extern.csv` | settori | 1990–2025+ |
| 🟡 | Tutte le tabelle XLSX | `zip-d.zip` (101 MB, 194 file) | idem | |

Nota: l'AFF rileva integralmente città, capoluoghi e Cantoni con < 30 Comuni; per gli altri Comuni stima campionaria. Non esiste un file ufficiale con tutti i ~2 100 Comuni singolarmente: servono i portali cantonali.

## Portali cantonali con conti dei Comuni riga per riga

| Cantone | File | Licenza |
|---|---|---|
| TG | https://data.tg.ch/api/explore/v2.1/catalog/datasets/dfs-fv-32/exports/csv (Gemeinderechnungen 2025; 2020–24: dfs-fv-25/28/29/30/31); Stato: dfs-fv-10, dfs-fv-27 | CC BY 4.0 / CC0 |
| LU | https://www.data.lustat.ch/gefis-lu-jr.csv (Comune × funzione × genere HRM2, 2019–2025) | terms_by_ask |
| ZH | https://www.web.statistik.zh.ch/ogd/data/KANTON_ZUERICH_gpfi_jahresrechung_politischeGemeinden.csv | terms_by |
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
- Popolazione per Cantone/Comune (STATPOP, cubo `px-x-0102020000_201`): https://www.pxweb.bfs.admin.ch/api/v1/de/px-x-0102020000_201/px-x-0102020000_201.px

## Cosa esisteva già (e perché non basta)

- Datenportal AFF (Superset): aggregati, non open source, senza date di verifica.
- SRF "Persönlicher Steuerrechner": dati 2010–2016, repo fermo al 2019.
- Visualizzazioni cantonali (BE finanzviz, ZH Gemeindefinanzportrait, VD tableau de bord): un Cantone alla volta.
- IntelliProcure (Uni Berna): appalti, servizio non aperto.
