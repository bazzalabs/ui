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

    it('clears highlight when closing', () => {
      const store = createStore({ open: true })
      registerItems(store, [{ id: 'item-1', value: 'Item 1' }])
      store.setHighlightedId('item-1')

      store.setOpen(false)

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
})
