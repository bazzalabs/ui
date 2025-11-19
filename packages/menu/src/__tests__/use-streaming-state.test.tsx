/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  type UseStreamingStateConfig,
  useStreamingState,
} from '../hooks/use-streaming-state.js'
import type { AsyncNodeLoader, MenuDef, NodeDef } from '../types.js'
import type { DeepSearchLoaderEntry } from '../utils/deep-search.js'

// Helper to create a mock loader
function createMockLoader<T>(data: NodeDef<T>[]): AsyncNodeLoader<T> {
  return () => ({
    data,
    isLoading: false,
    isError: false,
    isFetching: false,
  })
}

describe('useStreamingState', () => {
  describe('ref initialization', () => {
    it('initializes refs with empty/null values', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [],
      }

      const { result } = renderHook(() =>
        useStreamingState({
          menuDef,
          query: '',
          aggregatedState: null,
          streamingEnabled: false,
          stableLoaderEntries: [],
        }),
      )

      expect(result.current.injectedMenuDefRef.current).toBeNull()
      expect(result.current.processedLoadersRef.current.size).toBe(0)
      expect(result.current.completionOrderRef.current).toEqual([])
    })
  })

  describe('query change reset', () => {
    it('resets state when query changes', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [],
      }

      const { result, rerender } = renderHook(
        (props: UseStreamingStateConfig<unknown>) => useStreamingState(props),
        {
          initialProps: {
            menuDef,
            query: 'first',
            aggregatedState: null,
            streamingEnabled: true,
            stableLoaderEntries: [],
          },
        },
      )

      // Manually add some state to simulate processing
      result.current.processedLoadersRef.current.add('test-path')
      result.current.completionOrderRef.current.push('test-id')
      result.current.injectedMenuDefRef.current = { id: 'test' } as any

      expect(result.current.processedLoadersRef.current.size).toBe(1)
      expect(result.current.completionOrderRef.current).toHaveLength(1)
      expect(result.current.injectedMenuDefRef.current).not.toBeNull()

      // Change query
      rerender({
        menuDef,
        query: 'second',
        aggregatedState: null,
        streamingEnabled: true,
        stableLoaderEntries: [],
      })

      // State should be reset
      expect(result.current.injectedMenuDefRef.current).toBeNull()
      expect(result.current.processedLoadersRef.current.size).toBe(0)
      expect(result.current.completionOrderRef.current).toEqual([])
    })

    it('does not reset when query is unchanged', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [],
      }

      const { result, rerender } = renderHook(
        (props: UseStreamingStateConfig<unknown>) => useStreamingState(props),
        {
          initialProps: {
            menuDef,
            query: 'same',
            aggregatedState: null,
            streamingEnabled: true,
            stableLoaderEntries: [],
          },
        },
      )

      // Add some state
      result.current.processedLoadersRef.current.add('test-path')
      result.current.completionOrderRef.current.push('test-id')

      // Rerender with same query
      rerender({
        menuDef,
        query: 'same',
        aggregatedState: null,
        streamingEnabled: true,
        stableLoaderEntries: [],
      })

      // State should be preserved
      expect(result.current.processedLoadersRef.current.size).toBe(1)
      expect(result.current.completionOrderRef.current).toHaveLength(1)
    })
  })

  describe('completion order initialization', () => {
    it('initializes completion order with static submenus', () => {
      const mockLoader = createMockLoader([
        { kind: 'item', id: 'result', label: 'Result' },
      ])

      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'static-submenu',
            label: 'Static',
            nodes: [], // No loader - static
          },
          {
            kind: 'submenu',
            id: 'async-submenu',
            label: 'Async',
            loader: mockLoader,
            nodes: [],
          },
        ],
      }

      const stableLoaderEntries: DeepSearchLoaderEntry<unknown>[] = [
        {
          path: ['async-submenu'],
          loader: mockLoader,
        },
      ]

      const { result } = renderHook(() =>
        useStreamingState({
          menuDef,
          query: 'test', // Non-empty query
          aggregatedState: null,
          streamingEnabled: true, // Streaming must be enabled
          stableLoaderEntries,
        }),
      )

      // Static submenu should be in completion order
      expect(result.current.completionOrderRef.current).toContain(
        'static-submenu',
      )
      // Async submenu should NOT be in initial completion order
      expect(result.current.completionOrderRef.current).not.toContain(
        'async-submenu',
      )
    })

    it('does not initialize when streaming is disabled', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'static-submenu',
            label: 'Static',
            nodes: [],
          },
        ],
      }

      const { result } = renderHook(() =>
        useStreamingState({
          menuDef,
          query: 'test',
          aggregatedState: null,
          streamingEnabled: false, // Streaming disabled
          stableLoaderEntries: [],
        }),
      )

      // Should not initialize completion order
      expect(result.current.completionOrderRef.current).toEqual([])
    })

    it('does not initialize when query is empty', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'static-submenu',
            label: 'Static',
            nodes: [],
          },
        ],
      }

      const { result } = renderHook(() =>
        useStreamingState({
          menuDef,
          query: '', // Empty query
          aggregatedState: null,
          streamingEnabled: true,
          stableLoaderEntries: [],
        }),
      )

      // Should not initialize with empty query
      expect(result.current.completionOrderRef.current).toEqual([])
    })

    it('only initializes once per query', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          {
            kind: 'submenu',
            id: 'static-submenu',
            label: 'Static',
            nodes: [],
          },
        ],
      }

      const { result, rerender } = renderHook(
        (props: UseStreamingStateConfig<unknown>) => useStreamingState(props),
        {
          initialProps: {
            menuDef,
            query: 'test',
            aggregatedState: null,
            streamingEnabled: true,
            stableLoaderEntries: [],
          },
        },
      )

      const initialOrder = [...result.current.completionOrderRef.current]

      // Rerender multiple times with same query
      rerender({
        menuDef,
        query: 'test',
        aggregatedState: null,
        streamingEnabled: true,
        stableLoaderEntries: [],
      })

      rerender({
        menuDef,
        query: 'test',
        aggregatedState: null,
        streamingEnabled: true,
        stableLoaderEntries: [],
      })

      // Order should remain the same (not re-initialized)
      expect(result.current.completionOrderRef.current).toEqual(initialOrder)
    })
  })

  describe('state persistence', () => {
    it('persists refs across re-renders', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [],
      }

      const { result, rerender } = renderHook(
        (props: UseStreamingStateConfig<unknown>) => useStreamingState(props),
        {
          initialProps: {
            menuDef,
            query: 'test',
            aggregatedState: null,
            streamingEnabled: true,
            stableLoaderEntries: [],
          },
        },
      )

      // Add some state
      const testMenuDef = { id: 'test' } as any
      result.current.injectedMenuDefRef.current = testMenuDef
      result.current.processedLoadersRef.current.add('path-1')
      result.current.completionOrderRef.current.push('id-1')

      // Rerender
      rerender({
        menuDef,
        query: 'test',
        aggregatedState: null,
        streamingEnabled: true,
        stableLoaderEntries: [],
      })

      // Refs should maintain same identity and values
      expect(result.current.injectedMenuDefRef.current).toBe(testMenuDef)
      expect(result.current.processedLoadersRef.current.has('path-1')).toBe(
        true,
      )
      expect(result.current.completionOrderRef.current).toContain('id-1')
    })
  })

  describe('edge cases', () => {
    it('handles empty menu definition', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'empty',
        nodes: [],
      }

      const { result } = renderHook(() =>
        useStreamingState({
          menuDef,
          query: 'test',
          aggregatedState: null,
          streamingEnabled: true,
          stableLoaderEntries: [],
        }),
      )

      expect(result.current.completionOrderRef.current).toEqual([])
    })

    it('handles menu with no submenus', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [
          { kind: 'item', id: 'item-1', label: 'Item 1' },
          { kind: 'item', id: 'item-2', label: 'Item 2' },
        ],
      }

      const { result } = renderHook(() =>
        useStreamingState({
          menuDef,
          query: 'test',
          aggregatedState: null,
          streamingEnabled: true,
          stableLoaderEntries: [],
        }),
      )

      expect(result.current.completionOrderRef.current).toEqual([])
    })

    it('handles null aggregatedState', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [],
      }

      const { result } = renderHook(() =>
        useStreamingState({
          menuDef,
          query: 'test',
          aggregatedState: null,
          streamingEnabled: true,
          stableLoaderEntries: [],
        }),
      )

      // Should not error with null aggregatedState
      expect(result.current.injectedMenuDefRef.current).toBeNull()
    })

    it('handles rapid query changes', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root',
        nodes: [],
      }

      const { result, rerender } = renderHook(
        (props: UseStreamingStateConfig<unknown>) => useStreamingState(props),
        {
          initialProps: {
            menuDef,
            query: 'first',
            aggregatedState: null,
            streamingEnabled: true,
            stableLoaderEntries: [],
          },
        },
      )

      // Add state
      result.current.processedLoadersRef.current.add('test')

      // Rapid query changes
      rerender({
        menuDef,
        query: 'second',
        aggregatedState: null,
        streamingEnabled: true,
        stableLoaderEntries: [],
      })

      expect(result.current.processedLoadersRef.current.size).toBe(0)

      rerender({
        menuDef,
        query: 'third',
        aggregatedState: null,
        streamingEnabled: true,
        stableLoaderEntries: [],
      })

      expect(result.current.processedLoadersRef.current.size).toBe(0)
    })
  })
})
