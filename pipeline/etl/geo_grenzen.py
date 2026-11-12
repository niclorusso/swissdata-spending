"""Confini generalizzati di Cantoni, Comuni e laghi -> tracciati SVG pronti per le mappe.

Source: swiss-maps (Interactive Things), TopoJSON generato dai geodati UST/GEOSTAT e swisstopo.
File:   https://unpkg.com/swiss-maps@4/<anno>/ch-combined.json  (WGS84, quantizzato)
Produces: geo-grenzen  {viewBox, cantons: {zh: path}, municipalities: {bfs_nr: path}, lakes: [path], centroids}
Projection: equirettangolare con il fattore cos(46.8°): su un Paese largo 350 km l'errore non è visibile a questa scala.
"""
from __future__ import annotations

import json
import math

from etl.common import Source, fetch, write_snapshot

YEAR = 2026
URL = f"https://unpkg.com/swiss-maps@4/{YEAR}/ch-combined.json"
KT = {1: "zh", 2: "be", 3: "lu", 4: "ur", 5: "sz", 6: "ow", 7: "nw", 8: "gl", 9: "zg", 10: "fr", 11: "so", 12: "bs", 13: "bl",
      14: "sh", 15: "ar", 16: "ai", 17: "sg", 18: "gr", 19: "ag", 20: "tg", 21: "ti", 22: "vd", 23: "vs", 24: "ne", 25: "ge", 26: "ju"}
W = 1000.0


def main() -> None:
    f = fetch(URL, f"swiss_maps_{YEAR}_ch-combined.json")
    topo = json.loads(f.path.read_text())
    sx, sy = topo["transform"]["scale"]
    tx, ty = topo["transform"]["translate"]
    arcs: list[list[tuple[float, float]]] = []
    for a in topo["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in a:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)
    lons = [p[0] for a in arcs for p in a]
    lats = [p[1] for a in arcs for p in a]
    lon0, lon1, lat0, lat1 = min(lons), max(lons), min(lats), max(lats)
    k = math.cos(math.radians(46.8))
    scale = W / ((lon1 - lon0) * k)
    height = (lat1 - lat0) * scale

    def proj(p: tuple[float, float]) -> tuple[float, float]:
        return ((p[0] - lon0) * k * scale, (lat1 - p[1]) * scale)

    def ring(idx: list[int]) -> list[tuple[float, float]]:
        out: list[tuple[float, float]] = []
        for i in idx:
            pts = arcs[i] if i >= 0 else arcs[~i][::-1]
            out.extend(pts if not out else pts[1:])
        return [proj(p) for p in out]

    def rings_of(g: dict) -> list[list[tuple[float, float]]]:
        polys = [g["arcs"]] if g["type"] == "Polygon" else g["arcs"]
        return [ring(r) for poly in polys for r in poly]

    def path(rings: list[list[tuple[float, float]]]) -> str:
        return "".join("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in r) + "Z" for r in rings)

    def inside(x: float, y: float, rs: list[list[tuple[float, float]]]) -> bool:
        """Even-odd rule over all rings, so holes and enclaves count as outside."""
        c = False
        for r in rs:
            for (x1, y1), (x2, y2) in zip(r, r[1:] + r[:1]):
                if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
                    c = not c
        return c

    def edge_dist(x: float, y: float, rs: list[list[tuple[float, float]]]) -> float:
        best = float("inf")
        for r in rs:
            for (x1, y1), (x2, y2) in zip(r, r[1:] + r[:1]):
                dx, dy = x2 - x1, y2 - y1
                t = 0.0 if dx == dy == 0 else max(0.0, min(1.0, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
                best = min(best, math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)))
        return best

    def centroid(rings: list[list[tuple[float, float]]]) -> list[float]:
        """Label point: the interior point farthest from any border (pole of inaccessibility), found on a grid and
        refined once. Third value = that distance, i.e. how much room a label has."""
        xs = [p[0] for r in rings for p in r]
        ys = [p[1] for r in rings for p in r]
        best = (-1.0, (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2)
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        for _ in range(2):
            n = 28
            for i in range(n + 1):
                for j in range(n + 1):
                    x, y = x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * j / n
                    if inside(x, y, rings):
                        d = edge_dist(x, y, rings)
                        if d > best[0]:
                            best = (d, x, y)
            sx_, sy_ = (x1 - x0) / n, (y1 - y0) / n
            x0, x1, y0, y1 = best[1] - sx_, best[1] + sx_, best[2] - sy_, best[2] + sy_
        return [round(best[1], 1), round(best[2], 1), round(best[0], 1)]

    cantons, c_cent = {}, {}
    for g in topo["objects"]["cantons"]["geometries"]:
        r = rings_of(g)
        cantons[KT[int(g["id"])]] = path(r)
        c_cent[KT[int(g["id"])]] = centroid(r)
    munis, m_cent = {}, {}
    for g in topo["objects"]["municipalities"]["geometries"]:
        r = rings_of(g)
        munis[str(int(g["id"]))] = path(r)
        big = max(r, key=len)
        m_cent[str(int(g["id"]))] = [round((min(q[0] for q in big) + max(q[0] for q in big)) / 2, 1), round((min(q[1] for q in big) + max(q[1] for q in big)) / 2, 1)]
    lakes = [path(rings_of(g)) for g in topo["objects"]["lakes"]["geometries"]]

    write_snapshot(Source(id="geo-grenzen", title=f"Confini generalizzati di Cantoni, Comuni e laghi ({YEAR})",
                          publisher="Ufficio federale di statistica (UST), GEOSTAT / swisstopo, via swiss-maps (Interactive Things)",
                          publisher_url="https://www.bfs.admin.ch/bfs/it/home/servizi/geostat.html", source_url=URL,
                          landing_url="https://github.com/interactivethings/swiss-maps", license="Geodati: fonte «UST, GEOSTAT»; codice swiss-maps BSD-3-Clause",
                          frequency="annuale", level="gesamt", unit="–", data_date=f"stato dei Comuni {YEAR}",
                          coverage=f"{len(cantons)} Cantoni, {len(munis)} Comuni, {len(lakes)} laghi",
                          notes="Confini generalizzati per la visualizzazione, non per misure."),
                   f, {"viewBox": [0, 0, round(W), round(height)], "cantons": cantons, "canton_centroids": c_cent,
                       "municipalities": munis, "municipality_centroids": m_cent, "lakes": lakes})


if __name__ == "__main__":
    main()
