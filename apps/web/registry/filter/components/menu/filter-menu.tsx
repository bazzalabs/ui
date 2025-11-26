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
import { memo, useEffect, useMemo, useRef } from 'react'
import { DropdownMenu } from '@/registry/dropdown-menu'
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

  // Use ref to capture current filters value for loaders
  const filtersRef = useRef(filters)
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

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
      nodes: columns.map((column) => {
        if (column.type === 'text') {
          const textFilter = filters.find((f) => f.columnId === column.id)
          return createTextMenu({
            filter: textFilter as FilterModel,
            column: column as Column<TData, 'text'>,
            actions,
            locale,
            strategy,
          })
        }

        if (column.type === 'date') {
          const dateFilter = filters.find((f) => f.columnId === column.id)
          return createDateMenu({
            filter: dateFilter as FilterModel<'date'>,
            column: column as Column<TData, 'date'>,
            actions,
            locale,
            strategy,
          })
        }

        if (column.type === 'number') {
          const numberFilter = filters.find((f) => f.columnId === column.id)
          return createNumberMenu({
            filter: numberFilter as FilterModel<'number'>,
            column: column as Column<TData, 'number'>,
            actions,
            locale,
            strategy,
          })
        }

        if (column.type === 'boolean') {
          return {
            id: `filter-value-${column.id}`,
            kind: 'item',
            variant: 'button',
            label: column.displayName,
            icon: column.icon,
            onSelect: () => {
              actions.setFilterValue(column, [false])
            },
          } as ItemDef
        }

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
          ...(column.type === 'option'
            ? createOptionMenu({
                filter: undefined as any,
                column: column as Column<TData, 'option'>,
                actions,
                locale,
                strategy,
                getFilter: () =>
                  filtersRef.current.find((f) => f.columnId === column.id) as
                    | FilterModel<'option'>
                    | undefined,
              })
            : column.type === 'multiOption'
              ? createMultiOptionMenu({
                  filter: undefined as any,
                  column: column as Column<TData, 'multiOption'>,
                  actions,
                  locale,
                  strategy,
                  getFilter: () =>
                    filtersRef.current.find((f) => f.columnId === column.id) as
                      | FilterModel<'multiOption'>
                      | undefined,
                })
              : {}),
        } as SubmenuDef
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
