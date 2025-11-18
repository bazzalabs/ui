import type { MenuDef } from '@bazza-ui/menu'
import type { PopupMenuThemeDef } from '@bazza-ui/popup-menu'
import type * as React from 'react'

export interface DropdownMenuProps<T = unknown> {
  /** The menu definition */
  menu: MenuDef<T>
  /** Trigger element - will open dropdown menu on click */
  children: React.ReactNode
  /** Callback when menu opens/closes */
  onOpenChange?: (open: boolean) => void
  /** Whether the menu is open (controlled) */
  open?: boolean
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean
  /** Whether clicking outside closes the menu */
  modal?: boolean
  /** Theme customization */
  theme?: PopupMenuThemeDef<T>
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
}
