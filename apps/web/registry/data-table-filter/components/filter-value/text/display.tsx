'use client'

import { Ellipsis } from 'lucide-react'
import type { FilterValueDisplayProps } from '../shared/types'

export function FilterValueTextDisplay<TData>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueDisplayProps<TData, 'text'>) {
  if (!filter) return null
  if (
    filter.values.length === 0 ||
    (filter.values[0] && filter.values[0].trim() === '')
  )
    return <Ellipsis className="size-4" />

  const value = filter.values[0]

  return <span>{value}</span>
}
