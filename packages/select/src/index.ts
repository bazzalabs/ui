/**
 * @bazza-ui/select
 * 
 * Form-compatible Select and MultiSelect components based on @bazza-ui/dropdown-menu.
 * Uses combobox/listbox ARIA pattern for proper form integration.
 * 
 * Key Features:
 * - Single and multi-select variants
 * - Form integration with hidden inputs
 * - Proper ARIA semantics (combobox/listbox pattern)
 * - No submenu support (use groups for categorization)
 * - Type-ahead search
 * - Virtualization for large lists
 * - Async loading support
 * 
 * @example
 * ```tsx
 * import { Select } from '@bazza-ui/select'
 * 
 * <Select
 *   name="fruit"
 *   value={value}
 *   onValueChange={setValue}
 *   items={[
 *     { value: 'apple', label: 'Apple' },
 *     { value: 'banana', label: 'Banana' },
 *   ]}
 * />
 * ```
 */

// Main components
export { Select } from './select.js'
export { MultiSelect } from './multi-select.js'

// Factory functions
export { createSelect } from './create-select.js'
export { createMultiSelect } from './create-multi-select.js'

// Component parts for composition
export { SelectRoot } from './components/root.js'
export { SelectTrigger } from './components/trigger.js'
export { SelectContent } from './components/content.js'
export { SelectValue } from './components/value.js'

// Types
export type {
  SelectProps,
  MultiSelectProps,
  SelectMenuDef,
  SelectNodeDef,
  SelectNode,
  SelectMenu,
  SelectItemDef,
} from './types.js'
export type { SelectControl, MultiSelectControl } from './control.js'

// Context (for advanced use cases)
export { useRootContext as useSelectContext } from './contexts/root-context.js'

// Validation helpers
export { validateSelectMenu, validateSelectNodes } from './types.js'

// Re-export useful types from dependencies
export type {
  ItemDef,
  GroupDef,
  SeparatorDef,
  LoadingDef,
  ItemNode,
  GroupNode,
  SeparatorNode,
  LoadingNode,
} from '@bazza-ui/menu'
