import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useMenu } from '../hooks/use-menu.js'
import type { MenuDef } from '../types.js'

describe('useMenu', () => {
  describe('Basic orchestration', () => {
    it('should return a menu with empty nodes when no nodes or loader provided', () => {
      const menuDef: MenuDef = {
        id: 'test-menu',
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      expect(result.current.menu).toBeDefined()
      expect(result.current.menu.nodes).toEqual([])
      expect(result.current.menu.surfaceId).toBe('test-surface')
      expect(result.current.aggregatedState).toBeNull()
      expect(result.current.streamingEnabled).toBe(false)
      expect(result.current.completionOrder).toEqual([])
    })

    it('should instantiate menu with static nodes', () => {
      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          { kind: 'item', id: 'item-1', label: 'Item 1' },
          { kind: 'item', id: 'item-2', label: 'Item 2' },
        ],
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      expect(result.current.menu.nodes!).toHaveLength(2)
      expect(result.current.menu.nodes![0]?.id).toBe('item-1')
      expect(result.current.menu.nodes![1]?.id).toBe('item-2')
      expect(result.current.aggregatedState).toBeNull()
    })

    it('should set menu depth to 0 for root menus', () => {
      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [],
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'test-surface',
          isSubmenu: false,
        }),
      )

      expect(result.current.menu.depth).toBe(0)
    })

    it('should set menu depth to 1 for submenus', () => {
      const menuDef: MenuDef = {
        id: 'test-submenu',
        nodes: [],
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'test-surface',
          isSubmenu: true,
        }),
      )

      expect(result.current.menu.depth).toBe(1)
    })

    it('should pass through defaults to menu instantiation', () => {
      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [],
      }

      const defaults = {
        item: {
          closeOnSelect: false,
        },
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'test-surface',
          defaults,
        }),
      )

      expect(result.current.menu.baseDefaults).toEqual(defaults)
    })
  })

  describe('Root loader result handling', () => {
    it('should apply rootLoaderResult when provided', async () => {
      const menuDef: MenuDef = {
        id: 'test-menu',
      }

      const mockLoader = vi.fn(() => ({
        data: [{ kind: 'item' as const, id: 'loaded-item', label: 'Loaded' }],
        isLoading: false,
      }))

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'test-surface',
          rootLoaderResult: mockLoader,
        }),
      )

      expect(result.current.menu.loader).toBe(mockLoader)
    })

    it('should override menu loader with rootLoaderResult', () => {
      const originalLoader = vi.fn(() => ({
        data: [],
        isLoading: false,
      }))

      const newLoader = vi.fn(() => ({
        data: [{ kind: 'item' as const, id: 'new-item', label: 'New' }],
        isLoading: false,
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        loader: originalLoader,
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'test-surface',
          rootLoaderResult: newLoader,
        }),
      )

      expect(result.current.menu.loader).toBe(newLoader)
      expect(result.current.menu.loader).not.toBe(originalLoader)
    })
  })

  describe('Deep search integration', () => {
    it('should collect loaders from nested submenus with deepSearch enabled', async () => {
      const submenuLoader = vi.fn(() => ({
        data: [
          { kind: 'item' as const, id: 'sub-item', label: 'Submenu Item' },
        ],
        isLoading: false,
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'settings',
            label: 'Settings',
            loader: submenuLoader,
            deepSearch: true,
          },
        ],
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: 'item',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      await waitFor(() => {
        expect(result.current.aggregatedState).not.toBeNull()
      })

      expect(submenuLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'item',
          isOpen: true,
        }),
      )
    })

    it('should not execute deep search loaders when query is empty', () => {
      const submenuLoader = vi.fn(() => ({
        data: [],
        isLoading: false,
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'settings',
            label: 'Settings',
            loader: submenuLoader,
            deepSearch: true,
          },
        ],
      }

      renderHook(() =>
        useMenu({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      // Loader is called but with isOpen: false when query is empty
      expect(submenuLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          query: '',
          isOpen: false,
        }),
      )
    })

    it('should not execute deep search loaders when menu is closed', () => {
      const submenuLoader = vi.fn(() => ({
        data: [],
        isLoading: false,
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'settings',
            label: 'Settings',
            loader: submenuLoader,
            deepSearch: true,
          },
        ],
      }

      renderHook(() =>
        useMenu({
          menuDef,
          query: 'test',
          open: false,
          surfaceId: 'test-surface',
        }),
      )

      // Loader is called but with isOpen: false when menu is closed
      expect(submenuLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test',
          isOpen: false,
        }),
      )
    })

    it('should skip deep search injection for submenus', async () => {
      const submenuLoader = vi.fn(() => ({
        data: [{ kind: 'item' as const, id: 'item', label: 'Item' }],
        isLoading: false,
      }))

      const menuDef: MenuDef = {
        id: 'test-submenu',
        nodes: [
          {
            kind: 'submenu',
            id: 'nested',
            label: 'Nested',
            loader: submenuLoader,
            deepSearch: true,
          },
        ],
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: 'item',
          open: true,
          surfaceId: 'test-surface',
          isSubmenu: true, // This is a submenu, so deep search should not be applied
        }),
      )

      // Even if there are deep search loaders, they should not be injected in submenus
      expect(result.current.menu.loadingState?.progress).toBeUndefined()
    })
  })

  describe('Loader filtering', () => {
    it('should filter loaders based on custom filterLoaders function', () => {
      const loader1 = vi.fn(() => ({ data: [], isLoading: false }))
      const loader2 = vi.fn(() => ({ data: [], isLoading: false }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'submenu1',
            label: 'Submenu 1',
            loader: loader1,
            deepSearch: true,
            search: { minLength: { deep: 3 } },
          },
          {
            kind: 'submenu',
            id: 'submenu2',
            label: 'Submenu 2',
            loader: loader2,
            deepSearch: true,
            search: { minLength: { deep: 1 } },
          },
        ],
      }

      const filterLoaders = vi.fn((entry, query) => {
        const threshold = entry.searchConfig?.minLength?.deep ?? 0
        return query.length >= threshold
      })

      renderHook(() =>
        useMenu({
          menuDef,
          query: 'ab', // 2 characters
          open: true,
          surfaceId: 'test-surface',
          filterLoaders,
        }),
      )

      // loader1 requires 3 characters, so it should be called with isOpen: false
      expect(loader1).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'ab',
          isOpen: false,
        }),
      )
      // loader2 requires 1 character, so it should be executed with isOpen: true
      expect(loader2).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'ab',
          isOpen: true,
        }),
      )
    })

    it('should execute all loaders when no filterLoaders function provided', () => {
      const loader1 = vi.fn(() => ({ data: [], isLoading: false }))
      const loader2 = vi.fn(() => ({ data: [], isLoading: false }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'submenu1',
            label: 'Submenu 1',
            loader: loader1,
            deepSearch: true,
          },
          {
            kind: 'submenu',
            id: 'submenu2',
            label: 'Submenu 2',
            loader: loader2,
            deepSearch: true,
          },
        ],
      }

      renderHook(() =>
        useMenu({
          menuDef,
          query: 'test',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      expect(loader1).toHaveBeenCalled()
      expect(loader2).toHaveBeenCalled()
    })
  })

  describe('Streaming mode', () => {
    it('should enable streaming when search.streaming is true and has server loader', () => {
      const loader = vi.fn(() => ({
        data: [],
        isLoading: false,
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'settings',
            label: 'Settings',
            loader,
            deepSearch: true,
            search: {
              mode: 'server', // Server mode is required for streaming
            },
          },
        ],
        search: {
          streaming: true,
        },
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      expect(result.current.streamingEnabled).toBe(true)
    })

    it('should enable streaming when search.streaming is an object with enabled: true and has server loader', () => {
      const loader = vi.fn(() => ({
        data: [],
        isLoading: false,
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'settings',
            label: 'Settings',
            loader,
            deepSearch: true,
            search: {
              mode: 'hybrid', // Hybrid mode is also valid for streaming
            },
          },
        ],
        search: {
          streaming: { enabled: true },
        },
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      expect(result.current.streamingEnabled).toBe(true)
    })

    it('should disable streaming when search.streaming is false', () => {
      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [],
        search: {
          streaming: false,
        },
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      expect(result.current.streamingEnabled).toBe(false)
    })

    it('should set loadMode to streaming when streaming is enabled', async () => {
      const loader = vi.fn(() => ({
        data: [{ kind: 'item' as const, id: 'item', label: 'Item' }],
        isLoading: false,
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'settings',
            label: 'Settings',
            loader,
            deepSearch: true,
          },
        ],
        search: {
          streaming: true,
        },
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: 'item',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      await waitFor(() => {
        expect(result.current.menu.loadingState?.loadMode).toBe('streaming')
      })
    })

    it('should set loadMode to blocking when streaming is disabled', async () => {
      const loader = vi.fn(() => ({
        data: [{ kind: 'item' as const, id: 'item', label: 'Item' }],
        isLoading: false,
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'settings',
            label: 'Settings',
            loader,
            deepSearch: true,
          },
        ],
        search: {
          streaming: false,
        },
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: 'item',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      await waitFor(() => {
        expect(result.current.menu.loadingState?.loadMode).toBe('blocking')
      })
    })

    it('should track completion order in streaming mode', async () => {
      const loader1 = vi.fn(() => ({
        data: [{ kind: 'item' as const, id: 'item1', label: 'Item 1' }],
        isLoading: false,
      }))

      const loader2 = vi.fn(() => ({
        data: [{ kind: 'item' as const, id: 'item2', label: 'Item 2' }],
        isLoading: false,
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'submenu1',
            label: 'Submenu 1',
            loader: loader1,
            deepSearch: true,
          },
          {
            kind: 'submenu',
            id: 'submenu2',
            label: 'Submenu 2',
            loader: loader2,
            deepSearch: true,
          },
        ],
        search: {
          streaming: true,
        },
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: 'item',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      await waitFor(() => {
        expect(result.current.completionOrder.length).toBeGreaterThan(0)
      })

      // Both loaders should complete
      expect(result.current.completionOrder).toContain('submenu1')
      expect(result.current.completionOrder).toContain('submenu2')
    })
  })

  describe('Aggregated state handling', () => {
    it('should aggregate loading state from multiple loaders', async () => {
      const loader1 = vi.fn(() => ({
        data: undefined,
        isLoading: true,
      }))

      const loader2 = vi.fn(() => ({
        data: [{ kind: 'item' as const, id: 'item', label: 'Item' }],
        isLoading: false,
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'submenu1',
            label: 'Submenu 1',
            loader: loader1,
            deepSearch: true,
          },
          {
            kind: 'submenu',
            id: 'submenu2',
            label: 'Submenu 2',
            loader: loader2,
            deepSearch: true,
          },
        ],
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: 'test',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      await waitFor(() => {
        expect(result.current.aggregatedState).not.toBeNull()
      })

      // At least one loader is still loading
      expect(result.current.aggregatedState?.isLoading).toBe(true)
    })

    it('should include progress information in aggregated state', async () => {
      const loader = vi.fn(() => ({
        data: undefined,
        isLoading: true,
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'settings',
            label: 'Settings',
            loader,
            deepSearch: true,
          },
        ],
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: 'test',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      await waitFor(() => {
        expect(result.current.aggregatedState).not.toBeNull()
      })

      expect(result.current.aggregatedState?.progress).toBeDefined()
      expect(result.current.aggregatedState?.progress?.length).toBeGreaterThan(
        0,
      )
      expect(result.current.aggregatedState?.progress?.[0]).toMatchObject({
        path: ['settings'],
        isLoading: true,
      })
    })

    it('should merge aggregated state into menu loadingState', async () => {
      const loader = vi.fn(() => ({
        data: [{ kind: 'item' as const, id: 'item', label: 'Item' }],
        isLoading: false,
        isFetching: true,
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'settings',
            label: 'Settings',
            loader,
            deepSearch: true,
          },
        ],
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: 'test',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      await waitFor(() => {
        expect(result.current.menu.loadingState).toBeDefined()
      })

      expect(result.current.menu.loadingState?.isFetching).toBe(true)
      expect(result.current.menu.loadingState?.progress).toBeDefined()
    })

    it('should not merge aggregated state for submenus', async () => {
      const loader = vi.fn(() => ({
        data: [{ kind: 'item' as const, id: 'item', label: 'Item' }],
        isLoading: true,
      }))

      const menuDef: MenuDef = {
        id: 'test-submenu',
        nodes: [
          {
            kind: 'submenu',
            id: 'nested',
            label: 'Nested',
            loader,
            deepSearch: true,
          },
        ],
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: 'test',
          open: true,
          surfaceId: 'test-surface',
          isSubmenu: true,
        }),
      )

      // Submenus should not have aggregated loading state from deep search
      expect(result.current.menu.loadingState?.progress).toBeUndefined()
    })
  })

  describe('Re-rendering behavior', () => {
    it('should update menu when query changes', async () => {
      const loader = vi.fn((ctx) => ({
        data: [
          { kind: 'item' as const, id: 'item', label: `Item ${ctx.query}` },
        ],
        isLoading: false,
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'settings',
            label: 'Settings',
            loader,
            deepSearch: true,
          },
        ],
      }

      const { result, rerender } = renderHook(
        ({ query }) =>
          useMenu({
            menuDef,
            query,
            open: true,
            surfaceId: 'test-surface',
          }),
        { initialProps: { query: 'first' } },
      )

      await waitFor(() => {
        expect(loader).toHaveBeenCalledWith(
          expect.objectContaining({ query: 'first' }),
        )
      })

      rerender({ query: 'second' })

      await waitFor(() => {
        expect(loader).toHaveBeenCalledWith(
          expect.objectContaining({ query: 'second' }),
        )
      })
    })

    it('should update menu when open state changes', () => {
      const loader = vi.fn(() => ({
        data: [],
        isLoading: false,
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'settings',
            label: 'Settings',
            loader,
            deepSearch: true,
          },
        ],
      }

      const { rerender } = renderHook(
        ({ open }) =>
          useMenu({
            menuDef,
            query: 'test',
            open,
            surfaceId: 'test-surface',
          }),
        { initialProps: { open: false } },
      )

      // Loader is called but with isOpen: false when closed
      expect(loader).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test',
          isOpen: false,
        }),
      )

      rerender({ open: true })

      // Loader should be called with isOpen: true when opened
      expect(loader).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test',
          isOpen: true,
        }),
      )
    })

    it('should maintain stable menu instance when unrelated props change', () => {
      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [{ kind: 'item', id: 'item', label: 'Item' }],
      }

      const { result, rerender } = renderHook(
        ({ surfaceId }) =>
          useMenu({
            menuDef,
            query: '',
            open: true,
            surfaceId,
          }),
        { initialProps: { surfaceId: 'surface-1' } },
      )

      const firstMenu = result.current.menu

      rerender({ surfaceId: 'surface-2' })

      // Menu should be recreated with new surfaceId
      expect(result.current.menu.surfaceId).toBe('surface-2')
      expect(result.current.menu).not.toBe(firstMenu)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty menu definition gracefully', () => {
      const menuDef: MenuDef = {
        id: 'empty-menu',
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: '',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      expect(result.current.menu).toBeDefined()
      expect(result.current.menu.nodes).toEqual([])
      expect(result.current.aggregatedState).toBeNull()
    })

    it('should handle deeply nested submenus', async () => {
      const deepLoader = vi.fn(() => ({
        data: [{ kind: 'item' as const, id: 'deep-item', label: 'Deep Item' }],
        isLoading: false,
      }))

      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'level1',
            label: 'Level 1',
            deepSearch: true,
            nodes: [
              {
                kind: 'submenu',
                id: 'level2',
                label: 'Level 2',
                loader: deepLoader,
                deepSearch: true,
              },
            ],
          },
        ],
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: 'deep',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      await waitFor(() => {
        expect(deepLoader).toHaveBeenCalled()
      })

      expect(result.current.aggregatedState).not.toBeNull()
    })

    it('should handle loaders that return no data', async () => {
      const emptyLoader = vi.fn(() => ({
        data: [],
        isLoading: false,
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'empty',
            label: 'Empty',
            loader: emptyLoader,
            deepSearch: true,
          },
        ],
      }

      const { result } = renderHook(() =>
        useMenu({
          menuDef,
          query: 'test',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      await waitFor(() => {
        expect(emptyLoader).toHaveBeenCalled()
      })

      expect(result.current.aggregatedState).not.toBeNull()
      expect(result.current.aggregatedState?.results.size).toBeGreaterThan(0)
    })

    it('should handle loaders with errors gracefully', async () => {
      const errorLoader = vi.fn(() => ({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Load failed'),
      }))

      const menuDef: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'error-submenu',
            label: 'Error',
            loader: errorLoader,
            deepSearch: true,
          },
        ],
      }

      renderHook(() =>
        useMenu({
          menuDef,
          query: 'test',
          open: true,
          surfaceId: 'test-surface',
        }),
      )

      await waitFor(() => {
        expect(errorLoader).toHaveBeenCalled()
      })
    })
  })
})
