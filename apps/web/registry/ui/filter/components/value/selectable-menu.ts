import type {
  Column,
  ColumnOptionExtended,
  DataTableFilterActions,
  FilterModel,
  FilterStrategy,
  Locale,
} from '@bazza-ui/filters'
import type { CheckboxItemDef } from '@bazza-ui/react'
import { createOptionItemRenderer } from './option-item'

export type SelectableColumnType = 'option' | 'multiOption'

export interface CreateSelectableMenuResult {
  nodes: CheckboxItemDef[]
}

interface CreateSelectableMenuInternalParams {
  column: Column<unknown, 'option'> | Column<unknown, 'multiOption'>
  actions: DataTableFilterActions
  filter?: FilterModel<'option'> | FilterModel<'multiOption'>
  locale?: Locale
  strategy?: FilterStrategy
}

/**
 * Internal implementation for creating selectable menu nodes.
 * Used by both createOptionMenu and createMultiOptionMenu.
 */
function createSelectableMenuInternal({
  column,
  actions,
  filter,
}: CreateSelectableMenuInternalParams): CreateSelectableMenuResult {
  const counts = column.getFacetedUniqueValues()
  const options = column.getOptions()

  const nodes: CheckboxItemDef[] = options.map((option) => {
    const isCurrentlySelected =
      filter?.values.includes(option.value as string) ?? false
    const optionData: ColumnOptionExtended = {
      value: option.value as string,
      label: option.label,
      icon: option.icon,
      count: counts?.get(option.value as string) ?? 0,
    }

    return {
      kind: 'checkbox-item' as const,
      id: option.value as string,
      value: option.label,
      keywords: [option.value as string, option.label],
      checked: isCurrentlySelected,
      onCheckedChange: (checked: boolean) => {
        if (checked) {
          actions.addFilterValue(column as Column<unknown, 'option'>, [
            option.value as string,
          ])
        } else {
          actions.removeFilterValue(column as Column<unknown, 'option'>, [
            option.value as string,
          ])
        }
      },
      closeOnClick: false,
      render: createOptionItemRenderer(optionData),
    } satisfies CheckboxItemDef
  })

  return { nodes }
}

// ============================================================================
// Public API - Type-safe wrappers
// ============================================================================

export interface CreateOptionMenuProps<TData> {
  column: Column<TData, 'option'>
  actions: DataTableFilterActions
  filter?: FilterModel<'option'>
  locale?: Locale
  strategy?: FilterStrategy
}

export interface CreateMultiOptionMenuProps<TData> {
  column: Column<TData, 'multiOption'>
  actions: DataTableFilterActions
  filter?: FilterModel<'multiOption'>
  locale?: Locale
  strategy?: FilterStrategy
}

export type CreateOptionMenuResult = CreateSelectableMenuResult
export type CreateMultiOptionMenuResult = CreateSelectableMenuResult

/**
 * Creates option menu nodes for filter values.
 * Returns CheckboxItemDef[] for use with the Data-First API.
 */
export function createOptionMenu<TData>({
  column,
  actions,
  filter,
  locale,
  strategy,
}: CreateOptionMenuProps<TData>): CreateOptionMenuResult {
  return createSelectableMenuInternal({
    column: column as unknown as Column<unknown, 'option'>,
    actions,
    filter,
    locale,
    strategy,
  })
}

/**
 * Creates multiOption menu nodes for filter values.
 * Returns CheckboxItemDef[] for use with the Data-First API.
 */
export function createMultiOptionMenu<TData>({
  column,
  actions,
  filter,
  locale,
  strategy,
}: CreateMultiOptionMenuProps<TData>): CreateMultiOptionMenuResult {
  return createSelectableMenuInternal({
    column: column as unknown as Column<unknown, 'multiOption'>,
    actions,
    filter,
    locale,
    strategy,
  })
}

/**
 * Unified function for creating selectable menu nodes.
 * Can be used when the column type is dynamically determined.
 */
export function createSelectableMenu<TData>(
  props: CreateOptionMenuProps<TData> | CreateMultiOptionMenuProps<TData>,
): CreateSelectableMenuResult {
  return createSelectableMenuInternal({
    column: props.column as unknown as Column<unknown, 'option'>,
    actions: props.actions,
    filter: props.filter,
    locale: props.locale,
    strategy: props.strategy,
  })
}
