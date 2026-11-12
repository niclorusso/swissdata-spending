.PHONY: etl etl-force web dev build check

## Run every ETL step (downloads are cached in data/raw; use etl-force to re-download)
etl:
	cd pipeline && uv run python -m etl.run_all

## Re-download every source and rebuild the snapshots
etl-force:
	cd pipeline && ETL_FORCE=1 uv run python -m etl.run_all

## Install web deps
web:
	cd web && pnpm install

## Local dev server
dev:
	cd web && pnpm dev

## Static build into web/out
build:
	cd web && pnpm build

## Type-check + lint
check:
	cd web && pnpm lint && npx tsc --noEmit
