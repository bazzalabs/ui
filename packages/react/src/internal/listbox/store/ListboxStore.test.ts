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
  describe('item registration', () => {
    it('unregisters items on cleanup', () => {
      const store = createStore()

      const cleanup1 = store.registerItem('item-1', { value: 'Item 1' })
      const cleanup2 = store.registerItem('item-2', { value: 'Item 2' })

      expect(store.getVisibleItemIds()).toEqual(['item-1', 'item-2'])

      cleanup1()
      expect(store.getVisibleItemIds()).toEqual(['item-2'])

      cleanup2()
      expect(store.getVisibleItemIds()).toEqual([])
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

    it('registers a group element ref when provided', () => {
      const store = createStore()
      const groupEl = document.createElement('div')

      const cleanup = store.registerGroup('group-1', { current: groupEl })

      expect(store.context.refs.groupRefs.get('group-1')?.current).toBe(groupEl)

      cleanup()

      expect(store.context.refs.groupRefs.has('group-1')).toBe(false)
      expect(store.context.groups.has('group-1')).toBe(false)
    })

    it('registers a group without an element ref', () => {
      const store = createStore()

      const cleanup = store.registerGroup('group-1')

      expect(store.context.groups.has('group-1')).toBe(true)
      expect(store.context.refs.groupRefs.has('group-1')).toBe(false)

      cleanup()

      expect(store.context.groups.has('group-1')).toBe(false)
    })

    it('matches shortcuts case-insensitively', () => {
      const store = createStore()
      const onSelectA = vi.fn()
      const onSelectB = vi.fn()

      store.registerItem('item-1', { value: 'Item 1', shortcut: 'a' })
      store.registerItem('item-2', { value: 'Item 2', shortcut: 'B' })
      store.registerItemSelect('item-1', onSelectA)
      store.registerItemSelect('item-2', onSelectB)

      expect(store.selectByShortcut('A')).toBe(true)
      expect(store.selectByShortcut('b')).toBe(true)
      expect(onSelectA).toHaveBeenCalledOnce()
      expect(onSelectB).toHaveBeenCalledOnce()
    })
  })

  describe('group top reveal on keyboard highlight', () => {
    /**
     * Builds a list DOM (list > group > item1, item2; list > other) and
     * registers everything with a fresh store. jsdom has no layout, so
     * scrollIntoView is mocked per element, getBoundingClientRect is
     * stubbed per test, and scrollTop is backed by a defined property.
     */
    function setupGroupedListbox() {
      const store = createStore()

      const list = document.createElement('div')
      const group = document.createElement('div')
      const item1 = document.createElement('div')
      const item2 = document.createElement('div')
      const other = document.createElement('div')

      group.appendChild(item1)
      group.appendChild(item2)
      list.appendChild(group)
      list.appendChild(other)

      for (const el of [item1, item2, other]) {
        el.scrollIntoView = vi.fn()
      }

      store.setListRef({ current: list })
      store.registerGroup('group-1', { current: group })
      store.registerItem('item-1', { value: 'Apple', groupId: 'group-1' })
      store.registerItem('item-2', { value: 'Banana', groupId: 'group-1' })
      store.registerItem('other', { value: 'Other' })
      store.registerItemRef('item-1', { current: item1 })
      store.registerItemRef('item-2', { current: item2 })
      store.registerItemRef('other', { current: other })

      return { store, list, group, item1, item2, other }
    }

    /** Backs scrollTop with a plain variable so reads/writes round-trip in jsdom. */
    function defineScrollTop(el: HTMLElement, initial: number) {
      let value = initial
      Object.defineProperty(el, 'scrollTop', {
        configurable: true,
        get: () => value,
        set: (next: number) => {
          value = next
        },
      })
    }

    function stubTop(el: HTMLElement, top: number) {
      el.getBoundingClientRect = () => ({ top }) as DOMRect
    }

    it('scrolls up to reveal a clipped group top when highlighting the first item in the group', () => {
      const { store, list, group, item1 } = setupGroupedListbox()
      defineScrollTop(list, 200)
      stubTop(list, 100)
      stubTop(group, 60)

      store.clearHighlight()
      store.setHighlightedId('item-1', 'keyboard')

      expect(item1.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
      expect(list.scrollTop).toBe(160)
    })

    it('does not adjust scroll when the group top is already visible', () => {
      const { store, list, group } = setupGroupedListbox()
      defineScrollTop(list, 200)
      stubTop(list, 100)
      stubTop(group, 150)

      store.clearHighlight()
      store.setHighlightedId('item-1', 'keyboard')

      expect(list.scrollTop).toBe(200)
    })

    it('does not adjust scroll for a non-first item in the group', () => {
      const { store, list, group, item2 } = setupGroupedListbox()
      defineScrollTop(list, 200)
      stubTop(list, 100)
      stubTop(group, 60)

      store.clearHighlight()
      store.setHighlightedId('item-2', 'keyboard')

      expect(item2.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
      expect(list.scrollTop).toBe(200)
    })

    it('does not adjust scroll for an ungrouped item', () => {
      const { store, list, group, other } = setupGroupedListbox()
      defineScrollTop(list, 200)
      stubTop(list, 100)
      stubTop(group, 60)

      store.clearHighlight()
      store.setHighlightedId('other', 'keyboard')

      expect(other.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
      expect(list.scrollTop).toBe(200)
    })

    it('treats the first visible (filtered) item of the group as the anchor', () => {
      const { store, list, group, item2 } = setupGroupedListbox()
      defineScrollTop(list, 200)
      stubTop(list, 100)
      stubTop(group, 60)

      // 'Banana' matches; 'Apple' is filtered out, so item-2 becomes the
      // group's first visible item. Note: setSearch resets scroll to top
      // via scrollTop = 0 (list has no scrollTo in this setup).
      store.setSearch('ban')
      expect(store.getVisibleItemIds()).toEqual(['item-2'])

      list.scrollTop = 200
      store.clearHighlight()
      store.setHighlightedId('item-2', 'keyboard')

      expect(item2.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
      expect(list.scrollTop).toBe(160)
    })

    it('adjusts the explicit scroll container when one is registered', () => {
      const { store, list, group } = setupGroupedListbox()
      const viewport = document.createElement('div')
      viewport.appendChild(list)
      defineScrollTop(viewport, 300)
      defineScrollTop(list, 0)
      stubTop(viewport, 50)
      stubTop(group, 20)

      store.setListScrollContainerRef({ current: viewport })

      store.clearHighlight()
      store.setHighlightedId('item-1', 'keyboard')

      expect(viewport.scrollTop).toBe(270)
      expect(list.scrollTop).toBe(0)
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
    })

    describe('highlightPrev', () => {
      it('highlights last item when no item is highlighted', () => {
        store.clearHighlight()

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
      it('skips disabled first item', () => {
        store.context.items.clear()
        registerItems(store, [
          { id: 'item-1', value: 'Item 1', disabled: true },
          { id: 'item-2', value: 'Item 2' },
          { id: 'item-3', value: 'Item 3' },
        ])
        store.clearHighlight()

        store.highlightFirstItem()

        expect(store.state.highlightedId).toBe('item-2')
      })

      it('sets null when all items are disabled', () => {
        store.context.items.clear()
        registerItems(store, [
          { id: 'item-1', value: 'Item 1', disabled: true },
          { id: 'item-2', value: 'Item 2', disabled: true },
        ])
        store.setHighlightedId('item-1')

        store.highlightFirstItem()

        expect(store.state.highlightedId).toBe(null)
      })
    })

    describe('getVisibleItemIds', () => {
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
  })

  describe('open/close behavior', () => {
    it('does not auto-highlight when opening (autoHighlightFirst=false)', () => {
      const store = createStore({}, { autoHighlightFirst: false })
      registerItems(store, [
        { id: 'item-1', value: 'Item 1' },
        { id: 'item-2', value: 'Item 2' },
      ])

      store.setOpen(true)

      expect(store.state.highlightedId).toBe(null)
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
    it('filters virtual items that have not mounted', () => {
      const store = createStore({ open: true, virtualized: true })

      store.setVirtualItems([
        { value: 'apple' },
        { value: 'banana' },
        { value: 'cherry' },
      ])
      store.setSearch('ban')

      expect(store.getVisibleItemIds()).toEqual(['banana'])
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

      expect(store.state.highlightedId).toBe('backlog')
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

    it('preserves highlight on refresh updates while the item remains', () => {
      const store = createStore({ open: true }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
        { id: 'cherry', value: 'Cherry' },
      ])

      store.setOrderedItems(['apple', 'banana'])
      store.setHighlightedId('banana', 'keyboard')

      // A new row arrives ahead of the highlighted one; the highlight follows identity.
      store.setOrderedItems(['cherry', 'apple', 'banana'], {
        reason: 'refresh',
      })

      expect(store.state.highlightedId).toBe('banana')
    })

    it('falls back to first item on refresh updates when the highlighted item is gone', () => {
      const store = createStore({ open: true }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
        { id: 'cherry', value: 'Cherry' },
      ])

      store.setOrderedItems(['apple', 'banana'])
      store.setHighlightedId('banana', 'keyboard')

      store.setOrderedItems(['cherry', 'apple'], { reason: 'refresh' })

      expect(store.state.highlightedId).toBe('cherry')
    })

    it('falls back to first item on refresh updates when the highlighted item becomes disabled', () => {
      const store = createStore({ open: true }, { filter: false })
      registerItems(store, [
        { id: 'apple', value: 'Apple' },
        { id: 'banana', value: 'Banana' },
      ])

      store.setOrderedItems(['apple', 'banana'])
      store.setHighlightedId('banana', 'keyboard')
      registerItems(store, [{ id: 'banana', value: 'Banana', disabled: true }])

      store.setOrderedItems(['apple', 'banana', 'cherry'], {
        reason: 'refresh',
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
  })

  describe('controlled prop separation', () => {
    describe('while open is controlled', () => {
      // The app opens the menu through the prop alone, so the internal `open`
      // field stays false and only the effective state is open.
      function openThroughProp(
        initialState?: Partial<ListboxState>,
        context?: Partial<ListboxContext>,
      ) {
        const store = createStore({ ...initialState, open: false }, context)
        store.update({ openProp: true })
        return store
      }

      it('highlights the first enabled item when items register after opening', () => {
        const store = openThroughProp()
        registerItems(store, [
          { id: 'disabled', value: 'Disabled', disabled: true },
          { id: 'first', value: 'First' },
        ])
        expect(store.state.highlightedId).toBe('first')
      })

      it('highlights the first enabled virtual item when virtual items arrive', () => {
        const store = openThroughProp({ virtualized: true }, { filter: false })
        store.setVirtualItems([
          { value: 'disabled', disabled: true },
          { value: 'first' },
        ])
        expect(store.state.highlightedId).toBe('first')
      })

      it('highlights the first ordered item when ordered items are set after opening', () => {
        const store = openThroughProp({}, { filter: false })
        registerItems(store, [
          { id: 'first', value: 'First' },
          { id: 'second', value: 'Second' },
        ])
        store.setOrderedItems(['second', 'first'])
        expect(store.state.highlightedId).toBe('second')
      })

      it('highlights the first ordered item when it registers after opening', () => {
        const store = createStore({ open: false }, { filter: false })
        store.setOrderedItems(['first', 'second'])
        store.update({ openProp: true })
        expect(store.state.highlightedId).toBeNull()
        registerItems(store, [
          { id: 'first', value: 'First' },
          { id: 'second', value: 'Second' },
        ])
        expect(store.state.highlightedId).toBe('first')
      })

      it('applies a value auto-highlight', () => {
        const store = openThroughProp({}, { autoHighlightFirst: 'second' })
        registerItems(store, [
          { id: 'first', value: 'First' },
          { id: 'second', value: 'Second' },
        ])
        store.applyAutoHighlight()
        expect(store.state.highlightedId).toBe('second')
      })

      it('highlights the first match after a search', () => {
        const store = openThroughProp()
        registerItems(store, [
          { id: 'apple', value: 'Apple' },
          { id: 'banana', value: 'Banana' },
        ])
        store.setSearch('Ban')
        expect(store.state.highlightedId).toBe('banana')
      })

      it('clears the search when the prop closes it', () => {
        const store = openThroughProp({ search: 'query' })
        store.update({ openProp: false })
        expect(store.state.search).toBe('')
      })
    })

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

  describe('positional row registry', () => {
    function createRowElements(count: number): HTMLElement[] {
      const container = document.createElement('div')
      document.body.appendChild(container)
      const elements: HTMLElement[] = []
      for (let i = 0; i < count; i++) {
        const el = document.createElement('div')
        container.appendChild(el)
        elements.push(el)
      }
      return elements
    }

    it('sorts registered rows by DOM order', () => {
      const store = createStore()
      const elements = createRowElements(2)

      store.registerRow('b', elements[1]!, { kind: 'item' })
      store.registerRow('a', elements[0]!, { kind: 'item' })

      expect(store.state.orderedRows.map((row) => row.id)).toEqual(['a', 'b'])
    })

    it('removes rows during cleanup', () => {
      const store = createStore()
      const elements = createRowElements(2)

      const unregisterA = store.registerRow('a', elements[0]!, { kind: 'item' })
      store.registerRow('b', elements[1]!, { kind: 'item' })

      unregisterA()

      expect(store.state.orderedRows.map((row) => row.id)).toEqual(['b'])
      expect(store.context.rowElements.has('a')).toBe(false)
    })

    it('re-registers the same id with a new element without duplicates', () => {
      const store = createStore()
      const elements = createRowElements(2)

      const unregisterOld = store.registerRow('a', elements[0]!, {
        kind: 'item',
      })
      store.registerRow('a', elements[1]!, { kind: 'item' })

      expect(store.state.orderedRows.map((row) => row.id)).toEqual(['a'])
      expect(store.context.rowElements.get('a')).toBe(elements[1])

      unregisterOld()

      expect(store.state.orderedRows.map((row) => row.id)).toEqual(['a'])
      expect(store.context.rowElements.get('a')).toBe(elements[1])
    })

    it('returns false for positional selectors when virtualized', () => {
      const store = createStore()
      const elements = createRowElements(3)

      store.registerRow('x', elements[0]!, { kind: 'item' })
      store.registerRow('g', elements[1]!, { kind: 'group' })
      store.registerRow('i', elements[2]!, { kind: 'item', groupId: 'g' })

      store.update({ virtualized: true })

      expect(store.select('isFirstRow', 'x')).toBe(false)
      expect(store.select('isLastRow', 'g')).toBe(false)
      expect(store.select('isFirstGroup', 'g')).toBe(false)
      expect(store.select('isLastGroup', 'g')).toBe(false)
      expect(store.select('isFirstInGroup', 'i')).toBe(false)
      expect(store.select('isLastInGroup', 'i')).toBe(false)
    })
  })
})
