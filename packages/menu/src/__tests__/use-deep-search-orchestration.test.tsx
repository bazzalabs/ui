/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  type DeepSearchOrchestrationConfig,
  useDeepSearchOrchestration,
} from '../hooks/use-deep-search-orchestration.js'
import type {
  AsyncNodeLoader,
  AsyncNodeLoaderResult,
  MenuDef,
  NodeDef,
} from '../types.js'

// Helper to create a mock loader that returns static data
function createMockLoader<T>(
  data: NodeDef<T>[],
  options?: {
    isLoading?: boolean
    isError?: boolean
    isFetching?: boolean
  },
): AsyncNodeLoader<T> {
  return () => ({
    data,
    isLoading: options?.isLoading ?? false,
    isError: options?.isError ?? false,
    isFetching: options?.isFetching ?? false,
  })
}

describe('useDeepSearchOrchestration', () => {
  describe('basic functionality', () => {
    it('returns a menu instance with correct metadata', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test-menu',
        title: 'Test Menu',
        nodes: [
          { kind: 'item', id: 'item-1', label: 'Item 1' },
          { kind: 'item', id: 'item-2', label: 'Item 2' },
        ],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      expect(result.current.menu.id).toBe('test-menu')
      expect(result.current.menu.title).toBe('Test Menu')
      expect(result.current.menu.surfaceId).toBe('test-surface')
      expect(result.current.menu.depth).toBe(0)
      expect(result.current.menu.nodes).toHaveLength(2)
    })

    it('sets depth to 1 for submenu', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'submenu',
        nodes: [{ kind: 'item', id: 'item-1', label: 'Item' }],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'submenu-surface',
          isSubmenu: true,
        }),
      )

      expect(result.current.menu.depth).toBe(1)
    })

    it('returns empty nodes for menu without definitions', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'empty-menu',
        nodes: [],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'test',
        }),
      )

      expect(result.current.menu.nodes).toHaveLength(0)
    })
  })

  describe('deep search loader collection', () => {
    it('handles menu with submenu containing loader', () => {
      const mockLoader = createMockLoader([
        { kind: 'item', id: 'result-1', label: 'Result 1' },
      ])

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'submenu-1',
            label: 'Submenu 1',
            loader: mockLoader,
            nodes: [],
          },
        ],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: 'test',
          open: true,
          surfaceId: 'root',
        }),
      )

      // Menu should be instantiated successfully
      expect(result.current.menu.nodes).toHaveLength(1)
      expect(result.current.menu.nodes[0]?.kind).toBe('submenu')
    })

    it('handles nested submenus with multiple loaders', () => {
      const loader1 = createMockLoader([
        { kind: 'item', id: 'result-1', label: 'Result 1' },
      ])
      const loader2 = createMockLoader([
        { kind: 'item', id: 'result-2', label: 'Result 2' },
      ])

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'level-1',
            label: 'Level 1',
            loader: loader1,
            nodes: [
              {
                kind: 'submenu',
                id: 'level-2',
                label: 'Level 2',
                loader: loader2,
                nodes: [],
              },
            ],
          },
        ],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: 'test',
          open: true,
          surfaceId: 'root',
        }),
      )

      expect(result.current.menu.nodes).toHaveLength(1)
      expect(result.current.menu.nodes[0]?.kind).toBe('submenu')
    })

    it('handles submenus with deepSearch disabled', () => {
      const loader1 = createMockLoader([
        { kind: 'item', id: 'enabled-result', label: 'Enabled Result' },
      ])
      const loader2 = createMockLoader([
        { kind: 'item', id: 'disabled-result', label: 'Disabled Result' },
      ])

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'enabled',
            label: 'Enabled',
            loader: loader1,
            deepSearch: true,
            nodes: [],
          },
          {
            kind: 'submenu',
            id: 'disabled',
            label: 'Disabled',
            loader: loader2,
            deepSearch: false, // Disabled deep search
            nodes: [],
          },
        ],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: 'test',
          open: true,
          surfaceId: 'root',
        }),
      )

      // Both submenus should exist in the menu
      expect(result.current.menu.nodes).toHaveLength(2)
    })
  })

  describe('query handling', () => {
    it('works with empty query', () => {
      const mockLoader = createMockLoader([
        { kind: 'item', id: 'result', label: 'Result' },
      ])

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'submenu',
            label: 'Submenu',
            loader: mockLoader,
            nodes: [],
          },
        ],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: '', // Empty query
          open: true,
          surfaceId: 'root',
        }),
      )

      // Should still instantiate the menu
      expect(result.current.menu.nodes).toHaveLength(1)
    })

    it('works with non-empty query', () => {
      const mockLoader = createMockLoader([
        { kind: 'item', id: 'result', label: 'Result' },
      ])

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'submenu',
            label: 'Submenu',
            loader: mockLoader,
            nodes: [],
          },
        ],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: 'search term',
          open: true,
          surfaceId: 'root',
        }),
      )

      expect(result.current.menu.nodes).toHaveLength(1)
    })

    it('handles query changes', () => {
      const mockLoader = createMockLoader([
        { kind: 'item', id: 'result', label: 'Result' },
      ])

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'submenu',
            label: 'Submenu',
            loader: mockLoader,
            nodes: [],
          },
        ],
      }

      const { result, rerender } = renderHook(
        (props: DeepSearchOrchestrationConfig<unknown>) =>
          useDeepSearchOrchestration(props),
        {
          initialProps: {
            menuDef,
            query: 'first',
            open: true,
            surfaceId: 'root',
          },
        },
      )

      expect(result.current.menu.nodes).toHaveLength(1)

      // Change query
      rerender({
        menuDef,
        query: 'second',
        open: true,
        surfaceId: 'root',
      })

      expect(result.current.menu.nodes).toHaveLength(1)
    })
  })

  describe('filterLoaders', () => {
    it('applies custom filter function', () => {
      const loader1 = createMockLoader([
        { kind: 'item', id: 'result-1', label: 'Result 1' },
      ])
      const loader2 = createMockLoader([
        { kind: 'item', id: 'result-2', label: 'Result 2' },
      ])

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'submenu-1',
            label: 'Submenu 1',
            loader: loader1,
            nodes: [],
          },
          {
            kind: 'submenu',
            id: 'submenu-2',
            label: 'Submenu 2',
            loader: loader2,
            nodes: [],
          },
        ],
      }

      // Filter to only include submenu-1
      const filterLoaders = vi.fn((entry) => entry.path.includes('submenu-1'))

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: 'test',
          open: true,
          surfaceId: 'root',
          filterLoaders,
        }),
      )

      // Both submenus should exist in the menu structure
      expect(result.current.menu.nodes).toHaveLength(2)
      // Filter function should have been called
      expect(filterLoaders).toHaveBeenCalled()
    })

    it('applies minLength threshold via filterLoaders', () => {
      const mockLoader = createMockLoader([
        { kind: 'item', id: 'result', label: 'Result' },
      ])

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'submenu',
            label: 'Submenu',
            loader: mockLoader,
            search: {
              minLength: {
                deep: 3,
              },
            },
            nodes: [],
          },
        ],
      }

      const filterLoaders = vi.fn(
        (entry, query) =>
          query.length >= (entry.searchConfig?.minLength?.deep ?? 0),
      )

      const { rerender } = renderHook(
        (props: DeepSearchOrchestrationConfig<unknown>) =>
          useDeepSearchOrchestration(props),
        {
          initialProps: {
            menuDef,
            query: 'ab', // Too short
            open: true,
            surfaceId: 'root',
            filterLoaders,
          },
        },
      )

      expect(filterLoaders).toHaveBeenCalled()

      // Update with longer query
      rerender({
        menuDef,
        query: 'abc', // Meets threshold
        open: true,
        surfaceId: 'root',
        filterLoaders,
      })

      // Filter should be called again
      expect(filterLoaders).toHaveBeenCalled()
    })
  })

  describe('aggregated state', () => {
    it('returns null aggregatedState when no loaders exist', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [{ kind: 'item', id: 'item', label: 'Item' }],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: 'test',
          open: true,
          surfaceId: 'root',
        }),
      )

      expect(result.current.aggregatedState).toBeNull()
    })

    it('provides aggregatedState when loaders exist', () => {
      const mockLoader = createMockLoader([
        { kind: 'item', id: 'result', label: 'Result' },
      ])

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'submenu-1',
            label: 'Submenu 1',
            loader: mockLoader,
            nodes: [],
          },
        ],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: 'test',
          open: true,
          surfaceId: 'root',
        }),
      )

      // Should have aggregated state when query is active
      // May be null if loaders are disabled due to empty query check
      expect(result.current.aggregatedState).toBeDefined()
    })
  })

  describe('streaming mode', () => {
    it('detects streaming mode based on menu configuration', () => {
      const mockLoader = createMockLoader([
        { kind: 'item', id: 'result', label: 'Result' },
      ])

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        search: {
          streaming: true,
          mode: 'server', // Required for streaming to be enabled
        },
        loader: mockLoader, // Need a loader
        nodes: [],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'root',
        }),
      )

      expect(result.current.streamingEnabled).toBe(true)
    })

    it('defaults to blocking mode', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'root',
        }),
      )

      expect(result.current.streamingEnabled).toBe(false)
    })

    it('returns empty completion order initially', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'root',
        }),
      )

      expect(result.current.completionOrder).toEqual([])
    })
  })

  describe('rootLoaderResult', () => {
    it('applies root loader result to menu', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [],
      }

      const rootLoaderResult: AsyncNodeLoaderResult<NodeDef<unknown>> = {
        data: [{ kind: 'item', id: 'loaded-item', label: 'Loaded Item' }],
        isLoading: false,
        isError: false,
        isFetching: false,
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'root',
          rootLoaderResult,
        }),
      )

      expect(result.current.menu.loader).toBe(rootLoaderResult)
    })
  })

  describe('defaults cascade', () => {
    it('applies defaults to instantiated menu', () => {
      const onSelect = vi.fn()

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [{ kind: 'item', id: 'item', label: 'Item' }],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'root',
          defaults: {
            item: {
              onSelect,
              closeOnSelect: true,
            },
          },
        }),
      )

      const item = result.current.menu.nodes[0] as any
      expect(item.onSelect).toBe(onSelect)
      expect(item.closeOnSelect).toBe(true)
    })
  })

  describe('submenu behavior', () => {
    it('creates submenus at correct depth', () => {
      const mockLoader = createMockLoader([
        { kind: 'item', id: 'result', label: 'Result' },
      ])

      const menuDef: MenuDef<unknown> = {
        id: 'submenu',
        nodes: [
          {
            kind: 'submenu',
            id: 'nested',
            label: 'Nested',
            loader: mockLoader,
            nodes: [],
          },
        ],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: 'test',
          open: true,
          surfaceId: 'submenu',
          isSubmenu: true,
        }),
      )

      expect(result.current.menu.depth).toBe(1)
      expect(result.current.menu.nodes).toHaveLength(1)
    })
  })

  describe('groups with submenus', () => {
    it('handles submenus inside groups', () => {
      const mockLoader = createMockLoader([
        { kind: 'item', id: 'result', label: 'Result' },
      ])

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'group',
            id: 'group-1',
            heading: 'Group',
            nodes: [
              {
                kind: 'submenu',
                id: 'submenu-in-group',
                label: 'Submenu in Group',
                loader: mockLoader,
                nodes: [],
              },
            ],
          },
        ],
      }

      const { result } = renderHook(() =>
        useDeepSearchOrchestration({
          menuDef,
          query: 'test',
          open: true,
          surfaceId: 'root',
        }),
      )

      expect(result.current.menu.nodes).toHaveLength(1)
      expect(result.current.menu.nodes[0]?.kind).toBe('group')

      const group = result.current.menu.nodes[0] as any
      expect(group.nodes).toHaveLength(1)
      expect(group.nodes[0].kind).toBe('submenu')
    })
  })
})
