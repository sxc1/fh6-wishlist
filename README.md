# fh6-wishlist

A wishlisting tool for Forza Horizon 6 cars that allows you to filter on many categories, to make sure you always have a car available for a race (and also identify which cars to prioiritize tuning), published at `https://sxc1.github.io/fh6/`.

Single-page app built with Vite + React + TypeScript and styled with Tailwind CSS v4.
It loads the FH6 car list and lets you filter, browse, and build a strictly-ordered
wishlist with per-car prices, obtained tracking, and CSV export/import. All state is
saved to your browser's `localStorage`.

## Features

- Collapsible left filter panel: Class, Category (car type), Manufacturer, Year range, Cost range.
- Central browser: text search, sorting (manufacturer, name, year, class, rating, price), and list/tile views.
- Right wishlist: drag-and-drop ordering, "apply filters to wishlist" toggle, mark cars as obtained, hide obtained, inline price editing, and a running total.
- Export the wishlist to CSV and re-import it later.

## Export / import format

Export produces a CSV of the wishlist, in wishlist order, with the columns:
`Make, Car Name, Price, Car Type, Car Class, Class Rating, Country, Collection`.
Import reads that CSV, matches rows back to the dataset by make + car name, and rebuilds the
ordered wishlist (row order = wishlist order) along with the imported prices.

## Tech

- Vite, React 19, TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`), themed via `src/index.css`
- Zustand (state + `localStorage` persistence)
- @dnd-kit (drag-and-drop reordering)
- PapaParse (CSV parsing / generation)

## Disclaimer

This is an unofficial fan-made companion tool and is not affiliated with, endorsed by, sponsored by, or approved by Microsoft, Xbox Game Studios, Playground Games, Turn 10 Studios, or the Forza franchise. Forza Horizon and related names, logos, and vehicle content are trademarks or copyrighted material of their respective owners.