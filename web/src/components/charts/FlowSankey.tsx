"use client";
import { useState } from "react";
import { Layer, Rectangle, ResponsiveContainer, Sankey } from "recharts";
import { useL } from "@/lib/useLang";

export type FlowNode = { name: string; side: "in" | "hub" | "out"; amount: number };
export type FlowLink = { source: number; target: number; value: number };

const IN = "var(--s1)", OUT = "var(--s2)";
type NodeProps = { x: number; y: number; width: number; height: number; index: number; payload: FlowNode };
type LinkProps = { sourceX: number; targetX: number; sourceY: number; targetY: number; sourceControlX: number; targetControlX: number; linkWidth: number; index: number; payload: { source: FlowNode; target: FlowNode; value: number } };

/** Where the money comes from (left, blue) and where it goes (right, orange), through one hub. Bands carry the colour of their side. */
export function FlowSankey({ nodes, links, height = 620 }: { nodes: FlowNode[]; links: FlowLink[]; height?: number }) {
  const { chf, T } = useL();
  const [hover, setHover] = useState<number | null>(null);

  const Node = ({ x, y, width, height: h, payload }: NodeProps) => {
    if (payload.side === "hub") return <Layer><Rectangle x={x} y={y} width={width} height={h} fill="var(--foreground)" radius={2} /></Layer>;
    const left = payload.side === "in";
    const tx = left ? x - 8 : x + width + 8;
    const two = h >= 30;
    return (
      <Layer>
        <Rectangle x={x} y={y} width={width} height={h} fill={left ? IN : OUT} radius={2} />
        <text x={tx} y={y + h / 2} textAnchor={left ? "end" : "start"} dominantBaseline="middle" style={{ fontSize: 12.5, fill: "var(--foreground)" }}>
          <tspan x={two ? tx : undefined} dy={two ? -8 : 0} style={{ fontWeight: 600 }}>{clip(payload.name, 52)}</tspan>
          <tspan x={two ? tx : undefined} dy={two ? 16 : 0} style={{ fill: "var(--muted)" }}>{two ? "" : "  "}{chf(payload.amount)}</tspan>
        </text>
      </Layer>
    );
  };

  const Link = ({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index, payload }: LinkProps) => {
    const incoming = payload.target.side === "hub";
    const dim = hover !== null && hover !== index;
    return (
      <path d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`} fill="none"
        stroke={incoming ? IN : OUT} strokeWidth={Math.max(1, linkWidth)} strokeOpacity={dim ? 0.12 : hover === index ? 0.55 : 0.3}
        onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)} style={{ transition: "stroke-opacity .15s" }}>
        <title>{`${incoming ? payload.source.name : payload.target.name}: ${chf(payload.value)}`}</title>
      </path>
    );
  };

  return (
    <div className="overflow-x-auto">
      <div style={{ width: "100%", minWidth: 960, height }}>
        <ResponsiveContainer>
          <Sankey data={{ nodes, links }} nodeWidth={14} nodePadding={10} sort={false} iterations={0} margin={{ top: 8, right: 380, bottom: 8, left: 230 }}
            node={(p: NodeProps) => <Node {...p} />} link={(p: LinkProps) => <Link {...p} />} />
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-[2px]" style={{ background: IN }} />{T("Entrate", "Revenue")}</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-[2px]" style={{ background: OUT }} />{T("Spese", "Spending")}</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-[2px]" style={{ background: "var(--foreground)" }} />{T("Confederazione", "Confederation")}</span>
      </div>
    </div>
  );
}

function clip(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
