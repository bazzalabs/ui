import { describe, expect, it, vi } from 'vitest'
import { createNew } from '../middleware/create-new.js'
import type { TransformNodesContext } from '../middleware/types.js'

describe('createNew middleware', () => {
  const createMockContext = (
    overrides: Partial<TransformNodesContext> = {},
  ): TransformNodesContext => ({
    nodes: [],
    query: '',
    mode: 'browse',
    allNodes: [],
    menu: {} as any,
    createNode: vi.fn((def) => ({ ...def, parent: {} }) as any),
    hasExactMatch: vi.fn(() => false),
    ...overrides,
  })

  describe('Basic functionality', () => {
    it('should not show create item in browse mode', () => {
      const middleware = createNew({
        showWhen: 'always',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'browse',
        query: 'test query',
      })

      const result = middleware.transformNodes!(context)

      expect(result).toEqual([])
    })

    it('should not show create item when query is empty', () => {
      const middleware = createNew({
        showWhen: 'always',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: '',
      })

      const result = middleware.transformNodes!(context)

      expect(result).toEqual([])
    })

    it('should not show create item when query is whitespace only', () => {
      const middleware = createNew({
        showWhen: 'always',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: '   ',
      })

      const result = middleware.transformNodes!(context)

      expect(result).toEqual([])
    })

    it('should add create item to bottom by default', () => {
      const middleware = createNew({
        showWhen: 'always',
        onCreate: vi.fn(),
      })

      const existingNodes = [{ kind: 'item', id: 'existing' } as any]

      const context = createMockContext({
        mode: 'search',
        query: 'test',
        nodes: existingNodes,
      })

      const result = middleware.transformNodes!(context)

      expect(result).toHaveLength(2)
      expect(result[0]?.id).toBe('existing')
      expect(result[1]?.id).toBe('__create-new-test')
    })

    it('should add create item to top when position is top', () => {
      const middleware = createNew({
        showWhen: 'always',
        position: 'top',
        onCreate: vi.fn(),
      })

      const existingNodes = [{ kind: 'item', id: 'existing' } as any]

      const context = createMockContext({
        mode: 'search',
        query: 'test',
        nodes: existingNodes,
      })

      const result = middleware.transformNodes!(context)

      expect(result).toHaveLength(2)
      expect(result[0]?.id).toBe('__create-new-test')
      expect(result[1]?.id).toBe('existing')
    })
  })

  describe('showWhen conditions', () => {
    it('should show when showWhen is always', () => {
      const middleware = createNew({
        showWhen: 'always',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'test',
        nodes: [{ kind: 'item', id: 'existing' } as any],
      })

      const result = middleware.transformNodes!(context)

      expect(result).toHaveLength(2)
    })

    it('should show when showWhen is no-results and there are no results', () => {
      const middleware = createNew({
        showWhen: 'no-results',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'test',
        nodes: [],
      })

      const result = middleware.transformNodes!(context)

      expect(result).toHaveLength(1)
    })

    it('should not show when showWhen is no-results and there are results', () => {
      const middleware = createNew({
        showWhen: 'no-results',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'test',
        nodes: [{ kind: 'item', id: 'result' } as any],
      })

      const result = middleware.transformNodes!(context)

      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('result')
    })

    it('should show when showWhen is has-query and query meets minimum length', () => {
      const middleware = createNew({
        showWhen: 'has-query',
        minQueryLength: 3,
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'abc',
        nodes: [],
      })

      const result = middleware.transformNodes!(context)

      expect(result).toHaveLength(1)
    })

    it('should not show when showWhen is has-query and query does not meet minimum length', () => {
      const middleware = createNew({
        showWhen: 'has-query',
        minQueryLength: 3,
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'ab',
        nodes: [],
      })

      const result = middleware.transformNodes!(context)

      expect(result).toEqual([])
    })

    it('should use default minQueryLength of 1 for has-query', () => {
      const middleware = createNew({
        showWhen: 'has-query',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'a',
        nodes: [],
      })

      const result = middleware.transformNodes!(context)

      expect(result).toHaveLength(1)
    })

    it('should show when showWhen is no-exact-match and there is no exact match', () => {
      const hasExactMatch = vi.fn(() => false)

      const middleware = createNew({
        showWhen: 'no-exact-match',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'test',
        nodes: [],
        hasExactMatch,
      })

      const result = middleware.transformNodes!(context)

      expect(hasExactMatch).toHaveBeenCalledWith('test')
      expect(result).toHaveLength(1)
    })

    it('should not show when showWhen is no-exact-match and there is an exact match', () => {
      const hasExactMatch = vi.fn(() => true)

      const middleware = createNew({
        showWhen: 'no-exact-match',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'test',
        nodes: [],
        hasExactMatch,
      })

      const result = middleware.transformNodes!(context)

      expect(hasExactMatch).toHaveBeenCalledWith('test')
      expect(result).toEqual([])
    })
  })

  describe('Label customization', () => {
    it('should use default label when label is not provided', () => {
      const createNodeMock = vi.fn((def) => ({ ...def, parent: {} }) as any)

      const middleware = createNew({
        showWhen: 'always',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'my query',
        nodes: [],
        createNode: createNodeMock,
      })

      middleware.transformNodes!(context)

      expect(createNodeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Create: my query',
        }),
      )
    })

    it('should use custom static label', () => {
      const createNodeMock = vi.fn((def) => ({ ...def, parent: {} }) as any)

      const middleware = createNew({
        showWhen: 'always',
        label: 'Create new item',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'test',
        nodes: [],
        createNode: createNodeMock,
      })

      middleware.transformNodes!(context)

      expect(createNodeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Create new item',
        }),
      )
    })

    it('should use custom function label', () => {
      const createNodeMock = vi.fn((def) => ({ ...def, parent: {} }) as any)
      const labelFn = vi.fn((query) => `Add "${query}"`)

      const middleware = createNew({
        showWhen: 'always',
        label: labelFn,
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'New Label',
        nodes: [],
        createNode: createNodeMock,
      })

      middleware.transformNodes!(context)

      expect(labelFn).toHaveBeenCalledWith('New Label')
      expect(createNodeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Add "New Label"',
        }),
      )
    })
  })

  describe('Node configuration', () => {
    it('should use custom id when provided', () => {
      const createNodeMock = vi.fn((def) => ({ ...def, parent: {} }) as any)

      const middleware = createNew({
        showWhen: 'always',
        id: 'custom-create-id',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'test',
        nodes: [],
        createNode: createNodeMock,
      })

      middleware.transformNodes!(context)

      expect(createNodeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'custom-create-id',
        }),
      )
    })

    it('should generate id from query when not provided', () => {
      const createNodeMock = vi.fn((def) => ({ ...def, parent: {} }) as any)

      const middleware = createNew({
        showWhen: 'always',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'my-query',
        nodes: [],
        createNode: createNodeMock,
      })

      middleware.transformNodes!(context)

      expect(createNodeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '__create-new-my-query',
        }),
      )
    })

    it('should pass icon to created node', () => {
      const createNodeMock = vi.fn((def) => ({ ...def, parent: {} }) as any)
      const iconElement = 'PlusIcon'

      const middleware = createNew({
        showWhen: 'always',
        icon: iconElement as any,
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'test',
        nodes: [],
        createNode: createNodeMock,
      })

      middleware.transformNodes!(context)

      expect(createNodeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: iconElement,
        }),
      )
    })

    it('should set closeOnSelect to false by default', () => {
      const createNodeMock = vi.fn((def) => ({ ...def, parent: {} }) as any)

      const middleware = createNew({
        showWhen: 'always',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'test',
        nodes: [],
        createNode: createNodeMock,
      })

      middleware.transformNodes!(context)

      expect(createNodeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          closeOnSelect: false,
        }),
      )
    })

    it('should use custom closeOnSelect value', () => {
      const createNodeMock = vi.fn((def) => ({ ...def, parent: {} }) as any)

      const middleware = createNew({
        showWhen: 'always',
        closeOnSelect: true,
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'test',
        nodes: [],
        createNode: createNodeMock,
      })

      middleware.transformNodes!(context)

      expect(createNodeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          closeOnSelect: true,
        }),
      )
    })
  })

  describe('onCreate callback', () => {
    it('should call onCreate with query when item is selected', () => {
      const onCreate = vi.fn()
      const createNodeMock = vi.fn(
        (def) =>
          ({
            ...def,
            parent: {},
            onSelect: def.onSelect,
          }) as any,
      )

      const middleware = createNew({
        showWhen: 'always',
        onCreate,
      })

      const context = createMockContext({
        mode: 'search',
        query: 'New Item',
        nodes: [],
        createNode: createNodeMock,
      })

      const result = middleware.transformNodes!(context)

      // Simulate selecting the create item
      const createItem = result[0]
      ;(createItem as any).onSelect?.()

      expect(onCreate).toHaveBeenCalledWith('New Item')
    })

    it('should handle async onCreate callback', async () => {
      const onCreate = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })
      const createNodeMock = vi.fn(
        (def) =>
          ({
            ...def,
            parent: {},
            onSelect: def.onSelect,
          }) as any,
      )

      const middleware = createNew({
        showWhen: 'always',
        onCreate,
      })

      const context = createMockContext({
        mode: 'search',
        query: 'Async Item',
        nodes: [],
        createNode: createNodeMock,
      })

      const result = middleware.transformNodes!(context)

      // Simulate selecting the create item
      const createItem = result[0]
      const promise = (createItem as any).onSelect?.()

      await expect(promise).resolves.toBeUndefined()
      expect(onCreate).toHaveBeenCalledWith('Async Item')
    })
  })

  describe('Custom render function', () => {
    it('should use custom render when provided', () => {
      const customRender = vi.fn(() => 'Custom Render')
      const createNodeMock = vi.fn((def) => ({ ...def, parent: {} }) as any)

      const middleware = createNew({
        showWhen: 'always',
        render: customRender,
        onCreate: vi.fn(),
      })

      const nodes = [{ kind: 'item', id: 'existing' } as any]
      const allNodes = [{ kind: 'item', id: 'all' } as any]
      const menu = { id: 'menu' } as any

      const context = createMockContext({
        mode: 'search',
        query: 'test query',
        nodes,
        allNodes,
        menu,
        createNode: createNodeMock,
      })

      middleware.transformNodes!(context)

      expect(createNodeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          render: expect.any(Function),
        }),
      )

      // Test that the render wrapper is created
      const createdNode = createNodeMock.mock.calls[0]?.[0]
      expect(createdNode?.render).toBeDefined()
    })

    it('should pass correct context to custom render function', () => {
      const customRender = vi.fn(() => 'Custom Render')
      const bindMock = { focused: false, disabled: false } as any
      const createNodeMock = vi.fn((def) => ({ ...def, parent: {} }) as any)

      const middleware = createNew({
        showWhen: 'always',
        render: customRender,
        onCreate: vi.fn(),
      })

      const nodes = [{ kind: 'item', id: 'node1' } as any]
      const allNodes = [
        { kind: 'item', id: 'all1' } as any,
        { kind: 'item', id: 'all2' } as any,
      ]
      const menu = { id: 'test-menu' } as any

      const context = createMockContext({
        mode: 'search',
        query: 'my query',
        nodes,
        allNodes,
        menu,
        createNode: createNodeMock,
      })

      middleware.transformNodes!(context)

      const createdNode = createNodeMock.mock.calls[0]?.[0]
      const renderFn = createdNode?.render

      // Call the render wrapper
      renderFn?.({ bind: bindMock, node: {} as any })

      expect(customRender).toHaveBeenCalledWith({
        query: 'my query',
        bind: bindMock,
        nodes,
        allNodes,
        mode: 'search',
        menu,
      })
    })

    it('should not define render when custom render is not provided', () => {
      const createNodeMock = vi.fn((def) => ({ ...def, parent: {} }) as any)

      const middleware = createNew({
        showWhen: 'always',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'test',
        nodes: [],
        createNode: createNodeMock,
      })

      middleware.transformNodes!(context)

      expect(createNodeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          render: undefined,
        }),
      )
    })
  })

  describe('Integration scenarios', () => {
    it('should work with empty nodes array', () => {
      const middleware = createNew({
        showWhen: 'always',
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'test',
        nodes: [],
      })

      const result = middleware.transformNodes!(context)

      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('__create-new-test')
    })

    it('should preserve existing nodes', () => {
      const middleware = createNew({
        showWhen: 'always',
        onCreate: vi.fn(),
      })

      const existingNodes = [
        { kind: 'item', id: 'item1' } as any,
        { kind: 'item', id: 'item2' } as any,
        { kind: 'item', id: 'item3' } as any,
      ]

      const context = createMockContext({
        mode: 'search',
        query: 'test',
        nodes: existingNodes,
      })

      const result = middleware.transformNodes!(context)

      expect(result).toHaveLength(4)
      expect(result[0]?.id).toBe('item1')
      expect(result[1]?.id).toBe('item2')
      expect(result[2]?.id).toBe('item3')
      expect(result[3]?.id).toBe('__create-new-test')
    })

    it('should work with complex showWhen conditions', () => {
      const hasExactMatch = vi.fn(() => false)

      const middleware = createNew({
        showWhen: 'no-exact-match',
        minQueryLength: 2,
        onCreate: vi.fn(),
      })

      const context = createMockContext({
        mode: 'search',
        query: 'new label',
        nodes: [{ kind: 'item', id: 'similar' } as any],
        hasExactMatch,
      })

      const result = middleware.transformNodes!(context)

      // Should show because query length >= 2 and no exact match
      expect(result).toHaveLength(2)
    })
  })
})
