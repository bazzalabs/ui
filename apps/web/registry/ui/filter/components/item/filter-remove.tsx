'use client'

import type { DataTableFilterActions, FilterModel } from '@bazza-ui/filters'
import { X } from 'lucide-react'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFilterActions } from '../root/filter-context'
import { useFilterItemContext } from './filter-item'

export interface FilterRemoveProps
  extends Omit<ComponentPropsWithoutRef<typeof Button>, 'onClick' | 'variant'> {
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
export const FilterRemove = forwardRef<HTMLButtonElement, FilterRemoveProps>(
  ({ filter: filterProp, actions: actionsProp, className, ...props }, ref) => {
    const itemContext = useFilterItemContext()
    const filterActions = useFilterActions()

    const filter = filterProp ?? itemContext?.filter
    const actions = actionsProp ?? itemContext?.actions ?? filterActions

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
        className={cn(
          'text-xs w-7 h-full text-muted-foreground hover:text-primary rounded-none rounded-r-md',
          className,
        )}
        onClick={() => actions.removeFilter(filter.columnId)}
        {...props}
      >
        <X className="size-4" />
      </Button>
    )
  },
)

FilterRemove.displayName = 'FilterRemove'

export namespace FilterRemove {
  export type Props = FilterRemoveProps
}
