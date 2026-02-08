'use client'

import type { Column } from '@bazza-ui/data-view/react'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface SortToggleProps<TData = unknown>
  extends ComponentPropsWithoutRef<'button'> {
  column: Column<TData>
}

/**
 * Inline column header sort toggle button.
 * Shows the current sort direction and toggles on click.
 * Renders a `<button>` element.
 */
const SortToggle = forwardRef<HTMLButtonElement, SortToggleProps>(
  ({ column, className, children, ...props }, ref) => {
    const sortDir = column.getIsSorted()

    if (!column.sortable) {
      return <span>{children ?? column.displayName}</span>
    }

    return (
      <button
        ref={ref}
        type="button"
        data-slot="sort-toggle"
        data-column-id={column.id}
        data-sort-direction={sortDir || undefined}
        onClick={() => column.toggleSorting()}
        className={cn(
          'flex items-center gap-1 hover:text-foreground transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-muted/50',
          className,
        )}
        {...props}
      >
        {children ?? column.displayName}
        {sortDir === 'asc' ? (
          <ArrowUpIcon className="size-3.5" />
        ) : sortDir === 'desc' ? (
          <ArrowDownIcon className="size-3.5" />
        ) : (
          <ArrowUpDownIcon className="size-3.5 opacity-30" />
        )}
      </button>
    )
  },
)

SortToggle.displayName = 'SortToggle'

export { SortToggle }

export namespace SortToggle {
  export type Props<TData = unknown> = SortToggleProps<TData>
}
