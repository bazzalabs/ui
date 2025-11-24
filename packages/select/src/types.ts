import type {
  Menu as BaseMenu,
  MenuDef as BaseMenuDef,
  GroupDef,
  GroupNode,
  ItemDef,
  ItemNode,
  LoadingDef,
  LoadingNode,
  SeparatorDef,
  SeparatorNode,
  SearchContext,
  RowBindAPI,
} from '@bazza-ui/menu'
import type {
  PopupMenuClassNames,
  PopupMenuSlotProps,
  PopupMenuSlots,
  PopupMenuThemeDef,
} from '@bazza-ui/popup-menu'
import type { ThemeDef, Theme } from '@bazza-ui/theming'
import type * as React from 'react'

/* ================================================================================================
 * Select-Specific Slot Types
 * ============================================================================================== */

/**
 * Trigger bind API for customizing the trigger button.
 * Provides all necessary props to be spread onto the trigger element.
 */
export type TriggerBindAPI = {
  /** Whether the select is open */
  open: boolean
  /** Whether the trigger is disabled */
  disabled: boolean
  /** Get all props to spread onto the trigger button */
  getTriggerProps: <T extends React.ButtonHTMLAttributes<HTMLButtonElement>>(
    overrides?: T,
  ) => T & {
    ref: React.Ref<HTMLButtonElement>
    role: 'combobox'
    'aria-haspopup': 'listbox'
    'aria-expanded': boolean
    'aria-controls': string
    'aria-label'?: string
    'aria-labelledby'?: string
    'aria-describedby'?: string
    'aria-invalid'?: boolean
    'aria-required'?: boolean
    disabled?: boolean
    onPointerDown: (e: React.PointerEvent) => void
  }
}

/**
 * Trigger slot arguments for customizing the trigger button.
 */
export interface SelectTriggerSlotArgs {
  /** Children to render inside the trigger */
  children: React.ReactNode
  /** Bind API for getting trigger props */
  bind: TriggerBindAPI
  /** Currently selected value (single select) */
  value?: string
  /** Currently selected values (multi select) */
  values?: string[]
  /** Whether this is a multi-select */
  multiple: boolean
  /** Placeholder text when nothing is selected */
  placeholder: string
}

/**
 * Value slot arguments for customizing the trigger display value.
 */
export interface SelectValueSlotArgs<TData = unknown> {
  /** Currently selected value (single select) */
  value?: string
  /** Currently selected values (multi select) */
  values?: string[]
  /** Whether this is a multi-select */
  multiple: boolean
  /** Placeholder text when nothing is selected */
  placeholder: string
  /** The selected node (single select) - provides access to icon, label, data, etc. */
  node?: ItemNode<TData>
  /** The selected nodes (multi select) - provides access to icon, label, data, etc. */
  nodes?: ItemNode<TData>[]
}

/**
 * Extended Item slot arguments for Select that include selection state.
 */
export interface SelectItemSlotArgs<TData = unknown> {
  node: ItemNode<TData>
  bind: RowBindAPI
  search?: SearchContext
  /** Whether this is a multi-select */
  multiple: boolean
  /** Currently selected value (single select) */
  value?: string
  /** Currently selected values (multi select) */
  values?: string[]
}

/**
 * Select-specific slots extending popup menu slots with Trigger, Value slot and enhanced Item slot.
 */
export type SelectSlots<TData = unknown> = Omit<
  PopupMenuSlots<TData>,
  'Item'
> & {
  /**
   * Trigger slot - renders the button that opens the select.
   * Can be customized at factory, instance, or menu level.
   * Receives bind API to spread all necessary props onto the button.
   */
  Trigger?: (args: SelectTriggerSlotArgs) => React.ReactNode
  /**
   * Value slot - renders the selected value in the trigger.
   * Can be customized at factory, instance, or menu level.
   * Receives node/nodes to access full item data (icon, label, data, etc.)
   */
  Value?: (args: SelectValueSlotArgs<TData>) => React.ReactNode
  /**
   * Item slot - renders each menu item with access to selection state.
   * Enhanced from PopupMenuSlots to include multiple, value, and values.
   */
  Item: (args: SelectItemSlotArgs<TData>) => React.ReactNode
}

/**
 * Select-specific slot props extending popup menu slot props.
 */
export type SelectSlotProps = PopupMenuSlotProps & {
  /** Props to forward to the trigger button element */
  trigger?: React.ButtonHTMLAttributes<HTMLButtonElement>
  /** Props to forward to the value wrapper element */
  value?: React.HTMLAttributes<HTMLSpanElement>
}

/**
 * Select-specific class names extending popup menu class names.
 */
export type SelectClassNames = PopupMenuClassNames & {
  /** Class name for the trigger button */
  trigger?: string
  /** Class name for the value display element */
  value?: string
}

/**
 * Select theme definition with Select-specific slots.
 * Can be provided at factory, instance, or menu level.
 */
export type SelectThemeDef<TData = unknown> = ThemeDef<
  SelectSlots<TData>,
  SelectSlotProps,
  SelectClassNames
>

/**
 * Complete Select theme with all slots required.
 */
export type SelectTheme<TData = unknown> = Theme<
  SelectSlots<TData>,
  SelectSlotProps,
  SelectClassNames
>

/* ================================================================================================
 * Select Node Type System
 * ==============================================================================================
 * IMPORTANT: Select components DO NOT support submenus.
 * Use groups and separators for categorization instead.
 * ============================================================================================== */

/**
 * Union of all node definition types usable in select menus.
 *
 * ⚠️ IMPORTANT: Submenus are NOT supported in Select components.
 * Use groups with headings for categorization instead.
 */
export type SelectNodeDef<TData = unknown> =
  | ItemDef<TData>
  | GroupDef<TData>
  | SeparatorDef
  | LoadingDef

/**
 * Union of all runtime node types in select menus.
 */
export type SelectNode<TData = unknown> =
  | ItemNode<TData>
  | GroupNode<TData>
  | SeparatorNode
  | LoadingNode

/**
 * Select menu runtime type.
 */
export type SelectMenu<TData = unknown> = BaseMenu & {
  nodes: SelectNode<TData>[]
}

/**
 * Select menu definition with properly typed slots, slotProps, and classNames.
 * Does not support submenus - only items, groups, separators, and loading states.
 * Includes Select-specific Value slot for customizing the trigger display.
 */
export type SelectMenuDef<TData = unknown> = Omit<
  BaseMenuDef<TData, SelectSlots<TData>, SelectSlotProps, SelectClassNames>,
  'ui' | 'nodes'
> & {
  ui?: SelectThemeDef<TData>
  nodes?: SelectNodeDef<TData>[]
}

/* ================================================================================================
 * Simple Item API
 * ============================================================================================== */

/**
 * Simplified item definition for the common case of basic selects.
 */
export interface SelectItemDef<TData = unknown> {
  /** The value to submit when this item is selected */
  value: string
  /** Display label */
  label: string
  /** Whether this item is disabled */
  disabled?: boolean
  /** Optional icon */
  icon?: React.ReactNode
  /** Optional description */
  description?: string
  /** Custom data attached to this item */
  data?: TData
}

/* ================================================================================================
 * Select Component Props
 * ============================================================================================== */

export interface SelectProps<TData = unknown> {
  // ===== Value Management =====
  /** Current selected value (controlled) */
  value?: string
  /** Default value (uncontrolled) */
  defaultValue?: string
  /** Called when selection changes */
  onValueChange?: (value: string) => void

  // ===== Form Integration =====
  /** Form field name for submission */
  name?: string
  /** Associate with a form by ID */
  form?: string
  /** Whether this field is required */
  required?: boolean
  /** Whether this select is disabled */
  disabled?: boolean

  // ===== Display =====
  /** Placeholder text when no value selected */
  placeholder?: string
  /** Trigger element customization */
  children?: React.ReactNode

  // ===== Options (Simple API) =====
  /** Simple array of items (most common use case) */
  items?: SelectItemDef<TData>[]

  // ===== Options (Advanced API) =====
  /** Full menu definition (for advanced use cases) */
  menu?: SelectMenuDef<TData>

  // ===== Accessibility =====
  /** Accessible label */
  'aria-label'?: string
  /** ID of element that labels this select */
  'aria-labelledby'?: string
  /** ID of element that describes this select */
  'aria-describedby'?: string
  /** Whether this select has a validation error */
  'aria-invalid'?: boolean

  // ===== Positioning (inherited from dropdown) =====
  /** Which side to position the listbox on */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** How to align the listbox with the trigger */
  align?: 'start' | 'center' | 'end'
  /** Offset from the trigger (perpendicular to side) */
  sideOffset?: number
  /** Offset along the alignment axis */
  alignOffset?: number

  // ===== Callbacks =====
  /** Called when the select opens/closes */
  onOpenChange?: (open: boolean) => void
  /** Called on blur (for form validation) */
  onBlur?: () => void

  // ===== Advanced =====
  /** Whether the listbox is open (controlled) */
  open?: boolean
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean
  /** Whether clicking outside closes the listbox */
  modal?: boolean
  /** Ref for programmatic control */
  controlRef?: React.Ref<import('./control.js').SelectControl<TData>>
}

/* ================================================================================================
 * MultiSelect Component Props
 * ============================================================================================== */

export interface MultiSelectProps<TData = unknown>
  extends Omit<SelectProps<TData>, 'value' | 'defaultValue' | 'onValueChange'> {
  // ===== Value Management (Array) =====
  /** Current selected values (controlled) */
  value?: string[]
  /** Default values (uncontrolled) */
  defaultValue?: string[]
  /** Called when selection changes */
  onValueChange?: (values: string[]) => void

  // ===== MultiSelect Specific =====
  /** Maximum number of selections allowed */
  max?: number
  /** Minimum number of selections required */
  min?: number
  /** Whether to close the listbox after selecting an item */
  closeOnSelect?: boolean
}

/* ================================================================================================
 * Validation Helper
 * ============================================================================================== */

/**
 * Runtime validation to ensure no submenus are used in Select components.
 * Throws in development mode with helpful error messages.
 */
export function validateSelectNodes<TData>(
  nodes: SelectNodeDef<TData>[],
  path: string[] = [],
): void {
  if (process.env.NODE_ENV !== 'development') return

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (!node) continue

    const currentPath = [...path, `[${i}]`]

    // Check if someone tried to sneak in a submenu
    if ((node as any).kind === 'submenu') {
      const pathStr = currentPath.join('')
      throw new Error(
        `[Select] Submenus are not supported in Select components.\n` +
          `  Found at: nodes${pathStr}\n` +
          `  Tip: Use groups with headings for categorization instead.\n\n` +
          `  Example:\n` +
          `  {\n` +
          `    kind: 'group',\n` +
          `    heading: 'Category',\n` +
          `    nodes: [/* items */]\n` +
          `  }`,
      )
    }

    // Recursively check group children
    if (node.kind === 'group') {
      const groupNode = node as GroupDef<TData>
      if (groupNode.nodes) {
        validateSelectNodes(groupNode.nodes as SelectNodeDef<TData>[], [
          ...currentPath,
          '.nodes',
        ])
      }
    }
  }
}

/**
 * Validate a complete select menu definition.
 */
export function validateSelectMenu<TData>(menu: SelectMenuDef<TData>): void {
  if (menu.nodes) {
    validateSelectNodes(menu.nodes, ['menu', '.nodes'])
  }
}
