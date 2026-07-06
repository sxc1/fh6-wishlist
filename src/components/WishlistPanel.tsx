import { useMemo, useRef } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CARS_BY_ID } from '../lib/cars'
import { exportWishlistCsv, parseWishlistCsv } from '../lib/csv'
import { matchesFilters } from '../lib/filtering'
import type { Car } from '../lib/types'
import { effectivePrice, useStore } from '../store'
import { WishlistRow } from './WishlistRow'

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 text-sm">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-border'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-card transition-transform ${
            checked ? 'left-0.5 translate-x-4' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  )
}

export function WishlistPanel() {
  const wishlist = useStore((s) => s.wishlist)
  const prices = useStore((s) => s.prices)
  const obtained = useStore((s) => s.obtained)
  const filters = useStore((s) => s.filters)
  const viewMode = useStore((s) => s.wishlistViewMode)
  const setViewMode = useStore((s) => s.setWishlistViewMode)
  const applyFilters = useStore((s) => s.applyFiltersToWishlist)
  const hideObtained = useStore((s) => s.hideObtained)
  const toggleApplyFilters = useStore((s) => s.toggleApplyFiltersToWishlist)
  const toggleHideObtained = useStore((s) => s.toggleHideObtained)
  const setWishlistOrder = useStore((s) => s.setWishlistOrder)
  const clearWishlist = useStore((s) => s.clearWishlist)
  const importWishlist = useStore((s) => s.importWishlist)

  const fileRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const cars = useMemo(
    () => wishlist.map((id) => CARS_BY_ID.get(id)).filter((c): c is Car => Boolean(c)),
    [wishlist],
  )

  const visible = useMemo(() => {
    const priceOf = (id: string) => effectivePrice(id, prices) ?? 0
    return cars.filter((car) => {
      if (hideObtained && obtained.includes(car.id)) return false
      if (applyFilters && !matchesFilters(car, filters, priceOf)) return false
      return true
    })
  }, [cars, hideObtained, obtained, applyFilters, filters, prices])

  const total = useMemo(
    () => visible.reduce((sum, car) => sum + (effectivePrice(car.id, prices) ?? 0), 0),
    [visible, prices],
  )

  const obtainedCount = wishlist.filter((id) => obtained.includes(id)).length

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = wishlist.indexOf(String(active.id))
    const newIndex = wishlist.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    setWishlistOrder(arrayMove(wishlist, oldIndex, newIndex))
  }

  const onExport = () => exportWishlistCsv(wishlist, (id) => effectivePrice(id, prices))

  const onImportFile = async (file: File) => {
    const text = await file.text()
    const result = parseWishlistCsv(text)
    importWishlist(result.entries)
    if (result.unmatched.length) {
      alert(
        `Imported ${result.matched} car(s).\n${result.unmatched.length} row(s) did not match the dataset and were skipped.`,
      )
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Wishlist
          </h2>
          <span className="text-xs text-muted-foreground">
            {wishlist.length} car{wishlist.length === 1 ? '' : 's'}
            {obtainedCount ? ` · ${obtainedCount} obtained` : ''}
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">
            {applyFilters || hideObtained ? 'Shown total' : 'Total'}
          </span>
          <span className="text-lg font-bold tabular-nums">{total.toLocaleString()} CR</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span>View</span>
          <div className="flex overflow-hidden rounded-md border border-input">
            <button
              type="button"
              onClick={() => setViewMode('tile')}
              className={`px-3 py-1 text-sm ${
                viewMode === 'tile'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-secondary'
              }`}
            >
              Tiles
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-secondary'
              }`}
            >
              List
            </button>
          </div>
        </div>
        <Toggle
          label="Apply filters to wishlist"
          checked={applyFilters}
          onChange={toggleApplyFilters}
        />
        <Toggle label="Hide obtained" checked={hideObtained} onChange={toggleHideObtained} />
        <div className="mt-1 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExport}
            disabled={wishlist.length === 0}
            className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-md border border-input bg-card px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
          >
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => {
              if (wishlist.length && confirm('Clear the entire wishlist?')) clearWishlist()
            }}
            disabled={wishlist.length === 0}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onImportFile(file)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {wishlist.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Your wishlist is empty. Add cars from the browser to get started.
          </div>
        ) : visible.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            No wishlist cars match the current view.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={visible.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {visible.map((car) => (
                  <WishlistRow
                    key={car.id}
                    car={car}
                    index={wishlist.indexOf(car.id)}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
