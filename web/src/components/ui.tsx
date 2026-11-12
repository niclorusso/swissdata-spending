import type { ReactNode } from "react";
import Link from "@/components/L";
import { CountUp } from "@/components/CountUp";
import { T } from "@/lib/lang-server";

export function Page({ title, lead, kicker, back, children }: { title: string; lead?: ReactNode; kicker?: string; back?: { href: string; label: string }; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 md:pt-14 pb-4">
      <div data-reveal="up">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {back && <Link href={back.href} className="chip text-muted !py-1 !text-xs">← {back.label}</Link>}
          {kicker && <span className="kicker">{kicker}</span>}
        </div>
        <h1 className="mt-4 text-[2.6rem] md:text-6xl leading-[1.02] max-w-4xl text-balance">{title}</h1>
        {lead && <div className="mt-5 text-lg md:text-xl text-muted max-w-3xl prose-narrow leading-relaxed">{lead}</div>}
      </div>
      <div className="mt-10 md:mt-12 space-y-10">{children}</div>
    </main>
  );
}

/** A figure block: title, one-line reading aid, then the chart or table. */
export function Card({ title, subtitle, children, className = "" }: { title?: ReactNode; subtitle?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 md:p-7 ${className}`} data-reveal="up">
      {title && <h2 className="text-2xl md:text-[1.7rem] leading-tight">{title}</h2>}
      {subtitle && <p className="text-sm text-muted mt-1.5 max-w-3xl leading-relaxed">{subtitle}</p>}
      <div className={title ? "mt-6" : ""}>{children}</div>
    </section>
  );
}

/** Headline number: label, value counting up when first seen, one line of context. */
export function Stat({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <div className="tile stat">
      <div className="eyebrow">{label}</div>
      <div className="display stat-value mt-2 leading-none"><CountUp text={value} /></div>
      {sub && <div className="mt-2 text-xs text-muted leading-relaxed">{sub}</div>}
    </div>
  );
}

export function StatGrid({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 | 5 }) {
  const c = cols === 5 ? "md:grid-cols-5" : cols === 3 ? "md:grid-cols-3" : "md:grid-cols-4";
  return <section className={`grid grid-cols-2 ${c} gap-3 md:gap-4`} data-reveal="up">{children}</section>;
}

/** Short warning about how to read a number (perimeter, estimate, contract volume…). */
export function Note({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-muted max-w-3xl leading-relaxed">
      <span className="font-semibold text-foreground">{title ?? T("Come leggere", "How to read this")}. </span>{children}
    </aside>
  );
}
