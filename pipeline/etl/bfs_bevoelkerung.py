"""BFS STAT-TAB – popolazione residente permanente al 31 dicembre, Svizzera e 26 Cantoni, 1981–2025.

Cube px-x-0102020000_201 "Bilancio demografico secondo il livello geografico istituzionale".
Used for per-capita figures. Produces: bfs-bevoelkerung-kantone
"""
from __future__ import annotations

import json

import requests

from etl.common import RAW_DIR, Source, now_iso, sha256_of, write_snapshot, Fetched

CUBE = "px-x-0102020000_201"
URL = f"https://www.pxweb.bfs.admin.ch/api/v1/it/{CUBE}/{CUBE}.px"
LANDING = f"https://www.pxweb.bfs.admin.ch/pxweb/it/{CUBE}/-/{CUBE}.px"
H = {"User-Agent": "Mozilla/5.0 (spesa-pubblica-ch)", "Content-Type": "application/json"}

# canonical canton abbreviations by BFS canton number (1..26)
KT = ["ZH", "BE", "LU", "UR", "SZ", "OW", "NW", "GL", "ZG", "FR", "SO", "BS", "BL", "SH", "AR", "AI", "SG", "GR", "AG", "TG", "TI", "VD", "VS", "NE", "GE", "JU"]


def main() -> None:
    meta = requests.get(URL, headers=H, timeout=120).json()
    var = {v["code"]: v for v in meta["variables"]}
    geo = var[next(c for c in var if len(var[c]["values"]) > 1000)]
    cant = [(c, t) for c, t in zip(geo["values"], geo["valueTexts"]) if t.startswith("- ")]
    assert len(cant) == 26, cant
    comp = var[next(c for c in var if "Komponente" in c or "omponente" in var[c]["text"])]
    comp_code = next(c for c, t in zip(comp["values"], comp["valueTexts"]) if "31 dicembre" in t)
    query = {"query": [
        {"code": geo["code"], "selection": {"filter": "item", "values": ["0"] + [c for c, _ in cant]}},
        {"code": comp["code"], "selection": {"filter": "item", "values": [comp_code]}},
    ], "response": {"format": "json-stat2"}}
    for code in var:
        if code not in (geo["code"], comp["code"], "Jahr") and len(var[code]["values"]) <= 3:
            query["query"].append({"code": code, "selection": {"filter": "item", "values": ["0"]}})
    r = requests.post(URL, headers=H, data=json.dumps(query), timeout=300)
    r.raise_for_status()
    js = r.json()
    raw = RAW_DIR / "bfs_bevoelkerung_kantone.json"
    raw.write_text(json.dumps(js, ensure_ascii=False))
    # json-stat2 decoding
    ids, size = js["id"], js["size"]
    dims = {i: js["dimension"][i]["category"] for i in ids}
    year_dim = next(i for i in ids if i.lower().startswith("jahr") or i.lower().startswith("anno"))
    geo_dim = geo["code"]
    strides = {}
    s = 1
    for i, n in zip(reversed(ids), reversed(size)):
        strides[i] = s
        s *= n
    idx = {i: dims[i]["index"] for i in ids}
    label_geo = dims[geo_dim]["label"]
    out: dict[str, dict[str, int]] = {}
    for gcode, gi in idx[geo_dim].items():
        name = label_geo[gcode]
        key = "CH" if gcode == "0" else KT[[c for c, _ in cant].index(gcode)]
        series = {}
        for ycode, yi in idx[year_dim].items():
            flat = 0
            for i in ids:
                if i == geo_dim:
                    flat += gi * strides[i]
                elif i == year_dim:
                    flat += yi * strides[i]
                else:
                    flat += 0  # single-valued dims
            v = js["value"][flat]
            if v is not None:
                series[dims[year_dim]["label"][ycode]] = int(v)
        out[key] = {"name": name.lstrip("- ").strip(), "values": series}
    fetched = Fetched(url=URL, path=raw, sha256=sha256_of(raw), retrieved_at=now_iso(), last_modified=meta.get("updated"), content_type="application/json", size=raw.stat().st_size)
    municipalities(meta, var, geo, comp, comp_code)
    years = sorted({y for v in out.values() for y in v["values"]})
    write_snapshot(Source(id="bfs-bevoelkerung-kantone", title="Popolazione residente permanente al 31 dicembre, Svizzera e Cantoni",
                          publisher="Ufficio federale di statistica (UST/BFS)", publisher_url="https://www.bfs.admin.ch", source_url=URL, landing_url=LANDING,
                          license="opendata.swiss: Freie Nutzung. Quellenangabe ist Pflicht (OPEN-BY-ASK per alcune tabelle)", frequency="annuale (agosto)",
                          level="kantone", unit="persone", data_date=f"{years[0]}–{years[-1]}", published_at=meta.get("updated"),
                          coverage="Svizzera + 26 Cantoni, STATPOP/ESPOP, usata per i valori pro capite", notes="Cubo STAT-TAB; componente «Stato della popolazione al 31 dicembre», tutte le nazionalità e i sessi."),
                   fetched, {"population": out}, extra_meta={"years": [int(y) for y in years]})


def municipalities(meta, var, geo, comp, comp_code, min_year: int = 2008) -> None:
    """Population per municipality (all ~2 100), years >= min_year. Labels look like '......0002 Affoltern am Albis'."""
    import re
    gem = [(c, t) for c, t in zip(geo["values"], geo["valueTexts"]) if t.startswith("......")]
    years_all = var["Jahr"]["values"] if "Jahr" in var else next(v for v in var.values() if v["values"][:1] == ["1981"])["values"]
    yrs = [y for y in years_all if int(y) >= min_year]
    year_code = "Jahr" if "Jahr" in var else next(k for k, v in var.items() if v["values"][:1] == ["1981"])
    query = {"query": [
        {"code": geo["code"], "selection": {"filter": "item", "values": [c for c, _ in gem]}},
        {"code": year_code, "selection": {"filter": "item", "values": yrs}},
        {"code": comp["code"], "selection": {"filter": "item", "values": [comp_code]}},
    ], "response": {"format": "json-stat2"}}
    for code in var:
        if code not in (geo["code"], comp["code"], year_code) and len(var[code]["values"]) <= 3:
            query["query"].append({"code": code, "selection": {"filter": "item", "values": ["0"]}})
    r = requests.post(URL, headers=H, data=json.dumps(query), timeout=600)
    r.raise_for_status()
    js = r.json()
    raw = RAW_DIR / "bfs_bevoelkerung_gemeinden.json"
    raw.write_text(json.dumps(js, ensure_ascii=False))
    ids, size = js["id"], js["size"]
    dims = {i: js["dimension"][i]["category"] for i in ids}
    year_dim = next(i for i in ids if i.lower().startswith("jahr") or i.lower().startswith("anno"))
    geo_dim = geo["code"]
    strides, s = {}, 1
    for i, n in zip(reversed(ids), reversed(size)):
        strides[i] = s
        s *= n
    idx = {i: dims[i]["index"] for i in ids}
    out = {}
    for gcode, gi in idx[geo_dim].items():
        label = dims[geo_dim]["label"][gcode]
        m = re.match(r"\.+(\d{4}) (.*)", label)
        if not m:
            continue
        bfs, name = int(m.group(1)), m.group(2)
        vals = {}
        for ycode, yi in idx[year_dim].items():
            v = js["value"][gi * strides[geo_dim] + yi * strides[year_dim]]
            if v is not None:
                vals[dims[year_dim]["label"][ycode]] = int(v)
        out[str(bfs)] = {"name": name, "values": vals}
    fetched = Fetched(url=URL, path=raw, sha256=sha256_of(raw), retrieved_at=now_iso(), last_modified=meta.get("updated"), content_type="application/json", size=raw.stat().st_size)
    write_snapshot(Source(id="bfs-bevoelkerung-gemeinden", title="Popolazione residente permanente al 31 dicembre per Comune",
                          publisher="Ufficio federale di statistica (UST/BFS)", publisher_url="https://www.bfs.admin.ch", source_url=URL, landing_url=LANDING,
                          license="opendata.swiss: Freie Nutzung. Quellenangabe ist Pflicht", frequency="annuale (agosto)",
                          level="gemeinden", unit="persone", data_date=f"{yrs[0]}–{yrs[-1]}", published_at=meta.get("updated"),
                          coverage=f"{len(out)} Comuni (stato dei Comuni attuale), {yrs[0]}–{yrs[-1]}", notes="Stesso cubo STAT-TAB dei Cantoni; chiave = numero UST del Comune."),
                   fetched, {"population": out}, extra_meta={"years": [int(y) for y in yrs]})


if __name__ == "__main__":
    main()
