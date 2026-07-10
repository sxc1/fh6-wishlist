import { LayoutGrid, Menu } from 'lucide-react'
import { useStore } from '../store'

export function CarBrowserViewToggle() {
  const viewMode = useStore((s) => s.viewMode)
  const setViewMode = useStore((s) => s.setViewMode)
  const wishlistPanelExpanded = useStore((s) => s.wishlistPanelExpanded)

  return (
    <div className="flex overflow-hidden rounded-md border border-input">
      <button
        type="button"
        onClick={() => setViewMode('tile')}
        className={`inline-flex h-8 items-center justify-center gap-1.5 px-2.5 text-sm ${
          viewMode === 'tile' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary'
        }`}
        title="Tiles"
        aria-label="Tiles"
      >
        <LayoutGrid size={14} strokeWidth={2.25} />
        {!wishlistPanelExpanded ? <span>Tiles</span> : null}
      </button>
      <button
        type="button"
        onClick={() => setViewMode('list')}
        className={`inline-flex h-8 items-center justify-center gap-1.5 px-2.5 text-sm ${
          viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary'
        }`}
        title="List"
        aria-label="List"
      >
        <Menu size={14} strokeWidth={2.25} />
        {!wishlistPanelExpanded ? <span>List</span> : null}
      </button>
    </div>
  )
}
