import * as React from 'react'
import { mergeProps } from '../utils/merge-props.js'
import type { SurfaceStore, Direction } from '../types.js'
import {
  isVimNext,
  isVimPrev,
  isVimOpen,
  isVimClose,
  isOpenKey,
  isCloseKey,
  isSelectionKey,
} from '../utils/keyboard.js'

export interface MenuListPrimitiveProps<T> {
  /** Reference to the list element */
  ref?: React.Ref<HTMLDivElement>
  /** Surface store for state management */
  store: SurfaceStore<T>
  /** Role for the list */
  role?: 'listbox' | 'menu'
  /** Additional className */
  className?: string
  /** Additional styles */
  style?: React.CSSProperties
  /** Children */
  children: React.ReactNode
  /** Keyboard event handler overrides */
  onKeyDown?: (e: React.KeyboardEvent) => void
  /** Enable vim key bindings (Ctrl+j/k/n/p) */
  vimBindings?: boolean
  /** Text direction for submenu navigation (left/right arrows) */
  dir?: Direction
  /** Callback when Escape is pressed */
  onEscape?: () => void
  /** Callback when close key is pressed (left arrow in LTR, right in RTL) */
  onClose?: () => void
  /** Callback when submenu should open for active item */
  onSubmenuOpen?: (activeId: string | null) => void
}

/**
 * Primitive menu list component that provides:
 * - aria-activedescendant pattern for accessibility
 * - Keyboard navigation (ArrowUp/Down, Home/End, PageUp/PageDown, Enter, Escape, Tab)
 * - Vim key bindings (optional: Ctrl+j/k/n/p for navigation, Ctrl+l/h for submenu)
 * - role="listbox" or "menu"
 * - Proper ARIA attributes
 */
export function MenuListPrimitive<T>({
  ref,
  store,
  role = 'listbox',
  className,
  style,
  children,
  onKeyDown: onKeyDownProp,
  vimBindings = false,
  dir = 'ltr',
  onEscape,
  onClose,
  onSubmenuOpen,
}: MenuListPrimitiveProps<T>) {
  // Get active ID from store
  const [activeId, setActiveId] = React.useState(store.snapshot().activeId)
  React.useEffect(() => {
    return store.subscribe(() => {
      setActiveId(store.snapshot().activeId)
    })
  }, [store])

  // Keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      // Allow custom handler to override
      onKeyDownProp?.(e)
      if (e.defaultPrevented) return

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
          if (onSubmenuOpen) {
            onSubmenuOpen(activeId)
          } else {
            // Default: trigger select
            const activeRow = activeId ? store.rows.get(activeId) : null
            if (activeRow?.ref.current) {
              activeRow.ref.current.dispatchEvent(
                new CustomEvent('menu:selectItem', { bubbles: false }),
              )
            }
          }
          return
        }
        if (isVimClose(e)) {
          stop()
          onClose?.()
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
        if (isSelectionKey(k)) {
          // Enter key - check if active item is a submenu trigger
          const activeRow = activeId ? store.rows.get(activeId) : null
          if (activeRow?.ref.current) {
            const isSubmenuTrigger =
              activeRow.ref.current.getAttribute('data-submenu-trigger') === 'true'
            if (isSubmenuTrigger && onSubmenuOpen) {
              onSubmenuOpen(activeId)
            } else {
              activeRow.ref.current.dispatchEvent(
                new CustomEvent('menu:selectItem', { bubbles: false }),
              )
            }
          }
        } else {
          // Right/Left arrow - open submenu if available
          onSubmenuOpen?.(activeId)
        }
        return
      }

      // Submenu close keys (Left arrow in LTR, Right in RTL)
      if (isCloseKey(dir, k)) {
        stop()
        onClose?.()
        return
      }

      // Enter/Space - select active item
      if (k === 'Enter' || k === ' ') {
        stop()
        const activeRow = activeId ? store.rows.get(activeId) : null
        if (activeRow?.ref.current) {
          const isSubmenuTrigger =
            activeRow.ref.current.getAttribute('data-submenu-trigger') === 'true'
          if (isSubmenuTrigger && onSubmenuOpen) {
            onSubmenuOpen(activeId)
          } else {
            activeRow.ref.current.dispatchEvent(
              new CustomEvent('menu:selectItem', { bubbles: false }),
            )
          }
        }
        return
      }

      // Escape - close menu
      if (k === 'Escape') {
        stop()
        onEscape?.()
        return
      }
    },
    [store, activeId, onKeyDownProp, vimBindings, dir, onEscape, onClose, onSubmenuOpen],
  )

  const listProps = {
    ref: store.listRef,
    role,
    'data-menu-list': '',
    'aria-activedescendant': activeId,
    className,
    style,
    onKeyDown: handleKeyDown,
    tabIndex: 0, // Make list focusable for keyboard navigation
  }

  const mergedProps = ref
    ? mergeProps(listProps, { ref } as any)
    : listProps

  return <div {...(mergedProps as any)}>{children}</div>
}
