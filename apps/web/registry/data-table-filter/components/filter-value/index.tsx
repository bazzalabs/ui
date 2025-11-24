/** biome-ignore-all lint/correctness/useUniqueElementIds: not needed */

'use client'

import {
  type MenuDef,
  type SeparatorDef,
  stickyRows,
} from '@bazza-ui/dropdown-menu'
import type {
  Column,
  ColumnDataType,
  ColumnOptionExtended,
  FilterModel,
} from '@bazza-ui/filters'
import { shouldEnableStreaming } from '@bazza-ui/menu'
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

  const initialFilterValuesRef = useRef<string[]>([])

  // Create menu configuration for all column types
  const menu: MenuDef = useMemo(() => {
    // For text, option, and multiOption types, use the existing menu creators
    if (column.type === 'text') {
      return {
        id: `filter-value-${column.id}`,
        ...(createTextMenu({
          filter: filter as FilterModel<'text'>,
          column: column as Column<TData, 'text'>,
          actions,
          locale,
          strategy,
        }) as any),
      }
    }

    if (column.type === 'option') {
      const { nodes } = createOptionMenu({
        filter: undefined as any,
        column: column as Column<TData, 'option'>,
        actions,
        locale,
        strategy,
        getFilter: () => filterRef.current as FilterModel<'option'> | undefined,
      })

      const selected = nodes.filter((node) =>
        initialFilterValuesRef.current.includes(node.id),
      )

      const unselected = nodes.filter(
        (node) => !initialFilterValuesRef.current.includes(node.id),
      )

      const separator = {
        id: 'separator',
        kind: 'separator',
      } satisfies SeparatorDef

      const showSeparator = selected.length > 0 && unselected.length > 0

      return {
        id: `filter-value-${column.id}`,
        nodes: [
          ...selected,
          ...(showSeparator ? [separator] : []),
          ...unselected,
        ],
      } satisfies MenuDef<ColumnOptionExtended>
    }

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

      const selected = nodes.filter((node) =>
        initialFilterValuesRef.current.includes(node.id),
      )

      const unselected = nodes.filter(
        (node) => !initialFilterValuesRef.current.includes(node.id),
      )

      const separator = {
        id: 'separator',
        kind: 'separator',
      } satisfies SeparatorDef

      return {
        id: `filter-value-${column.id}`,
        nodes: [
          ...selected,
          ...(showSeparator ? [separator] : []),
          ...unselected,
        ],
      } satisfies MenuDef<ColumnOptionExtended>
    }

    // For date type, use custom render function
    if (column.type === 'date') {
      return {
        id: `filter-value-${column.id}`,
        nodes: [],
        render: () => (
          <FilterValueDateController
            filter={filter as FilterModel<'date'>}
            column={column as Column<TData, 'date'>}
            actions={actions}
            strategy={strategy}
            locale={locale}
          />
        ),
      }
    }

    // For number type, use custom render function
    if (column.type === 'number') {
      return {
        id: `filter-value-${column.id}`,
        nodes: [],
        render: () => (
          <FilterValueNumberController
            filter={filter as FilterModel<'number'>}
            column={column as Column<TData, 'number'>}
            actions={actions}
            strategy={strategy}
            locale={locale}
          />
        ),
      }
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
        Item:
          column.type === 'text'
            ? TextItem
            : ['option', 'multiOption'].includes(column.type)
              ? OptionItem
              : undefined,
      }}
      menu={menu}
      open={open}
      onOpenChange={(value) => {
        if (value) {
          initialFilterValuesRef.current = filter.values as string[]
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
  switch (column.type) {
    case 'option':
      return (
        <FilterValueOptionDisplay
          filter={filter as FilterModel<'option'>}
          column={column as Column<TData, 'option'>}
          actions={actions}
          locale={locale}
        />
      )
    case 'multiOption':
      return (
        <FilterValueMultiOptionDisplay
          filter={filter as FilterModel<'multiOption'>}
          column={column as Column<TData, 'multiOption'>}
          actions={actions}
          locale={locale}
        />
      )
    case 'date':
      return (
        <FilterValueDateDisplay
          filter={filter as FilterModel<'date'>}
          column={column as Column<TData, 'date'>}
          actions={actions}
          locale={locale}
        />
      )
    case 'text':
      return (
        <FilterValueTextDisplay
          filter={filter as FilterModel<'text'>}
          column={column as Column<TData, 'text'>}
          actions={actions}
          locale={locale}
        />
      )
    case 'number':
      return (
        <FilterValueNumberDisplay
          filter={filter as FilterModel<'number'>}
          column={column as Column<TData, 'number'>}
          actions={actions}
          locale={locale}
        />
      )
    case 'boolean':
      return (
        <FilterValueBooleanDisplay
          filter={filter as FilterModel<'boolean'>}
          column={column as Column<TData, 'boolean'>}
          actions={actions}
          locale={locale}
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
  switch (column.type) {
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
