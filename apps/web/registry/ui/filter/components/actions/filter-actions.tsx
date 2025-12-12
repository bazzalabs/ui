'use client'

import { type DataTableFilterActions, type Locale, t } from '@bazza-ui/filters'
import { FilterXIcon, XIcon } from 'lucide-react'
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
      variant = 'outline',
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
        className={cn(
          'h-7 !px-2 group/button',
          !hasFilters && 'hidden',
          className,
        )}
        variant={variant}
        onClick={actions?.removeAllFilters}
        {...props}
      >
        <ListFilterMinusIcon className="group-hover/button:text-primary text-muted-foreground" />
        <span className="hidden md:block">{t('clear', locale)}</span>
      </Button>
    )
  },
)

FilterActions.displayName = 'FilterActions'

export const ListFilterMinusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 5H2" />
    <path d="M6 12H18" />
    <path d="M9 19H15" />
    <path d="M16.8789 2.87891L21.1215 7.12155" />
    <path d="M16.8785 7.12155L21.1211 2.87891" />
  </svg>
)

export namespace FilterActions {
  export type Props = FilterActionsProps
}
