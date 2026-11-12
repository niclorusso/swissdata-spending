"""EFV – Finanzstatistik der Schweiz (modello FS): Standardauswertungen per ente.

File: https://www.data.finance.admin.ch/static/assets/datasets/fs_dashboard/standardauswertung.csv  (~160 MB)
      + standardauswertung_codelist.csv (labels D/F/I/E)
Columns: arten, funk, jahr, value, dim, hh, unit, model
hh codes: staat, bund, ktn, gdn, sv, bund_ktn_gdn, ktn_gdn,
          ktn_<ab> (each canton), gdn_<ab> (all municipalities of a canton, aggregated), ktn_gdn_<ab> (canton + its municipalities),
          sv_ahv, sv_iv, sv_eo, sv_alv, sv_fl, sv_mat_ge (social insurance branches)
dims used: ausgaben_funk (spese per funzione), einnahmen_funk (entrate, totale), ausgaben (spese per natura), schuld (debito, modello GFS)
Produces: fs-haushalte  (one entry per hh with yearly totals, spending by function L1/L2, by nature L1, debt)
Gotcha: the server rejects requests without browser-like headers. Last year (2025) is budget for cantons/municipalities.
"""
from __future__ import annotations

import pandas as pd

from etl.common import Source, fetch, write_snapshot

BASE = "https://www.data.finance.admin.ch/static/assets/datasets/fs_dashboard/"
URL = BASE + "standardauswertung.csv"
CODELIST = BASE + "standardauswertung_codelist.csv"
LANDING = "https://www.efv.admin.ch/de/fs-daten"
PUBLISHER = "Eidgenössische Finanzverwaltung (EFV), Finanzstatistik / Amministrazione federale delle finanze (AFF), statistica finanziaria"
LICENSE = "opendata.swiss: Freie Nutzung. Quellenangabe ist Pflicht (terms_by)."
H = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
     "Accept": "text/csv,text/plain,*/*;q=0.8", "Accept-Language": "de-CH,de;q=0.9,it;q=0.8"}
DIMS = {"ausgaben_funk", "einnahmen_funk", "ausgaben", "einnahmen"}
MAIN = BASE + "main_extern.csv"
# main_extern.csv carries, per level and year, the EFV's own flag: "Rechnung" (consuntivo), "Vorhandene Daten" (dati
# parziali già disponibili) or "Prognosen" (previsione). We read the status from there instead of hard-coding years.
SOURCE_CODE = {"Rechnung": "R", "Vorhandene Daten": "V", "Prognosen": "P"}
RANK = {"R": 0, "V": 1, "P": 2}
QUOTE_VARS = {"staatsquote", "fiskalquote", "schuldenquote", "nettoschuldenquote", "bruttoschuldenquote", "einnahmenquote"}
MAIN_VARS = {"fs": ["einnahmen", "ausgaben", "saldo"],
             "gfs": ["maastricht_schuld", "nettoschuld", "schuldenquote", "nettoschuldenquote", "staatsquote", "fiskalquote"]}


def load_main(path) -> tuple[dict[str, dict[int, str]], dict[str, dict]]:
    """-> (status per level and year, main aggregates per level). Amounts in the file are in CHF millions."""
    m = pd.read_csv(path)
    a = m[(m.model == "fs") & (m.variable == "ausgaben") & m.hh.notna()]
    status = {hh: {int(r.jahr): SOURCE_CODE.get(r.source, "P") for r in g.itertuples()} for hh, g in a.groupby("hh")}
    agg: dict[str, dict] = {}
    for model, names in MAIN_VARS.items():
        d = m[(m.model == model) & m.variable.isin(names) & m.hh.notna() & m.value.notna()]
        for (hh, var), g in d.groupby(["hh", "variable"]):
            mult = 1 if var in QUOTE_VARS else 1e6
            agg.setdefault(hh, {})[var] = {int(r.jahr): (round(float(r.value) * mult) if mult > 1 else round(float(r.value), 5)) for r in g.itertuples()}
    bip = m[(m.variable == "bip") & m.value.notna()]
    agg["_bip"] = {"bip": {int(r.jahr): round(float(r.value) * 1e6) for r in bip.itertuples()}}
    return status, agg


def kinds_of(hh: str) -> list[str]:
    if hh in ("staat", "bund", "ktn", "gdn", "sv", "bund_ktn_gdn"):
        return [hh]
    if hh.startswith("sv"):
        return ["sv"]
    if hh.startswith("ktn_gdn"):
        return ["ktn", "gdn"]
    return ["gdn"] if hh.startswith("gdn") else ["ktn"]


def status_for(status: dict[str, dict[int, str]], hh: str, year: int) -> str:
    """Worst status among the levels the entity is made of (a canton+municipalities total is a forecast if either part is)."""
    codes = [status.get(k, {}).get(year, "P") for k in kinds_of(hh)]
    return max(codes, key=lambda c: RANK[c])


def series(g: pd.DataFrame) -> dict[int, float]:
    return {int(r.jahr): round(float(r.value)) for r in g.itertuples() if pd.notna(r.value)}


def main() -> None:
    f = fetch(URL, "efv_fs_standardauswertung.csv", headers=H, timeout=900)
    fc = fetch(CODELIST, "efv_fs_standardauswertung_codelist.csv", headers=H)
    fm = fetch(MAIN, "efv_fs_main_extern.csv", headers=H)
    status, main_agg = load_main(fm.path)
    cl = pd.read_csv(fc.path, dtype=str)
    labels: dict[tuple, dict] = {}
    for r in cl.itertuples():
        key = (r.dim, r.model, r.arten if pd.notna(r.arten) else None, r.funk if pd.notna(r.funk) else None)
        labels[key] = {"de": r.d, "fr": r.f, "it": r.i, "en": r.e}

    parts = []
    for chunk in pd.read_csv(f.path, dtype={"arten": str, "funk": str, "hh": str, "dim": str, "model": str, "unit": str}, chunksize=1_000_000):
        parts.append(chunk[chunk.dim.isin(DIMS)])
    df = pd.concat(parts)
    del parts
    df = df[df.model == "fs"]
    years = sorted(int(y) for y in df.jahr.unique())

    out: dict[str, dict] = {}

    def lab(dim: str, arten, funk) -> dict:
        l = labels.get((dim, "fs", arten, funk), {})
        return {"de": l.get("de"), "it": l.get("it"), "fr": l.get("fr")}

    def by_prefix(g: pd.DataFrame, col: str, n: int, dim: str) -> dict:
        """Sum 2-/3-digit codes into their n-digit prefix. The FS file only carries the finest level; aggregates are ours."""
        gg = g.assign(pfx=g[col].str[:n]).groupby(["pfx", "jahr"]).value.sum(min_count=1)
        res: dict[str, dict] = {}
        for (code, y), v in gg.items():
            if pd.isna(v):
                continue
            if code not in res:
                res[code] = {"code": code, **(lab(dim, None, code) if dim.endswith("_funk") else lab(dim, code, None)), "values": {}}
            res[code]["values"][int(y)] = round(float(v))
        return dict(sorted(res.items()))

    for hh, g in df.groupby("hh"):
        e: dict = {"hh": hh}
        af = g[(g.dim == "ausgaben_funk") & (g.model == "fs") & g.funk.notna()]
        ef = g[(g.dim == "einnahmen_funk") & (g.model == "fs") & g.funk.notna()]
        e["funk2"] = by_prefix(af, "funk", 2, "ausgaben_funk")
        e["funk1"] = by_prefix(af, "funk", 1, "ausgaben_funk")
        tot = af.groupby("jahr").value.sum(min_count=1)
        e["total_ausgaben"] = {int(y): round(float(v)) for y, v in tot.items() if pd.notna(v)}
        tot_e = ef.groupby("jahr").value.sum(min_count=1)
        e["total_einnahmen"] = {int(y): round(float(v)) for y, v in tot_e.items() if pd.notna(v)}
        au = g[(g.dim == "ausgaben") & (g.model == "fs") & g.arten.notna() & (g.arten != "empty")]
        e["art1"] = by_prefix(au, "arten", 2, "ausgaben")
        e["art0"] = by_prefix(au, "arten", 1, "ausgaben")
        e["year_status"] = {y: status_for(status, hh, y) for y in years if y in e["total_ausgaben"]}
        out[hh] = e

    write_snapshot(Source(id="fs-haushalte", title="Statistica finanziaria – Confederazione, Cantoni, Comuni e assicurazioni sociali (modello FS)",
                          publisher=PUBLISHER, publisher_url="https://www.efv.admin.ch/de/finanzstatistik", source_url=URL, landing_url=LANDING, license=LICENSE,
                          frequency="2 volte l'anno (febbraio/marzo e agosto/settembre)", level="gesamt", unit="CHF",
                          data_date="consuntivi: " + ", ".join(f"{lab} {max(y for y, c in status[k].items() if c == 'R')}" for k, lab in (("bund", "Confederazione"), ("ktn", "Cantoni"), ("gdn", "Comuni"), ("sv", "assicurazioni sociali"))) + "; anni successivi = dati parziali o previsioni AFF",
                          coverage=f"{len(out)} enti/aggregati: Stato, Confederazione, 26 Cantoni, Comuni per Cantone, Cantone+Comuni, 6 rami delle assicurazioni sociali; spese per funzione (2 livelli) e natura, entrate; {years[0]}–{years[-1]}",
                          notes="Modello FS (statistica finanziaria svizzera), dati armonizzati e non direttamente confrontabili con i conti pubblicati dai singoli Cantoni. Le rilevazioni comunali sono in parte stimate su campione (FAQ EFV)."),
                   f, {"haushalte": out}, extra_meta={"years": years, "codelist_sha256": fc.sha256})

    main_years = sorted({y for v in status.values() for y in v})
    write_snapshot(Source(id="fs-hauptaggregate", title="Statistica finanziaria – aggregati principali, debito e stato dei dati per livello",
                          publisher=PUBLISHER, publisher_url="https://www.efv.admin.ch/de/finanzstatistik", source_url=MAIN, landing_url=LANDING, license=LICENSE,
                          frequency="2 volte l'anno (febbraio/marzo e agosto/settembre)", level="gesamt", unit="CHF",
                          data_date=f"{main_years[0]}–{main_years[-1]}",
                          coverage="Entrate, uscite e saldo (modello FS); debito secondo Maastricht, debito netto e quote sul PIL (modello GFS) per Stato, Confederazione, Cantoni, Comuni e assicurazioni sociali; per ogni anno l'indicazione dell'AFF se il dato è consuntivo, parziale o previsione",
                          notes="Lo stato di ogni anno (Rechnung / Vorhandene Daten / Prognosen) è quello dichiarato dall'AFF nella colonna «source» del file."),
                   fm, {"status": status, "aggregates": main_agg}, extra_meta={"years": main_years})


if __name__ == "__main__":
    main()
