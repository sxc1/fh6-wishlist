import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { carImageUrl } from '../lib/carImages'
import type { Car, ViewMode } from '../lib/types'
import { effectivePrice, useStore } from '../store'
import { ClassBadge, PriceDisplay } from './ui'

export function WishlistRow({
  car,
  index,
  viewMode,
}: {
  car: Car
  index: number
  viewMode: ViewMode
}) {
  const price = useStore((s) => effectivePrice(car.id, s.prices))
  const acquired = useStore((s) => s.acquired.includes(car.id))
  const toggleAcquired = useStore((s) => s.toggleAcquired)
  const removeFromWishlist = useStore((s) => s.removeFromWishlist)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: car.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const remove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeFromWishlist(car.id)
  }

  const dragProps = {
    ref: setNodeRef,
    style,
    onClick: () => toggleAcquired(car.id),
    title: 'Click to toggle acquired; drag to reorder',
    ...attributes,
    ...listeners,
  }

  const acquiredOverlay = acquired ? (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-background/70">
      <span className="text-sm font-bold uppercase tracking-widest text-primary">Acquired</span>
    </div>
  ) : null

  if (viewMode === 'list') {
    return (
      <div
        {...dragProps}
        className="relative flex cursor-grab touch-none items-center gap-2 rounded-lg border border-border bg-card px-2 py-2 shadow-sm active:cursor-grabbing"
      >
        <span className="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground tabular-nums">
          {index + 1}
        </span>

        <ClassBadge carClass={car.carClass} />

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{car.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {car.make} &middot; {car.type}
          </div>
        </div>

        <PriceDisplay value={price} />

        <button
          type="button"
          onClick={remove}
          className="shrink-0 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
          title="Remove from wishlist"
        >
          &times;
        </button>

        {acquiredOverlay}
      </div>
    )
  }

  const imageUrl = carImageUrl(car)
  return (
    <div
      {...dragProps}
      className="relative flex cursor-grab touch-none flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm active:cursor-grabbing"
    >
      {/* Hero render on a light "studio" backdrop so cars of every color stay legible. */}
      <div className="relative aspect-[16/9] w-full bg-[radial-gradient(circle_at_50%_35%,#f8fafc,#cbd5e1)]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${car.make} ${car.name}`}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-medium text-slate-500">
            No image
          </div>
        )}
        <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-background/80 px-1.5 text-xs font-bold tabular-nums text-foreground shadow-sm">
          {index + 1}
        </span>
        <button
          type="button"
          onClick={remove}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-sm text-muted-foreground shadow-sm hover:bg-destructive hover:text-destructive-foreground"
          title="Remove from wishlist"
        >
          &times;
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <ClassBadge carClass={car.carClass} rating={car.classRating} />
          <span className="text-xs text-muted-foreground">{car.year}</span>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {car.make}
          </div>
          <div className="text-sm font-semibold leading-tight">{car.name}</div>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
            <span className="rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground">
              {car.type}
            </span>
            <span className="rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground">
              {car.country}
            </span>
          </div>
          <PriceDisplay value={price} />
        </div>
      </div>

      {acquiredOverlay}
    </div>
  )
}
