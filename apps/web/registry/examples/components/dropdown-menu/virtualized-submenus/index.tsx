'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

// =============================================================================
// Data Types
// =============================================================================

interface MenuItem {
  id: string
  label: string
  children?: MenuItem[]
}

// =============================================================================
// Sample Data - Nested menu structure with many items at each level
// =============================================================================

const menuData: MenuItem[] = [
  {
    id: 'files',
    label: 'Files',
    children: Array.from({ length: 100 }, (_, i) => ({
      id: `file-${i + 1}`,
      label: `Document ${i + 1}.txt`,
    })),
  },
  {
    id: 'regions',
    label: 'Regions',
    children: [
      {
        id: 'north-america',
        label: 'North America',
        children: Array.from({ length: 50 }, (_, i) => ({
          id: `na-city-${i + 1}`,
          label: `City ${i + 1}`,
        })),
      },
      {
        id: 'europe',
        label: 'Europe',
        children: Array.from({ length: 50 }, (_, i) => ({
          id: `eu-city-${i + 1}`,
          label: `City ${i + 1}`,
        })),
      },
      {
        id: 'asia',
        label: 'Asia',
        children: [
          {
            id: 'east-asia',
            label: 'East Asia',
            children: Array.from({ length: 30 }, (_, i) => ({
              id: `ea-city-${i + 1}`,
              label: `City ${i + 1}`,
            })),
          },
          {
            id: 'south-asia',
            label: 'South Asia',
            children: Array.from({ length: 30 }, (_, i) => ({
              id: `sa-city-${i + 1}`,
              label: `City ${i + 1}`,
            })),
          },
          {
            id: 'southeast-asia',
            label: 'Southeast Asia',
            children: Array.from({ length: 30 }, (_, i) => ({
              id: `sea-city-${i + 1}`,
              label: `City ${i + 1}`,
            })),
          },
        ],
      },
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `other-region-${i + 1}`,
        label: `Region ${i + 4}`,
        children: Array.from({ length: 25 }, (_, j) => ({
          id: `region-${i + 1}-city-${j + 1}`,
          label: `City ${j + 1}`,
        })),
      })),
    ],
  },
  {
    id: 'categories',
    label: 'Categories',
    children: Array.from({ length: 50 }, (_, i) => ({
      id: `category-${i + 1}`,
      label: `Category ${i + 1}`,
      children: Array.from({ length: 20 }, (_, j) => ({
        id: `category-${i + 1}-item-${j + 1}`,
        label: `Item ${j + 1}`,
      })),
    })),
  },
  ...Array.from({ length: 200 }, (_, i) => ({
    id: `action-${i + 1}`,
    label: `Action ${i + 1}`,
  })),
]

// Count total items recursively
function countItems(items: MenuItem[]): number {
  return items.reduce((sum, item) => {
    return sum + 1 + (item.children ? countItems(item.children) : 0)
  }, 0)
}

const totalItemCount = countItems(menuData)

// =============================================================================
// Estimated row height for virtualization
// =============================================================================

const ESTIMATED_ITEM_HEIGHT = 32

// =============================================================================
// Virtualized Menu Content Component
// =============================================================================

interface VirtualizedMenuContentProps {
  items: MenuItem[]
  depth?: number
}

function VirtualizedMenuContent({
  items,
  depth = 0,
}: VirtualizedMenuContentProps) {
  const [virtualizerEnabled, setVirtualizerEnabled] = React.useState(false)
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null)

  // Build items array for dropdown menu keyboard navigation
  const dropdownItems = React.useMemo(() => {
    return items.map((item) => ({ value: item.id, label: item.label }))
  }, [items])

  const virtualizer = useVirtualizer({
    enabled: virtualizerEnabled,
    count: items.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => ESTIMATED_ITEM_HEIGHT,
    overscan: 5,
  })

  const handleScrollElementRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      scrollElementRef.current = element
      if (element) virtualizer.measure()
    },
    [virtualizer],
  )

  const handleHighlightChange = React.useCallback(
    (_id: string | null, index: number) => {
      if (index >= 0) {
        queueMicrotask(() => {
          virtualizer.scrollToIndex(index, { align: 'auto' })
        })
      }
    },
    [virtualizer],
  )

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (open) setVirtualizerEnabled(true)
  }, [])

  const handleOpenChangeComplete = React.useCallback((open: boolean) => {
    if (!open) setVirtualizerEnabled(false)
  }, [])

  const virtualItems = virtualizer.getVirtualItems()

  // For root level, we need the Root component
  if (depth === 0) {
    return (
      <DropdownMenu.Root
        virtualized
        items={dropdownItems}
        onHighlightChange={handleHighlightChange}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={handleOpenChangeComplete}
      >
        <DropdownMenu.Trigger render={<Button variant="outline" />}>
          Menu ({totalItemCount.toLocaleString()} items)
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List viewportRef={handleScrollElementRef}>
                  <div
                    style={{
                      height: virtualizer.getTotalSize(),
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {virtualItems.map((virtualRow) => {
                      const item = items[virtualRow.index]
                      if (!item) return null

                      return (
                        <div
                          key={item.id}
                          data-index={virtualRow.index}
                          ref={virtualizer.measureElement}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          {item.children ? (
                            <VirtualizedSubmenu item={item} depth={depth + 1} />
                          ) : (
                            <DropdownMenu.Item
                              id={item.id}
                              value={item.id}
                              onSelect={() => toast(`Selected: ${item.label}`)}
                            >
                              {item.label}
                            </DropdownMenu.Item>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  // For nested levels, just render the content
  return (
    <DropdownMenu.Surface>
      <DropdownMenu.List viewportRef={handleScrollElementRef}>
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const item = items[virtualRow.index]
            if (!item) return null

            return (
              <div
                key={item.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {item.children ? (
                  <VirtualizedSubmenu item={item} depth={depth + 1} />
                ) : (
                  <DropdownMenu.Item
                    id={item.id}
                    value={item.id}
                    onSelect={() => toast(`Selected: ${item.label}`)}
                  >
                    {item.label}
                  </DropdownMenu.Item>
                )}
              </div>
            )
          })}
        </div>
      </DropdownMenu.List>
    </DropdownMenu.Surface>
  )
}

// =============================================================================
// Virtualized Submenu Component
// =============================================================================

interface VirtualizedSubmenuProps {
  item: MenuItem
  depth: number
}

function VirtualizedSubmenu({ item, depth }: VirtualizedSubmenuProps) {
  const [virtualizerEnabled, setVirtualizerEnabled] = React.useState(false)
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null)

  const children = item.children ?? []

  // Build items array for dropdown menu keyboard navigation
  const dropdownItems = React.useMemo(() => {
    return children.map((child) => ({ value: child.id, label: child.label }))
  }, [children])

  const virtualizer = useVirtualizer({
    enabled: virtualizerEnabled,
    count: children.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => ESTIMATED_ITEM_HEIGHT,
    overscan: 5,
  })

  const handleScrollElementRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      scrollElementRef.current = element
      if (element) virtualizer.measure()
    },
    [virtualizer],
  )

  const handleHighlightChange = React.useCallback(
    (_id: string | null, index: number) => {
      if (index >= 0) {
        queueMicrotask(() => {
          virtualizer.scrollToIndex(index, { align: 'auto' })
        })
      }
    },
    [virtualizer],
  )

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (open) setVirtualizerEnabled(true)
  }, [])

  const handleOpenChangeComplete = React.useCallback((open: boolean) => {
    if (!open) setVirtualizerEnabled(false)
  }, [])

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <DropdownMenu.Submenu
      virtualized
      items={dropdownItems}
      onHighlightChange={handleHighlightChange}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <DropdownMenu.SubmenuTrigger id={item.id}>
        {item.label}
      </DropdownMenu.SubmenuTrigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List viewportRef={handleScrollElementRef}>
                <div
                  style={{
                    height: virtualizer.getTotalSize(),
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualItems.map((virtualRow) => {
                    const child = children[virtualRow.index]
                    if (!child) return null

                    return (
                      <div
                        key={child.id}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {child.children ? (
                          <VirtualizedSubmenu item={child} depth={depth + 1} />
                        ) : (
                          <DropdownMenu.Item
                            id={child.id}
                            value={child.id}
                            onSelect={() => toast(`Selected: ${child.label}`)}
                          >
                            {child.label}
                          </DropdownMenu.Item>
                        )}
                      </div>
                    )
                  })}
                </div>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Submenu>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function DropdownMenuVirtualizedSubmenus() {
  return <VirtualizedMenuContent items={menuData} depth={0} />
}
