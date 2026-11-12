import { cache } from "react";
import { prefix, raw, setLangResolver, type Lang } from "@/lib/lang";

// One value per page being rendered (React keeps `cache` separate for each page), so two pages built at the same time never mix languages.
const store = cache(() => ({ lang: "it" as Lang }));
export const setLang = (l: Lang) => { store().lang = l; };
export const getLang = (): Lang => store().lang;
setLangResolver(getLang);

/** Pick the text for the language of the page: T("Comuni", "Municipalities"). Call it while rendering, never at module level. */
export const T = <A, B>(it: A, en: B): A | B => (getLang() === "en" ? en : it);
/** Internal link in the language of the page, for next/link. */
export const h = (path: string) => prefix(getLang(), path);
/** The same for a plain <a>. */
export const ha = (path: string) => raw(getLang(), path);
