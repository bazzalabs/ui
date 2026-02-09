'use client'

import { NavBar } from '@/components/nav-bar'
import { IssuesTable } from './_/issues-table'

export default function DataViewsExamplePage() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border border-dashed sticky top-0 bg-site-background backdrop-blur-md z-50">
        <div className="px-4 py-2 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x">
          <NavBar />
        </div>
      </div>
      <div className="border-b border-border border-dashed bg-site-background">
        <div className="px-4 py-2 max-w-screen-2xl w-full mx-auto border-border border-dashed xl:border-x">
          <div className="flex flex-col gap-8 p-8">
            <div>
              <h1 className="text-4xl font-[538] tracking-[-0.03rem] select-none">
                Data View{' '}
                <span className="text-muted-foreground">(Standalone)</span>
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Client-side filtering and sorting powered by{' '}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  @bazza-ui/data-view
                </code>{' '}
                — no TanStack Table, no external filter UI.
              </p>
            </div>
            <IssuesTable />
          </div>
        </div>
      </div>
    </div>
  )
}
