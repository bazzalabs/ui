import { describe, expect, it } from 'vitest'
import { createMenuTreeResolver } from '../../menu-tree/resolver.js'
import type {
  CheckboxGroupDef,
  CheckboxItemDef,
  GroupDef,
  ItemDef,
  NodeDef,
  RadioGroupDef,
  RadioItemDef,
  SubmenuDef,
  SubpageDef,
} from '../types.js'
import {
  isDisplayCheckboxGroupNode,
  isDisplayGroupNode,
  isDisplayRadioGroupNode,
  isDisplayRowNode,
} from '../types.js'
import {
  collectAsyncSubmenus,
  filterNodes,
  flattenNodes,
  getBrowseNodesPreserve,
  scoreNodes,
} from '../utils.js'

// ============================================================================
// Test Helpers
// ============================================================================

/** Resolves defs into Menu Nodes the way a root list does. */
function resolve(nodes: NodeDef[]) {
  const resolver = createMenuTreeResolver()
  resolver.setContent(nodes)
  return resolver.rootNodes
}

function createItemDef(
  id: string,
  value: string,
  options: Partial<ItemDef> = {},
): ItemDef {
  return {
    kind: 'item',
    id,
    value,
    render: () => null,
    ...options,
  }
}

function createCheckboxItemDef(
  id: string,
  value: string,
  checked: boolean,
  options: Partial<CheckboxItemDef> = {},
): CheckboxItemDef {
  return {
    kind: 'checkbox-item',
    id,
    value,
    checked,
    render: () => null,
    ...options,
  }
}

function createSubmenuDef(
  id: string,
  value: string,
  nodes: NodeDef[],
  options: Partial<SubmenuDef> = {},
): SubmenuDef {
  return {
    kind: 'submenu',
    id,
    value,
    nodes,
    render: () => null,
    ...options,
  }
}

function createSubpageDef(
  id: string,
  value: string,
  nodes: NodeDef[],
  options: Partial<SubpageDef> = {},
): SubpageDef {
  return {
    kind: 'subpage',
    id,
    value,
    nodes,
    renderTrigger: () => null,
    renderContent: () => null,
    ...options,
  }
}

function createGroupDef(
  id: string,
  nodes: NodeDef[],
  options: Partial<GroupDef> = {},
): GroupDef {
  return {
    kind: 'group',
    id,
    nodes,
    ...options,
  }
}

function createRadioItemDef(
  id: string,
  value: string,
  options: Partial<RadioItemDef> = {},
): RadioItemDef {
  return {
    kind: 'radio-item',
    id,
    value,
    render: () => null,
    ...options,
  }
}

function createRadioGroupDef(
  id: string,
  value: string | undefined,
  nodes: RadioItemDef[],
  options: Partial<RadioGroupDef> = {},
): RadioGroupDef {
  return {
    kind: 'radio-group',
    id,
    value,
    nodes,
    render: () => null,
    ...options,
  }
}

function createCheckboxGroupDef(
  id: string,
  value: string[],
  nodes: CheckboxItemDef[],
  options: Partial<CheckboxGroupDef> = {},
): CheckboxGroupDef {
  return {
    kind: 'checkbox-group',
    id,
    value,
    nodes,
    render: () => null,
    ...options,
  }
}

// ============================================================================
// CheckboxItemDef Tests
// ============================================================================

describe('CheckboxItemDef', () => {
  describe('flattenNodes', () => {
    it('should include checkbox items in flattened results', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', 'Item 1'),
        createCheckboxItemDef('cb1', 'Checkbox 1', true),
        createCheckboxItemDef('cb2', 'Checkbox 2', false),
      ]

      const flattened = flattenNodes(resolve(nodes))

      expect(flattened).toHaveLength(3)
      expect(flattened[1].node.def.id).toBe('cb1')
      expect(flattened[1].node.kind).toBe('checkbox-item')
    })

    it('should include checkbox items from groups', () => {
      const nodes: NodeDef[] = [
        createGroupDef('g1', [
          createCheckboxItemDef('cb1', 'Checkbox 1', true),
          createCheckboxItemDef('cb2', 'Checkbox 2', false),
        ]),
      ]

      const flattened = flattenNodes(resolve(nodes))

      expect(flattened).toHaveLength(2)
      expect(flattened[0].group?.id).toBe('g1')
      expect(flattened[1].group?.id).toBe('g1')
    })
  })

  describe('scoreNodes', () => {
    it('scores rows based on label', () => {
      const nodes: NodeDef[] = [
        createCheckboxItemDef('cb1', 'Dark Mode', true),
        createCheckboxItemDef('cb2', 'Light Theme', false),
      ]

      const flattened = flattenNodes(resolve(nodes))
      const scored = scoreNodes(flattened, 'dark')

      expect(scored).toHaveLength(1)
      expect(scored[0].node.def.id).toBe('cb1')
      expect(scored[0].score).toBeGreaterThan(0)
    })

    it('scores rows based on keywords', () => {
      const nodes: NodeDef[] = [
        createCheckboxItemDef('cb1', 'Enable Feature', true, {
          keywords: ['toggle', 'switch'],
        }),
      ]

      const flattened = flattenNodes(resolve(nodes))
      const scored = scoreNodes(flattened, 'toggle')

      expect(scored).toHaveLength(1)
      expect(scored[0].score).toBeGreaterThan(0)
    })
  })

  describe('filterNodes', () => {
    it('should include checkbox items in search results', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', 'Regular Item'),
        createCheckboxItemDef('cb1', 'Dark Mode', true),
        createCheckboxItemDef('cb2', 'Auto Save', false),
      ]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes: resolve(nodes),
        highlightedId: null,
      })

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRowNode(displayNodes[0])).toBe(true)
      if (isDisplayRowNode(displayNodes[0])) {
        expect(displayNodes[0].node.def.id).toBe('cb1')
        expect(displayNodes[0].node.kind).toBe('checkbox-item')
      }
    })
  })
})

// ============================================================================
// RadioGroupDef Tests
// ============================================================================

describe('RadioGroupDef', () => {
  describe('flattenNodes', () => {
    it('should include items from radio groups', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef('rg1', 'option1', [
          createRadioItemDef('opt1', 'Option 1'),
          createRadioItemDef('opt2', 'Option 2'),
          createRadioItemDef('opt3', 'Option 3'),
        ]),
      ]

      const flattened = flattenNodes(resolve(nodes))

      expect(flattened).toHaveLength(3)
      expect(flattened[0].radioGroup?.id).toBe('rg1')
      expect(flattened[1].radioGroup?.id).toBe('rg1')
      expect(flattened[2].radioGroup?.id).toBe('rg1')
    })

    it('should track radioGroup separately from group', () => {
      const nodes: NodeDef[] = [
        createGroupDef('g1', [createItemDef('item1', 'Item 1')]),
        createRadioGroupDef('rg1', 'opt1', [
          createRadioItemDef('opt1', 'Option 1'),
        ]),
      ]

      const flattened = flattenNodes(resolve(nodes))

      expect(flattened).toHaveLength(2)
      expect(flattened[0].group?.id).toBe('g1')
      expect(flattened[0].radioGroup).toBeNull()
      expect(flattened[1].group).toBeNull()
      expect(flattened[1].radioGroup?.id).toBe('rg1')
    })
  })

  describe('getBrowseNodesPreserve', () => {
    it('should render radio groups as DisplayRadioGroupNode', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef(
          'rg1',
          'opt1',
          [
            createRadioItemDef('opt1', 'Option 1'),
            createRadioItemDef('opt2', 'Option 2'),
          ],
          { label: 'Options' },
        ),
      ]

      const displayNodes = getBrowseNodesPreserve(resolve(nodes), null)

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        expect(displayNodes[0].items).toHaveLength(2)
        expect(displayNodes[0].node.def.label).toBe('Options')
      }
    })
  })
})

describe('CheckboxGroupDef', () => {
  const checkboxGroup = () =>
    createCheckboxGroupDef(
      'cg1',
      ['alpha'],
      [
        createCheckboxItemDef('alpha', 'Alpha', true),
        createCheckboxItemDef('beta', 'Beta', false),
      ],
    )

  it('tracks checkbox group membership and resets other group contexts', () => {
    const nodes: NodeDef[] = [
      createGroupDef('g1', [
        createItemDef('item1', 'Item 1'),
        createCheckboxGroupDef(
          'cg1',
          ['alpha'],
          [
            createCheckboxItemDef('alpha', 'Alpha', true),
            createCheckboxItemDef('beta', 'Beta', false),
          ],
        ),
      ]),
      createItemDef('outside-checkbox-group', 'Outside checkbox group'),
    ]
    const flattened = flattenNodes(resolve(nodes))
    expect(flattened[0].group?.id).toBe('g1')
    expect(flattened[1].checkboxGroup?.id).toBe('cg1')
    expect(flattened[2].checkboxGroup?.id).toBe('cg1')
    expect(flattened[1].group).toBeNull()
    expect(flattened[1].radioGroup).toBeNull()
    expect(flattened[2].group).toBeNull()
    expect(flattened[2].radioGroup).toBeNull()
  })

  it('preserves matching items by default', () => {
    const { displayNodes } = filterNodes({
      query: 'beta',
      nodes: resolve([checkboxGroup()]),
      highlightedId: null,
    })
    expect(displayNodes).toHaveLength(1)
    expect(isDisplayCheckboxGroupNode(displayNodes[0])).toBe(true)
    if (isDisplayCheckboxGroupNode(displayNodes[0]))
      expect(displayNodes[0].items.map((item) => item.node.id)).toEqual([
        'beta',
      ])
  })

  it('shows every item with preserve-show-all', () => {
    const { displayNodes } = filterNodes({
      query: 'beta',
      nodes: resolve([checkboxGroup()]),
      highlightedId: null,
      checkboxGroupSearchBehavior: 'preserve-show-all',
    })
    expect(isDisplayCheckboxGroupNode(displayNodes[0])).toBe(true)
    if (isDisplayCheckboxGroupNode(displayNodes[0]))
      expect(displayNodes[0].items[0].checkboxGroup?.def).toBeDefined()
    if (isDisplayCheckboxGroupNode(displayNodes[0]))
      expect(displayNodes[0].items).toHaveLength(2)
  })

  it('flattens matching items when requested', () => {
    const { displayNodes } = filterNodes({
      query: 'beta',
      nodes: resolve([checkboxGroup()]),
      highlightedId: null,
      checkboxGroupSearchBehavior: 'flatten',
    })
    expect(displayNodes).toHaveLength(1)
    expect(isDisplayRowNode(displayNodes[0])).toBe(true)
    if (isDisplayRowNode(displayNodes[0]))
      expect(displayNodes[0].node.id).toBe('beta')
    if (isDisplayRowNode(displayNodes[0]))
      expect(displayNodes[0].checkboxGroup?.def.value).toEqual(['alpha'])
  })

  it('preserves checkbox groups when regular groups flatten', () => {
    const { displayNodes } = filterNodes({
      query: 'beta',
      nodes: resolve([checkboxGroup()]),
      highlightedId: null,
      groupSearchBehavior: 'flatten',
    })
    expect(displayNodes).toHaveLength(1)
    expect(isDisplayCheckboxGroupNode(displayNodes[0])).toBe(true)
    if (isDisplayCheckboxGroupNode(displayNodes[0]))
      expect(displayNodes[0].items.map((item) => item.node.id)).toEqual([
        'beta',
      ])
  })

  it('includes checkbox group membership in browse rows', () => {
    const displayNodes = getBrowseNodesPreserve(
      resolve([checkboxGroup()]),
      null,
    )
    expect(isDisplayCheckboxGroupNode(displayNodes[0])).toBe(true)
    if (isDisplayCheckboxGroupNode(displayNodes[0]))
      expect(
        displayNodes[0].items.map((item) => item.checkboxGroup?.id),
      ).toEqual(['cg1', 'cg1'])
  })

  it('skips hidden checkbox groups', () => {
    const displayNodes = getBrowseNodesPreserve(
      resolve([{ ...checkboxGroup(), hidden: true }]),
      null,
    )
    expect(displayNodes).toHaveLength(0)
  })
})

// ============================================================================
// RadioItemDef Tests
// ============================================================================

describe('RadioItemDef', () => {
  describe('flattenNodes', () => {
    it('should include radio items in flattened results', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef('rg1', 'opt1', [
          createRadioItemDef('opt1', 'Option 1'),
          createRadioItemDef('opt2', 'Option 2'),
        ]),
      ]

      const flattened = flattenNodes(resolve(nodes))

      expect(flattened).toHaveLength(2)
      expect(flattened[0].node.kind).toBe('radio-item')
      expect(flattened[1].node.kind).toBe('radio-item')
    })

    it('should track radioGroup context for radio items', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef(
          'rg1',
          'opt1',
          [createRadioItemDef('opt1', 'Option 1')],
          { label: 'Options' },
        ),
      ]

      const flattened = flattenNodes(resolve(nodes))

      expect(flattened).toHaveLength(1)
      expect(flattened[0].radioGroup?.id).toBe('rg1')
      expect(flattened[0].radioGroup?.label).toBe('Options')
    })
  })

  describe('filterNodes - radio item filtering', () => {
    it('should filter radio groups showing only matching radio items', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef(
          'operators',
          'eq',
          [
            createRadioItemDef('eq', 'eq', { keywords: ['same', 'is'] }),
            createRadioItemDef('neq', 'neq', { keywords: ['different'] }),
            createRadioItemDef('contains', 'contains', {
              keywords: ['includes'],
            }),
          ],
          { label: 'Operators' },
        ),
      ]

      const { displayNodes } = filterNodes({
        query: 'same',
        nodes: resolve(nodes),
        highlightedId: null,
      })

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        // Only the matching item should be shown
        expect(displayNodes[0].items).toHaveLength(1)
        expect(displayNodes[0].items[0].node.def.value).toBe('eq')
      }
    })

    it('should include radio items in deep search results from submenus', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef('sub1', 'Filters', [
          createRadioGroupDef(
            'operators',
            'eq',
            [
              createRadioItemDef('eq', 'eq', { keywords: ['equals', 'is'] }),
              createRadioItemDef('contains', 'contains', {
                keywords: ['includes'],
              }),
            ],
            { label: 'Operators' },
          ),
        ]),
      ]

      const { displayNodes, isDeepSearching } = filterNodes({
        query: 'includes',
        nodes: resolve(nodes),
        highlightedId: null,
        deepSearch: true,
        minLength: 0,
      })

      expect(isDeepSearching).toBe(true)

      const radioGroups = displayNodes.filter(isDisplayRadioGroupNode)
      expect(radioGroups).toHaveLength(1)
      expect(radioGroups[0].items).toHaveLength(1)
      expect(radioGroups[0].items[0].node.def.value).toBe('contains')
      expect(radioGroups[0].context.breadcrumbs[0].value).toBe('Filters')
      expect(radioGroups[0].context.isDeepSearchResult).toBe(true)
    })
  })
})

// ============================================================================
// Props/Context Structure Tests
// ============================================================================

describe('Render Params Structure', () => {
  it("passes the def's disabled state to the row context", () => {
    const nodes: NodeDef[] = [
      createItemDef('item1', 'Item 1', { disabled: true }),
    ]

    const { displayNodes } = filterNodes({
      query: '',
      nodes: resolve(nodes),
      highlightedId: null,
    })

    // The context should include disabled
    expect(isDisplayRowNode(displayNodes[0])).toBe(true)
    if (isDisplayRowNode(displayNodes[0])) {
      expect(displayNodes[0].context.disabled).toBe(true)
    }
  })

  it('should include search info in context', () => {
    const nodes: NodeDef[] = [createItemDef('item1', 'Test Item')]

    const { displayNodes } = filterNodes({
      query: 'test',
      nodes: resolve(nodes),
      highlightedId: null,
    })

    expect(isDisplayRowNode(displayNodes[0])).toBe(true)
    if (isDisplayRowNode(displayNodes[0])) {
      expect(displayNodes[0].context.search).not.toBeNull()
      expect(displayNodes[0].context.search?.query).toBe('test')
      expect(displayNodes[0].context.search?.score).toBeGreaterThan(0)
    }
  })

  it('should include group info in context for grouped items', () => {
    const nodes: NodeDef[] = [
      createGroupDef('g1', [createItemDef('item1', 'Item 1')], {
        label: 'My Group',
      }),
    ]

    const { displayNodes } = filterNodes({
      query: '',
      nodes: resolve(nodes),
      highlightedId: null,
    })

    expect(isDisplayGroupNode(displayNodes[0])).toBe(true)
    if (isDisplayGroupNode(displayNodes[0])) {
      const item = displayNodes[0].items[0]
      expect(item.context.group?.id).toBe('g1')
      expect(item.context.group?.label).toBe('My Group')
    }
  })
})

// ============================================================================
// RadioGroupSearchBehavior Tests
// ============================================================================

describe('radioGroupSearchBehavior', () => {
  const createThemeRadioGroup = () =>
    createRadioGroupDef(
      'theme',
      'light',
      [
        createRadioItemDef('light', 'Light Theme'),
        createRadioItemDef('dark', 'Dark Theme'),
        createRadioItemDef('system', 'System Default'),
      ],
      { label: 'Theme' },
    )

  const createPriorityRadioGroup = () =>
    createRadioGroupDef(
      'priority',
      'medium',
      [
        createRadioItemDef('low', 'Low Priority'),
        createRadioItemDef('medium', 'Medium Priority'),
        createRadioItemDef('high', 'High Priority'),
      ],
      { label: 'Priority' },
    )

  describe('preserve (default)', () => {
    it('should show only matching items from radio group', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes: resolve(nodes),
        highlightedId: null,
      })

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        expect(displayNodes[0].items).toHaveLength(1)
        expect(displayNodes[0].items[0].node.def.id).toBe('dark')
      }
    })

    it('should show multiple matching items when query matches multiple', () => {
      const nodes: NodeDef[] = [createPriorityRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'priority',
        nodes: resolve(nodes),
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve',
      })

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        // All three items contain "Priority" in their label
        expect(displayNodes[0].items).toHaveLength(3)
      }
    })

    it('should not show radio group if no items match', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'nonexistent',
        nodes: resolve(nodes),
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve',
      })

      expect(displayNodes).toHaveLength(0)
    })
  })

  describe('preserve-show-all', () => {
    it('should show ALL items when ANY item matches', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes: resolve(nodes),
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve-show-all',
      })

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        // Should have all 3 items even though only "dark" matches
        expect(displayNodes[0].items).toHaveLength(3)
        // Matching item should be first (sorted by score)
        expect(displayNodes[0].items[0].node.def.id).toBe('dark')
        expect(displayNodes[0].items[0].context.search?.score).toBeGreaterThan(
          0,
        )
        // Non-matching items should have score 0
        expect(displayNodes[0].items[1].context.search?.score).toBe(0)
        expect(displayNodes[0].items[2].context.search?.score).toBe(0)
      }
    })

    it('should not show radio group if no items match', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'nonexistent',
        nodes: resolve(nodes),
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve-show-all',
      })

      // Even with preserve-show-all, if nothing matches, don't show the group
      expect(displayNodes).toHaveLength(0)
    })

    it('should work with deep search and breadcrumbs', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef('settings', 'Settings', [createThemeRadioGroup()]),
      ]

      const { displayNodes, isDeepSearching } = filterNodes({
        query: 'dark',
        nodes: resolve(nodes),
        highlightedId: null,
        deepSearch: true,
        minLength: 0,
        radioGroupSearchBehavior: 'preserve-show-all',
      })

      expect(isDeepSearching).toBe(true)

      const radioGroups = displayNodes.filter(isDisplayRadioGroupNode)
      expect(radioGroups).toHaveLength(1)
      if (radioGroups[0]) {
        // Should have breadcrumbs
        expect(radioGroups[0].context.breadcrumbs[0].value).toBe('Settings')
        // Should have all 3 items
        expect(radioGroups[0].items).toHaveLength(3)
      }
    })
  })

  describe('flatten', () => {
    it('should show radio items as individual flat items', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes: resolve(nodes),
        highlightedId: null,
        radioGroupSearchBehavior: 'flatten',
      })

      expect(displayNodes).toHaveLength(1)
      // Should be a row node, not a radio group node
      expect(isDisplayRowNode(displayNodes[0])).toBe(true)
      if (isDisplayRowNode(displayNodes[0])) {
        expect(displayNodes[0].node.def.id).toBe('dark')
      }
    })

    it('should show only matching items in flat list', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'theme',
        nodes: resolve(nodes),
        highlightedId: null,
        radioGroupSearchBehavior: 'flatten',
      })

      // Both "Light Theme" and "Dark Theme" match, but not "System Default"
      expect(displayNodes).toHaveLength(2)
      expect(displayNodes.every(isDisplayRowNode)).toBe(true)
    })

    it('should mix flattened radio items with regular items by score', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', 'Toggle dark mode'),
        createThemeRadioGroup(),
      ]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes: resolve(nodes),
        highlightedId: null,
        radioGroupSearchBehavior: 'flatten',
      })

      expect(displayNodes).toHaveLength(2)
      // Both should be row nodes (radio items flattened)
      expect(displayNodes.every(isDisplayRowNode)).toBe(true)
      // The exact radio match outranks the authored-first partial match
      const ids = displayNodes
        .filter(isDisplayRowNode)
        .map((n) => n.node.def.id)
      expect(ids).toEqual(['dark', 'item1'])
    })
  })

  describe('interaction with groupSearchBehavior', () => {
    it('should preserve radio groups even when groupSearchBehavior is flatten', () => {
      const nodes: NodeDef[] = [
        createGroupDef('g1', [
          createItemDef('grouped-item', 'Grouped Dark Item'),
        ]),
        createThemeRadioGroup(),
      ]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes: resolve(nodes),
        highlightedId: null,
        groupSearchBehavior: 'flatten',
      })

      // Group should be flattened (item shown directly)
      // Radio group should be preserved
      const radioGroups = displayNodes.filter(isDisplayRadioGroupNode)
      const rowNodes = displayNodes.filter(isDisplayRowNode)

      expect(radioGroups).toHaveLength(1)
      expect(rowNodes).toHaveLength(1)
      expect(rowNodes[0].node.def.id).toBe('grouped-item')
    })

    it('should flatten both groups and radio groups when both are set to flatten', () => {
      const nodes: NodeDef[] = [
        createGroupDef('g1', [
          createItemDef('grouped-item', 'Grouped Dark Item'),
        ]),
        createThemeRadioGroup(),
      ]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes: resolve(nodes),
        highlightedId: null,
        groupSearchBehavior: 'flatten',
        radioGroupSearchBehavior: 'flatten',
      })

      // Both should be flattened - all row nodes
      expect(displayNodes.every(isDisplayRowNode)).toBe(true)
      expect(displayNodes).toHaveLength(2)
    })
  })

  describe('multiple radio groups', () => {
    it('should handle multiple radio groups independently', () => {
      const nodes: NodeDef[] = [
        createThemeRadioGroup(),
        createPriorityRadioGroup(),
      ]

      const { displayNodes } = filterNodes({
        query: 'high',
        nodes: resolve(nodes),
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve',
      })

      // Only priority radio group should match
      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        expect(displayNodes[0].node.def.id).toBe('priority')
      }
    })

    it('should show all items from matching radio groups with preserve-show-all', () => {
      const nodes: NodeDef[] = [
        createThemeRadioGroup(),
        createPriorityRadioGroup(),
      ]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes: resolve(nodes),
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve-show-all',
      })

      // Only theme radio group matches
      expect(displayNodes).toHaveLength(1)
      const [group] = displayNodes
      expect(group && isDisplayRadioGroupNode(group)).toBe(true)
      if (group && isDisplayRadioGroupNode(group)) {
        expect(group.node.def.id).toBe('theme')
        expect(group.items).toHaveLength(3) // All theme items
      }
    })
  })
})

// ============================================================================
// Mixed Content Tests
// ============================================================================

describe('Mixed Content', () => {
  it('should handle mix of items, checkbox items, and radio groups', () => {
    const nodes: NodeDef[] = [
      createItemDef('item1', 'Regular Item'),
      createCheckboxItemDef('cb1', 'Checkbox Item', true),
      createRadioGroupDef('rg1', 'opt1', [
        createRadioItemDef('opt1', 'Radio Option 1'),
        createRadioItemDef('opt2', 'Radio Option 2'),
      ]),
    ]

    const displayNodes = getBrowseNodesPreserve(resolve(nodes), null)

    expect(displayNodes).toHaveLength(3)
    expect(isDisplayRowNode(displayNodes[0])).toBe(true)
    expect(isDisplayRowNode(displayNodes[1])).toBe(true)
    expect(isDisplayRadioGroupNode(displayNodes[2])).toBe(true)
  })
})

// ============================================================================
// Value Normalization Tests
// ============================================================================

describe('Value Normalization', () => {
  describe('scoreNodes', () => {
    it('should match items with leading/trailing whitespace in value', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', '  Dark Mode  '), // value with whitespace
        createItemDef('item2', 'Light Mode'),
      ]

      const flattened = flattenNodes(resolve(nodes))
      const scored = scoreNodes(flattened, 'dark')
      const [trimmed] = scoreNodes(
        flattenNodes(resolve([createItemDef('item1', 'Dark Mode')])),
        'dark',
      )

      // Scores as if the value had no surrounding whitespace
      expect(scored).toHaveLength(1)
      expect(scored[0].node.def.id).toBe('item1')
      expect(scored[0].score).toBe(trimmed?.score)
    })

    it('should match items with whitespace-only keywords filtered out', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', 'Settings', {
          keywords: ['  ', 'config', '  preferences  '],
        }),
      ]

      const flattened = flattenNodes(resolve(nodes))
      const scored = scoreNodes(flattened, 'preferences')
      const [clean] = scoreNodes(
        flattenNodes(
          resolve([
            createItemDef('item1', 'Settings', {
              keywords: ['config', 'preferences'],
            }),
          ]),
        ),
        'preferences',
      )

      // Scores as if blank keywords were dropped and the rest trimmed
      expect(scored).toHaveLength(1)
      expect(scored[0].score).toBe(clean?.score)
    })
  })

  describe('flattenNodes with breadcrumbs', () => {
    it('should preserve raw values in deeply nested breadcrumbs', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef('sub1', '  Level 1  ', [
          createSubmenuDef('sub2', '  Level 2  ', [
            createItemDef('item1', 'Deep Item'),
          ]),
        ]),
      ]

      const flattened = flattenNodes(resolve(nodes), { deep: true })

      const deepItem = flattened.find((f) => f.node.def.id === 'item1')
      expect(deepItem).toBeDefined()
      // BreadcrumbNode.value preserves raw values; normalization happens via slugify during ID generation
      expect(deepItem?.breadcrumbs.map((b) => b.value)).toEqual([
        '  Level 1  ',
        '  Level 2  ',
      ])
    })

    it('supports includeInDeepSearch="trigger-only" on submenus', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef(
          'settings',
          'Settings',
          [createItemDef('dark-mode', 'Dark Mode')],
          { includeInDeepSearch: 'trigger-only' },
        ),
      ]

      const flattened = flattenNodes(resolve(nodes), { deep: true })

      expect(flattened.map((f) => f.node.def.id)).toEqual(['settings'])
    })

    it('supports includeInDeepSearch=false on submenus', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef(
          'settings',
          'Settings',
          [createItemDef('dark-mode', 'Dark Mode')],
          { includeInDeepSearch: false },
        ),
      ]

      const flattened = flattenNodes(resolve(nodes), { deep: true })

      expect(flattened).toHaveLength(0)
    })

    it('supports includeInDeepSearch="trigger-only" on subpages', () => {
      const nodes: NodeDef[] = [
        createSubpageDef(
          'ai-filter',
          'AI Filter',
          [createItemDef('assigned', 'assigned to me')],
          { includeInDeepSearch: 'trigger-only' },
        ),
      ]

      const flattened = flattenNodes(resolve(nodes), { deep: true })

      expect(flattened.map((f) => f.node.def.id)).toEqual(['ai-filter'])
    })

    it('supports includeInDeepSearch=false on subpages', () => {
      const nodes: NodeDef[] = [
        createSubpageDef(
          'ai-filter',
          'AI Filter',
          [createItemDef('assigned', 'assigned to me')],
          { includeInDeepSearch: false },
        ),
      ]

      const flattened = flattenNodes(resolve(nodes), { deep: true })

      expect(flattened).toHaveLength(0)
    })

    it('allows submenu override of Surface includeInDeepSearch default', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef('overridden', 'Overridden', [
          createItemDef('item-1', 'Item 1'),
        ]),
        createSubmenuDef('defaulted', 'Defaulted', [
          createItemDef('item-2', 'Item 2'),
        ]),
      ]

      const flattened = flattenNodes(resolve(nodes), {
        deep: true,
        includeInDeepSearch: 'trigger-only',
      })

      expect(flattened.map((f) => f.node.def.id)).toEqual([
        'overridden',
        'defaulted',
      ])

      const withOverride = flattenNodes(
        resolve([
          createSubmenuDef(
            'overridden',
            'Overridden',
            [createItemDef('item-1', 'Item 1')],
            { includeInDeepSearch: true },
          ),
          createSubmenuDef('defaulted', 'Defaulted', [
            createItemDef('item-2', 'Item 2'),
          ]),
        ]),
        {
          deep: true,
          includeInDeepSearch: 'trigger-only',
        },
      )

      expect(withOverride.map((f) => f.node.def.id)).toEqual([
        'overridden',
        'item-1',
        'defaulted',
      ])
    })

    it('hard-stops descendants when ancestor is trigger-only', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef(
          'parent',
          'Parent',
          [
            createSubmenuDef(
              'child',
              'Child',
              [createItemDef('leaf', 'Leaf')],
              { includeInDeepSearch: true },
            ),
          ],
          { includeInDeepSearch: 'trigger-only' },
        ),
      ]

      const flattened = flattenNodes(resolve(nodes), { deep: true })

      expect(flattened.map((f) => f.node.def.id)).toEqual(['parent'])
    })

    it('collectAsyncSubmenus only collects submenus with row inclusion', () => {
      const asyncConfig = {
        type: 'static' as const,
        Loader: () => null,
      }

      const nodes: NodeDef[] = [
        createSubmenuDef('included', 'Included', [], {
          asyncNodes: asyncConfig,
          includeInDeepSearch: true,
        }),
        createSubmenuDef('trigger-only', 'Trigger Only', [], {
          asyncNodes: asyncConfig,
          includeInDeepSearch: 'trigger-only',
        }),
        createSubmenuDef('excluded', 'Excluded', [], {
          asyncNodes: asyncConfig,
          includeInDeepSearch: false,
        }),
      ]

      const resolver = createMenuTreeResolver()
      resolver.setContent(nodes)
      const collected = collectAsyncSubmenus(resolver.rootNodes)

      expect(collected.map((entry) => entry.node.def.value)).toEqual([
        'Included',
      ])
      expect(collected[0].id).toBe(resolver.getNodeForDef(nodes[0])!.id)
    })

    it('collectAsyncSubmenus excludes disabled branches when configured', () => {
      const asyncConfig = { type: 'static' as const, Loader: () => null }
      const nodes: NodeDef[] = [
        createSubmenuDef('disabled', 'Disabled', [], {
          asyncNodes: asyncConfig,
          disabled: true,
        }),
      ]
      const resolver = createMenuTreeResolver()
      resolver.setContent(nodes)
      expect(
        collectAsyncSubmenus(resolver.rootNodes, true, true, 'inherit'),
      ).toHaveLength(1)
      expect(
        collectAsyncSubmenus(resolver.rootNodes, true, true, 'exclude'),
      ).toHaveLength(0)
      expect(collectAsyncSubmenus(resolver.rootNodes)).toHaveLength(0)
    })

    it('collectAsyncSubmenus respects ancestor trigger-only hard stop', () => {
      const asyncConfig = {
        type: 'static' as const,
        Loader: () => null,
      }

      const nodes: NodeDef[] = [
        createSubmenuDef(
          'parent',
          'Parent',
          [
            createSubmenuDef('child', 'Child', [], {
              asyncNodes: asyncConfig,
              includeInDeepSearch: true,
            }),
          ],
          {
            includeInDeepSearch: 'trigger-only',
          },
        ),
      ]

      const resolver = createMenuTreeResolver()
      resolver.setContent(nodes)
      const collected = collectAsyncSubmenus(resolver.rootNodes)

      expect(collected).toHaveLength(0)
    })
  })
})

// ============================================================================
// Forced Sorting Tests
// ============================================================================

describe('Forced sorting overrides', () => {
  it('scoreNodes uses forceScore to include non-matching rows', () => {
    const nodes: NodeDef[] = [
      createItemDef('pinned', 'Pinned row', { forceScore: 5 }),
      createItemDef('regular', 'Regular row'),
    ]

    const flattened = flattenNodes(resolve(nodes))
    const scored = scoreNodes(flattened, 'zzzz')

    expect(scored).toHaveLength(1)
    expect(scored[0].node.def.id).toBe('pinned')
    expect(scored[0].score).toBe(5)
  })
})

describe('Menu Node pipeline', () => {
  it('deep search sees rows grafted under a branch below a group', () => {
    const submenu = createSubmenuDef('status', 'Status', [])
    const group = createGroupDef('filters', [submenu])
    const resolver = createMenuTreeResolver()
    resolver.setContent([group])
    const submenuNode = resolver.rootNodes[0]!.children[0]!

    resolver.graft(submenuNode, [createItemDef('grafted', 'Grafted')])

    const { displayNodes } = filterNodes({
      query: 'graft',
      nodes: resolver.rootNodes,
      highlightedId: null,
      deepSearch: true,
    })
    const rowNodes = displayNodes.filter(isDisplayRowNode)

    expect(rowNodes).toHaveLength(1)
    expect(rowNodes[0]!.node.def.value).toBe('Grafted')
    expect(rowNodes[0]!.context.breadcrumbs[0]!.menuNode).toBe(submenuNode)
  })
})

describe('deduplicateNodes', () => {
  it('keeps same-value rows that a custom getResolvedId distinguishes', () => {
    const first = {
      kind: 'item',
      value: 'Backlog',
      render: () => null,
    } as ItemDef
    const second = {
      kind: 'item',
      value: 'Backlog',
      render: () => null,
    } as ItemDef
    const resolver = createMenuTreeResolver({
      getResolvedId: (node) =>
        node.def.id ?? `${node.definitionKey}-${node.index}`,
    })
    resolver.setContent([createSubmenuDef('status', 'Status', [first, second])])

    const { displayNodes } = filterNodes({
      query: 'backlog',
      nodes: resolver.rootNodes,
      highlightedId: null,
      deepSearch: true,
      groupSearchBehavior: 'flatten',
    })
    const rows = displayNodes.filter(isDisplayRowNode)

    expect(rows.map((row) => row.node.def)).toEqual([first, second])
    expect(new Set(rows.map((row) => row.node.id)).size).toBe(2)
  })

  it('collapses a loader-repeated def', () => {
    const item = createItemDef('backlog', 'Backlog')
    const resolver = createMenuTreeResolver()
    resolver.setContent([createSubmenuDef('status', 'Status', [item])])
    const submenuNode = resolver.rootNodes[0]!

    resolver.graft(submenuNode, [item, item])
    // Dedup runs in the flatten search path (its only call site).
    const { displayNodes } = filterNodes({
      query: 'backlog',
      nodes: resolver.rootNodes,
      highlightedId: null,
      deepSearch: true,
      groupSearchBehavior: 'flatten',
    })
    const rows = displayNodes.filter(isDisplayRowNode)

    expect(rows).toHaveLength(1)
    expect(rows[0]!.node.def).toBe(item)
  })
})

describe('Disabled branch inheritance in deep search', () => {
  function searchRows(
    nodes: NodeDef[],
    query: string,
    extra: Partial<Parameters<typeof filterNodes>[0]> = {},
  ) {
    const { displayNodes } = filterNodes({
      query,
      nodes: resolve(nodes),
      highlightedId: null,
      deepSearch: true,
      minLength: 0,
      ...extra,
    })
    return displayNodes.filter(isDisplayRowNode)
  }

  it('inherits disabled from a disabled submenu', () => {
    const edit = createItemDef('edit', 'Edit form')
    const rows = searchRows(
      [createSubmenuDef('actions', 'Actions', [edit], { disabled: true })],
      'edit',
      { disabledBranchBehavior: 'inherit' },
    )

    expect(rows).toHaveLength(1)
    expect(rows[0]!.context.disabled).toBe(true)
    expect(rows[0]!.node.def.disabled).toBeUndefined()
  })

  it('inherits disabled from a disabled subpage', () => {
    const edit = createItemDef('edit', 'Edit form')
    const rows = searchRows(
      [createSubpageDef('actions', 'Actions', [edit], { disabled: true })],
      'edit',
      { disabledBranchBehavior: 'inherit' },
    )

    expect(rows).toHaveLength(1)
    expect(rows[0]!.context.disabled).toBe(true)
    expect(rows[0]!.node.def.disabled).toBeUndefined()
  })

  it('inherits disabled through nested branches without affecting siblings', () => {
    const rows = searchRows(
      [
        createSubmenuDef('actions', 'Actions', [
          createSubmenuDef(
            'disabled',
            'Disabled',
            [createItemDef('edit', 'Edit form')],
            { disabled: true },
          ),
          createItemDef('sibling', 'Edit sibling'),
        ]),
      ],
      'edit',
      { disabledBranchBehavior: 'inherit' },
    )

    expect(rows).toHaveLength(2)
    expect(
      rows.find((row) => row.node.def.id === 'edit')!.context.disabled,
    ).toBe(true)
    expect(
      rows.find((row) => row.node.def.id === 'sibling')!.context.disabled,
    ).toBe(false)
  })

  it('keeps descendants of enabled branches enabled', () => {
    const rows = searchRows(
      [
        createSubmenuDef('actions', 'Actions', [
          createItemDef('edit', 'Edit form'),
        ]),
      ],
      'edit',
    )

    expect(rows).toHaveLength(1)
    expect(rows[0]!.context.disabled).toBe(false)
  })

  it('does not search descendants of hidden branches', () => {
    const rows = searchRows(
      [
        createSubmenuDef(
          'actions',
          'Actions',
          [createItemDef('edit', 'Edit form')],
          { hidden: true },
        ),
      ],
      'edit',
    )

    expect(rows).toHaveLength(0)
  })

  it('exclude drops descendants of a disabled submenu but keeps its trigger', () => {
    const nodes = [
      createSubmenuDef(
        'actions',
        'Actions',
        [createItemDef('edit', 'Edit form')],
        { disabled: true },
      ),
    ]

    expect(
      searchRows(nodes, 'edit', { disabledBranchBehavior: 'exclude' }),
    ).toHaveLength(0)
    const rows = searchRows(nodes, 'actions', {
      disabledBranchBehavior: 'exclude',
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]!.node.def.id).toBe('actions')
    expect(rows[0]!.context.disabled).toBe(true)
  })

  it('exclude drops descendants of a disabled subpage but keeps its trigger', () => {
    const nodes = [
      createSubpageDef(
        'actions',
        'Actions',
        [createItemDef('edit', 'Edit form')],
        { disabled: true },
      ),
    ]

    expect(
      searchRows(nodes, 'edit', { disabledBranchBehavior: 'exclude' }),
    ).toHaveLength(0)
    const rows = searchRows(nodes, 'actions', {
      disabledBranchBehavior: 'exclude',
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]!.node.def.id).toBe('actions')
    expect(rows[0]!.context.disabled).toBe(true)
  })

  it('explicit includeInDeepSearch on the def overrides exclude', () => {
    const nodes = [
      createSubmenuDef(
        'actions',
        'Actions',
        [createItemDef('edit', 'Edit form')],
        { disabled: true, includeInDeepSearch: true },
      ),
    ]

    const rows = searchRows(nodes, 'edit', {
      disabledBranchBehavior: 'exclude',
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]!.context.disabled).toBe(true)
  })
})
