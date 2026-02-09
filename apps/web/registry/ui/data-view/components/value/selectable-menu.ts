import type {
  Column,
  ColumnOption,
  ColumnOptionExtended,
  FilterModel,
  FilterStrategy,
  Locale,
  ViewLayer,
} from '@bazza-ui/data-view/react'
import type { CheckboxItemDef } from '@bazza-ui/react'
import { createOptionItemRenderer } from './option-item'

export type SelectableColumnType = 'option' | 'multiOption'

export interface CreateSelectableMenuResult {
  nodes: CheckboxItemDef[]
}

interface CreateSelectableMenuInternalParams<TData> {
  column: Column<TData, 'option'> | Column<TData, 'multiOption'>
  layer: ViewLayer<TData>
  filter?: FilterModel<'option'> | FilterModel<'multiOption'>
  locale?: Locale
  strategy?: FilterStrategy
}

// ============================================================================
// Shared helper: ColumnOption[] → CheckboxItemDef[]
// ============================================================================

/**
 * Converts an array of ColumnOption objects into CheckboxItemDef nodes
 * for use with the dropdown-menu Data-First API.
 *
 * This is the shared conversion logic used by both the synchronous path
 * (createSelectableMenuInternal) and the async path (AsyncOptionsNodeLoader).
 */
export function optionsToCheckboxItemDefs<TData>(
  options: ColumnOption[],
  column: Column<TData, 'option'> | Column<TData, 'multiOption'>,
  layer: ViewLayer<TData>,
  filter?: FilterModel<'option'> | FilterModel<'multiOption'>,
  counts?: Map<string, number>,
): CheckboxItemDef[] {
  return options.map((option) => {
    const isCurrentlySelected =
      filter?.values.includes(option.value as string) ?? false
    const optionData: ColumnOptionExtended = {
      value: option.value as string,
      label: option.label,
      icon: option.icon,
      count: option.count ?? counts?.get(option.value as string) ?? 0,
    }

    return {
      kind: 'checkbox-item' as const,
      id: option.value as string,
      value: option.label,
      keywords: [option.value as string, option.label],
      checked: isCurrentlySelected,
      onCheckedChange: (checked: boolean) => {
        if (checked) {
          layer.addFilterValue(column as Column<TData, 'option'>, [
            option.value as string,
          ])
        } else {
          layer.removeFilterValue(column as Column<TData, 'option'>, [
            option.value as string,
          ])
        }
      },
      closeOnClick: false,
      render: createOptionItemRenderer(optionData),
    } satisfies CheckboxItemDef
  })
}

// ============================================================================
// Internal: sync implementation using optionsToCheckboxItemDefs
// ============================================================================

/**
 * Internal implementation for creating selectable menu nodes.
 * Used by both createOptionMenu and createMultiOptionMenu.
 */
function createSelectableMenuInternal<TData>({
  column,
  layer,
  filter,
}: CreateSelectableMenuInternalParams<TData>): CreateSelectableMenuResult {
  const counts = column.getFacetedUniqueValues()
  const options = column.getOptions()
  const nodes = optionsToCheckboxItemDefs(
    options,
    column,
    layer,
    filter,
    counts,
  )
  return { nodes }
}

// ============================================================================
// Public API - Type-safe wrappers
// ============================================================================

export interface CreateOptionMenuProps<TData> {
  column: Column<TData, 'option'>
  layer: ViewLayer<TData>
  filter?: FilterModel<'option'>
  locale?: Locale
  strategy?: FilterStrategy
}

export interface CreateMultiOptionMenuProps<TData> {
  column: Column<TData, 'multiOption'>
  layer: ViewLayer<TData>
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
  layer,
  filter,
  locale,
  strategy,
}: CreateOptionMenuProps<TData>): CreateOptionMenuResult {
  return createSelectableMenuInternal({
    column: column as unknown as Column<TData, 'option'>,
    layer,
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
  layer,
  filter,
  locale,
  strategy,
}: CreateMultiOptionMenuProps<TData>): CreateMultiOptionMenuResult {
  return createSelectableMenuInternal({
    column: column as unknown as Column<TData, 'multiOption'>,
    layer,
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
    column: props.column as unknown as Column<TData, 'option'>,
    layer: props.layer,
    filter: props.filter,
    locale: props.locale,
    strategy: props.strategy,
  })
}
