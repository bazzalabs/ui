# Menu Type System Overhaul

## Overview

This document outlines the comprehensive plan to transform our menu type system from a single generic `T` (used only for `data` prop) to a flexible, extensible system that allows each menu implementation to define its own node kinds, variants, and properties while maintaining full type safety.

## Goals

1. ✅ Remove confusing generic `T` that only typed the `data` prop
2. ✅ Allow each menu package to define custom node kinds, variants, and properties  
3. ✅ Maintain full type safety for generic helpers in core `@packages/menu/`
4. ✅ Enable multiple menu packages to work together seamlessly
5. ✅ Create extensible, fully-typed control APIs
6. ✅ Support both `TData` generic AND custom properties on nodes
7. ✅ Perfect type inference - minimal explicit type annotations needed

## Package Architecture

```
@bazza-ui/menu/          # Core foundation + Standard implementation
├── Base contracts       # BaseNode, BaseMenu, BaseNodeDef
├── Universal helpers    # flatten, scoreNodes, useFilteredNodes, etc.
├── Standard nodes       # StandardNode<TData> for direct usage
└── Control system       # BaseMenuControl<TNode>

@bazza-ui/command-menu/  # Command palette implementation  
├── CommandNode<TData>   # Enhanced for command palettes
├── Command-specific UI  # Dialog, breadcrumbs, keyboard shortcuts
├── Control API          # CommandMenuControl<TData>
└── Deep search features # Global search, categories, priorities

@bazza-ui/popup-menu/    # Context/dropdown menu implementation
├── PopupNode<TData>     # Enhanced for context menus
├── Popup-specific UI    # Positioning, hover policies, intent zones
├── Control API          # PopupMenuControl<TData>
└── Custom node kinds    # Dividers, destructive actions, tooltips

@bazza-ui/action-menu/   # UNCHANGED - No breaking changes
└── Continues using current type system
```

## Breaking Changes Summary

### API Changes
- `MenuDef<T>` → `MenuDef<TNode, TData>` or `StandardMenuDef<TData>`
- `Menu<T>` → `Menu<TNode>` or `StandardMenu<TData>`
- `Node<T>` → `TNode extends BaseNode` or `StandardNode<TData>`
- `MenuControl<T>` → `BaseMenuControl<TNode>` or `StandardMenuControl<TData>`

### Import Changes
**New exports from `@bazza-ui/menu`:**
- Base contracts: `BaseNode`, `BaseMenu`, `BaseNodeDef`
- Standard implementation: `StandardMenuDef`, `StandardMenu`, `StandardNode`, etc.
- Type utilities: `ExtractNodeDef`, `ExtractDataType`, `GetNodeByKind`, etc.
- Control types: `BaseMenuControl`, `StandardMenuControl`, `InferControlType`

### Generic Constraints
- All helpers now use `TNode extends BaseNode`
- Middleware uses `TNode extends BaseNode`
- Control API uses `TNode extends BaseNode`

---

## Phase 1: Core Foundation (@packages/menu/)

### 1.1 Base Type Contracts

New foundational types that all menu implementations must extend:

```typescript
/* ================================================================================================
 * Base Type Contracts - Foundation for extensible menu systems
 * ============================================================================================== */

/**
 * Base constraint for all node definitions.
 * All menu implementations must extend this.
 */
export interface BaseNodeDef {
  readonly kind: string
  id?: string
  hidden?: boolean
}

/**
 * Base constraint for all runtime nodes.
 * All menu implementations must extend this.
 */
export interface BaseNode {
  readonly kind: string
  readonly id: string
  readonly hidden?: boolean
  readonly parent: BaseMenu
  readonly def: BaseNodeDef
}

/**
 * Base constraint for all menu instances.
 */
export interface BaseMenu {
  readonly kind: 'menu' | 'submenu'
  readonly id: string
  readonly nodes: readonly BaseNode[]
  readonly surfaceId: string
  readonly depth: number
}
```

### 1.2 Type Extraction Utilities

Helper types for working with parameterized types:

```typescript
/* ================================================================================================
 * Type Utilities - Helpers for working with parameterized types
 * ============================================================================================== */

/**
 * Extract the node definition type from a runtime node.
 */
export type ExtractNodeDef<TNode extends BaseNode> = TNode['def']

/**
 * Extract data type from node (for inference).
 */
export type ExtractDataType<TNode extends BaseNode> = 
  TNode extends { readonly data?: infer TData } ? TData : unknown

/**
 * Extract node kind from node def union.
 */
export type ExtractNodeKind<TNodeDef extends BaseNodeDef> = TNodeDef['kind']

/**
 * Get specific node def by kind.
 */
export type GetNodeDefByKind<
  TNodeDef extends BaseNodeDef,
  K extends ExtractNodeKind<TNodeDef>
> = Extract<TNodeDef, { kind: K }>

/**
 * Get specific runtime node by kind.
 */
export type GetNodeByKind<
  TNode extends BaseNode,
  K extends TNode['kind']
> = Extract<TNode, { kind: K }>
```

### 1.3 Core Parameterized Types

Menu and node types parameterized by node type:

```typescript
/* ================================================================================================
 * Core Menu Types - Clean parameterization
 * ============================================================================================== */

/**
 * Menu definition parameterized by node types and data type.
 * 
 * @template TNode - Union of all node types for this menu (runtime nodes)
 * @template TData - Type of the data property on nodes
 */
export interface MenuDef<TNode extends BaseNode, TData = unknown> {
  readonly id: string
  readonly title?: string
  readonly inputPlaceholder?: string
  readonly hideSearchUntilActive?: boolean
  
  // Nodes OR loader (mutually exclusive)
  readonly nodes?: readonly ExtractNodeDef<TNode>[]
  readonly loader?: AsyncNodeLoader<ExtractNodeDef<TNode>>
  
  // Configuration
  readonly defaults?: MenuNodeDefaults<TNode, TData>
  readonly virtualization?: VirtualizationConfig
  readonly search?: SearchConfig
  readonly ui?: MenuThemeDef<TNode, TData>
  readonly render?: () => React.ReactNode
  
  // State management
  readonly input?: StateDescriptor<string>
  readonly open?: StateDescriptor<boolean>
  readonly middleware?: MenuMiddleware<TNode>
}

/**
 * Runtime menu instance.
 * 
 * @template TNode - Union of all runtime node types for this menu
 */
export interface Menu<TNode extends BaseNode> extends BaseMenu {
  readonly title?: string
  readonly inputPlaceholder?: string
  readonly hideSearchUntilActive?: boolean
  readonly defaults?: MenuNodeDefaults<TNode, ExtractDataType<TNode>>
  readonly baseDefaults?: MenuNodeDefaults<TNode, ExtractDataType<TNode>>
  readonly virtualization?: VirtualizationConfig
  readonly search?: SearchConfig
  readonly ui?: MenuThemeDef<TNode, ExtractDataType<TNode>>
  readonly nodes: readonly TNode[]
  readonly input?: StateDescriptor<string>
  readonly open?: StateDescriptor<boolean>
  readonly loader?: AsyncNodeLoader<ExtractNodeDef<TNode>>
  readonly loadingState?: LoadingState
  readonly middleware?: MenuMiddleware<TNode>
}
```

### 1.4 Async Loading Types

Clean loader system without old generic baggage:

```typescript
/* ================================================================================================
 * Async Loading Types - Clean, generic loader system
 * ============================================================================================== */

export interface AsyncNodeLoaderContext {
  readonly query: string
  readonly isOpen: boolean
  readonly path: readonly string[]
}

export interface AsyncNodeLoaderResult<TNodeDef extends BaseNodeDef> {
  readonly data?: readonly TNodeDef[]
  readonly isLoading?: boolean
  readonly error?: Error | null
  readonly isError?: boolean
  readonly isFetching?: boolean
}

export type AsyncNodeLoader<TNodeDef extends BaseNodeDef> = (
  context: AsyncNodeLoaderContext
) => AsyncNodeLoaderResult<TNodeDef>
```

---

## Phase 2: Standard Node Implementation

Complete, usable menu system built on the base contracts:

### 2.1 Standard Node Kinds and Variants

```typescript
/* ================================================================================================
 * Standard Node System - Clean implementation for standard use cases
 * ============================================================================================== */

/**
 * Standard node kinds for most menu implementations.
 */
export type StandardNodeKind = 
  | 'item'
  | 'group'
  | 'submenu'
  | 'separator'
  | 'loading'

/**
 * Standard item variants.
 */
export type StandardItemVariant = 'button' | 'checkbox' | 'radio'

/**
 * Searchable mixin for nodes that can be searched.
 */
export interface Searchable {
  readonly label?: string
  readonly keywords?: readonly string[]
}
```

### 2.2 Standard Node Definitions

```typescript
/**
 * Standard item definition with data support.
 */
export interface StandardItemDef<TData = unknown> extends BaseNodeDef, Searchable {
  readonly kind: 'item'
  readonly variant?: StandardItemVariant
  readonly icon?: Iconish
  readonly data?: TData  // ✅ Keep data prop!
  readonly disabled?: boolean
  readonly onSelect?: StandardItemSelectHandler<TData>
  readonly closeOnSelect?: boolean
  readonly render?: StandardItemRenderer<TData>
  
  // Variant-specific properties
  readonly checked?: boolean      // checkbox variant
  readonly onCheckedChange?: (checked: boolean) => void
  readonly value?: string         // radio variant
}

export interface StandardGroupDef<TData = unknown> extends BaseNodeDef {
  readonly kind: 'group'
  readonly id: string
  readonly heading?: string
  readonly variant?: 'default' | 'radio'
  readonly nodes: readonly (StandardItemDef<TData> | StandardSubmenuDef<TData>)[]
  readonly value?: string
  readonly onValueChange?: (value: string) => void
}

export interface StandardSubmenuDef<TData = unknown> extends BaseNodeDef, Searchable {
  readonly kind: 'submenu'
  readonly data?: TData  // ✅ Submenu can have data!
  readonly icon?: Iconish
  readonly disabled?: boolean
  readonly title?: string
  readonly inputPlaceholder?: string
  readonly hideSearchUntilActive?: boolean
  readonly deepSearch?: boolean
  
  // Child configuration
  readonly nodes?: readonly StandardNodeDef<TData>[]
  readonly loader?: AsyncNodeLoader<StandardNodeDef<TData>>
  readonly defaults?: MenuNodeDefaults<StandardNode<TData>, TData>
  readonly virtualization?: VirtualizationConfig
  readonly search?: SearchConfig
  readonly ui?: MenuThemeDef<StandardNode<TData>, TData>
  readonly render?: () => React.ReactNode
  
  // State
  readonly input?: StateDescriptor<string>
  readonly open?: StateDescriptor<boolean>
  readonly middleware?: MenuMiddleware<StandardNode<TData>>
}

export interface StandardSeparatorDef extends BaseNodeDef {
  readonly kind: 'separator'
  readonly label?: string
}

export interface StandardLoadingDef extends BaseNodeDef {
  readonly kind: 'loading'
  readonly id: string
  readonly progress?: readonly LoaderProgress[]
  readonly inProgressPaths?: readonly string[]
  readonly completedPaths?: readonly string[]
}

/**
 * Standard node definition union - what most menus will use.
 */
export type StandardNodeDef<TData = unknown> =
  | StandardItemDef<TData>
  | StandardGroupDef<TData>
  | StandardSubmenuDef<TData>
  | StandardSeparatorDef
  | StandardLoadingDef
```

### 2.3 Standard Runtime Nodes

```typescript
/**
 * Standard runtime item node.
 */
export interface StandardItemNode<TData = unknown> extends BaseNode {
  readonly kind: 'item'
  readonly def: StandardItemDef<TData>
  readonly variant: StandardItemVariant
  readonly label?: string
  readonly keywords?: readonly string[]
  readonly icon?: Iconish
  readonly data?: TData
  readonly disabled?: boolean
  readonly onSelect?: StandardItemSelectHandler<TData>
  readonly closeOnSelect?: boolean
  readonly render?: StandardItemRenderer<TData>
  
  // Group membership
  readonly group?: StandardGroupNode<TData>
  readonly groupPosition?: 'first' | 'middle' | 'last' | 'only'
  readonly groupIndex?: number
  readonly groupSize?: number
  
  // Search context
  readonly search?: SearchContext
  
  // Variant-specific runtime properties
  readonly checked?: boolean
  readonly onCheckedChange?: (checked: boolean) => void
  readonly value?: string
}

// Similar for StandardGroupNode, StandardSubmenuNode, StandardSeparatorNode, StandardLoadingNode...

/**
 * Standard runtime node union.
 */
export type StandardNode<TData = unknown> =
  | StandardItemNode<TData>
  | StandardGroupNode<TData>
  | StandardSubmenuNode<TData>
  | StandardSeparatorNode
  | StandardLoadingNode

/**
 * Standard menu types for direct usage.
 */
export interface StandardMenuDef<TData = unknown> extends MenuDef<StandardNode<TData>, TData> {}
export interface StandardMenu<TData = unknown> extends Menu<StandardNode<TData>> {}
```

---

## Phase 3: Universal Helper Functions

All helpers work with **any node system** that extends the base contracts:

```typescript
/* ================================================================================================
 * Universal Helper Functions - Work with ANY node type system
 * ============================================================================================== */

// Menu instantiation
export function instantiateSingleNode<TNode extends BaseNode>(
  def: ExtractNodeDef<TNode>,
  parent: Menu<TNode>,
  computedDefaults?: MenuNodeDefaults<TNode, ExtractDataType<TNode>>
): TNode

export function instantiateMenuFromDef<TNode extends BaseNode>(
  def: MenuDef<TNode, ExtractDataType<TNode>>,
  surfaceId: string,
  depth: number,
  parentDefaults?: MenuNodeDefaults<TNode, ExtractDataType<TNode>>
): Menu<TNode>

// Node manipulation
export function flatten<TNode extends BaseNode>(
  input: Menu<TNode> | TNode | readonly TNode[],
  options?: { readonly deep?: boolean }
): readonly TNode[]

// Filtering and scoring
export function scoreNodes<TNode extends BaseNode>(
  nodes: readonly TNode[],
  query: string,
  options?: ScoreNodesOptions
): readonly ScoredNode<TNode>[]

export function sortByScore<TNode extends BaseNode>(
  nodes: readonly ScoredNode<TNode>[]
): readonly ScoredNode<TNode>[]

export function sortByCompletionOrder<TNode extends BaseNode>(
  nodes: readonly ScoredNode<TNode>[],
  completionOrder: readonly string[]
): readonly ScoredNode<TNode>[]

export function partitionByKind<TNode extends BaseNode>(
  nodes: readonly ScoredNode<TNode>[]
): readonly ScoredNode<TNode>[]

export function deduplicateById<TNode extends BaseNode>(
  nodes: readonly ScoredNode<TNode>[]
): readonly ScoredNode<TNode>[]

// React hooks
export function useFilteredNodes<TNode extends BaseNode>(
  menu: Menu<TNode>,
  query: string,
  options?: UseFilteredNodesOptions
): UseFilteredNodesResult<TNode>

export function useMenu<TNode extends BaseNode>(
  config: UseMenuConfig<TNode>
): UseMenuResult<TNode>

// Utilities
export function getItemNodes<TNode extends BaseNode>(
  menu: Menu<TNode>
): readonly GetNodeByKind<TNode, 'item'>[]

export function getSubmenuNodes<TNode extends BaseNode>(
  menu: Menu<TNode>
): readonly GetNodeByKind<TNode, 'submenu'>[]
```

---

## Phase 4: Fully Typed Control API System

### 4.1 Base Control Contracts

```typescript
/* ================================================================================================
 * Base Control System - Foundation for typed, extensible control APIs
 * ============================================================================================== */

/**
 * Base control interface that ALL menu implementations must extend.
 * Now parameterized by node type instead of just data type.
 * 
 * @template TNode - Union of runtime node types for this menu
 */
export interface BaseMenuControl<TNode extends BaseNode> {
  // ===== Core State (Read-only) =====
  
  /** Get the current menu instance */
  getMenu(): Menu<TNode>
  
  /** Get current control state */
  getState(): MenuControlState<TNode>
  
  /** Check if menu is in a loading state */
  isLoading(): boolean
  
  /** Get current error state */
  getError(): string | null
  
  // ===== State Management =====
  
  /** Set global loading state for the menu */
  setLoading(loading: boolean, message?: string): void
  
  /** Set error state */
  setError(error: string | null): void
  
  /** Clear error state */
  clearError(): void
  
  // ===== Item Manipulation =====
  
  /** Programmatically select an item by ID */
  selectItem(itemId: string): void
  
  /** Disable the entire menu */
  disable(): () => void
  
  /** Enable the menu */
  enable(): void
  
  /** Set the disabled state */
  setDisabled(disabled: boolean): void
}

/**
 * Base state interface parameterized by node type.
 */
export interface MenuControlState<TNode extends BaseNode> {
  /** Current menu instance */
  menu: Menu<TNode>
  
  /** Whether menu is in a loading state */
  loading: boolean
  
  /** Current error message, if any */
  error: string | null
  
  /** Whether the entire menu is disabled */
  disabled: boolean
  
  /** Custom state (for extensions) */
  [key: string]: any
}
```

### 4.2 Standard Control Implementation

```typescript
/**
 * Standard control interface for direct usage with standard menus.
 */
export interface StandardMenuControl<TData = unknown> 
  extends BaseMenuControl<StandardNode<TData>> {
  
  /** Get current state (standard menu state) */
  getState(): StandardMenuControlState<TData>
}

export interface StandardMenuControlState<TData = unknown> 
  extends MenuControlState<StandardNode<TData>> {}
```

### 4.3 Package-Specific Control Extensions

#### Command Menu Control

```typescript
/**
 * Command menu control interface with dialog and navigation features.
 */
export interface CommandMenuControl<TData = unknown> 
  extends BaseMenuControl<CommandNode<TData>> {
  
  // ===== Extended State Access =====
  
  /** Check if menu dialog is open */
  isOpen(): boolean
  
  /** Get current state (extended with command-specific state) */
  getState(): CommandMenuControlState<TData>
  
  // ===== Dialog Operations =====
  
  /** Open the command menu dialog */
  open(): void
  
  /** Close the command menu dialog */
  close(): void
  
  /** Toggle dialog open state */
  toggle(): void
  
  // ===== Input Management =====
  
  /** Focus the search input */
  focusInput(): void
  
  /** Get current query */
  getQuery(): string
  
  /** Set search query */
  setQuery(query: string): void
  
  /** Clear search query */
  clearQuery(): void
  
  // ===== Navigation =====
  
  /** Navigate to a specific submenu by ID */
  navigateTo(submenuId: string): void
  
  /** Go back to parent menu */
  goBack(): void
  
  /** Go to root menu */
  goToRoot(): void
  
  /** Get current navigation stack */
  getNavigationStack(): NavigationStackEntry[]
  
  // ===== Command-Specific Features =====
  
  /** Set vim bindings enabled/disabled */
  setVimBindings(enabled: boolean): void
  
  /** Set breadcrumbs shown/hidden */
  setShowBreadcrumbs(show: boolean): void
  
  /** Get items with specific shortcut */
  getItemsByShortcut(shortcut: string): readonly CommandItemNode<TData>[]
  
  /** Get items in specific category */
  getItemsByCategory(category: string): readonly CommandItemNode<TData>[]
}
```

#### Popup Menu Control

```typescript
/**
 * Popup menu control interface with positioning and hover features.
 */
export interface PopupMenuControl<TData = unknown> 
  extends BaseMenuControl<PopupNode<TData>> {
  
  // ===== Extended State Access =====
  
  /** Check if popup is open */
  isOpen(): boolean
  
  /** Get current state (extended with popup-specific state) */
  getState(): PopupMenuControlState<TData>
  
  // ===== Popup Operations =====
  
  /** Open the popup menu */
  open(anchor?: HTMLElement): void
  
  /** Close the popup menu */
  close(): void
  
  /** Toggle popup open state */
  toggle(anchor?: HTMLElement): void
  
  // ===== Positioning =====
  
  /** Update anchor element */
  setAnchor(anchor: HTMLElement | null): void
  
  /** Get current anchor element */
  getAnchor(): HTMLElement | null
  
  /** Update positioning configuration */
  setPositioning(config: PopupPositioningConfig): void
  
  /** Get current positioning configuration */
  getPositioning(): PopupPositioningConfig
  
  // ===== Hover Policy =====
  
  /** Update hover policy configuration */
  setHoverPolicy(config: PopupHoverPolicyConfig): void
  
  /** Get current hover policy configuration */
  getHoverPolicy(): PopupHoverPolicyConfig
  
  // ===== Popup-Specific Features =====
  
  /** Get items with destructive intent */
  getDestructiveItems(): readonly PopupItemNode<TData>[]
  
  /** Get items by intent */
  getItemsByIntent(intent: 'default' | 'primary' | 'success' | 'warning' | 'danger'): 
    readonly PopupItemNode<TData>[]
  
  /** Get custom divider nodes */
  getDividers(): readonly PopupDividerNode[]
}
```

### 4.4 Typed Middleware Integration

```typescript
/**
 * Middleware interface now fully typed by node type.
 * Control API is automatically inferred based on menu implementation.
 */
export interface MenuMiddleware<TNode extends BaseNode> {
  beforeFilter?: (context: BeforeFilterContext<TNode>) => readonly TNode[]
  afterFilter?: (context: AfterFilterContext<TNode>) => readonly SearchResult<TNode>[]
  transformNodes?: (context: TransformNodesContext<TNode>) => readonly TNode[]
}

/**
 * Transform context with fully typed control API.
 */
export interface TransformNodesContext<TNode extends BaseNode> {
  readonly nodes: readonly TNode[]
  readonly query: string
  readonly mode: 'browse' | 'search'
  readonly allNodes: readonly TNode[]
  readonly menu: Menu<TNode>
  
  readonly createNode: <TTargetNode extends TNode>(
    def: ExtractNodeDef<TTargetNode>
  ) => TTargetNode
  
  readonly hasExactMatch: (query: string) => boolean
  
  /** 
   * Fully typed control API - automatically inferred!
   * - StandardMenuControl<TData> for standard menus
   * - CommandMenuControl<TData> for command menus  
   * - PopupMenuControl<TData> for popup menus
   */
  readonly control?: InferControlType<TNode>
  
  readonly disabled?: boolean
}

/**
 * Type utility to infer the correct control type from node type.
 */
export type InferControlType<TNode extends BaseNode> = 
  TNode extends CommandNode<infer TData> 
    ? CommandMenuControl<TData>
    : TNode extends PopupNode<infer TData>
    ? PopupMenuControl<TData> 
    : TNode extends StandardNode<infer TData>
    ? StandardMenuControl<TData>
    : BaseMenuControl<TNode>
```

---

## Phase 5: Package-Specific Implementations

### Command Menu (@packages/command-menu/)

```typescript
/**
 * Command item with enhanced properties for command palettes.
 */
export interface CommandItemDef<TData = unknown> extends BaseNodeDef, Searchable {
  readonly kind: 'item'
  readonly variant?: 'button' | 'checkbox' | 'radio'
  readonly icon?: Iconish
  readonly data?: TData
  readonly disabled?: boolean
  readonly onSelect?: CommandItemSelectHandler<TData>
  readonly closeOnSelect?: boolean
  readonly render?: CommandItemRenderer<TData>
  
  // Variant-specific
  readonly checked?: boolean
  readonly onCheckedChange?: (checked: boolean) => void
  readonly value?: string
}

export interface CommandSubmenuDef<TData = unknown> extends BaseNodeDef, Searchable {
  readonly kind: 'submenu'
  readonly data?: TData
  readonly icon?: Iconish
  readonly disabled?: boolean
  readonly title?: string
  readonly inputPlaceholder?: string
  readonly hideSearchUntilActive?: boolean
  readonly deepSearch?: boolean
  
  // Child configuration optimized for deep search
  readonly nodes?: readonly CommandNodeDef<TData>[]
  readonly loader?: AsyncNodeLoader<CommandNodeDef<TData>>
  readonly search?: CommandSearchConfig
  // ... rest
}

export type CommandNodeDef<TData = unknown> =
  | CommandItemDef<TData>
  | StandardGroupDef<TData>  // Reuse groups from standard
  | CommandSubmenuDef<TData>
  | StandardSeparatorDef     // Reuse separators
  | StandardLoadingDef       // Reuse loading

export type CommandNode<TData = unknown> =
  | CommandItemNode<TData>
  | StandardGroupNode<TData>
  | CommandSubmenuNode<TData>
  | StandardSeparatorNode
  | StandardLoadingNode

export interface CommandMenuDef<TData = unknown> 
  extends MenuDef<CommandNode<TData>, TData> {
  readonly ui?: CommandMenuThemeDef<TData>
  readonly search?: CommandSearchConfig
  readonly showBreadcrumbs?: boolean
  readonly vimBindings?: boolean
}
```

### Popup Menu (@packages/popup-menu/)

```typescript
/**
 * Popup item with context menu specific features.
 */
export interface PopupItemDef<TData = unknown> extends BaseNodeDef, Searchable {
  readonly kind: 'item'
  readonly variant?: 'button' | 'checkbox' | 'radio'
  readonly icon?: Iconish
  readonly data?: TData
  readonly disabled?: boolean
  readonly onSelect?: PopupItemSelectHandler<TData>
  readonly closeOnSelect?: boolean
  readonly render?: PopupItemRenderer<TData>
  
  // Variant-specific
  readonly checked?: boolean
  readonly onCheckedChange?: (checked: boolean) => void
  readonly value?: string
}

/**
 * Custom divider node kind (example of extending node kinds).
 */
 // DON"T ACTUALLY DO THIS THOUGH! We can just use the separator def
export interface PopupDividerDef extends BaseNodeDef {
  readonly kind: 'divider'  // ✅ Custom node kind!
  readonly thickness?: 'thin' | 'thick'
  readonly color?: 'default' | 'muted' | 'accent'
  readonly spacing?: 'compact' | 'normal' | 'spacious'
}

export interface PopupSubmenuDef<TData = unknown> extends BaseNodeDef, Searchable {
  readonly kind: 'submenu'
  readonly data?: TData
  readonly icon?: Iconish
  readonly disabled?: boolean
  readonly title?: string
  readonly inputPlaceholder?: string
  readonly hideSearchUntilActive?: boolean
  readonly deepSearch?: boolean
  
  // Child configuration
  readonly nodes?: readonly PopupNodeDef<TData>[]
  readonly loader?: AsyncNodeLoader<PopupNodeDef<TData>>
  // ... rest
}

export type PopupNodeDef<TData = unknown> =
  | PopupItemDef<TData>
  | StandardGroupDef<TData>
  | PopupSubmenuDef<TData>
  | StandardSeparatorDef
  | PopupDividerDef        // ✅ Custom node kind!
  | StandardLoadingDef

export type PopupNode<TData = unknown> =
  | PopupItemNode<TData>
  | StandardGroupNode<TData>
  | PopupSubmenuNode<TData>
  | StandardSeparatorNode
  | PopupDividerNode       // ✅ Custom runtime node!
  | StandardLoadingNode

export interface PopupMenuDef<TData = unknown> 
  extends MenuDef<PopupNode<TData>, TData> {
  readonly ui?: PopupMenuThemeDef<TData>
  readonly positioning?: PopupPositioningConfig
  readonly hoverPolicy?: PopupHoverPolicyConfig
}
```

---

## Usage Examples

### Standard Menu (Direct from Core)

```typescript
import { StandardMenuDef } from '@bazza-ui/menu'

const standardMenu: StandardMenuDef<{ userId: string }> = {
  id: 'basic-menu',
  nodes: [
    {
      kind: 'item',
      label: 'Profile',
      data: { userId: 'user-123' },  // ✅ Typed data
      onSelect: ({ node }) => {
        console.log(node.data?.userId)  // ✅ string | undefined
      }
    }
  ]
}
```

### Command Menu with Typed Control

```typescript
import { createNew } from '@bazza-ui/menu/middleware'
import type { CommandMenuDef } from '@bazza-ui/command-menu'

const commandMenu: CommandMenuDef<{ category: string }> = {
  id: 'command-palette',
  showBreadcrumbs: true,
  vimBindings: true,
  nodes: [
    {
      kind: 'item',
      label: 'Copy',
      shortcut: ['⌘', 'C'],         // ✅ Direct property!
      category: 'edit',             // ✅ Direct property!
      priority: 1,                  // ✅ Direct property!
      data: { category: 'edit' },   // ✅ Also have typed data
      onSelect: ({ node }) => {
        console.log(node.shortcut)     // ✅ string | readonly string[] | undefined
        console.log(node.category)     // ✅ string | undefined
        console.log(node.data?.category)  // ✅ string | undefined
      }
    }
  ],
  middleware: createNew({
    showWhen: 'no-exact-match',
    onCreate: async ({ query, control }) => {
      // ✅ control is CommandMenuControl<{ category: string }>!
      
      control?.setLoading(true, 'Creating command...')
      
      try {
        await api.createCommand({ name: query })
        
        // ✅ Command-specific methods available!
        control?.close()           // Close the dialog
        control?.clearQuery()      // Clear search
        control?.goToRoot()        // Navigate to root
        
      } catch (error) {
        control?.setError(error.message)
      } finally {
        control?.setLoading(false)
      }
    }
  })
}
```

### Popup Menu with Custom Nodes

```typescript
import type { PopupMenuDef } from '@bazza-ui/popup-menu'

const popupMenu: PopupMenuDef<{ fileId: string }> = {
  id: 'context-menu',
  positioning: { side: 'right', align: 'start' },
  nodes: [
    {
      kind: 'item',
      label: 'Delete',
      destructive: true,            // ✅ Direct property!
      intent: 'danger',             // ✅ Direct property!
      tooltip: 'Permanently delete this file',
      data: { fileId: 'file-456' },
      onSelect: ({ node }) => {
        console.log(node.destructive)    // ✅ boolean | undefined
        console.log(node.intent)         // ✅ intent type | undefined
        console.log(node.data?.fileId)   // ✅ string | undefined
      }
    },
    {
      kind: 'divider',              // ✅ Custom node kind!
      thickness: 'thick',
      color: 'muted'
    }
  ]
}
```

### Universal Helpers Work with All

```typescript
// Same helper works with all menu types!
const commandItems = getItemNodes(commandMenu)
// commandItems: readonly CommandItemNode<{ category: string }>[]

const popupItems = getItemNodes(popupMenu)
// popupItems: readonly PopupItemNode<{ fileId: string }>[]

const standardItems = getItemNodes(standardMenu)
// standardItems: readonly StandardItemNode<{ userId: string }>[]

// Perfect type inference for each!
commandItems.forEach(item => {
  console.log(item.shortcut)  // ✅ Available on CommandItemNode
  console.log(item.category)  // ✅ Available on CommandItemNode
})

popupItems.forEach(item => {
  console.log(item.destructive)  // ✅ Available on PopupItemNode
  console.log(item.intent)       // ✅ Available on PopupItemNode
})
```

---

## Implementation Plan

### Phase 1: Core Foundation (`@packages/menu/`)
**Files to modify:** ~21 files with generic functions

1. **`src/types.ts`** - Complete rewrite with new type system
   - Add base contracts (BaseNode, BaseMenu, BaseNodeDef)
   - Add type utilities (ExtractNodeDef, ExtractDataType, etc.)
   - Add parameterized core types (MenuDef<TNode, TData>, Menu<TNode>)
   - Add standard node implementation (StandardNode<TData>)
   - Update all existing types to use new system

2. **`src/control.ts`** - Update control system
   - Update BaseMenuControl<TNode>
   - Add StandardMenuControl<TData>
   - Add InferControlType<TNode> utility

3. **`src/primitives/menu-model.ts`** - Update instantiation functions
   - Update `instantiateSingleNode<TNode>`
   - Update `instantiateMenuFromDef<TNode>`
   - Update `flatten<TNode>`
   - Update `normalizeMenuDef<TNode>`

4. **`src/utils/sort.ts`** - Update sorting functions
   - Update `sortByScore<TNode>`
   - Update `sortByCompletionOrder<TNode>`
   - Update `partitionByKind<TNode>`
   - Update `deduplicateById<TNode>`

5. **`src/hooks/use-filtered-nodes.ts`** - Update filtering hook
   - Update `useFilteredNodes<TNode>`
   - Update context types

6. **`src/hooks/use-menu.ts`** - Update orchestration hook
   - Update `useMenu<TNode>`
   - Update config types

7. **`src/middleware/types.ts`** - Update middleware types
   - Update `MenuMiddleware<TNode>`
   - Update `TransformNodesContext<TNode>`
   - Add `InferControlType<TNode>`

8. **`src/middleware/create-new.ts`** - Update createNew middleware
   - Update to use `TNode extends BaseNode`
   - Update config to use typed control

9. **All other hooks** - Update generic constraints
   - `use-menu-instantiation.ts`
   - `use-deep-search-loaders.ts`
   - `use-streaming-state.ts`
   - `use-loader.ts`
   - etc.

10. **All other utils** - Update generic constraints
    - `breadcrumb.ts`
    - `node-scoring.ts`
    - `deep-search.ts`
    - etc.

11. **`src/index.ts`** - Add new exports
    - Export base contracts
    - Export standard implementation
    - Export type utilities
    - Export control types

### Phase 2: Command Menu (`@packages/command-menu/`)
**Files to modify:** ~10 files

1. **`src/types.ts`** - Define command-specific types
   - Add `CommandItemDef<TData>` with shortcuts, categories, priorities
   - Add `CommandSubmenuDef<TData>`
   - Add `CommandNodeDef<TData>` union
   - Add `CommandNode<TData>` runtime union
   - Add `CommandMenuDef<TData>` and `CommandMenu<TData>`

2. **`src/control.ts`** - Update control system
   - Update `CommandMenuControl<TData>` to extend `BaseMenuControl<CommandNode<TData>>`
   - Add command-specific methods
   - Update state types

3. **Component files** - Update to use new types
   - Update prop types
   - Update context types
   - Update hook usage

### Phase 3: Popup Menu (`@packages/popup-menu/`)
**Files to modify:** ~10 files

1. **`src/types.ts`** - Define popup-specific types
   - Add `PopupItemDef<TData>` with intents, tooltips, badges
   - Add `PopupDividerDef` (custom node kind)
   - Add `PopupSubmenuDef<TData>`
   - Add `PopupNodeDef<TData>` union
   - Add `PopupNode<TData>` runtime union
   - Add `PopupMenuDef<TData>` and `PopupMenu<TData>`

2. **`src/control.ts`** - Update control system
   - Update `PopupMenuControl<TData>` to extend `BaseMenuControl<PopupNode<TData>>`
   - Add popup-specific methods
   - Update state types

3. **Component files** - Update to use new types
   - Update prop types
   - Update context types
   - Update hook usage
   - Add divider component support

### Phase 4: Testing & Documentation

1. **Update tests** - Update to use new type system
2. **Update examples** - Showcase new capabilities
3. **Update documentation** - Document new APIs
4. **Migration guide** - Help users migrate

---

## File Change Summary

### Major Changes Required (~40 files):
- **`@packages/menu/src/types.ts`** - Complete rewrite (80% new content)
- **`@packages/menu/src/primitives/menu-model.ts`** - Update all function signatures
- **`@packages/menu/src/utils/sort.ts`** - Update all generic constraints
- **`@packages/menu/src/control.ts`** - Update control system
- **`@packages/menu/src/middleware/types.ts`** - Update all interfaces
- **`@packages/command-menu/src/types.ts`** - Define command types
- **`@packages/command-menu/src/control.ts`** - Update control
- **`@packages/popup-menu/src/types.ts`** - Define popup types
- **`@packages/popup-menu/src/control.ts`** - Update control
- **All hook files** - Update generic constraints
- **All utility files** - Update generic constraints
- **Component files** - Update prop types

### No Changes Required:
- **`@packages/action-menu/`** - Completely untouched
- Pure utility functions (textToId, etc.)
- Most React components (types flow through automatically)

---

## Key Benefits

✅ **Perfect DX**: `node.shortcut` instead of `node.data?.shortcut as string`  
✅ **Type Safety**: Full inference, zero casting, zero `any`  
✅ **Extensibility**: Custom properties + custom node kinds  
✅ **Universal Helpers**: Work seamlessly across all packages  
✅ **Clean APIs**: `CommandMenuDef<MyData>` has crystal clear intent  
✅ **Package Isolation**: No conflicts, each has complete type system  
✅ **Data Support**: Both `TData` generic AND direct properties  
✅ **Typed Control APIs**: Middleware gets the right control type automatically  
✅ **Multiple Packages**: Command, Popup, and Standard menus work together perfectly  

---

## Migration Checklist

- [ ] Phase 1: Core foundation in `@packages/menu/`
  - [ ] Update `types.ts` with new type system
  - [ ] Update `control.ts` with typed control system
  - [ ] Update `menu-model.ts` instantiation functions
  - [ ] Update `sort.ts` utilities
  - [ ] Update all hooks to use `TNode extends BaseNode`
  - [ ] Update all utils to use `TNode extends BaseNode`
  - [ ] Update middleware types
  - [ ] Update `index.ts` exports

- [ ] Phase 2: Command menu implementation
  - [ ] Define command-specific node types
  - [ ] Update command control system
  - [ ] Update component types
  - [ ] Update examples

- [ ] Phase 3: Popup menu implementation
  - [ ] Define popup-specific node types
  - [ ] Update popup control system
  - [ ] Add custom divider node support
  - [ ] Update component types
  - [ ] Update examples

- [ ] Phase 4: Testing & Documentation
  - [ ] Update test files
  - [ ] Add new test cases for custom nodes
  - [ ] Update documentation
  - [ ] Create migration guide
  - [ ] Update examples

---

## Notes

- **No backwards compatibility**: These are breaking changes for better DX
- **Action menu unchanged**: `@packages/action-menu/` is not affected
- **Incremental implementation**: Can be done phase by phase
- **Test coverage**: Update tests alongside implementation
- **Documentation first**: Document new patterns before implementing
