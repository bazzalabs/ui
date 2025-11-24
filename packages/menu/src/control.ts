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
  /** Whether the entire menu is disabled (input, items, navigation) */
  disabled: boolean

  /** Custom state (for extensions) */
  [key: string]: any
}

/**
 * Base control interface that ALL menu implementations must extend.
 * Provides core enable/disable functionality that works across all menu types.
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
 * // Disable the menu during an async operation
 * const enable = menuControl.current?.disable()
 * await performAsyncOperation()
 * enable() // Re-enable menu
 * ```
 */
export interface MenuControl<T = unknown> {
  /**
   * Get current control state (read-only).
   * Used internally for checking disabled state.
   */
  getState(): MenuControlState<T>

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
}
