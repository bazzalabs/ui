import { act, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DropdownMenu,
  useAsyncMenuCoordinator,
} from '../../../../dropdown-menu/index.js'
import { createVanillaQueryLoader } from '../../../../loaders/vanilla.js'
import type {
  AsyncLoaderResult,
  ItemDef,
  LoaderComponentProps,
  NodeDef,
  QueryLoaderConfig,
} from '../types.js'

function item(value: string): ItemDef {
  return {
    kind: 'item',
    value,
    render: ({ props }) => (
      <DropdownMenu.Item {...props} data-testid={`item-${value.toLowerCase()}`}>
        {value}
      </DropdownMenu.Item>
    ),
  }
}

function Rows() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

function Working() {
  const { isAnyFetching } = useAsyncMenuCoordinator()
  return isAnyFetching ? <div data-testid="working" /> : null
}

function Menu(props: {
  loader: QueryLoaderConfig
  reveal?: 'stream' | 'block'
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              content={[]}
              asyncContent={props.loader}
              asyncContentReveal={props.reveal}
            >
              <DropdownMenu.Input data-testid="input" />
              <Working />
              <DropdownMenu.List>
                <DropdownMenu.Empty data-testid="empty">
                  None
                </DropdownMenu.Empty>
                <Rows />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/** Runs pending effects, timers up to `ms`, and resolved fetches. */
async function advance(ms = 0) {
  await act(async () => {
    vi.advanceTimersByTime(ms)
    await Promise.resolve()
  })
  await act(async () => {
    await Promise.resolve()
  })
}

function type(value: string) {
  act(() => {
    fireEvent.change(screen.getByTestId('input'), { target: { value } })
  })
}

describe('query loader debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('passes only the settled search to the loader', async () => {
    const queries: string[] = []
    const loader = createVanillaQueryLoader({
      fetcher: async (query) => {
        queries.push(query)
        return [item(`R${query}`)]
      },
      minQueryLength: 0,
      debounce: 80,
    })
    render(<Menu loader={loader} />)
    await advance()
    expect(queries).toEqual([''])

    type('a')
    await advance(40)
    type('ab')
    await advance(79)
    expect(queries).toEqual([''])

    await advance(1)
    expect(queries).toEqual(['', 'ab'])
    expect(screen.getByTestId('item-rab')).toBeInTheDocument()
  })

  it('never runs a search the config disallows while one is waiting', async () => {
    const queries: string[] = []
    const loader = createVanillaQueryLoader({
      fetcher: async (query) => {
        queries.push(query)
        return []
      },
      minQueryLength: 2,
      initialQueryBehavior: false,
      debounce: 80,
    })
    render(<Menu loader={loader} />)
    await advance()

    type('a')
    await advance(10)
    type('ab')
    await advance(10)
    expect(queries).toEqual([])

    await advance(80)
    expect(queries).toEqual(['ab'])
  })

  it('does not show Empty while the search is waiting out the debounce', async () => {
    const loader = createVanillaQueryLoader({
      fetcher: async (query): Promise<NodeDef[]> =>
        query === '' ? [item('Alice')] : [],
      minQueryLength: 0,
      debounce: 80,
    })
    render(<Menu loader={loader} />)
    await advance()
    expect(screen.getByTestId('item-alice')).toBeInTheDocument()

    type('zz')
    await advance(40)
    expect(screen.queryByTestId('empty')).not.toBeInTheDocument()

    await advance(40)
    expect(screen.getByTestId('empty')).toBeInTheDocument()
  })

  it('does nothing extra when debounce is 0', async () => {
    const queries: string[] = []
    const loader = createVanillaQueryLoader({
      fetcher: async (query) => {
        queries.push(query)
        return []
      },
      minQueryLength: 0,
    })
    render(<Menu loader={loader} />)
    await advance()

    type('a')
    await advance()
    type('ab')
    await advance()

    expect(queries).toEqual(['', 'a', 'ab'])
  })

  it('reports the loader as fetching while a search waits, for "working" indicators', async () => {
    const loader = createVanillaQueryLoader({
      fetcher: async () => [],
      minQueryLength: 0,
      debounce: 80,
    })
    render(<Menu loader={loader} />)
    await advance()
    expect(screen.queryByTestId('working')).not.toBeInTheDocument()

    type('a')
    await advance(40)
    expect(screen.getByTestId('working')).toBeInTheDocument()

    await advance(40)
    expect(screen.queryByTestId('working')).not.toBeInTheDocument()
  })

  it("doesn't settle on stale rows when a loader reports the new search a render late", async () => {
    const results = new Map<string, NodeDef[]>([['', [item('Old')]]])
    // Keeps the last data and flips to fetching in an effect, one render
    // after the search changes.
    function LateLoader({ query, children }: LoaderComponentProps) {
      const [state, setState] = React.useState({
        query,
        data: results.get(query),
        fetching: false,
      })
      const shownQuery = React.useRef(query)
      React.useEffect(() => {
        if (shownQuery.current === query) return
        shownQuery.current = query
        setState((current) => ({ ...current, query, fetching: true }))
        const timeout = setTimeout(
          () => setState({ query, data: results.get(query), fetching: false }),
          50,
        )
        return () => clearTimeout(timeout)
      }, [query])
      const hasData = state.data !== undefined
      const result: AsyncLoaderResult<NodeDef[]> = {
        data: state.data,
        error: null,
        status: hasData ? 'success' : 'pending',
        fetchStatus: state.fetching ? 'fetching' : 'idle',
        loadingPhase: state.fetching ? 'background' : 'none',
        isLoading: false,
        isFetching: state.fetching,
        isInitialLoading: false,
        isRefetching: state.fetching,
        isPending: !hasData,
        isSuccess: hasData,
        isError: false,
        isPaused: false,
        hasData,
        hasFetched: hasData,
      }
      return <>{children(result)}</>
    }
    results.set('n', [item('New')])
    const loader: QueryLoaderConfig = {
      type: 'query',
      Loader: LateLoader,
      minQueryLength: 0,
      debounce: 80,
    }
    render(<Menu loader={loader} reveal="block" />)
    await advance()
    expect(screen.getByTestId('item-old')).toBeInTheDocument()

    type('n')
    await advance(80)
    // The loader has the new search but still shows "Old" as not fetching.
    await advance(10)
    expect(screen.getByTestId('item-old')).toBeInTheDocument()
    expect(screen.queryByTestId('item-new')).not.toBeInTheDocument()

    await advance(50)
    expect(screen.getByTestId('item-new')).toBeInTheDocument()
    expect(screen.queryByTestId('item-old')).not.toBeInTheDocument()
  })

  it('settles when the real fetch looks exactly like the debounce stand-in', async () => {
    // Like keepPreviousData: on a new search it reports the old data as a
    // background fetch at once, then answers with the same constant array.
    const SAME = [item('Apple'), item('Berry')]
    function KeepLoader({ query, children }: LoaderComponentProps) {
      const [answered, setAnswered] = React.useState(query)
      React.useEffect(() => {
        const timeout = setTimeout(() => setAnswered(query), 50)
        return () => clearTimeout(timeout)
      }, [query])
      const fetching = answered !== query
      const result: AsyncLoaderResult<NodeDef[]> = {
        data: SAME,
        error: null,
        status: 'success',
        fetchStatus: fetching ? 'fetching' : 'idle',
        loadingPhase: fetching ? 'background' : 'none',
        isLoading: false,
        isFetching: fetching,
        isInitialLoading: false,
        isRefetching: fetching,
        isPending: false,
        isSuccess: true,
        isError: false,
        isPaused: false,
        hasData: true,
        hasFetched: true,
      }
      return <>{children(result)}</>
    }
    const loader: QueryLoaderConfig = {
      type: 'query',
      Loader: KeepLoader,
      minQueryLength: 0,
      debounce: 80,
    }
    render(<Menu loader={loader} reveal="block" />)
    await advance()
    expect(screen.getByTestId('item-berry')).toBeInTheDocument()

    type('p')
    await advance(80)
    await advance(60)

    // Settled for "p": only matching rows, no longer the frozen list.
    expect(screen.getByTestId('item-apple')).toBeInTheDocument()
    expect(screen.queryByTestId('item-berry')).not.toBeInTheDocument()
  })
})
