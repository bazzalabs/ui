'use client'

import { getOperatorSet } from '@bazza-ui/data-view'
import type {
  Column,
  ColumnDataType,
  FilterModel,
  Locale,
  ViewLayer,
} from '@bazza-ui/data-view/react'
import type {
  NodeDef,
  RadioGroupDef,
  RadioGroupRenderParams,
  RadioItemDef,
  RadioItemRenderParams,
} from '@bazza-ui/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { type ComponentPropsWithoutRef, forwardRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DropdownMenu, LabelWithBreadcrumbs } from '@/registry/ui/dropdown-menu'
import {
  useDataViewLayer,
  useDataViewLocale,
  useDataViewVariant,
} from '../root/data-view-context'
import { useFilterItemContext } from './filter-item'

const filterOperatorVariants = cva(
  'm-0 w-fit whitespace-nowrap p-0 px-2 text-xs text-muted-foreground',
  {
    variants: {
      variant: {
        default: 'h-full rounded-none',
        clean:
          'border-none h-6 rounded-md shadow-xs bg-background hover:bg-background aria-expanded:bg-background aria-expanded:text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface FilterOperatorProps<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> extends Omit<ComponentPropsWithoutRef<typeof Button>, 'onClick' | 'variant'>,
    VariantProps<typeof filterOperatorVariants> {
  /** The column configuration. If omitted, will be read from FilterItem context. */
  column?: Column<TData, TType>
  /** The current filter state. If omitted, will be read from FilterItem context. */
  filter?: FilterModel<TType>
  /** View layer. If omitted, will be read from FilterItem or DataView context. */
  layer?: ViewLayer<TData>
  locale?: Locale
}

interface CreateOperatorNodesParams<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  layer: ViewLayer<TData>
}

function createOperatorNodes<TData, TType extends ColumnDataType>({
  filter,
  column,
  layer,
}: CreateOperatorNodesParams<TData, TType>): NodeDef[] {
  const operatorSet = getOperatorSet(column)
  const currentOp = operatorSet.has(filter.operator)
    ? operatorSet.get(filter.operator)
    : undefined

  // Get related operators (same target as current)
  const relatedOps = currentOp
    ? operatorSet.all().filter((op) => op.target === currentOp.target)
    : operatorSet.all()

  const radioGroup: RadioGroupDef = {
    kind: 'radio-group',
    id: 'operators',
    value: filter.operator,
    onValueChange: (value) => {
      layer.setFilterOperator(column.id, value)
    },
    render: ({ props, children }: RadioGroupRenderParams) => (
      <DropdownMenu.RadioGroup
        value={props.value}
        onValueChange={props.onValueChange}
      >
        {children}
      </DropdownMenu.RadioGroup>
    ),
    nodes: relatedOps.map((op, index): RadioItemDef => {
      const operatorLabel = op.label
      const shortcut = index < 9 ? String(index + 1) : undefined
      return {
        kind: 'radio-item',
        value: op.id,
        keywords: [operatorLabel],
        shortcut,
        closeOnClick: true,
        render: ({ props }: RadioItemRenderParams) => {
          return (
            <DropdownMenu.RadioItem
              {...props}
              className="justify-between gap-4"
              data-keywords={operatorLabel}
            >
              <LabelWithBreadcrumbs label={operatorLabel} />
              <div className="flex items-center gap-4">
                <DropdownMenu.RadioItemIndicator
                  keepMounted
                  className="invisible group-aria-checked/row:visible"
                />
                <DropdownMenu.Shortcut />
              </div>
            </DropdownMenu.RadioItem>
          )
        },
      }
    }),
  }

  return [radioGroup]
}

/**
 * Displays and allows changing the filter operator (e.g., "is", "contains").
 * Renders a `<button>` element with a dropdown menu.
 *
 * Documentation: [Bazza UI DataView](https://bazza-ui.com/docs/components/data-view)
 */
const FilterOperator = forwardRef<HTMLButtonElement, FilterOperatorProps>(
  (
    {
      column: columnProp,
      filter: filterProp,
      layer: layerProp,
      locale: localeProp,
      className,
      variant: variantProp,
      ...props
    },
    ref,
  ) => {
    const itemContext = useFilterItemContext()
    const dataViewLayer = useDataViewLayer()
    const dataViewLocale = useDataViewLocale()
    const contextVariant = useDataViewVariant()

    const column = columnProp ?? itemContext?.column
    const filter = filterProp ?? itemContext?.filter
    const layer = layerProp ?? itemContext?.layer ?? dataViewLayer
    const locale = localeProp ?? itemContext?.locale ?? dataViewLocale ?? 'en'
    const variant = variantProp ?? contextVariant ?? 'default'

    if (!column || !filter || !layer) {
      throw new Error(
        'FilterOperator requires column, filter, and layer props or must be used within FilterItem',
      )
    }

    // Memoize nodes to avoid recreating on every render
    const nodes = useMemo(
      () => createOperatorNodes({ filter, column, layer }),
      [filter.operator, column.id, layer],
    )

    // Get the current operator label from the operator set
    const operatorSet = getOperatorSet(column)
    const label = operatorSet.has(filter.operator)
      ? operatorSet.get(filter.operator).label
      : filter.operator

    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          render={
            <Button
              ref={ref}
              data-slot="filter-operator"
              data-column-type={column.type}
              data-operator={filter.operator}
              variant="ghost"
              className={cn(
                filterOperatorVariants({ variant }),
                variant === 'default' ? 'text-muted-foreground' : '',
                className,
              )}
              {...props}
            />
          }
        >
          <span>{label}</span>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner align="start">
            <DropdownMenu.Popup className="w-full min-w-[150px]">
              <DropdownMenu.DataSurface content={nodes}>
                <DropdownMenu.DataInput hideUntilActive />
                <DropdownMenu.DataList>
                  {({ nodes: displayNodes, renderNode }) => (
                    <>
                      {displayNodes.map(renderNode)}
                      <DropdownMenu.Empty />
                    </>
                  )}
                </DropdownMenu.DataList>
              </DropdownMenu.DataSurface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  },
)

FilterOperator.displayName = 'FilterOperator'

export { FilterOperator, filterOperatorVariants }

export namespace FilterOperator {
  export type Props<
    TData = unknown,
    TType extends ColumnDataType = ColumnDataType,
  > = FilterOperatorProps<TData, TType>
}
