'use client'

import type { BaseViewLayer, DataViewState } from '@bazza-ui/data-view/react'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { useDataViewContext } from '../root/data-view-context'

export interface ViewSwitcherProps extends ComponentPropsWithoutRef<'div'> {
  /** Array of saved/preset views to display as tabs. */
  views: DataViewState[]
  /** Currently active view ID (matched against `view.id`). */
  activeViewId?: string
  /** Callback when a view tab is clicked. Defaults to `baseView.load(view)`. */
  onViewSelect?: (view: DataViewState) => void
  /** Custom render function for individual tabs. */
  renderTab?: (view: DataViewState, isActive: boolean) => React.ReactNode
}

/**
 * Tab bar for switching between saved/preset views.
 * Renders a `<div>` element with tab buttons.
 */
const ViewSwitcher = forwardRef<HTMLDivElement, ViewSwitcherProps>(
  (
    {
      views,
      activeViewId,
      onViewSelect: onViewSelectProp,
      renderTab,
      className,
      ...props
    },
    ref,
  ) => {
    const context = useDataViewContext()
    const baseView = context.instance.baseView

    const onViewSelect =
      onViewSelectProp ??
      ((view: DataViewState) => {
        baseView.load(view)
      })

    return (
      <div
        ref={ref}
        data-slot="view-switcher"
        className={cn(
          'flex items-center gap-0.5 rounded-lg bg-muted p-0.5',
          className,
        )}
        {...props}
      >
        {views.map((view) => {
          const isActive = view.id === activeViewId

          if (renderTab) {
            return (
              <button
                key={view.id ?? view.name}
                type="button"
                onClick={() => onViewSelect(view)}
              >
                {renderTab(view, isActive)}
              </button>
            )
          }

          return (
            <button
              key={view.id ?? view.name}
              type="button"
              onClick={() => onViewSelect(view)}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {view.name ?? view.id ?? 'Untitled'}
            </button>
          )
        })}
      </div>
    )
  },
)

ViewSwitcher.displayName = 'ViewSwitcher'

export { ViewSwitcher }

export namespace ViewSwitcher {
  export type Props = ViewSwitcherProps
}
