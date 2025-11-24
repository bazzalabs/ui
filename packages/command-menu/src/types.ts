import type {
  Menu as BaseMenu,
  RootMenuDef as BaseMenuDef,
  RootMenuNode as BaseMenuNode,
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
  MenuClassNames,
  MenuSlotProps,
  MenuSlots,
  SeparatorDef,
  SeparatorNode,
} from '@bazza-ui/menu'

// Re-export common types for convenience
export type {
  RootMenuDef,
  RootMenuNode,
  Menu,
  SubmenuDef,
  SubmenuNode,
  NodeDef,
  Node,
  ItemDef,
  ItemNode,
  GroupDef,
  GroupNode,
  SeparatorDef,
  SeparatorNode,
} from '@bazza-ui/menu'
import type { Theme, ThemeDef } from '@bazza-ui/theming'
import type * as React from 'react'

/**
 * Bind API for Dialog Portal slot
 */
export type DialogPortalBindAPI = {
  getDialogPortalProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    'data-slot': 'command-menu-dialog-portal'
  }
}

/**
 * Bind API for Dialog Overlay slot
 */
export type DialogOverlayBindAPI = {
  getDialogOverlayProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    className?: string
    'data-slot': 'command-menu-dialog-overlay'
  }
}

/**
 * Bind API for Dialog Content slot
 */
export type DialogContentBindAPI = {
  getDialogContentProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    className?: string
    'data-slot': 'command-menu-dialog-content'
  }
}

/**
 * Bind API for Dialog Inner slot
 */
export type DialogInnerBindAPI = {
  getDialogInnerProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    ref: React.RefCallback<HTMLDivElement>
    className?: string
    'data-slot': 'command-menu-dialog-inner'
    'data-command-menu-dialog-inner': true
  }
}

/**
 * Command menu specific slots that extend MenuSlots
 */
export type CommandMenuSlots<TData = unknown> = MenuSlots<TData> & {
  /**
   * Slot for customizing the dialog portal
   * Allows custom portal container or behavior
   */
  DialogPortal?: (props: {
    children: React.ReactNode
    bind: DialogPortalBindAPI
  }) => React.ReactElement

  /**
   * Slot for customizing the dialog overlay (backdrop)
   * Useful for custom animations or wrapping with animation libraries
   */
  DialogOverlay?: (props: { bind: DialogOverlayBindAPI }) => React.ReactElement

  /**
   * Slot for customizing the dialog content container
   * Useful for custom animations or wrapping with animation libraries
   */
  DialogContent?: (props: {
    children: React.ReactNode
    bind: DialogContentBindAPI
  }) => React.ReactElement

  /**
   * Slot for customizing the dialog inner content wrapper
   * Useful for applying animations when navigating between submenus
   */
  DialogInner?: (props: {
    children: React.ReactNode
    bind: DialogInnerBindAPI
  }) => React.ReactElement
}

/**
 * Slot props forwarded to command menu elements.
 */
export type CommandMenuSlotProps = MenuSlotProps & {
  dialogPortal?: React.HTMLAttributes<HTMLElement>
  dialogOverlay?: React.HTMLAttributes<HTMLElement>
  dialogContent?: React.HTMLAttributes<HTMLElement>
  dialogInner?: React.HTMLAttributes<HTMLElement>
  breadcrumbs?: React.HTMLAttributes<HTMLElement>
}

export type CommandMenuThemeDef<TData = unknown> = ThemeDef<
  CommandMenuSlots<TData>,
  CommandMenuSlotProps,
  CommandMenuClassNames
>

export type CommandMenuTheme<TData = unknown> = Theme<
  CommandMenuSlots<TData>,
  CommandMenuSlotProps,
  CommandMenuClassNames
>

export type CommandMenuClassNames = MenuClassNames & {
  dialogPortal?: string
  dialogOverlay?: string
  dialogContent?: string
  dialogInner?: string
  breadcrumbs?: string
  breadcrumbItem?: string
  breadcrumbSeparator?: string
  backButton?: string
}

/* ================================================================================================
 * Command Node Type System
 * ============================================================================================== */

/**
 * Command submenu definition with properly typed slots, slotProps, and classNames.
 */
export type CommandSubmenuDef<T = unknown, TChild = unknown> = Omit<
  BaseSubmenuDef<
    T,
    TChild,
    CommandMenuSlots<TChild>,
    CommandMenuSlotProps,
    CommandMenuClassNames
  >,
  'ui' | 'nodes'
> & {
  ui?: CommandMenuThemeDef<TChild>
  nodes?: CommandNodeDef<TChild>[]
}

/**
 * Union of all node definition types usable in command menus.
 */
export type CommandNodeDef<TData = unknown> =
  | ItemDef<TData>
  | GroupDef<TData>
  | SeparatorDef
  | LoadingDef
  | CommandSubmenuDef<TData, any>

/**
 * Command submenu runtime node.
 */
export type CommandSubmenuNode<
  TData = unknown,
  TChild = unknown,
> = BaseSubmenuNode<TData, TChild> & {
  def: CommandSubmenuDef<TData, TChild>
  parent: CommandMenu<TData>
  child: CommandMenu<TChild>
  nodes: CommandNode<TChild>[]
}

/**
 * Union of all runtime node types in command menus.
 * This is the complete CommandNode type that represents any node in a command menu.
 */
export type CommandNode<TData = unknown> =
  | ItemNode<TData>
  | GroupNode<TData>
  | SeparatorNode
  | LoadingNode
  | CommandSubmenuNode<TData, any>

/**
 * Command menu runtime type.
 */
export type CommandMenu<TData = unknown> = BaseMenu<TData> & {
  nodes: CommandNode<TData>[]
}

/**
 * Command menu definition with properly typed slots, slotProps, and classNames.
 * This is the recommended type to use for command menu data structures.
 */
export type CommandMenuDef<TData = unknown> = Omit<
  BaseMenuDef<
    TData,
    CommandMenuSlots<TData>,
    CommandMenuSlotProps,
    CommandMenuClassNames
  >,
  'ui' | 'nodes'
> & {
  ui?: CommandMenuThemeDef<TData>
  nodes?: CommandNodeDef<TData>[]
}

export interface CommandMenuProps<TData = unknown> {
  /** Controlled open state */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean
  /** Menu definition */
  menu: CommandMenuDef<TData>
  /** Enable vim key bindings (Ctrl+j/k/n/p for navigation) */
  vimBindings?: boolean
  /** Text direction */
  dir?: 'ltr' | 'rtl'
  /** Whether to show breadcrumbs when navigating submenus */
  showBreadcrumbs?: boolean
  /** Callback when query changes (for clearing on navigation) */
  onQueryChange?: (query: string) => void
  /** Callback when submenu navigation occurs */
  onNavigationChange?: (event: NavigationChangeEvent) => void
  /** Ref for programmatic control of the command menu */
  controlRef?: React.Ref<import('./control.js').CommandMenuControl<TData>>
  /** Children (optional trigger) */
  children?: React.ReactNode
}

export interface CommandMenuTriggerProps {
  /** Keyboard shortcut to open the command menu */
  shortcut?: string | string[]
  /** Whether the trigger is disabled */
  disabled?: boolean
  /** Children (optional button) */
  children?: React.ReactNode
}

/**
 * Navigation stack entry for paged navigation
 * @internal
 */
export type NavigationStackEntry = {
  menuId: string
  menuTitle?: string
  parentMenuId?: string
}

/**
 * Event fired when submenu navigation occurs
 */
export type NavigationChangeEvent = {
  /** Direction of navigation */
  direction: 'forward' | 'back'
  /** Previous navigation stack state */
  prevBreadcrumbs: NavigationStackEntry[]
  /** New navigation stack state */
  nextBreadcrumbs: NavigationStackEntry[]
}
