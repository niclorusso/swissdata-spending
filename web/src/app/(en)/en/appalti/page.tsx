import type { Metadata } from "next";
import Page from "@/app/(it)/appalti/page";
import { setLang } from "@/lib/lang-server";

export const metadata: Metadata = { title: "Contracts of the Confederation ≥ 50,000 CHF" };
export default function En() {
  setLang("en");
  return <Page />;
}
