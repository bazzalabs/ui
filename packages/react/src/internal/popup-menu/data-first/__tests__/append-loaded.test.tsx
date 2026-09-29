import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import {
  createVanillaQueryLoader,
  createVanillaStaticLoader,
} from '../../../../loaders/vanilla.js'
import { definitionKeyForDef } from '../../menu-tree/resolve.js'
import { type AppendLoadedIds, appendLoadedDefs } from '../append-loaded.js'
import type { GroupDef, ItemDef, NodeDef, SubmenuDef } from '../types.js'

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

function group(id: string, nodes: NodeDef[]): GroupDef {
  return { kind: 'group', id, nodes }
}

const values = (defs: readonly NodeDef[]): string[] =>
  defs.flatMap((def) =>
    def.kind === 'group'
      ? [`${def.id}:[${values(def.nodes).join(',')}]`]
      : 'value' in def
        ? [def.value]
        : [],
  )

/** Menu-scoped IDs: a row's ID is its Definition Key, unique menu-wide. */
const menuScopeIds: AppendLoadedIds = {
  localId: (def) => definitionKeyForDef(def),
  loadedId: (def) => definitionKeyForDef(def),
}

/** Surface-scoped IDs for the local side, given explicitly per def. */
function surfaceScopeIds(localIds: Map<NodeDef, string>): AppendLoadedIds {
  return {
    localId: (def) => localIds.get(def),
    loadedId: (def, path) => [...path, definitionKeyForDef(def)].join('/'),
  }
}

describe('appendLoadedDefs', () => {
  it('keeps local rows first and drops loaded rows with the same ID', () => {
    const { defs } = appendLoadedDefs(
      [item('Alice'), item('Bob')],
      [item('Bob'), item('Carol')],
      menuScopeIds,
    )
    expect(values(defs)).toEqual(['Alice', 'Bob', 'Carol'])
  })

  it('finds duplicates through groups on both sides', () => {
    const { defs } = appendLoadedDefs(
      [group('people', [item('Alice'), item('Bob')])],
      [group('search', [item('Bob'), item('Dana')])],
      menuScopeIds,
    )
    expect(values(defs)).toEqual(['people:[Alice,Bob]', 'search:[Dana]'])
  })

  it("adds a same-ID loaded group's new rows to the local group", () => {
    const { defs, localDefs } = appendLoadedDefs(
      [group('people', [item('Alice')])],
      [group('people', [item('Alice'), item('Bob'), item('Carol')])],
      menuScopeIds,
    )
    expect(values(defs)).toEqual(['people:[Alice,Bob,Carol]'])
    expect(localDefs.has(defs[0] as NodeDef)).toBe(true)
  })

  it('drops a loaded group left empty', () => {
    const { defs } = appendLoadedDefs(
      [item('Alice')],
      [group('search', [item('Alice')])],
      menuScopeIds,
    )
    expect(values(defs)).toEqual(['Alice'])
  })

  it('with menu-scoped IDs, drops a loaded row that matches a row inside a local branch', () => {
    const alice = item('Alice')
    const branch: SubmenuDef = {
      kind: 'submenu',
      value: 'More',
      nodes: [alice],
    }
    const { defs } = appendLoadedDefs([branch], [item('Alice')], menuScopeIds)
    expect(values(defs)).toEqual(['More'])
  })

  it('with surface-scoped IDs, keeps a loaded root row that only matches a row inside a branch', () => {
    const alice = item('Alice')
    const branch: SubmenuDef = {
      kind: 'submenu',
      value: 'More',
      nodes: [alice],
    }
    const { defs } = appendLoadedDefs(
      [branch],
      [item('Alice')],
      surfaceScopeIds(
        new Map<NodeDef, string>([
          [branch, 'more'],
          [alice, 'more/alice'],
        ]),
      ),
    )
    expect(values(defs)).toEqual(['More', 'Alice'])
  })

  it('uses the given IDs, not Definition Keys', () => {
    const { defs } = appendLoadedDefs([item('Alice')], [item('Alicia')], {
      localId: () => 'person-1',
      loadedId: () => 'person-1',
    })
    expect(values(defs)).toEqual(['Alice'])
  })

  it('returns loaded defs unchanged when nothing collides', () => {
    const loaded = [item('Carol')]
    const { defs } = appendLoadedDefs([item('Alice')], loaded, menuScopeIds)
    expect(defs[1]).toBe(loaded[0])
  })
})

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function Rows() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

function Menu(props: {
  mode?: 'replace' | 'append'
  fetcher: () => Promise<NodeDef[]>
  content?: NodeDef[]
}) {
  const loader = React.useMemo(
    () => createVanillaStaticLoader({ fetcher: props.fetcher }),
    [props.fetcher],
  )
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              content={props.content ?? [item('Alice'), item('Bob')]}
              asyncContent={loader}
              asyncContentMode={props.mode}
            >
              <DropdownMenu.Input data-testid="input" />
              <DropdownMenu.List>
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

describe('asyncContentMode', () => {
  it("'append' shows local rows, then adds loaded rows after them without duplicates", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const deferred = createDeferred<NodeDef[]>()
    render(<Menu mode="append" fetcher={() => deferred.promise} />)

    await screen.findByTestId('item-bob')
    expect(rowIds()).toEqual(['item-alice', 'item-bob'])

    await act(async () => {
      deferred.resolve([item('Bob'), item('Carol')])
      await deferred.promise
    })

    await waitFor(() =>
      expect(rowIds()).toEqual(['item-alice', 'item-bob', 'item-carol']),
    )
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it("'replace' (the default) swaps local rows for loaded ones", async () => {
    const deferred = createDeferred<NodeDef[]>()
    render(<Menu fetcher={() => deferred.promise} />)

    await screen.findByTestId('item-bob')
    await act(async () => {
      deferred.resolve([item('Bob'), item('Carol')])
      await deferred.promise
    })

    await waitFor(() => expect(rowIds()).toEqual(['item-bob', 'item-carol']))
  })

  it("'append' keeps local rows ahead of loaded ones while searching", async () => {
    const user = userEvent.setup()
    render(
      <Menu
        mode="append"
        content={[item('Carol')]}
        fetcher={async () => [item('Anna')]}
      />,
    )
    await screen.findByTestId('item-anna')

    // "Anna" scores higher than "Carol" for "a"; the local row stays first.
    await user.type(screen.getByTestId('input'), 'a')

    await waitFor(() => expect(rowIds()).toEqual(['item-carol', 'item-anna']))
  })

  it("'append' merges a same-ID group again on every new result, without duplicates", async () => {
    const user = userEvent.setup()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const people = [group('people', [item('Alice')])]
    const loader = createVanillaQueryLoader({
      fetcher: async (query: string): Promise<NodeDef[]> => [
        group('people', [item('Alice'), item(query === '' ? 'Bob' : 'Dana')]),
      ],
      minQueryLength: 0,
    })
    function QueryMenu() {
      return (
        <DropdownMenu.Root defaultOpen>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface
                  content={people}
                  asyncContent={loader}
                  asyncContentMode="append"
                >
                  <DropdownMenu.Input data-testid="input" />
                  <DropdownMenu.List>
                    <Rows />
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }
    render(<QueryMenu />)
    await screen.findByTestId('item-bob')

    await user.type(screen.getByTestId('input'), 'a')

    await screen.findByTestId('item-dana')
    expect(rowIds()).toEqual(['item-alice', 'item-dana'])
    expect(
      document.querySelectorAll('[role="option"][data-testid="item-alice"]'),
    ).toHaveLength(1)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it("'append' keeps local rows first inside a group that received loaded rows", async () => {
    const user = userEvent.setup()
    render(
      <Menu
        mode="append"
        content={[group('people', [item('Carol')])]}
        fetcher={async () => [group('people', [item('Anna')])]}
      />,
    )
    await screen.findByTestId('item-anna')

    await user.type(screen.getByTestId('input'), 'a')

    await waitFor(() => expect(rowIds()).toEqual(['item-carol', 'item-anna']))
  })

  it("'append' treats rows added to content as local while nothing has loaded", async () => {
    const pending = new Promise<NodeDef[]>(() => {})
    const { rerender } = render(
      <Menu mode="append" content={[item('Alice')]} fetcher={() => pending} />,
    )
    await screen.findByTestId('item-alice')

    rerender(
      <Menu
        mode="append"
        content={[item('Alice'), item('Bob')]}
        fetcher={() => pending}
      />,
    )

    await waitFor(() => expect(rowIds()).toEqual(['item-alice', 'item-bob']))
  })
})
