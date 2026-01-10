import { createSelector, ReactStore } from '@base-ui/utils/store'

// ============================================================================
// Types
// ============================================================================

export interface State {
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
  isOpen: createSelector((state: State, surfaceId: string) =>
    state.chain.includes(surfaceId),
  ),
  isLast: createSelector(
    (state: State, surfaceId: string) =>
      state.chain.length > 0 &&
      state.chain[state.chain.length - 1] === surfaceId,
  ),
}

// ============================================================================
// Store
// ============================================================================

/**
 * Tracks which submenu surfaces are currently open in order.
 * Used to show backdrops for all open menus in the chain.
 * Single instance per menu tree (created at root, shared via context).
 */
export class OpenChainStore extends ReactStore<State, {}, typeof selectors> {
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
    console.log('[OpenChainStore] open:', surfaceId, 'chain:', newChain)
  }

  /**
   * Mark a surface as closed (removes from chain).
   */
  close(surfaceId: string) {
    const newChain = this.state.chain.filter((id) => id !== surfaceId)
    this.set('chain', newChain)
    console.log('[OpenChainStore] close:', surfaceId, 'chain:', newChain)
  }

  /**
   * Clear all open surfaces (menu tree closed).
   */
  clear() {
    console.log('[OpenChainStore] clear')
    this.set('chain', [])
  }
}
