import type { ColumnOptionExtended, FilterModel } from '@bazza-ui/filters'
import type { CheckboxItemDef } from '@bazza-ui/react'
import { createOptionItemRenderer } from './option-item'
import type { FilterValueControllerProps } from './types'

export interface CreateOptionMenuProps<TData>
  extends Omit<FilterValueControllerProps<TData, 'option'>, 'filter'> {
  filter?: FilterModel<'option'>
}

export interface CreateOptionMenuResult {
  nodes: CheckboxItemDef[]
}

/**
 * Creates option menu nodes for filter values.
 * Returns CheckboxItemDef[] for use with the Data-First API.
 */
export function createOptionMenu<TData>({
  column,
  actions,
  filter,
}: CreateOptionMenuProps<TData>): CreateOptionMenuResult {
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
