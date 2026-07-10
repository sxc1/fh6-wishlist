import { CarBrowserDisplay } from './CarBrowserDisplay'
import { CarBrowserHeader } from './CarBrowserHeader'

export function CarBrowser() {
  return (
    <div className="flex h-full flex-col">
      <CarBrowserHeader />
      <CarBrowserDisplay />
    </div>
  )
}
