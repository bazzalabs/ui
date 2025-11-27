'use client'

import type { MenuDef, SeparatorDef } from '@bazza-ui/dropdown-menu'
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
  isOptionBasedColumn,
  isOptionColumn,
  isOptionFilter,
  isTextColumn,
  isTextFilter,
  take,
} from '@bazza-ui/filters'
import { cva } from 'class-variance-authority'
import { format } from 'date-fns'
import { Ellipsis } from 'lucide-react'
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
  type FilterVariant,
  useFilterActions,
  useFilterEntityName,
  useFilterLocale,
  useFilterStrategy,
  useFilterVariant,
} from '../root/filter-context'
import {
  createMultiOptionMenu,
  createOptionMenu,
  createTextMenu,
  FilterValueDateController,
  FilterValueNumberController,
  OptionItem,
  TextItem,
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
  /** Filter actions. If omitted, will be read from FilterItem or Filter context. */
  actions?: DataTableFilterActions
  /** Filter strategy. If omitted, will be read from FilterItem or Filter context. */
  strategy?: FilterStrategy
  locale?: Locale
  entityName?: string
  className?: string
  variant?: FilterVariant
}

// Helper function to partition nodes into selected and unselected
function partitionNodesBySelection<T extends { id: string }>(
  nodes: T[],
  initialValues: string[],
): { selected: T[]; unselected: T[] } {
  const selected = nodes.filter((node) => initialValues.includes(node.id))
  const unselected = nodes.filter((node) => !initialValues.includes(node.id))
  return { selected, unselected }
}

// Helper function to create menu with separator
function createMenuWithSeparator(
  columnId: string,
  nodes: any[],
  initialValues: (string | number | bigint | boolean | Date)[],
): MenuDef<ColumnOptionExtended> {
  const { selected, unselected } = partitionNodesBySelection(
    nodes,
    initialValues as string[], // option/multiOption values are always strings
  )
  const showSeparator = selected.length > 0 && unselected.length > 0
  const separator = {
    id: 'separator',
    kind: 'separator',
  } satisfies SeparatorDef

  return {
    id: `filter-value-${columnId}`,
    nodes: [...selected, ...(showSeparator ? [separator] : []), ...unselected],
  } satisfies MenuDef<ColumnOptionExtended>
}

// Helper function to create controller menu for date types
function createDateControllerMenu<TData>(
  filter: FilterModel<'date'>,
  column: Column<TData, 'date'>,
  actions: DataTableFilterActions,
  strategy: FilterStrategy,
  locale: Locale,
): MenuDef {
  return {
    id: `filter-value-${column.id}`,
    nodes: [],
    render: () => (
      <FilterValueDateController
        filter={filter}
        column={column}
        actions={actions}
        strategy={strategy}
        locale={locale}
      />
    ),
  }
}

// Helper function to create controller menu for number types
function createNumberControllerMenu<TData>(
  filter: FilterModel<'number'>,
  column: Column<TData, 'number'>,
  actions: DataTableFilterActions,
  strategy: FilterStrategy,
  locale: Locale,
): MenuDef {
  return {
    id: `filter-value-${column.id}`,
    nodes: [],
    render: () => (
      <FilterValueNumberController
        filter={filter}
        column={column}
        actions={actions}
        strategy={strategy}
        locale={locale}
      />
    ),
  }
}

// Helper function to determine which Item slot to use
function getItemSlot<TData>(column: Column<TData>) {
  if (isTextColumn(column)) return TextItem
  if (isOptionBasedColumn(column)) return OptionItem
  return undefined
}

/**
 * Displays and allows editing the filter value.
 * Renders a `<button>` element with a dropdown menu.
 *
 * Documentation: [Bazza UI Filter](https://bazza-ui.com/docs/components/filter)
 */
const FilterValue = forwardRef<HTMLButtonElement, FilterValueProps>(
  (
    {
      filter: filterProp,
      column: columnProp,
      actions: actionsProp,
      strategy: strategyProp,
      locale: localeProp,
      entityName: entityNameProp,
      className,
      variant: variantProp,
    },
    ref,
  ) => {
    const itemContext = useFilterItemContext()
    const filterActions = useFilterActions()
    const filterStrategy = useFilterStrategy()
    const filterLocale = useFilterLocale()
    const filterEntityName = useFilterEntityName()
    const contextVariant = useFilterVariant()

    const filter = filterProp ?? itemContext?.filter
    const column = columnProp ?? itemContext?.column
    const actions = actionsProp ?? itemContext?.actions ?? filterActions
    const strategy = strategyProp ?? itemContext?.strategy ?? filterStrategy
    const locale = localeProp ?? itemContext?.locale ?? filterLocale ?? 'en'
    const entityName =
      entityNameProp ?? itemContext?.entityName ?? filterEntityName
    const variant = variantProp ?? contextVariant ?? 'default'

    if (!filter || !column || !actions || !strategy) {
      throw new Error(
        'FilterValue requires filter, column, actions, and strategy props or must be used within FilterItem',
      )
    }

    // After validation, we can safely use these non-null values
    const resolvedFilter = filter
    const resolvedColumn = column
    const resolvedActions = actions
    const resolvedStrategy = strategy

    const [open, setOpen] = useState(false)

    // Don't open the value controller for boolean columns
    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
      if (isBooleanColumn(resolvedColumn)) e.preventDefault()
    }

    // Used only for option/multiOption to track initial selection order
    const initialFilterValuesRef = useRef<
      (string | number | bigint | boolean | Date)[]
    >([])

    // Create menu configuration for all column types
    // biome-ignore lint/correctness/useExhaustiveDependencies: re-create on open to show new selection order
    const menu: MenuDef | null = useMemo(() => {
      const baseId = `filter-value-${resolvedColumn.id}`

      // For text type, use the text menu creator
      if (isTextColumn(resolvedColumn)) {
        return {
          id: baseId,
          ...(createTextMenu({
            filter: resolvedFilter as FilterModel<'text'>,
            column: resolvedColumn,
            actions: resolvedActions,
            locale,
            strategy: resolvedStrategy,
          }) as any),
        }
      }

      // For option type
      if (isOptionColumn(resolvedColumn)) {
        const { nodes } = createOptionMenu({
          column: resolvedColumn,
          actions: resolvedActions,
          locale,
          strategy: resolvedStrategy,
          filter: resolvedFilter as FilterModel<'option'>,
        })

        return createMenuWithSeparator(
          resolvedColumn.id,
          nodes,
          initialFilterValuesRef.current,
        )
      }

      // For multiOption type
      if (isMultiOptionColumn(resolvedColumn)) {
        const { nodes } = createMultiOptionMenu({
          column: resolvedColumn,
          actions: resolvedActions,
          locale,
          strategy: resolvedStrategy,
          filter: resolvedFilter as FilterModel<'multiOption'>,
        })

        return createMenuWithSeparator(
          resolvedColumn.id,
          nodes,
          initialFilterValuesRef.current,
        )
      }

      // For date type, use the controller renderer
      if (isDateColumn(resolvedColumn)) {
        return createDateControllerMenu(
          resolvedFilter as FilterModel<'date'>,
          resolvedColumn,
          resolvedActions,
          resolvedStrategy,
          locale,
        )
      }

      // For number type, use the controller renderer
      if (isNumberColumn(resolvedColumn)) {
        return createNumberControllerMenu(
          resolvedFilter as FilterModel<'number'>,
          resolvedColumn,
          resolvedActions,
          resolvedStrategy,
          locale,
        )
      }

      if (isBooleanColumn(resolvedColumn)) {
        return null
      }

      return null
    }, [
      resolvedColumn,
      resolvedFilter,
      resolvedActions,
      locale,
      resolvedStrategy,
      open,
    ])

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
      <DropdownMenu
        slots={{
          Item: getItemSlot(resolvedColumn),
        }}
        menu={menu!}
        open={open}
        onOpenChange={(value) => {
          if (value) {
            initialFilterValuesRef.current = resolvedFilter.values
          }

          setOpen(value)
        }}
        trackAnchor={false}
      >
        <Button
          ref={ref}
          data-slot="filter-value"
          data-column-type={resolvedColumn.type}
          variant="ghost"
          className={cn(filterValueVariants({ variant }), className)}
          onClick={handleClick}
        >
          <FilterValueDisplay
            filter={resolvedFilter}
            column={resolvedColumn}
            locale={locale}
            entityName={entityName}
          />
        </Button>
      </DropdownMenu>
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
      <FilterValueOptionDisplay
        filter={filter}
        column={column as Column<unknown, 'option'>}
      />
    )
  }

  if (isMultiOptionColumn(column) && isMultiOptionFilter(filter)) {
    return (
      <FilterValueMultiOptionDisplay
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

function FilterValueOptionDisplay({
  filter,
  column,
}: {
  filter: FilterModel<'option'>
  column: Column<unknown, 'option'>
}) {
  const options = useMemo(() => column.getOptions(), [column])
  const selected = options.filter((o) => filter?.values.includes(o.value))

  if (selected.length === 1 && selected[0]) {
    const { label, icon: Icon } = selected[0]
    const hasIcon = !!Icon
    return (
      <span className="inline-flex items-center gap-1">
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
  const pluralName = name.endsWith('s') ? `${name}es` : `${name}s`
  const hasOptionIcons = !options?.some((o) => !o.icon)

  return (
    <div className="inline-flex items-center gap-0.5">
      {hasOptionIcons &&
        take(selected, 3).map(({ value, icon }) => {
          const Icon = icon!
          return isValidElement(Icon) ? (
            Icon
          ) : (
            <Icon key={value} className="size-4" />
          )
        })}
      <span className={cn(hasOptionIcons && 'ml-1.5')}>
        {selected.length} {pluralName}
      </span>
    </div>
  )
}

function FilterValueMultiOptionDisplay({
  filter,
  column,
}: {
  filter: FilterModel<'multiOption'>
  column: Column<unknown, 'multiOption'>
}) {
  const options = useMemo(() => column.getOptions(), [column])
  const selected = options.filter((o) => filter.values.includes(o.value))

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
  const hasOptionIcons = !options?.some((o) => !o.icon)

  return (
    <div className="inline-flex items-center gap-1.5">
      {hasOptionIcons && (
        <div key="icons" className="inline-flex items-center gap-0.5">
          {take(selected, 3).map(({ value, icon }) => {
            const Icon = icon!
            return isValidElement(Icon) ? (
              cloneElement(Icon, { key: value })
            ) : (
              <Icon key={value} className="size-4" />
            )
          })}
        </div>
      )}
      <span>
        {selected.length} {name}
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
  if (filter.values.length === 0) return <Ellipsis className="size-4" />
  if (filter.values.length === 1 && filter.values[0]) {
    const value = filter.values[0]
    const formattedDateStr = format(value, 'MMM d, yyyy')
    return <span>{formattedDateStr}</span>
  }
  if (filter.values.length === 2 && filter.values[0] && filter.values[1]) {
    const formattedRangeStr = formatDateRange(
      filter.values[0],
      filter.values[1],
    )
    return <span>{formattedRangeStr}</span>
  }
  return null
}

function FilterValueTextDisplay({ filter }: { filter: FilterModel<'text'> }) {
  if (!filter) return null
  if (
    filter.values.length === 0 ||
    (filter.values[0] && filter.values[0].trim() === '')
  )
    return <Ellipsis className="size-4" />
  return <span>{filter.values[0]}</span>
}

function FilterValueNumberDisplay({
  filter,
  locale = 'en',
}: {
  filter: FilterModel<'number'>
  locale?: Locale
}) {
  if (!filter || !filter.values || filter.values.length === 0) return null

  if (
    filter.operator === 'is between' ||
    filter.operator === 'is not between'
  ) {
    const minValue = filter.values[0]
    const maxValue = filter.values[1]
    const andText = locale === 'en' ? 'and' : 'and' // Add translations as needed
    return (
      <span className="tabular-nums tracking-tight">
        {minValue} {andText} {maxValue}
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
  if (!filter || filter.values.length === 0) return null
  return <span>{column.toggledStateName}</span>
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
