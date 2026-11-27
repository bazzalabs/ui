'use client'

import { useMaybeMenuTreeTier } from '../contexts/menu-tree-context.js'
import {
  type AimGuardContextValue,
  type AimGuardStateContextValue,
  IDLE_AIM_GUARD_STATE,
} from '../store/AimGuardStore.js'
import { useMaybeStore } from './use-maybe-store.js'

export type { AimGuardContextValue, AimGuardStateContextValue }

// Outside a menu tree: a guard that never activates.
const NOOP_ACTIONS: AimGuardContextValue = {
  activateAimGuard: () => {},
  clearAimGuard: () => {},
  aimGuardActiveRef: { current: false },
  guardedTriggerIdRef: { current: null },
  guardedDepthRef: { current: null },
  guardedSubmenuSurfaceIdRef: { current: null },
  isGuardBlocking: () => false,
}

const selectState = (state: AimGuardStateContextValue) => state

/** The tree's aim guard actions and refs; stable for the tree's lifetime. */
export const useAimGuard = (): AimGuardContextValue =>
  useMaybeMenuTreeTier()?.aimGuard.actions ?? NOOP_ACTIONS

/** Re-renders on every guard activate/clear; prefer `useAimGuard` refs. */
export const useAimGuardState = (): AimGuardStateContextValue =>
  useMaybeStore(
    useMaybeMenuTreeTier()?.aimGuard,
    selectState,
    IDLE_AIM_GUARD_STATE,
  )
