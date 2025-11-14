'use client'

import type {
  Column,
  DataTableFilterActions,
  FilterStrategy,
  FiltersState,
  Locale,
} from '@bazza-ui/filters'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  type DataTableFilterContextValue,
  DataTableFilterProvider,
} from '../../context'
import { FilterActionsWithContext } from '../filter-actions/filter-actions-context'
import { FilterList, FilterListMobileContainer } from '../filter-list'
import { FilterMenuWithContext } from '../filter-menu/filter-menu-context'

// Provider component
export interface ProviderProps<TData = unknown> {
  value: DataTableFilterContextValue<TData>
  children: React.ReactNode
}

function Provider<TData>({ value, children }: ProviderProps<TData>) {
  return (
    <DataTableFilterProvider value={value}>{children}</DataTableFilterProvider>
  )
}

export namespace Provider {
  export type Props<TData = unknown> = ProviderProps<TData>
}

// Menu component (uses context)
function Menu() {
  return <FilterMenuWithContext />
}

// List component (uses context)
function List() {
  return <FilterList />
}

// Actions component (uses context)
function Actions() {
  return <FilterActionsWithContext />
}

// Main compound component for composition
export interface DataTableFilterRootProps {
  children: React.ReactNode
}

function Root({ children }: DataTableFilterRootProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className="flex w-full items-start justify-between gap-2">
        {children}
      </div>
    )
  }

  return (
    <div className="flex w-full items-start justify-between gap-2">
      {children}
    </div>
  )
}

export namespace Root {
  export type Props = DataTableFilterRootProps
}

// Convenience component that provides default composition
export interface DataTableFilterProps<TData> {
  columns: Column<TData>[]
  filters: FiltersState
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
  entityName?: string
}

export function DataTableFilter<TData>({
  columns,
  filters,
  actions,
  strategy,
  locale = 'en',
  entityName,
}: DataTableFilterProps<TData>) {
  const isMobile = useIsMobile()

  const contextValue: DataTableFilterContextValue<TData> = {
    columns,
    filters,
    actions,
    strategy,
    locale,
    entityName,
  }

  if (isMobile) {
    return (
      <Provider value={contextValue}>
        <div className="flex w-full items-start justify-between gap-2">
          <div className="flex gap-1">
            <Menu />
            <Actions />
          </div>
          <FilterListMobileContainer>
            <List />
          </FilterListMobileContainer>
        </div>
      </Provider>
    )
  }

  return (
    <Provider value={contextValue}>
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex md:flex-wrap gap-2 w-full flex-1">
          <Menu />
          <List />
        </div>
        <Actions />
      </div>
    </Provider>
  )
}

export namespace DataTableFilter {
  export type Props<TData> = DataTableFilterProps<TData>
}

// Attach compound components
DataTableFilter.Provider = Provider
DataTableFilter.Menu = Menu
DataTableFilter.List = List
DataTableFilter.Actions = Actions
DataTableFilter.Root = Root
