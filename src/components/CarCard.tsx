import { effectivePrice, useStore } from '../store'
import type { Car, ViewMode } from '../lib/types'
import { carImageUrl } from '../lib/carImages'
import { ClassBadge, PriceDisplay } from './ui'

function useCarBindings(car: Car) {
  const inWishlist = useStore((s) => s.wishlist.includes(car.id))
  const price = useStore((s) => effectivePrice(car.id, s.prices))
  const addToWishlist = useStore((s) => s.addToWishlist)
  const removeFromWishlist = useStore((s) => s.removeFromWishlist)
  return { inWishlist, price, addToWishlist, removeFromWishlist }
}

function AddedOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-background/70">
      <span className="text-sm font-bold uppercase tracking-widest text-primary">Added</span>
    </div>
  )
}

export function CarCard({ car, viewMode }: { car: Car; viewMode: ViewMode }) {
  const { inWishlist, price, addToWishlist, removeFromWishlist } = useCarBindings(car)
  const toggle = () => (inWishlist ? removeFromWishlist(car.id) : addToWishlist(car.id))
  const title = inWishlist ? 'Click to remove from wishlist' : 'Click to add to wishlist'

  if (viewMode === 'tile') {
    const imageUrl = carImageUrl(car)
    return (
      <div
        onClick={toggle}
        title={title}
        className="relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm"
      >
        {/* Hero render on a light "studio" backdrop so cars of every color stay legible. */}
        <div className="aspect-[16/9] w-full bg-[radial-gradient(circle_at_50%_35%,#f8fafc,#cbd5e1)]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${car.make} ${car.name}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-medium text-slate-500">
              No image
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <ClassBadge carClass={car.carClass} rating={car.classRating} />
            <span className="text-xs text-muted-foreground">{car.year}</span>
          </div>
          <div className="min-h-10">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {car.make}
            </div>
            <div className="text-sm font-semibold leading-tight">{car.name}</div>
          </div>
          <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
            <span className="rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground">
              {car.type}
            </span>
            <span className="rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground">
              {car.country}
            </span>
          </div>
          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <PriceDisplay value={price} />
          </div>
        </div>
        {inWishlist ? <AddedOverlay /> : null}
      </div>
    )
  }

  return (
    <div
      onClick={toggle}
      title={title}
      className="relative flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-sm"
    >
      <ClassBadge carClass={car.carClass} rating={car.classRating} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{car.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {car.make} &middot; {car.type} &middot; {car.country}
        </div>
      </div>
      <span className="hidden w-12 shrink-0 text-right text-sm text-muted-foreground sm:block">
        {car.year}
      </span>
      <PriceDisplay value={price} className="w-24" />
      {inWishlist ? <AddedOverlay /> : null}
    </div>
  )
}
