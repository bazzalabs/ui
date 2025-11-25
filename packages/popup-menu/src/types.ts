import type { Popover } from '@base-ui-components/react/popover'
import type {
  Menu as BaseMenu,
  MenuDef as BaseMenuDef,
  BaseNode,
  BaseNodeDef,
  SubmenuDef as BaseSubmenuDef,
  SubmenuNode as BaseSubmenuNode,
  GroupDef,
  GroupNode,
  InputBindAPI,
  InputSearchState,
  ItemDef,
  ItemNode,
  LoadingDef,
  LoadingNode,
  LoadMode,
  Menu,
  ContentBindAPI as MenuContentBindAPI,
  GroupHeadingBindAPI as MenuGroupHeadingBindAPI,
  ListBindAPI as MenuListBindAPI,
  RowBindAPI as MenuRowBindAPI,
  SearchContext,
  SeparatorDef,
  SeparatorNode,
} from '@bazza-ui/menu'
import type { Theme, ThemeDef } from '@bazza-ui/theming'
import type * as React from 'react'

/* ================================================================================================
 * Bind API Types
 * ============================================================================================== */
export type RowBindAPI = MenuRowBindAPI
export type ContentBindAPI = MenuContentBindAPI
export type ListBindAPI = MenuListBindAPI
export type GroupHeadingBindAPI = MenuGroupHeadingBindAPI

/* ================================================================================================
 * Context Types
 * ============================================================================================== */
export type ActivationCause = 'keyboard' | 'pointer' | 'programmatic'

export type HoverPolicy = {
  suppressHoverOpen: boolean
  clearSuppression: () => void
  aimGuardActive: boolean
  guardedTriggerId: string | null
  activateAimGuard: (triggerId: string, timeoutMs?: number) => void
  clearAimGuard: () => void
  aimGuardActiveRef: React.RefObject<boolean | null>
  guardedTriggerIdRef: React.RefObject<string | null>
  isGuardBlocking: (rowId: string) => boolean
}

export type FocusOwnerCtxValue = {
  ownerId: string | null
  setOwnerId: (id: string | null) => void
}

export type Direction = 'ltr' | 'rtl'

export type KeyboardOptions = { dir: Direction; vimBindings: boolean }

/* ================================================================================================
 * ClassNames Types
 * ============================================================================================== */
export type PopupMenuClassNames = {
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
 * Positioning Types
 * ============================================================================================== */
export type AnchorSide = 'left' | 'right'

export interface PopupMenuPositionerProps {
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left' | 'inline-start' | 'inline-end'
  align?: 'start' | 'center' | 'end' | 'list'
  sideOffset?: number
  alignOffset?: number
  sticky?: boolean
  positionMethod?: 'absolute' | 'fixed'
  trackAnchor?: boolean
  /** Collision avoidance configuration. Can be a boolean for backward compatibility or an object for granular control. */
  avoidCollisions?: boolean
  collisionPadding?:
    | number
    | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  collisionBoundary?: Element | 'clipping-ancestors' | Element[]
  /** Structured collision avoidance strategy (Base UI format) */
  collisionAvoidance?: {
    side?: 'none' | 'flip' | 'shift'
    align?: 'none' | 'flip' | 'shift'
    fallbackAxisSide?: 'none' | 'start' | 'end'
  }
}

/** Base positioner props from Base UI, with our custom align option */
type BasePositionerProps = Omit<
  React.ComponentProps<typeof Popover.Positioner>,
  'children' | 'align'
> & {
  align?: 'start' | 'center' | 'end' | 'list'
}

/** Positioner slot props type */
export type PositionerSlotProps =
  | Partial<BasePositionerProps>
  | {
      root?: Partial<BasePositionerProps>
      sub?: Partial<BasePositionerProps>
    }

/* ================================================================================================
 * SlotProps Types
 * ============================================================================================== */
/** Slot props forwarded to popup menu elements. */
export type PopupMenuSlotProps = {
  positioner?: PositionerSlotProps
  content?: React.HTMLAttributes<HTMLElement>
  header?: React.HTMLAttributes<HTMLElement>
  input?: React.InputHTMLAttributes<HTMLInputElement>
  list?: React.HTMLAttributes<HTMLElement>
  footer?: React.HTMLAttributes<HTMLElement>
}

/* ================================================================================================
 * Menu Types (Defs)
 * ============================================================================================== */
export interface PopupMenuDef<TData = unknown>
  extends Omit<
    BaseMenuDef<
      TData,
      PopupMenuSlots<TData>,
      PopupMenuSlotProps,
      PopupMenuClassNames
    >,
    'ui' | 'nodes'
  > {
  ui?: PopupMenuThemeDef<TData>
  nodes?: PopupNodeDef<TData>[]
}

export type PopupNodeDef<TData = unknown> =
  | ItemDef<TData>
  | GroupDef<TData>
  | SeparatorDef
  | LoadingDef
  | PopupSubmenuDef<TData>

export interface PopupSubmenuDef<TData = unknown, TChild = unknown>
  extends Omit<
    BaseSubmenuDef<
      TData,
      TChild,
      PopupMenuSlots<TChild>,
      PopupMenuSlotProps,
      PopupMenuClassNames
    >,
    'ui' | 'nodes'
  > {
  ui?: PopupMenuThemeDef<TChild>
  nodes?: PopupNodeDef<TChild>[]
}

/* ================================================================================================
 * Popup Node Type System (Runtime)
 * ============================================================================================== */

/**
 * Popup submenu runtime node.
 */
export type PopupSubmenuNode<
  TData = unknown,
  TChild = unknown,
> = BaseSubmenuNode<TData, TChild> & {
  def: PopupSubmenuDef<TData, TChild>
  parent: PopupMenu<TData>
  child: PopupMenu<TChild>
  nodes: PopupNode<TChild>[]
}

/**
 * Union of all runtime node types in popup menus.
 * This is the complete PopupNode type that represents any node in a popup menu.
 */
export type PopupNode<TData = unknown> =
  | ItemNode<TData>
  | GroupNode<TData>
  | SeparatorNode
  | LoadingNode
  | PopupSubmenuNode<TData, any>

/**
 * Popup menu runtime type.
 */
export type PopupMenu<TData = unknown> = BaseMenu<TData> & {
  nodes: PopupNode<TData>[]
}

/* ================================================================================================
 * Slot Types
 * ============================================================================================== */
export type PopupMenuSlots<TData = any> = {
  Content: (args: {
    children: React.ReactNode
    bind: ContentBindAPI
  }) => React.ReactNode
  Header?: (args: {
    menu: Menu<TData>
    /** Load mode: 'blocking' or 'streaming' */
    loadMode?: LoadMode
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
  Empty?: (args: { query: string }) => React.ReactNode
  Loading?: (args: {
    isFetching: boolean
    progress: any[]
    query: string
    loadMode: 'initial' | 'refresh'
  }) => React.ReactNode
  InlineLoading?: (args: {
    progress: any[]
    query: string
    inProgressPaths?: string[]
    completedPaths?: string[]
  }) => React.ReactNode
  Error?: (args: { error: Error | null }) => React.ReactNode
  Item: (args: {
    node: ItemNode<TData>
    bind: RowBindAPI
    search?: SearchContext
  }) => React.ReactNode
  SubmenuTrigger: (args: {
    node: PopupSubmenuNode<TData>
    bind: RowBindAPI
    search?: SearchContext
  }) => React.ReactNode
  GroupHeading?: (args: {
    node: GroupNode<TData>
    bind: GroupHeadingBindAPI
  }) => React.ReactNode
  Separator?: (args: { node: SeparatorNode }) => React.ReactNode
  Footer?: (args: { menu: Menu<TData> }) => React.ReactNode
}

/* ================================================================================================
 * Theme Types
 * ============================================================================================== */
export type PopupMenuThemeDef<TData = unknown> = ThemeDef<
  PopupMenuSlots<TData>,
  PopupMenuSlotProps,
  PopupMenuClassNames
>

export type PopupMenuTheme<TData = unknown> = Theme<
  PopupMenuSlots<TData>,
  PopupMenuSlotProps,
  PopupMenuClassNames
>

// Utility types from context.ts
export type Children = {
  children: React.ReactNode
}
