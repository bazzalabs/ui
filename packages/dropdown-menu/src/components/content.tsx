import type { MenuDef, MenuNodeDefaults } from '@bazza-ui/menu'
import {
  type PopupMenuDef,
  type PopupSubmenuDef,
  Positioner,
  Surface,
} from '@bazza-ui/popup-menu'
import * as React from 'react'
import { useRootContext } from '../contexts/root-context.js'

export interface DropdownMenuContentProps<T = unknown> {
  /** Menu definition (optional if provided to Root) */
  menu?: PopupMenuDef<T> | PopupSubmenuDef<T>
  /** Placeholder for search input */
  placeholder?: string
  /** Which side to position the menu on */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** How to align the menu with the trigger */
  align?: 'start' | 'center' | 'end'
  /** Offset from the trigger (perpendicular to side) */
  sideOffset?: number
  /** Offset along the alignment axis */
  alignOffset?: number
  /** Whether the popup should track the anchor element's position (default: true) */
  trackAnchor?: boolean
  /** Default configurations for menu behavior */
  defaults?: Partial<MenuNodeDefaults<T>>
}

/**
 * DropdownMenuContent - Renders the popup menu content anchored to the trigger
 * Uses popup-menu's Positioner for consistent theming integration
 */
export function DropdownMenuContent<T = unknown>({
  menu: menuProp,
  placeholder,
  side = 'bottom',
  align = 'start',
  sideOffset = 4,
  alignOffset = 0,
  trackAnchor,
  defaults,
}: DropdownMenuContentProps<T>) {
  const { open, closeAllSurfaces, triggerRef, control } = useRootContext<T>()
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Extract surface defaults for Surface props
  const vimBindings = defaults?.surface?.vimBindings ?? true
  const dir = defaults?.surface?.dir ?? 'ltr'

  // Use trigger element as anchor
  if (!triggerRef.current || !menuProp) {
    return null
  }

  return (
    <Positioner
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      trackAnchor={trackAnchor}
      anchor={triggerRef.current}
    >
      <Surface
        menu={menuProp}
        open={open}
        onClose={closeAllSurfaces}
        contentRef={contentRef}
        placeholder={placeholder}
        vimBindings={vimBindings}
        dir={dir}
        defaults={defaults as any}
        control={control}
      />
    </Positioner>
  )
}
