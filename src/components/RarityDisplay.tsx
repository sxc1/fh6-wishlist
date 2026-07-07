import { PillBadge } from './PillBadge'

const RARITY_STYLES: Record<string, string> = {
  Common: 'bg-[#23B224] text-white',
  Rare: 'bg-[#1BA8CD] text-white',
  Epic: 'bg-[#BE45DF] text-white',
  Legendary: 'bg-[#F28C00] text-white',
  'Forza Edition': 'bg-gradient-to-r from-[#C83CFF] to-[#4E67FF] text-white',
  'Treasure Car': 'bg-[#F28C00] text-white',
  'Barn Find': 'bg-[#F28C00] text-white',
  Unknown: 'bg-muted text-muted-foreground',
}

export function RarityDisplay({ rarity }: { rarity: string }) {
  const normalized = rarity.trim() || 'Unknown'
  const style = RARITY_STYLES[normalized] ?? RARITY_STYLES.Unknown
  return (
    <PillBadge className={`font-bold uppercase ${style}`} title={`Rarity: ${normalized}`}>
      {normalized}
    </PillBadge>
  )
}
