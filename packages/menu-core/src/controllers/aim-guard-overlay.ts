import type { Clock, ClockHandle } from '../platform/clock.js'
import type {
  AimGuardDebugSettings,
  AimGuardDebugSnapshot,
  AimGuardReading,
} from './aim-guard.js'
import type { SubmenuAim, SubmenuAimDecision } from './submenu.js'

/** What an overlay reads of its trigger and the trigger's tree. */
export interface AimGuardOverlayHost {
  readonly clock: Clock
  /** The tree's overlay settings, read each time the overlay decides. */
  settings(): AimGuardDebugSettings | null
  /** Whether the trigger holds the tree's guard. */
  isHeld(): boolean
  /** Told each time who holds the guard changes. */
  subscribeGuard(listener: () => void): () => void
}

/** The aim the trigger made of the pointer last, with what it read. */
export interface AimGuardLastAim {
  readonly phase: 'leave' | 'track'
  readonly aim: SubmenuAim
  readonly reading: AimGuardReading | null
}

/**
 * One submenu trigger's safe-triangle debug overlay: the triangle to draw,
 * worked out only while something listens to it, from the decisions the
 * trigger shows. A trigger gets one only from the factory its controller
 * was made with (`AimGuardControllerOptions.overlay`), so an app's
 * production build, which passes none, ships none of this.
 */
export interface AimGuardOverlay {
  /** The triangle to draw; null draws nothing. */
  snapshot(): AimGuardDebugSnapshot | null
  /** Listens to the overlay; it's worked out only while something listens, and starts hidden. */
  subscribe(listener: () => void): () => void
  /** The decision the trigger showed for its last aim. */
  show(decision: SubmenuAimDecision, last: AimGuardLastAim | null): void
  /** The trigger's submenu closed: an activated triangle goes with it. */
  releaseOwn(): void
  /** Hides the triangle. */
  hide(): void
}

/** Makes the overlay of one trigger (`AimGuardControllerOptions.overlay`). */
export function createAimGuardOverlay(
  host: AimGuardOverlayHost,
): AimGuardOverlay {
  const listeners = new Set<() => void>()
  let debug: AimGuardDebugSnapshot | null = null
  let timer: ClockHandle | null = null
  let stopWatchingGuard: (() => void) | null = null

  const settings = (): AimGuardDebugSettings | null => {
    if (listeners.size === 0) return null
    const current = host.settings()
    return current?.enabled ? current : null
  }
  const clearTimer = () => {
    if (timer === null) return
    host.clock.clearTimeout(timer)
    timer = null
  }
  const set = (snapshot: AimGuardDebugSnapshot) => {
    clearTimer()
    debug = snapshot
    for (const listener of listeners) listener()
  }
  const hide = () => {
    clearTimer()
    if (debug === null) return
    debug = null
    for (const listener of listeners) listener()
  }
  // An activated triangle goes once the guard isn't the trigger's.
  const checkActivated = () => {
    if (debug?.tone !== 'activated') return
    if (settings()?.persistOnSuccess) return
    if (host.isHeld()) return
    hide()
  }

  return {
    snapshot: () => debug,
    subscribe(listener) {
      listeners.add(listener)
      if (listeners.size === 1) {
        stopWatchingGuard = host.subscribeGuard(checkActivated)
      }
      return () => {
        if (!listeners.delete(listener)) return
        if (listeners.size > 0) return
        stopWatchingGuard?.()
        stopWatchingGuard = null
        hide()
      }
    },
    show(decision, last) {
      if (decision === 'hover') {
        if (settings()) set({ tone: 'hover', frozen: null })
        return
      }
      if (decision === 'none' || !last?.reading) {
        hide()
        return
      }
      const current = settings()
      if (!current) return
      if (decision === 'hit') {
        set({
          tone: 'activated',
          frozen: current.freezeOnPointerLeave ? last.reading : null,
        })
        // Shown after the guard was held or released for it
        checkActivated()
        return
      }
      if (!current.showMissState || current.missFreezeDuration <= 0) {
        hide()
        return
      }
      set({ tone: 'missed', frozen: last.reading })
      timer = host.clock.setTimeout(() => {
        timer = null
        hide()
      }, current.missFreezeDuration)
    },
    releaseOwn() {
      if (debug?.tone === 'activated') hide()
    },
    hide,
  }
}
