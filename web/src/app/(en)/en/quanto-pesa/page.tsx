import type { Metadata } from "next";
import Page, { generateMetadata as meta } from "@/app/(it)/quanto-pesa/page";
import { setLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  setLang("en");
  return meta();
}
export default function En() {
  setLang("en");
  return <Page />;
}
