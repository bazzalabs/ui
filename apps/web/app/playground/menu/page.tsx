'use client'

import { NavBar } from '@/components/nav-bar'
import { MenuPlayground } from './menu-playground'

export default function Page() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b border-border border-dashed bg-site-background backdrop-blur-md z-50 shrink-0">
        <div className="px-4 py-2 max-w-screen-2xl w-full mx-auto border-border border-dashed xl:border-x">
          <NavBar />
        </div>
      </div>

      {/* Main content area - full height */}
      <MenuPlayground />
    </div>
  )
}
