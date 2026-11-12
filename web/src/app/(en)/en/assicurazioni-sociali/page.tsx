import type { Metadata } from "next";
import Page from "@/app/(it)/assicurazioni-sociali/page";
import { setLang } from "@/lib/lang-server";

export const metadata: Metadata = { title: "Social insurance: AHV, IV, ALV, EO" };
export default function En() {
  setLang("en");
  return <Page />;
}
