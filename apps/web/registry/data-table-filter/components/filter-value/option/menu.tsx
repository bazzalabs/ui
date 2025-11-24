import type { SubmenuDef } from '@bazza-ui/dropdown-menu'
import type { ColumnOptionExtended } from '@bazza-ui/filters'
import type { FilterValueControllerProps } from '../shared/types'

/**
 * Creates option menu with sticky grouping
 * Sticky grouping keeps items in their original groups (selected/unselected) based on initial state
 * Uses nodes for reactive updates and middleware to maintain grouping during search
 */
export function createOptionMenu<TData>({
  filter,
  column,
  actions,
  locale = 'en',
  getFilter,
  initialSelectedValuesRef,
}: FilterValueControllerProps<TData, 'option'> & {
  getFilter?: () => any
  initialSelectedValuesRef: React.RefObject<Set<string> | null>
}): Pick<SubmenuDef, 'nodes' | 'middleware'> {
  const currentFilter = (getFilter ? getFilter() : filter) || filter

  // Capture initial state for sticky grouping (only once when menu first opens)
  if (!initialSelectedValuesRef.current) {
    initialSelectedValuesRef.current = new Set(currentFilter?.values || [])
  }

  const counts = column.getFacetedUniqueValues()
  const nodes = column.getOptions().map((option) => {
    const wasInitiallySelected = initialSelectedValuesRef.current!.has(
      option.value,
    )
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
        initialGroup: wasInitiallySelected ? 'selected' : 'unselected',
      } as ColumnOptionExtended,
      closeOnSelect: false,
    } as any
  })

  return {
    nodes,
  }
}
