import { ChevronsDown, ChevronsUp, X } from 'lucide-react'
import { useMemo } from 'react'
import { missingCategoriesForWishlist } from '../lib/missingCategories'
import { useStore } from '../store'
import { SortDropdown } from './SortDropdown'
import { CarBrowserViewToggle } from './CarBrowserViewToggle'

export function CarBrowserHeader() {
  const search = useStore((s) => s.search)
  const setSearch = useStore((s) => s.setSearch)
  const sortField = useStore((s) => s.sortField)
  const sortDir = useStore((s) => s.sortDir)
  const setSort = useStore((s) => s.setSort)
  const wishlist = useStore((s) => s.wishlist)
  const setCategories = useStore((s) => s.setCategories)

  const missingCategories = useMemo(
    () => missingCategoriesForWishlist(wishlist),
    [wishlist],
  )
  const hasMissingCategories = missingCategories.length > 0

  return (
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
          {sortDir === 'asc' ? (
            <ChevronsUp size={14} strokeWidth={2.25} />
          ) : (
            <ChevronsDown size={14} strokeWidth={2.25} />
          )}
        </button>
      </div>

      <CarBrowserViewToggle />
    </div>
  )
}
