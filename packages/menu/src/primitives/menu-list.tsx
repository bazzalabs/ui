import { mergeProps } from '@bazza-ui/theming'
import * as React from 'react'
import { type StoreApi, useStore } from 'zustand'
import type { BaseMenuStore, SurfaceRefs } from '../store/types.js'
import type { Direction, RowRecord } from '../types.js'

// Stable empty map to avoid creating new objects on each render
const EMPTY_ROWS_MAP: Map<string, RowRecord> = new Map()

import {
  isCloseKey,
  isOpenKey,
  isSelectionKey,
  isVimClose,
  isVimNext,
  isVimOpen,
  isVimPrev,
} from '../utils/keyboard.js'
import { SELECT_ITEM_EVENT } from './menu-item.js'

export interface MenuListPrimitiveProps<T> {
  /** Reference to the list element */
  ref?: React.Ref<HTMLDivElement>
  /** Surface ID for this list */
  surfaceId: string
  /** Global store API */
  globalStore: StoreApi<BaseMenuStore<T>>
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
  /** Whether the list is disabled (blocks all navigation except Escape) */
  disabled?: boolean
  /** Optional menu control for accessing menu-wide state (disabled, loading, etc.) */
  control?: import('../control.js').MenuControl<T>
  isFocused?: boolean
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
  surfaceId,
  globalStore,
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
  disabled: disabledProp = false,
  control,
  isFocused = false,
}: MenuListPrimitiveProps<T>) {
  // Check menu-wide disabled state from control (if provided)
  const menuDisabled = control?.getState().disabled ?? false

  // Combine: explicit prop OR menu-wide state
  const disabled = disabledProp || menuDisabled

  // Subscribe to surface's activeId and rows from global store
  const activeId = useStore(
    globalStore,
    React.useCallback(
      (state: BaseMenuStore<T>) =>
        state.surfaces.get(surfaceId)?.activeId ?? null,
      [surfaceId],
    ),
  )

  const rows = useStore(
    globalStore,
    React.useCallback(
      (state: BaseMenuStore<T>) =>
        state.surfaces.get(surfaceId)?.rows ?? EMPTY_ROWS_MAP,
      [surfaceId],
    ),
  )

  // Subscribe to surface existence so we re-render when surface is registered
  const surfaceExists = useStore(
    globalStore,
    React.useCallback(
      (state: BaseMenuStore<T>) => state.surfaces.has(surfaceId),
      [surfaceId],
    ),
  )

  // Get refs from global store - re-evaluate when surface exists changes
  const refs = React.useMemo<SurfaceRefs | undefined>(
    () =>
      surfaceExists
        ? globalStore.getState().getSurfaceRefs(surfaceId)
        : undefined,
    [globalStore, surfaceId, surfaceExists],
  )

  // Get navigation actions from global store
  const actions = React.useMemo(
    () => ({
      next: (cause: 'keyboard' | 'pointer' = 'keyboard') =>
        globalStore.getState().next(surfaceId, cause),
      prev: (cause: 'keyboard' | 'pointer' = 'keyboard') =>
        globalStore.getState().prev(surfaceId, cause),
      first: (cause: 'keyboard' | 'pointer' = 'keyboard') =>
        globalStore.getState().first(surfaceId, cause),
      last: (cause: 'keyboard' | 'pointer' = 'keyboard') =>
        globalStore.getState().last(surfaceId, cause),
    }),
    [globalStore, surfaceId],
  )

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

      // ALWAYS allow Escape (to close menu even when disabled)
      if (k === 'Escape') {
        stop()
        onEscape?.()
        return
      }

      // Block all other keys if disabled
      if (disabled) {
        stop()
        return
      }

      // Vim bindings
      if (vimBindings) {
        if (isVimNext(e)) {
          stop()
          actions.next('keyboard')
          return
        }
        if (isVimPrev(e)) {
          stop()
          actions.prev('keyboard')
          return
        }
        if (isVimOpen(e)) {
          stop()
          if (onSubmenuOpen) {
            onSubmenuOpen(activeId)
          } else {
            // Default: trigger select
            const activeRow = activeId ? rows.get(activeId) : null
            if (activeRow?.ref.current) {
              activeRow.ref.current.dispatchEvent(
                new CustomEvent(SELECT_ITEM_EVENT, { bubbles: false }),
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
        actions.next('keyboard')
        return
      }
      if (k === 'ArrowUp') {
        stop()
        actions.prev('keyboard')
        return
      }

      // Page navigation
      if (k === 'Home' || k === 'PageUp') {
        stop()
        actions.first('keyboard')
        return
      }
      if (k === 'End' || k === 'PageDown') {
        stop()
        actions.last('keyboard')
        return
      }

      // Submenu open keys (Enter or Right arrow in LTR, Left in RTL)
      if (isOpenKey(dir, k)) {
        stop()
        if (isSelectionKey(k)) {
          // Enter key - check if active item is a submenu trigger
          const activeRow = activeId ? rows.get(activeId) : null
          if (activeRow?.ref.current) {
            const isSubmenuTrigger =
              activeRow.ref.current.getAttribute('data-submenu-trigger') ===
              'true'
            if (isSubmenuTrigger && onSubmenuOpen) {
              onSubmenuOpen(activeId)
            } else {
              activeRow.ref.current.dispatchEvent(
                new CustomEvent(SELECT_ITEM_EVENT, { bubbles: false }),
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
        const activeRow = activeId ? rows.get(activeId) : null
        if (activeRow?.ref.current) {
          const isSubmenuTrigger =
            activeRow.ref.current.getAttribute('data-submenu-trigger') ===
            'true'
          if (isSubmenuTrigger && onSubmenuOpen) {
            onSubmenuOpen(activeId)
          } else {
            activeRow.ref.current.dispatchEvent(
              new CustomEvent(SELECT_ITEM_EVENT, { bubbles: false }),
            )
          }
        }
        return
      }
    },
    [
      actions,
      rows,
      activeId,
      onKeyDownProp,
      vimBindings,
      dir,
      onEscape,
      onClose,
      onSubmenuOpen,
      disabled,
    ],
  )

  const listProps = {
    ref: refs?.listRef,
    role,
    'data-menu-list': '',
    'aria-activedescendant': isFocused ? undefined : activeId,
    'aria-disabled': disabled,
    'data-disabled': disabled,
    inert: disabled ? true : undefined,
    tabIndex: isFocused ? -1 : 0, // Make the list focusable so it can receive keyboard events
    className,
    style,
    onKeyDown: handleKeyDown,
  }

  const mergedProps = ref ? mergeProps(listProps, { ref } as any) : listProps

  return <div {...(mergedProps as any)}>{children}</div>
}
