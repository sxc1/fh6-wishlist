import { type ReactNode } from 'react'
import {
  CAR_TYPES,
  CLASSES,
  COST_CEIL,
  COST_FLOOR,
  COST_STEP,
  MAKES,
  YEAR_MAX,
  YEAR_MIN,
} from '../lib/cars'
import { useStore } from '../store'
import { MultiSelect } from './MultiSelect'
import { RangeSlider } from './RangeSlider'

function Section({
  title,
  count,
  onClear,
  children,
}: {
  title: string
  count?: number
  onClear?: () => void
  children: ReactNode
}) {
  return (
    <div className="border-b border-border py-3">
      <div className="flex w-full items-center justify-between text-left text-sm font-semibold">
        <span className="flex items-center gap-2">
          {title}
          {count ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {count}
            </span>
          ) : null}
        </span>
        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-secondary"
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

export function FilterPanel() {
  const filters = useStore((s) => s.filters)
  const toggleClass = useStore((s) => s.toggleClass)
  const toggleCategory = useStore((s) => s.toggleCategory)
  const toggleManufacturer = useStore((s) => s.toggleManufacturer)
  const clearClasses = useStore((s) => s.clearClasses)
  const clearCategories = useStore((s) => s.clearCategories)
  const clearManufacturers = useStore((s) => s.clearManufacturers)
  const setYearRange = useStore((s) => s.setYearRange)
  const setCostRange = useStore((s) => s.setCostRange)
  const resetFilters = useStore((s) => s.resetFilters)

  const yearFiltered = filters.yearRange[0] !== YEAR_MIN || filters.yearRange[1] !== YEAR_MAX
  const costFiltered = filters.costRange[0] !== COST_FLOOR || filters.costRange[1] !== COST_CEIL

  const activeCount =
    filters.classes.length +
    filters.categories.length +
    filters.manufacturers.length +
    (yearFiltered ? 1 : 0) +
    (costFiltered ? 1 : 0)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Filters</h2>
        <button
          type="button"
          onClick={resetFilters}
          disabled={activeCount === 0}
          className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear all
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <Section
          title="Class"
          count={filters.classes.length}
          onClear={filters.classes.length ? clearClasses : undefined}
        >
          <div className="flex flex-wrap gap-2">
            {CLASSES.map((c) => {
              const active = filters.classes.includes(c)
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleClass(c)}
                  className={`rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:bg-secondary'
                  }`}
                >
                  {c}
                </button>
              )
            })}
          </div>
        </Section>

        <Section
          title="Category"
          count={filters.categories.length}
          onClear={filters.categories.length ? clearCategories : undefined}
        >
          <MultiSelect
            options={CAR_TYPES}
            selected={filters.categories}
            onToggle={toggleCategory}
            placeholder="All categories"
            searchPlaceholder="Search categories..."
          />
        </Section>

        <Section
          title="Manufacturer"
          count={filters.manufacturers.length}
          onClear={filters.manufacturers.length ? clearManufacturers : undefined}
        >
          <MultiSelect
            options={MAKES}
            selected={filters.manufacturers}
            onToggle={toggleManufacturer}
            placeholder="All manufacturers"
            searchPlaceholder="Search manufacturers..."
          />
        </Section>

        <Section
          title="Year range"
          onClear={yearFiltered ? () => setYearRange([YEAR_MIN, YEAR_MAX]) : undefined}
        >
          <RangeSlider
            min={YEAR_MIN}
            max={YEAR_MAX}
            value={filters.yearRange}
            onChange={setYearRange}
            openEndedMax
          />
        </Section>

        <Section
          title="Price range"
          onClear={costFiltered ? () => setCostRange([COST_FLOOR, COST_CEIL]) : undefined}
        >
          <RangeSlider
            min={COST_FLOOR}
            max={COST_CEIL}
            step={COST_STEP}
            value={filters.costRange}
            onChange={setCostRange}
            formatValue={(v) => v.toLocaleString()}
            openEndedMax
            scale="log"
          />
        </Section>
      </div>
    </div>
  )
}
