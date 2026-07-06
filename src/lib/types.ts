export interface Car {
  id: string
  make: string
  name: string
  year: number
  type: string
  carClass: string
  classRating: number
  country: string
  collection: string[]
  addOns: string
  /** CSV base price, or null when the dataset has no price for this car. */
  basePrice: number | null
}

export type ViewMode = 'list' | 'tile'

export type SortField = 'name' | 'year' | 'make' | 'class' | 'price'
export type SortDir = 'asc' | 'desc'

export interface Filters {
  classes: string[]
  categories: string[]
  manufacturers: string[]
  countries: string[]
  yearRange: [number, number]
  costRange: [number, number]
}

/**
 * Performance/handling class order used for sorting and range logic.
 * D (slowest) through R/X (fastest).
 */
export const CLASS_ORDER = ['D', 'C', 'B', 'A', 'S1', 'S2', 'R', 'X'] as const

export function classRank(carClass: string): number {
  const idx = (CLASS_ORDER as readonly string[]).indexOf(carClass)
  return idx === -1 ? CLASS_ORDER.length : idx
}
