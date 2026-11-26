"use client";
import { useEffect, useRef, useState } from "react";
import { CartesianGrid, ReferenceDot, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis } from "recharts";
import type { MapUnit } from "@/lib/format";
import { useL } from "@/lib/useLang";
import { useInView } from "@/lib/useInView";

export type ScatterPoint = { id: string; name: string; x: number; y: number };

/**
 * Round tick values covering the data, about `n` steps, whole numbers only.
 * Amounts in CHF always include zero; rates in % may start above it (the plot then says where the axis starts).
 */
function axisTicks(values: number[], unit: MapUnit, n: number): number[] {
  if (!values.length) return [0, 1];
  let lo = Math.min(...values), hi = Math.max(...values);
  if (unit !== "pct") { lo = Math.min(0, lo); hi = Math.max(0, hi); }
  if (lo === hi) hi = lo + 1;
  const raw = (hi - lo) / n, p = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * p).find((s) => s >= raw) ?? 10 * p);
  const out: number[] = [];
  for (let t = Math.floor(lo / step) * step; t <= Math.ceil(hi / step) * step; t += step) out.push(t);
  return out;
}

/**
 * One dot per item, two linear axes. No trend line and no coefficient: the plot shows the values and nothing derived from them.
 * The dots are not keyboard stops: `description` is read in their place and the values are in the table next to the plot.
 * Pointer and touch pick the dot closest to the point touched, so overlapping dots can still be told apart.
 */
export function ScatterPlot({ points, xTitle, yTitle, xUnit, yUnit, active, onActive, description, height = 360 }: {
  points: ScatterPoint[]; xTitle: string; yTitle: string; xUnit: MapUnit; yUnit: MapUnit;
  active: string | null; onActive: (id: string | null) => void; description: string; height?: number;
}) {
  const { short, T } = useL();
  const [ref, seen] = useInView<HTMLDivElement>();
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  // Fewer steps on a narrow screen, so that every tick label fits and none is dropped.
  const xTicks = axisTicks(points.map((p) => p.x), xUnit, width && width < 480 ? 3 : 6);
  const yTicks = axisTicks(points.map((p) => p.y), yUnit, 4);
  const tick = { fill: "var(--muted)", fontSize: 12 };
  const on = points.find((p) => p.id === active);
  const inside = (t: number[]) => t[0] < 0 && t[t.length - 1] > 0;
  const startsAt = (t: number[], unit: MapUnit) => (t[0] === 0 ? null : <span className="font-normal text-muted" data-axis-start={t[0]}> · {T("l'asse parte da", "the axis starts at")} {short(t[0], unit)}</span>);
  /** The dot closest to the pointer, within 16 px: by distance, not by which element is on top. */
  const nearest = (box: HTMLDivElement, x: number, y: number): string | null => {
    const svg = box.querySelector("svg");
    if (!svg) return null;
    const b = svg.getBoundingClientRect();
    let best: string | null = null, min = 16 * 16;
    for (const c of svg.querySelectorAll<SVGCircleElement>("circle[data-dot]")) {
      const d = (c.cx.baseVal.value - (x - b.left)) ** 2 + (c.cy.baseVal.value - (y - b.top)) ** 2;
      if (d < min) { min = d; best = c.dataset.dot ?? null; }
    }
    return best;
  };
  // A finger: the dot is chosen from the point touched. The mouse events the browser makes up after a tap are ignored,
  // because it moves them onto a nearby element and they would pick another dot.
  const touch = useRef({ x: 0, y: 0, at: 0 });
  const afterTouch = () => Date.now() - touch.current.at < 800;
  const touchStart = (e: React.TouchEvent<HTMLDivElement>) => { const t = e.changedTouches[0]; touch.current = { x: t.clientX, y: t.clientY, at: Date.now() }; };
  const touchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.changedTouches[0], from = touch.current;
    touch.current = { ...from, at: Date.now() };
    if (Math.hypot(t.clientX - from.x, t.clientY - from.y) > 10) return; // the page was scrolled, not tapped
    const id = nearest(e.currentTarget, t.clientX, t.clientY);
    if (id !== active) onActive(id);
  };
  const point = (e: React.MouseEvent<HTMLDivElement>) => { if (afterTouch()) return; const id = nearest(e.currentTarget, e.clientX, e.clientY); if (id !== active) onActive(id); };
  return (
    <div>
      <div className="text-xs font-medium text-foreground" data-axis-title="y"><span aria-hidden>↑ </span>{yTitle}{startsAt(yTicks, yUnit)}</div>
      <div ref={ref} className="mt-1" style={{ width: "100%", height }} role="img" aria-label={description} onMouseMove={point} onClick={point} onMouseLeave={() => { if (!afterTouch()) onActive(null); }} onTouchStart={touchStart} onTouchEnd={touchEnd}>
        {seen && <ResponsiveContainer>
          <ScatterChart margin={{ top: 10, right: 28, left: 4, bottom: 0 }}>
            <CartesianGrid stroke="var(--grid)" />
            <XAxis type="number" dataKey="x" name={xTitle} domain={[xTicks[0], xTicks[xTicks.length - 1]]} ticks={xTicks} interval={0} tickFormatter={(v: number) => short(v, xUnit)} tick={tick} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            <YAxis type="number" dataKey="y" name={yTitle} domain={[yTicks[0], yTicks[yTicks.length - 1]]} ticks={yTicks} interval={0} tickFormatter={(v: number) => short(v, yUnit)} tick={tick} tickLine={false} axisLine={false} width={56} />
            {inside(xTicks) && <ReferenceLine x={0} stroke="var(--foreground)" strokeWidth={1} />}
            {inside(yTicks) && <ReferenceLine y={0} stroke="var(--foreground)" strokeWidth={1} />}
            <Scatter data={points} isAnimationActive={false} shape={(p: { cx?: number; cy?: number; payload?: ScatterPoint }) => {
              const d = p.payload!;
              return <circle data-dot={d.id} data-name={d.name} data-x={d.x} data-y={d.y} cx={p.cx} cy={p.cy} r={4.5} style={{ fill: "var(--s1)", fillOpacity: 0.75, stroke: "var(--surface)", strokeWidth: 1 }} />;
            }} />
            {on && <ReferenceDot x={on.x} y={on.y} isFront shape={(p: { cx?: number; cy?: number }) => <circle data-dot-active={on.id} cx={p.cx} cy={p.cy} r={7} style={{ fill: "var(--s1)", stroke: "var(--foreground)", strokeWidth: 2, pointerEvents: "none" }} />} />}
          </ScatterChart>
        </ResponsiveContainer>}
      </div>
      <div className="mt-1 text-right text-xs font-medium text-foreground" data-axis-title="x">{xTitle}{startsAt(xTicks, xUnit)}<span aria-hidden> →</span></div>
    </div>
  );
}
