"""EFV – Bundeshaushalt (Staatsrechnung / Voranschlag / Finanzplan), open data CSV.

Source: https://www.efv.admin.ch/de/open-government-data-de  (dataset "Bundesfinanzen – Gesamthaushalt")
File:   https://www.efv.admin.ch/dam/de/sd-web/m9aWXSnsRvNO/bundeshaushalt_de.csv
Produces snapshots:
  bund-ausgaben-aufgabengebiet   spese per settore di compito (3 livelli), 1990–2030
  bund-ausgaben-art              spese per natura (5 livelli), 2023–2030
  bund-einnahmen                 entrate (fino a 6 livelli), 1990–2030
  bund-kennzahlen                indicatori (quote, debito, saldo), 1990–2030
Gotcha: nothing in the file says which year is Rechnung / Voranschlag / Finanzplan -> we derive
`status` from the publication calendar (see STATUS_RULE) and expose it in every row.
"""
from __future__ import annotations

import pandas as pd

from etl.common import Source, fetch, write_snapshot

URL = "https://www.efv.admin.ch/dam/de/sd-web/m9aWXSnsRvNO/bundeshaushalt_de.csv"
LANDING = "https://www.efv.admin.ch/de/open-government-data-de"
PUBLISHER = "Eidgenössische Finanzverwaltung (EFV) / Amministrazione federale delle finanze (AFF)"
PUBLISHER_URL = "https://www.efv.admin.ch"
LICENSE = "opendata.swiss: Freie Nutzung. Quellenangabe ist Pflicht (terms_by)."

# Publication calendar as of the August 2026 release (Rechnung 2025 published 23.03.2026, VA 2027 + IAFP 2028-30 on 20.08.2026).
LAST_RECHNUNG = 2025
VORANSCHLAG_YEARS = {2026, 2027}
STATUS_RULE = f"anno <= {LAST_RECHNUNG}: Rechnung (consuntivo); 2026-2027: Voranschlag (preventivo); >= 2028: Finanzplan (piano finanziario)"


def status_for(year: int) -> str:
    if year <= LAST_RECHNUNG:
        return "R"
    if year in VORANSCHLAG_YEARS:
        return "VA"
    return "FP"


def build_tree(df: pd.DataFrame, max_level: int) -> list[dict]:
    """Turn the (variable_id, category_level_1..n) rows into a nested tree with a years->value map per node."""
    d = df[df.category_level <= max_level].copy()
    nodes: dict[str, dict] = {}
    order: list[str] = []
    for (vid, name, lvl), g in d.groupby(["variable_id", "variable_name", "category_level"], sort=False):
        first = g.iloc[0]
        parts = [first[f"category_level_{i}"] for i in range(1, int(lvl) + 1)]
        key = " > ".join(str(p) for p in parts)
        parent = " > ".join(str(p) for p in parts[:-1]) if lvl > 1 else None
        values = {int(r.year): (None if pd.isna(r.value) else round(float(r.value))) for r in g.itertuples()}
        nodes[key] = {"id": int(vid), "name": str(name), "level": int(lvl), "parent": parent, "unit": str(first.unit),
                      "values": dict(sorted(values.items())), "children": []}
        order.append(key)
    roots = []
    for key in order:
        n = nodes[key]
        if n["parent"] and n["parent"] in nodes:
            nodes[n["parent"]]["children"].append(n)
        else:
            roots.append(n)
    # drop the internal parent key in the output
    for n in nodes.values():
        n.pop("parent", None)
    return roots


def main() -> None:
    f = fetch(URL, "efv_bundeshaushalt_de.csv")
    df = pd.read_csv(f.path)
    years = sorted(int(y) for y in df.year.unique())
    status = {y: status_for(y) for y in years}
    common = dict(publisher=PUBLISHER, publisher_url=PUBLISHER_URL, source_url=URL, landing_url=LANDING,
                  license=LICENSE, frequency="2 volte l'anno (marzo: consuntivo; agosto: preventivo e piano finanziario)",
                  level="bund", unit="CHF", data_date=f"Rechnung {LAST_RECHNUNG}; Voranschlag 2026–2027; Finanzplan 2028–2030",
                  notes=STATUS_RULE)
    extra = {"year_status": status, "years": years}

    aufg = df[df.topic == "Ausgaben nach Aufgabengebiet"]
    write_snapshot(Source(id="bund-ausgaben-aufgabengebiet", title="Confederazione – spese per settore di compito",
                          coverage="Spese della Confederazione per 13 settori di compito e sotto-settori, 1990–2030", **common),
                   f, {"tree": build_tree(aufg, 3)}, extra_meta=extra)

    art = df[df.topic == "Ausgaben nach Art"]
    write_snapshot(Source(id="bund-ausgaben-art", title="Confederazione – spese per natura",
                          coverage="Spese correnti e d'investimento per natura economica (personale, beni e servizi, trasferimenti…), 2023–2030", **common),
                   f, {"tree": build_tree(art, 5)}, extra_meta=extra)

    ein = df[df.topic == "Einnahmen"]
    write_snapshot(Source(id="bund-einnahmen", title="Confederazione – entrate",
                          coverage="Entrate della Confederazione per tipo (imposta federale diretta, IVA, imposta preventiva…), 1990–2030", **common),
                   f, {"tree": build_tree(ein, 4)}, extra_meta=extra)

    kz = df[df.topic.isin(["Kennzahlen", "Schuldenbremse", "Referenzgrössen"])]
    series = {}
    for (vid, name, unit, topic), g in kz.groupby(["variable_id", "variable_name", "unit", "topic"]):
        series[str(name)] = {"id": int(vid), "unit": str(unit), "topic": str(topic),
                             "values": {int(r.year): (None if pd.isna(r.value) else float(r.value)) for r in g.itertuples()}}
    write_snapshot(Source(id="bund-kennzahlen", title="Confederazione – indicatori e freno all'indebitamento",
                          coverage="Quota di spesa, quota fiscale, debito lordo/netto, saldo di finanziamento, PIL nominale, 1990–2030", **common),
                   f, {"series": series}, extra_meta=extra)


if __name__ == "__main__":
    main()
