/**
 * Context Menu Control
 *
 * Simple type alias to MenuControl (base control).
 */

import type { MenuControl } from '@bazza-ui/menu'

/**
 * Context menu control is identical to the base menu control.
 * No additional functionality for context menus.
 *
 * @typeParam T - Data type for menu nodes
 *
 * @example
 * ```tsx
 * const control = useRef<ContextMenuControl>(null)
 *
 * // Disable menu during async operation
 * const enable = control.current?.disable()
 * await performAsyncOperation()
 * enable() // Re-enable menu
 * ```
 */
export type ContextMenuControl<T = unknown> = MenuControl<T>
