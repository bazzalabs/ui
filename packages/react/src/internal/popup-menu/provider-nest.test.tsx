import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import { CollectionRowsContext } from '../listbox/contexts/collection-row-context.js'
import * as Listbox from '../listbox/index.js'
import { GraftPointContext } from './contexts/graft-point-context.js'
import { MenuTreeContext } from './contexts/menu-tree-context.js'
import { SubpageContext } from './contexts/subpage-context.js'
import { SurfaceSettingsContext } from './contexts/surface-settings-context.js'
import { SurfaceTierContext } from './contexts/surface-tier-context.js'
import { LoaderScopeContext } from './data-first/async-coordinator.js'
import * as PopupMenu from './index.js'

/**
 * The context providers above a row, outermost first, by name. The engine's
 * are named from this map; any other provider with a `displayName` is Base
 * UI's (`base:<name>`), and one with neither is an engine context this map
 * doesn't know, which fails the counts below.
 */
const ENGINE_CONTEXTS = new Map<unknown, string>([
  [MenuTreeContext, 'MenuTree'],
  [SurfaceTierContext, 'SurfaceTier'],
  [SurfaceSettingsContext, 'SurfaceSettings'],
  [SubpageContext, 'Subpage'],
  [GraftPointContext, 'GraftPoint'],
  [LoaderScopeContext, 'LoaderScope'],
  [CollectionRowsContext, 'CollectionRows'],
  [PopupMenu.PopupMenuContext, 'PopupMenu'],
  [PopupMenu.PopupSurfaceIdContext, 'PopupSurfaceId'],
  [PopupMenu.SubpageStackContext, 'SubpageStack'],
  [PopupMenu.DataListContext, 'DataList'],
  [PopupMenu.DataPopupContext, 'DataPopup'],
  [PopupMenu.DataSurfaceContext, 'DataSurface'],
  [Listbox.GroupContext, 'Group'],
  [Listbox.ItemContext, 'Item'],
  [Listbox.ListboxContextProvider, 'Listbox'],
  [Listbox.RowWidthContext, 'RowWidth'],
  [Listbox.SurfaceContext, 'Surface'],
])

/** React's fiber tag for a context provider. */
const CONTEXT_PROVIDER = 10

interface Fiber {
  tag: number
  type: unknown
  return: Fiber | null
}

function providersAbove(element: Element): string[] {
  const key = Object.keys(element).find((k) => k.startsWith('__reactFiber$'))
  if (!key) throw new Error('no fiber on the element')
  const names: string[] = []
  for (
    let fiber = (element as unknown as Record<string, Fiber>)[key] ?? null;
    fiber;
    fiber = fiber.return
  ) {
    if (fiber.tag !== CONTEXT_PROVIDER) continue
    const context = fiber.type as { displayName?: string }
    names.push(
      ENGINE_CONTEXTS.get(context) ??
        (context.displayName ? `base:${context.displayName}` : 'unknown'),
    )
  }
  return names.reverse()
}

const engine = (names: string[]) => names.filter((n) => !n.startsWith('base:'))

/**
 * The providers one open submenu adds above its rows: those above a row of
 * the submenu that aren't above the row its trigger sits next to.
 */
function submenuLevel(top: Element, nested: Element) {
  const outer = providersAbove(top)
  const inner = providersAbove(nested)
  expect(inner.slice(0, outer.length)).toEqual(outer)
  return inner.slice(outer.length)
}

function JsxMenu() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="top">Top</DropdownMenu.Item>
                <DropdownMenu.Submenu defaultOpen>
                  <DropdownMenu.SubmenuTrigger>
                    More
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup>
                        <DropdownMenu.Surface>
                          <DropdownMenu.List>
                            <DropdownMenu.Item data-testid="nested">
                              Nested
                            </DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function DataRows() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

const DATA_CONTENT: DropdownMenu.NodeDef[] = [
  {
    kind: 'item',
    id: 'top',
    value: 'Top',
    render: ({ props }) => (
      <DropdownMenu.Item {...props} data-testid="top">
        Top
      </DropdownMenu.Item>
    ),
  },
  {
    kind: 'submenu',
    id: 'more',
    value: 'More',
    nodes: [
      {
        kind: 'item',
        id: 'nested',
        value: 'Nested',
        render: ({ props }) => (
          <DropdownMenu.Item {...props} data-testid="nested">
            Nested
          </DropdownMenu.Item>
        ),
      },
    ],
    render: ({ props, nodes, renderNode }) => (
      <DropdownMenu.Submenu defaultOpen>
        <DropdownMenu.SubmenuTrigger {...props}>
          More
        </DropdownMenu.SubmenuTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>{nodes.map(renderNode)}</DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    ),
  },
]

function DataMenu() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface content={DATA_CONTENT}>
              <DropdownMenu.List>
                <DataRows />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

// Before the tiers (base a3e3e59b), a JSX row of the root sat under 15
// engine providers and each open submenu added 10 (16 with Base UI's); a
// data-first root row sat under 20, and each open data-first submenu added
// 13. The published context objects
// (PopupMenu, Listbox, PopupSurfaceId, SubpageStack, DataPopup, Surface,
// Group, RowWidth, DataSurface, DataList) are still provided where they were.
// Each level's settings ride a context of their own (`SurfaceSettings`,
// UI-754), the one tier context whose value changes: one more provider per
// level (a JSX root row 10 -> 11, an open JSX submenu 9 -> 10, a data-first
// root row 14 -> 15, an open data-first submenu 12 -> 13).
describe('popup menu provider nest', () => {
  it('a JSX root row sits under the tree tier, the root surface tier and the published contexts', async () => {
    render(<JsxMenu />)
    await screen.findByTestId('nested')
    expect(engine(providersAbove(screen.getByTestId('top')))).toEqual([
      'PopupMenu',
      'Listbox',
      'MenuTree',
      'SurfaceTier',
      'SurfaceSettings',
      'PopupSurfaceId',
      'SubpageStack',
      'DataPopup',
      'Surface',
      'Group',
      'RowWidth',
    ])
  })

  it('an open JSX submenu adds one surface tier, its settings and the published contexts over its rows', async () => {
    render(<JsxMenu />)
    const level = submenuLevel(
      screen.getByTestId('top'),
      await screen.findByTestId('nested'),
    )
    expect(engine(level)).toEqual([
      'SurfaceTier',
      'SurfaceSettings',
      'PopupMenu',
      'Listbox',
      'PopupSurfaceId',
      'SubpageStack',
      'DataPopup',
      'Surface',
      'Group',
      'RowWidth',
    ])
    // Base UI's popover adds its own six.
    expect(level).toHaveLength(16)
  })

  // A data-first Surface keeps one provider for its loader scope, and its
  // List one for its rows: each reaches only the parts below it.
  it('a data-first root row adds the loader scope, the Collection rows and the published data contexts', async () => {
    render(<DataMenu />)
    expect(engine(providersAbove(await screen.findByTestId('top')))).toEqual([
      'PopupMenu',
      'Listbox',
      'MenuTree',
      'SurfaceTier',
      'SurfaceSettings',
      'PopupSurfaceId',
      'SubpageStack',
      'DataPopup',
      'Surface',
      'Group',
      'DataSurface',
      'LoaderScope',
      'DataList',
      'CollectionRows',
      'RowWidth',
    ])
  })

  it('an open data-first submenu adds one surface tier, its settings and the published contexts over its rows', async () => {
    render(<DataMenu />)
    const level = submenuLevel(
      await screen.findByTestId('top'),
      await screen.findByTestId('nested'),
    )
    expect(engine(level)).toEqual([
      'GraftPoint',
      'SurfaceTier',
      'SurfaceSettings',
      'PopupMenu',
      'Listbox',
      'PopupSurfaceId',
      'SubpageStack',
      'DataPopup',
      'Surface',
      'Group',
      'DataList',
      'CollectionRows',
      'RowWidth',
    ])
  })
})
