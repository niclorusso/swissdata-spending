import Link from "@/components/L";
import { LangSwitch, NavLinks } from "@/components/NavLinks";
import { ThemeToggle } from "@/components/ThemeToggle";
import { T } from "@/lib/lang-server";
import { SITE } from "@/lib/site";

const links = [
  { href: "/confederazione/", it: "Confederazione", en: "Confederation" },
  { href: "/cantoni/", it: "Cantoni", en: "Cantons" },
  { href: "/comuni/", it: "Comuni", en: "Municipalities" },
  { href: "/assicurazioni-sociali/", it: "Assicurazioni sociali", en: "Social insurance" },
  { href: "/appalti/", it: "Appalti", en: "Procurement" },
  { href: "/metodo/", it: "Metodo e fonti", en: "Method and sources" },
];

/** The SwissData mark: the four operations on a red square. */
function Mark({ size = 28 }: { size?: number }) {
  return (
    <span className="grid grid-cols-2 bg-[#dc2626] rounded-[5px] shrink-0 text-white font-bold leading-none" style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden>
      {["+", "−", "×", "÷"].map((c) => <span key={c} className="flex items-center justify-center">{c}</span>)}
    </span>
  );
}
/** "SwissData" goes to the main site, the section name to the first page of this one. */
function Brand({ size }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <a href={SITE.parentUrl} className="flex items-center gap-2 font-bold tracking-tight" title={T("Vai a SwissData", "Go to SwissData")}><Mark size={size} /><span>Swiss<span className="text-[#dc2626]">Data</span></span></a>
      <span className="text-border" aria-hidden>/</span>
      <Link href="/" className="font-medium text-muted hover:text-foreground transition-colors">{T(SITE.section, SITE.sectionEn)}</Link>
    </span>
  );
}

export function Nav() {
  return (
    <header className="site-nav md:sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <div className="text-[1.1rem] mr-auto"><Brand /></div>
        <div className="order-3 md:order-2 w-full md:w-auto"><NavLinks links={links.map((l) => ({ href: l.href, label: T(l.it, l.en) }))} /></div>
        <div className="order-2 md:order-3 flex items-center gap-2"><LangSwitch /><ThemeToggle /></div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 text-sm" data-theme="dark" style={{ background: "#0b0c0e" }}>
      <div className="mx-auto max-w-6xl px-4 py-14 grid md:grid-cols-3 gap-10 text-muted">
        <div className="md:col-span-2 space-y-3 max-w-2xl">
          <div className="text-xl text-foreground"><Brand size={30} /></div>
          <p>{T("La spesa pubblica svizzera dai file ufficiali di AFF, UST e della Conferenza degli acquisti della Confederazione. Sotto ogni grafico: fonte e data dell'ultimo controllo.", "Swiss public spending from the official files of the Federal Finance Administration, the Federal Statistical Office and the Federal Procurement Conference. Under every chart: source and date of the last check.")}</p>
          <p>{T("Progetto indipendente, non è un sito ufficiale della Confederazione.", "Independent project, not an official website of the Confederation.")}</p>
        </div>
        <ul className="space-y-2">
          <li><Link className="hover:text-accent transition-colors" href="/metodo/">{T("Come leggere i numeri", "How to read the figures")}</Link></li>
          <li><Link className="hover:text-accent transition-colors" href="/fonti/">{T("Registro delle fonti", "Register of sources")}</Link></li>
          <li><Link className="hover:text-accent transition-colors" href="/confederazione/unita/">{T("Uffici federali", "Federal offices")}</Link></li>
        </ul>
      </div>
    </footer>
  );
}
