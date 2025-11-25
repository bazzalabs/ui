import type {
  Menu as BaseMenu,
  MenuDef as BaseMenuDef,
  BaseNode,
  BaseNodeDef,
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
 * Context Node Type System
 * ============================================================================================== */

/**
 * Context submenu definition with properly typed slots, slotProps, and classNames.
 */
export type ContextSubmenuDef<TData = unknown, TChild = unknown> = Omit<
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
  nodes?: ContextNodeDef<TChild>[]
}

/**
 * Union of all node definition types usable in context menus.
 */
export type ContextNodeDef<TData = unknown> =
  | ItemDef<TData>
  | GroupDef<TData>
  | ContextSubmenuDef<TData, any>
  | SeparatorDef
  | LoadingDef

/**
 * Context submenu runtime node.
 */
export type ContextSubmenuNode<
  TData = unknown,
  TChild = unknown,
> = BaseSubmenuNode<TData, TChild> & {
  def: ContextSubmenuDef<TData, TChild>
  parent: ContextMenu<TData>
  child: ContextMenu<TChild>
  nodes: ContextNode<TChild>[]
}

/**
 * Union of all runtime node types in context menus.
 */
export type ContextNode<TData = unknown> =
  | ItemNode<TData>
  | GroupNode<TData>
  | SeparatorNode
  | LoadingNode
  | ContextSubmenuNode<TData, any>

/**
 * Context menu runtime type.
 */
export type ContextMenu<TData = unknown> = BaseMenu & {
  nodes: ContextNode<TData>[]
}

/**
 * Context menu definition with properly typed slots, slotProps, and classNames.
 */
export type ContextMenuDef<TData = unknown> = Omit<
  BaseMenuDef<
    TData,
    PopupMenuSlots<TData>,
    PopupMenuSlotProps,
    PopupMenuClassNames
  >,
  'ui' | 'nodes'
> & {
  ui?: PopupMenuThemeDef<TData>
  nodes?: ContextNodeDef<TData>[]
}

export type {
  ContextNodeDef as NodeDef,
  ContextMenuDef as MenuDef,
  ContextSubmenuDef as SubmenuDef,
}

export interface ContextMenuProps<TData = unknown> {
  /** The menu definition */
  menu: ContextMenuDef<TData>
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
  theme?: PopupMenuThemeDef<TData>
  /** Placeholder for search input */
  placeholder?: string
  /** Whether to show debug visuals */
  debug?: boolean
  /** Ref for programmatic control of the context menu */
  controlRef?: React.Ref<import('./control.js').ContextMenuControl<TData>>
}
