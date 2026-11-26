import { describe, expect, it } from 'vitest'
import { getBrowseNodesPreserve } from '../data/browse.js'
import { type FilterNodesOptions, filterNodes } from '../data/pipeline.js'
import type { PipelineDisplayNode } from '../data/types.js'
import type { AnyMenuNode } from '../tree/menu-node.js'
import type {
  AnyNodeDef,
  AnyNodeDefTypes,
  ItemNodeDef,
  LinkItemNodeDef,
  RadioItemNodeDef,
} from '../tree/node-def-map.js'
import { createMenuTreeResolver } from '../tree/resolver.js'
import { buildDataSnapshot, dataSnapshotInput } from './data.js'
import { buildSnapshot } from './snapshot.js'
import { named } from './test-helpers.js'
import { Pos } from './types.js'

const item = (
  id: string,
  options: Partial<ItemNodeDef<AnyNodeDefTypes>> = {},
): ItemNodeDef<AnyNodeDefTypes> => ({
  kind: 'item',
  id,
  value: id,
  render: null,
  ...options,
})
const link = (
  id: string,
  options: Partial<LinkItemNodeDef<AnyNodeDefTypes>> = {},
): LinkItemNodeDef<AnyNodeDefTypes> => ({
  kind: 'link-item',
  id,
  value: id,
  href: `/${id}`,
  render: null,
  ...options,
})
const radio = (id: string): RadioItemNodeDef<AnyNodeDefTypes> => ({
  kind: 'radio-item',
  id,
  value: id,
  render: null,
})

/** A root with a loose row, a group, a separator, a radio group and a submenu. */
const defs = (options: { moreDisabled?: boolean } = {}): AnyNodeDef[] => [
  item('home', { keywords: ['house'], shortcut: 'h' }),
  {
    kind: 'group',
    id: 'edit',
    label: 'Edit',
    nodes: [item('copy'), item('paste', { disabled: true })],
  },
  { kind: 'separator', id: 'sep' },
  {
    kind: 'radio-group',
    id: 'size',
    value: undefined,
    nodes: [radio('small'), radio('large')],
  },
  {
    kind: 'submenu',
    id: 'more',
    value: 'more',
    disabled: options.moreDisabled,
    nodes: [item('archive'), item('delete')],
    render: null,
  },
]

function resolve(content: AnyNodeDef[]): readonly AnyMenuNode[] {
  const resolver = createMenuTreeResolver()
  resolver.setContent(content)
  return resolver.rootNodes
}

function search(
  nodes: readonly AnyMenuNode[],
  query: string,
  options: Partial<FilterNodesOptions> = {},
): PipelineDisplayNode[] {
  return filterNodes({ query, nodes, highlightedId: null, ...options })
    .displayNodes
}

describe('the Data adapter', () => {
  describe('browsing', () => {
    const nodes = resolve(defs())
    const displayNodes = getBrowseNodesPreserve(nodes, null)
    const snapshot = buildDataSnapshot({
      displayNodes,
      browseNodes: displayNodes,
    })

    it('reads every row in Display Node order', () => {
      expect(
        snapshot.orderedIds.map((id) => {
          const row = snapshot.rows.get(id)!
          return `${row.kind}:${id}${row.containerId ? ` in ${row.containerId}` : ''}`
        }),
      ).toEqual([
        'item:home',
        'container:edit',
        'item:copy in edit',
        'item:paste in edit',
        'separator:sep',
        'container:size',
        'radio:small in size',
        'radio:large in size',
        'submenu-trigger:more',
      ])
      expect([...snapshot.visible]).toEqual(snapshot.orderedIds)
      expect([...snapshot.visibleContainers]).toEqual(['edit', 'size'])
    })

    it("carries each row's def fields", () => {
      expect(snapshot.rows.get('home')).toEqual({
        id: 'home',
        kind: 'item',
        textValue: 'home',
        keywords: ['house'],
        disabled: false,
        activatable: true,
        closeOnClick: true,
        shortcut: 'h',
      })
      expect(snapshot.rows.get('size')).toEqual({
        id: 'size',
        kind: 'container',
        selection: 'single',
      })
      expect(snapshot.rows.get('paste')).toMatchObject({ disabled: true })
      // Radio rows and submenu triggers don't close the menu by default.
      expect(snapshot.rows.get('small')).toMatchObject({ closeOnClick: false })
      expect(snapshot.rows.get('more')).toMatchObject({ closeOnClick: false })
    })

    it('navigates the enabled rows', () => {
      // What data-list.tsx's getOrderedItemIds hands the store today.
      expect(snapshot.navOrder).toEqual([
        'home',
        'copy',
        'small',
        'large',
        'more',
      ])
    })

    it('scores every row 1', () => {
      expect(new Set(snapshot.scores.values())).toEqual(new Set([1]))
      expect(snapshot.scores.size).toBe(6)
    })

    it('positions rows as the JSX parts would', () => {
      expect(named(snapshot.positions)).toEqual({
        home: ['First'],
        edit: ['FirstContainer'],
        copy: ['FirstInContainer'],
        paste: ['LastInContainer'],
        sep: [],
        size: ['LastContainer'],
        small: ['FirstInContainer'],
        large: ['LastInContainer'],
        more: ['Last'],
      })
    })

    it('returns the previous snapshot for the same Display Nodes', () => {
      const again = getBrowseNodesPreserve(nodes, null)
      expect(
        buildDataSnapshot(
          { displayNodes: again, browseNodes: again },
          snapshot,
        ),
      ).toBe(snapshot)
    })

    it('keeps no row hidden while browsing', () => {
      expect(
        dataSnapshotInput({ displayNodes, browseNodes: displayNodes }).hidden,
      ).toEqual(new Set())
    })

    it('navigates to a header tree row it does not activate', () => {
      const tree = resolve([
        {
          kind: 'tree-item',
          id: 'folder',
          value: 'folder',
          selectable: false,
          nodes: [item('file')],
          render: null,
        },
        link('docs'),
        link('blog', { closeOnClick: true }),
      ])
      const shown = getBrowseNodesPreserve(tree, null)
      const treeRows = buildDataSnapshot({
        displayNodes: shown,
        browseNodes: shown,
      })
      expect(treeRows.navOrder).toEqual(['folder', 'file', 'docs', 'blog'])
      expect(treeRows.rows.get('folder')).toMatchObject({
        kind: 'tree',
        activatable: false,
        closeOnClick: true,
      })
      expect(treeRows.rows.get('file')).toMatchObject({ activatable: true })
      expect(treeRows.rows.get('docs')).toMatchObject({
        kind: 'link',
        closeOnClick: false,
      })
      expect(treeRows.rows.get('blog')).toMatchObject({ closeOnClick: true })
    })
  })

  describe('deep search', () => {
    const nodes = resolve(defs())
    const browseNodes = getBrowseNodesPreserve(nodes, null)
    const displayNodes = search(nodes, 'ar')

    it('shows the rows the pipeline shows, in its order', () => {
      const snapshot = buildDataSnapshot({ displayNodes, browseNodes })
      // The pipeline sorts the better match first; the adapter keeps it.
      expect([...snapshot.visible]).toEqual(['more/archive', 'size', 'large'])
      expect(snapshot.rows.get('more/archive')).toMatchObject({
        kind: 'item',
        containerId: undefined,
      })
      expect(snapshot.navOrder).toEqual(['more/archive', 'large'])
      expect(named(snapshot.positions)).toEqual({
        'more/archive': ['First'],
        size: ['Last', 'FirstContainer', 'LastContainer'],
        large: ['FirstInContainer', 'LastInContainer'],
      })
    })

    it('scores each row its search score', () => {
      const snapshot = buildDataSnapshot({ displayNodes, browseNodes })
      for (const id of ['large', 'more/archive']) {
        expect(snapshot.scores.get(id)).toBeGreaterThan(0)
        expect(snapshot.scores.get(id)).toBeLessThan(1)
      }
    })

    it('keeps the rows the search hides, after the visible ones', () => {
      const snapshot = buildDataSnapshot({ displayNodes, browseNodes })

      expect(snapshot.orderedIds).toEqual([
        'more/archive',
        'size',
        'large',
        'home',
        'edit',
        'copy',
        'paste',
        'sep',
        'small',
        'more',
      ])
      expect([...snapshot.visible]).toEqual(['more/archive', 'size', 'large'])
      expect([...snapshot.visibleContainers]).toEqual(['size'])
      expect(snapshot.navOrder).toEqual(['more/archive', 'large'])
      expect(snapshot.scores.get('home')).toBe(0)
      expect(snapshot.scores.get('small')).toBe(0)
      expect([...snapshot.positions.keys()]).toEqual([
        'more/archive',
        'size',
        'large',
      ])
    })

    it('marks the browse rows it adds as hidden', () => {
      const input = dataSnapshotInput({ displayNodes, browseNodes })
      expect([...input.hidden]).toEqual([
        'home',
        'edit',
        'copy',
        'paste',
        'sep',
        'small',
        'more',
      ])
    })

    it('shows every row of a preserve-show-all Container', () => {
      const shown = search(nodes, 'ar', {
        radioGroupSearchBehavior: 'preserve-show-all',
      })
      const snapshot = buildDataSnapshot({ displayNodes: shown, browseNodes })
      expect(snapshot.visible.has('small')).toBe(true)
      expect(snapshot.scores.get('small')).toBe(0)
      expect(snapshot.navOrder).toContain('small')
    })

    it('reads flattened Container rows as loose rows', () => {
      const flat = search(nodes, 'ar', { radioGroupSearchBehavior: 'flatten' })
      const snapshot = buildDataSnapshot({ displayNodes: flat, browseNodes })
      expect(snapshot.visibleContainers.size).toBe(0)
      expect(snapshot.rows.get('large')).toMatchObject({
        containerId: undefined,
      })
    })

    it('positions disabled deep results but skips them in navigation', () => {
      const disabledNodes = resolve(defs({ moreDisabled: true }))
      const shown = search(disabledNodes, 'ar', {
        disabledBranchBehavior: 'inherit',
      })
      const snapshot = buildDataSnapshot({
        displayNodes: shown,
        browseNodes: getBrowseNodesPreserve(disabledNodes, null),
      })
      expect(snapshot.rows.get('more/archive')).toMatchObject({
        disabled: true,
      })
      expect(snapshot.navOrder).toEqual(['large'])
      expect(snapshot.positions.get('more/archive')).toBe(Pos.First)
    })
  })

  it('builds the empty snapshot from no Display Nodes', () => {
    const snapshot = buildDataSnapshot({ displayNodes: [], browseNodes: [] })
    expect(snapshot.version).toBe(0)
    expect(snapshot.orderedIds).toEqual([])
  })

  it('lets the caller add a loading row after the Display Nodes', () => {
    const shown = getBrowseNodesPreserve(resolve([item('a')]), null)
    const input = dataSnapshotInput({ displayNodes: shown, browseNodes: shown })
    input.rows.push({ id: 'loading', kind: 'loading' })
    expect(named(buildSnapshot(input).positions)).toEqual({
      a: ['First'],
      loading: ['Last'],
    })
  })
})
