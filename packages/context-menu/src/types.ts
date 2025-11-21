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
 * Context menu definition with properly typed slots, slotProps, and classNames.
 * This is the recommended type to use for context menu data structures.
 */
export type ContextMenuDef<T = unknown> = Omit<
  BaseMenuDef<T, PopupMenuSlots<T>, PopupMenuSlotProps, PopupMenuClassNames>,
  'ui'
> & {
  ui?: PopupMenuThemeDef<T>
}

/**
 * Context submenu definition with properly typed slots, slotProps, and classNames.
 */
export type ContextSubmenuDef<T = unknown, TChild = unknown> = Omit<
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
  nodes?: ContextNodeDef<TChild>[]
}

/**
 * Union of all node types usable in context menus.
 * Use this when you need to specify a single node type.
 */
export type ContextNodeDef<T = unknown> =
  | ItemDef<T>
  | GroupDef<T>
  | ContextSubmenuDef<T, any>
  | SeparatorDef
  | LoadingDef

export type {
  ContextNodeDef as NodeDef,
  ContextMenuDef as MenuDef,
  ContextSubmenuDef as SubmenuDef,
}

export interface ContextMenuProps<T = unknown> {
  /** The menu definition */
  menu: ContextMenuDef<T>
  /** Trigger element - will open context menu on right-click */
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
  /** Whether to show debug visuals */
  debug?: boolean
}
