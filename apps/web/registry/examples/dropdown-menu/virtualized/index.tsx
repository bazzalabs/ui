'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

// Generate 1000 dummy items
const allItems = Array.from({ length: 1000 }, (_, i) => ({
  value: `item-${i + 1}`,
  label: `Item #${i + 1}`,
}))

const ITEM_HEIGHT = 36

export default function DropdownMenuVirtualized() {
  const [search, setSearch] = React.useState('')
  // Track when animations complete to enable/disable virtualizer
  const [virtualizerEnabled, setVirtualizerEnabled] = React.useState(false)
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null)

  // Filter items based on search
  const filteredItems = React.useMemo(() => {
    if (!search) return allItems
    const lowerSearch = search.toLowerCase()
    return allItems.filter((item) =>
      item.label.toLowerCase().includes(lowerSearch),
    )
  }, [search])

  // Disable virtualizer when menu close animation completes to reset scroll state
  const virtualizer = useVirtualizer({
    enabled: virtualizerEnabled,
    count: filteredItems.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  })

  React.useLayoutEffect(() => {
    virtualizer.measure()
  }, [virtualizer])

  // Callback ref to set scroll element and trigger virtualizer measure
  const handleScrollElementRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      scrollElementRef.current = element
      if (element) {
        virtualizer.measure()
      }
    },
    [virtualizer],
  )

  // Sync virtualizer scroll when highlight changes via keyboard
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

  // Disable the virtualizer when closed.
  // NOTE: We disable once exit animations have completed, but we enable as soon as the menu is registered as open.
  const handleOpenChange = React.useCallback((open: boolean) => {
    if (open) setVirtualizerEnabled(true)
  }, [])

  const handleOpenChangeComplete = React.useCallback((open: boolean) => {
    if (!open) setVirtualizerEnabled(false)
  }, [])

  return (
    <DropdownMenu.Root
      virtualized
      items={filteredItems}
      onHighlightChange={handleHighlightChange}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Select Item ({allItems.length.toLocaleString()} items)
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface filter={false}>
              <DropdownMenu.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Search items..."
              />
              <DropdownMenu.List
                viewportRef={handleScrollElementRef}
                className="scroll-py-1"
              >
                <div
                  style={{
                    height: virtualizer.getTotalSize(),
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const item = filteredItems[virtualRow.index]
                    if (!item) return null
                    return (
                      <div
                        key={item.value}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: virtualRow.size,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <DropdownMenu.Item
                          value={item.value}
                          onSelect={() => toast(`Selected: ${item.label}`)}
                        >
                          {item.label}
                        </DropdownMenu.Item>
                      </div>
                    )
                  })}
                </div>
              </DropdownMenu.List>
              <DropdownMenu.Empty>No items found</DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
