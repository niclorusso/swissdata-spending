import { BASE } from "@/lib/lang";
import { SITE } from "@/lib/site";

/** Full address of a page of the site (for social cards, the sitemap and robots.txt): its own domain, or the folder of the
 *  main site when it is built with BASE_PATH. `path` already carries the language prefix. */
export const absolute = (path: string) => `${BASE ? SITE.parentUrl + BASE : SITE.url}${path}`;
