"use client";
import { useEffect, useRef, useState } from "react";

const RE = /\d[\d'’]*(?:\.\d+)?/;

/**
 * Shows a formatted figure ("29’051 CHF", "86.4 mld CHF") counting up from zero the first time it is seen.
 * The server prints the final text, so the figure is there without JavaScript too. Plain years are left alone.
 */
export function CountUp({ text, duration = 1400, className = "" }: { text: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(text);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const m = text.match(RE);
    const el = ref.current;
    const still = !m || /^(19|20)\d\d$/.test(text.trim()) || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || !el) { setShown(text); setReady(true); return; }
    const raw = m[0];
    const sep = raw.match(/['’]/)?.[0] ?? "";
    const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
    const target = Number(raw.replace(/['’]/g, ""));
    const render = (v: number) => {
      const [int, dec] = v.toFixed(decimals).split(".");
      const grouped = sep ? int.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : int;
      return text.replace(raw, dec ? `${grouped}.${dec}` : grouped);
    };
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
  }, [text, duration]);

  return <span ref={ref} className={`countup tabular ${ready ? "ready" : ""} ${className}`} aria-label={text}>{shown}</span>;
}
