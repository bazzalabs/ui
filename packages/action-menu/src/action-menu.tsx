/** biome-ignore-all lint/a11y/useSemanticElements: This library renders ARIA-only primitives intentionally. */

import { composeEventHandlers } from '@radix-ui/primitive'
import { composeRefs } from '@radix-ui/react-compose-refs'
import * as DismissableLayer from '@radix-ui/react-dismissable-layer'
import * as Popper from '@radix-ui/react-popper'
import { Portal } from '@radix-ui/react-portal'
import { Presence } from '@radix-ui/react-presence'
import { Primitive } from '@radix-ui/react-primitive'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import { flat, partition, pipe, prop, sortBy } from 'remeda'
import { cn } from './cn.js'
import { commandScore } from './command-score.js'

/* =========================================================================== */
/* =============================== Debug helpers ============================= */
/* =========================================================================== */

const DEBUG_MODE = false

const DBG = (...args: any[]) => {
  if (!DEBUG_MODE) return
  console.log('[AM]', ...args)
}
const DBG_GROUP = (title: string, obj?: any) => {
  if (!DEBUG_MODE) return
  console.groupCollapsed(`%c[AM] ${title}`, 'color:#08f')
  if (obj) console.log(obj)
  console.groupEnd()
}

/* =========================================================================== */
/* ============================ Data model (generic) ========================== */
/* =========================================================================== */

/** Allowed kinds of nodes that appear in a menu tree. */
export type MenuNodeKind = 'item' | 'group' | 'submenu'

/** Base shape for any node in the menu tree. */
export type BaseNode<K extends MenuNodeKind> = {
  /** Unique, stable identifier for the node. Used for registration & aria-activedescendant. */
  id: string
  /** Discriminant for the node kind. */
  kind: K
  /** When true, the node is omitted from rendering and search results. */
  hidden?: boolean
}

/** Properties that participate in text search. */
export type Searchable = {
  /** Primary label used for search/ranking (also typically shown in the UI). */
  label?: string
  /** Additional keywords to improve search recall (aliases, synonyms, etc.). */
  keywords?: string[]
}

/** Properties describing how a node should render. */
export type Renderable = {
  /**
   * Optional custom renderer. If provided, this visual is used instead of the default.
   * Can return `null` to render nothing (useful when using fully custom slots).
   */
  render?: () => React.ReactNode
}

/** Item row with per-instance data payload `T`. */
export type ItemNode<T = unknown> = BaseNode<'item'> &
  Searchable &
  Renderable & {
    /** Optional icon to render before the item label. */
    icon?: Iconish
    /** Arbitrary payload for the consumer (command, entity, etc.). */
    data?: T
    /** Invoked when the item is selected via keyboard or click. */
    onSelect?: () => void
  }

/** A group on the current surface; children share the same item payload `T`. */
export type GroupNode<T = unknown> = BaseNode<'group'> & {
  /** Optional group heading text (purely presentational). */
  heading?: string
  /** Child nodes rendered inside this group. */
  nodes: (ItemNode<T> | SubmenuNode<any>)[]
}

/** Submenu whose children can have a *different* payload shape `TChild`. */
export type SubmenuNode<T = unknown, TChild = unknown> = BaseNode<'submenu'> &
  Searchable &
  Renderable & {
    /** Arbitrary payload on the submenu trigger itself. */
    data?: T
    /** Optional icon to render before the submenu label/title. */
    icon?: Iconish
    /** Title shown when the submenu surface is open. */
    title?: string
    /** Placeholder for the submenu’s search input. */
    inputPlaceholder?: string
    /** When true, hide the input until the user starts typing on that surface. */
    hideSearchUntilActive?: boolean
    /** Child nodes that will render inside the submenu surface. */
    nodes: MenuNode<TChild>[]
    /** Per-node UI overrides scoped to this submenu. */
    ui?: {
      /** Partial slot renderers that override the defaults for this submenu. */
      slots?: Partial<MenuSlots<TChild>>
      /** Additional props forwarded to slot components in this submenu. */
      slotProps?: Partial<MenuSlotProps>
      /** Optional classNames per slot for this submenu. */
      classNames?: Partial<SlotClassNames>
    }
  }

/** A menu surface carrying items with payload `T`. */
export type MenuData<T = unknown> = {
  /** Unique id for this surface (used internally and for search breadcrumbs). */
  id: string
  /** Title shown at the top of this surface (if the Header slot uses it). */
  title?: string
  /** Placeholder for the root surface’s search input. */
  inputPlaceholder?: string
  /** When true, hide the input until the user starts typing on that surface. */
  hideSearchUntilActive?: boolean
  /** Nodes rendered on this surface (items, groups, submenus). */
  nodes?: MenuNode<T>[]
  /** Per-surface UI overrides (slots, props, and class names). */
  ui?: {
    /** Partial slot renderers that override the defaults for this surface. */
    slots?: Partial<MenuSlots<T>>
    /** Additional props forwarded to slot components on this surface. */
    slotProps?: Partial<MenuSlotProps>
    /** Optional classNames per slot for this surface. */
    classNames?: Partial<SlotClassNames>
  }
}

/** Nodes that can appear on a surface with payload `T`. */
export type MenuNode<T = unknown> =
  | ItemNode<T>
  | GroupNode<T>
  | SubmenuNode<T, any>

/** Extra context passed to item/submenu renderers during search. */
export type SearchContext = {
  /** Raw query string the user typed. */
  query: string
  /** True when the row is a deep match from a descendant submenu. */
  isDeep: boolean
  /** Visible breadcrumb titles leading to this deep row (excludes the row itself). */
  breadcrumbs: string[]
  /** Breadcrumb *ids* parallel to `breadcrumbs`. */
  breadcrumbIds: string[]
}

/* =========================================================================== */
/* =========================== Renderer & bind APIs ========================== */
/* =========================================================================== */

type DivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>
type ButtonProps = React.ComponentPropsWithoutRef<typeof Primitive.button>
type Children = Pick<DivProps, 'children'>

/** Values accepted where an icon is expected. */
export type Iconish =
  | React.ReactNode
  | React.ReactElement
  | React.ElementType
  | React.ComponentType<{ className?: string }>

/**
 * Render an icon from heterogeneous inputs.
 * - If `icon` is a React element, it is cloned with a merged className.
 * - If `icon` is a component/element type, it is instantiated with the className.
 */
export function renderIcon(icon?: Iconish, className?: string) {
  if (!icon) return null

  // Already a JSX element: merge className via clone.
  if (React.isValidElement(icon)) {
    const prev = (icon.props as any)?.className
    return React.cloneElement(icon as any, { className: cn(prev, className) })
  }

  // A component or intrinsic type (e.g. lucide Icon, 'svg', forwardRef, memo, etc.)
  const Comp = icon as React.ElementType
  return <Comp className={className} />
}

/** Row interaction & wiring helpers provided to slot renderers. */
export type RowBindAPI = {
  /** Whether roving focus considers this row focused (fake focus). */
  focused: boolean
  /** Basic disabled flag (reserved for future use). */
  disabled: boolean
  /**
   * Returns fully-wired props (role, ids, data-*, handlers).
   * Intended to be spread on the row’s root element.
   */
  getRowProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    /** Ref that registers the row with its surface. */
    ref: React.Ref<any>
    /** DOM id used for aria-activedescendant targeting. */
    id: string
    /** Role for ARIA listbox options. */
    role: 'option'
    /** Rows are not tabbable; focus stays on input/list owner. */
    tabIndex: -1
    /** Data attribute to find rows programmatically. */
    'data-action-menu-item-id': string
    /** Present when the row is the active/focused row. */
    'data-focused'?: 'true' | undefined
    /** Mirrored ARIA selected state for accessibility tools. */
    'aria-selected'?: boolean
    /** Optional disabled state for screen readers. */
    'aria-disabled'?: boolean
  }
}

/** Content/surface wiring helpers provided to slot renderers. */
export type ContentBindAPI = {
  /**
   * Returns menu surface props (role, ids, data-*, etc.).
   * Can be applied to a custom wrapper to opt out of the default wrapper.
   */
  getContentProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    /** Ref to the surface root element (registered for focus mgmt). */
    ref: React.Ref<any>
    /** ARIA role of the surface container. */
    role: 'menu'
    /** Surface itself is not tabbable; focus stays on inner input/list. */
    tabIndex: -1
    /** Slot marker for styling/hooks. */
    'data-slot': 'action-menu-content'
    /** Open/closed data state for styling/hooks. */
    'data-state': 'open' | 'closed'
    /** Marker to locate surfaces in the DOM. */
    'data-action-menu-surface': true
    /** Unique surface id used for focus ownership. */
    'data-surface-id': string
  }
}

/** Search input wiring helpers provided to slot renderers. */
export type InputBindAPI = {
  /**
   * Returns wired input props; carries `aria-activedescendant` & handlers.
   * Apply to your custom input element if you override the Input slot.
   */
  getInputProps: <T extends React.InputHTMLAttributes<HTMLInputElement>>(
    overrides?: T,
  ) => T & {
    /** Ref that makes this the focus owner when visible. */
    ref: React.Ref<any>
    /** ARIA combobox role for “search within listbox” pattern. */
    role: 'combobox'
    /** Slot marker for styling/hooks. */
    'data-slot': 'action-menu-input'
    /** Marker to locate inputs in the DOM. */
    'data-action-menu-input': true
    /** Advertises list auto-complete behavior to AT. */
    'aria-autocomplete': 'list'
    /** Menu is always considered expanded while open. */
    'aria-expanded': true
    /** Id of the list element this input controls. */
    'aria-controls'?: string
    /** Id of the active row in the list for AT focus tracking. */
    'aria-activedescendant'?: string
  }
}

/** List wiring helpers provided to slot renderers. */
export type ListBindAPI = {
  /**
   * Returns wired list props; acts as fallback focus owner when no input.
   * Apply to your custom list element if you override the List slot.
   */
  getListProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    /** Ref that makes this the focus owner when there is no input. */
    ref: React.Ref<any>
    /** ARIA role of the options container. */
    role: 'listbox'
    /** DOM id to pair with `aria-controls` on the input. */
    id: string
    /** Tabbability depends on input presence (roving focus owner). */
    tabIndex: number
    /** Slot marker for styling/hooks. */
    'data-slot': 'action-menu-list'
    /** Marker to locate lists in the DOM. */
    'data-action-menu-list': true
    /** Id of the active row (when focus is on the list itself). */
    'aria-activedescendant'?: string
  }
  /** Returns the current visual order of item ids on this surface. */
  getItemOrder: () => string[]
  /** Returns the id of the currently active row (if any). */
  getActiveId: () => string | null
}

/** Optional class names per slot for easy styling. */
export type SlotClassNames = {
  /** Class on the library root wrapper (if you create one). */
  root?: string
  /** Class on the trigger button. */
  trigger?: string
  /** Class on the content/surface container. */
  content?: string
  /** Class on the surface input. */
  input?: string
  /** Class on the surface list wrapper. */
  list?: string
  /** Class on an item row. */
  item?: string
  /** Class on a submenu trigger row. */
  subtrigger?: string
  /** Class on a group wrapper. */
  group?: string
  /** Class on a group heading. */
  groupHeading?: string
}

/** Optional additional props forwarded to slot renderers. */
export type MenuSlotProps = {
  /** Extra props for the Content wrapper element. */
  content?: React.HTMLAttributes<HTMLElement>
  /** Extra props for the header container. */
  header?: React.HTMLAttributes<HTMLElement>
  /** Extra props for the input element. */
  input?: React.InputHTMLAttributes<HTMLInputElement>
  /** Extra props for the list element. */
  list?: React.HTMLAttributes<HTMLElement>
  /** Extra props for the footer container. */
  footer?: React.HTMLAttributes<HTMLElement>
}

/** Slot renderers used to customize visuals. */
export type MenuSlots<T = unknown> = {
  /**
   * Item renderer for nodes with payload `T`.
   * Use `bind.getRowProps()` to wire ARIA/ids/handlers onto your row.
   */
  Item: (args: {
    /** Concrete node being rendered. */
    node: ItemNode<T>
    /** Search context during filtered views. */
    search?: SearchContext
    /** Utilities to wire up the row element. */
    bind: RowBindAPI
  }) => React.ReactNode

  /**
   * Content renderer for a surface whose items use payload `T`.
   * Use `bind.getContentProps()` if you provide your own wrapper.
   */
  Content: (args: {
    /** Full menu data for this surface. */
    menu: MenuData<T>
    /** Already constructed children (Header/Input/List/Footer). */
    children: React.ReactNode
    /** Utilities to wire up the surface element. */
    bind: ContentBindAPI
  }) => React.ReactNode

  /** Optional header rendered above the input. */
  Header?: (args: {
    /** Menu data for the surface. */ menu: MenuData<T>
  }) => React.ReactNode

  /** Input renderer for the surface. Use `bind.getInputProps()`. */
  Input: (args: {
    /** Current string value of the search input. */
    value: string
    /** Called on value change. */
    onChange: (v: string) => void
    /** Utilities to wire up the input element. */
    bind: InputBindAPI
  }) => React.ReactNode

  /** Empty state when no results match (inside the list area). */
  Empty?: (args: {
    /** The user’s current query. */ query: string
  }) => React.ReactNode

  /** List renderer that wraps all rows. Use `bind.getListProps()`. */
  List: (args: {
    /** Rows to render inside the list. */
    children: React.ReactNode
    /** Utilities to wire up the list element. */
    bind: ListBindAPI
  }) => React.ReactNode

  /** Optional surface footer: rendered BELOW the list (not inside it). */
  Footer?: (args: {
    /** Menu data for the surface. */ menu: MenuData<T>
  }) => React.ReactNode

  /** Submenu trigger renderer (behaves like an item but opens a submenu). */
  SubmenuTrigger: (args: {
    /** Submenu node to render as a trigger. */
    node: SubmenuNode<any>
    /** Search context during filtered views. */
    search?: SearchContext
    /** Utilities to wire up the row element. */
    bind: RowBindAPI
  }) => React.ReactNode
}

/* Default minimal renderers (safe fallbacks) */
function defaultSlots<T>(): Required<MenuSlots<T>> {
  return {
    Content: ({ children, bind }) => (
      <div {...bind.getContentProps()}>{children}</div>
    ),
    Header: () => null,
    Input: ({ value, onChange, bind }) => (
      <input
        {...bind.getInputProps({
          value,
          onChange: (e) => onChange(e.target.value),
        })}
      />
    ),
    List: ({ children, bind }) => (
      <div {...bind.getListProps()}>{children}</div>
    ),
    Empty: ({ query }) => (
      <div data-slot="action-menu-empty">
        No results{query ? ` for “${query}”` : ''}.
      </div>
    ),
    Item: ({ node, bind }) => (
      <div {...bind.getRowProps()}>
        {/* Only render if provided */}
        {node.icon ? (
          <span aria-hidden>
            {renderIcon(
              node.icon /*, 'size-4 shrink-0' (add your classes if you want) */,
            )}
          </span>
        ) : null}
        {node.render ? (
          node.render()
        ) : (
          <span>{node.label ?? String(node.id)}</span>
        )}
      </div>
    ),
    SubmenuTrigger: ({ node, bind }) => (
      <div {...bind.getRowProps()}>
        {node.icon ? (
          <span aria-hidden>
            {renderIcon(node.icon /*, 'size-4 shrink-0' */)}
          </span>
        ) : null}
        {node.render ? (
          node.render()
        ) : (
          <span>{node.label ?? node.title ?? String(node.id)}</span>
        )}
      </div>
    ),
    Footer: () => null,
  }
}

/* =========================================================================== */
/* =========================== Utils: props composition ====================== */
/* =========================================================================== */

const HANDLER_KEYS = [
  'onClick',
  'onKeyDown',
  'onKeyUp',
  'onMouseDown',
  'onMouseUp',
  'onMouseEnter',
  'onMouseLeave',
  'onPointerDown',
  'onPointerUp',
  'onFocus',
  'onBlur',
] as const

/**
 * Merge two sets of React props:
 * - Merges `className` intelligently with `cn`
 * - Composes known event handlers with Radix `composeEventHandlers` (base first)
 * - Composes `ref`s with Radix `composeRefs`
 * - Later `overrides` win for non-special props
 */
function mergeProps<
  A extends Record<string, any>,
  B extends Record<string, any>,
>(base: A | undefined, overrides?: B): A & B {
  const a: any = base ?? {}
  const b: any = overrides ?? {}
  const merged: any = { ...a, ...b }
  // merge className
  if (a.className || b.className) {
    merged.className = cn(a.className, b.className)
  }
  // compose known handlers (base first, then override)
  for (const key of HANDLER_KEYS) {
    const aH = a[key]
    const bH = b[key]
    if (aH || bH) merged[key] = composeEventHandlers(aH, bH)
  }
  // compose ref
  if (a.ref || b.ref) {
    merged.ref = composeRefs(a.ref, b.ref)
  }
  return merged
}

/** True when the given ReactNode is an element whose props contain `propName`. */
function isElementWithProp(node: React.ReactNode, propName: string) {
  return React.isValidElement(node) && propName in (node.props as any)
}

/* ================================================================================================
 * Constants, tiny helpers
 * ============================================================================================== */

/** Hit-test a point (x,y) against a DOMRect. */
function isInBounds(x: number, y: number, rect: DOMRect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

/** Find the input & list elements within a surface container. */
function findWidgetsWithinSurface(surface: HTMLElement | null) {
  const input =
    surface?.querySelector<HTMLInputElement>('[data-action-menu-input]') ?? null
  const list =
    surface?.querySelector<HTMLElement>('[data-action-menu-list]') ?? null
  return { input, list }
}

/** Track global mouse position; used by aim-guard heuristics and debug polygon. */
function useMousePosition(): [number, number] {
  const [pos, setPos] = React.useState<[number, number]>([0, 0])
  React.useEffect(() => {
    const onMove = (e: PointerEvent) => setPos([e.clientX, e.clientY])
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])
  return pos
}

/* ================================================================================================
 * Keyboard helpers
 * ============================================================================================== */

/** UI text direction used to resolve ArrowLeft/ArrowRight semantics. */
export type Direction = 'ltr' | 'rtl'

/** Keys that commit a selection. */
export const SELECTION_KEYS = ['Enter'] as const
/** Keys that move focus to the first item. */
export const FIRST_KEYS = ['ArrowDown', 'PageUp', 'Home'] as const
/** Keys that move focus to the last item. */
export const LAST_KEYS = ['ArrowUp', 'PageDown', 'End'] as const

/** Keys that open a submenu from a trigger, per direction. */
export const SUB_OPEN_KEYS: Record<Direction, readonly string[]> = {
  ltr: [...SELECTION_KEYS, 'ArrowRight'],
  rtl: [...SELECTION_KEYS, 'ArrowLeft'],
}
/** Keys that close a submenu and return to its parent, per direction. */
export const SUB_CLOSE_KEYS: Record<Direction, readonly string[]> = {
  ltr: ['ArrowLeft'],
  rtl: ['ArrowRight'],
}

export const isSelectionKey = (k: string) =>
  (SELECTION_KEYS as readonly string[]).includes(k)
export const isFirstKey = (k: string) =>
  (FIRST_KEYS as readonly string[]).includes(k)
export const isLastKey = (k: string) =>
  (LAST_KEYS as readonly string[]).includes(k)
export const isOpenKey = (dir: Direction, k: string) =>
  SUB_OPEN_KEYS[dir].includes(k)
export const isCloseKey = (dir: Direction, k: string) =>
  SUB_CLOSE_KEYS[dir].includes(k)

/** Support Vim-style next (Ctrl+N/J). */
export const isVimNext = (e: React.KeyboardEvent) =>
  e.ctrlKey && (e.key === 'n' || e.key === 'j')
/** Support Vim-style previous (Ctrl+P/K). */
export const isVimPrev = (e: React.KeyboardEvent) =>
  e.ctrlKey && (e.key === 'p' || e.key === 'k')

/**
 * Resolve direction:
 * - Use explicit prop if provided
 * - Else read `document.dir`
 * - Else default to LTR
 */
export const getDir = (explicit?: Direction): Direction => {
  if (explicit) return explicit
  if (typeof document !== 'undefined') {
    const d = document?.dir?.toLowerCase()
    if (d === 'rtl' || d === 'ltr') return d as Direction
  }
  return 'ltr'
}

/* ================================================================================================
 * Keyboard context
 * ============================================================================================== */

/** Options that affect keyboard behavior across the subtree. */
type KeyboardOptions = {
  /** Text direction (affects ArrowLeft/Right close/open). */
  dir: Direction
  /** Whether Vim bindings (Ctrl+N/P/J/K) are enabled. */
  vimBindings: boolean
}
const KeyboardCtx = React.createContext<KeyboardOptions>({
  dir: 'ltr',
  vimBindings: true,
})
const useKeyboardOpts = () => React.useContext(KeyboardCtx)

/* ================================================================================================
 * Custom events (open/select/internal notifications)
 * ============================================================================================== */

const OPEN_SUB_EVENT = 'actionmenu-open-sub' as const
const SELECT_ITEM_EVENT = 'actionmenu-select-item' as const
const INPUT_VISIBILITY_CHANGE_EVENT =
  'actionmenu-input-visibility-change' as const

/** Fire a bubbling CustomEvent of the given type from a DOM node. */
function dispatch(node: HTMLElement | null | undefined, type: string) {
  if (!node) return
  node.dispatchEvent(new CustomEvent(type, { bubbles: true }))
}

/** If the active row is a submenu trigger, dispatch the OPEN_SUB_EVENT on it. */
function openSubmenuForActive(activeId: string | null) {
  const el = activeId ? document.getElementById(activeId) : null
  if (el && (el as HTMLElement).dataset.subtrigger === 'true') {
    dispatch(el, OPEN_SUB_EVENT)
  }
}

/* ================================================================================================
 * Root-level context (open state + anchor)
 * ============================================================================================== */

/** Values shared by the root component/providers. */
type ActionMenuRootContextValue = {
  /** Whether the root menu is open. */
  open: boolean
  /** Setter for the open state. */
  onOpenChange: (open: boolean) => void
  /** Convenience toggle for open state. */
  onOpenToggle: () => void
  /** When true, outside pointer events are disabled (modal behavior). */
  modal: boolean
  /** Ref to the trigger/anchor element for Popper positioning. */
  anchorRef: React.RefObject<HTMLElement | null>
  /** When true, visual debugging aids are shown. */
  debug: boolean
}

const RootCtx = React.createContext<ActionMenuRootContextValue | null>(null)
const useRootCtx = () => {
  const ctx = React.useContext(RootCtx)
  if (!ctx)
    throw new Error('useActionMenu must be used within an ActionMenu.Root')
  return ctx
}

/** Provides a stable id string for the current surface. */
const SurfaceIdCtx = React.createContext<string | null>(null)
const useSurfaceId = () => React.useContext(SurfaceIdCtx)

/** Values shared by each submenu (trigger+content). */
type SubContextValue = {
  /** Whether the submenu’s surface is open. */
  open: boolean
  /** Setter for the submenu’s open state. */
  onOpenChange: (open: boolean) => void
  /** Convenience toggle for submenu open state. */
  onOpenToggle: () => void
  /** Ref to the trigger row element. */
  triggerRef: React.RefObject<HTMLDivElement | HTMLButtonElement | null>
  /** Ref to the submenu content/surface element. */
  contentRef: React.RefObject<HTMLDivElement | null>
  /** Parent surface id so we can return focus on close. */
  parentSurfaceId: string
  /** The id of the trigger item row that opened this submenu. */
  triggerItemId: string | null
  /** Setter for `triggerItemId`. */
  setTriggerItemId: (id: string | null) => void
  /** Parent’s method to set its active row (used on close/back). */
  parentSetActiveId: (id: string | null, cause?: ActivationCause) => void
  /** Child surface id used for focus ownership and aria wiring. */
  childSurfaceId: string
  /** Tracks whether the submenu opened via keyboard/pointer for hover policy. */
  pendingOpenModalityRef: React.RefObject<'keyboard' | 'pointer' | null>
  /** True while the pointer is predicted to be heading into the submenu. */
  intentZoneActiveRef: React.RefObject<boolean>
}

const SubCtx = React.createContext<SubContextValue | null>(null)
const useSubCtx = () => React.useContext(SubCtx)

/* ================================================================================================
 * Focus context -- which surface owns the real DOM focus
 * ============================================================================================== */

/** Tracks which surface currently owns real DOM focus (input/list). */
type FocusOwnerCtxValue = {
  /** The id of the focus-owning surface (or null when none). */
  ownerId: string | null
  /** Setter to change the focus owner. */
  setOwnerId: (id: string | null) => void
}
const FocusOwnerCtx = React.createContext<FocusOwnerCtxValue | null>(null)
const useFocusOwner = () => {
  const ctx = React.useContext(FocusOwnerCtx)
  if (!ctx) throw new Error('FocusOwnerCtx missing')
  return ctx
}

/* ================================================================================================
 * Surface store (per Content) — roving focus & registration
 * ============================================================================================== */

/** Mutable state tracked for a surface. */
type SurfaceState = {
  /** Id of the active/focused row (aria-activedescendant target). */
  activeId: string | null
  /** True when an input is visible on this surface. */
  hasInput: boolean
  /** DOM id for the list element (paired with input `aria-controls`). */
  listId: string | null
}

/** Registration record stored per row. */
type RowRecord = {
  /** Ref to the row element (used for scroll-into-view & events). */
  ref: React.RefObject<HTMLElement>
  /** Reserved for future disabled handling. */
  disabled?: boolean
  /** Whether this row opens a submenu or is a leaf item. */
  kind: 'item' | 'submenu'
  /** Programmatic open handler for the submenu (if kind==='submenu'). */
  openSub?: () => void
  /** Programmatic close handler for the submenu (if kind==='submenu'). */
  closeSub?: () => void
}

/** Why activation changed (helps policy decisions). */
type ActivationCause = 'keyboard' | 'pointer' | 'programmatic'

/** Per-surface API supporting registration, roving focus and refs. */
type SurfaceStore = {
  /** Subscribe to state changes. */
  subscribe(cb: () => void): () => void
  /** Get a snapshot of current state. */
  snapshot(): SurfaceState
  /** Set a state key and emit if it changed. */
  set<K extends keyof SurfaceState>(k: K, v: SurfaceState[K]): void

  /** Register a row by id with its record. */
  registerRow(id: string, rec: RowRecord): void
  /** Unregister a row by id. */
  unregisterRow(id: string): void
  /** Return the current visual order of row ids. */
  getOrder(): string[]
  /** Replace the current visual order with `ids`. */
  resetOrder(ids: string[]): void

  /** Activate a row by id. */
  setActiveId(id: string | null, cause?: ActivationCause): void
  /** Activate a row by visual index. */
  setActiveByIndex(idx: number, cause?: ActivationCause): void
  /** Activate the first row. */
  first(cause?: ActivationCause): void
  /** Activate the last row. */
  last(cause?: ActivationCause): void
  /** Activate the next row (wraps). */
  next(cause?: ActivationCause): void
  /** Activate the previous row (wraps). */
  prev(cause?: ActivationCause): void

  /** Map of row ids to their registration records. */
  readonly rows: Map<string, RowRecord>
  /** Ref to the surface input element (if present). */
  readonly inputRef: React.RefObject<HTMLInputElement | null>
  /** Ref to the surface list element. */
  readonly listRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Create an isolated store for a surface.
 * Centralizes row registration, active row tracking, and focus scroll-into-view.
 */
function createSurfaceStore(): SurfaceStore {
  const state: SurfaceState = {
    activeId: null,
    hasInput: true,
    listId: null,
  }
  const listeners = new Set<() => void>()
  const rows = new Map<string, RowRecord>()
  const order: string[] = []
  const listRef = React.createRef<HTMLDivElement | null>()
  const inputRef = React.createRef<HTMLInputElement | null>()

  const emit = () =>
    listeners.forEach((l) => {
      l()
    })

  const snapshot = () => state

  const set = <K extends keyof SurfaceState>(k: K, v: SurfaceState[K]) => {
    if (Object.is((state as any)[k], v)) return
    ;(state as any)[k] = v
    emit()
  }

  const getOrder = () => order.slice()

  const resetOrder = (ids: string[]) => {
    order.splice(0)
    order.push(...ids)
    emit()
  }

  /** Ensure active row id points at an existing row or first row; internal helper. */
  const ensureActiveExists = () => {
    if (state.activeId && rows.has(state.activeId)) return
    state.activeId = order[0] ?? null
  }

  const setActiveId = (
    id: string | null,
    cause: ActivationCause = 'keyboard',
  ) => {
    const prev = state.activeId
    if (Object.is(prev, id)) return
    state.activeId = id

    // Single-open submenu policy — close any submenu whose trigger isn’t active.
    for (const [rid, rec] of rows) {
      if (rec.kind === 'submenu' && rec.closeSub && rid !== id) {
        try {
          rec.closeSub()
        } catch {}
      }
    }

    emit()

    // Scroll newly active row into view when navigation is via keyboard.
    if (cause !== 'keyboard') return

    const el = id ? rows.get(id)?.ref.current : null
    const listEl = listRef.current
    if (el && listEl) {
      try {
        const inList = listEl.contains(el)
        if (inList) el.scrollIntoView({ block: 'nearest' })
      } catch {}
    }
  }

  const setActiveByIndex = (
    idx: number,
    cause: ActivationCause = 'keyboard',
  ) => {
    if (!order.length) return setActiveId(null, cause)
    const clamped = idx < 0 ? 0 : idx >= order.length ? order.length - 1 : idx
    setActiveId(order[clamped]!, cause)
  }

  const first = (cause: ActivationCause = 'keyboard') =>
    setActiveByIndex(0, cause)

  const last = (cause: ActivationCause = 'keyboard') =>
    setActiveByIndex(order.length - 1, cause)

  const next = (cause: ActivationCause = 'keyboard') => {
    if (!order.length) return setActiveId(null, cause)
    const curr = state.activeId
    const i = curr ? order.indexOf(curr) : -1
    const n = i === -1 ? 0 : (i + 1) % order.length
    setActiveId(order[n]!, cause)
  }

  const prev = (cause: ActivationCause = 'keyboard') => {
    if (!order.length) return setActiveId(null, cause)
    const curr = state.activeId
    const i = curr ? order.indexOf(curr) : 0
    const p = i <= 0 ? order.length - 1 : i - 1
    setActiveId(order[p]!, cause)
  }

  return {
    subscribe(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    snapshot,
    set,
    registerRow(id, rec) {
      if (!rows.has(id)) order.push(id)
      rows.set(id, rec)
      ensureActiveExists()
      emit()
    },
    unregisterRow(id) {
      rows.delete(id)
      const idx = order.indexOf(id)
      if (idx >= 0) order.splice(idx, 1)
      if (state.activeId === id) {
        ensureActiveExists()
        emit()
      } else {
        emit()
      }
    },
    getOrder,
    resetOrder,
    setActiveId,
    setActiveByIndex,
    first,
    last,
    next,
    prev,
    rows,
    inputRef,
    listRef,
  }
}

/** Select part of a surface store with `useSyncExternalStore`. */
function useSurfaceSel<T>(store: SurfaceStore, sel: (s: SurfaceState) => T): T {
  const get = React.useCallback(() => sel(store.snapshot()), [store, sel])
  return React.useSyncExternalStore(store.subscribe, get, get)
}

const SurfaceCtx = React.createContext<SurfaceStore | null>(null)
const useSurface = () => {
  const ctx = React.useContext(SurfaceCtx)
  if (!ctx) throw new Error('SurfaceCtx missing')
  return ctx
}

/** Hover policy/aim-guard data used to reduce accidental submenu closures. */
type HoverPolicy = {
  /** When true, entry hover should not open submenus (temporary). */
  suppressHoverOpen: boolean
  /** Clears `suppressHoverOpen`. */
  clearSuppression: () => void
  /** When true, aim guard is actively protecting a submenu transition. */
  aimGuardActive: boolean
  /** Id of the trigger that is currently guarded. */
  guardedTriggerId: string | null
  /** Activate the aim guard for a specific trigger for a short window. */
  activateAimGuard: (triggerId: string, timeoutMs?: number) => void
  /** Clear aim guard immediately. */
  clearAimGuard: () => void
  /** Ref mirror of `aimGuardActive` to read inside event handlers. */
  aimGuardActiveRef: React.RefObject<boolean | null>
  /** Ref mirror of `guardedTriggerId` to read inside event handlers. */
  guardedTriggerIdRef: React.RefObject<string | null>
  /** True if aim guard should block hover for the given row id. */
  isGuardBlocking: (rowId: string) => boolean
}

const HoverPolicyCtx = React.createContext<HoverPolicy>({
  suppressHoverOpen: false,
  clearSuppression: () => {},
  aimGuardActive: false,
  guardedTriggerId: null,
  activateAimGuard: () => {},
  clearAimGuard: () => {},
  aimGuardActiveRef: React.createRef<boolean>(),
  guardedTriggerIdRef: React.createRef(),
  isGuardBlocking: () => false,
})
const useHoverPolicy = () => React.useContext(HoverPolicyCtx)

/* ================================================================================================
 * Keyboard handling shared by Input/List
 * ============================================================================================== */

/**
 * Shared keyboard handler used by both the input and the list.
 * Implements roving focus, open/close with arrows (dir-aware), selection, and Tab trapping.
 * Only the surface that *owns* focus will handle key events.
 */
function useNavKeydown(source: 'input' | 'list') {
  const store = useSurface()
  const root = useRootCtx()
  const sub = useSubCtx()
  const surfaceId = useSurfaceId() || 'root'
  const { ownerId, setOwnerId } = useFocusOwner()
  const { dir, vimBindings } = useKeyboardOpts()

  return React.useCallback(
    (e: React.KeyboardEvent) => {
      // Only the focus-owning surface handles keys.
      if (ownerId !== surfaceId) return

      const k = e.key

      const stop = () => {
        e.preventDefault()
        e.stopPropagation()
      }

      // Vim binds
      if (vimBindings) {
        if (isVimNext(e)) {
          stop()
          store.next()
          return
        }
        if (isVimPrev(e)) {
          stop()
          store.prev()
          return
        }
      }

      // Trap focus in the surface
      if (k === 'Tab') {
        stop()
        return
      }

      if (k === 'ArrowDown') {
        stop()
        store.next()
        return
      }
      if (k === 'ArrowUp') {
        stop()
        store.prev()
        return
      }
      if (k === 'Home' || k === 'PageUp') {
        stop()
        store.first()
        return
      }
      if (k === 'End' || k === 'PageDown') {
        stop()
        store.last()
        return
      }

      // Open / Select
      if (isOpenKey(dir, k)) {
        stop()
        const activeId = store.snapshot().activeId
        if (isSelectionKey(k)) {
          // Enter on a subtrigger opens the submenu; otherwise select.
          const el = activeId ? document.getElementById(activeId) : null
          if (el && el.dataset.subtrigger === 'true') {
            openSubmenuForActive(activeId)
          } else {
            dispatch(el, SELECT_ITEM_EVENT)
          }
        } else {
          // ArrowRight (LTR) / ArrowLeft (RTL)
          openSubmenuForActive(activeId)
        }
        return
      }

      // Close / Back (for submenu surfaces)
      if (isCloseKey(dir, k)) {
        if (sub) {
          stop()
          setOwnerId(sub.parentSurfaceId)
          sub.onOpenChange(false)
          sub.parentSetActiveId(sub.triggerItemId)
          const parentEl = document.querySelector<HTMLElement>(
            `[data-surface-id="${sub.parentSurfaceId}"]`,
          )
          // Defer focus to parent input/list after close so readers see it.
          requestAnimationFrame(() => {
            const { input, list } = findWidgetsWithinSurface(parentEl)
            ;(input ?? list)?.focus()
          })
          return
        }
      }

      if (k === 'Enter') {
        stop()
        const activeId = store.snapshot().activeId
        const el = activeId ? document.getElementById(activeId) : null
        if (el && el.dataset.subtrigger === 'true') {
          openSubmenuForActive(activeId)
        } else {
          dispatch(el, SELECT_ITEM_EVENT)
        }
        return
      }

      if (k === 'Escape') {
        stop()
        if (sub) {
          sub.onOpenChange(false)
          return
        }
        root.onOpenChange(false)
        return
      }
    },
    [store, root, sub, dir, vimBindings, ownerId, setOwnerId, surfaceId],
  )
}

/** Keep the last N mouse positions without causing re-renders (used by aim-guard). */
function useMouseTrail(n = 2) {
  const trailRef = React.useRef<[number, number][]>([])
  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const a = trailRef.current
      a.push([e.clientX, e.clientY])
      if (a.length > n) a.shift()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [n])
  return trailRef
}

type AnchorSide = 'left' | 'right'

/**
 * Decide whether the submenu is anchored to the left or right of its parent,
 * based on geometry and (when available) the trigger position.
 */
function resolveAnchorSide(
  rect: DOMRect,
  tRect: DOMRect | null,
  mx: number,
): 'left' | 'right' {
  if (tRect) {
    const tx = (tRect.left + tRect.right) / 2
    const dL = Math.abs(tx - rect.left)
    const dR = Math.abs(tx - rect.right)
    return dL <= dR ? 'left' : 'right'
  }
  return mx < rect.left ? 'left' : 'right'
}

/**
 * Return a smoothed heading vector from the mouse trail.
 * Falls back to a vector from trigger center → submenu edge when the trail is degenerate.
 */
function getSmoothedHeading(
  trail: [number, number][],
  exitX: number,
  exitY: number,
  anchor: 'left' | 'right',
  tRect: DOMRect | null,
  rect: DOMRect,
): { dx: number; dy: number } {
  // Average the last few deltas
  let dx = 0
  let dy = 0
  const n = Math.min(Math.max(trail.length - 1, 0), 4) // up to 4 segments
  for (let i = trail.length - n - 1; i < trail.length - 1; i++) {
    if (i < 0) continue
    const [x1, y1] = trail[i]!
    const [x2, y2] = trail[i + 1]!
    dx += x2 - x1
    dy += y2 - y1
  }

  // If heading is tiny, fall back to a vector from trigger center to submenu edge center.
  const mag = Math.hypot(dx, dy)
  if (mag < 0.5) {
    const tx = tRect ? (tRect.left + tRect.right) / 2 : exitX
    const ty = tRect ? (tRect.top + tRect.bottom) / 2 : exitY
    const edgeX = anchor === 'right' ? rect.left : rect.right
    const edgeCy = (rect.top + rect.bottom) / 2
    dx = edgeX - tx
    dy = edgeCy - ty
  }

  return { dx, dy }
}

/**
 * Predict whether the current pointer trajectory will intersect
 * the submenu’s vertical band near the edge (with tolerance).
 * Used to “guard” against accidental parent-row hover changes mid-flight.
 */
function willHitSubmenu(
  exitX: number,
  exitY: number,
  heading: { dx: number; dy: number },
  rect: DOMRect,
  anchor: 'left' | 'right',
  triggerRect: DOMRect | null,
): boolean {
  const { dx, dy } = heading
  if (Math.abs(dx) < 0.01) return false

  if (anchor === 'left' && dx <= 0) return false // need to go right
  if (anchor === 'right' && dx >= 0) return false // need to go left

  const edgeX = anchor === 'left' ? rect.left : rect.right

  const t = (edgeX - exitX) / dx
  if (t <= 0) return false

  const yAtEdge = exitY + t * dy

  // Tolerant vertical band at the edge
  const baseBand = triggerRect ? triggerRect.height * 0.75 : 28
  const extra = Math.max(12, Math.min(36, baseBand)) // 12..36px
  const top = rect.top - extra * 0.25
  const bottom = rect.bottom + extra * 0.25

  return yAtEdge >= top && yAtEdge <= bottom
}

/** Props for the (debug) intent zone polygon visual. */
type IntentZoneProps = {
  /** Ref to the submenu content root (destination polygon base). */
  parentRef: React.RefObject<HTMLElement | null>
  /** Ref to the submenu trigger row (source/anchor for heading fallback). */
  triggerRef: React.RefObject<HTMLElement | null>
  /** When true, show a translucent band; otherwise invisible. */
  visible?: boolean
}

/**
 * Visual-only debug polygon showing the aim-guard band.
 * No hit-testing or event listeners; renders in a Portal so it is above everything.
 */
function IntentZone({
  parentRef,
  triggerRef,
  visible = false,
}: IntentZoneProps) {
  const [mx, my] = useMousePosition()

  const isCoarse = React.useMemo(
    () =>
      typeof window !== 'undefined'
        ? matchMedia('(pointer: coarse)').matches
        : false,
    [],
  )
  const content = parentRef.current
  const rect = content?.getBoundingClientRect()
  if (!rect || isCoarse) return null

  const tRect = triggerRef?.current?.getBoundingClientRect() ?? null
  const x = rect.left
  const y = rect.top
  const w = rect.width
  const h = rect.height
  if (!w || !h) return null

  const anchor = resolveAnchorSide(rect, tRect, mx)

  // If pointer is already past the submenu edge, nothing to draw.
  if (anchor === 'left' && mx >= x) return null
  if (anchor === 'right' && mx <= x + w) return null

  const INSET = 2
  const pct = Math.max(0, Math.min(100, ((my - y) / h) * 100))
  const width =
    anchor === 'left'
      ? Math.max(x - mx, 10) + INSET
      : Math.max(mx - (x + w), 10) + INSET
  const left = anchor === 'left' ? x - width : x + w
  const clip =
    anchor === 'left'
      ? `polygon(100% 0%, 0% ${pct}%, 100% 100%)`
      : `polygon(0% 0%, 0% 100%, 100% ${pct}%)`

  const Polygon = (
    <div
      data-action-menu-intent-zone
      aria-hidden
      style={{
        position: 'fixed',
        top: y,
        left,
        width,
        height: h,
        pointerEvents: 'none', // IMPORTANT: no events, pure visual
        clipPath: clip,
        zIndex: Number.MAX_SAFE_INTEGER,
        background: visible ? 'rgba(0, 136, 255, 0.15)' : 'transparent',
        transform: 'translateZ(0)',
      }}
    />
  )

  return <Portal>{Polygon}</Portal>
}

/* ================================================================================================
 * Root
 * ============================================================================================== */

/** Public props for the ActionMenu root. */
export interface ActionMenuProps extends Children {
  /** Controlled open state. */
  open?: boolean
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean
  /** Notifies when the open state changes. */
  onOpenChange?: (open: boolean) => void
  /** When true, outside pointer events are disabled while open. */
  modal?: boolean
  /** When true, show visual debugging aids (intent zone, etc.). */
  debug?: boolean
}

/**
 * Provides the root context and an outer DismissableLayer/Popper.
 * - Handles outside interactions and Escape to close
 * - Owns the anchorRef used for positioning content
 */
export const Root = ({
  children,
  open: openProp,
  defaultOpen,
  onOpenChange,
  modal = true,
  debug = false,
}: ActionMenuProps) => {
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
  })
  const anchorRef = React.useRef<HTMLButtonElement | null>(null)
  const [ownerId, setOwnerId] = React.useState<string | null>(null)

  return (
    <RootCtx.Provider
      value={{
        open,
        onOpenChange: setOpen,
        onOpenToggle: () => setOpen((v) => !v),
        anchorRef,
        modal,
        debug,
      }}
    >
      <FocusOwnerCtx.Provider value={{ ownerId, setOwnerId }}>
        <DismissableLayer.Root
          asChild
          disableOutsidePointerEvents={modal}
          onEscapeKeyDown={() => setOpen(false)}
          onInteractOutside={(event) => {
            // If the target is inside the root menu surface, ignore.
            const target = event.target as Node | null
            const rootMenuSurface = document.querySelector(
              '[data-action-menu-surface=true]',
            )
            if (rootMenuSurface?.contains(target)) return

            // Otherwise, close on outside interaction.
            event.preventDefault()
            setOpen(false)
          }}
        >
          <Popper.Root>{children}</Popper.Root>
        </DismissableLayer.Root>
      </FocusOwnerCtx.Provider>
    </RootCtx.Provider>
  )
}

/* ================================================================================================
 * Trigger (Popper anchor)
 * ============================================================================================== */

/** Props for the menu trigger button. */
export interface ActionMenuTriggerProps extends ButtonProps {}

/**
 * Button that toggles the menu. Also acts as the Popper anchor.
 * Pointer and keyboard interactions map to expected menu semantics.
 */
export const Trigger = React.forwardRef<
  HTMLButtonElement,
  ActionMenuTriggerProps
>(
  (
    { children, disabled, onPointerDown, onKeyDown, ...props },
    forwardedRef,
  ) => {
    const root = useRootCtx()

    return (
      <DismissableLayer.Branch asChild>
        <Popper.Anchor asChild>
          <Primitive.button
            {...props}
            data-slot="action-menu-trigger"
            ref={composeRefs(forwardedRef, root.anchorRef)}
            disabled={disabled}
            onPointerDown={composeEventHandlers(onPointerDown, (event) => {
              // Left click toggles; prevent focus stealing on open so input can autofocus.
              if (!disabled && event.button === 0 && event.ctrlKey === false) {
                const willOpen = !root.open
                root.onOpenToggle()
                if (willOpen) event.preventDefault()
              }
            })}
            onKeyDown={composeEventHandlers(onKeyDown, (event) => {
              if (disabled) return
              if (event.key === 'Enter' || event.key === ' ')
                root.onOpenToggle()
              if (event.key === 'ArrowDown') root.onOpenChange(true)
              if (['Enter', ' ', 'ArrowDown'].includes(event.key))
                event.preventDefault()
            })}
            aria-haspopup="menu"
            aria-expanded={root.open}
          >
            {children}
          </Primitive.button>
        </Popper.Anchor>
      </DismissableLayer.Branch>
    )
  },
)
Trigger.displayName = 'ActionMenu.Trigger'

/* ================================================================================================
 * Positioner
 * ============================================================================================== */

/** Props that control where content is placed around its anchor. */
export interface ActionMenuPositionerProps {
  /** Single React element to position (typically <ActionMenu.Content/>). */
  children: React.ReactElement
  /** Side of the anchor to place the content. */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** How to align the content along that side. */
  align?: 'start' | 'center' | 'end'
  /** Offset (px) away from the side. */
  sideOffset?: number
  /** Offset (px) along the alignment axis. */
  alignOffset?: number
  /** Whether to avoid viewport collisions. */
  avoidCollisions?: boolean
  /** Padding (px) used by the collision engine. */
  collisionPadding?:
    | number
    | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  /**
   * Align the submenu to the first row rather than the top.
   * - 'on-open' (deprecated here) or 'always' keeps it aligned with the first row even when input becomes visible.
   * - false disables this behavior.
   */
  alignToFirstItem?: false | 'on-open' | 'always'
}

/**
 * Wraps Popper.Content with logic to optionally align a submenu
 * to the first visible row (useful when an input appears at the top).
 */
export const Positioner: React.FC<ActionMenuPositionerProps> = ({
  children,
  side,
  align = 'start',
  sideOffset = 8,
  alignOffset = 0,
  avoidCollisions = true,
  collisionPadding = 8,
  alignToFirstItem = 'on-open',
}) => {
  const root = useRootCtx()
  const sub = useSubCtx()

  const isSub = !!sub
  const present = isSub ? sub!.open : root.open
  const defaultSide = isSub ? 'right' : 'bottom'
  const resolvedSide = side ?? defaultSide

  const [firstRowAlignOffset, setFirstRowAlignOffset] = React.useState(0)

  /**
   * Find the actual content element. We prefer the ref, but as a fallback,
   * we can look it up by the known surface id (in case a custom Content forgot to spread the bind props).
   */
  const findContentEl = React.useCallback((): HTMLElement | null => {
    if (!sub) return null
    const byRef = sub.contentRef.current
    if (byRef) return byRef
    try {
      return document.querySelector<HTMLElement>(
        `[data-surface-id="${sub.childSurfaceId}"]`,
      )
    } catch {
      return null
    }
  }, [sub])

  /**
   * Measure the distance between the surface top and the first row’s top,
   * and use it as an `alignOffset` so the submenu aligns with the first row,
   * not with the input above it.
   */
  const measure = React.useCallback(() => {
    if (!isSub || !present || !alignToFirstItem) {
      setFirstRowAlignOffset(0)
      return
    }
    if (!(resolvedSide === 'right' || resolvedSide === 'left')) {
      setFirstRowAlignOffset(0)
      return
    }

    const el = findContentEl()

    if (!el) return
    const inputEl = el.querySelector<HTMLElement>('[data-action-menu-input]')
    const hasVisibleInput = !!inputEl && inputEl.offsetParent !== null
    const firstRow = el.querySelector<HTMLElement>(
      '[data-action-menu-list] [data-action-menu-item-id]',
    )
    if (!hasVisibleInput || !firstRow) {
      setFirstRowAlignOffset(0)
      return
    }

    const cr = el.getBoundingClientRect()
    const fr = firstRow.getBoundingClientRect()
    setFirstRowAlignOffset(-Math.round(fr.top - cr.top))
  }, [isSub, present, alignToFirstItem, resolvedSide, sub])

  // Listen globally for “input visibility change” so we can re-measure alignment when inputs show/hide.
  React.useEffect(() => {
    if (!isSub || !present || !alignToFirstItem) return
    const handle = (e: Event) => {
      const customEvent = e as CustomEvent<{
        surfaceId?: string
        hideSearchUntilActive?: boolean
        inputActive?: boolean
      }>
      const target = e.target as HTMLElement | null

      const ok =
        customEvent.detail?.surfaceId === sub!.childSurfaceId ||
        target?.closest?.(`[data-surface-id="${sub!.childSurfaceId}"]`) !== null

      if (!ok) return

      // If we only want to align on menu open, don't re-measure when the input becomes visible after typing.
      if (
        alignToFirstItem === 'on-open' &&
        customEvent.detail?.hideSearchUntilActive &&
        customEvent.detail?.inputActive
      ) {
        return
      }

      requestAnimationFrame(measure)
    }

    document.addEventListener(INPUT_VISIBILITY_CHANGE_EVENT, handle, true) // capture so we catch all
    return () =>
      document.removeEventListener(INPUT_VISIBILITY_CHANGE_EVENT, handle, true)
  }, [isSub, sub, present, alignToFirstItem, measure])

  const effectiveAlignOffset =
    isSub && alignToFirstItem ? firstRowAlignOffset : alignOffset

  const content = isSub ? (
    <DismissableLayer.Branch asChild>
      <Popper.Content
        side={resolvedSide}
        align={align}
        sideOffset={sideOffset}
        alignOffset={effectiveAlignOffset}
        avoidCollisions={avoidCollisions}
        collisionPadding={collisionPadding}
      >
        {children}
      </Popper.Content>
    </DismissableLayer.Branch>
  ) : (
    <Popper.Content
      asChild
      side={resolvedSide}
      align={align}
      sideOffset={sideOffset}
      alignOffset={effectiveAlignOffset}
      avoidCollisions={avoidCollisions}
      collisionPadding={collisionPadding}
    >
      {children}
    </Popper.Content>
  )

  return (
    <>
      <Presence present={present}>{content}</Presence>
      {/* Safe polygon overlay only for open submenus */}
      {isSub && present ? (
        <IntentZone
          parentRef={sub!.contentRef as React.RefObject<HTMLElement | null>}
          triggerRef={sub!.triggerRef as React.RefObject<HTMLElement | null>}
          visible={root.debug}
        />
      ) : null}
    </>
  )
}

/* ================================================================================================
 * Content (generic) — adds Input and List with bind APIs
 * ============================================================================================== */

/** Public props for the content/surface component. */
export interface ActionMenuContentProps<T = unknown>
  extends Omit<DivProps, 'dir' | 'children'> {
  /** Full data description for this surface (title, nodes, ui, etc.). */
  menu: MenuData<T>
  /** Per-instance slot overrides merged over sensible defaults. */
  slots?: Partial<MenuSlots<T>>
  /** Per-instance slotProps merged with slot output via bind/get*Props or wrappers. */
  slotProps?: Partial<MenuSlotProps>
  /** Enable Vim-style keybindings (Ctrl+N/P/J/K). */
  vimBindings?: boolean
  /** Text direction. Falls back to document.dir when omitted. */
  dir?: Direction
  /** Optional classNames per slot (merged with per-menu classNames). */
  classNames?: Partial<SlotClassNames>
  /** Controlled search value for the surface input. */
  value?: string
  /** Uncontrolled initial value for the surface input. */
  defaultValue?: string
  /** Notifies when the input value changes. */
  onValueChange?: (value: string) => void
  /** When true, autofocus on open (default true). */
  onOpenAutoFocus?: boolean
  /** When true, clear the input value when the menu closes (default true). */
  onCloseAutoClear?: boolean
}

/** Internal props to coordinate nested surfaces and hover policy. */
type ActionMenuContentInternalProps<T = unknown> = ActionMenuContentProps<T> & {
  /** (internal) Force a specific surface id (used by submenus). */
  surfaceIdProp?: string
  /** (internal) When true, suppress hover-open until first pointer move. */
  suppressHoverOpenOnMount?: boolean
}

/**
 * Internal, generic content implementation.
 * Handles:
 * - focus ownership & autofocus on open
 * - input “hidden-until-typing” behavior
 * - hover aim-guard during submenu transitions
 * - roving focus store lifecycle
 */
const ContentBase = React.forwardRef(function ContentBaseInner<T>(
  {
    menu,
    slots: slotOverrides,
    slotProps: slotPropsOverrides,
    vimBindings = true,
    dir: dirProp,
    surfaceIdProp,
    suppressHoverOpenOnMount,
    classNames,
    value: valueProp,
    defaultValue,
    onValueChange,
    onOpenAutoFocus = true, // (reserved — currently focus is always restored on open)
    onCloseAutoClear = true,
    ...props
  }: ActionMenuContentInternalProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const root = useRootCtx()
  const sub = useSubCtx()
  const surfaceId = React.useMemo(
    () => surfaceIdProp ?? sub?.childSurfaceId ?? 'root',
    [surfaceIdProp, sub],
  )
  const { ownerId, setOwnerId } = useFocusOwner()
  const isOwner = ownerId === surfaceId
  const surfaceRef = React.useRef<HTMLDivElement | null>(null)
  const composedRef = composeRefs(
    ref,
    surfaceRef,
    sub ? (sub.contentRef as any) : undefined,
  )
  const dir = getDir(dirProp)

  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue ?? '',
    onChange: onValueChange,
  })

  // Clear the input value when the menu closes (optional, default true).
  React.useEffect(() => {
    if (!root.open && onCloseAutoClear) setValue('')
  }, [root.open])

  const slots = React.useMemo<Required<MenuSlots<T>>>(
    () => ({
      ...defaultSlots<T>(),
      ...(slotOverrides as any),
      ...(menu.ui?.slots as any),
    }),
    [slotOverrides, menu.ui?.slots],
  )

  const slotProps = React.useMemo<Partial<MenuSlotProps>>(
    () => ({
      ...(slotPropsOverrides ?? {}),
      ...(menu.ui?.slotProps ?? {}),
    }),
    [slotPropsOverrides, menu.ui?.slotProps],
  )

  // Allow per-submenu classNames to override/extend.
  const mergedClassNames = React.useMemo(
    () => ({
      ...classNames,
      ...(menu.ui?.classNames ?? {}),
    }),
    [classNames, menu.ui?.classNames],
  )

  const isSubmenu = !!sub

  // Input shows immediately unless hideSearchUntilActive is set on this surface.
  const [inputActive, setInputActive] = React.useState(
    !menu.hideSearchUntilActive,
  )

  // Notify interested listeners (Positioner) when input visibility changes,
  // so we can re-align submenus to the first row, etc.
  React.useLayoutEffect(() => {
    const target: EventTarget =
      surfaceRef.current ??
      (typeof document !== 'undefined' ? document : ({} as any))
    // Fire even if a custom Content forgot to spread bind.getContentProps
    target.dispatchEvent(
      new CustomEvent(INPUT_VISIBILITY_CHANGE_EVENT, {
        bubbles: true,
        composed: true,
        detail: {
          surfaceId,
          hideSearchUntilActive: menu.hideSearchUntilActive,
          inputActive,
        },
      }),
    )
  }, [inputActive, menu.hideSearchUntilActive])

  // Create per-surface store once.
  const storeRef = React.useRef<SurfaceStore | null>(null)
  if (!storeRef.current) storeRef.current = createSurfaceStore()
  const store = storeRef.current

  // Keep store awareness in sync so List tabIndex/aria are correct.
  React.useEffect(() => {
    store.set('hasInput', inputActive)
  }, [inputActive, store])

  // On open, claim focus ownership for the first surface and focus input/list.
  React.useEffect(() => {
    if (!root.open) {
      setOwnerId(null)
      return
    }
    if (root.open && ownerId === null) {
      setOwnerId(surfaceId)
      ;(store.inputRef.current ?? store.listRef.current)?.focus()
    }
  }, [root.open, ownerId, surfaceId, setOwnerId, store.inputRef, store.listRef])

  // If we (this surface) already own focus, keep it on the right widget when content re-renders.
  React.useEffect(() => {
    if (!root.open || !isOwner) return
    const id = requestAnimationFrame(() => {
      ;(store.inputRef.current ?? store.listRef.current)?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [root.open, isOwner, store.inputRef, store.listRef])

  const [suppressHoverOpen, setSuppressHoverOpen] = React.useState(
    !!suppressHoverOpenOnMount,
  )
  const clearSuppression = React.useCallback(() => {
    if (suppressHoverOpen) setSuppressHoverOpen(false)
  }, [suppressHoverOpen])

  // Aim guard: protect against accidental row changes while the pointer is
  // heading into an open submenu. We keep both state and ref mirrors so
  // pointer handlers see up-to-date values synchronously.
  const [aimGuardActive, setAimGuardActive] = React.useState(false)
  const [guardedTriggerId, setGuardedTriggerId] = React.useState<string | null>(
    null,
  )

  const aimGuardActiveRef = React.useRef(false)
  const guardedTriggerIdRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    aimGuardActiveRef.current = aimGuardActive
  }, [aimGuardActive])
  React.useEffect(() => {
    guardedTriggerIdRef.current = guardedTriggerId
  }, [guardedTriggerId])

  const guardTimerRef = React.useRef<number | null>(null)
  const clearAimGuard = React.useCallback(() => {
    if (guardTimerRef.current) {
      window.clearTimeout(guardTimerRef.current)
      guardTimerRef.current = null
    }
    // Synchronous ref update so handlers see it immediately
    aimGuardActiveRef.current = false
    guardedTriggerIdRef.current = null
    setAimGuardActive(false)
    setGuardedTriggerId(null)
  }, [])

  const activateAimGuard = React.useCallback(
    (triggerId: string, timeoutMs = 450) => {
      // Synchronous ref update so next events see it immediately
      aimGuardActiveRef.current = true
      guardedTriggerIdRef.current = triggerId

      setGuardedTriggerId(triggerId)
      setAimGuardActive(true)
      if (guardTimerRef.current) window.clearTimeout(guardTimerRef.current)
      guardTimerRef.current = window.setTimeout(() => {
        aimGuardActiveRef.current = false
        guardedTriggerIdRef.current = null
        setAimGuardActive(false)
        setGuardedTriggerId(null)
        guardTimerRef.current = null
      }, timeoutMs) as any
    },
    [],
  )

  const isGuardBlocking = React.useCallback(
    (rowId: string) =>
      aimGuardActiveRef.current && guardedTriggerIdRef.current !== rowId,
    [],
  )

  const baseContentProps = React.useMemo(
    () =>
      ({
        ref: composedRef,
        role: 'menu',
        tabIndex: -1,
        'data-slot': 'action-menu-content',
        'data-root-menu': !isSubmenu ? 'true' : undefined,
        'data-state': root.open ? 'open' : 'closed',
        'data-action-menu-surface': true as const,
        'data-surface-id': surfaceId,
        className: mergedClassNames?.content,
        onMouseMove: (e: React.MouseEvent) => {
          // Any pointer movement inside the surface clears the “suppress hover open” flag
          // and declares this surface as the current focus owner.
          clearSuppression()
          const rect = surfaceRef.current?.getBoundingClientRect()
          if (!rect || !isInBounds(e.clientX, e.clientY, rect)) return
          setOwnerId(surfaceId)
        },
        ...props,
      }) as const,
    [composedRef, root.open, clearSuppression, surfaceId, setOwnerId, props],
  )

  const contentBind: ContentBindAPI = {
    getContentProps: (overrides) =>
      mergeProps(
        baseContentProps as any,
        mergeProps(slotProps.content as any, overrides as any),
      ),
  }

  const headerEl = slots.Header ? (
    <div
      data-slot="action-menu-header"
      {...(slotProps.header as any)}
      className={cn(
        'data-[slot=action-menu-header]:block',
        slotProps.header?.className,
      )}
    >
      {slots.Header({ menu })}
    </div>
  ) : null

  const inputEl = inputActive ? (
    <InputView<T>
      store={store}
      value={value}
      onChange={setValue}
      slot={slots.Input}
      slotProps={slotProps}
      classNames={mergedClassNames}
      inputPlaceholder={menu.inputPlaceholder}
    />
  ) : null

  const listEl = (
    <ListView<T>
      store={store}
      menu={menu}
      slots={slots}
      slotProps={slotProps}
      query={value}
      classNames={mergedClassNames}
      inputActive={inputActive}
      onTypeStart={(seed) => {
        // First typed key while input is hidden: show input, seed it, focus it.
        if (!inputActive && ownerId === surfaceId) {
          setInputActive(true)
          setValue(seed)
          requestAnimationFrame(() => {
            store.inputRef.current?.focus()
          })
        }
      }}
    />
  )

  const footerEl = slots.Footer ? (
    <div
      data-slot="action-menu-footer"
      {...(slotProps.footer as any)}
      className={cn(
        'data-[slot=action-menu-footer]:block',
        slotProps.footer?.className,
      )}
    >
      {slots.Footer({ menu })}
    </div>
  ) : null

  const childrenNoProvider = (
    <>
      {headerEl}
      {inputEl}
      {listEl}
      {footerEl}
    </>
  )

  const body = slots.Content({
    menu,
    children: childrenNoProvider,
    bind: contentBind,
  })

  const wrapped = !isElementWithProp(body, 'data-action-menu-surface') ? (
    <Primitive.div {...(contentBind.getContentProps() as any)}>
      <SurfaceCtx.Provider value={store}>{body}</SurfaceCtx.Provider>
    </Primitive.div>
  ) : (
    <SurfaceCtx.Provider value={store}>{body}</SurfaceCtx.Provider>
  )

  return (
    <KeyboardCtx.Provider value={{ dir, vimBindings }}>
      <SurfaceIdCtx.Provider value={surfaceId}>
        <HoverPolicyCtx.Provider
          value={{
            suppressHoverOpen,
            clearSuppression,
            aimGuardActive,
            guardedTriggerId,
            activateAimGuard,
            clearAimGuard,
            aimGuardActiveRef, // available for future debugging
            guardedTriggerIdRef, // available for future debugging
            isGuardBlocking,
          }}
        >
          {wrapped}
        </HoverPolicyCtx.Provider>
      </SurfaceIdCtx.Provider>
    </KeyboardCtx.Provider>
  )
}) as <T>(
  p: ActionMenuContentInternalProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => ReturnType<typeof Primitive.div>

/* Public export: generic-friendly but usable directly (any). */
export const Content = React.forwardRef<
  HTMLDivElement,
  ActionMenuContentProps<any>
>((p, ref) => <ContentBase {...p} ref={ref} />)
Content.displayName = 'ActionMenu.Content'

/* ================================================================================================
 * Submenu plumbing (provider and rows)
 * ============================================================================================== */

/**
 * Provider for a single submenu instance (trigger + positioned content).
 * Holds open state, refs, and identifiers shared by its children.
 */
function Sub({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLDivElement | HTMLButtonElement | null>(
    null,
  )
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const parentStore = useSurface()
  const parentSurfaceId = useSurfaceId() || 'root'
  const [triggerItemId, setTriggerItemId] = React.useState<string | null>(null)
  const childSurfaceId = React.useId()
  const pendingOpenModalityRef = React.useRef<'keyboard' | 'pointer' | null>(
    null,
  )
  const intentZoneActiveRef = React.useRef<boolean>(false)

  const value: SubContextValue = React.useMemo(
    () => ({
      open,
      onOpenChange: setOpen,
      onOpenToggle: () => setOpen((v) => !v),
      triggerRef,
      contentRef,
      parentSurfaceId,
      triggerItemId,
      setTriggerItemId,
      parentSetActiveId: parentStore.setActiveId,
      childSurfaceId,
      pendingOpenModalityRef,
      intentZoneActiveRef,
    }),
    [
      open,
      parentSurfaceId,
      triggerItemId,
      parentStore.setActiveId,
      childSurfaceId,
    ],
  )

  return (
    <SubCtx.Provider value={value}>
      <Popper.Root>{children}</Popper.Root>
    </SubCtx.Provider>
  )
}

/**
 * Renders a submenu trigger row and wires all hover/keyboard behavior,
 * including aim-guard to keep the submenu open while the pointer moves into it.
 */
function SubTriggerRow<T>({
  node,
  slot,
  classNames,
  search,
}: {
  /** The submenu node to render as a row. */
  node: SubmenuNode<T>
  /** Slot renderer for submenu triggers. */
  slot: NonNullable<MenuSlots<T>['SubmenuTrigger']>
  /** Optional class names for styling. */
  classNames?: Partial<SlotClassNames>
  /** Optional search context for deep results. */
  search?: SearchContext
}) {
  const store = useSurface()
  const sub = useSubCtx()!
  const { setOwnerId } = useFocusOwner()
  const {
    isGuardBlocking,
    guardedTriggerIdRef,
    aimGuardActiveRef,
    activateAimGuard,
    clearAimGuard,
  } = useHoverPolicy()
  const mouseTrailRef = useMouseTrail(4)
  const ref = React.useRef<HTMLElement | null>(null)
  const surfaceId = useSurfaceId()
  const { ownerId } = useFocusOwner()
  const rowId = makeRowId(node.id, search, surfaceId)

  // Register with surface as a 'submenu' kind, providing open/close callbacks.
  React.useEffect(() => {
    store.registerRow(rowId, {
      ref: ref as any,
      disabled: false,
      kind: 'submenu',
      openSub: () => sub.onOpenChange(true),
      closeSub: () => sub.onOpenChange(false),
    })
    return () => store.unregisterRow(rowId)
  }, [store, rowId])

  // Open on custom OPEN_SUB_EVENT from the parent surface (keyboard ArrowRight/Enter).
  React.useEffect(() => {
    const nodeEl = ref.current
    if (!nodeEl) return
    const onOpen = () => {
      sub.pendingOpenModalityRef.current = 'keyboard'
      sub.onOpenChange(true)
      setOwnerId(sub.childSurfaceId)
      // Move focus down into the child surface’s first focusable (input or list).
      const tryFocus = (attempt = 0) => {
        const content = sub.contentRef.current as HTMLElement | null
        if (content) {
          const { input, list } = findWidgetsWithinSurface(content)
          ;(input ?? list)?.focus()
          return
        }
        if (attempt < 5) requestAnimationFrame(() => tryFocus(attempt + 1))
      }
      requestAnimationFrame(() => tryFocus())
    }
    nodeEl.addEventListener(OPEN_SUB_EVENT, onOpen as EventListener)
    return () =>
      nodeEl.removeEventListener(OPEN_SUB_EVENT, onOpen as EventListener)
  }, [sub, setOwnerId])

  // Track which parent row opened the submenu so we can return focus on close.
  React.useEffect(() => {
    if (sub.triggerItemId !== rowId) sub.setTriggerItemId(rowId)
    return () => {
      if (sub.triggerItemId === rowId) sub.setTriggerItemId(null)
    }
  }, [rowId])

  const activeId = useSurfaceSel(store, (s) => s.activeId)
  const focused = activeId === rowId
  const menuFocused = sub.childSurfaceId === ownerId

  const baseRowProps = React.useMemo(
    () =>
      ({
        id: rowId,
        ref: composeRefs(ref as any, sub.triggerRef as any),
        role: 'option' as const,
        tabIndex: -1,
        'data-action-menu-item-id': rowId,
        'data-focused': focused,
        'data-menu-state': sub.open ? 'open' : 'closed',
        'data-menu-focused': menuFocused,
        'aria-selected': focused,
        'aria-disabled': false,
        'data-subtrigger': 'true',
        className: classNames?.subtrigger,
        onPointerDown: (e: React.PointerEvent) => {
          if (e.button === 0 && e.ctrlKey === false) {
            e.preventDefault()
            sub.pendingOpenModalityRef.current = 'pointer'
            sub.onOpenToggle()
          }
        },

        onPointerEnter: () => {
          if (
            aimGuardActiveRef.current &&
            guardedTriggerIdRef.current !== rowId
          )
            return
          if (!focused) store.setActiveId(rowId, 'pointer')
          clearAimGuard()
          if (!sub.open) sub.onOpenChange(true)
        },

        onPointerMove: () => {
          if (
            aimGuardActiveRef.current &&
            guardedTriggerIdRef.current !== rowId
          )
            return
          if (!focused) store.setActiveId(rowId, 'pointer')
          if (!sub.open) sub.onOpenChange(true)
        },

        onPointerLeave: (e: React.PointerEvent) => {
          if (
            aimGuardActiveRef.current &&
            guardedTriggerIdRef.current !== rowId
          )
            return

          const contentRect = sub.contentRef.current?.getBoundingClientRect()
          if (!contentRect) {
            clearAimGuard()
            return
          }

          const tRect =
            (
              sub.triggerRef.current as HTMLElement | null
            )?.getBoundingClientRect() ?? null
          const anchor = resolveAnchorSide(contentRect, tRect, e.clientX)

          // Build a smoothed heading; if degenerate, it will fallback automatically.
          const heading = getSmoothedHeading(
            mouseTrailRef.current,
            e.clientX,
            e.clientY,
            anchor,
            tRect,
            contentRect,
          )

          const hit = willHitSubmenu(
            e.clientX,
            e.clientY,
            heading,
            contentRect,
            anchor,
            tRect,
          )

          if (hit) {
            // Activate protection for this trigger; don’t let sibling rows steal hover.
            activateAimGuard(rowId, 600)
            store.setActiveId(rowId, 'pointer')
            sub.onOpenChange(true)
          } else {
            clearAimGuard()
          }
        },
      }) as const,
    [
      rowId,
      focused,
      menuFocused,
      classNames?.subtrigger,
      store,
      sub,
      activateAimGuard,
      clearAimGuard,
      isGuardBlocking,
    ],
  )

  const bind: RowBindAPI = {
    focused,
    disabled: false,
    getRowProps: (overrides) =>
      mergeProps(baseRowProps as any, overrides as any),
  }

  const visual = slot({ node, bind, search })

  // Auto-wrap with Popper.Anchor so submenu positions relative to this row.
  const content = isElementWithProp(visual, 'data-action-menu-item-id') ? (
    visual
  ) : (
    <div {...(baseRowProps as any)}>
      {visual ?? (node.render ? node.render() : (node.label ?? node.title))}
    </div>
  )

  return <Popper.Anchor asChild>{content as any}</Popper.Anchor>
}

/** Renders and positions the content for a submenu using the parent’s slots. */
function SubmenuContent<T>({
  menu,
  slots,
  classNames,
}: {
  /** Menu data for the child surface. */
  menu: MenuData<T>
  /** Slot renderers inherited/merged from above. */
  slots: Required<MenuSlots<T>>
  /** Optional class names for styling. */
  classNames?: Partial<SlotClassNames>
}) {
  const sub = useSubCtx()!
  const suppressHover = sub.pendingOpenModalityRef.current === 'keyboard'

  // Reset the pending open modality after it has been consumed.
  React.useEffect(() => {
    sub.pendingOpenModalityRef.current = null
  }, [sub])

  // Compose our content ref into the surface container to let Positioner focus it.
  const content = (
    <ContentBase<T>
      menu={menu}
      slots={slots as any}
      classNames={classNames}
      surfaceIdProp={sub.childSurfaceId}
      suppressHoverOpenOnMount={suppressHover}
    />
  )

  return <Positioner side="right">{content as any}</Positioner>
}

/* =========================================================================== */
/* =============================== Rendering ================================= */
/* =========================================================================== */

/**
 * Derive a DOM row id for deep search results.
 * For now we keep the base id to avoid breaking references; hook available for future.
 */
function makeRowId(
  baseId: string,
  search: SearchContext | undefined,
  surfaceId: string | null,
) {
  if (!search || !search.isDeep || !surfaceId) return baseId
  return baseId
  // Potential future options:
  // return `${surfaceId}-${baseId}`
  // return `${search.breadcrumbIds.join('::')}::${baseId}`
}

/** Render the default tree view for an unfiltered surface. */
function renderMenu<T>(
  menu: MenuData<T>,
  slots: Required<MenuSlots<T>>,
  classNames: Partial<SlotClassNames> | undefined,
  store: SurfaceStore,
) {
  return (
    <React.Fragment>
      {(menu.nodes ?? []).map((node) => {
        if (node.hidden) return null
        if (node.kind === 'item')
          return (
            <ItemRow
              key={node.id}
              node={node}
              slot={slots.Item}
              classNames={classNames}
              store={store}
            />
          )
        if (node.kind === 'group') {
          return (
            <div
              key={node.id}
              role="group"
              data-action-menu-group
              className={classNames?.group}
            >
              {node.heading ? (
                <div
                  data-action-menu-group-heading
                  role="presentation"
                  className={classNames?.groupHeading}
                >
                  {node.heading}
                </div>
              ) : null}
              {node.nodes.map((child) => {
                if (child.hidden) return null
                if (child.kind === 'item') {
                  return (
                    <ItemRow
                      key={child.id}
                      node={child as ItemNode<T>}
                      slot={slots.Item}
                      classNames={classNames}
                      store={store}
                    />
                  )
                }
                // submenu inside a group
                return (
                  <Sub key={child.id}>
                    <SubTriggerRow
                      node={child as SubmenuNode<any>}
                      slot={slots.SubmenuTrigger as any}
                      classNames={classNames}
                    />
                    <SubmenuContent
                      menu={{
                        ...child,
                      }}
                      slots={slots as any}
                      classNames={classNames}
                    />
                  </Sub>
                )
              })}
            </div>
          )
        }
        if (node.kind === 'submenu') {
          const childMenu: MenuData<any> = {
            ...node,
          }
          return (
            <Sub key={node.id}>
              <SubTriggerRow
                node={node as SubmenuNode<any>}
                slot={slots.SubmenuTrigger as any}
                classNames={classNames}
              />
              <SubmenuContent
                menu={childMenu}
                slots={slots as any}
                classNames={classNames}
              />
            </Sub>
          )
        }
        return null
      })}
    </React.Fragment>
  )
}

/**
 * Render an item row and wire up hover/keyboard/selection behavior.
 * If the custom `Item` slot calls `bind.getRowProps()`, we respect its element;
 * otherwise we auto-wrap with a wired <div>.
 */
function ItemRow<T>({
  node,
  slot,
  classNames,
  store,
  search,
}: {
  /** Concrete item node to render. */
  node: ItemNode<T>
  /** Slot renderer for items. */
  slot: NonNullable<MenuSlots<T>['Item']>
  /** Optional class names for styling. */
  classNames?: Partial<SlotClassNames>
  /** Surface store to register with. */
  store: SurfaceStore
  /** Optional search context (for deep matches). */
  search?: SearchContext
}) {
  const ref = React.useRef<HTMLElement | null>(null)
  const surfaceId = useSurfaceId()
  const rowId = makeRowId(node.id, search, surfaceId)

  // Listen for synthetic SELECT_ITEM_EVENT (dispatched by keyboard Enter).
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const onSelectFromKey: EventListener = () => {
      node.onSelect?.()
    }
    el.addEventListener(SELECT_ITEM_EVENT, onSelectFromKey)
    return () => el.removeEventListener(SELECT_ITEM_EVENT, onSelectFromKey)
  }, [node.onSelect])

  // Register/unregister with the surface store for roving focus.
  React.useEffect(() => {
    store.registerRow(rowId, {
      ref: ref as any,
      disabled: false,
      kind: 'item',
    })
    return () => store.unregisterRow(rowId)
  }, [store, rowId])

  const activeId = useSurfaceSel(store, (s) => s.activeId)
  const focused = activeId === rowId
  const { aimGuardActive, aimGuardActiveRef } = useHoverPolicy()

  const baseRowProps = React.useMemo(
    () =>
      ({
        id: rowId,
        ref: ref as any,
        role: 'option' as const,
        tabIndex: -1,
        'data-action-menu-item-id': rowId,
        'data-focused': focused,
        'aria-selected': focused,
        'aria-disabled': false,
        className: classNames?.item,
        onPointerDown: (e: React.PointerEvent) => {
          // Keep click semantics predictable by preventing focus steal on mousedown.
          if (e.button === 0 && e.ctrlKey === false) e.preventDefault()
        },
        onMouseMove: () => {
          if (aimGuardActiveRef.current) return
          if (!focused) store.setActiveId(rowId, 'pointer')
        },
        onClick: (e: React.MouseEvent) => {
          e.preventDefault()
          node.onSelect?.()
        },
      }) as const,
    [rowId, node.onSelect, aimGuardActive, focused, store, classNames?.item],
  )

  const bind: RowBindAPI = {
    focused,
    disabled: false,
    getRowProps: (overrides) =>
      mergeProps(baseRowProps as any, overrides as any),
  }

  const visual = slot({ node, bind, search })

  // If they *did* call bind.getRowProps(), their returned element will carry
  // data-action-menu-item-id. Otherwise, auto-wrap with our wired <div>.
  if (isElementWithProp(visual, 'data-action-menu-item-id')) {
    return visual as React.ReactElement
  }

  const fallbackVisual =
    visual ??
    (node.render ? node.render() : <span>{node.label ?? String(node.id)}</span>)

  return <div {...(baseRowProps as any)}>{fallbackVisual}</div>
}

/* =========================================================================== */
/* ======================= Input & List view components ======================= */
/* =========================================================================== */

/** Controlled/connected Input slot wrapper that wires ARIA and key handling. */
function InputView<T>({
  store,
  value,
  onChange,
  slot,
  slotProps,
  inputPlaceholder,
  classNames,
}: {
  /** Surface store for refs and active row id. */
  store: SurfaceStore
  /** Current input value. */
  value: string
  /** Change handler for input value. */
  onChange: (v: string) => void
  /** Slot renderer for Input. */
  slot: NonNullable<MenuSlots<T>['Input']>
  /** Additional props to forward to the input element. */
  slotProps: Partial<MenuSlotProps>
  /** Placeholder text for the input. */
  inputPlaceholder?: string
  /** Optional class names for styling. */
  classNames?: Partial<SlotClassNames>
}) {
  const activeId = useSurfaceSel(store, (s) => s.activeId ?? undefined)
  const listId = useSurfaceSel(store, (s) => s.listId ?? undefined)
  const onKeyDown = useNavKeydown('input')

  const baseInputProps = {
    ref: store.inputRef as any,
    role: 'combobox',
    'data-slot': 'action-menu-input',
    'data-action-menu-input': true,
    'aria-autocomplete': 'list',
    'aria-expanded': true,
    'aria-controls': listId,
    'aria-activedescendant': activeId,
    className: classNames?.input,
    placeholder: inputPlaceholder ?? 'Filter...',
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange(e.target.value),
    onKeyDown,
  }

  const bind: InputBindAPI = {
    getInputProps: (overrides) =>
      mergeProps(
        baseInputProps as any,
        mergeProps(slotProps?.input as any, overrides as any),
      ),
  }

  const el = slot({ value, onChange, bind })
  if (!isElementWithProp(el, 'data-action-menu-input')) {
    return <input {...(bind.getInputProps(slotProps?.input as any) as any)} />
  }
  return el as React.ReactElement
}

/**
 * List view that renders either:
 * - the unfiltered tree (groups/items/submenus), or
 * - flattened search results (submenus first, then items) with breadcrumb context.
 * Also owns the list’s roving-focus keyboard handling when there is no input.
 */
function ListView<T>({
  store,
  menu,
  slots,
  slotProps,
  classNames,
  query,
  inputActive,
  onTypeStart,
}: {
  /** Surface store for ref wiring and focus ownership. */
  store: SurfaceStore
  /** Menu data for this surface. */
  menu: MenuData<T>
  /** Slot renderers (merged). */
  slots: Required<MenuSlots<T>>
  /** Optional extra props to forward to the list element. */
  slotProps?: Partial<MenuSlotProps>
  /** Optional class names for styling. */
  classNames?: Partial<SlotClassNames>
  /** Current search query string. */
  query?: string
  /** True when an input is visible and owns focus. */
  inputActive: boolean
  /** Called with the first typed character when input is hidden to seed it. */
  onTypeStart: (seed: string) => void
}) {
  const localId = React.useId()
  const listId = useSurfaceSel(store, (s) => s.listId)
  const hasInput = useSurfaceSel(store, (s) => s.hasInput)
  const activeId = useSurfaceSel(store, (s) => s.activeId ?? undefined)
  const navKeydown = useNavKeydown('list')
  const { ownerId } = useFocusOwner()
  const surfaceId = useSurfaceId() ?? 'root'

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      // Only run when the menu is the focus owner.
      if (ownerId !== surfaceId) return

      // While the input is hidden, start search on first printable key or Backspace.
      if (!inputActive && !e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === 'Backspace') {
          e.preventDefault()
          onTypeStart('')
          return
        }
        if (e.key.length === 1) {
          e.preventDefault()
          onTypeStart(e.key)
          return
        }
      }
      navKeydown(e)
    },
    [surfaceId, ownerId, inputActive, onTypeStart, navKeydown],
  )

  // Allocate a stable list id and sync to the store so input `aria-controls` matches.
  React.useEffect(() => {
    const id = listId ?? `action-menu-list-${localId}`
    store.set('listId', id)
    return () => store.set('listId', null)
  }, [localId])

  const effectiveListId =
    store.snapshot().listId ?? `action-menu-list-${localId}`

  const baseListProps = {
    ref: store.listRef as any,
    role: 'listbox' as const,
    id: effectiveListId,
    tabIndex: hasInput ? -1 : 0,
    'data-slot': 'action-menu-list' as const,
    'data-action-menu-list': true as const,
    'aria-activedescendant': hasInput ? undefined : activeId,
    className: classNames?.list,
    onKeyDown,
  }
  const bind: ListBindAPI = {
    getListProps: (overrides) =>
      mergeProps(
        baseListProps as any,
        mergeProps(slotProps?.list as any, overrides as any),
      ),
    getItemOrder: () => store.getOrder(),
    getActiveId: () => store.snapshot().activeId,
  }

  // Basic matching helpers used by search result collection.
  const norm = (s: string) => s.toLowerCase()
  const matchesSearchable = (
    node: Partial<Searchable & { title?: string }>,
    q: string,
  ) => {
    const t = norm(q.trim())
    if (!t) return true
    if ((node.label ?? node.title ?? '').toLowerCase().includes(t)) return true
    if ((node.keywords ?? []).some((k) => norm(k ?? '').includes(t)))
      return true
    return false
  }

  type SRItem = {
    /** Result row represents an item. */
    type: 'item'
    /** The item node to render (id may be prefixed for deep results). */
    node: ItemNode<T>
    /** Visible breadcrumb titles. */
    breadcrumbs: string[]
    /** Parallel breadcrumb ids. */
    breadcrumbIds: string[]
    /** Score used for sorting results (higher is better). */
    score: number
  }
  type SRSub = {
    /** Result row represents a submenu trigger. */
    type: 'submenu'
    /** The submenu node to render. */
    node: SubmenuNode<any>
    /** Visible breadcrumb titles. */
    breadcrumbs: string[]
    /** Parallel breadcrumb ids. */
    breadcrumbIds: string[]
    /** Score used for sorting results (higher is better). */
    score: number
  }
  type SR = SRItem | SRSub

  /**
   * Recursively collect matching items/submenus for the given query.
   * - Submenus are included when the submenu node itself matches
   * - Children of submenus are traversed and carry breadcrumbs
   */
  const collect = React.useCallback(
    (
      nodes: MenuNode<T>[] | undefined,
      q: string,
      bc: string[] = [],
      bcIds: string[] = [],
    ): SR[] => {
      const out: SR[] = []
      for (const n of nodes ?? []) {
        if ((n as any).hidden) continue
        if (n.kind === 'item') {
          const score = commandScore(n.id, q, n.keywords)
          if (score > 0)
            out.push({
              type: 'item',
              node: {
                ...n,
                id: bcIds.at(-1) ? `${bcIds.at(-1)}-${n.id}` : n.id,
              } as ItemNode<T>,
              breadcrumbs: bc,
              breadcrumbIds: bcIds,
              score,
            })
        } else if (n.kind === 'group') {
          out.push(...collect((n as GroupNode<T>).nodes, q, bc, bcIds))
        } else if (n.kind === 'submenu') {
          const sub = n as SubmenuNode<any>
          const score = commandScore(n.id, q, n.keywords)
          // If the submenu itself matches, include it as a result (without its own title in breadcrumbs)
          if (score > 0)
            out.push({
              type: 'submenu',
              node: sub,
              breadcrumbs: bc,
              breadcrumbIds: bcIds,
              score,
            })
          // Always traverse children to find deep matches; breadcrumbs include the submenu's title
          const title = sub.title ?? sub.label ?? sub.id ?? ''
          out.push(
            ...collect(sub.nodes as any, q, [...bc, title], [...bcIds, sub.id]),
          )
        }
      }
      return out
    },
    [],
  )

  const q = (query ?? '').trim()
  const results = React.useMemo(
    () =>
      q
        ? pipe(
            collect(menu.nodes, q),
            sortBy([prop('score'), 'desc']),
            partition((v) => v.type === 'submenu'), // Show submenus first
            flat(),
          )
        : [],
    [q, menu.nodes],
  )
  const firstRowId = React.useMemo(
    () => results[0]?.node.id ?? null,
    [results[0]],
  )

  let children: React.ReactNode

  // When searching, auto-activate the first result so Enter commits it.
  React.useLayoutEffect(() => {
    if (!q) return
    if (!firstRowId) return

    const raf = requestAnimationFrame(() =>
      store.setActiveId(firstRowId, 'keyboard'),
    )
    return () => cancelAnimationFrame(raf)
  }, [q])

  // After (re)render, derive the DOM order of visible rows and sync to the store
  // so keyboard navigation follows visual order.
  React.useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      const listEl = store.listRef.current
      if (!listEl) return
      const ids = Array.from(
        listEl.querySelectorAll<HTMLElement>('[data-action-menu-item-id]'),
      ).map((el) => el.id)

      store.resetOrder(ids)
    })

    return () => cancelAnimationFrame(raf)
  }, [store, q])

  if (q.length === 0) {
    const hasAnyNodes = (menu.nodes ?? []).some((n) => !n.hidden)
    children = hasAnyNodes
      ? renderMenu<T>(menu, slots, classNames, store)
      : slots.Empty({ query: '' })
  } else {
    children =
      results.length === 0 ? (
        slots.Empty({ query: q })
      ) : (
        <>
          {results.map((res) => {
            const searchCtx: SearchContext = {
              query: q,
              isDeep: res.breadcrumbs.length > 0,
              breadcrumbs: res.breadcrumbs,
              breadcrumbIds: res.breadcrumbIds,
            }
            if (res.type === 'item') {
              return (
                <ItemRow
                  key={`deep-${res.node.id}`}
                  node={res.node}
                  slot={slots.Item}
                  store={store}
                  search={searchCtx}
                  classNames={classNames}
                />
              )
            }
            // Submenu result should behave like a real submenu.
            const childMenu: MenuData<any> = {
              ...res.node,
            }

            return (
              <Sub key={`deep-${res.node.id}`}>
                <SubTriggerRow
                  node={res.node}
                  slot={slots.SubmenuTrigger as any}
                  search={searchCtx}
                  classNames={classNames}
                />
                <SubmenuContent
                  menu={childMenu}
                  slots={slots as any}
                  classNames={classNames}
                />
              </Sub>
            )
          })}
        </>
      )
  }

  const el = slots.List({ children, bind })
  if (!isElementWithProp(el, 'data-action-menu-list')) {
    return (
      <div
        {...(bind.getListProps(
          mergeProps(slotProps?.list as any, {
            // Prevent non-item clicks in the list from blurring the menu input
            // e.g. clicking in the list component padding, if present.
            onPointerDown: (e: React.PointerEvent) => {
              e.preventDefault()
            },
          }),
        ) as any)}
      >
        {children}
      </div>
    )
  }
  return el as React.ReactElement
}

/* =========================================================================== */
/* ============================ createActionMenu<T> =========================== */
/* =========================================================================== */

/**
 * Factory that returns a *typed* ActionMenu for items with payload `T`.
 * You can also provide per-instance default renderers here.
 */
export function createActionMenu<T>(opts?: {
  /** Slot overrides that apply to every Content instance produced by this factory. */
  slots?: Partial<MenuSlots<T>>
  /** Extra props forwarded to slots by default. */
  slotProps?: Partial<MenuSlotProps>
  /** Default content-level options such as `vimBindings` and `dir`. */
  defaults?: {
    /** Defaults for the Content component. */
    content?: Pick<ActionMenuContentProps<T>, 'vimBindings' | 'dir'>
  }
  /** Default classNames per slot applied by this factory. */
  classNames?: Partial<SlotClassNames>
}) {
  const baseSlots = {
    ...defaultSlots<T>(),
    ...(opts?.slots as any),
  } as Required<MenuSlots<T>>
  const baseSlotProps = ((opts?.slotProps as any) ??
    {}) as Partial<MenuSlotProps>
  const baseDefaults = opts?.defaults?.content ?? {}
  const baseClassNames = opts?.classNames

  const ContentTyped = React.forwardRef<
    HTMLDivElement,
    ActionMenuContentProps<T>
  >(({ slots, slotProps, classNames, ...rest }, ref) => {
    const mergedSlots = React.useMemo<MenuSlots<T>>(
      () => ({ ...baseSlots, ...(slots as any) }),
      [slots],
    )
    const mergedSlotProps = React.useMemo<Partial<MenuSlotProps>>(
      () => ({ ...baseSlotProps, ...(slotProps ?? {}) }),
      [slotProps],
    )
    const mergedClassNames = React.useMemo<Partial<SlotClassNames>>(
      () => ({
        root: cn(baseClassNames?.root, classNames?.root),
        trigger: cn(baseClassNames?.trigger, classNames?.trigger),
        content: cn(baseClassNames?.content, classNames?.content),
        input: cn(baseClassNames?.input, classNames?.input),
        list: cn(baseClassNames?.list, classNames?.list),
        item: cn(baseClassNames?.item, classNames?.item),
        subtrigger: cn(baseClassNames?.subtrigger, classNames?.subtrigger),
        group: cn(baseClassNames?.group, classNames?.group),
        groupHeading: cn(
          baseClassNames?.groupHeading,
          classNames?.groupHeading,
        ),
      }),
      [classNames, baseClassNames],
    )
    // Apply defaults for content-level options if not provided.
    const vimBindings = rest.vimBindings ?? baseDefaults.vimBindings ?? true
    const dir = (rest.dir ?? baseDefaults.dir) as Direction | undefined

    return (
      <ContentBase<T>
        {...(rest as any)}
        vimBindings={vimBindings}
        dir={dir}
        slots={mergedSlots}
        slotProps={mergedSlotProps}
        classNames={mergedClassNames}
        ref={ref}
      />
    )
  })
  ContentTyped.displayName = 'ActionMenu.Content'

  return {
    Root,
    Trigger,
    Positioner,
    Content: ContentTyped,
  }
}
