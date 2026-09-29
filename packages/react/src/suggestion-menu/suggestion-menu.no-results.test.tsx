import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import type {
  ItemDef,
  NodeDef,
  QueryLoaderConfig,
} from '../internal/popup-menu/index.js'
import { createVanillaQueryLoader } from '../loaders/vanilla.js'
import { SuggestionMenu } from './index.js'

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

const item = (value: string): ItemDef => ({
  kind: 'item',
  value,
  render: ({ props }) => (
    <SuggestionMenu.Item {...props} data-testid={value}>
      {value}
    </SuggestionMenu.Item>
  ),
})

function setup(
  options: {
    noResults?: 'empty' | 'close'
    content?: ItemDef[]
    asyncContent?: QueryLoaderConfig
  } = {},
) {
  const menu = SuggestionMenu.createHandle()
  const onOpenChange = vi.fn()
  const keys: boolean[] = []
  render(
    <>
      <textarea
        data-testid="host"
        ref={(el) => {
          if (el) menu.attach(el)
        }}
        onKeyDown={(event) => keys.push(menu.handleKeyDown(event))}
      />
      <SuggestionMenu.Root
        handle={menu}
        noResults={options.noResults}
        onOpenChange={onOpenChange}
      >
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup data-testid="popup">
              <SuggestionMenu.Surface
                content={options.content ?? [item('Alice'), item('Bob')]}
                asyncContent={options.asyncContent}
              >
                <SuggestionMenu.List>
                  <Rows />
                </SuggestionMenu.List>
                <SuggestionMenu.Empty data-testid="empty">
                  Nobody
                </SuggestionMenu.Empty>
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>
    </>,
  )
  const reasons = () =>
    onOpenChange.mock.calls.map(([open, details]) => [open, details.reason])
  return { menu, host: screen.getByTestId('host'), keys, reasons }
}

const popup = () => screen.queryByTestId('popup')
const tick = () => new Promise((resolve) => setTimeout(resolve, 20))

describe("SuggestionMenu noResults: 'empty'", () => {
  it('stays open, shows Empty, and lets Enter reach the host', async () => {
    const { menu, host, keys } = setup()
    act(() => menu.update({ query: 'zz' }))

    expect(await screen.findByTestId('empty')).toBeInTheDocument()
    await tick()
    expect(popup()).toBeInTheDocument()

    act(() => {
      fireEvent.keyDown(host, { key: 'Enter' })
    })
    expect(keys.at(-1)).toBe(false)
  })
})

describe("SuggestionMenu noResults: 'close'", () => {
  it('closes once the results settle empty', async () => {
    const { menu, reasons } = setup({ noResults: 'close' })
    act(() => menu.update({ query: 'a' }))
    await screen.findByTestId('Alice')

    act(() => menu.update({ query: 'az' }))

    await waitFor(() => expect(popup()).not.toBeInTheDocument())
    expect(reasons().at(-1)).toEqual([false, 'no-results'])
  })

  it('closes before the browser paints the empty popup', async () => {
    const { menu, reasons } = setup({ noResults: 'close' })
    act(() => menu.update({ query: 'a' }))
    await screen.findByTestId('Alice')

    act(() => menu.update({ query: 'az' }))
    // Microtasks only: no timer or frame has run.
    await Promise.resolve()

    expect(reasons().at(-1)).toEqual([false, 'no-results'])
  })

  it('waits for the loaders before deciding', async () => {
    const pending = new Map<string, (rows: NodeDef[]) => void>()
    const loader = createVanillaQueryLoader({
      fetcher: (query: string) =>
        new Promise<NodeDef[]>((resolve) => pending.set(query, resolve)),
      minQueryLength: 0,
    })
    const { menu } = setup({
      noResults: 'close',
      content: [],
      asyncContent: loader,
    })
    act(() => menu.update({ query: 'da' }))
    await screen.findByTestId('popup')
    await tick()
    expect(popup()).toBeInTheDocument()

    await act(async () => {
      pending.get('da')?.([item('Dana')])
    })

    expect(await screen.findByTestId('Dana')).toBeInTheDocument()
    await tick()
    expect(popup()).toBeInTheDocument()
  })

  it('stays closed on updates with the same query', async () => {
    const { menu, reasons } = setup({ noResults: 'close' })
    act(() => menu.update({ query: 'az' }))
    await waitFor(() => expect(reasons().at(-1)).toEqual([false, 'no-results']))
    const calls = reasons().length

    // Only the caret moved.
    act(() => menu.update({ query: 'az', anchor: () => new DOMRect() }))
    await tick()

    expect(popup()).not.toBeInTheDocument()
    expect(reasons()).toHaveLength(calls)
  })

  it('searches again when the user keeps typing', async () => {
    const { menu, reasons } = setup({ noResults: 'close' })
    act(() => menu.update({ query: 'az' }))
    await waitFor(() => expect(reasons().at(-1)).toEqual([false, 'no-results']))

    act(() => menu.update({ query: 'azb' }))

    expect(reasons().at(-1)).toEqual([true, 'imperative-action'])
  })

  it('opens for a longer query after an empty one settled empty', async () => {
    const loader = createVanillaQueryLoader({
      fetcher: async (query: string) => (query ? [item('Alice')] : []),
      minQueryLength: 0,
    })
    const { menu, reasons } = setup({
      noResults: 'close',
      content: [],
      asyncContent: loader,
    })
    act(() => menu.update({ query: '' }))
    await waitFor(() => expect(reasons().at(-1)).toEqual([false, 'no-results']))

    act(() => menu.update({ query: 'a' }))

    expect(await screen.findByTestId('Alice')).toBeInTheDocument()
  })

  it('opens when a controlled query moves off the empty one', async () => {
    const menu = SuggestionMenu.createHandle()
    const onOpenChange = vi.fn()
    let setQuery: (query: string) => void = () => {}
    function Controlled() {
      const [query, set] = React.useState('')
      setQuery = set
      return (
        <SuggestionMenu.Root
          handle={menu}
          query={query}
          noResults="close"
          onOpenChange={onOpenChange}
        >
          <SuggestionMenu.Portal>
            <SuggestionMenu.Positioner>
              <SuggestionMenu.Popup data-testid="popup">
                <SuggestionMenu.Surface content={[item('Alice')]}>
                  <SuggestionMenu.List>
                    <Rows />
                  </SuggestionMenu.List>
                </SuggestionMenu.Surface>
              </SuggestionMenu.Popup>
            </SuggestionMenu.Positioner>
          </SuggestionMenu.Portal>
        </SuggestionMenu.Root>
      )
    }
    render(<Controlled />)
    act(() => {
      setQuery('az')
      menu.update({})
    })
    await waitFor(() =>
      expect(onOpenChange).toHaveBeenLastCalledWith(
        false,
        expect.objectContaining({ reason: 'no-results' }),
      ),
    )

    // The caret moved: same query, so it stays closed.
    const calls = onOpenChange.mock.calls.length
    act(() => menu.update({}))
    await tick()
    expect(onOpenChange.mock.calls).toHaveLength(calls)
    expect(popup()).not.toBeInTheDocument()

    // Backspace: the host sets the query and updates the menu in one go.
    act(() => {
      setQuery('a')
      menu.update({})
    })

    expect(await screen.findByTestId('Alice')).toBeInTheDocument()
  })

  it('opens again on any other query', async () => {
    const { menu, reasons } = setup({ noResults: 'close' })
    act(() => menu.update({ query: 'az' }))
    await waitFor(() => expect(reasons().at(-1)).toEqual([false, 'no-results']))

    // Backspace back to a query with results.
    act(() => menu.update({ query: 'a' }))

    expect(await screen.findByTestId('Alice')).toBeInTheDocument()
    expect(reasons().at(-1)).toEqual([true, 'imperative-action'])
  })

  it("doesn't open later from a same-query update", async () => {
    const menu = SuggestionMenu.createHandle()
    const onOpenChange = vi.fn()
    let setQuery: (query: string) => void = () => {}
    function Controlled() {
      const [query, set] = React.useState('')
      setQuery = set
      return (
        <SuggestionMenu.Root
          handle={menu}
          query={query}
          noResults="close"
          onOpenChange={onOpenChange}
        >
          <SuggestionMenu.Portal>
            <SuggestionMenu.Positioner>
              <SuggestionMenu.Popup data-testid="popup">
                <SuggestionMenu.Surface content={[item('Alice')]}>
                  <SuggestionMenu.List>
                    <Rows />
                  </SuggestionMenu.List>
                </SuggestionMenu.Surface>
              </SuggestionMenu.Popup>
            </SuggestionMenu.Positioner>
          </SuggestionMenu.Portal>
        </SuggestionMenu.Root>
      )
    }
    render(<Controlled />)
    act(() => {
      setQuery('az')
      menu.update({})
    })
    await waitFor(() =>
      expect(onOpenChange).toHaveBeenLastCalledWith(
        false,
        expect.objectContaining({ reason: 'no-results' }),
      ),
    )
    act(() => menu.update({}))

    // Later, the trigger is deleted: the host closes and resets its query.
    act(() => menu.close())
    const calls = onOpenChange.mock.calls.length
    act(() => setQuery(''))
    await tick()

    expect(onOpenChange.mock.calls).toHaveLength(calls)
    expect(popup()).not.toBeInTheDocument()
  })

  it('opens when a controlled query renders after the update', async () => {
    const menu = SuggestionMenu.createHandle()
    let setQuery: (query: string) => void = () => {}
    function Controlled() {
      const [query, set] = React.useState('')
      setQuery = set
      return (
        <SuggestionMenu.Root handle={menu} query={query} noResults="close">
          <SuggestionMenu.Portal>
            <SuggestionMenu.Positioner>
              <SuggestionMenu.Popup data-testid="popup">
                <SuggestionMenu.Surface content={[item('Alice')]}>
                  <SuggestionMenu.List>
                    <Rows />
                  </SuggestionMenu.List>
                </SuggestionMenu.Surface>
              </SuggestionMenu.Popup>
            </SuggestionMenu.Positioner>
          </SuggestionMenu.Portal>
        </SuggestionMenu.Root>
      )
    }
    render(<Controlled />)
    act(() => {
      setQuery('az')
      menu.update({})
    })
    await waitFor(() => expect(popup()).not.toBeInTheDocument())

    // Backspace: the editor's listener updates the menu first; its query
    // state renders separately.
    act(() => menu.update({}))
    act(() => setQuery('a'))

    expect(await screen.findByTestId('Alice')).toBeInTheDocument()
  })

  it('forgets the empty query when the host changes', async () => {
    const { menu, reasons } = setup({ noResults: 'close' })
    act(() => menu.update({ query: 'az' }))
    await waitFor(() => expect(reasons().at(-1)).toEqual([false, 'no-results']))

    act(() => {
      menu.attach(document.createElement('textarea'))
    })
    act(() => menu.update({ query: 'az' }))

    expect(reasons().at(-1)).toEqual([true, 'imperative-action'])
  })

  it('forgets the empty query when the trigger ends', async () => {
    const { menu, reasons } = setup({ noResults: 'close' })
    act(() => menu.update({ query: 'az' }))
    await waitFor(() => expect(reasons().at(-1)).toEqual([false, 'no-results']))

    // The trigger was deleted, then typed again with the same text.
    act(() => menu.close())
    act(() => menu.update({ query: 'az' }))

    expect(reasons().at(-1)).toEqual([true, 'imperative-action'])
  })
})

describe('SuggestionMenu exports', () => {
  it('re-exports the async coordinator hook', () => {
    expect(typeof SuggestionMenu.useAsyncMenuCoordinator).toBe('function')
  })
})
