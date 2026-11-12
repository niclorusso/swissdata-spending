"use client";
import { useEffect, useState } from "react";
import { useL } from "@/lib/useLang";

/** Francs spent since the page was opened, at the average rate of the year (total divided by the seconds of that year). */
export function LiveCounter({ perSecond }: { perSecond: number }) {
  const { num } = useL();
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (t: number) => { setV(((t - t0) / 1000) * perSecond); raf = requestAnimationFrame(tick); };
    if (still) { const id = setInterval(() => setV(((performance.now() - t0) / 1000) * perSecond), 1000); return () => clearInterval(id); }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [perSecond]);
  return <span className="tabular">{num(Math.round(v))}</span>;
}
