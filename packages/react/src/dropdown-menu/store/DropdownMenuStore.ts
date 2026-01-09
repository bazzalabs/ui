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
}

export interface State {
  /** Whether the dropdown menu is open */
  open: boolean
  /** Current search query */
  search: string
  /** Currently highlighted item ID */
  highlightedId: string | null
  /** Whether an Input is present in the Surface */
  hasInput: boolean
  /** Filtered results: item ID to score */
  filteredItems: Map<string, number>
  /** Groups that have at least one visible item */
  visibleGroups: Set<string>
  /** Count of visible items */
  filteredCount: number
  /** Counter to trigger re-filtering when items change */
  filterTrigger: number
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
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when search state changes */
  onSearchChange: ((search: string) => void) | undefined
}

// ============================================================================
// Selectors
// ============================================================================

const selectors = {
  open: createSelector((state: State) => state.open),
  search: createSelector((state: State) => state.search),
  highlightedId: createSelector((state: State) => state.highlightedId),
  hasInput: createSelector((state: State) => state.hasInput),
  filteredCount: createSelector((state: State) => state.filteredCount),
  filteredItems: createSelector((state: State) => state.filteredItems),
  visibleGroups: createSelector((state: State) => state.visibleGroups),

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
    super(
      { ...createInitialState(), ...initialState },
      {
        filter: commandScore,
        loop: true,
        autoHighlightFirst: true,
        clearSearchOnClose: true,
        listId: '',
        inputId: '',
        items: new Map(),
        groups: new Map(),
        itemSelects: new Map(),
        submenuOpens: new Map(),
        submenuCloses: new Map(),
        onOpenChange: () => {},
        onSearchChange: undefined,
        ...context,
      },
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
        this.set('highlightedId', null)
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

  setHighlightedId(id: string | null) {
    const prevId = this.state.highlightedId
    if (prevId === id) return

    // Close any open submenus that are not the newly highlighted item
    // This ensures only one submenu is open at a time in this menu
    this.closeSiblingSubmenus(id)

    this.set('highlightedId', id)
  }

  setHasInput(hasInput: boolean) {
    this.set('hasInput', hasInput)
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
      this.set('highlightedId', nextId)
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
      this.set('highlightedId', prevId)
    }
  }

  selectHighlighted() {
    if (this.state.highlightedId) {
      const onSelect = this.context.itemSelects.get(this.state.highlightedId)
      onSelect?.()
    }
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
      this.set('highlightedId', visibleIds[0])
    } else {
      this.set('highlightedId', null)
    }
  }

  // ============================================================================
  // Internal Helpers
  // ============================================================================

  getVisibleItemIds(): string[] {
    const result: string[] = []
    const search = this.state.search
    const filteredItems = this.state.filteredItems

    this.context.items.forEach((registration, id) => {
      const score = filteredItems.get(id) ?? 0
      const isVisible = search.length === 0 || score > 0
      if (isVisible && !registration.disabled) {
        result.push(id)
      }
    })

    return result
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
    let highlightedId: string | null = this.state.highlightedId
    if (this.context.autoHighlightFirst && this.state.open) {
      // Find first visible item using the newly computed filteredItems
      highlightedId = null
      for (const [id, registration] of this.context.items) {
        const score = filteredItems.get(id) ?? 0
        const isVisible = search.length === 0 || score > 0
        if (isVisible && !registration.disabled) {
          highlightedId = id
          break
        }
      }
    }

    this.update({
      filteredItems,
      visibleGroups,
      filteredCount,
      filterTrigger: this.state.filterTrigger + 1,
      highlightedId,
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
    hasInput: false,
    filteredItems: new Map(),
    visibleGroups: new Set(),
    filteredCount: 0,
    filterTrigger: 0,
  }
}
