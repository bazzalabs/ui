import { ReactStore } from '@base-ui/utils/store'
import type * as React from 'react'

/**
 * Aim guard refs and actions. The value is stable for the tree's lifetime,
 * so rows can read it without re-rendering on every guard update.
 */
export interface AimGuardContextValue {
  activateAimGuard: (
    triggerId: string,
    depth: number,
    submenuSurfaceId: string,
    timeoutMs?: number,
  ) => void
  clearAimGuard: () => void
  aimGuardActiveRef: React.RefObject<boolean>
  guardedTriggerIdRef: React.RefObject<string | null>
  guardedDepthRef: React.RefObject<number | null>
  guardedSubmenuSurfaceIdRef: React.RefObject<string | null>
  isGuardBlocking: (rowId: string) => boolean
}

/** Aim guard state for components that render from it. */
export interface AimGuardStateContextValue {
  aimGuardActive: boolean
  guardedTriggerId: string | null
  guardedDepth: number | null
  guardedSubmenuSurfaceId: string | null
}

export const IDLE_AIM_GUARD_STATE: AimGuardStateContextValue = {
  aimGuardActive: false,
  guardedTriggerId: null,
  guardedDepth: null,
  guardedSubmenuSurfaceId: null,
}

/**
 * The aim guard of one menu tree, for safe polygon navigation: it keeps
 * a submenu open while the pointer moves diagonally toward it. Owned by the
 * tree tier (`MenuTreeTier.aimGuard`). Its refs change in the same call that
 * changes its state, so handlers read them current.
 */
export class AimGuardStore extends ReactStore<AimGuardStateContextValue> {
  readonly actions: AimGuardContextValue

  #timer: number | null = null

  /**
   * @param isLogging Whether guard events are logged (the root's
   * `debug.logAimGuardEvents`), read at each event.
   */
  constructor(readonly isLogging: () => boolean = () => false) {
    super(IDLE_AIM_GUARD_STATE)
    const refs = {
      aimGuardActiveRef: { current: false },
      guardedTriggerIdRef: { current: null as string | null },
      guardedDepthRef: { current: null as number | null },
      guardedSubmenuSurfaceIdRef: { current: null as string | null },
    }
    const reset = () => {
      refs.aimGuardActiveRef.current = false
      refs.guardedTriggerIdRef.current = null
      refs.guardedDepthRef.current = null
      refs.guardedSubmenuSurfaceIdRef.current = null
      this.setState(IDLE_AIM_GUARD_STATE)
    }
    this.actions = {
      ...refs,
      clearAimGuard: () => {
        this.#clearTimer()
        this.log('clear')
        reset()
      },
      activateAimGuard: (
        triggerId,
        depth,
        submenuSurfaceId,
        timeoutMs = 450,
      ) => {
        this.log('activate', { triggerId, depth, submenuSurfaceId, timeoutMs })
        refs.aimGuardActiveRef.current = true
        refs.guardedTriggerIdRef.current = triggerId
        refs.guardedDepthRef.current = depth
        refs.guardedSubmenuSurfaceIdRef.current = submenuSurfaceId
        this.update({
          aimGuardActive: true,
          guardedTriggerId: triggerId,
          guardedDepth: depth,
          guardedSubmenuSurfaceId: submenuSurfaceId,
        })
        this.#clearTimer()
        this.#timer = window.setTimeout(() => {
          this.log('timeout-expired', { triggerId, depth, submenuSurfaceId })
          reset()
          this.#timer = null
        }, timeoutMs) as unknown as number
      },
      isGuardBlocking: (rowId) =>
        refs.aimGuardActiveRef.current &&
        refs.guardedTriggerIdRef.current !== rowId,
    }
  }

  /** Stops a pending timeout: the tree unmounted. */
  dispose() {
    this.#clearTimer()
    this.log('provider-unmount-clear')
  }

  #clearTimer() {
    if (this.#timer !== null) {
      window.clearTimeout(this.#timer)
      this.#timer = null
    }
  }

  private log(eventName: string, details?: Record<string, unknown>) {
    if (typeof window === 'undefined' || !this.isLogging()) return
    const { actions } = this
    console.log(`[PopupMenu][AimGuardProvider] ${eventName}`, {
      aimGuardActive: actions.aimGuardActiveRef.current,
      guardedTriggerId: actions.guardedTriggerIdRef.current,
      guardedDepth: actions.guardedDepthRef.current,
      guardedSubmenuSurfaceId: actions.guardedSubmenuSurfaceIdRef.current,
      ...details,
    })
  }
}
