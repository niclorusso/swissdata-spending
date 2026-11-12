"""Conti di TUTTI i Comuni per i Cantoni che li pubblicano in forma leggibile: Ticino e Zurigo.

L'AFF pubblica i singoli Comuni solo sopra i 5 000 abitanti. Qui usiamo le statistiche cantonali:
  TI  Sezione degli enti locali (SEL), «Statistica finanziaria dei comuni», allegato statistico annuale (XLSX,
      una tabella per foglio, Comune identificato dal nome, importi in 1 000 fr.).
  ZH  Statistisches Amt, «Gemeindekennziffern» (un CSV per indicatore, numero UST, Fr. per abitante) e Steuerfüsse.
Le misure dei due Cantoni NON sono confrontabili tra loro (definizioni diverse): ogni Cantone ha il suo elenco.
Produces: gemeinden-ti, gemeinden-zh  {year, measures: [...], gemeinden: {bfs_nr: {name, pop, values, series?}}}
"""
from __future__ import annotations

import json
import re
import unicodedata

import pandas as pd

from etl.common import SNAP_DIR, Source, fetch, write_snapshot

TI_YEAR = 2024
TI_BASE = "https://www4.ti.ch/fileadmin/DI/DI_DI/SEL/Comuni/DatiFinanziari/StatisticaFinanziaria/"
TI_URL = f"{TI_BASE}{TI_YEAR}-allegato.xlsx"
TI_LANDING = "https://www4.ti.ch/di/sel/comuni/dati-finanziari/statistica-finanziaria"
ZH_BASE = "https://www.web.statistik.zh.ch/ogd/data/"
ZH_STF = ZH_BASE + "steuerfuesse/kanton_zuerich_stf_timeseries.csv"
ZH_LANDING = "https://www.zh.ch/de/politik-staat/gemeinden/gemeindeportraet.html"
ZH_FUNK = {420: "Amministrazione generale", 421: "Formazione", 423: "Sanità", 424: "Cultura, sport e tempo libero",
           425: "Ordine pubblico e sicurezza", 426: "Sicurezza sociale", 427: "Ambiente e territorio", 428: "Trasporti", 429: "Economia"}
ZH_IND = {431: "nettovermoegen", 430: "netinv_pc", 828: "risultato_pc", 378: "steuerkraft"}
H = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"}


def norm(s: str) -> str:
    s = re.sub(r"\[\*\]", "", str(s))
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z]", "", s.lower())


def ti_sheet(x: pd.ExcelFile, name: str, first_row: int) -> pd.DataFrame:
    """Rows of one commune each: stop at TOTALE / MEDIA; col 0 = name."""
    d = x.parse(name, header=None).iloc[first_row:]
    d = d[d[0].notna()]
    stop = d[d[0].astype(str).str.strip().str.upper().isin(["TOTALE", "MEDIA"])].index
    if len(stop):
        d = d.loc[: stop[0] - 1]
    d = d.assign(key=d[0].map(norm), water=d[0].astype(str).str.contains(r"\[\*\]"))
    return d.set_index("key")


def ticino() -> None:
    f = fetch(TI_URL, f"ti_sel_{TI_YEAR}-allegato.xlsx", headers=H)
    x = pd.ExcelFile(f.path)
    t8, t9, t10, t12 = ti_sheet(x, "tab8", 3), ti_sheet(x, "tab9", 2), ti_sheet(x, "tab10", 3), ti_sheet(x, "tab12", 2)
    # column positions are checked against the header text so a layout change fails loudly instead of shifting numbers
    h8, h9, h10, h12 = (x.parse(s, header=None) for s in ("tab8", "tab9", "tab10", "tab12"))
    assert "Popolazione" in str(h8.iloc[1, 1]) and "coordinato" in str(h8.iloc[2, 4]) and "Risorse fiscali" in str(h8.iloc[1, 5])
    assert "Spese operative" in str(h9.iloc[1, 2]) and "RISULTATO TOTALE" in str(h9.iloc[1, 16])
    assert "ONERE NETTO" in str(h10.iloc[2, 4])
    assert "procapite" in str(h12.iloc[1, 8])

    pop_names = json.loads((SNAP_DIR / "bfs-bevoelkerung-gemeinden.json").read_text())["data"]["population"]
    bfs_by_name = {norm(v["name"]): int(k) for k, v in pop_names.items() if 5001 <= int(k) <= 5399}
    # Comuni del 2024 confluiti in un nuovo Comune dopo la chiusura dei conti: i loro conti sono sommati nel Comune attuale
    # (abbinamento verificato: la somma degli abitanti 2024 coincide con il dato UST del Comune attuale).
    merged_into = {norm(n): bfs for bfs, names in {5395: ["Astano", "Bedigliora", "Curio", "Miglieglia", "Novaggio"],
                                                   5073: ["Giornico", "Bodio"], 5079: ["Quinto", "Prato (Leventina)"]}.items() for n in names}
    parts: dict[int, list[dict]] = {}
    unmatched = []
    for key, r in t8.iterrows():
        bfs = merged_into.get(key) or bfs_by_name.get(key)
        if bfs is None:
            unmatched.append(str(r[0]))
            continue
        g9, g10, g12 = t9.loc[key], t10.loc[key], t12.loc[key]
        parts.setdefault(bfs, []).append({"name": str(g9[0]).replace("[*]", "").strip(), "pop": float(r[1]), "water": bool(g9["water"]),
                                          "mp": float(r[4]), "risorse_pc": float(r[5]), "spese": float(g9[2]) * 1000, "ricavi": float(g9[3]) * 1000,
                                          "risultato": float(g9[16]) * 1000, "netinv": float(g10[4]) * 1000, "debito": float(g12[7]) * 1000})
    out = {}
    for bfs, ps in parts.items():
        one = len(ps) == 1
        tot = {k: sum(q[k] for q in ps) for k in ("pop", "spese", "ricavi", "risultato", "netinv", "debito")}
        pop = tot["pop"]
        assert round(pop) == pop_names[str(bfs)]["values"].get(str(TI_YEAR), round(pop)), (bfs, pop)
        out[str(bfs)] = {"name": ps[0]["name"] if one else pop_names[str(bfs)]["name"], "pop": round(pop), "water_included": any(q["water"] for q in ps),
                         "merged_from": None if one else [{"name": q["name"], "pop": round(q["pop"]), "moltiplicatore": q["mp"]} for q in ps],
                         "values": {"spese_pc": round(tot["spese"] / pop), "risultato_pc": round(tot["risultato"] / pop), "netinv_pc": round(tot["netinv"] / pop),
                                    "debito_pc": round(tot["debito"] / pop), "moltiplicatore": ps[0]["mp"] if len({q["mp"] for q in ps}) == 1 else None,
                                    "risorse_pc": round(ps[0]["risorse_pc"]) if one else None},
                         "abs": {k: round(tot[k]) for k in ("spese", "ricavi", "netinv", "debito")}}
    if unmatched:
        print("[ti] Comuni senza numero UST:", unmatched)
    measures = [
        {"key": "spese_pc", "label": "Spese operative per abitante", "unit": "chf", "note": f"Spese correnti del Comune nel {TI_YEAR}, senza investimenti"},
        {"key": "debito_pc", "label": "Debito netto per abitante", "unit": "chf", "diverging": True, "note": f"Debiti meno averi finanziari a fine {TI_YEAR}. Se negativo, il Comune ha più averi che debiti"},
        {"key": "moltiplicatore", "label": "Moltiplicatore d'imposta", "unit": "pct", "note": f"Percentuale dell'imposta cantonale che il Comune preleva, {TI_YEAR + 1}. Più è alta, più imposte comunali si pagano"},
        {"key": "netinv_pc", "label": "Investimenti netti per abitante", "unit": "chf", "note": f"Spese per opere (strade, scuole, canalizzazioni) nel {TI_YEAR}, tolti i sussidi ricevuti. Se negativo, i sussidi incassati superano le spese"},
        {"key": "risultato_pc", "label": "Risultato d'esercizio per abitante", "unit": "chf", "diverging": True, "note": f"Ricavi meno spese nel {TI_YEAR}. Se negativo, è un disavanzo"},
        {"key": "risorse_pc", "label": "Risorse fiscali per abitante", "unit": "chf", "note": f"Gettito fiscale per abitante nel {TI_YEAR - 2}: misura la forza fiscale del Comune"},
    ]
    write_snapshot(Source(id="gemeinden-ti", title=f"Ticino – conti di tutti i Comuni, {TI_YEAR}",
                          publisher="Cantone Ticino, Sezione degli enti locali (SEL)", publisher_url="https://www4.ti.ch/di/sel", source_url=TI_URL,
                          landing_url=TI_LANDING, license="nessuna licenza indicata dalla fonte; citazione della fonte", frequency="annuale",
                          level="gemeinden", unit="CHF", data_date=str(TI_YEAR),
                          coverage=f"{sum(len(v) for v in parts.values())} Comuni ticinesi del {TI_YEAR}, riportati ai {len(out)} Comuni attuali: spese operative, risultato, investimenti netti, debito pubblico netto, moltiplicatore, risorse fiscali",
                          notes="I Comuni segnati dalla fonte con [*] includono nei conti l'approvvigionamento idrico, che negli altri è tenuto a parte: il confronto delle spese ne risente. Il Comune è identificato dal nome e abbinato al numero UST. I Comuni aggregati dopo il 2024 (Lema, Giornico con Bodio, Quinto con Prato Leventina) sono sommati nel Comune attuale; per loro le risorse fiscali non sono calcolate e il moltiplicatore è indicato solo se era uguale in tutti i Comuni confluiti."),
                   f, {"year": TI_YEAR, "kanton": "ti", "measures": measures, "gemeinden": out}, extra_meta={"unmatched": unmatched})


def zh_csv(ind: int) -> pd.DataFrame:
    f = fetch(f"{ZH_BASE}KANTON_ZUERICH_{ind}.csv", f"zh_gemeindekennziffer_{ind}.csv", headers=H)
    d = pd.read_csv(f.path, index_col=False, encoding="utf-8-sig")
    d = d[(d.BFS_NR >= 1) & (d.BFS_NR <= 299) & (d.INDIKATOR_JAHR >= 2019)]
    return d[["BFS_NR", "GEBIET_NAME", "INDIKATOR_JAHR", "INDIKATOR_VALUE"]].rename(columns={"BFS_NR": "bfs", "GEBIET_NAME": "name", "INDIKATOR_JAHR": "year", "INDIKATOR_VALUE": "v"})


def zurich() -> None:
    frames = {key: zh_csv(ind) for ind, key in ZH_IND.items()}
    funk = {ind: zh_csv(ind) for ind in ZH_FUNK}
    year = int(max(d.year.max() for d in frames.values()))
    fs = fetch(ZH_STF, "zh_steuerfuesse_timeseries.csv", headers=H)
    stf = pd.read_csv(fs.path, encoding="utf-8-sig")
    stf_year = int(stf.YEAR.max())
    pop_names = json.loads((SNAP_DIR / "bfs-bevoelkerung-gemeinden.json").read_text())["data"]["population"]
    out: dict[str, dict] = {}
    names = frames["nettovermoegen"][frames["nettovermoegen"].year == year].set_index("bfs").name
    for bfs, name in names.items():
        def ser(d: pd.DataFrame) -> dict[int, float]:
            g = d[d.bfs == bfs]
            return {int(r.year): float(r.v) for r in g.itertuples() if pd.notna(r.v)}
        nv = ser(frames["nettovermoegen"])
        fvals = {ind: ser(d).get(year) for ind, d in funk.items()}
        st = stf[stf.BFSNR == bfs].set_index("YEAR").STF_O_KIRCHE1
        values = {"servizi_pc": round(sum(v for v in fvals.values() if v is not None)), "debito_pc": -round(nv[year]) if year in nv else None,
                  "steuerfuss": float(st.get(year)) if year in st.index else None, "netinv_pc": ser(frames["netinv_pc"]).get(year),
                  "risultato_pc": ser(frames["risultato_pc"]).get(year), "steuerkraft": ser(frames["steuerkraft"]).get(year)}
        out[str(int(bfs))] = {"name": str(name), "pop": pop_names.get(str(int(bfs)), {}).get("values", {}).get(str(year)),
                              "values": values, "funk": {ZH_FUNK[i]: v for i, v in fvals.items() if v is not None},
                              "series": {"debito_pc": {y: -round(v) for y, v in nv.items()}, "steuerfuss": {int(y): float(v) for y, v in st.items() if y >= 2019}},
                              "steuerfuss_latest": {"year": stf_year, "value": float(st.get(stf_year))} if stf_year in st.index else None}
    measures = [
        {"key": "servizi_pc", "label": "Costo netto dei servizi per abitante", "unit": "chf", "note": f"Costo dei servizi comunali nel {year}, tolti i ricavi propri di ogni servizio (tasse d'uso, contributi ricevuti)"},
        {"key": "debito_pc", "label": "Debito netto per abitante", "unit": "chf", "diverging": True, "note": f"Debiti meno averi finanziari a fine {year}. Se negativo, il Comune ha più averi che debiti"},
        {"key": "steuerfuss", "label": "Moltiplicatore d'imposta", "unit": "pct", "note": f"Percentuale dell'imposta cantonale che il Comune preleva, {year}, senza imposta di culto. Più è alta, più imposte comunali si pagano"},
        {"key": "netinv_pc", "label": "Investimenti netti per abitante", "unit": "chf", "note": f"Spese per opere (strade, scuole, canalizzazioni) nel {year}, tolti i sussidi ricevuti"},
        {"key": "risultato_pc", "label": "Risultato d'esercizio per abitante", "unit": "chf", "diverging": True, "note": f"Ricavi meno spese nel {year}. Se negativo, è un disavanzo"},
        {"key": "steuerkraft", "label": "Forza fiscale per abitante", "unit": "chf", "note": f"Gettito fiscale per abitante nel {year}, a moltiplicatore uguale per tutti"},
    ]
    f0 = fetch(f"{ZH_BASE}KANTON_ZUERICH_431.csv", "zh_gemeindekennziffer_431.csv", headers=H)
    write_snapshot(Source(id="gemeinden-zh", title=f"Zurigo – indicatori finanziari di tutti i Comuni, {year}",
                          publisher="Statistisches Amt des Kantons Zürich", publisher_url="https://www.zh.ch/de/direktion-der-justiz-und-des-innern/statistisches-amt.html",
                          source_url=f"{ZH_BASE}KANTON_ZUERICH_431.csv", landing_url=ZH_LANDING, license="opendata.swiss: Freie Nutzung. Quellenangabe ist Pflicht (terms_by).",
                          frequency="annuale", level="gemeinden", unit="CHF per abitante", data_date=f"2019–{year}; Steuerfuss fino al {stf_year}",
                          coverage=f"{len(out)} Comuni zurighesi: costo netto dei servizi per funzione, patrimonio/debito netto, investimenti netti, risultato, Steuerfuss, forza fiscale",
                          notes="Base «Konsolidierte Gemeinde»: i conti dei Comuni scolastici sono attribuiti pro quota ai Comuni politici. Un file CSV per indicatore (ID 378, 420–431, 828) più il file degli Steuerfüsse."),
                   f0, {"year": year, "kanton": "zh", "measures": measures, "gemeinden": out})


def main() -> None:
    ticino()
    zurich()


if __name__ == "__main__":
    main()
