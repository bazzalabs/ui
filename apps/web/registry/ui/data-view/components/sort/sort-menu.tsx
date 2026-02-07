'use client'

import type { Column } from '@bazza-ui/data-view/react'

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

import { useDataViewContext } from '../provider/data-view-context'

// ---------------------------------------------------------------------------
// SortMenu
// ---------------------------------------------------------------------------

export interface SortMenuProps {
  children?: React.ReactNode
  className?: string
  /** Which layer to read/write sort state. Reads from context if not provided. */
  layer?: 'overrides' | 'base'
}

export function SortMenu({
  children,
  className,
  layer: layerProp,
}: SortMenuProps) {
  const { instance, layer: contextLayer } = useDataViewContext()
  const sortableColumns = instance.columns.filter(
    (c: Column<any>) => c.sortable,
  )

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          'inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
          className,
        )}
        render={<button type="button" />}
      >
        {children ?? (
          <>
            <ArrowUpDownIcon className="size-3.5" />
            Sort
          </>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                {sortableColumns.map((column: Column<any>) => {
                  const Icon = column.icon as
                    | React.ComponentType<{ className?: string }>
                    | undefined
                  const sortDir = column.getIsSorted()

                  return (
                    <DropdownMenu.Item
                      key={column.id}
                      onSelect={() => column.toggleSorting()}
                    >
                      {Icon && (
                        <DropdownMenu.Icon>
                          <Icon className="size-4" />
                        </DropdownMenu.Icon>
                      )}
                      <span className="flex-1">{column.displayName}</span>
                      {sortDir === 'asc' && (
                        <ArrowUpIcon className="size-3.5 text-primary" />
                      )}
                      {sortDir === 'desc' && (
                        <ArrowDownIcon className="size-3.5 text-primary" />
                      )}
                    </DropdownMenu.Item>
                  )
                })}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
