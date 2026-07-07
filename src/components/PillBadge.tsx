import type { ReactNode } from 'react'

const PILL_BASE_CLASS =
  'inline-flex items-center rounded px-1.5 py-1 text-xs font-medium leading-none'

export function PillBadge({
  children,
  className = '',
  title,
}: {
  children: ReactNode
  className?: string
  title?: string
}) {
  return (
    <span className={`${PILL_BASE_CLASS} ${className}`.trim()} title={title}>
      {children}
    </span>
  )
}
