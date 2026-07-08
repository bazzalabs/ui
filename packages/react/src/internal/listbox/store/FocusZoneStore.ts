import { createSelector, ReactStore } from '@base-ui/utils/store'

// ============================================================================
// Types
// ============================================================================

export type FocusZonePlacement = 'header' | 'footer'

export interface FocusZoneRegistration {
  /** Unique zone id (React.useId of the zone component). */
  id: string
  /** Surface this zone belongs to. */
  surfaceId: string
  placement: FocusZonePlacement
  /** Returns the zone's container element (null before mount). */
  getElement: () => HTMLElement | null
}

export type FocusZoneTarget = { type: 'zone'; id: string } | { type: 'primary' }

export interface FocusZoneState {
  /** Zone currently holding DOM focus, or null when the primary zone (input/list) does. */
  activeZoneId: string | null
  /** Bumped on register/unregister so subscribers can react to zone presence. */
  registrationVersion: number
}

export interface FocusZoneContext {
  zones: Map<string, FocusZoneRegistration>
  /** Per-surface getters for the primary focus targets. */
  primaryTargets: Map<
    string,
    { input?: () => HTMLElement | null; list?: () => HTMLElement | null }
  >
}

// ============================================================================
// Selectors
// ============================================================================

const selectors = {
  activeZoneId: createSelector((state: FocusZoneState) => state.activeZoneId),
  hasActiveZone: createSelector(
    (state: FocusZoneState) => state.activeZoneId !== null,
  ),
  registrationVersion: createSelector(
    (state: FocusZoneState) => state.registrationVersion,
  ),
}

// Mirrors internal/composite's focus candidate selector for roving focus items.
const ZONE_FOCUS_CANDIDATE_SELECTOR =
  'button, a[href], input, select, textarea, [data-roving-item]'

// ============================================================================
// Store
// ============================================================================

/**
 * Tracks header/footer focus zones registered per listbox surface.
 *
 * Focus zones hold real DOM focus, while the primary listbox zone uses virtual
 * focus through aria-activedescendant. A single store can be shared by a popup
 * menu tree so Tab can move between header zones, the primary zone, and footer
 * zones in a deterministic order.
 */
export class FocusZoneStore extends ReactStore<
  FocusZoneState,
  FocusZoneContext,
  typeof selectors
> {
  constructor() {
    super(
      { activeZoneId: null, registrationVersion: 0 },
      { zones: new Map(), primaryTargets: new Map() },
      selectors,
    )
  }

  /**
   * Register a header or footer focus zone for a surface.
   *
   * Zone order within each placement follows Map insertion order. The returned
   * cleanup unregisters the zone and bumps registrationVersion so subscribers
   * can react to zone presence changes.
   */
  registerZone(reg: FocusZoneRegistration): () => void {
    this.context.zones.set(reg.id, reg)
    this.bumpRegistrationVersion()

    return () => {
      this.context.zones.delete(reg.id)
      this.bumpRegistrationVersion()
    }
  }

  /**
   * Register a primary focus target getter for a surface.
   *
   * The primary target represents the input/list zone that receives DOM focus
   * when Tab navigation returns from a registered header or footer zone.
   */
  registerPrimaryTarget(
    surfaceId: string,
    kind: 'input' | 'list',
    getElement: () => HTMLElement | null,
  ): () => void {
    const targets = this.context.primaryTargets.get(surfaceId) ?? {}
    targets[kind] = getElement
    this.context.primaryTargets.set(surfaceId, targets)

    return () => {
      const currentTargets = this.context.primaryTargets.get(surfaceId)
      if (!currentTargets) return

      delete currentTargets[kind]

      if (!currentTargets.input && !currentTargets.list) {
        this.context.primaryTargets.delete(surfaceId)
      }
    }
  }

  /**
   * Set the active zone ID.
   * Use null when focus is in the primary input/list zone.
   */
  setActiveZoneId(id: string | null) {
    this.set('activeZoneId', id)
  }

  /**
   * Return whether a surface has any registered header or footer zones.
   */
  hasZones(surfaceId: string): boolean {
    for (const zone of this.context.zones.values()) {
      if (zone.surfaceId === surfaceId) {
        return true
      }
    }

    return false
  }

  /**
   * Get the Tab order for a surface: header zones, primary, then footer zones.
   */
  getZoneOrder(surfaceId: string): FocusZoneTarget[] {
    const headers: FocusZoneTarget[] = []
    const footers: FocusZoneTarget[] = []

    for (const zone of this.context.zones.values()) {
      if (zone.surfaceId !== surfaceId) continue

      const target: FocusZoneTarget = { type: 'zone', id: zone.id }

      if (zone.placement === 'header') {
        headers.push(target)
      } else {
        footers.push(target)
      }
    }

    return [...headers, { type: 'primary' }, ...footers]
  }

  /**
   * Get the next or previous focus target for a surface with wrap-around.
   *
   * Returns null when the current target cannot be found or the surface has no
   * registered zones beyond the primary target.
   */
  getAdjacentTarget(
    surfaceId: string,
    from: string | 'primary',
    direction: 1 | -1,
  ): FocusZoneTarget | null {
    const order = this.getZoneOrder(surfaceId)
    if (order.length <= 1) return null

    const currentIndex = order.findIndex((target) => {
      if (from === 'primary') {
        return target.type === 'primary'
      }

      return target.type === 'zone' && target.id === from
    })

    if (currentIndex === -1) return null

    const nextIndex = (currentIndex + direction + order.length) % order.length
    return order[nextIndex] ?? null
  }

  /**
   * Move DOM focus to a registered target.
   *
   * For the primary zone, the input target is preferred over the list target.
   * For custom zones, roving tabindex="0" is preferred before falling back to
   * the first non-disabled interactive candidate in the zone container.
   */
  focusTarget(surfaceId: string, target: FocusZoneTarget): boolean {
    if (target.type === 'primary') {
      const primaryTarget = this.context.primaryTargets.get(surfaceId)
      const element = primaryTarget?.input?.() ?? primaryTarget?.list?.()

      if (!element) return false

      element.focus()
      return true
    }

    const zone = this.context.zones.get(target.id)
    const element = zone?.getElement()
    if (!element) return false

    const activeRovingItem =
      element.querySelector<HTMLElement>('[tabindex="0"]')
    if (activeRovingItem) {
      activeRovingItem.focus()
      return true
    }

    const candidates = element.querySelectorAll<HTMLElement>(
      ZONE_FOCUS_CANDIDATE_SELECTOR,
    )

    for (const candidate of candidates) {
      if (candidate.matches(':disabled')) continue

      candidate.focus()
      return true
    }

    return false
  }

  private bumpRegistrationVersion() {
    this.set('registrationVersion', this.state.registrationVersion + 1)
  }
}
