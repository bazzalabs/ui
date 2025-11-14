'use client'

import type { FilterValueDisplayProps } from '../shared/types'

export function FilterValueBooleanDisplay<TData>({
  filter,
  column,
}: FilterValueDisplayProps<TData, 'boolean'>) {
  if (!filter || filter.values.length === 0) return null
  return <span>{column.toggledStateName}</span>
}
