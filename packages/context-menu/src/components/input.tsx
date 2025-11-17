import {
  cn,
  MenuInputPrimitive,
  isOpenKey,
  isCloseKey,
  isVimOpen,
  isVimClose,
  type SurfaceStore,
} from '@bazza-ui/menu'
import * as React from 'react'
import { useScopedTheme } from '../contexts/theme-context.js'
import { useRootCtx } from '../contexts/root-context.js'

export interface ContextMenuInputProps<T = unknown> {
  /** Surface store for state management */
  store: SurfaceStore<T>
  /** Current value */
  value?: string
  /** Value change handler */
  onValueChange?: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Additional className */
  className?: string
  /** Enable vim key bindings (Ctrl+j/k/n/p for navigation, Ctrl+h/l for submenu) */
  vimBindings?: boolean
  /** Text direction for submenu navigation (left/right arrows) */
  dir?: 'ltr' | 'rtl'
  /** Callback when menu should close */
  onClose?: () => void
  /** Callback when submenu should open */
  onSubmenuOpen?: (activeId: string | null) => void
}

export function ContextMenuInput<T = unknown>({
  store,
  value,
  onValueChange,
  placeholder = 'Search...',
  className,
  vimBindings = false,
  dir = 'ltr',
  onClose,
  onSubmenuOpen,
}: ContextMenuInputProps<T>) {
  const theme = useScopedTheme()
  const root = useRootCtx()

  // Handle keyboard navigation from input (context-menu specific)
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const k = e.key
      const activeId = store.snapshot().activeId

      // Vim bindings
      if (vimBindings) {
        if (e.ctrlKey && (e.key === 'n' || e.key === 'j')) {
          e.preventDefault()
          store.next('keyboard')
          return
        }
        if (e.ctrlKey && (e.key === 'p' || e.key === 'k')) {
          e.preventDefault()
          store.prev('keyboard')
          return
        }
        if (isVimOpen(e)) {
          e.preventDefault()
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
        if (isVimClose(e)) {
          e.preventDefault()
          onClose?.()
          return
        }
      }

      // Tab - prevent default
      if (k === 'Tab') {
        e.preventDefault()
        return
      }

      // Arrow navigation
      if (k === 'ArrowDown') {
        e.preventDefault()
        store.next('keyboard')
        return
      }
      if (k === 'ArrowUp') {
        e.preventDefault()
        store.prev('keyboard')
        return
      }

      // Page navigation
      if (k === 'Home' || k === 'PageUp') {
        e.preventDefault()
        store.first('keyboard')
        return
      }
      if (k === 'End' || k === 'PageDown') {
        e.preventDefault()
        store.last('keyboard')
        return
      }

      // Submenu open keys (Enter or Right arrow in LTR, Left in RTL)
      if (isOpenKey(dir, k)) {
        e.preventDefault()
        const activeRow = activeId ? store.rows.get(activeId) : null
        if (activeRow?.ref.current) {
          const isSubmenuTrigger =
            activeRow.ref.current.getAttribute('data-submenu-trigger') === 'true'
          if (k === 'Enter' || k === ' ') {
            // Enter/Space - select or open submenu
            if (isSubmenuTrigger && onSubmenuOpen) {
              onSubmenuOpen(activeId)
            } else {
              activeRow.ref.current.dispatchEvent(
                new CustomEvent('menu:selectItem', { bubbles: false }),
              )
            }
          } else {
            // Right/Left arrow - open submenu if available
            if (isSubmenuTrigger) {
              onSubmenuOpen?.(activeId)
            }
          }
        }
        return
      }

      // Submenu close keys (Left arrow in LTR, Right in RTL)
      if (isCloseKey(dir, k)) {
        e.preventDefault()
        onClose?.()
        return
      }

      // Escape - close menu
      if (k === 'Escape') {
        e.preventDefault()
        root.onOpenChange(false)
        return
      }
    },
    [store, vimBindings, dir, onClose, onSubmenuOpen, root],
  )

  const searchState = {
    query: value ?? '',
  }

  return (
    <MenuInputPrimitive
      store={store}
      value={value ?? ''}
      onChange={(v) => onValueChange?.(v)}
      placeholder={placeholder}
      className={cn(theme?.classNames?.input, className)}
      searchState={searchState}
      inputProps={{
        ...(theme?.slotProps?.input as any),
        'data-slot': 'context-menu-input',
        'data-context-menu-input': true,
      }}
      onKeyDown={handleKeyDown}
    >
      {theme?.slots?.Input
        ? (bind, search) =>
            theme.slots.Input({
              value: value ?? '',
              onChange: (v) => onValueChange?.(v),
              bind,
              search,
            }) as React.ReactElement
        : undefined}
    </MenuInputPrimitive>
  )
}
