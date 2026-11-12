# SwissData · Spesa pubblica

**La spesa pubblica svizzera in un unico posto, con la fonte accanto a ogni numero.**

I dati sulla spesa pubblica svizzera sono online da anni: bilancio della Confederazione (AFF), appalti federali (BKB), statistica finanziaria di Cantoni e Comuni (AFF), assicurazioni sociali (UFAS). Il problema è che sono sparsi in decine di CSV, XLSX e dashboard diverse. Questo progetto li scarica dai file ufficiali, li riconta riga per riga con script open source e li pubblica in un unico sito statico, mettendo accanto a ogni numero **la fonte, la data del dato, la data di pubblicazione, la data del download e la data dell'ultima verifica**.

Ispirato a [France Transparence](https://francetransparence.fr).

## Cosa c'è dentro

| Sezione | Dati | Fonte | Anni |
|---|---|---|---|
| Confederazione | Spese per 13 settori di compito e sotto-settori, spese per natura, entrate per imposta, debito, freno all'indebitamento | AFF, `bundeshaushalt_de.csv` (OGD) | 1990–2030 (consuntivi ≤ 2025, poi preventivo e piano finanziario, sempre marcati) |
| Uffici federali | Personale, consulenza esterna, informatica e posti a tempo pieno per 95 unità amministrative | AFF, `institutionen_de.csv` (OGD) | 2007–2030 |
| Appalti | Tutti i contratti ≥ 50 000 CHF dell'Amministrazione federale centrale: committente, fornitore, oggetto, procedura, volume | BKB (art. 27 OAPub), XLSX annuali | 2021–2024 (~38 000 contratti) |
| Cantoni e Comuni | Statistica finanziaria: spese per funzione e natura per ogni Cantone, Comuni aggregati per Cantone, rami delle assicurazioni sociali; 432 Comuni ≥ 5 000 abitanti singolarmente | AFF Finanzstatistik (modello FS) | 1990–2025 |

| Comuni di Ticino e Zurigo | Tutti i Comuni, uno per uno: spese, debito netto, moltiplicatore, investimenti, risultato | TI: Sezione degli enti locali; ZH: Statistisches Amt | 2024 (ZH: serie dal 2019) |

Quali anni sono consuntivo e quali previsione è letto dal file dell'AFF (`main_extern.csv`, colonna `source`), non scritto a mano. Le mappe usano i confini UST/GEOSTAT via swiss-maps.

Il registro completo, con URL, hash SHA-256 e date, è su `/fonti` e in [`data/source-ledger.json`](data/source-ledger.json).

## Come funziona

```
pipeline/etl/*.py   →   data/snapshots/*.json   →   web/ (Next.js, export statico)
   scarica + riconta         un file per dataset,        legge i JSON in build,
   (Python, uv)              con blocco `meta`           nessun database
```

Ogni snapshot è `{ "meta": {...}, "data": {...} }`. Il blocco `meta` contiene: `publisher`, `source_url`, `landing_url`, `license`, `frequency`, `data_date` (periodo di riferimento dichiarato dalla fonte), `published_at` (Last-Modified del server o data dichiarata), `retrieved_at`, `checked_at`, `sha256` del file originale. Il componente `SourceBadge` lo mostra sotto ogni blocco di numeri.

Principi:

1. **Nessun numero copiato a mano.** Tutto passa da uno script rieseguibile.
2. **Consuntivo ≠ preventivo.** Gli anni di preventivo e piano finanziario sono marcati ovunque (banda grigia nei grafici, etichetta nei selettori).
3. **Cadenza della fonte ≠ frequenza del controllo.** Un dato annuale può essere stato riverificato ieri; le due date sono separate.
4. **Se la fonte non è scaricabile, lo diciamo.** Sussidi e partecipazioni oggi non hanno un file aperto: sono nella lista "manca ancora", non inventati.

## Avvio

Requisiti: Node ≥ 20, pnpm, Python ≥ 3.13, [uv](https://docs.astral.sh/uv/).

```bash
make etl      # scarica le fonti (cache in data/raw) e rigenera data/snapshots
make web      # pnpm install
make dev      # http://localhost:3000
make build    # sito statico in web/out
```

`ETL_FORCE=1 make etl` (o `make etl-force`) riscarica tutto ignorando la cache.

## Contribuire

Manca parecchio. In ordine di impatto:

- **Sussidi federali per beneficiario**: l'AFF pubblica solo una dashboard Superset; serve un export o una richiesta ufficiale.
- **Appalti cantonali e comunali**: simap.ch ha un'API JSON su richiesta (nessun bulk aperto).
- **Partecipazioni pubbliche**: FFS, Posta, Swisscom, RUAG, aziende elettriche cantonali; nessun elenco strutturato.
- **Conti comunali riga per riga** dai portali cantonali migliori: TG (`data.tg.ch`, CC0), LU (`gefis-lu-jr.csv`), ZH (`gpfi_jahresrechung_politischeGemeinden.csv`), BS, GE, TI.
- **Sanità** (UST, costi e finanziamento) e **perequazione finanziaria** (AFF, XLSX annuali).
- Versioni **DE** e **FR** dell'interfaccia.

Per aggiungere una fonte: uno script in `pipeline/etl/` che usa `fetch()` e `write_snapshot()` da `etl/common.py`, una riga in `STEPS` di `etl/run_all.py`, una pagina o un blocco in `web/src/app/`. Vedi [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) per le fonti già mappate (anche quelle non ancora usate).

## Licenza

Codice: [MIT](LICENSE). Dati: restano sotto le licenze dei rispettivi editori (opendata.swiss `terms_by` / `terms_open`), citati in ogni snapshot.

Progetto indipendente, non affiliato alla Confederazione.
