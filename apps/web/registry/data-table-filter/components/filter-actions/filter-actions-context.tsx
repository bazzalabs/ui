'use client'

import {
  useFilterActions,
  useFilterContext,
  useFilterLocale,
} from '../../context'
import { FilterActions } from '../filter-actions'

export function FilterActionsWithContext() {
  const { filters } = useFilterContext()
  const actions = useFilterActions()
  const locale = useFilterLocale()

  return (
    <FilterActions
      hasFilters={filters.length > 0}
      actions={actions}
      locale={locale}
    />
  )
}
