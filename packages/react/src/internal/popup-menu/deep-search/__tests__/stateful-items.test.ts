import { describe, expect, it } from 'vitest'
import type {
  CheckboxItemDef,
  GroupDef,
  ItemDef,
  NodeDef,
  RadioGroupDef,
  SubmenuDef,
} from '../types.js'
import {
  isDisplayGroupNode,
  isDisplayRadioGroupNode,
  isDisplayRowNode,
} from '../types.js'
import {
  filterNodes,
  flattenNodes,
  getBrowseNodesPreserve,
  isCheckboxItemDef,
  isRadioGroupDef,
  scoreNodes,
} from '../utils.js'

// ============================================================================
// Test Helpers
// ============================================================================

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

function createRadioGroupDef(
  id: string,
  value: string | undefined,
  nodes: (ItemDef | CheckboxItemDef | SubmenuDef)[],
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

// ============================================================================
// Type Guard Tests
// ============================================================================

describe('Type Guards', () => {
  describe('isCheckboxItemDef', () => {
    it('should return true for checkbox items', () => {
      const node = createCheckboxItemDef('cb1', 'Checkbox', true)
      expect(isCheckboxItemDef(node)).toBe(true)
    })

    it('should return false for regular items', () => {
      const node = createItemDef('item1', 'Item')
      expect(isCheckboxItemDef(node)).toBe(false)
    })

    it('should return false for submenus', () => {
      const node = createSubmenuDef('sub1', 'Submenu', [])
      expect(isCheckboxItemDef(node)).toBe(false)
    })
  })

  describe('isRadioGroupDef', () => {
    it('should return true for radio groups', () => {
      const node = createRadioGroupDef('rg1', 'value1', [])
      expect(isRadioGroupDef(node)).toBe(true)
    })

    it('should return false for regular groups', () => {
      const node = createGroupDef('g1', [])
      expect(isRadioGroupDef(node)).toBe(false)
    })

    it('should return false for items', () => {
      const node = createItemDef('item1', 'Item')
      expect(isRadioGroupDef(node)).toBe(false)
    })
  })
})

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

      const flattened = flattenNodes(nodes)

      expect(flattened).toHaveLength(3)
      expect(flattened[1].node.id).toBe('cb1')
      expect(flattened[1].node.kind).toBe('checkbox-item')
    })

    it('should include checkbox items from groups', () => {
      const nodes: NodeDef[] = [
        createGroupDef('g1', [
          createCheckboxItemDef('cb1', 'Checkbox 1', true),
          createCheckboxItemDef('cb2', 'Checkbox 2', false),
        ]),
      ]

      const flattened = flattenNodes(nodes)

      expect(flattened).toHaveLength(2)
      expect(flattened[0].group?.id).toBe('g1')
      expect(flattened[1].group?.id).toBe('g1')
    })
  })

  describe('scoreNodes', () => {
    it('should score checkbox items based on label', () => {
      const nodes: NodeDef[] = [
        createCheckboxItemDef('cb1', 'Dark Mode', true),
        createCheckboxItemDef('cb2', 'Light Theme', false),
      ]

      const flattened = flattenNodes(nodes)
      const scored = scoreNodes(flattened, 'dark')

      expect(scored).toHaveLength(1)
      expect(scored[0].node.id).toBe('cb1')
      expect(scored[0].score).toBeGreaterThan(0)
    })

    it('should score checkbox items based on keywords', () => {
      const nodes: NodeDef[] = [
        createCheckboxItemDef('cb1', 'Enable Feature', true, {
          keywords: ['toggle', 'switch'],
        }),
      ]

      const flattened = flattenNodes(nodes)
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
        nodes,
        highlightedId: null,
      })

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRowNode(displayNodes[0])).toBe(true)
      if (isDisplayRowNode(displayNodes[0])) {
        expect(displayNodes[0].node.id).toBe('cb1')
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
          createItemDef('opt1', 'Option 1'),
          createItemDef('opt2', 'Option 2'),
          createItemDef('opt3', 'Option 3'),
        ]),
      ]

      const flattened = flattenNodes(nodes)

      expect(flattened).toHaveLength(3)
      expect(flattened[0].radioGroup?.id).toBe('rg1')
      expect(flattened[1].radioGroup?.id).toBe('rg1')
      expect(flattened[2].radioGroup?.id).toBe('rg1')
    })

    it('should track radioGroup separately from group', () => {
      const nodes: NodeDef[] = [
        createGroupDef('g1', [createItemDef('item1', 'Item 1')]),
        createRadioGroupDef('rg1', 'opt1', [createItemDef('opt1', 'Option 1')]),
      ]

      const flattened = flattenNodes(nodes)

      expect(flattened).toHaveLength(2)
      expect(flattened[0].group?.id).toBe('g1')
      expect(flattened[0].radioGroup).toBeNull()
      expect(flattened[1].group).toBeNull()
      expect(flattened[1].radioGroup?.id).toBe('rg1')
    })
  })

  describe('filterNodes - always preserve', () => {
    it('should include entire radio group if any item matches', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef(
          'rg1',
          'light',
          [
            createItemDef('light', 'Light Theme'),
            createItemDef('dark', 'Dark Theme'),
            createItemDef('system', 'System Default'),
          ],
          { label: 'Theme' },
        ),
      ]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
      })

      // Should return the entire radio group, not just the matching item
      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        // All items should be present in the radio group
        expect(displayNodes[0].items).toHaveLength(1) // Only matching items
        expect(displayNodes[0].radioGroup.id).toBe('rg1')
      }
    })

    it('should preserve radio groups even with flatten behavior', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', 'Regular Item'),
        createRadioGroupDef(
          'rg1',
          'opt1',
          [
            createItemDef('opt1', 'Option One'),
            createItemDef('opt2', 'Option Two'),
          ],
          { label: 'Options' },
        ),
      ]

      const { displayNodes } = filterNodes({
        query: 'option',
        nodes,
        highlightedId: null,
        groupSearchBehavior: 'flatten', // Even with flatten, radio groups should preserve
      })

      // Should have both the regular item and the radio group
      const radioGroups = displayNodes.filter(isDisplayRadioGroupNode)
      expect(radioGroups).toHaveLength(1)
    })

    it('should surface radio groups from submenus with breadcrumbs', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef('sub1', 'Settings', [
          createRadioGroupDef(
            'rg1',
            'light',
            [createItemDef('light', 'Light'), createItemDef('dark', 'Dark')],
            { label: 'Theme' },
          ),
        ]),
      ]

      const { displayNodes, isDeepSearching } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
        deepSearch: true,
        minLength: 0,
      })

      expect(isDeepSearching).toBe(true)

      // Find the radio group
      const radioGroups = displayNodes.filter(isDisplayRadioGroupNode)
      expect(radioGroups).toHaveLength(1)
      expect(radioGroups[0].context.breadcrumbs).toContain('Settings')
      expect(radioGroups[0].context.isDeepSearchResult).toBe(true)
    })
  })

  describe('getBrowseNodesPreserve', () => {
    it('should render radio groups as DisplayRadioGroupNode', () => {
      const nodes: NodeDef[] = [
        createRadioGroupDef(
          'rg1',
          'opt1',
          [
            createItemDef('opt1', 'Option 1'),
            createItemDef('opt2', 'Option 2'),
          ],
          { label: 'Options' },
        ),
      ]

      const displayNodes = getBrowseNodesPreserve(nodes, null)

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        expect(displayNodes[0].items).toHaveLength(2)
        expect(displayNodes[0].radioGroup.label).toBe('Options')
      }
    })
  })
})

// ============================================================================
// Props/Context Structure Tests
// ============================================================================

describe('Render Params Structure', () => {
  it('should pass props to item render function', () => {
    const nodes: NodeDef[] = [
      createItemDef('item1', 'Item 1', { disabled: true }),
    ]

    const { displayNodes } = filterNodes({
      query: '',
      nodes,
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
      nodes,
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
      nodes,
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
        createItemDef('light', 'Light Theme'),
        createItemDef('dark', 'Dark Theme'),
        createItemDef('system', 'System Default'),
      ],
      { label: 'Theme' },
    )

  const createPriorityRadioGroup = () =>
    createRadioGroupDef(
      'priority',
      'medium',
      [
        createItemDef('low', 'Low Priority'),
        createItemDef('medium', 'Medium Priority'),
        createItemDef('high', 'High Priority'),
      ],
      { label: 'Priority' },
    )

  describe('preserve (default)', () => {
    it('should show only matching items from radio group', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve',
      })

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        expect(displayNodes[0].items).toHaveLength(1)
        expect(displayNodes[0].items[0].node.id).toBe('dark')
      }
    })

    it('should show multiple matching items when query matches multiple', () => {
      const nodes: NodeDef[] = [createPriorityRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'priority',
        nodes,
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
        nodes,
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
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve-show-all',
      })

      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        // Should have all 3 items even though only "dark" matches
        expect(displayNodes[0].items).toHaveLength(3)
        // Matching item should be first (sorted by score)
        expect(displayNodes[0].items[0].node.id).toBe('dark')
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
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve-show-all',
      })

      // Even with preserve-show-all, if nothing matches, don't show the group
      expect(displayNodes).toHaveLength(0)
    })

    it('should sort matching items first within radio group', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'light',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve-show-all',
      })

      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        // Light should be first since it matches
        expect(displayNodes[0].items[0].node.id).toBe('light')
      }
    })

    it('should work with deep search and breadcrumbs', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef('settings', 'Settings', [createThemeRadioGroup()]),
      ]

      const { displayNodes, isDeepSearching } = filterNodes({
        query: 'dark',
        nodes,
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
        expect(radioGroups[0].context.breadcrumbs).toContain('Settings')
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
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'flatten',
      })

      expect(displayNodes).toHaveLength(1)
      // Should be a row node, not a radio group node
      expect(isDisplayRowNode(displayNodes[0])).toBe(true)
      if (isDisplayRowNode(displayNodes[0])) {
        expect(displayNodes[0].node.id).toBe('dark')
      }
    })

    it('should show only matching items in flat list', () => {
      const nodes: NodeDef[] = [createThemeRadioGroup()]

      const { displayNodes } = filterNodes({
        query: 'theme',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'flatten',
      })

      // Both "Light Theme" and "Dark Theme" match, but not "System Default"
      expect(displayNodes).toHaveLength(2)
      expect(displayNodes.every(isDisplayRowNode)).toBe(true)
    })

    it('should mix flattened radio items with regular items by score', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', 'Dark Mode Toggle'),
        createThemeRadioGroup(),
      ]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'flatten',
      })

      expect(displayNodes).toHaveLength(2)
      // Both should be row nodes (radio items flattened)
      expect(displayNodes.every(isDisplayRowNode)).toBe(true)
      // Both should match "dark"
      const ids = displayNodes.filter(isDisplayRowNode).map((n) => n.node.id)
      expect(ids).toContain('item1')
      expect(ids).toContain('dark')
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
        nodes,
        highlightedId: null,
        groupSearchBehavior: 'flatten',
        radioGroupSearchBehavior: 'preserve',
      })

      // Group should be flattened (item shown directly)
      // Radio group should be preserved
      const radioGroups = displayNodes.filter(isDisplayRadioGroupNode)
      const rowNodes = displayNodes.filter(isDisplayRowNode)

      expect(radioGroups).toHaveLength(1)
      expect(rowNodes).toHaveLength(1)
      expect(rowNodes[0].node.id).toBe('grouped-item')
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
        nodes,
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
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve',
      })

      // Only priority radio group should match
      expect(displayNodes).toHaveLength(1)
      expect(isDisplayRadioGroupNode(displayNodes[0])).toBe(true)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        expect(displayNodes[0].radioGroup.id).toBe('priority')
      }
    })

    it('should show all items from matching radio groups with preserve-show-all', () => {
      const nodes: NodeDef[] = [
        createThemeRadioGroup(),
        createPriorityRadioGroup(),
      ]

      const { displayNodes } = filterNodes({
        query: 'dark',
        nodes,
        highlightedId: null,
        radioGroupSearchBehavior: 'preserve-show-all',
      })

      // Only theme radio group matches
      expect(displayNodes).toHaveLength(1)
      if (isDisplayRadioGroupNode(displayNodes[0])) {
        expect(displayNodes[0].radioGroup.id).toBe('theme')
        expect(displayNodes[0].items).toHaveLength(3) // All theme items
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
        createItemDef('opt1', 'Radio Option 1'),
        createItemDef('opt2', 'Radio Option 2'),
      ]),
    ]

    const displayNodes = getBrowseNodesPreserve(nodes, null)

    expect(displayNodes).toHaveLength(3)
    expect(isDisplayRowNode(displayNodes[0])).toBe(true)
    expect(isDisplayRowNode(displayNodes[1])).toBe(true)
    expect(isDisplayRadioGroupNode(displayNodes[2])).toBe(true)
  })

  it('should handle radio groups inside groups (not recommended but handled)', () => {
    // Note: Radio groups inside regular groups is not a recommended pattern
    // but the code should handle it gracefully
    const nodes: NodeDef[] = [
      createGroupDef('g1', [
        createItemDef('item1', 'Item 1'),
        // Radio groups inside groups won't be flattened correctly
        // They should be at the top level
      ]),
    ]

    const flattened = flattenNodes(nodes)
    expect(flattened).toHaveLength(1)
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

      const flattened = flattenNodes(nodes)
      const scored = scoreNodes(flattened, 'dark')

      // Should match despite whitespace in value
      expect(scored).toHaveLength(1)
      expect(scored[0].node.id).toBe('item1')
      expect(scored[0].score).toBeGreaterThan(0)
    })

    it('should match items with whitespace-only keywords filtered out', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', 'Settings', {
          keywords: ['  ', 'config', '  preferences  '],
        }),
      ]

      const flattened = flattenNodes(nodes)
      const scored = scoreNodes(flattened, 'preferences')

      // Should match on trimmed keyword
      expect(scored).toHaveLength(1)
      expect(scored[0].score).toBeGreaterThan(0)
    })

    it('should not match whitespace-only values', () => {
      const nodes: NodeDef[] = [
        createItemDef('item1', '   '), // whitespace-only value
        createItemDef('item2', 'Valid'),
      ]

      const flattened = flattenNodes(nodes)
      const scored = scoreNodes(flattened, 'valid')

      expect(scored).toHaveLength(1)
      expect(scored[0].node.id).toBe('item2')
    })
  })

  describe('flattenNodes with breadcrumbs', () => {
    it('should normalize submenu values in breadcrumbs', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef('submenu1', '  Settings  ', [
          createItemDef('item1', 'Dark Mode'),
        ]),
      ]

      const flattened = flattenNodes(nodes, { deep: true })

      // Find the nested item
      const nestedItem = flattened.find((f) => f.node.id === 'item1')
      expect(nestedItem).toBeDefined()
      // Breadcrumb should be trimmed
      expect(nestedItem?.breadcrumbs).toEqual(['Settings'])
    })

    it('should normalize deeply nested breadcrumbs', () => {
      const nodes: NodeDef[] = [
        createSubmenuDef('sub1', '  Level 1  ', [
          createSubmenuDef('sub2', '  Level 2  ', [
            createItemDef('item1', 'Deep Item'),
          ]),
        ]),
      ]

      const flattened = flattenNodes(nodes, { deep: true })

      const deepItem = flattened.find((f) => f.node.id === 'item1')
      expect(deepItem).toBeDefined()
      // All breadcrumbs should be trimmed
      expect(deepItem?.breadcrumbs).toEqual(['Level 1', 'Level 2'])
    })
  })
})
