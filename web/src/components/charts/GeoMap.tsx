"use client";
import { useMemo, useRef, useState } from "react";
import type { MapUnit } from "@/lib/format";
import { useL } from "@/lib/useLang";

const RAMP = ["var(--seq-1)", "var(--seq-2)", "var(--seq-3)", "var(--seq-4)", "var(--seq-5)"];
const INK = ["var(--seq-ink-1)", "var(--seq-ink-2)", "var(--seq-ink-3)", "var(--seq-ink-4)", "var(--seq-ink-5)"];
type Cls = { lo: number; hi: number; color: string; ink: string };

/** Split sorted values into n classes with the same number of items each. */
function quantiles(sorted: number[], n: number): [number, number][] {
  const k = Math.min(n, sorted.length);
  return Array.from({ length: k }, (_, i) => [sorted[Math.floor((i * sorted.length) / k)], sorted[Math.min(sorted.length - 1, Math.floor(((i + 1) * sorted.length) / k))]] as [number, number]);
}

/** One hue, five classes. With `diverging`, values below zero get a second hue so the sign is never hidden inside a class. */
function classify(vals: number[], diverging: boolean): Cls[] {
  if (!vals.length) return [];
  const neg = vals.filter((v) => v < 0), pos = vals.filter((v) => v >= 0);
  if (!diverging || !neg.length || !pos.length) return quantiles(vals, 5).map(([lo, hi], i) => ({ lo, hi, color: RAMP[i], ink: INK[i] }));
  const nNeg = neg.length >= vals.length * 0.3 ? 2 : 1;
  const negCls = quantiles(neg, nNeg).map(([lo], i, a) => ({ lo, hi: i === a.length - 1 ? 0 : a[i + 1][0], color: a.length === 2 && i === 0 ? "var(--neg-2)" : "var(--neg-1)", ink: "#14161a" }));
  const steps = [1, 2, 4];
  const posCls = quantiles(pos, 3).map(([lo, hi], i) => ({ lo: i === 0 ? 0 : lo, hi, color: RAMP[steps[i]], ink: INK[steps[i]] }));
  return [...negCls, ...posCls];
}
const TIP_W = 240;

export type Shape = { id: string; d: string };
export type MapDatum = { name: string; value: number | null; sub?: string; href?: string };
export type { MapUnit };

/**
 * Choropleth: five equal-count classes of one hue (light = low, dark = high).
 * Shapes without a value stay neutral, so missing data never reads as "low".
 * Mouse: hover shows the value, click opens the page. Touch: first tap shows the value and a link.
 */
export function GeoMap({ viewBox, shapes, data, unit = "chf", legendTitle, context = [], lakes = [], labels, stroke = 1, credit = true, diverging = false }: {
  viewBox: number[]; shapes: Shape[]; data: Record<string, MapDatum>; unit?: MapUnit; legendTitle: string;
  context?: string[]; lakes?: string[]; labels?: Record<string, number[]>; stroke?: number; credit?: boolean; diverging?: boolean;
}) {
  const { formatUnit, T, h: href } = useL();
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ id: string; x: number; y: number; w: number } | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const vals = useMemo(() => Object.values(data).map((d) => d.value).filter((v): v is number => v !== null && v !== undefined).sort((a, b) => a - b), [data]);
  const classes = useMemo(() => classify(vals, diverging), [vals, diverging]);
  const clsOf = (v: number) => classes.findLast((c) => v >= c.lo) ?? classes[0];
  const missing = shapes.some((s) => data[s.id]?.value === null || data[s.id]?.value === undefined);
  const h = hover ? data[hover.id] : null;
  const pin = pinned ? data[pinned] : null;
  const active = hover?.id ?? pinned;

  return (
    <div className="relative" ref={box}>
      <svg data-reveal="map" viewBox={viewBox.join(" ")} className="w-full h-auto max-h-[640px]" role="img" aria-label={legendTitle} onMouseLeave={() => setHover(null)}>
        {context.map((d, i) => <path key={`c${i}`} d={d} vectorEffect="non-scaling-stroke" style={{ fill: "var(--background)", stroke: "var(--border)", strokeWidth: 0.6 }} />)}
        {shapes.map((s) => {
          const datum = data[s.id];
          const v = datum?.value ?? null;
          const path = (
            <path key={s.id} d={s.d} vectorEffect="non-scaling-stroke" className="map-shape"
              style={{ fill: v === null ? "var(--surface-2)" : clsOf(v).color, stroke: "var(--surface)", strokeWidth: stroke, cursor: datum?.href ? "pointer" : "default" }}
              onMouseMove={(e) => { if (window.matchMedia("(hover: none)").matches) return; const b = box.current!.getBoundingClientRect(); if (datum) setHover({ id: s.id, x: e.clientX - b.left, y: e.clientY - b.top, w: b.width }); }} />
          );
          if (!datum?.href) return path;
          return (
            <a key={s.id} href={href(datum.href)} aria-label={`${datum.name}: ${v === null ? T("nessun dato", "no data") : formatUnit(v, unit)}`}
              onClick={(e) => { if (window.matchMedia("(hover: none)").matches && pinned !== s.id) { e.preventDefault(); setPinned(s.id); } }}>{path}</a>
          );
        })}
        {lakes.map((d, i) => <path key={`l${i}`} d={d} style={{ fill: "var(--water)", pointerEvents: "none" }} />)}
        {active && shapes.filter((s) => s.id === active).map((s) => <path key="hl" d={s.d} vectorEffect="non-scaling-stroke" style={{ fill: "none", stroke: "var(--foreground)", strokeWidth: 2, pointerEvents: "none" }} />)}
        {labels && Object.entries(labels).map(([id, [x, y, room]]) => {
          const size = Math.min((viewBox[2] / 1000) * 17, (room ?? 20) * 1.3);
          if (size < (viewBox[2] / 1000) * 10) return null; // no room: the tooltip and the list carry the name
          const v = data[id]?.value;
          return <text key={id} x={x} y={y} textAnchor="middle" dominantBaseline="central" style={{ fontSize: size, fontWeight: 600, fill: v !== null && v !== undefined ? clsOf(v).ink : "var(--foreground)", pointerEvents: "none" }}>{id.toUpperCase()}</text>;
        })}
      </svg>
      {hover && h && (
        <div className="pointer-events-none absolute z-10 rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg" style={{ width: TIP_W, left: hover.x + 14 + TIP_W > hover.w ? Math.max(0, hover.x - 14 - TIP_W) : hover.x + 14, top: hover.y + 14 }}>
          <div className="font-semibold text-sm">{h.name}</div>
          <div className="text-muted">{legendTitle}</div>
          <div className="tabular text-sm font-medium">{h.value === null ? T("nessun dato", "no data") : formatUnit(h.value, unit)}</div>
          {h.sub && <div className="text-muted mt-0.5 leading-snug">{h.sub}</div>}
        </div>
      )}
      {pin && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-foreground bg-surface px-3 py-2 text-sm">
          <div className="min-w-0">
            <span className="font-semibold">{pin.name}</span> · <span className="tabular">{pin.value === null ? T("nessun dato", "no data") : formatUnit(pin.value, unit)}</span>
            {pin.sub && <div className="text-xs text-muted">{pin.sub}</div>}
          </div>
          {pin.href && <a href={href(pin.href)} className="btn shrink-0">{T("Apri", "Open")} →</a>}
        </div>
      )}
      <Legend title={legendTitle} classes={classes} unit={unit} missing={missing} />
      {credit && <p className="mt-1.5 text-[11px] text-faint">{T("Confini: UST, GEOSTAT / swisstopo (generalizzati).", "Boundaries: FSO, GEOSTAT / swisstopo (generalised).")}</p>}
    </div>
  );
}

/** Stepped scale: joined swatches, the class limits written under the joints. */
function Legend({ title, classes, unit, missing }: { title: string; classes: Cls[]; unit: MapUnit; missing: boolean }) {
  const { formatUnit, T } = useL();
  if (!classes.length) return null;
  const ticks = [classes[0].lo, ...classes.map((c) => c.hi)];
  const n = classes.length;
  const short = (v: number) => formatUnit(Math.round(v), unit).replace(" CHF", "").replace(" %", "");
  return (
    <div className="mt-3 text-xs text-muted">
      <div className="font-medium text-foreground">{title}{/CHF|%/.test(title) ? "" : unit === "chf" ? ", in CHF" : unit === "pct" ? ", in %" : ""}</div>
      <div className="mt-1.5 flex items-start gap-4 flex-wrap">
        <div className="w-full max-w-[340px]">
          <div className="flex h-2.5 gap-[2px]">{classes.map((c, i) => <span key={i} className="flex-1 first:rounded-l-[2px] last:rounded-r-[2px]" style={{ background: c.color }} />)}</div>
          <div className="relative mt-1 h-4 tabular text-[11px]">{ticks.map((t, i) => <span key={i} className={`absolute whitespace-nowrap ${t === 0 && i > 0 && i < n ? "font-semibold text-foreground" : ""}`} style={{ left: `${(i * 100) / n}%`, transform: i === 0 ? "none" : i === n ? "translateX(-100%)" : "translateX(-50%)" }}>{short(t)}</span>)}</div>
        </div>
        {missing && <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-2.5 rounded-[2px] border border-border" style={{ background: "var(--surface-2)" }} />{T("nessun dato", "no data")}</span>}
      </div>
      <div className="mt-0.5 text-[11px] text-faint">{classes.some((c) => c.color.includes("neg")) ? T("Arancione: sotto zero. Blu: sopra zero.", "Orange: below zero. Blue: above zero.") : T("Ogni colore copre un quinto dei territori.", "Each colour covers one fifth of the areas.")}</div>
    </div>
  );
}
