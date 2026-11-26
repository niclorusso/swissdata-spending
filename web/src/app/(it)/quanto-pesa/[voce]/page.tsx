import type { Metadata } from "next";
import { VOCI } from "@/lib/quanto-pesa";
import { quantoPesaData, quantoPesaMetadata } from "@/lib/quanto-pesa-data";
import { QuantoPesa } from "@/components/QuantoPesa";

/** One page per item, built in advance: a shared link carries its own title, description and social card. */
export function generateStaticParams() {
  return VOCI.map((v) => ({ voce: v.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/quanto-pesa/[voce]">): Promise<Metadata> {
  const { voce } = await params;
  return quantoPesaMetadata(voce);
}

export default async function QuantoPesaVoce({ params }: PageProps<"/quanto-pesa/[voce]">) {
  const { voce } = await params;
  return (
    <main className="mx-auto max-w-6xl px-4 pt-4 sm:pt-8 md:pt-14 pb-10">
      <QuantoPesa data={quantoPesaData()} slug={voce} />
    </main>
  );
}
