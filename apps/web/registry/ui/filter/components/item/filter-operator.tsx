'use client'

import type { MenuDef } from '@bazza-ui/dropdown-menu'
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
import { cva, type VariantProps } from 'class-variance-authority'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import { useFilterVariant } from '../root/filter-context'

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
  column: Column<TData, TType>
  filter: FilterModel<TType>
  actions: DataTableFilterActions
  locale?: Locale
}

function createOperatorMenu<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterOperatorProps<TData, TType>): MenuDef {
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

  return {
    id: `filter-operator-${column.id}`,
    hideSearchUntilActive: true,
    defaults: {
      item: {
        closeOnSelect: true,
      },
    },
    nodes: [
      {
        kind: 'group' as const,
        variant: 'radio' as const,
        id: 'operators',
        value: filter.operator,
        onValueChange: (value) => {
          actions.setFilterOperator(column.id, value as any)
        },
        nodes: relatedOperators.map((op: any) => ({
          kind: 'item' as const,
          variant: 'radio' as const,
          id: op.value,
          label: t(op.key, locale),
        })),
      },
    ],
  }
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
      column,
      filter,
      actions,
      locale = 'en',
      className,
      variant: variantProp,
      ...props
    },
    ref,
  ) => {
    const contextVariant = useFilterVariant()
    const variant = variantProp ?? contextVariant ?? 'default'
    const menu = createOperatorMenu({ filter, column, actions, locale })

    const operatorDetails = filterTypeOperatorDetails[column.type] as Record<
      string,
      { key: string }
    >
    const operator = operatorDetails[filter.operator]
    const label = operator ? t(operator.key, locale) : filter.operator

    return (
      <DropdownMenu menu={menu} trackAnchor={false}>
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
        >
          <span>{label}</span>
        </Button>
      </DropdownMenu>
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
