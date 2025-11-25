import { describe, expect, it, vi } from 'vitest'
import { composeMiddleware } from '../middleware/compose.js'
import type { MenuMiddleware } from '../middleware/types.js'

describe('composeMiddleware', () => {
  describe('Basic composition', () => {
    it('should return empty middleware when given empty array', () => {
      const composed = composeMiddleware([])

      expect(composed).toEqual({})
    })

    it('should return empty middleware when all items are null/undefined', () => {
      const composed = composeMiddleware([null, undefined, null])

      expect(composed).toEqual({})
    })

    it('should return the single middleware when only one is provided', () => {
      const middleware: MenuMiddleware = {
        transformNodes: ({ nodes }) => nodes,
      }

      const composed = composeMiddleware([middleware])

      expect(composed).toBe(middleware)
    })

    it('should filter out null and undefined middleware', () => {
      const middleware1: MenuMiddleware = {
        transformNodes: vi.fn(({ nodes }) => nodes),
      }

      const middleware2: MenuMiddleware = {
        beforeFilter: vi.fn(({ nodes }) => nodes),
      }

      const composed = composeMiddleware([
        null,
        middleware1,
        undefined,
        middleware2,
      ])

      expect(composed.transformNodes).toBeDefined()
      expect(composed.beforeFilter).toBeDefined()
    })
  })

  describe('beforeFilter composition', () => {
    it('should compose multiple beforeFilter hooks in order', () => {
      const middleware1: MenuMiddleware = {
        beforeFilter: ({ nodes }) => [
          ...nodes,
          { kind: 'item', id: 'from-m1' } as any,
        ],
      }

      const middleware2: MenuMiddleware = {
        beforeFilter: ({ nodes }) => [
          ...nodes,
          { kind: 'item', id: 'from-m2' } as any,
        ],
      }

      const composed = composeMiddleware([middleware1, middleware2])

      const context = {
        nodes: [{ kind: 'item', id: 'original' } as any],
        query: 'test',
        menu: {} as any,
      }

      const result = composed.beforeFilter!(context)

      expect(result).toHaveLength(3)
      expect(result[0]?.id).toBe('original')
      expect(result[1]?.id).toBe('from-m1')
      expect(result[2]?.id).toBe('from-m2')
    })

    it('should execute beforeFilter hooks in sequence with updated context', () => {
      const executionOrder: string[] = []

      const middleware1: MenuMiddleware = {
        beforeFilter: ({ nodes }) => {
          executionOrder.push('m1')
          return nodes.filter((n: any) => n.id !== 'remove-me')
        },
      }

      const middleware2: MenuMiddleware = {
        beforeFilter: ({ nodes }) => {
          executionOrder.push('m2')
          return [...nodes, { kind: 'item', id: 'added' } as any]
        },
      }

      const composed = composeMiddleware([middleware1, middleware2])

      const context = {
        nodes: [
          { kind: 'item', id: 'keep' } as any,
          { kind: 'item', id: 'remove-me' } as any,
        ],
        query: 'test',
        menu: {} as any,
      }

      const result = composed.beforeFilter!(context)

      expect(executionOrder).toEqual(['m1', 'm2'])
      expect(result).toHaveLength(2)
      expect(result[0]?.id).toBe('keep')
      expect(result[1]?.id).toBe('added')
    })

    it('should not define beforeFilter if no middleware has it', () => {
      const middleware1: MenuMiddleware = {
        transformNodes: ({ nodes }) => nodes,
      }

      const middleware2: MenuMiddleware = {
        afterFilter: ({ results }) => results,
      }

      const composed = composeMiddleware([middleware1, middleware2])

      expect(composed.beforeFilter).toBeUndefined()
    })

    it('should preserve context properties through composition', () => {
      let capturedContext: any

      const middleware: MenuMiddleware = {
        beforeFilter: (context) => {
          capturedContext = context
          return context.nodes
        },
      }

      const composed = composeMiddleware([middleware])

      const context = {
        nodes: [{ kind: 'item', id: 'test' } as any],
        query: 'search query',
        menu: { id: 'menu-id' } as any,
      }

      composed.beforeFilter!(context)

      expect(capturedContext.query).toBe('search query')
      expect(capturedContext.menu.id).toBe('menu-id')
    })
  })

  describe('afterFilter composition', () => {
    it('should compose multiple afterFilter hooks in order', () => {
      const middleware1: MenuMiddleware = {
        afterFilter: ({ results }) =>
          results.map((r) => ({ ...r, score: r.score + 10 })),
      }

      const middleware2: MenuMiddleware = {
        afterFilter: ({ results }) =>
          results.map((r) => ({ ...r, score: r.score * 2 })),
      }

      const composed = composeMiddleware([middleware1, middleware2])

      const context = {
        results: [
          {
            type: 'item' as const,
            node: { kind: 'item', id: 'test' } as any,
            breadcrumbs: [],
            breadcrumbIds: [],
            score: 50,
          },
        ],
        query: 'test',
        menu: {} as any,
      }

      const result = composed.afterFilter!(context)

      // First adds 10 (50 + 10 = 60), then multiplies by 2 (60 * 2 = 120)
      expect(result[0]?.score).toBe(120)
    })

    it('should filter results through multiple hooks', () => {
      const middleware1: MenuMiddleware = {
        afterFilter: ({ results }) => results.filter((r) => r.score > 30),
      }

      const middleware2: MenuMiddleware = {
        afterFilter: ({ results }) => results.slice(0, 2),
      }

      const composed = composeMiddleware([middleware1, middleware2])

      const context = {
        results: [
          {
            type: 'item' as const,
            node: { kind: 'item', id: 'low' } as any,
            breadcrumbs: [],
            breadcrumbIds: [],
            score: 20,
          },
          {
            type: 'item' as const,
            node: { kind: 'item', id: 'medium' } as any,
            breadcrumbs: [],
            breadcrumbIds: [],
            score: 50,
          },
          {
            type: 'item' as const,
            node: { kind: 'item', id: 'high' } as any,
            breadcrumbs: [],
            breadcrumbIds: [],
            score: 90,
          },
          {
            type: 'item' as const,
            node: { kind: 'item', id: 'higher' } as any,
            breadcrumbs: [],
            breadcrumbIds: [],
            score: 95,
          },
        ],
        query: 'test',
        menu: {} as any,
      }

      const result = composed.afterFilter!(context)

      // First filters out score <= 30, leaving 3 results
      // Then takes first 2 results
      expect(result).toHaveLength(2)
      expect(result[0]?.node.id).toBe('medium')
      expect(result[1]?.node.id).toBe('high')
    })

    it('should not define afterFilter if no middleware has it', () => {
      const middleware1: MenuMiddleware = {
        beforeFilter: ({ nodes }) => nodes,
      }

      const middleware2: MenuMiddleware = {
        transformNodes: ({ nodes }) => nodes,
      }

      const composed = composeMiddleware([middleware1, middleware2])

      expect(composed.afterFilter).toBeUndefined()
    })
  })

  describe('transformNodes composition', () => {
    it('should compose multiple transformNodes hooks in order', () => {
      const middleware1: MenuMiddleware = {
        transformNodes: ({ nodes }) => [
          { kind: 'item', id: 'prefix' } as any,
          ...nodes,
        ],
      }

      const middleware2: MenuMiddleware = {
        transformNodes: ({ nodes }) => [
          ...nodes,
          { kind: 'item', id: 'suffix' } as any,
        ],
      }

      const composed = composeMiddleware([middleware1, middleware2])

      const context = {
        nodes: [{ kind: 'item', id: 'middle' } as any],
        query: 'test',
        mode: 'search' as const,
        allNodes: [] as any[],
        menu: {} as any,
        createNode: vi.fn(),
        hasExactMatch: vi.fn(),
      }

      const result = composed.transformNodes!(context)

      expect(result).toHaveLength(3)
      expect(result[0]?.id).toBe('prefix')
      expect(result[1]?.id).toBe('middle')
      expect(result[2]?.id).toBe('suffix')
    })

    it('should allow middleware to modify nodes sequentially', () => {
      const middleware1: MenuMiddleware = {
        transformNodes: ({ nodes }) =>
          nodes.filter((n: any) => n.id !== 'remove-1'),
      }

      const middleware2: MenuMiddleware = {
        transformNodes: ({ nodes }) =>
          nodes.filter((n: any) => n.id !== 'remove-2'),
      }

      const composed = composeMiddleware([middleware1, middleware2])

      const context = {
        nodes: [
          { kind: 'item', id: 'keep' } as any,
          { kind: 'item', id: 'remove-1' } as any,
          { kind: 'item', id: 'remove-2' } as any,
        ],
        query: 'test',
        mode: 'search' as const,
        allNodes: [] as any[],
        menu: {} as any,
        createNode: vi.fn(),
        hasExactMatch: vi.fn(),
      }

      const result = composed.transformNodes!(context)

      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('keep')
    })

    it('should not define transformNodes if no middleware has it', () => {
      const middleware1: MenuMiddleware = {
        beforeFilter: ({ nodes }) => nodes,
      }

      const middleware2: MenuMiddleware = {
        afterFilter: ({ results }) => results,
      }

      const composed = composeMiddleware([middleware1, middleware2])

      expect(composed.transformNodes).toBeUndefined()
    })

    it('should pass through all context properties', () => {
      let capturedContext: any

      const middleware: MenuMiddleware = {
        transformNodes: (context) => {
          capturedContext = context
          return context.nodes
        },
      }

      const composed = composeMiddleware([middleware])

      const createNode = vi.fn()
      const hasExactMatch = vi.fn()

      const context = {
        nodes: [{ kind: 'item', id: 'test' } as any],
        query: 'search query',
        mode: 'search' as const,
        allNodes: [{ kind: 'item', id: 'all' } as any],
        menu: { id: 'menu-id' } as any,
        createNode,
        hasExactMatch,
      }

      composed.transformNodes!(context)

      expect(capturedContext.query).toBe('search query')
      expect(capturedContext.mode).toBe('search')
      expect(capturedContext.createNode).toBe(createNode)
      expect(capturedContext.hasExactMatch).toBe(hasExactMatch)
    })
  })

  describe('Mixed hook composition', () => {
    it('should compose all three hook types independently', () => {
      const middleware1: MenuMiddleware = {
        beforeFilter: ({ nodes }) => [
          ...nodes,
          { kind: 'item', id: 'before-m1' } as any,
        ],
        transformNodes: ({ nodes }) => [
          ...nodes,
          { kind: 'item', id: 'transform-m1' } as any,
        ],
      }

      const middleware2: MenuMiddleware = {
        afterFilter: ({ results }) => [
          ...results,
          {
            type: 'item' as const,
            node: { kind: 'item', id: 'after-m2' } as any,
            breadcrumbs: [],
            breadcrumbIds: [],
            score: 100,
          },
        ],
        transformNodes: ({ nodes }) => [
          ...nodes,
          { kind: 'item', id: 'transform-m2' } as any,
        ],
      }

      const composed = composeMiddleware([middleware1, middleware2])

      expect(composed.beforeFilter).toBeDefined()
      expect(composed.afterFilter).toBeDefined()
      expect(composed.transformNodes).toBeDefined()

      // Test beforeFilter
      const beforeContext = {
        nodes: [{ kind: 'item', id: 'original' } as any],
        query: 'test',
        menu: {} as any,
      }
      const beforeResult = composed.beforeFilter!(beforeContext)
      expect(beforeResult).toHaveLength(2)
      expect(beforeResult[1]?.id).toBe('before-m1')

      // Test afterFilter
      const afterContext = {
        results: [
          {
            type: 'item' as const,
            node: { kind: 'item', id: 'result' } as any,
            breadcrumbs: [],
            breadcrumbIds: [],
            score: 50,
          },
        ],
        query: 'test',
        menu: {} as any,
      }
      const afterResult = composed.afterFilter!(afterContext)
      expect(afterResult).toHaveLength(2)
      expect((afterResult[1]?.node as any).id).toBe('after-m2')

      // Test transformNodes
      const transformContext = {
        nodes: [{ kind: 'item', id: 'node' } as any],
        query: 'test',
        mode: 'search' as const,
        allNodes: [] as any[],
        menu: {} as any,
        createNode: vi.fn(),
        hasExactMatch: vi.fn(),
      }
      const transformResult = composed.transformNodes!(transformContext)
      expect(transformResult).toHaveLength(3)
      expect(transformResult[1]?.id).toBe('transform-m1')
      expect(transformResult[2]?.id).toBe('transform-m2')
    })

    it('should handle middleware with different combinations of hooks', () => {
      const middleware1: MenuMiddleware = {
        beforeFilter: ({ nodes }) => nodes,
      }

      const middleware2: MenuMiddleware = {
        afterFilter: ({ results }) => results,
        transformNodes: ({ nodes }) => nodes,
      }

      const middleware3: MenuMiddleware = {
        transformNodes: ({ nodes }) => nodes,
      }

      const composed = composeMiddleware([
        middleware1,
        middleware2,
        middleware3,
      ])

      expect(composed.beforeFilter).toBeDefined()
      expect(composed.afterFilter).toBeDefined()
      expect(composed.transformNodes).toBeDefined()
    })
  })

  describe('Edge cases', () => {
    it('should handle empty nodes array', () => {
      const middleware: MenuMiddleware = {
        transformNodes: ({ nodes }) => [
          ...nodes,
          { kind: 'item', id: 'added' } as any,
        ],
      }

      const composed = composeMiddleware([middleware])

      const context = {
        nodes: [],
        query: '',
        mode: 'browse' as const,
        allNodes: [],
        menu: {} as any,
        createNode: vi.fn(),
        hasExactMatch: vi.fn(),
      }

      const result = composed.transformNodes!(context)

      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('added')
    })

    it('should handle middleware that returns empty array', () => {
      const middleware1: MenuMiddleware = {
        transformNodes: () => [],
      }

      const middleware2: MenuMiddleware = {
        transformNodes: ({ nodes }) => [
          ...nodes,
          { kind: 'item', id: 'should-not-appear' } as any,
        ],
      }

      const composed = composeMiddleware([middleware1, middleware2])

      const context = {
        nodes: [{ kind: 'item', id: 'original' } as any],
        query: '',
        mode: 'browse' as const,
        allNodes: [],
        menu: {} as any,
        createNode: vi.fn(),
        hasExactMatch: vi.fn(),
      }

      const result = composed.transformNodes!(context)

      // middleware1 returns empty array, middleware2 adds to empty array
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('should-not-appear')
    })

    it('should handle many middleware compositions', () => {
      const middlewares = Array.from({ length: 10 }, (_, i) => ({
        transformNodes: ({ nodes }: any) => [
          ...nodes,
          { kind: 'item', id: `m${i}` } as any,
        ],
      }))

      const composed = composeMiddleware(middlewares)

      const context = {
        nodes: [] as any[],
        query: '',
        mode: 'browse' as const,
        allNodes: [],
        menu: {} as any,
        createNode: vi.fn(),
        hasExactMatch: vi.fn(),
      }

      const result = composed.transformNodes!(context)

      expect(result).toHaveLength(10)
      expect(result.map((n) => n.id)).toEqual([
        'm0',
        'm1',
        'm2',
        'm3',
        'm4',
        'm5',
        'm6',
        'm7',
        'm8',
        'm9',
      ])
    })
  })
})
