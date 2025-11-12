import * as React from 'react'
import { useFocusOwner } from '../contexts/focus-owner-context.js'
import { useKeyboardOpts } from '../contexts/keyboard-context.js'
import { useRootCtx } from '../contexts/root-context.js'
import { useSubCtx } from '../contexts/submenu-context.js'
import { useSurface } from '../contexts/surface-context.js'
import { useSurfaceId } from '../contexts/surface-id-context.js'
import { findWidgetsWithinSurface } from '../lib/dom-utils.js'
import {
  dispatch,
  openSubmenuForActive,
  SELECT_ITEM_EVENT,
} from '../lib/events.js'
import {
  isCloseKey,
  isOpenKey,
  isSelectionKey,
  isVimClose,
  isVimNext,
  isVimOpen,
  isVimPrev,
} from '../lib/keyboard.js'
import { logPerformance } from '../lib/performance.js'

export function useNavKeydown(_source: 'input' | 'list') {
  const store = useSurface()
  const root = useRootCtx()
  const sub = useSubCtx()
  const surfaceId = useSurfaceId() || 'root'
  const { ownerId, setOwnerId } = useFocusOwner()
  const { dir, vimBindings } = useKeyboardOpts()

  return React.useCallback(
    (e: React.KeyboardEvent) => {
      if (ownerId !== surfaceId) return
      const k = e.key
      const stop = () => {
        e.preventDefault()
        e.stopPropagation()
      }
      if (vimBindings) {
        if (isVimNext(e)) {
          stop()
          store.next()
          return
        }
        if (isVimPrev(e)) {
          stop()
          store.prev()
          return
        }
        if (isVimOpen(e)) {
          stop()
          const activeId = store.snapshot().activeId
          if (isSelectionKey(k)) {
            const el = activeId
              ? logPerformance('getElementById', 'useNavKeydown.vimOpen', () =>
                  document.getElementById(activeId),
                )
              : null
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
          if (sub) {
            stop()
            setOwnerId(sub.parentSurfaceId)
            sub.onOpenChange(false)
            sub.parentSetActiveId(sub.triggerItemId)
            const parentEl = logPerformance(
              'querySelector',
              'useNavKeydown.vimClose',
              () =>
                document.querySelector<HTMLElement>(
                  `[data-surface-id="${sub.parentSurfaceId}"]`,
                ),
            )
            requestAnimationFrame(() => {
              const { input, list } = findWidgetsWithinSurface(parentEl)
              ;(input ?? list)?.focus()
            })
            return
          }
        }
      }
      if (k === 'Tab') {
        stop()
        return
      }
      if (k === 'ArrowDown') {
        stop()
        store.next()
        return
      }
      if (k === 'ArrowUp') {
        stop()
        store.prev()
        return
      }
      if (k === 'Home' || k === 'PageUp') {
        stop()
        store.first()
        return
      }
      if (k === 'End' || k === 'PageDown') {
        stop()
        store.last()
        return
      }

      if (isOpenKey(dir, k)) {
        stop()
        const activeId = store.snapshot().activeId
        if (isSelectionKey(k)) {
          const el = activeId
            ? logPerformance('getElementById', 'useNavKeydown.openKey', () =>
                document.getElementById(activeId),
              )
            : null
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

      if (isCloseKey(dir, k)) {
        if (sub) {
          stop()
          setOwnerId(sub.parentSurfaceId)
          sub.onOpenChange(false)
          sub.parentSetActiveId(sub.triggerItemId)
          const parentEl = logPerformance(
            'querySelector',
            'useNavKeydown.closeKey',
            () =>
              document.querySelector<HTMLElement>(
                `[data-surface-id="${sub.parentSurfaceId}"]`,
              ),
          )
          requestAnimationFrame(() => {
            const { input, list } = findWidgetsWithinSurface(parentEl)
            ;(input ?? list)?.focus()
          })
          return
        }
      }

      if (k === 'Enter') {
        stop()
        const activeId = store.snapshot().activeId
        const el = activeId
          ? logPerformance('getElementById', 'useNavKeydown.enter', () =>
              document.getElementById(activeId),
            )
          : null
        if (el && el.dataset.subtrigger === 'true') {
          openSubmenuForActive(activeId, surfaceId)
        } else {
          dispatch(el, SELECT_ITEM_EVENT)
        }
        return
      }

      if (k === 'Escape') {
        stop()
        if (sub) {
          sub.onOpenChange(false)
          return
        }
        root.onOpenChange(false)
        return
      }
    },
    [store, root, sub, dir, vimBindings, ownerId, setOwnerId, surfaceId],
  )
}
