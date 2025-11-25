import type { SubmenuDef } from '@bazza-ui/dropdown-menu'
import type {
  Column,
  DataTableFilterActions,
  FilterModel,
  TextFilterOperator,
} from '@bazza-ui/filters'
import type { MenuMiddleware } from '@bazza-ui/menu/middleware'
import { TextItem } from '../shared/text-item'
import type { FilterValueControllerProps } from '../shared/types'

/**
 * Middleware that generates filter operator options based on search query
 */
export function createTextFilterMiddleware<TData>({
  column,
  actions,
}: {
  column: Column<TData, 'text'>
  actions: DataTableFilterActions
}): MenuMiddleware {
  return {
    transformNodes: (context: any) => {
      const { query, mode, createNode } = context

      // Only inject items in search mode when there's a query
      if (mode !== 'search' || !query?.trim()) {
        return []
      }

      const changeText = (value: string, operator: TextFilterOperator) => {
        actions.batch((tx) => {
          tx.setFilterValue(column, [String(value)])
          tx.setFilterOperator(column.id, operator)
        })
      }

      return [
        createNode({
          kind: 'item',
          id: `${column.id}-text-contains`,
          label: `contains ${query}`,
          data: {
            operator: 'contains',
            values: [query],
          } as FilterModel<'text'>,
          keywords: [query],
          onSelect: () => {
            changeText(query, 'contains')
          },
        }),
        createNode({
          kind: 'item',
          id: `${column.id}-text-does-not-contain`,
          label: `does not contain ${query}`,
          data: {
            operator: 'does not contain',
            values: [query],
          } as FilterModel<'text'>,
          keywords: [query],
          onSelect: () => {
            changeText(query, 'does not contain')
          },
        }),
      ]
    },
  }
}

export function createTextMenu<TData>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueControllerProps<TData, 'text'>): SubmenuDef {
  return {
    kind: 'submenu',
    id: column.id,
    icon: column.icon,
    label: column.displayName,
    inputPlaceholder: `Enter ${column.displayName.toLowerCase()}...`,
    defaults: {
      item: {
        closeOnSelect: true,
      },
    },
    ui: {
      slots: {
        Item: TextItem as any,
      },
      slotProps: {
        positioner: {
          sub: {
            align: 'start',
            // alignOffset: 4,
          },
        },
      },
    },
    middleware: createTextFilterMiddleware({ column, actions }),
  }
}
