import { useMemo } from 'react'
import { ChevronsDown, ChevronsUp, LayoutGrid, Menu, X } from 'lucide-react'
import { CARS } from '../lib/cars'
import { compareCars, isUnobtainable, matchesFilters, matchesSearch } from '../lib/filtering'
import { missingCategoriesForWishlist } from '../lib/missingCategories'
import { effectivePrice, useStore } from '../store'
import { CarBrowserCard } from './CarBrowserCard'
import { SortDropdown } from './SortDropdown'

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
  const wishlist = useStore((s) => s.wishlist)
  const setCategories = useStore((s) => s.setCategories)
  const wishlistPanelExpanded = useStore((s) => s.wishlistPanelExpanded)

  const missingCategories = useMemo(
    () => missingCategoriesForWishlist(wishlist),
    [wishlist],
  )
  const hasMissingCategories = missingCategories.length > 0

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
        <div className="relative min-w-40 flex-1">
          <div className="min-h-[2.25rem] overflow-hidden rounded-md border border-input bg-card focus-within:ring-2 focus-within:ring-ring">
            <input
              type="text"
              role="searchbox"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cars..."
              className="w-full bg-transparent py-1.5 pl-3 pr-10 text-sm outline-none"
            />
          </div>
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setCategories(missingCategories)}
          disabled={!hasMissingCategories}
          className="rounded-md border border-input bg-card px-3 py-1.5 text-sm font-semibold text-primary hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {hasMissingCategories ? 'Filter by missing categories' : 'All categories wishlisted'}
        </button>

        <div className="flex items-center gap-1">
          <SortDropdown
            value={sortField}
            onChange={(nextSort) => setSort(nextSort, sortDir)}
          />
          <button
            type="button"
            onClick={() => setSort(sortField, sortDir === 'asc' ? 'desc' : 'asc')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-card text-sm hover:bg-secondary"
            title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
            aria-label={sortDir === 'asc' ? 'Sort ascending' : 'Sort descending'}
          >
            {sortDir === 'asc' ? <ChevronsUp size={14} strokeWidth={2.25} /> : <ChevronsDown size={14} strokeWidth={2.25} />}
          </button>
        </div>

        <div className="flex overflow-hidden rounded-md border border-input">
          <button
            type="button"
            onClick={() => setViewMode('tile')}
            className={`inline-flex h-8 items-center justify-center gap-1.5 px-2.5 text-sm ${
              viewMode === 'tile' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary'
            }`}
            title="Tiles"
            aria-label="Tiles"
          >
            <LayoutGrid size={14} strokeWidth={2.25} />
            {!wishlistPanelExpanded ? <span>Tiles</span> : null}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex h-8 items-center justify-center gap-1.5 px-2.5 text-sm ${
              viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary'
            }`}
            title="List"
            aria-label="List"
          >
            <Menu size={14} strokeWidth={2.25} />
            {!wishlistPanelExpanded ? <span>List</span> : null}
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
              <CarBrowserCard key={car.id} car={car} viewMode="tile" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {cars.map((car) => (
              <CarBrowserCard key={car.id} car={car} viewMode="list" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
