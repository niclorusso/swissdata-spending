import type { Metadata } from "next";
import Page, { generateMetadata as meta, generateStaticParams as params } from "@/app/(it)/comuni/[id]/page";
import { setLang } from "@/lib/lang-server";

type Props = Parameters<typeof Page>[0];
export const generateStaticParams = params;
export async function generateMetadata(props: Props): Promise<Metadata> {
  setLang("en");
  return meta(props);
}
export default function En(props: Props) {
  setLang("en");
  return <Page {...props} />;
}
