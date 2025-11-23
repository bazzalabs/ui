/**
 * Command Menu Control
 *
 * Extends the base MenuControl with command-menu-specific operations
 * like dialog open/close, query management, and navigation.
 */

import type { MenuControl, MenuControlState, MenuDef } from '@bazza-ui/menu'
import type { NavigationStackEntry } from './types.js'

/**
 * Extended state for command menus.
 * Adds dialog-specific state like open, query, and navigation.
 */
export interface CommandMenuControlState<T = unknown>
  extends MenuControlState<T> {
  /** Whether dialog is open */
  open: boolean

  /** Navigation stack for breadcrumb navigation */
  navigationStack: NavigationStackEntry[]

  /** Current menu definition being displayed (may be submenu) */
  currentMenu: MenuDef<T>

  /** Whether the entire menu is disabled (input, items, navigation) */
  disabled: boolean
}

/**
 * Extended control interface for command menus.
 * Adds dialog-specific operations like open/close and navigation.
 *
 * @typeParam T - Data type for menu nodes
 *
 * @example Basic usage
 * ```tsx
 * const control = useRef<CommandMenuControl>(null)
 *
 * // Dialog operations
 * control.current?.open()
 * control.current?.close()
 *
 * // Query operations
 * control.current?.setQuery('search')
 * control.current?.focusInput()
 *
 * // Navigation
 * control.current?.navigateTo('submenu-id')
 * control.current?.goBack()
 * ```
 */
export interface CommandMenuControl<T = unknown> extends MenuControl<T> {
  // ===== Dialog State =====

  /** Check if menu dialog is open */
  isOpen(): boolean

  /** Get current state (extended with dialog-specific state) */
  getState(): CommandMenuControlState<T>

  // ===== Dialog Operations =====

  /** Open the command menu dialog */
  open(): void

  /** Close the command menu dialog */
  close(): void

  /** Toggle dialog open state */
  toggle(): void

  // ===== Input Management =====

  /**
   * Focus the search input.
   * This is the primary way to interact with the input.
   */
  focusInput(): void

  // ===== Navigation =====

  /**
   * Navigate to a specific submenu by ID.
   * Pushes the submenu onto the navigation stack.
   *
   * @param submenuId - ID of the submenu to navigate to
   */
  navigateTo(submenuId: string): void

  /**
   * Go back to parent menu.
   * Pops the current submenu from the navigation stack.
   */
  goBack(): void

  /**
   * Go to root menu.
   * Clears the entire navigation stack.
   */
  goToRoot(): void

  /**
   * Get current navigation stack.
   * Returns array of navigation entries (breadcrumbs).
   */
  getNavigationStack(): NavigationStackEntry[]

  // ===== Menu State =====

  /**
   * Disable the entire menu (input, items, navigation).
   * User can still close the menu with Escape.
   *
   * @returns Cleanup function that re-enables the menu
   *
   * @example
   * ```tsx
   * const enable = control.disable()
   * await performAsyncOperation()
   * enable() // Re-enable menu
   * ```
   */
  disable(): () => void

  /**
   * Enable the menu (if it was disabled).
   */
  enable(): void

  /**
   * Set the disabled state of the menu.
   *
   * @param disabled - Whether the menu should be disabled
   */
  setDisabled(disabled: boolean): void
}
