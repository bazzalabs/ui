import { cn, MenuInputPrimitive } from '@bazza-ui/menu'
import * as React from 'react'
import { useCommandMenuContext } from '../context.js'
import { useScopedTheme } from '../contexts/theme-context.js'
import { useSurface } from './surface-provider.js'

export interface CommandMenuInputProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export function CommandMenuInput({
  value,
  onValueChange,
  placeholder = 'Type a command or search...',
  className,
}: CommandMenuInputProps) {
  const theme = useScopedTheme()
  const { store } = useSurface()
  const { vimBindings, dir, popSubmenu, isInSubmenu, onOpenChange, inputRef } =
    useCommandMenuContext()

  // Sync context inputRef with store inputRef
  // (command-menu uses context inputRef for focus management)
  React.useEffect(() => {
    if (inputRef.current && store.inputRef.current !== inputRef.current) {
      ;(store.inputRef as React.MutableRefObject<HTMLInputElement | null>).current =
        inputRef.current
    }
  })

  // Auto-focus input when component mounts
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [inputRef])

  // Handle keyboard navigation from input (command-menu specific)
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const k = e.key

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
        if (e.ctrlKey && e.key === 'h') {
          e.preventDefault()
          if (isInSubmenu) {
            popSubmenu()
          }
          return
        }
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

      // Enter - trigger select on active item
      if (k === 'Enter') {
        e.preventDefault()
        const activeId = store.snapshot().activeId
        const activeRow = activeId ? store.rows.get(activeId) : null
        if (activeRow?.ref.current) {
          activeRow.ref.current.dispatchEvent(
            new CustomEvent('menu:selectItem', { bubbles: false }),
          )
        }
        return
      }

      // Escape - close dialog
      if (k === 'Escape') {
        e.preventDefault()
        onOpenChange(false)
        return
      }

      // Left arrow - go back from submenu
      if (k === 'ArrowLeft' && dir === 'ltr') {
        if (isInSubmenu) {
          e.preventDefault()
          popSubmenu()
        }
        return
      }
      if (k === 'ArrowRight' && dir === 'rtl') {
        if (isInSubmenu) {
          e.preventDefault()
          popSubmenu()
        }
        return
      }
    },
    [store, vimBindings, dir, isInSubmenu, popSubmenu, onOpenChange],
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
        'data-slot': 'command-menu-input',
        'data-command-menu-input': true,
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
