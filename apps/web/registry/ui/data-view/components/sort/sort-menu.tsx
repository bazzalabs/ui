'use client'

import type { Column, SortRule, ViewLayer } from '@bazza-ui/data-view/react'
import type { ItemDef, ItemRenderParams, NodeDef } from '@bazza-ui/react'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'
import * as React from 'react'
import { isValidElement, memo, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DropdownMenu, LabelWithBreadcrumbs } from '@/registry/ui/dropdown-menu'
import {
  type DataViewVariant,
  useDataViewContext,
} from '../root/data-view-context'

export interface SortMenuProps<TData = unknown> {
  columns?: Column<TData>[]
  sort?: SortRule[]
  layer?: ViewLayer<TData>
  children?: React.ReactElement
  rootProps?: Partial<
    Omit<React.ComponentProps<typeof DropdownMenu.Root>, 'children'>
  >
  variant?: DataViewVariant
}

function renderColumnIcon(icon: unknown): React.ReactNode {
  if (!icon) return null

  return (
    <div className="size-4 flex items-center justify-center">
      {isValidElement(icon) ? (
        icon
      ) : (
        <DropdownMenu.Icon>
          {React.createElement(
            icon as React.ComponentType<{ className?: string }>,
            {
              className:
                'size-4 shrink-0 text-muted-foreground group-data-[highlighted]/row:text-primary',
            },
          )}
        </DropdownMenu.Icon>
      )}
    </div>
  )
}

function __SortMenu<TData>({
  columns: columnsProp,
  sort: sortProp,
  layer: layerProp,
  children,
  rootProps,
}: SortMenuProps<TData>) {
  const context = useDataViewContext<TData>()

  const columns = columnsProp ?? context.columns
  const sort = sortProp ?? context.sort
  const layer = layerProp ?? context.layer

  const sortableColumns = useMemo(
    () => columns.filter((c) => c.sortable && !c.hidden),
    [columns],
  )

  const nodes: NodeDef[] = useMemo(
    () =>
      sortableColumns.map((column): ItemDef => {
        const currentSort = sort.find(
          (s): s is SortRule & { type: 'column' } =>
            s.type === 'column' && s.columnId === column.id,
        )
        const sortDir = currentSort?.direction

        return {
          kind: 'item',
          id: `sort-${column.id}`,
          value: column.displayName,
          keywords: [column.displayName],
          onSelect: () => {
            layer.toggleColumnSort(column.id)
          },
          render: ({ context: itemContext }: ItemRenderParams) => (
            <DropdownMenu.Item
              key={column.id}
              value={column.id}
              className="group/row justify-between gap-4"
            >
              <div className="flex items-center gap-2 min-w-0">
                {renderColumnIcon(column.icon)}
                <LabelWithBreadcrumbs
                  label={column.displayName}
                  breadcrumbs={
                    itemContext.isDeepSearchResult
                      ? itemContext.breadcrumbs
                      : undefined
                  }
                />
              </div>
              <div className="flex items-center gap-1">
                {sortDir === 'asc' ? (
                  <ArrowUpIcon className="size-3.5 text-primary" />
                ) : sortDir === 'desc' ? (
                  <ArrowDownIcon className="size-3.5 text-primary" />
                ) : (
                  <ArrowUpDownIcon className="size-3.5 opacity-0 group-data-[highlighted]/row:opacity-30" />
                )}
              </div>
            </DropdownMenu.Item>
          ),
        }
      }),
    [sortableColumns, sort, layer],
  )

  const hasSorts = sort.length > 0

  const triggerElement = children ?? (
    <Button
      data-slot="sort-menu-trigger"
      variant="outline"
      className={cn('h-7', hasSorts && 'w-fit !px-2')}
    >
      <ArrowUpDownIcon className="size-4" />
      {!hasSorts && <span>Sort</span>}
    </Button>
  )

  return (
    <DropdownMenu.Root {...rootProps}>
      <DropdownMenu.Trigger render={triggerElement} />
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner align="start">
          <DropdownMenu.Popup>
            <DropdownMenu.DataSurface content={nodes}>
              <DropdownMenu.DataInput placeholder="Search columns..." />
              <DropdownMenu.DataList>
                {({ nodes: displayNodes, renderNode }) =>
                  displayNodes.map(renderNode)
                }
              </DropdownMenu.DataList>
              <DropdownMenu.Empty>No matching columns.</DropdownMenu.Empty>
            </DropdownMenu.DataSurface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export const SortMenu = memo(__SortMenu) as typeof __SortMenu

export namespace SortMenu {
  export type Props<TData = unknown> = SortMenuProps<TData>
}
