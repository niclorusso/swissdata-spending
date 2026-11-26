import { currentLang, type Lang } from "@/lib/lang";

/**
 * Numbers, amounts and dates, the same way everywhere on the site.
 *
 * Italian follows the rule of the Federal Chancellery: thousands grouped with a narrow no-break space, only from five digits up
 * (803 250 but 4201), decimal comma (31,6), a no-break space before the per cent sign (31,6 %).
 * English: 803,250 and 31.6%.
 *
 * Nothing here uses the locale data of the machine: the site is built once into static pages and then runs in every browser,
 * and the two must print the same text. Grouping and decimals are written by hand.
 */
export const NNBSP = " "; // narrow no-break space: between groups of three digits
export const NBSP = " "; // no-break space: before %

const RULES: Record<Lang, { group: string; decimal: string; minGroup: number; pct: string }> = {
  it: { group: NNBSP, decimal: ",", minGroup: 5, pct: `${NBSP}%` },
  en: { group: ",", decimal: ".", minGroup: 4, pct: "%" },
};
const STATUS: Record<Lang, Record<string, string>> = {
  it: { R: "consuntivo", VA: "preventivo", FP: "piano finanziario", V: "dati parziali", P: "previsione" },
  en: { R: "actuals", VA: "budget", FP: "financial plan", V: "partial data", P: "forecast" },
};
export type MapUnit = "chf" | "num" | "pct";

/** Digits of a non-negative whole number in groups of three: "803250" -> "803 250". Below `minGroup` digits nothing is split. */
function groupDigits(digits: string, sep: string, minGroup: number): string {
  if (digits.length < minGroup) return digits;
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += sep;
    out += digits[i];
  }
  return out;
}

/** A number with exactly `digits` decimals, written for `lang`. -0 is written 0. */
export function formatNumber(n: number, digits: number, lang: Lang): string {
  const r = RULES[lang];
  const fixed = Math.abs(n).toFixed(digits); // plain digits and a point, the same on every machine
  const [int, dec] = fixed.split(".");
  const zero = Number(fixed) === 0;
  return `${n < 0 && !zero ? "-" : ""}${groupDigits(int, r.group, r.minGroup)}${dec ? r.decimal + dec : ""}`;
}

/** Reads back a figure written by formatNumber (used by the count-up effect). */
export function parseNumber(text: string, lang: Lang): number {
  const r = RULES[lang];
  return Number(text.split(r.group).join("").replace(r.decimal, "."));
}
/** The first figure in a text as formatNumber writes it, e.g. "29 051" in "29 051 CHF". */
export const numberPattern = (lang: Lang): RegExp => (lang === "en" ? /\d[\d,]*(?:\.\d+)?/ : /\d[\d ]*(?:,\d+)?/);

const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** Day, month, year, hour and minute in Switzerland, as two-digit strings. Only the time zone is taken from the machine, not the wording. */
function swissParts(d: Date): Record<string, string> {
  return Object.fromEntries(parts.formatToParts(d).map((p) => [p.type, p.value]));
}

/** Number and date formatting for one language. */
export function makeFmt(lang: Lang) {
  const en = lang === "en";
  const fmt = (n: number, d: number) => formatNumber(n, d, lang);
  const none = (v: number | null | undefined): v is null | undefined => v === null || v === undefined || Number.isNaN(v);
  /** CHF in mld / mio (bn / mn in English): 87,6 mld CHF, 312 mio CHF, 48 500 CHF */
  const chf = (v: number | null | undefined, opts: { digits?: number; unit?: boolean } = {}): string => {
    if (none(v)) return "–";
    const unit = opts.unit ?? true;
    const a = Math.abs(v);
    if (a >= 1e9) return `${fmt(v / 1e9, opts.digits ?? (a >= 1e11 ? 0 : 1))} ${en ? "bn" : "mld"}${unit ? " CHF" : ""}`;
    if (a >= 1e6) return `${fmt(v / 1e6, opts.digits ?? (a >= 1e8 ? 0 : 1))} ${en ? "mn" : "mio"}${unit ? " CHF" : ""}`;
    return `${fmt(v, opts.digits ?? 0)}${unit ? " CHF" : ""}`;
  };
  const chfFull = (v: number | null | undefined): string => (none(v) ? "–" : fmt(v, 0) + " CHF");
  const num = (v: number | null | undefined, digits = 0): string => (none(v) ? "–" : fmt(v, digits));
  /** 31,6 % in Italian, 31.6% in English */
  const pct = (v: number | null | undefined, digits = 1): string => (none(v) ? "–" : fmt(v, digits) + RULES[lang].pct);
  /** One decimal at most, no trailing zero: 39,9 and 20 */
  const share = (v: number): string => fmt(v, Math.round(v * 10) % 10 === 0 ? 0 : 1);
  /** The same with the per cent sign: 39,9 % */
  const sharePct = (v: number): string => share(v) + RULES[lang].pct;
  /** A whole number of per cent, or one decimal when it has one: 77 %, 111,5 % */
  const pctAuto = (v: number): string => fmt(v, v % 1 ? 1 : 0) + RULES[lang].pct;
  /** 26.11.2026, the day in Switzerland */
  const date = (iso: string | null | undefined): string => {
    if (!iso) return "–";
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) { const [y, m, d] = iso.split("-"); return `${d}.${m}.${y}`; } // a plain day has no time zone
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const p = swissParts(d);
    return `${p.day}.${p.month}.${p.year}`;
  };
  const dateTime = (iso: string | null | undefined): string => {
    if (!iso) return "–";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const p = swissParts(d);
    return `${p.day}.${p.month}.${p.year}, ${p.hour}:${p.minute} (${en ? "Swiss time" : "ora svizzera"})`;
  };
  /** "1 contratto" / "12 contratti" */
  const plural = (n: number, one: string, many: string): string => `${num(n)} ${n === 1 ? one : many}`;
  const formatUnit = (v: number, unit: MapUnit) => (unit === "chf" ? chf(v) : unit === "pct" ? pctAuto(v) : num(v));
  const status = (code: string | undefined): string => (code ? STATUS[lang][code] ?? "" : "");
  return { chf, chfFull, num, pct, share, sharePct, pctAuto, date, dateTime, plural, formatUnit, status };
}

// Server components: the language is the one of the page being built.
type F = ReturnType<typeof makeFmt>;
const cur = () => makeFmt(currentLang());
export const chf: F["chf"] = (...a) => cur().chf(...a);
export const chfFull: F["chfFull"] = (...a) => cur().chfFull(...a);
export const num: F["num"] = (...a) => cur().num(...a);
export const pct: F["pct"] = (...a) => cur().pct(...a);
export const share: F["share"] = (...a) => cur().share(...a);
export const sharePct: F["sharePct"] = (...a) => cur().sharePct(...a);
export const pctAuto: F["pctAuto"] = (...a) => cur().pctAuto(...a);
export const date: F["date"] = (...a) => cur().date(...a);
export const dateTime: F["dateTime"] = (...a) => cur().dateTime(...a);
export const plural: F["plural"] = (...a) => cur().plural(...a);
export const formatUnit: F["formatUnit"] = (...a) => cur().formatUnit(...a);
export const status: F["status"] = (...a) => cur().status(...a);
