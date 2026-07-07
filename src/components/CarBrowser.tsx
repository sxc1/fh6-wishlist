import { useMemo } from 'react'
import { CARS } from '../lib/cars'
import { compareCars, isUnobtainable, matchesFilters, matchesSearch } from '../lib/filtering'
import type { SortField } from '../lib/types'
import { effectivePrice, useStore } from '../store'
import { CarCard } from './CarCard'

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'make', label: 'Manufacturer' },
  { value: 'name', label: 'Name' },
  { value: 'year', label: 'Year' },
  { value: 'class', label: 'Class' },
  { value: 'price', label: 'Price' },
]

export function CarBrowser() {
  const filters = useStore((s) => s.filters)
  const search = useStore((s) => s.search)
  const setSearch = useStore((s) => s.setSearch)
  const sortField = useStore((s) => s.sortField)
  const sortDir = useStore((s) => s.sortDir)
  const setSort = useStore((s) => s.setSort)
  const viewMode = useStore((s) => s.viewMode)
  const setViewMode = useStore((s) => s.setViewMode)
  const prices = useStore((s) => s.prices)

  const cars = useMemo(() => {
    const priceOf = (id: string) => effectivePrice(id, prices) ?? 0
    // Unobtainable cars can never be acquired, so they're always hidden here.
    return CARS.filter(
      (c) =>
        !isUnobtainable(c) &&
        matchesFilters(c, filters, priceOf) &&
        matchesSearch(c, search),
    ).sort((a, b) => compareCars(a, b, sortField, sortDir, priceOf))
  }, [filters, search, sortField, sortDir, prices])

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cars..."
          className="min-w-40 flex-1 rounded-md border border-input bg-card px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="flex items-center gap-1">
          <select
            value={sortField}
            onChange={(e) => setSort(e.target.value as SortField, sortDir)}
            className="rounded-md border border-input bg-card px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSort(sortField, sortDir === 'asc' ? 'desc' : 'asc')}
            className="rounded-md border border-input bg-card px-2 py-1.5 text-sm hover:bg-secondary"
            title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="flex overflow-hidden rounded-md border border-input">
          <button
            type="button"
            onClick={() => setViewMode('tile')}
            className={`px-3 py-1.5 text-sm ${
              viewMode === 'tile' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary'
            }`}
          >
            Tiles
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-sm ${
              viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary'
            }`}
          >
            List
          </button>
        </div>
      </div>

      <div className="px-4 py-2 text-xs text-muted-foreground">
        {cars.length.toLocaleString()} car{cars.length === 1 ? '' : 's'}
      </div>

      <div className="@container min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {cars.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No cars match the current filters.
          </div>
        ) : viewMode === 'tile' ? (
          // Column count keys off this scroll column's own width (container query),
          // not the viewport, since fixed side panels change how much room is here.
          // Intentionally capped lower so tiles stay readable and less condensed.
          <div className="grid grid-cols-1 gap-5 @[560px]:grid-cols-2 @[920px]:grid-cols-3 @[1320px]:grid-cols-4">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} viewMode="tile" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} viewMode="list" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
