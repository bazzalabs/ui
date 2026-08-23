import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import {
  PopupMenuList,
  PopupMenuPopup,
  PopupMenuPortal,
  PopupMenuPositioner,
  PopupMenuSubmenuRoot,
  PopupMenuSubmenuTrigger,
  PopupMenuSurface,
} from '../internal/popup-menu/index.js'
import {
  type AsyncLoaderResult,
  CommandMenu,
  type DeepSearchConfig,
  type LoaderComponentProps,
  type NodeDef,
  type SubmenuDef,
  type SubpageDef,
  useDataList,
} from './index.js'

function makeLoaderResult(
  overrides: Partial<AsyncLoaderResult<NodeDef[]>> = {},
): AsyncLoaderResult<NodeDef[]> {
  const status = overrides.status ?? (overrides.data ? 'success' : 'pending')
  const data = status === 'success' ? (overrides.data ?? []) : undefined

  const result: AsyncLoaderResult<NodeDef[]> =
    status === 'success'
      ? {
          data,
          source: 'vanilla',
          error: null,
          status: 'success',
          fetchStatus: 'idle',
          loadingPhase: 'none',
          isLoading: false,
          isFetching: false,
          isInitialLoading: false,
          isRefetching: false,
          isPending: false,
          isSuccess: true,
          isError: false,
          isPaused: false,
          hasData: true,
          hasFetched: true,
        }
      : {
          data: undefined,
          source: 'vanilla',
          error: null,
          status: 'pending',
          fetchStatus: 'fetching',
          loadingPhase: 'initial',
          isLoading: true,
          isFetching: true,
          isInitialLoading: true,
          isRefetching: false,
          isPending: true,
          isSuccess: false,
          isError: false,
          isPaused: false,
          hasData: false,
          hasFetched: false,
        }

  return {
    ...result,
    ...overrides,
    data,
  }
}

interface ControllableLoader {
  Loader: React.ComponentType<LoaderComponentProps>
  queries: string[]
  enabledValues: Array<boolean | undefined>
  latestQuery: () => string | undefined
  resolve: (nodes: NodeDef[]) => void
}

const renderedSubpageContent = new Set<string>()

function SubpageContentReady({ id }: { id: string }) {
  React.useEffect(() => {
    renderedSubpageContent.add(id)

    return () => {
      renderedSubpageContent.delete(id)
    }
  }, [id])

  return null
}

function createControllableLoader(options?: {
  resetOnQueryChange?: boolean
}): ControllableLoader {
  const queries: string[] = []
  const enabledValues: Array<boolean | undefined> = []
  let setLoaderResult: React.Dispatch<
    React.SetStateAction<AsyncLoaderResult<NodeDef[]>>
  > | null = null

  const Loader: React.ComponentType<LoaderComponentProps> = function Loader({
    query,
    enabled,
    children,
  }) {
    const [result, setResult] = React.useState(() => makeLoaderResult())
    const previousQueryRef = React.useRef<string | null>(null)

    React.useEffect(() => {
      setLoaderResult = setResult

      return () => {
        if (setLoaderResult === setResult) {
          setLoaderResult = null
        }
      }
    }, [])

    React.useEffect(() => {
      if (previousQueryRef.current === query) {
        return
      }

      previousQueryRef.current = query
      queries.push(query)
      enabledValues.push(enabled)

      if (options?.resetOnQueryChange) {
        setResult(makeLoaderResult())
      }
    }, [query, enabled, options?.resetOnQueryChange])

    return <>{children(result)}</>
  }

  return {
    Loader,
    queries,
    enabledValues,
    latestQuery: () => queries[queries.length - 1],
    resolve: (nodes) => {
      if (!setLoaderResult) {
        throw new Error('Loader is not mounted')
      }

      setLoaderResult(makeLoaderResult({ data: nodes, status: 'success' }))
    },
  }
}

function createItemDef(testId: string, value: string): NodeDef {
  return {
    kind: 'item',
    value,
    render: ({ props, context }) => (
      <CommandMenu.Item
        {...props}
        data-deep-search-result={context.isDeepSearchResult ? '' : undefined}
        data-testid={`item-${testId}`}
      >
        {value}
      </CommandMenu.Item>
    ),
  }
}

function createSubpageDef({
  id,
  value,
  nodes,
  asyncNodes,
}: {
  id: string
  value: string
  nodes?: NodeDef[]
  asyncNodes?: NonNullable<SubpageDef['asyncNodes']>
}): SubpageDef {
  return {
    kind: 'subpage',
    id,
    value,
    ...(nodes ? { nodes } : {}),
    ...(asyncNodes ? { asyncNodes } : {}),
    renderTrigger: ({ props }) => (
      <CommandMenu.SubpageTrigger
        {...props}
        data-target-page-id={props.targetPageId}
        data-testid={`subpage-trigger-${id}`}
      >
        {value}
      </CommandMenu.SubpageTrigger>
    ),
    renderContent: ({ pageId, nodes: childNodes, asyncContent }) => (
      <>
        <CommandMenu.Subpage pageId={pageId}>
          <CommandMenu.Surface
            asyncContent={asyncContent}
            content={childNodes}
            data-page-id={pageId}
            data-testid={`surface-${id}`}
          >
            <CommandMenu.Input
              aria-label={`Search ${value}`}
              data-testid={`input-${id}`}
            />
            <CommandMenu.List data-testid={`list-${id}`}>
              <CommandMenu.SubpageBackItem
                data-testid={`subpage-back-${id}`}
                value={`${id}-back`}
              >
                Back
              </CommandMenu.SubpageBackItem>
              <DataRows />
            </CommandMenu.List>
            <CommandMenu.Loading data-testid={`loading-${id}`}>
              Loading {value}
            </CommandMenu.Loading>
            <CommandMenu.Empty data-testid={`empty-${id}`}>
              No {value}
            </CommandMenu.Empty>
          </CommandMenu.Surface>
        </CommandMenu.Subpage>
        <SubpageContentReady id={id} />
      </>
    ),
  }
}

function DataRows({
  onNode,
}: {
  onNode?: (
    node: ReturnType<typeof useDataList>['nodes'][number]['node'],
  ) => void
}) {
  const { nodes, renderNode } = useDataList()

  if (onNode && nodes[0]) onNode(nodes[0].node)

  return <>{nodes.map(renderNode)}</>
}

function DataCommandMenu({
  deepSearch,
  nodes,
}: {
  deepSearch?: DeepSearchConfig | boolean
  nodes: NodeDef[]
}) {
  return (
    <CommandMenu.Root defaultOpen>
      <CommandMenu.Trigger data-testid="trigger">
        Open commands
      </CommandMenu.Trigger>
      <CommandMenu.Portal>
        <CommandMenu.Popup data-testid="dialog">
          <CommandMenu.Surface
            content={nodes}
            data-testid="surface-root"
            deepSearch={deepSearch}
          >
            <CommandMenu.Input
              aria-label="Search commands"
              data-testid="input-root"
            />
            <CommandMenu.List data-testid="list-root">
              <DataRows />
            </CommandMenu.List>
            <CommandMenu.Loading data-testid="loading-root">
              Loading commands
            </CommandMenu.Loading>
            <CommandMenu.Empty data-testid="empty-root">
              No commands found
            </CommandMenu.Empty>
          </CommandMenu.Surface>
        </CommandMenu.Popup>
      </CommandMenu.Portal>
    </CommandMenu.Root>
  )
}

async function waitForRootInputFocus() {
  await waitFor(() => {
    expect(screen.getByTestId('input-root')).toHaveFocus()
  })
}

async function waitForSubpageInputFocus(id: string) {
  await waitFor(() => {
    expect(screen.getByTestId(`input-${id}`)).toHaveFocus()
  })
}

async function waitForSubpageContentReady(id: string) {
  await waitFor(() => {
    expect(renderedSubpageContent.has(id)).toBe(true)
  })
}

async function resolveLoader(loader: ControllableLoader, nodes: NodeDef[]) {
  await act(async () => {
    loader.resolve(nodes)
  })
}

describe('CommandMenu async data-first API', () => {
  it('grafts async subpage branches before submenu callbacks receive static children', async () => {
    const user = userEvent.setup()
    const loader = createControllableLoader()
    const child = createItemDef('static-child', 'Static child')
    let callbackId: string | undefined
    let callbackDef: NodeDef | undefined
    let nestedNode:
      | ReturnType<typeof useDataList>['nodes'][number]['node']
      | undefined
    const captureNestedNode = (
      node: ReturnType<typeof useDataList>['nodes'][number]['node'],
    ) => {
      nestedNode = node
    }
    const asyncSubmenu: SubmenuDef = {
      kind: 'submenu',
      id: 'async-submenu',
      value: 'Async submenu',
      nodes: [child],
      render: ({ props, nodes: childNodes, renderNode }) => {
        callbackId = childNodes[0]?.id
        callbackDef = childNodes[0]?.def
        return (
          <PopupMenuSubmenuRoot>
            <PopupMenuSubmenuTrigger {...props} data-testid="async-submenu">
              {props.id}
            </PopupMenuSubmenuTrigger>
            <PopupMenuPortal>
              <PopupMenuPositioner>
                <PopupMenuPopup>
                  <PopupMenuSurface content={childNodes}>
                    <PopupMenuList data-testid="async-submenu-list">
                      <DataRows onNode={captureNestedNode} />
                      {childNodes.map(renderNode)}
                    </PopupMenuList>
                  </PopupMenuSurface>
                </PopupMenuPopup>
              </PopupMenuPositioner>
            </PopupMenuPortal>
          </PopupMenuSubmenuRoot>
        )
      },
    }
    const nodes: NodeDef[] = [
      createSubpageDef({
        id: 'async-projects',
        value: 'Async projects',
        asyncNodes: {
          type: 'static',
          Loader: loader.Loader,
          loadStrategy: 'lazy',
        },
      }),
    ]

    render(
      <DataCommandMenu
        deepSearch={{ enabled: true, minLength: 999 }}
        nodes={nodes}
      />,
    )
    await waitForRootInputFocus()
    await waitForSubpageContentReady('async-projects')
    await user.click(screen.getByTestId('subpage-trigger-async-projects'))
    if (!screen.queryByTestId('input-async-projects')) {
      await user.click(screen.getByTestId('subpage-trigger-async-projects'))
    }
    await waitFor(() => {
      expect(screen.getByTestId('input-async-projects')).toBeInTheDocument()
    })
    await resolveLoader(loader, [asyncSubmenu])

    await waitFor(() => {
      expect(callbackId).toBe('async-projects/async-submenu/static-child')
    })
    await user.hover(screen.getByTestId('async-submenu'))
    await waitFor(() => expect(nestedNode?.def).toBe(child))
    expect(callbackDef).toBe(child)
    expect(nestedNode?.def).toBe(child)
    expect(nestedNode?.parent?.def).toBe(asyncSubmenu)
    expect(nestedNode?.definitionPath).toEqual([
      'async-projects',
      'async-submenu',
      'static-child',
    ])
    expect(nestedNode?.id).toBe('async-projects/async-submenu/static-child')
    expect(screen.getAllByTestId('item-static-child')).toHaveLength(2)
  })

  it('grafts an async-only nested subpage while its outer page is active', async () => {
    const user = userEvent.setup()
    const loader = createControllableLoader()
    const nested = createSubpageDef({
      id: 'nested',
      value: 'Nested',
      nodes: [createItemDef('nested-content', 'Nested content')],
    })

    render(
      <DataCommandMenu
        deepSearch={{ enabled: true, minLength: 999 }}
        nodes={[
          createSubpageDef({
            id: 'outer',
            value: 'Outer',
            asyncNodes: {
              type: 'static',
              Loader: loader.Loader,
              loadStrategy: 'lazy',
            },
          }),
        ]}
      />,
    )

    await waitForRootInputFocus()
    await waitForSubpageContentReady('outer')
    await user.click(screen.getByTestId('subpage-trigger-outer'))
    await waitForSubpageInputFocus('outer')
    await resolveLoader(loader, [nested])

    await waitFor(() => {
      expect(screen.getByTestId('subpage-trigger-nested')).toBeInTheDocument()
    })
    expect(screen.getByTestId('subpage-trigger-nested')).toHaveAttribute(
      'data-target-page-id',
      'subpage.outer.nested',
    )
    await waitForSubpageContentReady('nested')
    await user.click(screen.getByTestId('subpage-trigger-nested'))

    await waitForSubpageContentReady('nested')
    expect(screen.getByTestId('item-nested-content')).toBeInTheDocument()
  })

  it('grafts consecutive async subpage changes without remounting the active list', async () => {
    const user = userEvent.setup()
    const loader = createControllableLoader()
    const first = createSubpageDef({
      id: 'first-nested',
      value: 'First nested',
      nodes: [createItemDef('first-nested-content', 'First nested content')],
    })
    const second = createSubpageDef({
      id: 'second-nested',
      value: 'Second nested',
      nodes: [createItemDef('second-nested-content', 'Second nested content')],
    })

    render(
      <DataCommandMenu
        deepSearch={{ enabled: true, minLength: 999 }}
        nodes={[
          createSubpageDef({
            id: 'changing-outer',
            value: 'Changing outer',
            asyncNodes: {
              type: 'static',
              Loader: loader.Loader,
              loadStrategy: 'lazy',
            },
          }),
        ]}
      />,
    )

    await waitForRootInputFocus()
    await waitForSubpageContentReady('changing-outer')
    await user.click(screen.getByTestId('subpage-trigger-changing-outer'))
    await waitForSubpageInputFocus('changing-outer')
    const list = screen.getByTestId('list-changing-outer')

    await resolveLoader(loader, [first])
    await waitFor(() => {
      expect(
        screen.getByTestId('subpage-trigger-first-nested'),
      ).toBeInTheDocument()
    })

    await resolveLoader(loader, [second])
    await waitFor(() => {
      expect(
        screen.getByTestId('subpage-trigger-second-nested'),
      ).toBeInTheDocument()
    })
    expect(screen.getByTestId('subpage-trigger-second-nested')).toHaveAttribute(
      'data-target-page-id',
      'subpage.changing-outer.second-nested',
    )
    await waitForSubpageContentReady('second-nested')
    expect(screen.getByTestId('list-changing-outer')).toBe(list)

    await user.click(screen.getByTestId('subpage-trigger-second-nested'))
    await waitForSubpageContentReady('second-nested')
    expect(screen.getByTestId('item-second-nested-content')).toBeInTheDocument()
  })

  it('publishes subpages nested inside an async submenu popup', async () => {
    const user = userEvent.setup()
    const loader = createControllableLoader()
    const nested = createSubpageDef({
      id: 'popup-nested',
      value: 'Popup nested',
      nodes: [createItemDef('popup-nested-content', 'Popup nested content')],
    })
    let callbackResult: React.ReactNode
    const submenu: SubmenuDef = {
      kind: 'submenu',
      id: 'loaded-submenu',
      value: 'Loaded submenu',
      nodes: [nested],
      render: ({ props, nodes: childNodes, renderNode }) => {
        callbackResult = renderNode(childNodes[0])

        return (
          <PopupMenuSubmenuRoot>
            <PopupMenuSubmenuTrigger {...props} data-testid="loaded-submenu">
              Loaded submenu
            </PopupMenuSubmenuTrigger>
            <PopupMenuPortal>
              <PopupMenuPositioner>
                <PopupMenuPopup>
                  <PopupMenuSurface content={childNodes}>
                    <PopupMenuList data-testid="loaded-submenu-list">
                      <DataRows />
                    </PopupMenuList>
                  </PopupMenuSurface>
                </PopupMenuPopup>
              </PopupMenuPositioner>
            </PopupMenuPortal>
          </PopupMenuSubmenuRoot>
        )
      },
    }

    render(
      <DataCommandMenu
        deepSearch={{ enabled: true, minLength: 999 }}
        nodes={[
          createSubpageDef({
            id: 'submenu-outer',
            value: 'Submenu outer',
            asyncNodes: {
              type: 'static',
              Loader: loader.Loader,
              loadStrategy: 'lazy',
            },
          }),
        ]}
      />,
    )

    await waitForRootInputFocus()
    await waitForSubpageContentReady('submenu-outer')
    await user.click(screen.getByTestId('subpage-trigger-submenu-outer'))
    await waitForSubpageInputFocus('submenu-outer')
    await resolveLoader(loader, [submenu])
    await user.hover(screen.getByTestId('loaded-submenu'))

    await waitFor(() => {
      expect(
        screen.getByTestId('subpage-trigger-popup-nested'),
      ).toBeInTheDocument()
    })
    expect(callbackResult).toBeTruthy()
    await waitForSubpageContentReady('popup-nested')
    expect(screen.getByTestId('subpage-trigger-popup-nested')).toHaveAttribute(
      'data-target-page-id',
      'subpage.popup-nested',
    )
    await user.click(screen.getByTestId('subpage-trigger-popup-nested'))
    await waitForSubpageContentReady('popup-nested')
    expect(screen.getByTestId('item-popup-nested-content')).toBeInTheDocument()
  })

  it('merges static and async subpage children without invalidating static content', async () => {
    const user = userEvent.setup()
    const loader = createControllableLoader()

    render(
      <DataCommandMenu
        deepSearch={{ enabled: true, minLength: 999 }}
        nodes={[
          createSubpageDef({
            id: 'merged',
            value: 'Merged',
            nodes: [createItemDef('static-merged', 'Static merged')],
            asyncNodes: {
              type: 'static',
              Loader: loader.Loader,
              loadStrategy: 'lazy',
            },
          }),
        ]}
      />,
    )

    await waitForRootInputFocus()
    await waitForSubpageContentReady('merged')
    await user.click(screen.getByTestId('subpage-trigger-merged'))
    await waitForSubpageInputFocus('merged')
    await resolveLoader(loader, [createItemDef('async-merged', 'Async merged')])

    await waitFor(() => {
      expect(screen.getByTestId('item-static-merged')).toBeInTheDocument()
      expect(screen.getByTestId('item-async-merged')).toBeInTheDocument()
    })
  })

  it('lazy-loads static async subpage content and suppresses Empty while loading', async () => {
    const user = userEvent.setup()
    const loader = createControllableLoader()
    const nodes: NodeDef[] = [
      createSubpageDef({
        id: 'projects',
        value: 'Projects',
        asyncNodes: {
          type: 'static',
          Loader: loader.Loader,
          loadStrategy: 'lazy',
        },
      }),
    ]

    render(
      <DataCommandMenu
        deepSearch={{ enabled: true, minLength: 999 }}
        nodes={nodes}
      />,
    )

    await waitForRootInputFocus()
    await waitForSubpageContentReady('projects')
    await user.click(screen.getByTestId('subpage-trigger-projects'))
    if (!screen.queryByTestId('input-projects')) {
      await user.click(screen.getByTestId('subpage-trigger-projects'))
    }

    await waitForSubpageInputFocus('projects')
    expect(screen.getByTestId('loading-projects')).toBeInTheDocument()

    await user.type(screen.getByTestId('input-projects'), 'zebra')

    expect(screen.getByTestId('loading-projects')).toBeInTheDocument()
    expect(screen.queryByTestId('empty-projects')).not.toBeInTheDocument()

    await resolveLoader(loader, [
      createItemDef('zebra-project', 'Zebra project'),
    ])

    await waitFor(() => {
      expect(screen.queryByTestId('loading-projects')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-zebra-project')).toBeInTheDocument()
    })
  })

  it('streams eager static async subpage rows into root deep search', async () => {
    const user = userEvent.setup()
    const loader = createControllableLoader()
    const nodes: NodeDef[] = [
      createSubpageDef({
        id: 'reports',
        value: 'Reports',
        asyncNodes: {
          type: 'static',
          Loader: loader.Loader,
          loadStrategy: 'eager',
        },
      }),
    ]

    render(
      <DataCommandMenu
        deepSearch={{ enabled: true, minLength: 1 }}
        nodes={nodes}
      />,
    )

    await waitForRootInputFocus()
    await user.type(screen.getByTestId('input-root'), 'orbit')

    await waitFor(() => {
      expect(screen.getByTestId('loading-root')).toBeInTheDocument()
    })

    await resolveLoader(loader, [createItemDef('orbit-report', 'Orbit report')])

    await waitFor(() => {
      expect(screen.queryByTestId('loading-root')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-orbit-report')).toBeInTheDocument()
    })

    expect(screen.getByTestId('item-orbit-report')).toHaveAttribute(
      'data-deep-search-result',
      '',
    )
  })

  it('passes root search text into query async subpage loaders and replaces results', async () => {
    const user = userEvent.setup()
    const loader = createControllableLoader({ resetOnQueryChange: true })
    const nodes: NodeDef[] = [
      createSubpageDef({
        id: 'people',
        value: 'People',
        asyncNodes: {
          type: 'query',
          Loader: loader.Loader,
          minQueryLength: 1,
          initialQueryBehavior: false,
        },
      }),
    ]

    render(
      <DataCommandMenu
        deepSearch={{ enabled: true, minLength: 1 }}
        nodes={nodes}
      />,
    )

    await waitForRootInputFocus()
    const input = screen.getByTestId('input-root')

    await user.type(input, 'alpha')

    await waitFor(() => {
      expect(loader.latestQuery()).toBe('alpha')
    })

    expect(loader.enabledValues[loader.enabledValues.length - 1]).toBe(true)

    await resolveLoader(loader, [createItemDef('alpha-person', 'Alpha person')])

    await waitFor(() => {
      expect(screen.getByTestId('item-alpha-person')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('empty-root')).not.toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'beta')

    await waitFor(() => {
      expect(loader.latestQuery()).toBe('beta')
    })

    await resolveLoader(loader, [createItemDef('beta-person', 'Beta person')])

    await waitFor(() => {
      expect(screen.getByTestId('item-beta-person')).toBeInTheDocument()
      expect(screen.queryByTestId('item-alpha-person')).not.toBeInTheDocument()
    })
  })

  it('blocks async deep-search rows until every async subpage loader resolves', async () => {
    const user = userEvent.setup()
    const firstLoader = createControllableLoader()
    const secondLoader = createControllableLoader()
    const nodes: NodeDef[] = [
      createSubpageDef({
        id: 'first',
        value: 'First page',
        asyncNodes: {
          type: 'static',
          Loader: firstLoader.Loader,
          loadStrategy: 'eager',
        },
      }),
      createSubpageDef({
        id: 'second',
        value: 'Second page',
        asyncNodes: {
          type: 'static',
          Loader: secondLoader.Loader,
          loadStrategy: 'eager',
        },
      }),
    ]

    render(
      <DataCommandMenu
        deepSearch={{
          enabled: true,
          minLength: 1,
          asyncResultBehavior: 'block',
        }}
        nodes={nodes}
      />,
    )

    await waitForRootInputFocus()
    await user.type(screen.getByTestId('input-root'), 'result')

    await waitFor(() => {
      expect(screen.getByTestId('loading-root')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('item-alpha-result')).not.toBeInTheDocument()
    expect(screen.queryByTestId('item-beta-result')).not.toBeInTheDocument()

    await resolveLoader(firstLoader, [
      createItemDef('alpha-result', 'Alpha result'),
    ])

    await waitFor(() => {
      expect(screen.getByTestId('loading-root')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('item-alpha-result')).not.toBeInTheDocument()
    expect(screen.queryByTestId('item-beta-result')).not.toBeInTheDocument()

    await resolveLoader(secondLoader, [
      createItemDef('beta-result', 'Beta result'),
    ])

    await waitFor(() => {
      expect(screen.queryByTestId('loading-root')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-alpha-result')).toBeInTheDocument()
      expect(screen.getByTestId('item-beta-result')).toBeInTheDocument()
    })
  })
})
