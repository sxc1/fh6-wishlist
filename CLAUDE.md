# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page wishlist tool for Forza Horizon 6 cars, published to GitHub Pages at `https://sxc1.github.io/fh6/`. Users filter/browse the car list and build a strictly-ordered wishlist with per-car price overrides, obtained tracking, and CSV export/import. All state lives in the browser's `localStorage` — there is no backend.

## Commands

- `npm run dev` — Vite dev server.
- `npm run build` — `tsc -b && vite build`. This is also the typecheck: there is **no separate lint step and no test framework**, so a green build is the only automated gate. TS is strict with `noUnusedLocals`/`noUnusedParameters`, so unused imports/vars fail the build.
- `npm run preview` — serve the built `dist/`.
- `postinstall` runs `git submodule update --init --recursive` — needed because the design submodule is a build dependency (see below).

## Architecture

### Car data is a build-time static CSV, not a runtime fetch
`data/fh6-cars.csv` is imported directly into the bundle via Vite's `?raw` loader in `src/lib/cars.ts`, parsed once at module load with PapaParse into `CARS`, `CARS_BY_ID`, and derived constants (`MAKES`, `CAR_TYPES`, `CLASSES`, `YEAR_MIN/MAX`, and the `COST_*` slider domain). Everything downstream keys cars by a synthesized `id = ${make}__${name}` (`makeCarId`). To change the dataset, edit the CSV — no code change needed.

Note: the CSV carries per-car performance stats (`Speed, Handling, Acceleration, Launch, Braking, Offroad`) that the `Car` type in `src/lib/types.ts` does **not** currently parse or surface. Add fields there and in `cars.ts`'s row mapping if you want to use them.

### `scripts/*.py` are offline data-prep tools, not part of the app
They build and enrich `data/fh6-cars.csv` from a source markdown table plus scraped Forza wiki wikitext (`md_table_to_csv.py` → `add_stats_from_wiki.py` → `fix_manual_matches.py`, with `verify_matches.py` as a sanity check). They run manually when regenerating the dataset and never execute at app runtime or build time.

### State: one Zustand store, persisted to localStorage
`src/store.ts` holds all app state via `zustand` + `persist` (localStorage key `fh6-wishlist`, `version: 1`). Key modeling decisions:
- **Wishlist is a strictly-ordered `string[]` of car ids** — array position *is* the priority order (drag-and-drop via @dnd-kit rewrites it).
- **Prices are sparse overrides.** `prices: Record<id, number>` layers on top of each car's CSV `basePrice`; always resolve through `effectivePrice(id, prices)`, never read `basePrice` directly for display.
- If you add or reshape persisted fields, **bump the `version`** and add a migration, or existing users' stored state will break.

### Three-panel layout
`App.tsx` composes `FilterPanel` (left, collapsible) · `CarBrowser` (center) · `WishlistPanel` (right). Dark mode is forced (`documentElement.classList.add('dark')`). Pure filtering/sorting logic lives in `src/lib/filtering.ts` (`matchesFilters`, `matchesSearch`, `compareCars`) and takes a `priceOf` callback so it composes with the price overrides. Class ordering (D→X) is centralized in `CLASS_ORDER`/`classRank` in `types.ts` — use it for any class-aware sorting rather than string compare.

### CSV export/import round-trips through the wishlist
`src/lib/csv.ts` exports the wishlist (in order) and re-imports it by matching `make + Car Name` back to `CARS_BY_ID`. Import order becomes wishlist order; unmatched rows are collected and reported. The export column set is intentionally a subset — keep export and import headers in sync if you change them.

## Design tokens come from a git submodule (build will fail without it)
`src/index.css` imports `../design/sxc1-design-tokens.css` from the `design/` git submodule (`github.com/sxc1/design`). CSS variables like `--background`, `--foreground`, `--border`, `--card` come from there; `--primary` (`#e83382`) is overridden locally. A fresh clone must init submodules or the Vite build fails to resolve the import (CI checks out with `submodules: recursive`).

## Deployment
GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on every push to `main`. Because the app is served from a subpath, `vite.config.ts` sets `base: '/fh6/'` — changing the repo/publish path means changing this or asset URLs break.
