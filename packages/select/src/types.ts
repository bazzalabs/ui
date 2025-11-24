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
} from '@bazza-ui/menu'
import type {
  PopupMenuClassNames,
  PopupMenuSlotProps,
  PopupMenuSlots,
  PopupMenuThemeDef,
} from '@bazza-ui/popup-menu'
import type * as React from 'react'

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
 */
export type SelectMenuDef<TData = unknown> = Omit<
  BaseMenuDef<
    TData,
    PopupMenuSlots<TData>,
    PopupMenuSlotProps,
    PopupMenuClassNames
  >,
  'ui' | 'nodes'
> & {
  ui?: PopupMenuThemeDef<TData>
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
    if (node.kind === 'group' && node.nodes) {
      validateSelectNodes(node.nodes as SelectNodeDef<TData>[], [
        ...currentPath,
        '.nodes',
      ])
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
