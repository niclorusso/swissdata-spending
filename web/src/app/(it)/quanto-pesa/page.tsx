import type { Metadata } from "next";
import { quantoPesaMetadata } from "@/lib/quanto-pesa-data";
import { QuantoPesaPage } from "@/components/QuantoPesaPage";

// Not in the main navigation yet: linked from the home page (under the chart by function) and listed in the sitemap.
export async function generateMetadata(): Promise<Metadata> {
  return quantoPesaMetadata(null);
}

/** The chooser: the whole map in grey, every item a link to its own page. Old ?voce=… links are sent on to that page. */
export default function QuantoPesaChooser() {
  return <QuantoPesaPage slug={null} />;
}
