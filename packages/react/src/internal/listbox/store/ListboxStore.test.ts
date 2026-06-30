import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ListboxContext, ListboxState } from './ListboxStore.js'
import { ListboxStore } from './ListboxStore.js'

// ============================================================================
// Test Helpers
// ============================================================================

function createStore(
  initialState?: Partial<ListboxState>,
  context?: Partial<ListboxContext>,
) {
  return new ListboxStore(initialState, context)
}

function registerItems(
  store: ListboxStore,
  items: Array<{
    id: string
    value: string
    disabled?: boolean
    groupId?: string
  }>,
) {
  const cleanups: Array<() => void> = []
  for (const item of items) {
    const cleanup = store.registerItem(item.id, {
      value: item.value,
      disabled: item.disabled,
      groupId: item.groupId,
    })
    cleanups.push(cleanup)
  }
  return () => {
    cleanups.forEach((cleanup) => {
      cleanup()
    })
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('ListboxStore', () => {
  describe('initial state', () => {
    it('creates with default state', () => {
      const store = createStore()

      expect(store.state.open).toBe(false)
      expect(store.state.search).toBe('')
      expect(store.state.highlightedId).toBe(null)
      expect(store.state.highlightSource).toBe(null)
      expect(store.state.hasInput).toBe(false)
      expect(store.state.filteredCount).toBe(0)
      expect(store.state.virtualized).toBe(false)
    })

    it('creates with custom initial state', () => {
      const store = createStore({ open: true, search: 'test' })

      expect(store.state.open).toBe(true)
      expect(store.state.search).toBe('test')
    })

    it('creates with default context', () => {
      const store = createStore()

      expect(store.context.loop).toBe(true)
      expect(store.context.autoHighlightFirst).toBe(true)
      expect(store.context.clearSearchOnClose).toBe(true)
      expect(store.context.filter).toBeDefined()
    })

    it('creates with custom context', () => {
      const store = createStore({}, { loop: false, autoHighlightFirst: false })

      expect(store.context.loop).toBe(false)
      expect(store.context.autoHighlightFirst).toBe(false)
    })
  })

  describe('item registration', () => {
    it('registers items', () => {
      const store = createStore()

      store.registerItem('item-1', { value: 'Item 1' })
      store.registerItem('item-2', { value: 'Item 2' })

      expect(store.context.items.size).toBe(2)
      expect(store.context.items.get('item-1')?.value).toBe('Item 1')
      expect(store.context.items.get('item-2')?.value).toBe('Item 2')
    })

    it('unregisters items on cleanup', () => {
      const store = createStore()

      const cleanup1 = store.registerItem('item-1', { value: 'Item 1' })
      const cleanup2 = store.registerItem('item-2', { value: 'Item 2' })

      expect(store.context.items.size).toBe(2)

      cleanup1()
      expect(store.context.items.size).toBe(1)
      expect(store.context.items.has('item-1')).toBe(false)
      expect(store.context.items.has('item-2')).toBe(true)

      cleanup2()
      expect(store.context.items.size).toBe(0)
    })

    it('registers items with groups', () => {
      const store = createStore()

      store.registerGroup('group-1')
      store.registerItem('item-1', { value: 'Item 1', groupId: 'group-1' })
      store.registerItem('item-2', { value: 'Item 2', groupId: 'group-1' })

      const groupItems = store.context.groups.get('group-1')
      expect(groupItems?.size).toBe(2)
      expect(groupItems?.has('item-1')).toBe(true)
      expect(groupItems?.has('item-2')).toBe(true)
    })

    it('unregisters group items on cleanup', () => {
      const store = createStore()

      store.registerGroup('group-1')
      const cleanup = store.registerItem('item-1', {
        value: 'Item 1',
        groupId: 'group-1',
      })

      expect(store.context.groups.get('group-1')?.has('item-1')).toBe(true)

      cleanup()

      expect(store.context.groups.get('group-1')?.has('item-1')).toBe(false)
    })

    it('registers item select callbacks', () => {
      const store = createStore()
      const onSelect = vi.fn()

      store.registerItem('item-1', { value: 'Item 1' })
      store.registerItemSelect('item-1', onSelect)

      expect(store.context.itemSelects.get('item-1')).toBe(onSelect)
    })

    it('registers shortcuts', () => {
      const store = createStore()

      store.registerItem('item-1', { value: 'Item 1', shortcut: 'a' })
      store.registerItem('item-2', { value: 'Item 2', shortcut: 'B' })

      expect(store.context.shortcuts.get('a')).toBe('item-1')
      expect(store.context.shortcuts.get('b')).toBe('item-2') // lowercase
    })
  })

  describe('navigation', () => {
    let store: ListboxStore

    beforeEach(() => {
      store = createStore({ open: true })
      registerItems(store, [
        { id: 'item-1', value: 'Item 1' },
        { id: 'item-2', value: 'Item 2' },
        { id: 'item-3', value: 'Item 3' },
      ])
    })

    describe('highlightNext', () => {
      it('highlights next item', () => {
        store.setHighlightedId('item-1')

        store.highlightNext()

        expect(store.state.highlightedId).toBe('item-2')
      })

      it('highlights first item when no item is highlighted', () => {
        // Create store without auto-highlight
        const testStore = createStore(
          { open: true },
          { autoHighlightFirst: false },
        )
        registerItems(testStore, [
          { id: 'item-1', value: 'Item 1' },
          { id: 'item-2', value: 'Item 2' },
          { id: 'item-3', value: 'Item 3' },
        ])

        testStore.highlightNext()

        expect(testStore.state.highlightedId).toBe('item-1')
      })

      it('loops to first item when at end (loop=true)', () => {
        store.setHighlightedId('item-3')

        store.highlightNext()

        expect(store.state.highlightedId).toBe('item-1')
      })

      it('stays at last item when at end (loop=false)', () => {
        store.context.loop = false
        store.setHighlightedId('item-3')

        store.highlightNext()

        expect(store.state.highlightedId).toBe('item-3')
      })

      it('skips disabled items', () => {
        // Re-register with disabled item
        store.context.items.clear()
        registerItems(store, [
          { id: 'item-1', value: 'Item 1' },
          { id: 'item-2', value: 'Item 2', disabled: true },
          { id: 'item-3', value: 'Item 3' },
        ])
        store.setHighlightedId('item-1')

        store.highlightNext()

        expect(store.state.highlightedId).toBe('item-3')
      })
    })

    describe('highlightPrev', () => {
      it('highlights previous item', () => {
        store.setHighlightedId('item-2')

        store.highlightPrev()

        expect(store.state.highlightedId).toBe('item-1')
      })

      it('highlights last item when no item is highlighted', () => {
        store.highlightPrev()

        expect(store.state.highlightedId).toBe('item-3')
      })

      it('loops to last item when at start (loop=true)', () => {
        store.setHighlightedId('item-1')

        store.highlightPrev()

        expect(store.state.highlightedId).toBe('item-3')
      })

      it('stays at first item when at start (loop=false)', () => {
        store.context.loop = false
        store.setHighlightedId('item-1')

        store.highlightPrev()

        expect(store.state.highlightedId).toBe('item-1')
      })

      it('skips disabled items', () => {
        store.context.items.clear()
        registerItems(store, [
          { id: 'item-1', value: 'Item 1' },
          { id: 'item-2', value: 'Item 2', disabled: true },
          { id: 'item-3', value: 'Item 3' },
        ])
        store.setHighlightedId('item-3')

        store.highlightPrev()

        expect(store.state.highlightedId).toBe('item-1')
      })
    })

    describe('highlightFirstItem', () => {
      it('highlights the first visible item', () => {
        store.highlightFirstItem()

        expect(store.state.highlightedId).toBe('item-1')
      })

      it('skips disabled first item', () => {
        store.context.items.clear()
        registerItems(store, [
          { id: 'item-1', value: 'Item 1', disabled: true },
          { id: 'item-2', value: 'Item 2' },
          { id: 'item-3', value: 'Item 3' },
        ])

        store.highlightFirstItem()

        expect(store.state.highlightedId).toBe('item-2')
      })

      it('sets null when all items are disabled', () => {
        store.context.items.clear()
        registerItems(store, [
          { id: 'item-1', value: 'Item 1', disabled: true },
          { id: 'item-2', value: 'Item 2', disabled: true },
        ])

        store.highlightFirstItem()

        expect(store.state.highlightedId).toBe(null)
      })
    })

    describe('highlightItemByValue', () => {
      it('highlights item by its value', () => {
        store.highlightItemByValue('item-2')

        expect(store.state.highlightedId).toBe('item-2')
      })

      it('falls back to first item if value not found', () => {
        store.highlightItemByValue('nonexistent')

        expect(store.state.highlightedId).toBe('item-1')
      })
    })

    describe('getVisibleItemIds', () => {
      it('returns all non-disabled items when no search', () => {
        const ids = store.getVisibleItemIds()

        expect(ids).toEqual(['item-1', 'item-2', 'item-3'])
      })

      it('excludes disabled items', () => {
        store.context.items.clear()
        registerItems(store, [
          { id: 'item-1', value: 'Item 1' },
          { id: 'item-2', value: 'Item 2', disabled: true },
          { id: 'item-3', value: 'Item 3' },
        ])

        const ids = store.getVisibleItemIds()

        expect(ids).toEqual(['item-1', 'item-3'])
      })
    })
  })

  describe('filtering', () => {
    let store: ListboxStore

    beforeEach(() => {
      store = createStore({ open: true })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
        { id: 'cherry', value: 'Cherry' },
      ])
    })

    it('filters items based on search query', () => {
      store.setSearch('app')

      const ids = store.getVisibleItemIds()
      expect(ids).toContain('apple')
      expect(ids).not.toContain('banana')
      expect(ids).not.toContain('cherry')
    })

    it('resets list scroll position when search changes', () => {
      const scrollTo = vi.fn()
      store.setListRef({
        current: { scrollTo } as unknown as HTMLElement,
      })

      store.setSearch('app')

      expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
    })

    it('resets the nearest scrollable ancestor when the list is rendered inside a scroll viewport', () => {
      const viewport = document.createElement('div')
      const list = document.createElement('div')
      const viewportScrollTo = vi.fn()
      const listScrollTo = vi.fn()

      viewport.style.overflowY = 'auto'
      Object.defineProperty(viewport, 'scrollHeight', {
        value: 500,
        configurable: true,
      })
      Object.defineProperty(viewport, 'clientHeight', {
        value: 100,
        configurable: true,
      })
      viewport.scrollTo = viewportScrollTo
      list.scrollTo = listScrollTo
      viewport.appendChild(list)
      store.setListRef({ current: list })

      store.setSearch('app')

      expect(viewportScrollTo).toHaveBeenCalledWith({ top: 0 })
      expect(listScrollTo).not.toHaveBeenCalled()
    })

    it('uses explicit list scroll container ref before looking for a scrollable ancestor', () => {
      const list = document.createElement('div')
      const scrollContainer = document.createElement('div')
      const listScrollTo = vi.fn()
      const scrollContainerScrollTo = vi.fn()

      list.scrollTo = listScrollTo
      scrollContainer.scrollTo = scrollContainerScrollTo
      store.setListRef({ current: list })
      store.setListScrollContainerRef({ current: scrollContainer })

      store.setSearch('app')

      expect(scrollContainerScrollTo).toHaveBeenCalledWith({ top: 0 })
      expect(listScrollTo).not.toHaveBeenCalled()
    })

    it('preserves list scroll position when resetScrollOnSearch is false', () => {
      const scrollTo = vi.fn()
      store.context.resetScrollOnSearch = false
      store.setListRef({
        current: { scrollTo } as unknown as HTMLElement,
      })

      store.setSearch('app')

      expect(scrollTo).not.toHaveBeenCalled()
    })

    it('resets list scroll position when autoHighlightFirst is false', () => {
      const scrollTo = vi.fn()
      const store = createStore({ open: true }, { autoHighlightFirst: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
      ])
      store.setListRef({
        current: { scrollTo } as unknown as HTMLElement,
      })

      store.setSearch('app')

      expect(store.state.highlightedId).toBe(null)
      expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
    })

    it('resets list scroll position when search has no results', () => {
      const scrollTo = vi.fn()
      store.setListRef({
        current: { scrollTo } as unknown as HTMLElement,
      })

      store.setSearch('xyz')

      expect(store.getVisibleItemIds()).toEqual([])
      expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
    })

    it('skips generic list scroll reset when virtualized', () => {
      const scrollTo = vi.fn()
      store.setVirtualized(true)
      store.setListRef({
        current: { scrollTo } as unknown as HTMLElement,
      })

      store.setSearch('app')

      expect(scrollTo).not.toHaveBeenCalled()
    })

    it('ignores trailing whitespace in search query', () => {
      store.setSearch('app ')

      const ids = store.getVisibleItemIds()
      expect(ids).toContain('apple')
      expect(ids).not.toContain('banana')
      expect(ids).not.toContain('cherry')
    })

    it('shows all items when search is empty', () => {
      store.setSearch('app')
      store.setSearch('')

      const ids = store.getVisibleItemIds()
      expect(ids).toEqual(['apple', 'banana', 'cherry'])
    })

    it('updates filteredCount', () => {
      expect(store.state.filteredCount).toBe(3)

      store.setSearch('app')

      expect(store.state.filteredCount).toBe(1)
    })

    it('treats whitespace-only search as empty', () => {
      store.setSearch('   ')

      const ids = store.getVisibleItemIds()
      expect(ids).toEqual(['apple', 'banana', 'cherry'])
      expect(store.state.filteredCount).toBe(3)
    })

    it('supports custom search normalization', () => {
      store.setSearch('app ')
      expect(store.getVisibleItemIds()).toContain('apple')

      store.setSearchNormalizer((query) => query)

      const ids = store.getVisibleItemIds()
      expect(ids).not.toContain('apple')
      expect(ids).not.toContain('banana')
      expect(ids).not.toContain('cherry')
    })

    it('filters with keywords', () => {
      store.context.items.clear()
      store.registerItem('item-1', {
        value: 'Apple',
        keywords: ['fruit', 'red'],
      })
      store.registerItem('item-2', { value: 'Banana', keywords: ['fruit'] })
      store.registerItem('item-3', { value: 'Carrot', keywords: ['vegetable'] })

      store.setSearch('fruit')

      const ids = store.getVisibleItemIds()
      expect(ids).toContain('item-1')
      expect(ids).toContain('item-2')
      expect(ids).not.toContain('item-3')
    })

    it('disables filtering when filter=false', () => {
      store.context.filter = false

      store.setSearch('xyz')

      // All items should still be visible
      const ids = store.getVisibleItemIds()
      expect(ids).toEqual(['apple', 'banana', 'cherry'])
    })

    it('tracks visible groups', () => {
      store.context.items.clear()
      store.registerGroup('fruits')
      store.registerGroup('vegetables')
      store.registerItem('apple', { value: 'Apple', groupId: 'fruits' })
      store.registerItem('banana', { value: 'Banana', groupId: 'fruits' })
      store.registerItem('carrot', { value: 'Carrot', groupId: 'vegetables' })

      store.setSearch('app')

      expect(store.state.visibleGroups.has('fruits')).toBe(true)
      expect(store.state.visibleGroups.has('vegetables')).toBe(false)
    })
  })

  describe('open/close behavior', () => {
    it('auto-highlights first item when opening (autoHighlightFirst=true)', () => {
      const store = createStore({}, { autoHighlightFirst: true })
      registerItems(store, [
        { id: 'item-1', value: 'Item 1' },
        { id: 'item-2', value: 'Item 2' },
      ])

      store.setOpen(true)

      expect(store.state.highlightedId).toBe('item-1')
    })

    it('does not auto-highlight when opening (autoHighlightFirst=false)', () => {
      const store = createStore({}, { autoHighlightFirst: false })
      registerItems(store, [
        { id: 'item-1', value: 'Item 1' },
        { id: 'item-2', value: 'Item 2' },
      ])

      store.setOpen(true)

      expect(store.state.highlightedId).toBe(null)
    })

    it('clears search when closing (clearSearchOnClose=true)', () => {
      const store = createStore(
        { open: true, search: 'test' },
        { clearSearchOnClose: true },
      )

      store.setOpen(false)

      expect(store.state.search).toBe('')
    })

    it('preserves search when closing (clearSearchOnClose=false)', () => {
      const store = createStore(
        { open: true, search: 'test' },
        { clearSearchOnClose: false },
      )

      store.setOpen(false)

      expect(store.state.search).toBe('test')
    })

    it('preserves search when closing (clearSearchOnClose="after-exit")', () => {
      const store = createStore(
        { open: true, search: 'test' },
        { clearSearchOnClose: 'after-exit' },
      )

      store.setOpen(false)

      // Search should NOT be cleared immediately - it's deferred to after animation
      expect(store.state.search).toBe('test')
    })

    it('clears search via clearSearch() when clearSearchOnClose="after-exit"', () => {
      const store = createStore(
        { open: true, search: 'test' },
        { clearSearchOnClose: 'after-exit' },
      )

      store.setOpen(false)
      expect(store.state.search).toBe('test')

      // Simulates what Root.onOpenChangeComplete does after animation completes
      store.clearSearch()
      expect(store.state.search).toBe('')
    })

    it('preserves highlight when closing', () => {
      const store = createStore({ open: true })
      registerItems(store, [{ id: 'item-1', value: 'Item 1' }])
      store.setHighlightedId('item-1')

      store.setOpen(false)

      expect(store.state.highlightedId).toBe('item-1')
    })

    it('clears deferred highlight via clearHighlight()', () => {
      const store = createStore({ open: true })
      registerItems(store, [{ id: 'item-1', value: 'Item 1' }])
      store.setHighlightedId('item-1')

      store.setOpen(false)
      store.clearHighlight()

      expect(store.state.highlightedId).toBe(null)
    })

    it('calls onOpenChange callback', () => {
      const onOpenChange = vi.fn()
      const store = createStore({}, { onOpenChange })

      store.setOpen(true, 'trigger-press')

      expect(onOpenChange).toHaveBeenCalledWith(
        true,
        expect.objectContaining({ reason: 'trigger-press' }),
      )
    })

    it('prevents state change when onOpenChange cancels', () => {
      const onOpenChange = vi.fn((_, details) => {
        details.cancel()
      })
      const store = createStore({}, { onOpenChange })

      store.setOpen(true)

      expect(store.state.open).toBe(false)
    })
  })

  describe('open method tracking', () => {
    it('records the open method from the triggering pointer event', () => {
      const store = createStore()

      store.setOpen(true, 'trigger-press', {
        pointerType: 'touch',
      } as PointerEvent)

      expect(store.state.openMethod).toBe('touch')
    })

    it('records keyboard opens', () => {
      const store = createStore()

      store.setOpen(true, 'trigger-press', new KeyboardEvent('keydown'))

      expect(store.state.openMethod).toBe('keyboard')
    })

    it('does not update the open method on close', () => {
      const store = createStore()

      store.setOpen(true, 'trigger-press', {
        pointerType: 'touch',
      } as PointerEvent)
      store.setOpen(false)

      // Retained from the last open so exit affordances stay consistent.
      expect(store.state.openMethod).toBe('touch')
    })

    it('does not record the open method when the open is canceled', () => {
      const store = createStore(
        {},
        {
          onOpenChange: (_, details) => {
            details.cancel()
          },
        },
      )

      store.setOpen(true, 'trigger-press', {
        pointerType: 'touch',
      } as PointerEvent)

      expect(store.state.openMethod).toBe(null)
    })
  })

  describe('selection', () => {
    it('selectHighlighted calls the item onSelect callback', () => {
      const onSelect = vi.fn()
      const store = createStore({ open: true })
      store.registerItem('item-1', { value: 'Item 1' })
      store.registerItemSelect('item-1', onSelect)
      store.setHighlightedId('item-1')

      store.selectHighlighted()

      expect(onSelect).toHaveBeenCalled()
    })

    it('selectHighlighted does nothing when no item is highlighted', () => {
      const onSelect = vi.fn()
      const store = createStore({ open: true }, { autoHighlightFirst: false })
      store.registerItem('item-1', { value: 'Item 1' })
      store.registerItemSelect('item-1', onSelect)

      // Ensure no highlight
      expect(store.state.highlightedId).toBe(null)

      store.selectHighlighted()

      expect(onSelect).not.toHaveBeenCalled()
    })

    it('selectByShortcut selects item by shortcut key', () => {
      const onSelect = vi.fn()
      const store = createStore({ open: true })
      store.registerItem('item-1', { value: 'Item 1', shortcut: 'a' })
      store.registerItemSelect('item-1', onSelect)

      const result = store.selectByShortcut('a')

      expect(result).toBe(true)
      expect(onSelect).toHaveBeenCalled()
    })

    it('selectByShortcut returns false for unknown shortcut', () => {
      const store = createStore({ open: true })
      store.registerItem('item-1', { value: 'Item 1', shortcut: 'a' })

      const result = store.selectByShortcut('b')

      expect(result).toBe(false)
    })

    it('selectByShortcut does not select disabled items', () => {
      const onSelect = vi.fn()
      const store = createStore({ open: true })
      store.registerItem('item-1', {
        value: 'Item 1',
        shortcut: 'a',
        disabled: true,
      })
      store.registerItemSelect('item-1', onSelect)

      const result = store.selectByShortcut('a')

      expect(result).toBe(false)
      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('virtualization', () => {
    it('setVirtualized updates state', () => {
      const store = createStore()

      store.setVirtualized(true)

      expect(store.state.virtualized).toBe(true)
    })

    it('setVirtualItems pre-registers items', () => {
      const store = createStore({ open: true, virtualized: true })

      store.setVirtualItems([
        { value: 'item-1' },
        { value: 'item-2' },
        { value: 'item-3' },
      ])

      expect(store.context.items.has('item-1')).toBe(true)
      expect(store.context.items.has('item-2')).toBe(true)
      expect(store.context.items.has('item-3')).toBe(true)
    })

    it('uses virtualItems order for navigation', () => {
      const store = createStore({ open: true })
      store.setVirtualized(true)
      store.setVirtualItems([
        { value: 'item-3' },
        { value: 'item-1' },
        { value: 'item-2' },
      ])

      const ids = store.getVisibleItemIds()

      // Should follow virtualItems order, not registration order
      expect(ids).toEqual(['item-3', 'item-1', 'item-2'])
    })

    it('respects disabled in virtualItems', () => {
      const store = createStore({ open: true })
      store.setVirtualized(true)
      store.setVirtualItems([
        { value: 'item-1' },
        { value: 'item-2', disabled: true },
        { value: 'item-3' },
      ])

      const ids = store.getVisibleItemIds()

      expect(ids).toEqual(['item-1', 'item-3'])
    })

    it('getVirtualItemIndex returns correct index', () => {
      const store = createStore({ virtualized: true })
      store.setVirtualItems([
        { value: 'item-1' },
        { value: 'item-2' },
        { value: 'item-3' },
      ])

      expect(store.getVirtualItemIndex('item-1')).toBe(0)
      expect(store.getVirtualItemIndex('item-2')).toBe(1)
      expect(store.getVirtualItemIndex('item-3')).toBe(2)
      expect(store.getVirtualItemIndex('nonexistent')).toBe(-1)
    })

    it('getVirtualItemIndex returns -1 when not virtualized', () => {
      const store = createStore({ virtualized: false })

      expect(store.getVirtualItemIndex('item-1')).toBe(-1)
    })

    it('calls onHighlightChange for virtualizer sync', () => {
      const onHighlightChange = vi.fn()
      const store = createStore({ open: true, virtualized: true })
      store.setVirtualItems([
        { value: 'item-1' },
        { value: 'item-2' },
        { value: 'item-3' },
      ])
      store.setOnHighlightChange(onHighlightChange)

      // Trigger keyboard navigation (which calls scrollItemIntoView)
      store.setHighlightedId('item-2', 'keyboard')

      // onHighlightChange is called when item is not in DOM
      expect(onHighlightChange).toHaveBeenCalledWith(
        'item-2',
        1,
        expect.objectContaining({ reason: 'keyboard' }),
      )
    })

    it('keeps highlight when virtual items are recreated with same values', () => {
      const store = createStore({ open: true, virtualized: true })

      store.setVirtualItems([
        { value: 'backlog' },
        { value: 'todo' },
        { value: 'in-progress' },
      ])
      store.setHighlightedId('todo', 'pointer')

      // New array reference, same navigation-relevant data
      store.setVirtualItems([
        { value: 'backlog' },
        { value: 'todo' },
        { value: 'in-progress' },
      ])

      expect(store.state.highlightedId).toBe('todo')
    })

    it('keeps highlight across transient virtualization cleanup', () => {
      const store = createStore({ open: true, virtualized: true })

      store.setVirtualItems([
        { value: 'backlog' },
        { value: 'todo' },
        { value: 'in-progress' },
      ])
      store.setHighlightedId('todo', 'pointer')

      // Simulate effect cleanup/re-run sequence:
      // cleanup -> setVirtualized(false) + setVirtualItems([])
      // rerun   -> setVirtualized(true) + setVirtualItems(items)
      store.setVirtualized(false)
      store.setVirtualItems([])
      store.setVirtualized(true)
      store.setVirtualItems([
        { value: 'backlog' },
        { value: 'todo' },
        { value: 'in-progress' },
      ])

      expect(store.state.highlightedId).toBe('todo')
    })

    it('revalidates highlight when highlighted item becomes disabled', () => {
      const store = createStore({ open: true, virtualized: true })

      store.setVirtualItems([
        { value: 'backlog' },
        { value: 'todo' },
        { value: 'in-progress' },
      ])
      store.setHighlightedId('todo', 'pointer')

      // Highlighted item becomes disabled — should move highlight away
      store.setVirtualItems([
        { value: 'backlog' },
        { value: 'todo', disabled: true },
        { value: 'in-progress' },
      ])

      expect(store.state.highlightedId).not.toBe('todo')
    })

    it('revalidates highlight when items are reordered', () => {
      const store = createStore({ open: true, virtualized: true })

      store.setVirtualItems([
        { value: 'backlog' },
        { value: 'todo' },
        { value: 'in-progress' },
      ])
      store.setHighlightedId('todo', 'pointer')

      // Reordered — different first item should trigger forceFirst
      store.setVirtualItems([
        { value: 'in-progress' },
        { value: 'todo' },
        { value: 'backlog' },
      ])

      // Highlight should move to the new first item
      expect(store.state.highlightedId).toBe('in-progress')
    })
  })

  describe('submenu management', () => {
    it('registers submenu open/close callbacks', () => {
      const store = createStore()
      const onOpen = vi.fn()
      const onClose = vi.fn()

      store.registerItem('submenu-1', {
        value: 'Submenu',
        isSubmenuTrigger: true,
      })
      store.registerSubmenuOpen('submenu-1', onOpen)
      store.registerSubmenuClose('submenu-1', onClose)

      expect(store.context.submenuOpens.get('submenu-1')).toBe(onOpen)
      expect(store.context.submenuCloses.get('submenu-1')).toBe(onClose)
    })

    it('openSubmenuForHighlighted calls submenu open callback', () => {
      const onOpen = vi.fn()
      const store = createStore({ open: true })
      store.registerItem('submenu-1', {
        value: 'Submenu',
        isSubmenuTrigger: true,
      })
      store.registerSubmenuOpen('submenu-1', onOpen)
      store.setHighlightedId('submenu-1')

      store.openSubmenuForHighlighted()

      expect(onOpen).toHaveBeenCalled()
    })

    it('isHighlightedSubmenuTrigger returns correct value', () => {
      const store = createStore({ open: true })
      store.registerItem('submenu-1', {
        value: 'Submenu',
        isSubmenuTrigger: true,
      })
      store.registerItem('item-1', { value: 'Item 1' })

      store.setHighlightedId('submenu-1')
      expect(store.isHighlightedSubmenuTrigger()).toBe(true)

      store.setHighlightedId('item-1')
      expect(store.isHighlightedSubmenuTrigger()).toBe(false)
    })

    it('closeSiblingSubmenus closes all except specified', () => {
      const onClose1 = vi.fn()
      const onClose2 = vi.fn()
      const onClose3 = vi.fn()
      const store = createStore()

      store.registerSubmenuClose('sub-1', onClose1)
      store.registerSubmenuClose('sub-2', onClose2)
      store.registerSubmenuClose('sub-3', onClose3)

      store.closeSiblingSubmenus('sub-2')

      expect(onClose1).toHaveBeenCalled()
      expect(onClose2).not.toHaveBeenCalled()
      expect(onClose3).toHaveBeenCalled()
    })
  })

  describe('search callback', () => {
    it('calls onSearchChange when search changes', () => {
      const onSearchChange = vi.fn()
      const store = createStore({}, { onSearchChange })

      store.setSearch('test')

      expect(onSearchChange).toHaveBeenCalledWith('test')
    })

    it('clearSearch resets search to empty', () => {
      const store = createStore({ search: 'test' })

      store.clearSearch()

      expect(store.state.search).toBe('')
    })
  })

  describe('autoHighlightFirst with string value', () => {
    it('highlights specific item by value when autoHighlightFirst is string', () => {
      const store = createStore({}, { autoHighlightFirst: 'item-2' })
      registerItems(store, [
        { id: 'item-1', value: 'Item 1' },
        { id: 'item-2', value: 'Item 2' },
        { id: 'item-3', value: 'Item 3' },
      ])

      store.setOpen(true)
      store.applyAutoHighlight()

      expect(store.state.highlightedId).toBe('item-2')
    })
  })

  describe('highlight validation', () => {
    it('resets highlight to first item when search changes', () => {
      const store = createStore({ open: true })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
        { id: 'cherry', value: 'Cherry' },
      ])
      store.setHighlightedId('cherry')

      // Search for something that only matches apple
      store.setSearch('app')

      // Highlight should reset to first matching item
      expect(store.state.highlightedId).toBe('apple')
    })

    it('clears highlight when no items match search', () => {
      const store = createStore({ open: true })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
      ])
      store.setHighlightedId('apple')

      store.setSearch('xyz')

      expect(store.state.highlightedId).toBe(null)
    })
  })

  describe('orderedItems (filter={false})', () => {
    it('highlights first ordered item when set', () => {
      const store = createStore({ open: true }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
        { id: 'cherry', value: 'Cherry' },
      ])

      // Consumer provides order: cherry first
      store.setOrderedItems(['cherry', 'apple'])

      expect(store.state.highlightedId).toBe('cherry')
    })

    it('updates highlight when ordered items change', () => {
      const store = createStore({ open: true }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
        { id: 'cherry', value: 'Cherry' },
      ])

      // Initial order
      store.setOrderedItems(['cherry', 'apple'])
      expect(store.state.highlightedId).toBe('cherry')

      // Change order - banana first
      store.setOrderedItems(['banana', 'cherry'])
      expect(store.state.highlightedId).toBe('banana')
    })

    it('preserves highlight for append-only ordered item updates', () => {
      const store = createStore({ open: true }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
        { id: 'cherry', value: 'Cherry' },
      ])

      store.setOrderedItems(['apple', 'banana'])
      store.setHighlightedId('banana', 'keyboard')

      store.setOrderedItems(['apple', 'banana', 'cherry'], {
        reason: 'append',
      })

      expect(store.state.highlightedId).toBe('banana')
    })

    it('falls back to first item on append updates when highlight is no longer valid', () => {
      const store = createStore({ open: true }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
        { id: 'cherry', value: 'Cherry' },
      ])

      store.setOrderedItems(['apple', 'banana'])
      store.setHighlightedId('banana', 'keyboard')

      store.setOrderedItems(['apple', 'cherry'], {
        reason: 'append',
      })

      expect(store.state.highlightedId).toBe('apple')
    })

    it('clears highlight when ordered items is empty', () => {
      const store = createStore({ open: true }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
      ])

      store.setOrderedItems(['apple'])
      expect(store.state.highlightedId).toBe('apple')

      store.setOrderedItems([])
      expect(store.state.highlightedId).toBe(null)
    })

    it('skips unregistered items in ordered list', () => {
      const store = createStore({ open: true }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'cherry', value: 'Cherry' },
      ])

      // 'banana' is not registered
      store.setOrderedItems(['banana', 'cherry', 'apple'])

      // Should highlight cherry (first registered item)
      expect(store.state.highlightedId).toBe('cherry')
    })

    it('does not update highlight when not open', () => {
      const store = createStore({ open: false }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
      ])

      store.setOrderedItems(['banana', 'apple'])

      // Should not change highlight when closed
      expect(store.state.highlightedId).toBe(null)
    })

    it('getVisibleItemIds returns items in ordered order', () => {
      const store = createStore({ open: true }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
        { id: 'cherry', value: 'Cherry' },
      ])

      store.setOrderedItems(['cherry', 'apple', 'banana'])

      const visibleIds = store.getVisibleItemIds()
      expect(visibleIds).toEqual(['cherry', 'apple', 'banana'])
    })

    it('getVisibleItemIds excludes disabled items', () => {
      const store = createStore({ open: true }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana', disabled: true },
        { id: 'cherry', value: 'Cherry' },
      ])

      store.setOrderedItems(['cherry', 'banana', 'apple'])

      const visibleIds = store.getVisibleItemIds()
      expect(visibleIds).toEqual(['cherry', 'apple'])
    })

    it('getVisibleItemIds excludes unregistered items', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const store = createStore({ open: true }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'cherry', value: 'Cherry' },
      ])

      try {
        // 'banana' is not registered
        store.setOrderedItems(['cherry', 'banana', 'apple'])

        const visibleIds = store.getVisibleItemIds()
        expect(visibleIds).toEqual(['cherry', 'apple'])
        expect(warn).toHaveBeenCalledWith(
          expect.stringContaining('Item "banana" is in orderedItems'),
        )
      } finally {
        warn.mockRestore()
      }
    })

    it('highlights first item when items register after menu opens', () => {
      // This simulates the real React timing:
      // 1. Menu opens
      // 2. Surface effect sets orderedItems
      // 3. Items mount and register AFTER

      const store = createStore({ open: false }, { filter: false })

      // Set orderedItems before items are registered (like Surface effect)
      store.setOrderedItems(['apple', 'banana'])

      // Open menu - no items registered yet
      store.setOpen(true)

      // At this point, highlightFirstItem() found no registered items
      expect(store.state.highlightedId).toBe(null)

      // Now items register (like React components mounting)
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
      ])

      // First item should now be highlighted
      expect(store.state.highlightedId).toBe('apple')
    })

    it('highlights first item on re-open when orderedItems reference is same', () => {
      // This simulates the bug: close and re-open with memoized orderedItems
      const store = createStore({ open: false }, { filter: false })

      const orderedItems = ['apple', 'banana']

      // First open
      store.setOrderedItems(orderedItems)
      store.setOpen(true)
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
      ])
      expect(store.state.highlightedId).toBe('apple')

      // Close preserves highlight until close-complete cleanup runs
      store.setOpen(false)
      expect(store.state.highlightedId).toBe('apple')

      store.clearHighlight()
      expect(store.state.highlightedId).toBe(null)

      // Re-open with SAME orderedItems reference
      store.setOrderedItems(orderedItems) // Same reference, setOrderedItems skips
      store.setOpen(true)

      // Items are still registered, so highlightFirstItem should work
      // But if it doesn't, maybeAutoHighlightOnRegister won't help either
      // because items are already registered

      // Actually this case works because items ARE registered
      // The bug was when items need to RE-register on re-mount
      expect(store.state.highlightedId).toBe('apple')
    })

    it('does not highlight if autoHighlightFirst is false', () => {
      const store = createStore(
        { open: false },
        { filter: false, autoHighlightFirst: false },
      )

      store.setOrderedItems(['apple', 'banana'])
      store.setOpen(true)

      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
      ])

      // Should not auto-highlight when autoHighlightFirst is false
      expect(store.state.highlightedId).toBe(null)
    })

    it('highlights first registered item in orderedItems order', () => {
      const store = createStore({ open: false }, { filter: false })

      store.setOrderedItems(['apple', 'banana'])
      store.setOpen(true)

      // Register banana first (but apple is first in orderedItems)
      store.registerItem('banana', { value: 'Banana' })
      // banana is highlighted because it's the first REGISTERED item in orderedItems
      expect(store.state.highlightedId).toBe('banana')

      // Register apple (first in orderedItems)
      store.registerItem('apple', { value: 'Apple' })
      // Highlight stays on banana - we don't re-highlight once something is highlighted
      // This prevents jarring jumps as items mount
      expect(store.state.highlightedId).toBe('banana')
    })
  })

  describe('virtualItems and orderedItems interaction', () => {
    it('virtualItems takes precedence over orderedItems', () => {
      const store = createStore(
        { open: true, virtualized: true },
        { filter: false },
      )
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
        { id: 'cherry', value: 'Cherry' },
      ])

      // Set both virtualItems and orderedItems
      store.setVirtualItems([
        { value: 'banana', disabled: false },
        { value: 'apple', disabled: false },
      ])
      store.setOrderedItems(['cherry', 'apple', 'banana'])

      // virtualItems should take precedence
      const visibleIds = store.getVisibleItemIds()
      expect(visibleIds).toEqual(['banana', 'apple'])
    })

    it('orderedItems is used when not virtualized', () => {
      const store = createStore(
        { open: true, virtualized: false },
        { filter: false },
      )
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
        { id: 'cherry', value: 'Cherry' },
      ])

      store.setOrderedItems(['cherry', 'apple', 'banana'])

      const visibleIds = store.getVisibleItemIds()
      expect(visibleIds).toEqual(['cherry', 'apple', 'banana'])
    })

    it('falls back to mounted items order when neither is set', () => {
      const store = createStore(
        { open: true, virtualized: false },
        { filter: false },
      )

      // Register in specific order
      store.registerItem('banana', { value: 'Banana' })
      store.registerItem('apple', { value: 'Apple' })
      store.registerItem('cherry', { value: 'Cherry' })

      // No orderedItems set
      const visibleIds = store.getVisibleItemIds()
      // Should be in registration order
      expect(visibleIds).toEqual(['banana', 'apple', 'cherry'])
    })

    it('orderedItems works with keyboard navigation', () => {
      const store = createStore({ open: true }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
        { id: 'cherry', value: 'Cherry' },
      ])

      // Set order: cherry, apple, banana
      store.setOrderedItems(['cherry', 'apple', 'banana'])

      // Navigate down from first
      expect(store.state.highlightedId).toBe('cherry')

      store.highlightNext()
      expect(store.state.highlightedId).toBe('apple')

      store.highlightNext()
      expect(store.state.highlightedId).toBe('banana')

      // Navigate up
      store.highlightPrev()
      expect(store.state.highlightedId).toBe('apple')
    })

    it('orderedItems respects loop setting', () => {
      const store = createStore({ open: true }, { loop: true, filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
        { id: 'cherry', value: 'Cherry' },
      ])

      store.setOrderedItems(['cherry', 'apple', 'banana'])

      // Navigate to last item
      store.setHighlightedId('banana')

      // Navigate down should loop to first
      store.highlightNext()
      expect(store.state.highlightedId).toBe('cherry')
    })

    it('orderedItems is used when virtualItems is empty', () => {
      const store = createStore(
        { open: true, virtualized: true },
        { filter: false },
      )

      // Register in specific order
      store.registerItem('banana', { value: 'Banana' })
      store.registerItem('apple', { value: 'Apple' })

      store.setVirtualItems([]) // Empty virtualItems
      store.setOrderedItems(['apple', 'banana'])

      // With empty virtualItems, falls through to orderedItems
      const visibleIds = store.getVisibleItemIds()
      expect(visibleIds).toEqual(['apple', 'banana'])
    })

    it('falls back to mounted items when no virtualItems or orderedItems', () => {
      const store = createStore(
        { open: true, virtualized: true },
        { filter: false },
      )

      // Register in specific order
      store.registerItem('banana', { value: 'Banana' })
      store.registerItem('apple', { value: 'Apple' })

      store.setVirtualItems([]) // Empty virtualItems
      // No orderedItems set

      // Falls back to mounted items order
      const visibleIds = store.getVisibleItemIds()
      expect(visibleIds).toEqual(['banana', 'apple'])
    })
  })

  describe('filter={false} behavior', () => {
    it('items are always visible when filter is false', () => {
      const store = createStore({ open: true }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
      ])

      // Set search that wouldn't match
      store.setSearch('xyz')

      // Items should still be in filteredItems with score 1
      expect(store.state.filteredItems.get('apple')).toBe(1)
      expect(store.state.filteredItems.get('banana')).toBe(1)
    })

    it('highlight moves to first registered item when orderedItems changes', () => {
      const store = createStore({ open: true }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
      ])

      store.setOrderedItems(['apple', 'banana'])
      expect(store.state.highlightedId).toBe('apple')

      // Unregister apple
      store.context.items.delete('apple')

      // Update orderedItems (simulating consumer updating after item removal)
      store.setOrderedItems(['banana'])

      // Highlight should move to banana since apple is no longer registered
      expect(store.state.highlightedId).toBe('banana')
    })

    it('isFilterDisabled returns true when filter={false}', () => {
      const store = createStore({}, { filter: false })
      expect(store.isFilterDisabled()).toBe(true)
    })

    it('isFilterDisabled returns false when filter is a function', () => {
      const store = createStore({})
      expect(store.isFilterDisabled()).toBe(false)
    })
  })

  describe('controlled prop separation', () => {
    it('effective open resolves openProp over internal open', () => {
      const store = createStore({ open: false })
      store.update({ openProp: true })

      expect(store.state.open).toBe(false)
      expect(store.state.openProp).toBe(true)
      expect(store.select('open')).toBe(true)
    })

    it('setOpen updates internal open but effective open stays controlled', () => {
      const store = createStore({ open: false, openProp: true })
      store.setOpen(false)

      expect(store.state.open).toBe(false)
      expect(store.select('open')).toBe(true)
    })

    it('effective search resolves searchProp over internal search', () => {
      const store = createStore({ search: 'banana' })
      store.update({ searchProp: 'apple' })

      expect(store.state.search).toBe('banana')
      expect(store.state.searchProp).toBe('apple')
      expect(store.select('search')).toBe('apple')
    })

    it('setSearch updates internal search but effective search stays controlled', () => {
      const store = createStore({ search: 'banana', searchProp: 'apple' })
      store.setSearch('cherry')

      expect(store.state.search).toBe('cherry')
      expect(store.select('search')).toBe('apple')
    })

    it('normalizedSearch syncs with effective search when searchProp changes', () => {
      const store = createStore({ search: '' })
      store.update({ searchProp: 'APPLE' })

      expect(store.state.normalizedSearch).toBe('APPLE')
    })
  })

  describe('initializeDefaultSearch', () => {
    it('initializes search and normalizedSearch once when uncontrolled', () => {
      const store = createStore({ search: '' })
      store.initializeDefaultSearch('x')

      expect(store.state.search).toBe('x')
      expect(store.state.normalizedSearch).toBe('x')
    })

    it('does nothing when searchProp is controlled', () => {
      const store = createStore({ search: '' })
      store.update({ searchProp: 'controlled' })
      store.initializeDefaultSearch('x')

      expect(store.state.search).toBe('')
      expect(store.state.searchProp).toBe('controlled')
    })

    it('runs only once per store', () => {
      const store = createStore({ search: '' })
      store.initializeDefaultSearch('first')
      store.initializeDefaultSearch('second')

      expect(store.state.search).toBe('first')
    })

    it('does not reset search after it has been changed', () => {
      const store = createStore({ search: '' })
      store.initializeDefaultSearch('x')
      store.setSearch('y')
      store.initializeDefaultSearch('x')

      expect(store.state.search).toBe('y')
    })
  })
})
