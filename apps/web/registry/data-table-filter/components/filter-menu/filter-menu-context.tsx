'use client'

import {
  useFilterActions,
  useFilterContext,
  useFilterLocale,
  useFilterStrategy,
} from '../../context'
import { FilterMenu_v2 } from '../filter-menu'

export function FilterMenuWithContext() {
  const { columns, filters } = useFilterContext()
  const actions = useFilterActions()
  const strategy = useFilterStrategy()
  const locale = useFilterLocale()

  return (
    <FilterMenu_v2
      columns={columns}
      filters={filters}
      actions={actions}
      strategy={strategy}
      locale={locale}
    />
  )
}
