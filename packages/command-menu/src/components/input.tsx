import { cn, mergeProps } from '@bazza-ui/menu'
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

  // Auto-focus input when component mounts
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [inputRef])

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(e.target.value)
    },
    [onValueChange],
  )

  // Handle keyboard navigation from input
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

  const baseInputProps = {
    ref: inputRef,
    type: 'text',
    value: value ?? '',
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    placeholder,
    className: cn(theme?.classNames?.input, className),
    'data-slot': 'command-menu-input' as const,
    'data-command-menu-input': true as const,
  }

  const inputProps = mergeProps(baseInputProps, theme?.slotProps?.input as any)

  const InputSlot = theme?.slots?.Input
  if (InputSlot) {
    return InputSlot({
      value: value ?? '',
      onChange: (v) => onValueChange?.(v),
      bind: {
        getInputProps: (overrides) => mergeProps(inputProps, overrides as any),
      },
      search: {
        query: value ?? '',
      },
    }) as React.ReactElement
  }

  return <input {...inputProps} />
}
