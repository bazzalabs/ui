import { describe, expect, it } from 'vitest'
import type {
  AsyncNodeLoader,
  AsyncNodeLoaderResult,
  MenuDef,
  SubmenuDef,
} from '../types.js'
import {
  aggregateLoaderResults,
  collectDeepSearchLoaders,
  injectCompletedLoaderResults,
  injectLoaderResults,
  shouldEnableStreaming,
} from '../utils/deep-search.js'

// Helper to create a mock loader that returns a proper AsyncNodeLoaderResult
function createMockLoader<T = unknown>(): AsyncNodeLoader<T> {
  return () => ({
    data: [],
    isLoading: false,
    isError: false,
    isFetching: false,
  })
}

describe('deep-search', () => {
  describe('collectDeepSearchLoaders', () => {
    it('should collect loaders from direct child submenus', () => {
      const loader1 = createMockLoader()
      const loader2 = createMockLoader()

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            label: 'Submenu 1',
            loader: loader1,
          },
          {
            kind: 'submenu',
            label: 'Submenu 2',
            loader: loader2,
          },
        ],
      }

      const entries = collectDeepSearchLoaders(menu)

      expect(entries).toHaveLength(2)
      expect(entries[0]?.path).toEqual(['submenu-1'])
      expect(entries[0]?.loader).toBe(loader1)
      expect(entries[1]?.path).toEqual(['submenu-2'])
      expect(entries[1]?.loader).toBe(loader2)
    })

    it('should collect loaders from nested submenus', () => {
      const loader1 = createMockLoader()
      const loader2 = createMockLoader()

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            label: 'Parent',
            nodes: [
              {
                kind: 'submenu',
                label: 'Child',
                loader: loader1,
                nodes: [
                  {
                    kind: 'submenu',
                    label: 'Grandchild',
                    loader: loader2,
                  },
                ],
              },
            ],
          },
        ],
      }

      const entries = collectDeepSearchLoaders(menu)

      expect(entries).toHaveLength(2)
      expect(entries[0]?.path).toEqual(['parent', 'child'])
      expect(entries[0]?.loader).toBe(loader1)
      expect(entries[1]?.path).toEqual(['parent', 'child', 'grandchild'])
      expect(entries[1]?.loader).toBe(loader2)
    })

    it('should collect loaders from submenus within groups', () => {
      const loader = createMockLoader()

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'group',
            id: 'group-1',
            nodes: [
              {
                kind: 'submenu',
                label: 'Submenu',
                loader,
              },
            ],
          },
        ],
      }

      const entries = collectDeepSearchLoaders(menu)

      expect(entries).toHaveLength(1)
      expect(entries[0]?.path).toEqual(['submenu'])
      expect(entries[0]?.loader).toBe(loader)
    })

    it('should skip submenus with deepSearch disabled', () => {
      const loader1 = createMockLoader()
      const loader2 = createMockLoader()

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            label: 'Enabled',
            loader: loader1,
          },
          {
            kind: 'submenu',
            label: 'Disabled',
            loader: loader2,
            deepSearch: false,
          },
        ],
      }

      const entries = collectDeepSearchLoaders(menu)

      expect(entries).toHaveLength(1)
      expect(entries[0]?.path).toEqual(['enabled'])
      expect(entries[0]?.loader).toBe(loader1)
    })

    it('should skip descendants of submenus with deepSearch disabled', () => {
      const loader1 = createMockLoader()
      const loader2 = createMockLoader()

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            label: 'Parent',
            loader: loader1,
            deepSearch: false,
            nodes: [
              {
                kind: 'submenu',
                label: 'Child',
                loader: loader2,
              },
            ],
          },
        ],
      }

      const entries = collectDeepSearchLoaders(menu)

      // Parent and child should both be excluded
      expect(entries).toHaveLength(0)
    })

    it('should include search config from submenus', () => {
      const loader = createMockLoader()
      const searchConfig = { minLength: 3, debounce: 500 }

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            label: 'Submenu',
            loader,
            search: searchConfig,
          },
        ],
      }

      const entries = collectDeepSearchLoaders(menu)

      expect(entries).toHaveLength(1)
      expect(entries[0]?.searchConfig).toEqual(searchConfig)
    })

    it('should use submenu id if provided instead of generating from label', () => {
      const loader = createMockLoader()

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'custom-id',
            label: 'Label',
            loader,
          },
        ],
      }

      const entries = collectDeepSearchLoaders(menu)

      expect(entries).toHaveLength(1)
      expect(entries[0]?.path).toEqual(['custom-id'])
    })

    it('should throw error for submenu without id or label', () => {
      const loader = createMockLoader()

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            loader,
          } as any,
        ],
      }

      expect(() => collectDeepSearchLoaders(menu)).toThrow(
        'Submenu must have either an "id" or "label" property',
      )
    })

    it('should handle empty menu', () => {
      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [],
      }

      const entries = collectDeepSearchLoaders(menu)

      expect(entries).toHaveLength(0)
    })

    it('should handle menu without nodes property', () => {
      const menu: MenuDef = {
        id: 'test-menu',
      }

      const entries = collectDeepSearchLoaders(menu)

      expect(entries).toHaveLength(0)
    })
  })

  describe('aggregateLoaderResults', () => {
    const createResult = (
      partial: Partial<AsyncNodeLoaderResult>,
    ): AsyncNodeLoaderResult => ({
      isLoading: false,
      isError: false,
      isFetching: false,
      error: undefined,
      data: undefined,
      ...partial,
    })

    it('should aggregate loading state from multiple loaders', () => {
      const results = new Map<string, AsyncNodeLoaderResult>([
        ['submenu-1', createResult({ isLoading: true })],
        ['submenu-2', createResult({ isLoading: false, data: [] })],
      ])

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          { kind: 'submenu', label: 'Submenu 1' },
          { kind: 'submenu', label: 'Submenu 2' },
        ],
      }

      const aggregated = aggregateLoaderResults(results, menu)

      expect(aggregated.isLoading).toBe(true)
      expect(aggregated.inProgressPaths?.has('submenu-1')).toBe(true)
      expect(aggregated.completedPaths?.has('submenu-2')).toBe(true)
    })

    it('should set isLoading to false when all loaders are done', () => {
      const results = new Map<string, AsyncNodeLoaderResult>([
        ['submenu-1', createResult({ isLoading: false, data: [] })],
        ['submenu-2', createResult({ isLoading: false, data: [] })],
      ])

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          { kind: 'submenu', label: 'Submenu 1' },
          { kind: 'submenu', label: 'Submenu 2' },
        ],
      }

      const aggregated = aggregateLoaderResults(results, menu)

      expect(aggregated.isLoading).toBe(false)
      expect(aggregated.completedPaths?.size).toBe(2)
      expect(aggregated.inProgressPaths?.size).toBe(0)
    })

    it('should set isError to true if any loader has an error', () => {
      const results = new Map<string, AsyncNodeLoaderResult>([
        ['submenu-1', createResult({ isLoading: false, data: [] })],
        [
          'submenu-2',
          createResult({ isError: true, error: new Error('Failed') }),
        ],
      ])

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          { kind: 'submenu', label: 'Submenu 1' },
          { kind: 'submenu', label: 'Submenu 2' },
        ],
      }

      const aggregated = aggregateLoaderResults(results, menu)

      expect(aggregated.isError).toBe(true)
    })

    it('should set isFetching to true if any loader is fetching', () => {
      const results = new Map<string, AsyncNodeLoaderResult>([
        ['submenu-1', createResult({ isFetching: true })],
        ['submenu-2', createResult({ isFetching: false })],
      ])

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          { kind: 'submenu', label: 'Submenu 1' },
          { kind: 'submenu', label: 'Submenu 2' },
        ],
      }

      const aggregated = aggregateLoaderResults(results, menu)

      expect(aggregated.isFetching).toBe(true)
    })

    it('should build progress entries with paths and breadcrumbs', () => {
      const results = new Map<string, AsyncNodeLoaderResult>([
        ['parent.child', createResult({ isLoading: true })],
      ])

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'parent',
            label: 'Parent Menu',
            nodes: [
              {
                kind: 'submenu',
                id: 'child',
                label: 'Child Menu',
              },
            ],
          },
        ],
      }

      const aggregated = aggregateLoaderResults(results, menu)

      expect(aggregated.progress).toHaveLength(1)
      expect(aggregated.progress[0]?.path).toEqual(['parent', 'child'])
      expect(aggregated.progress[0]?.breadcrumbs).toEqual([
        'Parent Menu',
        'Child Menu',
      ])
      expect(aggregated.progress[0]?.isLoading).toBe(true)
    })

    it('should handle empty results map', () => {
      const results = new Map<string, AsyncNodeLoaderResult>()
      const menu: MenuDef = { id: 'test-menu' }

      const aggregated = aggregateLoaderResults(results, menu)

      expect(aggregated.isLoading).toBe(false)
      expect(aggregated.isError).toBe(false)
      expect(aggregated.isFetching).toBe(false)
      expect(aggregated.progress).toHaveLength(0)
      expect(aggregated.completedPaths?.size).toBe(0)
      expect(aggregated.inProgressPaths?.size).toBe(0)
    })

    it('should include error information in progress entries', () => {
      const error = new Error('Load failed')
      const results = new Map<string, AsyncNodeLoaderResult>([
        ['submenu', createResult({ isError: true, error })],
      ])

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [{ kind: 'submenu', label: 'Submenu' }],
      }

      const aggregated = aggregateLoaderResults(results, menu)

      expect(aggregated.progress[0]?.error).toBe(error)
    })

    it('should return results map in aggregated state', () => {
      const results = new Map<string, AsyncNodeLoaderResult>([
        ['submenu', createResult({ data: [] })],
      ])

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [{ kind: 'submenu', label: 'Submenu' }],
      }

      const aggregated = aggregateLoaderResults(results, menu)

      expect(aggregated.results).toBe(results)
    })
  })

  describe('shouldEnableStreaming', () => {
    it('should return false when streaming is not configured', () => {
      const menu: MenuDef = {
        id: 'test-menu',
        search: {},
      }

      expect(shouldEnableStreaming(menu)).toBe(false)
    })

    it('should return false when streaming is disabled (boolean)', () => {
      const menu: MenuDef = {
        id: 'test-menu',
        search: {
          streaming: false,
        },
      }

      expect(shouldEnableStreaming(menu)).toBe(false)
    })

    it('should return false when streaming is disabled (object)', () => {
      const menu: MenuDef = {
        id: 'test-menu',
        search: {
          streaming: { enabled: false },
        },
      }

      expect(shouldEnableStreaming(menu)).toBe(false)
    })

    it('should return false when no search config exists', () => {
      const menu: MenuDef = {
        id: 'test-menu',
      }

      expect(shouldEnableStreaming(menu)).toBe(false)
    })

    it('should return true when streaming is enabled and menu has server loader', () => {
      const menu: MenuDef = {
        id: 'test-menu',
        search: {
          streaming: true,
          mode: 'server',
        },
        loader: createMockLoader(),
      }

      expect(shouldEnableStreaming(menu)).toBe(true)
    })

    it('should return true when streaming is enabled and menu has hybrid loader', () => {
      const menu: MenuDef = {
        id: 'test-menu',
        search: {
          streaming: true,
          mode: 'hybrid',
        },
        loader: createMockLoader(),
      }

      expect(shouldEnableStreaming(menu)).toBe(true)
    })

    it('should return false when streaming is enabled but only client loaders exist', () => {
      const menu: MenuDef = {
        id: 'test-menu',
        search: {
          streaming: true,
          mode: 'client',
        },
        loader: createMockLoader(),
      }

      expect(shouldEnableStreaming(menu)).toBe(false)
    })

    it('should return true when streaming is enabled and submenu has server loader', () => {
      const menu: MenuDef = {
        id: 'test-menu',
        search: {
          streaming: true,
        },
        nodes: [
          {
            kind: 'submenu',
            label: 'Submenu',
            search: { mode: 'server' },
            loader: createMockLoader(),
          },
        ],
      }

      expect(shouldEnableStreaming(menu)).toBe(true)
    })

    it('should return false when streaming is enabled but submenu has deepSearch disabled', () => {
      const menu: MenuDef = {
        id: 'test-menu',
        search: {
          streaming: true,
        },
        nodes: [
          {
            kind: 'submenu',
            label: 'Submenu',
            search: { mode: 'server' },
            loader: createMockLoader(),
            deepSearch: false,
          },
        ],
      }

      expect(shouldEnableStreaming(menu)).toBe(false)
    })

    it('should return true when streaming is enabled with object config', () => {
      const menu: MenuDef = {
        id: 'test-menu',
        search: {
          streaming: { enabled: true },
          mode: 'server',
        },
        loader: createMockLoader(),
      }

      expect(shouldEnableStreaming(menu)).toBe(true)
    })

    it('should check nested submenus for server loaders', () => {
      const menu: MenuDef = {
        id: 'test-menu',
        search: {
          streaming: true,
        },
        nodes: [
          {
            kind: 'submenu',
            label: 'Parent',
            nodes: [
              {
                kind: 'submenu',
                label: 'Child',
                search: { mode: 'server' },
                loader: createMockLoader(),
              },
            ],
          },
        ],
      }

      expect(shouldEnableStreaming(menu)).toBe(true)
    })

    it('should check loaders in groups', () => {
      const menu: MenuDef = {
        id: 'test-menu',
        search: {
          streaming: true,
        },
        nodes: [
          {
            kind: 'group',
            id: 'group-2',
            nodes: [
              {
                kind: 'submenu',
                label: 'Submenu',
                search: { mode: 'hybrid' },
                loader: createMockLoader(),
              },
            ],
          },
        ],
      }

      expect(shouldEnableStreaming(menu)).toBe(true)
    })
  })

  describe('injectLoaderResults', () => {
    it('should inject loader results into submenus', () => {
      const loaderResult: AsyncNodeLoaderResult = {
        data: [{ kind: 'item', label: 'Loaded Item' }],
        isLoading: false,
        isError: false,
        isFetching: false,
        error: undefined,
      }

      const results = new Map<string, AsyncNodeLoaderResult>([
        ['submenu', loaderResult],
      ])

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            label: 'Submenu',
            loader: createMockLoader(),
          },
        ],
      }

      const injected = injectLoaderResults(menu, results)

      const submenu = injected.nodes?.[0] as SubmenuDef
      expect(submenu?.loader).toBe(loaderResult)
      expect((submenu as any)?.__originalLoader).toBeDefined()
    })

    it('should not inject results into submenus with deepSearch disabled', () => {
      const loaderResult: AsyncNodeLoaderResult = {
        data: [{ kind: 'item', label: 'Loaded Item' }],
        isLoading: false,
        isError: false,
        isFetching: false,
        error: undefined,
      }

      const results = new Map<string, AsyncNodeLoaderResult>([
        ['submenu', loaderResult],
      ])

      const originalLoader = createMockLoader()
      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            label: 'Submenu',
            loader: originalLoader,
            deepSearch: false,
          },
        ],
      }

      const injected = injectLoaderResults(menu, results)

      const submenu = injected.nodes?.[0] as SubmenuDef
      expect(submenu?.loader).toBe(originalLoader)
    })

    it('should recursively inject results into nested submenus', () => {
      const result1: AsyncNodeLoaderResult = {
        data: [{ kind: 'item', label: 'Item 1' }],
        isLoading: false,
        isError: false,
        isFetching: false,
        error: undefined,
      }

      const result2: AsyncNodeLoaderResult = {
        data: [{ kind: 'item', label: 'Item 2' }],
        isLoading: false,
        isError: false,
        isFetching: false,
        error: undefined,
      }

      const results = new Map<string, AsyncNodeLoaderResult>([
        ['parent', result1],
        ['parent.child', result2],
      ])

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            label: 'Parent',
            loader: createMockLoader(),
            nodes: [
              {
                kind: 'submenu',
                label: 'Child',
                loader: createMockLoader(),
              },
            ],
          },
        ],
      }

      const injected = injectLoaderResults(menu, results)

      const parent = injected.nodes?.[0] as SubmenuDef
      expect(parent?.loader).toBe(result1)

      const child = parent?.nodes?.[0] as SubmenuDef
      expect(child?.loader).toBe(result2)
    })

    it('should handle groups containing submenus', () => {
      const loaderResult: AsyncNodeLoaderResult = {
        data: [{ kind: 'item', label: 'Loaded Item' }],
        isLoading: false,
        isError: false,
        isFetching: false,
        error: undefined,
      }

      const results = new Map<string, AsyncNodeLoaderResult>([
        ['submenu', loaderResult],
      ])

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'group',
            id: 'group-3',
            nodes: [
              {
                kind: 'submenu',
                label: 'Submenu',
                loader: createMockLoader(),
              },
            ],
          },
        ],
      }

      const injected = injectLoaderResults(menu, results)

      const group = injected.nodes?.[0] as any
      const submenu = group?.nodes?.[0] as SubmenuDef
      expect(submenu?.loader).toBe(loaderResult)
    })

    it('should preserve menu properties when injecting', () => {
      const results = new Map<string, AsyncNodeLoaderResult>()

      const menu: MenuDef = {
        id: 'test-menu',
        search: { minLength: 2 },
        nodes: [],
      }

      const injected = injectLoaderResults(menu, results)

      expect(injected.search).toEqual({ minLength: 2 })
      expect(injected).not.toBe(menu) // Should be a new object
    })

    it('should use custom submenu id when matching results', () => {
      const loaderResult: AsyncNodeLoaderResult = {
        data: [{ kind: 'item', label: 'Loaded Item' }],
        isLoading: false,
        isError: false,
        isFetching: false,
        error: undefined,
      }

      const results = new Map<string, AsyncNodeLoaderResult>([
        ['custom-id', loaderResult],
      ])

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            id: 'custom-id',
            label: 'Submenu',
            loader: createMockLoader(),
          },
        ],
      }

      const injected = injectLoaderResults(menu, results)

      const submenu = injected.nodes?.[0] as SubmenuDef
      expect(submenu?.loader).toBe(loaderResult)
    })
  })

  describe('injectCompletedLoaderResults', () => {
    it('should only inject completed results (with data)', () => {
      const completedResult: AsyncNodeLoaderResult = {
        data: [{ kind: 'item', label: 'Completed' }],
        isLoading: false,
        isError: false,
        isFetching: false,
        error: undefined,
      }

      const loadingResult: AsyncNodeLoaderResult = {
        data: undefined,
        isLoading: true,
        isError: false,
        isFetching: true,
        error: undefined,
      }

      const results = new Map<string, AsyncNodeLoaderResult>([
        ['submenu-1', completedResult],
        ['submenu-2', loadingResult],
      ])

      const loader1 = createMockLoader()
      const loader2 = createMockLoader()

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            label: 'Submenu 1',
            loader: loader1,
          },
          {
            kind: 'submenu',
            label: 'Submenu 2',
            loader: loader2,
          },
        ],
      }

      const injected = injectCompletedLoaderResults(menu, results)

      const submenu1 = injected.nodes?.[0] as SubmenuDef
      const submenu2 = injected.nodes?.[1] as SubmenuDef

      // Completed result should be injected
      expect(submenu1?.loader).toBe(completedResult)
      expect((submenu1 as any)?.__originalLoader).toBe(loader1)

      // Loading result should not be injected
      expect(submenu2?.loader).toBe(loader2)
    })

    it('should recursively inject completed results', () => {
      const completedResult: AsyncNodeLoaderResult = {
        data: [{ kind: 'item', label: 'Completed' }],
        isLoading: false,
        isError: false,
        isFetching: false,
        error: undefined,
      }

      const loadingResult: AsyncNodeLoaderResult = {
        data: undefined,
        isLoading: true,
        isError: false,
        isFetching: false,
        error: undefined,
      }

      const results = new Map<string, AsyncNodeLoaderResult>([
        ['parent', completedResult],
        ['parent.child', loadingResult],
      ])

      const loader1 = createMockLoader()
      const loader2 = createMockLoader()

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            label: 'Parent',
            loader: loader1,
            nodes: [
              {
                kind: 'submenu',
                label: 'Child',
                loader: loader2,
              },
            ],
          },
        ],
      }

      const injected = injectCompletedLoaderResults(menu, results)

      const parent = injected.nodes?.[0] as SubmenuDef
      const child = parent?.nodes?.[0] as SubmenuDef

      // Parent completed, should be injected
      expect(parent?.loader).toBe(completedResult)

      // Child still loading, should not be injected
      expect(child?.loader).toBe(loader2)
    })

    it('should process children even when parent has no completed result', () => {
      const childResult: AsyncNodeLoaderResult = {
        data: [{ kind: 'item', label: 'Child' }],
        isLoading: false,
        isError: false,
        isFetching: false,
        error: undefined,
      }

      const results = new Map<string, AsyncNodeLoaderResult>([
        ['parent.child', childResult],
      ])

      const parentLoader = createMockLoader()
      const childLoader = createMockLoader()

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            label: 'Parent',
            loader: parentLoader,
            nodes: [
              {
                kind: 'submenu',
                label: 'Child',
                loader: childLoader,
              },
            ],
          },
        ],
      }

      const injected = injectCompletedLoaderResults(menu, results)

      const parent = injected.nodes?.[0] as SubmenuDef
      const child = parent?.nodes?.[0] as SubmenuDef

      // Parent should keep original loader
      expect(parent?.loader).toBe(parentLoader)

      // Child should be injected
      expect(child?.loader).toBe(childResult)
    })

    it('should handle groups containing submenus', () => {
      const completedResult: AsyncNodeLoaderResult = {
        data: [{ kind: 'item', label: 'Completed' }],
        isLoading: false,
        isError: false,
        isFetching: false,
        error: undefined,
      }

      const results = new Map<string, AsyncNodeLoaderResult>([
        ['submenu', completedResult],
      ])

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'group',
            id: 'group-4',
            nodes: [
              {
                kind: 'submenu',
                label: 'Submenu',
                loader: createMockLoader(),
              },
            ],
          },
        ],
      }

      const injected = injectCompletedLoaderResults(menu, results)

      const group = injected.nodes?.[0] as any
      const submenu = group?.nodes?.[0] as SubmenuDef

      expect(submenu?.loader).toBe(completedResult)
    })

    it('should not inject into submenus with deepSearch disabled', () => {
      const completedResult: AsyncNodeLoaderResult = {
        data: [{ kind: 'item', label: 'Completed' }],
        isLoading: false,
        isError: false,
        isFetching: false,
        error: undefined,
      }

      const results = new Map<string, AsyncNodeLoaderResult>([
        ['submenu', completedResult],
      ])

      const loader = createMockLoader()

      const menu: MenuDef = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            label: 'Submenu',
            loader,
            deepSearch: false,
          },
        ],
      }

      const injected = injectCompletedLoaderResults(menu, results)

      const submenu = injected.nodes?.[0] as SubmenuDef

      expect(submenu?.loader).toBe(loader)
    })
  })
})
