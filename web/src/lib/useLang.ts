"use client";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { makeFmt } from "@/lib/format";
import { prefix, raw, type Lang } from "@/lib/lang";

/** Language of the page, read from the address: everything under /en/ is English. */
export function useLang(): Lang {
  const p = usePathname() ?? "";
  return p === "/en" || p.startsWith("/en/") ? "en" : "it";
}

/** Formatters, text picker and link prefix bound to the language of the page, for browser components. */
export function useL() {
  const lang = useLang();
  return useMemo(() => ({ lang, en: lang === "en", ...makeFmt(lang), T: <A, B>(it: A, en: B): A | B => (lang === "en" ? en : it), /** for plain <a> */ h: (path: string) => raw(lang, path), /** for next/link and the router */ link: (path: string) => prefix(lang, path) }), [lang]);
}
