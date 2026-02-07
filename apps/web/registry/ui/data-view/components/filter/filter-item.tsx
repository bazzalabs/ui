'use client'

import { cn } from '@/lib/utils'

import { useDataViewFilterItemContext } from '../provider/data-view-context'
import { FilterOperator } from './filter-operator'
import { FilterRemove } from './filter-remove'
import { FilterSubject } from './filter-subject'
import { FilterValue } from './filter-value'

// ---------------------------------------------------------------------------
// FilterItem
// ---------------------------------------------------------------------------

interface FilterItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export function FilterItem({ className, ...props }: FilterItemProps) {
  const ctx = useDataViewFilterItemContext()
  if (!ctx) return null

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border bg-background text-sm shadow-xs h-7',
        className,
      )}
      {...props}
    >
      <FilterSubject />
      <FilterOperator />
      <FilterValue />
      <FilterRemove />
    </div>
  )
}
