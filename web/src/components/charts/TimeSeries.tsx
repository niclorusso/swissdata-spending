"use client";
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useL } from "@/lib/useLang";
import { useInView } from "@/lib/useInView";

export type Row = Record<string, number | string | null>;
const COLORS = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)", "var(--s6)", "var(--s7)", "var(--s8)"];

type Props = {
  rows: Row[]; series: string[]; yearStatus?: Record<string, string>;
  kind?: "line" | "stacked"; unit?: "chf" | "pct" | "num"; height?: number; colors?: string[]; zero?: boolean;
};

/** Single-axis time series. Years marked VA/FP get a shaded band so forecasts never read as facts. */
export function TimeSeries({ rows, series, yearStatus = {}, kind = "line", unit = "chf", height = 320, colors = COLORS, zero = false }: Props) {
  const { chf, num, status, T } = useL();
  const [ref, seen] = useInView<HTMLDivElement>();
  const fmt = (v: number) => (unit === "chf" ? chf(v, { unit: false }) : unit === "pct" ? `${num(v, v % 1 ? 1 : 0)} %` : num(v));
  const years = rows.map((r) => Number(r.year));
  const firstVA = years.find((y) => yearStatus[String(y)] && yearStatus[String(y)] !== "R");
  const last = years[years.length - 1];
  const common = {
    data: rows, margin: { top: 8, right: 12, left: 4, bottom: 0 },
  };
  // NB: Recharts does not look inside <Fragment>, so the shared elements are passed as a keyed array.
  const axes = [
    <CartesianGrid key="grid" stroke="var(--grid)" vertical={false} />,
    <XAxis key="x" dataKey="year" tick={{ fill: "var(--muted)", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "var(--border)" }} minTickGap={24} />,
    <YAxis key="y" domain={zero ? [(min: number) => Math.min(0, min), (max: number) => Math.max(0, max)] : undefined} tickFormatter={fmt} tick={{ fill: "var(--muted)", fontSize: 12 }} tickLine={false} axisLine={false} width={64} />,
    <Tooltip
      key="tip"
      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, boxShadow: "var(--shadow)" }}
      labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
      itemStyle={{ color: "var(--foreground)" }}
      labelFormatter={(y) => `${y}${yearStatus[String(y)] ? ` · ${status(yearStatus[String(y)])}` : ""}`}
      formatter={(v: number, name: string) => [unit === "chf" ? chf(v) : fmt(v), name]}
    />,
    zero ? <ReferenceLine key="zero" y={0} stroke="var(--foreground)" strokeWidth={1} /> : null,
    firstVA ? <ReferenceArea key="ref" x1={firstVA} x2={last} fill="var(--surface-2)" fillOpacity={0.7} label={{ value: T("preventivo / piano", "budget / plan"), position: "insideTopRight", fill: "var(--faint)", fontSize: 11 }} /> : null,
    series.length > 1 ? <Legend key="legend" wrapperStyle={{ fontSize: 12 }} formatter={(v: string) => <span style={{ color: "var(--muted)" }}>{v}</span>} /> : null,
  ];
  return (
    <div ref={ref} style={{ width: "100%", height }}>
      {seen && <ResponsiveContainer>
        {kind === "stacked" ? (
          <AreaChart {...common}>
            {axes}
            {series.map((s, i) => (
              <Area key={s} type="linear" dataKey={s} stackId="1" stroke={colors[i % colors.length]} strokeWidth={0} legendType="square" fill={colors[i % colors.length]} fillOpacity={0.9} animationDuration={1100} animationEasing="ease-out" />
            ))}
          </AreaChart>
        ) : (
          <LineChart {...common}>
            {axes}
            {series.map((s, i) => (
              <Line key={s} type="linear" dataKey={s} stroke={colors[i % colors.length]} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} animationDuration={1300} animationEasing="ease-out" connectNulls />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>}
    </div>
  );
}
