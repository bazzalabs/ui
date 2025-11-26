'use client'

import type { Column, ColumnDataType, FilterModel } from '@bazza-ui/filters'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  useContext,
} from 'react'
import { cn } from '@/lib/utils'
import { useFilterVariant } from '../context/filter-context'

const filterBlockVariants = cva('flex items-center text-xs font-medium', {
  variants: {
    variant: {
      default: 'h-7 rounded-2xl border border-border bg-background shadow-xs',
      clean: 'h-7.5 rounded-md bg-accent border-none shadow-none gap-x-1 px-1',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface FilterBlockContextValue<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
}

export const FilterBlockContext = createContext<FilterBlockContextValue | null>(
  null,
)

export function useFilterBlockContext<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
>(): FilterBlockContextValue<TData, TType> {
  const context = useContext(FilterBlockContext)
  if (!context) {
    throw new Error(
      'FilterBlock compound components must be used within FilterBlock',
    )
  }
  return context as FilterBlockContextValue<TData, TType>
}

export interface FilterBlockProps<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>,
    VariantProps<typeof filterBlockVariants> {
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
const FilterBlock = forwardRef<HTMLDivElement, FilterBlockProps>(
  (
    { filter, column, children, className, variant: variantProp, ...props },
    ref,
  ) => {
    const contextVariant = useFilterVariant()
    const variant = variantProp ?? contextVariant ?? 'default'

    return (
      <FilterBlockContext.Provider
        value={{ filter, column } as FilterBlockContextValue}
      >
        <div
          ref={ref}
          data-slot="filter-block"
          data-column-id={column.id}
          data-column-type={column.type}
          className={cn(filterBlockVariants({ variant }), className)}
          {...props}
        >
          {children}
        </div>
      </FilterBlockContext.Provider>
    )
  },
)

FilterBlock.displayName = 'FilterBlock'

export { FilterBlock }

export namespace FilterBlock {
  export type Props<
    TData = unknown,
    TType extends ColumnDataType = ColumnDataType,
  > = FilterBlockProps<TData, TType>
  export type ContextValue<
    TData = unknown,
    TType extends ColumnDataType = ColumnDataType,
  > = FilterBlockContextValue<TData, TType>
}
