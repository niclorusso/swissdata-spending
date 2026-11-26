// Copies into web/public/data only the snapshots that the browser fetches at run time:
//   bund-beschaffungen-<year>.json  (src/components/ProcTable.tsx)
//   geo-grenzen.json                (src/components/MuniMapCH.tsx)
// Every other snapshot is read at build time from data/snapshots (src/lib/data.ts) and is not published as a file.
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "..", "data", "snapshots");
const dst = join(here, "..", "public", "data");
const needed = (f) => /^bund-beschaffungen-\d{4}\.json$/.test(f) || f === "geo-grenzen.json";
mkdirSync(dst, { recursive: true });
// public/data is not under git: drop what an earlier run copied and is no longer needed.
for (const f of readdirSync(dst)) if (!needed(f)) rmSync(join(dst, f), { recursive: true });
let n = 0, bytes = 0;
for (const f of readdirSync(src).filter(needed)) {
  cpSync(join(src, f), join(dst, f));
  n++; bytes += statSync(join(src, f)).size;
}
if (!readdirSync(dst).includes("geo-grenzen.json")) throw new Error("[sync-data] geo-grenzen.json is missing from data/snapshots");
console.log(`[sync-data] ${n} snapshots (${(bytes / 1e6).toFixed(1)} MB) -> public/data`);
