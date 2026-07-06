import Papa from 'papaparse'
import { CARS_BY_ID, makeCarId } from './cars'

const HEADERS = [
  'Acquired',
  'Make',
  'Car Name',
  'Price',
  'Car Type',
  'Car Class',
  'Class Rating',
  'Country',
  'Collection',
] as const

export function exportWishlistCsv(
  order: string[],
  priceOf: (id: string) => number | null,
  isAcquired: (id: string) => boolean,
): void {
  const data = order.flatMap((id) => {
    const car = CARS_BY_ID.get(id)
    if (!car) return []
    const price = priceOf(id)
    return [
      [
        isAcquired(id) ? '1' : '0',
        car.make,
        car.name,
        price == null ? '' : String(price),
        car.type,
        car.carClass,
        String(car.classRating),
        car.country,
        car.collection.join(', '),
      ],
    ]
  })

  const csv = Papa.unparse({ fields: [...HEADERS], data })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const stamp = new Date().toISOString().slice(0, 10)
  link.download = `fh6-wishlist-${stamp}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export interface ImportedEntry {
  id: string
  price: number
}

export interface ImportResult {
  entries: ImportedEntry[]
  matched: number
  unmatched: string[]
}

export function parseWishlistCsv(text: string): ImportResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })

  const entries: ImportedEntry[] = []
  const unmatched: string[] = []

  for (const row of parsed.data) {
    const make = (row['Make'] ?? '').trim()
    const name = (row['Car Name'] ?? '').trim()
    if (!make || !name) continue

    const id = makeCarId(make, name)
    if (!CARS_BY_ID.has(id)) {
      unmatched.push(`${make} ${name}`)
      continue
    }

    const priceRaw = (row['Price'] ?? '').replace(/[^0-9.-]/g, '')
    const price = Number.parseFloat(priceRaw)
    entries.push({ id, price: Number.isFinite(price) ? price : NaN })
  }

  return { entries, matched: entries.length, unmatched }
}
