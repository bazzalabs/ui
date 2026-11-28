import { LoaderManager } from '@bazza-ui/menu-core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type AsyncMenuCoordinatorValue,
  type AsyncState,
  DropdownMenu,
  useAsyncMenuCoordinator,
} from '../../../../dropdown-menu/index.js'
import { createVanillaQueryLoader } from '../../../../loaders/vanilla.js'
import type {
  AsyncLoaderConfig,
  AsyncLoaderResult,
  ItemDef,
  LoaderComponentProps,
  NodeDef,
} from '../types.js'

// Every data-first loader's state lives in its menu tree's LoaderManager,
// which follows the Surface's search from the store update that changes it.
// These pin what the coordinator and the list's `async` state derive from it.

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

interface Commit {
  search: string
  async: AsyncState
  empty: boolean
  loading: boolean
  settled: boolean | undefined
}

/** Records the list's state in every commit that changes it. */
function Rows({ commits }: { commits?: Commit[] }) {
  const state = DropdownMenu.useDataList()
  const settled = useAsyncMenuCoordinator()?.rootReveal.settled
  React.useLayoutEffect(() => {
    commits?.push({
      search: state.search,
      async: state.async,
      empty: document.querySelector('[data-testid="empty"]') !== null,
      loading: document.querySelector('[data-testid="loading"]') !== null,
      settled,
    })
  })
  return <>{state.nodes.map(state.renderNode)}</>
}

function Coordinator({
  onValue,
}: {
  onValue: (value: AsyncMenuCoordinatorValue | null) => void
}) {
  onValue(useAsyncMenuCoordinator())
  return null
}

function Menu(props: {
  loader?: AsyncLoaderConfig
  content?: NodeDef[]
  commits?: Commit[]
  onCoordinator?: (value: AsyncMenuCoordinatorValue | null) => void
  loadingPart?: boolean
  surface?: Partial<DropdownMenu.Surface.Props>
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              content={props.content ?? []}
              asyncContent={props.loader}
              {...props.surface}
            >
              <DropdownMenu.Input data-testid="input" />
              <DropdownMenu.List>
                {props.loadingPart && (
                  <DropdownMenu.Loading data-testid="loading">
                    Loading
                  </DropdownMenu.Loading>
                )}
                <DropdownMenu.Empty data-testid="empty">
                  None
                </DropdownMenu.Empty>
                <Rows commits={props.commits} />
              </DropdownMenu.List>
              {props.onCoordinator && (
                <Coordinator onValue={props.onCoordinator} />
              )}
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

function loaderResult(
  fields: Partial<AsyncLoaderResult<NodeDef[]>>,
): AsyncLoaderResult<NodeDef[]> {
  const data = fields.data
  const fetching = fields.isFetching ?? false
  const hasData = data !== undefined
  const error = fields.error ?? null
  return {
    data,
    error,
    status: error ? 'error' : hasData ? 'success' : 'pending',
    fetchStatus: fetching ? 'fetching' : 'idle',
    loadingPhase: fetching ? (hasData ? 'background' : 'initial') : 'none',
    isLoading: fetching && !hasData,
    isFetching: fetching,
    isInitialLoading: fetching && !hasData,
    isRefetching: fetching && hasData,
    isPending: !hasData && !error,
    isSuccess: hasData && !error,
    isError: error !== null,
    isPaused: false,
    hasData,
    hasFetched: hasData || error !== null,
    ...fields,
  }
}

/** A static loader whose result the test sets. */
function controlledLoader() {
  let set: ((result: AsyncLoaderResult<NodeDef[]>) => void) | null = null
  function Loader({ children }: LoaderComponentProps) {
    const [result, setResult] = React.useState(() =>
      loaderResult({ isFetching: true }),
    )
    set = setResult
    return <>{children(result)}</>
  }
  const config: AsyncLoaderConfig = {
    type: 'static',
    Loader,
    loadStrategy: 'eager',
  }
  return {
    config,
    show: (fields: Partial<AsyncLoaderResult<NodeDef[]>>) =>
      act(async () => {
        set?.(loaderResult(fields))
      }),
  }
}

describe('loader state through the menu tree', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports a search waiting out its debounce as fetching in the commit that changes it', async () => {
    const commits: Commit[] = []
    const loader = createVanillaQueryLoader({
      fetcher: async (query): Promise<NodeDef[]> =>
        query === '' ? [item('Alice')] : [],
      minQueryLength: 0,
      debounce: 80,
    })
    render(<Menu loader={loader} commits={commits} />)
    await advance()
    expect(screen.getByTestId('item-alice')).toBeInTheDocument()

    commits.length = 0
    type('zz')
    const waiting = commits.filter((commit) => commit.search === 'zz')
    expect(waiting.length).toBeGreaterThan(0)
    // No commit shows the new search with the previous one's settled state.
    for (const commit of waiting) {
      expect(commit.async.isFetching).toBe(true)
      expect(commit.empty).toBe(false)
    }
  })

  it('takes one commit per key while a search waits out its debounce', async () => {
    const commits: Commit[] = []
    const loader = createVanillaQueryLoader({
      fetcher: async () => [item('Alice')],
      minQueryLength: 0,
      debounce: 80,
    })
    render(<Menu loader={loader} commits={commits} />)
    await advance()

    commits.length = 0
    type('a')
    type('ab')
    type('abc')
    await advance()
    expect(commits.map((commit) => commit.search)).toEqual(['a', 'ab', 'abc'])
  })

  it('derives the AsyncState booleans from each phase of a loader', async () => {
    const commits: Commit[] = []
    const loader = controlledLoader()
    render(<Menu loader={loader.config} commits={commits} />)
    await advance()
    const last = () => commits[commits.length - 1]!.async

    expect(last()).toMatchObject({
      isLoading: true,
      isFetching: true,
      isInitialLoading: true,
      isRefetching: false,
      isAllRefetching: false,
      isStaticLoading: true,
      isStaticInitialLoading: true,
      isQueryLoading: false,
      skippedMenus: [],
    })

    const rows = [item('Apple')]
    await loader.show({ data: rows })
    expect(last()).toMatchObject({
      isLoading: false,
      isFetching: false,
      isRefetching: false,
      isStaticLoading: false,
    })

    await loader.show({ data: rows, isFetching: true })
    expect(last()).toMatchObject({
      isLoading: false,
      isFetching: true,
      isRefetching: true,
      isAllRefetching: true,
      isStaticRefetching: true,
      isQueryRefetching: false,
    })

    await loader.show({ data: rows, error: new Error('offline') })
    expect(last()).toMatchObject({
      isFetching: false,
      skippedMenus: [{ kind: 'root', reason: 'error' }],
    })
  })

  it('keeps the coordinator settled through a refetch of the search', async () => {
    let coordinator: AsyncMenuCoordinatorValue | null = null
    let answer = 'Apple'
    const loader = createVanillaQueryLoader({
      fetcher: async () => [item(answer)],
      minQueryLength: 0,
    })
    render(
      <Menu
        loader={loader}
        onCoordinator={(value) => {
          coordinator = value
        }}
      />,
    )
    await advance()
    expect(screen.getByTestId('item-apple')).toBeInTheDocument()
    const current = () => coordinator as AsyncMenuCoordinatorValue | null
    expect(current()?.rootReveal.settled).toBe(true)

    answer = 'Berry'
    act(() => {
      current()?.root?.result.refetch?.()
    })
    expect(current()?.isAnyRefetching).toBe(true)
    expect(current()?.rootReveal.settled).toBe(true)
    await advance()
    expect(screen.getByTestId('item-berry')).toBeInTheDocument()
    expect(current()?.isAnyFetching).toBe(false)
  })

  it('makes no loader manager for a menu without async content', async () => {
    const start = vi.spyOn(LoaderManager.prototype, 'start')
    const setSearch = vi.spyOn(LoaderManager.prototype, 'setSearch')
    try {
      render(<Menu content={[item('Apple'), item('Berry')]} />)
      await advance()
      type('b')
      await advance()
      expect(screen.getByTestId('item-berry')).toBeInTheDocument()
      expect(start).not.toHaveBeenCalled()
      expect(setSearch).not.toHaveBeenCalled()
    } finally {
      start.mockRestore()
      setSearch.mockRestore()
    }
  })

  for (const keepPreviousData of [false, true]) {
    it(`doesn't settle a waited-for search on the earlier search's answer (keepPreviousData: ${keepPreviousData})`, async () => {
      const commits: Commit[] = []
      const pending = new Map<string, (rows: NodeDef[]) => void>()
      const loader = createVanillaQueryLoader({
        fetcher: (query) =>
          new Promise<NodeDef[]>((resolve) => pending.set(query, resolve)),
        minQueryLength: 0,
        debounce: 80,
        keepPreviousData,
      })
      render(<Menu loader={loader} commits={commits} />)
      await advance()
      type('zz')
      // The '' fetch answers while 'zz' waits out the debounce.
      await act(async () => {
        pending.get('')?.([item('Alice')])
      })
      await advance(80)
      expect(pending.has('zz')).toBe(true)
      expect(commits.filter((commit) => commit.empty)).toEqual([])
      expect(
        commits.filter((commit) => commit.search === 'zz' && commit.settled),
      ).toEqual([])

      await act(async () => {
        pending.get('zz')?.([])
      })
      await advance()
      expect(commits[commits.length - 1]).toMatchObject({
        search: 'zz',
        settled: true,
        empty: true,
      })
    })
  }

  it('keeps a first load fetching, with its Loading part, when the debounce ends', async () => {
    const commits: Commit[] = []
    const loader = createVanillaQueryLoader({
      fetcher: () => new Promise<NodeDef[]>(() => {}),
      minQueryLength: 2,
      initialQueryBehavior: false,
      debounce: 80,
    })
    render(<Menu loader={loader} commits={commits} loadingPart />)
    await advance()
    type('zz')
    await advance()
    commits.length = 0
    await advance(80)
    await advance()
    expect(
      commits.map(({ async, loading }) => ({
        fetching: async.isFetching,
        loading,
      })),
    ).toEqual([{ fetching: true, loading: true }])
  })

  it("doesn't start a lazy branch loader deep search isn't running", async () => {
    const start = vi.spyOn(LoaderManager.prototype, 'start')
    const lazy = controlledLoader()
    const files: NodeDef = {
      kind: 'submenu',
      value: 'Files',
      nodes: [],
      asyncNodes: { ...lazy.config, loadStrategy: 'lazy' },
      render: ({ props }) => (
        <DropdownMenu.Item {...props}>Files</DropdownMenu.Item>
      ),
    } as NodeDef
    try {
      // `filter={false}` mounts the branch loaders for deep search without
      // running them.
      render(
        <Menu
          content={[item('Apple'), files]}
          surface={{
            filter: false,
            deepSearch: { enabled: true, minLength: 1 },
          }}
        />,
      )
      await advance()
      type('f')
      await advance()
      expect(start).not.toHaveBeenCalled()
    } finally {
      start.mockRestore()
    }
  })

  it("doesn't render Empty in the commit a settle lands, before its rows", async () => {
    const commits: Commit[] = []
    const pending = new Map<string, (rows: NodeDef[]) => void>()
    const loader = createVanillaQueryLoader({
      fetcher: (query) =>
        new Promise<NodeDef[]>((resolve) => pending.set(query, resolve)),
      minQueryLength: 0,
    })
    render(<Menu loader={loader} commits={commits} />)
    await act(async () => {
      pending.get('')?.([item('Alice')])
    })
    await advance()
    type('b')
    await advance()
    let added = 0
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (
            node instanceof Element &&
            (node.matches('[data-testid="empty"]') ||
              node.querySelector('[data-testid="empty"]'))
          ) {
            added++
          }
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    try {
      await act(async () => {
        pending.get('b')?.([item('Bob')])
      })
      await advance()
      // Let the observer hear every mutation.
      await act(async () => {})
    } finally {
      observer.disconnect()
    }
    expect(screen.getByTestId('item-bob')).toBeInTheDocument()
    expect(added).toBe(0)
  })
})
