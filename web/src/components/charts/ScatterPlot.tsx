"use client";
import { CartesianGrid, ReferenceDot, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis } from "recharts";
import type { MapUnit } from "@/lib/format";
import { useL } from "@/lib/useLang";
import { useInView } from "@/lib/useInView";

export type ScatterPoint = { id: string; name: string; x: number; y: number };

/**
 * One dot per item, two linear axes. No trend line and no coefficient: the plot shows the values and nothing derived from them.
 * The dots are not keyboard stops: `description` is read in their place and the values are in the table next to the plot.
 */
export function ScatterPlot({ points, xTitle, yTitle, xUnit, yUnit, active, onActive, description, height = 360 }: {
  points: ScatterPoint[]; xTitle: string; yTitle: string; xUnit: MapUnit; yUnit: MapUnit;
  active: string | null; onActive: (id: string | null) => void; description: string; height?: number;
}) {
  const { formatUnit } = useL();
  const [ref, seen] = useInView<HTMLDivElement>();
  const short = (unit: MapUnit) => (v: number) => formatUnit(v, unit).replace(" CHF", "").replace(" %", "");
  const tick = { fill: "var(--muted)", fontSize: 12 };
  const on = points.find((p) => p.id === active);
  /** The dot closest to the pointer, within 16 px: dots that overlap are told apart by distance, not by which was drawn last. */
  const nearest = (e: React.MouseEvent<HTMLDivElement>): string | null => {
    const svg = e.currentTarget.querySelector("svg");
    if (!svg) return null;
    const b = svg.getBoundingClientRect();
    let best: string | null = null, min = 16 * 16;
    for (const c of svg.querySelectorAll<SVGCircleElement>("circle[data-dot]")) {
      const d = (c.cx.baseVal.value - (e.clientX - b.left)) ** 2 + (c.cy.baseVal.value - (e.clientY - b.top)) ** 2;
      if (d < min) { min = d; best = c.dataset.dot ?? null; }
    }
    return best;
  };
  const point = (e: React.MouseEvent<HTMLDivElement>) => { const id = nearest(e); if (id !== active) onActive(id); };
  const crossesZero = (k: "x" | "y") => points.some((p) => p[k] < 0) && points.some((p) => p[k] > 0);
  return (
    <div>
      <div className="text-xs font-medium text-foreground" data-axis-title="y"><span aria-hidden>↑ </span>{yTitle}</div>
      <div ref={ref} className="mt-1" style={{ width: "100%", height }} role="img" aria-label={description} onMouseMove={point} onClick={point} onMouseLeave={() => onActive(null)}>
        {seen && <ResponsiveContainer>
          <ScatterChart margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
            <CartesianGrid stroke="var(--grid)" />
            <XAxis type="number" dataKey="x" name={xTitle} domain={["auto", "auto"]} tickFormatter={short(xUnit)} tick={tick} tickLine={false} axisLine={{ stroke: "var(--border)" }} minTickGap={16} />
            <YAxis type="number" dataKey="y" name={yTitle} domain={["auto", "auto"]} tickFormatter={short(yUnit)} tick={tick} tickLine={false} axisLine={false} width={56} />
            {crossesZero("x") && <ReferenceLine x={0} stroke="var(--foreground)" strokeWidth={1} />}
            {crossesZero("y") && <ReferenceLine y={0} stroke="var(--foreground)" strokeWidth={1} />}
            <Scatter data={points} isAnimationActive={false} shape={(p: { cx?: number; cy?: number; payload?: ScatterPoint }) => {
              const d = p.payload!;
              return <circle data-dot={d.id} data-name={d.name} data-x={d.x} data-y={d.y} cx={p.cx} cy={p.cy} r={4.5} style={{ fill: "var(--s1)", fillOpacity: 0.75, stroke: "var(--surface)", strokeWidth: 1 }} />;
            }} />
            {on && <ReferenceDot x={on.x} y={on.y} isFront shape={(p: { cx?: number; cy?: number }) => <circle data-dot-active={on.id} cx={p.cx} cy={p.cy} r={7} style={{ fill: "var(--s1)", stroke: "var(--foreground)", strokeWidth: 2, pointerEvents: "none" }} />} />}
          </ScatterChart>
        </ResponsiveContainer>}
      </div>
      <div className="mt-1 text-right text-xs font-medium text-foreground" data-axis-title="x">{xTitle}<span aria-hidden> →</span></div>
    </div>
  );
}
