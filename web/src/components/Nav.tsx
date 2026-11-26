import Link from "@/components/L";
import { Chevron, LangMenu, Menu, NavLinks } from "@/components/NavLinks";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getLang, T } from "@/lib/lang-server";
import { FAMILY, THIS_SITE, familyHref } from "@/lib/site";

const links = [
  { href: "/confederazione/", it: "Confederazione", en: "Confederation" },
  { href: "/cantoni/", it: "Cantoni", en: "Cantons" },
  { href: "/comuni/", it: "Comuni", en: "Municipalities" },
  { href: "/assicurazioni-sociali/", it: "Assicurazioni sociali", en: "Social insurance" },
  { href: "/appalti/", it: "Appalti", en: "Procurement" },
  { href: "/metodo/", it: "Metodo e fonti", en: "Method and sources" },
];

/** The SwissData mark, drawn: the four operations on a red square. The same drawing in the three sites. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg className="sdf-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="5.5" fill="#D82525" />
      <g fill="none" stroke="#fff" strokeWidth="2">
        <path d="M8 4.3v7.4M4.3 8h7.4" /><path d="M20.3 8h7.4" /><path d="M5.4 21.4l5.2 5.2M10.6 21.4l-5.2 5.2" /><path d="M20.3 24h7.4" />
        <circle cx="24" cy="20.7" r="1.2" fill="#fff" stroke="none" /><circle cx="24" cy="27.3" r="1.2" fill="#fff" stroke="none" />
      </g>
    </svg>
  );
}
const Word = () => <span className="sdf-word">Swiss<span className="sdf-data">Data</span></span>;

/** Mark, "SwissData", slash, the name of this site. The name opens the list of the three sites. */
function Lockup() {
  const lang = getLang();
  const me = FAMILY.find((s) => s.id === THIS_SITE)!;
  return (
    <div className="sdf-lockup">
      <Link className="sdf-lockup-brand" href="/" aria-label={T("SwissData Spesa pubblica: pagina iniziale", "SwissData Public spending: home page")}><Mark /><Word /></Link>
      <span className="sdf-slash" aria-hidden="true">/</span>
      <Menu className="sdf-switch" label={<>{me[lang]}<Chevron /></>} summaryLabel={T(`${me.it}: cambia sito SwissData`, `${me.en}: switch SwissData site`)} listLabel={T("I siti SwissData", "The SwissData sites")}>
        {FAMILY.map((s) => (
          <li key={s.id}>{s.id === THIS_SITE
            ? <Link href="/" aria-current="true"><Word /> <span>/ {s[lang]}</span></Link>
            : <a href={familyHref(s, lang)} hrefLang={lang}><Word /> <span>/ {s[lang]}</span></a>}</li>
        ))}
      </Menu>
    </div>
  );
}

export function Nav() {
  return (
    <header className="site-nav">
      <div className="site-nav-in mx-auto max-w-6xl px-4">
        <Lockup />
        <NavLinks links={links.map((l) => ({ href: l.href, label: T(l.it, l.en) }))} />
        <LangMenu />
      </div>
    </header>
  );
}

export function Footer() {
  const lang = getLang();
  return (
    <footer className="site-foot mt-24" data-theme="dark">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-12">
        <div className="sdf-foot">
          <div className="sdf-foot-brand"><Mark size={26} /><Word /></div>
          <nav className="sdf-foot-sites" aria-label={T("I siti SwissData", "The SwissData sites")}>
            {FAMILY.map((s) => (
              s.id === THIS_SITE
                ? <Link key={s.id} className="sdf-foot-site" href="/" aria-current="true"><strong>{s.long[lang]}</strong><span>{s.text[lang]}</span></Link>
                : <a key={s.id} className="sdf-foot-site" href={familyHref(s, lang)} hrefLang={lang}><strong>{s.long[lang]}</strong><span>{s.text[lang]}</span></a>
            ))}
          </nav>
          <p className="sdf-foot-indep">{T("Progetto indipendente di Nicola Lo Russo. Non è un sito ufficiale della Confederazione.", "Independent project by Nicola Lo Russo. Not an official website of the Confederation.")}</p>
        </div>
        <div className="pt-9 grid md:grid-cols-3 gap-x-10 gap-y-6">
          <p className="md:col-span-2 max-w-2xl leading-relaxed">{T("La spesa pubblica svizzera dai file ufficiali di AFF, UST, della Conferenza degli acquisti della Confederazione e dei Cantoni Ticino e Zurigo. Sotto ogni grafico: fonte e data dell’ultimo controllo.", "Swiss public spending from the official files of the Federal Finance Administration, the Federal Statistical Office, the Federal Procurement Conference and the cantons of Ticino and Zurich. Under every chart: source and date of the last check.")}</p>
          <ul className="site-foot-links">
            <li><Link href="/metodo/">{T("Come leggere i numeri", "How to read the figures")}</Link></li>
            <li><Link href="/fonti/">{T("Registro delle fonti", "Register of sources")}</Link></li>
            <li><Link href="/confederazione/unita/">{T("Uffici federali", "Federal offices")}</Link></li>
            <li><a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer">Powered by Netlify</a></li>
            <li><ThemeToggle /></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
