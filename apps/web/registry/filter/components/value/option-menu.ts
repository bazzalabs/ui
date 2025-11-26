import type { CheckboxItemDef } from '@bazza-ui/dropdown-menu'
import type { ColumnOptionExtended } from '@bazza-ui/filters'
import type { FilterValueControllerProps } from './types'

/**
 * Creates option menu for filter values
 * Uses sticky rows middleware to keep checked items at the top
 */
export function createOptionMenu<TData>({
  column,
  actions,
  getFilter,
}: Omit<FilterValueControllerProps<TData, 'option'>, 'filter'> & {
  filter?: FilterValueControllerProps<TData, 'option'>['filter']
  getFilter?: () => any
}): {
  nodes: (CheckboxItemDef<ColumnOptionExtended> & { id: string })[]
} {
  const currentFilter = getFilter?.()

  const counts = column.getFacetedUniqueValues()
  const nodes = column.getOptions().map((option) => {
    const isCurrentlySelected =
      currentFilter?.values.includes(option.value) ?? false

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
      } as ColumnOptionExtended,
      closeOnSelect: false,
    } as any
  })

  return {
    nodes,
  }
}
