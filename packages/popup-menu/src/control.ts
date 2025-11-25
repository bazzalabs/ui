/**
 * Popup Menu Control
 *
 * Extends the base MenuControl with popup-menu-specific operations
 * like open/close, submenu management, and positioning.
 *
 * This is shared by dropdown-menu and context-menu packages.
 */

import type { MenuControl, MenuControlState } from '@bazza-ui/menu'

/**
 * Popup menu control is identical to the base menu control.
 * No additional functionality for popup menus (dropdown, context).
 *
 * @typeParam T - Data type for menu nodes
 *
 * @example
 * ```tsx
 * const control = useRef<PopupMenuControl>(null)
 *
 * // Disable menu during async operation
 * const enable = control.current?.disable()
 * await performAsyncOperation()
 * enable() // Re-enable menu
 * ```
 */
export type PopupMenuControl<T = unknown> = MenuControl<T>
