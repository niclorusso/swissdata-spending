"use client";
import { useEffect, useRef, useState } from "react";
import { formatNumber, numberPattern, parseNumber } from "@/lib/format";
import { useLang } from "@/lib/useLang";

/**
 * Shows a formatted figure ("29 051 CHF", "86,4 mld CHF") counting up from zero the first time it is seen.
 * The server prints the final text, so the figure is there without JavaScript too. Plain years are left alone.
 * The figures on the way are written by the same function as the final one (lib/format.ts).
 */
export function CountUp({ text, duration = 1400, className = "" }: { text: string; duration?: number; className?: string }) {
  const lang = useLang();
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(text);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const m = text.match(numberPattern(lang));
    const el = ref.current;
    const raw = m?.[0] ?? "";
    const decimal = lang === "en" ? "." : ",";
    const digits = raw.includes(decimal) ? raw.split(decimal)[1].length : 0;
    const target = parseNumber(raw, lang);
    // left as it is: no figure, a plain year, a figure the formatter did not write, or the visitor asked for no motion
    const still = !m || /^(19|20)\d\d$/.test(text.trim()) || formatNumber(target, digits, lang) !== raw || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || !el) { setShown(text); setReady(true); return; }
    const render = (v: number) => text.replace(raw, formatNumber(v, digits, lang));
    let raf = 0;
    setShown(render(0));
    setReady(true);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        setShown(render(target * (1 - Math.pow(1 - p, 4))));
        if (p < 1) raf = requestAnimationFrame(tick); else setShown(text);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.2 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [text, duration, lang]);

  return <span ref={ref} className={`countup tabular ${ready ? "ready" : ""} ${className}`} aria-label={text}>{shown}</span>;
}
