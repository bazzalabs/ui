'use client'

import type {
  Column,
  ColumnDataType,
  ColumnOptionExtended,
  DataTableFilterActions,
  FilterModel,
  FilterStrategy,
  Locale,
} from '@bazza-ui/filters'
import {
  isBooleanColumn,
  isBooleanFilter,
  isDateColumn,
  isDateFilter,
  isMultiOptionColumn,
  isMultiOptionFilter,
  isNumberColumn,
  isNumberFilter,
  isOptionColumn,
  isOptionFilter,
  isTextColumn,
  isTextFilter,
  t,
  take,
} from '@bazza-ui/filters'
import { format } from 'date-fns'
import { Ellipsis } from 'lucide-react'
import type * as React from 'react'
import {
  cloneElement,
  forwardRef,
  isValidElement,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useFilterItemContext } from '../../../components/item/filter-item'
import {
  useFilterActions,
  useFilterEntityName,
  useFilterLocale,
  useFilterStrategy,
} from '../../../components/root/filter-context'
import { FilterValueDateController } from '../../../components/value/filter-value-date-controller'
import { FilterValueNumberController } from '../../../components/value/filter-value-number-controller'
import { DebouncedInput } from '../../../ui/debounced-input'

type ScalarValue = string | number | bigint | boolean | Date

export interface FilterValueProps<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> {
  filter?: FilterModel<TType>
  column?: Column<TData, TType>
  actions?: DataTableFilterActions
  strategy?: FilterStrategy
  locale?: Locale
  entityName?: string
  className?: string
}

interface FilterValueControllerInput<TData, TType extends ColumnDataType> {
  filter?: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
  initialValues?: ScalarValue[]
}

/**
 * Displays and allows editing the filter value.
 * Renders a `<button>` element with a popover + cmdk controller.
 */
export const FilterValue = forwardRef<HTMLButtonElement, FilterValueProps>(
  (
    {
      filter: filterProp,
      column: columnProp,
      actions: actionsProp,
      strategy: strategyProp,
      locale: localeProp,
      entityName: entityNameProp,
      className,
    },
    ref,
  ) => {
    const itemContext = useFilterItemContext()
    const filterActions = useFilterActions()
    const filterStrategy = useFilterStrategy()
    const filterLocale = useFilterLocale()
    const filterEntityName = useFilterEntityName()

    const filter = filterProp ?? itemContext?.filter
    const column = columnProp ?? itemContext?.column
    const actions = actionsProp ?? itemContext?.actions ?? filterActions
    const strategy = strategyProp ?? itemContext?.strategy ?? filterStrategy
    const locale = localeProp ?? itemContext?.locale ?? filterLocale ?? 'en'
    const entityName =
      entityNameProp ?? itemContext?.entityName ?? filterEntityName

    if (!filter || !column || !actions || !strategy) {
      throw new Error(
        'FilterValue requires filter, column, actions, and strategy props or must be used within FilterItem',
      )
    }

    const resolvedFilter = filter
    const resolvedColumn = column
    const resolvedActions = actions
    const resolvedStrategy = strategy

    const [open, setOpen] = useState(false)
    const initialFilterValuesRef = useRef<ScalarValue[]>([])

    function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
      if (isBooleanColumn(resolvedColumn)) {
        event.preventDefault()
      }
    }

    if (isBooleanColumn(resolvedColumn)) {
      return (
        <div
          data-slot="filter-value"
          data-column-type={resolvedColumn.type}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'm-0 w-fit whitespace-nowrap p-0 px-2 text-xs h-full rounded-none',
            'text-primary/75 hover:bg-inherit hover:text-primary/75 hover:shadow-none',
            className,
          )}
        >
          <FilterValueDisplay
            filter={resolvedFilter}
            column={resolvedColumn}
            locale={locale}
            entityName={entityName}
          />
        </div>
      )
    }

    return (
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            initialFilterValuesRef.current = resolvedFilter.values
          }

          setOpen(nextOpen)
        }}
      >
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            data-slot="filter-value"
            data-column-type={resolvedColumn.type}
            variant="ghost"
            className={cn(
              'm-0 w-fit whitespace-nowrap p-0 px-2 text-xs h-full rounded-none',
              className,
            )}
            onClick={handleClick}
          >
            <FilterValueDisplay
              filter={resolvedFilter}
              column={resolvedColumn}
              locale={locale}
              entityName={entityName}
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          className="w-fit p-0 origin-(--radix-popover-content-transform-origin)"
        >
          <FilterValueController
            filter={resolvedFilter}
            column={resolvedColumn}
            actions={resolvedActions}
            strategy={resolvedStrategy}
            locale={locale}
            initialValues={initialFilterValuesRef.current}
          />
        </PopoverContent>
      </Popover>
    )
  },
)

FilterValue.displayName = 'FilterValue'

export function FilterValueController<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  strategy,
  locale = 'en',
  initialValues = [],
}: FilterValueControllerInput<TData, TType>) {
  switch (column.type) {
    case 'option':
      return (
        <FilterValueOptionController
          filter={filter as FilterModel<'option'> | undefined}
          column={column as Column<TData, 'option'>}
          actions={actions}
          strategy={strategy}
          locale={locale}
          initialValues={initialValues}
        />
      )
    case 'multiOption':
      return (
        <FilterValueMultiOptionController
          filter={filter as FilterModel<'multiOption'> | undefined}
          column={column as Column<TData, 'multiOption'>}
          actions={actions}
          strategy={strategy}
          locale={locale}
          initialValues={initialValues}
        />
      )
    case 'date':
      return (
        <FilterValueDateController
          filter={filter as FilterModel<'date'>}
          column={column as Column<TData, 'date'>}
          actions={actions}
          strategy={strategy}
          locale={locale}
        />
      )
    case 'text':
      return (
        <FilterValueTextController
          filter={filter as FilterModel<'text'> | undefined}
          column={column as Column<TData, 'text'>}
          actions={actions}
          strategy={strategy}
          locale={locale}
        />
      )
    case 'number':
      return (
        <FilterValueNumberController
          filter={filter as FilterModel<'number'>}
          column={column as Column<TData, 'number'>}
          actions={actions}
          strategy={strategy}
          locale={locale}
        />
      )
    default:
      return null
  }
}

interface OptionItemProps {
  option: ColumnOptionExtended & {
    selected: boolean
  }
  onToggle: (value: string, checked: boolean) => void
}

const OptionItem = memo(function OptionItem({
  option,
  onToggle,
}: OptionItemProps) {
  const { value, label, icon: Icon, selected, count } = option

  const handleSelect = useCallback(() => {
    onToggle(value as string, !selected)
  }, [onToggle, value, selected])

  return (
    <CommandItem
      value={`${label} ${String(value)}`}
      keywords={[String(value), String(label)]}
      onSelect={handleSelect}
      className="group flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <Checkbox
          checked={selected}
          className="opacity-0 data-[state=checked]:opacity-100 group-data-[selected=true]:opacity-100 dark:border-ring mr-1 shrink-0"
        />

        <div className="shrink-0">
          {Icon &&
            (isValidElement(Icon) ? (
              Icon
            ) : (
              <Icon className="size-4 text-primary" />
            ))}
        </div>

        <span className="overflow-ellipsis whitespace-nowrap overflow-x-hidden">
          {label}
        </span>
      </div>

      {count && (
        <span className="tabular-nums text-muted-foreground tracking-tight text-xs">
          {new Intl.NumberFormat().format(count)}
        </span>
      )}
    </CommandItem>
  )
})

interface SelectableControllerProps<
  TData,
  TType extends 'option' | 'multiOption',
> {
  filter?: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
  initialValues?: ScalarValue[]
}

function FilterValueSelectableController<
  TData,
  TType extends 'option' | 'multiOption',
>({
  filter,
  column,
  actions,
  locale = 'en',
  initialValues = [],
}: SelectableControllerProps<TData, TType>) {
  const initialSelectedValuesRef = useRef(
    new Set(
      (initialValues.length > 0
        ? initialValues
        : ((filter?.values as
            | Array<string | number | bigint | boolean>
            | undefined) ?? [])
      ).map((value) => String(value)),
    ),
  )

  const initialSelectedValues = initialSelectedValuesRef.current

  const { selectedOptions, unselectedOptions } = useMemo(() => {
    const counts = column.getFacetedUniqueValues()

    const allOptions = column.getOptions().map((option) => {
      const optionValue = String(option.value)

      return {
        ...option,
        value: optionValue,
        selected: filter?.values.includes(option.value as any) ?? false,
        count: counts?.get(optionValue) ?? 0,
      }
    })

    const selected = allOptions.filter((option) =>
      initialSelectedValues.has(String(option.value)),
    )

    const unselected = allOptions.filter(
      (option) => !initialSelectedValues.has(String(option.value)),
    )

    return {
      selectedOptions: selected,
      unselectedOptions: unselected,
    }
  }, [column, filter?.values, initialSelectedValues])

  const handleToggle = useCallback(
    (value: string, checked: boolean) => {
      if (checked) {
        actions.addFilterValue(column as Column<TData, 'option'>, [value])
        return
      }

      actions.removeFilterValue(column as Column<TData, 'option'>, [value])
    },
    [actions, column],
  )

  return (
    <Command className="max-w-[300px]" loop>
      <CommandInput
        autoFocus
        placeholder={`Search ${column.displayName.toLowerCase()}...`}
      />
      <CommandEmpty>{t('noresults', locale)}</CommandEmpty>

      <CommandList>
        <CommandGroup className={cn(selectedOptions.length === 0 && 'hidden')}>
          {selectedOptions.map((option) => (
            <OptionItem
              key={option.value}
              option={option}
              onToggle={handleToggle}
            />
          ))}
        </CommandGroup>

        <CommandSeparator
          className={cn(
            (unselectedOptions.length === 0 || selectedOptions.length === 0) &&
              'hidden',
          )}
        />

        <CommandGroup
          className={cn(unselectedOptions.length === 0 && 'hidden')}
        >
          {unselectedOptions.map((option) => (
            <OptionItem
              key={option.value}
              option={option}
              onToggle={handleToggle}
            />
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

function FilterValueOptionController<TData>({
  filter,
  column,
  actions,
  strategy,
  locale,
  initialValues,
}: SelectableControllerProps<TData, 'option'>) {
  return (
    <FilterValueSelectableController
      filter={filter}
      column={column}
      actions={actions}
      strategy={strategy}
      locale={locale}
      initialValues={initialValues}
    />
  )
}

function FilterValueMultiOptionController<TData>({
  filter,
  column,
  actions,
  strategy,
  locale,
  initialValues,
}: SelectableControllerProps<TData, 'multiOption'>) {
  return (
    <FilterValueSelectableController
      filter={filter}
      column={column}
      actions={actions}
      strategy={strategy}
      locale={locale}
      initialValues={initialValues}
    />
  )
}

function FilterValueTextController<TData>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueControllerInput<TData, 'text'>) {
  const changeText = (value: string | number) => {
    actions.setFilterValue(column, [String(value)])
  }

  return (
    <Command>
      <CommandList className="max-h-fit">
        <CommandGroup>
          <CommandItem>
            <DebouncedInput
              placeholder={t('search', locale)}
              autoFocus
              value={filter?.values[0] ?? ''}
              onChange={changeText}
            />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export interface FilterValueDisplayProps<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  locale?: Locale
  entityName?: string
}

export function FilterValueDisplay<TData, TType extends ColumnDataType>({
  filter,
  column,
  locale = 'en',
}: FilterValueDisplayProps<TData, TType>) {
  if (isOptionColumn(column) && isOptionFilter(filter)) {
    return (
      <FilterValueSelectableDisplay
        filter={filter}
        column={column as Column<unknown, 'option'>}
      />
    )
  }

  if (isMultiOptionColumn(column) && isMultiOptionFilter(filter)) {
    return (
      <FilterValueSelectableDisplay
        filter={filter}
        column={column as Column<unknown, 'multiOption'>}
      />
    )
  }

  if (isDateColumn(column) && isDateFilter(filter)) {
    return <FilterValueDateDisplay filter={filter} />
  }

  if (isTextColumn(column) && isTextFilter(filter)) {
    return <FilterValueTextDisplay filter={filter} />
  }

  if (isNumberColumn(column) && isNumberFilter(filter)) {
    return <FilterValueNumberDisplay filter={filter} locale={locale} />
  }

  if (isBooleanColumn(column) && isBooleanFilter(filter)) {
    return (
      <FilterValueBooleanDisplay
        filter={filter}
        column={column as Column<unknown, 'boolean'>}
      />
    )
  }

  return null
}

function FilterValueSelectableDisplay({
  filter,
  column,
}: {
  filter: FilterModel<'option'> | FilterModel<'multiOption'>
  column: Column<unknown, 'option'> | Column<unknown, 'multiOption'>
}) {
  const options = useMemo(() => column.getOptions(), [column])
  const selected = options.filter((option) =>
    filter.values.includes(option.value as string),
  )

  if (selected.length === 1 && selected[0]) {
    const { label, icon: Icon } = selected[0]
    const hasIcon = !!Icon

    return (
      <span className="inline-flex items-center gap-1.5">
        {hasIcon &&
          (isValidElement(Icon) ? (
            Icon
          ) : (
            <Icon className="size-4 text-primary" />
          ))}

        <span>{label}</span>
      </span>
    )
  }

  const name = column.displayName.toLowerCase()
  const displayName =
    column.type === 'option'
      ? name.endsWith('s')
        ? `${name}es`
        : `${name}s`
      : name

  const hasOptionIcons = !options.some((option) => !option.icon)

  return (
    <div className="inline-flex items-center gap-2">
      {hasOptionIcons && (
        <div key="icons" className="inline-flex items-center gap-0.5">
          {take(selected, 3).map(({ value, icon }) => {
            const Icon = icon!

            return isValidElement(Icon) ? (
              cloneElement(Icon, { key: value as string })
            ) : (
              <Icon key={value as string} className="size-4" />
            )
          })}
        </div>
      )}

      <span>
        {selected.length} {displayName}
      </span>
    </div>
  )
}

function formatDateRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth()
  const sameYear = start.getFullYear() === end.getFullYear()

  if (sameMonth && sameYear) {
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`
  }

  if (sameYear) {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
  }

  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
}

function FilterValueDateDisplay({ filter }: { filter: FilterModel<'date'> }) {
  if (filter.values.length === 0) {
    return <Ellipsis className="size-4" />
  }

  if (filter.values.length === 1 && filter.values[0]) {
    return <span>{format(filter.values[0], 'MMM d, yyyy')}</span>
  }

  if (filter.values.length === 2 && filter.values[0] && filter.values[1]) {
    return <span>{formatDateRange(filter.values[0], filter.values[1])}</span>
  }

  return null
}

function FilterValueTextDisplay({ filter }: { filter: FilterModel<'text'> }) {
  if (
    filter.values.length === 0 ||
    (filter.values[0] && filter.values[0].trim() === '')
  ) {
    return <Ellipsis className="size-4" />
  }

  return <span>{filter.values[0]}</span>
}

function FilterValueNumberDisplay({
  filter,
  locale = 'en',
}: {
  filter: FilterModel<'number'>
  locale?: Locale
}) {
  if (!filter.values || filter.values.length === 0) {
    return null
  }

  if (
    filter.operator === 'is between' ||
    filter.operator === 'is not between'
  ) {
    const minValue = filter.values[0]
    const maxValue = filter.values[1]

    return (
      <span className="tabular-nums tracking-tight">
        {minValue} {t('and', locale)} {maxValue}
      </span>
    )
  }

  return <span className="tabular-nums tracking-tight">{filter.values[0]}</span>
}

function FilterValueBooleanDisplay({
  filter,
  column,
}: {
  filter: FilterModel<'boolean'>
  column: Column<unknown, 'boolean'>
}) {
  if (filter.values.length === 0) {
    return null
  }

  return <span>{column.toggledStateName}</span>
}

export namespace FilterValue {
  export type Props<
    TData = unknown,
    TType extends ColumnDataType = ColumnDataType,
  > = FilterValueProps<TData, TType>

  export type DisplayProps<
    TData = unknown,
    TType extends ColumnDataType = ColumnDataType,
  > = FilterValueDisplayProps<TData, TType>
}
