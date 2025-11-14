'use client'

import { t } from '@bazza-ui/filters'
import type { FilterValueDisplayProps } from '../shared/types'

export function FilterValueNumberDisplay<TData>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueDisplayProps<TData, 'number'>) {
  if (!filter || !filter.values || filter.values.length === 0) return null

  if (
    filter.operator === 'is between' ||
    filter.operator === 'is not between'
  ) {
    const minValue = filter.values[0]
    const maxValue = filter.values[1]

    return (
      <span className="tabular-nums tracking-tight">
        {minValue} {t('and', locale)} {maxValue}
      </span>
    )
  }

  const value = filter.values[0]
  return <span className="tabular-nums tracking-tight">{value}</span>
}
