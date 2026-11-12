import type { Metadata } from "next";
import Page from "@/app/(it)/confederazione/page";
import { setLang } from "@/lib/lang-server";

export const metadata: Metadata = { title: "Confederation: spending, revenue, debt" };
export default function En() {
  setLang("en");
  return <Page />;
}
