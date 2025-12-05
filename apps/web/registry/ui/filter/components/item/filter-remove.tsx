'use client'

import type { DataTableFilterActions, FilterModel } from '@bazza-ui/filters'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFilterActions, useFilterVariant } from '../root/filter-context'
import { useFilterItemContext } from './filter-item'

const filterRemoveVariants = cva(
  'text-xs w-7 h-full text-muted-foreground hover:text-primary',
  {
    variants: {
      variant: {
        default: 'rounded-none rounded-r-md',
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
  /** The current filter state. If omitted, will be read from FilterItem context. */
  filter?: FilterModel
  /** Filter actions. If omitted, will be read from FilterItem or Filter context. */
  actions?: DataTableFilterActions
}

/**
 * Button to remove a filter.
 * Renders a `<button>` element.
 *
 * Documentation: [Bazza UI Filter](https://bazza-ui.com/docs/components/filter)
 */
const FilterRemove = forwardRef<HTMLButtonElement, FilterRemoveProps>(
  (
    {
      filter: filterProp,
      actions: actionsProp,
      className,
      variant: variantProp,
      ...props
    },
    ref,
  ) => {
    const itemContext = useFilterItemContext()
    const filterActions = useFilterActions()
    const contextVariant = useFilterVariant()

    const filter = filterProp ?? itemContext?.filter
    const actions = actionsProp ?? itemContext?.actions ?? filterActions
    const variant = variantProp ?? contextVariant ?? 'default'

    if (!filter || !actions) {
      throw new Error(
        'FilterRemove requires filter and actions props or must be used within FilterItem',
      )
    }

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
