import { describe, expect, it } from 'vitest'
import {
  aggregateLoaderResults,
  collectDeepSearchLoaders,
  injectLoaderResults,
} from '../../lib/deep-search-utils.js'
import type {
  AsyncNodeLoaderResult,
  MenuDef,
  NodeDef,
  SubmenuDef,
} from '../../types.js'

describe('deep-search-utils', () => {
  describe('collectDeepSearchLoaders', () => {
    it('should collect loader from a single submenu', () => {
      const loader = async () => []
      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            id: 'sub1',
            label: 'Submenu 1',
            kind: 'submenu',
            loader,
            nodes: [],
          },
        ],
      }

      const loaders = collectDeepSearchLoaders(menuDef)

      expect(loaders).toHaveLength(1)
      expect(loaders[0]?.path).toEqual(['sub1'])
      expect(loaders[0]?.loader).toBe(loader)
    })

    it('should collect loaders from nested submenus', () => {
      const loader1 = async () => []
      const loader2 = async () => []

      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            id: 'sub1',
            label: 'Submenu 1',
            kind: 'submenu',
            loader: loader1,
            nodes: [
              {
                id: 'sub2',
                label: 'Submenu 2',
                kind: 'submenu',
                loader: loader2,
                nodes: [],
              },
            ],
          },
        ],
      }

      const loaders = collectDeepSearchLoaders(menuDef)

      expect(loaders).toHaveLength(2)
      expect(loaders[0]?.path).toEqual(['sub1'])
      expect(loaders[0]?.loader).toBe(loader1)
      expect(loaders[1]?.path).toEqual(['sub1', 'sub2'])
      expect(loaders[1]?.loader).toBe(loader2)
    })

    it('should skip submenus without loaders', () => {
      const loader = async () => []
      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            id: 'sub1',
            label: 'No Loader',
            kind: 'submenu',
            nodes: [],
          },
          {
            id: 'sub2',
            label: 'Has Loader',
            kind: 'submenu',
            loader,
            nodes: [],
          },
        ],
      }

      const loaders = collectDeepSearchLoaders(menuDef)

      expect(loaders).toHaveLength(1)
      expect(loaders[0]?.path).toEqual(['sub2'])
    })

    it('should skip submenus with deepSearch explicitly disabled', () => {
      const loader = async () => []
      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            id: 'sub1',
            label: 'Disabled',
            kind: 'submenu',
            deepSearch: false,
            loader,
            nodes: [],
          },
          {
            id: 'sub2',
            label: 'Enabled',
            kind: 'submenu',
            loader,
            nodes: [],
          },
        ],
      }

      const loaders = collectDeepSearchLoaders(menuDef)

      expect(loaders).toHaveLength(1)
      expect(loaders[0]?.path).toEqual(['sub2'])
    })

    it('should not collect loaders from descendants of disabled deepSearch submenus', () => {
      const loader1 = async () => []
      const loader2 = async () => []

      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            id: 'sub1',
            label: 'Disabled Parent',
            kind: 'submenu',
            deepSearch: false,
            loader: loader1,
            nodes: [
              {
                id: 'sub2',
                label: 'Child',
                kind: 'submenu',
                loader: loader2,
                nodes: [],
              },
            ],
          },
        ],
      }

      const loaders = collectDeepSearchLoaders(menuDef)

      // Both should be excluded since parent has deepSearch disabled
      expect(loaders).toHaveLength(0)
    })

    it('should collect loaders from submenus inside groups', () => {
      const loader = async () => []
      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            id: 'group1',
            kind: 'group',
            nodes: [
              {
                id: 'sub1',
                label: 'Submenu in Group',
                kind: 'submenu',
                loader,
                nodes: [],
              },
            ],
          },
        ],
      }

      const loaders = collectDeepSearchLoaders(menuDef)

      expect(loaders).toHaveLength(1)
      expect(loaders[0]?.path).toEqual(['sub1'])
    })

    it('should handle empty menu', () => {
      const menuDef: MenuDef = {
        id: 'root',
        nodes: [],
      }

      const loaders = collectDeepSearchLoaders(menuDef)

      expect(loaders).toHaveLength(0)
    })

    it('should include search config from submenu', () => {
      const loader = async () => []
      const searchConfig = { minLength: 3, debounce: 500 }

      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            id: 'sub1',
            label: 'Submenu',
            kind: 'submenu',
            loader,
            search: searchConfig,
            nodes: [],
          },
        ],
      }

      const loaders = collectDeepSearchLoaders(menuDef)

      expect(loaders[0]?.searchConfig).toEqual(searchConfig)
    })

    it('should collect loaders from complex nested structure', () => {
      const loader1 = async () => []
      const loader2 = async () => []
      const loader3 = async () => []

      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            id: 'group1',
            kind: 'group',
            nodes: [
              {
                id: 'sub1',
                label: 'Sub 1',
                kind: 'submenu',
                loader: loader1,
                nodes: [
                  {
                    id: 'sub2',
                    label: 'Sub 2',
                    kind: 'submenu',
                    loader: loader2,
                    nodes: [],
                  },
                ],
              },
            ],
          },
          {
            id: 'sub3',
            label: 'Sub 3',
            kind: 'submenu',
            loader: loader3,
            nodes: [],
          },
        ],
      }

      const loaders = collectDeepSearchLoaders(menuDef)

      expect(loaders).toHaveLength(3)
      expect(loaders[0]?.path).toEqual(['sub1'])
      expect(loaders[1]?.path).toEqual(['sub1', 'sub2'])
      expect(loaders[2]?.path).toEqual(['sub3'])
    })
  })

  describe('aggregateLoaderResults', () => {
    it('should aggregate results from multiple loaders', () => {
      const results = new Map<string, AsyncNodeLoaderResult>([
        [
          'sub1',
          {
            data: [],
            isLoading: false,
            isError: false,
            isFetching: false,
          },
        ],
        [
          'sub2',
          {
            data: [],
            isLoading: true,
            isError: false,
            isFetching: true,
          },
        ],
      ])

      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          { id: 'sub1', label: 'Sub 1', kind: 'submenu', nodes: [] },
          { id: 'sub2', label: 'Sub 2', kind: 'submenu', nodes: [] },
        ],
      }

      const aggregated = aggregateLoaderResults(results, menuDef)

      expect(aggregated.isLoading).toBe(true) // ANY loader loading
      expect(aggregated.isError).toBe(false)
      expect(aggregated.isFetching).toBe(true) // ANY loader fetching
      expect(aggregated.progress).toHaveLength(2)
    })

    it('should set isError true if any loader has error', () => {
      const results = new Map<string, AsyncNodeLoaderResult>([
        [
          'sub1',
          {
            data: [],
            isLoading: false,
            isError: true,
            isFetching: false,
            error: new Error('Failed'),
          },
        ],
        [
          'sub2',
          {
            data: [],
            isLoading: false,
            isError: false,
            isFetching: false,
          },
        ],
      ])

      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          { id: 'sub1', label: 'Sub 1', kind: 'submenu', nodes: [] },
          { id: 'sub2', label: 'Sub 2', kind: 'submenu', nodes: [] },
        ],
      }

      const aggregated = aggregateLoaderResults(results, menuDef)

      expect(aggregated.isError).toBe(true)
    })

    it('should build breadcrumbs for loader paths', () => {
      const results = new Map<string, AsyncNodeLoaderResult>([
        [
          'sub1.sub2',
          {
            data: [],
            isLoading: false,
            isError: false,
            isFetching: false,
          },
        ],
      ])

      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            id: 'sub1',
            label: 'First Level',
            kind: 'submenu',
            nodes: [
              {
                id: 'sub2',
                label: 'Second Level',
                kind: 'submenu',
                nodes: [],
              },
            ],
          },
        ],
      }

      const aggregated = aggregateLoaderResults(results, menuDef)

      expect(aggregated.progress[0]?.breadcrumbs).toEqual([
        'First Level',
        'Second Level',
      ])
    })

    it('should use title or id as fallback for breadcrumbs', () => {
      const results = new Map<string, AsyncNodeLoaderResult>([
        [
          'sub1.sub2',
          {
            data: [],
            isLoading: false,
            isError: false,
            isFetching: false,
          },
        ],
      ])

      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            id: 'sub1',
            title: 'Title Used',
            kind: 'submenu',
            nodes: [
              {
                id: 'sub2',
                kind: 'submenu',
                nodes: [],
              },
            ],
          },
        ],
      }

      const aggregated = aggregateLoaderResults(results, menuDef)

      expect(aggregated.progress[0]?.breadcrumbs).toEqual([
        'Title Used',
        'sub2', // Uses id as fallback
      ])
    })

    it('should handle empty results', () => {
      const results = new Map<string, AsyncNodeLoaderResult>()
      const menuDef: MenuDef = { id: 'root', nodes: [] }

      const aggregated = aggregateLoaderResults(results, menuDef)

      expect(aggregated.isLoading).toBe(false)
      expect(aggregated.isError).toBe(false)
      expect(aggregated.isFetching).toBe(false)
      expect(aggregated.progress).toHaveLength(0)
    })

    it('should include individual loader progress', () => {
      const results = new Map<string, AsyncNodeLoaderResult>([
        [
          'sub1',
          {
            data: [],
            isLoading: true,
            isError: false,
            isFetching: true,
          },
        ],
      ])

      const menuDef: MenuDef = {
        id: 'root',
        nodes: [{ id: 'sub1', label: 'Sub 1', kind: 'submenu', nodes: [] }],
      }

      const aggregated = aggregateLoaderResults(results, menuDef)

      expect(aggregated.progress[0]).toMatchObject({
        path: ['sub1'],
        isLoading: true,
        isFetching: true,
        error: undefined,
      })
    })
  })

  describe('injectLoaderResults', () => {
    it('should inject loader result into a submenu', () => {
      const originalLoader = async () => []
      const loaderResult: AsyncNodeLoaderResult = {
        data: [{ id: 'loaded', label: 'Loaded Item', kind: 'item' }],
        isLoading: false,
        isError: false,
        isFetching: false,
      }

      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            id: 'sub1',
            label: 'Submenu',
            kind: 'submenu',
            loader: originalLoader,
            nodes: [],
          },
        ],
      }

      const results = new Map([['sub1', loaderResult]])
      const injected = injectLoaderResults(menuDef, results)

      const submenu = injected.nodes?.[0] as SubmenuDef
      expect(submenu.loader).toBe(loaderResult)
      expect((submenu as any).__originalLoader).toBe(originalLoader)
    })

    it('should inject nested loader results', () => {
      const result1: AsyncNodeLoaderResult = {
        data: [],
        isLoading: false,
        isError: false,
        isFetching: false,
      }
      const result2: AsyncNodeLoaderResult = {
        data: [],
        isLoading: false,
        isError: false,
        isFetching: false,
      }

      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            id: 'sub1',
            label: 'Sub 1',
            kind: 'submenu',
            loader: async () => [],
            nodes: [
              {
                id: 'sub2',
                label: 'Sub 2',
                kind: 'submenu',
                loader: async () => [],
                nodes: [],
              },
            ],
          },
        ],
      }

      const results = new Map([
        ['sub1', result1],
        ['sub1.sub2', result2],
      ])
      const injected = injectLoaderResults(menuDef, results)

      const sub1 = injected.nodes?.[0] as SubmenuDef
      expect(sub1.loader).toBe(result1)

      const sub2 = sub1.nodes?.[0] as SubmenuDef
      expect(sub2.loader).toBe(result2)
    })

    it('should not inject into submenus with deepSearch disabled', () => {
      const originalLoader = async () => []
      const loaderResult: AsyncNodeLoaderResult = {
        data: [],
        isLoading: false,
        isError: false,
        isFetching: false,
      }

      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            id: 'sub1',
            label: 'Disabled',
            kind: 'submenu',
            deepSearch: false,
            loader: originalLoader,
            nodes: [],
          },
        ],
      }

      const results = new Map([['sub1', loaderResult]])
      const injected = injectLoaderResults(menuDef, results)

      const submenu = injected.nodes?.[0] as SubmenuDef
      expect(submenu.loader).toBe(originalLoader) // Not injected
    })

    it('should process groups and inject into their submenu children', () => {
      const loaderResult: AsyncNodeLoaderResult = {
        data: [],
        isLoading: false,
        isError: false,
        isFetching: false,
      }

      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            id: 'group1',
            kind: 'group',
            nodes: [
              {
                id: 'sub1',
                label: 'Submenu in Group',
                kind: 'submenu',
                loader: async () => [],
                nodes: [],
              },
            ],
          },
        ],
      }

      const results = new Map([['sub1', loaderResult]])
      const injected = injectLoaderResults(menuDef, results)

      const group = injected.nodes?.[0]
      if (group?.kind === 'group') {
        const submenu = group.nodes[0] as SubmenuDef
        expect(submenu.loader).toBe(loaderResult)
      }
    })

    it('should not modify item nodes', () => {
      const menuDef: MenuDef = {
        id: 'root',
        nodes: [{ id: 'item1', label: 'Item', kind: 'item' }],
      }

      const results = new Map()
      const injected = injectLoaderResults(menuDef, results)

      expect(injected.nodes?.[0]).toEqual(menuDef.nodes?.[0])
    })

    it('should handle empty menu', () => {
      const menuDef: MenuDef = {
        id: 'root',
        nodes: [],
      }

      const results = new Map()
      const injected = injectLoaderResults(menuDef, results)

      expect(injected.nodes).toEqual([])
    })

    it('should only inject results for matching paths', () => {
      const originalLoader = async () => []
      const result1: AsyncNodeLoaderResult = {
        data: [],
        isLoading: false,
        isError: false,
        isFetching: false,
      }

      const menuDef: MenuDef = {
        id: 'root',
        nodes: [
          {
            id: 'sub1',
            label: 'With Result',
            kind: 'submenu',
            loader: originalLoader,
            nodes: [],
          },
          {
            id: 'sub2',
            label: 'No Result',
            kind: 'submenu',
            loader: originalLoader,
            nodes: [],
          },
        ],
      }

      const results = new Map([['sub1', result1]])
      const injected = injectLoaderResults(menuDef, results)

      const sub1 = injected.nodes?.[0] as SubmenuDef
      const sub2 = injected.nodes?.[1] as SubmenuDef

      expect(sub1.loader).toBe(result1) // Injected
      expect(sub2.loader).toBe(originalLoader) // Not injected
    })
  })
})
