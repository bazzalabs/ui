import type * as React from 'react'
import type {
  MenuDef,
  Node,
  ItemNode,
  SubmenuNode,
  GroupNode,
  SeparatorNode,
  InputBindAPI,
  InputSearchState,
  RowBindAPI as MenuRowBindAPI,
  ContentBindAPI as MenuContentBindAPI,
  ListBindAPI as MenuListBindAPI,
  GroupHeadingBindAPI as MenuGroupHeadingBindAPI,
} from '@bazza-ui/menu'
import type { Theme, ThemeDef } from '@bazza-ui/theming'
import type { Popover } from '@base-ui-components/react/popover'

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

/* ================================================================================================
 * Utility Types
 * ============================================================================================== */

export type Children = {
  children: React.ReactNode
}

/* ================================================================================================
 * Bind API Types (wiring helpers for slots)
 * Re-export from @bazza-ui/menu for consistency
 * ============================================================================================== */

export type RowBindAPI = MenuRowBindAPI
export type ContentBindAPI = MenuContentBindAPI
export type ListBindAPI = MenuListBindAPI
export type GroupHeadingBindAPI = MenuGroupHeadingBindAPI

/* ================================================================================================
 * Slot Types
 * ============================================================================================== */

/** Slot renderers to customize popup menu visuals. */
export type PopupMenuSlots<T = unknown> = {
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
  }) => React.ReactNode
  Error?: (args: { error: Error | null }) => React.ReactNode
  Item: (args: {
    node: ItemNode<T>
    bind: RowBindAPI
    search?: any
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

/** Slot props forwarded to popup menu elements. */
export type PopupMenuSlotProps = {
  positioner?: PositionerSlotProps
  content?: React.HTMLAttributes<HTMLElement>
  input?: React.InputHTMLAttributes<HTMLInputElement>
  list?: React.HTMLAttributes<HTMLElement>
}

/* ================================================================================================
 * ClassNames Types
 * ============================================================================================== */

/** ClassNames for styling popup menu elements. */
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
 * Theme Types
 * ============================================================================================== */

/** Theme definition for popup menu (partial overrides). */
export type PopupMenuThemeDef<T = unknown> = ThemeDef<
  PopupMenuSlots<T>,
  PopupMenuSlotProps,
  PopupMenuClassNames
>

/** Complete theme for popup menu (all slots required). */
export type PopupMenuTheme<T = unknown> = Theme<
  PopupMenuSlots<T>,
  PopupMenuSlotProps,
  PopupMenuClassNames
>
