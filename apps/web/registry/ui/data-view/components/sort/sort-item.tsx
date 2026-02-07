'use client'

import { ArrowDownIcon, ArrowUpIcon, XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { useDataViewInstance } from '../provider/data-view-context'

// ---------------------------------------------------------------------------
// SortItem
// ---------------------------------------------------------------------------

export interface SortItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Column ID of the sort rule */
  columnId: string
}

export function SortItem({ columnId, className, ...props }: SortItemProps) {
  const instance = useDataViewInstance()
  const column = instance.columns.find((c) => c.id === columnId)
  if (!column) return null

  const sortDir = column.getIsSorted()
  if (!sortDir) return null

  const Icon = column.icon as
    | React.ComponentType<{ className?: string }>
    | undefined

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md border bg-background text-sm shadow-xs h-7 px-2',
        className,
      )}
      {...props}
    >
      {sortDir === 'asc' ? (
        <ArrowUpIcon className="size-3 text-muted-foreground" />
      ) : (
        <ArrowDownIcon className="size-3 text-muted-foreground" />
      )}
      {Icon && <Icon className="size-3 text-muted-foreground" />}
      <span className="text-xs font-medium">{column.displayName}</span>
      <button
        type="button"
        onClick={() => column.clearSorting()}
        className="flex items-center justify-center size-4 rounded-sm hover:bg-muted transition-colors text-muted-foreground hover:text-foreground ml-0.5"
      >
        <XIcon className="size-3" />
      </button>
    </div>
  )
}
