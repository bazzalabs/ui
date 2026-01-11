import { createSelector, ReactStore } from '@base-ui/utils/store'
import { useRefWithInit } from '@base-ui/utils/useRefWithInit'
import { commandScore } from '../utils/command-score.js'

// ============================================================================
// Types
// ============================================================================

export type FilterFn = (
  value: string,
  search: string,
  keywords?: string[],
) => number

export interface ItemRegistration {
  value: string
  keywords?: string[]
  groupId?: string
  disabled?: boolean
  /** Whether this item is a submenu trigger */
  isSubmenuTrigger?: boolean
  /** Single character keyboard shortcut to trigger this item */
  shortcut?: string
}

/**
 * Pre-registered item for virtualization.
 * This allows the store to know about all items even when they're not mounted.
 * The `value` field serves as both the unique identifier and the filtering value.
 */
export interface VirtualItem {
  /** Value used as unique identifier and for filtering/matching */
  value: string
  /** Additional keywords for filtering */
  keywords?: string[]
  /** Whether the item is disabled */
  disabled?: boolean
}

export type HighlightSource = 'keyboard' | 'pointer' | null

/**
 * Refs for DOM elements used for scroll behavior.
 * These are stored outside of reactive state to avoid unnecessary re-renders.
 */
export interface DOMRefs {
  /** Ref to the list/scroll container element */
  listRef: React.RefObject<HTMLElement | null>
  /** Map of item ID to ref for the item's DOM element */
  itemRefs: Map<string, React.RefObject<HTMLElement | null>>
}

export interface State {
  /** Whether the dropdown menu is open */
  open: boolean
  /** Current search query */
  search: string
  /** Currently highlighted item ID */
  highlightedId: string | null
  /** Source of the current highlight (keyboard or pointer) */
  highlightSource: HighlightSource
  /** Whether an Input is present in the Surface */
  hasInput: boolean
  /** Whether the input is currently active (rendered) when hideUntilActive mode is used */
  inputActive: boolean
  /** Pending search character typed before input was active */
  pendingSearch: string
  /** Filtered results: item ID to score */
  filteredItems: Map<string, number>
  /** Groups that have at least one visible item */
  visibleGroups: Set<string>
  /** Count of visible items */
  filteredCount: number
  /** Counter to trigger re-filtering when items change */
  filterTrigger: number
  /** Whether virtualization mode is enabled */
  virtualized: boolean
}

export interface Context {
  /** Filter function or false to disable filtering */
  filter: FilterFn | false
  /** Whether to loop navigation */
  loop: boolean
  /** Whether to auto-highlight first item */
  autoHighlightFirst: boolean
  /** Whether to clear search on close */
  clearSearchOnClose: boolean
  /** Whether hideUntilActive mode is enabled */
  hideUntilActive: boolean
  /** ID for the list element (for aria-activedescendant) */
  listId: string
  /** ID for the input element */
  inputId: string
  /** Map of item ID to registration data */
  readonly items: Map<string, ItemRegistration>
  /** Map of group ID to set of item IDs */
  readonly groups: Map<string, Set<string>>
  /** Map of item ID to onSelect callback */
  readonly itemSelects: Map<string, () => void>
  /** Map of submenu trigger ID to open callback */
  readonly submenuOpens: Map<string, () => void>
  /** Map of submenu trigger ID to close callback */
  readonly submenuCloses: Map<string, () => void>
  /** Map of shortcut key to item ID */
  readonly shortcuts: Map<string, string>
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when search state changes */
  onSearchChange: ((search: string) => void) | undefined
  /**
   * Pre-registered items for virtualization.
   * When provided, navigation uses this array order instead of DOM registration order.
   */
  virtualItems: VirtualItem[]
  /**
   * Callback when highlighted item changes and needs scroll sync.
   * Called only when the item is not in the DOM (virtualized out of view).
   * Useful for synchronizing with virtualizers (scrollToIndex).
   */
  onHighlightChange: ((id: string | null, index: number) => void) | undefined
  /**
   * DOM refs for scroll behavior.
   * Stored in context (not state) to avoid re-renders.
   */
  refs: DOMRefs
}

// ============================================================================
// Selectors
// ============================================================================

const selectors = {
  open: createSelector((state: State) => state.open),
  search: createSelector((state: State) => state.search),
  highlightedId: createSelector((state: State) => state.highlightedId),
  highlightSource: createSelector((state: State) => state.highlightSource),
  hasInput: createSelector((state: State) => state.hasInput),
  inputActive: createSelector((state: State) => state.inputActive),
  pendingSearch: createSelector((state: State) => state.pendingSearch),
  filteredCount: createSelector((state: State) => state.filteredCount),
  filteredItems: createSelector((state: State) => state.filteredItems),
  visibleGroups: createSelector((state: State) => state.visibleGroups),
  virtualized: createSelector((state: State) => state.virtualized),

  isHighlighted: createSelector(
    (state: State, itemId: string) => state.highlightedId === itemId,
  ),

  isGroupVisible: createSelector(
    (state: State, groupId: string) =>
      state.search.length === 0 || state.visibleGroups.has(groupId),
  ),

  getItemScore: createSelector((state: State, itemId: string) => {
    if (state.search.length === 0) {
      return 1 // All items visible when no search
    }
    return state.filteredItems.get(itemId) ?? 0
  }),

  hasSearchWithNoResults: createSelector(
    (state: State) => state.search.length > 0 && state.filteredCount === 0,
  ),
}

// ============================================================================
// Store
// ============================================================================

export class DropdownMenuStore extends ReactStore<
  State,
  Context,
  typeof selectors
> {
  constructor(initialState?: Partial<State>, context?: Partial<Context>) {
    const defaultContext: Context = {
      filter: commandScore,
      loop: true,
      autoHighlightFirst: true,
      clearSearchOnClose: true,
      hideUntilActive: false,
      listId: '',
      inputId: '',
      items: new Map(),
      groups: new Map(),
      itemSelects: new Map(),
      submenuOpens: new Map(),
      submenuCloses: new Map(),
      shortcuts: new Map(),
      onOpenChange: () => {},
      onSearchChange: undefined,
      virtualItems: [],
      onHighlightChange: undefined,
      refs: {
        listRef: { current: null },
        itemRefs: new Map(),
      },
    }

    super(
      { ...createInitialState(), ...initialState },
      { ...defaultContext, ...context },
      selectors,
    )

    // Handle open/close
    this.observe('open', (open) => {
      if (open) {
        // Auto-highlight first item when opening
        if (this.context.autoHighlightFirst) {
          this.highlightFirstItem()
        }
      } else {
        // Clear search and highlight on close
        if (this.context.clearSearchOnClose) {
          this.setSearch('')
        }
        this.update({
          highlightedId: null,
          highlightSource: null,
          inputActive: false,
          pendingSearch: '',
        })
      }
    })

    // Recompute filtered items when search changes (handles controlled search via useControlledProp)
    this.observe('search', (search, prevSearch) => {
      if (search !== prevSearch) {
        this.recomputeFilteredItems()
      }
    })
  }

  // ============================================================================
  // Actions
  // ============================================================================

  setOpen(open: boolean) {
    this.set('open', open)
    this.context.onOpenChange(open)
  }

  setSearch(search: string) {
    this.set('search', search)
    this.context.onSearchChange?.(search)
    // Note: recomputeFilteredItems is called by the 'search' observer
  }

  setHighlightedId(id: string | null, cause: HighlightSource = 'pointer') {
    const prevId = this.state.highlightedId
    if (prevId === id) return

    // Close any open submenus that are not the newly highlighted item
    // This ensures only one submenu is open at a time in this menu
    this.closeSiblingSubmenus(id)

    this.update({ highlightedId: id, highlightSource: cause })

    // Handle scroll behavior for keyboard navigation
    if (cause === 'keyboard' && id !== null) {
      this.scrollItemIntoView(id)
    }
  }

  /**
   * Scroll the highlighted item into view.
   * Uses native scrollIntoView if the element is in the DOM,
   * otherwise falls back to onHighlightChange callback for virtualizer sync.
   */
  private scrollItemIntoView(id: string) {
    const { refs, onHighlightChange } = this.context
    const listEl = refs.listRef.current
    const itemRef = refs.itemRefs.get(id)
    const itemEl = itemRef?.current

    // If the item element exists and is inside the list, use native scrollIntoView
    if (itemEl && listEl) {
      try {
        const isInList = listEl.contains(itemEl)
        if (isInList) {
          itemEl.scrollIntoView({ block: 'nearest' })
          return // Done - no need for virtualizer callback
        }
      } catch {
        // Ignore errors from scrollIntoView
      }
    }

    // Fallback: Call onHighlightChange for virtualizer to handle scrolling
    // This is used when the item is not in the DOM (virtualized out of view)
    if (onHighlightChange) {
      // Use virtualItems index for scrollToIndex, not filtered index
      const index = this.state.virtualized
        ? this.getVirtualItemIndex(id)
        : this.getVisibleItemIndex(id)
      onHighlightChange(id, index)
    }
  }

  setHasInput(hasInput: boolean) {
    this.set('hasInput', hasInput)
  }

  setInputActive(active: boolean) {
    this.set('inputActive', active)
  }

  setPendingSearch(search: string) {
    this.set('pendingSearch', search)
  }

  setHideUntilActive(enabled: boolean) {
    this.context.hideUntilActive = enabled
    // If enabling and there's already search content, activate immediately
    if (enabled && this.state.search.length > 0) {
      this.setInputActive(true)
    }
  }

  setVirtualized(virtualized: boolean) {
    this.set('virtualized', virtualized)
  }

  setVirtualItems(items: VirtualItem[]) {
    this.context.virtualItems = items
    // Pre-register all virtual items so filtering works for unmounted items
    this.preRegisterVirtualItems()
  }

  setOnHighlightChange(
    callback: ((id: string | null, index: number) => void) | undefined,
  ) {
    this.context.onHighlightChange = callback
  }

  // ============================================================================
  // DOM Refs Management
  // ============================================================================

  /**
   * Set the list element ref for scroll container detection.
   */
  setListRef(ref: React.RefObject<HTMLElement | null>) {
    this.context.refs.listRef = ref
  }

  /**
   * Register an item's DOM ref for scrollIntoView behavior.
   * Returns a cleanup function.
   */
  registerItemRef(
    id: string,
    ref: React.RefObject<HTMLElement | null>,
  ): () => void {
    this.context.refs.itemRefs.set(id, ref)
    return () => {
      this.context.refs.itemRefs.delete(id)
    }
  }

  /**
   * Pre-register virtual items so they appear in filteredItems.
   * This allows filtering to work for items that aren't mounted yet.
   */
  private preRegisterVirtualItems() {
    const virtualItems = this.context.virtualItems
    if (virtualItems.length === 0) return

    // Register each virtual item (using value as the unique identifier)
    for (const item of virtualItems) {
      if (!this.context.items.has(item.value)) {
        this.context.items.set(item.value, {
          value: item.value,
          keywords: item.keywords,
          disabled: item.disabled,
        })
      }
    }

    // Recompute filtered items to include virtual items
    this.recomputeFilteredItems()
  }

  // ============================================================================
  // Item Registration
  // ============================================================================

  registerItem(id: string, registration: ItemRegistration): () => void {
    this.context.items.set(id, registration)

    // Add to group if specified
    if (registration.groupId) {
      const groupItems = this.context.groups.get(registration.groupId)
      if (groupItems) {
        groupItems.add(id)
      }
    }

    // Register shortcut if specified
    if (registration.shortcut) {
      const key = registration.shortcut.toLowerCase()
      this.context.shortcuts.set(key, id)
    }

    // Trigger recompute
    this.recomputeFilteredItems()

    return () => {
      this.context.items.delete(id)
      this.context.itemSelects.delete(id)

      if (registration.groupId) {
        const groupItems = this.context.groups.get(registration.groupId)
        if (groupItems) {
          groupItems.delete(id)
        }
      }

      // Unregister shortcut
      if (registration.shortcut) {
        const key = registration.shortcut.toLowerCase()
        this.context.shortcuts.delete(key)
      }

      this.recomputeFilteredItems()
    }
  }

  registerGroup(id: string): () => void {
    this.context.groups.set(id, new Set())

    return () => {
      this.context.groups.delete(id)
    }
  }

  registerItemSelect(
    id: string,
    onSelect: (() => void) | undefined,
  ): () => void {
    if (onSelect) {
      this.context.itemSelects.set(id, onSelect)
    }
    return () => {
      this.context.itemSelects.delete(id)
    }
  }

  registerSubmenuOpen(
    id: string,
    onOpen: (() => void) | undefined,
  ): () => void {
    if (onOpen) {
      this.context.submenuOpens.set(id, onOpen)
    }
    return () => {
      this.context.submenuOpens.delete(id)
    }
  }

  registerSubmenuClose(
    id: string,
    onClose: (() => void) | undefined,
  ): () => void {
    if (onClose) {
      this.context.submenuCloses.set(id, onClose)
    }
    return () => {
      this.context.submenuCloses.delete(id)
    }
  }

  /**
   * Close all submenus except the one with the given ID.
   * Used when hovering over a new submenu trigger to close sibling submenus.
   */
  closeSiblingSubmenus(exceptId: string | null) {
    for (const [id, onClose] of this.context.submenuCloses) {
      if (id !== exceptId) {
        try {
          onClose()
        } catch {
          // Ignore errors from closing submenus
        }
      }
    }
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  highlightNext() {
    const visibleIds = this.getVisibleItemIds()
    if (visibleIds.length === 0) return

    const currentIndex = this.state.highlightedId
      ? visibleIds.indexOf(this.state.highlightedId)
      : -1
    let nextIndex = currentIndex + 1

    if (nextIndex >= visibleIds.length) {
      nextIndex = this.context.loop ? 0 : visibleIds.length - 1
    }

    const nextId = visibleIds[nextIndex]
    if (nextId) {
      this.setHighlightedId(nextId, 'keyboard')
    }
  }

  highlightPrev() {
    const visibleIds = this.getVisibleItemIds()
    if (visibleIds.length === 0) return

    const currentIndex = this.state.highlightedId
      ? visibleIds.indexOf(this.state.highlightedId)
      : visibleIds.length
    let prevIndex = currentIndex - 1

    if (prevIndex < 0) {
      prevIndex = this.context.loop ? visibleIds.length - 1 : 0
    }

    const prevId = visibleIds[prevIndex]
    if (prevId) {
      this.setHighlightedId(prevId, 'keyboard')
    }
  }

  selectHighlighted() {
    if (this.state.highlightedId) {
      const onSelect = this.context.itemSelects.get(this.state.highlightedId)
      onSelect?.()
    }
  }

  /**
   * Select an item by its keyboard shortcut.
   * Returns true if an item was found and selected, false otherwise.
   */
  selectByShortcut(key: string): boolean {
    const itemId = this.context.shortcuts.get(key.toLowerCase())
    if (!itemId) return false

    const registration = this.context.items.get(itemId)
    if (!registration || registration.disabled) return false

    // Check if item is visible (passes filter)
    const score = this.state.filteredItems.get(itemId) ?? 0
    const isVisible = this.state.search.length === 0 || score > 0
    if (!isVisible) return false

    const onSelect = this.context.itemSelects.get(itemId)
    onSelect?.()
    return true
  }

  openSubmenuForHighlighted() {
    if (this.state.highlightedId) {
      const onOpen = this.context.submenuOpens.get(this.state.highlightedId)
      onOpen?.()
    }
  }

  isHighlightedSubmenuTrigger(): boolean {
    if (!this.state.highlightedId) return false
    return (
      this.context.items.get(this.state.highlightedId)?.isSubmenuTrigger ??
      false
    )
  }

  clearSearch() {
    this.setSearch('')
  }

  highlightFirstItem() {
    const visibleIds = this.getVisibleItemIds()
    if (visibleIds.length > 0 && visibleIds[0]) {
      // Don't set a cause - auto-highlight shouldn't trigger scroll
      this.update({ highlightedId: visibleIds[0], highlightSource: null })
    } else {
      this.update({ highlightedId: null, highlightSource: null })
    }
  }

  // ============================================================================
  // Internal Helpers
  // ============================================================================

  getVisibleItemIds(): string[] {
    const result: string[] = []
    const search = this.state.search
    const filteredItems = this.state.filteredItems
    const virtualItems = this.context.virtualItems

    // When virtualized with items, use the virtualItems order
    // This ensures navigation order matches the data array order
    if (this.state.virtualized && virtualItems.length > 0) {
      for (const item of virtualItems) {
        const score = filteredItems.get(item.value) ?? 0
        const isVisible = search.length === 0 || score > 0
        if (isVisible && !item.disabled) {
          result.push(item.value)
        }
      }
      return result
    }

    // Non-virtualized: use mounted items order
    this.context.items.forEach((registration, id) => {
      const score = filteredItems.get(id) ?? 0
      const isVisible = search.length === 0 || score > 0
      if (isVisible && !registration.disabled) {
        result.push(id)
      }
    })

    return result
  }

  /**
   * Get the index of an item in the visible items list.
   * Returns -1 if the item is not found or not visible.
   */
  getVisibleItemIndex(id: string): number {
    return this.getVisibleItemIds().indexOf(id)
  }

  /**
   * Get the index of an item in the virtualItems array.
   * This is used for virtualizer scrollToIndex which needs the raw array index,
   * not the filtered/visible index.
   * Returns -1 if not found or not in virtualized mode.
   */
  getVirtualItemIndex(value: string): number {
    if (!this.state.virtualized) return -1
    return this.context.virtualItems.findIndex((item) => item.value === value)
  }

  private recomputeFilteredItems() {
    const { filter } = this.context
    const search = this.state.search
    const items = this.context.items
    const groups = this.context.groups

    const filteredItems = new Map<string, number>()
    const visibleGroups = new Set<string>()
    let filteredCount = 0

    // If no search or filtering disabled, all items are visible
    if (!search || filter === false) {
      items.forEach((_, id) => {
        filteredItems.set(id, 1)
        filteredCount++
      })
      groups.forEach((_, groupId) => {
        visibleGroups.add(groupId)
      })
    } else {
      // Apply filter function
      const filterFn = filter || commandScore
      items.forEach((registration, id) => {
        const score = filterFn(
          registration.value,
          search,
          registration.keywords,
        )
        filteredItems.set(id, score)
        if (score > 0) {
          filteredCount++
          if (registration.groupId) {
            visibleGroups.add(registration.groupId)
          }
        }
      })
    }

    // Auto-highlight first item when open and autoHighlightFirst is enabled
    // BUT only if there's no current highlight (don't reset during navigation)
    let highlightedId: string | null = this.state.highlightedId

    // Check if current highlight is still valid (visible and not disabled)
    let currentHighlightValid = false
    if (highlightedId) {
      const score = filteredItems.get(highlightedId) ?? 0
      const isVisible = search.length === 0 || score > 0
      const registration = this.context.items.get(highlightedId)
      const virtualItem = this.context.virtualItems.find(
        (v) => v.value === highlightedId,
      )
      const isDisabled =
        registration?.disabled ?? virtualItem?.disabled ?? false
      currentHighlightValid = isVisible && !isDisabled
    }

    // Only auto-highlight first item if current highlight is invalid
    if (
      this.context.autoHighlightFirst &&
      this.state.open &&
      !currentHighlightValid
    ) {
      // Find first visible item using the newly computed filteredItems
      highlightedId = null

      // When virtualized, use virtualItems order for first item
      if (this.state.virtualized && this.context.virtualItems.length > 0) {
        for (const item of this.context.virtualItems) {
          const score = filteredItems.get(item.value) ?? 0
          const isVisible = search.length === 0 || score > 0
          if (isVisible && !item.disabled) {
            highlightedId = item.value
            break
          }
        }
      } else {
        // Non-virtualized: use mounted items
        for (const [id, registration] of this.context.items) {
          const score = filteredItems.get(id) ?? 0
          const isVisible = search.length === 0 || score > 0
          if (isVisible && !registration.disabled) {
            highlightedId = id
            break
          }
        }
      }
    }

    this.update({
      filteredItems,
      visibleGroups,
      filteredCount,
      filterTrigger: this.state.filterTrigger + 1,
      highlightedId,
      // Auto-highlight shouldn't trigger scroll
      highlightSource: null,
    })
  }

  // ============================================================================
  // Static Factory
  // ============================================================================

  static useStore(
    externalStore: DropdownMenuStore | undefined,
    initialState?: Partial<State>,
    context?: Partial<Context>,
  ): DropdownMenuStore {
    const store = useRefWithInit(() => {
      return externalStore ?? new DropdownMenuStore(initialState, context)
    }).current

    return store
  }
}

// ============================================================================
// Initial State Factory
// ============================================================================

function createInitialState(): State {
  return {
    open: false,
    search: '',
    highlightedId: null,
    highlightSource: null,
    hasInput: false,
    inputActive: false,
    pendingSearch: '',
    filteredItems: new Map(),
    visibleGroups: new Set(),
    filteredCount: 0,
    filterTrigger: 0,
    virtualized: false,
  }
}
