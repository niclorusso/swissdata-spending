import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { MetadataRoute } from "next";
import { allProfiles } from "@/lib/comuni";
import { procurement } from "@/lib/data";
import { KANTONE } from "@/lib/labels";
import { prefix } from "@/lib/lang";
import { VOCI } from "@/lib/quanto-pesa";
import { absolute } from "@/lib/url";

export const dynamic = "force-static";

/** The values a [segment] of the address takes: the same lists the pages build from (generateStaticParams). */
const PARAMS: Record<string, () => string[]> = {
  kt: () => KANTONE.map((k) => k.id),
  id: () => Object.keys(allProfiles()),
  year: () => Object.keys(procurement().data.years),
  voce: () => VOCI.map((v) => v.slug),
};

/** Every page of the Italian side, read from the folders of src/app/(it): a folder with a page.tsx is a page. */
function routes(dir: string, path: string): string[] {
  const out: string[] = [];
  const entries = readdirSync(dir);
  if (entries.includes("page.tsx")) out.push(path);
  for (const e of entries) {
    if (!statSync(join(dir, e)).isDirectory()) continue;
    const m = e.match(/^\[(\w+)\]$/);
    if (!m) { out.push(...routes(join(dir, e), `${path}${e}/`)); continue; }
    const values = PARAMS[m[1]];
    if (!values) throw new Error(`[sitemap] no list of values for the segment [${m[1]}] in ${dir}`);
    for (const v of values()) out.push(...routes(join(dir, e), `${path}${v}/`));
  }
  return out;
}

/** Each page once per language, with the address of the other one. */
export default function sitemap(): MetadataRoute.Sitemap {
  return routes(join(process.cwd(), "src", "app", "(it)"), "/").flatMap((p) => {
    const languages = { it: absolute(p), en: absolute(prefix("en", p)) };
    return [{ url: languages.it, alternates: { languages } }, { url: languages.en, alternates: { languages } }];
  });
}
