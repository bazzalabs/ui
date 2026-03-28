// ============================================================================
// Event Reason Constants
// ============================================================================
// Centralized reason constants for all UI event handlers.
// These provide type-safe reasons for WHY a state change occurred.

// Trigger interactions
export const triggerPress = 'trigger-press' as const
export const triggerHover = 'trigger-hover' as const
export const triggerFocus = 'trigger-focus' as const
export const triggerContextMenu = 'trigger-context-menu' as const

// Dismissal reasons
export const escapeKey = 'escape-key' as const
export const outsidePress = 'outside-press' as const
export const focusOut = 'focus-out' as const

// Item interactions
export const itemPress = 'item-press' as const
export const itemKeyboardSelect = 'item-keyboard-select' as const
export const closePress = 'close-press' as const

// Input interactions (Combobox)
export const inputChange = 'input-change' as const
export const inputClear = 'input-clear' as const
export const clearPress = 'clear-press' as const

// Navigation
export const listNavigation = 'list-navigation' as const

// Submenu/menu management
export const submenuTrigger = 'submenu-trigger' as const
export const siblingOpen = 'sibling-open' as const

// Highlight changes
export const pointer = 'pointer' as const
export const keyboard = 'keyboard' as const
export const auto = 'auto' as const

// Programmatic/other
export const imperativeAction = 'imperative-action' as const
export const none = 'none' as const
