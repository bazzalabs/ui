/**
 * Centralized event name constants for CommandMenu
 * @module events
 */

export const COMMAND_MENU_EVENTS = {
  // Error events
  ERROR: 'error',
  ERROR_CLEAR: 'error-clear',

  // Refresh events
  REFRESH: 'refresh',
  REFRESH_SUBMENU: 'refresh-submenu',

  // Item events
  ITEM_SELECT: 'item-select',

  // Menu state events
  MENU_DISABLE: 'menu-disable',
  MENU_ENABLE: 'menu-enable',

  // Loading events
  LOADING_START: 'loading-start',
  LOADING_END: 'loading-end',
} as const

export type CommandMenuEvent =
  (typeof COMMAND_MENU_EVENTS)[keyof typeof COMMAND_MENU_EVENTS]
