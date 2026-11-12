import { currentLang, type Lang } from "@/lib/lang";

const loc = "it-CH";
/** Node writes the thousands separator as ’ and some browsers as ': one character everywhere, so server and browser print the same text. */
const same = (s: string) => s.replace(/'/g, "’");
const STATUS: Record<Lang, Record<string, string>> = {
  it: { R: "consuntivo", VA: "preventivo", FP: "piano finanziario", V: "dati parziali", P: "previsione" },
  en: { R: "actuals", VA: "budget", FP: "financial plan", V: "partial data", P: "forecast" },
};
export type MapUnit = "chf" | "num" | "pct";

/** Number and date formatting for one language. Figures keep the Swiss form (29’051, 86.4) in both; only the words change. */
export function makeFmt(lang: Lang) {
  const en = lang === "en";
  const fmt = (n: number, d: number) => same(n.toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: "always" }));
  /** CHF in mld / mio (bn / mn in English): 87.6 mld CHF, 312 mio CHF, 48’500 CHF */
  const chf = (v: number | null | undefined, opts: { digits?: number; unit?: boolean } = {}): string => {
    if (v === null || v === undefined || Number.isNaN(v)) return "–";
    const unit = opts.unit ?? true;
    const a = Math.abs(v);
    if (a >= 1e9) return `${fmt(v / 1e9, opts.digits ?? (a >= 1e11 ? 0 : 1))} ${en ? "bn" : "mld"}${unit ? " CHF" : ""}`;
    if (a >= 1e6) return `${fmt(v / 1e6, opts.digits ?? (a >= 1e8 ? 0 : 1))} ${en ? "mn" : "mio"}${unit ? " CHF" : ""}`;
    return `${fmt(v, opts.digits ?? 0)}${unit ? " CHF" : ""}`;
  };
  const chfFull = (v: number | null | undefined): string => (v === null || v === undefined ? "–" : fmt(v, 0) + " CHF");
  const num = (v: number | null | undefined, digits = 0): string => (v === null || v === undefined || Number.isNaN(v) ? "–" : fmt(v, digits));
  const pct = (v: number | null | undefined, digits = 1): string => (v === null || v === undefined || Number.isNaN(v) ? "–" : `${num(v, digits)} %`);
  /** One decimal at most, no trailing zero: 39.9, 20 */
  const share = (v: number): string => same(v.toLocaleString(loc, { maximumFractionDigits: 1 }));
  const date = (iso: string | null | undefined): string => {
    if (!iso) return "–";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(loc, { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const dateTime = (iso: string | null | undefined): string => {
    if (!iso) return "–";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(loc, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zurich" }) + " (CET)";
  };
  /** "1 contratto" / "12 contratti" */
  const plural = (n: number, one: string, many: string): string => `${num(n)} ${n === 1 ? one : many}`;
  const formatUnit = (v: number, unit: MapUnit) => (unit === "chf" ? chf(v) : unit === "pct" ? `${num(v, v % 1 ? 1 : 0)} %` : num(v));
  const status = (code: string | undefined): string => (code ? STATUS[lang][code] ?? "" : "");
  return { chf, chfFull, num, pct, share, date, dateTime, plural, formatUnit, status };
}

// Server components: the language is the one of the page being built.
type F = ReturnType<typeof makeFmt>;
const cur = () => makeFmt(currentLang());
export const chf: F["chf"] = (...a) => cur().chf(...a);
export const chfFull: F["chfFull"] = (...a) => cur().chfFull(...a);
export const num: F["num"] = (...a) => cur().num(...a);
export const pct: F["pct"] = (...a) => cur().pct(...a);
export const share: F["share"] = (...a) => cur().share(...a);
export const date: F["date"] = (...a) => cur().date(...a);
export const dateTime: F["dateTime"] = (...a) => cur().dateTime(...a);
export const plural: F["plural"] = (...a) => cur().plural(...a);
export const formatUnit: F["formatUnit"] = (...a) => cur().formatUnit(...a);
export const status: F["status"] = (...a) => cur().status(...a);
