// Copies into web/public/data the files that are public under /data/. Every other snapshot is read at build time
// from data/snapshots (src/lib/data.ts) and is not published as a file: the full set is in the repository.
// If a file of the list is missing the script stops with an error, so the build fails instead of publishing a page without its data.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const data = join(here, "..", "..", "data");
const snap = join(data, "snapshots");
const dst = join(here, "..", "public", "data");

// The years the site builds a contract page for (/appalti/<year>/): the same list src/app/(it)/appalti/[year]/page.tsx reads.
const summary = join(snap, "bund-beschaffungen.json");
if (!existsSync(summary)) throw new Error(`[sync-data] missing ${summary}: cannot tell which procurement years the site expects`);
const years = Object.keys(JSON.parse(readFileSync(summary, "utf8")).data.years).sort();
if (!years.length) throw new Error("[sync-data] bund-beschaffungen.json lists no year");

/** [name under /data/, source file] */
const FILES = [
  // One per year: the browser fetches the full contract list of the year for the search (src/components/ProcTable.tsx).
  ...years.map((y) => [`bund-beschaffungen-${y}.json`, join(snap, `bund-beschaffungen-${y}.json`)]),
  // Municipal outlines, fetched by the browser for the national map (src/components/MuniMapCH.tsx).
  ["geo-grenzen.json", join(snap, "geo-grenzen.json")],
  // The register of sources (URL, dates, SHA-256 of every file): the provenance record of the site, kept at a public address.
  ["source-ledger.json", join(data, "source-ledger.json")],
];

const missing = FILES.filter(([, from]) => !existsSync(from)).map(([, from]) => from);
if (missing.length) throw new Error(`[sync-data] missing ${missing.length} file(s):\n  ${missing.join("\n  ")}`);

mkdirSync(dst, { recursive: true });
// public/data is not under git: drop what an earlier run copied and is no longer in the list.
const keep = new Set(FILES.map(([name]) => name));
for (const f of readdirSync(dst)) if (!keep.has(f)) rmSync(join(dst, f), { recursive: true });
let bytes = 0;
for (const [name, from] of FILES) { cpSync(from, join(dst, name)); bytes += statSync(from).size; }
console.log(`[sync-data] ${FILES.length} files (${(bytes / 1e6).toFixed(1)} MB) -> public/data: ${[...keep].join(", ")}`);
