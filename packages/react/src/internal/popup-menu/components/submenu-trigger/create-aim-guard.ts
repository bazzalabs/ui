import {
  AimGuardController,
  type AimGuardPointer,
  createAimGuardOverlay,
} from '@bazza-ui/menu-core'
import type { MenuTreeSettings } from '../../contexts/menu-tree-context.js'
import { isMouseLikePointerType } from '../../utils/is-mouse-like-pointer.js'

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
 * The aim guard of one menu tree, on the window's pointer, made by the
 * tree's first submenu trigger (`MenuTreeTier.ensureAimGuard`), so it ships
 * only with a member that has submenus. In development it takes the tree's
 * debug flags: `logAimGuardEvents` logs its events, `showSafeTriangleArea`
 * draws its overlay. A production build has neither, and drops the overlay
 * and the log lines.
 */
export function createAimGuard(settings: MenuTreeSettings): AimGuardController {
  return new AimGuardController(
    process.env.NODE_ENV === 'production'
      ? { pointer: windowPointer }
      : {
          pointer: windowPointer,
          log: (scope, event, details) => {
            if (typeof window === 'undefined') return
            if (!settings.state.debug.logAimGuardEvents) return
            const prefix = scope === 'tree' ? 'AimGuardProvider' : 'AimGuard'
            console.log(`[PopupMenu][${prefix}] ${event}`, details())
          },
          getDebugSettings: () => {
            const overlay = settings.state.debug.showSafeTriangleArea
            return overlay.enabled ? overlay : null
          },
          overlay: createAimGuardOverlay,
        },
  )
}
