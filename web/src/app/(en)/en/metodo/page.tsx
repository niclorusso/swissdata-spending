import type { Metadata } from "next";
import Page from "@/app/(it)/metodo/page";
import { setLang } from "@/lib/lang-server";

export const metadata: Metadata = { title: "How to read the figures" };
export default function En() {
  setLang("en");
  return <Page />;
}
