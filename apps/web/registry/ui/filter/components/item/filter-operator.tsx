'use client'

import {
  booleanFilterOperators,
  type Column,
  type ColumnDataType,
  type DataTableFilterActions,
  dateFilterOperators,
  type FilterModel,
  filterTypeOperatorDetails,
  isBooleanColumn,
  isDateColumn,
  isMultiOptionColumn,
  isNumberColumn,
  isOptionColumn,
  isTextColumn,
  type Locale,
  multiOptionFilterOperators,
  numberFilterOperators,
  optionFilterOperators,
  t,
  textFilterOperators,
} from '@bazza-ui/filters'
import type {
  ItemDef,
  ItemRenderParams,
  NodeDef,
  RadioGroupDef,
  RadioGroupRenderParams,
} from '@bazza-ui/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { type ComponentPropsWithoutRef, forwardRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import {
  useFilterActions,
  useFilterLocale,
  useFilterVariant,
} from '../root/filter-context'
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
  /** Filter actions. If omitted, will be read from FilterItem or Filter context. */
  actions?: DataTableFilterActions
  locale?: Locale
}

interface CreateOperatorNodesParams<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  locale: Locale
}

function createOperatorNodes<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  locale,
}: CreateOperatorNodesParams<TData, TType>): NodeDef[] {
  const getOperators = () => {
    if (isTextColumn(column)) return textFilterOperators
    if (isOptionColumn(column)) return optionFilterOperators
    if (isMultiOptionColumn(column)) return multiOptionFilterOperators
    if (isDateColumn(column)) return dateFilterOperators
    if (isNumberColumn(column)) return numberFilterOperators
    if (isBooleanColumn(column)) return booleanFilterOperators
    return {}
  }

  const operators = getOperators() as Record<string, any>
  const currentOperator = operators[filter.operator]
  const relatedOperators = Object.values(operators).filter(
    (o: any) => currentOperator && o.target === currentOperator.target,
  )

  const radioGroup: RadioGroupDef = {
    kind: 'radio-group',
    id: 'operators',
    value: filter.operator,
    onValueChange: (value) => {
      actions.setFilterOperator(column.id, value as any)
    },
    // Wrap children in RadioGroup to provide context for RadioItem
    render: ({ props, children }: RadioGroupRenderParams) => (
      <DropdownMenu.RadioGroup
        value={props.value}
        onValueChange={props.onValueChange}
      >
        {children}
      </DropdownMenu.RadioGroup>
    ),
    nodes: relatedOperators.map((op: any, index: number): ItemDef => {
      const operatorLabel = t(op.key, locale)
      // Only assign shortcuts 1-9 to first 9 operators
      const shortcut = index < 9 ? String(index + 1) : undefined
      return {
        kind: 'item',
        id: op.value,
        value: operatorLabel,
        shortcut,
        closeOnSelect: true,
        render: ({ props }: ItemRenderParams) => (
          <DropdownMenu.RadioItem
            {...props}
            shortcut={`${shortcut}`}
            value={props.value!}
            className="flex items-center gap-4"
          >
            <span className="flex-1">{operatorLabel}</span>
            <DropdownMenu.RadioItemIndicator
              keepMounted
              className="invisible group-aria-checked/row:visible"
            />
            <DropdownMenu.Shortcut />
          </DropdownMenu.RadioItem>
        ),
      }
    }),
  }

  return [radioGroup]
}

/**
 * Displays and allows changing the filter operator (e.g., "is", "contains").
 * Renders a `<button>` element with a dropdown menu.
 *
 * Documentation: [Bazza UI Filter](https://bazza-ui.com/docs/components/filter)
 */
const FilterOperator = forwardRef<HTMLButtonElement, FilterOperatorProps>(
  (
    {
      column: columnProp,
      filter: filterProp,
      actions: actionsProp,
      locale: localeProp,
      className,
      variant: variantProp,
      ...props
    },
    ref,
  ) => {
    const itemContext = useFilterItemContext()
    const filterActions = useFilterActions()
    const filterLocale = useFilterLocale()
    const contextVariant = useFilterVariant()

    const column = columnProp ?? itemContext?.column
    const filter = filterProp ?? itemContext?.filter
    const actions = actionsProp ?? itemContext?.actions ?? filterActions
    const locale = localeProp ?? itemContext?.locale ?? filterLocale ?? 'en'
    const variant = variantProp ?? contextVariant ?? 'default'

    if (!column || !filter || !actions) {
      throw new Error(
        'FilterOperator requires column, filter, and actions props or must be used within FilterItem',
      )
    }

    // Memoize nodes to avoid recreating on every render
    const nodes = useMemo(
      () => createOperatorNodes({ filter, column, actions, locale }),
      [filter.operator, column.id, actions, locale],
    )

    const operatorDetails = filterTypeOperatorDetails[column.type] as Record<
      string,
      { key: string }
    >
    const operator = operatorDetails[filter.operator]
    const label = operator ? t(operator.key, locale) : filter.operator

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
