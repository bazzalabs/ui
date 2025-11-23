/**
 * Core menu control system for programmatic menu manipulation.
 *
 * This module provides the base MenuControl interface and EventBus implementation
 * that all menu packages (command-menu, popup-menu, etc.) extend.
 */

import type { Menu, MenuDef } from './types.js'

/* ================================================================================================
 * Event Bus
 * ============================================================================================== */

export type MenuEventHandler = (data?: any) => void

/**
 * Simple event bus for menu events.
 * Used internally by MenuControl implementations.
 */
export class EventBus {
  private handlers = new Map<string, Set<MenuEventHandler>>()

  /**
   * Subscribe to an event.
   * @returns Unsubscribe function
   */
  on(event: string, handler: MenuEventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)

    return () => {
      this.handlers.get(event)?.delete(handler)
      if (this.handlers.get(event)?.size === 0) {
        this.handlers.delete(event)
      }
    }
  }

  /**
   * Emit an event to all subscribers.
   */
  emit(event: string, data?: any): void {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error)
      }
    })
  }

  /**
   * Remove all event handlers.
   */
  clear(): void {
    this.handlers.clear()
  }

  /**
   * Get all registered events.
   */
  getEvents(): string[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Get number of handlers for an event.
   */
  getHandlerCount(event: string): number {
    return this.handlers.get(event)?.size ?? 0
  }
}

/* ================================================================================================
 * Menu Control Interface
 * ============================================================================================== */

/**
 * Core menu events that all implementations support.
 * Each implementation can add its own events via string union.
 */
export type MenuEventType =
  | 'loading-start'
  | 'loading-end'
  | 'error'
  | 'error-clear'
  | 'item-select'
  | 'menu-disable'
  | 'menu-enable'
  | 'refresh'
  | 'refresh-submenu'
  | string // Allow custom events

/**
 * Base state interface that all menu controls share.
 */
export interface MenuControlState<T = unknown> {
  /** Current menu (may be MenuDef or instantiated Menu depending on context) */
  menu: Menu<T> | MenuDef<T>

  /** Whether menu is in a loading state */
  loading: boolean

  /** Current error message, if any */
  error: string | null

  /** Whether the entire menu is disabled (input, items, navigation) */
  disabled: boolean

  /** Custom state (for extensions) */
  [key: string]: any
}

/**
 * Base control interface that ALL menu implementations must extend.
 * Provides core functionality that works across all menu types.
 *
 * This interface is implemented by:
 * - CommandMenuControl (command-menu package)
 * - PopupMenuControl (popup-menu package)
 * - DropdownMenuControl (dropdown-menu package)
 * - ContextMenuControl (context-menu package)
 *
 * @typeParam T - Data type for menu nodes
 *
 * @example Basic usage
 * ```tsx
 * const menuControl = useRef<MenuControl>(null)
 *
 * // Access core functionality
 * menuControl.current?.setLoading(true)
 * menuControl.current?.refresh()
 * ```
 *
 * @example With type-specific features
 * ```tsx
 * const menuControl = useRef<CommandMenuControl>(null)
 *
 * // Core functionality
 * menuControl.current?.setLoading(true)
 *
 * // Command menu specific
 * menuControl.current?.open()
 * menuControl.current?.setQuery('search')
 * ```
 */
export interface MenuControl<T = unknown> {
  // ===== Core State (Read-only) =====

  /** Get the current menu (may be MenuDef or Menu depending on context) */
  getMenu(): Menu<T> | MenuDef<T>

  /** Get current control state */
  getState(): MenuControlState<T>

  /** Check if menu is in a loading state */
  isLoading(): boolean

  /** Get current error state */
  getError(): string | null

  // ===== State Management =====

  /**
   * Set global loading state for the menu.
   * Emits 'loading-start' or 'loading-end' event.
   *
   * @param loading - Whether menu is loading
   * @param message - Optional loading message
   */
  setLoading(loading: boolean, message?: string): void

  /**
   * Set error state.
   * Emits 'error' event if error is set.
   *
   * @param error - Error message or null to clear
   */
  setError(error: string | null): void

  /**
   * Clear error state.
   * Emits 'error-clear' event.
   */
  clearError(): void

  // ===== Data Refresh =====

  /**
   * Refresh all async loaders in the menu tree.
   * Emits 'refresh' event.
   *
   * @returns Promise that resolves when all loaders complete
   */
  refresh(): Promise<void>

  /**
   * Refresh a specific submenu's loader by ID.
   * Emits 'refresh-submenu' event.
   *
   * @param submenuId - ID of the submenu to refresh
   * @returns Promise that resolves when loader completes
   */
  refreshSubmenu(submenuId: string): Promise<void>

  // ===== Item Manipulation =====

  /**
   * Programmatically select an item by ID.
   * Emits 'item-select' event.
   *
   * @param itemId - ID of the item to select
   */
  selectItem(itemId: string): void

  /**
   * Disable the entire menu (input, items, navigation).
   * User can still close the menu with Escape.
   * Emits 'menu-disable' event.
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
   * Emits 'menu-enable' event.
   */
  enable(): void

  /**
   * Set the disabled state of the menu.
   * Emits 'menu-disable' or 'menu-enable' event.
   *
   * @param disabled - Whether the menu should be disabled
   */
  setDisabled(disabled: boolean): void

  // ===== Events =====

  /**
   * Subscribe to menu events.
   *
   * @param event - Event type to listen for
   * @param handler - Event handler function
   * @returns Unsubscribe function
   *
   * @example
   * ```tsx
   * const unsubscribe = control.on('loading-start', ({ message }) => {
   *   console.log('Loading:', message)
   * })
   *
   * // Later...
   * unsubscribe()
   * ```
   */
  on(event: MenuEventType, handler: MenuEventHandler): () => void

  /**
   * Emit a custom event.
   * Allows middleware and extensions to communicate via the event bus.
   *
   * @param event - Event name
   * @param data - Event data
   */
  emit(event: string, data?: any): void
}
