import type {
  MenuDef as BaseMenuDef,
  SubmenuDef as BaseSubmenuDef,
  GroupDef,
  ItemDef,
  LoadingDef,
  MenuClassNames,
  MenuSlotProps,
  MenuSlots,
  SeparatorDef,
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
export type CommandMenuSlots<T = unknown> = MenuSlots<T> & {
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

export type CommandMenuThemeDef<T = unknown> = ThemeDef<
  CommandMenuSlots<T>,
  CommandMenuSlotProps,
  CommandMenuClassNames
>

export type CommandMenuTheme<T = unknown> = Theme<
  CommandMenuSlots<T>,
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

/**
 * Command menu definition with properly typed slots, slotProps, and classNames.
 * This is the recommended type to use for command menu data structures.
 */
export type CommandMenuDef<T = unknown> = Omit<
  BaseMenuDef<
    T,
    CommandMenuSlots<T>,
    CommandMenuSlotProps,
    CommandMenuClassNames
  >,
  'ui' | 'nodes'
> & {
  ui?: CommandMenuThemeDef<T>
  nodes?: CommandNodeDef<T>[]
}

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
 * Union of all node types usable in command menus.
 * Use this when you need to specify a single node type.
 */
export type CommandNodeDef<T = unknown> =
  | ItemDef<T>
  | GroupDef<T>
  | SeparatorDef
  | LoadingDef
  | CommandSubmenuDef<T>

export interface CommandMenuProps<T = unknown> {
  /** Controlled open state */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean
  /** Menu definition */
  menu: CommandMenuDef<T>
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
  controlRef?: React.Ref<import('./control.js').CommandMenuControl<T>>
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
