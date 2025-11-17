import { MenuInputPrimitive, type SurfaceStore } from '@bazza-ui/menu'
import * as React from 'react'
import { useSubCtx } from '../contexts/submenu-context.js'
import { useScopedTheme } from '../contexts/theme-context.js'
import { useNavKeydown } from '../hooks/use-nav-keydown.js'

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
  /** Callback when root menu should close (e.g., on Escape) */
  onClose?: () => void
}

export function PopupMenuInput<T = unknown>({
  store,
  value,
  onValueChange,
  placeholder = 'Search...',
  className,
  onClose,
}: PopupMenuInputProps<T>) {
  const theme = useScopedTheme()
  const sub = useSubCtx()

  // Determine surface ID from submenu context or default to 'root'
  const surfaceId = React.useMemo(() => sub?.childSurfaceId ?? 'root', [sub])

  // Use centralized keyboard navigation hook
  const handleKeyDown = useNavKeydown('input', surfaceId, onClose)

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
      inputProps={{
        ...(theme?.slotProps?.input as any),
        'data-slot': 'popup-menu-input',
        'data-popup-menu-input': true,
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
