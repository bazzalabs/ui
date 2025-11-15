'use client'

import type {
  Column,
  DataTableFilterActions,
  FilterModel,
  FilterStrategy,
  FiltersState,
  Locale,
} from '@bazza-ui/filters'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { createContext, useContext } from 'react'
import type { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { FilterActions } from './components/filter-actions'
import { FilterBlock } from './components/filter-list'
import { FilterMenu } from './components/filter-menu'
import type { FilterVariant } from './context'
import { DataTableFilterProvider } from './context'

interface DataTableFilterContextValue<TData> {
  columns: Column<TData>[]
  filters: FiltersState
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale: Locale
  entityName?: string
  variant?: FilterVariant
}

interface ListProps<TData>
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  children?:
    | ReactNode
    | ((props: { filter: FilterModel; column: Column<TData> }) => ReactNode)
}

/**
 * Factory function to create typed filter components.
 * This creates a new Context and all consumer components with proper generic types.
 *
 * @example
 * ```tsx
 * import { createTypedFilter } from '@/registry/data-table-filter'
 * import type { Issue } from './types'
 *
 * const Filter = createTypedFilter<Issue>()
 *
 * // Now column is properly typed as Column<Issue>
 * <Filter.List>
 *   {({ filter, column }) => ...}
 * </Filter.List>
 * ```
 */
export function createTypedFilter<TData>() {
  // Create context specific to this TData type
  const TypedFilterContext =
    createContext<DataTableFilterContextValue<TData> | null>(null)

  // Hook to access typed context
  function useTypedFilterContext() {
    const context = useContext(TypedFilterContext)
    if (!context) {
      throw new Error('Filter components must be used within Filter.Provider')
    }
    return context
  }

  // Provider component
  function Provider({
    value,
    children,
  }: {
    value: DataTableFilterContextValue<TData>
    children: ReactNode
  }) {
    return (
      <DataTableFilterProvider value={value as any}>
        <TypedFilterContext.Provider value={value}>
          {children}
        </TypedFilterContext.Provider>
      </DataTableFilterProvider>
    )
  }

  // Menu component - uses typed context
  function Menu({
    children,
    actionMenuProps,
  }: {
    children?: ReactNode
    actionMenuProps?: any
  } = {}) {
    const { columns, filters, actions, strategy, locale, variant } =
      useTypedFilterContext()

    return (
      <FilterMenu
        columns={columns}
        filters={filters}
        actions={actions}
        strategy={strategy}
        locale={locale}
        variant={variant}
        actionMenuProps={actionMenuProps}
      >
        {children}
      </FilterMenu>
    )
  }

  // Typed List component that uses the typed context
  function List({ className, children, ...props }: ListProps<TData> = {}) {
    const { filters, columns } = useTypedFilterContext()

    // If regular children provided, just render them
    if (children && typeof children !== 'function') {
      return (
        <div
          data-slot="filter-list"
          className={cn('contents', className)}
          {...props}
        >
          {children}
        </div>
      )
    }

    // Otherwise, map over filters
    return (
      <div
        data-slot="filter-list"
        className={cn('contents', className)}
        {...props}
      >
        {filters.map((filter) => {
          const id = filter.columnId
          const column = columns.find((col) => col.id === id)

          if (!column || !filter.values) return null

          // If children render function provided, use it
          if (typeof children === 'function') {
            return (
              <div key={`filter-block-${filter.columnId}`}>
                {children({ filter, column })}
              </div>
            )
          }

          // Default rendering
          return (
            <FilterBlock
              key={`filter-block-${filter.columnId}`}
              filter={filter}
              column={column}
            >
              <FilterBlock.Subject />
              <FilterBlock.Operator />
              <FilterBlock.Value />
              <FilterBlock.Remove />
            </FilterBlock>
          )
        })}
      </div>
    )
  }

  // Actions component - uses typed context
  function Actions(
    props: Omit<
      ComponentPropsWithoutRef<typeof Button>,
      'onClick' | 'children'
    > & {
      variant?: ComponentPropsWithoutRef<typeof Button>['variant']
    } = {},
  ) {
    const {
      filters,
      actions,
      locale,
      variant: filterVariant,
    } = useTypedFilterContext()

    return (
      <FilterActions
        hasFilters={filters.length > 0}
        actions={actions}
        locale={locale}
        filterVariant={filterVariant}
        {...props}
      />
    )
  }

  // Root component that combines Provider and layout container
  function Root({
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
  }: Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
    columns: Column<TData>[]
    filters: FiltersState
    actions: DataTableFilterActions
    strategy: FilterStrategy
    locale?: Locale
    entityName?: string
    variant?: FilterVariant
    children: ReactNode
  }) {
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
      <DataTableFilterProvider value={contextValue as any}>
        <TypedFilterContext.Provider value={contextValue}>
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
        </TypedFilterContext.Provider>
      </DataTableFilterProvider>
    )
  }

  // Return all components with TData type baked in
  return {
    Root,
    Provider,
    Menu: Object.assign(Menu, {
      Trigger: FilterMenu.Trigger,
    }),
    List,
    Actions,
    Block: FilterBlock,
    // Expose the context and hook for advanced usage
    Context: TypedFilterContext,
    useContext: useTypedFilterContext,
  }
}

export type TypedFilter<TData> = ReturnType<typeof createTypedFilter<TData>>
