import type {
  MenuDef,
  Node,
  ItemNode,
  SubmenuNode,
  GroupNode,
  SeparatorNode,
  InputBindAPI,
  InputSearchState,
} from '@bazza-ui/menu'
import type * as React from 'react'
import type { Theme, ThemeDef } from '@bazza-ui/theming'
import type { Popover } from '@base-ui-components/react/popover'

export type ContextMenuProps<T = unknown> = {
  /** The menu definition */
  menu: MenuDef<T>
  /** Trigger element - will open context menu on right-click */
  children: React.ReactNode
  /** Callback when menu opens/closes */
  onOpenChange?: (open: boolean) => void
  /** Whether the menu is open (controlled) */
  open?: boolean
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean
  /** Whether to show debug visuals for aim guard */
  debug?: boolean
  /** Whether clicking outside closes the menu */
  modal?: boolean
}

export type Children = {
  children: React.ReactNode
}

export type ContextMenuRootContextValue = {
  scopeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
  modal: boolean
  debug: boolean
  anchorPoint: { x: number; y: number } | null
  setAnchorPoint: (point: { x: number; y: number } | null) => void
  closeAllSurfaces: () => void
}

/* ================================================================================================
 * Bind API Types (wiring helpers for slots)
 * ============================================================================================== */

/** Row wiring helpers provided to Item and SubmenuTrigger slots. */
export type RowBindAPI = {
  focused: boolean
  disabled: boolean
  getRowProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    ref: React.Ref<any>
    tabIndex: number
    'data-focused': boolean
    'data-disabled'?: boolean
    'aria-disabled'?: boolean
  }
}

/** Content/surface wiring helpers provided to Content slot. */
export type ContentBindAPI = {
  getContentProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    ref: React.Ref<any>
    role: 'menu'
    tabIndex: -1
    'data-slot': 'context-menu-content'
    'data-context-menu-surface': true
  }
}

/** List wiring helpers provided to List slot. */
export type ListBindAPI = {
  getListProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    ref: React.Ref<any>
    role: 'menu'
    tabIndex: number
    'data-slot': 'context-menu-list'
    'data-context-menu-list': true
  }
  getItemOrder: () => string[]
  getActiveId: () => string | null
}

/** Group heading wiring helpers provided to GroupHeading slot. */
export type GroupHeadingBindAPI = {
  getGroupHeadingProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    className?: string
    'data-group-size'?: number
  }
}

/* ================================================================================================
 * Slot Types
 * ============================================================================================== */

/** Slot renderers to customize context menu visuals. */
export type ContextMenuSlots<T = unknown> = {
  Content: (args: {
    children: React.ReactNode
    bind: ContentBindAPI
  }) => React.ReactNode
  Input?: (args: {
    value: string
    onChange: (value: string) => void
    bind: InputBindAPI
    search: InputSearchState
  }) => React.ReactNode
  List: (args: {
    children: React.ReactNode
    bind: ListBindAPI
  }) => React.ReactNode
  Item: (args: {
    node: ItemNode<T>
    bind: RowBindAPI
  }) => React.ReactNode
  SubmenuTrigger: (args: {
    node: SubmenuNode<T>
    bind: RowBindAPI
  }) => React.ReactNode
  GroupHeading?: (args: {
    node: GroupNode<T>
    bind: GroupHeadingBindAPI
  }) => React.ReactNode
  Separator?: (args: { node: SeparatorNode }) => React.ReactNode
}

/* ================================================================================================
 * SlotProps Types
 * ============================================================================================== */

/** Positioner slot props type */
export type PositionerSlotProps =
  | Partial<Omit<React.ComponentProps<typeof Popover.Positioner>, 'children'>>
  | {
      root?: Partial<Omit<React.ComponentProps<typeof Popover.Positioner>, 'children'>>
      sub?: Partial<Omit<React.ComponentProps<typeof Popover.Positioner>, 'children'>>
    }

/** Slot props forwarded to context menu elements. */
export type ContextMenuSlotProps = {
  positioner?: PositionerSlotProps
  content?: React.HTMLAttributes<HTMLElement>
  input?: React.InputHTMLAttributes<HTMLInputElement>
  list?: React.HTMLAttributes<HTMLElement>
}

/* ================================================================================================
 * ClassNames Types
 * ============================================================================================== */

/** ClassNames for styling context menu elements. */
export type ContextMenuClassNames = {
  positioner?: string
  content?: string
  input?: string
  list?: string
  item?: string
  subtrigger?: string
  groupHeading?: string
  separator?: string
}

/* ================================================================================================
 * Theme Types
 * ============================================================================================== */

/** Theme definition for context menu (partial overrides). */
export type ContextMenuThemeDef<T = unknown> = ThemeDef<
  ContextMenuSlots<T>,
  ContextMenuSlotProps,
  ContextMenuClassNames
>

/** Complete theme for context menu (all slots required). */
export type ContextMenuTheme<T = unknown> = Theme<
  ContextMenuSlots<T>,
  ContextMenuSlotProps,
  ContextMenuClassNames
>
