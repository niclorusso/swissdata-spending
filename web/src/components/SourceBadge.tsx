import Link from "@/components/L";
import type { Meta } from "@/lib/data";
import { dateLong, dateTimeLong } from "@/lib/format";
import { getLang, T } from "@/lib/lang-server";
import { ZH_OFFICE } from "@/lib/labels";

/** Source line under a chart, as in the other SwissData sites: the publisher as «full name (acronym)», then « · » and the date written long
 *  (here the day the site last checked the file), then a link to the full entry in the register. */
/** `also`: a second source the figures depend on (the population, for values per inhabitant the site computes). */
export function SourceBadge({ meta, also }: { meta: Partial<Meta>; also?: Partial<Meta>; compact?: boolean }) {
  const en = getLang() === "en";
  return (
    <div className="sdf-source">
      {T("Fonte", "Source")}: <a href={meta.landing_url ?? meta.source_url} target="_blank" rel="noreferrer">{shortPublisher(meta.publisher, en)}</a>
      {also && <>; {T("popolazione", "population")}: <a href={also.landing_url ?? also.source_url} target="_blank" rel="noreferrer">{shortPublisher(also.publisher, en)}</a>; {T("divisione fatta dal sito", "division made by the site")}</>}
      {" "}· {T("verificato il", "checked on")} <span title={dateTimeLong(meta.checked_at)}>{dateLong(meta.checked_at)}</span>
      {meta.id && <> · <Link href={`/fonti/#${meta.id}`}>{T("dettagli e file", "details and file")}</Link></>}
    </div>
  );
}

const PUB_EN: [string, string][] = [["EFV", "Federal Finance Administration (FFA)"], ["BFS", "Federal Statistical Office (FSO)"], ["BKB", "Federal Procurement Conference (BKB)"], ["Sezione degli enti locali", "Canton Ticino, Local Authorities Section (SEL)"], ["Statistisches Amt des Kantons Zürich", ZH_OFFICE.en], ["Amt für Statistik und Daten des Kantons Zürich", ZH_OFFICE.en], ["swiss-maps", "swiss-maps (FSO, swisstopo boundaries)"]];
const PUB: Record<string, string> = { "Statistisches Amt des Kantons Zürich": ZH_OFFICE.it, "Amt für Statistik und Daten des Kantons Zürich": ZH_OFFICE.it };
/** "Eidgenössische Finanzverwaltung (EFV), Finanzstatistik / Amministrazione federale delle finanze (AFF), statistica finanziaria"
 *  -> "Amministrazione federale delle finanze (AFF)": the Italian half, the office only, one acronym (UST, not UST/BFS). */
function shortPublisher(p?: string, en = false): string {
  if (!p) return "–";
  if (en) return PUB_EN.find(([k]) => p.includes(k))?.[1] ?? p.split(" / ")[0].replace(/, via .*$/, "");
  const parts = p.split(" / ");
  const it = (parts.length > 1 ? parts[parts.length - 1] : p).replace(/, via .*$/, "");
  return PUB[it] ?? it.replace(/^(.*?\(([A-Z]+)(?:\/[A-Z]+)?\)).*$/, (_, name: string, acr: string) => name.replace(/\([A-Z/]+\)$/, `(${acr})`));
}
