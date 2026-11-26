import type { Metadata } from "next";
import { procurement, supplierAliases, type AliasGroup } from "@/lib/data";
import { apos, chf, date, plural } from "@/lib/format";
import { BASE } from "@/lib/lang";
import { getLang, T } from "@/lib/lang-server";
import { Card, Page } from "@/components/ui";

export const metadata: Metadata = { title: "Fornitori scritti in più modi" };

const IN_LANG = { de: ["in tedesco", "in German"], fr: ["in francese", "in French"], it: ["in italiano", "in Italian"], en: ["in inglese", "in English"] } as const;

/** How a spelling of the list matches the commercial register. */
function how(g: AliasGroup, v: AliasGroup["variants"][number], en: boolean): string {
  const lang = v.lang ? IN_LANG[v.lang][en ? 1 : 0] : "";
  const reg = v.register_name && v.register_name !== v.name ? ` (${v.register_name})` : "";
  switch (v.match) {
    case "name": return v.name === g.register_name ? T("nome nel registro", "name in the register") : T("nome nel registro, scritto in altro modo", "name in the register, written differently");
    case "translation": return `${T("nome registrato", "registered name")} ${lang}${reg}`;
    case "former": return `${T("nome precedente nel registro", "former name in the register")}${reg ? `, ${T("scritto in altro modo", "written differently")}${reg}` : ""}${v.only_before ? `; ${T("solo i contratti iniziati prima del", "only the contracts that started before")} ${date(v.only_before)}` : ""}`;
    case "former-translation": return `${T("nome precedente nel registro", "former name in the register")}, ${lang}${reg}`;
    case "no-legal-form": return T("nome nel registro, senza forma giuridica", "name in the register, without legal form");
  }
}

export default function Grafie() {
  const en = getLang() === "en";
  const a = supplierAliases();
  const sg = procurement().data.supplier_groups;
  const totals = new Map(sg.map((g) => [g.name, new Map(g.variants.map((v) => [v.name, v.years]))]));
  const totalsApart = new Map(sg.flatMap((g) => g.variants.flatMap((v) => (v.apart ? [[`${g.name}|${v.name}`, v.apart] as const] : []))));
  const sum = (ys: Record<string, { chf: number; n: number }>) => Object.values(ys).reduce((s, x) => ({ chf: s.chf + x.chf, n: s.n + x.n }), { chf: 0, n: 0 });
  const groups = a.groups.map((g) => {
    const t = totals.get(g.name);
    // The ETL writes these totals from the same file: a group or a spelling missing here means the snapshot is older than the file.
    const variants = g.variants.map((v) => {
      const years = t?.get(v.name);
      if (!years) throw new Error(`[grafie] ${JSON.stringify(v.name)} of ${JSON.stringify(g.name)} is not in bund-beschaffungen.json: rerun the procurement ETL step`);
      return { ...v, years, apart: totalsApart.get(`${g.name}|${v.name}`), ...sum(years) };
    });
    return { ...g, variants, chf: variants.reduce((s, v) => s + v.chf, 0), n: variants.reduce((s, v) => s + v.n, 0) };
  }).sort((x, y) => y.chf - x.chf);
  const contracts = (n: number) => plural(n, T("contratto", "contract"), T("contratti", "contracts"));
  return (
    <Page kicker={T("Appalti", "Procurement")} back={{ href: "/appalti/", label: T("I contratti della Confederazione", "The Confederation's contracts") }} title={T("Fornitori scritti in più modi", "Suppliers written in more than one way")} lead={en
      ? <p>In the federal procurement lists the same company is sometimes written in more than one way: with different capitals, spaces or punctuation, with its legal form abbreviated differently, with its name in another language, or under the name it had before a change of name. In the rankings of the site these spellings are counted together when the commercial register shows that they are the same company, with the same UID number. Each contract keeps the name written in the list.</p>
      : <p>Negli elenchi federali degli appalti la stessa ditta è a volte scritta in più modi: con maiuscole, spazi o punteggiatura diversi, con la forma giuridica abbreviata in un altro modo, con il suo nome in un’altra lingua o con il nome che aveva prima di cambiarlo. Nelle classifiche del sito queste grafie sono contate insieme quando il registro di commercio mostra che sono la stessa ditta, con lo stesso numero IDI. Ogni contratto resta con il nome scritto nell’elenco.</p>}>
      <div className="text-sm text-muted max-w-3xl space-y-2 leading-relaxed" data-reveal="up">
        <p>{en ? a.rule.en : apos(a.rule.it)}</p>
        <p>{en ? a.scope.en : apos(a.scope.it)}</p>
      </div>
      <Card title={en ? `${groups.length} companies, each with its spellings` : `${groups.length} ditte, ognuna con le sue grafie`} subtitle={T("Dalla più grande alla più piccola, per valore dei contratti 2021–2025. Tra virgolette il nome com’è scritto nell’elenco, spazi compresi.", "From the largest to the smallest, by value of the 2021–2025 contracts. In quotation marks the name as written in the list, spaces included.")}>
        <ul className="grid md:grid-cols-2 gap-x-10">
          {groups.map((g) => {
            const deleted = g.register_status.startsWith("deleted") ? g.register_status.split(" ")[1] : null;
            return (
              <li key={`${g.uid}-${g.name}`} className="py-5 border-t border-border text-sm">
                <h3 className="text-base font-semibold text-foreground">{g.name}</h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  {T("IDI", "UID")} <a className="underline hover:text-accent tabular" href={g.register_url} target="_blank" rel="noreferrer">{g.uid}</a>
                  {g.register_name !== g.name && <> · {T("nel registro", "in the register")}: {g.register_name}</>}
                  {" "}· {T("sede", "seat")} {g.seat}
                  {g.branch_of && <> · {T("succursale di", "branch of")} {g.branch_of.name} ({g.branch_of.uid})</>}
                  {deleted && <> · {T("cancellata il", "deleted on")} {date(deleted)}</>}
                </p>
                {g.renamed?.map((r) => (
                  <p key={r.from} className="mt-1 text-xs text-muted leading-relaxed">{T("già", "formerly")} {r.from}: {r.register_date
                    ? <>{T("nome cambiato in", "renamed")} {r.to} {T("nel registro il", "in the register on")} {date(r.register_date)} ({T("FUSC del", "SOGC of")} {date(r.sogc_date)}, {T("pubblicazione", "publication")} {r.sogc_publication})</>
                    : <>{T("nome cambiato in", "renamed")} {r.to} {T("prima del", "before")} {date(r.before)} ({T("prima pubblicazione FUSC disponibile in Zefix", "first SOGC publication available in Zefix")})</>}</p>
                ))}
                <ul className="mt-3 space-y-2">
                  {g.variants.map((v) => (
                    <li key={v.name}>
                      <div className="whitespace-pre-wrap break-words">«{v.name}»</div>
                      <div className="text-xs text-muted">{Object.keys(v.years).sort().join(", ")} · {contracts(v.n)} · {chf(v.chf)} · {how(g, v, en)}{v.apart && <>; {T("contratti iniziati dopo, lasciati a parte", "contracts that started later, left apart")}: {v.apart.n}</>}</div>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted">{T("Insieme", "Together")}: {contracts(g.n)}, {chf(g.chf)}.</p>
                {g.note && <p className="mt-2 text-xs text-muted leading-relaxed">{en ? g.note.en : apos(g.note.it)}</p>}
              </li>
            );
          })}
        </ul>
      </Card>
      <Card title={T("Casi non riuniti", "Cases not merged")} subtitle={T("Nomi simili che restano separati nelle classifiche.", "Similar names that stay separate in the rankings.")}>
        <ul className="space-y-3 text-sm">
          {a.not_merged.map((c) => (
            <li key={c.names.join("|")}>
              <div className="whitespace-pre-wrap break-words">{c.names.map((n) => `«${n}»`).join(" · ")}</div>
              <div className="text-xs text-muted leading-relaxed">{en ? c.why.en : apos(c.why.it)}</div>
            </li>
          ))}
        </ul>
      </Card>
      <p className="text-xs text-faint" data-reveal="up">
        {T("Registro", "Register")}: <a className="underline hover:text-accent" href={a.source.url} target="_blank" rel="noreferrer">{en ? "Zefix, Central Business Name Index (FCRO)" : a.source.name}</a> · {T("consultato il", "checked on")} {date(a.source.checked)} · <a className="underline hover:text-accent" href={`${BASE}/data/supplier-aliases.json`}>{T("le equivalenze in un file JSON", "the equivalences as a JSON file")}</a>
      </p>
    </Page>
  );
}
