import type { Metadata } from "next";
import Page from "@/app/(it)/confederazione/unita/page";
import { setLang } from "@/lib/lang-server";

export const metadata: Metadata = { title: "Federal offices: staff, consultancy, IT" };
export default function En() {
  setLang("en");
  return <Page />;
}
