"""BKB – Beschaffungen ab 50 000 Franken der zentralen Bundesverwaltung (Art. 27 VöB).

Yearly XLSX published by the Beschaffungskonferenz des Bundes on opendata.swiss (org "bkb").
Each file lists every contract >= CHF 50 000 concluded in the contract year: buyer unit, supplier, place,
object, procedure, start/end, volume incl. VAT.
Produces:
  bund-beschaffungen           aggregates per year (by department, procedure, top suppliers, top objects)
  bund-beschaffungen-<year>    full row-level detail for the client-side search table
"""
from __future__ import annotations

import re

import pandas as pd

from etl.common import Source, fetch, to_num, write_snapshot

PUBLISHER = "Beschaffungskonferenz des Bundes (BKB) / Conferenza degli acquisti della Confederazione (CA)"
PUBLISHER_URL = "https://www.bkb.admin.ch"
LICENSE = "opendata.swiss: Freie Nutzung (terms_open)"
LANDING = "https://opendata.swiss/de/organization/bkb"

FILES = [  # (contract year, opendata.swiss dataset, file url)
    (2021, "https://opendata.swiss/de/dataset/beschaffungen-ab-50-000-franken-der-zentralen-bundesverwaltung-20211",
     "https://backend.bkb.admin.ch/fileservice/sdweb-docs-prod-bkbadminch-files/files/2024/06/28/dd1ea653-914e-496a-812b-4b8a71eb5e1b.xlsx"),
    (2022, "https://opendata.swiss/de/dataset/beschaffungen-ab-50-000-franken-der-zentralen-bundesverwaltung-20221",
     "https://backend.bkb.admin.ch/fileservice/sdweb-docs-prod-bkbadminch-files/files/2024/06/28/3d0a1157-63da-4e6c-b933-90dac67c45c9.xlsx"),
    (2023, "https://opendata.swiss/de/dataset/beschaffungen-ab-50-000-franken-der-zentralen-bundesverwaltung-20241",
     "https://backend.bkb.admin.ch/fileservice/sdweb-docs-prod-bkbadminch-files/files/2024/11/14/65a1a791-d80e-44bb-8da8-08d2e95afe9c.xlsx"),
    (2024, "https://www.bkb.admin.ch/de/berichterstattung-ab-50000",
     "https://www.bkb.admin.ch/dam/de/sd-web/mhYFV5ZlNhYV/Vertr%C3%A4ge%20ab%2050%20000%20Franken%202024%20DE.xlsx"),
]

COLS = {"Departement": "dep", "Verwaltungseinheit (Auftraggeber)": "unit", "Lieferant (Auftragnehmer)": "supplier",
        "Postleitzahl": "plz", "Ort": "ort", "Beschaffungsgegenstand": "object", "Vergabeverfahren": "procedure",
        "Vertragsbeginn": "start", "Vertragsende": "end", "Auftragsvolumen inkl. MwSt in CHF": "chf"}


def norm_dep(s: str) -> str:
    s = re.sub(r"\s+", "", str(s))
    return "PARL, BR, BK" if s.upper().startswith("PARL") else str(s).strip()


def late_additions(x: pd.ExcelFile) -> dict:
    """Sheet 'Nachpublikation…': contracts of earlier years whose volume was raised afterwards.
    Last column = amount added on top of what had already been published. Kept apart from the year's contracts."""
    sheet = next((s for s in x.sheet_names if s.startswith("Nachpublikation")), None)
    if sheet is None:
        return {"n": 0, "chf_added": 0}
    d = x.parse(sheet, header=1)
    col = next(c for c in d.columns if str(c).startswith("Nachpublikation des Auftragsvolumens"))
    v = d[col].map(to_num).dropna()
    return {"n": int(len(v)), "chf_added": round(float(v.sum()))}


def load(year: int, url: str) -> tuple[pd.DataFrame, object, dict]:
    f = fetch(url, f"bkb_beschaffungen_{year}.xlsx")
    x = pd.ExcelFile(f.path)
    late = late_additions(x)
    sheet = next(s for s in x.sheet_names if "Vertragsdaten" in s)
    df = x.parse(sheet, header=1)
    df = df.rename(columns=COLS)[list(COLS.values())]
    df = df.dropna(subset=["supplier", "chf"], how="all")
    df["chf"] = df["chf"].map(to_num)
    df = df[df.chf.notna()]
    df["dep"] = df.dep.map(norm_dep)
    for c in ("start", "end"):
        df[c] = pd.to_datetime(df[c], errors="coerce", dayfirst=True).dt.strftime("%Y-%m-%d")
    for c in ("unit", "supplier", "ort", "object", "procedure"):
        df[c] = df[c].astype("string").str.strip()
    df["plz"] = df.plz.map(lambda v: None if pd.isna(v) else str(v).split(".")[0])
    df["year"] = year
    return df, f, late


def top(df: pd.DataFrame, col: str, n: int = 25) -> list[dict]:
    g = df.groupby(col, dropna=False).agg(chf=("chf", "sum"), n=("chf", "size")).sort_values("chf", ascending=False)
    return [{"name": (None if pd.isna(k) else str(k)), "chf": round(float(r.chf)), "n": int(r.n)} for k, r in g.head(n).iterrows()]


def main() -> None:
    years = {}
    all_rows = []
    for year, ds, url in FILES:
        df, f, late = load(year, url)
        all_rows.append(df)
        dup = df.duplicated(["dep", "unit", "supplier", "plz", "ort", "object", "procedure", "start", "end", "chf"])
        years[year] = {
            "total_chf": round(float(df.chf.sum())), "n": int(len(df)), "n_suppliers": int(df.supplier.nunique()),
            # rows identical in every published field: possibly distinct contracts, possibly double entries. Counted, not removed.
            "identical_rows": {"n": int(dup.sum()), "chf": round(float(df[dup].chf.sum()))},
            "late_additions": late,
            "largest": {"supplier": str(df.loc[df.chf.idxmax(), "supplier"]), "object": str(df.loc[df.chf.idxmax(), "object"]), "chf": round(float(df.chf.max()))},
            "by_department": top(df, "dep", 20), "by_procedure": top(df, "procedure", 10),
            "top_suppliers": top(df, "supplier", 50), "top_units": top(df, "unit", 30), "top_objects": top(df, "object", 30),
            "source_url": url, "dataset_url": ds, "retrieved_at": f.retrieved_at, "published_at": f.last_modified, "sha256": f.sha256,
        }
        rows = df[["dep", "unit", "supplier", "plz", "ort", "object", "procedure", "start", "end", "chf"]].copy()
        rows["chf"] = rows.chf.round().astype(int)
        recs = rows.astype(object).where(rows.notna(), None).to_dict(orient="records")
        write_snapshot(Source(id=f"bund-beschaffungen-{year}", title=f"Confederazione – appalti ≥ 50 000 CHF, contratti {year}",
                              publisher=PUBLISHER, publisher_url=PUBLISHER_URL, source_url=url, landing_url=ds, license=LICENSE,
                              frequency="annuale (settembre dell'anno successivo)", level="bund", unit="CHF (IVA inclusa)",
                              data_date=str(year), coverage=f"{len(df)} contratti dell'Amministrazione federale centrale, anno {year}",
                              notes="Art. 27 OAPub: pubblicazione dei contratti ≥ 50 000 CHF; il file successivo può contenere ripubblicazioni (foglio 'Nachpublikationen', non incluso)."),
                       f, {"rows": recs})
    allc = pd.concat(all_rows)
    write_snapshot(Source(id="bund-beschaffungen", title="Confederazione – appalti ≥ 50 000 CHF (riepilogo)",
                          publisher=PUBLISHER, publisher_url=PUBLISHER_URL, source_url=FILES[-1][2], landing_url=LANDING, license=LICENSE,
                          frequency="annuale (settembre dell'anno successivo)", level="bund", unit="CHF (IVA inclusa)",
                          data_date=f"{min(years)}–{max(years)}",
                          coverage=f"{len(allc)} contratti, {allc.supplier.nunique()} fornitori, {allc.chf.sum()/1e9:.1f} mld CHF in {len(years)} anni",
                          notes="Il dataset 'Beschaffungen 2024' su opendata.swiss contiene i contratti 2023 (l'anno del titolo è l'anno di pubblicazione)."),
                   None, {"years": years, "top_suppliers_all": top(allc, "supplier", 100)},
                   extra_meta={"retrieved_at": max(v["retrieved_at"] for v in years.values()),
                               "checked_at": max(v["retrieved_at"] for v in years.values())})


if __name__ == "__main__":
    main()
