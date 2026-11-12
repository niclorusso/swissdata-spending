"use client";
import { useEffect, useState } from "react";
import { GeoMap, type MapDatum, type MapUnit } from "@/components/charts/GeoMap";
import { BASE } from "@/lib/lang";
import { useL } from "@/lib/useLang";

type Geo = { viewBox: number[]; cantons: Record<string, string>; municipalities: Record<string, string>; lakes: string[] };

/** National map at municipal level. The outlines (about 1 MB) are fetched after load, not shipped in the page. */
export function MuniMapCH({ data, legendTitle, unit = "chf" }: { data: Record<string, MapDatum>; legendTitle: string; unit?: MapUnit }) {
  const { T } = useL();
  const [g, setG] = useState<Geo | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch(`${BASE}/data/geo-grenzen.json`).then((r) => r.json()).then((j) => setG(j.data)).catch(() => setFailed(true));
  }, []);
  if (failed) return <p className="text-sm text-muted">{T("La mappa non si è caricata. I dati sono nella tabella qui sotto.", "The map did not load. The data are in the table below.")}</p>;
  if (!g) return <div className="w-full rounded-xl bg-surface-2 animate-pulse" style={{ aspectRatio: "1000 / 675" }} aria-label={T("Caricamento della mappa", "Loading the map")} />;
  const withData = Object.keys(data).filter((id) => g.municipalities[id]).map((id) => ({ id, d: g.municipalities[id] }));
  return <GeoMap viewBox={g.viewBox} shapes={withData} data={data} unit={unit} legendTitle={legendTitle} context={Object.values(g.cantons)} lakes={g.lakes} stroke={0.4} />;
}
