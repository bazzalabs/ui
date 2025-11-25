import { MenuInputPrimitive } from '@bazza-ui/menu'
import type * as React from 'react'
import { useScopedTheme } from '../../contexts/theme-context.js'
import { usePopupMenuStoreApi, useSurfaceMenu } from '../../store/index.js'
import { useSurface } from '../surface/surface-provider.js'

export interface PopupMenuInputProps<T = unknown> {
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
  value,
  onValueChange,
  placeholder: placeholderProp,
  className,
}: PopupMenuInputProps<T>) {
  const theme = useScopedTheme()
  const { surfaceId, control } = useSurface()
  const menu = useSurfaceMenu(surfaceId)
  const globalStore = usePopupMenuStoreApi<T>()

  // Get disabled state from control
  const disabled = control?.getState().disabled ?? false

  const searchState = {
    query: value ?? '',
  }

  const mergedClassName = [theme?.classNames?.input, className]
    .filter(Boolean)
    .join(' ')

  const placeholder =
    placeholderProp ??
    menu?.inputPlaceholder ??
    theme.slotProps?.input?.placeholder

  return (
    <MenuInputPrimitive
      surfaceId={surfaceId}
      globalStore={globalStore as any}
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
