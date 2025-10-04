'use client'

import {
  useVirtualizer,
  type VirtualItem,
  type Virtualizer,
} from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AutoSizer, List } from 'react-virtualized'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const NUM_ITEMS = 10_000

export function TestVirtualContainer_ReactVirtualized() {
  const nodes = useMemo(() => {
    const emojis = ['🍎', '🍌', '🍊', '🍍', '🍓', '🍇', '🍉', '🥝', '🍒', '🍑']
    return Array.from({ length: NUM_ITEMS }, (_, i) => {
      const n = i + 1
      const id = `item-${n}`
      return {
        id,
        label: `Item ${n.toString().padStart(6, '0')}`,
        icon: emojis[i % emojis.length],
      }
    })
  }, [])

  return (
    <Popover>
      <PopoverTrigger className="w-fit" asChild>
        <Button>React Virtualized</Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex flex-col max-h-(--radix-popover-available-height)"
      >
        <Input placeholder="Search..." />

        {/* Measuring parent for AutoSizer */}
        <div className="w-[200px] h-[300px]  bg-red-500">
          <AutoSizer>
            {({ height, width }) => (
              <List
                width={width}
                height={height}
                rowHeight={32}
                rowCount={nodes.length}
                rowRenderer={({ index, key, style }) => (
                  <div key={key} style={style}>
                    <div className="h-8">{nodes[index]!.label}</div>
                  </div>
                )}
              />
            )}
          </AutoSizer>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function TestVirtualContainer_TanStackVirtual() {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="w-fit" asChild>
        <Button>TanStack Virtual</Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          'min-w-[200px] max-w-[500px] w-auto p-0 box-border',
          'h-[500px]',
          'flex flex-col',
          // 'h-24 max-h-(--radix-popover-content-available-height)',
        )}
      >
        <Content />
      </PopoverContent>
    </Popover>
  )
}

function Content() {
  const listRef = useRef<HTMLDivElement | null>(null)
  const hiddenListRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = hiddenListRef.current
    if (!el) return

    let af: number

    const observer = new ResizeObserver(() => {
      af = requestAnimationFrame(() => {
        console.log({
          width: el.scrollWidth,
          height: el.scrollHeight,
        })

        const width = el.scrollWidth
        const prevWidth = listRef.current?.style
          .getPropertyValue('--action-menu-list-natural-width')
          .replace('px', '')
        const newWidth = Math.max(width, Number(prevWidth))
        listRef.current?.style.setProperty(
          '--action-menu-list-natural-width',
          `${newWidth}px`,
        )
      })
    })

    observer.observe(el)

    return () => {
      cancelAnimationFrame(af)
      observer.unobserve(el)
    }
  }, [])

  const nodes = useMemo(() => {
    const emojis = ['🍎', '🍌', '🍊', '🍍', '🍓', '🍇', '🍉', '🥝', '🍒', '🍑']
    return Array.from({ length: NUM_ITEMS }, (_, i) => {
      const n = i + 1
      const id = `item-${n}`
      return {
        id,
        label:
          n === 100
            ? 'Item with a super duper duper long name to test truncation'
            : `Item ${n.toString().padStart(6, '0')}`,
        icon: emojis[i % emojis.length],
      }
    })
  }, [])

  const virtualizer = useVirtualizer({
    count: nodes.length,
    estimateSize: () => 32,
    // measureElement: (el) => el.getBoundingClientRect().height,
    getScrollElement: () => listRef.current,
    overscan: 10,
  })

  useEffect(() => {
    const el = listRef.current
    if (!el) return

    el.style.setProperty(
      '--action-menu-list-natural-height',
      `${virtualizer.getTotalSize()}px`,
    )
  }, [virtualizer.getTotalSize()])

  const items = useMemo(
    () => virtualizer.getVirtualItems(),
    [virtualizer.getVirtualItems()],
  )

  return (
    <>
      <Input placeholder="Search..." />
      {/* Measuring parent for AutoSizer */}
      <div
        ref={listRef}
        style={
          {
            '--row-width':
              'max(200px, min(var(--action-menu-list-natural-width), 500px))',
          } as React.CSSProperties
        }
        className="w-(--row-width) overflow-x-hidden overflow-y-auto bg-neutral-800 h-full"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${items[0]?.start ?? 0}px)`,
            }}
          >
            {renderItems(items, nodes, virtualizer)}
          </div>
        </div>
      </div>
      <div
        ref={hiddenListRef}
        style={{
          position: 'fixed',
          top: '-200vh',
          left: '-200vw',
          visibility: 'hidden',
        }}
      >
        {renderItems(items, nodes, virtualizer, true)}
      </div>
    </>
  )
}

function renderItems<T>(
  items: VirtualItem[],
  nodes: T[],
  virtualizer: Virtualizer<any, any>,
  isForMeasuring = false,
) {
  return items.map((virtualRow) => {
    const node = nodes[virtualRow.index]!
    return (
      <div
        key={virtualRow.key}
        data-index={virtualRow.index}
        ref={isForMeasuring ? null : virtualizer.measureElement}
        // ref={virtualizer.measureElement}
      >
        {/* @ts-expect-error */}
        <div className="whitespace-nowrap h-10 truncate">{node.label}</div>
      </div>
    )
  })
}
