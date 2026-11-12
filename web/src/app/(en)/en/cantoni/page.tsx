import type { Metadata } from "next";
import Page from "@/app/(it)/cantoni/page";
import { setLang } from "@/lib/lang-server";

export const metadata: Metadata = { title: "Cantons: spending, per inhabitant, by function" };
export default function En() {
  setLang("en");
  return <Page />;
}
