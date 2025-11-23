/**
 * Context Menu Control
 *
 * Extends PopupMenuControl with anchor point management for right-click positioning.
 */

import type {
  PopupMenuControl,
  PopupMenuControlState,
} from '@bazza-ui/popup-menu'

/**
 * Extended state for context menus.
 * Adds anchor point tracking for right-click position.
 */
export interface ContextMenuControlState<T = unknown>
  extends PopupMenuControlState<T> {
  /** Anchor point for context menu (right-click position) */
  anchorPoint: { x: number; y: number } | null
}

/**
 * Extended control for context menus.
 * Adds anchor point management (right-click position).
 *
 * @typeParam T - Data type for menu nodes
 *
 * @example
 * ```tsx
 * const control = useRef<ContextMenuControl>(null)
 *
 * // Popup operations
 * control.current?.open()
 * control.current?.close()
 *
 * // Anchor point management
 * control.current?.setAnchorPoint({ x: 100, y: 200 })
 * control.current?.getAnchorPoint()
 * ```
 */
export interface ContextMenuControl<T = unknown> extends PopupMenuControl<T> {
  /** Get current state (extended with context menu state) */
  getState(): ContextMenuControlState<T>

  /** Get anchor point (right-click position) */
  getAnchorPoint(): { x: number; y: number } | null

  /** Set anchor point programmatically */
  setAnchorPoint(point: { x: number; y: number } | null): void

  /** Required: setPosition is mandatory for context menus */
  setPosition(position: { x: number; y: number } | null): void
}
