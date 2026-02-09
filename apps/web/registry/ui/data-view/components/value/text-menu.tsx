import type {
  Column,
  DataViewInstance,
  ViewLayer,
} from '@bazza-ui/data-view/react'
import type { ItemDef } from '@bazza-ui/react'
import { createTextItemRenderer } from './text-item'

/**
 * Data structure for text filter menu items.
 * Used to display operator and value in the TextItem component.
 */
export interface TextFilterItemData {
  operator: string
  values: string[]
}

/**
 * Creates text filter items based on the current search query.
 * This is called dynamically when the search changes.
 */
export function createTextFilterItems<TData>({
  query,
  column,
  layer,
  instance,
}: {
  query: string
  column: Column<TData, 'text'>
  layer: ViewLayer<TData>
  instance?: DataViewInstance<TData, any, any>
}): ItemDef[] {
  // Only show items when there's a query
  if (!query?.trim()) {
    return []
  }

  const changeText = (value: string, operator: string) => {
    if (instance) {
      instance.batch((tx) => {
        tx.setFilterValue(column, [String(value)])
        tx.setFilterOperator(column.id, operator)
      })
    } else {
      layer.setFilterValue(column, [String(value)])
      layer.setFilterOperator(column.id, operator)
    }
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
      value: `contains ${query}`,
      keywords: [query],
      onSelect: () => {
        changeText(query, 'contains')
      },
      render: createTextItemRenderer(containsData),
    } satisfies ItemDef,
    {
      kind: 'item' as const,
      id: `${column.id}-text-does-not-contain-${query}`,
      value: `does not contain ${query}`,
      keywords: [query],
      onSelect: () => {
        changeText(query, 'does not contain')
      },
      render: createTextItemRenderer(doesNotContainData),
    } satisfies ItemDef,
  ]
}
