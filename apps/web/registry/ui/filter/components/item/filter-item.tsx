'use client'

import type {
  Column,
  ColumnDataType,
  DataTableFilterActions,
  FilterModel,
  FilterStrategy,
  Locale,
} from '@bazza-ui/filters'
import {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  useContext,
} from 'react'
import { cn } from '@/lib/utils'
import { useFilterContext } from '../root/filter-context'

export interface FilterItemContextValue<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale: Locale
  entityName?: string
}

export const FilterItemContext = createContext<FilterItemContextValue | null>(
  null,
)

/**
 * Returns the FilterItemContext value, or null if not within a FilterItem.
 * This allows child components to be used both inside FilterItem (consuming context)
 * or standalone (with explicit props).
 */
export function useFilterItemContext<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
>(): FilterItemContextValue<TData, TType> | null {
  return useContext(FilterItemContext) as FilterItemContextValue<
    TData,
    TType
  > | null
}

export interface FilterItemProps<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  children?: React.ReactNode
}

/**
 * Container for a single filter's controls (subject, operator, value, remove).
 * Renders a `<div>` element.
 *
 * Documentation: [Bazza UI Filter](https://bazza-ui.com/docs/components/filter)
 */
export const FilterItem = forwardRef<HTMLDivElement, FilterItemProps>(
  ({ filter, column, children, className, ...props }, ref) => {
    const filterContext = useFilterContext()

    const itemContextValue: FilterItemContextValue = {
      filter,
      column,
      actions: filterContext.actions,
      strategy: filterContext.strategy,
      locale: filterContext.locale,
      entityName: filterContext.entityName,
    }

    return (
      <FilterItemContext.Provider value={itemContextValue}>
        <div
          ref={ref}
          data-slot="filter-item"
          data-column-id={column.id}
          data-column-type={column.type}
          className={cn(
            'flex items-center text-xs font-medium h-7 rounded-md border border-border bg-background shadow-xs divide-x',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </FilterItemContext.Provider>
    )
  },
)

FilterItem.displayName = 'FilterItem'

export namespace FilterItem {
  export type Props<
    TData = unknown,
    TType extends ColumnDataType = ColumnDataType,
  > = FilterItemProps<TData, TType>
  export type ContextValue<
    TData = unknown,
    TType extends ColumnDataType = ColumnDataType,
  > = FilterItemContextValue<TData, TType>
}
