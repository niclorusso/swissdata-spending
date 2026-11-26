import type { MetadataRoute } from "next";
import { absolute } from "@/lib/url";

export const dynamic = "force-static";

/** Every page may be crawled; the list of pages is in the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: absolute("/sitemap.xml") };
}
