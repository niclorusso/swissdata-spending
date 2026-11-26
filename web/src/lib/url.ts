import { BASE } from "@/lib/lang";
import { SITE } from "@/lib/site";

/** The main SwissData site: with BASE_PATH=/spending this site is served in a folder of it (next.config.ts). */
const PARENT = "https://swissdata-platform.ch";

/** Full address of a page of the site (for social cards, the sitemap and robots.txt): its own domain, or the folder of the
 *  main site when it is built with BASE_PATH. `path` already carries the language prefix. */
export const absolute = (path: string) => `${BASE ? PARENT + BASE : SITE.url}${path}`;
