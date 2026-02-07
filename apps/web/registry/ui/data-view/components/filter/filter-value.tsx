'use client'

import { cn } from '@/lib/utils'

import { useDataViewFilterItemContext } from '../provider/data-view-context'

// ---------------------------------------------------------------------------
// FilterValue
// ---------------------------------------------------------------------------

export function FilterValue({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  const ctx = useDataViewFilterItemContext()
  if (!ctx) return null

  const { filter, column } = ctx
  let displayValue = ''

  if (column.type === 'option' || column.type === 'multiOption') {
    const options = column.getOptions()
    const labels = filter.values.map(
      (v) => options.find((o) => o.value === v)?.label ?? String(v),
    )
    displayValue = labels.join(', ')
  } else if (column.type === 'boolean') {
    displayValue =
      filter.values[0] === true ? (column.toggledStateName ?? 'Yes') : 'No'
  } else if (column.type === 'text') {
    displayValue = filter.values.map(String).join(', ')
  } else if (column.type === 'date') {
    displayValue = filter.values
      .map((v) => {
        if (v instanceof Date) return v.toLocaleDateString()
        return String(v)
      })
      .join(' \u2013 ')
  } else if (column.type === 'number') {
    displayValue = filter.values.map(String).join(' \u2013 ')
  } else {
    displayValue = filter.values.map(String).join(', ')
  }

  return (
    <span
      className={cn(
        'text-xs font-medium px-1 max-w-[150px] truncate',
        className,
      )}
      {...props}
    >
      {displayValue}
    </span>
  )
}
