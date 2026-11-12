import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: i conti di Confederazione, Cantoni e Comuni`, template: `%s · ${SITE.name}` },
  description: "La spesa pubblica svizzera in un unico posto: Confederazione, appalti, Cantoni e Comuni. Dati ufficiali con fonte, periodo e data di verifica sotto ogni grafico.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <Shell lang="it">{children}</Shell>;
}
