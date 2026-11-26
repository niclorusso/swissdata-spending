"""EFV – Bundesfinanzen per Verwaltungseinheit (unità amministrativa).

File: https://www.efv.admin.ch/dam/de/sd-web/LheAU2Ioeux7/institutionen_de.csv
Variables: Personalausgaben, Beratung und externe Dienstleistungen, Informatik (CHF); Anzahl Vollzeitstellen (FTE).
Levels: 1 = Bund, 2 = Departement, 3 = Verwaltungseinheit. 2007–2030 (FTE fino al 2027).
Produces: bund-verwaltungseinheiten
"""
from __future__ import annotations

import pandas as pd

from etl.common import Source, fetch, write_snapshot
from etl.efv_bundeshaushalt import LAST_RECHNUNG, LICENSE, PUBLISHER, PUBLISHER_URL, STATUS_RULE, status_for

URL = "https://www.efv.admin.ch/dam/de/sd-web/LheAU2Ioeux7/institutionen_de.csv"
LANDING = "https://www.efv.admin.ch/de/open-government-data-de"

VAR_KEYS = {"Personalausgaben": "personal", "Beratung und externe Dienstleistungen": "beratung",
            "Informatik": "informatik", "Anzahl Vollzeitstellen": "fte"}


def main() -> None:
    f = fetch(URL, "efv_institutionen_de.csv")
    df = pd.read_csv(f.path)
    df["key"] = df.variable_name.map(VAR_KEYS)
    years = sorted(int(y) for y in df.year.unique())
    units = []
    for (lvl, dep, ve), g in df.groupby(["category_level", "departement", "verwaltungseinheit"], sort=False):
        vals = {}
        for k, gg in g.groupby("key"):
            vals[k] = {int(r.year): (None if pd.isna(r.value) else (round(float(r.value)) if k != "fte" else round(float(r.value), 1)))
                       for r in gg.itertuples()}
        units.append({"level": int(lvl), "departement": str(dep), "name": str(ve), "values": vals})
    # counted in the file: level 3 = administrative units, level 2 = the groups they belong to (departments + authorities and courts)
    n_units, n_groups = sum(u["level"] == 3 for u in units), sum(u["level"] == 2 for u in units)
    n_last = sum(u["level"] == 3 and any(v.get(LAST_RECHNUNG) is not None for v in u["values"].values()) for u in units)
    write_snapshot(Source(id="bund-verwaltungseinheiten", title="Confederazione – personale, consulenza e informatica per unità amministrativa",
                          publisher=PUBLISHER, publisher_url=PUBLISHER_URL, source_url=URL, landing_url=LANDING, license=LICENSE,
                          frequency="2 volte l'anno (marzo, agosto)", level="bund", unit="CHF / FTE",
                          data_date="Rechnung 2025; Voranschlag 2026–2027; Finanzplan 2028–2030", notes=STATUS_RULE,
                          coverage=f"{n_units} unità amministrative, di cui {n_last} con un valore {LAST_RECHNUNG}, in {n_groups} gruppi ({n_groups - 1} dipartimenti più autorità e tribunali): spese per il personale, consulenza esterna, informatica e posti a tempo pieno, 2007–2030"),
                   f, {"units": units}, extra_meta={"years": years, "year_status": {y: status_for(y) for y in years}})


if __name__ == "__main__":
    main()
