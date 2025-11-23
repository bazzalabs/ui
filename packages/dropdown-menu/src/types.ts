import type {
  Menu as BaseMenu,
  MenuDef as BaseMenuDef,
  SubmenuDef as BaseSubmenuDef,
  SubmenuNode as BaseSubmenuNode,
  GroupDef,
  GroupNode,
  ItemDef,
  ItemNode,
  LoadingDef,
  LoadingNode,
  SeparatorDef,
  SeparatorNode,
} from '@bazza-ui/menu'
import type {
  PopupMenuClassNames,
  PopupMenuSlotProps,
  PopupMenuSlots,
  PopupMenuThemeDef,
} from '@bazza-ui/popup-menu'
import type * as React from 'react'

/* ================================================================================================
 * Dropdown Node Type System
 * ============================================================================================== */

/**
 * Dropdown submenu definition with properly typed slots, slotProps, and classNames.
 */
export type DropdownSubmenuDef<TData = unknown, TChild = unknown> = Omit<
  BaseSubmenuDef<
    TData,
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
 * Union of all node definition types usable in dropdown menus.
 */
export type DropdownNodeDef<TData = unknown> =
  | ItemDef<TData>
  | GroupDef<TData>
  | DropdownSubmenuDef<TData, any>
  | SeparatorDef
  | LoadingDef

/**
 * Dropdown submenu runtime node.
 */
export type DropdownSubmenuNode<
  TData = unknown,
  TChild = unknown,
> = BaseSubmenuNode<TData, TChild> & {
  def: DropdownSubmenuDef<TData, TChild>
  parent: DropdownMenu<TData>
  child: DropdownMenu<TChild>
  nodes: DropdownNode<TChild>[]
}

/**
 * Union of all runtime node types in dropdown menus.
 */
export type DropdownNode<TData = unknown> =
  | ItemNode<TData>
  | GroupNode<TData>
  | SeparatorNode
  | LoadingNode
  | DropdownSubmenuNode<TData, any>

/**
 * Dropdown menu runtime type.
 */
export type DropdownMenu<TData = unknown> = BaseMenu & {
  nodes: DropdownNode<TData>[]
}

/**
 * Dropdown menu definition with properly typed slots, slotProps, and classNames.
 */
export type DropdownMenuDef<TData = unknown> = Omit<
  BaseMenuDef<
    TData,
    PopupMenuSlots<TData>,
    PopupMenuSlotProps,
    PopupMenuClassNames
  >,
  'ui' | 'nodes'
> & {
  ui?: PopupMenuThemeDef<TData>
  nodes?: DropdownNodeDef<TData>[]
}

export interface DropdownMenuProps<TData = unknown> {
  /** The menu definition */
  menu: DropdownMenuDef<TData>
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
  theme?: PopupMenuThemeDef<TData>
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
