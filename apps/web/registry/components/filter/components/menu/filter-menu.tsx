'use client'

import type {
  DropdownMenuProps as ActionMenuRootProps,
  ItemDef,
  MenuDef,
  SubmenuDef,
} from '@bazza-ui/dropdown-menu'
import type {
  Column,
  DataTableFilterActions,
  FilterModel,
  FilterStrategy,
  FiltersState,
  Locale,
} from '@bazza-ui/filters'
import {
  isBooleanColumn,
  isDateColumn,
  isMultiOptionColumn,
  isNumberColumn,
  isOptionColumn,
  isTextColumn,
} from '@bazza-ui/filters'
import { memo, useMemo } from 'react'
import { DropdownMenu } from '@/registry/components/dropdown-menu'
import {
  type FilterVariant,
  useFilterContext,
  useFilterVariant,
} from '../root/filter-context'
import { FilterTrigger } from '../trigger/filter-trigger'
import {
  createMultiOptionMenu,
  createOptionMenu,
  createTextMenu,
  FilterValueDateController,
  FilterValueNumberController,
  OptionItem,
} from '../value'

function createDateMenu<TData>({
  filter,
  column,
  actions,
  locale = 'en',
  strategy,
}: {
  filter: FilterModel<'date'>
  column: Column<TData, 'date'>
  actions: DataTableFilterActions
  locale?: Locale
  strategy: FilterStrategy
}): SubmenuDef {
  return {
    kind: 'submenu',
    id: column.id,
    icon: column.icon,
    label: column.displayName,
    render: () => (
      <FilterValueDateController
        filter={filter}
        column={column}
        actions={actions}
        strategy={strategy}
        locale={locale}
      />
    ),
    nodes: [],
  }
}

function createNumberMenu<TData>({
  filter,
  column,
  actions,
  locale = 'en',
  strategy,
}: {
  filter: FilterModel<'number'>
  column: Column<TData, 'number'>
  actions: DataTableFilterActions
  locale?: Locale
  strategy: FilterStrategy
}): SubmenuDef {
  return {
    kind: 'submenu' as const,
    id: column.id,
    icon: column.icon,
    label: column.displayName,
    render: () => (
      <FilterValueNumberController
        filter={filter}
        column={column}
        actions={actions}
        strategy={strategy}
        locale={locale}
      />
    ),
    nodes: [],
  }
}

export interface FilterMenuProps<TData = unknown> {
  columns?: Column<TData>[]
  filters?: FiltersState
  actions?: DataTableFilterActions
  strategy?: FilterStrategy
  locale?: Locale
  children?: React.ReactNode
  actionMenuProps?: Partial<Omit<ActionMenuRootProps, 'menu' | 'children'>>
  variant?: FilterVariant
}

function __FilterMenu<TData>({
  columns: columnsProp,
  filters: filtersProp,
  actions: actionsProp,
  strategy: strategyProp,
  locale: localeProp,
  children,
  actionMenuProps,
  variant: variantProp,
}: FilterMenuProps<TData>) {
  // Get values from context if not provided as props
  const context = useFilterContext<TData>()
  const contextVariant = useFilterVariant()

  const columns = columnsProp ?? context.columns
  const filters = filtersProp ?? context.filters
  const actions = actionsProp ?? context.actions
  const strategy = strategyProp ?? context.strategy
  const locale = localeProp ?? context.locale ?? 'en'
  const variant = variantProp ?? contextVariant

  const visibleColumns = useMemo(
    () => columns.filter((c) => !c.hidden),
    [columns],
  )

  const visibleFilters = useMemo(
    () =>
      filters.filter((f) => visibleColumns.find((c) => c.id === f.columnId)),
    [filters, visibleColumns],
  )

  const hasVisibleFilters = visibleFilters.length > 0

  const menu: MenuDef = useMemo(
    () => ({
      id: 'filter-menu',
      search: {
        minLength: 2,
      },
      nodes: columns.map((column): ItemDef | SubmenuDef => {
        if (isTextColumn(column)) {
          return createTextMenu({
            column,
            actions,
            locale,
            strategy,
          })
        }

        if (isDateColumn(column)) {
          const dateFilter = filters.find(
            (f): f is FilterModel<'date'> =>
              f.columnId === column.id && f.type === 'date',
          )
          return createDateMenu({
            filter: dateFilter as FilterModel<'date'>,
            column,
            actions,
            locale,
            strategy,
          })
        }

        if (isNumberColumn(column)) {
          const numberFilter = filters.find(
            (f): f is FilterModel<'number'> =>
              f.columnId === column.id && f.type === 'number',
          )
          return createNumberMenu({
            filter: numberFilter as FilterModel<'number'>,
            column,
            actions,
            locale,
            strategy,
          })
        }

        if (isBooleanColumn(column)) {
          return {
            id: `filter-value-${column.id}`,
            kind: 'item',
            variant: 'button',
            label: column.displayName,
            icon: column.icon,
            onSelect: () => {
              actions.setFilterValue(column, [false])
            },
          } satisfies ItemDef
        }

        if (isOptionColumn(column)) {
          const optionFilter = filters.find(
            (f): f is FilterModel<'option'> =>
              f.columnId === column.id && f.type === 'option',
          )
          return {
            kind: 'submenu',
            id: column.id,
            icon: column.icon,
            label: column.displayName,
            ui: {
              slots: {
                Item: OptionItem,
              },
            },
            ...createOptionMenu({
              column,
              actions,
              locale,
              strategy,
              filter: optionFilter,
            }),
          } satisfies SubmenuDef
        }

        if (isMultiOptionColumn(column)) {
          const multiOptionFilter = filters.find(
            (f): f is FilterModel<'multiOption'> =>
              f.columnId === column.id && f.type === 'multiOption',
          )
          return {
            kind: 'submenu',
            id: column.id,
            icon: column.icon,
            label: column.displayName,
            ui: {
              slots: {
                Item: OptionItem,
              },
            },
            ...createMultiOptionMenu({
              column,
              actions,
              locale,
              strategy,
              filter: multiOptionFilter,
            }),
          } satisfies SubmenuDef
        }

        // Fallback for any unknown column types
        return {
          kind: 'submenu',
          id: column.id,
          icon: column.icon,
          label: column.displayName,
          nodes: [],
        } satisfies SubmenuDef
      }),
    }),
    [columns, filters, actions, locale, strategy],
  )

  return (
    <DropdownMenu menu={menu} {...actionMenuProps}>
      {children ?? (
        <FilterTrigger
          hasVisibleFilters={hasVisibleFilters}
          locale={locale}
          variant={variant}
        />
      )}
    </DropdownMenu>
  )
}

export const FilterMenu = memo(__FilterMenu) as typeof __FilterMenu

export namespace FilterMenu {
  export type Props<TData = unknown> = FilterMenuProps<TData>
}
