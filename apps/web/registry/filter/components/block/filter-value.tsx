'use client'

import type { MenuDef, SeparatorDef } from '@bazza-ui/dropdown-menu'
import type {
  Column,
  ColumnDataType,
  ColumnOptionExtended,
  DataTableFilterActions,
  FilterModel,
  FilterStrategy,
  FilterValues,
  Locale,
} from '@bazza-ui/filters'
import { take } from '@bazza-ui/filters'
import { cva } from 'class-variance-authority'
import { format } from 'date-fns'
import { Ellipsis } from 'lucide-react'
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/dropdown-menu'
import { type FilterVariant, useFilterVariant } from '../context/filter-context'
import {
  createMultiOptionMenu,
  createOptionMenu,
  createTextMenu,
  FilterValueDateController,
  FilterValueNumberController,
  OptionItem,
  TextItem,
} from '../value'

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
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  strategy: FilterStrategy
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

// Helper function to create controller menu for date/number types
function createControllerMenu(
  type: 'date' | 'number',
  filter: any,
  column: any,
  actions: any,
  strategy: any,
  locale: any,
): MenuDef {
  if (type === 'date') {
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
function getItemSlot(columnType: ColumnDataType) {
  if (columnType === 'text') return TextItem
  if (columnType === 'option' || columnType === 'multiOption') return OptionItem
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
      filter,
      column,
      actions,
      strategy,
      locale = 'en',
      entityName,
      className,
      variant: variantProp,
    },
    ref,
  ) => {
    const contextVariant = useFilterVariant()
    const variant = variantProp ?? contextVariant ?? 'default'

    const [open, setOpen] = useState(false)

    // Use ref to capture current filter value for loaders
    const filterRef = useRef(filter)
    useEffect(() => {
      filterRef.current = filter
    }, [filter])

    // Don't open the value controller for boolean columns
    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
      if (column.type === 'boolean') e.preventDefault()
    }

    // Used only for option/multiOption to track initial selection order
    const initialFilterValuesRef = useRef<
      (string | number | bigint | boolean | Date)[]
    >([])

    // Create menu configuration for all column types
    // biome-ignore lint/correctness/useExhaustiveDependencies: re-create on open to show new selection order
    const menu: MenuDef | null = useMemo(() => {
      const baseId = `filter-value-${column.id}`

      // For text type, use the text menu creator
      if (column.type === 'text') {
        return {
          id: baseId,
          ...(createTextMenu({
            filter: filter as FilterModel<'text'>,
            column: column as Column<unknown, 'text'>,
            actions,
            locale,
            strategy,
          }) as any),
        }
      }

      // For option type
      if (column.type === 'option') {
        const { nodes } = createOptionMenu({
          column: column as Column<unknown, 'option'>,
          actions,
          locale,
          strategy,
          getFilter: () =>
            filterRef.current as FilterModel<'option'> | undefined,
        })

        return createMenuWithSeparator(
          column.id,
          nodes,
          initialFilterValuesRef.current,
        )
      }

      // For multiOption type
      if (column.type === 'multiOption') {
        const { nodes } = createMultiOptionMenu({
          column: column as Column<unknown, 'multiOption'>,
          actions,
          locale,
          strategy,
          getFilter: () =>
            filterRef.current as FilterModel<'multiOption'> | undefined,
        })

        return createMenuWithSeparator(
          column.id,
          nodes,
          initialFilterValuesRef.current,
        )
      }

      // For date and number types, use the controller renderer
      if (column.type === 'date' || column.type === 'number') {
        return createControllerMenu(
          column.type,
          filter as any,
          column as any,
          actions,
          strategy,
          locale,
        )
      }

      if (column.type === 'boolean') {
        return null
      }

      return null
    }, [column, filter, actions, locale, strategy, open])

    if (column.type === 'boolean') {
      return (
        <div
          data-slot="filter-value"
          data-column-type={column.type}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            filterValueVariants({ variant }),
            'text-primary/75 hover:bg-inherit hover:text-primary/75 hover:shadow-none',
            className,
          )}
        >
          <FilterValueDisplay
            filter={filter}
            column={column}
            locale={locale}
            entityName={entityName}
          />
        </div>
      )
    }

    return (
      <DropdownMenu
        slots={{
          Item: getItemSlot(column.type),
        }}
        menu={menu!}
        open={open}
        onOpenChange={(value) => {
          if (value) {
            initialFilterValuesRef.current = filter.values
          }

          setOpen(value)
        }}
        trackAnchor={false}
      >
        <Button
          ref={ref}
          data-slot="filter-value"
          data-column-type={column.type}
          variant="ghost"
          className={cn(filterValueVariants({ variant }), className)}
          onClick={handleClick}
        >
          <FilterValueDisplay
            filter={filter}
            column={column}
            locale={locale}
            entityName={entityName}
          />
        </Button>
      </DropdownMenu>
    )
  },
)

FilterValue.displayName = 'FilterValue'

export { FilterValue }

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
  entityName,
}: FilterValueDisplayProps<TData, TType>) {
  switch (column.type) {
    case 'option':
      return (
        <FilterValueOptionDisplay
          filter={filter as FilterModel<'option'>}
          column={column as Column<TData, 'option'>}
        />
      )
    case 'multiOption':
      return (
        <FilterValueMultiOptionDisplay
          filter={filter as FilterModel<'multiOption'>}
          column={column as Column<TData, 'multiOption'>}
        />
      )
    case 'date':
      return <FilterValueDateDisplay filter={filter as FilterModel<'date'>} />
    case 'text':
      return <FilterValueTextDisplay filter={filter as FilterModel<'text'>} />
    case 'number':
      return (
        <FilterValueNumberDisplay
          filter={filter as FilterModel<'number'>}
          locale={locale}
        />
      )
    case 'boolean':
      return (
        <FilterValueBooleanDisplay
          filter={filter as FilterModel<'boolean'>}
          column={column as Column<TData, 'boolean'>}
        />
      )
    default:
      return null
  }
}

function FilterValueOptionDisplay<TData>({
  filter,
  column,
}: {
  filter: FilterModel<'option'>
  column: Column<TData, 'option'>
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

function FilterValueMultiOptionDisplay<TData>({
  filter,
  column,
}: {
  filter: FilterModel<'multiOption'>
  column: Column<TData, 'multiOption'>
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

function FilterValueBooleanDisplay<TData>({
  filter,
  column,
}: {
  filter: FilterModel<'boolean'>
  column: Column<TData, 'boolean'>
}) {
  if (!filter || filter.values.length === 0) return null
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
