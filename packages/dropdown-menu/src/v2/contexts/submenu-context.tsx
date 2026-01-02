import * as React from 'react'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import type { OpenModality, Side, Align } from '../types.js'

// ============================================================================
// Submenu State
// ============================================================================

/**
 * State for a submenu.
 */
export interface SubmenuState {
  /** Unique ID of this submenu */
  submenuId: string
  /** Whether this submenu is open */
  open: boolean
  /** How this submenu was opened */
  openModality: OpenModality | null
  /** Preferred side for positioning */
  side: Side
  /** Alignment for positioning */
  align: Align
  /** Depth level (0 = first submenu, 1 = nested submenu, etc.) */
  depth: number
}

/**
 * Actions to control a submenu.
 */
export interface SubmenuActions {
  /** Set the open state */
  setOpen: (open: boolean, modality?: OpenModality) => void
  /** Toggle the open state */
  toggle: (modality?: OpenModality) => void
  /** Close this submenu and all nested submenus */
  closeWithNested: () => void
}

/**
 * Combined submenu context value.
 */
export interface SubmenuContextValue {
  state: SubmenuState
  actions: SubmenuActions
  /** Reference to the trigger element */
  triggerRef: React.RefObject<HTMLElement | null>
  /** Reference to the content element */
  contentRef: React.RefObject<HTMLElement | null>
  /** Parent submenu context (for nested submenus) */
  parentSubmenu: SubmenuContextValue | null
}

// ============================================================================
// Context
// ============================================================================

const SubmenuContext = React.createContext<SubmenuContextValue | null>(null)

SubmenuContext.displayName = 'SubmenuContext'

// ============================================================================
// Depth Context
// ============================================================================

/**
 * Context for tracking submenu depth.
 */
const SubmenuDepthContext = React.createContext<number>(0)

SubmenuDepthContext.displayName = 'SubmenuDepthContext'

// ============================================================================
// Provider
// ============================================================================

export interface SubmenuProviderProps {
  /** Unique ID for this submenu */
  submenuId: string
  /** Controlled open state */
  open?: boolean
  /** Default open state */
  defaultOpen?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Preferred side for positioning */
  side?: Side
  /** Alignment for positioning */
  align?: Align
  /** Children */
  children: React.ReactNode
}

/**
 * Provider component for submenu state.
 */
export function SubmenuProvider({
  submenuId,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  side = 'right',
  align = 'start',
  children,
}: SubmenuProviderProps) {
  // Get parent submenu and depth
  const parentSubmenu = React.useContext(SubmenuContext)
  const parentDepth = React.useContext(SubmenuDepthContext)
  const depth = parentDepth + 1

  // Refs
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLElement | null>(null)

  // Open state using Radix's controllable state hook
  const [open = false, setOpenState] = useControllableState({
    prop: controlledOpen,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  })
  const [openModality, setOpenModality] = React.useState<OpenModality | null>(
    null,
  )

  // State
  const state = React.useMemo<SubmenuState>(
    () => ({
      submenuId,
      open,
      openModality,
      side,
      align,
      depth,
    }),
    [submenuId, open, openModality, side, align, depth],
  )

  // Actions
  const actions = React.useMemo<SubmenuActions>(() => {
    const setOpen = (newOpen: boolean, modality?: OpenModality) => {
      setOpenState(newOpen)
      setOpenModality(newOpen ? (modality ?? null) : null)
    }

    return {
      setOpen,

      toggle: (modality?: OpenModality) => {
        setOpen(!open, modality)
      },

      closeWithNested: () => {
        // Close this submenu
        setOpen(false)
        // Parent submenus should handle their own closing if needed
      },
    }
  }, [setOpenState, open])

  // Context value
  const value = React.useMemo<SubmenuContextValue>(
    () => ({
      state,
      actions,
      triggerRef,
      contentRef,
      parentSubmenu,
    }),
    [state, actions, parentSubmenu],
  )

  return (
    <SubmenuDepthContext.Provider value={depth}>
      <SubmenuContext.Provider value={value}>
        {children}
      </SubmenuContext.Provider>
    </SubmenuDepthContext.Provider>
  )
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the current submenu context.
 * Returns null if not inside a submenu.
 */
export function useSubmenu(): SubmenuContextValue | null {
  return React.useContext(SubmenuContext)
}

/**
 * Hook to access the current submenu context.
 * Throws if not inside a submenu.
 */
export function useSubmenuRequired(): SubmenuContextValue {
  const context = React.useContext(SubmenuContext)
  if (!context) {
    throw new Error('useSubmenuRequired must be used within a SubmenuProvider')
  }
  return context
}

/**
 * Hook to get the current submenu depth.
 * Returns 0 if not inside any submenu.
 */
export function useSubmenuDepth(): number {
  return React.useContext(SubmenuDepthContext)
}

/**
 * Hook to check if we're inside a submenu.
 */
export function useIsInSubmenu(): boolean {
  return React.useContext(SubmenuContext) !== null
}

/**
 * Hook to get all parent submenus as an array.
 * First element is the closest parent, last is the outermost.
 */
export function useParentSubmenus(): SubmenuContextValue[] {
  const parents: SubmenuContextValue[] = []
  let current = React.useContext(SubmenuContext)

  while (current?.parentSubmenu) {
    parents.push(current.parentSubmenu)
    current = current.parentSubmenu
  }

  return parents
}
