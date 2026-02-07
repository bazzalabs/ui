'use client'

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { useDataViewInstance } from '../provider/data-view-context'

// ---------------------------------------------------------------------------
// SortToggle
// ---------------------------------------------------------------------------

export interface SortToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Column ID to toggle sort for */
  columnId: string
}

export function SortToggle({
  columnId,
  className,
  children,
  ...props
}: SortToggleProps) {
  const instance = useDataViewInstance()
  const column = instance.columns.find((c) => c.id === columnId)
  if (!column || !column.sortable) return <span>{children}</span>

  const sortDir = column.getIsSorted()

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting()}
      className={cn(
        'flex items-center gap-1 hover:text-foreground transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-muted/50 text-muted-foreground',
        sortDir && 'text-foreground',
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
}
