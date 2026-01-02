import * as React from 'react'
import type {
  ActivationCause,
  Direction,
  OpenModality,
  SearchResult,
} from '../types.js'

// ============================================================================
// Menu State
// ============================================================================

/**
 * Root menu state managed by the MenuContext.
 */
export interface MenuState {
  /** Whether the menu is open */
  open: boolean
  /** Whether the menu is modal (traps focus) */
  modal: boolean
  /** Direction for RTL/LTR support */
  dir: Direction
  /** Currently highlighted item ID */
  highlightedId: string | null
  /** What caused the current highlight */
  activationCause: ActivationCause | null
  /** Current search query */
  searchQuery: string
  /** Whether search is active (keyboard input started) */
  searchActive: boolean
  /** Current search results (for deep search) */
  searchResults: SearchResult[]
  /** Whether we're in search mode (showing flat results) */
  searchMode: boolean
  /** Set of open submenu IDs */
  openSubmenus: Set<string>
  /** How the current submenu was opened */
  openModality: OpenModality | null
}

/**
 * Actions to update the menu state.
 */
export interface MenuActions {
  /** Set open state */
  setOpen: (open: boolean) => void
  /** Toggle open state */
  toggle: () => void
  /** Set highlighted item */
  setHighlightedId: (id: string | null, cause?: ActivationCause) => void
  /** Move highlight to next/previous item */
  moveHighlight: (direction: 'next' | 'prev' | 'first' | 'last') => void
  /** Set search query */
  setSearchQuery: (query: string) => void
  /** Clear search and exit search mode */
  clearSearch: () => void
  /** Set search results */
  setSearchResults: (results: SearchResult[]) => void
  /** Open a submenu */
  openSubmenu: (id: string, modality: OpenModality) => void
  /** Close a submenu */
  closeSubmenu: (id: string) => void
  /** Close all submenus */
  closeAllSubmenus: () => void
  /** Check if a submenu is open */
  isSubmenuOpen: (id: string) => boolean
}

/**
 * Combined menu context value.
 */
export interface MenuContextValue {
  state: MenuState
  actions: MenuActions
  /** Reference to the trigger element */
  triggerRef: React.RefObject<HTMLElement | null>
  /** Reference to the content element */
  contentRef: React.RefObject<HTMLElement | null>
  /** Unique ID for the menu */
  menuId: string
  /** Scope ID for InteractionGuard (shared across root and all submenus) */
  scopeId: string
  /** Callback when an item is selected */
  onSelect?: (id: string) => void
  /** Whether submenus open on hover */
  openSubmenusOnHover: boolean
}

// ============================================================================
// Context
// ============================================================================

const MenuContext = React.createContext<MenuContextValue | null>(null)

MenuContext.displayName = 'MenuContext'

// ============================================================================
// Provider
// ============================================================================

export interface MenuProviderProps {
  /** Controlled open state */
  open?: boolean
  /** Default open state for uncontrolled usage */
  defaultOpen?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Whether the menu is modal */
  modal?: boolean
  /** Direction for RTL/LTR support */
  dir?: Direction
  /** Callback when an item is selected */
  onSelect?: (id: string) => void
  /** Unique ID for the menu (auto-generated if not provided) */
  menuId?: string
  /** Whether submenus open on hover (default: true) */
  openSubmenusOnHover?: boolean
  /** Children */
  children: React.ReactNode
}

/**
 * Creates initial menu state.
 */
function createInitialState(
  open: boolean,
  modal: boolean,
  dir: Direction,
): MenuState {
  return {
    open,
    modal,
    dir,
    highlightedId: null,
    activationCause: null,
    searchQuery: '',
    searchActive: false,
    searchResults: [],
    searchMode: false,
    openSubmenus: new Set(),
    openModality: null,
  }
}

/**
 * Generate a unique menu ID.
 */
let menuIdCounter = 0
function generateMenuId(): string {
  return `menu-${++menuIdCounter}`
}

/**
 * Provider component for root menu state.
 */
export function MenuProvider({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  modal = true,
  dir = 'ltr',
  onSelect,
  menuId: providedMenuId,
  openSubmenusOnHover = true,
  children,
}: MenuProviderProps) {
  // Unique ID
  const menuId = React.useMemo(
    () => providedMenuId ?? generateMenuId(),
    [providedMenuId],
  )

  // Scope ID for InteractionGuard (stable across the entire menu tree)
  const scopeId = React.useId()

  // Refs
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLElement | null>(null)

  // Open state (controlled or uncontrolled)
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const open = isControlled ? controlledOpen : internalOpen

  // Rest of the state
  const [state, setState] = React.useState<MenuState>(() =>
    createInitialState(open, modal, dir),
  )

  // Sync open state
  React.useEffect(() => {
    setState((prev) => ({ ...prev, open }))
  }, [open])

  // Sync modal and dir
  React.useEffect(() => {
    setState((prev) => ({ ...prev, modal, dir }))
  }, [modal, dir])

  // Store for getting navigable IDs (will be set by Content component)
  const getNavigableIdsRef = React.useRef<(() => string[]) | null>(null)

  // Actions
  const actions = React.useMemo<MenuActions>(() => {
    const setOpen = (newOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(newOpen)
      }
      onOpenChange?.(newOpen)

      // Reset state when closing
      if (!newOpen) {
        setState((prev) => ({
          ...prev,
          open: newOpen,
          highlightedId: null,
          activationCause: null,
          searchQuery: '',
          searchActive: false,
          searchResults: [],
          searchMode: false,
          openSubmenus: new Set(),
          openModality: null,
        }))
      }
    }

    return {
      setOpen,

      toggle: () => {
        setOpen(!open)
      },

      setHighlightedId: (
        id: string | null,
        cause: ActivationCause = 'keyboard',
      ) => {
        setState((prev) => ({
          ...prev,
          highlightedId: id,
          activationCause: cause,
        }))
      },

      moveHighlight: (direction: 'next' | 'prev' | 'first' | 'last') => {
        const getNavigableIds = getNavigableIdsRef.current
        if (!getNavigableIds) return

        const ids = getNavigableIds()
        if (ids.length === 0) return

        setState((prev) => {
          const currentIndex = prev.highlightedId
            ? ids.indexOf(prev.highlightedId)
            : -1

          let newIndex: number

          switch (direction) {
            case 'first':
              newIndex = 0
              break
            case 'last':
              newIndex = ids.length - 1
              break
            case 'next':
              newIndex =
                currentIndex === -1 ? 0 : (currentIndex + 1) % ids.length
              break
            case 'prev':
              newIndex =
                currentIndex === -1
                  ? ids.length - 1
                  : (currentIndex - 1 + ids.length) % ids.length
              break
          }

          return {
            ...prev,
            highlightedId: ids[newIndex] ?? null,
            activationCause: 'keyboard',
          }
        })
      },

      setSearchQuery: (query: string) => {
        setState((prev) => ({
          ...prev,
          searchQuery: query,
          searchActive: query.length > 0,
          searchMode: query.length > 0,
        }))
      },

      clearSearch: () => {
        setState((prev) => ({
          ...prev,
          searchQuery: '',
          searchActive: false,
          searchResults: [],
          searchMode: false,
        }))
      },

      setSearchResults: (results: SearchResult[]) => {
        setState((prev) => ({
          ...prev,
          searchResults: results,
        }))
      },

      openSubmenu: (id: string, modality: OpenModality) => {
        setState((prev) => {
          const newSet = new Set(prev.openSubmenus)
          newSet.add(id)
          return {
            ...prev,
            openSubmenus: newSet,
            openModality: modality,
          }
        })
      },

      closeSubmenu: (id: string) => {
        setState((prev) => {
          const newSet = new Set(prev.openSubmenus)
          newSet.delete(id)
          return {
            ...prev,
            openSubmenus: newSet,
            openModality: newSet.size === 0 ? null : prev.openModality,
          }
        })
      },

      closeAllSubmenus: () => {
        setState((prev) => ({
          ...prev,
          openSubmenus: new Set(),
          openModality: null,
        }))
      },

      isSubmenuOpen: (id: string) => {
        return state.openSubmenus.has(id)
      },
    }
  }, [isControlled, onOpenChange, open, state.openSubmenus])

  // Context value - ensure state.open is always in sync with the derived open value
  const value = React.useMemo<MenuContextValue>(
    () => ({
      state: { ...state, open }, // Override with current open value
      actions,
      triggerRef,
      contentRef,
      menuId,
      scopeId,
      onSelect,
      openSubmenusOnHover,
    }),
    [state, open, actions, menuId, scopeId, onSelect, openSubmenusOnHover],
  )

  // Expose getNavigableIdsRef via context for Content to set
  const extendedValue = React.useMemo(
    () => ({
      ...value,
      __internal: {
        setGetNavigableIds: (fn: () => string[]) => {
          getNavigableIdsRef.current = fn
        },
      },
    }),
    [value],
  )

  return (
    <MenuContext.Provider value={extendedValue as MenuContextValue}>
      {children}
    </MenuContext.Provider>
  )
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the menu context.
 * Throws if used outside of MenuProvider.
 */
export function useMenu(): MenuContextValue {
  const context = React.useContext(MenuContext)
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider')
  }
  return context
}

/**
 * Hook to access the menu context, or null if not in a provider.
 */
export function useMenuOptional(): MenuContextValue | null {
  return React.useContext(MenuContext)
}

/**
 * Internal hook to access the __internal property.
 * Used by Content to set the getNavigableIds function.
 */
export function useMenuInternal(): {
  setGetNavigableIds: (fn: () => string[]) => void
} {
  const context = React.useContext(MenuContext) as MenuContextValue & {
    __internal?: {
      setGetNavigableIds: (fn: () => string[]) => void
    }
  }

  if (!context?.__internal) {
    throw new Error('useMenuInternal must be used within a MenuProvider')
  }

  return context.__internal
}
