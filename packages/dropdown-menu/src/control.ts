/**
 * Dropdown Menu Control
 *
 * Simple type alias to PopupMenuControl.
 * Dropdown menus don't need any additional functionality beyond popup menus.
 */

import type { PopupMenuControl } from '@bazza-ui/popup-menu'

/**
 * Dropdown menu control is identical to popup menu control.
 * No additional functionality needed for trigger-based popups.
 *
 * @typeParam T - Data type for menu nodes
 *
 * @example
 * ```tsx
 * const control = useRef<DropdownMenuControl>(null)
 *
 * control.current?.open()
 * control.current?.close()
 * control.current?.closeAllSurfaces()
 * ```
 */
export type DropdownMenuControl<T = unknown> = PopupMenuControl<T>
