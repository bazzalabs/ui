'use client'

import { AimGuardController, type AimGuardPointer } from '@bazza-ui/menu-core'
import type { AimGuardRefs } from '../../listbox/hooks/use-listbox-item.js'
import {
  type MenuTreeSettings,
  useMaybeMenuTreeTier,
} from '../contexts/menu-tree-context.js'
import { isMouseLikePointerType } from '../utils/is-mouse-like-pointer.js'

/** The window's pointer moves, listened to only while asked. */
const windowPointer: AimGuardPointer = {
  listen(onMove) {
    const onPointerMove = (event: PointerEvent) => {
      onMove(
        { x: event.clientX, y: event.clientY },
        isMouseLikePointerType(event.pointerType),
      )
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  },
}

/**
 * The aim guard of one menu tree, on the window's pointer, with the tree's
 * debug flags: `logAimGuardEvents` logs its events, `showSafeTriangleArea`
 * sets its overlay. Made once by `PopupMenuProviders` for the tree tier.
 */
export function createAimGuard(settings: MenuTreeSettings): AimGuardController {
  return new AimGuardController({
    pointer: windowPointer,
    log: (scope, event, details) => {
      if (typeof window === 'undefined') return
      if (!settings.state.debug.logAimGuardEvents) return
      const prefix = scope === 'tree' ? 'AimGuardProvider' : 'AimGuard'
      console.log(`[PopupMenu][${prefix}] ${event}`, details())
    },
    getDebugSettings: () => settings.state.debug.showSafeTriangleArea,
  })
}

/** The tree's aim guard, or null outside a menu tree. */
export const useMaybeAimGuard = (): AimGuardController | null =>
  useMaybeMenuTreeTier()?.aimGuard ?? null

const IDLE_REFS: AimGuardRefs = {
  aimGuardActiveRef: { current: false },
  guardedDepthRef: { current: null },
}

const refsByGuard = new WeakMap<AimGuardController, AimGuardRefs>()

/**
 * The guard as the listbox's rows read it (`AimGuardRefs`): refs that read
 * the guard's state when read, so a row reads it current in its handler.
 */
export function useAimGuardRefs(): AimGuardRefs {
  const guard = useMaybeAimGuard()
  if (!guard) return IDLE_REFS
  let refs = refsByGuard.get(guard)
  if (!refs) {
    refs = {
      aimGuardActiveRef: {
        get current() {
          return guard.getSnapshot().active
        },
      },
      guardedDepthRef: {
        get current() {
          return guard.getSnapshot().depth
        },
      },
    }
    refsByGuard.set(guard, refs)
  }
  return refs
}
