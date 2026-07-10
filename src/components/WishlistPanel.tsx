import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  FilterX,
  LayoutGrid,
  Menu,
  Trash2,
} from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CARS_BY_ID } from '../lib/cars'
import { exportWishlistCsv, parseWishlistCsv } from '../lib/csv'
import { matchesFilters } from '../lib/filtering'
import type { Car } from '../lib/types'
import { effectivePrice, useStore } from '../store'
import { ConfirmDialog } from './ConfirmDialog'
import { WishlistRow } from './WishlistRow'

type ToggleIcon = 'filter' | 'eye'

function Toggle({
  label,
  checked,
  onChange,
  icon,
}: {
  label: string
  checked: boolean
  onChange: () => void
  icon: ToggleIcon
}) {
  const Icon = icon === 'filter' ? (checked ? Filter : FilterX) : checked ? EyeOff : Eye

  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-sm transition-colors ${
        checked
          ? 'border-primary/60 bg-primary/10 text-primary'
          : 'border-input bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
      }`}
    >
      <Icon size={14} strokeWidth={2.25} />
      <span>{label}</span>
    </button>
  )
}

export function WishlistPanel() {
  const wishlist = useStore((s) => s.wishlist)
  const prices = useStore((s) => s.prices)
  const acquired = useStore((s) => s.acquired)
  const filters = useStore((s) => s.filters)
  const viewMode = useStore((s) => s.wishlistViewMode)
  const setViewMode = useStore((s) => s.setWishlistViewMode)
  const applyFilters = useStore((s) => s.applyFiltersToWishlist)
  const hideAcquired = useStore((s) => s.hideAcquired)
  const toggleApplyFilters = useStore((s) => s.toggleApplyFiltersToWishlist)
  const toggleHideAcquired = useStore((s) => s.toggleHideAcquired)
  const setWishlistOrder = useStore((s) => s.setWishlistOrder)
  const clearWishlist = useStore((s) => s.clearWishlist)
  const importWishlist = useStore((s) => s.importWishlist)
  const expanded = useStore((s) => s.wishlistPanelExpanded)
  const toggleExpanded = useStore((s) => s.toggleWishlistPanel)
  const [showExpandedLabels, setShowExpandedLabels] = useState(expanded)

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!expanded) {
      setShowExpandedLabels(false)
      return
    }
    // Let the panel width animation create enough room before text appears.
    const timeoutId = window.setTimeout(() => setShowExpandedLabels(true), 80)
    return () => window.clearTimeout(timeoutId)
  }, [expanded])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const cars = useMemo(
    () => wishlist.map((id) => CARS_BY_ID.get(id)).filter((c): c is Car => Boolean(c)),
    [wishlist],
  )

  const scoped = useMemo(() => {
    const priceOf = (id: string) => effectivePrice(id, prices) ?? 0
    return cars.filter((car) => !applyFilters || matchesFilters(car, filters, priceOf))
  }, [cars, applyFilters, filters, prices])

  const visible = useMemo(
    () => scoped.filter((car) => !(hideAcquired && acquired.includes(car.id))),
    [scoped, hideAcquired, acquired],
  )

  const summary = useMemo(() => {
    let acquiredCount = 0
    let acquiredTotal = 0
    let unacquiredCount = 0
    let unacquiredTotal = 0
    for (const car of scoped) {
      const price = effectivePrice(car.id, prices) ?? 0
      if (acquired.includes(car.id)) {
        acquiredCount += 1
        acquiredTotal += price
      } else {
        unacquiredCount += 1
        unacquiredTotal += price
      }
    }
    return {
      acquiredCount,
      acquiredTotal,
      unacquiredCount,
      unacquiredTotal,
      totalCount: acquiredCount + unacquiredCount,
      grandTotal: acquiredTotal + unacquiredTotal,
    }
  }, [scoped, acquired, prices])

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = wishlist.indexOf(String(active.id))
    const newIndex = wishlist.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    setWishlistOrder(arrayMove(wishlist, oldIndex, newIndex))
  }

  const onExport = () =>
    exportWishlistCsv(
      wishlist,
      (id) => effectivePrice(id, prices),
      (id) => acquired.includes(id),
    )

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
      <div
        className="border-b border-border px-4 py-3"
        role="button"
        tabIndex={0}
        onClick={toggleExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleExpanded()
          }
        }}
      >
        <div className="flex cursor-pointer items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronRight size={16} strokeWidth={2.25} />
            ) : (
              <ChevronLeft size={16} strokeWidth={2.25} />
            )}
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Wishlist
            </h2>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                fileRef.current?.click()
              }}
              className="rounded-md border border-input bg-card px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
            >
              Import CSV
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onExport()
              }}
              disabled={wishlist.length === 0}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex h-8 overflow-hidden rounded-md border border-input">
            <button
              type="button"
              onClick={() => setViewMode('tile')}
              className={`inline-flex h-8 items-center justify-center gap-1.5 px-2.5 text-sm ${
                viewMode === 'tile'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-secondary'
              }`}
              title="Tiles"
              aria-label="Tiles"
            >
              <LayoutGrid size={14} strokeWidth={2.25} />
              {showExpandedLabels ? <span>Tiles</span> : null}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex h-8 items-center justify-center gap-1.5 px-2.5 text-sm ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-secondary'
              }`}
              title="List"
              aria-label="List"
            >
              <Menu size={14} strokeWidth={2.25} />
              {showExpandedLabels ? <span>List</span> : null}
            </button>
          </div>
          <Toggle
            label={showExpandedLabels ? 'Apply filters to wishlist' : 'Apply filters'}
            checked={applyFilters}
            onChange={toggleApplyFilters}
            icon="filter"
          />
          <Toggle
            label={showExpandedLabels ? 'Hide acquired' : 'Acquired'}
            checked={hideAcquired}
            onChange={toggleHideAcquired}
            icon="eye"
          />
          <div className="ml-auto">
            <ConfirmDialog
              title="Clear wishlist?"
              description={`This removes all ${wishlist.length} car${
                wishlist.length === 1 ? '' : 's'
              } from your wishlist and can't be undone.`}
              confirmLabel="Clear wishlist"
              destructive
              onConfirm={clearWishlist}
              trigger={
                <button
                  type="button"
                  disabled={wishlist.length === 0}
                  title="Clear wishlist"
                  aria-label="Clear wishlist"
                  className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-md text-sm font-semibold text-destructive hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 ${
                    showExpandedLabels ? 'px-2.5' : 'w-8'
                  }`}
                >
                  <Trash2 size={14} strokeWidth={2.25} />
                  {showExpandedLabels ? <span>Clear</span> : null}
                </button>
              }
            />
          </div>
        </div>
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

      <div className="@container min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-3">
        {wishlist.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Your wishlist is empty. Add cars from the browser to get started.
          </div>
        ) : visible.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            No wishlist cars match the current view.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            autoScroll={{ threshold: { x: 0, y: 0.2 } }}
            modifiers={[viewMode === 'tile' ? restrictToParentElement : restrictToVerticalAxis]}
          >
            <SortableContext
              items={visible.map((c) => c.id)}
              strategy={viewMode === 'tile' ? rectSortingStrategy : verticalListSortingStrategy}
            >
              <div
                className={
                  viewMode === 'tile'
                    ? 'grid grid-cols-1 gap-3 @[480px]:grid-cols-2 @[760px]:grid-cols-3'
                    : 'flex flex-col gap-2'
                }
              >
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

      <div className="flex flex-col gap-1 border-t border-border px-4 py-3 text-sm">
        <div className="flex items-baseline justify-between capitalize text-muted-foreground">
          <span>
            {summary.acquiredCount} car{summary.acquiredCount === 1 ? '' : 's'} acquired
          </span>
          <span className="tabular-nums">{summary.acquiredTotal.toLocaleString()} CR</span>
        </div>
        <div className="flex items-baseline justify-between capitalize text-muted-foreground">
          <span>
            {summary.unacquiredCount} car{summary.unacquiredCount === 1 ? '' : 's'} unacquired
          </span>
          <span className="tabular-nums">{summary.unacquiredTotal.toLocaleString()} CR</span>
        </div>
        <div className="flex items-baseline justify-between border-t border-border pt-1 font-bold uppercase">
          <span>
            {summary.totalCount} car{summary.totalCount === 1 ? '' : 's'} total
          </span>
          <span className="tabular-nums">{summary.grandTotal.toLocaleString()} CR</span>
        </div>
      </div>
    </div>
  )
}
