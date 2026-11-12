"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useL } from "@/lib/useLang";

export type TreeItem = { name: string; value: number; sub?: string; children?: TreeItem[] };
type Rect = { x: number; y: number; w: number; h: number };
type Placed = Rect & { item: TreeItem; share: number };

/** Squarified treemap (Bruls et al.), items must be sorted by value desc. */
function squarify(items: TreeItem[], rect: Rect): Placed[] {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (!total || rect.w <= 0 || rect.h <= 0) return [];
  const scale = (rect.w * rect.h) / total;
  const areas = items.map((i) => i.value * scale);
  const out: Placed[] = [];
  let { x, y, w, h } = rect;
  let row: number[] = [];
  let rowStart = 0;
  const worst = (r: number[], side: number) => {
    const s = r.reduce((a, b) => a + b, 0);
    const mx = Math.max(...r), mn = Math.min(...r);
    return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
  };
  const layout = (r: number[], start: number) => {
    const s = r.reduce((a, b) => a + b, 0);
    if (w >= h) {
      const rw = s / h;
      let yy = y;
      r.forEach((a, k) => { const hh = a / rw; out.push({ x, y: yy, w: rw, h: hh, item: items[start + k], share: items[start + k].value / total }); yy += hh; });
      x += rw; w -= rw;
    } else {
      const rh = s / w;
      let xx = x;
      r.forEach((a, k) => { const ww = a / rh; out.push({ x: xx, y, w: ww, h: rh, item: items[start + k], share: items[start + k].value / total }); xx += ww; });
      y += rh; h -= rh;
    }
  };
  for (let i = 0; i < areas.length; i++) {
    const side = Math.min(w, h);
    if (row.length === 0 || worst(row, side) >= worst([...row, areas[i]], side)) {
      row.push(areas[i]);
    } else {
      layout(row, rowStart);
      rowStart = i;
      row = [areas[i]];
    }
  }
  if (row.length) layout(row, rowStart);
  return out;
}

const RAMP = ["var(--seq-1)", "var(--seq-2)", "var(--seq-3)", "var(--seq-4)", "var(--seq-5)"];
const INK = ["var(--seq-ink-1)", "var(--seq-ink-2)", "var(--seq-ink-3)", "var(--seq-ink-4)", "var(--seq-ink-5)"];
const stepFor = (share: number) => (share >= 0.25 ? 4 : share >= 0.12 ? 3 : share >= 0.06 ? 2 : share >= 0.02 ? 1 : 0);

/** Click-to-drill treemap. Color = share of the current level (sequential, darker = bigger); labels carry identity. */
export function Treemap({ root, height, unitLabel = "" }: { root: TreeItem; height?: number; unitLabel?: string }) {
  const { chf: format, share, T } = useL();
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [path, setPath] = useState<TreeItem[]>([]);
  const [hover, setHover] = useState<{ p: Placed; x: number; y: number } | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((e) => setWidth(e[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const node = path.length ? path[path.length - 1] : root;
  const items = useMemo(() => (node.children ?? []).filter((c) => c.value > 0).sort((a, b) => b.value - a.value), [node]);
  const h = height ?? Math.max(300, Math.min(520, width * 0.5));
  const rects = useMemo(() => squarify(items, { x: 0, y: 0, w: width, h }), [items, width, h]);
  const total = items.reduce((s, i) => s + i.value, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
        <button type="button" className={`rounded-full px-3 py-0.5 border border-border ${path.length ? "hover:bg-surface-2" : "text-faint cursor-default"}`} onClick={() => setPath([])} disabled={!path.length}>{root.name}</button>
        {path.map((p, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-faint">›</span>
            <button type="button" className="rounded-full px-3 py-0.5 border border-border hover:bg-surface-2" onClick={() => setPath(path.slice(0, i + 1))}>{p.name}</button>
          </span>
        ))}
        <span className="ml-auto text-muted tabular">{format(total)}{unitLabel && <span className="text-faint"> {unitLabel}</span>}</span>
      </div>
      <div ref={ref} className="relative w-full select-none" style={{ height: h }}>
        <svg width={width} height={h} className="block" role="img" aria-label={`Treemap: ${node.name}`}>
          {rects.map((r, i) => {
            const step = stepFor(r.share);
            const drill = !!r.item.children?.length;
            const big = r.w > 90 && r.h > 44;
            const mid = r.w > 56 && r.h > 20;
            return (
              <g key={`${path.length}-${i}`} className="tm-cell" onClick={() => drill && setPath([...path, r.item])} onMouseMove={(e) => { const b = ref.current!.getBoundingClientRect(); setHover({ p: r, x: e.clientX - b.left, y: e.clientY - b.top }); }} onMouseLeave={() => setHover(null)} style={{ cursor: drill ? "pointer" : "default", ["--i" as string]: i }} role={drill ? "button" : undefined} tabIndex={drill ? 0 : undefined} onKeyDown={(e) => { if (drill && (e.key === "Enter" || e.key === " ")) setPath([...path, r.item]); }}>
                <rect x={r.x + 1} y={r.y + 1} width={Math.max(0, r.w - 2)} height={Math.max(0, r.h - 2)} rx={7} style={{ fill: RAMP[step] }} />
                {(big || mid) && (
                  <text x={r.x + 8} y={r.y + 18} style={{ fill: INK[step], fontSize: 13, fontWeight: 600 }}>
                    {clip(r.item.name, r.w - 14, 7)}
                  </text>
                )}
                {big && (
                  <text x={r.x + 8} y={r.y + 36} style={{ fill: INK[step], fillOpacity: 0.8, fontSize: 12 }}>
                    {format(r.item.value)} · {share(r.share * 100)} %{drill ? " ›" : ""}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {hover && (
          <div className="pointer-events-none absolute z-10 rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg" style={{ left: Math.min(hover.x + 12, width - 260), top: hover.y + 12, maxWidth: 250 }}>
            <div className="font-semibold">{hover.p.item.name}</div>
            {hover.p.item.sub && <div className="text-faint">{hover.p.item.sub}</div>}
            <div className="text-muted tabular">{format(hover.p.item.value)} · {share(hover.p.share * 100)} % {T("di", "of")} {node.name}</div>
            {hover.p.item.children?.length ? <div className="text-faint">{T("Clicca per aprire", "Click to open")} ({hover.p.item.children.length} {T("voci", "items")})</div> : null}
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-faint">{T("Area = importo. Colore più scuro = quota maggiore del livello mostrato. Clicca una voce con «›» per entrare, usa le briciole in alto per tornare.", "Area = amount. Darker colour = larger share of the level shown. Click an item with «›» to go in, use the trail at the top to go back.")}</p>
    </div>
  );
}

function clip(s: string, px: number, charW: number): string {
  const max = Math.max(3, Math.floor(px / charW));
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
