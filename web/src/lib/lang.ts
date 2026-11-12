/** The two languages of the site. Italian lives at the root, English under /en/. */
export type Lang = "it" | "en";

// Server components read the language of the page being built through this resolver (set in lang-server.ts).
// Browser components never rely on it: they take the language from the address with useLang().
let resolver: () => Lang = () => "it";
export const setLangResolver = (f: () => Lang) => { resolver = f; };
export const currentLang = (): Lang => resolver();

/** Folder the site is served from ("" or "/spending"). next/link adds it by itself; plain <a> and fetch need it written out. */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** Address for a plain <a> or a fetch: language prefix plus the folder of the site. */
export const raw = (lang: Lang, path: string) => (path.startsWith("/") ? BASE + prefix(lang, path) : path);

/** "/cantoni/ti/" -> "/en/cantoni/ti/" on the English side. Links in the data are always written without the prefix. */
export const prefix = (lang: Lang, path: string) => (lang === "en" && path.startsWith("/") && !path.startsWith("/en/") ? `/en${path}` : path);
