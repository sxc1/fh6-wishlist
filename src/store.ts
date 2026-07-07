import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CARS_BY_ID, COST_CEIL, COST_FLOOR, YEAR_MAX, YEAR_MIN } from './lib/cars'
import type { Filters, SortDir, SortField, ViewMode } from './lib/types'

export const DEFAULT_FILTERS: Filters = {
  classes: [],
  categories: [],
  manufacturers: [],
  countries: [],
  rarities: [],
  yearRange: [YEAR_MIN, YEAR_MAX],
  costRange: [COST_FLOOR, COST_CEIL],
}

interface WishlistState {
  // Filters
  filters: Filters
  toggleClass: (value: string) => void
  toggleCategory: (value: string) => void
  toggleManufacturer: (value: string) => void
  toggleCountry: (value: string) => void
  toggleRarity: (value: string) => void
  clearClasses: () => void
  clearCategories: () => void
  clearManufacturers: () => void
  clearCountries: () => void
  clearRarities: () => void
  setYearRange: (range: [number, number]) => void
  setCostRange: (range: [number, number]) => void
  resetFilters: () => void

  // Browser UI
  search: string
  setSearch: (value: string) => void
  sortField: SortField
  sortDir: SortDir
  setSort: (field: SortField, dir: SortDir) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  // Wishlist (strictly ordered by array position)
  wishlist: string[]
  addToWishlist: (id: string) => void
  removeFromWishlist: (id: string) => void
  setWishlistOrder: (ids: string[]) => void
  clearWishlist: () => void

  // Prices (overrides on top of CSV base price, set via CSV import)
  prices: Record<string, number>

  // Acquired tracking
  acquired: string[]
  toggleAcquired: (id: string) => void

  // Wishlist view controls
  wishlistViewMode: ViewMode
  setWishlistViewMode: (mode: ViewMode) => void
  applyFiltersToWishlist: boolean
  toggleApplyFiltersToWishlist: () => void
  hideAcquired: boolean
  toggleHideAcquired: () => void

  // App chrome
  leftPanelCollapsed: boolean
  toggleLeftPanel: () => void

  // Bulk import (from CSV)
  importWishlist: (entries: { id: string; price: number; acquired?: boolean }[]) => void
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export const useStore = create<WishlistState>()(
  persist(
    (set) => ({
      filters: DEFAULT_FILTERS,
      toggleClass: (value) =>
        set((s) => ({ filters: { ...s.filters, classes: toggleValue(s.filters.classes, value) } })),
      toggleCategory: (value) =>
        set((s) => ({
          filters: { ...s.filters, categories: toggleValue(s.filters.categories, value) },
        })),
      toggleManufacturer: (value) =>
        set((s) => ({
          filters: { ...s.filters, manufacturers: toggleValue(s.filters.manufacturers, value) },
        })),
      toggleCountry: (value) =>
        set((s) => ({
          filters: { ...s.filters, countries: toggleValue(s.filters.countries, value) },
        })),
      toggleRarity: (value) =>
        set((s) => ({
          filters: { ...s.filters, rarities: toggleValue(s.filters.rarities, value) },
        })),
      clearClasses: () => set((s) => ({ filters: { ...s.filters, classes: [] } })),
      clearCategories: () => set((s) => ({ filters: { ...s.filters, categories: [] } })),
      clearManufacturers: () => set((s) => ({ filters: { ...s.filters, manufacturers: [] } })),
      clearCountries: () => set((s) => ({ filters: { ...s.filters, countries: [] } })),
      clearRarities: () => set((s) => ({ filters: { ...s.filters, rarities: [] } })),
      setYearRange: (range) => set((s) => ({ filters: { ...s.filters, yearRange: range } })),
      setCostRange: (range) => set((s) => ({ filters: { ...s.filters, costRange: range } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      search: '',
      setSearch: (value) => set({ search: value }),
      sortField: 'make',
      sortDir: 'asc',
      setSort: (sortField, sortDir) => set({ sortField, sortDir }),
      viewMode: 'tile',
      setViewMode: (viewMode) => set({ viewMode }),

      wishlist: [],
      addToWishlist: (id) =>
        set((s) => (s.wishlist.includes(id) ? s : { wishlist: [...s.wishlist, id] })),
      removeFromWishlist: (id) =>
        set((s) => ({ wishlist: s.wishlist.filter((w) => w !== id) })),
      setWishlistOrder: (ids) => set({ wishlist: ids }),
      clearWishlist: () => set({ wishlist: [] }),

      prices: {},

      acquired: [],
      toggleAcquired: (id) =>
        set((s) => ({ acquired: toggleValue(s.acquired, id) })),

      wishlistViewMode: 'tile',
      setWishlistViewMode: (wishlistViewMode) => set({ wishlistViewMode }),

      applyFiltersToWishlist: false,
      toggleApplyFiltersToWishlist: () =>
        set((s) => ({ applyFiltersToWishlist: !s.applyFiltersToWishlist })),
      hideAcquired: false,
      toggleHideAcquired: () => set((s) => ({ hideAcquired: !s.hideAcquired })),

      leftPanelCollapsed: false,
      toggleLeftPanel: () => set((s) => ({ leftPanelCollapsed: !s.leftPanelCollapsed })),

      importWishlist: (entries) =>
        set((s) => {
          const order: string[] = []
          const prices = { ...s.prices }
          const acquired = s.acquired.filter((id) =>
            entries.some((entry) => entry.id === id && entry.acquired === undefined),
          )
          for (const entry of entries) {
            if (!order.includes(entry.id)) order.push(entry.id)
            if (Number.isFinite(entry.price)) prices[entry.id] = Math.max(0, Math.round(entry.price))
            if (entry.acquired && !acquired.includes(entry.id)) acquired.push(entry.id)
          }
          return { wishlist: order, prices, acquired }
        }),
    }),
    {
      name: 'fh6-wishlist',
      version: 7,
      // v1 -> v2 added `wishlistViewMode`. The default shallow merge fills the
      // new field from initial state, so persisted state passes through as-is
      // (existing users keep their wishlist, prices, and browser viewMode).
      // v2 -> v3 shrank the year/cost slider ceilings (2554 -> 2027, 20M -> 5M)
      // and made the top of each slider an open-ended bound. Clamp any stored
      // bound that sat above a new ceiling down to it, so the thumb stays on the
      // track and the range still admits the out-of-domain outliers.
      // v3 -> v4 renamed `obtained` -> `acquired` and `hideObtained` ->
      // `hideAcquired`. Carry the old values across so existing users keep their
      // acquired-car tracking and hide toggle.
      // v4 -> v5 added the `countries` filter. The persisted `filters` object
      // replaces the default wholesale on rehydration, so backfill `countries`
      // to an empty array or `matchesFilters` reads `.length` off undefined.
      // v5 -> v6 removed the `'rating'` sort. Remap any persisted `sortField:
      // 'rating'` to `'class'` (near-identical order) or `compareCars` hits no
      // case and returns 0, leaving the list unsorted for those users.
      // v6 -> v7 added the `rarities` filter. Backfill missing persisted values
      // to an empty array so filter code can safely read `.length`.
      migrate: (persisted) => {
        const s = persisted as WishlistState & {
          obtained?: string[]
          hideObtained?: boolean
        }
        if ((s?.sortField as string) === 'rating') s.sortField = 'class'
        if (s?.obtained && !s.acquired) {
          s.acquired = s.obtained
          delete s.obtained
        }
        if (typeof s?.hideObtained === 'boolean' && s.hideAcquired === undefined) {
          s.hideAcquired = s.hideObtained
          delete s.hideObtained
        }
        if (s?.filters) {
          const [y0, y1] = s.filters.yearRange
          const [c0, c1] = s.filters.costRange
          s.filters = {
            ...s.filters,
            countries: s.filters.countries ?? [],
            rarities: s.filters.rarities ?? [],
            yearRange: [Math.max(YEAR_MIN, y0), Math.min(YEAR_MAX, y1)],
            costRange: [Math.max(COST_FLOOR, c0), Math.min(COST_CEIL, c1)],
          }
        }
        return s
      },
    },
  ),
)

/**
 * Effective price for a car: user override if present, otherwise CSV base price.
 * Returns null when the price is unknown (no override and no dataset price).
 */
export function effectivePrice(id: string, prices: Record<string, number>): number | null {
  if (id in prices) return prices[id]
  return CARS_BY_ID.get(id)?.basePrice ?? null
}
