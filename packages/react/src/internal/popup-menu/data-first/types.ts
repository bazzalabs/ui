import type {
  CheckboxGroupNodeDef,
  CheckboxItemNodeDef,
  DisplayCheckboxGroupNode as CoreDisplayCheckboxGroupNode,
  DisplayGroupNode as CoreDisplayGroupNode,
  DisplayRadioGroupNode as CoreDisplayRadioGroupNode,
  DisplayRowNode as CoreDisplayRowNode,
  DisplaySeparatorNode as CoreDisplaySeparatorNode,
  DisplaySubpageNode as CoreDisplaySubpageNode,
  RowNodeDef as CoreRowNodeDef,
  DisplayNodeTypes,
  GroupNodeDef,
  IncludeInDeepSearch,
  ItemNodeDef,
  LinkItemNodeDef,
  NodeDefTypes,
  QueryLoaderConfigBase,
  RadioGroupNodeDef,
  RadioItemNodeDef,
  SeparatorNodeDef,
  StaticLoaderConfigBase,
  SubmenuNodeDef,
  SubpageNodeDef,
  TreeItemNodeDef,
} from '@bazza-ui/menu-core'
import type * as React from 'react'
import type { PopupMenuCheckboxGroupProps } from '../components/checkbox-group/checkbox-group.js'
import type { PopupMenuCheckboxItemProps } from '../components/checkbox-item/checkbox-item.js'
import type { PopupMenuItemProps } from '../components/item/item.js'
import type { PopupMenuLinkItemProps } from '../components/link-item/link-item.js'
import type { PopupMenuRadioGroupProps } from '../components/radio-group/radio-group.js'
import type { PopupMenuRadioItemProps } from '../components/radio-item/radio-item.js'
import type { PopupMenuSubmenuTriggerProps } from '../components/submenu-trigger/submenu-trigger.js'
import type { PopupMenuSubpageTriggerProps } from '../components/subpage-trigger/subpage-trigger.js'
import type { PopupMenuNode } from '../menu-tree/types.js'

// The node def schema, Menu Node, and Display Node shapes are framework-free
// and live in `@bazza-ui/menu-core`. This file instantiates them with React's
// render callbacks and loader components, and keeps the public names.
export type {
  IncludeInDeepSearch,
  InitialQueryBehavior,
} from '@bazza-ui/menu-core'

// ============================================================================
// Async Loader Types
// ============================================================================

/**
 * Library-agnostic result from an async loader.
 * Compatible with TanStack Query, SWR, and custom loaders.
 */
export type AsyncLoaderSource = 'tanstack-query' | 'swr' | 'vanilla' | 'custom'

/**
 * Canonical async loader status.
 * - 'idle': no request has been executed yet
 * - 'pending': request in progress and no successful data yet
 * - 'success': last resolved state has data
 * - 'error': last resolved state errored
 */
export type AsyncLoaderStatus = 'idle' | 'pending' | 'success' | 'error'

/**
 * Canonical fetch status.
 */
export type AsyncLoaderFetchStatus = 'idle' | 'fetching' | 'paused'

/**
 * Loading phase for distinguishing first-load from background revalidation.
 */
export type AsyncLoaderLoadingPhase = 'none' | 'initial' | 'background'

export interface AsyncLoaderResult<TData, TRaw = unknown> {
  /** The loaded data, undefined while loading or on error */
  data: TData | undefined

  /** Raw result object returned by the underlying data library */
  raw?: TRaw

  /** Source data library backing this result */
  source?: AsyncLoaderSource

  /** Error if the load failed, null otherwise */
  error: Error | null

  /** Canonical status state */
  status: AsyncLoaderStatus

  /** Canonical fetch state */
  fetchStatus: AsyncLoaderFetchStatus

  /** Distinguishes initial load vs background fetch */
  loadingPhase: AsyncLoaderLoadingPhase

  /** True during the initial loading phase (TanStack-aligned semantics) */
  isLoading: boolean

  /** Whether any fetch is currently in-flight */
  isFetching: boolean

  /** Alias of `isLoading` for explicit phase naming */
  isInitialLoading: boolean

  /** True when background re-fetch is in-flight */
  isRefetching: boolean

  /** Whether query state is pending */
  isPending: boolean

  /** Whether query state is successful */
  isSuccess: boolean

  /** Whether the loader encountered an error */
  isError: boolean

  /** Whether fetching is paused */
  isPaused: boolean

  /** Whether data is currently available */
  hasData: boolean

  /** Whether any fetch has completed at least once */
  hasFetched: boolean

  /** Optional function to refetch the data */
  refetch?: () => unknown
}

/**
 * Props passed to loader components.
 * The component should call hooks internally and pass the result to children.
 */
export interface LoaderComponentProps {
  /** Search query (for query loaders) */
  query: string
  /** Whether the loader should execute its fetch/query hook */
  enabled?: boolean
  /** Render function receiving loader state */
  children: (state: AsyncLoaderResult<NodeDef[]>) => React.ReactNode
}

/**
 * Static loader configuration.
 * Loads data once, then filters client-side.
 */
export interface StaticLoaderConfig
  extends StaticLoaderConfigBase<React.ComponentType<LoaderComponentProps>> {}

/**
 * Query loader configuration.
 * Refetches based on search query - server does the filtering.
 */
export interface QueryLoaderConfig
  extends QueryLoaderConfigBase<
    React.ComponentType<LoaderComponentProps>,
    NodeDef
  > {}

/**
 * Union of all async loader configurations.
 */
export type AsyncLoaderConfig = StaticLoaderConfig | QueryLoaderConfig

/**
 * Static async nodes configuration for submenus.
 */
export type StaticAsyncNodesConfig = StaticLoaderConfig

/**
 * Query async nodes configuration for submenus.
 */
export type QueryAsyncNodesConfig = QueryLoaderConfig

/**
 * Async nodes configuration for submenus.
 * Union of static and query loader configs.
 */
export type AsyncNodesConfig = StaticAsyncNodesConfig | QueryAsyncNodesConfig

/**
 * Async state exposed to submenu render functions.
 */
export interface AsyncRenderState {
  /** Canonical status state */
  status: AsyncLoaderStatus
  /** Canonical fetch state */
  fetchStatus: AsyncLoaderFetchStatus
  /** Distinguishes initial load vs background fetch */
  loadingPhase: AsyncLoaderLoadingPhase
  /** True during the initial loading phase */
  isLoading: boolean
  /** Whether any fetch is currently in-flight */
  isFetching: boolean
  /** Alias of `isLoading` for explicit phase naming */
  isInitialLoading: boolean
  /** True when background re-fetch is in-flight */
  isRefetching: boolean
  /** Whether the loader encountered an error */
  isError: boolean
  /** The error if any */
  error: Error | null
  /** For query loaders: whether query is below minQueryLength */
  isBelowMinLength?: boolean
}

/**
 * Aggregate async state exposed to DataList children.
 */
export interface AsyncState {
  /** Any loader is currently in initial loading phase */
  isLoading: boolean

  /** Any loader is currently fetching */
  isFetching: boolean

  /** Any loader is in first-load phase */
  isInitialLoading: boolean

  /** Any loader is in background refetch phase */
  isRefetching: boolean

  /** All registered loaders are in background refetch phase */
  isAllRefetching: boolean

  /** Static loaders specifically are loading */
  isStaticLoading: boolean

  /** Static loaders in first-load phase */
  isStaticInitialLoading: boolean

  /** Static loaders in background refetch phase */
  isStaticRefetching: boolean

  /** Query loaders specifically are loading */
  isQueryLoading: boolean

  /** Query loaders in first-load phase */
  isQueryInitialLoading: boolean

  /** Query loaders in background refetch phase */
  isQueryRefetching: boolean

  /** Menus that failed (skipped from results) */
  skippedMenus: Array<
    | { kind: 'root'; reason: 'error' }
    | { kind: 'branch'; id: string; reason: 'error' }
  >
}

// ============================================================================
/**
 * Branch node info passed in breadcrumbs context.
 * Contains the full submenu/subpage definition for maximum flexibility.
 */
export interface BreadcrumbNode {
  /** The branch node definition */
  node: SubmenuDef | SubpageDef | TreeItemDef
  /** The branch Menu Node. `node`, `value`, and `id` mirror its def for compatibility. */
  menuNode: PopupMenuNode<SubmenuDef | SubpageDef | TreeItemDef>
  /** The branch node's value */
  value: string
  /** The branch node's explicit id (if provided) */
  id?: string
}

// ============================================================================
// Render Context - passed to all render functions
// ============================================================================

/**
 * Context passed to item, submenu, and subpage render functions.
 * Provides information about the current rendering context (search, breadcrumbs, state).
 */
export interface RowRenderContext {
  /**
   * Search context - the query in the menu where this row is being rendered.
   * `null` if no active search (browsing mode).
   */
  search: {
    /** Current search query */
    query: string
    /** Match score for this row (higher = better match). */
    score: number
  } | null

  /**
   * Full path of branch nodes from root to this row's parent.
   * Contains the full submenu/subpage node definitions for maximum flexibility.
   * Empty array [] for items directly in root menu.
   */
  breadcrumbs: BreadcrumbNode[]

  /**
   * True if this row is being rendered outside its "home" menu
   * (surfaced via deep search from an ancestor menu).
   */
  isDeepSearchResult: boolean

  /** Whether this row is currently highlighted/focused */
  highlighted: boolean

  /** Whether this row is disabled */
  disabled: boolean

  /**
   * The group this item belongs to, if any.
   * `null` if the item is not inside a group.
   */
  group: { id: string; label?: string } | null

  /** Tree rendering context, or null for non-tree and search rows. */
  tree: {
    depth: number
    hasChildren: boolean
    isLastChild: boolean
    ancestorsLast: boolean[]
    header: boolean
  } | null
}

// ============================================================================
// Item Render Params
// ============================================================================

/**
 * Props to spread onto the Item component.
 * Derived from PopupMenuItemProps.
 */
export type ItemRenderProps = {
  /**
   * Canonical Resolved ID for the item, generated by the root policy: the
   * encoded surface Definition Path by default, or the Definition Key in
   * menu scope.
   * Must be passed to the rendered component for navigation to work.
   */
  id: string
  /**
   * The original value from the node definition.
   * Use this for display, search matching, or any logic that needs the raw value.
   */
  value: string
} & Required<Pick<PopupMenuItemProps, 'disabled'>> &
  Pick<
    PopupMenuItemProps,
    'closeOnClick' | 'onSelect' | 'shortcut' | 'forceOrder' | 'forceScore'
  >

/**
 * Parameters passed to item render functions.
 */
export interface ItemRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the Item component */
  props: ItemRenderProps
  /** Context for conditional rendering (includes props values for convenience) */
  context: RowRenderContext & {
    /** The node's value (ItemDef.value) */
    value: string
    disabled: boolean
  }
}

export type LinkItemRenderProps = {
  id: string
  value: string
  href: string
} & Required<Pick<PopupMenuLinkItemProps, 'disabled'>> &
  Pick<
    PopupMenuLinkItemProps,
    'closeOnClick' | 'onSelect' | 'shortcut' | 'forceOrder' | 'forceScore'
  >

export interface LinkItemRenderParams {
  node: PopupMenuNode
  props: LinkItemRenderProps
  context: RowRenderContext & { value: string; disabled: boolean }
}

/** Props to spread onto a TreeItem component. */
export type TreeItemRenderProps = Omit<ItemRenderProps, 'shortcut'> & {
  /** Whether this row can be selected. */
  selectable: boolean
}

/** Parameters passed to tree item render functions. */
export interface TreeItemRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  props: TreeItemRenderProps
  context: RowRenderContext & {
    value: string
    disabled: boolean
  }
}

// ============================================================================
// Radio Item Render Params
// ============================================================================

/**
 * Props to spread onto the RadioItem component.
 * Derived from PopupMenuRadioItemProps.
 */
export type RadioItemRenderProps = {
  /**
   * Qualified unique ID for the radio item.
   * Must be passed to the rendered component for navigation to work.
   */
  id: string
} & Required<Pick<PopupMenuRadioItemProps, 'value' | 'disabled'>> &
  Pick<
    PopupMenuRadioItemProps,
    'closeOnClick' | 'onSelect' | 'shortcut' | 'forceOrder' | 'forceScore'
  >

/**
 * Parameters passed to radio item render functions.
 */
export interface RadioItemRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the RadioItem component */
  props: RadioItemRenderProps
  /** Context for conditional rendering (includes props values for convenience) */
  context: RowRenderContext & {
    /** The node's value (RadioItemDef.value) */
    value: string
    disabled: boolean
  }
}

// ============================================================================
// Submenu Render Params
// ============================================================================

/**
 * Props to spread onto the SubmenuTrigger component.
 * Derived from PopupMenuSubmenuTriggerProps.
 */
export type SubmenuRenderProps = {
  /**
   * Qualified unique ID for the submenu trigger.
   * Must be passed to the rendered component for navigation to work.
   */
  id: string
  /**
   * The original value from the node definition.
   */
  value: string
} & Required<Pick<PopupMenuSubmenuTriggerProps, 'disabled'>> &
  Pick<PopupMenuSubmenuTriggerProps, 'forceOrder' | 'forceScore'>

/**
 * Parameters passed to submenu render functions.
 * Includes context plus the submenu's child nodes and render function.
 */
export interface SubmenuRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the SubmenuTrigger */
  props: SubmenuRenderProps
  /** Context for conditional rendering (includes props values for convenience) */
  context: RowRenderContext & {
    /** The node's value (SubmenuDef.value) */
    value: string
    disabled: boolean
    /** Async loading state (if asyncNodes configured) */
    async?: AsyncRenderState
  }
  /** The branch's resolved static child Menu Nodes, in def order. Loader results are grafted as children of `node` but are not included here — use `asyncContent` to load them. Authored fields are on `child.def`. */
  nodes: PopupMenuNode[]
  /**
   * Async content configuration for this submenu.
   * Pass this to the submenu's DataSurface to enable async loading
   * with the submenu's own search query (independent of parent search).
   */
  asyncContent?: AsyncNodesConfig
  /** Render one child Menu Node from `nodes`. */
  renderNode: (node: PopupMenuNode) => React.ReactNode
}

// ============================================================================
// Subpage Render Types
// ============================================================================

/**
 * Props to spread onto the SubpageTrigger component.
 * Derived from PopupMenuSubpageTriggerProps.
 */
export type SubpageTriggerRenderProps = {
  /**
   * Qualified unique ID for the subpage trigger.
   * Must be passed to the rendered component for navigation to work.
   */
  id: string
  /**
   * The original value from the node definition.
   */
  value: string
  /**
   * Computed page ID for the associated Subpage content.
   * Must be passed to `targetPageId` on SubpageTrigger.
   */
  targetPageId: string
} & Required<Pick<PopupMenuSubpageTriggerProps, 'disabled'>>

/**
 * Parameters passed to subpage trigger render functions.
 */
export interface SubpageTriggerRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the SubpageTrigger */
  props: SubpageTriggerRenderProps
  /** Context for conditional rendering (includes props values for convenience) */
  context: RowRenderContext & {
    /** The node's value (SubpageDef.value) */
    value: string
    disabled: boolean
    /** Async loading state (if asyncNodes configured) */
    async?: AsyncRenderState
  }
}

/**
 * Parameters passed to subpage content render functions.
 * The returned JSX should include a `<PopupMenu.Subpage pageId={pageId}>` wrapper.
 */
export interface SubpageContentRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** The subpage's Resolved ID (`node.id`); pass it to `<Subpage pageId>`. */
  pageId: string
  /** Context for conditional rendering */
  context: RowRenderContext & {
    /** The node's value (SubpageDef.value) */
    value: string
    disabled: boolean
    /** Async loading state (if asyncNodes configured) */
    async?: AsyncRenderState
  }
  /** The branch's resolved static child Menu Nodes, in def order. Loader results are grafted as children of `node` but are not included here — use `asyncContent` to load them. Authored fields are on `child.def`. */
  nodes: PopupMenuNode[]
  /**
   * Async content configuration for this subpage.
   * Pass this to the subpage's DataSurface to enable async loading
   * with the subpage's own search query (independent of parent search).
   */
  asyncContent?: AsyncNodesConfig
  /** Render one child Menu Node from `nodes`. */
  renderNode: (node: PopupMenuNode) => React.ReactNode
}

// ============================================================================
// Group Render Types
// ============================================================================

/**
 * Context passed to group render functions.
 * Contains information about the group's state during search.
 */
export interface GroupRenderContext {
  /**
   * Search context with the best match score among items in this group.
   * `null` if no active search (browsing mode).
   */
  search: {
    /** Current search query */
    query: string
    /** Best match score among items in this group (higher = better match). */
    bestScore: number
  } | null

  /** Number of matching items in this group */
  matchCount: number

  /**
   * Breadcrumb nodes if this group is from a surfaced submenu.
   * Empty array [] for groups in the root menu.
   */
  breadcrumbs: BreadcrumbNode[]

  /** Whether this group is from deep search (surfaced from a submenu) */
  isDeepSearchResult: boolean
}

/**
 * Parameters passed to group render functions.
 */
export interface GroupRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props (empty for groups, but consistent structure) */
  props: Record<string, never>
  /** Context for conditional rendering (includes label for convenience) */
  context: GroupRenderContext & {
    /** The group's label */
    label?: string
  }
  /** Pre-rendered matching children */
  children: React.ReactNode
}

/**
 * Parameters passed to group label render functions.
 */
export interface GroupLabelRenderParams {
  /** The resolved menu node for this group — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the label element (stable id for aria wiring) */
  props: { id: string }
  /** Context for conditional rendering (includes label for convenience) */
  context: GroupRenderContext & {
    /** The group's label */
    label?: string
  }
}

// ============================================================================
// Checkbox Item Types
// ============================================================================

/**
 * Props to spread onto the CheckboxItem component.
 * Derived from PopupMenuCheckboxItemProps.
 */
export type CheckboxItemRenderProps = {
  /**
   * Qualified unique ID for the checkbox item.
   * Must be passed to the rendered component for navigation to work.
   */
  id: string
  /**
   * The original value from the node definition.
   */
  value: string
} & Required<Pick<PopupMenuCheckboxItemProps, 'disabled'>> &
  Pick<
    PopupMenuCheckboxItemProps,
    'checked' | 'onCheckedChange' | 'closeOnClick' | 'forceOrder' | 'forceScore'
  >

/**
 * Parameters passed to checkbox item render functions.
 */
export interface CheckboxItemRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the CheckboxItem component */
  props: CheckboxItemRenderProps
  /** Context for conditional rendering (includes props values for convenience) */
  context: RowRenderContext & {
    /** The node's value (CheckboxItemDef.value) */
    value: string
    checked?: boolean
    disabled: boolean
  }
}

// ============================================================================
// Radio Group Types
// ============================================================================

/**
 * Props to spread onto the RadioGroup component.
 * Derived from PopupMenuRadioGroupProps.
 */
export type RadioGroupRenderProps = Required<
  Pick<PopupMenuRadioGroupProps, 'disabled'>
> &
  Pick<PopupMenuRadioGroupProps, 'value' | 'onValueChange'>

/**
 * Parameters passed to radio group render functions.
 */
export interface RadioGroupRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the RadioGroup component */
  props: RadioGroupRenderProps
  /** Context for conditional rendering */
  context: GroupRenderContext & {
    /** The radio group's label */
    label?: string
    /** Current selected value */
    value?: string
    /** Whether the radio group is disabled */
    disabled: boolean
  }
  /** Pre-rendered radio items */
  children: React.ReactNode
}

/**
 * Parameters passed to radio group label render functions.
 */
export interface RadioGroupLabelRenderParams {
  /** The resolved menu node for this group — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the label element (stable id for aria wiring) */
  props: { id: string }
  /** Context for conditional rendering (includes label for convenience) */
  context: GroupRenderContext & {
    /** The radio group's label */
    label?: string
    /** Current selected value */
    value?: string
    /** Whether the radio group is disabled */
    disabled: boolean
  }
}

// ============================================================================
// Checkbox Group Types
// ============================================================================

/**
 * Props to spread onto the CheckboxGroup component.
 * Derived from PopupMenuCheckboxGroupProps.
 */
export type CheckboxGroupRenderProps = Required<
  Pick<PopupMenuCheckboxGroupProps, 'disabled'>
> &
  Pick<PopupMenuCheckboxGroupProps, 'onValueChange'> & { value: string[] }
/**
 * Parameters passed to checkbox group render functions.
 */
export interface CheckboxGroupRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the CheckboxGroup component */
  props: CheckboxGroupRenderProps
  /** Context for conditional rendering */
  context: GroupRenderContext & {
    /** The checkbox group's label */
    label?: string
    /** Current checked values */
    value?: string[]
    /** Whether the checkbox group is disabled */
    disabled: boolean
  }
  /** Pre-rendered checkbox items */
  children: React.ReactNode
}
/**
 * Parameters passed to checkbox group label render functions.
 */
export interface CheckboxGroupLabelRenderParams {
  /** The resolved menu node for this group — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the label element (stable id for aria wiring) */
  props: { id: string }
  /** Context for conditional rendering (includes label for convenience) */
  context: GroupRenderContext & {
    /** The checkbox group's label */
    label?: string
    /** Current checked values */
    value?: string[]
    /** Whether the checkbox group is disabled */
    disabled: boolean
  }
}

// ============================================================================
// Node Definitions
// ============================================================================

/**
 * The React types `@bazza-ui/menu-core`'s node def schema is instantiated
 * with: render callbacks that return a `ReactNode`, React loader components,
 * and the defs below.
 */
export interface PopupMenuNodeDefTypes extends NodeDefTypes {
  nodeDef: NodeDef
  radioItemDef: RadioItemDef
  checkboxItemDef: CheckboxItemDef
  asyncNodes: AsyncNodesConfig
  render: {
    item: (params: ItemRenderParams) => React.ReactNode
    linkItem: (params: LinkItemRenderParams) => React.ReactNode
    treeItem: (params: TreeItemRenderParams) => React.ReactNode
    radioItem: (params: RadioItemRenderParams) => React.ReactNode
    checkboxItem: (params: CheckboxItemRenderParams) => React.ReactNode
    submenu: (params: SubmenuRenderParams) => React.ReactNode
    subpageTrigger: (params: SubpageTriggerRenderParams) => React.ReactNode
    subpageContent: (params: SubpageContentRenderParams) => React.ReactNode
    separator: (params: SeparatorRenderParams) => React.ReactNode
    group: (params: GroupRenderParams) => React.ReactNode
    groupLabel: (params: GroupLabelRenderParams) => React.ReactNode
    radioGroup: (params: RadioGroupRenderParams) => React.ReactNode
    radioGroupLabel: (params: RadioGroupLabelRenderParams) => React.ReactNode
    checkboxGroup: (params: CheckboxGroupRenderParams) => React.ReactNode
    checkboxGroupLabel: (
      params: CheckboxGroupLabelRenderParams,
    ) => React.ReactNode
  }
}

/**
 * Item node definition.
 * Represents a selectable menu item.
 * Its item fields (`keywords`, `disabled`, `onSelect`, `closeOnClick`, `shortcut`, `forceOrder`, `forceScore`) are the ones PopupMenuItemProps takes, with the same types and docs; `value` is required here.
 */
export interface ItemDef extends ItemNodeDef<PopupMenuNodeDefTypes> {}

/**
 * Link item node definition. Represents a menu row that navigates to `href` when activated.
 */
export interface LinkItemDef extends LinkItemNodeDef<PopupMenuNodeDefTypes> {}

/** Tree item node definition. */
export interface TreeItemDef extends TreeItemNodeDef<PopupMenuNodeDefTypes> {}

/**
 * Radio item node definition.
 * Represents a selectable radio menu item for use within RadioGroupDef.
 * Its radio item fields (`keywords`, `disabled`, `onSelect`, `closeOnClick`, `shortcut`, `forceOrder`, `forceScore`) are the ones PopupMenuRadioItemProps takes, with the same types and docs; `value` is required here.
 */
export interface RadioItemDef extends RadioItemNodeDef<PopupMenuNodeDefTypes> {}

/**
 * Checkbox item node definition.
 * Represents a toggleable checkbox menu item.
 * Its checkbox item fields other than `value` are the ones PopupMenuCheckboxItemProps takes, with the same types and docs.
 */
export interface CheckboxItemDef
  extends CheckboxItemNodeDef<PopupMenuNodeDefTypes> {}

/**
 * Submenu node definition.
 * Represents a submenu trigger that opens a nested menu.
 * Its trigger fields other than `id` are the ones PopupMenuSubmenuTriggerProps takes, with the same types and docs; `value` is required here.
 */
export interface SubmenuDef extends SubmenuNodeDef<PopupMenuNodeDefTypes> {}

/**
 * Subpage node definition.
 * Represents a trigger row that opens a page in the same popup.
 * Its trigger fields other than `id` are the ones PopupMenuSubpageTriggerProps takes, with the same types and docs; `value` is required here.
 */
export interface SubpageDef extends SubpageNodeDef<PopupMenuNodeDefTypes> {}

/**
 * Render params for separator nodes.
 */
export interface SeparatorRenderParams {
  /** Props to spread on the separator element */
  props: {
    /** Unique identifier */
    id?: string
  }
}

/**
 * Separator node definition.
 * Represents a visual separator between items.
 */
export interface SeparatorDef extends SeparatorNodeDef<PopupMenuNodeDefTypes> {}

/**
 * Group node definition.
 * Represents a group of items with an optional label.
 */
export interface GroupDef extends GroupNodeDef<PopupMenuNodeDefTypes> {}

/**
 * Radio group node definition.
 * Represents a group of radio items where only one can be selected.
 * Its group fields other than `id` are the ones PopupMenuRadioGroupProps takes, with the same types and docs.
 */
export interface RadioGroupDef
  extends RadioGroupNodeDef<PopupMenuNodeDefTypes> {}

/**
 * Helper function to create a radio group definition with proper typing.
 */
export function defineRadioGroup(def: RadioGroupDef): RadioGroupDef {
  return def
}

/**
 * Checkbox group node definition.
 * Represents a group of checkbox items whose checked state the group owns as one array of values.
 * Its group fields other than `id` and `value` are the ones PopupMenuCheckboxGroupProps takes, with the same types and docs.
 */
export interface CheckboxGroupDef
  extends CheckboxGroupNodeDef<PopupMenuNodeDefTypes> {}
/**
 * Helper function to create a checkbox group definition with proper typing.
 */
export function defineCheckboxGroup(def: CheckboxGroupDef): CheckboxGroupDef {
  return def
}

/**
 * Union of all node definition types.
 */
export type NodeDef =
  | ItemDef
  | LinkItemDef
  | TreeItemDef
  | RadioItemDef
  | CheckboxItemDef
  | SubmenuDef
  | SubpageDef
  | SeparatorDef
  | GroupDef
  | RadioGroupDef
  | CheckboxGroupDef

// ============================================================================
// Scored Node - internal type for search results
// ============================================================================

/**
 * A node with its search score and breadcrumb path.
 * Used internally during filtering and scoring.
 */
export interface ScoredNode {
  /** The row's Menu Node; its authored definition is `node.def`. */
  node: PopupMenuNode<RowNodeDef>
  /** Search match score (higher = better match). */
  score: number
  /**
   * Breadcrumb nodes leading to this node.
   * Contains the full submenu definitions for maximum flexibility.
   */
  breadcrumbs: BreadcrumbNode[]
  /** The group this node belongs to, if any */
  group: {
    id: string
    label?: string
    groupDef: GroupDef
    menuNode: PopupMenuNode<GroupDef>
  } | null
  /** The radio group this node belongs to, if any */
  radioGroup: {
    id: string
    label?: string
    radioGroupDef: RadioGroupDef
    menuNode: PopupMenuNode<RadioGroupDef>
  } | null
  /** The checkbox group this node belongs to, if any */
  checkboxGroup: {
    id: string
    label?: string
    checkboxGroupDef: CheckboxGroupDef
    menuNode: PopupMenuNode<CheckboxGroupDef>
  } | null
}

/** A row surfaced by `flattenNodes`, with the containers it was found under. */
export interface FlattenedNode {
  /** The row's Menu Node; its authored definition is `node.def`. */
  node: PopupMenuNode<RowNodeDef>
  /** Breadcrumb nodes (branch nodes from root to parent) */
  breadcrumbs: BreadcrumbNode[]
  /** The group this node belongs to, if any */
  group: {
    id: string
    label?: string
    groupDef: GroupDef
    menuNode: PopupMenuNode<GroupDef>
  } | null
  /** The radio group this node belongs to, if any */
  radioGroup: {
    id: string
    label?: string
    radioGroupDef: RadioGroupDef
    menuNode: PopupMenuNode<RadioGroupDef>
  } | null
  /** The checkbox group this node belongs to, if any */
  checkboxGroup: {
    id: string
    label?: string
    checkboxGroupDef: CheckboxGroupDef
    menuNode: PopupMenuNode<CheckboxGroupDef>
  } | null
  /** Keywords inherited from tree ancestors. */
  inheritedKeywords: string[]
}

// ============================================================================
// Display Node - node with render context attached
// ============================================================================

export type RowNodeDef = CoreRowNodeDef<PopupMenuNodeDefTypes>

/**
 * The types `@bazza-ui/menu-core`'s Display Node shapes are instantiated
 * with: this package's Menu Nodes, defs, and render contexts.
 */
export interface PopupMenuDisplayNodeTypes extends DisplayNodeTypes {
  rowNode: PopupMenuNode<RowNodeDef>
  subpageNode: PopupMenuNode<SubpageDef>
  groupNode: PopupMenuNode<GroupDef>
  radioGroupNode: PopupMenuNode<RadioGroupDef>
  checkboxGroupNode: PopupMenuNode<CheckboxGroupDef>
  separatorNode: PopupMenuNode<SeparatorDef>
  checkboxGroupDef: CheckboxGroupDef
  rowContext: RowRenderContext
  groupContext: GroupRenderContext
  rowDisplayNode: DisplayRowNode
}

/**
 * A row node ready for display with its render context.
 * Used for items, radio items, checkbox items, and submenu triggers.
 */
export interface DisplayRowNode
  extends CoreDisplayRowNode<PopupMenuDisplayNodeTypes> {}

/**
 * A subpage content node ready for display with its render context.
 * Used by DataSubpages to render subpage content alongside the root Surface.
 */
export interface DisplaySubpageNode
  extends CoreDisplaySubpageNode<PopupMenuDisplayNodeTypes> {}

/**
 * A group node ready for display with its render context.
 * Contains the group definition and its matching items.
 */
export interface DisplayGroupNode
  extends CoreDisplayGroupNode<PopupMenuDisplayNodeTypes> {}

/**
 * A radio group node ready for display with its render context.
 * Contains the radio group definition and its items.
 */
export interface DisplayRadioGroupNode
  extends CoreDisplayRadioGroupNode<PopupMenuDisplayNodeTypes> {}
/**
 * A checkbox group node ready for display with its render context.
 * Contains the checkbox group definition and its items.
 */
export interface DisplayCheckboxGroupNode
  extends CoreDisplayCheckboxGroupNode<PopupMenuDisplayNodeTypes> {}

/**
 * A separator node ready for display.
 */
export interface DisplaySeparatorNode
  extends CoreDisplaySeparatorNode<PopupMenuDisplayNodeTypes> {}

/**
 * Union of all display node types.
 * Can be a row node (item/submenu/subpage), group node, radio group node, or separator.
 */
export type DisplayNode =
  | DisplayRowNode
  | DisplayGroupNode
  | DisplayRadioGroupNode
  | DisplayCheckboxGroupNode
  | DisplaySeparatorNode

/**
 * Type guard for DisplayGroupNode.
 */
export function isDisplayGroupNode(
  node: DisplayNode,
): node is DisplayGroupNode {
  return 'kind' in node && node.kind === 'group'
}

/**
 * Type guard for DisplayRadioGroupNode.
 */
export function isDisplayRadioGroupNode(
  node: DisplayNode,
): node is DisplayRadioGroupNode {
  return 'kind' in node && node.kind === 'radio-group'
}
/**
 * Type guard for DisplayCheckboxGroupNode.
 */
export function isDisplayCheckboxGroupNode(
  node: DisplayNode,
): node is DisplayCheckboxGroupNode {
  return 'kind' in node && node.kind === 'checkbox-group'
}

/**
 * Type guard for DisplaySeparatorNode.
 */
export function isDisplaySeparatorNode(
  node: DisplayNode,
): node is DisplaySeparatorNode {
  return 'kind' in node && node.kind === 'separator'
}

/**
 * Type guard for DisplayRowNode (items, checkbox items, submenus, subpages).
 */
export function isDisplayRowNode(node: DisplayNode): node is DisplayRowNode {
  return 'kind' in node && node.kind === 'row'
}

// ============================================================================
// Deep Search Configuration
// ============================================================================

/**
 * Defines how groups behave during deep search.
 * - 'flatten': Groups become invisible, items shown in flat list by score.
 * - 'preserve': Groups are shown as containers with their matching items.
 * Note: Radio groups are ALWAYS preserved regardless of this setting.
 */
export type GroupBehavior = 'flatten' | 'preserve'

/**
 * Defines how radio groups behave during deep search.
 * - 'flatten': Radio group items are shown individually in the flat list (not recommended).
 * - 'preserve': Radio group is shown with only matching items visible.
 * - 'preserve-show-all': Radio group is shown with ALL items visible when any item matches.
 *   This is useful when you want users to see all options in a radio group.
 */
export type RadioGroupBehavior = 'flatten' | 'preserve' | 'preserve-show-all'
/**
 * Defines how checkbox groups behave during deep search.
 * - 'flatten': Checkbox group items are shown individually in the flat list (not recommended).
 * - 'preserve': Checkbox group is shown with only matching items visible.
 * - 'preserve-show-all': Checkbox group is shown with ALL items visible when any item matches.
 *   This is useful when you want users to see all options in a checkbox group.
 */
export type CheckboxGroupBehavior = 'flatten' | 'preserve' | 'preserve-show-all'

/**
 * How a surface's `asyncContent` rows combine with its `content`.
 * See `DataSurfaceProps.asyncContentMode`.
 */
export type AsyncContentMode = 'replace' | 'append'

/**
 * Defines how deep-search async results are revealed.
 * - 'stream': show available results immediately and append new async batches as they resolve.
 * - 'block': hide all deep-search rows until every participating async loader resolves.
 */
export type AsyncResultBehavior = 'stream' | 'block'

/**
 * How the descendants of a disabled branch (a submenu or subpage with
 * `disabled: true`) participate in deep search.
 * - 'exclude': descendants are not deep results; the disabled trigger still is.
 *   Equivalent to the branch's `includeInDeepSearch` defaulting to `'trigger-only'`.
 * - 'inherit': descendants are deep results that inherit `disabled` — shown, not selectable.
 */
export type DisabledBranchBehavior = 'exclude' | 'inherit'

/**
 * Configuration for deep search behavior.
 */
export interface DeepSearchConfig {
  /** Whether deep search is enabled */
  enabled?: boolean
  /** Minimum query length before deep search activates */
  minLength?: number
  /**
   * How groups behave during search results.
   * Only affects search mode - groups are always shown in browse mode.
   * Note: Radio groups have their own behavior controlled by radioGroupSearchBehavior.
   * @default 'preserve'
   */
  groupSearchBehavior?: GroupBehavior
  /**
   * How radio groups behave during search results.
   * - 'flatten': Radio items shown individually (not recommended).
   * - 'preserve': Only matching radio items are shown (default).
   * - 'preserve-show-all': All radio items are shown when any item matches.
   * @default 'preserve'
   */
  radioGroupSearchBehavior?: RadioGroupBehavior
  /**
   * How checkbox groups behave during search results.
   * - 'flatten': Checkbox items shown individually (not recommended).
   * - 'preserve': Only matching checkbox items are shown (default).
   * - 'preserve-show-all': All checkbox items are shown when any item matches.
   * @default 'preserve'
   */
  checkboxGroupSearchBehavior?: CheckboxGroupBehavior
  /**
   * Whether to sort groups by their best-matching item's score.
   * Only applies when groupSearchBehavior: 'preserve'.
   * @default true
   */
  sortGroups?: boolean
  /**
   * How async deep-search results are revealed.
   * - 'stream': emit available results immediately, append later async batches (default)
   * - 'block': show loading state only until all loaders resolve, then render once
   * @default 'stream'
   */
  asyncResultBehavior?: AsyncResultBehavior
  /**
   * How descendants of a disabled branch appear in deep search results.
   * - 'exclude': not shown; the disabled branch trigger still appears (default)
   * - 'inherit': shown as deep results with inherited `disabled`
   * An explicit `includeInDeepSearch` on the branch def always takes precedence.
   * @default 'exclude'
   */
  disabledBranchBehavior?: DisabledBranchBehavior
}

// ============================================================================
// Data Surface Props
// ============================================================================

/**
 * Props for the DataSurface component.
 */
export interface DataSurfaceProps {
  /**
   * The menu content (node definitions with render functions). Resolved nodes
   * are accepted anywhere defs are; they are unwrapped to their defs, and
   * re-supplying the same nodes preserves identity.
   */
  content?: NodeDef[] | PopupMenuNode[]

  /**
   * Async content configuration for root-level async loading.
   * When provided, the Loader component will be rendered to fetch async data.
   * How its rows combine with `content` is set by `asyncContentMode`.
   */
  asyncContent?: AsyncLoaderConfig

  /**
   * How rows from `asyncContent` combine with `content` once they load.
   * - `'replace'`: the loaded rows replace `content` (`content` shows until then).
   * - `'append'`: `content` stays first and the loaded rows follow it. A loaded
   *   row whose Definition Key matches a row already in `content` (including
   *   rows inside groups and tree items) is dropped, so local rows win.
   * @default 'replace'
   */
  asyncContentMode?: AsyncContentMode

  /**
   * When rows from `asyncContent` appear.
   * - `'stream'`: as soon as they load (local `content` shows meanwhile).
   * - `'block'`: only once the loader has settled for the current search. Until
   *   then the previous settled list stays up unchanged; before anything has
   *   settled the list is empty and `Loading` shows. Rows kept from a previous
   *   search while the next one loads don't count as settled.
   *
   * Deep search has its own `deepSearch.asyncResultBehavior`, which still shows
   * the loading state while a new search loads.
   * @default 'stream'
   */
  asyncContentReveal?: AsyncResultBehavior

  /** Deep search configuration */
  deepSearch?: DeepSearchConfig | boolean

  /**
   * Default inclusion mode for descendant branch nodes in deep search results.
   * Submenus/subpages can override via `includeInDeepSearch`.
   * @default true
   */
  includeInDeepSearch?: IncludeInDeepSearch

  /** Filter function or false to disable filtering */
  filter?:
    | ((value: string, search: string, keywords?: string[]) => number)
    | false

  /**
   * Transforms search input before filtering and visibility logic.
   * @default trim whitespace (`search.trim()`)
   */
  normalizeSearch?: (search: string) => string

  /** Controlled search value */
  search?: string

  /** Callback when search value changes */
  onSearchChange?: (search: string) => void

  /** Default search value for uncontrolled usage */
  defaultSearch?: string

  /** Whether navigation should loop */
  loop?: boolean

  /** Auto-highlight behavior when menu opens */
  autoHighlightFirst?: boolean | string

  /**
   * Whether to clear search on close.
   * - `true`: clear immediately when menu closes (default)
   * - `false`: preserve search when menu closes
   * - `'after-exit'`: clear after exit animation completes
   */
  clearSearchOnClose?: boolean | 'after-exit'

  /**
   * Whether to reset the list scroll position when the search query changes.
   * @default true
   */
  resetScrollOnSearch?: boolean

  /** Children (Input, List, etc.) */
  children: React.ReactNode
}

// ============================================================================
// Data List Props
// ============================================================================

/**
 * State passed to the DataList render function.
 */
export interface DataListChildrenState {
  /** Current search query (empty string if browsing) */
  search: string

  /**
   * Display nodes (filtered and scored if searching).
   * Can include groups (DisplayGroupNode), radio groups (DisplayRadioGroupNode), or checkbox groups (DisplayCheckboxGroupNode)
   * when groupSearchBehavior: 'preserve'.
   */
  nodes: DisplayNode[]

  /**
   * Function to render a node.
   * Handles items, submenus, groups, radio groups, and checkbox groups, calling their render functions with context.
   */
  renderNode: (displayNode: DisplayNode) => React.ReactNode

  /** Number of visible items (counting items inside groups) */
  count: number

  /** Whether deep search is active (query length >= minLength) */
  isDeepSearching: boolean

  /** Aggregate async loading state across all menus */
  async: AsyncState
}

/**
 * Props for the DataList component.
 */
export interface DataListProps {
  /** List content. Descendants read node state via `useDataList()`. */
  children: React.ReactNode

  /** Accessible label for the listbox */
  label?: string

  /** Additional class name */
  className?: string

  /** Additional styles */
  style?: React.CSSProperties

  /**
   * When true, measures row widths and applies `--row-width` CSS variable.
   * Keeps the list at the maximum width seen while scrolling.
   * Useful for virtualized lists where content width varies.
   * @default true
   */
  measureRowWidth?: boolean

  /**
   * Maximum width cap for row measurement (in pixels).
   * Only used when `measureRowWidth` is true.
   */
  maxRowWidth?: number

  /**
   * Ref to the element that owns the list's scroll position.
   * Use when the semantic list is rendered inside another scroll container.
   */
  scrollContainerRef?: React.RefObject<HTMLElement | null>
}

// ============================================================================
// Data Subpages Props
// ============================================================================

/**
 * State passed to the DataSubpages render function.
 */
export interface DataSubpagesChildrenState {
  /** All subpage content nodes discovered in the current content tree. */
  subpages: DisplaySubpageNode[]

  /**
   * Function to render a subpage content node.
   * Calls the node's `renderContent` callback with page context and child renderer.
   */
  renderSubpageContent: (subpage: DisplaySubpageNode) => React.ReactNode
}

/**
 * Props for the DataSubpages component.
 */
export interface DataSubpagesProps {
  /**
   * Optional render function.
   * If omitted, all subpage contents are rendered by default.
   */
  children?: (state: DataSubpagesChildrenState) => React.ReactNode
}
