"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useL } from "@/lib/useLang";

/**
 * A figure block closed behind its title. `on` says where: "phone" (below 1024px), "desktop" (from 1024px) or "always";
 * on the other screens it is an ordinary open card (the style sheet shows the content, and the title is plain text again).
 *
 * The pattern is the accordion of the WAI Authoring Practices: a heading that holds a button with aria-expanded and aria-controls,
 * so the outline of the page keeps its headings. The closed content is hidden="until-found": the browser's find-in-page looks
 * inside it and opens it. Without scripts everything is shown (see the <noscript> rule in Shell.tsx).
 */
export function Fold({ title, subtitle, children, on = "phone" }: { title: ReactNode; subtitle?: ReactNode; children: ReactNode; on?: "phone" | "desktop" | "always" }) {
  const { T } = useL();
  const id = useId();
  const body = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [narrow, setNarrow] = useState<boolean | null>(null); // null until the browser tells the width
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023.98px)");
    const set = () => setNarrow(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  // hidden="until-found" is set as an attribute by hand: React does not know the value. The browser removes it when find-in-page lands inside.
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    if (open) el.removeAttribute("hidden"); else el.setAttribute("hidden", "until-found");
    const found = () => setOpen(true);
    el.addEventListener("beforematch", found);
    return () => el.removeEventListener("beforematch", found);
  }, [open]);
  const folds = on === "always" || narrow === null || (on === "phone" ? narrow : !narrow); // is it a toggle on this screen?
  return (
    <section className="fold card p-5 md:p-7" data-fold={on} data-open={open} data-reveal="up">
      <h2 className="text-2xl md:text-[1.7rem] leading-tight">
        {folds ? <button type="button" className="fold-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>{title}</button> : title}
      </h2>
      {subtitle && <p className="text-sm text-muted mt-1.5 max-w-3xl leading-relaxed">{subtitle}</p>}
      <span className="fold-cue" aria-hidden="true" onClick={() => setOpen((o) => !o)}><span className="when-closed">{T("Apri il grafico", "Open the chart")} ↓</span><span className="when-open">{T("Chiudi", "Close")} ↑</span></span>
      <div id={id} ref={body} className="fold-body" hidden={!open} suppressHydrationWarning>{children}</div>
    </section>
  );
}
