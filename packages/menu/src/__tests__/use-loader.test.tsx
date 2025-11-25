/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useLoader, useLoaders } from '../hooks/use-loader.js'
import type {
  AsyncNodeLoader,
  AsyncNodeLoaderContext,
  AsyncNodeLoaderResult,
  NodeDef,
} from '../types.js'

// Mock loader that returns static data
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

describe('useLoader', () => {
  describe('single loader execution', () => {
    it('executes a loader and returns result', () => {
      const testData: NodeDef<unknown>[] = [
        { kind: 'item', id: 'item-1', label: 'Item 1' },
      ]
      const loader = createMockLoader(testData)
      const context: AsyncNodeLoaderContext = {
        query: 'test',
        open: true,
      }

      const { result } = renderHook(() => useLoader(loader, context))

      expect(result.current).toBeDefined()
      expect(result.current?.data).toEqual(testData)
      expect(result.current?.isLoading).toBe(false)
      expect(result.current?.isError).toBe(false)
    })

    it('returns undefined when loader is undefined', () => {
      const context: AsyncNodeLoaderContext = {
        query: 'test',
        open: true,
      }

      const { result } = renderHook(() => useLoader(undefined, context))

      expect(result.current).toBeUndefined()
    })

    it('passes context to loader', () => {
      const loaderFn = vi.fn(
        (): AsyncNodeLoaderResult<NodeDef<unknown>> => ({
          data: [],
          isLoading: false,
          isError: false,
          isFetching: false,
        }),
      )

      const context: AsyncNodeLoaderContext = {
        query: 'search query',
        open: true,
      }

      renderHook(() => useLoader(loaderFn, context))

      expect(loaderFn).toHaveBeenCalledWith({
        query: 'search query',
        isOpen: true,
        path: [],
      })
    })

    it('recomputes when context changes', () => {
      const loader = createMockLoader([
        { kind: 'item', id: 'item-1', label: 'Item 1' },
      ])

      const { result, rerender } = renderHook(
        ({ context }) => useLoader(loader, context),
        {
          initialProps: {
            context: { query: 'first', open: true },
          },
        },
      )

      expect(result.current).toBeDefined()

      // Change context
      rerender({
        context: { query: 'second', open: false },
      })

      expect(result.current).toBeDefined()
    })

    it('handles loading state', () => {
      const loader = createMockLoader([], { isLoading: true })
      const context: AsyncNodeLoaderContext = {
        query: 'test',
        open: true,
      }

      const { result } = renderHook(() => useLoader(loader, context))

      expect(result.current?.isLoading).toBe(true)
      expect(result.current?.data).toEqual([])
    })

    it('handles error state', () => {
      const loader = createMockLoader([], { isError: true })
      const context: AsyncNodeLoaderContext = {
        query: 'test',
        open: true,
      }

      const { result } = renderHook(() => useLoader(loader, context))

      expect(result.current?.isError).toBe(true)
    })

    it('handles fetching state', () => {
      const loader = createMockLoader([], { isFetching: true })
      const context: AsyncNodeLoaderContext = {
        query: 'test',
        open: true,
      }

      const { result } = renderHook(() => useLoader(loader, context))

      expect(result.current?.isFetching).toBe(true)
    })
  })

  describe('loader stability', () => {
    it('maintains stable loader reference', () => {
      const loader = createMockLoader([
        { kind: 'item', id: 'item-1', label: 'Item 1' },
      ])
      const context: AsyncNodeLoaderContext = {
        query: 'test',
        open: true,
      }

      const { result, rerender } = renderHook(() => useLoader(loader, context))

      const firstResult = result.current

      // Rerender with same loader
      rerender()

      // Result reference may change, but loader should work consistently
      expect(result.current).toBeDefined()
      expect(result.current?.data).toEqual(firstResult?.data)
    })
  })
})

describe('useLoaders', () => {
  describe('multiple loader execution', () => {
    it('executes multiple loaders in parallel', () => {
      const loader1 = createMockLoader([
        { kind: 'item', id: 'item-1', label: 'Item 1' },
      ])
      const loader2 = createMockLoader([
        { kind: 'item', id: 'item-2', label: 'Item 2' },
      ])

      const loaders = [
        {
          path: ['submenu-1'],
          loader: loader1,
          context: { query: 'test', open: true },
        },
        {
          path: ['submenu-2'],
          loader: loader2,
          context: { query: 'test', open: true },
        },
      ]

      const { result } = renderHook(() => useLoaders(loaders))

      expect(result.current.size).toBe(2)
      expect(result.current.get('submenu-1')).toBeDefined()
      expect(result.current.get('submenu-2')).toBeDefined()
      expect(result.current.get('submenu-1')?.data?.[0]?.id).toBe('item-1')
      expect(result.current.get('submenu-2')?.data?.[0]?.id).toBe('item-2')
    })

    it('builds correct path keys', () => {
      const loader = createMockLoader([
        { kind: 'item', id: 'item-1', label: 'Item 1' },
      ])

      const loaders = [
        {
          path: ['level-1', 'level-2', 'level-3'],
          loader,
          context: { query: 'test', open: true },
        },
      ]

      const { result } = renderHook(() => useLoaders(loaders))

      expect(result.current.has('level-1.level-2.level-3')).toBe(true)
    })

    it('handles empty loaders array', () => {
      const { result } = renderHook(() => useLoaders([]))

      expect(result.current.size).toBe(0)
    })

    it('aggregates loading states', () => {
      const loader1 = createMockLoader([], { isLoading: true })
      const loader2 = createMockLoader([], { isLoading: false })

      const loaders = [
        {
          path: ['submenu-1'],
          loader: loader1,
          context: { query: 'test', open: true },
        },
        {
          path: ['submenu-2'],
          loader: loader2,
          context: { query: 'test', open: true },
        },
      ]

      const { result } = renderHook(() => useLoaders(loaders))

      expect(result.current.get('submenu-1')?.isLoading).toBe(true)
      expect(result.current.get('submenu-2')?.isLoading).toBe(false)
    })

    it('passes individual contexts to loaders', () => {
      const loaderFn1 = vi.fn(
        (): AsyncNodeLoaderResult<NodeDef<unknown>> => ({
          data: [],
          isLoading: false,
          isError: false,
          isFetching: false,
        }),
      )
      const loaderFn2 = vi.fn(
        (): AsyncNodeLoaderResult<NodeDef<unknown>> => ({
          data: [],
          isLoading: false,
          isError: false,
          isFetching: false,
        }),
      )

      const loaders = [
        {
          path: ['submenu-1'],
          loader: loaderFn1,
          context: { query: 'query-1', open: true },
        },
        {
          path: ['submenu-2'],
          loader: loaderFn2,
          context: { query: 'query-2', open: false },
        },
      ]

      renderHook(() => useLoaders(loaders))

      expect(loaderFn1).toHaveBeenCalledWith({
        query: 'query-1',
        isOpen: true,
        path: [],
      })
      expect(loaderFn2).toHaveBeenCalledWith({
        query: 'query-2',
        isOpen: false,
        path: [],
      })
    })
  })

  describe('loader stability', () => {
    it('maintains stable loader array length', () => {
      const loader = createMockLoader([
        { kind: 'item', id: 'item-1', label: 'Item 1' },
      ])

      const loaders = [
        {
          path: ['submenu-1'],
          loader,
          context: { query: 'test', open: true },
        },
      ]

      const { result, rerender } = renderHook(() => useLoaders(loaders))

      expect(result.current.size).toBe(1)

      // Rerender with same loaders
      rerender()

      expect(result.current.size).toBe(1)
    })
  })

  describe('error handling', () => {
    it('collects error states from loaders', () => {
      const loader1 = createMockLoader([], { isError: true })
      const loader2 = createMockLoader([
        { kind: 'item', id: 'item-2', label: 'Item 2' },
      ])

      const loaders = [
        {
          path: ['submenu-1'],
          loader: loader1,
          context: { query: 'test', open: true },
        },
        {
          path: ['submenu-2'],
          loader: loader2,
          context: { query: 'test', open: true },
        },
      ]

      const { result } = renderHook(() => useLoaders(loaders))

      expect(result.current.get('submenu-1')?.isError).toBe(true)
      expect(result.current.get('submenu-2')?.isError).toBe(false)
    })
  })

  describe('result map updates', () => {
    it('recomputes map when loaders change', () => {
      const loader1 = createMockLoader([
        { kind: 'item', id: 'item-1', label: 'Item 1' },
      ])
      const loader2 = createMockLoader([
        { kind: 'item', id: 'item-2', label: 'Item 2' },
      ])

      const { result, rerender } = renderHook(
        ({ loaders }) => useLoaders(loaders),
        {
          initialProps: {
            loaders: [
              {
                path: ['submenu-1'],
                loader: loader1,
                context: { query: 'test', open: true },
              },
            ],
          },
        },
      )

      expect(result.current.size).toBe(1)
      expect(result.current.has('submenu-1')).toBe(true)

      // Add a second loader
      rerender({
        loaders: [
          {
            path: ['submenu-1'],
            loader: loader1,
            context: { query: 'test', open: true },
          },
          {
            path: ['submenu-2'],
            loader: loader2,
            context: { query: 'test', open: true },
          },
        ],
      })

      expect(result.current.size).toBe(2)
      expect(result.current.has('submenu-2')).toBe(true)
    })
  })
})
