'use client'

import type { DataViewState } from '@bazza-ui/data-view/react'
import { PlusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDataViewContext } from '../provider/data-view-context'

export interface ViewSwitcherProps
  extends React.HTMLAttributes<HTMLDivElement> {
  views: DataViewState[]
  onViewSelect?: (view: DataViewState) => void
  onCreateView?: () => void
  renderTab?: (view: DataViewState, isActive: boolean) => React.ReactNode
}

export function ViewSwitcher({
  views,
  onViewSelect,
  onCreateView,
  renderTab,
  className,
  ...props
}: ViewSwitcherProps) {
  const { instance } = useDataViewContext()

  const activeViewId = instance.baseView.id
  const isActiveView = (view: DataViewState) => {
    if (activeViewId && view.id) return activeViewId === view.id
    return (
      JSON.stringify(view.filters) ===
        JSON.stringify(instance.baseView.filters) &&
      JSON.stringify(view.sort) === JSON.stringify(instance.baseView.sort)
    )
  }

  const handleSelect = (view: DataViewState) => {
    instance.baseView.load(view)
    onViewSelect?.(view)
  }

  return (
    <div className={cn('flex items-center gap-1', className)} {...props}>
      <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
        {views.map((view) => {
          const isActive = isActiveView(view)
          const key = view.id ?? view.name ?? JSON.stringify(view.filters)

          if (renderTab) {
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelect(view)}
                className="contents"
              >
                {renderTab(view, isActive)}
              </button>
            )
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(view)}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {view.name ?? 'Untitled'}
            </button>
          )
        })}
      </div>

      {onCreateView && (
        <button
          type="button"
          onClick={onCreateView}
          className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <PlusIcon className="size-3.5" />
        </button>
      )}
    </div>
  )
}
