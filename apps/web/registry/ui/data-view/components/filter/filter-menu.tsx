'use client'

import type { Column } from '@bazza-ui/data-view/react'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

import { useDataViewContext } from '../provider/data-view-context'

// ---------------------------------------------------------------------------
// FilterMenu
// ---------------------------------------------------------------------------

export interface FilterMenuProps {
  /** Custom trigger content. Defaults to "+ Filter" button. */
  children?: React.ReactNode
  className?: string
}

export function FilterMenu({ children, className }: FilterMenuProps) {
  const { instance } = useDataViewContext()
  const [open, setOpen] = useState(false)
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null)

  // Only show columns that support user-friendly value picking
  const filterableColumns = instance.columns.filter(
    (c) =>
      c.type === 'option' || c.type === 'multiOption' || c.type === 'boolean',
  )

  const selectedColumn = selectedColumnId
    ? instance.columns.find((c) => c.id === selectedColumnId)
    : null

  const handleAddFilter = (column: Column<any>, value: unknown) => {
    if (column.type === 'boolean') {
      column.setFilterValue([value === 'true'])
      setSelectedColumnId(null)
      setOpen(false)
      return
    }

    // For option / multiOption: toggle the value
    const existing = instance.overrides.filters.find(
      (f) => f.columnId === column.id,
    )
    if (existing?.values.includes(value)) {
      column.removeFilterValue([value])
    } else {
      column.addFilterValue([value])
    }
  }

  return (
    <DropdownMenu.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setSelectedColumnId(null)
      }}
    >
      <DropdownMenu.Trigger
        className={cn(
          'inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
          className,
        )}
        render={<button type="button" />}
      >
        {children ?? (
          <>
            <PlusIcon className="size-3.5" />
            Filter
          </>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                {!selectedColumn ? (
                  // ── Column picker ──
                  filterableColumns.map((col) => {
                    const Icon = col.icon as
                      | React.ComponentType<{ className?: string }>
                      | undefined

                    return (
                      <DropdownMenu.Item
                        key={col.id}
                        closeOnClick={false}
                        onSelect={() => {
                          setSelectedColumnId(col.id)
                        }}
                      >
                        {Icon && (
                          <DropdownMenu.Icon>
                            <Icon className="size-4" />
                          </DropdownMenu.Icon>
                        )}
                        {col.displayName}
                      </DropdownMenu.Item>
                    )
                  })
                ) : (
                  // ── Value picker for selected column ──
                  <>
                    {selectedColumn.type === 'boolean' ? (
                      <>
                        <DropdownMenu.Item
                          onSelect={() =>
                            handleAddFilter(selectedColumn, 'true')
                          }
                        >
                          {selectedColumn.toggledStateName ?? 'Yes'}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() =>
                            handleAddFilter(selectedColumn, 'false')
                          }
                        >
                          No
                        </DropdownMenu.Item>
                      </>
                    ) : (
                      selectedColumn.getOptions().map((opt) => {
                        const overrideFilter = instance.overrides.filters.find(
                          (f) => f.columnId === selectedColumn.id,
                        )
                        const isSelected =
                          overrideFilter?.values.includes(opt.value) ?? false
                        const OptIcon = opt.icon as
                          | React.ComponentType<{ className?: string }>
                          | undefined

                        return (
                          <DropdownMenu.CheckboxItem
                            key={opt.value}
                            checked={isSelected}
                            onCheckedChange={() =>
                              handleAddFilter(selectedColumn, opt.value)
                            }
                          >
                            <DropdownMenu.CheckboxItemIndicator />
                            {OptIcon && (
                              <DropdownMenu.Icon>
                                <OptIcon className="size-4" />
                              </DropdownMenu.Icon>
                            )}
                            {opt.label}
                          </DropdownMenu.CheckboxItem>
                        )
                      })
                    )}
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                      closeOnClick={false}
                      onSelect={() => {
                        setSelectedColumnId(null)
                      }}
                    >
                      &larr; Back
                    </DropdownMenu.Item>
                  </>
                )}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
