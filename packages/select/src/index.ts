/**
 * @bazza-ui/select
 *
 * Form-compatible Select and MultiSelect components.
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
 * ## Usage
 *
 * ### Simple API (items prop)
 * ```tsx
 * import { createSelect } from '@bazza-ui/select'
 *
 * const Select = createSelect()
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
 *
 * ### Advanced API (menu prop)
 * ```tsx
 * import { createSelect } from '@bazza-ui/select'
 *
 * const Select = createSelect({
 *   slots: { Item: CustomItem },
 *   classNames: { item: 'custom-class' }
 * })
 *
 * <Select
 *   name="fruit"
 *   value={value}
 *   onValueChange={setValue}
 *   menu={{
 *     nodes: [
 *       { kind: 'group', heading: 'Fruits', nodes: [...] },
 *       { kind: 'separator' },
 *       { kind: 'item', id: 'apple', label: 'Apple' },
 *     ]
 *   }}
 * />
 * ```
 *
 * ### Default Instances
 * For convenience, default instances are exported:
 * ```tsx
 * import { Select, MultiSelect } from '@bazza-ui/select'
 * ```
 */

// Re-export useful types from dependencies
export type {
  GroupDef,
  GroupNode,
  ItemDef,
  ItemNode,
  LoadingDef,
  LoadingNode,
  SeparatorDef,
  SeparatorNode,
} from '@bazza-ui/menu'
export type { MultiSelectControl, SelectControl } from './control.js'
export type {
  CompoundMultiSelectTriggerProps,
  CompoundMultiSelectValueProps,
  CreateMultiSelectOptions,
  CreateMultiSelectResult,
  MultiSelectOptions,
} from './create-multi-select.js'
export { createMultiSelect } from './create-multi-select.js'
// Factory options types
export type {
  CompoundSelectTriggerProps,
  CompoundSelectValueProps,
  CreateSelectOptions,
  CreateSelectResult,
  SelectOptions,
} from './create-select.js'
// Factory functions (primary API)
export { createSelect } from './create-select.js'
export { MultiSelect } from './multi-select.js'
// Default instances for convenience
export { Select } from './select.js'
export type {
  AimGuardState,
  CreateMultiSelectStoreOptions,
  CreateSelectStoreOptions,
  MultiSelectionState,
  SelectionState,
  SelectMenuStore,
  SelectMenuStoreActions,
  SelectMenuStoreProviderProps,
  SelectMenuStoreState,
  SelectSurfaceSlice,
  SingleSelectionState,
} from './store/index.js'

// Store hooks and context (for advanced use cases)
export {
  createMultiSelectStore,
  createSelectStore,
  createSurfaceActiveIdSelector,
  createSurfaceQuerySelector,
  createSurfaceSelector,
  SelectMenuStoreProvider,
  selectDisabled,
  selectFocusOwnerId,
  selectOpen,
  selectScopeId,
  selectSelection,
  selectSelectionMode,
  selectValue,
  selectValues,
  useSelectMenuActions,
  useSelectMenuStore,
  useSelectMenuStoreApi,
} from './store/index.js'
// Types
export type {
  MultiSelectProps,
  SelectClassNames,
  SelectItemDef,
  SelectItemSlotArgs,
  SelectMenu,
  SelectMenuDef,
  SelectNode,
  SelectNodeDef,
  SelectProps,
  SelectSlotProps,
  SelectSlots,
  SelectTheme,
  SelectThemeDef,
  SelectTriggerSlotArgs,
  SelectValueSlotArgs,
  TriggerBindAPI,
} from './types.js'
// Validation helpers
export { validateSelectMenu, validateSelectNodes } from './types.js'
