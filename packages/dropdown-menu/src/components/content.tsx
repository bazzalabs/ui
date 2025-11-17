import type { MenuDef } from '@bazza-ui/menu'
import { Popover } from '@base-ui-components/react/popover'
import { PopupMenuContent } from '@bazza-ui/popup-menu'
import { useScopedTheme } from '@bazza-ui/popup-menu'
import * as React from 'react'
import { useRootContext } from '../contexts/root-context.js'

export interface DropdownMenuContentProps<T = unknown> {
  /** Menu definition (optional if provided to Root) */
  menu?: MenuDef<T>
  /** Placeholder for search input */
  placeholder?: string
  /** Side of the trigger to position the menu */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Alignment relative to the trigger */
  align?: 'start' | 'center' | 'end'
  /** Offset from the trigger */
  sideOffset?: number
}

/**
 * DropdownMenuContent - Renders the popup menu content relative to trigger
 */
export function DropdownMenuContent<T = unknown>({
  menu: menuProp,
  placeholder = 'Search...',
  side = 'bottom',
  align = 'start',
  sideOffset = 4,
}: DropdownMenuContentProps<T>) {
  const { open, closeAllSurfaces, triggerRef } = useRootContext()
  const theme = useScopedTheme()
  const contentRef = React.useRef<HTMLDivElement>(null)

  if (!open) {
    return null
  }

  return (
    <Popover.Portal>
      <Popover.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={theme?.classNames?.positioner}
        anchor={triggerRef.current}
      >
        <Popover.Popup>
          {menuProp && (
            <PopupMenuContent
              menu={menuProp}
              open={open}
              onClose={closeAllSurfaces}
              contentRef={contentRef as any}
              placeholder={placeholder}
            />
          )}
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  )
}
