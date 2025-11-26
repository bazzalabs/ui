import type { CheckboxItemDef, DropdownNodeDef } from '@bazza-ui/dropdown-menu'
import type { ColumnOptionExtended, FilterModel } from '@bazza-ui/filters'
import type { FilterValueControllerProps } from './types'

/**
 * A checkbox item node with option data.
 * Uses `unknown` data type for compatibility with DropdownMenu's generic types.
 */
export type MultiOptionMenuNode = CheckboxItemDef & { id: string }

export interface CreateMultiOptionMenuProps<TData>
  extends Omit<FilterValueControllerProps<TData, 'multiOption'>, 'filter'> {
  filter?: FilterModel<'multiOption'>
}

export interface CreateMultiOptionMenuResult {
  nodes: DropdownNodeDef[]
}

/**
 * Creates multiOption menu for filter values
 * Uses sticky rows middleware to keep checked items at the top
 */
export function createMultiOptionMenu<TData>({
  column,
  actions,
  filter,
}: CreateMultiOptionMenuProps<TData>): CreateMultiOptionMenuResult {
  const counts = column.getFacetedUniqueValues()
  const nodes: DropdownNodeDef[] = column.getOptions().map((option) => {
    const isCurrentlySelected = filter?.values.includes(option.value) ?? false

    return {
      kind: 'item' as const,
      variant: 'checkbox' as const,
      id: option.value,
      label: option.label,
      keywords: [option.value, option.label],
      icon: option.icon,
      checked: isCurrentlySelected,
      onCheckedChange: (checked: boolean) => {
        if (checked) {
          actions.addFilterValue(column, [option.value])
        } else {
          actions.removeFilterValue(column, [option.value])
        }
      },
      data: {
        value: option.value,
        label: option.label,
        icon: option.icon,
        count: counts?.get(option.value) ?? 0,
      } satisfies ColumnOptionExtended,
      closeOnSelect: false,
    } satisfies MultiOptionMenuNode
  })

  return {
    nodes,
  }
}
