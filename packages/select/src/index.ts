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

// Factory functions (primary API)
export { createSelect } from './create-select.js'
export { createMultiSelect } from './create-multi-select.js'

// Default instances for convenience
export { Select } from './select.js'
export { MultiSelect } from './multi-select.js'

// Types
export type {
  SelectProps,
  MultiSelectProps,
  SelectMenuDef,
  SelectNodeDef,
  SelectNode,
  SelectMenu,
  SelectItemDef,
  TriggerBindAPI,
  SelectTriggerSlotArgs,
  SelectValueSlotArgs,
  SelectItemSlotArgs,
  SelectSlots,
  SelectSlotProps,
  SelectClassNames,
  SelectThemeDef,
  SelectTheme,
} from './types.js'
export type { SelectControl, MultiSelectControl } from './control.js'

// Factory options types
export type {
  CreateSelectOptions,
  CreateSelectResult,
  SelectOptions,
  CompoundSelectTriggerProps,
  CompoundSelectValueProps,
} from './create-select.js'
export type {
  CreateMultiSelectOptions,
  CreateMultiSelectResult,
  MultiSelectOptions,
  CompoundMultiSelectTriggerProps,
  CompoundMultiSelectValueProps,
} from './create-multi-select.js'

// Validation helpers
export { validateSelectMenu, validateSelectNodes } from './types.js'

// Store hooks and context (for advanced use cases)
export {
  SelectMenuStoreProvider,
  createMultiSelectStore,
  createSelectStore,
  createSurfaceActiveIdSelector,
  createSurfaceQuerySelector,
  createSurfaceSelector,
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
