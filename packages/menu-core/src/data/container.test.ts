import { describe, expect, it } from 'vitest'
import { containerOf, selectionOf } from '../tree/container.js'
import type { DisplayNode, DisplayRowNode } from '../tree/display-node.js'
import type {
  AnyNodeDef,
  AnyNodeDefTypes,
  CheckboxGroupNodeDef,
  CheckboxItemNodeDef,
  GroupNodeDef,
  ItemNodeDef,
  RadioGroupNodeDef,
  RadioItemNodeDef,
  TreeItemNodeDef,
} from '../tree/node-def-map.js'
import { createMenuTreeResolver } from '../tree/resolver.js'
import { getBrowseNodesPreserve } from './browse.js'
import { filterNodes } from './pipeline.js'
import type { PipelineDisplayTypes } from './types.js'

type Display = DisplayNode<PipelineDisplayTypes>
type Row = DisplayRowNode<PipelineDisplayTypes>

function resolve(defs: AnyNodeDef[]) {
  const resolver = createMenuTreeResolver()
  resolver.setContent(defs)
  return resolver.rootNodes
}

const item = (value: string): ItemNodeDef<AnyNodeDefTypes> => ({
  kind: 'item',
  id: value,
  value,
  render: null,
})
const radio = (value: string): RadioItemNodeDef<AnyNodeDefTypes> => ({
  kind: 'radio-item',
  id: value,
  value,
  render: null,
})
const checkbox = (value: string): CheckboxItemNodeDef<AnyNodeDefTypes> => ({
  kind: 'checkbox-item',
  id: value,
  value,
  render: null,
})

const group = (
  id: string,
  nodes: AnyNodeDef[],
): GroupNodeDef<AnyNodeDefTypes> => ({ kind: 'group', id, label: id, nodes })
const radioGroup = (
  id: string,
  nodes: RadioItemNodeDef<AnyNodeDefTypes>[],
  extra: Partial<RadioGroupNodeDef<AnyNodeDefTypes>> = {},
): RadioGroupNodeDef<AnyNodeDefTypes> => ({
  kind: 'radio-group',
  id,
  label: id,
  value: undefined,
  nodes,
  ...extra,
})
const checkboxGroup = (
  id: string,
  nodes: CheckboxItemNodeDef<AnyNodeDefTypes>[],
  extra: Partial<CheckboxGroupNodeDef<AnyNodeDefTypes>> = {},
): CheckboxGroupNodeDef<AnyNodeDefTypes> => ({
  kind: 'checkbox-group',
  id,
  label: id,
  value: [],
  nodes,
  ...extra,
})

/** Each Display Node as `kind:id`, with a Container's rows after it. */
function outline(nodes: Display[]): string[] {
  return nodes.flatMap((node) => {
    if (node.kind === 'separator') return [`separator:${node.node.def.id}`]
    if (node.kind === 'row') return [`row:${node.node.id}`]
    return [
      `${node.kind}:${node.node.def.id}`,
      ...node.items.map((row) => `  row:${row.node.id}`),
    ]
  })
}

function rowsOf(nodes: Display[]): Row[] {
  return nodes.flatMap((node) =>
    node.kind === 'row' ? [node] : 'items' in node ? node.items : [],
  )
}

describe('Container', () => {
  it('reads each group kind as one Container with a selection mode', () => {
    expect(selectionOf('group')).toBe('none')
    expect(selectionOf('radio-group')).toBe('single')
    expect(selectionOf('checkbox-group')).toBe('multiple')
    expect(containerOf(radioGroup('size', [], { hidden: true }))).toEqual({
      selection: 'single',
      id: 'size',
      label: 'size',
      hidden: true,
    })
    expect(containerOf(item('copy'))).toBeNull()
  })

  describe("selection 'none' (group)", () => {
    const defs = () => [group('edit', [item('copy'), item('paste')])]

    it('browses as a group whose rows name it in their context', () => {
      const nodes = getBrowseNodesPreserve(resolve(defs()), null)
      expect(outline(nodes)).toEqual([
        'group:edit',
        '  row:copy',
        '  row:paste',
      ])
      for (const row of rowsOf(nodes)) {
        expect(row.context.group).toEqual({ id: 'edit', label: 'edit' })
        expect(row).not.toHaveProperty('radioGroup')
        expect(row).not.toHaveProperty('checkboxGroup')
      }
    })

    it('ignores `hidden` on a plain group in browse and search', () => {
      // A group def has no `hidden`; one passed anyway never hid it.
      const hiddenGroup = {
        ...group('edit', [item('copy'), item('paste')]),
        hidden: true,
      } as GroupNodeDef<AnyNodeDefTypes>
      expect(containerOf(hiddenGroup)?.hidden).toBe(false)
      expect(
        outline(getBrowseNodesPreserve(resolve([hiddenGroup]), null)),
      ).toEqual(['group:edit', '  row:copy', '  row:paste'])
      expect(
        outline(
          filterNodes({
            query: 'paste',
            nodes: resolve([hiddenGroup]),
            highlightedId: null,
          }).displayNodes,
        ),
      ).toEqual(['group:edit', '  row:paste'])
    })

    it('keeps only matching rows when preserved, and loosens them when flattened', () => {
      const preserved = filterNodes({
        query: 'paste',
        nodes: resolve(defs()),
        highlightedId: null,
      })
      expect(outline(preserved.displayNodes)).toEqual([
        'group:edit',
        '  row:paste',
      ])
      expect(preserved.displayNodes[0]).toMatchObject({
        context: { matchCount: 1 },
      })

      const flattened = filterNodes({
        query: 'paste',
        nodes: resolve(defs()),
        highlightedId: null,
        groupSearchBehavior: 'flatten',
      })
      expect(outline(flattened.displayNodes)).toEqual(['row:paste'])
      expect(rowsOf(flattened.displayNodes)[0]!.context.group).toEqual({
        id: 'edit',
        label: 'edit',
      })
    })
  })

  describe("selection 'single' (radio group)", () => {
    const defs = () => [
      radioGroup('size', [radio('small'), radio('medium'), radio('large')]),
    ]

    it('browses as a radio group whose rows carry it', () => {
      const nodes = getBrowseNodesPreserve(resolve(defs()), null)
      expect(outline(nodes)).toEqual([
        'radio-group:size',
        '  row:small',
        '  row:medium',
        '  row:large',
      ])
      for (const row of rowsOf(nodes)) {
        expect(row.context.group).toBeNull()
        expect(row.radioGroup).toEqual({ id: 'size', label: 'size' })
      }
    })

    it('stays a Container when groups flatten, and shows every row with preserve-show-all', () => {
      const flattenGroups = filterNodes({
        query: 'medium',
        nodes: resolve(defs()),
        highlightedId: null,
        groupSearchBehavior: 'flatten',
      })
      expect(outline(flattenGroups.displayNodes)).toEqual([
        'radio-group:size',
        '  row:medium',
      ])

      const showAll = filterNodes({
        query: 'medium',
        nodes: resolve(defs()),
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve-show-all',
      })
      expect(outline(showAll.displayNodes)).toEqual([
        'radio-group:size',
        '  row:medium',
        '  row:small',
        '  row:large',
      ])
      expect(showAll.displayNodes[0]).toMatchObject({
        context: { matchCount: 1 },
      })
    })

    it('skips a hidden radio group', () => {
      const defsHidden = [
        radioGroup('size', [radio('small')], { hidden: true }),
      ]
      expect(getBrowseNodesPreserve(resolve(defsHidden), null)).toEqual([])
      expect(
        filterNodes({
          query: 'small',
          nodes: resolve(defsHidden),
          highlightedId: null,
        }).displayNodes,
      ).toEqual([])
    })

    it('hides a radio group whose `hidden` is truthy but not `true`', () => {
      const defsHidden = [
        radioGroup('size', [radio('small')], {
          hidden: 1 as unknown as boolean,
        }),
      ]
      expect(getBrowseNodesPreserve(resolve(defsHidden), null)).toEqual([])
      expect(
        filterNodes({
          query: 'small',
          nodes: resolve(defsHidden),
          highlightedId: null,
        }).displayNodes,
      ).toEqual([])
    })

    it('shows a tree item as one row that keeps its radio group, as search does', () => {
      const tree: TreeItemNodeDef<AnyNodeDefTypes> = {
        kind: 'tree-item',
        id: 'folder',
        value: 'folder',
        nodes: [item('file')],
        render: null,
      }
      // Radio groups hold radio items by type; a tree item only arrives untyped.
      const defsWithTree = [
        radioGroup('size', [
          radio('small'),
          tree as unknown as RadioItemNodeDef<AnyNodeDefTypes>,
        ]),
      ]
      const nodes = getBrowseNodesPreserve(resolve(defsWithTree), null)
      expect(outline(nodes)).toEqual([
        'radio-group:size',
        '  row:small',
        '  row:folder',
      ])
      const folder = rowsOf(nodes)[1]!
      expect(folder.context.tree).toBeNull()
      expect(folder.radioGroup).toEqual({ id: 'size', label: 'size' })
    })
  })

  describe("selection 'multiple' (checkbox group)", () => {
    const defs = () => [
      checkboxGroup('flags', [checkbox('bold'), checkbox('italic')], {
        value: ['bold'],
      }),
    ]

    it('browses as a checkbox group whose rows carry it and its def', () => {
      const nodes = getBrowseNodesPreserve(resolve(defs()), null)
      expect(outline(nodes)).toEqual([
        'checkbox-group:flags',
        '  row:bold',
        '  row:italic',
      ])
      for (const row of rowsOf(nodes)) {
        expect(row.context.group).toBeNull()
        expect(row.checkboxGroup).toMatchObject({
          id: 'flags',
          label: 'flags',
          def: { value: ['bold'] },
        })
      }
    })

    it('loosens its rows when its search behavior flattens', () => {
      const { displayNodes } = filterNodes({
        query: 'italic',
        nodes: resolve(defs()),
        highlightedId: null,
        checkboxGroupSearchBehavior: 'flatten',
      })
      expect(outline(displayNodes)).toEqual(['row:italic'])
      expect(rowsOf(displayNodes)[0]!.checkboxGroup?.id).toBe('flags')
    })
  })

  it('orders Containers groups, radio groups, then checkbox groups, before loose rows', () => {
    // Authored in the opposite order, with `sortGroups` off so nothing sorts.
    const defs = [
      item('alpha-loose'),
      checkboxGroup('c', [checkbox('alpha-c')]),
      radioGroup('r', [radio('alpha-r')]),
      group('g', [item('alpha-g')]),
    ]
    const { displayNodes } = filterNodes({
      query: 'alpha',
      nodes: resolve(defs),
      highlightedId: null,
      sortGroups: false,
    })
    expect(outline(displayNodes)).toEqual([
      'group:g',
      '  row:alpha-g',
      'radio-group:r',
      '  row:alpha-r',
      'checkbox-group:c',
      '  row:alpha-c',
      'row:alpha-loose',
    ])
  })
})
