import { PillBadge } from './PillBadge'

export function CarTypeBadge({ type }: { type: string }) {
  const normalized = type.trim()
  return (
    <PillBadge className="bg-secondary text-secondary-foreground" title={`Car Type: ${normalized}`}>
      {normalized}
    </PillBadge>
  )
}
