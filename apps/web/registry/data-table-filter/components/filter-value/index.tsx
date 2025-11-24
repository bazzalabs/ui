/** biome-ignore-all lint/correctness/useUniqueElementIds: not needed */

'use client'

import type { MenuDef, SeparatorDef } from '@bazza-ui/dropdown-menu'
import type {
  Column,
  ColumnDataType,
  ColumnOptionExtended,
  FilterModel,
  FilterValues,
} from '@bazza-ui/filters'
import { cva } from 'class-variance-authority'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/dropdown-menu'
import { useFilterVariant } from '../../context'
import { FilterValueBooleanDisplay } from './boolean'
import { FilterValueDateController, FilterValueDateDisplay } from './date'
import {
  createMultiOptionMenu,
  FilterValueMultiOptionDisplay,
} from './multi-option'
import { FilterValueNumberController, FilterValueNumberDisplay } from './number'
import { createOptionMenu, FilterValueOptionDisplay } from './option'
import { OptionItem } from './shared/option-item'
import { TextItem } from './shared/text-item'
import type {
  FilterValueControllerProps,
  FilterValueDisplayProps,
  FilterValueProps,
} from './shared/types'
import { createTextMenu, FilterValueTextDisplay } from './text'

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
function createMenuWithSeparator<TType extends ColumnDataType>(
  columnId: string,
  nodes: any[],
  initialValues: FilterValues<TType>,
): MenuDef<ColumnOptionExtended> {
  const { selected, unselected } = partitionNodesBySelection(
    nodes,
    initialValues as string[],
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

export const FilterValue = memo(__FilterValue) as typeof __FilterValue

function __FilterValue<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  strategy,
  locale,
  entityName,
  className,
  variant: variantProp,
}: FilterValueProps<TData, TType>) {
  const contextVariant = useFilterVariant()
  const variant = variantProp ?? contextVariant ?? 'default'

  const [open, setOpen] = useState(false)

  // Use ref to capture current filter value for loaders
  const filterRef = useRef(filter)
  useEffect(() => {
    filterRef.current = filter
  }, [filter])

  // Don't open the value controller for boolean columns
  // We can toggle the filter operator instead
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (column.type === 'boolean') e.preventDefault()
  }

  const initialFilterValuesRef = useRef<FilterValues<TType>>([])

  // Create menu configuration for all column types
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-create on open to show new selection order
  const menu: MenuDef = useMemo(() => {
    const baseId = `filter-value-${column.id}`

    // For text type, use the text menu creator
    if (column.type === 'text') {
      return {
        id: baseId,
        ...(createTextMenu({
          filter: filter as FilterModel<'text'>,
          column: column as Column<TData, 'text'>,
          actions,
          locale,
          strategy,
        }) as any),
      }
    }

    // For option type
    if (column.type === 'option') {
      const { nodes } = createOptionMenu({
        filter: undefined as any,
        column: column as Column<TData, 'option'>,
        actions,
        locale,
        strategy,
        getFilter: () => filterRef.current as FilterModel<'option'> | undefined,
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
        filter: undefined as any,
        column: column as Column<TData, 'multiOption'>,
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
          actions={actions}
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
      menu={menu}
      open={open}
      onOpenChange={(value) => {
        if (value) {
          initialFilterValuesRef.current = filter.values
        }

        setOpen(value)
      }}
    >
      <Button
        data-slot="filter-value"
        data-column-type={column.type}
        variant="ghost"
        className={cn(filterValueVariants({ variant }), className)}
        onClick={handleClick}
      >
        <FilterValueDisplay
          filter={filter}
          column={column}
          actions={actions}
          locale={locale}
          entityName={entityName}
        />
      </Button>
    </DropdownMenu>
  )
}

export function FilterValueDisplay<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  locale = 'en',
  entityName,
}: FilterValueDisplayProps<TData, TType>) {
  // Use a switch statement but with a more DRY approach
  const commonProps = { actions, locale }

  switch (column.type) {
    case 'option':
      return (
        <FilterValueOptionDisplay
          {...commonProps}
          filter={filter as FilterModel<'option'>}
          column={column as Column<TData, 'option'>}
        />
      )
    case 'multiOption':
      return (
        <FilterValueMultiOptionDisplay
          {...commonProps}
          filter={filter as FilterModel<'multiOption'>}
          column={column as Column<TData, 'multiOption'>}
        />
      )
    case 'date':
      return (
        <FilterValueDateDisplay
          {...commonProps}
          filter={filter as FilterModel<'date'>}
          column={column as Column<TData, 'date'>}
        />
      )
    case 'text':
      return (
        <FilterValueTextDisplay
          {...commonProps}
          filter={filter as FilterModel<'text'>}
          column={column as Column<TData, 'text'>}
        />
      )
    case 'number':
      return (
        <FilterValueNumberDisplay
          {...commonProps}
          filter={filter as FilterModel<'number'>}
          column={column as Column<TData, 'number'>}
        />
      )
    case 'boolean':
      return (
        <FilterValueBooleanDisplay
          {...commonProps}
          filter={filter as FilterModel<'boolean'>}
          column={column as Column<TData, 'boolean'>}
          entityName={entityName}
        />
      )
    default:
      return null
  }
}

export const FilterValueController = memo(
  __FilterValueController,
) as typeof __FilterValueController

function __FilterValueController<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  strategy,
  locale = 'en',
}: FilterValueControllerProps<TData, TType>) {
  const commonProps = { actions, strategy, locale }

  if (column.type === 'date') {
    return (
      <FilterValueDateController
        {...commonProps}
        filter={filter as FilterModel<'date'>}
        column={column as Column<TData, 'date'>}
      />
    )
  }

  if (column.type === 'number') {
    return (
      <FilterValueNumberController
        {...commonProps}
        filter={filter as FilterModel<'number'>}
        column={column as Column<TData, 'number'>}
      />
    )
  }

  return null
}

export { FilterValueBooleanDisplay } from './boolean'
// Re-export utility functions
export {
  FilterValueDateController,
  FilterValueDateDisplay,
  formatDateRange,
} from './date'
export {
  createMultiOptionMenu,
  FilterValueMultiOptionDisplay,
} from './multi-option'
export { FilterValueNumberController, FilterValueNumberDisplay } from './number'
export { createOptionMenu, FilterValueOptionDisplay } from './option'
// Re-export utility components
export { OptionItem } from './shared/option-item'
export { TextItem } from './shared/text-item'
// Re-export types
export type {
  FilterValueControllerProps,
  FilterValueDisplayProps,
  FilterValueProps,
} from './shared/types'
// Re-export all display components
// Re-export all controller components
// Re-export menu creators
export {
  createTextFilterMiddleware,
  createTextMenu,
  FilterValueTextDisplay,
} from './text'
