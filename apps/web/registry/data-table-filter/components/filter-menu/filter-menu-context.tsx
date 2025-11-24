'use client'

import type { DropdownMenuProps as ActionMenuRootProps } from '@bazza-ui/dropdown-menu'
import {
  useFilterActions,
  useFilterContext,
  useFilterLocale,
  useFilterStrategy,
} from '../../context'
import { FilterMenu } from '../filter-menu'

interface FilterMenuWithContextProps {
  children?: React.ReactNode
  actionMenuProps?: Partial<Omit<ActionMenuRootProps, 'menu' | 'children'>>
}

export function FilterMenuWithContext({
  children,
  actionMenuProps,
}: FilterMenuWithContextProps = {}) {
  const { columns, filters } = useFilterContext()
  const actions = useFilterActions()
  const strategy = useFilterStrategy()
  const locale = useFilterLocale()

  return (
    <FilterMenu
      columns={columns}
      filters={filters}
      actions={actions}
      strategy={strategy}
      locale={locale}
      actionMenuProps={actionMenuProps}
    >
      {children}
    </FilterMenu>
  )
}
