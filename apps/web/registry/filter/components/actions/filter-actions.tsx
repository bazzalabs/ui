'use client'

import { type DataTableFilterActions, type Locale, t } from '@bazza-ui/filters'
import { FilterXIcon } from 'lucide-react'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFilterContext } from '../root/filter-context'

export interface FilterActionsProps
  extends Omit<ComponentPropsWithoutRef<typeof Button>, 'onClick' | 'variant'> {
  hasFilters?: boolean
  actions?: DataTableFilterActions
  locale?: Locale
  variant?: ComponentPropsWithoutRef<typeof Button>['variant']
}

/**
 * Button to clear all filters.
 * Renders a `<button>` element.
 *
 * Documentation: [Bazza UI Filter](https://bazza-ui.com/docs/components/filter)
 */
export const FilterActions = forwardRef<HTMLButtonElement, FilterActionsProps>(
  (
    {
      hasFilters: hasFiltersProp,
      actions: actionsProp,
      locale: localeProp,
      className,
      variant = 'destructive',
      ...props
    },
    ref,
  ) => {
    // Get from context if not provided as props
    const context = useFilterContext()
    const hasFilters = hasFiltersProp ?? context.filters.length > 0
    const actions = actionsProp ?? context.actions
    const locale = localeProp ?? context.locale ?? 'en'

    return (
      <Button
        ref={ref}
        data-slot="filter-actions"
        data-state={hasFilters ? 'visible' : 'hidden'}
        className={cn('h-7 !px-2', !hasFilters && 'hidden', className)}
        variant={variant}
        onClick={actions?.removeAllFilters}
        {...props}
      >
        <FilterXIcon />
        <span className="hidden md:block">{t('clear', locale)}</span>
      </Button>
    )
  },
)

FilterActions.displayName = 'FilterActions'

export namespace FilterActions {
  export type Props = FilterActionsProps
}
