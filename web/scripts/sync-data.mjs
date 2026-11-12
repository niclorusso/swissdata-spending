// Copies the pipeline snapshots into web/public/data so client components can fetch the big ones.
import { cpSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "..", "data", "snapshots");
const dst = join(here, "..", "public", "data");
mkdirSync(dst, { recursive: true });
let n = 0, bytes = 0;
for (const f of readdirSync(src)) {
  if (!f.endsWith(".json")) continue;
  cpSync(join(src, f), join(dst, f));
  n++; bytes += statSync(join(src, f)).size;
}
cpSync(join(here, "..", "..", "data", "source-ledger.json"), join(dst, "source-ledger.json"));
console.log(`[sync-data] ${n} snapshots (${(bytes / 1e6).toFixed(1)} MB) -> public/data`);
