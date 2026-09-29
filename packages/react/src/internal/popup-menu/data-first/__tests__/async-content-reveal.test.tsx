import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import { createVanillaQueryLoader } from '../../../../loaders/vanilla.js'
import type {
  AsyncLoaderResult,
  ItemDef,
  LoaderComponentProps,
  NodeDef,
  QueryLoaderConfig,
  SubmenuDef,
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

function resultOf(
  data: NodeDef[] | undefined,
  fetching: boolean,
): AsyncLoaderResult<NodeDef[]> {
  const hasData = data !== undefined
  return {
    data,
    error: null,
    status: hasData ? 'success' : 'pending',
    fetchStatus: fetching ? 'fetching' : 'idle',
    loadingPhase: fetching ? (hasData ? 'background' : 'initial') : 'none',
    isLoading: fetching && !hasData,
    isFetching: fetching,
    isInitialLoading: fetching && !hasData,
    isRefetching: fetching && hasData,
    isPending: !hasData,
    isSuccess: hasData,
    isError: false,
    isPaused: false,
    hasData,
    hasFetched: hasData,
  }
}

/**
 * A query loader the test drives: each query stays fetching until resolved,
 * and keeps showing the last resolved data meanwhile (like keepPreviousData).
 */
function createControlledQueryLoader() {
  const resolved = new Map<string, NodeDef[]>()
  let lastData: NodeDef[] | undefined
  const listeners = new Set<() => void>()
  let version = 0

  function Loader({ query, children }: LoaderComponentProps) {
    React.useSyncExternalStore(
      (listener) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
      () => version,
    )
    const data = resolved.get(query)
    if (data) lastData = data
    return (
      <>{children(data ? resultOf(data, false) : resultOf(lastData, true))}</>
    )
  }

  const config: QueryLoaderConfig = {
    type: 'query',
    Loader,
    minQueryLength: 0,
  }
  return {
    config,
    resolve(query: string, data: NodeDef[]) {
      act(() => {
        resolved.set(query, data)
        version++
        for (const listener of listeners) listener()
      })
    },
  }
}

function Rows() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

function Menu(props: {
  loader: QueryLoaderConfig
  reveal?: 'stream' | 'block'
  content?: NodeDef[]
  deepSearch?: boolean
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              content={props.content ?? [item('Alice'), item('Bob')]}
              asyncContent={props.loader}
              deepSearch={props.deepSearch}
              asyncContentMode="append"
              asyncContentReveal={props.reveal}
            >
              <DropdownMenu.Input data-testid="input" />
              <DropdownMenu.List>
                <DropdownMenu.Loading data-testid="loading" />
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

const rowIds = () =>
  [...document.querySelectorAll('[role="option"]')].map((el) =>
    el.getAttribute('data-testid'),
  )

describe('asyncContentReveal', () => {
  it("'block' shows nothing until the first search settles, then local and loaded rows together", async () => {
    const loader = createControlledQueryLoader()
    render(<Menu loader={loader.config} reveal="block" />)

    await screen.findByTestId('input')
    await screen.findByTestId('loading')
    expect(rowIds()).toEqual([])

    loader.resolve('', [item('Carol')])

    await waitFor(() =>
      expect(rowIds()).toEqual(['item-alice', 'item-bob', 'item-carol']),
    )
  })

  it("'block' keeps the previous list unchanged while the next search loads", async () => {
    const user = userEvent.setup()
    const loader = createControlledQueryLoader()
    render(<Menu loader={loader.config} reveal="block" />)
    await screen.findByTestId('input')
    loader.resolve('', [item('Carol')])
    await waitFor(() =>
      expect(rowIds()).toEqual(['item-alice', 'item-bob', 'item-carol']),
    )

    await user.type(screen.getByTestId('input'), 'a')

    // Local filtering alone would drop Bob; the settled list stays up instead.
    expect(rowIds()).toEqual(['item-alice', 'item-bob', 'item-carol'])
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument()

    loader.resolve('a', [item('Carol'), item('Dana')])

    await waitFor(() =>
      expect(rowIds()).toEqual(['item-alice', 'item-carol', 'item-dana']),
    )
  })

  it("'stream' (the default) shows local rows at once and loaded rows as they arrive", async () => {
    const user = userEvent.setup()
    const loader = createControlledQueryLoader()
    render(<Menu loader={loader.config} />)

    await screen.findByTestId('item-bob')
    expect(rowIds()).toEqual(['item-alice', 'item-bob'])

    loader.resolve('', [item('Carol')])
    await screen.findByTestId('item-carol')

    await user.type(screen.getByTestId('input'), 'a')

    // Filtered right away, with the kept rows from the previous search.
    await waitFor(() => expect(rowIds()).toEqual(['item-alice', 'item-carol']))
  })

  it("'block' doesn't treat a loader that reports fetching a render late as settled", async () => {
    const user = userEvent.setup()
    const pending = new Map<string, (data: NodeDef[]) => void>()
    const loader = createVanillaQueryLoader({
      fetcher: (query) =>
        new Promise<NodeDef[]>((resolve) => pending.set(query, resolve)),
      minQueryLength: 0,
    })
    render(<Menu loader={loader} reveal="block" />)
    await screen.findByTestId('input')
    await waitFor(() => expect(pending.has('')).toBe(true))
    await act(async () => pending.get('')?.([item('Carol')]))
    await waitFor(() =>
      expect(rowIds()).toEqual(['item-alice', 'item-bob', 'item-carol']),
    )

    await user.type(screen.getByTestId('input'), 'a')
    await waitFor(() => expect(pending.has('a')).toBe(true))

    expect(rowIds()).toEqual(['item-alice', 'item-bob', 'item-carol'])
    // This loader drops its data while refetching; the frozen list still
    // stands in for it, with no loading state.
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument()

    await act(async () => pending.get('a')?.([item('Dana')]))
    await waitFor(() => expect(rowIds()).toEqual(['item-alice', 'item-dana']))
  })

  it("'block' settles again when the search returns to one whose results are showing", async () => {
    const user = userEvent.setup()
    const loader = createControlledQueryLoader()
    const { rerender } = render(<Menu loader={loader.config} reveal="block" />)
    await screen.findByTestId('input')
    loader.resolve('', [item('Carol')])
    await waitFor(() =>
      expect(rowIds()).toEqual(['item-alice', 'item-bob', 'item-carol']),
    )

    await user.type(screen.getByTestId('input'), 'x')
    await user.keyboard('{Backspace}')

    // Back on "", whose data is showing: settled, so content updates show.
    rerender(
      <Menu
        loader={loader.config}
        reveal="block"
        content={[item('Alice'), item('Bob'), item('Beth')]}
      />,
    )
    await waitFor(() =>
      expect(rowIds()).toEqual([
        'item-alice',
        'item-bob',
        'item-beth',
        'item-carol',
      ]),
    )
  })

  it("'block' shows local rows when the root loader is never rendered", async () => {
    const loader = createControlledQueryLoader()
    render(<Menu loader={loader.config} reveal="block" deepSearch={false} />)

    await waitFor(() => expect(rowIds()).toEqual(['item-alice', 'item-bob']))
  })

  it('does not show Empty while a search is still loading behind kept rows', async () => {
    const user = userEvent.setup()
    const loader = createControlledQueryLoader()
    render(<Menu loader={loader.config} content={[]} />)
    await screen.findByTestId('input')
    loader.resolve('', [item('Carol')])
    await screen.findByTestId('item-carol')

    await user.type(screen.getByTestId('input'), 'zz')

    // The kept "Carol" is filtered out, but "zz" hasn't answered yet.
    expect(rowIds()).toEqual([])
    expect(screen.queryByTestId('empty')).not.toBeInTheDocument()

    loader.resolve('zz', [])
    await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument())
  })

  it("'block' still shows Loading for deep search while the root list isn't frozen", async () => {
    const user = userEvent.setup()
    const root = createControlledQueryLoader()
    const branch = createControlledQueryLoader()
    const projects: SubmenuDef = {
      kind: 'submenu',
      value: 'Projects',
      nodes: [],
      asyncNodes: { ...branch.config, minQueryLength: 1 },
      render: ({ props }) => (
        <DropdownMenu.Item {...props} data-testid="item-projects">
          Projects
        </DropdownMenu.Item>
      ),
    }
    render(<Menu loader={root.config} reveal="block" content={[projects]} />)
    await screen.findByTestId('input')
    root.resolve('', [])
    await screen.findByTestId('item-projects')
    root.resolve('w', [])

    await user.type(screen.getByTestId('input'), 'w')

    // The root answered "w"; the Projects loader is still loading deep results.
    await waitFor(() =>
      expect(screen.getByTestId('loading')).toBeInTheDocument(),
    )
  })
})
