'use client'

import { type Locale, t } from '@bazza-ui/data-view'
import { ListFilterIcon } from 'lucide-react'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DataViewVariant } from '../root/data-view-context'

export interface FilterTriggerProps extends ComponentPropsWithoutRef<'button'> {
  hasVisibleFilters?: boolean
  locale?: Locale
  variant?: DataViewVariant
}

/**
 * A button that opens the filter menu.
 * Renders a `<button>` element.
 *
 * This component is designed to be used with `DropdownMenu.Trigger`'s `render` prop.
 *
 * Documentation: [Bazza UI DataView](https://bazza-ui.com/docs/components/data-view)
 */
const FilterTrigger = forwardRef<HTMLButtonElement, FilterTriggerProps>(
  (
    {
      className,
      children,
      hasVisibleFilters = false,
      locale = 'en',
      variant,
      ...props
    },
    ref,
  ) => {
    return (
      <Button
        ref={ref}
        data-slot="filter-trigger"
        data-state={hasVisibleFilters ? 'has-filters' : 'empty'}
        variant="outline"
        className={cn('h-7', hasVisibleFilters && 'w-fit !px-2', className)}
        {...props}
      >
        {children ?? (
          <>
            <ListFilterIcon className="size-4" />
            {!hasVisibleFilters && <span>{t('filter', locale)}</span>}
          </>
        )}
      </Button>
    )
  },
)

FilterTrigger.displayName = 'FilterTrigger'

export { FilterTrigger }

export namespace FilterTrigger {
  export type Props = FilterTriggerProps
}
