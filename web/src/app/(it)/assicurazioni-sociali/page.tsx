import type { Metadata } from "next";
import { haushalte, lastR } from "@/lib/data";
import { chf } from "@/lib/format";
import { svName } from "@/lib/labels";
import { getLang, T } from "@/lib/lang-server";
import { years } from "@/lib/fs";
import { SourceBadge } from "@/components/SourceBadge";
import { TimeSeries, type Row } from "@/components/charts/TimeSeries";
import { Card, Note, Page, Stat, StatGrid } from "@/components/ui";

export const metadata: Metadata = { title: "Assicurazioni sociali: AVS, AI, AD, IPG" };
const BRANCHES = ["sv_ahv", "sv_iv", "sv_alv", "sv_eo", "sv_fl", "sv_mat_ge"];

export default function SV() {
  const en = getLang() === "en";
  const E = T("Entrate", "Revenue"), U = T("Spese", "Spending");
  const fs = haushalte();
  const H = fs.data.haushalte;
  const sv = H["sv"];
  const yR = lastR(sv);
  const y = String(yR);
  const ys = years(sv);
  const rows: Row[] = ys.map((yy) => ({ year: yy, ...Object.fromEntries(BRANCHES.map((b) => [svName(b).split(" – ")[0], H[b]?.total_ausgaben[String(yy)] ?? null])) }));
  const saldo: Row[] = ys.map((yy) => ({ year: yy, [E]: sv.total_einnahmen[String(yy)] ?? null, [U]: sv.total_ausgaben[String(yy)] ?? null }));
  return (
    <Page kicker={T("Assicurazioni sociali", "Social insurance")} title={T("AVS, AI, IPG e disoccupazione", "AHV, IV, EO and unemployment insurance")} lead={en
      ? <p>The branches of social insurance included in the financial statistics: AHV (old age and survivors), IV (disability), EO (income compensation), ALV (unemployment), family allowances in agriculture and Geneva&apos;s maternity insurance. They do not include pension funds (BVG), health insurers (KVG) and SUVA, which are not public accounts. Latest closed accounts: {yR}.</p>
      : <p>I rami delle assicurazioni sociali inclusi nella statistica finanziaria: AVS, AI, IPG, AD, assegni familiari nell&apos;agricoltura e assicurazione maternità ginevrina. Non includono casse pensioni (LPP), casse malati (LAMal) e SUVA, che non sono conti pubblici. Ultimo consuntivo: {yR}.</p>}>
      <StatGrid>
        <Stat label={`${U} ${yR}`} value={chf(sv.total_ausgaben[y])} sub={T("tutti i rami", "all branches")} />
        <Stat label={`${E} ${yR}`} value={chf(sv.total_einnahmen[y])} sub={`${T("saldo", "balance")} ${chf((sv.total_einnahmen[y] ?? 0) - (sv.total_ausgaben[y] ?? 0))}`} />
        <Stat label={`${T("Spese AVS", "AHV spending")} ${yR}`} value={chf(H["sv_ahv"].total_ausgaben[y])} sub={`${T("entrate", "revenue")} ${chf(H["sv_ahv"].total_einnahmen[y])}`} />
        <Stat label={`${T("Spese AI", "IV spending")} ${yR}`} value={chf(H["sv_iv"].total_ausgaben[y])} sub={`${T("entrate", "revenue")} ${chf(H["sv_iv"].total_einnahmen[y])}`} />
      </StatGrid>
      <Note>{T("Le spese sono soprattutto rendite e indennità versate alle persone. Nel 2020 l'assicurazione contro la disoccupazione è salita per le indennità di lavoro ridotto durante la pandemia.", "Spending is mostly pensions and allowances paid to people. In 2020 unemployment insurance rose because of short-time work compensation during the pandemic.")}</Note>
      <Card title={T("Spese per ramo dal 1990", "Spending by branch since 1990")}>
        <TimeSeries rows={rows} series={BRANCHES.map((b) => svName(b).split(" – ")[0])} yearStatus={sv.year_status} kind="stacked" height={320} />
        <SourceBadge meta={fs.meta} compact />
      </Card>
      <div>
        <Card title={T("Entrate e spese, tutti i rami", "Revenue and spending, all branches")}>
          <TimeSeries rows={saldo} series={[E, U]} yearStatus={sv.year_status} height={280} colors={["var(--s1)", "var(--s2)"]} />
        </Card>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {BRANCHES.slice(0, 4).map((b) => (
          <Card key={b} title={svName(b)}>
            <TimeSeries rows={ys.map((yy) => ({ year: yy, [E]: H[b]?.total_einnahmen[String(yy)] ?? null, [U]: H[b]?.total_ausgaben[String(yy)] ?? null }))} series={[E, U]} yearStatus={H[b]?.year_status ?? {}} height={220} colors={["var(--s1)", "var(--s2)"]} />
          </Card>
        ))}
      </div>
    </Page>
  );
}
