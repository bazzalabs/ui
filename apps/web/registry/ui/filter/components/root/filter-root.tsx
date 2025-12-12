'use client'

import { type ComponentPropsWithoutRef, forwardRef, type Ref } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

export interface FilterRootProps extends ComponentPropsWithoutRef<'div'> {
  ref?: Ref<HTMLDivElement>
}

/**
 * Layout container for filter components.
 * Must be wrapped with `Filter.Provider` to access filter context.
 * Renders a `<div>` element.
 *
 * Documentation: [Bazza UI Filter](https://bazza-ui.com/docs/components/filter)
 */
function FilterRootImpl(
  { children, className, ...props }: FilterRootProps,
  ref: Ref<HTMLDivElement>,
) {
  const isMobile = useIsMobile()

  return (
    <div
      ref={ref}
      data-slot="filter-root"
      data-mobile={isMobile}
      className={cn('flex w-full items-start justify-between gap-2', className)}
      {...props}
    >
      {children}
    </div>
  )
}

FilterRootImpl.displayName = 'FilterRoot'

/**
 * Layout container for filter components.
 * Must be wrapped with `Filter.Provider` to access filter context.
 * Renders a `<div>` element.
 *
 * Documentation: [Bazza UI Filter](https://bazza-ui.com/docs/components/filter)
 */
const FilterRoot = forwardRef(FilterRootImpl)

export { FilterRoot }

export namespace FilterRoot {
  export type Props = FilterRootProps
}
