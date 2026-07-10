import { memo, useMemo } from 'react'
import { CARS } from '../lib/cars'
import { compareCars, isUnobtainable, matchesFilters, matchesSearch } from '../lib/filtering'
import { effectivePrice, useStore } from '../store'
import { CarBrowserCard } from './CarBrowserCard'

export const CarBrowserDisplay = memo(function CarBrowserDisplay() {
  const filters = useStore((s) => s.filters)
  const search = useStore((s) => s.search)
  const sortField = useStore((s) => s.sortField)
  const sortDir = useStore((s) => s.sortDir)
  const viewMode = useStore((s) => s.viewMode)
  const prices = useStore((s) => s.prices)

  const cars = useMemo(() => {
    const priceOf = (id: string) => effectivePrice(id, prices) ?? 0
    // Unobtainable cars can never be acquired, so they're always hidden here.
    return CARS.filter(
      (car) =>
        !isUnobtainable(car) &&
        matchesFilters(car, filters, priceOf) &&
        matchesSearch(car, search),
    ).sort((a, b) => compareCars(a, b, sortField, sortDir, priceOf))
  }, [filters, search, sortField, sortDir, prices])

  return (
    <>
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
    </>
  )
})
