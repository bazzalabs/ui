import { MenuInputPrimitive, type SurfaceStore } from '@bazza-ui/menu'
import type * as React from 'react'
import { useScopedTheme } from '../../contexts/theme-context.js'
import { useSurface } from '../surface/surface-provider.js'

export interface PopupMenuInputProps<T = unknown> {
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
}

export function PopupMenuInput<T = unknown>({
  store,
  value,
  onValueChange,
  placeholder = 'Search...',
  className,
}: PopupMenuInputProps<T>) {
  const theme = useScopedTheme()
  const surface = useSurface()

  // Get disabled state from control
  const disabled = surface.control?.getState().disabled ?? false

  const searchState = {
    query: value ?? '',
  }

  const mergedClassName = [theme?.classNames?.input, className]
    .filter(Boolean)
    .join(' ')

  return (
    <MenuInputPrimitive
      store={store}
      value={value ?? ''}
      onChange={(v) => onValueChange?.(v)}
      placeholder={placeholder}
      className={mergedClassName}
      searchState={searchState}
      disabled={disabled}
      inputProps={
        {
          ...theme?.slotProps?.input,
          'data-slot': 'popup-menu-input',
          'data-popup-menu-input': true,
        } as React.HTMLAttributes<HTMLInputElement>
      }
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
