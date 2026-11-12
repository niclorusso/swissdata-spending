import type { Metadata } from "next";
import Page from "@/app/(it)/comuni/page";
import { setLang } from "@/lib/lang-server";

export const metadata: Metadata = { title: "Municipalities: the accounts, municipality by municipality" };
export default function En() {
  setLang("en");
  return <Page />;
}
