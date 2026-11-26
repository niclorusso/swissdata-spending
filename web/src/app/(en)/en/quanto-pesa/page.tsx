import type { Metadata } from "next";
import Page from "@/app/(it)/quanto-pesa/page";
import { setLang } from "@/lib/lang-server";

export const metadata: Metadata = { title: "How much does it weigh?", robots: { index: false, follow: false } };
export default function En() {
  setLang("en");
  return <Page />;
}
