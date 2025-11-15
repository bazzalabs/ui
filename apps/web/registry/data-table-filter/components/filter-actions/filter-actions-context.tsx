'use client'

import type { ComponentPropsWithoutRef } from 'react'
import {
  useFilterActions,
  useFilterContext,
  useFilterLocale,
} from '../../context'
import { FilterActions } from '../filter-actions'

interface FilterActionsWithContextProps
  extends Omit<
    ComponentPropsWithoutRef<typeof FilterActions>,
    'hasFilters' | 'actions' | 'locale'
  > {}

export function FilterActionsWithContext(
  props: FilterActionsWithContextProps = {},
) {
  const { filters } = useFilterContext()
  const actions = useFilterActions()
  const locale = useFilterLocale()

  return (
    <FilterActions
      hasFilters={filters.length > 0}
      actions={actions}
      locale={locale}
      {...props}
    />
  )
}
