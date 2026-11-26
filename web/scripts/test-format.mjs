// Table of cases for src/lib/format.ts, the one place where the site writes numbers.
// The file is TypeScript: it is turned into JavaScript here with the compiler the project already has, then imported and checked.
// Run: pnpm test (also part of `make check`). It stops with exit code 1 at the first wrong case.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "src", "lib", "format.ts"), "utf8")
  .replace('import { currentLang, type Lang } from "@/lib/lang";', 'type Lang = "it" | "en"; const currentLang = (): Lang => "it";');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const tmp = join(here, "..", "node_modules", ".cache", "format-test");
mkdirSync(tmp, { recursive: true });
writeFileSync(join(tmp, "format.mjs"), js);
const { makeFmt, formatNumber, parseNumber, numberPattern } = await import(pathToFileURL(join(tmp, "format.mjs")).href + `?t=${Date.now()}`);

const N = " ", B = " "; // narrow no-break space, no-break space
const it = makeFmt("it"), en = makeFmt("en");
/** [what, got, expected] */
const cases = [
  // whole numbers: Italian groups only from five digits, English from four
  ["it num 0", it.num(0), "0"], ["en num 0", en.num(0), "0"],
  ["it num 999", it.num(999), "999"], ["en num 999", en.num(999), "999"],
  ["it num 4201", it.num(4201), "4201"], ["en num 4201", en.num(4201), "4,201"],
  ["it num 12345", it.num(12345), `12${N}345`], ["en num 12345", en.num(12345), "12,345"],
  ["it num 803250", it.num(803250), `803${N}250`], ["en num 803250", en.num(803250), "803,250"],
  ["it num 29051", it.num(29051), `29${N}051`], ["en num 29051", en.num(29051), "29,051"],
  ["it num 9051029", it.num(9051029), `9${N}051${N}029`], ["en num 9051029", en.num(9051029), "9,051,029"],
  ["it num 9999.6 rounds to five digits", it.num(9999.6), `10${N}000`],
  // per cent
  ["it pct 31.6", it.pct(31.6), `31,6${B}%`], ["en pct 31.6", en.pct(31.6), "31.6%"],
  ["it pct 30.54 one decimal", it.pct(30.54), `30,5${B}%`], ["en pct 0 digits", en.pct(18.2, 0), "18%"],
  ["it share 39.9", it.sharePct(39.9), `39,9${B}%`], ["it share 20.0", it.sharePct(20), `20${B}%`], ["en share 39.96", en.sharePct(39.96), "40%"],
  ["it pctAuto 77", it.pctAuto(77), `77${B}%`], ["it pctAuto 111.48", it.pctAuto(111.48), `111,5${B}%`], ["en pctAuto 112", en.pctAuto(112), "112%"],
  // negative and zero
  ["it num -5.5", it.num(-5.5, 1), "-5,5"], ["en num -5.5", en.num(-5.5, 1), "-5.5"],
  ["it num -0.04 is 0,0 without sign", it.num(-0.04, 1), "0,0"], ["it num -12345", it.num(-12345), `-12${N}345`],
  // francs
  ["it chf 263 bn", it.chf(263e9), "263 mld CHF"], ["en chf 263 bn", en.chf(263e9), "263 bn CHF"],
  ["it chf 262.9 bn one decimal", it.chf(262_942_807_192, { digits: 1 }), "262,9 mld CHF"], ["en same", en.chf(262_942_807_192, { digits: 1 }), "262.9 bn CHF"],
  ["it chf 5.46 bn", it.chf(5.46e9, { digits: 2 }), "5,46 mld CHF"], ["en chf 5.46 bn", en.chf(5.46e9, { digits: 2 }), "5.46 bn CHF"],
  ["it chf 5.46 bn default", it.chf(5_458_656_056), "5,5 mld CHF"],
  ["it chf 520 mio", it.chf(519.5e6), "520 mio CHF"], ["en chf 2.0 mn", en.chf(2_019_659), "2.0 mn CHF"], ["it chf 2.0 mio", it.chf(2_019_659), "2,0 mio CHF"],
  ["it chf 29051", it.chf(29051), `29${N}051 CHF`], ["en chf 29051", en.chf(29051), "29,051 CHF"], ["it chf 8315", it.chf(8315), "8315 CHF"],
  ["it chf -5.5 bn", it.chf(-5.4783e9), "-5,5 mld CHF"], ["it chf no unit", it.chf(60.9e9, { unit: false }), "60,9 mld"],
  ["it chfFull", it.chfFull(1234567), `1${N}234${N}567 CHF`], ["missing value", it.chf(null), "–"], ["NaN", en.num(NaN), "–"],
  ["it plural", it.plural(9603, "contratto", "contratti"), "9603 contratti"], ["en plural", en.plural(9603, "contract", "contracts"), "9,603 contracts"],
  // dates: the day in Switzerland, whatever the time zone of the machine
  ["date from UTC evening", it.date("2026-09-21T22:30:00+00:00"), "22.09.2026"], ["date plain day", en.date("2025-01-01"), "01.01.2025"],
  ["dateTime", it.dateTime("2026-11-26T12:22:53+00:00"), "26.11.2026, 13:22 (ora svizzera)"],
  // the count-up effect reads figures back
  ["parse it", String(parseNumber(`9${N}051${N}029`, "it")), "9051029"], ["parse it decimal", String(parseNumber("31,6", "it")), "31.6"], ["parse en", String(parseNumber("29,051.5", "en")), "29051.5"],
  ["pattern it", `29${N}051 CHF`.match(numberPattern("it"))[0], `29${N}051`], ["pattern en", "30.5% of GDP".match(numberPattern("en"))[0], "30.5"],
  ["formatNumber", formatNumber(1234.5, 1, "it"), "1234,5"],
];
const show = (s) => s.replaceAll(N, "[NNBSP]").replaceAll(B, "[NBSP]");
let bad = 0;
for (const [what, got, want] of cases) {
  if (got !== want) { bad++; console.error(`FAIL ${what}: got "${show(got)}", expected "${show(want)}"`); }
}
// No runtime locale data: the formatter must not call the locale-dependent methods.
for (const banned of ["toLocaleString", "toLocaleDateString", "NumberFormat"]) if (src.includes(banned)) { bad++; console.error(`FAIL format.ts uses ${banned}`); }
if (bad) { console.error(`[test-format] ${bad} of ${cases.length} cases failed`); process.exit(1); }
console.log(`[test-format] ${cases.length} cases ok`);
if (process.argv.includes("--table")) for (const [what, got] of cases) console.log(`${what.padEnd(40)} ${show(got)}`);
