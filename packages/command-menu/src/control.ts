/**
 * Command Menu Control
 *
 * Extends the base MenuControl with command-menu-specific operations
 * like dialog open/close, query management, and navigation.
 */

import type { MenuControl, MenuControlState, MenuDef } from '@bazza-ui/menu'
import type { NavigationStackEntry } from './types.js'

/**
 * Command menu control is identical to the base menu control.
 * No additional functionality for command menus.
 *
 * @typeParam T - Data type for menu nodes
 *
 * @example
 * ```tsx
 * const control = useRef<CommandMenuControl>(null)
 *
 * // Disable menu during async operation
 * const enable = control.current?.disable()
 * await performAsyncOperation()
 * enable() // Re-enable menu
 * ```
 */
export type CommandMenuControl<T = unknown> = MenuControl<T>
