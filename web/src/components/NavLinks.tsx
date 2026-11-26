"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BASE } from "@/lib/lang";
import { useL } from "@/lib/useLang";

const bare = (p: string) => p.replace(/^\/en(?=\/|$)/, "") || "/";

/** The pages of the site in one row of words. On phones the row scrolls sideways: while there is more to see on a side, a fade with a chevron
 *  says so (as in the other SwissData sites), and the current page is brought into view, clear of the chevrons. */
export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = bare(usePathname());
  const { link, T } = useL();
  const ref = useRef<HTMLElement>(null);
  const [more, setMore] = useState({ left: false, right: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mark = () => {
      const left = el.scrollLeft > 4;
      const right = el.scrollWidth - el.clientWidth - el.scrollLeft > 4;
      setMore((m) => (m.left === left && m.right === right ? m : { left, right }));
    };
    const cur = el.querySelector<HTMLElement>("[aria-current]");
    if (cur && el.scrollWidth > el.clientWidth) {
      const CUE = 44; // a chevron with its fade is 40px wide (.sdf-navcue), and 4px more so the underline of the current page stays clear of it
      const start = cur.offsetLeft - el.offsetLeft, end = start + cur.offsetWidth;
      if (end > el.scrollLeft + el.clientWidth - CUE) el.scrollLeft = end - el.clientWidth + CUE;
      else if (start < el.scrollLeft + (el.scrollLeft > 4 ? CUE : 0)) el.scrollLeft = Math.max(0, start - CUE);
    }
    mark();
    el.addEventListener("scroll", mark, { passive: true });
    window.addEventListener("resize", mark);
    return () => { el.removeEventListener("scroll", mark); window.removeEventListener("resize", mark); };
  }, [path]);
  return (
    <div className="sdf-navwrap">
      <nav ref={ref} className="sdf-navrow" aria-label={T("Pagine", "Pages")}>
        {links.map((l) => {
          const on = path.startsWith(l.href) || (l.href === "/metodo/" && path.startsWith("/fonti"));
          return <Link key={l.href} href={link(l.href)} aria-current={on ? "page" : undefined}>{l.label}</Link>;
        })}
      </nav>
      {more.left && <span className="sdf-navcue sdf-navcue-l" aria-hidden="true"><Chevron /></span>}
      {more.right && <span className="sdf-navcue sdf-navcue-r" aria-hidden="true"><Chevron /></span>}
    </div>
  );
}

/**
 * A word that opens a short list of links (the three sites, the two languages). It is a <details>, so it opens without scripts too and
 * the browser tells screen readers whether it is open. Scripts add what <details> lacks: Escape closes it and gives the focus back,
 * a click or a Tab outside closes it.
 */
export function Menu({ label, summaryLabel, listLabel, className = "", children }: { label: ReactNode; summaryLabel: string; listLabel: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const close = (focus = false) => { if (!d.open) return; d.open = false; if (focus) d.querySelector<HTMLElement>("summary")?.focus(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && d.open) { e.stopPropagation(); close(true); } };
    const onDown = (e: Event) => { if (!d.contains(e.target as Node)) close(); };
    const onFocusOut = (e: FocusEvent) => { if (e.relatedTarget && !d.contains(e.relatedTarget as Node)) close(); };
    d.addEventListener("keydown", onKey);
    d.addEventListener("focusout", onFocusOut);
    document.addEventListener("pointerdown", onDown);
    return () => { d.removeEventListener("keydown", onKey); d.removeEventListener("focusout", onFocusOut); document.removeEventListener("pointerdown", onDown); };
  }, []);
  return (
    <details ref={ref} className={`sdf-menu ${className}`}>
      <summary aria-label={summaryLabel}>{label}</summary>
      <ul className="sdf-menu-list" aria-label={listLabel}>{children}</ul>
    </details>
  );
}

export const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
);

/** The language in one pill: the current code, and the same page in the two languages. Plain links: the two languages are separate documents. */
export function LangMenu() {
  const path = bare(usePathname());
  const { en } = useL();
  return (
    <Menu className="sdf-lang" label={<>{en ? "EN" : "IT"}<Chevron /></>} summaryLabel={en ? "Language: English" : "Lingua: italiano"} listLabel={en ? "Language" : "Lingua"}>
      <li><a href={BASE + path} hrefLang="it" lang="it" aria-current={!en ? "true" : undefined}><span className="sdf-lang-code" aria-hidden="true">IT</span> Italiano</a></li>
      <li><a href={`${BASE}/en${path}`} hrefLang="en" lang="en" aria-current={en ? "true" : undefined}><span className="sdf-lang-code" aria-hidden="true">EN</span> English</a></li>
    </Menu>
  );
}
