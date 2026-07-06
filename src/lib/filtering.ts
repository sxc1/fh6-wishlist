import { COST_CEIL, YEAR_MAX } from './cars'
import { classRank, type Car, type Filters, type SortDir, type SortField } from './types'

export function matchesFilters(
  car: Car,
  filters: Filters,
  priceOf: (id: string) => number,
): boolean {
  if (filters.classes.length && !filters.classes.includes(car.carClass)) return false
  if (filters.categories.length && !filters.categories.includes(car.type)) return false
  if (filters.manufacturers.length && !filters.manufacturers.includes(car.make)) return false
  if (filters.countries.length && !filters.countries.includes(car.country)) return false
  // The top of each slider is an open-ended bound: at the ceiling we drop the upper
  // limit so out-of-domain outliers (the 2554 car, 5M+ prices) still show through.
  const yearMax = filters.yearRange[1] >= YEAR_MAX ? Infinity : filters.yearRange[1]
  if (car.year < filters.yearRange[0] || car.year > yearMax) return false
  const price = priceOf(car.id)
  const costMax = filters.costRange[1] >= COST_CEIL ? Infinity : filters.costRange[1]
  if (price < filters.costRange[0] || price > costMax) return false
  return true
}

/**
 * Cars flagged `Unobtainable` in the CSV `Collection` column can no longer be
 * acquired in-game, so the browser can optionally hide them (see `hideUnobtainable`).
 */
export function isUnobtainable(car: Car): boolean {
  return car.collection.includes('Unobtainable')
}

export function matchesSearch(car: Car, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    car.name.toLowerCase().includes(q) ||
    car.make.toLowerCase().includes(q) ||
    car.type.toLowerCase().includes(q) ||
    car.country.toLowerCase().includes(q)
  )
}

export function compareCars(
  a: Car,
  b: Car,
  field: SortField,
  dir: SortDir,
  priceOf: (id: string) => number,
): number {
  let result = 0
  switch (field) {
    case 'name':
      result = a.name.localeCompare(b.name)
      break
    case 'make':
      result = a.make.localeCompare(b.make) || a.name.localeCompare(b.name)
      break
    case 'year':
      result = a.year - b.year
      break
    case 'class':
      result = classRank(a.carClass) - classRank(b.carClass) || a.classRating - b.classRating
      break
    case 'price':
      result = priceOf(a.id) - priceOf(b.id)
      break
  }
  return dir === 'asc' ? result : -result
}
