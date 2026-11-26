# web

Il sito di SwissData · Spesa pubblica (https://spending.swissdata-platform.ch): Next.js 16, React 19, TypeScript, Tailwind 4, pnpm.

## Avvio

Requisiti: Node ≥ 20 e pnpm.

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # sito statico in out/
pnpm start    # serve out/ in locale (npx serve)
pnpm lint
npx tsc --noEmit
```

Dalla radice del repository gli stessi comandi sono `make web`, `make dev`, `make build` e `make check` (lint, `next typegen`, tsc).

## Dati

Il sito non ha database. Le pagine leggono in fase di build i file `../data/snapshots/*.json` e `../data/source-ledger.json`, generati da `../pipeline/etl` (`make etl`); vedi `src/lib/data.ts`.

`scripts/sync-data.mjs` copia in `public/data/`, prima di `pnpm dev` e `pnpm build`, solo questi file:

- `bund-beschaffungen-<anno>.json`: l'elenco dei contratti di un anno, che il browser scarica (`src/components/ProcTable.tsx`);
- `geo-grenzen.json`: i confini per la mappa dei Comuni, che il browser scarica (`src/components/MuniMapCH.tsx`);
- `source-ledger.json`: il registro delle fonti, pubblico all'indirizzo `/data/source-ledger.json`.

Se uno di questi file manca, lo script si ferma con un errore e la build fallisce. Gli altri snapshot non sono pubblicati come file: sono in `../data/snapshots`.

`public/data/` non è sotto git.

## Pubblicazione

`next.config.ts` ha `output: "export"`: `pnpm build` scrive un sito statico in `out/`. Netlify lo compila e lo pubblica secondo `../netlify.toml` (base `web`, comando `pnpm build`, cartella `out`, Node 20).

Con `BASE_PATH=/percorso pnpm build` il sito è costruito per stare sotto quel percorso invece che alla radice.

Le pagine italiane sono in `src/app/(it)`; quelle inglesi in `src/app/(en)/en` riusano le stesse pagine.
