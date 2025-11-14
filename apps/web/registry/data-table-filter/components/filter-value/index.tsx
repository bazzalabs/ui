/** biome-ignore-all lint/correctness/useUniqueElementIds: not needed */

'use client'

import type { MenuDef } from '@bazza-ui/action-menu'
import type { Column, ColumnDataType, FilterModel } from '@bazza-ui/filters'
import { memo, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ActionMenu } from '@/registry/action-menu'
import { FilterValueBooleanDisplay } from './boolean'
import { FilterValueDateController, FilterValueDateDisplay } from './date'
import {
  createMultiOptionMenu,
  FilterValueMultiOptionController,
  FilterValueMultiOptionDisplay,
} from './multi-option'
import { FilterValueNumberController, FilterValueNumberDisplay } from './number'
import {
  createOptionMenu,
  FilterValueOptionController,
  FilterValueOptionDisplay,
} from './option'
import { OptionItem_v2 } from './shared/option-item'
import { TextItem_v2 } from './shared/text-item'
import type {
  FilterValueControllerProps,
  FilterValueDisplayProps,
  FilterValueProps,
} from './shared/types'
import {
  createTextMenu,
  FilterValueTextController,
  FilterValueTextDisplay,
} from './text'

export const FilterValue = memo(__FilterValue) as typeof __FilterValue

function __FilterValue<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  strategy,
  locale,
  entityName,
}: FilterValueProps<TData, TType>) {
  // Use ref to capture current filter value for loaders
  const filterRef = useRef(filter)
  useEffect(() => {
    filterRef.current = filter
  }, [filter])

  // Use ref to persist initial selected values across re-renders for sticky grouping
  const initialSelectedValuesRef = useRef<Set<string> | null>(null)

  // Don't open the value controller for boolean columns
  // We can toggle the filter operator instead
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (column.type === 'boolean') e.preventDefault()
  }

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
      return {
        id: `filter-value-${column.id}`,
        ...createOptionMenu({
          filter: undefined as any,
          column: column as Column<TData, 'option'>,
          actions,
          locale,
          strategy,
          getFilter: () =>
            filterRef.current as FilterModel<'option'> | undefined,
          initialSelectedValuesRef,
        }),
      }
    }

    if (column.type === 'multiOption') {
      return {
        id: `filter-value-${column.id}`,
        ...createMultiOptionMenu({
          filter: undefined as any,
          column: column as Column<TData, 'multiOption'>,
          actions,
          locale,
          strategy,
          getFilter: () =>
            filterRef.current as FilterModel<'multiOption'> | undefined,
          initialSelectedValuesRef,
        }),
      }
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

    // For boolean type, use a custom render function
    return {
      id: `filter-value-${column.id}`,
      nodes: [],
      render: () => (
        <FilterValueController
          filter={filter as any}
          column={column as any}
          actions={actions}
          strategy={strategy}
          locale={locale}
        />
      ),
    }
  }, [column, filter, actions, locale, strategy])

  return (
    <ActionMenu
      slots={{
        Item: (column.type === 'text' ? TextItem_v2 : OptionItem_v2) as any,
      }}
      menu={menu}
      onOpenChange={(open) => {
        // Reset initial selected values when menu closes to capture fresh state on next open
        if (!open) {
          initialSelectedValuesRef.current = null
        }
      }}
    >
      <ActionMenu.Trigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'm-0 h-full w-fit whitespace-nowrap rounded-none p-0 px-2 text-xs',
            column.type === 'boolean' && 'hover:bg-inherit',
          )}
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
      </ActionMenu.Trigger>
    </ActionMenu>
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
    case 'option':
      return (
        <FilterValueOptionController
          filter={filter as FilterModel<'option'>}
          column={column as Column<TData, 'option'>}
          actions={actions}
          strategy={strategy}
          locale={locale}
        />
      )
    case 'multiOption':
      return (
        <FilterValueMultiOptionController
          filter={filter as FilterModel<'multiOption'>}
          column={column as Column<TData, 'multiOption'>}
          actions={actions}
          strategy={strategy}
          locale={locale}
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
          filter={filter as FilterModel<'text'>}
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

export {
  FilterValueBooleanController,
  FilterValueBooleanDisplay,
} from './boolean'
// Re-export utility functions
export {
  FilterValueDateController,
  FilterValueDateDisplay,
  formatDateRange,
} from './date'
export {
  createMultiOptionMenu,
  FilterValueMultiOptionController,
  FilterValueMultiOptionDisplay,
} from './multi-option'
export { FilterValueNumberController, FilterValueNumberDisplay } from './number'
export {
  createOptionMenu,
  FilterValueOptionController,
  FilterValueOptionDisplay,
} from './option'
// Re-export utility components
export { OptionItem, OptionItem_v2 } from './shared/option-item'
export { TextItem_v2 } from './shared/text-item'
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
  FilterValueTextController,
  FilterValueTextController_v2,
  FilterValueTextDisplay,
} from './text'
