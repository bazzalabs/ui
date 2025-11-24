/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  type UseMenuInstantiationConfig,
  useMenuInstantiation,
} from '../hooks/use-menu-instantiation.js'
import type { UseStreamingStateResult } from '../hooks/use-streaming-state.js'
import type {
  AggregatedLoaderState,
  AsyncNodeLoaderResult,
  MenuDef,
  NodeDef,
} from '../types.js'

// Helper to create mock streaming state
function createMockStreamingState(): UseStreamingStateResult {
  return {
    injectedMenuDefRef: { current: null },
    processedLoadersRef: { current: new Set() },
    completionOrderRef: { current: [] },
  }
}

describe('useMenuInstantiation', () => {
  describe('basic menu instantiation', () => {
    it('instantiates a basic menu', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test-menu',
        title: 'Test Menu',
        nodes: [
          { kind: 'item', id: 'item-1', label: 'Item 1' },
          { kind: 'item', id: 'item-2', label: 'Item 2' },
        ],
      }

      const streamingState = createMockStreamingState()

      const { result } = renderHook(() =>
        useMenuInstantiation({
          menuDef,
          surfaceId: 'test-surface',
          isSubmenu: false,
          aggregatedState: null,
          streamingEnabled: false,
          streamingState,
        }),
      )

      expect(result.current.menu.id).toBe('test-menu')
      expect(result.current.menu.title).toBe('Test Menu')
      expect(result.current.menu.surfaceId).toBe('test-surface')
      expect(result.current.menu.nodes!).toHaveLength(2)
    })

    it('sets depth to 0 for root menu', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root-menu',
        nodes: [],
      }

      const streamingState = createMockStreamingState()

      const { result } = renderHook(() =>
        useMenuInstantiation({
          menuDef,
          surfaceId: 'root',
          isSubmenu: false,
          aggregatedState: null,
          streamingEnabled: false,
          streamingState,
        }),
      )

      expect(result.current.menu.depth).toBe(0)
    })

    it('sets depth to 1 for submenu', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'submenu',
        nodes: [],
      }

      const streamingState = createMockStreamingState()

      const { result } = renderHook(() =>
        useMenuInstantiation({
          menuDef,
          surfaceId: 'submenu-surface',
          isSubmenu: true,
          aggregatedState: null,
          streamingEnabled: false,
          streamingState,
        }),
      )

      expect(result.current.menu.depth).toBe(1)
    })

    it('instantiates menu with nodes', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'menu',
        nodes: [
          { kind: 'item', label: 'New File' },
          {
            kind: 'group',
            id: 'group-1',
            nodes: [
              { kind: 'item', label: 'Save' },
              { kind: 'item', label: 'Save As' },
            ],
          },
        ],
      }

      const streamingState = createMockStreamingState()

      const { result } = renderHook(() =>
        useMenuInstantiation({
          menuDef,
          surfaceId: 'root',
          isSubmenu: false,
          aggregatedState: null,
          streamingEnabled: false,
          streamingState,
        }),
      )

      expect(result.current.menu.nodes!).toHaveLength(2)
      expect(result.current.menu.nodes![0]?.kind).toBe('item')
      expect(result.current.menu.nodes![0]?.id).toBe('new-file')
      expect(result.current.menu.nodes![1]?.kind).toBe('group')
    })
  })

  describe('rootLoaderResult application', () => {
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

      const streamingState = createMockStreamingState()

      const { result } = renderHook(() =>
        useMenuInstantiation({
          menuDef,
          surfaceId: 'root',
          isSubmenu: false,
          aggregatedState: null,
          streamingEnabled: false,
          streamingState,
          rootLoaderResult,
        }),
      )

      expect(result.current.menu.loader).toBe(rootLoaderResult)
    })
  })

  describe('defaults application', () => {
    it('applies defaults to menu items', () => {
      const onSelect = vi.fn()

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [{ kind: 'item', id: 'item', label: 'Item' }],
      }

      const streamingState = createMockStreamingState()

      const { result } = renderHook(() =>
        useMenuInstantiation({
          menuDef,
          surfaceId: 'root',
          isSubmenu: false,
          aggregatedState: null,
          streamingEnabled: false,
          streamingState,
          defaults: {
            item: {
              onSelect,
              closeOnSelect: true,
            },
          },
        }),
      )

      const item = result.current.menu.nodes![0] as any
      expect(item.onSelect).toBe(onSelect)
      expect(item.closeOnSelect).toBe(true)
    })
  })

  describe('loading state merging', () => {
    it('merges aggregated loading state for root menu', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [],
      }

      const aggregatedState: AggregatedLoaderState = {
        isLoading: true,
        isError: false,
        isFetching: true,
        progress: [],
        results: new Map(),
        completedPaths: new Set(),
        inProgressPaths: new Set(['submenu-1']),
      }

      const streamingState = createMockStreamingState()

      const { result } = renderHook(() =>
        useMenuInstantiation({
          menuDef,
          surfaceId: 'root',
          isSubmenu: false,
          aggregatedState,
          streamingEnabled: false,
          streamingState,
        }),
      )

      expect(result.current.menu.loadingState?.isLoading).toBe(true)
      expect(result.current.menu.loadingState?.isFetching).toBe(true)
      expect(result.current.menu.loadingState?.inProgressPaths).toEqual(
        new Set(['submenu-1']),
      )
    })

    it('sets loadMode to blocking when streaming disabled', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [],
      }

      const aggregatedState: AggregatedLoaderState = {
        isLoading: false,
        isError: false,
        isFetching: false,
        progress: [],
        results: new Map(),
        completedPaths: new Set(),
        inProgressPaths: new Set(),
      }

      const streamingState = createMockStreamingState()

      const { result } = renderHook(() =>
        useMenuInstantiation({
          menuDef,
          surfaceId: 'root',
          isSubmenu: false,
          aggregatedState,
          streamingEnabled: false,
          streamingState,
        }),
      )

      expect(result.current.menu.loadingState?.loadMode).toBe('blocking')
    })

    it('sets loadMode to streaming when streaming enabled', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [],
      }

      const aggregatedState: AggregatedLoaderState = {
        isLoading: false,
        isError: false,
        isFetching: false,
        progress: [],
        results: new Map(),
        completedPaths: new Set(),
        inProgressPaths: new Set(),
      }

      const streamingState = createMockStreamingState()

      const { result } = renderHook(() =>
        useMenuInstantiation({
          menuDef,
          surfaceId: 'root',
          isSubmenu: false,
          aggregatedState,
          streamingEnabled: true,
          streamingState,
        }),
      )

      expect(result.current.menu.loadingState?.loadMode).toBe('streaming')
    })

    it('includes completion order in loading state', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [],
      }

      const aggregatedState: AggregatedLoaderState = {
        isLoading: false,
        isError: false,
        isFetching: false,
        progress: [],
        results: new Map(),
        completedPaths: new Set(),
        inProgressPaths: new Set(),
      }

      const streamingState = createMockStreamingState()
      streamingState.completionOrderRef.current = ['submenu-1', 'submenu-2']

      const { result } = renderHook(() =>
        useMenuInstantiation({
          menuDef,
          surfaceId: 'root',
          isSubmenu: false,
          aggregatedState,
          streamingEnabled: true,
          streamingState,
        }),
      )

      expect(
        (result.current.menu.loadingState as any)?.completionOrder,
      ).toEqual(['submenu-1', 'submenu-2'])
    })

    it('does not merge loading state for submenus', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'submenu',
        nodes: [],
      }

      const aggregatedState: AggregatedLoaderState = {
        isLoading: true,
        isError: false,
        isFetching: true,
        progress: [],
        results: new Map(),
        completedPaths: new Set(),
        inProgressPaths: new Set(),
      }

      const streamingState = createMockStreamingState()

      const { result } = renderHook(() =>
        useMenuInstantiation({
          menuDef,
          surfaceId: 'submenu',
          isSubmenu: true,
          aggregatedState,
          streamingEnabled: false,
          streamingState,
        }),
      )

      // Submenus should NOT have merged loading state
      expect(result.current.menu.loadingState).toBeUndefined()
    })
  })

  describe('injection behavior', () => {
    it('skips injection for submenus', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'submenu',
        nodes: [{ kind: 'item', id: 'item', label: 'Item' }],
      }

      const aggregatedState: AggregatedLoaderState = {
        isLoading: false,
        isError: false,
        isFetching: false,
        progress: [],
        results: new Map([
          [
            'some-path',
            {
              data: [{ kind: 'item', id: 'injected', label: 'Injected' }],
              isLoading: false,
              isError: false,
              isFetching: false,
            },
          ],
        ]),
        completedPaths: new Set(),
        inProgressPaths: new Set(),
      }

      const streamingState = createMockStreamingState()

      const { result } = renderHook(() =>
        useMenuInstantiation({
          menuDef,
          surfaceId: 'submenu',
          isSubmenu: true,
          aggregatedState,
          streamingEnabled: false,
          streamingState,
        }),
      )

      // Should have original nodes, not injected ones
      expect(result.current.menu.nodes!).toHaveLength(1)
      expect(result.current.menu.nodes![0]?.id).toBe('item')
    })
  })

  describe('edge cases', () => {
    it('handles empty menu definition', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'empty',
        nodes: [],
      }

      const streamingState = createMockStreamingState()

      const { result } = renderHook(() =>
        useMenuInstantiation({
          menuDef,
          surfaceId: 'root',
          isSubmenu: false,
          aggregatedState: null,
          streamingEnabled: false,
          streamingState,
        }),
      )

      expect(result.current.menu.nodes).toHaveLength(0)
    })

    it('handles null aggregatedState', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [{ kind: 'item', id: 'item', label: 'Item' }],
      }

      const streamingState = createMockStreamingState()

      const { result } = renderHook(() =>
        useMenuInstantiation({
          menuDef,
          surfaceId: 'root',
          isSubmenu: false,
          aggregatedState: null,
          streamingEnabled: false,
          streamingState,
        }),
      )

      expect(result.current.menu.nodes!).toHaveLength(1)
      expect(result.current.menu.loadingState).toBeUndefined()
    })

    it('handles empty aggregatedState results', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [],
      }

      const aggregatedState: AggregatedLoaderState = {
        isLoading: false,
        isError: false,
        isFetching: false,
        progress: [],
        results: new Map(), // Empty results
        completedPaths: new Set(),
        inProgressPaths: new Set(),
      }

      const streamingState = createMockStreamingState()

      const { result } = renderHook(() =>
        useMenuInstantiation({
          menuDef,
          surfaceId: 'root',
          isSubmenu: false,
          aggregatedState,
          streamingEnabled: false,
          streamingState,
        }),
      )

      // Should handle empty results gracefully
      expect(result.current.menu.nodes!).toHaveLength(0)
    })

    it('rebuilds menu when menuDef changes', () => {
      const menuDef1: MenuDef<unknown> = {
        id: 'menu-v1',
        nodes: [{ kind: 'item', id: 'item-1', label: 'Item 1' }],
      }

      const menuDef2: MenuDef<unknown> = {
        id: 'menu-v2',
        nodes: [
          { kind: 'item', id: 'item-1', label: 'Item 1' },
          { kind: 'item', id: 'item-2', label: 'Item 2' },
        ],
      }

      const streamingState = createMockStreamingState()

      const { result, rerender } = renderHook(
        (props: UseMenuInstantiationConfig<unknown>) =>
          useMenuInstantiation(props),
        {
          initialProps: {
            menuDef: menuDef1,
            surfaceId: 'root',
            isSubmenu: false,
            aggregatedState: null,
            streamingEnabled: false,
            streamingState,
          },
        },
      )

      expect(result.current.menu.id).toBe('menu-v1')
      expect(result.current.menu.nodes!).toHaveLength(1)

      // Update menuDef
      rerender({
        menuDef: menuDef2,
        surfaceId: 'root',
        isSubmenu: false,
        aggregatedState: null,
        streamingEnabled: false,
        streamingState,
      })

      expect(result.current.menu.id).toBe('menu-v2')
      expect(result.current.menu.nodes!).toHaveLength(2)
    })
  })
})
