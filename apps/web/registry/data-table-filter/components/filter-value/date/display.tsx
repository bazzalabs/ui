'use client'

import { format } from 'date-fns'
import { Ellipsis } from 'lucide-react'
import type { FilterValueDisplayProps } from '../shared/types'

export function formatDateRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth()
  const sameYear = start.getFullYear() === end.getFullYear()

  if (sameMonth && sameYear) {
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`
  }

  if (sameYear) {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
  }

  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
}

export function FilterValueDateDisplay<TData>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueDisplayProps<TData, 'date'>) {
  if (!filter) return null
  if (filter.values.length === 0) return <Ellipsis className="size-4" />
  if (filter.values.length === 1 && filter.values[0]) {
    const value = filter.values[0]

    const formattedDateStr = format(value, 'MMM d, yyyy')

    return <span>{formattedDateStr}</span>
  }
  if (filter.values.length === 2 && filter.values[0] && filter.values[1]) {
    const formattedRangeStr = formatDateRange(
      filter.values[0],
      filter.values[1],
    )

    return <span>{formattedRangeStr}</span>
  }

  return null
}
