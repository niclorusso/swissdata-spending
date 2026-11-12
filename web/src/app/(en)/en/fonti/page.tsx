import type { Metadata } from "next";
import Page from "@/app/(it)/fonti/page";
import { setLang } from "@/lib/lang-server";

export const metadata: Metadata = { title: "Register of sources" };
export default function En() {
  setLang("en");
  return <Page />;
}
