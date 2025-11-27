import type { CheckboxItemDef, DropdownNodeDef } from '@bazza-ui/dropdown-menu'
import type { ColumnOptionExtended, FilterModel } from '@bazza-ui/filters'
import type { FilterValueControllerProps } from './types'

/**
 * A checkbox item node with option data.
 * Uses `unknown` data type for compatibility with DropdownMenu's generic types.
 */
export type OptionMenuNode = CheckboxItemDef & { id: string }

export interface CreateOptionMenuProps<TData>
  extends Omit<FilterValueControllerProps<TData, 'option'>, 'filter'> {
  filter?: FilterModel<'option'>
}

export interface CreateOptionMenuResult {
  nodes: DropdownNodeDef[]
}

/**
 * Creates option menu for filter values
 * Uses sticky rows middleware to keep checked items at the top
 */
export function createOptionMenu<TData>({
  column,
  actions,
  filter,
}: CreateOptionMenuProps<TData>): CreateOptionMenuResult {
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
    } satisfies OptionMenuNode
  })

  return {
    nodes,
  }
}
