import type { Metadata } from "next";
import Page from "@/app/(it)/appalti/grafie/page";
import { setLang } from "@/lib/lang-server";

export const metadata: Metadata = { title: "Suppliers written in more than one way" };
export default function En() {
  setLang("en");
  return <Page />;
}
