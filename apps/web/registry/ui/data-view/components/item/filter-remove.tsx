'use client'

import type { FilterModel, ViewLayer } from '@bazza-ui/data-view/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDataViewLayer, useDataViewVariant } from '../root/data-view-context'
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
  /** View layer. If omitted, will be read from FilterItem or DataView context. */
  layer?: ViewLayer<any>
}

/**
 * Button to remove a filter.
 * Renders a `<button>` element.
 *
 * Documentation: [Bazza UI DataView](https://bazza-ui.com/docs/components/data-view)
 */
const FilterRemove = forwardRef<HTMLButtonElement, FilterRemoveProps>(
  (
    {
      filter: filterProp,
      layer: layerProp,
      className,
      variant: variantProp,
      ...props
    },
    ref,
  ) => {
    const itemContext = useFilterItemContext()
    const dataViewLayer = useDataViewLayer()
    const contextVariant = useDataViewVariant()

    const filter = filterProp ?? itemContext?.filter
    const layer = layerProp ?? itemContext?.layer ?? dataViewLayer
    const variant = variantProp ?? contextVariant ?? 'default'

    if (!filter || !layer) {
      throw new Error(
        'FilterRemove requires filter and layer props or must be used within FilterItem',
      )
    }

    return (
      <Button
        ref={ref}
        data-slot="filter-remove"
        variant="ghost"
        className={cn(filterRemoveVariants({ variant }), className)}
        onClick={() => layer.removeFilter(filter.columnId)}
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
