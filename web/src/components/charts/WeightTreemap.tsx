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

/** Width in pixels of a text as the browser draws it: measured on a hidden span inside the chart, which has the chart's own font
 *  (family, features), at the given size and weight. The chart has no measure until the fonts are loaded, so nothing is placed on a guess. */
type Measure = (s: string, size: number, weight: number, tabular?: boolean) => number;
const inset = (r: Rect, d: number): Rect => ({ x: r.x + d, y: r.y + d, w: Math.max(0, r.w - 2 * d), h: Math.max(0, r.h - 2 * d) });
/** Greedy wrap into lines of at most `px` pixels, whole words only (a word longer than a line stays as it is). */
function words(s: string, px: number, tw: (s: string) => number): string[] {
  const out: string[] = [];
  let line = "";
  for (const w of s.split(" ")) {
    const next = line ? `${line} ${w}` : w;
    if (tw(next) > px && line) { out.push(line); line = w; } else line = next;
  }
  if (line) out.push(line);
  return out;
}
/** Cut a text that does not fit `px` with «…», measuring each try. */
function clip(s: string, px: number, tw: (s: string) => number): string {
  if (tw(s) <= px) return s;
  for (let n = s.length - 1; n > 0; n--) { const t = s.slice(0, n).trimEnd() + "…"; if (tw(t) <= px) return t; }
  return "";
}
/** The same wrap, cutting a word that does not fit with «…». */
const wrap = (s: string, px: number, tw: (s: string) => number) => words(s, px, tw).map((l) => clip(l, px, tw)).filter(Boolean);

/** Sizes of the grey labels: name 12 px semibold on lines 14 px apart, amount 11 px. */
const NAME = { size: 12, weight: 600, step: 14 };
const AMOUNT = { size: 11, weight: 400 };
const PAD = 6; // left and right of a grey label
/** Label of a grey cell: the name on as many lines as fit, then amount and share if there is room. Words are never cut:
 *  a name that does not fit, or that would keep fewer than ten letters, is left to the tooltip and the table. */
function cellLabel(name: string, line2: string, r: Rect, m: Measure): { lines: string[]; amount: boolean; w: number } | null {
  if (r.w < 44 || r.h < 20) return null;
  const avail = r.w - 2 * PAD;
  const tw = (s: string) => m(s, NAME.size, NAME.weight);
  const all = words(name, avail, tw);
  if (all.some((l) => tw(l) > avail)) return null;
  const room = Math.floor((r.h - 6) / NAME.step);
  const amountW = m(line2, AMOUNT.size, AMOUNT.weight, true);
  if (all.length <= room) {
    const amount = room >= all.length + 1 && amountW <= avail;
    return { lines: all, amount, w: Math.max(...all.map(tw), amount ? amountW : 0) };
  }
  if (room < 1) return null;
  const lines = all.slice(0, room);
  const last = lines[room - 1].split(" ");
  while (last.length && tw(`${last.join(" ")} …`) > avail) last.pop();
  if (!last.length) return null;
  lines[room - 1] = `${last.join(" ")} …`;
  return lines.join(" ").length >= 12 ? { lines, amount: false, w: Math.max(...lines.map(tw)) } : null;
}

/** The whole of public spending as a two-level treemap (task areas, then their lines), all grey but the highlighted item. */
export function WeightTreemap({ groups, total, highlight, ariaLabel, fmt }: {
  groups: QpGroup[]; total: number; highlight: Highlight | null; ariaLabel: string;
  fmt: { cell: (value: number, share: number) => string; aria: (name: string, value: number, share: number) => string };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(0);
  const [measure, setMeasure] = useState<{ m: Measure } | null>(null);
  const [tip, setTip] = useState<{ c: Cell; x: number; y: number; up: number } | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((e) => setWidth(Math.floor(e[0].contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  // Labels are placed only once the fonts are in: a width measured on the fallback font would be wrong. A font that loads later
  // starts a new measure, so every label is checked again.
  useEffect(() => {
    const el = probe.current;
    if (!el) return;
    let live = true;
    const make = () => {
      if (!live) return;
      const seen = new Map<string, number>();
      const m: Measure = (s, size, weight, tabular = false) => {
        const key = `${size}|${weight}|${tabular ? 1 : 0}|${s}`;
        let w = seen.get(key);
        if (w === undefined) {
          el.style.fontSize = `${size}px`;
          el.style.fontWeight = String(weight);
          el.style.fontVariantNumeric = tabular ? "tabular-nums" : "normal";
          el.textContent = s;
          w = el.getBoundingClientRect().width + 1; // one pixel to spare for anti-aliasing
          seen.set(key, w);
        }
        return w;
      };
      setMeasure({ m });
    };
    const fonts = document.fonts;
    fonts.ready.then(make);
    fonts.addEventListener("loadingdone", make);
    return () => { live = false; fonts.removeEventListener("loadingdone", make); };
  }, []);
  // Phones get a tall map, wide screens a wide one: cells stay closer to squares either way.
  const W = width, H = W < 560 ? Math.round(W * 1.2) : W < 900 ? Math.round(Math.min(640, W * 0.85)) : Math.round(Math.min(620, W * 0.55));
  // On a phone the map starts below the question, the answer and the chooser, so its lower part is out of the first screen:
  // there the highlighted item is laid out first, at the top left (its task area first, then the item inside it). Wider screens
  // keep the same map for every item, ordered by size, with only the colour moving.
  const pin = W < 560 && highlight ? highlight.code : null;

  const { areas, cells } = useMemo(() => {
    if (!W) return { areas: [], cells: [] as Cell[] };
    const first = <T extends { code: string }>(xs: T[], code: string | undefined) => (code ? [...xs.filter((x) => x.code === code), ...xs.filter((x) => x.code !== code)] : xs);
    const sized = first(groups.map((g) => ({ ...g, value: g.cells.reduce((s, c) => s + c.value, 0) })).sort((a, b) => b.value - a.value), pin?.[0]);
    const placed = squarify(sized, { x: 0, y: 0, w: W, h: H });
    const cells: Cell[] = [];
    const areas = placed.map((p) => {
      const inner = inset(p, GROUP_GAP);
      for (const c of squarify(first(p.item.cells, pin?.length === 2 ? pin : undefined), inner)) cells.push({ x: c.x, y: c.y, w: c.w, h: c.h, code: c.item.code, name: c.item.name, value: c.item.value, group: p.item.name });
      return { ...inner, code: p.item.code };
    });
    return { areas, cells };
  }, [groups, W, H, pin]);

  const on = (code: string) => !!highlight && (code === highlight.code || (highlight.code.length === 1 && code.startsWith(highlight.code)));
  // Box of the highlighted item: one cell, or a whole task area.
  const box: Rect | null = !highlight ? null : highlight.code.length === 1 ? areas.find((a) => a.code === highlight.code) ?? null : cells.find((c) => c.code === highlight.code) ?? null;

  const label = useMemo(() => {
    if (!box || !highlight || !measure) return null;
    const { m } = measure;
    const name = (s: string) => m(s, 13, 700);
    const pad = 8;
    // Large enough: the label goes inside the coloured area, the name on up to two lines.
    const inner = words(highlight.name, box.w - 2 * pad, name);
    if (inner.length <= 2 && inner.every((l) => name(l) <= box.w - 2 * pad) && box.h >= 2 * pad + inner.length * 17 + 16 && box.w >= m(highlight.line2, 12, 600, true) + 2 * pad)
      return { kind: "in" as const, lines: inner, x: box.x + pad, y: box.y + pad };
    // Small: an outline around it and a leader to a label beside it, on the side with the most room.
    const maxW = Math.min(280, W - 8);
    const lines = wrap(highlight.name, maxW - 22, name);
    const bw = Math.min(maxW, Math.max(...lines.map(name), m(highlight.line2, 12, 400, true)) + 22);
    const bh = 12 + lines.length * 17 + 18;
    const gap = 16, ring = 4;
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const clampX = (x: number) => Math.max(4, Math.min(W - bw - 4, x));
    const clampY = (y: number) => Math.max(4, Math.min(H - bh - 4, y));
    // Room on each side: a side where the label fits next to the box without covering it wins over the others. Among those,
    // wide screens take the one with the most room; phones the one that keeps the label highest, nearest the first screen.
    const sides = [
      { room: W - (box.x + box.w) - gap - bw, at: () => ({ x: box.x + box.w + gap, y: clampY(cy - bh / 2) }) },
      { room: box.x - gap - bw, at: () => ({ x: box.x - gap - bw, y: clampY(cy - bh / 2) }) },
      { room: box.y - gap - bh, at: () => ({ x: clampX(cx - bw / 2), y: box.y - gap - bh }) },
      { room: H - (box.y + box.h) - gap - bh, at: () => ({ x: clampX(cx - bw / 2), y: box.y + box.h + gap }) },
    ].sort(pin ? (a, b) => Number(a.room < 0) - Number(b.room < 0) || a.at().y - b.at().y : (a, b) => b.room - a.room);
    const at = sides[0].at();
    const p = { x: clampX(at.x), y: clampY(at.y) };
    // Leader: from the outline to the nearest point of the label.
    const lx = Math.max(p.x, Math.min(p.x + bw, cx)), ly = Math.max(p.y, Math.min(p.y + bh, cy));
    const ax = Math.max(box.x - ring, Math.min(box.x + box.w + ring, lx)), ay = Math.max(box.y - ring, Math.min(box.y + box.h + ring, ly));
    return { kind: "out" as const, lines, x: p.x, y: p.y, bw, bh, ax, ay, lx, ly, ring };
  }, [box, highlight, measure, W, H, pin]);

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
      {/* the ruler for label widths: same font as the labels, never seen */}
      <span ref={probe} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 whitespace-pre" />
      {!W ? <div className="w-full aspect-[10/12] sm:aspect-[20/11]" /> : (
        <svg width={W} height={H} className="block overflow-visible" role="group" aria-label={ariaLabel}>
          {/* a whole task area highlighted is one solid block: the lines between its own cells would cut through its label */}
          {box && highlight?.code.length === 1 && <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={3} style={{ fill: "var(--accent)" }} aria-hidden />}
          {cells.map((c) => {
            const hi = on(c.code);
            const share = c.value / total;
            const r = inset(c, CELL_GAP);
            const line2 = fmt.cell(c.value, share);
            const fit = hi || !measure ? null : cellLabel(c.name, line2, r, measure.m);
            const lab = fit && !hidden({ x: r.x + PAD - 2, y: r.y + 2, w: fit.w + 4, h: 6 + NAME.step * (fit.lines.length + (fit.amount ? 1 : 0)) }) ? fit : null;
            const focus = tip?.c.code === c.code;
            return (
              <g key={c.code} tabIndex={0} role="img" aria-label={fmt.aria(c.name, c.value, share)} className="qp-cell" data-code={c.code} style={{ outline: "none" }}
                onPointerMove={(e) => e.pointerType === "mouse" && showTip(c, e)} onPointerDown={(e) => showTip(c, e)}
                onPointerLeave={(e) => e.pointerType === "mouse" && setTip(null)} onFocus={() => showTip(c)} onBlur={() => setTip(null)}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={Math.min(3, r.w / 4, r.h / 4)}
                  style={{ fill: hi ? "var(--accent)" : focus ? GREY_ON : GREY, stroke: focus ? "var(--foreground)" : "none", strokeWidth: 2, transition: "fill 0.3s" }} />
                {lab?.lines.map((l, i) => (
                  <text key={i} x={r.x + PAD} y={r.y + 15 + i * NAME.step} style={{ fill: INK, fontSize: NAME.size, fontWeight: NAME.weight }}>{l}</text>
                ))}
                {lab?.amount && (
                  <text x={r.x + PAD} y={r.y + 16 + lab.lines.length * NAME.step} className="tabular" style={{ fill: INK, fontSize: AMOUNT.size, fontWeight: AMOUNT.weight, fillOpacity: 0.85 }}>{line2}</text>
                )}
              </g>
            );
          })}
          {box && label && (
            <g pointerEvents="none" aria-hidden className="qp-highlight" data-kind={label.kind}>
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
                  <rect className="qp-ring" x={box.x - label.ring} y={box.y - label.ring} width={box.w + 2 * label.ring} height={box.h + 2 * label.ring} rx={4} style={{ fill: "none", stroke: "var(--accent)", strokeWidth: 2.5 }} />
                  <line x1={label.ax} y1={label.ay} x2={label.lx} y2={label.ly} style={{ stroke: "var(--accent)", strokeWidth: 2 }} />
                  <rect className="qp-callout" x={label.x} y={label.y} width={label.bw} height={label.bh} rx={8} style={{ fill: "var(--surface)", stroke: "var(--accent)", strokeWidth: 2 }} />
                  {label.lines.map((l, i) => (
                    <text key={i} x={label.x + 11} y={label.y + 23 + i * 17} style={{ fill: "var(--foreground)", fontSize: 13, fontWeight: 700 }}>{l}</text>
                  ))}
                  <text x={label.x + 11} y={label.y + 23 + label.lines.length * 17 + 1} className="tabular" style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 400 }}>{highlight!.line2}</text>
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
