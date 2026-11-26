import type {
  CheckboxValueChangeEventDetails,
  CheckedChangeEventDetails,
  RadioValueChangeEventDetails,
} from './node-events.js'

// The props of each menu part that aren't framework code, declared once:
// packages/react's part props extend these, and each node def kind picks the
// fields it shares with its part. A field's type and docs live only here.

/**
 * The Item part's props that aren't framework code. `PopupMenuItemProps`
 * extends them, and item and tree item defs pick theirs.
 */
export interface ItemFields {
  /**
   * Unique value for this item used for filtering.
   * If not provided, will be inferred from textContent.
   */
  value?: string

  /**
   * Additional keywords to match against when filtering.
   * Useful for aliases or synonyms.
   */
  keywords?: string[]

  /**
   * Whether this item is disabled.
   * Disabled items are not selectable and are skipped during keyboard navigation.
   */
  disabled?: boolean

  /**
   * Whether this item can be activated via Enter or click.
   * Non-activatable items are still highlightable via keyboard/pointer.
   * @default true
   */
  activatable?: boolean

  /**
   * Callback when this item is selected (via click or Enter key).
   */
  onSelect?: () => void

  /**
   * Whether to force render this item regardless of filter results.
   * @default false
   */
  forceMount?: boolean

  /**
   * Whether clicking this item should close the menu.
   * @default true
   */
  closeOnClick?: boolean

  /**
   * Keyboard shortcut to trigger this item.
   * When the menu is focused and the user presses this key, the item will be selected.
   * Should be a single character (e.g., "1", "a", etc.).
   */
  shortcut?: string

  /**
   * Forces this row's relative order during score-based sorting.
   * Lower values appear earlier.
   * @default 0
   */
  forceOrder?: number

  /**
   * Overrides this row's computed fuzzy-match score.
   */
  forceScore?: number
}

/**
 * The LinkItem part's props that aren't framework code. `PopupMenuLinkItemProps`
 * extends them, and link item defs pick theirs.
 */
export interface LinkItemFields {
  /**
   * Unique value for this item used for filtering.
   * If not provided, will be inferred from textContent.
   */
  value?: string
  /**
   * Additional keywords to match against when filtering.
   * Useful for aliases or synonyms.
   */
  keywords?: string[]
  /**
   * Whether this item is disabled.
   * Disabled items do not navigate and are skipped during keyboard navigation.
   */
  disabled?: boolean
  /** Callback when this item is selected (via click, Enter key, or shortcut). */
  onSelect?: () => void
  /** Whether to force render this item regardless of filter results. @default false */
  forceMount?: boolean
  /**
   * Whether clicking this item should close the menu. Defaults to false because
   * full-page navigation unmounts the menu anyway.
   * @default false
   */
  closeOnClick?: boolean
  /** Keyboard shortcut to trigger this item. */
  shortcut?: string
  /** Forces this row's relative order during score-based sorting. @default 0 */
  forceOrder?: number
  /** Overrides this row's computed fuzzy-match score. */
  forceScore?: number
}

/**
 * The RadioItem part's props that aren't framework code. `PopupMenuRadioItemProps`
 * extends them, and radio item defs pick theirs.
 */
export interface RadioItemFields {
  /**
   * The value to set when this item is selected.
   * This is required and must be unique within the RadioGroup.
   */
  value: string

  /**
   * Additional keywords to match against when filtering.
   * Useful for aliases or synonyms.
   */
  keywords?: string[]

  /**
   * Whether this item is disabled.
   * Disabled items are not selectable and are skipped during keyboard navigation.
   * @default false
   */
  disabled?: boolean

  /**
   * Callback when this item is selected.
   */
  onSelect?: () => void

  /**
   * Whether to force render this item regardless of filter results.
   * @default false
   */
  forceMount?: boolean

  /**
   * Whether clicking this item should close the menu.
   * @default false
   */
  closeOnClick?: boolean

  /**
   * Keyboard shortcut to trigger this item.
   * When the menu is focused and the user presses this key, the item will be selected.
   * Should be a single character (e.g., "1", "a", etc.).
   */
  shortcut?: string

  /**
   * Forces this row's relative order during score-based sorting.
   * Lower values appear earlier.
   * @default 0
   */
  forceOrder?: number

  /**
   * Overrides this row's computed fuzzy-match score.
   */
  forceScore?: number
}

/**
 * The CheckboxItem part's props that aren't framework code. `PopupMenuCheckboxItemProps`
 * extends them, and checkbox item defs pick theirs.
 */
export interface CheckboxItemFields {
  /**
   * The controlled checked state.
   */
  checked?: boolean

  /**
   * The default checked state for uncontrolled mode.
   * @default false
   */
  defaultChecked?: boolean

  /**
   * Callback fired when the checked state changes.
   * The second parameter contains event details including the reason for the change.
   */
  onCheckedChange?: (
    checked: boolean,
    eventDetails: CheckedChangeEventDetails,
  ) => void

  /**
   * Unique value for this item used for filtering.
   * If not provided, will be inferred from textContent.
   */
  value?: string

  /**
   * Additional keywords to match against when filtering.
   * Useful for aliases or synonyms.
   */
  keywords?: string[]

  /**
   * Whether this item is disabled.
   * Disabled items are not selectable and are skipped during keyboard navigation.
   * @default false
   */
  disabled?: boolean

  /**
   * Callback when this item is selected (via click or Enter key).
   */
  onSelect?: () => void

  /**
   * Whether to force render this item regardless of filter results.
   * @default false
   */
  forceMount?: boolean

  /**
   * Whether clicking this item should close the menu.
   * @default false
   */
  closeOnClick?: boolean

  /**
   * Keyboard shortcut to trigger this item.
   * When the menu is focused and the user presses this key, the item will be selected.
   * Should be a single character (e.g., "1", "a", etc.).
   */
  shortcut?: string

  /**
   * Forces this row's relative order during score-based sorting.
   * Lower values appear earlier.
   * @default 0
   */
  forceOrder?: number

  /**
   * Overrides this row's computed fuzzy-match score.
   */
  forceScore?: number
}

/**
 * The SubmenuTrigger part's props that aren't framework code. `PopupMenuSubmenuTriggerProps`
 * extends them, and submenu defs pick theirs.
 */
export interface SubmenuTriggerFields {
  /**
   * Explicit unique identifier for this item in the store.
   * When provided (e.g., the Resolved ID the data-first API passes),
   * this takes priority over `value` for store registration.
   */
  id?: string

  /**
   * Unique value for this item used for filtering.
   * If not provided, will be inferred from textContent.
   */
  value?: string

  /**
   * Additional keywords to match against when filtering.
   * Useful for aliases or synonyms.
   */
  keywords?: string[]

  /**
   * Whether this item is disabled.
   * Disabled items are not selectable and are skipped during keyboard navigation.
   */
  disabled?: boolean

  /**
   * Whether to force render this item regardless of filter results.
   * @default false
   */
  forceMount?: boolean

  /**
   * Whether the submenu opens when this trigger is highlighted.
   * @default true
   */
  openOnHighlight?: boolean

  /**
   * Delay before opening the submenu (in milliseconds).
   * Can be a number (applies to both pointer and keyboard) or an object
   * with separate `pointer` and `keyboard` values.
   * @default { pointer: 0, keyboard: 150 }
   */
  delay?: number | { pointer?: number; keyboard?: number }

  /**
   * Delay before closing the submenu when pointer leaves (in milliseconds).
   * @default 0
   */
  closeDelay?: number

  /**
   * Whether the submenu closes when the pointer leaves the trigger without aiming at the submenu popup.
   * When `false`, the submenu stays open until closed by another path (sibling highlight, keyboard, outside click, etc.).
   * @default true
   */
  closeOnPointerLeave?: boolean

  /**
   * Forces this row's relative order during score-based sorting.
   * Lower values appear earlier.
   * @default 0
   */
  forceOrder?: number

  /**
   * Overrides this row's computed fuzzy-match score.
   */
  forceScore?: number
}

/**
 * The SubpageTrigger part's props that aren't framework code. `PopupMenuSubpageTriggerProps`
 * extends them, and subpage defs pick theirs.
 */
export interface SubpageTriggerFields {
  /** Explicit unique identifier for this item in the store. */
  id?: string
  /** Unique value for this item used for filtering. */
  value?: string
  /** Additional keywords to match against when filtering. */
  keywords?: string[]
  /** Whether this item is disabled. */
  disabled?: boolean
  /** Whether to force render this item regardless of filter results. */
  forceMount?: boolean
  /**
   * Forces this row's relative order during score-based sorting.
   * Lower values appear earlier.
   * @default 0
   */
  forceOrder?: number
  /**
   * Overrides this row's computed fuzzy-match score.
   */
  forceScore?: number
  /** Target page ID to open when this trigger is selected. */
  targetPageId: string
}

/**
 * The RadioGroup part's props that aren't framework code. `PopupMenuRadioGroupProps`
 * extends them, and radio group defs pick theirs.
 */
export interface RadioGroupFields {
  /**
   * The controlled selected value.
   */
  value?: string

  /**
   * The default value for uncontrolled mode.
   */
  defaultValue?: string

  /**
   * Callback fired when the selected value changes.
   * The second parameter contains event details including the reason for the change.
   */
  onValueChange?: (
    value: string,
    eventDetails: RadioValueChangeEventDetails,
  ) => void

  /**
   * Whether all items in this group are disabled.
   * @default false
   */
  disabled?: boolean

  /**
   * Whether to force render this group regardless of filter results.
   * @default false
   */
  forceMount?: boolean
}

/**
 * The CheckboxGroup part's props that aren't framework code. `PopupMenuCheckboxGroupProps`
 * extends them, and checkbox group defs pick theirs.
 */
export interface CheckboxGroupFields {
  /**
   * The controlled array of checked item values.
   */
  value?: string[]

  /**
   * The default checked values for uncontrolled mode. @default []
   */
  defaultValue?: string[]

  /**
   * Callback fired when the selected value changes.
   * The second parameter contains event details including the reason for the change.
   */
  onValueChange?: (
    value: string[],
    eventDetails: CheckboxValueChangeEventDetails,
  ) => void

  /**
   * Whether all items in this group are disabled.
   * @default false
   */
  disabled?: boolean

  /**
   * Whether to force render this group regardless of filter results.
   * @default false
   */
  forceMount?: boolean
}
