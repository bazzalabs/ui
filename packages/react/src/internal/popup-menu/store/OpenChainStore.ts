import { createSelector, ReactStore } from '@base-ui/utils/store'

// ============================================================================
// Types
// ============================================================================

export interface OpenChainState {
  /**
   * Ordered array of surface IDs for submenus that are currently open.
   * The last element is the most recently opened (deepest in chain).
   */
  chain: string[]
}

// ============================================================================
// Selectors
// ============================================================================

const selectors = {
  isOpen: createSelector((state: OpenChainState, surfaceId: string) =>
    state.chain.includes(surfaceId),
  ),
  isLast: createSelector(
    (state: OpenChainState, surfaceId: string) =>
      state.chain.length > 0 &&
      state.chain[state.chain.length - 1] === surfaceId,
  ),
  /**
   * Returns true if there's an open submenu below the given depth.
   * - Root (depth 0): true if any submenu is open
   * - Submenu at depth N: true if a deeper submenu is open
   */
  hasOpenSubmenu: createSelector(
    (state: OpenChainState, depth: number) => state.chain.length > depth,
  ),
}

// ============================================================================
// Store
// ============================================================================

/**
 * Tracks which submenu surfaces are currently open in order.
 * Used to show backdrops for all open menus in the chain.
 * Single instance per menu tree (created at root, shared via context).
 *
 * Used by: DropdownMenu, ContextMenu
 * Not used by: Select, CommandMenu (no submenus)
 */
export class OpenChainStore extends ReactStore<
  OpenChainState,
  {},
  typeof selectors
> {
  constructor() {
    super({ chain: [] }, {}, selectors)
  }

  /**
   * Mark a surface as open (adds to end of chain).
   */
  open(surfaceId: string) {
    // Don't add duplicates
    if (this.state.chain.includes(surfaceId)) return

    const newChain = [...this.state.chain, surfaceId]
    this.set('chain', newChain)
  }

  /**
   * Mark a surface as closed (removes from chain).
   */
  close(surfaceId: string) {
    const newChain = this.state.chain.filter((id) => id !== surfaceId)
    this.set('chain', newChain)
  }

  /**
   * Clear all open surfaces (menu tree closed).
   */
  clear() {
    this.set('chain', [])
  }
}

export type { OpenChainState as State }
