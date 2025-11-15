import type { MenuDef } from '@bazza-ui/action-menu'
import {
  booleanFilterOperators,
  type Column,
  type ColumnDataType,
  type DataTableFilterActions,
  dateFilterOperators,
  type FilterModel,
  type FilterOperators,
  filterTypeOperatorDetails,
  type Locale,
  multiOptionFilterOperators,
  numberFilterOperators,
  optionFilterOperators,
  t,
  textFilterOperators,
} from '@bazza-ui/filters'
import type { ComponentPropsWithoutRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ActionMenu } from '@/registry/action-menu'

interface FilterOperatorProps<TData, TType extends ColumnDataType>
  extends Omit<ComponentPropsWithoutRef<typeof Button>, 'onClick'> {
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
    switch (column.type) {
      case 'option':
        return optionFilterOperators
      case 'multiOption':
        return multiOptionFilterOperators
      case 'date':
        return dateFilterOperators
      case 'text':
        return textFilterOperators
      case 'number':
        return numberFilterOperators
      case 'boolean':
        return booleanFilterOperators
      default:
        return {}
    }
  }

  const operators = getOperators() as Record<string, any>
  const currentOperator = operators[filter.operator]
  const relatedOperators = Object.values(operators).filter(
    (o: any) => currentOperator && o.target === currentOperator.target,
  )

  return {
    id: `filter-operator-${column.id}`,
    hideSearchUntilActive: true,
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

// Renders the filter operator display and menu for a given column filter
// The filter operator display is the label and icon for the filter operator
// The filter operator menu is the dropdown menu for the filter operator
export function FilterOperator<TData, TType extends ColumnDataType>({
  column,
  filter,
  actions,
  locale = 'en',
  className,
  variant = 'ghost',
  ...props
}: FilterOperatorProps<TData, TType>) {
  const menu = createOperatorMenu({ filter, column, actions, locale })

  return (
    <ActionMenu menu={menu}>
      <ActionMenu.Trigger asChild>
        <Button
          data-slot="filter-operator"
          data-column-type={column.type}
          data-operator={filter.operator}
          variant={variant}
          className={cn(
            'm-0 h-full w-fit whitespace-nowrap rounded-none p-0 px-2 text-xs',
            variant === 'ghost' ? 'text-muted-foreground' : '',
            className,
          )}
          onClick={(e) => {
            if (column.type !== 'boolean') return
            e.preventDefault()
            const opDetails =
              filterTypeOperatorDetails.boolean[
                filter.operator as FilterOperators['boolean']
              ]

            actions.setFilterOperator(
              column.id,
              opDetails.isNegated ? opDetails.negationOf : opDetails.negation,
            )
          }}
          {...props}
        >
          <FilterOperatorDisplay
            filter={filter}
            columnType={column.type}
            locale={locale}
          />
        </Button>
      </ActionMenu.Trigger>
    </ActionMenu>
  )
}

interface FilterOperatorDisplayProps<TType extends ColumnDataType> {
  filter: FilterModel<TType>
  columnType: TType
  locale?: Locale
}

export function FilterOperatorDisplay<TType extends ColumnDataType>({
  filter,
  columnType,
  locale = 'en',
}: FilterOperatorDisplayProps<TType>) {
  const operator = filterTypeOperatorDetails[columnType][filter.operator]
  const label = t(operator.key, locale)

  return <span>{label}</span>
}
