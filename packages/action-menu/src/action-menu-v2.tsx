/** biome-ignore-all lint/a11y/useSemanticElements: This library renders ARIA-only primitives intentionally. */

import { composeEventHandlers } from '@radix-ui/primitive'
import { composeRefs } from '@radix-ui/react-compose-refs'
import { DismissableLayer } from '@radix-ui/react-dismissable-layer'
import * as Popper from '@radix-ui/react-popper'
import { Presence } from '@radix-ui/react-presence'
import { Primitive } from '@radix-ui/react-primitive'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { flat, partition, pipe, prop, sortBy } from 'remeda'
import { cn } from './cn.js'
import { commandScore } from './command-score.js'

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

export type MenuNodeKind = 'item' | 'group' | 'submenu'

export type BaseNode<K extends MenuNodeKind> = {
  id: string
  kind: K
  hidden?: boolean
}

export type Searchable = {
  label?: string
  keywords?: string[]
}

export type Renderable = {
  /** Optional visual fallback; if you use renderers, you can set this to () => null */
  render?: () => React.ReactNode
}

/** Item row with per-instance data payload `T` */
export type ItemNode<T = unknown> = BaseNode<'item'> &
  Searchable &
  Renderable & {
    data?: T
    onSelect?: () => void
  }

/** A group on the current surface; children share the same item payload `T` */
export type GroupNode<T = unknown> = BaseNode<'group'> & {
  heading?: string
  nodes: (ItemNode<T> | SubmenuNode<any>)[]
}

/** Submenu whose children can have a *different* payload shape `TChild` */
export type SubmenuNode<T = unknown, TChild = unknown> = BaseNode<'submenu'> &
  Searchable &
  Renderable & {
    data?: T
    title?: string
    inputPlaceholder?: string
    nodes: MenuNode<TChild>[]
  }

/** A menu surface carrying items with payload `T` */
export type MenuData<T = unknown> = {
  id: string
  title?: string
  inputPlaceholder?: string
  nodes?: MenuNode<T>[]
}

/** Nodes that can appear on a surface with payload `T` */
export type MenuNode<T = unknown> =
  | ItemNode<T>
  | GroupNode<T>
  | SubmenuNode<any>

export type SearchContext = {
  query: string
  /** true if this row is rendered as a result from a descendant submenu */
  isDeep: boolean
  /** titles of submenus leading from the current surface to this row; never includes the row’s own label/title */
  breadcrumbs: string[]
  /** same as breacrumbs, but with submenu IDs */
  breadcrumbIds: string[]
}

/* =========================================================================== */
/* =========================== Renderer & bind APIs ========================== */
/* =========================================================================== */

type DivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>
type ButtonProps = React.ComponentPropsWithoutRef<typeof Primitive.button>

export type RowBindAPI = {
  /** Whether our internal focus thinks this row is focused (fake focus) */
  focused: boolean
  /** Basic disabled flag (not wired yet in this proto) */
  disabled: boolean
  /** Returns fully-wired props (role, ids, data-*, handlers). */
  getRowProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    ref: React.Ref<any>
    id: string
    role: 'option'
    tabIndex: -1
    'data-action-menu-item-id': string
    'data-focused'?: 'true' | undefined
    'aria-selected'?: boolean
    'aria-disabled'?: boolean
  }
}

export type ContentBindAPI = {
  /** Returns menu-surface props (role, ids, data-*, etc.). */
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

export type InputBindAPI = {
  /** Returns wired input props; carries `aria-activedescendant` & handlers. */
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

export type ListBindAPI = {
  /** Returns wired list props; acts as fallback focus owner when no Input. */
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
}

export type SlotClassNames = {
  root?: string
  trigger?: string
  content?: string
  input?: string
  list?: string
  item?: string
  subtrigger?: string
  group?: string
  groupHeading?: string
}

export type Renderers<T = unknown> = {
  /** Item renderer for nodes with payload `T`. */
  item: (args: {
    node: ItemNode<T>
    search?: SearchContext
    bind: RowBindAPI
  }) => React.ReactNode
  /** Content renderer for a surface whose items use payload `T`. */
  content: (args: {
    menu: MenuData<T>
    children: React.ReactNode
    bind: ContentBindAPI
  }) => React.ReactNode
  /** Input renderer for the surface. */
  input: (args: {
    value: string
    onChange: (v: string) => void
    bind: InputBindAPI
  }) => React.ReactNode
  /** List renderer that wraps all rows. */
  list: (args: {
    children: React.ReactNode
    bind: ListBindAPI
  }) => React.ReactNode
  /** Submenu trigger renderer */
  submenuTrigger: (args: {
    node: SubmenuNode<any>
    search?: SearchContext
    bind: RowBindAPI
  }) => React.ReactNode
}

/* Default minimal renderers (safe fallbacks) */
function defaultRenderers<T>(): Renderers<T> {
  return {
    item: ({ node }) =>
      node.render ? (
        node.render()
      ) : (
        <span>{node.label ?? String(node.id)}</span>
      ),
    content: ({ children }) => <>{children}</>,
    input: ({ value, onChange }) => (
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    ),
    list: ({ children }) => <div>{children}</div>,
    submenuTrigger: ({ node }) =>
      node.render ? (
        node.render()
      ) : (
        <span>{node.label ?? node.title ?? String(node.id)}</span>
      ),
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

function mergeProps<
  A extends Record<string, any>,
  B extends Record<string, any>,
>(base: A, overrides?: B): A & B {
  if (!overrides) return base as A & B
  const merged: any = { ...base, ...overrides }
  // merge className
  if (base.className || (overrides as any).className) {
    merged.className = cn(base.className, (overrides as any).className)
  }
  // compose known handlers (base first, then override)
  for (const key of HANDLER_KEYS) {
    const a = (base as any)[key]
    const b = (overrides as any)[key]
    if (a || b) merged[key] = composeEventHandlers(a, b)
  }
  // compose ref
  if (base.ref || (overrides as any).ref) {
    merged.ref = composeRefs(base.ref, (overrides as any).ref)
  }
  return merged
}

function isElementWithProp(node: React.ReactNode, propName: string) {
  return React.isValidElement(node) && propName in (node.props as any)
}

/* ================================================================================================
 * Constants, tiny helpers
 * ============================================================================================== */

function isInBounds(x: number, y: number, rect: DOMRect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

function findWidgetsWithinSurface(surface: HTMLElement | null) {
  const input =
    surface?.querySelector<HTMLInputElement>('[data-action-menu-input]') ?? null
  const list =
    surface?.querySelector<HTMLElement>('[data-action-menu-list]') ?? null
  return { input, list }
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
 * Keyboard helpers
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

/* ================================================================================================
 * Keyboard context
 * ============================================================================================== */

type KeyboardOptions = { dir: Direction; vimBindings: boolean }
const KeyboardCtx = React.createContext<KeyboardOptions>({
  dir: 'ltr',
  vimBindings: true,
})
const useKeyboardOpts = () => React.useContext(KeyboardCtx)

/* ================================================================================================
 * Custom events (open submenu)
 * ============================================================================================== */
const OPEN_SUB_EVENT = 'actionmenu-open-sub' as const
const SELECT_ITEM_EVENT = 'actionmenu-select-item' as const

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
 * Root-level context (open state + anchor)
 * ============================================================================================== */

type ActionMenuRootContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
  modal: boolean
  anchorRef: React.RefObject<HTMLButtonElement | null>
}

const RootCtx = React.createContext<ActionMenuRootContextValue | null>(null)
const useRootCtx = () => {
  const ctx = React.useContext(RootCtx)
  if (!ctx)
    throw new Error('useActionMenu must be used within an ActionMenu.Root')
  return ctx
}

const SurfaceIdCtx = React.createContext<string | null>(null)
const useSurfaceId = () => React.useContext(SurfaceIdCtx)

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
  /** Whether the pointer is inside the intent zone triangle. */
  intentZoneActiveRef: React.RefObject<boolean>
}

const SubCtx = React.createContext<SubContextValue | null>(null)
const useSubCtx = () => React.useContext(SubCtx)

/* ================================================================================================
 * Focus context -- which surface owns the real DOM focus
 * ============================================================================================== */

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
 * Surface store (per Content) — roving focus & registration
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

    // Single-open submenu policy — close any submenu whose trigger isn’t active
    for (const [rid, rec] of rows) {
      if (rec.kind === 'submenu' && rec.closeSub && rid !== id) {
        try {
          rec.closeSub()
        } catch {}
      }
    }

    emit()

    if (cause !== 'keyboard') return

    // scroll into view if possible
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
      // Only the focus-owning surface handles keys.
      if (ownerId && ownerId !== surfaceId) return

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
          e.preventDefault()
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
          // Enter on a subtrigger opens the submenu; otherwise select
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
): 'left' | 'right' {
  if (tRect) {
    const tx = (tRect.left + tRect.right) / 2
    const dL = Math.abs(tx - rect.left)
    const dR = Math.abs(tx - rect.right)
    return dL <= dR ? 'left' : 'right'
  }
  return mx < rect.left ? 'left' : 'right'
}

/** Return a smoothed heading vector from the mouse trail. Falls back to a sane vector if needed. */
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

  // If heading is degenerate, fall back to a vector from trigger center to submenu edge center
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

/** Robust “will hit submenu” test with vertical tolerance at the edge. */
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

type IntentZoneProps = {
  parentRef: React.RefObject<HTMLElement | null>
  triggerRef: React.RefObject<HTMLElement | null>
  debug?: boolean
}

/** Visual-only debug polygon; no event handlers and no hit-testing. */
function IntentZone({ parentRef, triggerRef, debug }: IntentZoneProps) {
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

  const polygon = (
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
        background: debug ? 'rgba(0, 136, 255, 0.15)' : 'transparent',
        transform: 'translateZ(0)',
      }}
    />
  )

  return createPortal(polygon, document.body)
}

/* ================================================================================================
 * Root
 * ============================================================================================== */

export interface ActionMenuProps extends DivProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
}

export const Root = React.forwardRef<HTMLDivElement, ActionMenuProps>(
  (
    {
      children,
      open: openProp,
      defaultOpen,
      onOpenChange,
      modal = true,
      ...props
    },
    ref,
  ) => {
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
        }}
      >
        <FocusOwnerCtx.Provider value={{ ownerId, setOwnerId }}>
          <Popper.Root>
            <Primitive.div ref={ref} {...props}>
              {children}
            </Primitive.div>
          </Popper.Root>
        </FocusOwnerCtx.Provider>
      </RootCtx.Provider>
    )
  },
)
Root.displayName = 'ActionMenu.Root'

/* ================================================================================================
 * Trigger (Popper anchor)
 * ============================================================================================== */

export interface ActionMenuTriggerProps extends ButtonProps {}

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
      <Popper.Anchor asChild>
        <Primitive.button
          {...props}
          data-slot="action-menu-trigger"
          ref={composeRefs(forwardedRef, root.anchorRef)}
          disabled={disabled}
          onPointerDown={composeEventHandlers(onPointerDown, (event) => {
            if (!disabled && event.button === 0 && event.ctrlKey === false) {
              const willOpen = !root.open
              root.onOpenToggle()
              if (willOpen) event.preventDefault()
            }
          })}
          onKeyDown={composeEventHandlers(onKeyDown, (event) => {
            if (disabled) return
            if (event.key === 'Enter' || event.key === ' ') root.onOpenToggle()
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
    )
  },
)
Trigger.displayName = 'ActionMenu.Trigger'

/* ================================================================================================
 * Positioner
 * ============================================================================================== */

export interface ActionMenuPositionerProps {
  children: React.ReactElement // typically <ActionMenu.Content/>
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  collisionPadding?:
    | number
    | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  /** Root-only: keep menu open when clicking the trigger/anchor unless true */
  closeOnAnchorPointerDown?: boolean
  /** Enable diagonal-intent guard for submenus (safe polygon). */
  intentZone?: boolean
  /** Show the intent zone triangle for debugging. */
  intentZoneDebug?: boolean
}

export const Positioner: React.FC<ActionMenuPositionerProps> = ({
  children,
  side,
  align = 'start',
  sideOffset = 8,
  alignOffset = 0,
  avoidCollisions = true,
  collisionPadding = 8,
  closeOnAnchorPointerDown = true,
  intentZone = true,
  intentZoneDebug = DEBUG_MODE,
}) => {
  const root = useRootCtx()
  const sub = useSubCtx()
  const { setOwnerId } = React.useContext(FocusOwnerCtx)!

  const isSub = !!sub
  const present = isSub ? sub!.open : root.open
  const defaultSide = isSub ? 'right' : 'bottom'
  const resolvedSide = side ?? defaultSide

  const close = React.useCallback(() => {
    if (isSub) {
      sub!.onOpenChange(false)
      // Return focus to parent surface
      setOwnerId(sub!.parentSurfaceId)
      const parentEl = document.querySelector<HTMLElement>(
        `[data-surface-id="${sub!.parentSurfaceId}"]`,
      )
      requestAnimationFrame(() => {
        const { input, list } = findWidgetsWithinSurface(parentEl)
        ;(input ?? list)?.focus()
      })
    } else {
      root.onOpenChange(false)
    }
  }, [isSub, root, sub, setOwnerId])

  return (
    <>
      <Presence present={present}>
        <Popper.Content
          asChild
          side={resolvedSide}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          collisionPadding={collisionPadding}
        >
          <DismissableLayer
            asChild
            onEscapeKeyDown={close}
            onDismiss={closeOnAnchorPointerDown ? close : undefined}
            disableOutsidePointerEvents={isSub ? undefined : root.modal}
            onInteractOutside={
              isSub
                ? (event) => {
                    const target = event.target as Node | null
                    const trigger = sub!.triggerRef.current

                    // Opening via hover or click means the pointer/focus is still on the trigger.
                    // Treat interactions on the trigger as *inside* to avoid instant dismiss.
                    if (trigger && target && trigger.contains(target)) {
                      event.preventDefault()
                    }
                  }
                : (event) => {
                    const target = event.target as Node | null
                    const anchor = root.anchorRef.current
                    if (
                      !closeOnAnchorPointerDown &&
                      anchor &&
                      target &&
                      anchor.contains(target)
                    ) {
                      event.preventDefault()
                    }
                  }
            }
            onFocusOutside={
              isSub
                ? (event) => {
                    const target = event.target as Node | null
                    const trigger = sub!.triggerRef.current
                    const parentSurface = document.querySelector<HTMLElement>(
                      `[data-surface-id="${sub!.parentSurfaceId}"]`,
                    )
                    if (
                      (trigger && target && trigger.contains(target)) ||
                      (parentSurface &&
                        target &&
                        parentSurface.contains(target))
                    ) {
                      event.preventDefault()
                    }
                  }
                : undefined
            }
          >
            {children}
          </DismissableLayer>
        </Popper.Content>
      </Presence>
      {/* Safe polygon overlay only for open submenus */}
      {isSub && present && intentZone ? (
        <IntentZone
          parentRef={sub!.contentRef as React.RefObject<HTMLElement | null>}
          triggerRef={sub!.triggerRef as React.RefObject<HTMLElement | null>}
          debug={intentZoneDebug}
        />
      ) : null}
    </>
  )
}

/* ================================================================================================
 * Content (generic) — adds Input and List with bind APIs
 * ============================================================================================== */

export interface ActionMenuContentProps<T = unknown>
  extends Omit<DivProps, 'dir' | 'children'> {
  /** Surface items’ data shape for this menu */
  menu: MenuData<T>
  /** Per-instance renderers (merged over sensible defaults). */
  renderers?: Partial<Renderers<T>>
  /** If false, no Input is rendered; List becomes focus owner. */
  withInput?: boolean
  /** Vim-style keybindings (Ctrl+N/P, Ctrl+J/K). */
  vimBindings?: boolean
  /** Text direction. If omitted, falls back to document.dir */
  dir?: Direction
  /** Slot class names */
  classNames?: Partial<SlotClassNames>
}

type ActionMenuContentInternalProps<T = unknown> = ActionMenuContentProps<T> & {
  /** internal: allows SubmenuContent to pin the child surface id */
  surfaceIdProp?: string
  suppressHoverOpenOnMount?: boolean
  classNames?: Partial<SlotClassNames>
}

/** Internal generic base so `createActionMenu<T>()` can close over `T` */
const ContentBase = React.forwardRef(function ContentBaseInner<T>(
  {
    menu,
    renderers: rOverrides,
    withInput = true,
    vimBindings = true,
    dir: dirProp,
    surfaceIdProp,
    suppressHoverOpenOnMount,
    classNames,
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

  const [value, setValue] = React.useState('')

  const renderers = React.useMemo<Renderers<T>>(
    () => ({ ...defaultRenderers<T>(), ...(rOverrides as any) }),
    [rOverrides],
  )

  const isSubmenu = !!sub

  // Create per-surface store
  const storeRef = React.useRef<SurfaceStore | null>(null)
  if (!storeRef.current) storeRef.current = createSurfaceStore()
  const store = storeRef.current

  React.useEffect(() => {
    store.set('hasInput', withInput)
  }, [withInput, store])

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
        className: classNames?.content ?? {},
        onMouseMove: (e: React.MouseEvent) => {
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
      mergeProps(baseContentProps as any, overrides),
  }

  // Compose children (Input + List). These are components so hooks are top-level there.
  const childrenNoProvider = (
    <>
      {withInput ? (
        <InputView<T>
          store={store}
          value={value}
          onChange={setValue}
          renderer={renderers.input}
          classNames={classNames}
          inputPlaceholder={menu.inputPlaceholder}
        />
      ) : null}
      <ListView<T>
        store={store}
        menu={menu}
        renderers={renderers}
        query={value}
        classNames={classNames}
      />
    </>
  )

  const body = renderers.content({
    menu,
    children: childrenNoProvider,
    bind: contentBind,
  })

  const wrapped = !isElementWithProp(body, 'data-action-menu-surface') ? (
    <Primitive.div {...(baseContentProps as any)}>
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

/* Public export: generic-friendly but usable directly (any) */
export const Content = React.forwardRef<
  HTMLDivElement,
  ActionMenuContentProps<any>
>((p, ref) => <ContentBase {...p} ref={ref} />)
Content.displayName = 'ActionMenu.Content'

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

function SubTriggerRow<T>({
  node,
  renderer,
  classNames,
  search,
}: {
  node: SubmenuNode<T>
  renderer: Renderers<T>['submenuTrigger']
  classNames?: Partial<SlotClassNames>
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

  // Register with surface as a 'submenu' kind, providing open/close callbacks
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

  // Open on custom event from the parent surface (old behavior)
  React.useEffect(() => {
    const nodeEl = ref.current
    if (!nodeEl) return
    const onOpen = () => {
      sub.pendingOpenModalityRef.current = 'keyboard'
      sub.onOpenChange(true)
      setOwnerId(sub.childSurfaceId)
      // Move focus down into the child surface’s first focusable (input or list)
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

  // Track which parent row opened the submenu so we can return focus on close
  React.useEffect(() => {
    if (sub.triggerItemId !== rowId) sub.setTriggerItemId(rowId)
    return () => {
      if (sub.triggerItemId === rowId) sub.setTriggerItemId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        className: classNames?.subtrigger ?? {},
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

  const visual = renderer({ node, bind, search })

  // Auto-wrap with Popper.Anchor so submenu positions relative to this row
  const content = isElementWithProp(visual, 'data-action-menu-item-id') ? (
    visual
  ) : (
    <div {...(baseRowProps as any)}>
      {visual ?? (node.render ? node.render() : (node.label ?? node.title))}
    </div>
  )

  return <Popper.Anchor asChild>{content as any}</Popper.Anchor>
}

function SubmenuContent<T>({
  menu,
  renderers,
  classNames,
}: {
  menu: MenuData<T>
  renderers: Renderers<T>
  classNames?: Partial<SlotClassNames>
}) {
  const sub = useSubCtx()!
  const suppressHover = sub.pendingOpenModalityRef.current === 'keyboard'

  React.useEffect(() => {
    sub.pendingOpenModalityRef.current = null // reset after we consume it
  }, [sub])

  // Compose our content ref into the surface container to let Positioner focus it
  const content = (
    <ContentBase<T>
      menu={menu}
      renderers={renderers as any}
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

function makeRowId(
  baseId: string,
  search: SearchContext | undefined,
  surfaceId: string | null,
) {
  if (!search || !search.isDeep || !surfaceId) return baseId
  return baseId
  // return `${surfaceId}-${baseId}`
  // return `${search.breadcrumbIds.join('::')}::${baseId}`
}

function renderMenu<T>(
  menu: MenuData<T>,
  renderers: Renderers<T>,
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
              renderer={renderers.item}
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
                      renderer={renderers.item}
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
                      renderer={renderers.submenuTrigger as any}
                      classNames={classNames}
                    />
                    <SubmenuContent
                      menu={{
                        ...child,
                      }}
                      renderers={renderers as any}
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
                renderer={renderers.submenuTrigger as any}
                classNames={classNames}
              />
              <SubmenuContent
                menu={childMenu}
                renderers={renderers as any}
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
  renderer,
  classNames,
  store,
  search,
}: {
  node: ItemNode<T>
  renderer: Renderers<T>['item']
  classNames?: Partial<SlotClassNames>
  store: SurfaceStore
  search?: SearchContext
}) {
  const ref = React.useRef<HTMLElement | null>(null)
  const surfaceId = useSurfaceId()
  const rowId = makeRowId(node.id, search, surfaceId) // NEW (search)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const onSelectFromKey: EventListener = () => {
      node.onSelect?.()
    }
    el.addEventListener(SELECT_ITEM_EVENT, onSelectFromKey)
    return () => el.removeEventListener(SELECT_ITEM_EVENT, onSelectFromKey)
  }, [node.onSelect])

  // Register/unregister with surface
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
        className: classNames?.item ?? {},
        onPointerDown: (e: React.PointerEvent) => {
          // keep click semantics predictable
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

  const visual = renderer({ node, bind, search })

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

function InputView<T>({
  store,
  value,
  onChange,
  renderer,
  inputPlaceholder,
  classNames,
}: {
  store: SurfaceStore
  value: string
  onChange: (v: string) => void
  renderer: Renderers<T>['input']
  inputPlaceholder?: string
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
      mergeProps(baseInputProps as any, overrides as any),
  }

  const el = renderer({ value, onChange, bind })
  if (!isElementWithProp(el, 'data-action-menu-input')) {
    return (
      <input
        {...(bind.getInputProps({
          value,
          onChange: (e: any) => onChange(e.target.value),
        }) as any)}
      />
    )
  }
  return el as React.ReactElement
}

function ListView<T>({
  store,
  menu,
  renderers,
  classNames,

  query,
}: {
  store: SurfaceStore
  menu: MenuData<T>
  renderers: Renderers<T>
  classNames?: Partial<SlotClassNames>
  query?: string
}) {
  const localId = React.useId()
  const listId = useSurfaceSel(store, (s) => s.listId)
  const hasInput = useSurfaceSel(store, (s) => s.hasInput)
  const activeId = useSurfaceSel(store, (s) => s.activeId ?? undefined)
  const onKeyDown = useNavKeydown('list')

  React.useEffect(() => {
    const id = listId ?? `action-menu-list-${localId}`
    store.set('listId', id)
    return () => store.set('listId', null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    className: classNames?.list ?? {},
    onKeyDown,
  }
  const bind: ListBindAPI = {
    getListProps: (overrides) =>
      mergeProps(baseListProps as any, overrides as any),
  }

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
          out.push(...collect((n as GroupNode<T>).nodes, q, bc))
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
    // default render
    children = renderMenu<T>(menu, renderers, classNames, store)
  } else {
    children = (
      // biome-ignore lint/complexity/noUselessFragments: <explanation>
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
                renderer={renderers.item}
                store={store}
                search={searchCtx} // NEW (search)
                classNames={classNames}
              />
            )
          }
          // submenu result should behave like a real submenu
          const childMenu: MenuData<any> = {
            ...res.node,
          }

          return (
            <Sub key={`deep-${res.node.id}`}>
              <SubTriggerRow
                node={res.node}
                renderer={renderers.submenuTrigger as any}
                search={searchCtx} // NEW (search)
                classNames={classNames}
              />
              <SubmenuContent
                menu={childMenu}
                renderers={renderers as any}
                classNames={classNames}
              />
            </Sub>
          )
        })}
      </>
    )
  }

  const el = renderers.list({ children, bind })
  if (!isElementWithProp(el, 'data-action-menu-list')) {
    return <div {...(bind.getListProps() as any)}>{children}</div>
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
  renderers?: Partial<Renderers<T>>
  defaults?: {
    content?: Pick<
      ActionMenuContentProps<T>,
      'withInput' | 'vimBindings' | 'dir'
    >
  }
  classNames?: Partial<SlotClassNames>
}) {
  const baseRenderers = {
    ...defaultRenderers<T>(),
    ...(opts?.renderers as any),
  } as Renderers<T>
  const baseDefaults = opts?.defaults?.content ?? {}
  const baseClassNames = opts?.classNames ?? {}

  const ContentTyped = React.forwardRef<
    HTMLDivElement,
    ActionMenuContentProps<T>
  >(({ renderers, classNames, ...rest }, ref) => {
    const mergedRenderers = React.useMemo<Renderers<T>>(
      () => ({ ...baseRenderers, ...(renderers as any) }),
      [renderers],
    )
    const mergedClassNames = React.useMemo<Partial<SlotClassNames>>(
      () => ({
        ...baseClassNames,
        ...(classNames ?? {}),
      }),
      [classNames],
    )
    // Apply defaults for content-level options if not provided
    const withInput = rest.withInput ?? baseDefaults.withInput ?? true
    const vimBindings = rest.vimBindings ?? baseDefaults.vimBindings ?? true
    const dir = (rest.dir ?? baseDefaults.dir) as Direction | undefined

    return (
      <ContentBase<T>
        {...(rest as any)}
        withInput={withInput}
        vimBindings={vimBindings}
        dir={dir}
        renderers={mergedRenderers}
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
