import { describe, expect, it } from 'vitest'
import type { ScoredNode } from '../types.js'
import {
  deduplicateById,
  partitionByKind,
  sortByCompletionOrder,
  sortByScore,
} from '../utils/sort.js'

describe('sort utilities', () => {
  describe('sortByScore', () => {
    it('should sort nodes by score in descending order', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'low', label: 'Low' } as any,
          score: 10,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'high', label: 'High' } as any,
          score: 100,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'medium', label: 'Medium' } as any,
          score: 50,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const sorted = sortByScore(nodes)

      expect(sorted[0]?.node.id).toBe('high')
      expect(sorted[1]?.node.id).toBe('medium')
      expect(sorted[2]?.node.id).toBe('low')
      expect(sorted[0]?.score).toBe(100)
      expect(sorted[1]?.score).toBe(50)
      expect(sorted[2]?.score).toBe(10)
    })

    it('should handle equal scores', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'a', label: 'A' } as any,
          score: 50,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'b', label: 'B' } as any,
          score: 50,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'c', label: 'C' } as any,
          score: 50,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const sorted = sortByScore(nodes)

      // Should maintain stable sort (original order for equal scores)
      expect(sorted.length).toBe(3)
      expect(sorted.every((n) => n.score === 50)).toBe(true)
    })

    it('should handle empty array', () => {
      const nodes: ScoredNode[] = []
      const sorted = sortByScore(nodes)
      expect(sorted).toEqual([])
    })

    it('should handle single node', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'only', label: 'Only' } as any,
          score: 42,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const sorted = sortByScore(nodes)

      expect(sorted.length).toBe(1)
      expect(sorted[0]?.score).toBe(42)
    })

    it('should mutate the original array', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'low', label: 'Low' } as any,
          score: 10,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'high', label: 'High' } as any,
          score: 100,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const sorted = sortByScore(nodes)

      // Should be the same reference
      expect(sorted).toBe(nodes)
      expect(nodes[0]?.node.id).toBe('high')
    })

    it('should handle negative scores', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'negative', label: 'Negative' } as any,
          score: -10,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'positive', label: 'Positive' } as any,
          score: 10,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'zero', label: 'Zero' } as any,
          score: 0,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const sorted = sortByScore(nodes)

      expect(sorted[0]?.score).toBe(10)
      expect(sorted[1]?.score).toBe(0)
      expect(sorted[2]?.score).toBe(-10)
    })
  })

  describe('sortByCompletionOrder', () => {
    it('should place static nodes (no breadcrumbs) first', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'loader-item', label: 'Loader' } as any,
          score: 100,
          breadcrumbs: ['Settings'],
          breadcrumbIds: ['settings'],
        },
        {
          node: { kind: 'item', id: 'static-item', label: 'Static' } as any,
          score: 50,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const sorted = sortByCompletionOrder(nodes, ['settings'])

      expect(sorted[0]?.node.id).toBe('static-item')
      expect(sorted[1]?.node.id).toBe('loader-item')
    })

    it('should sort static nodes by score', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'static-low', label: 'Low' } as any,
          score: 10,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'static-high', label: 'High' } as any,
          score: 100,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'static-medium', label: 'Medium' } as any,
          score: 50,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const sorted = sortByCompletionOrder(nodes, [])

      expect(sorted[0]?.node.id).toBe('static-high')
      expect(sorted[1]?.node.id).toBe('static-medium')
      expect(sorted[2]?.node.id).toBe('static-low')
    })

    it('should sort loader results by completion order', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'help-item', label: 'Help' } as any,
          score: 100,
          breadcrumbs: ['Help'],
          breadcrumbIds: ['help'],
        },
        {
          node: { kind: 'item', id: 'settings-item', label: 'Settings' } as any,
          score: 90,
          breadcrumbs: ['Settings'],
          breadcrumbIds: ['settings'],
        },
        {
          node: { kind: 'item', id: 'about-item', label: 'About' } as any,
          score: 80,
          breadcrumbs: ['About'],
          breadcrumbIds: ['about'],
        },
      ]

      const sorted = sortByCompletionOrder(nodes, ['settings', 'about', 'help'])

      expect(sorted[0]?.node.id).toBe('settings-item')
      expect(sorted[1]?.node.id).toBe('about-item')
      expect(sorted[2]?.node.id).toBe('help-item')
    })

    it('should maintain stable order for static nodes, then append loader results', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'loader-1', label: 'Loader 1' } as any,
          score: 100,
          breadcrumbs: ['Settings'],
          breadcrumbIds: ['settings'],
        },
        {
          node: { kind: 'item', id: 'static-1', label: 'Static 1' } as any,
          score: 50,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'loader-2', label: 'Loader 2' } as any,
          score: 90,
          breadcrumbs: ['Help'],
          breadcrumbIds: ['help'],
        },
        {
          node: { kind: 'item', id: 'static-2', label: 'Static 2' } as any,
          score: 40,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const sorted = sortByCompletionOrder(nodes, ['settings', 'help'])

      // Static nodes first (sorted by score)
      expect(sorted[0]?.node.id).toBe('static-1')
      expect(sorted[1]?.node.id).toBe('static-2')
      // Then loader results in completion order
      expect(sorted[2]?.node.id).toBe('loader-1')
      expect(sorted[3]?.node.id).toBe('loader-2')
    })

    it('should handle nodes not in completion order by falling back to score', () => {
      const nodes: ScoredNode[] = [
        {
          node: {
            kind: 'item',
            id: 'unknown-low',
            label: 'Unknown Low',
          } as any,
          score: 30,
          breadcrumbs: ['Unknown1'],
          breadcrumbIds: ['unknown1'],
        },
        {
          node: {
            kind: 'item',
            id: 'unknown-high',
            label: 'Unknown High',
          } as any,
          score: 70,
          breadcrumbs: ['Unknown2'],
          breadcrumbIds: ['unknown2'],
        },
      ]

      const sorted = sortByCompletionOrder(nodes, [])

      // Should fall back to score sorting
      expect(sorted[0]?.node.id).toBe('unknown-high')
      expect(sorted[1]?.node.id).toBe('unknown-low')
    })

    it('should prioritize nodes in completion order over nodes not in order', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'unknown', label: 'Unknown' } as any,
          score: 100,
          breadcrumbs: ['Unknown'],
          breadcrumbIds: ['unknown'],
        },
        {
          node: { kind: 'item', id: 'known', label: 'Known' } as any,
          score: 50,
          breadcrumbs: ['Settings'],
          breadcrumbIds: ['settings'],
        },
      ]

      const sorted = sortByCompletionOrder(nodes, ['settings'])

      // Node in completion order comes first, even with lower score
      expect(sorted[0]?.node.id).toBe('known')
      expect(sorted[1]?.node.id).toBe('unknown')
    })

    it('should handle empty completion order', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'a', label: 'A' } as any,
          score: 100,
          breadcrumbs: ['Menu A'],
          breadcrumbIds: ['a'],
        },
        {
          node: { kind: 'item', id: 'b', label: 'B' } as any,
          score: 50,
          breadcrumbs: ['Menu B'],
          breadcrumbIds: ['b'],
        },
      ]

      const sorted = sortByCompletionOrder(nodes, [])

      // Should fall back to score sorting
      expect(sorted[0]?.score).toBeGreaterThan(sorted[1]?.score || 0)
    })

    it('should handle nested breadcrumbs using first ID', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'deep-1', label: 'Deep 1' } as any,
          score: 100,
          breadcrumbs: ['Settings', 'Advanced', 'Security'],
          breadcrumbIds: ['settings', 'advanced', 'security'],
        },
        {
          node: { kind: 'item', id: 'deep-2', label: 'Deep 2' } as any,
          score: 90,
          breadcrumbs: ['Help', 'Docs'],
          breadcrumbIds: ['help', 'docs'],
        },
      ]

      const sorted = sortByCompletionOrder(nodes, ['help', 'settings'])

      // Should use first breadcrumb ID for ordering
      expect(sorted[0]?.breadcrumbIds[0]).toBe('help')
      expect(sorted[1]?.breadcrumbIds[0]).toBe('settings')
    })

    it('should handle empty array', () => {
      const nodes: ScoredNode[] = []
      const sorted = sortByCompletionOrder(nodes, ['a', 'b'])
      expect(sorted).toEqual([])
    })
  })

  describe('partitionByKind', () => {
    it('should place items before submenus', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'submenu', id: 'submenu-1', label: 'Submenu' } as any,
          score: 100,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'item-1', label: 'Item' } as any,
          score: 50,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const partitioned = partitionByKind(nodes)

      expect(partitioned[0]?.node.kind).toBe('item')
      expect(partitioned[1]?.node.kind).toBe('submenu')
    })

    it('should maintain relative order within each partition', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'submenu', id: 'submenu-1', label: 'Submenu 1' } as any,
          score: 100,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'item-1', label: 'Item 1' } as any,
          score: 90,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'submenu', id: 'submenu-2', label: 'Submenu 2' } as any,
          score: 80,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'item-2', label: 'Item 2' } as any,
          score: 70,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const partitioned = partitionByKind(nodes)

      // Items maintain their relative order
      expect(partitioned[0]?.node.id).toBe('item-1')
      expect(partitioned[1]?.node.id).toBe('item-2')
      // Submenus maintain their relative order
      expect(partitioned[2]?.node.id).toBe('submenu-1')
      expect(partitioned[3]?.node.id).toBe('submenu-2')
    })

    it('should handle only items', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'item-1', label: 'Item 1' } as any,
          score: 100,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'item-2', label: 'Item 2' } as any,
          score: 50,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const partitioned = partitionByKind(nodes)

      expect(partitioned.length).toBe(2)
      expect(partitioned.every((n) => n.node.kind === 'item')).toBe(true)
    })

    it('should handle only submenus', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'submenu', id: 'submenu-1', label: 'Submenu 1' } as any,
          score: 100,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'submenu', id: 'submenu-2', label: 'Submenu 2' } as any,
          score: 50,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const partitioned = partitionByKind(nodes)

      expect(partitioned.length).toBe(2)
      expect(partitioned.every((n) => n.node.kind === 'submenu')).toBe(true)
    })

    it('should handle empty array', () => {
      const nodes: ScoredNode[] = []
      const partitioned = partitionByKind(nodes)
      expect(partitioned).toEqual([])
    })

    it('should not mutate original array', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'submenu', id: 'submenu', label: 'Submenu' } as any,
          score: 100,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'item', label: 'Item' } as any,
          score: 50,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const originalFirst = nodes[0]

      const partitioned = partitionByKind(nodes)

      // Original array should remain unchanged
      expect(nodes[0]).toBe(originalFirst)
      expect(nodes[0]?.node.kind).toBe('submenu')
      // Partitioned should be a new array
      expect(partitioned).not.toBe(nodes)
      expect(partitioned[0]?.node.kind).toBe('item')
    })
  })

  describe('deduplicateById', () => {
    it('should remove duplicate IDs keeping first occurrence', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'duplicate', label: 'First' } as any,
          score: 100,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'unique', label: 'Unique' } as any,
          score: 90,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'duplicate', label: 'Second' } as any,
          score: 90,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const deduplicated = deduplicateById(nodes)

      expect(deduplicated.length).toBe(2)
      expect(deduplicated[0]?.node.id).toBe('duplicate')
      expect(deduplicated[0]?.score).toBe(100)
      expect(deduplicated[1]?.node.id).toBe('unique')
    })

    it('should handle empty array', () => {
      const nodes: ScoredNode[] = []
      const deduplicated = deduplicateById(nodes)
      expect(deduplicated).toEqual([])
    })

    it('should handle single node', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'only', label: 'Only' } as any,
          score: 100,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const deduplicated = deduplicateById(nodes)

      expect(deduplicated.length).toBe(1)
      expect(deduplicated[0]?.node.id).toBe('only')
    })

    it('should not mutate original array', () => {
      const nodes: ScoredNode[] = [
        {
          node: { kind: 'item', id: 'duplicate', label: 'First' } as any,
          score: 100,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
        {
          node: { kind: 'item', id: 'duplicate', label: 'Second' } as any,
          score: 90,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const originalLength = nodes.length

      const deduplicated = deduplicateById(nodes)

      // Original array should remain unchanged
      expect(nodes.length).toBe(originalLength)
      // Deduplicated should be a new array
      expect(deduplicated).not.toBe(nodes)
      expect(deduplicated.length).toBe(1)
    })

    it('should preserve node properties when deduplicating', () => {
      const nodes: ScoredNode[] = [
        {
          node: {
            kind: 'item',
            id: 'dup',
            label: 'First',
            data: 'data1',
          } as any,
          score: 100,
          breadcrumbs: ['Parent'],
          breadcrumbIds: ['parent'],
        },
        {
          node: {
            kind: 'item',
            id: 'dup',
            label: 'Second',
            data: 'data2',
          } as any,
          score: 50,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      ]

      const deduplicated = deduplicateById(nodes)

      expect(deduplicated.length).toBe(1)
      expect(deduplicated[0]?.score).toBe(100)
      expect(deduplicated[0]?.breadcrumbs).toEqual(['Parent'])
      expect((deduplicated[0]?.node as any).data).toBe('data1')
    })
  })
})
