import Papa from 'papaparse'
import csvRaw from '../../data/fh6-cars.csv?raw'
import { type Car } from './types'

interface RawRow {
  Make: string
  'Car Name': string
  'Model Name': string
  Year: string
  'Car Type': string
  'Car Class': string
  'Class Rating': string
  Rarity: string
  Country: string
  Collection: string
  'Add-Ons': string
  Price: string
}

export function makeCarId(make: string, name: string): string {
  return `${make}__${name}`
}

function deriveModelName(make: string, name: string, year: number): string {
  const prefix = `${year} ${make} `
  return name.startsWith(prefix) ? name.slice(prefix.length).trim() : name
}

function parseCars(): Car[] {
  const parsed = Papa.parse<RawRow>(csvRaw, {
    header: true,
    skipEmptyLines: true,
  })

  const seen = new Set<string>()
  const cars: Car[] = []

  for (const row of parsed.data) {
    const make = (row.Make ?? '').trim()
    const name = (row['Car Name'] ?? '').trim()
    if (!make || !name) continue

    let id = makeCarId(make, name)
    // Guard against any duplicate name collisions so ids stay unique.
    if (seen.has(id)) {
      let n = 2
      while (seen.has(`${id}#${n}`)) n++
      id = `${id}#${n}`
    }
    seen.add(id)

    const collection = (row.Collection ?? '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    // Empty/non-numeric price → null ("unknown"), so display can distinguish it
    // from a genuine 0 CR. Downstream math coalesces null to 0.
    const parsedPrice = Number.parseInt(row.Price, 10)
    const basePrice = Number.isFinite(parsedPrice) ? parsedPrice : null

    cars.push({
      id,
      make,
      name,
      modelName:
        (row['Model Name'] ?? '').trim() || deriveModelName(make, name, Number.parseInt(row.Year, 10) || 0),
      year: Number.parseInt(row.Year, 10) || 0,
      type: (row['Car Type'] ?? '').trim(),
      carClass: (row['Car Class'] ?? '').trim(),
      classRating: Number.parseInt(row['Class Rating'], 10) || 0,
      rarity: (row.Rarity ?? '').trim(),
      country: (row.Country ?? '').trim(),
      collection,
      addOns: (row['Add-Ons'] ?? '').trim(),
      basePrice,
    })
  }

  return cars
}

export const CARS: Car[] = parseCars()

export const CARS_BY_ID: Map<string, Car> = new Map(CARS.map((c) => [c.id, c]))

/** Sorted distinct manufacturers. */
export const MAKES: string[] = [...new Set(CARS.map((c) => c.make))].sort((a, b) =>
  a.localeCompare(b),
)

/** Sorted distinct car types (used as the "Category" filter). */
export const CAR_TYPES: string[] = [...new Set(CARS.map((c) => c.type))].sort((a, b) =>
  a.localeCompare(b),
)

/** Sorted distinct countries of origin (empty values dropped). */
export const COUNTRIES: string[] = [...new Set(CARS.map((c) => c.country).filter(Boolean))].sort(
  (a, b) => a.localeCompare(b),
)

const RARITY_ORDER = [
  'Common',
  'Rare',
  'Epic',
  'Legendary',
  'Barn Find',
  'Treasure Car',
  'Forza Edition',
] as const

/** Distinct rarities in fixed UI order (unknown values appended alphabetically). */
export const RARITIES: string[] = (() => {
  const unique = [...new Set(CARS.map((c) => c.rarity).filter(Boolean))]
  const rank = new Map<string, number>(RARITY_ORDER.map((rarity, i) => [rarity, i]))
  return unique.sort((a, b) => {
    const aRank = rank.get(a)
    const bRank = rank.get(b)
    if (aRank !== undefined && bRank !== undefined) return aRank - bRank
    if (aRank !== undefined) return -1
    if (bRank !== undefined) return 1
    return a.localeCompare(b)
  })
})()

/**
 * Manufacturer → set of countries its cars originate from. Currently every make maps to
 * exactly one country, but this is modeled as a set so a future dataset where a make
 * spans multiple countries still works. Used to filter the manufacturer picker by the
 * selected countries.
 */
const MAKE_COUNTRIES: Map<string, Set<string>> = (() => {
  const m = new Map<string, Set<string>>()
  for (const car of CARS) {
    if (!car.country) continue
    const set = m.get(car.make) ?? new Set<string>()
    set.add(car.country)
    m.set(car.make, set)
  }
  return m
})()

/** Whether a manufacturer has cars from at least one of the given countries. */
function makeInCountries(make: string, countries: string[]): boolean {
  const set = MAKE_COUNTRIES.get(make)
  if (!set) return false
  return countries.some((c) => set.has(c))
}

/** Manufacturers to show given the selected countries (all makes when none selected). */
export function makesForCountries(countries: string[]): string[] {
  return countries.length ? MAKES.filter((m) => makeInCountries(m, countries)) : MAKES
}

/**
 * Class filter options, hardcoded (fastest→slowest) so the UI always offers the
 * full set regardless of what's currently present in the CSV.
 */
export const CLASSES: string[] = ['X', 'R', 'S2', 'S1', 'A', 'B', 'C', 'D']

export const YEAR_MIN = Math.min(...CARS.map((c) => c.year))
/**
 * Slider ceiling for the year filter, displayed as "2027+". The dataset has a lone
 * futuristic outlier (a 2554 concept car); rather than stretch the slider across a
 * ~500-year empty gap, we cap the domain here and treat the top of the slider as an
 * open-ended bound that still includes anything beyond it (see `matchesFilters`).
 */
export const YEAR_MAX = 2027

/**
 * Cost-range slider domain, with the ceiling displayed as "5,000,000+". A handful of
 * cars cost far more (up to 70M); like the year slider, the top is an open-ended bound
 * that still includes them (see `matchesFilters`). Base prices start low but users edit
 * prices upward, so the floor stays at 0 rather than the data min.
 */
export const COST_FLOOR = 0
export const COST_CEIL = 5_000_000
export const COST_STEP = 1_000
