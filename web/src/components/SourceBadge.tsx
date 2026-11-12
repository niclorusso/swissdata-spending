import Link from "@/components/L";
import type { Meta } from "@/lib/data";
import { date, dateTime } from "@/lib/format";
import { getLang, T } from "@/lib/lang-server";

/** Source line under a chart: who publishes it, when we last checked, and a link to the full entry in the register. */
export function SourceBadge({ meta }: { meta: Partial<Meta>; compact?: boolean }) {
  return (
    <div className="mt-3 text-xs text-faint leading-relaxed">
      {T("Fonte", "Source")}: <a className="underline hover:text-accent" href={meta.landing_url ?? meta.source_url} target="_blank" rel="noreferrer">{shortPublisher(meta.publisher, getLang() === "en")}</a>
      {" "}· {T("verificato il", "checked on")} <span title={dateTime(meta.checked_at)}>{date(meta.checked_at)}</span>
      {meta.id && <> · <Link className="underline hover:text-accent" href={`/fonti/#${meta.id}`}>{T("dettagli e file", "details and file")}</Link></>}
    </div>
  );
}

const PUB_EN: [string, string][] = [["EFV", "Federal Finance Administration (FFA)"], ["BFS", "Federal Statistical Office (FSO)"], ["BKB", "Federal Procurement Conference (BKB)"], ["Sezione degli enti locali", "Canton Ticino, Local Authorities Section (SEL)"], ["Statistisches Amt des Kantons Zürich", "Statistical Office of the Canton of Zurich"], ["swiss-maps", "swiss-maps (FSO, swisstopo boundaries)"]];
const PUB: Record<string, string> = { "Statistisches Amt des Kantons Zürich": "Ufficio di statistica del Canton Zurigo" };
/** "Eidgenössische Finanzverwaltung (EFV) / Amministrazione federale delle finanze (AFF)" -> the Italian half. */
function shortPublisher(p?: string, en = false): string {
  if (!p) return "–";
  if (en) return PUB_EN.find(([k]) => p.includes(k))?.[1] ?? p.split(" / ")[0].replace(/, via .*$/, "");
  const parts = p.split(" / ");
  const it = (parts.length > 1 ? parts[parts.length - 1] : p).replace(/, via .*$/, "");
  return PUB[it] ?? it;
}
