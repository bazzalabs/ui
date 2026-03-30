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
import { type ComponentPropsWithoutRef, forwardRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useFilterItemContext } from '../../../components/item/filter-item'
import {
  useFilterActions,
  useFilterLocale,
} from '../../../components/root/filter-context'

export interface FilterOperatorProps<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> extends Omit<ComponentPropsWithoutRef<typeof Button>, 'onClick' | 'variant'> {
  column?: Column<TData, TType>
  filter?: FilterModel<TType>
  actions?: DataTableFilterActions
  locale?: Locale
}

function getOperators<TData, TType extends ColumnDataType>(
  column: Column<TData, TType>,
) {
  if (isTextColumn(column)) return textFilterOperators
  if (isOptionColumn(column)) return optionFilterOperators
  if (isMultiOptionColumn(column)) return multiOptionFilterOperators
  if (isDateColumn(column)) return dateFilterOperators
  if (isNumberColumn(column)) return numberFilterOperators
  if (isBooleanColumn(column)) return booleanFilterOperators
  return {}
}

/**
 * Displays and allows changing the filter operator (e.g., "is", "contains").
 * Renders a `<button>` element with a popover + cmdk list.
 */
export const FilterOperator = forwardRef<
  HTMLButtonElement,
  FilterOperatorProps
>(
  (
    {
      column: columnProp,
      filter: filterProp,
      actions: actionsProp,
      locale: localeProp,
      className,
      ...props
    },
    ref,
  ) => {
    const itemContext = useFilterItemContext()
    const filterActions = useFilterActions()
    const filterLocale = useFilterLocale()

    const column = columnProp ?? itemContext?.column
    const filter = filterProp ?? itemContext?.filter
    const actions = actionsProp ?? itemContext?.actions ?? filterActions
    const locale = localeProp ?? itemContext?.locale ?? filterLocale ?? 'en'

    const [open, setOpen] = useState(false)

    if (!column || !filter || !actions) {
      throw new Error(
        'FilterOperator requires column, filter, and actions props or must be used within FilterItem',
      )
    }

    const operators = getOperators(column) as Record<
      string,
      {
        key: string
        value: string
        target: string
        isNegated?: boolean
        negation?: string
        negationOf?: string
      }
    >
    const currentOperator = operators[filter.operator]
    const relatedOperators = Object.values(operators).filter(
      (operator) =>
        currentOperator && operator.target === currentOperator.target,
    )

    const operatorDetails = filterTypeOperatorDetails[column.type] as Record<
      string,
      { key: string }
    >
    const operator = operatorDetails[filter.operator]
    const label = operator ? t(operator.key, locale) : filter.operator

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            data-slot="filter-operator"
            data-column-type={column.type}
            data-operator={filter.operator}
            variant="ghost"
            className={cn(
              'm-0 w-fit whitespace-nowrap p-0 px-2 text-xs text-muted-foreground h-full rounded-none',
              className,
            )}
            onClick={(event) => {
              if (!isBooleanColumn(column)) {
                return
              }

              event.preventDefault()

              const details =
                filterTypeOperatorDetails.boolean[
                  filter.operator as 'is' | 'is not'
                ]
              const nextOperator = details.isNegated
                ? details.negationOf
                : details.negation

              if (nextOperator) {
                actions.setFilterOperator(column.id, nextOperator)
              }
            }}
            {...props}
          >
            <span>{label}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-fit min-w-[170px] p-0 origin-(--radix-popover-content-transform-origin)"
        >
          <Command loop>
            <CommandInput placeholder={t('search', locale)} />
            <CommandEmpty>{t('noresults', locale)}</CommandEmpty>
            <CommandList className="max-h-fit">
              <CommandGroup>
                {relatedOperators.map((relatedOperator) => {
                  const operatorLabel = t(relatedOperator.key, locale)

                  return (
                    <CommandItem
                      key={relatedOperator.value}
                      value={relatedOperator.value}
                      keywords={[operatorLabel]}
                      onSelect={() => {
                        actions.setFilterOperator(
                          column.id,
                          relatedOperator.value as any,
                        )
                        setOpen(false)
                      }}
                    >
                      {operatorLabel}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  },
)

FilterOperator.displayName = 'FilterOperator'

export namespace FilterOperator {
  export type Props<
    TData = unknown,
    TType extends ColumnDataType = ColumnDataType,
  > = FilterOperatorProps<TData, TType>
}
