import { createSelector, ReactStore } from '@base-ui/utils/store'

// ============================================================================
// Types
// ============================================================================

export interface State {
  /** Which surface currently owns focus (surfaceId or null) */
  ownerId: string | null
}

// ============================================================================
// Selectors
// ============================================================================

const selectors = {
  ownerId: createSelector((state: State) => state.ownerId),
  isOwner: createSelector(
    (state: State, surfaceId: string) => state.ownerId === surfaceId,
  ),
}

// ============================================================================
// Store
// ============================================================================

/**
 * Tracks which menu surface owns DOM focus.
 * Single instance per menu tree (created at root, shared via context).
 */
export class FocusOwnerStore extends ReactStore<State, {}, typeof selectors> {
  constructor() {
    super({ ownerId: null }, {}, selectors)
  }

  /**
   * Set the owner surface ID.
   * Call this when focus should transfer to a new surface.
   */
  setOwnerId(id: string | null) {
    console.log(
      '[FocusOwnerStore] setOwnerId:',
      id,
      'previous:',
      this.state.ownerId,
    )
    this.set('ownerId', id)
  }

  /**
   * Clear the owner (set to null).
   * Call this when the menu tree closes.
   */
  clearOwner() {
    this.set('ownerId', null)
  }
}
