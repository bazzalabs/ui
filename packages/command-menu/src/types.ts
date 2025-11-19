import type {
  MenuClassNames,
  MenuDef,
  MenuSlotProps,
  MenuSlots,
} from '@bazza-ui/menu'
import type { Theme, ThemeDef } from '@bazza-ui/theming'
import type * as React from 'react'

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
    /** Base props for the portal */
    baseProps: {
      className?: string
      'data-slot': 'command-menu-dialog-portal'
    }
  }) => React.ReactElement

  /**
   * Slot for customizing the dialog overlay (backdrop)
   * Useful for custom animations or wrapping with animation libraries
   */
  DialogOverlay?: (props: {
    /** Base props that must be applied for Radix Dialog to work */
    baseProps: {
      className?: string
      'data-slot': 'command-menu-dialog-overlay'
    }
  }) => React.ReactElement

  /**
   * Slot for customizing the dialog content container
   * Useful for custom animations or wrapping with animation libraries
   */
  DialogContent?: (props: {
    children: React.ReactNode
    /** Base props that must be applied for Radix Dialog to work */
    baseProps: {
      className?: string
      'data-slot': 'command-menu-dialog-content'
    }
  }) => React.ReactElement

  /**
   * Slot for customizing the dialog inner content wrapper
   * Useful for applying animations when navigating between submenus
   */
  DialogInner?: (props: {
    children: React.ReactNode
    /** Base props that must be applied for ResizeObserver to work */
    baseProps: {
      ref: React.RefCallback<HTMLDivElement>
      className?: string
      'data-slot': 'command-menu-dialog-inner'
      'data-command-menu-dialog-inner': true
    }
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

export interface CommandMenuProps<T = unknown> {
  /** Controlled open state */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean
  /** Menu definition */
  menu: MenuDef<T>
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
