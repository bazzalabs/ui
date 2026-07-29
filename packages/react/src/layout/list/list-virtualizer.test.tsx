import { act, render, screen } from '@testing-library/react'
import * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { List } from './index.js'
import {
  type ListVirtualizer,
  useListVirtualizer,
} from './virtualizer/use-list-virtualizer.js'

const virtualizerOptions = { current: null as any }
const range = { startIndex: 0, endIndex: 99, overscan: 0, count: 0 }
const scrollToIndex = vi.fn()
const measureWarnings = vi.fn()

vi.mock('@tanstack/react-virtual', () => ({
  defaultRangeExtractor: (value: typeof range) => {
    const start = Math.max(0, value.startIndex - value.overscan)
    const end = Math.min(value.count - 1, value.endIndex + value.overscan)
    return Array.from(
      { length: Math.max(0, end - start + 1) },
      (_, i) => start + i,
    )
  },
  useVirtualizer: (options: any) => {
    virtualizerOptions.current = options
    const currentRange = { ...range, count: options.count }
    return {
      getVirtualItems: () =>
        (
          options.rangeExtractor?.(currentRange) ??
          Array.from({ length: options.count }, (_, index) => index)
        ).map((index: number) => ({ index, start: index * 40, size: 40 })),
      getTotalSize: () => options.count * 40,
      scrollToIndex,
      measureElement: (element: HTMLElement | null) => {
        if (element && !element.hasAttribute('data-index')) measureWarnings()
        return element
      },
    }
  },
}))

const items = Array.from({ length: 100 }, (_, index) => `item-${index}`)
const getKey = (item: string) => item
const getGroupId = (item: string) =>
  item.startsWith('item-') ? 'group' : undefined

function Example(props: {
  items?: readonly string[]
  includeGroupHeaders?: boolean
  defaultCollapsedGroups?: Iterable<string>
  collapsedGroups?: Iterable<string>
  layout?: boolean
  onMeasure?: (measure: (element: HTMLElement | null) => void) => void
  getGroupId?: (item: string) => string | undefined
  onVirtualRows?: (rows: ListVirtualizer['virtualRows']) => void
}) {
  const stableGetGroupId = React.useCallback(getGroupId, [])
  const smallGroupId = React.useCallback(
    (item: string) => (item.startsWith('a') ? 'a' : 'b'),
    [],
  )
  const store = List.useStore({
    items: props.items ?? ['a-1', 'b-1'],
    getKey,
    getGroupId:
      props.getGroupId ?? (props.items ? stableGetGroupId : smallGroupId),
    defaultCollapsedGroups: props.defaultCollapsedGroups,
    collapsedGroups: props.collapsedGroups,
  })
  const virtualizer = useListVirtualizer(store, props)
  props.onMeasure?.(virtualizer.measureRow)
  props.onVirtualRows?.(virtualizer.virtualRows)
  return (
    <>
      <output data-testid="rows">
        {virtualizer.virtualRows
          .map((row) => `${row.kind}:${row.key}`)
          .join(',')}
      </output>
      <output data-testid="spacers">{`${virtualizer.spacerTop}:${virtualizer.spacerBottom}`}</output>
      <List.Root store={store} layout={props.layout}>
        <List.Spacer height={12} data-testid="spacer" />
      </List.Root>
    </>
  )
}

beforeEach(() => {
  range.startIndex = 0
  range.endIndex = 99
  range.overscan = 0
  scrollToIndex.mockReset()
  measureWarnings.mockReset()
  virtualizerOptions.current = null
})

describe('useListVirtualizer', () => {
  it('builds headers from data order, retains collapsed headers, and distinguishes keys', () => {
    const { rerender } = render(<Example />)
    expect(screen.getByTestId('rows')).toHaveTextContent(
      'group-header:a,row:a-1,group-header:b,row:b-1',
    )
    rerender(<Example includeGroupHeaders={false} />)
    expect(screen.getByTestId('rows')).toHaveTextContent('row:a-1,row:b-1')
    rerender(<Example collapsedGroups={['a']} />)
    expect(screen.getByTestId('rows')).toHaveTextContent(
      'group-header:a,group-header:b,row:b-1',
    )
    const key = virtualizerOptions.current.getItemKey(0)
    const rowKey = virtualizerOptions.current.getItemKey(1)
    expect(key).not.toBe(rowKey)
  })

  it('accounts for a deep injected sticky header exactly', () => {
    range.startIndex = 50
    range.endIndex = 55
    let virtualRows: ListVirtualizer['virtualRows'] = []
    render(
      <Example
        items={items}
        onVirtualRows={(rows) => {
          virtualRows = rows
        }}
      />,
    )
    expect(
      virtualizerOptions.current.rangeExtractor({
        startIndex: 50,
        endIndex: 55,
        overscan: 0,
        count: 101,
      }),
    ).toEqual([0, 50, 51, 52, 53, 54, 55])
    const rows = screen.getByTestId('rows').textContent ?? ''
    expect(rows.startsWith('group-header:group')).toBe(true)
    expect(screen.getByTestId('spacers')).toHaveTextContent('1960:1800')
    expect(virtualRows[0]?.start).toBe(1960)
    expect(virtualRows[1]?.start).toBe((virtualRows[0]?.start ?? 0) + 40)
    expect(1960 + 7 * 40 + 1800).toBe(101 * 40)
  })

  it('keeps a tall sticky header in the public window', () => {
    range.startIndex = 50
    range.endIndex = 50
    render(<Example items={items} />)
    expect(screen.getByTestId('rows')).toHaveTextContent(
      'group-header:group,row:item-49',
    )
  })

  it('does not inject the previous header when the range starts at a header', () => {
    range.startIndex = 2
    range.endIndex = 2
    render(
      <Example
        items={['a-1', 'b-1']}
        getGroupId={(item) => item.slice(0, 1)}
      />,
    )
    expect(
      virtualizerOptions.current.rangeExtractor({
        startIndex: 2,
        endIndex: 2,
        overscan: 0,
        count: 4,
      }),
    ).toEqual([2])
    expect(screen.getByTestId('rows')).toHaveTextContent('group-header:b')
    expect(screen.getByTestId('spacers')).toHaveTextContent('80:40')
  })

  it('virtualizes the engine with visible source rows and restores it on unmount', () => {
    let store: ReturnType<typeof List.useStore> | undefined
    function Mounted() {
      const mountedGetKey = React.useCallback((item: string) => item, [])
      const mountedGetGroupId = React.useCallback(() => 'g', [])
      store = List.useStore({
        items: ['a', 'b'],
        getKey: mountedGetKey,
        defaultCollapsedGroups: ['g'],
        getGroupId: mountedGetGroupId,
      })
      useListVirtualizer(store)
      return null
    }
    const { unmount } = render(<Mounted />)
    expect(store?.collection.state.virtualized).toBe(true)
    expect(store?.collection.context.virtualItems).toHaveLength(0)
    unmount()
    expect(store?.collection.state.virtualized).toBe(false)
    expect(store?.collection.context.virtualItems).toHaveLength(0)
  })

  it('scrolls keyboard highlights using header-inclusive indexes', async () => {
    let store: ReturnType<typeof List.useStore> | undefined
    function Mounted() {
      const mountedGetKey = React.useCallback((item: string) => item, [])
      const mountedGetGroupId = React.useCallback(() => 'group', [])
      store = List.useStore({
        items: ['a-1', 'b-1'],
        getKey: mountedGetKey,
        getGroupId: mountedGetGroupId,
      })
      useListVirtualizer(store)
      return null
    }
    render(<Mounted />)
    act(() => store?.setKeyboardActive('b-1'))
    await act(async () => {})
    expect(scrollToIndex).toHaveBeenCalledWith(2, { align: 'auto' })
  })

  it('measures elements carrying the required data index', () => {
    let measureRow: ((element: HTMLElement | null) => void) | undefined
    render(
      <Example
        onMeasure={(measure) => {
          measureRow = measure
        }}
      />,
    )
    const element = document.createElement('div')
    measureRow?.(element)
    expect(measureWarnings).toHaveBeenCalledTimes(1)
    element.setAttribute('data-index', '0')
    measureRow?.(element)
    expect(measureWarnings).toHaveBeenCalledTimes(1)
  })

  it('parks and restores roving focus only when focus remains in the list', () => {
    const controls = {
      setKeyboardActive: (_key: string) => {},
      setRowMounted: (_mounted: boolean) => {},
    }
    function FocusHarness() {
      const [rowMounted, setRowMounted] = React.useState(true)
      const getKey = React.useCallback((item: string) => item, [])
      const store = List.useStore({ items: ['a', 'b'], getKey })
      controls.setKeyboardActive = store.setKeyboardActive
      controls.setRowMounted = setRowMounted
      return (
        <>
          <List.Root store={store} data-testid="focus-root">
            {rowMounted && <List.Row value="a" data-testid="row-a" />}
            <List.Row value="b" data-testid="row-b" />
          </List.Root>
          <button type="button" data-testid="external">
            external
          </button>
        </>
      )
    }

    render(<FocusHarness />)
    const root = screen.getByTestId('focus-root')
    const row = screen.getByTestId('row-a')
    const external = screen.getByTestId('external')

    act(() => {
      controls.setKeyboardActive('a')
      row.focus()
      controls.setRowMounted(false)
    })
    expect(document.activeElement).toBe(root)

    act(() => controls.setRowMounted(true))
    expect(document.activeElement).toBe(screen.getByTestId('row-a'))

    act(() => {
      controls.setKeyboardActive('a')
      screen.getByTestId('row-a').focus()
      controls.setRowMounted(false)
    })
    external.focus()
    act(() => controls.setRowMounted(true))
    expect(document.activeElement).toBe(external)
  })

  it('refreshes public and collection virtual rows when metadata changes', () => {
    let store: ReturnType<typeof List.useStore> | undefined
    const getKey = (item: string) => item
    function RefreshHarness({ items }: { items: readonly string[] }) {
      store = List.useStore({ items, getKey })
      const virtualizer = useListVirtualizer(store)
      return (
        <output data-testid="refreshed-rows">
          {virtualizer.virtualRows
            .map((row) => `${row.kind}:${row.key}`)
            .join(',')}
        </output>
      )
    }

    const { rerender } = render(<RefreshHarness items={['a-1']} />)
    expect(screen.getByTestId('refreshed-rows')).toHaveTextContent('row:a-1')
    expect(store?.collection.context.virtualItems).toEqual([
      { value: 'a-1', disabled: false },
    ])

    rerender(<RefreshHarness items={['b-1', 'b-2']} />)
    expect(screen.getByTestId('refreshed-rows')).toHaveTextContent(
      'row:b-1,row:b-2',
    )
    expect(store?.collection.context.virtualItems).toEqual([
      { value: 'b-1', disabled: false },
      { value: 'b-2', disabled: false },
    ])
  })

  it('keeps raw row keys distinct from group header keys', () => {
    render(
      <Example
        items={['GROUP_x', 'row-x']}
        getGroupId={(item) => (item === 'row-x' ? 'x' : undefined)}
      />,
    )
    expect(virtualizerOptions.current.getItemKey(0)).not.toBe(
      virtualizerOptions.current.getItemKey(1),
    )
  })
})

describe('List.Spacer', () => {
  it('renders style, aria, grid, and null behavior', () => {
    function SpacerExample({ layout = true }: { layout?: boolean }) {
      const store = List.useStore({ items: [], getKey: (item) => item })
      return (
        <List.Root store={store} layout={layout}>
          <List.Spacer height={12} data-testid="spacer" />
          <List.Spacer height={0} data-testid="empty" />
        </List.Root>
      )
    }
    const { rerender } = render(<SpacerExample />)
    expect(screen.getByTestId('spacer')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('spacer')).toHaveStyle({
      height: '12px',
      gridColumn: '1 / -1',
    })
    expect(screen.queryByTestId('empty')).toBeNull()
    rerender(<SpacerExample layout={false} />)
    expect(screen.getByTestId('spacer')).not.toHaveStyle({
      gridColumn: '1 / -1',
    })
  })
})
