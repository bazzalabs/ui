'use client'

import type {
  Column,
  ColumnDataType,
  FilterModel,
  FilterStrategy,
  Locale,
  ViewLayer,
} from '@bazza-ui/data-view/react'
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
  take,
} from '@bazza-ui/data-view/react'

import { cva } from 'class-variance-authority'
import { format } from 'date-fns'
import { Ellipsis } from 'lucide-react'
import * as React from 'react'
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import {
  type DataViewVariant,
  useDataViewEntityName,
  useDataViewLayer,
  useDataViewLocale,
  useDataViewStrategy,
  useDataViewVariant,
} from '../root/data-view-context'
import {
  FilterValueDateController,
  FilterValueNumberController,
  OptionEditorContent,
  TextEditorContent,
} from '../value'
import { useFilterItemContext } from './filter-item'

const filterValueVariants = cva(
  'm-0 w-fit whitespace-nowrap p-0 px-2 text-xs',
  {
    variants: {
      variant: {
        default: 'h-full rounded-none',
        clean:
          'h-6 rounded-md text-primary/75 hover:text-primary hover:bg-background hover:shadow-xs aria-expanded:bg-background aria-expanded:text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface FilterValueProps<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> {
  /** The current filter state. If omitted, will be read from FilterItem context. */
  filter?: FilterModel<TType>
  /** The column configuration. If omitted, will be read from FilterItem context. */
  column?: Column<TData, TType>
  /** View layer. If omitted, will be read from FilterItem or DataView context. */
  layer?: ViewLayer<TData>
  /** Filter strategy. If omitted, will be read from FilterItem or DataView context. */
  strategy?: FilterStrategy
  locale?: Locale
  entityName?: string
  className?: string
  variant?: DataViewVariant
}

/**
 * Displays and allows editing the filter value.
 * Renders a `<button>` element with a dropdown menu.
 *
 * Documentation: [Bazza UI DataView](https://bazza-ui.com/docs/components/data-view)
 */
const FilterValue = forwardRef<HTMLButtonElement, FilterValueProps>(
  (
    {
      filter: filterProp,
      column: columnProp,
      layer: layerProp,
      strategy: strategyProp,
      locale: localeProp,
      entityName: entityNameProp,
      className,
      variant: variantProp,
    },
    ref,
  ) => {
    const itemContext = useFilterItemContext()
    const dataViewLayer = useDataViewLayer()
    const dataViewStrategy = useDataViewStrategy()
    const dataViewLocale = useDataViewLocale()
    const dataViewEntityName = useDataViewEntityName()
    const contextVariant = useDataViewVariant()

    const filter = filterProp ?? itemContext?.filter
    const column = columnProp ?? itemContext?.column
    const layer = layerProp ?? itemContext?.layer ?? dataViewLayer
    const strategy = strategyProp ?? itemContext?.strategy ?? dataViewStrategy
    const locale = localeProp ?? itemContext?.locale ?? dataViewLocale ?? 'en'
    const entityName =
      entityNameProp ?? itemContext?.entityName ?? dataViewEntityName
    const variant = variantProp ?? contextVariant ?? 'default'

    if (!filter || !column || !layer || !strategy) {
      throw new Error(
        'FilterValue requires filter, column, layer, and strategy props or must be used within FilterItem',
      )
    }

    // After validation, we can safely use these non-null values
    const resolvedFilter = filter
    const resolvedColumn = column
    const resolvedLayer = layer
    const resolvedStrategy = strategy

    const [open, setOpen] = useState(false)

    // Don't open the value controller for boolean columns
    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
      if (isBooleanColumn(resolvedColumn)) e.preventDefault()
    }

    // Keep a ref to the latest filter values to avoid stale closure in onOpenChange
    const latestFilterValuesRef = useRef(resolvedFilter.values)
    latestFilterValuesRef.current = resolvedFilter.values

    // Used only for option/multiOption to track initial selection order
    const initialFilterValuesRef = useRef<
      (string | number | bigint | boolean | Date)[]
    >([])

    // Determine column type for rendering
    const isTextType = isTextColumn(resolvedColumn)
    const isDateType = isDateColumn(resolvedColumn)
    const isNumberType = isNumberColumn(resolvedColumn)
    const isSelectableType =
      isOptionColumn(resolvedColumn) || isMultiOptionColumn(resolvedColumn)

    if (isBooleanColumn(resolvedColumn)) {
      return (
        <div
          data-slot="filter-value"
          data-column-type={resolvedColumn.type}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            filterValueVariants({ variant }),
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
      <DropdownMenu.Root
        open={open}
        onOpenChange={(value) => {
          if (value) {
            // Capture filter values when opening - use ref to avoid stale closure
            initialFilterValuesRef.current = latestFilterValuesRef.current as (
              | string
              | number
              | bigint
              | boolean
              | Date
            )[]
          }
          setOpen(value)
        }}
      >
        <DropdownMenu.Trigger
          render={
            <Button
              ref={ref}
              data-slot="filter-value"
              data-column-type={resolvedColumn.type}
              variant="ghost"
              className={cn(filterValueVariants({ variant }), className)}
              onClick={handleClick}
            />
          }
        >
          <FilterValueDisplay
            filter={resolvedFilter}
            column={resolvedColumn}
            locale={locale}
            entityName={entityName}
          />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner align="list-start" disableAnchorTracking>
            <DropdownMenu.Popup
              className={cn((isDateType || isNumberType) && 'w-full')}
            >
              {isTextType ? (
                <TextEditorContent
                  column={resolvedColumn as Column<unknown, 'text'>}
                  layer={resolvedLayer}
                />
              ) : isDateType ? (
                <DropdownMenu.Surface>
                  <FilterValueDateController
                    filter={resolvedFilter as FilterModel<'date'>}
                    column={resolvedColumn as Column<unknown, 'date'>}
                    layer={resolvedLayer}
                    strategy={resolvedStrategy}
                    locale={locale}
                  />
                </DropdownMenu.Surface>
              ) : isNumberType ? (
                <FilterValueNumberController
                  filter={resolvedFilter as FilterModel<'number'>}
                  column={resolvedColumn as Column<unknown, 'number'>}
                  layer={resolvedLayer}
                  strategy={resolvedStrategy}
                  locale={locale}
                />
              ) : isSelectableType ? (
                <OptionEditorContent
                  column={
                    resolvedColumn as
                      | Column<unknown, 'option'>
                      | Column<unknown, 'multiOption'>
                  }
                  layer={resolvedLayer}
                  filter={
                    resolvedFilter as
                      | FilterModel<'option'>
                      | FilterModel<'multiOption'>
                  }
                  locale={locale}
                  strategy={resolvedStrategy}
                  initialValues={initialFilterValuesRef.current}
                  showSeparator
                />
              ) : null}
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  },
)

FilterValue.displayName = 'FilterValue'

// Display components for each type
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
    return <FilterValueBooleanDisplay filter={filter} />
  }

  return null
}

/**
 * Renders an icon that can be either a React element or a component type.
 */
function renderIcon(icon: unknown, className: string): React.ReactNode {
  if (!icon) return null
  if (isValidElement(icon))
    return cloneElement(icon, { className } as Record<string, unknown>)
  const IconComp = icon as React.ComponentType<{ className?: string }>
  return <IconComp className={className} />
}

/**
 * Unified display component for option and multiOption filter values.
 * Shows single selection with icon, or multiple selections with count.
 */
function FilterValueSelectableDisplay({
  filter,
  column,
}: {
  filter: FilterModel<'option'> | FilterModel<'multiOption'>
  column: Column<unknown, 'option'> | Column<unknown, 'multiOption'>
}) {
  const options = useMemo(() => column.getOptions(), [column])
  const selected = options.filter((o) =>
    filter?.values.includes(o.value as string),
  )

  // Single selection - show label with icon
  if (selected.length === 1 && selected[0]) {
    const { label, icon } = selected[0]
    return (
      <span className="inline-flex items-center gap-1.5">
        {renderIcon(icon, 'size-4 text-primary')}
        <span>{label}</span>
      </span>
    )
  }

  // Multiple selections - show count with icons
  const name = column.displayName.toLowerCase()
  // For 'option' type, pluralize; for 'multiOption', use as-is
  const displayName =
    column.type === 'option'
      ? name.endsWith('s')
        ? `${name}es`
        : `${name}s`
      : name
  const hasOptionIcons = !options?.some((o) => !o.icon)

  return (
    <div className="inline-flex items-center gap-2">
      {hasOptionIcons && (
        <div key="icons" className="inline-flex items-center gap-0.5">
          {take(selected, 3).map(({ value, icon }) => {
            return (
              <React.Fragment key={value as string}>
                {renderIcon(icon, 'size-4')}
              </React.Fragment>
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
  if (!filter) return null
  const values = filter.values as Date[]
  if (values.length === 0) return <Ellipsis className="size-4" />
  if (values.length === 1 && values[0]) {
    const formattedDateStr = format(values[0], 'MMM d, yyyy')
    return <span>{formattedDateStr}</span>
  }
  if (values.length === 2 && values[0] && values[1]) {
    const formattedRangeStr = formatDateRange(values[0], values[1])
    return <span>{formattedRangeStr}</span>
  }
  return null
}

function FilterValueTextDisplay({ filter }: { filter: FilterModel<'text'> }) {
  if (!filter) return null
  const values = filter.values as string[]
  if (values.length === 0 || (values[0] && values[0].trim() === ''))
    return <Ellipsis className="size-4" />
  return <span>{values[0]}</span>
}

function FilterValueNumberDisplay({
  filter,
  locale = 'en',
}: {
  filter: FilterModel<'number'>
  locale?: Locale
}) {
  if (!filter || !filter.values || filter.values.length === 0) return null
  const values = filter.values as number[]

  if (
    filter.operator === 'is between' ||
    filter.operator === 'is not between'
  ) {
    const minValue = values[0]
    const maxValue = values[1]
    const andText = locale === 'en' ? 'and' : 'and'
    return (
      <span className="tabular-nums tracking-tight">
        {minValue} {andText} {maxValue}
      </span>
    )
  }

  return <span className="tabular-nums tracking-tight">{values[0]}</span>
}

function FilterValueBooleanDisplay({
  filter,
}: {
  filter: FilterModel<'boolean'>
}) {
  if (!filter || filter.values.length === 0) return null
  // data-view doesn't have toggledStateName; use Yes/No
  return <span>{filter.values[0] ? 'Yes' : 'No'}</span>
}

export { FilterValue }

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
