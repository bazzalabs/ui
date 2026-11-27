import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  CommandMenu,
  useDataList as useCommandMenuDataList,
} from '../../../../command-menu/index.js'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import { DataPopupContext } from '../context.js'
import type {
  AsyncLoaderResult,
  LoaderComponentProps,
  NodeDef,
  SubmenuDef,
  SubpageDef,
} from '../types.js'

// A new `content` array keeps an open data-first subpage open while the
// page's id is still in it; a page whose id is gone leaves the stack, and the
// menu shows the deepest page still there.

const members = [
  {
    name: 'DropdownMenu',
    Parts: DropdownMenu,
    useDataList: DropdownMenu.useDataList,
    Shell: ({ children }: { children: React.ReactNode }) => (
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>{children}</DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    ),
  },
  {
    name: 'CommandMenu',
    Parts: CommandMenu,
    useDataList: useCommandMenuDataList,
    Shell: ({ children }: { children: React.ReactNode }) => (
      <CommandMenu.Root defaultOpen>
        <CommandMenu.Portal>
          <CommandMenu.Popup>{children}</CommandMenu.Popup>
        </CommandMenu.Portal>
      </CommandMenu.Root>
    ),
  },
] as const

describe.each(members)('$name: new content with a subpage open', ({
  Parts,
  Shell,
  useDataList,
}) => {
  function Rows() {
    const { nodes, renderNode } = useDataList()
    return <>{nodes.map(renderNode)}</>
  }

  const item = (id: string, label: string): NodeDef => ({
    kind: 'item',
    id,
    value: label,
    render: ({ props }) => (
      <Parts.Item {...props} data-testid={`item-${id}`}>
        {label}
      </Parts.Item>
    ),
  })

  const page = (id: string, label: string, nodes: NodeDef[]): SubpageDef => ({
    kind: 'subpage',
    id,
    value: label,
    nodes,
    renderTrigger: ({ props }) => (
      <Parts.SubpageTrigger {...props} data-testid={`trigger-${id}`}>
        {label}
      </Parts.SubpageTrigger>
    ),
    renderContent: ({ pageId, nodes: childNodes }) => (
      <Parts.Subpage pageId={pageId}>
        <Parts.Surface content={childNodes} data-testid={`page-${id}`}>
          <Parts.Input aria-label={`Search ${label}`} />
          <Parts.List>
            <Rows />
          </Parts.List>
        </Parts.Surface>
      </Parts.Subpage>
    ),
  })

  /** New def objects on every call, with the same ids. */
  const content = ({
    filters = true,
    nested = true,
  }: {
    filters?: boolean
    nested?: boolean
  } = {}): NodeDef[] => [
    item('alpha', 'Alpha'),
    ...(filters
      ? [
          page('filters', 'Filters', [
            item('mine', 'Mine'),
            item('open', 'Open'),
            item('opened', 'Opened'),
            ...(nested
              ? [page('nested', 'Nested', [item('deep', 'Deep')])]
              : []),
          ]),
        ]
      : []),
  ]

  function Menu({ nodes }: { nodes: NodeDef[] }) {
    return (
      <Shell>
        <Parts.Surface content={nodes}>
          <Parts.List>
            <Rows />
          </Parts.List>
        </Parts.Surface>
      </Shell>
    )
  }

  async function open(user: ReturnType<typeof userEvent.setup>, id: string) {
    const trigger = await screen.findByTestId(`trigger-${id}`)
    await user.click(trigger)
    if (!screen.queryByTestId(`page-${id}`)) {
      await user.click(screen.getByTestId(`trigger-${id}`))
    }
    await screen.findByTestId(`page-${id}`)
  }

  it('keeps the open subpage, with its search and highlight, when the page is still there', async () => {
    const user = userEvent.setup()
    const view = render(<Menu nodes={content()} />)
    await open(user, 'filters')
    const highlighted = () =>
      ['mine', 'open', 'opened'].filter((id) =>
        screen.queryByTestId(`item-${id}`)?.hasAttribute('data-highlighted'),
      )
    await user.type(screen.getByLabelText('Search Filters'), 'open')
    await waitFor(() => {
      expect(screen.queryByTestId('item-mine')).not.toBeInTheDocument()
      expect(highlighted()).toHaveLength(1)
    })
    const [first] = highlighted()
    // Two rows match: move to the second.
    await user.keyboard('{ArrowDown}')
    await waitFor(() => {
      expect(highlighted()).toHaveLength(1)
      expect(highlighted()[0]).not.toBe(first)
    })
    const [second] = highlighted()

    view.rerender(<Menu nodes={content()} />)

    await waitFor(() => {
      expect(screen.getByTestId('page-filters')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('item-alpha')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Search Filters')).toHaveValue('open')
    expect(screen.queryByTestId('item-mine')).not.toBeInTheDocument()
    expect(highlighted()).toEqual([second])
  })

  it('goes back to the deepest page still there when the open page is gone', async () => {
    const user = userEvent.setup()
    const view = render(<Menu nodes={content()} />)
    await open(user, 'filters')
    await open(user, 'nested')

    view.rerender(<Menu nodes={content({ nested: false })} />)

    await waitFor(() => {
      expect(screen.queryByTestId('page-nested')).not.toBeInTheDocument()
      expect(screen.getByTestId('page-filters')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('item-alpha')).not.toBeInTheDocument()

    view.rerender(<Menu nodes={content({ filters: false })} />)

    await waitFor(() => {
      expect(screen.queryByTestId('page-filters')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-alpha')).toBeInTheDocument()
    })
  })
})

// Composable subpages are the consumer's own elements: a re-render keeps them
// mounted, and one that drops a page closes it, as before.
describe('DropdownMenu: composable subpages on re-render', () => {
  function Menu({ label, withPage }: { label: string; withPage: boolean }) {
    return (
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <DropdownMenu.Item data-testid="first" value="first">
                    First
                  </DropdownMenu.Item>
                  <DropdownMenu.SubpageTrigger
                    data-testid="trigger-page"
                    value="page-trigger"
                    targetPageId="page"
                  >
                    Page
                  </DropdownMenu.SubpageTrigger>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
              {withPage ? (
                <DropdownMenu.Subpage pageId="page">
                  <DropdownMenu.Surface data-testid="page-page">
                    <DropdownMenu.List>
                      <DropdownMenu.Item value="page-item">
                        {label}
                      </DropdownMenu.Item>
                    </DropdownMenu.List>
                  </DropdownMenu.Surface>
                </DropdownMenu.Subpage>
              ) : null}
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  it('keeps the page open across a re-render and closes it once it is gone', async () => {
    const user = userEvent.setup()
    const view = render(<Menu label="One" withPage />)
    await user.click(await screen.findByTestId('trigger-page'))
    if (!screen.queryByTestId('page-page')) {
      await user.click(screen.getByTestId('trigger-page'))
    }
    await screen.findByTestId('page-page')

    view.rerender(<Menu label="Two" withPage />)
    expect(await screen.findByText('Two')).toBeInTheDocument()
    expect(screen.queryByTestId('first')).not.toBeInTheDocument()

    view.rerender(<Menu label="Two" withPage={false} />)
    await waitFor(() => {
      expect(screen.getByTestId('first')).toBeInTheDocument()
    })
  })
})

// Rows a loader added stay in the tree when new content arrives while a page
// is open, so a page among them, or under them, stays open too.
describe('DropdownMenu: loaded pages on new content', () => {
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

  /** Every mounted instance of the loader shows the same result. */
  function createLoader() {
    let data: NodeDef[] | undefined
    const listeners = new Set<() => void>()
    function Loader({ children }: LoaderComponentProps) {
      const current = React.useSyncExternalStore(
        (listener) => {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
        () => data,
      )
      const result = React.useMemo(() => loaderResult(current), [current])
      return <>{children(result)}</>
    }
    return {
      config: { type: 'static', Loader, loadStrategy: 'eager' } as const,
      resolve: (nodes: NodeDef[]) =>
        act(async () => {
          data = nodes
          for (const listener of listeners) listener()
        }),
    }
  }

  function Rows() {
    const { nodes, renderNode } = DropdownMenu.useDataList()
    return <>{nodes.map(renderNode)}</>
  }

  const item = (id: string, label: string): NodeDef => ({
    kind: 'item',
    id,
    value: label,
    render: ({ props }) => (
      <DropdownMenu.Item {...props} data-testid={`item-${id}`}>
        {label}
      </DropdownMenu.Item>
    ),
  })

  const page = (
    id: string,
    nodes: NodeDef[] = [],
    asyncNodes?: SubpageDef['asyncNodes'],
    asyncContentMode?: 'append' | 'replace',
  ): SubpageDef => ({
    kind: 'subpage',
    id,
    value: id,
    nodes,
    asyncNodes,
    renderTrigger: ({ props }) => (
      <DropdownMenu.SubpageTrigger {...props} data-testid={`trigger-${id}`}>
        {id}
      </DropdownMenu.SubpageTrigger>
    ),
    renderContent: ({ pageId, nodes: childNodes, asyncContent }) => (
      <DropdownMenu.Subpage pageId={pageId}>
        <DropdownMenu.Surface
          content={childNodes}
          asyncContent={asyncContent}
          asyncContentMode={asyncContentMode}
          data-testid={`page-${id}`}
        >
          <DropdownMenu.List>
            <Rows />
          </DropdownMenu.List>
        </DropdownMenu.Surface>
      </DropdownMenu.Subpage>
    ),
  })

  let graftVersion: number | undefined
  function VersionProbe() {
    graftVersion =
      React.useContext(DataPopupContext)?.resolvedNodes?.graftVersion
    return null
  }

  function Menu({
    nodes,
    asyncContent,
    asyncContentMode,
    deepSearch,
  }: {
    nodes: NodeDef[]
    deepSearch?: boolean
    asyncContent?: React.ComponentProps<
      typeof DropdownMenu.Surface
    >['asyncContent']
    asyncContentMode?: 'append' | 'replace'
  }) {
    return (
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface
                content={nodes}
                asyncContent={asyncContent}
                asyncContentMode={asyncContentMode}
                deepSearch={deepSearch}
              >
                <DropdownMenu.List>
                  <Rows />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
              <VersionProbe />
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  async function open(user: ReturnType<typeof userEvent.setup>, id: string) {
    await user.click(await screen.findByTestId(`trigger-${id}`))
    if (!screen.queryByTestId(`page-${id}`)) {
      await user.click(screen.getByTestId(`trigger-${id}`))
    }
    await screen.findByTestId(`page-${id}`)
  }

  it.each([
    'append',
    'replace',
  ] as const)('keeps a page the root loader added open (%s mode)', async (mode) => {
    const user = userEvent.setup()
    const loader = createLoader()
    const nodes = () => [item('alpha', 'Alpha')]
    const view = render(
      <Menu
        nodes={nodes()}
        asyncContent={loader.config}
        asyncContentMode={mode}
      />,
    )
    await loader.resolve([page('remote', [item('remote-row', 'Remote row')])])
    await open(user, 'remote')
    const versionBefore = graftVersion ?? 0

    view.rerender(
      <Menu
        nodes={nodes()}
        asyncContent={loader.config}
        asyncContentMode={mode}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('page-remote')).toBeInTheDocument()
    })
    expect(screen.getByTestId('item-remote-row')).toBeInTheDocument()
    // Append mode shows the new local rows: the tree changed while the root
    // list was unmounted, and its version moved. Replace mode shows only the
    // loaded rows, so nothing changed.
    if (mode === 'append') expect(graftVersion).toBeGreaterThan(versionBefore)
    else expect(graftVersion).toBe(versionBefore)
  })

  it('re-applies root loader rows under StrictMode, and moves the version', async () => {
    const user = userEvent.setup()
    const loader = createLoader()
    const nodes = () => [item('alpha', 'Alpha')]
    const view = render(
      <React.StrictMode>
        <Menu
          nodes={nodes()}
          asyncContent={loader.config}
          asyncContentMode="append"
        />
      </React.StrictMode>,
    )
    await loader.resolve([page('remote', [item('remote-row', 'Remote row')])])
    await open(user, 'remote')
    const versionBefore = graftVersion ?? 0

    view.rerender(
      <React.StrictMode>
        <Menu
          nodes={nodes()}
          asyncContent={loader.config}
          asyncContentMode="append"
        />
      </React.StrictMode>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('page-remote')).toBeInTheDocument()
    })
    expect(graftVersion).toBeGreaterThan(versionBefore)
  })

  it('closes a page the root loader added once the loader is gone', async () => {
    const user = userEvent.setup()
    const loader = createLoader()
    const nodes = () => [item('alpha', 'Alpha')]
    const view = render(
      <Menu
        nodes={nodes()}
        asyncContent={loader.config}
        asyncContentMode="append"
      />,
    )
    await loader.resolve([page('remote', [item('remote-row', 'Remote row')])])
    await open(user, 'remote')

    view.rerender(<Menu nodes={nodes()} asyncContentMode="append" />)

    await waitFor(() => {
      expect(screen.queryByTestId('page-remote')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-alpha')).toBeInTheDocument()
    })
  })

  it('keeps one id when a loaded group merged into a local one', async () => {
    const user = userEvent.setup()
    const loader = createLoader()
    const group = (nodes: NodeDef[]): NodeDef => ({
      kind: 'group',
      id: 'shared',
      label: 'Shared',
      nodes,
    })
    const nodes = () => [
      page(
        'host',
        [item('local', 'Local'), group([item('local-in-group', 'In group')])],
        loader.config,
        'append',
      ),
    ]
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const view = render(<Menu nodes={nodes()} />)
      await open(user, 'host')
      // The loaded group shares the local group's id: they merge.
      await loader.resolve([group([page('deep', [item('deep-row', 'Deep')])])])
      await open(user, 'deep')

      view.rerender(<Menu nodes={nodes()} />)

      // The new local group stands; the merged copy isn't grafted next to it
      // (its loaded rows come back with the host page's loader).
      expect(screen.queryAllByTestId('page-deep').length).toBeLessThanOrEqual(1)
      expect(
        warn.mock.calls.filter(([message]) =>
          String(message).includes('Duplicate'),
        ),
      ).toEqual([])
    } finally {
      warn.mockRestore()
    }
  })

  it("keeps a page an open page's own loader added", async () => {
    const user = userEvent.setup()
    const loader = createLoader()
    const nodes = () => [
      item('alpha', 'Alpha'),
      page('host', [], loader.config),
    ]
    const view = render(<Menu nodes={nodes()} />)
    await open(user, 'host')
    await loader.resolve([page('nested', [item('deep', 'Deep')])])
    await open(user, 'nested')

    view.rerender(<Menu nodes={nodes()} />)

    await waitFor(() => {
      expect(screen.getByTestId('page-nested')).toBeInTheDocument()
    })
    expect(screen.getByTestId('item-deep')).toBeInTheDocument()
  })

  const projects = (config: SubmenuDef['asyncNodes']): SubmenuDef => ({
    kind: 'submenu',
    id: 'projects',
    value: 'Projects',
    nodes: [item('static-row', 'Static row')],
    asyncNodes: config,
    render: ({ props, nodes: childNodes, asyncContent }) => (
      <DropdownMenu.Submenu>
        <DropdownMenu.SubmenuTrigger {...props} data-testid="trigger-projects">
          Projects
        </DropdownMenu.SubmenuTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface
                content={childNodes}
                asyncContent={asyncContent}
              >
                <DropdownMenu.List>
                  <Rows />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    ),
  })
  const projectRows = () => [
    item('loaded-row', 'Loaded row'),
    page('board', [item('board-row', 'Board row')]),
  ]

  it("keeps a submenu's open page when its parent row re-renders", async () => {
    const user = userEvent.setup()
    // Eager: the root list loads the submenu's rows too, so a new result
    // re-renders the submenu's row.
    const loader = createLoader()
    render(<Menu nodes={[item('alpha', 'Alpha'), projects(loader.config)]} />)
    await user.hover(await screen.findByTestId('trigger-projects'))
    const rows = projectRows()
    await loader.resolve(rows)
    await screen.findByTestId('item-loaded-row')
    await open(user, 'board')

    // The same rows in a new array: the submenu gets a new array of the same
    // static defs.
    await loader.resolve([...rows])

    expect(screen.getByTestId('page-board')).toBeInTheDocument()
    expect(screen.getByTestId('item-board-row')).toBeInTheDocument()
  })

  it("keeps a submenu's open page and its loaded rows on fresh content", async () => {
    const user = userEvent.setup()
    // Lazy, and no deep search in the root: only the submenu's own surface
    // loads its rows.
    const loader = createLoader()
    const config = { ...loader.config, loadStrategy: 'lazy' } as const
    const nodes = () => [item('alpha', 'Alpha'), projects(config)]
    const view = render(<Menu nodes={nodes()} deepSearch={false} />)
    await user.hover(await screen.findByTestId('trigger-projects'))
    await loader.resolve(projectRows())
    await screen.findByTestId('item-loaded-row')
    await open(user, 'board')

    view.rerender(<Menu nodes={nodes()} deepSearch={false} />)

    await waitFor(() => {
      expect(screen.getByTestId('page-board')).toBeInTheDocument()
    })
    expect(screen.getByTestId('item-board-row')).toBeInTheDocument()
  })
})
