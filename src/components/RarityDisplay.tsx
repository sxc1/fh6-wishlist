import { PillBadge } from './PillBadge'

const RARITY_STYLES: Record<string, string> = {
  Common: 'bg-slate-700 text-slate-100',
  Rare: 'bg-blue-700 text-blue-100',
  Epic: 'bg-purple-700 text-purple-100',
  Legendary: 'bg-amber-500 text-amber-950',
  'Treasure Car': 'bg-emerald-600 text-emerald-100',
  Unknown: 'bg-muted text-muted-foreground',
}

export function RarityDisplay({ rarity }: { rarity: string }) {
  const normalized = rarity.trim() || 'Unknown'
  const style = RARITY_STYLES[normalized] ?? RARITY_STYLES.Unknown
  return (
    <PillBadge className={style} title={`Rarity: ${normalized}`}>
      {normalized}
    </PillBadge>
  )
}
