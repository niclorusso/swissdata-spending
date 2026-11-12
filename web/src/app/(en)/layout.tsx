import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Shell } from "@/components/Shell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.nameEn}: the accounts of the Confederation, cantons and municipalities`, template: `%s · ${SITE.nameEn}` },
  description: "Swiss public spending in one place: Confederation, procurement, cantons and municipalities. Official data, with source, period and date of the last check under every chart.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <Shell lang="en">{children}</Shell>;
}
