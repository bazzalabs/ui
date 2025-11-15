'use client'

import type { ActionMenuRootProps } from '@bazza-ui/action-menu'
import type {
  Column,
  DataTableFilterActions,
  FilterModel,
  FilterStrategy,
  FiltersState,
  Locale,
} from '@bazza-ui/filters'
import type { ComponentPropsWithoutRef } from 'react'
import type { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import {
  type DataTableFilterContextValue,
  DataTableFilterProvider,
  type FilterVariant,
} from '../../context'
import { FilterActionsWithContext } from '../filter-actions/filter-actions-context'
import {
  FilterBlock,
  FilterList,
  FilterListMobileContainer,
} from '../filter-list'
import { FilterMenu } from '../filter-menu'
import { FilterMenuWithContext } from '../filter-menu/filter-menu-context'

// Provider component
export interface ProviderProps<TData = unknown> {
  value: DataTableFilterContextValue<TData>
  children: React.ReactNode
}

export function Provider<TData>({ value, children }: ProviderProps<TData>) {
  return (
    <DataTableFilterProvider value={value}>{children}</DataTableFilterProvider>
  )
}

export namespace Provider {
  export type Props<TData = unknown> = ProviderProps<TData>
}

// Menu component (uses context)
export interface MenuProps {
  children?: React.ReactNode
  actionMenuProps?: Partial<Omit<ActionMenuRootProps, 'menu' | 'children'>>
}

export function Menu({ children, actionMenuProps }: MenuProps = {}) {
  return (
    <FilterMenuWithContext actionMenuProps={actionMenuProps}>
      {children}
    </FilterMenuWithContext>
  )
}

export namespace Menu {
  export type Props = MenuProps
}

// List component (uses context)
export interface ListProps<TData = unknown>
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  children?:
    | React.ReactNode
    | ((props: {
        filter: FilterModel
        column: Column<TData>
      }) => React.ReactNode)
}

export function List<TData = unknown>(props: ListProps<TData> = {}) {
  return <FilterList<TData> {...props} />
}

export namespace List {
  export type Props<TData = unknown> = ListProps<TData>
}

// Actions component (uses context)
export interface ActionsProps
  extends Omit<
    ComponentPropsWithoutRef<typeof Button>,
    'onClick' | 'children'
  > {
  variant?: ComponentPropsWithoutRef<typeof Button>['variant']
}

export function Actions(props: ActionsProps = {}) {
  return <FilterActionsWithContext {...props} />
}

// Root component that combines Provider and layout container
export interface FilterRootProps<TData = unknown>
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  columns: Column<TData>[]
  filters: FiltersState
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
  entityName?: string
  variant?: FilterVariant
  children: React.ReactNode
}

export function Root<TData>({
  children,
  className,
  columns,
  filters,
  actions,
  strategy,
  locale = 'en',
  entityName,
  variant,
  ...props
}: FilterRootProps<TData>) {
  const isMobile = useIsMobile()

  const contextValue: DataTableFilterContextValue<TData> = {
    columns,
    filters,
    actions,
    strategy,
    locale,
    entityName,
    variant,
  }

  return (
    <Provider value={contextValue}>
      <div
        data-slot="filter-root"
        data-mobile={isMobile}
        className={cn(
          'flex w-full items-start justify-between gap-2',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </Provider>
  )
}

export namespace Root {
  export type Props<TData = unknown> = FilterRootProps<TData>
}

// Convenience component that provides default composition
export interface FilterProps<TData> {
  columns: Column<TData>[]
  filters: FiltersState
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
  entityName?: string
}

export function Filter<TData>({
  columns,
  filters,
  actions,
  strategy,
  locale = 'en',
  entityName,
}: FilterProps<TData>) {
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

export namespace Filter {
  export type Props<TData> = FilterProps<TData>
}

// Attach compound components
Filter.Provider = Provider
Filter.Menu = Object.assign(Menu, {
  Trigger: FilterMenu.Trigger,
})
Filter.List = List
Filter.Actions = Actions
Filter.Root = Root
Filter.Block = FilterBlock
