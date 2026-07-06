import { useEffect, useState } from 'react'

const CLASS_STYLES: Record<string, string> = {
  D: 'bg-neutral-500 text-white',
  C: 'bg-[#007d79] text-white',
  B: 'bg-[#4ab2ff] text-white',
  A: 'bg-[#3d84f8] text-white',
  S1: 'bg-[#8a3ffc] text-white',
  S2: 'bg-[#fc7aa4] text-white',
  R: 'bg-[#ed4142] text-white',
  X: 'bg-primary-alt text-primary-foreground',
}

export function ClassBadge({ carClass, rating }: { carClass: string; rating?: number }) {
  const style = CLASS_STYLES[carClass] ?? 'bg-muted text-muted-foreground'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold ${style}`}
      title={rating ? `Class ${carClass} - ${rating} rating` : `Class ${carClass}`}
    >
      {carClass}
      {rating != null ? <span className="font-medium opacity-90">{rating}</span> : null}
    </span>
  )
}

export function PriceInput({
  value,
  onCommit,
  className = '',
}: {
  value: number
  onCommit: (value: number) => void
  className?: string
}) {
  const [text, setText] = useState(String(value))

  useEffect(() => {
    setText(String(value))
  }, [value])

  const commit = () => {
    const parsed = Number.parseInt(text.replace(/[^0-9]/g, ''), 10)
    onCommit(Number.isFinite(parsed) ? parsed : 0)
  }

  return (
    <div className={`inline-flex items-center rounded-md border border-input bg-card ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-20 bg-transparent px-2 py-1 text-right text-sm tabular-nums outline-none"
        aria-label="Price"
      />
      <span className="pr-2 text-xs text-muted-foreground">CR</span>
    </div>
  )
}
