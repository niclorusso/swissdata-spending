"""Run every ETL step in order. Each step is idempotent and re-uses cached downloads unless ETL_FORCE=1."""
from __future__ import annotations

import importlib
import sys
import time

STEPS = [
    "etl.efv_bundeshaushalt",
    "etl.efv_institutionen",
    "etl.bkb_beschaffungen",
    "etl.efv_finanzstatistik",
    "etl.efv_gemeinden",
    "etl.bfs_bevoelkerung",
    "etl.kt_gemeinden",
    "etl.geo_grenzen",
]


def main(only: list[str] | None = None) -> None:
    failed = []
    for name in STEPS:
        if only and not any(o in name for o in only):
            continue
        t = time.time()
        print(f"\n=== {name} ===")
        try:
            importlib.import_module(name).main()
            print(f"--- ok in {time.time() - t:.0f}s")
        except Exception as e:  # keep going: one broken source must not block the others
            failed.append((name, repr(e)))
            print(f"--- FAILED: {e!r}")
    if failed:
        print("\nFAILED STEPS:")
        for n, e in failed:
            print(f"  {n}: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv[1:] or None)
