import { haushalte } from "@/lib/data";
import { quantoPesaData } from "@/lib/quanto-pesa-data";
import { QuantoPesa } from "@/components/QuantoPesa";
import { SourceBadge } from "@/components/SourceBadge";

/** The page around «Quanto pesa?» (server side): data and the site's source line, with the one year the page shows. */
export function QuantoPesaPage({ slug }: { slug: string | null }) {
  const data = quantoPesaData();
  return (
    <main className="mx-auto max-w-6xl px-4 pt-4 sm:pt-8 md:pt-14 pb-10">
      <QuantoPesa data={data} slug={slug} sourceLine={<SourceBadge meta={{ ...haushalte().meta, years: [Number(data.year)] }} />} />
    </main>
  );
}
