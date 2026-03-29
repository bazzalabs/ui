'use client'

import type {
  Column,
  ColumnDataType,
  DataTableFilterActions,
  FilterModel,
  FilterStrategy,
  FiltersState,
  Locale,
} from '@bazza-ui/filters'
import { getColumn, isAnyOf, t } from '@bazza-ui/filters'
import { ArrowRightIcon, ChevronRightIcon } from 'lucide-react'
import React, {
  isValidElement,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useFilterContext } from '../../../components/root/filter-context'
import { FilterTrigger } from '../../../components/trigger/filter-trigger'
import { FilterValueController } from '../item/filter-value'

export interface FilterMenuProps<TData = unknown> {
  columns?: Column<TData>[]
  filters?: FiltersState
  actions?: DataTableFilterActions
  strategy?: FilterStrategy
  locale?: Locale
  children?: React.ReactElement
  rootProps?: Partial<Omit<React.ComponentProps<typeof Popover>, 'children'>>
}

function __FilterMenu<TData>({
  columns: columnsProp,
  filters: filtersProp,
  actions: actionsProp,
  strategy: strategyProp,
  locale: localeProp,
  children,
  rootProps,
}: FilterMenuProps<TData>) {
  const context = useFilterContext<TData>()

  const columns = columnsProp ?? context.columns
  const filters = filtersProp ?? context.filters
  const actions = actionsProp ?? context.actions
  const strategy = strategyProp ?? context.strategy
  const locale = localeProp ?? context.locale ?? 'en'

  const visibleColumns = useMemo(
    () => columns.filter((column) => !column.hidden),
    [columns],
  )

  const visibleFilters = useMemo(
    () =>
      filters.filter((filter) =>
        visibleColumns.find((column) => column.id === filter.columnId),
      ),
    [filters, visibleColumns],
  )

  const hasVisibleFilters = visibleFilters.length > 0

  const [value, setValue] = useState('')
  const [property, setProperty] = useState<string | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    open: openProp,
    onOpenChange: onOpenChangeProp,
    ...restRootProps
  } = rootProps ?? {}

  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen

  const selectedColumn = property
    ? getColumn(visibleColumns, property)
    : undefined
  const selectedFilter = property
    ? visibleFilters.find((filter) => filter.columnId === property)
    : undefined

  useEffect(() => {
    if (!property) {
      return
    }

    inputRef.current?.focus()
    setValue('')
  }, [property])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (openProp === undefined) {
        setInternalOpen(nextOpen)
      }

      onOpenChangeProp?.(nextOpen)

      if (!nextOpen) {
        setTimeout(() => {
          setProperty(undefined)
        }, 100)

        setTimeout(() => {
          setValue('')
        }, 150)
      }
    },
    [openProp, onOpenChangeProp],
  )

  const content = useMemo(() => {
    if (property && selectedColumn && selectedColumn.type !== 'boolean') {
      return (
        <FilterValueController
          filter={selectedFilter as FilterModel<ColumnDataType> | undefined}
          column={selectedColumn as Column<TData, ColumnDataType>}
          actions={actions}
          strategy={strategy}
          locale={locale}
        />
      )
    }

    return (
      <Command
        loop
        filter={(itemValue, search, keywords) => {
          const extendedValue = `${itemValue} ${keywords?.join(' ')}`

          return extendedValue.toLowerCase().includes(search.toLowerCase())
            ? 1
            : 0
        }}
      >
        <CommandInput
          value={value}
          onValueChange={setValue}
          ref={inputRef}
          placeholder={t('search', locale)}
        />

        <CommandEmpty>{t('noresults', locale)}</CommandEmpty>

        <CommandList className="max-h-fit">
          <CommandGroup>
            {visibleColumns.map((column) => (
              <FilterableColumn
                key={column.id}
                column={column}
                setProperty={setProperty}
                actions={actions}
              />
            ))}

            <QuickSearchFilters
              search={value}
              filters={visibleFilters}
              columns={visibleColumns}
              actions={actions}
            />
          </CommandGroup>
        </CommandList>
      </Command>
    )
  }, [
    property,
    selectedColumn,
    selectedFilter,
    actions,
    locale,
    strategy,
    value,
    visibleColumns,
    visibleFilters,
  ])

  const triggerElement = children ?? (
    <FilterTrigger hasVisibleFilters={hasVisibleFilters} locale={locale} />
  )

  return (
    <Popover open={open} onOpenChange={handleOpenChange} {...restRootProps}>
      <PopoverTrigger asChild>{triggerElement}</PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-fit p-0 origin-(--radix-popover-content-transform-origin)"
      >
        {content}
      </PopoverContent>
    </Popover>
  )
}

interface FilterableColumnProps<
  TData,
  TType extends ColumnDataType = ColumnDataType,
> {
  column: Column<TData, TType>
  setProperty: (value: string) => void
  actions: DataTableFilterActions
}

function FilterableColumn<TData, TType extends ColumnDataType>({
  column,
  setProperty,
  actions,
}: FilterableColumnProps<TData, TType>) {
  const itemRef = useRef<HTMLDivElement>(null)

  const { icon: Icon } = column
  const hasIcon = !!Icon

  const prefetch = useCallback(() => {
    column.prefetchValues()

    if (isAnyOf(column.type, ['option', 'multiOption'])) {
      column.prefetchOptions()
      column.prefetchFacetedUniqueValues()
    }

    if (column.type === 'number') {
      column.prefetchFacetedMinMaxValues()
    }
  }, [column])

  useEffect(() => {
    const target = itemRef.current

    if (!target) {
      return
    }

    const observer = new MutationObserver(() => {
      const isSelected = target.getAttribute('data-selected') === 'true'

      if (isSelected) {
        prefetch()
      }
    })

    observer.observe(target, {
      attributes: true,
      attributeFilter: ['data-selected'],
    })

    return () => {
      observer.disconnect()
    }
  }, [prefetch])

  function handleSelect() {
    if (column.type === 'boolean') {
      actions.setFilterValue(column as Column<TData, 'boolean'>, [true])
      return
    }

    setProperty(column.id)
  }

  return (
    <CommandItem
      ref={itemRef}
      value={column.id}
      keywords={[column.displayName]}
      onSelect={handleSelect}
      className="group"
      onMouseEnter={prefetch}
    >
      <div className="flex w-full items-center justify-between">
        <div className="inline-flex items-center gap-1.5">
          {hasIcon &&
            (isValidElement(Icon) ? (
              Icon
            ) : (
              <Icon className="size-4 stroke-[2.25px]" />
            ))}

          <span>{column.displayName}</span>
        </div>

        {column.type !== 'boolean' && (
          <ArrowRightIcon className="size-4 opacity-0 group-aria-selected:opacity-100" />
        )}
      </div>
    </CommandItem>
  )
}

interface QuickSearchFiltersProps<TData> {
  search?: string
  filters: FiltersState
  columns: Column<TData>[]
  actions: DataTableFilterActions
}

const QuickSearchFilters = memo(function QuickSearchFilters<TData>({
  search,
  filters,
  columns,
  actions,
}: QuickSearchFiltersProps<TData>) {
  const selectableColumns = useMemo(
    () =>
      columns.filter((column) =>
        isAnyOf<ColumnDataType>(column.type, ['option', 'multiOption']),
      ),
    [columns],
  )

  if (!search || search.trim().length < 2) {
    return null
  }

  return (
    <>
      {selectableColumns.map((column) => {
        const filter = filters.find(
          (currentFilter) => currentFilter.columnId === column.id,
        )
        const options = column.getOptions()
        const optionsCount = column.getFacetedUniqueValues()

        function handleOptionSelect(value: string, checked: boolean) {
          if (checked) {
            actions.addFilterValue(column as Column<TData, 'option'>, [value])
            return
          }

          actions.removeFilterValue(column as Column<TData, 'option'>, [value])
        }

        return (
          <React.Fragment key={column.id}>
            {options.map((option) => {
              const checked = Boolean(filter?.values.includes(option.value))
              const count = optionsCount?.get(option.value as string) ?? 0

              return (
                <CommandItem
                  key={`${column.id}-${option.value}`}
                  value={`${column.id}-${option.value}`}
                  keywords={[
                    option.label,
                    option.value as string,
                    column.displayName,
                  ]}
                  onSelect={() => {
                    handleOptionSelect(option.value as string, !checked)
                  }}
                  className="group"
                >
                  <div className="flex items-center gap-1.5 group">
                    <Checkbox
                      checked={checked}
                      className="opacity-0 data-[state=checked]:opacity-100 group-data-[selected=true]:opacity-100 dark:border-ring mr-1"
                    />

                    <div className="flex items-center w-4 justify-center">
                      {option.icon &&
                        (isValidElement(option.icon) ? (
                          option.icon
                        ) : (
                          <option.icon className="size-4 text-primary" />
                        ))}
                    </div>

                    <div className="flex items-center gap-0.5">
                      <span className="text-muted-foreground">
                        {column.displayName}
                      </span>
                      <ChevronRightIcon className="size-3.5 text-muted-foreground/75" />
                      <span>
                        {option.label}
                        <sup
                          className={cn(
                            !optionsCount && 'hidden',
                            'ml-0.5 tabular-nums tracking-tight text-muted-foreground',
                            count === 0 && 'slashed-zero',
                          )}
                        >
                          {count < 100 ? count : '100+'}
                        </sup>
                      </span>
                    </div>
                  </div>
                </CommandItem>
              )
            })}
          </React.Fragment>
        )
      })}
    </>
  )
}) as <TData>(
  props: QuickSearchFiltersProps<TData>,
) => React.ReactElement | null

export const FilterMenu = memo(__FilterMenu) as typeof __FilterMenu

export namespace FilterMenu {
  export type Props<TData = unknown> = FilterMenuProps<TData>
}
