
import { NavBar } from '@/components/nav-bar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-svh select-none">
      <div className="border-b border-border border-dashed sticky top-0 bg-site-background backdrop-blur-md z-50 h-12">
        <div className="px-4 py-2 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x">
          <NavBar />
        </div>
      </div>
      {children}
    </div>
  )
}
