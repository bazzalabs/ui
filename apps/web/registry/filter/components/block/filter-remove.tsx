'use client'

import type { DataTableFilterActions, FilterModel } from '@bazza-ui/filters'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFilterVariant } from '../root/filter-context'

const filterRemoveVariants = cva(
  'text-xs w-7 h-full text-muted-foreground hover:text-primary',
  {
    variants: {
      variant: {
        default: 'rounded-none rounded-r-2xl -translate-x-0.25',
        clean: 'rounded-md h-6 -ml-1',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface FilterRemoveProps
  extends Omit<ComponentPropsWithoutRef<typeof Button>, 'onClick' | 'variant'>,
    VariantProps<typeof filterRemoveVariants> {
  filter: FilterModel
  actions: DataTableFilterActions
}

/**
 * Button to remove a filter.
 * Renders a `<button>` element.
 *
 * Documentation: [Bazza UI Filter](https://bazza-ui.com/docs/components/filter)
 */
const FilterRemove = forwardRef<HTMLButtonElement, FilterRemoveProps>(
  ({ filter, actions, className, variant: variantProp, ...props }, ref) => {
    const contextVariant = useFilterVariant()
    const variant = variantProp ?? contextVariant ?? 'default'

    return (
      <Button
        ref={ref}
        data-slot="filter-remove"
        variant="ghost"
        className={cn(filterRemoveVariants({ variant }), className)}
        onClick={() => actions.removeFilter(filter.columnId)}
        {...props}
      >
        <X className="size-4" />
      </Button>
    )
  },
)

FilterRemove.displayName = 'FilterRemove'

export { FilterRemove, filterRemoveVariants }

export namespace FilterRemove {
  export type Props = FilterRemoveProps
}
