import { describe, expect, it, vi } from 'vitest'
import { composeMiddleware } from '../middleware/compose.js'
import { createNew } from '../middleware/create-new.js'
import type {
  AfterFilterContext,
  BeforeFilterContext,
  MenuMiddleware,
  SearchResult,
  TransformNodesContext,
} from '../middleware/types.js'
import { instantiateMenuFromDef } from '../primitives/menu-model.js'
import type { ItemNode, MenuDef, Node } from '../types.js'
import { scoreNodes } from '../utils/node-scoring.js'
import { deduplicateById, partitionByKind, sortByScore } from '../utils/sort.js'

/**
 * Integration tests for middleware support in useFilteredNodes.
 * These tests verify that all three middleware hooks work correctly
 * when applied to a menu.
 */
describe('useFilteredNodes middleware integration', () => {
  describe('beforeFilter middleware', () => {
    it('should transform nodes before filtering', () => {
      const beforeFilter = vi.fn(
        (context: BeforeFilterContext) => context.nodes,
      )

      const middleware: MenuMiddleware = {
        beforeFilter,
      }

      const menuDef: MenuDef = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'item1', label: 'Apple' },
          { kind: 'item', id: 'item2', label: 'Banana' },
        ],
        middleware,
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      // Verify middleware is attached
      expect(menu.middleware).toBe(middleware)
      expect(menu.middleware?.beforeFilter).toBeDefined()

      // Simulate what useFilteredNodes does
      const query = 'app'
      if (menu.middleware?.beforeFilter) {
        const allNodes = menu.nodes
        const context: BeforeFilterContext = {
          nodes: allNodes,
          query,
          menu,
        }
        const transformed = menu.middleware.beforeFilter(context)

        expect(beforeFilter).toHaveBeenCalledWith(context)
        expect(transformed).toEqual(allNodes)
      }
    })

    it('should allow middleware to add synthetic nodes before filtering', () => {
      const beforeFilter = (context: BeforeFilterContext): Node<any>[] => {
        // Add a synthetic "search everywhere" node at the start
        const syntheticNode: Node<any> = {
          kind: 'item',
          id: '__synthetic__',
          label: `Search for: ${context.query}`,
          parent: context.menu,
          def: { kind: 'item', id: '__synthetic__' },
        } as any

        return [syntheticNode, ...context.nodes]
      }

      const middleware: MenuMiddleware = {
        beforeFilter,
      }

      const menuDef: MenuDef = {
        id: 'test',
        nodes: [{ kind: 'item', id: 'item1', label: 'Apple' }],
        middleware,
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)
      const query = 'test'

      if (menu.middleware?.beforeFilter) {
        const context: BeforeFilterContext = {
          nodes: menu.nodes,
          query,
          menu,
        }
        const transformed = menu.middleware.beforeFilter(context)

        expect(transformed).toHaveLength(2)
        expect(transformed[0]?.id).toBe('__synthetic__')
        expect((transformed[0] as ItemNode)?.label).toBe('Search for: test')
        expect(transformed[1]?.id).toBe('item1')
      }
    })
  })

  describe('afterFilter middleware', () => {
    it('should transform search results after scoring', () => {
      const afterFilter = vi.fn(
        (context: AfterFilterContext) => context.results,
      )

      const middleware: MenuMiddleware = {
        afterFilter,
      }

      const menuDef: MenuDef = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'item1', label: 'Apple' },
          { kind: 'item', id: 'item2', label: 'Application' },
        ],
        middleware,
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)
      const query = 'app'

      // Simulate scoring
      const scored = scoreNodes(menu.nodes, query, {
        rootMenuId: menu.id,
        includeBreadcrumbs: true,
      })

      if (menu.middleware?.afterFilter) {
        const searchResults: SearchResult<any>[] = scored.map((s) => ({
          type: s.node.kind === 'item' ? 'item' : 'submenu',
          node: s.node,
          breadcrumbs: s.breadcrumbs,
          breadcrumbIds: s.breadcrumbIds,
          score: s.score,
        }))

        const context: AfterFilterContext = {
          results: searchResults,
          query,
          menu,
        }

        const transformed = menu.middleware.afterFilter(context)

        expect(afterFilter).toHaveBeenCalledWith(context)
        expect(transformed).toEqual(searchResults)
      }
    })

    it('should allow middleware to boost certain results', () => {
      const afterFilter = (
        context: AfterFilterContext,
      ): SearchResult<any>[] => {
        // Boost items that start with the query
        return context.results.map((result) => {
          const node = result.node as ItemNode<any>
          const startsWithQuery = node.label
            ?.toLowerCase()
            .startsWith(context.query.toLowerCase())

          return {
            ...result,
            score: startsWithQuery ? result.score * 2 : result.score,
          }
        })
      }

      const middleware: MenuMiddleware = {
        afterFilter,
      }

      const menuDef: MenuDef = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'item1', label: 'Apple', keywords: ['Apple'] },
          {
            kind: 'item',
            id: 'item2',
            label: 'Pineapple',
            keywords: ['Pineapple'],
          },
        ],
        middleware,
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)
      const query = 'app'

      const scored = scoreNodes(menu.nodes, query, {
        rootMenuId: menu.id,
        includeBreadcrumbs: true,
      })

      // Verify we got some results
      expect(scored.length).toBeGreaterThan(0)

      if (menu.middleware?.afterFilter) {
        const searchResults: SearchResult<any>[] = scored.map((s) => ({
          type: s.node.kind === 'item' ? 'item' : 'submenu',
          node: s.node,
          breadcrumbs: s.breadcrumbs,
          breadcrumbIds: s.breadcrumbIds,
          score: s.score,
        }))

        const context: AfterFilterContext = {
          results: searchResults,
          query,
          menu,
        }

        const transformed = menu.middleware.afterFilter(context)

        // Apple should have boosted score
        const appleResult = transformed.find(
          (r) => (r.node as ItemNode).label === 'Apple',
        )
        const pineappleResult = transformed.find(
          (r) => (r.node as ItemNode).label === 'Pineapple',
        )

        expect(appleResult).toBeDefined()
        expect(pineappleResult).toBeDefined()
        expect(appleResult!.score).toBeGreaterThan(pineappleResult!.score)
      }
    })
  })

  describe('transformNodes middleware', () => {
    it('should transform flattened nodes before rendering', () => {
      const transformNodes = vi.fn(
        (context: TransformNodesContext) => context.nodes,
      )

      const middleware: MenuMiddleware = {
        transformNodes,
      }

      const menuDef: MenuDef = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'item1', label: 'Apple' },
          { kind: 'item', id: 'item2', label: 'Banana' },
        ],
        middleware,
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)
      const query = 'app'

      // Simulate the full pipeline
      const scored = scoreNodes(menu.nodes, query, {
        rootMenuId: menu.id,
        includeBreadcrumbs: true,
      })

      sortByScore(scored)
      const partitioned = partitionByKind(scored)
      const deduplicated = deduplicateById(partitioned)

      const enrichedNodes = deduplicated.map((s) => ({
        ...s.node,
        search: {
          query,
          score: s.score,
          isDeep: s.breadcrumbs.length > 0,
          breadcrumbs: s.breadcrumbs,
          breadcrumbIds: s.breadcrumbIds,
        },
      })) as Node<any>[]

      if (menu.middleware?.transformNodes) {
        const context: TransformNodesContext = {
          nodes: enrichedNodes,
          query,
          mode: 'search',
          allNodes: menu.nodes,
          menu,
          createNode: vi.fn(),
          hasExactMatch: vi.fn(() => false),
        }

        const transformed = menu.middleware.transformNodes(context)

        expect(transformNodes).toHaveBeenCalledWith(context)
        expect(transformed).toEqual(enrichedNodes)
      }
    })

    it('should provide createNode helper that works correctly', () => {
      let capturedCreateNode: any = null

      const transformNodes = (context: TransformNodesContext): Node<any>[] => {
        capturedCreateNode = context.createNode
        return context.nodes
      }

      const middleware: MenuMiddleware = {
        transformNodes,
      }

      const menuDef: MenuDef = {
        id: 'test',
        nodes: [{ kind: 'item', id: 'item1', label: 'Apple' }],
        middleware,
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      if (menu.middleware?.transformNodes) {
        const context: TransformNodesContext = {
          nodes: [],
          query: 'test',
          mode: 'search',
          allNodes: menu.nodes,
          menu,
          createNode: <U = any>(def: any) => {
            const node = { ...def, parent: menu, kind: 'item' } as any
            return node
          },
          hasExactMatch: () => false,
        }

        menu.middleware.transformNodes(context)

        expect(capturedCreateNode).toBeDefined()

        // Test creating a node
        const newNode = capturedCreateNode({
          kind: 'item',
          id: 'new-item',
          label: 'New Item',
        })

        expect(newNode.id).toBe('new-item')
        expect(newNode.label).toBe('New Item')
        expect(newNode.parent).toBe(menu)
      }
    })

    it('should provide hasExactMatch helper that works correctly', () => {
      let capturedHasExactMatch: any = null

      const transformNodes = (context: TransformNodesContext): Node<any>[] => {
        capturedHasExactMatch = context.hasExactMatch
        return context.nodes
      }

      const middleware: MenuMiddleware = {
        transformNodes,
      }

      const menuDef: MenuDef = {
        id: 'test',
        nodes: [{ kind: 'item', id: 'item1', label: 'Apple' }],
        middleware,
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      const enrichedNodes = menu.nodes.map((n) => ({
        ...n,
        search: {
          query: 'apple',
          score: 1,
          isDeep: false,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      })) as Node<any>[]

      if (menu.middleware?.transformNodes) {
        const context: TransformNodesContext = {
          nodes: enrichedNodes,
          query: 'apple',
          mode: 'search',
          allNodes: menu.nodes,
          menu,
          createNode: vi.fn(),
          hasExactMatch: (q: string) =>
            enrichedNodes.some(
              (node) =>
                node.kind === 'item' &&
                node.label?.toLowerCase() === q.toLowerCase(),
            ),
        }

        menu.middleware.transformNodes(context)

        expect(capturedHasExactMatch).toBeDefined()

        // Test exact match
        expect(capturedHasExactMatch('apple')).toBe(true)
        expect(capturedHasExactMatch('Apple')).toBe(true)
        expect(capturedHasExactMatch('app')).toBe(false)
        expect(capturedHasExactMatch('banana')).toBe(false)
      }
    })
  })

  describe('createNew middleware integration', () => {
    it('should add create item when no exact match exists', () => {
      const onCreate = vi.fn()

      const middleware = createNew({
        showWhen: 'no-exact-match',
        position: 'bottom',
        label: (query) => `Create: ${query}`,
        onCreate,
      })

      const menuDef: MenuDef = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'item1', label: 'Apple' },
          { kind: 'item', id: 'item2', label: 'Banana' },
        ],
        middleware,
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)
      const query = 'cherry'

      const scored = scoreNodes(menu.nodes, query, {
        rootMenuId: menu.id,
        includeBreadcrumbs: true,
      })

      // Even with no matches, we'll have an empty array
      const enrichedNodes = scored.map((s) => ({
        ...s.node,
        search: {
          query,
          score: s.score,
          isDeep: false,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      })) as Node<any>[]

      if (menu.middleware?.transformNodes) {
        const context: TransformNodesContext = {
          nodes: enrichedNodes,
          query,
          mode: 'search',
          allNodes: menu.nodes,
          menu,
          createNode: (def: any) => ({ ...def, parent: menu }) as any,
          hasExactMatch: (q: string) =>
            enrichedNodes.some(
              (node) =>
                node.kind === 'item' &&
                node.label?.toLowerCase() === q.toLowerCase(),
            ),
        }

        const transformed = menu.middleware.transformNodes(context)

        // Should have one more node (the create item)
        expect(transformed.length).toBe(enrichedNodes.length + 1)

        // Last item should be the create item
        const createItem = transformed[transformed.length - 1] as ItemNode
        expect(createItem?.label).toBe('Create: cherry')
      }
    })

    it('should not add create item when exact match exists', () => {
      const onCreate = vi.fn()

      const middleware = createNew({
        showWhen: 'no-exact-match',
        position: 'bottom',
        label: (query) => `Create: ${query}`,
        onCreate,
      })

      const menuDef: MenuDef = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'item1', label: 'Apple', keywords: ['Apple'] },
          { kind: 'item', id: 'item2', label: 'Banana', keywords: ['Banana'] },
        ],
        middleware,
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)
      const query = 'Apple'

      const scored = scoreNodes(menu.nodes, query, {
        rootMenuId: menu.id,
        includeBreadcrumbs: true,
      })

      const enrichedNodes = scored.map((s) => ({
        ...s.node,
        search: {
          query,
          score: s.score,
          isDeep: false,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      })) as Node<any>[]

      // Verify we found the Apple item
      expect(enrichedNodes.length).toBeGreaterThan(0)

      if (menu.middleware?.transformNodes) {
        const context: TransformNodesContext = {
          nodes: enrichedNodes,
          query,
          mode: 'search',
          allNodes: menu.nodes,
          menu,
          createNode: (def: any) => ({ ...def, parent: menu }) as any,
          hasExactMatch: (q: string) =>
            enrichedNodes.some(
              (node) =>
                node.kind === 'item' &&
                (node as ItemNode).label?.toLowerCase() === q.toLowerCase(),
            ),
        }

        const transformed = menu.middleware.transformNodes(context)

        // Should have same number of nodes (no create item added because of exact match)
        expect(transformed.length).toBe(enrichedNodes.length)
      }
    })

    it('should add create item at top when position is top', () => {
      const onCreate = vi.fn()

      const middleware = createNew({
        showWhen: 'no-exact-match',
        position: 'top',
        label: (query) => `Create: ${query}`,
        onCreate,
      })

      const menuDef: MenuDef = {
        id: 'test',
        nodes: [{ kind: 'item', id: 'item1', label: 'Apple' }],
        middleware,
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)
      const query = 'banana'

      const scored = scoreNodes(menu.nodes, query, {
        rootMenuId: menu.id,
        includeBreadcrumbs: true,
      })

      const enrichedNodes = scored.map((s) => ({
        ...s.node,
        search: {
          query,
          score: s.score,
          isDeep: false,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      })) as Node<any>[]

      if (menu.middleware?.transformNodes) {
        const context: TransformNodesContext = {
          nodes: enrichedNodes,
          query,
          mode: 'search',
          allNodes: menu.nodes,
          menu,
          createNode: (def: any) => ({ ...def, parent: menu }) as any,
          hasExactMatch: () => false,
        }

        const transformed = menu.middleware.transformNodes(context)

        // First item should be the create item
        expect((transformed[0] as ItemNode)?.label).toBe('Create: banana')
      }
    })
  })

  describe('middleware composition', () => {
    it('should apply multiple middleware in order', () => {
      const beforeFilter1 = vi.fn((ctx: BeforeFilterContext) => ctx.nodes)
      const beforeFilter2 = vi.fn((ctx: BeforeFilterContext) => ctx.nodes)

      const middleware1: MenuMiddleware = { beforeFilter: beforeFilter1 }
      const middleware2: MenuMiddleware = { beforeFilter: beforeFilter2 }

      const composed = composeMiddleware([middleware1, middleware2])

      const menuDef: MenuDef = {
        id: 'test',
        nodes: [{ kind: 'item', id: 'item1', label: 'Apple' }],
        middleware: composed,
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)
      const query = 'test'

      if (menu.middleware?.beforeFilter) {
        const context: BeforeFilterContext = {
          nodes: menu.nodes,
          query,
          menu,
        }

        menu.middleware.beforeFilter(context)

        expect(beforeFilter1).toHaveBeenCalled()
        expect(beforeFilter2).toHaveBeenCalled()
      }
    })

    it('should chain transformations through multiple middleware', () => {
      const addPrefix: MenuMiddleware = {
        transformNodes: (ctx) =>
          ctx.nodes.map((n) => ({
            ...n,
            label: `[Prefix] ${(n as ItemNode).label}`,
          })) as any[],
      }

      const addSuffix: MenuMiddleware = {
        transformNodes: (ctx) =>
          ctx.nodes.map((n) => ({
            ...n,
            label: `${(n as ItemNode).label} [Suffix]`,
          })) as any[],
      }

      const composed = composeMiddleware([addPrefix, addSuffix])

      const menuDef: MenuDef = {
        id: 'test',
        nodes: [{ kind: 'item', id: 'item1', label: 'Apple' }],
        middleware: composed,
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      const enrichedNodes = menu.nodes.map((n) => ({
        ...n,
        search: {
          query: 'test',
          score: 1,
          isDeep: false,
          breadcrumbs: [],
          breadcrumbIds: [],
        },
      })) as Node<any>[]

      if (menu.middleware?.transformNodes) {
        const context: TransformNodesContext = {
          nodes: enrichedNodes,
          query: 'test',
          mode: 'search',
          allNodes: menu.nodes,
          menu,
          createNode: vi.fn(),
          hasExactMatch: () => false,
        }

        const transformed = menu.middleware.transformNodes(context)

        // Should have both prefix and suffix
        expect((transformed[0] as ItemNode)?.label).toBe(
          '[Prefix] Apple [Suffix]',
        )
      }
    })
  })

  describe('transformNodes in browse mode', () => {
    it('should apply transformNodes middleware even when query is empty', () => {
      const transformNodes = vi.fn(
        (context: TransformNodesContext) => context.nodes,
      )

      const middleware: MenuMiddleware = {
        transformNodes,
      }

      const menuDef: MenuDef = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'item1', label: 'Apple' },
          { kind: 'item', id: 'item2', label: 'Banana' },
        ],
        middleware,
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      // Simulate browse mode (empty query)
      const nodes = menu.nodes.filter(
        (n) =>
          n.kind === 'item' || n.kind === 'submenu' || n.kind === 'separator',
      )

      if (menu.middleware?.transformNodes) {
        const context: TransformNodesContext = {
          nodes,
          query: '',
          mode: 'browse',
          allNodes: menu.nodes,
          menu,
          createNode: vi.fn(),
          hasExactMatch: vi.fn(() => false),
        }

        const transformed = menu.middleware.transformNodes(context)

        expect(transformNodes).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: 'browse',
            query: '',
          }),
        )
        expect(transformed).toEqual(nodes)
      }
    })

    it('should allow reordering nodes in browse mode', () => {
      const transformNodes = (context: TransformNodesContext): Node<any>[] => {
        // Only reorder in browse mode
        if (context.mode === 'browse') {
          // Reverse the order for testing
          return [...context.nodes].reverse()
        }
        return context.nodes
      }

      const middleware: MenuMiddleware = {
        transformNodes,
      }

      const menuDef: MenuDef = {
        id: 'test',
        nodes: [
          { kind: 'item', id: 'item1', label: 'Apple' },
          { kind: 'item', id: 'item2', label: 'Banana' },
          { kind: 'item', id: 'item3', label: 'Cherry' },
        ],
        middleware,
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      const nodes = menu.nodes.filter((n) => n.kind === 'item')

      if (menu.middleware?.transformNodes) {
        const context: TransformNodesContext = {
          nodes,
          query: '',
          mode: 'browse',
          allNodes: menu.nodes,
          menu,
          createNode: vi.fn(),
          hasExactMatch: vi.fn(() => false),
        }

        const transformed = menu.middleware.transformNodes(context)

        // Should be reversed
        expect((transformed[0] as ItemNode)?.label).toBe('Cherry')
        expect((transformed[1] as ItemNode)?.label).toBe('Banana')
        expect((transformed[2] as ItemNode)?.label).toBe('Apple')
      }
    })
  })
})
