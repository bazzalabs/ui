import {
  isCloseKey,
  isOpenKey,
  isSelectionKey,
  isVimClose,
  isVimNext,
  isVimOpen,
  isVimPrev,
} from '@bazza-ui/menu'
import * as React from 'react'
import { useSurface } from '../components/surface-provider.js'
import { useFocusOwner } from '../contexts/focus-owner-context.js'
import { useKeyboardOpts } from '../contexts/keyboard-context.js'
import { useSub } from '../contexts/submenu-context.js'
import {
  CLOSE_MENU_EVENT,
  dispatch,
  openSubmenuForActive,
  SELECT_ITEM_EVENT,
} from '../lib/events.js'

export function useNavKeydown(
  _source: 'input' | 'list',
  surfaceId: string,
  onRootClose?: () => void,
) {
  const surfaceCtx = useSurface()
  const store = surfaceCtx.store
  const sub = useSub()
  const { ownerId, setOwnerId } = useFocusOwner()
  const { dir, vimBindings } = useKeyboardOpts()

  return React.useCallback(
    (e: React.KeyboardEvent) => {
      // Only handle keyboard events if this surface owns focus
      if (ownerId !== surfaceId) return

      const k = e.key
      const stop = () => {
        e.preventDefault()
        e.stopPropagation()
      }

      // Vim bindings
      if (vimBindings) {
        if (isVimNext(e)) {
          stop()
          store.next('keyboard')
          return
        }
        if (isVimPrev(e)) {
          stop()
          store.prev('keyboard')
          return
        }
        if (isVimOpen(e)) {
          stop()
          const activeId = store.snapshot().activeId
          if (isSelectionKey(k)) {
            const el = activeId ? document.getElementById(activeId) : null
            if (el && el.dataset.subtrigger === 'true') {
              openSubmenuForActive(activeId, surfaceId)
            } else {
              dispatch(el, SELECT_ITEM_EVENT)
            }
          } else {
            openSubmenuForActive(activeId, surfaceId)
          }
          return
        }
        if (isVimClose(e)) {
          stop() // Always prevent default to avoid browser history navigation
          if (sub) {
            sub.onOpenChange(false)
            sub.parentSetActiveId(sub.triggerItemId)
            // Set ownership LAST to trigger the auto-focus effect in list.tsx
            setOwnerId(sub.parentSurfaceId)
          }
          return
        }
      }

      // Tab - prevent default
      if (k === 'Tab') {
        stop()
        return
      }

      // Arrow navigation
      if (k === 'ArrowDown') {
        stop()
        store.next('keyboard')
        return
      }
      if (k === 'ArrowUp') {
        stop()
        store.prev('keyboard')
        return
      }

      // Page navigation
      if (k === 'Home' || k === 'PageUp') {
        stop()
        store.first('keyboard')
        return
      }
      if (k === 'End' || k === 'PageDown') {
        stop()
        store.last('keyboard')
        return
      }

      // Submenu open keys (Enter or Right arrow in LTR, Left in RTL)
      if (isOpenKey(dir, k)) {
        stop()
        const activeId = store.snapshot().activeId
        if (isSelectionKey(k)) {
          const el = activeId ? document.getElementById(activeId) : null
          if (el && el.dataset.subtrigger === 'true') {
            openSubmenuForActive(activeId, surfaceId)
          } else {
            dispatch(el, SELECT_ITEM_EVENT)
          }
        } else {
          openSubmenuForActive(activeId, surfaceId)
        }
        return
      }

      // Submenu close keys (Left arrow in LTR, Right in RTL)
      if (isCloseKey(dir, k)) {
        if (sub) {
          stop()
          sub.onOpenChange(false)
          sub.parentSetActiveId(sub.triggerItemId)
          // Set ownership LAST to trigger the auto-focus effect in list.tsx
          setOwnerId(sub.parentSurfaceId)
          return
        }
      }

      // Enter - select item or open submenu
      if (k === 'Enter') {
        stop()
        const activeId = store.snapshot().activeId
        const el = activeId ? document.getElementById(activeId) : null
        if (el && el.dataset.subtrigger === 'true') {
          openSubmenuForActive(activeId, surfaceId)
        } else {
          dispatch(el, SELECT_ITEM_EVENT)
        }
        return
      }

      // Escape - close menu
      if (k === 'Escape') {
        stop()
        if (sub) {
          sub.onOpenChange(false)
          return
        }
        // Root menu - use callback or dispatch event
        if (onRootClose) {
          onRootClose()
        } else {
          // Fallback: dispatch close event on the surface
          const surfaceEl = document.querySelector<HTMLElement>(
            `[data-surface-id="${surfaceId}"]`,
          )
          dispatch(surfaceEl, CLOSE_MENU_EVENT)
        }
        return
      }
    },
    [store, sub, dir, vimBindings, ownerId, setOwnerId, surfaceId, onRootClose],
  )
}
