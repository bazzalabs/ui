import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import { useMaybeCollectionRows } from '../listbox/contexts/collection-row-context.js'
import * as Listbox from '../listbox/index.js'
import { useMenuTree } from './contexts/menu-tree-context.js'
import * as PopupMenu from './index.js'
import type { MenuTreeStore } from './store/MenuTreeStore.js'

// What a data-first Surface or List shares with the parts below it reaches
// those parts only: the popup's subpage outlet, a consumer's component next
// to the Surface and a Group next to the List read what they read before the
// tiers.

function DataRows() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

function loaded(nodes: DropdownMenu.NodeDef[]) {
  return {
    data: nodes,
    source: 'vanilla' as const,
    error: null,
    status: 'success' as const,
    fetchStatus: 'idle' as const,
    loadingPhase: 'none' as const,
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
}

const LOADED = loaded([])
function Loader({ children }: DropdownMenu.LoaderComponentProps) {
  return <>{children(LOADED)}</>
}

function Menu({
  content,
  beside,
}: {
  content: DropdownMenu.NodeDef[]
  beside?: React.ReactNode
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface content={content}>
              <DropdownMenu.Input data-testid="input" />
              <DropdownMenu.List>
                <DataRows />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
            {beside}
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

const apple: DropdownMenu.NodeDef = {
  kind: 'item',
  id: 'apple',
  value: 'Apple',
  render: ({ props }) => (
    <DropdownMenu.Item {...props}>Apple</DropdownMenu.Item>
  ),
}

function subpage(
  onContent: (context: { async?: unknown }) => void,
  asyncNodes?: DropdownMenu.SubpageDef['asyncNodes'],
): DropdownMenu.SubpageDef {
  return {
    kind: 'subpage',
    id: 'projects',
    value: 'Projects',
    nodes: [],
    asyncNodes,
    renderTrigger: ({ props }) => (
      <DropdownMenu.SubpageTrigger {...props}>
        Projects
      </DropdownMenu.SubpageTrigger>
    ),
    renderContent: ({ context }) => {
      onContent(context)
      return null
    },
  }
}

describe('popup menu tier scope', () => {
  it("gives the subpage outlet no coordinator: a subpage's content has no async state", async () => {
    const seen: unknown[] = []
    render(
      <Menu
        content={[
          apple,
          subpage((context) => seen.push(context.async), {
            type: 'static',
            Loader,
            loadStrategy: 'eager',
          }),
        ]}
      />,
    )
    await screen.findByText('Projects')
    await act(async () => {})
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every((value) => value === undefined)).toBe(true)
  })

  it("doesn't re-render the subpage outlet on the root surface's keystrokes", async () => {
    const user = userEvent.setup()
    let renders = 0
    render(<Menu content={[apple, subpage(() => renders++)]} />)
    await screen.findByText('Projects')
    const before = renders
    await user.type(screen.getByTestId('input'), 'pro')
    expect(renders - before).toBe(0)
  })

  it('gives a component next to the Surface no coordinator', async () => {
    const user = userEvent.setup()
    const seen: unknown[] = []
    function Beside() {
      seen.push(PopupMenu.useMaybeAsyncMenuCoordinator())
      return null
    }
    render(<Menu content={[apple]} beside={<Beside />} />)
    await user.type(screen.getByTestId('input'), 'ap')
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every((value) => value === null)).toBe(true)
  })

  // A Group or row outside the List isn't one of the list's rows. (Every
  // group of a data-first store reads as visible while its list is mounted,
  // so the Group itself shows no difference; the read is pinned instead.)
  it('gives parts outside a data-first List no Collection rows', async () => {
    const seen: Record<string, unknown[]> = { inside: [], outside: [] }
    function Rows({ name }: { name: string }) {
      const { store } = Listbox.useSurfaceContext()
      const rows = useMaybeCollectionRows()
      seen[name]?.push(rows?.store === store ? rows : null)
      return null
    }
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface content={[apple]}>
                <DropdownMenu.Input data-testid="input" />
                <DropdownMenu.List>
                  <DataRows />
                  <Rows name="inside" />
                </DropdownMenu.List>
                <Rows name="outside" />
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    await userEvent.setup().type(screen.getByTestId('input'), 'a')
    expect(seen.inside?.length).toBeGreaterThan(0)
    expect(seen.inside?.every((value) => value !== null)).toBe(true)
    expect(seen.outside?.length).toBeGreaterThan(0)
    expect(seen.outside?.every((value) => value === null)).toBe(true)
  })
})

describe('popup menu loader scope while a subpage shows', () => {
  it('drops the root scope while a subpage hides the root Surface, and starts a new one on the way back', async () => {
    const user = userEvent.setup()
    let tree: MenuTreeStore | null = null
    function TreeProbe() {
      tree = useMenuTree()
      return null
    }
    const settings: DropdownMenu.SubpageDef = {
      kind: 'subpage',
      id: 'settings',
      value: 'Settings',
      nodes: [],
      renderTrigger: ({ props }) => (
        <DropdownMenu.SubpageTrigger {...props} data-testid="open-page">
          Settings
        </DropdownMenu.SubpageTrigger>
      ),
      renderContent: ({ pageId }) => (
        <DropdownMenu.Subpage pageId={pageId}>
          <DropdownMenu.Surface>
            <DropdownMenu.List>
              <DropdownMenu.SubpageBackItem data-testid="back">
                Back
              </DropdownMenu.SubpageBackItem>
            </DropdownMenu.List>
          </DropdownMenu.Surface>
        </DropdownMenu.Subpage>
      ),
    }
    render(
      <DropdownMenu.Root defaultOpen>
        <TreeProbe />
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface
                content={[apple, settings]}
                asyncContent={{ type: 'static', Loader }}
                asyncContentMode="append"
                asyncContentReveal="block"
              >
                <DropdownMenu.List>
                  <DataRows />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    const scopes = () => Object.keys(tree?.state.loaders ?? {})

    await screen.findByTestId('open-page')
    await act(async () => {})
    const [rootScope] = scopes()
    expect(rootScope).toBeDefined()
    expect(tree?.state.loaders[rootScope ?? '']?.root).not.toBeNull()

    await user.click(screen.getByTestId('open-page'))
    await screen.findByTestId('back')
    expect(scopes()).toEqual([])

    await user.click(screen.getByTestId('back'))
    await screen.findByTestId('open-page')
    await act(async () => {})
    expect(scopes()).toHaveLength(1)
    expect(scopes()).not.toEqual([rootScope])
  })
})
