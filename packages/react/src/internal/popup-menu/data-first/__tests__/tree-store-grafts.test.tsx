import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import {
  type AsyncLoaderResult,
  type AsyncMenuCoordinatorValue,
  CommandMenu,
  type DataListChildrenState,
  type LoaderComponentProps,
  type NodeDef,
  type SubpageDef,
  useAsyncMenuCoordinator,
  useDataList,
} from '../../../../command-menu/index.js'
import { useMenuTree } from '../../contexts/menu-tree-context.js'
import { DataPopupContext } from '../../index.js'
import type { MenuTreeStore } from '../../store/MenuTreeStore.js'
import type { DataPopupContextValue, ResolvedNodesSlot } from '../context.js'

// A loader result reaches the Menu Tree in the store update that records it,
// so every reader of the tree (the list's deep search, the popup's subpage
// outlet) renders the grafted nodes in the same commit.

function loaderResult(data?: NodeDef[]): AsyncLoaderResult<NodeDef[]> {
  const loaded = data !== undefined
  return {
    data,
    source: 'vanilla',
    error: null,
    status: loaded ? 'success' : 'pending',
    fetchStatus: loaded ? 'idle' : 'fetching',
    loadingPhase: loaded ? 'none' : 'initial',
    isLoading: !loaded,
    isFetching: !loaded,
    isInitialLoading: !loaded,
    isRefetching: false,
    isPending: !loaded,
    isSuccess: loaded,
    isError: false,
    isPaused: false,
    hasData: loaded,
    hasFetched: loaded,
  }
}

function createLoader() {
  let setResult: ((result: AsyncLoaderResult<NodeDef[]>) => void) | null = null
  function Loader({ children }: LoaderComponentProps) {
    const [result, set] = React.useState(() => loaderResult())
    React.useEffect(() => {
      setResult = set
    }, [])
    return <>{children(result)}</>
  }
  return {
    Loader,
    mounted: () => setResult !== null,
    resolve: (nodes: NodeDef[]) =>
      act(async () => {
        setResult?.(loaderResult(nodes))
      }),
  }
}

/**
 * Each probe, when it mounts, records whether the other was already on the
 * page. Probes that mount in the same commit see each other.
 */
const mounts: Array<{ probe: string; sawOther: boolean }> = []

function Probe({ name, other }: { name: string; other: string }) {
  React.useLayoutEffect(() => {
    mounts.push({
      probe: name,
      sawOther: document.querySelector(`[data-probe="${other}"]`) !== null,
    })
  }, [name, other])
  return <span data-probe={name} />
}

// Loaded under the async "Projects" branch: a subpage the deep search shows
// as a row (its trigger) and the popup's outlet renders (its content).
const settings: SubpageDef = {
  kind: 'subpage',
  id: 'settings',
  value: 'Settings',
  nodes: [],
  renderTrigger: ({ props }) => (
    <CommandMenu.SubpageTrigger {...props} data-testid="settings-row">
      Settings
      <Probe name="row" other="outlet" />
    </CommandMenu.SubpageTrigger>
  ),
  renderContent: () => <Probe name="outlet" other="row" />,
}

function projects(Loader: React.ComponentType<LoaderComponentProps>) {
  const def: SubpageDef = {
    kind: 'subpage',
    id: 'projects',
    value: 'Projects',
    nodes: [],
    asyncNodes: { type: 'static', Loader, loadStrategy: 'eager' },
    renderTrigger: ({ props }) => (
      <CommandMenu.SubpageTrigger {...props}>
        Projects
      </CommandMenu.SubpageTrigger>
    ),
    renderContent: () => null,
  }
  return def
}

function Rows({
  onState,
}: {
  onState?: (state: DataListChildrenState) => void
}) {
  const state = useDataList()
  onState?.(state)
  return <>{state.nodes.map(state.renderNode)}</>
}

function Readers({
  onCoordinator,
  onDataPopup,
}: {
  onCoordinator: (value: AsyncMenuCoordinatorValue | null) => void
  onDataPopup: (value: DataPopupContextValue | null) => void
}) {
  onCoordinator(useAsyncMenuCoordinator())
  onDataPopup(React.useContext(DataPopupContext))
  return null
}

function Menu({
  nodes,
  onCoordinator = () => {},
  onDataPopup = () => {},
  onState,
}: {
  nodes: NodeDef[]
  onCoordinator?: (value: AsyncMenuCoordinatorValue | null) => void
  onDataPopup?: (value: DataPopupContextValue | null) => void
  onState?: (state: DataListChildrenState) => void
}) {
  return (
    <CommandMenu.Root defaultOpen>
      <CommandMenu.Portal>
        <CommandMenu.Popup>
          <CommandMenu.Surface
            content={nodes}
            deepSearch={{ enabled: true, minLength: 1 }}
          >
            <CommandMenu.Input aria-label="Search" data-testid="input" />
            <CommandMenu.List>
              <Rows onState={onState} />
            </CommandMenu.List>
            <Readers onCoordinator={onCoordinator} onDataPopup={onDataPopup} />
          </CommandMenu.Surface>
        </CommandMenu.Popup>
      </CommandMenu.Portal>
    </CommandMenu.Root>
  )
}

describe('loader results in the menu tree', () => {
  it('shows a graft under a branch in deep search and the subpage outlet in one commit', async () => {
    mounts.length = 0
    const user = userEvent.setup()
    const loader = createLoader()
    render(<Menu nodes={[projects(loader.Loader)]} />)

    await user.type(screen.getByTestId('input'), 'set')
    await loader.resolve([settings])

    await waitFor(() => {
      expect(screen.getByTestId('settings-row')).toBeInTheDocument()
    })
    expect(document.querySelector('[data-probe="outlet"]')).not.toBeNull()
    // Neither mounted in a commit the other was missing from.
    expect(mounts).toEqual(
      expect.arrayContaining([
        { probe: 'row', sawOther: true },
        { probe: 'outlet', sawOther: true },
      ]),
    )
    expect(mounts.every((mount) => mount.sawOther)).toBe(true)
  })

  it('keeps the published data-first hooks and context shapes', async () => {
    const user = userEvent.setup()
    const loader = createLoader()
    let coordinator: AsyncMenuCoordinatorValue | null = null
    let dataPopup: DataPopupContextValue | null = null
    let listState: DataListChildrenState | null = null
    render(
      <Menu
        nodes={[projects(loader.Loader)]}
        onCoordinator={(value) => {
          coordinator = value
        }}
        onDataPopup={(value) => {
          dataPopup = value
        }}
        onState={(state) => {
          listState = state
        }}
      />,
    )

    await user.type(screen.getByTestId('input'), 'set')
    await waitFor(() => {
      expect(coordinator?.isAnyLoading).toBe(true)
    })
    const versionBefore = dataPopup!.resolvedNodes!.graftVersion
    await loader.resolve([settings])
    await waitFor(() => {
      expect(screen.getByTestId('settings-row')).toBeInTheDocument()
    })

    const value = coordinator! as AsyncMenuCoordinatorValue
    expect(Object.keys(value).sort()).toEqual(
      [
        'registerLoader',
        'unregisterLoader',
        'updateLoaderResult',
        'registerRootLoader',
        'unregisterRootLoader',
        'updateRootLoaderResult',
        'searchQuery',
        'loaders',
        'root',
        'isAnyLoading',
        'isAnyFetching',
        'isAnyInitialLoading',
        'isAnyRefetching',
        'isAllRefetching',
        'isRootLoading',
        'isStaticLoading',
        'isStaticFetching',
        'isStaticInitialLoading',
        'isStaticRefetching',
        'isQueryLoading',
        'isQueryFetching',
        'isQueryInitialLoading',
        'isQueryRefetching',
        'allResolved',
        'getAsyncNodes',
        'erroredLoaders',
        'rootError',
        'getAsyncState',
        'rootReveal',
        'setRootReveal',
      ].sort(),
    )
    expect(value.searchQuery).toBe('set')
    expect(value.root).toBeNull()
    expect(value.loaders).toBeInstanceOf(Map)
    expect(value.erroredLoaders).toBeInstanceOf(Map)
    const [[branchId, branch]] = [...value.loaders]
    expect(branch).toMatchObject({
      id: branchId,
      config: { type: 'static' },
      result: { data: [settings], isLoading: false },
    })
    expect(value.getAsyncNodes()).toEqual([
      { kind: 'branch', id: branchId, nodes: [settings] },
    ])
    expect(value).toMatchObject({
      isAnyLoading: false,
      isAnyFetching: false,
      isStaticLoading: false,
      isQueryLoading: false,
      allResolved: true,
      rootError: null,
      rootReveal: { settled: true, settledOnce: false, block: false },
    })
    expect(value.getAsyncState()).toMatchObject({
      isLoading: false,
      isFetching: false,
      skippedMenus: [],
    })

    const state = listState! as DataListChildrenState
    expect(Object.keys(state).sort()).toEqual([
      'async',
      'count',
      'isDeepSearching',
      'nodes',
      'renderNode',
      'search',
    ])
    expect(state).toMatchObject({
      search: 'set',
      isDeepSearching: true,
      count: state.nodes.length,
      async: { isLoading: false },
    })
    expect(state.nodes.some((node) => node.node.def === settings)).toBe(true)

    // The popup's context is derived from the tree: its slot holds the root
    // nodes, and its version moved with the graft.
    const popup = dataPopup! as DataPopupContextValue
    expect(Object.keys(popup).sort()).toEqual([
      'dataSurfaceContext',
      'resolvedNodes',
      'setDataSurfaceContext',
      'setResolvedNodes',
    ])
    expect(popup.dataSurfaceContext?.content).toHaveLength(1)
    expect(popup.resolvedNodes?.content).toBe(popup.dataSurfaceContext?.content)
    expect(popup.resolvedNodes?.nodes[0]?.children[0]?.def).toBe(settings)
    expect(popup.resolvedNodes!.graftVersion).toBeGreaterThan(versionBefore)
  })

  it("shows a subpage's own nested subpage, loaded by the subpage's loader", async () => {
    const user = userEvent.setup()
    const loader = createLoader()
    const nested: SubpageDef = {
      kind: 'subpage',
      id: 'nested',
      value: 'Nested',
      nodes: [],
      renderTrigger: ({ props }) => (
        <CommandMenu.SubpageTrigger {...props} data-testid="nested-trigger">
          Nested
        </CommandMenu.SubpageTrigger>
      ),
      renderContent: ({ pageId }) => (
        <CommandMenu.Subpage pageId={pageId}>
          <span data-testid="nested-page">Nested page</span>
        </CommandMenu.Subpage>
      ),
    }
    const outer: SubpageDef = {
      kind: 'subpage',
      id: 'outer',
      value: 'Outer',
      nodes: [],
      asyncNodes: {
        type: 'static',
        Loader: loader.Loader,
        loadStrategy: 'lazy',
      },
      renderTrigger: ({ props }) => (
        <CommandMenu.SubpageTrigger {...props} data-testid="outer-trigger">
          Outer
        </CommandMenu.SubpageTrigger>
      ),
      renderContent: ({ pageId, nodes, asyncContent }) => (
        <CommandMenu.Subpage pageId={pageId}>
          <CommandMenu.Surface content={nodes} asyncContent={asyncContent}>
            <CommandMenu.Input aria-label="Search outer" />
            <CommandMenu.List>
              <Rows />
            </CommandMenu.List>
          </CommandMenu.Surface>
        </CommandMenu.Subpage>
      ),
    }
    render(<Menu nodes={[outer]} />)

    await user.click(await screen.findByTestId('outer-trigger'))
    if (!screen.queryByLabelText('Search outer')) {
      await user.click(screen.getByTestId('outer-trigger'))
    }
    await waitFor(() => expect(loader.mounted()).toBe(true))
    await loader.resolve([nested])
    await user.click(await screen.findByTestId('nested-trigger'))

    await waitFor(() => {
      expect(screen.getByTestId('nested-page')).toBeInTheDocument()
    })
  })

  it("refreshes an async branch row's state when its loader's result is grafted", async () => {
    const loader = createLoader()
    const alpha: SubpageDef = {
      kind: 'subpage',
      id: 'alpha',
      value: 'Alpha',
      nodes: [],
      asyncNodes: {
        type: 'static',
        Loader: loader.Loader,
        loadStrategy: 'eager',
      },
      renderTrigger: ({ props, context }) => (
        <CommandMenu.SubpageTrigger
          {...props}
          data-testid="alpha-row"
          data-status={context.async?.status ?? 'none'}
        >
          Alpha
        </CommandMenu.SubpageTrigger>
      ),
      renderContent: () => null,
    }
    render(<Menu nodes={[alpha]} />)
    await waitFor(() => {
      expect(screen.getByTestId('alpha-row')).toHaveAttribute(
        'data-status',
        'pending',
      )
    })

    // No search change: the graft alone re-renders the row.
    await loader.resolve([settings])

    expect(screen.getByTestId('alpha-row')).toHaveAttribute(
      'data-status',
      'success',
    )
  })

  it('shows a new root subpage in the list and the outlet in one commit', async () => {
    mounts.length = 0
    const first: SubpageDef = {
      kind: 'subpage',
      id: 'first',
      value: 'First',
      nodes: [],
      renderTrigger: ({ props }) => (
        <CommandMenu.SubpageTrigger {...props}>
          First
        </CommandMenu.SubpageTrigger>
      ),
      renderContent: () => null,
    }
    const view = render(<Menu nodes={[first]} />)
    await screen.findByText('First')

    view.rerender(<Menu nodes={[first, settings]} />)

    expect(await screen.findByTestId('settings-row')).toBeInTheDocument()
    expect(document.querySelector('[data-probe="outlet"]')).not.toBeNull()
    expect(mounts).toHaveLength(2)
    expect(mounts.every((mount) => mount.sawOther)).toBe(true)
  })

  it('drops subpages a subpage surface withdraws while it renders', async () => {
    const user = userEvent.setup()
    const loader = createLoader()
    const later: SubpageDef = {
      kind: 'subpage',
      id: 'later',
      value: 'Later',
      nodes: [],
      renderTrigger: ({ props }) => (
        <CommandMenu.SubpageTrigger {...props}>
          Later
        </CommandMenu.SubpageTrigger>
      ),
      renderContent: () => <span data-testid="later-content" />,
    }
    // The root list loads its rows eagerly; its own surface loads nothing.
    const host: SubpageDef = {
      kind: 'subpage',
      id: 'host',
      value: 'Host',
      nodes: [],
      asyncNodes: {
        type: 'static',
        Loader: loader.Loader,
        loadStrategy: 'eager',
      },
      renderTrigger: ({ props }) => (
        <CommandMenu.SubpageTrigger {...props} data-testid="host-trigger">
          Host
        </CommandMenu.SubpageTrigger>
      ),
      renderContent: ({ pageId, nodes }) => (
        <CommandMenu.Subpage pageId={pageId}>
          <CommandMenu.Surface content={nodes}>
            <CommandMenu.Input aria-label="Search host" />
            <CommandMenu.List>
              <Rows />
            </CommandMenu.List>
          </CommandMenu.Surface>
        </CommandMenu.Subpage>
      ),
    }
    render(<Menu nodes={[host]} />)
    await waitFor(() => expect(loader.mounted()).toBe(true))
    await loader.resolve([later])
    expect(await screen.findByTestId('later-content')).toBeInTheDocument()

    await user.click(screen.getByTestId('host-trigger'))
    if (!screen.queryByLabelText('Search host')) {
      await user.click(screen.getByTestId('host-trigger'))
    }
    await screen.findByLabelText('Search host')

    await waitFor(() => {
      expect(screen.queryByTestId('later-content')).not.toBeInTheDocument()
    })
  })
})

describe('DataPopupContext', () => {
  const page = (id: string): SubpageDef => ({
    kind: 'subpage',
    id,
    value: id,
    nodes: [],
    renderTrigger: ({ props }) => (
      <CommandMenu.SubpageTrigger {...props} data-testid={`trigger-${id}`}>
        {id}
      </CommandMenu.SubpageTrigger>
    ),
    renderContent: ({ pageId }) => (
      <>
        <span data-testid={`content-${id}`} />
        <CommandMenu.Subpage pageId={pageId}>
          <span data-testid={`page-${id}`} />
        </CommandMenu.Subpage>
      </>
    ),
  })

  it("keeps the root list's slot after the list unmounts", async () => {
    const user = userEvent.setup()
    let popup: DataPopupContextValue | null = null
    render(
      <Menu
        nodes={[page('a'), page('b')]}
        onDataPopup={(value) => {
          popup = value
        }}
      />,
    )
    await user.click(await screen.findByTestId('trigger-a'))
    if (!screen.queryByTestId('page-a')) {
      await user.click(screen.getByTestId('trigger-a'))
    }
    await screen.findByTestId('page-a')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    const kept = (popup as DataPopupContextValue | null)?.resolvedNodes
    expect(kept?.nodes.map((node) => node.def.id)).toEqual(['a', 'b'])
  })

  it('renders the subpages of the slot a consumer sets', async () => {
    let popup: DataPopupContextValue | null = null
    render(
      <Menu
        nodes={[page('a'), page('b')]}
        onDataPopup={(value) => {
          popup = value
        }}
      />,
    )
    await screen.findByTestId('content-a')
    expect(screen.getByTestId('content-b')).toBeInTheDocument()

    act(() => {
      popup!.setResolvedNodes((current) =>
        current
          ? { ...current, nodes: current.nodes.filter((n) => n.def.id === 'b') }
          : current,
      )
    })
    expect(screen.queryByTestId('content-a')).not.toBeInTheDocument()
    expect(screen.getByTestId('content-b')).toBeInTheDocument()

    act(() => {
      popup!.setResolvedNodes(null)
    })
    expect(screen.queryByTestId('content-b')).not.toBeInTheDocument()
  })

  it('applies two functional slot updates in one batch', async () => {
    let popup: DataPopupContextValue | null = null
    render(
      <Menu
        nodes={[page('a'), page('b')]}
        onDataPopup={(value) => {
          popup = value
        }}
      />,
    )
    await screen.findByTestId('content-a')

    act(() => {
      const without = (id: string) => (current: ResolvedNodesSlot | null) =>
        current
          ? { ...current, nodes: current.nodes.filter((n) => n.def.id !== id) }
          : current
      popup!.setResolvedNodes(without('a'))
      popup!.setResolvedNodes(without('b'))
    })
    expect(screen.queryByTestId('content-a')).not.toBeInTheDocument()
    expect(screen.queryByTestId('content-b')).not.toBeInTheDocument()
  })

  it("replaces a consumer's slot when a graft lands, so a grafted subpage opens", async () => {
    const user = userEvent.setup()
    const loader = createLoader()
    let popup: DataPopupContextValue | null = null
    const grafted: SubpageDef = {
      ...page('grafted'),
      value: 'Settings',
    }
    render(
      <Menu
        nodes={[projects(loader.Loader)]}
        onDataPopup={(value) => {
          popup = value
        }}
      />,
    )
    await user.type(screen.getByTestId('input'), 'set')
    await waitFor(() => expect(loader.mounted()).toBe(true))
    act(() => {
      popup!.setResolvedNodes((current) => current && { ...current })
    })

    await loader.resolve([grafted])
    await user.click(await screen.findByTestId('trigger-grafted'))
    if (!screen.queryByTestId('page-grafted')) {
      await user.click(screen.getByTestId('trigger-grafted'))
    }

    expect(await screen.findByTestId('page-grafted')).toBeInTheDocument()
  })

  it("gives a consumer's own provider the root surface and its nodes", async () => {
    let value: DataPopupContextValue | null = null
    function ConsumerProvider({ children }: { children: React.ReactNode }) {
      const [dataSurfaceContext, setDataSurfaceContext] =
        React.useState<DataPopupContextValue['dataSurfaceContext']>(null)
      const [resolvedNodes, setResolvedNodes] =
        React.useState<DataPopupContextValue['resolvedNodes']>(null)
      value = {
        dataSurfaceContext,
        setDataSurfaceContext,
        resolvedNodes,
        setResolvedNodes,
      }
      return (
        <DataPopupContext.Provider value={value}>
          {children}
        </DataPopupContext.Provider>
      )
    }
    const a = page('a')
    render(
      <CommandMenu.Root defaultOpen>
        <CommandMenu.Portal>
          <CommandMenu.Popup>
            <ConsumerProvider>
              <CommandMenu.Surface content={[a]}>
                <CommandMenu.List>
                  <Rows />
                </CommandMenu.List>
              </CommandMenu.Surface>
            </ConsumerProvider>
          </CommandMenu.Popup>
        </CommandMenu.Portal>
      </CommandMenu.Root>,
    )

    await waitFor(() => {
      expect(value?.resolvedNodes?.nodes[0]?.def).toBe(a)
    })
    const current = value as DataPopupContextValue | null
    expect(current?.dataSurfaceContext?.content).toEqual([a])
    expect(current?.resolvedNodes?.content).toEqual([a])
  })

  it("republishes into a consumer's own provider after a branch graft", async () => {
    const user = userEvent.setup()
    const loader = createLoader()
    let value: DataPopupContextValue | null = null
    function ConsumerProvider({ children }: { children: React.ReactNode }) {
      const [dataSurfaceContext, setDataSurfaceContext] =
        React.useState<DataPopupContextValue['dataSurfaceContext']>(null)
      const [resolvedNodes, setResolvedNodes] =
        React.useState<DataPopupContextValue['resolvedNodes']>(null)
      value = {
        dataSurfaceContext,
        setDataSurfaceContext,
        resolvedNodes,
        setResolvedNodes,
      }
      return (
        <DataPopupContext.Provider value={value}>
          {children}
        </DataPopupContext.Provider>
      )
    }
    render(
      <CommandMenu.Root defaultOpen>
        <CommandMenu.Portal>
          <CommandMenu.Popup>
            <ConsumerProvider>
              <CommandMenu.Surface
                content={[projects(loader.Loader)]}
                deepSearch={{ enabled: true, minLength: 1 }}
              >
                <CommandMenu.Input aria-label="Search" data-testid="input" />
                <CommandMenu.List>
                  <Rows />
                </CommandMenu.List>
              </CommandMenu.Surface>
            </ConsumerProvider>
          </CommandMenu.Popup>
        </CommandMenu.Portal>
      </CommandMenu.Root>,
    )
    await user.type(screen.getByTestId('input'), 'set')
    await waitFor(() => expect(loader.mounted()).toBe(true))
    const before = (value as DataPopupContextValue | null)?.resolvedNodes
    expect(before).not.toBeNull()

    await loader.resolve([settings])
    await screen.findByTestId('settings-row')

    const after = (value as DataPopupContextValue | null)?.resolvedNodes
    expect(after!.graftVersion).toBeGreaterThan(before!.graftVersion)
  })
})

describe('the popup record', () => {
  it('is forgotten when the popup unmounts', async () => {
    const user = userEvent.setup()
    let tree: MenuTreeStore | null = null
    function TreeProbe() {
      tree = useMenuTree()
      return null
    }
    render(
      <CommandMenu.Root defaultOpen>
        <CommandMenu.Portal>
          <CommandMenu.Popup data-testid="popup">
            <CommandMenu.Surface content={[settings]}>
              <CommandMenu.Input aria-label="Search" data-testid="input" />
              <CommandMenu.List>
                <Rows />
              </CommandMenu.List>
            </CommandMenu.Surface>
            <TreeProbe />
          </CommandMenu.Popup>
        </CommandMenu.Portal>
      </CommandMenu.Root>,
    )
    await waitFor(() => {
      expect(Object.keys(tree!.state.popups)).toHaveLength(1)
    })

    await user.click(screen.getByTestId('input'))
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument()
    })
    expect(tree!.state.popups).toEqual({})
  })
})
