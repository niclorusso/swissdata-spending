"""Shared helpers: download with provenance, snapshot writer, source ledger.

Every snapshot written by the ETL carries a `meta` block with:
  source        who publishes the data and where we got it (URL)
  data_date     the reference period / "dato al" declared by the publisher
  published_at  when the publisher released the file (HTTP Last-Modified or declared)
  retrieved_at  when we downloaded it
  checked_at    when we last re-verified the file against the source (== retrieved_at on a fresh run)
  sha256        hash of the raw file we parsed
"""
from __future__ import annotations

import hashlib
import json
import os
import re
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "data" / "raw"
SNAP_DIR = ROOT / "data" / "snapshots"
LEDGER = ROOT / "data" / "source-ledger.json"

UA = "spesa-pubblica-ch/0.1 (+https://github.com/nicolalorusso/spesa-pubblica-ch; open-source public-spending aggregator)"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


@dataclass
class Fetched:
    url: str
    path: Path
    sha256: str
    retrieved_at: str
    last_modified: str | None
    content_type: str | None
    size: int


def fetch(url: str, name: str, *, force: bool = False, timeout: int = 120, headers: dict | None = None) -> Fetched:
    """Download `url` into data/raw/<name>. Returns provenance. Re-uses the cached file unless force=True."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    dest = RAW_DIR / name
    meta_path = dest.with_suffix(dest.suffix + ".meta.json")
    if dest.exists() and meta_path.exists() and not force and os.environ.get("ETL_FORCE") != "1":
        m = json.loads(meta_path.read_text())
        return Fetched(url=m["url"], path=dest, sha256=m["sha256"], retrieved_at=m["retrieved_at"],
                       last_modified=m.get("last_modified"), content_type=m.get("content_type"), size=m["size"])
    h = {"User-Agent": UA, **(headers or {})}
    with requests.get(url, headers=h, timeout=timeout, stream=True) as r:
        r.raise_for_status()
        tmp = dest.with_suffix(dest.suffix + ".part")
        with open(tmp, "wb") as f:
            for chunk in r.iter_content(1 << 16):
                f.write(chunk)
        tmp.replace(dest)
        lm_raw = r.headers.get("Last-Modified")
        ct = r.headers.get("Content-Type")
    lm = None
    if lm_raw:
        try:
            lm = parsedate_to_datetime(lm_raw).astimezone(timezone.utc).replace(microsecond=0).isoformat()
        except Exception:
            lm = lm_raw
    out = Fetched(url=url, path=dest, sha256=sha256_of(dest), retrieved_at=now_iso(),
                  last_modified=lm, content_type=ct, size=dest.stat().st_size)
    meta_path.write_text(json.dumps({**asdict(out), "path": str(dest)}, indent=2))
    return out


@dataclass
class Source:
    id: str                      # stable dataset id, e.g. "efv-staatsrechnung-funktion"
    title: str                   # human title (IT)
    publisher: str               # e.g. "Eidgenössische Finanzverwaltung (EFV)"
    publisher_url: str
    source_url: str              # exact file/API URL we parsed
    landing_url: str             # human landing page
    license: str                 # e.g. "opendata.swiss – Freie Nutzung. Quellenangabe ist Pflicht."
    frequency: str               # e.g. "annuale (febbraio/agosto)"
    level: str                   # "bund" | "kantone" | "gemeinden" | "sozialversicherungen" | "gesamt"
    unit: str                    # e.g. "CHF"
    data_date: str               # reference period declared by the publisher, e.g. "2024" or "2024-12-31"
    published_at: str | None = None
    retrieved_at: str | None = None
    checked_at: str | None = None
    sha256: str | None = None
    notes: str = ""
    coverage: str = ""           # what the dataset covers, one line


def write_snapshot(source: Source, fetched: Fetched | None, payload: Any, *, extra_meta: dict | None = None) -> Path:
    SNAP_DIR.mkdir(parents=True, exist_ok=True)
    if fetched is not None:
        source.retrieved_at = fetched.retrieved_at
        source.checked_at = now_iso()
        source.sha256 = fetched.sha256
        if source.published_at is None and fetched.last_modified:
            source.published_at = fetched.last_modified
    meta = {**asdict(source), **(extra_meta or {}), "generated_at": now_iso()}
    out = SNAP_DIR / f"{source.id}.json"
    out.write_text(json.dumps({"meta": meta, "data": payload}, ensure_ascii=False, indent=1, default=_json_default))
    _update_ledger(meta)
    print(f"[snapshot] {source.id}: {out.stat().st_size/1024:.0f} KB -> {out.relative_to(ROOT)}")
    return out


def _json_default(o):
    try:
        import numpy as np  # noqa
        if isinstance(o, (np.integer,)):
            return int(o)
        if isinstance(o, (np.floating,)):
            return None if np.isnan(o) else float(o)
    except ImportError:
        pass
    if isinstance(o, float) and o != o:
        return None
    if isinstance(o, Path):
        return str(o)
    raise TypeError(f"not serializable: {type(o)}")


def _update_ledger(meta: dict) -> None:
    ledger: dict[str, Any] = {}
    if LEDGER.exists():
        ledger = json.loads(LEDGER.read_text())
    ledger[meta["id"]] = {k: meta.get(k) for k in (
        "id", "title", "publisher", "publisher_url", "landing_url", "source_url", "license", "frequency",
        "level", "unit", "data_date", "published_at", "retrieved_at", "checked_at", "sha256", "coverage", "notes")}
    LEDGER.write_text(json.dumps(dict(sorted(ledger.items())), ensure_ascii=False, indent=1))


def slug(s: str) -> str:
    s = re.sub(r"[^\w]+", "-", s.strip().lower(), flags=re.UNICODE)
    return re.sub(r"-+", "-", s).strip("-")


def to_num(x) -> float | None:
    """Parse Swiss-formatted numbers: 1'234.5, 1 234,5, '-', '', '…'."""
    if x is None:
        return None
    if isinstance(x, (int, float)):
        return None if (isinstance(x, float) and x != x) else float(x)
    s = str(x).strip().replace("'", "").replace("’", "").replace(" ", "").replace(" ", "")
    if s in {"", "-", "–", "…", "...", "x", "X", "nan", "None"}:
        return None
    if "," in s and "." not in s:
        s = s.replace(",", ".")
    else:
        s = s.replace(",", "")
    try:
        return float(s)
    except ValueError:
        return None
