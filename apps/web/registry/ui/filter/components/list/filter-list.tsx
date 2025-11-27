'use client'

import { type Column, type FilterModel, getColumn } from '@bazza-ui/filters'
import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import { useFilterContext } from '../root/filter-context'

type FilterListRenderProps<TData = unknown> = {
  filter: FilterModel
  column: Column<TData>
}

export interface FilterListProps<TData = unknown>
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  children?: ReactNode | ((props: FilterListRenderProps<TData>) => ReactNode)
}

/**
 * Container for filter items.
 * Renders a `<div>` element.
 *
 * Documentation: [Bazza UI Filter](https://bazza-ui.com/docs/components/filter)
 */
const FilterList = forwardRef<HTMLDivElement, FilterListProps>(
  ({ className, children, ...props }, ref) => {
    const { filters, columns } = useFilterContext()

    // If regular children provided, just render them
    if (children && typeof children !== 'function') {
      return (
        <div
          ref={ref}
          data-slot="filter-list"
          className={cn('contents', className)}
          {...props}
        >
          {children}
        </div>
      )
    }

    // If no render function provided, just render the container
    if (!children) {
      return (
        <div
          ref={ref}
          data-slot="filter-list"
          className={cn('contents', className)}
          {...props}
        />
      )
    }

    // Otherwise, map over filters with render function
    const renderFn = children as (props: FilterListRenderProps) => ReactNode

    return (
      <div
        ref={ref}
        data-slot="filter-list"
        className={cn('contents', className)}
        {...props}
      >
        {filters.map((filter) => {
          const id = filter.columnId
          const column = getColumn(columns, id)

          // Skip if no filter value
          if (!filter.values) return null

          return (
            <div key={`filter-item-${filter.columnId}`}>
              {renderFn({ filter, column })}
            </div>
          )
        })}
      </div>
    )
  },
)

FilterList.displayName = 'FilterList'

export { FilterList }

export namespace FilterList {
  export type Props<TData = unknown> = FilterListProps<TData>
  export type RenderProps<TData = unknown> = FilterListRenderProps<TData>
}
