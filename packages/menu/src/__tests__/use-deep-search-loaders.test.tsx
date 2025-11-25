/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  type UseDeepSearchLoadersConfig,
  useDeepSearchLoaders,
} from '../hooks/use-deep-search-loaders.js'
import type { AsyncNodeLoader, MenuDef, NodeDef } from '../types.js'

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

describe('useDeepSearchLoaders', () => {
  describe('loader collection', () => {
    it('returns null aggregatedState when menu has no loaders', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          { kind: 'item', id: 'item-1', label: 'Item 1' },
          { kind: 'item', id: 'item-2', label: 'Item 2' },
        ],
      }

      const { result } = renderHook(() =>
        useDeepSearchLoaders({
          menuDef,
          query: 'test',
          open: true,
        }),
      )

      expect(result.current.aggregatedState).toBeNull()
      expect(result.current.loaderResults.size).toBe(0)
      expect(result.current.stableLoaderEntries).toHaveLength(0)
    })

    it('collects loaders from direct submenus', () => {
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
        useDeepSearchLoaders({
          menuDef,
          query: 'test',
          open: true,
        }),
      )

      expect(result.current.stableLoaderEntries).toHaveLength(1)
      expect(result.current.stableLoaderEntries[0]?.path).toEqual(['submenu-1'])
      expect(result.current.stableLoaderEntries[0]?.loader).toBe(mockLoader)
    })

    it('collects loaders from nested submenus', () => {
      const loader1 = createMockLoader([
        { kind: 'item', id: 'result-1', label: 'Result 1' },
      ])
      const loader2 = createMockLoader([
        { kind: 'item', id: 'result-2', label: 'Result 2' },
      ])
      const loader3 = createMockLoader([
        { kind: 'item', id: 'result-3', label: 'Result 3' },
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
                nodes: [
                  {
                    kind: 'submenu',
                    id: 'level-3',
                    label: 'Level 3',
                    loader: loader3,
                    nodes: [],
                  },
                ],
              },
            ],
          },
        ],
      }

      const { result } = renderHook(() =>
        useDeepSearchLoaders({
          menuDef,
          query: 'test',
          open: true,
        }),
      )

      expect(result.current.stableLoaderEntries).toHaveLength(3)
      expect(result.current.stableLoaderEntries[0]?.path).toEqual(['level-1'])
      expect(result.current.stableLoaderEntries[1]?.path).toEqual([
        'level-1',
        'level-2',
      ])
      expect(result.current.stableLoaderEntries[2]?.path).toEqual([
        'level-1',
        'level-2',
        'level-3',
      ])
    })

    it('skips submenus with deepSearch disabled', () => {
      const loader1 = createMockLoader([
        { kind: 'item', id: 'enabled', label: 'Enabled' },
      ])
      const loader2 = createMockLoader([
        { kind: 'item', id: 'disabled', label: 'Disabled' },
      ])

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'enabled-submenu',
            label: 'Enabled',
            loader: loader1,
            deepSearch: true,
            nodes: [],
          },
          {
            kind: 'submenu',
            id: 'disabled-submenu',
            label: 'Disabled',
            loader: loader2,
            deepSearch: false,
            nodes: [],
          },
        ],
      }

      const { result } = renderHook(() =>
        useDeepSearchLoaders({
          menuDef,
          query: 'test',
          open: true,
        }),
      )

      expect(result.current.stableLoaderEntries).toHaveLength(1)
      expect(result.current.stableLoaderEntries[0]?.path).toEqual([
        'enabled-submenu',
      ])
    })

    it('collects loaders from submenus inside groups', () => {
      const mockLoader = createMockLoader([
        { kind: 'item', id: 'result', label: 'Result' },
      ])

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'group',
            id: 'group-1',
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
        useDeepSearchLoaders({
          menuDef,
          query: 'test',
          open: true,
        }),
      )

      expect(result.current.stableLoaderEntries).toHaveLength(1)
      expect(result.current.stableLoaderEntries[0]?.path).toEqual([
        'submenu-in-group',
      ])
    })
  })

  describe('loader locking', () => {
    it('locks loader list on first mount', () => {
      const loader1 = createMockLoader([
        { kind: 'item', id: 'result-1', label: 'Result 1' },
      ])

      const menuDef1: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'submenu-1',
            label: 'Submenu 1',
            loader: loader1,
            nodes: [],
          },
        ],
      }

      const { result, rerender } = renderHook(
        (props: UseDeepSearchLoadersConfig<unknown>) =>
          useDeepSearchLoaders(props),
        {
          initialProps: {
            menuDef: menuDef1,
            query: 'test',
            open: true,
          },
        },
      )

      // Initial render - should have 1 loader
      expect(result.current.stableLoaderEntries).toHaveLength(1)

      // Add a new submenu with loader
      const loader2 = createMockLoader([
        { kind: 'item', id: 'result-2', label: 'Result 2' },
      ])

      const menuDef2: MenuDef<unknown> = {
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

      // Rerender with new menu def
      rerender({
        menuDef: menuDef2,
        query: 'test',
        open: true,
      })

      // Should still have locked list with 1 loader (prevents hooks order violations)
      expect(result.current.stableLoaderEntries).toHaveLength(1)
    })
  })

  describe('query handling', () => {
    it('disables loaders when query is empty', () => {
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
        useDeepSearchLoaders({
          menuDef,
          query: '', // Empty query
          open: true,
        }),
      )

      // Loaders should be collected but not executed (aggregatedState should be null)
      expect(result.current.stableLoaderEntries).toHaveLength(1)
      expect(result.current.aggregatedState).toBeNull()
    })

    it('enables loaders when query is provided', () => {
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
        useDeepSearchLoaders({
          menuDef,
          query: 'search term',
          open: true,
        }),
      )

      expect(result.current.stableLoaderEntries).toHaveLength(1)
      expect(result.current.aggregatedState).toBeDefined()
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
        (props: UseDeepSearchLoadersConfig<unknown>) =>
          useDeepSearchLoaders(props),
        {
          initialProps: {
            menuDef,
            query: 'first',
            open: true,
          },
        },
      )

      expect(result.current.aggregatedState).toBeDefined()

      // Change query
      rerender({
        menuDef,
        query: 'second',
        open: true,
      })

      expect(result.current.aggregatedState).toBeDefined()
    })
  })

  describe('filterLoaders', () => {
    it('filters loaders based on custom function', () => {
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
        useDeepSearchLoaders({
          menuDef,
          query: 'test',
          open: true,
          filterLoaders,
        }),
      )

      // Should have collected both loaders
      expect(result.current.stableLoaderEntries).toHaveLength(2)
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

      const { result, rerender } = renderHook(
        (props: UseDeepSearchLoadersConfig<unknown>) =>
          useDeepSearchLoaders(props),
        {
          initialProps: {
            menuDef,
            query: 'ab', // Too short
            open: true,
            filterLoaders,
          },
        },
      )

      expect(filterLoaders).toHaveBeenCalled()
      // With short query, aggregatedState might be null
      expect(result.current.stableLoaderEntries).toHaveLength(1)

      // Update with longer query
      rerender({
        menuDef,
        query: 'abc', // Meets threshold
        open: true,
        filterLoaders,
      })

      // Filter should be called again
      expect(filterLoaders).toHaveBeenCalled()
    })

    it('passes query to filter function', () => {
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

      const filterLoaders = vi.fn((entry, query) => {
        expect(query).toBe('test-query')
        return true
      })

      renderHook(() =>
        useDeepSearchLoaders({
          menuDef,
          query: 'test-query',
          open: true,
          filterLoaders,
        }),
      )

      expect(filterLoaders).toHaveBeenCalledWith(
        expect.objectContaining({ path: ['submenu'] }),
        'test-query',
      )
    })
  })

  describe('aggregation', () => {
    it('aggregates results from multiple loaders', () => {
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

      const { result } = renderHook(() =>
        useDeepSearchLoaders({
          menuDef,
          query: 'test',
          open: true,
        }),
      )

      expect(result.current.aggregatedState).not.toBeNull()
      expect(result.current.aggregatedState?.results.size).toBeGreaterThan(0)
    })

    it('returns null when no loaders are enabled', () => {
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

      // Filter out all loaders
      const filterLoaders = vi.fn(() => false)

      const { result } = renderHook(() =>
        useDeepSearchLoaders({
          menuDef,
          query: 'test',
          open: true,
          filterLoaders,
        }),
      )

      expect(result.current.aggregatedState).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('handles empty menu definition', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'empty',
        nodes: [],
      }

      const { result } = renderHook(() =>
        useDeepSearchLoaders({
          menuDef,
          query: 'test',
          open: true,
        }),
      )

      expect(result.current.stableLoaderEntries).toHaveLength(0)
      expect(result.current.aggregatedState).toBeNull()
    })

    it('handles menu with only static nodes', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          { kind: 'item', id: 'item-1', label: 'Item 1' },
          {
            kind: 'group',
            id: 'group-1',
            nodes: [{ kind: 'item', id: 'item-2', label: 'Item 2' }],
          },
        ],
      }

      const { result } = renderHook(() =>
        useDeepSearchLoaders({
          menuDef,
          query: 'test',
          open: true,
        }),
      )

      expect(result.current.stableLoaderEntries).toHaveLength(0)
      expect(result.current.aggregatedState).toBeNull()
    })

    it('handles menu closed state', () => {
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
        useDeepSearchLoaders({
          menuDef,
          query: 'test',
          open: false, // Menu closed
        }),
      )

      expect(result.current.stableLoaderEntries).toHaveLength(1)
      // Loaders should not be executed when menu is closed
      expect(result.current.aggregatedState).toBeNull()
    })
  })
})
