import { render } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import { List } from './index.js'
import { useListVirtualizer } from './virtualizer/use-list-virtualizer.js'

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

const items = Array.from({ length: 50 }, (_, index) => `item-${index}`)
const estimateSize = () => 44

function Example({ tick }: { tick: number }) {
  const store = List.useStore({
    items,
    getKey: (item) => item,
    getGroupId: (item) => (Number(item.slice(5)) < 25 ? 'first' : 'second'),
  })
  const virtualizer = useListVirtualizer(store, { estimateSize })

  return (
    <List.Root
      ref={virtualizer.scrollContainerRef as React.Ref<HTMLDivElement>}
      store={store}
      data-tick={tick}
    >
      <List.Spacer height={virtualizer.spacerTop} />
      {virtualizer.virtualRows.map((row) =>
        row.kind === 'group-header' ? (
          <List.Group key={row.key} value={String(row.key)}>
            <List.GroupHeader
              data-index={row.index}
              ref={virtualizer.measureRow}
            >
              {row.key}
            </List.GroupHeader>
          </List.Group>
        ) : (
          <List.Row
            key={row.key}
            value={row.key}
            data-index={row.index}
            ref={virtualizer.measureRow}
          />
        ),
      )}
      <List.Spacer height={virtualizer.spacerBottom} />
    </List.Root>
  )
}

describe('useListVirtualizer with the real virtualizer', () => {
  it('rerenders a grouped virtualized list without throwing', () => {
    const { rerender } = render(<Example tick={0} />)

    expect(() => rerender(<Example tick={1} />)).not.toThrow()
    expect(() => rerender(<Example tick={2} />)).not.toThrow()
  })
})
