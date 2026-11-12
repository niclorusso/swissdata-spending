import Page from "@/app/(it)/page";
import { setLang } from "@/lib/lang-server";

export default function En() {
  setLang("en");
  return <Page />;
}
