import { NavBar } from '@/components/nav-bar'
import { ColorPlayground } from './color-playground'

export default function Page() {
  return (
    <div className="min-h-screen bg-site-background">
      <header className="sticky top-0 z-50 border-border border-b border-dashed bg-site-background/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-screen-2xl border-border border-dashed px-4 py-2 xl:border-x">
          <NavBar />
        </div>
      </header>
      <ColorPlayground />
    </div>
  )
}
