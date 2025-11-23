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
 * Extended state for popup menus.
 * Adds popup-specific state like open and submenu tracking.
 */
export interface PopupMenuControlState<T = unknown>
  extends MenuControlState<T> {
  /** Whether popup is open */
  open: boolean

  /** Currently open submenu IDs with their depth */
  openSubmenus: Map<string, number>
}

/**
 * Extended control interface for popup menus (dropdown, context).
 * Adds positioning and submenu management.
 *
 * @typeParam T - Data type for menu nodes
 *
 * @example Basic usage
 * ```tsx
 * const control = useRef<PopupMenuControl>(null)
 *
 * // Popup operations
 * control.current?.open()
 * control.current?.close()
 *
 * // Submenu management
 * control.current?.openSubmenu('labels')
 * control.current?.closeAllSurfaces()
 * ```
 */
export interface PopupMenuControl<T = unknown> extends MenuControl<T> {
  // ===== Popup State =====

  /** Check if menu is open */
  isOpen(): boolean

  /** Get current state (extended with popup-specific state) */
  getState(): PopupMenuControlState<T>

  // ===== Popup Operations =====

  /** Open the popup menu */
  open(): void

  /** Close the popup menu */
  close(): void

  /** Toggle popup open state */
  toggle(): void

  /** Close all surfaces (root + all submenus) */
  closeAllSurfaces(): void

  // ===== Submenu Management =====

  /**
   * Open a specific submenu by ID.
   * Note: Implementation depends on menu architecture.
   *
   * @param submenuId - ID of the submenu to open
   */
  openSubmenu(submenuId: string): void

  /**
   * Close a specific submenu by ID.
   * Note: Implementation depends on menu architecture.
   *
   * @param submenuId - ID of the submenu to close
   */
  closeSubmenu(submenuId: string): void

  /**
   * Get all currently open submenu IDs.
   * Returns array of submenu IDs.
   */
  getOpenSubmenus(): string[]

  // ===== Positioning =====

  /**
   * Get current position (if applicable).
   * Returns null if not position-based (e.g., dropdown).
   */
  getPosition(): { x: number; y: number } | null

  /**
   * Set position programmatically (for context menus).
   * Optional - not all popup menus support this.
   */
  setPosition?(position: { x: number; y: number } | null): void
}
