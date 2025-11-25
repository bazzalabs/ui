import { describe, expect, it, vi } from 'vitest'
import { stickyRows } from '../middleware/sticky-rows.js'
import type {
  BeforeFilterContext,
  TransformNodesContext,
} from '../middleware/types.js'
import type { CheckboxItemNode, Node } from '../types.js'

describe('stickyRows middleware', () => {
  const createCheckboxNode = (
    id: string,
    label: string,
    checked: boolean,
  ): CheckboxItemNode => ({
    kind: 'item',
    variant: 'checkbox',
    id,
    label,
    checked,
    onCheckedChange: vi.fn(),
    parent: {} as any,
    def: {} as any,
  })

  const createButtonNode = (id: string, label: string): Node => ({
    kind: 'item',
    variant: 'button',
    id,
    label,
    parent: {} as any,
    def: {} as any,
  })

  const createMockBeforeFilterContext = (
    nodes: Node[],
    isOpen = true,
  ): BeforeFilterContext => ({
    nodes,
    query: '',
    menu: {
      kind: 'menu',
      id: 'test-menu',
      open: {
        value: isOpen,
        onValueChange: vi.fn(),
      },
    } as any,
  })

  const createMockTransformContext = (
    nodes: Node[],
  ): TransformNodesContext => ({
    nodes,
    query: '',
    mode: 'browse',
    allNodes: nodes,
    menu: {} as any,
    createNode: vi.fn((def) => ({ ...def, parent: {} }) as any),
    hasExactMatch: vi.fn(() => false),
  })

  describe('Basic functionality', () => {
    it('should move checked items to the top when menu opens', () => {
      const middleware = stickyRows()

      const nodes = [
        createCheckboxNode('a', 'Option A', false),
        createCheckboxNode('b', 'Option B', true),
        createCheckboxNode('c', 'Option C', false),
        createCheckboxNode('d', 'Option D', true),
      ]

      // Simulate menu opening
      const beforeContext = createMockBeforeFilterContext(nodes, true)
      middleware.beforeFilter!(beforeContext)

      // Transform nodes
      const transformContext = createMockTransformContext(nodes)
      const result = middleware.transformNodes!(transformContext)

      expect(result.map((n) => n.id)).toEqual(['b', 'd', 'a', 'c'])
    })

    it('should maintain original order within checked and unchecked groups', () => {
      const middleware = stickyRows()

      const nodes = [
        createCheckboxNode('a', 'Option A', false),
        createCheckboxNode('b', 'Option B', false),
        createCheckboxNode('c', 'Option C', true),
        createCheckboxNode('d', 'Option D', true),
        createCheckboxNode('e', 'Option E', false),
      ]

      // Simulate menu opening
      const beforeContext = createMockBeforeFilterContext(nodes, true)
      middleware.beforeFilter!(beforeContext)

      // Transform nodes
      const transformContext = createMockTransformContext(nodes)
      const result = middleware.transformNodes!(transformContext)

      // c and d were checked, should come first in original order
      // a, b, e were unchecked, should come after in original order
      expect(result.map((n) => n.id)).toEqual(['c', 'd', 'a', 'b', 'e'])
    })

    it('should not reorder when all items are unchecked', () => {
      const middleware = stickyRows()

      const nodes = [
        createCheckboxNode('a', 'Option A', false),
        createCheckboxNode('b', 'Option B', false),
        createCheckboxNode('c', 'Option C', false),
      ]

      // Simulate menu opening
      const beforeContext = createMockBeforeFilterContext(nodes, true)
      middleware.beforeFilter!(beforeContext)

      // Transform nodes
      const transformContext = createMockTransformContext(nodes)
      const result = middleware.transformNodes!(transformContext)

      expect(result.map((n) => n.id)).toEqual(['a', 'b', 'c'])
    })

    it('should not reorder when all items are checked', () => {
      const middleware = stickyRows()

      const nodes = [
        createCheckboxNode('a', 'Option A', true),
        createCheckboxNode('b', 'Option B', true),
        createCheckboxNode('c', 'Option C', true),
      ]

      // Simulate menu opening
      const beforeContext = createMockBeforeFilterContext(nodes, true)
      middleware.beforeFilter!(beforeContext)

      // Transform nodes
      const transformContext = createMockTransformContext(nodes)
      const result = middleware.transformNodes!(transformContext)

      expect(result.map((n) => n.id)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('Sticky behavior (no reordering while open)', () => {
    it('should NOT reorder items when checked state changes while menu is open', () => {
      const middleware = stickyRows()

      const nodes = [
        createCheckboxNode('a', 'Option A', false),
        createCheckboxNode('b', 'Option B', true),
        createCheckboxNode('c', 'Option C', false),
      ]

      // Simulate menu opening
      const beforeContext = createMockBeforeFilterContext(nodes, true)
      middleware.beforeFilter!(beforeContext)

      // Initial transform: b should be first
      const transformContext1 = createMockTransformContext(nodes)
      const result1 = middleware.transformNodes!(transformContext1)
      expect(result1.map((n) => n.id)).toEqual(['b', 'a', 'c'])

      // Now simulate user checking 'a' (while menu is still open)
      const updatedNodes = [
        createCheckboxNode('a', 'Option A', true), // Now checked!
        createCheckboxNode('b', 'Option B', true),
        createCheckboxNode('c', 'Option C', false),
      ]

      // Transform again - order should NOT change despite 'a' being checked
      const transformContext2 = createMockTransformContext(updatedNodes)
      const result2 = middleware.transformNodes!(transformContext2)
      expect(result2.map((n) => n.id)).toEqual(['b', 'a', 'c']) // Same order!
    })

    it('should NOT reorder items when unchecked while menu is open', () => {
      const middleware = stickyRows()

      const nodes = [
        createCheckboxNode('a', 'Option A', false),
        createCheckboxNode('b', 'Option B', true),
        createCheckboxNode('c', 'Option C', true),
      ]

      // Simulate menu opening
      const beforeContext = createMockBeforeFilterContext(nodes, true)
      middleware.beforeFilter!(beforeContext)

      // Initial transform
      const transformContext1 = createMockTransformContext(nodes)
      const result1 = middleware.transformNodes!(transformContext1)
      expect(result1.map((n) => n.id)).toEqual(['b', 'c', 'a'])

      // Now simulate user unchecking 'b' (while menu is still open)
      const updatedNodes = [
        createCheckboxNode('a', 'Option A', false),
        createCheckboxNode('b', 'Option B', false), // Now unchecked!
        createCheckboxNode('c', 'Option C', true),
      ]

      // Transform again - order should NOT change
      const transformContext2 = createMockTransformContext(updatedNodes)
      const result2 = middleware.transformNodes!(transformContext2)
      expect(result2.map((n) => n.id)).toEqual(['b', 'c', 'a']) // Same order!
    })
  })

  describe('Menu open/close lifecycle', () => {
    it('should recalculate order when menu closes and reopens', () => {
      const middleware = stickyRows()

      // First open
      const nodes1 = [
        createCheckboxNode('a', 'Option A', false),
        createCheckboxNode('b', 'Option B', true),
        createCheckboxNode('c', 'Option C', false),
      ]

      // Open menu
      middleware.beforeFilter!(createMockBeforeFilterContext(nodes1, true))
      const result1 = middleware.transformNodes!(
        createMockTransformContext(nodes1),
      )
      expect(result1.map((n) => n.id)).toEqual(['b', 'a', 'c'])

      // Close menu
      middleware.beforeFilter!(createMockBeforeFilterContext(nodes1, false))

      // Reopen menu with different checked state
      const nodes2 = [
        createCheckboxNode('a', 'Option A', true), // Now checked
        createCheckboxNode('b', 'Option B', false), // Now unchecked
        createCheckboxNode('c', 'Option C', false),
      ]

      middleware.beforeFilter!(createMockBeforeFilterContext(nodes2, true))
      const result2 = middleware.transformNodes!(
        createMockTransformContext(nodes2),
      )
      expect(result2.map((n) => n.id)).toEqual(['a', 'b', 'c']) // New order!
    })

    it('should handle menu that starts closed', () => {
      const middleware = stickyRows()

      const nodes = [
        createCheckboxNode('a', 'Option A', false),
        createCheckboxNode('b', 'Option B', true),
      ]

      // Menu is closed initially
      middleware.beforeFilter!(createMockBeforeFilterContext(nodes, false))

      // Transform should return nodes as-is (no initial state captured)
      const result = middleware.transformNodes!(
        createMockTransformContext(nodes),
      )
      expect(result.map((n) => n.id)).toEqual(['a', 'b'])
    })
  })

  describe('Mixed node types', () => {
    it('should handle mix of checkbox and button items', () => {
      const middleware = stickyRows()

      const nodes = [
        createCheckboxNode('a', 'Option A', false),
        createButtonNode('b', 'Button B'),
        createCheckboxNode('c', 'Option C', true),
        createButtonNode('d', 'Button D'),
      ]

      // Simulate menu opening
      middleware.beforeFilter!(createMockBeforeFilterContext(nodes, true))

      // Transform nodes
      const result = middleware.transformNodes!(
        createMockTransformContext(nodes),
      )

      // Checked checkbox items first, then everything else in original order
      expect(result.map((n) => n.id)).toEqual(['c', 'a', 'b', 'd'])
    })

    it('should treat non-checkbox items as unchecked', () => {
      const middleware = stickyRows()

      const nodes = [
        createButtonNode('a', 'Button A'),
        createCheckboxNode('b', 'Option B', true),
        createButtonNode('c', 'Button C'),
      ]

      // Simulate menu opening
      middleware.beforeFilter!(createMockBeforeFilterContext(nodes, true))

      // Transform nodes
      const result = middleware.transformNodes!(
        createMockTransformContext(nodes),
      )

      // Only checkbox 'b' is in the checked group
      expect(result.map((n) => n.id)).toEqual(['b', 'a', 'c'])
    })
  })

  describe('Custom sorting', () => {
    it('should use custom sort for checked items', () => {
      const middleware = stickyRows({
        sortChecked: (a, b) => {
          const aLabel = (a as any).label ?? ''
          const bLabel = (b as any).label ?? ''
          return aLabel.localeCompare(bLabel)
        },
      })

      const nodes = [
        createCheckboxNode('a', 'Zebra', true),
        createCheckboxNode('b', 'Apple', true),
        createCheckboxNode('c', 'Mango', true),
      ]

      // Simulate menu opening
      middleware.beforeFilter!(createMockBeforeFilterContext(nodes, true))

      // Transform nodes
      const result = middleware.transformNodes!(
        createMockTransformContext(nodes),
      )

      // Should be sorted alphabetically
      expect(result.map((n) => n.id)).toEqual(['b', 'c', 'a'])
    })

    it('should use custom sort for unchecked items', () => {
      const middleware = stickyRows({
        sortUnchecked: (a, b) => {
          const aLabel = (a as any).label ?? ''
          const bLabel = (b as any).label ?? ''
          return bLabel.localeCompare(aLabel) // Reverse alphabetical
        },
      })

      const nodes = [
        createCheckboxNode('a', 'Apple', false),
        createCheckboxNode('b', 'Zebra', false),
        createCheckboxNode('c', 'Mango', false),
      ]

      // Simulate menu opening
      middleware.beforeFilter!(createMockBeforeFilterContext(nodes, true))

      // Transform nodes
      const result = middleware.transformNodes!(
        createMockTransformContext(nodes),
      )

      // Should be sorted reverse alphabetically
      expect(result.map((n) => n.id)).toEqual(['b', 'c', 'a'])
    })

    it('should use custom sort for both groups independently', () => {
      const middleware = stickyRows({
        sortChecked: (a, b) => {
          const aLabel = (a as any).label ?? ''
          const bLabel = (b as any).label ?? ''
          return aLabel.localeCompare(bLabel)
        },
        sortUnchecked: (a, b) => {
          const aLabel = (a as any).label ?? ''
          const bLabel = (b as any).label ?? ''
          return bLabel.localeCompare(aLabel)
        },
      })

      const nodes = [
        createCheckboxNode('a', 'Apple', false),
        createCheckboxNode('b', 'Zebra', true),
        createCheckboxNode('c', 'Mango', false),
        createCheckboxNode('d', 'Banana', true),
      ]

      // Simulate menu opening
      middleware.beforeFilter!(createMockBeforeFilterContext(nodes, true))

      // Transform nodes
      const result = middleware.transformNodes!(
        createMockTransformContext(nodes),
      )

      // Checked: alphabetical (b=Banana, d=Zebra)
      // Unchecked: reverse alphabetical (c=Mango, a=Apple)
      expect(result.map((n) => n.id)).toEqual(['d', 'b', 'c', 'a'])
    })
  })

  describe('Edge cases', () => {
    it('should handle empty nodes array', () => {
      const middleware = stickyRows()

      const nodes: Node[] = []

      // Simulate menu opening
      middleware.beforeFilter!(createMockBeforeFilterContext(nodes, true))

      // Transform nodes
      const result = middleware.transformNodes!(
        createMockTransformContext(nodes),
      )

      expect(result).toEqual([])
    })

    it('should handle single node', () => {
      const middleware = stickyRows()

      const nodes = [createCheckboxNode('a', 'Option A', true)]

      // Simulate menu opening
      middleware.beforeFilter!(createMockBeforeFilterContext(nodes, true))

      // Transform nodes
      const result = middleware.transformNodes!(
        createMockTransformContext(nodes),
      )

      expect(result.map((n) => n.id)).toEqual(['a'])
    })

    it('should handle nodes without open state descriptor', () => {
      const middleware = stickyRows()

      const nodes = [
        createCheckboxNode('a', 'Option A', false),
        createCheckboxNode('b', 'Option B', true),
      ]

      // Menu without open state descriptor (assume always open)
      const beforeContext: BeforeFilterContext = {
        nodes,
        query: '',
        menu: {
          kind: 'menu',
          id: 'test-menu',
        } as any,
      }

      middleware.beforeFilter!(beforeContext)

      // Transform should work (menu assumed open)
      const result = middleware.transformNodes!(
        createMockTransformContext(nodes),
      )
      expect(result.map((n) => n.id)).toEqual(['b', 'a'])
    })
  })

  describe('Integration with filtering', () => {
    it('should work with filtered nodes', () => {
      const middleware = stickyRows()

      const allNodes = [
        createCheckboxNode('a', 'Apple', false),
        createCheckboxNode('b', 'Banana', true),
        createCheckboxNode('c', 'Cherry', false),
        createCheckboxNode('d', 'Date', true),
      ]

      // Simulate menu opening with all nodes
      middleware.beforeFilter!(createMockBeforeFilterContext(allNodes, true))

      // Simulate filtering (only nodes with labels starting with vowels)
      const filteredNodes = [createCheckboxNode('a', 'Apple', false)]

      // Transform filtered nodes
      const result = middleware.transformNodes!(
        createMockTransformContext(filteredNodes),
      )

      // Should maintain sticky behavior even with filtered nodes
      expect(result.map((n) => n.id)).toEqual(['a'])
    })

    it('should handle multiple open/transform cycles', () => {
      const middleware = stickyRows()

      const nodes = [
        createCheckboxNode('a', 'Option A', false),
        createCheckboxNode('b', 'Option B', true),
      ]

      // First cycle
      middleware.beforeFilter!(createMockBeforeFilterContext(nodes, true))
      const result1 = middleware.transformNodes!(
        createMockTransformContext(nodes),
      )
      expect(result1.map((n) => n.id)).toEqual(['b', 'a'])

      // Multiple transforms in same open session
      const result2 = middleware.transformNodes!(
        createMockTransformContext(nodes),
      )
      expect(result2.map((n) => n.id)).toEqual(['b', 'a'])

      const result3 = middleware.transformNodes!(
        createMockTransformContext(nodes),
      )
      expect(result3.map((n) => n.id)).toEqual(['b', 'a'])
    })
  })
})
