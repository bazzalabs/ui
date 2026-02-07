'use client'

import type { FiltersState } from '@bazza-ui/data-view/react'

import { cn } from '@/lib/utils'

import {
  DataViewFilterItemContext,
  useDataViewContext,
} from '../provider/data-view-context'
import { FilterItem } from './filter-item'

// ---------------------------------------------------------------------------
// FilterBar
// ---------------------------------------------------------------------------

export interface FilterBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Which layer's filters to display. Reads from context if not provided. */
  layer?: 'overrides' | 'base'
  /** Render prop or static children. When omitted, renders default FilterItem per filter. */
  children?: React.ReactNode | ((filters: FiltersState) => React.ReactNode)
}

export function FilterBar({
  layer: layerProp,
  className,
  children,
  ...props
}: FilterBarProps) {
  const { instance, layer: contextLayer } = useDataViewContext()
  const layer = layerProp ?? contextLayer

  const filters =
    layer === 'base' ? instance.baseView.filters : instance.overrides.filters
  const columns = instance.columns

  if (filters.length === 0) return null

  const renderContent = () => {
    if (typeof children === 'function') {
      return children(filters)
    }

    return filters.map((filter) => {
      const column = columns.find((c) => c.id === filter.columnId)
      if (!column) return null

      return (
        <DataViewFilterItemContext.Provider
          key={filter.columnId}
          value={{ filter, column }}
        >
          {children ?? <FilterItem />}
        </DataViewFilterItemContext.Provider>
      )
    })
  }

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      {...props}
    >
      {renderContent()}
    </div>
  )
}
