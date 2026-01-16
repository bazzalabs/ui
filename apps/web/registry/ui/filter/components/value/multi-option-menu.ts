import type { ColumnOptionExtended, FilterModel } from '@bazza-ui/filters'
import type { CheckboxItemDef } from '@bazza-ui/react'
import { createOptionItemRenderer } from './option-item'
import type { FilterValueControllerProps } from './types'

export interface CreateMultiOptionMenuProps<TData>
  extends Omit<FilterValueControllerProps<TData, 'multiOption'>, 'filter'> {
  filter?: FilterModel<'multiOption'>
}

export interface CreateMultiOptionMenuResult {
  nodes: CheckboxItemDef[]
}

/**
 * Creates multiOption menu nodes for filter values.
 * Returns CheckboxItemDef[] for use with the Data-First API.
 */
export function createMultiOptionMenu<TData>({
  column,
  actions,
  filter,
}: CreateMultiOptionMenuProps<TData>): CreateMultiOptionMenuResult {
  const counts = column.getFacetedUniqueValues()
  const nodes: CheckboxItemDef[] = column.getOptions().map((option) => {
    const isCurrentlySelected = filter?.values.includes(option.value) ?? false
    const optionData: ColumnOptionExtended = {
      value: option.value,
      label: option.label,
      icon: option.icon,
      count: counts?.get(option.value) ?? 0,
    }

    return {
      kind: 'checkbox-item' as const,
      id: option.value,
      label: option.label,
      keywords: [option.value, option.label],
      checked: isCurrentlySelected,
      onCheckedChange: (checked: boolean) => {
        if (checked) {
          actions.addFilterValue(column, [option.value])
        } else {
          actions.removeFilterValue(column, [option.value])
        }
      },
      closeOnSelect: false,
      render: createOptionItemRenderer(optionData),
    } satisfies CheckboxItemDef
  })

  return {
    nodes,
  }
}
