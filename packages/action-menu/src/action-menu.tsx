/**
 * Action Menu (Refactored, single-file edition)
 *
 * Goals of this refactor:
 *  - Separate “Shell” concerns (mounting, portal, overlay, dismissal) from “Surface” concerns (search, roving focus, items/groups/submenus, keyboard nav).
 *  - Keep the same feature set (drawer + dropdown, nested submenus, aim guard, align-to-first-row, vim bindings).
 *  - Allow passing drawer-related classNames and slotProps **via createActionMenu** (new: `shell` defaults).
 *  - Collapse to a single file as requested, but keep clear sections and comments.
 *
 * Breaking API changes (summarized):
 *  - `ActionMenu.Root` → `ActionMenu` (entry component).
 *  - `ActionMenu.Content` → `ActionMenu.Surface` (the actual menu “surface”, formerly ContentBase).
 *  - `classNames` & `slotProps` split:
 *      - Shell-level (overlay/drawer): `shellClassNames`, `shellSlotProps`
 *      - Surface-level (content/list/item/etc.): `surfaceClassNames`, `surfaceSlotProps`
 *  - `ActionMenu.Positioner` is **dropdown-only for the root surface**. In drawer mode it’s a pass-through for the root surface.
 *    Submenus **always** use Popper (even in drawer mode) for correct in-drawer positioning.
 *  - `createActionMenu` accepts new structured defaults:
 *      createActionMenu<T>({
 *        slots,
 *        surfaceSlotProps,
 *        surfaceClassNames,
 *        defaults: { content: { vimBindings, dir } },
 *        shell: { classNames, slotProps }
 *      })
 */

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
import { Drawer } from 'vaul'
import { cn } from './cn.js'
import { commandScore } from './command-score.js'
import { useMediaQuery } from './use-media-query.js'

/* ================================================================================================
 * Debug helpers
 * ============================================================================================== */

const DEBUG_MODE = false
const DBG = (...args: any[]) => {
  if (DEBUG_MODE) console.log('[AM]', ...args)
}

/* ================================================================================================
 * Types — Menu model (generic)
 * ============================================================================================== */

/** Allowed kinds of nodes that appear in a menu tree. */
export type MenuNodeKind = 'item' | 'group' | 'submenu'

/** Base shape for any node in the menu tree. */
export type BaseNode<K extends MenuNodeKind> = {
  id: string
  kind: K
  hidden?: boolean
}

/** Properties that participate in text search. */
export type Searchable = {
  label?: string
  keywords?: string[]
}

/** Properties describing how a node should render. */
export type Renderable = {
  render?: () => React.ReactNode
}

/** Values accepted where an icon is expected. */
export type Iconish =
  | React.ReactNode
  | React.ReactElement
  | React.ElementType
  | React.ComponentType<{ className?: string }>

/** Item row with per-instance data payload `T`. */
export type ItemNode<T = unknown> = BaseNode<'item'> &
  Searchable &
  Renderable & {
    icon?: Iconish
    data?: T
    onSelect?: ({ node }: { node: Omit<ItemNode<T>, 'onSelect'> }) => void
  }

/** A group on the current surface; children share the same item payload `T`. */
export type GroupNode<T = unknown> = BaseNode<'group'> & {
  heading?: string
  nodes: (ItemNode<T> | SubmenuNode<any>)[]
}

/** Submenu whose children can have a *different* payload shape `TChild`. */
export type SubmenuNode<T = unknown, TChild = unknown> = BaseNode<'submenu'> &
  Searchable &
  Renderable & {
    data?: T
    icon?: Iconish
    title?: string
    inputPlaceholder?: string
    hideSearchUntilActive?: boolean
    defaults?: MenuNodeDefaults<T>
    nodes: MenuNode<TChild>[]
    ui?: {
      slots?: Partial<MenuSlots<TChild>>
      slotProps?: Partial<SurfaceSlotProps>
      classNames?: Partial<SurfaceClassNames>
    }
  }

/** A menu surface carrying items with payload `T`. */
export type MenuData<T = unknown> = {
  id: string
  title?: string
  inputPlaceholder?: string
  hideSearchUntilActive?: boolean
  nodes?: MenuNode<T>[]
  defaults?: MenuNodeDefaults<T>
  ui?: {
    slots?: Partial<MenuSlots<T>>
    slotProps?: Partial<SurfaceSlotProps>
    classNames?: Partial<SurfaceClassNames>
  }
}

/** Nodes that can appear on a surface with payload `T`. */
export type MenuNode<T = unknown> =
  | ItemNode<T>
  | GroupNode<T>
  | SubmenuNode<T, any>

/** Additional context passed to item/submenu renderers during search. */
export type SearchContext = {
  query: string
  isDeep: boolean
  breadcrumbs: string[]
  breadcrumbIds: string[]
}

/** Defaulted parts of nodes for convenience. */
export type MenuNodeDefaults<T = unknown> = {
  item?: Pick<ItemNode<T>, 'onSelect'>
}

/* ================================================================================================
 * Types — Renderer & bind APIs
 * ============================================================================================== */

type DivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>
type ButtonProps = React.ComponentPropsWithoutRef<typeof Primitive.button>
type Children = Pick<DivProps, 'children'>

/** Row interaction & wiring helpers provided to slot renderers. */
export type RowBindAPI = {
  focused: boolean
  disabled: boolean
  getRowProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    ref: React.Ref<any>
    id: string
    role: 'option'
    tabIndex: -1
    'data-action-menu-item-id': string
    'data-focused'?: 'true'
    'aria-selected'?: boolean
    'aria-disabled'?: boolean
  }
}

/** Content/surface wiring helpers provided to slot renderers. */
export type ContentBindAPI = {
  getContentProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    ref: React.Ref<any>
    role: 'menu'
    tabIndex: -1
    'data-slot': 'action-menu-content'
    'data-state': 'open' | 'closed'
    'data-action-menu-surface': true
    'data-surface-id': string
  }
}

/** Search input wiring helpers provided to slot renderers. */
export type InputBindAPI = {
  getInputProps: <T extends React.InputHTMLAttributes<HTMLInputElement>>(
    overrides?: T,
  ) => T & {
    ref: React.Ref<any>
    role: 'combobox'
    'data-slot': 'action-menu-input'
    'data-action-menu-input': true
    'aria-autocomplete': 'list'
    'aria-expanded': true
    'aria-controls'?: string
    'aria-activedescendant'?: string
  }
}

/** List wiring helpers provided to slot renderers. */
export type ListBindAPI = {
  getListProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    ref: React.Ref<any>
    role: 'listbox'
    id: string
    tabIndex: number
    'data-slot': 'action-menu-list'
    'data-action-menu-list': true
    'aria-activedescendant'?: string
  }
  getItemOrder: () => string[]
  getActiveId: () => string | null
}

/* ================================================================================================
 * Types — ClassNames & SlotProps (SPLIT into Shell vs Surface)
 * ============================================================================================== */

/** ClassNames that style the *shell* (overlay / drawer container / trigger). */
export type ShellClassNames = {
  root?: string
  overlay?: string
  drawerContent?: string
  trigger?: string
}

/** ClassNames that style the *surface* (content/list/items/etc.). */
export type SurfaceClassNames = {
  root?: string // (reserved) if you wrap the entire surface
  content?: string
  input?: string
  list?: string
  item?: string
  subtrigger?: string
  group?: string
  groupHeading?: string
}

/** Slot props forwarded to the *shell* (Vaul). */
export type ShellSlotProps = {
  drawerRoot?: Partial<React.ComponentProps<typeof Drawer.Root>>
  drawerOverlay?: React.ComponentPropsWithoutRef<typeof Drawer.Overlay>
  drawerContent?: React.ComponentPropsWithoutRef<typeof Drawer.Content>
}

/** Slot props forwarded to *surface* slots (Input/List/Content/Header/Footer). */
export type SurfaceSlotProps = {
  content?: React.HTMLAttributes<HTMLElement>
  header?: React.HTMLAttributes<HTMLElement>
  input?: React.InputHTMLAttributes<HTMLInputElement>
  list?: React.HTMLAttributes<HTMLElement>
  footer?: React.HTMLAttributes<HTMLElement>
}

/** Slot renderers to customize visuals. */
export type MenuSlots<T = unknown> = {
  Item: (args: {
    node: ItemNode<T>
    search?: SearchContext
    bind: RowBindAPI
  }) => React.ReactNode
  Content: (args: {
    menu: MenuData<T>
    children: React.ReactNode
    bind: ContentBindAPI
  }) => React.ReactNode
  Header?: (args: { menu: MenuData<T> }) => React.ReactNode
  Input: (args: {
    value: string
    onChange: (v: string) => void
    bind: InputBindAPI
  }) => React.ReactNode
  Empty?: (args: { query: string }) => React.ReactNode
  List: (args: {
    children: React.ReactNode
    bind: ListBindAPI
  }) => React.ReactNode
  Footer?: (args: { menu: MenuData<T> }) => React.ReactNode
  SubmenuTrigger: (args: {
    node: SubmenuNode<any>
    search?: SearchContext
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
        {node.icon ? <span aria-hidden>{renderIcon(node.icon)}</span> : null}
        {node.render ? (
          node.render()
        ) : (
          <span>{node.label ?? String(node.id)}</span>
        )}
      </div>
    ),
    SubmenuTrigger: ({ node, bind }) => (
      <div {...bind.getRowProps()}>
        {node.icon ? <span aria-hidden>{renderIcon(node.icon)}</span> : null}
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

/* ================================================================================================
 * Utils
 * ============================================================================================== */

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

/** Merge two sets of React props (className, handlers, refs are composed). */
function mergeProps<
  A extends Record<string, any>,
  B extends Record<string, any>,
>(base: A | undefined, overrides?: B): A & B {
  const a: any = base ?? {}
  const b: any = overrides ?? {}
  const merged: any = { ...a, ...b }
  if (a.className || b.className)
    merged.className = cn(a.className, b.className)
  for (const key of HANDLER_KEYS) {
    const aH = a[key]
    const bH = b[key]
    if (aH || bH) merged[key] = composeEventHandlers(aH, bH)
  }
  if (a.ref || b.ref) merged.ref = composeRefs(a.ref, b.ref)
  return merged
}

/** True when the ReactNode is an element that carries `propName`. */
function isElementWithProp(node: React.ReactNode, propName: string) {
  return React.isValidElement(node) && propName in (node.props as any)
}

/** Render an icon from heterogeneous inputs (node, element, component). */
export function renderIcon(icon?: Iconish, className?: string) {
  if (!icon) return null
  if (typeof icon === 'string') return icon
  if (React.isValidElement(icon)) {
    const prev = (icon.props as any)?.className
    return React.cloneElement(icon as any, { className: cn(prev, className) })
  }
  const Comp = icon as React.ElementType
  return <Comp className={className} />
}

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

/* ================================================================================================
 * Keyboard helpers & options
 * ============================================================================================== */

export type Direction = 'ltr' | 'rtl'

export const SELECTION_KEYS = ['Enter'] as const
export const FIRST_KEYS = ['ArrowDown', 'PageUp', 'Home'] as const
export const LAST_KEYS = ['ArrowUp', 'PageDown', 'End'] as const

export const SUB_OPEN_KEYS: Record<Direction, readonly string[]> = {
  ltr: [...SELECTION_KEYS, 'ArrowRight'],
  rtl: [...SELECTION_KEYS, 'ArrowLeft'],
}
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
export const isVimNext = (e: React.KeyboardEvent) =>
  e.ctrlKey && (e.key === 'n' || e.key === 'j')
export const isVimPrev = (e: React.KeyboardEvent) =>
  e.ctrlKey && (e.key === 'p' || e.key === 'k')

export const getDir = (explicit?: Direction): Direction => {
  if (explicit) return explicit
  if (typeof document !== 'undefined') {
    const d = document?.dir?.toLowerCase()
    if (d === 'rtl' || d === 'ltr') return d as Direction
  }
  return 'ltr'
}

/** Keyboard options context */
type KeyboardOptions = { dir: Direction; vimBindings: boolean }
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

function dispatch(node: HTMLElement | null | undefined, type: string) {
  if (!node) return
  node.dispatchEvent(new CustomEvent(type, { bubbles: true }))
}

function openSubmenuForActive(activeId: string | null) {
  const el = activeId ? document.getElementById(activeId) : null
  if (el && (el as HTMLElement).dataset.subtrigger === 'true') {
    dispatch(el, OPEN_SUB_EVENT)
  }
}

/* ================================================================================================
 * Root / Shell context & Focus context
 * ============================================================================================== */

export type ResponsiveMode = 'auto' | 'drawer' | 'dropdown'
export type ResponsiveConfig = { mode: ResponsiveMode; query: string }

type ActionMenuRootContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
  modal: boolean
  anchorRef: React.RefObject<HTMLElement | null>
  debug: boolean
  responsive: ResponsiveConfig
  shellClassNames?: Partial<ShellClassNames>
  shellSlotProps?: Partial<ShellSlotProps>
}
const RootCtx = React.createContext<ActionMenuRootContextValue | null>(null)
const useRootCtx = () => {
  const ctx = React.useContext(RootCtx)
  if (!ctx) throw new Error('useActionMenu must be used within an ActionMenu')
  return ctx
}

/** Provides a stable id string for the current surface. */
const SurfaceIdCtx = React.createContext<string | null>(null)
const useSurfaceId = () => React.useContext(SurfaceIdCtx)

type MenuDisplayMode = Omit<ResponsiveMode, 'auto'>
const DisplayModeCtx = React.createContext<MenuDisplayMode>('dropdown')
const useDisplayMode = () => React.useContext(DisplayModeCtx)

/** Submenu context (open state/refs/ids). */
type SubContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
  triggerRef: React.RefObject<HTMLDivElement | HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  parentSurfaceId: string
  triggerItemId: string | null
  setTriggerItemId: (id: string | null) => void
  parentSetActiveId: (id: string | null, cause?: ActivationCause) => void
  childSurfaceId: string
  pendingOpenModalityRef: React.RefObject<'keyboard' | 'pointer' | null>
  intentZoneActiveRef: React.RefObject<boolean>
}
const SubCtx = React.createContext<SubContextValue | null>(null)
const useSubCtx = () => React.useContext(SubCtx)

/** Focus owner context (which surface owns real DOM focus). */
type FocusOwnerCtxValue = {
  ownerId: string | null
  setOwnerId: (id: string | null) => void
}
const FocusOwnerCtx = React.createContext<FocusOwnerCtxValue | null>(null)
const useFocusOwner = () => {
  const ctx = React.useContext(FocusOwnerCtx)
  if (!ctx) throw new Error('FocusOwnerCtx missing')
  return ctx
}

/* ================================================================================================
 * Surface store (per Content/Surface) — roving focus & registration
 * ============================================================================================== */

type SurfaceState = {
  activeId: string | null
  hasInput: boolean
  listId: string | null
}

type RowRecord = {
  ref: React.RefObject<HTMLElement>
  disabled?: boolean
  kind: 'item' | 'submenu'
  openSub?: () => void
  closeSub?: () => void
}

type ActivationCause = 'keyboard' | 'pointer' | 'programmatic'

type SurfaceStore = {
  subscribe(cb: () => void): () => void
  snapshot(): SurfaceState
  set<K extends keyof SurfaceState>(k: K, v: SurfaceState[K]): void

  registerRow(id: string, rec: RowRecord): void
  unregisterRow(id: string): void
  getOrder(): string[]
  resetOrder(ids: string[]): void

  setActiveId(id: string | null, cause?: ActivationCause): void
  setActiveByIndex(idx: number, cause?: ActivationCause): void
  first(cause?: ActivationCause): void
  last(cause?: ActivationCause): void
  next(cause?: ActivationCause): void
  prev(cause?: ActivationCause): void

  readonly rows: Map<string, RowRecord>
  readonly inputRef: React.RefObject<HTMLInputElement | null>
  readonly listRef: React.RefObject<HTMLDivElement | null>
}

function createSurfaceStore(): SurfaceStore {
  const state: SurfaceState = { activeId: null, hasInput: true, listId: null }
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
    // Close any open submenu that is not the active trigger
    for (const [rid, rec] of rows) {
      if (rec.kind === 'submenu' && rec.closeSub && rid !== id) {
        try {
          rec.closeSub()
        } catch {}
      }
    }
    emit()
    // Scroll active row into view when keyboard navigating
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
    const i = state.activeId ? order.indexOf(state.activeId) : -1
    const n = i === -1 ? 0 : (i + 1) % order.length
    setActiveId(order[n]!, cause)
  }
  const prev = (cause: ActivationCause = 'keyboard') => {
    if (!order.length) return setActiveId(null, cause)
    const i = state.activeId ? order.indexOf(state.activeId) : 0
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

function useSurfaceSel<T>(store: SurfaceStore, sel: (s: SurfaceState) => T): T {
  const get = React.useCallback(() => sel(store.snapshot()), [store, sel])
  return React.useSyncExternalStore(store.subscribe, get, get)
}

/* ================================================================================================
 * Hover policy / Aim guard (to reduce accidental submenu closures)
 * ============================================================================================== */

type HoverPolicy = {
  suppressHoverOpen: boolean
  clearSuppression: () => void
  aimGuardActive: boolean
  guardedTriggerId: string | null
  activateAimGuard: (triggerId: string, timeoutMs?: number) => void
  clearAimGuard: () => void
  aimGuardActiveRef: React.RefObject<boolean | null>
  guardedTriggerIdRef: React.RefObject<string | null>
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

/** Keep the last N mouse positions without causing re-renders. */
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
function resolveAnchorSide(
  rect: DOMRect,
  tRect: DOMRect | null,
  mx: number,
): AnchorSide {
  if (tRect) {
    const tx = (tRect.left + tRect.right) / 2
    const dL = Math.abs(tx - rect.left)
    const dR = Math.abs(tx - rect.right)
    return dL <= dR ? 'left' : 'right'
  }
  return mx < rect.left ? 'left' : 'right'
}

function getSmoothedHeading(
  trail: [number, number][],
  exitX: number,
  exitY: number,
  anchor: AnchorSide,
  tRect: DOMRect | null,
  rect: DOMRect,
): { dx: number; dy: number } {
  let dx = 0
  let dy = 0
  const n = Math.min(Math.max(trail.length - 1, 0), 4)
  for (let i = trail.length - n - 1; i < trail.length - 1; i++) {
    if (i < 0) continue
    const [x1, y1] = trail[i]!
    const [x2, y2] = trail[i + 1]!
    dx += x2 - x1
    dy += y2 - y1
  }
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

function willHitSubmenu(
  exitX: number,
  exitY: number,
  heading: { dx: number; dy: number },
  rect: DOMRect,
  anchor: AnchorSide,
  triggerRect: DOMRect | null,
): boolean {
  const { dx, dy } = heading
  if (Math.abs(dx) < 0.01) return false
  if (anchor === 'left' && dx <= 0) return false
  if (anchor === 'right' && dx >= 0) return false
  const edgeX = anchor === 'left' ? rect.left : rect.right
  const t = (edgeX - exitX) / dx
  if (t <= 0) return false
  const yAtEdge = exitY + t * dy
  const baseBand = triggerRect ? triggerRect.height * 0.75 : 28
  const extra = Math.max(12, Math.min(36, baseBand))
  const top = rect.top - extra * 0.25
  const bottom = rect.bottom + extra * 0.25
  return yAtEdge >= top && yAtEdge <= bottom
}

/** Visual-only debug polygon showing the aim-guard band. */
function IntentZone({
  parentRef,
  triggerRef,
  visible = false,
}: {
  parentRef: React.RefObject<HTMLElement | null>
  triggerRef: React.RefObject<HTMLElement | null>
  visible?: boolean
}) {
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
        pointerEvents: 'none',
        clipPath: clip,
        zIndex: Number.MAX_SAFE_INTEGER,
        background: visible ? 'rgba(0, 136, 255, 0.15)' : 'transparent',
        transform: 'translateZ(0)',
      }}
    />
  )
  return <Portal>{Polygon}</Portal>
}

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
 * Keyboard handling shared by Input/List
 * ============================================================================================== */

function useNavKeydown(source: 'input' | 'list') {
  const store = useSurface()
  const root = useRootCtx()
  const sub = useSubCtx()
  const surfaceId = useSurfaceId() || 'root'
  const { ownerId, setOwnerId } = useFocusOwner()
  const { dir, vimBindings } = useKeyboardOpts()

  return React.useCallback(
    (e: React.KeyboardEvent) => {
      if (ownerId !== surfaceId) return
      const k = e.key
      const stop = () => {
        e.preventDefault()
        e.stopPropagation()
      }
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

      if (isOpenKey(dir, k)) {
        stop()
        const activeId = store.snapshot().activeId
        if (isSelectionKey(k)) {
          const el = activeId ? document.getElementById(activeId) : null
          if (el && el.dataset.subtrigger === 'true') {
            openSubmenuForActive(activeId)
          } else {
            dispatch(el, SELECT_ITEM_EVENT)
          }
        } else {
          openSubmenuForActive(activeId)
        }
        return
      }

      if (isCloseKey(dir, k)) {
        if (sub) {
          stop()
          setOwnerId(sub.parentSurfaceId)
          sub.onOpenChange(false)
          sub.parentSetActiveId(sub.triggerItemId)
          const parentEl = document.querySelector<HTMLElement>(
            `[data-surface-id="${sub.parentSurfaceId}"]`,
          )
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

/* ================================================================================================
 * Positioner (Dropdown-only for root; always dropdown for submenus)
 * ============================================================================================== */

export interface ActionMenuPositionerProps {
  children: React.ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  collisionPadding?:
    | number
    | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  alignToFirstItem?: false | 'on-open' | 'always'
}

export const Positioner: React.FC<ActionMenuPositionerProps> = ({
  children,
  side,
  align = 'start',
  sideOffset = 8,
  alignOffset = 0,
  avoidCollisions = true,
  collisionPadding = 8,
  alignToFirstItem = false,
}) => {
  const root = useRootCtx()
  const sub = useSubCtx()

  const isSub = !!sub
  const present = isSub ? sub!.open : root.open
  const defaultSide = isSub ? 'right' : 'bottom'
  const resolvedSide = side ?? defaultSide
  const mode = useDisplayMode()

  const [firstRowAlignOffset, setFirstRowAlignOffset] = React.useState(0)

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
      if (
        alignToFirstItem === 'on-open' &&
        customEvent.detail?.hideSearchUntilActive &&
        customEvent.detail?.inputActive
      ) {
        return
      }
      measure()
    }
    document.addEventListener(INPUT_VISIBILITY_CHANGE_EVENT, handle, true)
    return () =>
      document.removeEventListener(INPUT_VISIBILITY_CHANGE_EVENT, handle, true)
  }, [isSub, sub, present, alignToFirstItem, measure])

  const effectiveAlignOffset =
    isSub && alignToFirstItem ? firstRowAlignOffset : alignOffset

  // IMPORTANT: For the root surface in drawer mode, Positioner is a no-op pass-through.
  // For submenus, we always position with Popper (even in drawer mode).
  const shouldBypassForRoot = mode === 'drawer' && !isSub

  if (shouldBypassForRoot) {
    return <>{children}</>
  }

  const content = isSub ? (
    <Presence present={present}>
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
    </Presence>
  ) : (
    <Presence present={present}>
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
    </Presence>
  )

  return (
    <>
      {content}
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
 * Surface (formerly ContentBase) — generic, shell-agnostic
 * ============================================================================================== */

export interface ActionMenuSurfaceProps<T = unknown>
  extends Omit<DivProps, 'dir' | 'children'> {
  menu: MenuData<T>
  slots?: Partial<MenuSlots<T>>
  surfaceSlotProps?: Partial<SurfaceSlotProps>
  vimBindings?: boolean
  dir?: Direction
  defaults?: Partial<MenuNodeDefaults<T>>
  surfaceClassNames?: Partial<SurfaceClassNames>
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onOpenAutoFocus?: boolean
  onCloseAutoClear?: boolean
  /** @internal Forced surface id; used by submenus. */
  surfaceIdProp?: string
  /** @internal Suppress hover-open until first pointer move; used by submenus opened via keyboard. */
  suppressHoverOpenOnMount?: boolean
}

const SurfaceCtx = React.createContext<SurfaceStore | null>(null)
const useSurface = () => {
  const ctx = React.useContext(SurfaceCtx)
  if (!ctx) throw new Error('SurfaceCtx missing')
  return ctx
}

const SurfaceBase = React.forwardRef(function SurfaceBaseInner<T>(
  {
    menu,
    slots: slotOverrides,
    surfaceSlotProps: slotPropsOverrides,
    vimBindings = true,
    dir: dirProp,
    surfaceIdProp,
    suppressHoverOpenOnMount,
    defaults: defaultsOverrides,
    surfaceClassNames,
    value: valueProp,
    defaultValue,
    onValueChange,
    onOpenAutoFocus = true, // reserved
    onCloseAutoClear = true,
    ...props
  }: ActionMenuSurfaceProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const root = useRootCtx()
  const sub = useSubCtx()
  const surfaceId = React.useMemo(
    () => surfaceIdProp ?? sub?.childSurfaceId ?? 'root',
    [surfaceIdProp, sub],
  )
  const mode = useDisplayMode()
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

  // Clear input on menu close
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

  const slotProps = React.useMemo<Partial<SurfaceSlotProps>>(
    () => ({ ...(slotPropsOverrides ?? {}), ...(menu.ui?.slotProps ?? {}) }),
    [slotPropsOverrides, menu.ui?.slotProps],
  )

  const defaults = React.useMemo<Partial<MenuNodeDefaults<T>>>(
    () => ({ ...defaultsOverrides, ...(menu.defaults ?? {}) }),
    [defaultsOverrides, menu.defaults],
  )

  const mergedClassNames = React.useMemo(
    () => ({ ...(surfaceClassNames ?? {}), ...(menu.ui?.classNames ?? {}) }),
    [surfaceClassNames, menu.ui?.classNames],
  )

  const isSubmenu = !!sub
  const [inputActive, setInputActive] = React.useState(
    !menu.hideSearchUntilActive,
  )

  // Notify (e.g., Positioner) when input visibility changes
  React.useLayoutEffect(() => {
    const target: EventTarget =
      surfaceRef.current ??
      (typeof document !== 'undefined' ? document : ({} as any))
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

  // Create per-surface store once
  const storeRef = React.useRef<SurfaceStore | null>(null)
  if (!storeRef.current) storeRef.current = createSurfaceStore()
  const store = storeRef.current

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

  // Keep focus on input/list after re-render when we own focus
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
    aimGuardActiveRef.current = false
    guardedTriggerIdRef.current = null
    setAimGuardActive(false)
    setGuardedTriggerId(null)
  }, [])
  const activateAimGuard = React.useCallback(
    (triggerId: string, timeoutMs = 450) => {
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
        'data-mode': mode,
        className: mergedClassNames?.content,
        onMouseMove: (e: React.MouseEvent) => {
          clearSuppression()
          const rect = (
            surfaceRef.current as HTMLElement | null
          )?.getBoundingClientRect()
          if (!rect || !isInBounds(e.clientX, e.clientY, rect)) return
          setOwnerId(surfaceId)
        },
        ...props,
      }) as const,
    [
      composedRef,
      root.open,
      clearSuppression,
      surfaceId,
      setOwnerId,
      props,
      mode,
      mergedClassNames?.content,
    ],
  )

  const contentBind: ContentBindAPI = {
    getContentProps: (overrides) =>
      mergeProps(
        baseContentProps as any,
        mergeProps(slotProps?.content as any, overrides as any),
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
      defaults={menu.defaults}
      query={value}
      classNames={mergedClassNames}
      inputActive={inputActive}
      onTypeStart={(seed) => {
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
            aimGuardActiveRef,
            guardedTriggerIdRef,
            isGuardBlocking,
          }}
        >
          {wrapped}
        </HoverPolicyCtx.Provider>
      </SurfaceIdCtx.Provider>
    </KeyboardCtx.Provider>
  )
}) as <T>(
  p: ActionMenuSurfaceProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => ReturnType<typeof Primitive.div>

export const Surface = React.forwardRef<
  HTMLDivElement,
  ActionMenuSurfaceProps<any>
>((p, ref) => <SurfaceBase {...p} ref={ref} />)
Surface.displayName = 'ActionMenu.Surface'

/* ================================================================================================
 * Submenu plumbing (provider and rows)
 * ============================================================================================== */

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
  const { setOwnerId } = useFocusOwner()
  const mode = useDisplayMode()

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

  if (mode === 'drawer') {
    // Use Vaul nested drawer for submenu layers
    return (
      <SubCtx.Provider value={value}>
        <Drawer.NestedRoot
          open={open}
          onOpenChange={(o) => {
            setOpen(o)
            if (o) {
              // Claim focus for the child surface when the nested drawer opens
              setOwnerId(childSurfaceId)
              // focus input/list shortly after mount
              requestAnimationFrame(() => {
                const content = contentRef.current
                const { input, list } = findWidgetsWithinSurface(content!)
                ;(input ?? list)?.focus()
              })
            } else {
              // returning focus/selection to parent surface
              setOwnerId(parentSurfaceId)
              parentStore.setActiveId(triggerItemId)
              requestAnimationFrame(() => {
                const parentEl = document.querySelector<HTMLElement>(
                  `[data-surface-id="${parentSurfaceId}"]`,
                )
                const { input, list } = findWidgetsWithinSurface(parentEl)
                ;(input ?? list)?.focus()
              })
            }
          }}
        >
          {children}
        </Drawer.NestedRoot>
      </SubCtx.Provider>
    )
  }

  return (
    <SubCtx.Provider value={value}>
      <Popper.Root>{children}</Popper.Root>
    </SubCtx.Provider>
  )
}

function SubTriggerRow<T>({
  node,
  slot,
  classNames,
  search,
}: {
  node: SubmenuNode<T>
  slot: NonNullable<MenuSlots<T>['SubmenuTrigger']>
  classNames?: Partial<SurfaceClassNames>
  search?: SearchContext
}) {
  const store = useSurface()
  const sub = useSubCtx()!
  const { setOwnerId } = useFocusOwner()
  const {
    guardedTriggerIdRef,
    aimGuardActiveRef,
    activateAimGuard,
    clearAimGuard,
  } = useHoverPolicy()
  const mouseTrailRef = useMouseTrail(4)
  const ref = React.useRef<HTMLElement | null>(null)
  const surfaceId = useSurfaceId()
  const { ownerId } = useFocusOwner()
  const mode = useDisplayMode()

  const rowId = makeRowId(node.id, search, surfaceId)

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

  React.useEffect(() => {
    const nodeEl = ref.current
    if (!nodeEl) return
    const onOpen = () => {
      sub.pendingOpenModalityRef.current = 'keyboard'
      sub.onOpenChange(true)
      setOwnerId(sub.childSurfaceId)
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

  React.useEffect(() => {
    if (sub.triggerItemId !== rowId) sub.setTriggerItemId(rowId)
    return () => {
      if (sub.triggerItemId === rowId) sub.setTriggerItemId(null)
    }
  }, [rowId])

  const activeId = useSurfaceSel(store, (s) => s.activeId)
  const focused = activeId === rowId
  const menuFocused = sub.childSurfaceId === ownerId

  const baseRowProps = React.useMemo(() => {
    const common = {
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
      'data-mode': mode,
      className: classNames?.subtrigger,
    } as const

    if (mode === 'drawer') {
      // Drawer mode: click (or Enter) opens nested drawer via Drawer.Trigger
      return {
        ...common,
        onPointerDown: undefined, // let Drawer.Trigger handle it
        onPointerEnter: undefined,
        onPointerMove: undefined,
        onPointerLeave: undefined,
        onKeyDown: (e: React.KeyboardEvent) => {
          // Keep keyboard navigation; Enter will bubble to Drawer.Trigger
          if (
            e.key === 'ArrowUp' ||
            e.key === 'ArrowDown' ||
            e.key === 'Home' ||
            e.key === 'End'
          ) {
            // let list/input handlers deal with it via useNavKeydown
          }
        },
      } as const
    }

    // Dropdown (Popper) mode: keep your original hover + aim-guard behavior
    return {
      ...common,
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button === 0 && e.ctrlKey === false) {
          e.preventDefault()
          sub.pendingOpenModalityRef.current = 'pointer'
          sub.onOpenToggle()
        }
      },
      onPointerEnter: () => {
        if (aimGuardActiveRef.current && guardedTriggerIdRef.current !== rowId)
          return
        if (!focused) store.setActiveId(rowId, 'pointer')
        clearAimGuard()
        if (!sub.open) sub.onOpenChange(true)
      },
      onPointerMove: () => {
        if (aimGuardActiveRef.current && guardedTriggerIdRef.current !== rowId)
          return
        if (!focused) store.setActiveId(rowId, 'pointer')
        if (!sub.open) sub.onOpenChange(true)
      },
      onPointerLeave: (e: React.PointerEvent) => {
        if (aimGuardActiveRef.current && guardedTriggerIdRef.current !== rowId)
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
          activateAimGuard(rowId, 600)
          store.setActiveId(rowId, 'pointer')
          sub.onOpenChange(true)
        } else {
          clearAimGuard()
        }
      },
    } as const
  }, [
    mode,
    rowId,
    focused,
    menuFocused,
    classNames?.subtrigger,
    store,
    sub,
    activateAimGuard,
    clearAimGuard,
    aimGuardActiveRef,
    guardedTriggerIdRef,
  ])

  const bind: RowBindAPI = {
    focused,
    disabled: false,
    getRowProps: (overrides) =>
      mergeProps(baseRowProps as any, overrides as any),
  }

  const visual = slot({ node, bind, search })
  const content = isElementWithProp(visual, 'data-action-menu-item-id') ? (
    visual
  ) : (
    <div {...(baseRowProps as any)}>
      {visual ?? (node.render ? node.render() : (node.label ?? node.title))}
    </div>
  )

  return mode === 'drawer' ? (
    <Drawer.Trigger asChild>{content as any}</Drawer.Trigger>
  ) : (
    <Popper.Anchor asChild>{content as any}</Popper.Anchor>
  )
}

function SubmenuContent<T>({
  menu,
  slots,
  defaults,
  classNames,
}: {
  menu: MenuData<T>
  slots: Required<MenuSlots<T>>
  defaults?: Partial<MenuNodeDefaults<T>>
  classNames?: Partial<SurfaceClassNames>
}) {
  const sub = useSubCtx()!
  const mode = useDisplayMode()
  const root = useRootCtx()

  const suppressHover = sub.pendingOpenModalityRef.current === 'keyboard'
  React.useEffect(() => {
    sub.pendingOpenModalityRef.current = null
  }, [sub])

  const inner = (
    <SurfaceBase<T>
      menu={menu}
      slots={slots as any}
      defaults={defaults}
      surfaceClassNames={classNames}
      surfaceIdProp={sub.childSurfaceId}
      suppressHoverOpenOnMount={suppressHover}
    />
  )

  if (mode === 'drawer') {
    return (
      <Drawer.Portal>
        <Drawer.Overlay
          data-slot="action-menu-overlay"
          className={root.shellClassNames?.overlay}
          {...root.shellSlotProps?.drawerOverlay}
        />
        <Drawer.Content
          data-slot="action-menu-drawer"
          ref={sub.contentRef as any}
          className={cn(
            'flex flex-col min-h-0 overflow-hidden', // ensure internal list scrolls, footer is fixed
            root.shellClassNames?.drawerContent,
          )}
          {...root.shellSlotProps?.drawerContent}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
          }}
        >
          <Drawer.Title className="sr-only">
            {menu.title ?? 'Action Menu'}
          </Drawer.Title>
          {inner as any}
        </Drawer.Content>
      </Drawer.Portal>
    )
  }

  return <Positioner side="right">{inner as any}</Positioner>
}

/* ================================================================================================
 * Rendering helpers
 * ============================================================================================== */

function makeRowId(
  baseId: string,
  search: SearchContext | undefined,
  surfaceId: string | null,
) {
  if (!search || !search.isDeep || !surfaceId) return baseId
  return baseId // keep stable to avoid breaking references
}

function renderMenu<T>(
  menu: MenuData<T>,
  slots: Required<MenuSlots<T>>,
  defaults: Partial<MenuNodeDefaults<T>> | undefined,
  classNames: Partial<SurfaceClassNames> | undefined,
  store: SurfaceStore,
) {
  return (
    <React.Fragment>
      {(menu.nodes ?? []).map((node) => {
        if (node.hidden) return null
        if (node.kind === 'item') {
          return (
            <ItemRow
              key={node.id}
              node={node}
              slot={slots.Item}
              defaults={defaults}
              classNames={classNames}
              store={store}
            />
          )
        }
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
                      defaults={defaults}
                      classNames={classNames}
                      store={store}
                    />
                  )
                }
                return (
                  <Sub key={child.id}>
                    <SubTriggerRow
                      node={child as SubmenuNode<any>}
                      slot={slots.SubmenuTrigger as any}
                      classNames={classNames}
                    />
                    <SubmenuContent
                      menu={{ ...(child as SubmenuNode<any>) }}
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
          const childMenu: MenuData<any> = { ...node }
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

function ItemRow<T>({
  node,
  slot,
  classNames,
  defaults,
  store,
  search,
}: {
  node: ItemNode<T>
  slot: NonNullable<MenuSlots<T>['Item']>
  classNames?: Partial<SurfaceClassNames>
  defaults?: Partial<MenuNodeDefaults<T>>
  store: SurfaceStore
  search?: SearchContext
}) {
  const ref = React.useRef<HTMLElement | null>(null)
  const surfaceId = useSurfaceId()
  const mode = useDisplayMode()
  const rowId = makeRowId(node.id, search, surfaceId)
  const onSelect = node.onSelect ?? defaults?.item?.onSelect

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const onSelectFromKey: EventListener = () => {
      onSelect?.({ node })
    }
    el.addEventListener(SELECT_ITEM_EVENT, onSelectFromKey)
    return () => el.removeEventListener(SELECT_ITEM_EVENT, onSelectFromKey)
  }, [onSelect])

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
  const { aimGuardActiveRef } = useHoverPolicy()

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
        'data-mode': mode,
        className: classNames?.item,
        onPointerDown: (e: React.PointerEvent) => {
          e.preventDefault()
        },
        onMouseMove: () => {
          if (aimGuardActiveRef.current) return
          if (!focused) store.setActiveId(rowId, 'pointer')
        },
        onClick: (e: React.MouseEvent) => {
          e.preventDefault()
          onSelect?.({ node })
        },
      }) as const,
    [rowId, onSelect, focused, store, classNames?.item, aimGuardActiveRef],
  )

  const bind: RowBindAPI = {
    focused,
    disabled: false,
    getRowProps: (overrides) =>
      mergeProps(baseRowProps as any, overrides as any),
  }

  const visual = slot({ node, bind, search })
  if (isElementWithProp(visual, 'data-action-menu-item-id'))
    return visual as React.ReactElement
  const fallbackVisual =
    visual ??
    (node.render ? node.render() : <span>{node.label ?? String(node.id)}</span>)
  return <div {...(baseRowProps as any)}>{fallbackVisual}</div>
}

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
  store: SurfaceStore
  value: string
  onChange: (v: string) => void
  slot: NonNullable<MenuSlots<T>['Input']>
  slotProps: Partial<SurfaceSlotProps>
  inputPlaceholder?: string
  classNames?: Partial<SurfaceClassNames>
}) {
  const activeId = useSurfaceSel(store, (s) => s.activeId ?? undefined)
  const listId = useSurfaceSel(store, (s) => s.listId ?? undefined)
  const mode = useDisplayMode()
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
    'data-mode': mode,
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
  if (!isElementWithProp(el, 'data-action-menu-input'))
    return <input {...(bind.getInputProps(slotProps?.input as any) as any)} />
  return el as React.ReactElement
}

/** List view that renders the unfiltered tree or flattened search results. */
function ListView<T>({
  store,
  menu,
  slots,
  slotProps,
  defaults,
  classNames,
  query,
  inputActive,
  onTypeStart,
}: {
  store: SurfaceStore
  menu: MenuData<T>
  slots: Required<MenuSlots<T>>
  slotProps?: Partial<SurfaceSlotProps>
  defaults?: Partial<MenuNodeDefaults<T>>
  classNames?: Partial<SurfaceClassNames>
  query?: string
  inputActive: boolean
  onTypeStart: (seed: string) => void
}) {
  const localId = React.useId()
  const listId = useSurfaceSel(store, (s) => s.listId)
  const hasInput = useSurfaceSel(store, (s) => s.hasInput)
  const activeId = useSurfaceSel(store, (s) => s.activeId ?? undefined)
  const navKeydown = useNavKeydown('list')
  const { ownerId } = useFocusOwner()
  const surfaceId = useSurfaceId() ?? 'root'
  const mode = useDisplayMode()

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (ownerId !== surfaceId) return
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
    'data-mode': mode,
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

  const q = (query ?? '').trim()

  type SRItem = {
    type: 'item'
    node: ItemNode<T>
    breadcrumbs: string[]
    breadcrumbIds: string[]
    score: number
  }
  type SRSub = {
    type: 'submenu'
    node: SubmenuNode<any>
    breadcrumbs: string[]
    breadcrumbIds: string[]
    score: number
  }
  type SR = SRItem | SRSub

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
          if (score > 0)
            out.push({
              type: 'submenu',
              node: sub,
              breadcrumbs: bc,
              breadcrumbIds: bcIds,
              score,
            })
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

  const results = React.useMemo(
    () =>
      q
        ? pipe(
            collect(menu.nodes, q),
            sortBy([prop('score'), 'desc']),
            partition((v) => v.type === 'submenu'),
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

  React.useLayoutEffect(() => {
    if (!q) return
    if (!firstRowId) return
    const raf = requestAnimationFrame(() =>
      store.setActiveId(firstRowId, 'keyboard'),
    )
    return () => cancelAnimationFrame(raf)
  }, [q])

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
      ? renderMenu<T>(menu, slots, defaults, classNames, store)
      : slots.Empty({ query: '' })
  } else {
    children =
      results.length === 0
        ? slots.Empty({ query: q })
        : results.map((res) => {
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
                  defaults={defaults}
                />
              )
            }
            const childMenu: MenuData<any> = { ...res.node }
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
          })
  }

  const el = slots.List({ children, bind })
  if (!isElementWithProp(el, 'data-action-menu-list')) {
    return (
      <div
        {...(bind.getListProps(
          mergeProps(slotProps?.list as any, {
            onPointerDown: (e: React.PointerEvent) => {},
          }),
        ) as any)}
      >
        {children}
      </div>
    )
  }
  return el as React.ReactElement
}

/* ================================================================================================
 * Shells & Entry (ActionMenu)
 * ============================================================================================== */

export interface ActionMenuProps extends Children {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  responsive?: Partial<ResponsiveConfig>
  /** Drawer/overlay styles */
  shellClassNames?: Partial<ShellClassNames>
  /** Drawer-specific slot props */
  shellSlotProps?: Partial<ShellSlotProps>
  debug?: boolean
}

function DropdownShell({
  children,
  disableOutsidePointerEvents,
  onClose,
}: {
  children: React.ReactNode
  disableOutsidePointerEvents: boolean
  onClose: () => void
}) {
  return (
    <DismissableLayer.Root
      asChild
      disableOutsidePointerEvents={disableOutsidePointerEvents}
      onEscapeKeyDown={() => onClose()}
      onInteractOutside={(event) => {
        const target = event.target as HTMLElement | null
        if (target?.closest?.('[data-action-menu-surface]')) return
        event.preventDefault()
        onClose()
      }}
    >
      <Popper.Root>{children}</Popper.Root>
    </DismissableLayer.Root>
  )
}

/** Drawer shell that mounts everything except the Trigger inside Vaul.Content. */
function DrawerShell({ children }: { children: React.ReactNode }) {
  const root = useRootCtx()

  // Split children: keep Triggers outside content, render everything else inside Drawer.Content
  const elements = React.Children.toArray(children) as React.ReactElement[]
  const triggerTypeName = 'ActionMenu.Trigger'
  const triggers: React.ReactNode[] = []
  const body: React.ReactNode[] = []

  elements.forEach((child) => {
    const isTrigger =
      React.isValidElement(child) &&
      (child.type as any)?.displayName === triggerTypeName
    if (isTrigger) triggers.push(child)
    else body.push(child)
  })

  return (
    // @ts-expect-error
    <Drawer.Root
      open={root.open}
      onOpenChange={root.onOpenChange}
      {...root.shellSlotProps?.drawerRoot}
    >
      {triggers}
      <Drawer.Portal>
        <Drawer.Overlay
          data-slot="action-menu-overlay"
          className={root.shellClassNames?.overlay}
          {...root.shellSlotProps?.drawerOverlay}
        />
        <Drawer.Content
          data-slot="action-menu-drawer"
          className={root.shellClassNames?.drawerContent}
          {...root.shellSlotProps?.drawerContent}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
          }}
        >
          {/* Optional accessible title; hidden visually */}
          <Drawer.Title className="sr-only">Action Menu</Drawer.Title>
          {body}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

/** Entry component: chooses the shell and provides root/display/focus contexts. */
export const ActionMenu = ({
  children,
  open: openProp,
  defaultOpen,
  onOpenChange,
  modal = true,
  responsive: responsiveProp,
  shellClassNames,
  shellSlotProps,
  debug = false,
}: ActionMenuProps) => {
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
  })
  const anchorRef = React.useRef<HTMLButtonElement | null>(null)
  const [ownerId, setOwnerId] = React.useState<string | null>(null)

  const responsive = React.useMemo(
    () => ({
      mode: responsiveProp?.mode ?? 'auto',
      query: responsiveProp?.query ?? '(max-width: 640px), (pointer: coarse)',
    }),
    [responsiveProp],
  )
  const { mode, query } = responsive
  const autoDrawer = useMediaQuery(query)
  const resolvedMode: MenuDisplayMode =
    mode === 'drawer' || mode === 'dropdown'
      ? mode
      : autoDrawer
        ? 'drawer'
        : 'dropdown'

  const rootCtxValue: ActionMenuRootContextValue = {
    open,
    onOpenChange: setOpen,
    onOpenToggle: () => setOpen((v) => !v),
    anchorRef,
    modal,
    debug,
    responsive,
    shellClassNames,
    shellSlotProps,
  }

  const content =
    resolvedMode === 'dropdown' ? (
      <DropdownShell
        disableOutsidePointerEvents={modal}
        onClose={() => setOpen(false)}
      >
        {children}
      </DropdownShell>
    ) : (
      <DrawerShell>{children}</DrawerShell>
    )

  return (
    <RootCtx.Provider value={rootCtxValue}>
      <DisplayModeCtx.Provider value={resolvedMode}>
        <FocusOwnerCtx.Provider value={{ ownerId, setOwnerId }}>
          {content}
        </FocusOwnerCtx.Provider>
      </DisplayModeCtx.Provider>
    </RootCtx.Provider>
  )
}

/* ================================================================================================
 * Trigger
 * ============================================================================================== */

export interface ActionMenuTriggerProps extends ButtonProps {}

/** Button that toggles the menu. Also acts as the Popper anchor (dropdown) or Drawer.Trigger (drawer). */
export const Trigger = React.forwardRef<
  HTMLButtonElement,
  ActionMenuTriggerProps
>(
  (
    { children, disabled, onPointerDown, onKeyDown, className, ...props },
    forwardedRef,
  ) => {
    const root = useRootCtx()
    const mode = useDisplayMode()
    const ResponsiveTrigger = mode === 'drawer' ? Drawer.Trigger : Popper.Anchor

    return (
      <DismissableLayer.Branch asChild>
        <ResponsiveTrigger asChild>
          <Primitive.button
            {...props}
            data-slot="action-menu-trigger"
            data-action-menu-trigger
            ref={composeRefs(forwardedRef, root.anchorRef)}
            disabled={disabled}
            className={cn(root.shellClassNames?.trigger, className)}
            onPointerDown={composeEventHandlers(onPointerDown, (event) => {
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
        </ResponsiveTrigger>
      </DismissableLayer.Branch>
    )
  },
)
Trigger.displayName = 'ActionMenu.Trigger'

/* ================================================================================================
 * Factory — createActionMenu<T>
 * ============================================================================================== */

export type CreateActionMenuResult<T = unknown> = {
  Root: React.FC<ActionMenuProps>
  Trigger: typeof Trigger
  Positioner: typeof Positioner
  Surface: React.ForwardRefExoticComponent<
    ActionMenuSurfaceProps<T> & React.RefAttributes<HTMLDivElement>
  >
}

export function createActionMenu<T>(opts?: {
  /** Default content-level options such as `vimBindings` and `dir`. */
  defaults?: {
    content?: Pick<ActionMenuSurfaceProps<T>, 'vimBindings' | 'dir'>
  }
  surface?: {
    slots?: Partial<MenuSlots<T>>
    slotProps?: Partial<SurfaceSlotProps>
    classNames?: Partial<SurfaceClassNames>
  }
  /** NEW: Defaults for the Vaul/overlay shell. */
  shell?: {
    classNames?: Partial<ShellClassNames>
    slotProps?: Partial<ShellSlotProps>
  }
}): CreateActionMenuResult<T> {
  const baseSlots = {
    ...defaultSlots<T>(),
    ...(opts?.surface?.slots as any),
  } as Required<MenuSlots<T>>
  const baseSurfaceSlotProps = ((opts?.surface?.slotProps as any) ??
    {}) as Partial<SurfaceSlotProps>
  const baseDefaults = opts?.defaults?.content ?? {}
  const baseSurfaceClassNames = opts?.surface?.classNames
  const baseShellClassNames = opts?.shell?.classNames
  const baseShellSlotProps = opts?.shell?.slotProps

  /** Typed Surface that merges factory defaults with per-instance props. */
  const SurfaceTyped = React.forwardRef<
    HTMLDivElement,
    ActionMenuSurfaceProps<T>
  >(({ slots, surfaceSlotProps, surfaceClassNames, ...rest }, ref) => {
    const mergedSlots = React.useMemo<MenuSlots<T>>(
      () => ({ ...baseSlots, ...(slots as any) }),
      [slots],
    )
    const mergedSlotProps = React.useMemo<Partial<SurfaceSlotProps>>(
      () => ({ ...baseSurfaceSlotProps, ...(surfaceSlotProps ?? {}) }),
      [surfaceSlotProps],
    )
    const mergedClassNames = React.useMemo<Partial<SurfaceClassNames>>(
      () => ({
        root: cn(baseSurfaceClassNames?.root, surfaceClassNames?.root),
        content: cn(baseSurfaceClassNames?.content, surfaceClassNames?.content),
        input: cn(baseSurfaceClassNames?.input, surfaceClassNames?.input),
        list: cn(baseSurfaceClassNames?.list, surfaceClassNames?.list),
        item: cn(baseSurfaceClassNames?.item, surfaceClassNames?.item),
        subtrigger: cn(
          baseSurfaceClassNames?.subtrigger,
          surfaceClassNames?.subtrigger,
        ),
        group: cn(baseSurfaceClassNames?.group, surfaceClassNames?.group),
        groupHeading: cn(
          baseSurfaceClassNames?.groupHeading,
          surfaceClassNames?.groupHeading,
        ),
      }),
      [surfaceClassNames, baseSurfaceClassNames],
    )

    const vimBindings = rest.vimBindings ?? baseDefaults.vimBindings ?? true
    const dir = (rest.dir ?? baseDefaults.dir) as Direction | undefined

    return (
      <SurfaceBase<T>
        {...(rest as any)}
        vimBindings={vimBindings}
        dir={dir}
        slots={mergedSlots}
        surfaceSlotProps={mergedSlotProps}
        surfaceClassNames={mergedClassNames}
        ref={ref}
      />
    )
  })
  SurfaceTyped.displayName = 'ActionMenu.Surface'

  /** Typed ActionMenu wrapper that injects default *shell* props. */
  const ActionMenuTyped: React.FC<ActionMenuProps> = (p) => {
    const mergedShellClassNames: Partial<ShellClassNames> = {
      root: cn(baseShellClassNames?.root, p.shellClassNames?.root),
      overlay: cn(baseShellClassNames?.overlay, p.shellClassNames?.overlay),
      drawerContent: cn(
        baseShellClassNames?.drawerContent,
        p.shellClassNames?.drawerContent,
      ),
      trigger: cn(baseShellClassNames?.trigger, p.shellClassNames?.trigger),
    }
    const mergedShellSlotProps: Partial<ShellSlotProps> = {
      ...(baseShellSlotProps ?? {}),
      ...(p.shellSlotProps ?? {}),
    }
    return (
      <ActionMenu
        {...p}
        shellClassNames={mergedShellClassNames}
        shellSlotProps={mergedShellSlotProps}
      />
    )
  }

  return {
    Root: ActionMenuTyped,
    Trigger,
    Positioner,
    Surface: SurfaceTyped,
  }
}
