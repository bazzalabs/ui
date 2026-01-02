// ============================================================================
// Menu Namespace Export
// ============================================================================

/**
 * Menu component namespace.
 * Import as `import { Menu } from '@bazza-ui/dropdown-menu/v2'`
 *
 * @example
 * ```tsx
 * import { Menu } from '@bazza-ui/dropdown-menu/v2'
 *
 * <Menu.Root>
 *   <Menu.Trigger>Open</Menu.Trigger>
 *   <Menu.Portal>
 *     <Menu.Positioner>
 *       <Menu.Surface>
 *         <Menu.Item>Item 1</Menu.Item>
 *         <Menu.Item>Item 2</Menu.Item>
 *       </Menu.Surface>
 *     </Menu.Positioner>
 *   </Menu.Portal>
 * </Menu.Root>
 * ```
 */
export * as Menu from './components/index.parts.js'

// ============================================================================
// Type Exports
// ============================================================================

export type {
  RootProps,
  TriggerProps,
  PortalProps,
  PositionerProps,
  SurfaceProps,
  ItemProps,
  ItemState,
  GroupProps,
  LabelProps,
  SeparatorProps,
  SubmenuProps,
  SubmenuTriggerProps,
  CheckboxItemProps,
  CheckboxItemState,
  RadioGroupProps,
  RadioItemProps,
  RadioItemState,
  InputProps,
} from './components/index.js'

// ============================================================================
// Context Exports (for advanced usage)
// ============================================================================

export {
  useMenu,
  useMenuOptional,
  type MenuState,
  type MenuActions,
  type MenuContextValue,
} from './contexts/menu-context.js'

export {
  useSubmenu,
  useSubmenuRequired,
  useSubmenuDepth,
  useIsInSubmenu,
  type SubmenuState,
  type SubmenuActions,
  type SubmenuContextValue,
} from './contexts/submenu-context.js'

export {
  useCollection,
  useCollectionOptional,
  useRegisterNode,
  type CollectionContextValue,
  type UseRegisterNodeOptions,
} from './contexts/collection-context.js'

export {
  useFocusOwner,
  useFocusOwnerOptional,
} from './contexts/focus-owner-context.js'

// ============================================================================
// Type Exports
// ============================================================================

export type {
  NodeKind,
  NodeRegistration,
  SearchResult,
  Collection,
  CollectionActions,
  ActivationCause,
  Direction,
  Side,
  Align,
  OpenModality,
  FocusOwnerContextValue,
} from './types.js'

// ============================================================================
// Hook Exports
// ============================================================================

export {
  useDeepSearch,
  type UseDeepSearchOptions,
  type UseDeepSearchReturn,
  useHighlightedRow,
  type UseHighlightedRowOptions,
  type UseHighlightedRowReturn,
} from './hooks/index.js'

// ============================================================================
// Utility Exports
// ============================================================================

export { extractTextContent, textToId } from './utils/extract-text.js'
export { scoreNode, searchNodes, hasExactMatch } from './utils/scoring.js'
export { cn } from './utils/cn.js'
