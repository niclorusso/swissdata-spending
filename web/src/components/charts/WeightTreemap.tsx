"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { squarify, type Rect } from "@/components/charts/Treemap";
import type { QpGroup } from "@/lib/quanto-pesa";

/** Neutral tones from the page's own colours, so light and dark themes both work; the accent is the site's. */
const GREY = "color-mix(in srgb, var(--foreground) 13%, var(--surface))";
const GREY_ON = "color-mix(in srgb, var(--foreground) 24%, var(--surface))";
const INK = "color-mix(in srgb, var(--foreground) 80%, var(--surface))";
const GROUP_GAP = 2.5; // half the white line between two task areas
const CELL_GAP = 0.75; // half the line between two lines of the same area

type Cell = Rect & { code: string; name: string; value: number; group: string };
export type Highlight = { code: string; name: string; value: number; line2: string };

/** Rough text width (Inter), on the safe side: enough to decide whether a label fits and where to cut it. */
const textW = (s: string, size: number) => s.length * size * 0.6;
const clip = (s: string, px: number, size: number) => {
  const max = Math.floor(px / (size * 0.6));
  return s.length <= max ? s : max < 4 ? "" : s.slice(0, max - 1).trimEnd() + "…";
};
const inset = (r: Rect, d: number): Rect => ({ x: r.x + d, y: r.y + d, w: Math.max(0, r.w - 2 * d), h: Math.max(0, r.h - 2 * d) });
/** Greedy wrap into lines of at most `px` pixels, whole words only (a word longer than a line stays as it is). */
function words(s: string, px: number, size: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const w of s.split(" ")) {
    const next = line ? `${line} ${w}` : w;
    if (textW(next, size) > px && line) { out.push(line); line = w; } else line = next;
  }
  if (line) out.push(line);
  return out;
}
/** The same, cutting a word that does not fit with «…». */
const wrap = (s: string, px: number, size: number) => words(s, px, size).map((l) => (textW(l, size) > px ? clip(l, px, size) : l));

/** Label of a grey cell: the name on as many lines as fit, then amount and share if there is room. Words are never cut:
 *  a name that does not fit, or that would keep fewer than ten letters, is left to the tooltip and the table. */
function cellLabel(name: string, line2: string, r: Rect): { lines: string[]; amount: boolean } | null {
  if (r.w < 44 || r.h < 20) return null;
  const avail = r.w - 12;
  const all = words(name, avail, 12);
  if (all.some((l) => textW(l, 12) > avail)) return null;
  const room = Math.floor((r.h - 6) / 14);
  if (all.length <= room) return { lines: all, amount: room >= all.length + 1 && textW(line2, 11) <= avail };
  if (room < 1) return null;
  const lines = all.slice(0, room);
  const last = lines[room - 1].split(" ");
  if (textW(`${last.join(" ")} …`, 12) > avail) last.pop();
  if (!last.length) return null;
  lines[room - 1] = `${last.join(" ")} …`;
  return lines.join(" ").length >= 12 ? { lines, amount: false } : null;
}

/** The whole of public spending as a two-level treemap (task areas, then their lines), all grey but the highlighted item. */
export function WeightTreemap({ groups, total, highlight, ariaLabel, fmt }: {
  groups: QpGroup[]; total: number; highlight: Highlight | null; ariaLabel: string;
  fmt: { cell: (value: number, share: number) => string; aria: (name: string, value: number, share: number) => string };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [tip, setTip] = useState<{ c: Cell; x: number; y: number; up: number } | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((e) => setWidth(Math.floor(e[0].contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  // Phones get a tall map, wide screens a wide one: cells stay closer to squares either way.
  const W = width, H = W < 560 ? Math.round(W * 1.3) : W < 900 ? Math.round(Math.min(640, W * 0.85)) : Math.round(Math.min(620, W * 0.55));

  const { areas, cells } = useMemo(() => {
    if (!W) return { areas: [], cells: [] as Cell[] };
    const sized = groups.map((g) => ({ ...g, value: g.cells.reduce((s, c) => s + c.value, 0) })).sort((a, b) => b.value - a.value);
    const placed = squarify(sized, { x: 0, y: 0, w: W, h: H });
    const cells: Cell[] = [];
    const areas = placed.map((p) => {
      const inner = inset(p, GROUP_GAP);
      for (const c of squarify(p.item.cells, inner)) cells.push({ x: c.x, y: c.y, w: c.w, h: c.h, code: c.item.code, name: c.item.name, value: c.item.value, group: p.item.name });
      return { ...inner, code: p.item.code };
    });
    return { areas, cells };
  }, [groups, W, H]);

  const on = (code: string) => !!highlight && (code === highlight.code || (highlight.code.length === 1 && code.startsWith(highlight.code)));
  // Box of the highlighted item: one cell, or a whole task area.
  const box: Rect | null = !highlight ? null : highlight.code.length === 1 ? areas.find((a) => a.code === highlight.code) ?? null : cells.find((c) => c.code === highlight.code) ?? null;

  const label = useMemo(() => {
    if (!box || !highlight) return null;
    const pad = 8;
    // Large enough: the label goes inside the coloured area, the name on up to two lines.
    const inner = wrap(highlight.name, box.w - 2 * pad, 13);
    if (inner.length <= 2 && !inner.some((l) => l.endsWith("…")) && box.h >= 2 * pad + inner.length * 17 + 16 && box.w >= textW(highlight.line2, 12) + 2 * pad)
      return { kind: "in" as const, lines: inner, x: box.x + pad, y: box.y + pad };
    // Small: an outline around it and a leader to a label beside it, on the side with the most room.
    const maxW = Math.min(280, W - 8);
    const lines = wrap(highlight.name, maxW - 20, 13);
    const bw = Math.min(maxW, Math.max(...lines.map((l) => textW(l, 13)), textW(highlight.line2, 12)) + 22);
    const bh = 12 + lines.length * 17 + 18;
    const gap = 16, ring = 4;
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const clampX = (x: number) => Math.max(4, Math.min(W - bw - 4, x));
    const clampY = (y: number) => Math.max(4, Math.min(H - bh - 4, y));
    const sides = [
      { room: W - (box.x + box.w) - gap - bw, at: () => ({ x: box.x + box.w + gap, y: clampY(cy - bh / 2) }) },
      { room: box.x - gap - bw, at: () => ({ x: box.x - gap - bw, y: clampY(cy - bh / 2) }) },
      { room: box.y - gap - bh, at: () => ({ x: clampX(cx - bw / 2), y: box.y - gap - bh }) },
      { room: H - (box.y + box.h) - gap - bh, at: () => ({ x: clampX(cx - bw / 2), y: box.y + box.h + gap }) },
    ].sort((a, b) => b.room - a.room);
    const p = sides[0].room >= 0 ? sides[0].at() : { x: clampX(cx - bw / 2), y: clampY(cy - bh / 2) };
    // Leader: from the outline to the nearest point of the label.
    const lx = Math.max(p.x, Math.min(p.x + bw, cx)), ly = Math.max(p.y, Math.min(p.y + bh, cy));
    const ax = Math.max(box.x - ring, Math.min(box.x + box.w + ring, lx)), ay = Math.max(box.y - ring, Math.min(box.y + box.h + ring, ly));
    return { kind: "out" as const, lines, x: p.x, y: p.y, bw, bh, ax, ay, lx, ly, ring };
  }, [box, highlight, W, H]);

  // Grey labels under the highlighted item's label or its leader are dropped instead of showing half a word.
  const covers: Rect[] = label?.kind === "out"
    ? [{ x: label.x - 4, y: label.y - 4, w: label.bw + 8, h: label.bh + 8 }, { x: Math.min(label.ax, label.lx) - 4, y: Math.min(label.ay, label.ly) - 4, w: Math.abs(label.ax - label.lx) + 8, h: Math.abs(label.ay - label.ly) + 8 }]
    : [];
  const hidden = (a: Rect) => covers.some((b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h);

  const showTip = (c: Cell, e?: { clientX: number; clientY: number }) => {
    const b = ref.current?.getBoundingClientRect();
    // Pointer: next to it. Keyboard focus: below the box, or above it near the bottom, never on top of it.
    if (e && b) setTip({ c, x: e.clientX - b.left, y: e.clientY - b.top, up: e.clientY - b.top - 84 });
    else setTip({ c, x: c.x + c.w / 2, y: c.y + c.h, up: c.y - 88 });
  };

  return (
    <div ref={ref} className="relative w-full select-none">
      {!W ? <div className="w-full aspect-[10/13] sm:aspect-[20/11]" /> : (
        <svg width={W} height={H} className="block overflow-visible" role="group" aria-label={ariaLabel}>
          {cells.map((c) => {
            const hi = on(c.code);
            const share = c.value / total;
            const r = inset(c, CELL_GAP);
            const line2 = fmt.cell(c.value, share);
            const fit = hi ? null : cellLabel(c.name, line2, r);
            const lab = fit && !hidden({ x: r.x + 4, y: r.y + 2, w: Math.max(...fit.lines.map((l) => textW(l, 12)), fit.amount ? textW(line2, 11) : 0) + 4, h: 6 + 14 * (fit.lines.length + (fit.amount ? 1 : 0)) }) ? fit : null;
            return (
              <g key={c.code} tabIndex={0} role="img" aria-label={fmt.aria(c.name, c.value, share)} className="qp-cell" style={{ outline: "none" }}
                onPointerMove={(e) => e.pointerType === "mouse" && showTip(c, e)} onPointerDown={(e) => showTip(c, e)}
                onPointerLeave={(e) => e.pointerType === "mouse" && setTip(null)} onFocus={() => showTip(c)} onBlur={() => setTip(null)}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={Math.min(3, r.w / 4, r.h / 4)}
                  style={{ fill: hi ? "var(--accent)" : tip?.c.code === c.code ? GREY_ON : GREY, stroke: tip?.c.code === c.code ? "var(--foreground)" : "none", strokeWidth: 1.5, transition: "fill 0.3s" }} />
                {lab?.lines.map((l, i) => (
                  <text key={i} x={r.x + 6} y={r.y + 15 + i * 14} style={{ fill: INK, fontSize: 12, fontWeight: 600 }}>{l}</text>
                ))}
                {lab?.amount && (
                  <text x={r.x + 6} y={r.y + 16 + lab.lines.length * 14} className="tabular" style={{ fill: INK, fontSize: 11, fillOpacity: 0.85 }}>{line2}</text>
                )}
              </g>
            );
          })}
          {box && label && (
            <g pointerEvents="none" aria-hidden>
              {label.kind === "in" ? (
                <>
                  {label.lines.map((l, i) => (
                    <text key={i} x={label.x} y={label.y + 13 + i * 17} style={{ fill: "var(--accent-ink)", fontSize: 13, fontWeight: 700 }}>{l}</text>
                  ))}
                  <text x={label.x} y={label.y + 14 + label.lines.length * 17} className="tabular" style={{ fill: "var(--accent-ink)", fontSize: 12, fontWeight: 600 }}>{highlight!.line2}</text>
                </>
              ) : (
                <>
                  {/* a light halo under outline and leader keeps them visible over the grey cells */}
                  <rect x={box.x - label.ring} y={box.y - label.ring} width={box.w + 2 * label.ring} height={box.h + 2 * label.ring} rx={4} style={{ fill: "none", stroke: "var(--surface)", strokeWidth: 5 }} />
                  <line x1={label.ax} y1={label.ay} x2={label.lx} y2={label.ly} style={{ stroke: "var(--surface)", strokeWidth: 5, strokeLinecap: "round" }} />
                  <rect x={box.x - label.ring} y={box.y - label.ring} width={box.w + 2 * label.ring} height={box.h + 2 * label.ring} rx={4} style={{ fill: "none", stroke: "var(--accent)", strokeWidth: 2.5 }} />
                  <line x1={label.ax} y1={label.ay} x2={label.lx} y2={label.ly} style={{ stroke: "var(--accent)", strokeWidth: 2 }} />
                  <rect x={label.x} y={label.y} width={label.bw} height={label.bh} rx={8} style={{ fill: "var(--surface)", stroke: "var(--accent)", strokeWidth: 2 }} />
                  {label.lines.map((l, i) => (
                    <text key={i} x={label.x + 11} y={label.y + 23 + i * 17} style={{ fill: "var(--foreground)", fontSize: 13, fontWeight: 700 }}>{l}</text>
                  ))}
                  <text x={label.x + 11} y={label.y + 23 + label.lines.length * 17 + 1} className="tabular" style={{ fill: "var(--foreground)", fontSize: 12 }}>{highlight!.line2}</text>
                </>
              )}
            </g>
          )}
        </svg>
      )}
      {tip && W > 0 && (
        <div className="pointer-events-none absolute z-10 rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg" style={{ left: Math.max(0, Math.min(tip.x + 12, W - 230)), top: tip.y + 90 > H ? Math.max(0, tip.up) : tip.y + 14, width: 220 }}>
          <div className="font-semibold">{tip.c.name}</div>
          <div className="text-faint">{tip.c.group}</div>
          <div className="text-muted tabular">{fmt.cell(tip.c.value, tip.c.value / total)}</div>
        </div>
      )}
    </div>
  );
}
