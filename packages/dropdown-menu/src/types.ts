import type {
  MenuDef as BaseMenuDef,
  SubmenuDef as BaseSubmenuDef,
  ItemDef,
  GroupDef,
  SeparatorDef,
  LoadingDef,
} from '@bazza-ui/menu'
import type {
  PopupMenuThemeDef,
  PopupMenuSlots,
  PopupMenuSlotProps,
  PopupMenuClassNames,
} from '@bazza-ui/popup-menu'
import type * as React from 'react'

/**
 * Dropdown menu definition with properly typed slots, slotProps, and classNames.
 * This is the recommended type to use for dropdown menu data structures.
 */
export type DropdownMenuDef<T = unknown> = Omit<
  BaseMenuDef<T, PopupMenuSlots<T>, PopupMenuSlotProps, PopupMenuClassNames>,
  'ui' | 'nodes'
> & {
  ui?: PopupMenuThemeDef<T>
  nodes?: DropdownNodeDef<T>[]
}

/**
 * Dropdown submenu definition with properly typed slots, slotProps, and classNames.
 */
export type DropdownSubmenuDef<T = unknown, TChild = unknown> = Omit<
  BaseSubmenuDef<
    T,
    TChild,
    PopupMenuSlots<TChild>,
    PopupMenuSlotProps,
    PopupMenuClassNames
  >,
  'ui' | 'nodes'
> & {
  ui?: PopupMenuThemeDef<TChild>
  nodes?: DropdownNodeDef<TChild>[]
}

/**
 * Union of all node types usable in dropdown menus.
 * Use this when you need to specify a single node type.
 */
export type DropdownNodeDef<T = unknown> =
  | ItemDef<T>
  | GroupDef<T>
  | DropdownSubmenuDef<T>
  | SeparatorDef
  | LoadingDef

export interface DropdownMenuProps<T = unknown> {
  /** The menu definition */
  menu: DropdownMenuDef<T>
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
