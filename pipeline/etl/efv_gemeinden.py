"""EFV – Finanzstatistik: Comuni con ≥ 5 000 abitanti, conti per singolo Comune (HRM2).

File: https://www.data.finance.admin.ch/static/assets/datasets/fs_dashboard/gdn_ab_5000-d.csv (~96 MB, ';' separated)
Columns: jahr; nr (2-digit canton code + 4-digit BFS number); gemeinde; konto (3-digit HRM2 Sachgruppe); funktion (2-digit); betrag
konto 3xx = Aufwand (spese correnti), 4xx = Ertrag, 5xx = Investitionsausgaben, 6xx = Investitionseinnahmen, 1xx/2xx = bilancio.
Produces: fs-gemeinden-5000  (per municipality: yearly Aufwand, Ertrag, Investitionsausgaben, Aufwand by function L1)
"""
from __future__ import annotations

import pandas as pd

from etl.common import Source, fetch, write_snapshot
from etl.efv_finanzstatistik import H, LANDING, LICENSE, PUBLISHER

URL = "https://www.data.finance.admin.ch/static/assets/datasets/fs_dashboard/gdn_ab_5000-d.csv"
KT_BY_CODE = {1: "ZH", 2: "BE", 3: "LU", 4: "UR", 5: "SZ", 6: "OW", 7: "NW", 8: "GL", 9: "ZG", 10: "FR", 11: "SO", 12: "BS", 13: "BL",
              14: "SH", 15: "AR", 16: "AI", 17: "SG", 18: "GR", 19: "AG", 20: "TG", 21: "TI", 22: "VD", 23: "VS", 24: "NE", 25: "GE", 26: "JU"}
FUNK1_IT = {"0": "Amministrazione generale", "1": "Ordine pubblico e sicurezza, difesa", "2": "Educazione", "3": "Cultura, sport e ricreazione, religione",
            "4": "Sanità", "5": "Sicurezza sociale", "6": "Traffico e telecomunicazioni", "7": "Protezione dell'ambiente e assetto del territorio",
            "8": "Economia pubblica", "9": "Finanze e imposte"}


def main() -> None:
    f = fetch(URL, "efv_fs_gdn_ab_5000-d.csv", headers=H, timeout=900)
    df = pd.read_csv(f.path, sep=";", dtype={"nr": str, "konto": str, "funktion": str})
    df["k1"] = df.konto.str[0]
    df["f1"] = df.funktion.str[0]
    years = sorted(int(y) for y in df.jahr.unique())
    out = {}
    for nr, g in df.groupby("nr"):
        kt = KT_BY_CODE.get(int(nr[:2]), "?")
        bfs = int(nr[2:])
        name = g.sort_values("jahr").gemeinde.iloc[-1]
        aufwand = g[g.k1 == "3"].groupby("jahr").betrag.sum()
        ertrag = g[g.k1 == "4"].groupby("jahr").betrag.sum()
        inv = g[g.k1 == "5"].groupby("jahr").betrag.sum()
        byf = g[g.k1 == "3"].groupby(["f1", "jahr"]).betrag.sum()
        funk1 = {}
        for code in sorted(set(byf.index.get_level_values(0))):
            funk1[code] = {"code": code, "it": FUNK1_IT.get(code, code), "values": {int(y): round(float(v)) for (c, y), v in byf.items() if c == code}}
        out[nr] = {"bfs_nr": bfs, "kanton": kt, "name": name, "years": sorted(int(y) for y in g.jahr.unique()),
                   "aufwand": {int(y): round(float(v)) for y, v in aufwand.items()},
                   "ertrag": {int(y): round(float(v)) for y, v in ertrag.items()},
                   "investitionen": {int(y): round(float(v)) for y, v in inv.items()},
                   "funk1": funk1}
    write_snapshot(Source(id="fs-gemeinden-5000", title="Statistica finanziaria – Comuni con almeno 5 000 abitanti, conti per singolo Comune",
                          publisher=PUBLISHER, publisher_url="https://www.efv.admin.ch/de/finanzstatistik", source_url=URL, landing_url=LANDING, license=LICENSE,
                          frequency="annuale", level="gemeinden", unit="CHF", data_date=f"{years[0]}–{years[-1]}",
                          coverage=f"{len(out)} Comuni, spese correnti (Aufwand) per funzione, ricavi, investimenti, {years[0]}–{years[-1]}",
                          notes="Conto economico HRM2 (Aufwand/Ertrag), non conto di finanziamento: i totali non sono sommabili con le «uscite» del modello FS. L'ultimo anno può essere incompleto per alcuni Comuni."),
                   f, {"gemeinden": out}, extra_meta={"years": years})


if __name__ == "__main__":
    main()
