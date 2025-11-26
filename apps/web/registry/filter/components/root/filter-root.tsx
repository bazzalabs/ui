'use client'

import type {
  Column,
  DataTableFilterActions,
  FilterStrategy,
  FiltersState,
  Locale,
} from '@bazza-ui/filters'
import { type ComponentPropsWithoutRef, forwardRef, type Ref } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { FilterProvider } from '../provider/filter-provider'
import type { FilterVariant } from './filter-context'

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
  ref?: Ref<HTMLDivElement>
}

/**
 * Root component that provides filter context and layout container.
 * Renders a `<div>` element.
 *
 * Documentation: [Bazza UI Filter](https://bazza-ui.com/docs/components/filter)
 */
function FilterRootImpl<TData = unknown>(
  {
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
  }: FilterRootProps<TData>,
  ref: Ref<HTMLDivElement>,
) {
  const isMobile = useIsMobile()

  return (
    <FilterProvider
      columns={columns as Column<unknown>[]}
      filters={filters}
      actions={actions}
      strategy={strategy}
      locale={locale}
      entityName={entityName}
      variant={variant}
    >
      <div
        ref={ref}
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
    </FilterProvider>
  )
}

FilterRootImpl.displayName = 'FilterRoot'

/**
 * Root component that provides filter context and layout container.
 * Renders a `<div>` element.
 *
 * Documentation: [Bazza UI Filter](https://bazza-ui.com/docs/components/filter)
 */
const FilterRoot = forwardRef(FilterRootImpl) as <TData = unknown>(
  props: FilterRootProps<TData> & { ref?: Ref<HTMLDivElement> },
) => React.ReactElement

export { FilterRoot }

export namespace FilterRoot {
  export type Props<TData = unknown> = FilterRootProps<TData>
}
