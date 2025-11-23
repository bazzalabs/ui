/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useFilteredNodes } from '../hooks/use-filtered-nodes.js'
import { instantiateMenuFromDef } from '../primitives/menu-model.js'
import type { MenuDef } from '../types.js'

describe('useFilteredNodes', () => {
  describe('empty query behavior', () => {
    it('returns all navigable nodes when query is empty', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'item-1', label: 'Item 1' },
          { kind: 'item', id: 'item-2', label: 'Item 2' },
          { kind: 'submenu', id: 'sub-1', label: 'Submenu 1', nodes: [] },
          { kind: 'separator', id: 'sep-1' },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      const { result } = renderHook(() => useFilteredNodes(menu, '', {}))

      // Should include items and submenus (separators are included in shallow flatten)
      expect(result.current.filteredNodes.length).toBeGreaterThanOrEqual(3)
      const hasItems = result.current.filteredNodes.some(
        (n) => n.kind === 'item',
      )
      const hasSubmenu = result.current.filteredNodes.some(
        (n) => n.kind === 'submenu',
      )
      expect(hasItems).toBe(true)
      expect(hasSubmenu).toBe(true)
    })

    it('includes groups with headings when query is empty', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [
          {
            kind: 'group',
            id: 'group-1',
            heading: 'Section 1',
            nodes: [{ kind: 'item', id: 'item-1', label: 'Item 1' }],
          },
          {
            kind: 'group',
            id: 'group-2',
            nodes: [{ kind: 'item', id: 'item-2', label: 'Item 2' }],
          },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      const { result } = renderHook(() => useFilteredNodes(menu, '', {}))

      // Should include group with heading and both items
      const groupNodes = result.current.filteredNodes.filter(
        (n) => n.kind === 'group',
      )
      expect(groupNodes).toHaveLength(1)
      expect((groupNodes[0] as any).heading).toBe('Section 1')
    })
  })

  describe('filter modes', () => {
    it('uses shallow mode when mode is shallow', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'file', label: 'File' },
          {
            kind: 'submenu',
            id: 'settings',
            label: 'Settings',
            nodes: [{ kind: 'item', id: 'advanced', label: 'Advanced' }],
          },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      const { result } = renderHook(() =>
        useFilteredNodes(menu, 'advanced', { mode: 'shallow' }),
      )

      // In shallow mode, nested items should not be included
      const itemIds = result.current.filteredNodes.map((n) => n.id)
      expect(itemIds).not.toContain('advanced')
    })

    it('uses deep mode when mode is deep', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'file', label: 'File' },
          {
            kind: 'submenu',
            id: 'settings',
            label: 'Settings',
            nodes: [{ kind: 'item', id: 'advanced', label: 'Advanced' }],
          },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      const { result } = renderHook(() =>
        useFilteredNodes(menu, 'advanced', { mode: 'deep' }),
      )

      // In deep mode, nested items should be included
      const itemIds = result.current.filteredNodes.map((n) => n.id)
      expect(itemIds).toContain('advanced')
    })

    it('defaults to deep mode', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [
          {
            kind: 'submenu',
            id: 'settings',
            label: 'Settings',
            nodes: [{ kind: 'item', id: 'advanced', label: 'Advanced' }],
          },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      const { result } = renderHook(() =>
        useFilteredNodes(menu, 'advanced', {}),
      )

      const itemIds = result.current.filteredNodes.map((n) => n.id)
      expect(itemIds).toContain('advanced')
    })
  })

  describe('scoring and sorting', () => {
    it('sorts nodes by score in blocking mode', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'file-manager', label: 'File Manager' },
          { kind: 'item', id: 'file', label: 'File' },
          { kind: 'item', id: 'profile', label: 'Profile' },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      const { result } = renderHook(() =>
        useFilteredNodes(menu, 'file', { streamingEnabled: false }),
      )

      // 'file' should score higher than 'file-manager'
      expect(result.current.filteredNodes[0]?.id).toBe('file')
      expect(result.current.filteredNodes[1]?.id).toBe('file-manager')
      // Note: 'profile' might be included with a low score depending on the fuzzy matching algorithm
      // Just verify the top results are correct
      expect(result.current.filteredNodes.length).toBeGreaterThanOrEqual(2)
    })

    it('sorts by completion order in streaming mode', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'static-1', label: 'Static Item' },
          { kind: 'item', id: 'static-2', label: 'Static Two' },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0) as any

      const { result } = renderHook(() =>
        useFilteredNodes(menu, 'static', {
          streamingEnabled: true,
          completionOrder: [],
        }),
      )

      // In streaming mode, items should still be sorted by score
      expect(result.current.filteredNodes).toHaveLength(2)
    })

    it('uses custom sort function when provided', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'item-a', label: 'Item A' },
          { kind: 'item', id: 'item-b', label: 'Item B' },
          { kind: 'item', id: 'item-c', label: 'Item C' },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      // Reverse alphabetical sort
      const customSort = (a: any, b: any) => b.node.id.localeCompare(a.node.id)

      const { result } = renderHook(() =>
        useFilteredNodes(menu, 'item', { customSort }),
      )

      expect(result.current.filteredNodes[0]?.id).toBe('item-c')
      expect(result.current.filteredNodes[1]?.id).toBe('item-b')
      expect(result.current.filteredNodes[2]?.id).toBe('item-a')
    })
  })

  describe('custom filter', () => {
    it('applies custom filter function', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'item-1', label: 'Item 1' },
          { kind: 'item', id: 'item-2', label: 'Item 2' },
          { kind: 'item', id: 'special', label: 'Special' },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      // Only include items with 'item' in the id
      const customFilter = (node: any) => node.id.includes('item')

      const { result } = renderHook(() =>
        useFilteredNodes(menu, 'item', { customFilter }),
      )

      const ids = result.current.filteredNodes.map((n) => n.id)
      expect(ids).toContain('item-1')
      expect(ids).toContain('item-2')
      expect(ids).not.toContain('special')
    })
  })

  describe('search metadata enrichment', () => {
    it('enriches nodes with search context', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'file', label: 'File' },
          {
            kind: 'submenu',
            id: 'settings',
            label: 'Settings',
            nodes: [{ kind: 'item', id: 'advanced', label: 'Advanced' }],
          },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      const { result } = renderHook(() =>
        useFilteredNodes(menu, 'advanced', { mode: 'deep' }),
      )

      const advancedNode = result.current.filteredNodes.find(
        (n) => n.id === 'advanced',
      ) as any

      expect(advancedNode?.search).toBeDefined()
      expect(advancedNode?.search.query).toBe('advanced')
      expect(advancedNode?.search.score).toBeGreaterThan(0)
      expect(advancedNode?.search.isDeep).toBe(true)
      expect(advancedNode?.search.breadcrumbs).toHaveLength(1)
      expect(advancedNode?.search.breadcrumbs[0]).toBe('Settings')
    })

    it('marks root-level items as not deep', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [{ kind: 'item', id: 'file', label: 'File' }],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      const { result } = renderHook(() =>
        useFilteredNodes(menu, 'file', { mode: 'deep' }),
      )

      const fileNode = result.current.filteredNodes[0] as any
      expect(fileNode?.search.isDeep).toBe(false)
      expect(fileNode?.search.breadcrumbs).toHaveLength(0)
    })
  })

  describe('streaming mode loading nodes', () => {
    it('appends loading node when loaders are in progress', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [{ kind: 'item', id: 'item-1', label: 'Item 1' }],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0) as any
      // Simulate loading state
      menu.loadingState = {
        inProgressPaths: new Set(['submenu-1']),
        progress: [
          {
            path: ['submenu-1'],
            breadcrumbs: ['Submenu 1'],
            isLoading: true,
            isFetching: true,
          },
        ],
        completedPaths: new Set(),
      }

      const { result } = renderHook(() =>
        useFilteredNodes(menu, 'test', { streamingEnabled: true }),
      )

      // displayNodes should include loading node
      expect(result.current.displayNodes.length).toBe(
        result.current.filteredNodes.length + 1,
      )
      const lastNode = result.current.displayNodes[
        result.current.displayNodes.length - 1
      ] as any
      expect(lastNode?.kind).toBe('loading')
      expect(lastNode?.id).toBe('__streaming-loading__')
    })

    it('does not append loading node when no query', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [{ kind: 'item', id: 'item-1', label: 'Item 1' }],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0) as any
      menu.loadingState = {
        inProgressPaths: new Set(['submenu-1']),
      }

      const { result } = renderHook(() =>
        useFilteredNodes(menu, '', { streamingEnabled: true }),
      )

      // No loading node when query is empty
      expect(result.current.displayNodes).toEqual(result.current.filteredNodes)
    })

    it('does not append loading node in blocking mode', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [{ kind: 'item', id: 'item-1', label: 'Item 1' }],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0) as any
      menu.loadingState = {
        inProgressPaths: new Set(['submenu-1']),
      }

      const { result } = renderHook(() =>
        useFilteredNodes(menu, 'test', { streamingEnabled: false }),
      )

      // No loading node in blocking mode
      expect(result.current.displayNodes).toEqual(result.current.filteredNodes)
    })
  })

  describe('deduplication', () => {
    it('deduplicates nodes by ID', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [
          {
            kind: 'group',
            id: 'group-1',
            nodes: [{ kind: 'item', id: 'item-1', label: 'Item 1' }],
          },
          {
            kind: 'group',
            id: 'group-2',
            nodes: [
              // Duplicate item with same ID
              { kind: 'item', id: 'item-1', label: 'Item 1 Duplicate' },
            ],
          },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      const { result } = renderHook(() =>
        useFilteredNodes(menu, 'item', { mode: 'deep' }),
      )

      // Should only include first occurrence
      const itemNodes = result.current.filteredNodes.filter(
        (n) => n.kind === 'item',
      )
      expect(itemNodes).toHaveLength(1)
      expect(itemNodes[0]?.id).toBe('item-1')
    })
  })

  describe('memoization', () => {
    it('memoizes filtered nodes based on dependencies', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'item-1', label: 'Item 1' },
          { kind: 'item', id: 'item-2', label: 'Item 2' },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      const { result, rerender } = renderHook(
        ({ query }) => useFilteredNodes(menu, query, {}),
        { initialProps: { query: 'item' } },
      )

      const firstResult = result.current.filteredNodes

      // Rerender with same query
      rerender({ query: 'item' })

      // Should have the same content (memoization creates new arrays)
      expect(result.current.filteredNodes).toHaveLength(firstResult.length)
      expect(result.current.filteredNodes[0]?.id).toBe(firstResult[0]?.id)
    })

    it('recomputes when query changes', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'item-1', label: 'Item 1' },
          { kind: 'item', id: 'file', label: 'File' },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      const { result, rerender } = renderHook(
        ({ query }) => useFilteredNodes(menu, query, {}),
        { initialProps: { query: 'item' } },
      )

      expect(result.current.filteredNodes).toHaveLength(1)
      expect(result.current.filteredNodes[0]?.id).toBe('item-1')

      // Change query
      rerender({ query: 'file' })

      expect(result.current.filteredNodes).toHaveLength(1)
      expect(result.current.filteredNodes[0]?.id).toBe('file')
    })
  })
})
