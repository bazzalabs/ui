import type { MenuData } from '@bazza-ui/action-menu'
import {
  booleanFilterOperators,
  type Column,
  type ColumnDataType,
  type DataTableFilterActions,
  dateFilterOperators,
  type FilterModel,
  type FilterOperatorDetails,
  type FilterOperators,
  filterTypeOperatorDetails,
  type Locale,
  multiOptionFilterOperators,
  numberFilterOperators,
  optionFilterOperators,
  t,
  textFilterOperators,
} from '@bazzaui/filters'
import { useState } from 'react'
import { ActionMenu } from '@/components/ui/action-menu'
import { Button } from '@/components/ui/button'

interface FilterOperatorProps<TData, TType extends ColumnDataType> {
  column: Column<TData, TType>
  filter: FilterModel<TType>
  actions: DataTableFilterActions
  locale?: Locale
}

// Renders the filter operator display and menu for a given column filter
// The filter operator display is the label and icon for the filter operator
// The filter operator menu is the dropdown menu for the filter operator
export function FilterOperator<TData, TType extends ColumnDataType>({
  column,
  filter,
  actions,
  locale = 'en',
}: FilterOperatorProps<TData, TType>) {
  const [open, setOpen] = useState<boolean>(false)

  const close = () => setOpen(false)

  const menu = createOperatorMenu({
    filter,
    column,
    actions,
    closeController: close,
    locale,
  })

  return (
    <ActionMenu.Root open={open} onOpenChange={setOpen}>
      <ActionMenu.Trigger asChild>
        <Button
          variant="ghost"
          className="m-0 h-full w-fit whitespace-nowrap rounded-none p-0 px-2 text-xs"
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
        >
          <FilterOperatorDisplay
            filter={filter}
            columnType={column.type}
            locale={locale}
          />
        </Button>
      </ActionMenu.Trigger>
      <ActionMenu.Positioner>
        <ActionMenu.Content
          menu={menu}
          classNames={{ list: 'min-w-[100px]' }}
        />
      </ActionMenu.Positioner>
    </ActionMenu.Root>
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

  return <span className="text-muted-foreground">{label}</span>
}

interface FilterOperatorControllerProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  closeController: () => void
  locale?: Locale
}

function createOperatorMenu<TData>({
  filter,
  column,
  actions,
  closeController,
  locale = 'en',
}: FilterOperatorControllerProps<TData, ColumnDataType>) {
  const filterOperators =
    column.type === 'option'
      ? optionFilterOperators
      : column.type === 'multiOption'
        ? multiOptionFilterOperators
        : column.type === 'date'
          ? dateFilterOperators
          : column.type === 'text'
            ? textFilterOperators
            : column.type === 'number'
              ? numberFilterOperators
              : column.type === 'boolean'
                ? booleanFilterOperators
                : null

  if (!filterOperators)
    throw new Error('Unexpected column type -- did not find filter operators.')

  // @ts-expect-error
  const filterDetails = filterOperators![
    filter.operator
  ] as FilterOperatorDetails<any, any>

  const relatedFilters = Object.values(filterOperators).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(column.id, value as FilterOperators['option'])
    closeController()
  }

  return {
    id: 'root',
    title: 'Operators',
    inputPlaceholder: 'Operators...',
    hideSearchUntilActive: true,
    nodes: relatedFilters.map((r) => {
      return {
        kind: 'item',
        id: r.value,
        keywords: [t(r.key, locale)],
        label: t(r.key, locale),
        data: { label: t(r.key, locale) },
        onSelect: () => changeOperator(r.value),
      }
    }),
  } satisfies MenuData<any>
}
