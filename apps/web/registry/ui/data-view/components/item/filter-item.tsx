'use client'

import type {
  Column,
  ColumnDataType,
  FilterModel,
  FilterStrategy,
  Locale,
  ViewLayer,
} from '@bazza-ui/data-view/react'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  useContext,
} from 'react'
import { cn } from '@/lib/utils'
import {
  useDataViewContext,
  useDataViewVariant,
} from '../root/data-view-context'

const filterItemVariants = cva('flex items-center text-xs font-medium', {
  variants: {
    variant: {
      default:
        'h-7 rounded-md border border-border bg-background shadow-xs divide-x',
      clean: 'h-7.5 rounded-md bg-accent border-none shadow-none gap-x-1 px-1',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface FilterItemContextValue<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  layer: ViewLayer<TData>
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
> extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>,
    VariantProps<typeof filterItemVariants> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  children?: React.ReactNode
}

/**
 * Container for a single filter's controls (subject, operator, value, remove).
 * Renders a `<div>` element.
 *
 * Documentation: [Bazza UI DataView](https://bazza-ui.com/docs/components/data-view)
 */
const FilterItem = forwardRef<HTMLDivElement, FilterItemProps>(
  (
    { filter, column, children, className, variant: variantProp, ...props },
    ref,
  ) => {
    const dataViewContext = useDataViewContext()
    const contextVariant = useDataViewVariant()
    const variant = variantProp ?? contextVariant ?? 'default'

    const itemContextValue: FilterItemContextValue = {
      filter,
      column,
      layer: dataViewContext.layer,
      strategy: dataViewContext.strategy,
      locale: dataViewContext.locale,
      entityName: dataViewContext.entityName,
    }

    return (
      <FilterItemContext.Provider value={itemContextValue}>
        <div
          ref={ref}
          data-slot="filter-item"
          data-column-id={column.id}
          data-column-type={column.type}
          className={cn(filterItemVariants({ variant }), className)}
          {...props}
        >
          {children}
        </div>
      </FilterItemContext.Provider>
    )
  },
)

FilterItem.displayName = 'FilterItem'

export { FilterItem, filterItemVariants }

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
