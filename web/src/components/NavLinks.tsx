"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BASE } from "@/lib/lang";
import { useL } from "@/lib/useLang";

const bare = (p: string) => p.replace(/^\/en(?=\/|$)/, "") || "/";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = bare(usePathname());
  const { link, T } = useL();
  return (
    <nav className="flex flex-wrap gap-x-0.5 gap-y-0.5 text-sm text-muted -mx-2 md:mx-0" aria-label={T("Sezioni", "Sections")}>
      {links.map((l) => {
        const on = path.startsWith(l.href) || (l.href === "/metodo/" && path.startsWith("/fonti"));
        return <Link key={l.href} href={link(l.href)} aria-current={on ? "page" : undefined} className="nav-link shrink-0">{l.label}</Link>;
      })}
    </nav>
  );
}

/** Same page in the other language. A plain link: the two languages are separate documents. */
export function LangSwitch() {
  const path = bare(usePathname());
  const { en } = useL();
  const cls = (on: boolean) => `px-2 py-1 rounded-full ${on ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`;
  return (
    <div className="flex items-center rounded-full border border-border p-0.5 text-xs font-semibold" role="group" aria-label={en ? "Language" : "Lingua"}>
      <a href={BASE + path} hrefLang="it" lang="it" aria-current={!en ? "true" : undefined} className={cls(!en)}>IT</a>
      <a href={`${BASE}/en${path}`} hrefLang="en" lang="en" aria-current={en ? "true" : undefined} className={cls(en)}>EN</a>
    </div>
  );
}
