import { useEffect, useRef, useState } from 'react'
import * as Slider from '@radix-ui/react-slider'

/**
 * Delay (ms) before an in-progress drag commits to the store, which re-filters and
 * re-renders the whole car list. Higher = smoother dragging, but the list lags further
 * behind the thumb.
 * 
 * Set to 0 to disable debouncing entirely and commit on every drag
 * event (the pre-debounce behavior)
 */
const COMMIT_DEBOUNCE_MS = 0

interface RangeSliderProps {
  min: number
  max: number
  value: [number, number]
  step?: number
  onChange: (value: [number, number]) => void
  /** Formats a bound for display when the input isn't being edited (e.g. "20,000,000 CR"). */
  formatValue?: (value: number) => string
  /**
   * When true, the max bound is an open-ended limit: at the ceiling its display gets a
   * trailing "+" (e.g. "2027+"), signalling everything beyond `max` is included too.
   */
  openEndedMax?: boolean
  /**
   * Track scale. 'linear' (default) spaces values evenly; 'log' gives the low end of the
   * range far more of the track — useful when values span several orders of magnitude and
   * cluster near the bottom (e.g. car prices from a few thousand to tens of millions CR).
   * Only the track positioning changes: value, onChange, and the text inputs stay in real
   * value space. Assumes `min >= 0`.
   */
  scale?: 'linear' | 'log'
}

/**
 * Editable numeric bound. Shows the formatted value at rest; on focus it swaps to the
 * raw number for easy typing, and commits (clamped + step-snapped) on blur/Enter.
 */
function EditableBound({
  value,
  lo,
  hi,
  step,
  onCommit,
  formatValue,
  align,
  ariaLabel,
}: {
  value: number
  lo: number
  hi: number
  step: number
  onCommit: (n: number) => void
  formatValue: (v: number) => string
  align: 'left' | 'right'
  ariaLabel: string
}) {
  const [text, setText] = useState<string | null>(null)
  const editing = text !== null

  const commit = () => {
    if (text === null) return
    const digits = text.replace(/[^0-9]/g, '')
    let n = digits === '' ? value : Number.parseInt(digits, 10)
    if (!Number.isFinite(n)) n = value
    n = Math.round(n / step) * step
    n = Math.min(hi, Math.max(lo, n))
    onCommit(n)
    setText(null)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      value={editing ? text : formatValue(value)}
      onFocus={(e) => {
        setText(String(value))
        requestAnimationFrame(() => e.target.select())
      }}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        else if (e.key === 'Escape') {
          setText(null)
          e.currentTarget.blur()
        }
      }}
      className={`w-[46%] rounded-md border border-input bg-card px-2 py-1 text-xs tabular-nums outline-none focus:ring-2 focus:ring-ring ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    />
  )
}

export function RangeSlider({
  min,
  max,
  value,
  step = 1,
  onChange,
  formatValue = (v) => String(v),
  openEndedMax = false,
  scale = 'linear',
}: RangeSliderProps) {
  const isLog = scale === 'log'

  // In log mode the Kendo track runs over an integer "position" space [0, POS_MAX] and we
  // map to/from real values, so the low end of the range gets more of the track. `offset`
  // keeps the log finite when min is 0 and controls how aggressively the low end expands
  // (~2.7 decades across the track regardless of the absolute domain).
  const POS_MAX = 1000
  const offset = Math.max(1, (max - min) / 500)
  const logLo = Math.log(min + offset)
  const logHi = Math.log(max + offset)
  const toPos = (v: number) => {
    if (!isLog) return v
    const c = Math.min(max, Math.max(min, v))
    return ((Math.log(c + offset) - logLo) / (logHi - logLo)) * POS_MAX
  }
  const fromPos = (p: number) => {
    if (!isLog) return p
    const frac = Math.min(1, Math.max(0, p / POS_MAX))
    return Math.exp(logLo + frac * (logHi - logLo)) - offset
  }

  // Dragging fires a stream of changes; committing each to the store re-filters and
  // re-renders the whole car list, which makes the thumb stutter. So hold the in-progress
  // value locally (only this slider re-renders per move) and debounce the store commit so
  // the list updates once the drag settles. Text-input edits are discrete → commit at once.
  const [draft, setDraft] = useState<[number, number] | null>(null)
  const commitTimer = useRef<number | undefined>(undefined)
  const [lo, hi] = draft ?? value
  useEffect(() => () => window.clearTimeout(commitTimer.current), [])

  const commitNow = (next: [number, number]) => {
    window.clearTimeout(commitTimer.current)
    setDraft(null)
    onChange(next)
  }
  const commitDebounced = (next: [number, number]) => {
    // 0 → no debounce: commit straight through on every drag event (no local draft).
    if (COMMIT_DEBOUNCE_MS <= 0) {
      onChange(next)
      return
    }
    setDraft(next)
    window.clearTimeout(commitTimer.current)
    commitTimer.current = window.setTimeout(() => {
      setDraft(null)
      onChange(next)
    }, COMMIT_DEBOUNCE_MS)
  }

  // At the ceiling, the max bound reads "…+"; below it, it formats like any other value.
  const formatMax =
    openEndedMax && hi >= max ? (v: number) => `${formatValue(v)}+` : formatValue

  return (
    <div>
      <Slider.Root
        className="relative flex h-5 w-full cursor-pointer touch-none select-none items-center"
        min={isLog ? 0 : min}
        max={isLog ? POS_MAX : max}
        step={isLog ? 1 : step}
        value={[toPos(lo), toPos(hi)]}
        minStepsBetweenThumbs={0}
        onValueChange={(vals: number[]) => {
          // In log mode the track runs over integer position space, so Radix already snaps
          // to whole positions; map each back to a real value, then snap to `step` (and
          // clamp) so committed bounds stay integral in either scale.
          const snap = (raw: number) => {
            const v = fromPos(raw)
            return Math.min(max, Math.max(min, Math.round(v / step) * step))
          }
          const s = snap(vals[0])
          const en = snap(vals[1])
          commitDebounced([Math.min(s, en), Math.max(s, en)])
        }}
      >
        <Slider.Track className="relative h-1.5 w-full grow rounded-full bg-secondary">
          <Slider.Range className="absolute h-full rounded-full bg-primary" />
        </Slider.Track>
        <Slider.Thumb
          aria-label="Minimum"
          className="block h-4 w-4 rounded-full bg-primary shadow outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Slider.Thumb
          aria-label="Maximum"
          className="block h-4 w-4 rounded-full bg-primary shadow outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Slider.Root>
      <div className="mt-2 flex items-center justify-between gap-2">
        <EditableBound
          value={lo}
          lo={min}
          hi={hi}
          step={step}
          onCommit={(n) => commitNow([n, hi])}
          formatValue={formatValue}
          align="left"
          ariaLabel="Minimum"
        />
        <EditableBound
          value={hi}
          lo={lo}
          hi={max}
          step={step}
          onCommit={(n) => commitNow([lo, n])}
          formatValue={formatMax}
          align="right"
          ariaLabel="Maximum"
        />
      </div>
    </div>
  )
}
