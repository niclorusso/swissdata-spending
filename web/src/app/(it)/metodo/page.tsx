import type { Metadata } from "next";
import Link from "@/components/L";
import { bigContracts, haushalte, hauptaggregate, lastR, lastRechnung, procurement, tree } from "@/lib/data";
import { chf, num } from "@/lib/format";
import { objectName } from "@/lib/labels";
import { getLang, T } from "@/lib/lang-server";
import { Page } from "@/components/ui";

export const metadata: Metadata = { title: "Come leggere i numeri" };

function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid md:grid-cols-5 gap-x-10 gap-y-2 py-8 border-t border-border">
      <h2 className="md:col-span-2 text-2xl leading-snug">{title}</h2>
      <div className="md:col-span-3 space-y-3 text-muted leading-relaxed">{children}</div>
    </section>
  );
}

export default function Metodo() {
  const en = getLang() === "en";
  const H = haushalte().data.haushalte;
  const st = hauptaggregate().data.status;
  const aufg = tree("bund-ausgaben-aufgabengebiet");
  const yB = String(lastRechnung(aufg.meta));
  const bundBudget = aufg.data.tree[0].values[yB];
  const bundFs = H["bund"].total_ausgaben[yB];
  const proc = procurement().data.years;
  const big22 = bigContracts(2022).map((r) => ({ name: r.supplier, chf: r.chf }));
  if (big22.length !== 2) throw new Error(`[metodo] the sentence on 2022 no longer matches the data: ${JSON.stringify(big22)}`);
  const lastY = Object.keys(proc).sort().at(-1)!;
  const lastOf = (k: string) => Math.max(...Object.entries(st[k]).filter(([, s]) => s === "R").map(([y]) => Number(y)));
  const yS = String(lastR(H["staat"]));
  const ti = H["ktn_ti"].total_ausgaben[String(lastR(H["ktn_ti"]))];
  return (
    <Page kicker={T("Metodo", "Method")} title={T("Come leggere i numeri", "How to read the figures")} lead={en
      ? <p>The data come from official files, downloaded and recalculated with scripts. The main figures were compared with the publications of the Federal Finance Administration. Below, what you need to know so as not to misread them. The list of files is in the <Link className="link" href="/fonti/">register of sources</Link>.</p>
      : <p>I dati vengono da file ufficiali scaricati e ricalcolati con script. Le cifre principali sono state confrontate con le pubblicazioni dell’Amministrazione federale delle finanze. Qui sotto, le cose da sapere per non leggerle male. L’elenco dei file è nel <Link className="link" href="/fonti/">registro delle fonti</Link>.</p>}>
      {en ? (
      <div>
        <Item title="Actuals, partial data, forecast">
          <p>Actuals are spending that has happened. A forecast is not. The status of each year is the one the Federal Finance Administration (FFA) declares in its files: today closed accounts go up to {lastOf("bund")} for the Confederation, {lastOf("ktn")} for the cantons, {lastOf("gdn")} for the municipalities and {lastOf("sv")} for social insurance.</p>
          <p>Later years are partial data or forecasts and sit on a grey background in the charts. For the Confederation, 2026 and 2027 are budget and 2028–2030 financial plan.</p>
        </Item>
        <Item title="Two figures for the Confederation">
          <p>The federal budget gives {chf(bundBudget, { digits: 1 })} of spending in {yB}. The financial statistics give {chf(bundFs, { digits: 1 })}. Both are right: the second adds the special accounts (for example the funds for railways and roads) and follows the scheme used to compare the levels of government.</p>
          <p>The <Link className="link" href="/confederazione/">Confederation</Link> page uses the federal budget. The comparison between levels and the total of public spending use the financial statistics.</p>
        </Item>
        <Item title="The total is not the sum of the levels">
          <p>The Confederation pays money to the cantons, the cantons to the municipalities, all of them to social insurance. Adding up the four levels counts these transfers twice. The total of {chf(H["staat"].total_ausgaben[yS], { digits: 0 })} in {yS} counts them once.</p>
        </Item>
        <Item title="The cantons' accounts are not the ones the canton publishes">
          <p>To compare 26 cantons the FFA brings all accounts to a common scheme and includes investment. For Ticino this gives {chf(ti, { digits: 1 })}, more than the current spending shown in the cantonal accounts. To discuss a canton&apos;s accounts you need the canton&apos;s own document.</p>
        </Item>
        <Item title="Spending per inhabitant does not measure efficiency">
          <p>Tasks are divided differently from canton to canton: schools, hospitals, roads and social assistance can sit with the canton or with the municipalities. A municipality with many commuters, tourists or second homes spends on people it does not count among its inhabitants.</p>
          <p>In Ticino some municipalities keep drinking water in the municipal accounts, others in a separate utility: the former come out more expensive.</p>
        </Item>
        <Item title="What is in «Finances and taxes»">
          <p>It is not the cost of the tax office. The item gathers payments into fiscal equalisation, interest on debt, shares of taxes passed on to other bodies and expenses not assigned to a service, such as part of depreciation. In a rich municipality that pays a lot into equalisation it can be the largest item.</p>
        </Item>
        <Item title="Ticino and Zurich cannot be compared with each other">
          <p>The two cantonal statistics use different definitions. Ticino publishes gross operating expenses, Zurich the net cost of each service (in German «Nettoaufwand»). Each municipality should be compared with the others in its canton.</p>
          <p>For municipalities above {num(5000)} inhabitants there are also the FFA accounts, which follow a third scheme: figures on the same page can therefore differ. The FFA publishes revenue and spending of each municipality, not a result: the difference shown on the municipal pages is a subtraction made by the site. The cantons publish a result of their own (Zurich: that of the consolidated municipality, school municipalities included). The two figures follow different accounting rules: the federal financial statistics harmonise the accounts of all municipalities, the cantons publish the result under their own rules. They can therefore differ, in a few municipalities also in sign; the reason for the difference in a single municipality is not published. FFA spending is gross: in Zurich it comes out much higher than the cantonal net cost, which subtracts the services&apos; income.</p>
        </Item>
        <Item title="Procurement figures are contracts, not payments">
          <p>The list gives the value of each contract over its whole duration, in the year of signature. In 2022 the total is {chf(proc["2022"]?.total_chf, { digits: 1 })} because it includes two contracts with the US government{objectName(proc["2022"]?.largest.object ?? "") ? ` for ${objectName(proc["2022"]!.largest.object)}` : ""}, {big22.map((s) => `${s.name} (${chf(s.chf, { digits: 1 })})`).join(" and ")}, which are paid over several years.</p>
          <p>Increases to contracts already published come out on a separate sheet and are not in the year&apos;s total ({chf(proc[lastY]?.late_additions.chf_added)} in the {lastY} file). Every year some rows are identical in all fields ({num(proc[lastY]?.identical_rows.n)} in {lastY}): we keep them, because the file does not tell whether they are duplicates. A contract whose amount is not published ({Object.entries(proc).filter(([, v]) => v.no_amount).map(([y, v]) => `${v.no_amount} in ${y}`).join(", ")}) is not counted.</p>
          <p>The same supplier is sometimes written in different ways in the official lists; in the rankings the spellings of the same company (same UID number) are merged, while each contract keeps the name as written: <Link className="link" href="/appalti/grafie/">list of equivalences</Link>.</p>
          <p>Only contracts of {num(50000)}&nbsp;francs and above of the central Federal Administration are included. SBB, Swiss Post, the federal institutes of technology, cantons and municipalities are missing.</p>
        </Item>
        <Item title="Sources and checks">
          <p>Under every chart there are the source and the date of the last check. Amounts come from the official files; values per inhabitant, shares, ranks, medians and the sums for merged municipalities are computed by the site from those files. The <Link className="link" href="/fonti/">register of sources</Link> lists every file with period, dates of publication and download, licence and fingerprint (SHA-256).</p>
          <p>Map boundaries are generalised and only serve for orientation.</p>
        </Item>
      </div>
      ) : (
      <div>
        <Item title="Consuntivo, dato parziale, previsione">
          <p>Un consuntivo è una spesa avvenuta. Una previsione no. Lo stato di ogni anno è quello dichiarato dall’AFF nei suoi file: oggi i consuntivi arrivano al {lastOf("bund")} per la Confederazione, al {lastOf("ktn")} per i Cantoni, al {lastOf("gdn")} per i Comuni e al {lastOf("sv")} per le assicurazioni sociali.</p>
          <p>Gli anni successivi sono dati parziali o previsioni e nei grafici stanno su fondo grigio. Per la Confederazione, 2026 e 2027 sono preventivo e 2028–2030 piano finanziario.</p>
        </Item>
        <Item title="Due cifre per la Confederazione">
          <p>Il bilancio federale dà {chf(bundBudget, { digits: 1 })} di uscite nel {yB}. La statistica finanziaria ne dà {chf(bundFs, { digits: 1 })}. Sono giuste entrambe: la seconda aggiunge i conti speciali (per esempio i fondi per ferrovie e strade) e segue lo schema usato per confrontare i livelli dello Stato.</p>
          <p>La pagina <Link className="link" href="/confederazione/">Confederazione</Link> usa il bilancio federale. Il confronto tra livelli e il totale della spesa pubblica usano la statistica finanziaria.</p>
        </Item>
        <Item title="Il totale non è la somma dei livelli">
          <p>La Confederazione versa soldi ai Cantoni, i Cantoni ai Comuni, tutti alle assicurazioni sociali. Sommando i quattro livelli questi trasferimenti si contano due volte. Il totale di {chf(H["staat"].total_ausgaben[yS], { digits: 0 })} nel {yS} li conta una volta sola.</p>
        </Item>
        <Item title="I conti dei Cantoni non sono quelli che pubblica il Cantone">
          <p>Per confrontare 26 Cantoni l’AFF riporta tutti i conti a uno schema comune e include gli investimenti. Per il Ticino risultano {chf(ti, { digits: 1 })}, più delle uscite correnti che compaiono nel consuntivo cantonale. Per discutere il consuntivo di un Cantone serve il documento del Cantone.</p>
        </Item>
        <Item title="La spesa per abitante non misura l’efficienza">
          <p>I compiti sono divisi in modo diverso da Cantone a Cantone: scuola, ospedali, strade e assistenza possono stare al Cantone o ai Comuni. Un Comune con molti pendolari, turisti o seconde case spende per persone che non conta tra gli abitanti.</p>
          <p>In Ticino alcuni Comuni tengono l’acqua potabile nei conti comunali, altri in un’azienda separata: i primi risultano più cari.</p>
        </Item>
        <Item title="Che cosa c’è in «Finanze e imposte»">
          <p>Non è il costo dell’ufficio delle imposte. La voce raccoglie i versamenti alla perequazione finanziaria, gli interessi sul debito, le quote di imposte passate ad altri enti e le spese non attribuite a un servizio, come una parte degli ammortamenti. In un Comune ricco che versa molto alla perequazione può essere la voce più grande.</p>
        </Item>
        <Item title="Ticino e Zurigo non si confrontano tra loro">
          <p>Le due statistiche cantonali usano definizioni diverse. Il Ticino pubblica le spese operative lorde, Zurigo il costo netto di ogni servizio (in tedesco «Nettoaufwand»). Ogni Comune va confrontato con gli altri del suo Cantone.</p>
          <p>Per i Comuni sopra i {num(5000)} abitanti ci sono anche i conti dell’AFF, che seguono un terzo schema: le cifre della stessa scheda possono quindi differire. L’AFF pubblica ricavi e spese di ogni Comune, non un risultato: la differenza che compare nelle schede è una sottrazione fatta dal sito. I Cantoni pubblicano un loro risultato (Zurigo: quello del Comune consolidato, compresi i Comuni scolastici). Le due cifre seguono regole contabili diverse: la statistica finanziaria federale armonizza i conti di tutti i Comuni, i Cantoni pubblicano il risultato secondo le proprie regole. Possono quindi differire, in alcuni Comuni anche nel segno; il motivo della differenza per un singolo Comune non è pubblicato. Le spese dell’AFF sono lorde: a Zurigo risultano molto più alte del costo netto cantonale, che toglie i ricavi dei servizi.</p>
        </Item>
        <Item title="Gli appalti sono contratti, non pagamenti">
          <p>L’elenco riporta il valore di ogni contratto sull’intera durata, nell’anno della firma. Nel 2022 il totale è {chf(proc["2022"]?.total_chf, { digits: 1 })} perché comprende due contratti con il governo statunitense{objectName(proc["2022"]?.largest.object ?? "") ? ` per ${objectName(proc["2022"]!.largest.object)}` : ""}, {big22.map((s) => `${s.name} (${chf(s.chf, { digits: 1 })})`).join(" e ")}, che si pagano in più anni.</p>
          <p>Gli aumenti di contratti già pubblicati escono in un foglio a parte e non sono nel totale dell’anno ({chf(proc[lastY]?.late_additions.chf_added)} nel file {lastY}). Ogni anno alcune righe sono identiche in tutti i campi ({num(proc[lastY]?.identical_rows.n)} nel {lastY}): le lasciamo, perché il file non permette di dire se sono doppioni. Un contratto senza importo pubblicato ({Object.entries(proc).filter(([, v]) => v.no_amount).map(([y, v]) => `${v.no_amount} nel ${y}`).join(", ")}) non è contato.</p>
          <p>Lo stesso fornitore compare a volte con grafie diverse negli elenchi ufficiali; nelle classifiche le grafie della stessa ditta (stesso numero IDI) sono riunite, mentre ogni contratto resta con il nome scritto: <Link className="link" href="/appalti/grafie/">elenco delle equivalenze</Link>.</p>
          <p>Sono inclusi solo i contratti da {num(50000)}&nbsp;franchi in su dell’Amministrazione federale centrale. Mancano FFS, Posta, politecnici, Cantoni e Comuni.</p>
        </Item>
        <Item title="Fonti e controlli">
          <p>Sotto ogni grafico ci sono la fonte e la data dell’ultimo controllo. Gli importi vengono dai file ufficiali; valori per abitante, quote, posizioni, mediane e le somme per i Comuni aggregati sono calcolati dal sito a partire da quei file. Il <Link className="link" href="/fonti/">registro delle fonti</Link> elenca ogni file con periodo, date di pubblicazione e di download, licenza e impronta (SHA-256).</p>
          <p>I confini delle mappe sono generalizzati e servono solo a orientarsi.</p>
        </Item>
      </div>
      )}
    </Page>
  );
}
