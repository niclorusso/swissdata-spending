import type { Metadata } from "next";
import { quantoPesaData, quantoPesaMetadata } from "@/lib/quanto-pesa-data";
import { QuantoPesa } from "@/components/QuantoPesa";

// Not in the main navigation yet: linked from the home page (under the chart by function) and listed in the sitemap.
export async function generateMetadata(): Promise<Metadata> {
  return quantoPesaMetadata(null);
}

/** The chooser: the whole map in grey, every item a link to its own page. Old ?voce=… links are sent on to that page. */
export default function QuantoPesaPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-4 sm:pt-8 md:pt-14 pb-10">
      <QuantoPesa data={quantoPesaData()} slug={null} />
    </main>
  );
}
