import { act, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as CommandMenuEntry from '../../../../command-menu/index.js'
import * as ContextMenuEntry from '../../../../context-menu/index.js'
import {
  type AsyncMenuCoordinatorValue,
  DropdownMenu,
  type LoaderState,
  useAsyncMenuCoordinator,
  useLoader,
} from '../../../../dropdown-menu/index.js'
import { createVanillaQueryLoader } from '../../../../loaders/vanilla.js'
import * as SuggestionMenuEntry from '../../../../suggestion-menu/index.js'
import { useLoadersSettled } from '../../members.js'
import type {
  AsyncLoaderConfig,
  AsyncLoaderResult,
  ItemDef,
  LoaderComponentProps,
  NodeDef,
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

function Rows() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

/** Records the loader's state on every render. */
function Probe({
  states,
  branchId,
}: {
  states: LoaderState<NodeDef[]>[]
  branchId?: string | null
}) {
  states.push(DropdownMenu.useLoader(branchId))
  return null
}

let coordinator: AsyncMenuCoordinatorValue | null = null
let treeSettled: boolean | null = null
function Coordinator() {
  coordinator = useAsyncMenuCoordinator()
  treeSettled = useLoadersSettled(coordinator?.searchQuery ?? '')
  return null
}

function Menu(props: {
  loader?: AsyncLoaderConfig
  content?: NodeDef[]
  states: LoaderState<NodeDef[]>[]
  branchId?: string | null
  deepSearch?: boolean
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              content={props.content ?? []}
              asyncContent={props.loader}
              deepSearch={
                props.deepSearch ? { enabled: true, minLength: 1 } : undefined
              }
            >
              <DropdownMenu.Input data-testid="input" />
              <DropdownMenu.List>
                <Rows />
              </DropdownMenu.List>
              <Probe states={props.states} branchId={props.branchId} />
              <Coordinator />
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

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
  const { data, error = null } = fields
  const fetching = fields.isFetching ?? false
  const hasData = data !== undefined
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
  }
}

/** A static loader whose result the test sets. */
function controlledLoader(loadStrategy: 'eager' | 'lazy' = 'eager') {
  let set: ((result: AsyncLoaderResult<NodeDef[]>) => void) | null = null
  function Loader({ children }: LoaderComponentProps) {
    const [result, setResult] = React.useState(() =>
      loaderResult({ isFetching: true }),
    )
    set = setResult
    return <>{children(result)}</>
  }
  const config: AsyncLoaderConfig = { type: 'static', Loader, loadStrategy }
  return {
    config,
    show: (fields: Partial<AsyncLoaderResult<NodeDef[]>>) =>
      act(async () => {
        set?.(loaderResult(fields))
      }),
  }
}

const last = (states: LoaderState<NodeDef[]>[]) => states[states.length - 1]

describe('useLoader', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is on every menu namespace that has data-first content', () => {
    expect(useLoader).toBeTypeOf('function')
    expect(DropdownMenu.useLoader).toBe(useLoader)
    expect(ContextMenuEntry.ContextMenu.useLoader).toBe(useLoader)
    expect(ContextMenuEntry.useLoader).toBe(useLoader)
    expect(CommandMenuEntry.CommandMenu.useLoader).toBe(useLoader)
    expect(CommandMenuEntry.useLoader).toBe(useLoader)
    expect(SuggestionMenuEntry.SuggestionMenu.useLoader).toBe(useLoader)
    expect(SuggestionMenuEntry.useLoader).toBe(useLoader)
  })

  it('is idle outside a data-first Surface', () => {
    const states: LoaderState<NodeDef[]>[] = []
    render(<Probe states={states} />)
    expect(last(states)).toEqual({ status: 'idle' })
  })

  it("follows the Surface's own loader: loading, settled, a background refetch, an error", async () => {
    const states: LoaderState<NodeDef[]>[] = []
    const loader = controlledLoader()
    render(<Menu loader={loader.config} states={states} />)
    await advance()
    expect(last(states)).toMatchObject({
      status: 'loading',
      token: { query: '' },
    })

    const rows = [item('Apple')]
    await loader.show({ data: rows })
    expect(last(states)).toMatchObject({ status: 'settled', data: rows })
    const settled = last(states)

    // A background refetch of the same query keeps it settled.
    await loader.show({ data: rows, isFetching: true })
    expect(last(states)).toBe(settled)

    const failure = new Error('offline')
    await loader.show({ data: rows, error: failure })
    expect(last(states)).toMatchObject({
      status: 'error',
      error: failure,
      previous: rows,
    })
  })

  it('reports a query waiting out its debounce, then loading behind the rows it shows', async () => {
    const states: LoaderState<NodeDef[]>[] = []
    const pending = new Map<string, (rows: NodeDef[]) => void>()
    const loader = createVanillaQueryLoader({
      fetcher: (query) =>
        new Promise<NodeDef[]>((resolve) => pending.set(query, resolve)),
      minQueryLength: 0,
      debounce: 80,
      keepPreviousData: true,
    })
    render(<Menu loader={loader} states={states} />)
    await advance()
    const rows = [item('Alice')]
    await act(async () => {
      pending.get('')?.(rows)
    })
    await advance()
    expect(last(states)).toMatchObject({
      status: 'settled',
      token: { query: '' },
    })

    type('b')
    expect(last(states)).toMatchObject({
      status: 'debouncing',
      token: { query: 'b' },
      previous: rows,
    })
    await advance(80)
    expect(last(states)).toMatchObject({
      status: 'refreshing',
      token: { query: 'b' },
      data: rows,
    })
    const answer = [item('Bob')]
    await act(async () => {
      pending.get('b')?.(answer)
    })
    await advance()
    expect(last(states)).toMatchObject({
      status: 'settled',
      token: { query: 'b' },
      data: answer,
    })
  })

  it('renders again only when the loader state changes', async () => {
    const states: LoaderState<NodeDef[]>[] = []
    const loader = controlledLoader()
    render(<Menu loader={loader.config} states={states} />)
    await advance()
    await loader.show({ data: [item('Apple'), item('Avocado')] })
    const renders = states.length

    // A static loader answers every search: its state doesn't change.
    type('a')
    await advance()
    type('av')
    await advance()
    expect(states.length).toBe(renders)
  })

  it("follows a branch's deep-search loader by the branch's Resolved ID", async () => {
    const states: LoaderState<NodeDef[]>[] = []
    const branch = controlledLoader('lazy')
    const projects: SubmenuDef = {
      kind: 'submenu',
      value: 'Projects',
      nodes: [],
      asyncNodes: branch.config,
      render: ({ props }) => (
        <DropdownMenu.Item {...props} data-testid="item-projects">
          Projects
        </DropdownMenu.Item>
      ),
    }
    const view = render(
      <Menu content={[projects]} states={states} deepSearch />,
    )
    await advance()
    type('a')
    await advance()
    const ids = [...(coordinator?.loaders.keys() ?? [])]
    expect(ids).toHaveLength(1)
    const [branchId] = ids
    view.rerender(
      <Menu
        content={[projects]}
        states={states}
        deepSearch
        branchId={branchId}
      />,
    )
    expect(last(states)).toMatchObject({ status: 'loading' })
    // No root loader to wait for, but the branch loader is still loading.
    expect(coordinator?.rootReveal.settled).toBe(true)
    expect(treeSettled).toBe(false)
    const rows = [item('Atlas')]
    await branch.show({ data: rows })
    expect(last(states)).toMatchObject({ status: 'settled', data: rows })
    // The tree has settled for the search once the branch loader has.
    expect(treeSettled).toBe(true)
    // The Surface's own loader is another one: it has none.
    view.rerender(
      <Menu content={[projects]} states={states} deepSearch branchId={null} />,
    )
    expect(last(states)).toEqual({ status: 'idle' })
  })
})
