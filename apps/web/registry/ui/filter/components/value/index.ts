// Controllers

// Shared editor content components
export {
  NumberEditorContent,
  type NumberEditorContentProps,
  OptionEditorContent,
  type OptionEditorContentProps,
  TextEditorContent,
  type TextEditorContentProps,
} from './editors'
export { FilterValueDateController } from './filter-value-date-controller'
export { FilterValueNumberController } from './filter-value-number-controller'

// Number item renderer (for ItemDef)
export { createNumberItemRenderer, renderNumberItem } from './number-item'
export {
  createNumberFilterItems,
  type NumberFilterItemData,
} from './number-menu'

// Option item renderer (for CheckboxItemDef)
export { createOptionItemRenderer, renderOptionItem } from './option-item'

// Menu creators (consolidated)
export {
  type CreateMultiOptionMenuProps,
  type CreateMultiOptionMenuResult,
  type CreateOptionMenuProps,
  type CreateOptionMenuResult,
  type CreateSelectableMenuResult,
  createMultiOptionMenu,
  createOptionMenu,
  createSelectableMenu,
  type SelectableColumnType,
} from './selectable-menu'

// Text item renderer (for ItemDef)
export { createTextItemRenderer, renderTextItem } from './text-item'
export { createTextFilterItems, type TextFilterItemData } from './text-menu'

// Types
export type {
  FilterValueControllerProps,
  FilterValueDisplayProps,
  FilterValueProps,
} from './types'
