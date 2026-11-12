/** Bounding box of SVG paths made of absolute M/L commands (what the pipeline writes), with a margin. */
export function bbox(paths: string[], pad = 0.04): number[] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const d of paths) {
    for (const m of d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)) {
      const x = Number(m[1]), y = Number(m[2]);
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  const w = x1 - x0, h = y1 - y0, p = Math.max(w, h) * pad;
  return [x0 - p, y0 - p, w + 2 * p, h + 2 * p].map((v) => Math.round(v * 10) / 10);
}

/** Does any point of the path fall inside the box? Used to pick lakes and neighbours for a cropped map. */
export function touches(d: string, box: number[]): boolean {
  for (const m of d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)) {
    const x = Number(m[1]), y = Number(m[2]);
    if (x >= box[0] && x <= box[0] + box[2] && y >= box[1] && y <= box[1] + box[3]) return true;
  }
  return false;
}
