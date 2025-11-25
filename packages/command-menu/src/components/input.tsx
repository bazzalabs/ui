import { MenuInputPrimitive } from '@bazza-ui/menu'
import { cn } from '@bazza-ui/theming'
import * as React from 'react'
import { useCommandMenuContext } from '../context.js'
import { useScopedTheme } from '../contexts/theme-context.js'
import { useAutoFocus } from '../hooks/use-auto-focus.js'
import { useInputKeyboard } from '../hooks/use-input-keyboard.js'
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
  const {
    vimBindings,
    dir,
    popSubmenu,
    isInSubmenu,
    onOpenChange,
    inputRef,
    currentMenu,
    disabled,
  } = useCommandMenuContext()

  // Sync store inputRef to context inputRef
  // MenuInputPrimitive uses store.inputRef, but command-menu context uses inputRef
  // So we need to sync from store.inputRef (source) to inputRef (destination)
  React.useEffect(() => {
    if (store.inputRef.current && inputRef.current !== store.inputRef.current) {
      ;(inputRef as React.MutableRefObject<HTMLInputElement | null>).current =
        store.inputRef.current
    }
  })

  // Auto-focus when menu changes (extracted to hook)
  useAutoFocus(inputRef, currentMenu.id)

  // Keyboard navigation (extracted to hook)
  const handleKeyDown = useInputKeyboard({
    store,
    vimBindings,
    dir,
    isInSubmenu,
    popSubmenu,
    onOpenChange,
  })

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
      disabled={disabled}
      inputProps={
        {
          ...theme?.slotProps?.input,
          'data-slot': 'command-menu-input',
          'data-command-menu-input': true,
        } as React.InputHTMLAttributes<HTMLInputElement>
      }
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
