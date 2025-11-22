import type { Popover } from '@base-ui-components/react/popover'
import type {
  ContentBindAPI as MenuContentBindAPI,
  GroupDef,
  GroupHeadingBindAPI as MenuGroupHeadingBindAPI,
  GroupNode,
  InputBindAPI,
  InputSearchState,
  ItemDef,
  ItemNode,
  ListBindAPI as MenuListBindAPI,
  LoadMode,
  LoadingDef,
  Menu,
  MenuDef as BaseMenuDef,
  RowBindAPI as MenuRowBindAPI,
  SearchContext,
  SeparatorDef,
  SeparatorNode,
  SubmenuDef as BaseSubmenuDef,
  SubmenuNode as BaseSubmenuNode,
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
export interface PopupMenuDef<T = unknown>
  extends Omit<
    BaseMenuDef<T, PopupMenuSlots<T>, PopupMenuSlotProps, PopupMenuClassNames>,
    'nodes'
  > {
  nodes?: PopupNodeDef<T>[]
}

export type PopupNodeDef<T = unknown> =
  | ItemDef<T>
  | GroupDef<T>
  | SeparatorDef
  | LoadingDef
  | PopupSubmenuDef<T>

export interface PopupSubmenuDef<T = unknown, TChild = unknown>
  extends Omit<
    BaseSubmenuDef<
      T,
      TChild,
      PopupMenuSlots<T>,
      PopupMenuSlotProps,
      PopupMenuClassNames
    >,
    'nodes'
  > {
  nodes?: PopupNodeDef<T>[]
}

export type PopupSubmenuNode<T = unknown, TChild = unknown> = Omit<
  BaseSubmenuNode<T, TChild>,
  'nodes'
> & {
  nodes?: PopupNodeDef<T>[]
  def: PopupSubmenuDef<T, TChild>
}

/* ================================================================================================
 * Slot Types
 * ============================================================================================== */
export type PopupMenuSlots<T = any> = {
  Content: (args: {
    children: React.ReactNode
    bind: ContentBindAPI
  }) => React.ReactNode
  Header?: (args: {
    menu: Menu<T>
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
    node: ItemNode<T>
    bind: RowBindAPI
    search?: SearchContext
  }) => React.ReactNode
  SubmenuTrigger: (args: {
    node: PopupSubmenuNode<T>
    bind: RowBindAPI
    search?: SearchContext
  }) => React.ReactNode
  GroupHeading?: (args: {
    node: GroupNode<T>
    bind: GroupHeadingBindAPI
  }) => React.ReactNode
  Separator?: (args: { node: SeparatorNode }) => React.ReactNode
  Footer?: (args: { menu: Menu<T> }) => React.ReactNode
}

/* ================================================================================================
 * Theme Types
 * ============================================================================================== */
export type PopupMenuThemeDef<T = unknown> = ThemeDef<
  PopupMenuSlots<T>,
  PopupMenuSlotProps,
  PopupMenuClassNames
>

export type PopupMenuTheme<T = unknown> = Theme<
  PopupMenuSlots<T>,
  PopupMenuSlotProps,
  PopupMenuClassNames
>

// Utility types from context.ts
export type Children = {
  children: React.ReactNode
}
