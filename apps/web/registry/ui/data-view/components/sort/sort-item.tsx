'use client'

import type { Column, SortRule, ViewLayer } from '@bazza-ui/data-view/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowDownIcon, ArrowUpIcon, X } from 'lucide-react'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useDataViewContext,
  useDataViewVariant,
} from '../root/data-view-context'

const sortItemVariants = cva(
  'flex items-center gap-1 text-xs font-medium h-7 pr-1',
  {
    variants: {
      variant: {
        default: 'rounded-md border border-border bg-background shadow-xs',
        clean: 'rounded-md bg-accent border-none shadow-none',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface SortItemProps<TData = unknown>
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>,
    VariantProps<typeof sortItemVariants> {
  rule: SortRule
  column?: Column<TData>
  layer?: ViewLayer<TData>
}

/**
 * Displays a single sort rule as a badge/chip with direction arrow and remove button.
 * Renders a `<div>` element.
 */
const SortItem = forwardRef<HTMLDivElement, SortItemProps>(
  (
    {
      rule,
      column: columnProp,
      layer: layerProp,
      className,
      variant: variantProp,
      ...props
    },
    ref,
  ) => {
    const context = useDataViewContext()
    const contextVariant = useDataViewVariant()
    const variant = variantProp ?? contextVariant ?? 'default'
    const layer = layerProp ?? context.layer

    // Resolve column from context if not provided
    const column =
      columnProp ??
      (rule.type === 'column'
        ? context.columns.find((c) => c.id === rule.columnId)
        : undefined)

    const displayName =
      rule.type === 'column' ? (column?.displayName ?? rule.columnId) : rule.id

    const direction = rule.type === 'column' ? rule.direction : undefined

    function handleRemove() {
      if (rule.type === 'column') {
        // Toggle off the current sort direction
        layer.toggleColumnSort(rule.columnId)
      } else {
        layer.setCustomSort(rule.id, false)
      }
    }

    return (
      <div
        ref={ref}
        data-slot="sort-item"
        className={cn(sortItemVariants({ variant }), className)}
        {...props}
      >
        <span className="flex items-center gap-1 px-2">
          {direction === 'asc' ? (
            <ArrowUpIcon className="size-3" />
          ) : direction === 'desc' ? (
            <ArrowDownIcon className="size-3" />
          ) : null}
          <span>{displayName}</span>
        </span>
        <Button
          variant="ghost"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-primary rounded-sm"
          onClick={handleRemove}
        >
          <X className="size-3" />
        </Button>
      </div>
    )
  },
)

SortItem.displayName = 'SortItem'

export { SortItem, sortItemVariants }

export namespace SortItem {
  export type Props<TData = unknown> = SortItemProps<TData>
}
