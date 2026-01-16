import type {
  Column,
  DataTableFilterActions,
  TextFilterOperator,
} from '@bazza-ui/filters'
import type { ItemDef } from '@bazza-ui/react'
import { createTextItemRenderer } from './text-item'

/**
 * Data structure for text filter menu items.
 * Used to display operator and value in the TextItem component.
 */
export interface TextFilterItemData {
  operator: TextFilterOperator
  values: string[]
}

/**
 * Creates text filter items based on the current search query.
 * This is called dynamically when the search changes.
 */
export function createTextFilterItems<TData>({
  query,
  column,
  actions,
}: {
  query: string
  column: Column<TData, 'text'>
  actions: DataTableFilterActions
}): ItemDef[] {
  // Only show items when there's a query
  if (!query?.trim()) {
    return []
  }

  const changeText = (value: string, operator: TextFilterOperator) => {
    actions.batch((tx) => {
      tx.setFilterValue(column, [String(value)])
      tx.setFilterOperator(column.id, operator)
    })
  }

  const containsData: TextFilterItemData = {
    operator: 'contains',
    values: [query],
  }

  const doesNotContainData: TextFilterItemData = {
    operator: 'does not contain',
    values: [query],
  }

  return [
    {
      kind: 'item' as const,
      id: `${column.id}-text-contains-${query}`,
      label: `contains ${query}`,
      keywords: [query],
      onSelect: () => {
        changeText(query, 'contains')
      },
      render: createTextItemRenderer(containsData),
    } satisfies ItemDef,
    {
      kind: 'item' as const,
      id: `${column.id}-text-does-not-contain-${query}`,
      label: `does not contain ${query}`,
      keywords: [query],
      onSelect: () => {
        changeText(query, 'does not contain')
      },
      render: createTextItemRenderer(doesNotContainData),
    } satisfies ItemDef,
  ]
}
