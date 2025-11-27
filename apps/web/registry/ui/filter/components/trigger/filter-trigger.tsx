'use client'

import { type Locale, t } from '@bazza-ui/filters'
import { Slot } from '@radix-ui/react-slot'
import { ListFilterIcon } from 'lucide-react'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import type { FilterVariant } from '../root/filter-context'

export interface FilterTriggerProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean
  hasVisibleFilters?: boolean
  locale?: Locale
  variant?: FilterVariant
}

/**
 * A button that opens the filter menu.
 * Renders a `<button>` element.
 *
 * Documentation: [Bazza UI Filter](https://bazza-ui.com/docs/components/filter)
 */
const FilterTrigger = forwardRef<HTMLButtonElement, FilterTriggerProps>(
  (
    {
      asChild,
      className,
      children,
      hasVisibleFilters = false,
      locale = 'en',
      variant,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : Button

    return (
      <DropdownMenu.Trigger asChild>
        <Comp
          ref={ref}
          data-slot="filter-trigger"
          data-state={hasVisibleFilters ? 'has-filters' : 'empty'}
          variant="outline"
          className={cn('h-7', hasVisibleFilters && 'w-fit !px-2', className)}
          {...props}
        >
          {asChild ? (
            children
          ) : (
            <>
              <ListFilterIcon className="size-4" />
              {!hasVisibleFilters && <span>{t('filter', locale)}</span>}
            </>
          )}
        </Comp>
      </DropdownMenu.Trigger>
    )
  },
)

FilterTrigger.displayName = 'FilterTrigger'

export { FilterTrigger }

export namespace FilterTrigger {
  export type Props = FilterTriggerProps
}
