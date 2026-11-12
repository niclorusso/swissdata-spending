import type { Metadata } from "next";
import { lastRechnung, units } from "@/lib/data";
import { chf, num } from "@/lib/format";
import { depName } from "@/lib/labels";
import { getLang, T } from "@/lib/lang-server";
import { SourceBadge } from "@/components/SourceBadge";
import { BarList } from "@/components/charts/BarList";
import { UnitsTable } from "@/components/UnitsTable";
import { Card, Page } from "@/components/ui";

export const metadata: Metadata = { title: "Uffici federali: personale, consulenza, informatica" };

export default function Unita() {
  const en = getLang() === "en";
  const s = units();
  const yR = lastRechnung(s.meta);
  const y = String(yR);
  const deps = s.data.units.filter((u) => u.level === 2 && u.name === u.departement);
  const bund = s.data.units.find((u) => u.level === 1);
  const years = (s.meta.years ?? []).filter((yy) => s.data.units.some((u) => u.level === 3 && (u.values.personal?.[String(yy)] ?? null) !== null));
  return (
    <Page kicker={T("Confederazione", "Confederation")} back={{ href: "/confederazione/", label: T("Bilancio federale", "Federal budget") }} title={T("Uffici federali", "Federal offices")} lead={en
      ? <p>How much each administrative unit of the Confederation spends on staff, external consultancy and IT, and how many full-time positions it has. In {yR} the Confederation spent {chf(bund?.values.personal?.[y])} on {num(bund?.values.fte?.[y])} full-time positions.</p>
      : <p>Quanto spende ogni unità amministrativa della Confederazione per il personale, la consulenza esterna e l&apos;informatica, e quanti posti a tempo pieno ha. Nel {yR} la Confederazione ha speso {chf(bund?.values.personal?.[y])} per {num(bund?.values.fte?.[y])} posti a tempo pieno.</p>}>
      <div className="grid md:grid-cols-2 gap-6">
        <Card title={en ? `Staff costs by department, ${yR}` : `Spese per il personale per dipartimento, ${yR}`}>
          <BarList items={deps.map((d) => ({ label: depName(d.name), value: d.values.personal?.[y] ?? 0, sub: `${num(d.values.fte?.[y])} ${T("posti", "positions")}` })).sort((a, b) => b.value - a.value)} total={bund?.values.personal?.[y] ?? undefined} />
        </Card>
        <Card title={en ? `External consultancy and IT by department, ${yR}` : `Consulenza esterna e informatica per dipartimento, ${yR}`}>
          <BarList items={deps.map((d) => ({ label: depName(d.name), value: (d.values.beratung?.[y] ?? 0) + (d.values.informatik?.[y] ?? 0), sub: `${T("consulenza", "consultancy")} ${chf(d.values.beratung?.[y])}, ${T("informatica", "IT")} ${chf(d.values.informatik?.[y])}` })).sort((a, b) => b.value - a.value)} showShare={false} />
        </Card>
      </div>
      <Card title={T("Tutti gli uffici", "All offices")} subtitle={T("Cerca per nome, scegli anno e dipartimento, clicca un'intestazione per ordinare.", "Search by name, pick year and department, click a heading to sort.")}>
        <UnitsTable units={s.data.units} years={years} defaultYear={yR} yearStatus={s.meta.year_status ?? {}} />
        <SourceBadge meta={s.meta} />
      </Card>
    </Page>
  );
}
