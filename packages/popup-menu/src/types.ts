import type * as React from 'react'

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
