'use client'

import { cn } from '@/lib/utils'

import { useDataViewFilterItemContext } from '../provider/data-view-context'

// ---------------------------------------------------------------------------
// FilterSubject
// ---------------------------------------------------------------------------

export function FilterSubject({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  const ctx = useDataViewFilterItemContext()
  if (!ctx) return null

  const { column } = ctx
  const Icon = column.icon as
    | React.ComponentType<{ className?: string }>
    | undefined

  return (
    <span
      className={cn(
        'flex items-center gap-1 px-1.5 text-muted-foreground',
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="size-3.5" />}
      <span className="text-xs font-medium">{column.displayName}</span>
    </span>
  )
}
