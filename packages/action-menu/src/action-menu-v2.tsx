/** biome-ignore-all lint/a11y/useSemanticElements: This library renders ARIA-only primitives intentionally. */
import { composeEventHandlers } from '@radix-ui/primitive'
import { composeRefs } from '@radix-ui/react-compose-refs'
import { DismissableLayer } from '@radix-ui/react-dismissable-layer'
import * as Popper from '@radix-ui/react-popper'
import { Presence } from '@radix-ui/react-presence'
import { Primitive } from '@radix-ui/react-primitive'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'

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
export type SubmenuNode<TChild = unknown> = BaseNode<'submenu'> &
  Searchable &
  Renderable & {
    title?: string
    nodes: MenuNode<TChild>[]
  }

/** A menu surface carrying items with payload `T` */
export type MenuData<T = unknown> = {
  id: string
  title?: string
  nodes?: MenuNode<T>[]
}

/** Nodes that can appear on a surface with payload `T` */
export type MenuNode<T = unknown> =
  | ItemNode<T>
  | GroupNode<T>
  | SubmenuNode<any>

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

export type Renderers<T = unknown> = {
  /** Item renderer for nodes with payload `T`. */
  item: (args: { node: ItemNode<T>; bind: RowBindAPI }) => React.ReactNode
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
    merged.className = [base.className, (overrides as any).className]
      .filter(Boolean)
      .join(' ')
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
 * Keywobard context
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

function dispatch(node: HTMLElement | null | undefined, type: string) {
  if (!node) return
  node.dispatchEvent(new CustomEvent(type, { bubbles: true }))
}

function openSubmenuForActive(activeId: string | null) {
  console.log('called openSubmenuForActive', activeId)

  const el = activeId ? document.getElementById(activeId) : null
  if (el && (el as HTMLElement).dataset.subtrigger === 'true') {
    console.log('dispatching open-sub')
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
  parentSetActiveId: (id: string | null) => void
  childSurfaceId: string
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

type SurfaceStore = {
  subscribe(cb: () => void): () => void
  snapshot(): SurfaceState
  set<K extends keyof SurfaceState>(k: K, v: SurfaceState[K]): void

  registerRow(id: string, rec: RowRecord): void
  unregisterRow(id: string): void
  getOrder(): string[]

  setActiveId(id: string | null): void
  setActiveByIndex(idx: number): void
  first(): void
  last(): void
  next(): void
  prev(): void

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

  const emit = () => listeners.forEach((l) => l())

  const snapshot = () => state

  const set = <K extends keyof SurfaceState>(k: K, v: SurfaceState[K]) => {
    if (Object.is((state as any)[k], v)) return
    ;(state as any)[k] = v
    emit()
  }

  const getOrder = () => order.slice()

  const ensureActiveExists = () => {
    if (state.activeId && rows.has(state.activeId)) return
    state.activeId = order[0] ?? null
  }

  const setActiveId = (id: string | null) => {
    if (Object.is(state.activeId, id)) return
    state.activeId = id

    console.log('setting active id to', id)

    // Single-open submenu policy — close any submenu whose trigger isn’t active
    for (const [rid, rec] of rows) {
      if (rec.kind === 'submenu' && rec.closeSub && rid !== id) {
        try {
          rec.closeSub()
        } catch {}
      }
    }
    emit()
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

  const setActiveByIndex = (idx: number) => {
    if (!order.length) return setActiveId(null)
    const clamped = idx < 0 ? 0 : idx >= order.length ? order.length - 1 : idx
    setActiveId(order[clamped]!)
  }

  const first = () => setActiveByIndex(0)
  const last = () => setActiveByIndex(order.length - 1)

  const next = () => {
    if (!order.length) return setActiveId(null)
    const curr = state.activeId
    const i = curr ? order.indexOf(curr) : -1
    const n = i === -1 ? 0 : (i + 1) % order.length
    setActiveId(order[n]!)
  }

  const prev = () => {
    if (!order.length) return setActiveId(null)
    const curr = state.activeId
    const i = curr ? order.indexOf(curr) : 0
    const p = i <= 0 ? order.length - 1 : i - 1
    setActiveId(order[p]!)
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
      console.log('called keyboard nav')

      // Only the focus-owning surface handles keys.
      if (ownerId && ownerId !== surfaceId) return

      const k = e.key

      console.log('handling key', k)

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
}) => {
  const root = useRootCtx()
  const sub = useSubCtx()
  const { ownerId, setOwnerId } = React.useContext(FocusOwnerCtx)!

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

  // On submenu open, move ownership + focus to the child surface’s first widget
  React.useEffect(() => {
    if (!isSub || !sub!.open) return
    setOwnerId(sub!.childSurfaceId)
    const tryFocus = (attempt = 0) => {
      const content = sub!.contentRef.current as HTMLElement | null
      if (content) {
        const { input, list } = findWidgetsWithinSurface(content)
        console.log('here!', isSub)

        ;(input ?? list)?.focus()
        return
      }
      if (attempt < 5) requestAnimationFrame(() => tryFocus(attempt + 1))
    }
    requestAnimationFrame(() => tryFocus())
  }, [isSub, sub, setOwnerId, sub?.open])

  return (
    <Presence present={present}>
      <Popper.Content
        side={resolvedSide}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        avoidCollisions={avoidCollisions}
        collisionPadding={collisionPadding}
        asChild
      >
        <DismissableLayer
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
                    (parentSurface && target && parentSurface.contains(target))
                  ) {
                    event.preventDefault()
                  }
                }
              : undefined
          }
          asChild
        >
          {children}
        </DismissableLayer>
      </Popper.Content>
    </Presence>
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
}

type ActionMenuContentInternalProps<T = unknown> = ActionMenuContentProps<T> & {
  /** internal: allows SubmenuContent to pin the child surface id */
  surfaceIdProp?: string
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
    ...props
  }: ActionMenuContentInternalProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const root = useRootCtx()
  const sub = useSubCtx()
  const generatedId = React.useId()
  const surfaceId = surfaceIdProp ?? generatedId
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

  const baseContentProps = React.useMemo(
    () =>
      ({
        ref: composedRef,
        role: 'menu',
        tabIndex: -1,
        'data-slot': 'action-menu-content',
        'data-state': root.open ? 'open' : 'closed',
        'data-action-menu-surface': true as const,
        'data-surface-id': surfaceId,
        onMouseMove: (e: React.MouseEvent) => {
          const rect = surfaceRef.current?.getBoundingClientRect()
          if (!rect || !isInBounds(e.clientX, e.clientY, rect)) return
          setOwnerId(surfaceId)
        },
        ...props,
      }) as const,
    [composedRef, root.open, surfaceId, setOwnerId, props],
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
        />
      ) : null}
      <ListView<T> store={store} menu={menu} renderers={renderers} />
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
      <SurfaceIdCtx.Provider value={surfaceId}>{wrapped}</SurfaceIdCtx.Provider>
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
}: {
  node: SubmenuNode<T>
  renderer: Renderers<T>['submenuTrigger']
}) {
  const store = useSurface()
  const sub = useSubCtx()!
  const ref = React.useRef<HTMLElement | null>(null)

  // Register with surface as a 'submenu' kind, providing open/close callbacks
  React.useEffect(() => {
    console.log('registering row with id', node.id)
    store.registerRow(node.id, {
      ref: ref as any,
      disabled: false,
      kind: 'submenu',
      openSub: () => sub.onOpenChange(true),
      closeSub: () => sub.onOpenChange(false),
    })
    return () => store.unregisterRow(node.id)
  }, [store, node.id])

  // Open on custom event from the parent surface (old behavior)
  React.useEffect(() => {
    const nodeEl = ref.current
    if (!nodeEl) return
    const onOpen = () => {
      sub.onOpenChange(true)
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
  }, [sub])

  // Track which parent row opened the submenu so we can return focus on close
  React.useEffect(() => {
    if (sub.triggerItemId !== node.id) sub.setTriggerItemId(node.id)
    return () => {
      if (sub.triggerItemId === node.id) sub.setTriggerItemId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id])

  const activeId = useSurfaceSel(store, (s) => s.activeId)
  const focused = activeId === node.id

  React.useEffect(() => {
    console.log(
      JSON.stringify(
        {
          'node.id': node.id,
          activeId,
          focused,
        },
        null,
        '\t',
      ),
    )
  }, [activeId])

  const baseRowProps = React.useMemo(
    () =>
      ({
        id: node.id,
        ref: composeRefs(ref as any, sub.triggerRef as any),
        role: 'option' as const,
        tabIndex: -1,
        'data-action-menu-item-id': node.id,
        'data-focused': focused,
        'aria-selected': focused,
        'aria-disabled': false,
        'data-subtrigger': 'true',
        onPointerDown: (e: React.PointerEvent) => {
          if (e.button === 0 && e.ctrlKey === false) {
            e.preventDefault()
            sub.onOpenToggle()
          }
        },
        onMouseMove: () => {
          console.log('mouse move on', node.id)
          if (!focused) store.setActiveId(node.id)
        },
        onMouseEnter: () => {
          sub.onOpenChange(true)
          if (!focused) store.setActiveId(node.id)
        },
      }) as const,
    [node.id, focused, store, sub],
  )

  const bind: RowBindAPI = {
    focused,
    disabled: false,
    getRowProps: (overrides) =>
      mergeProps(baseRowProps as any, overrides as any),
  }

  const visual = renderer({ node, bind })

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
}: {
  menu: MenuData<T>
  renderers: Renderers<T>
}) {
  const sub = useSubCtx()!
  // Compose our content ref into the surface container to let Positioner focus it
  const content = (
    <ContentBase<T>
      menu={menu}
      renderers={renderers as any}
      surfaceIdProp={sub.childSurfaceId}
    />
  )

  return <Positioner side="right">{content as any}</Positioner>
}

/* =========================================================================== */
/* =============================== Rendering ================================= */
/* =========================================================================== */

function renderMenu<T>(
  menu: MenuData<T>,
  renderers: Renderers<T>,
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
              store={store}
            />
          )
        if (node.kind === 'group') {
          return (
            <div key={node.id} role="group" data-action-menu-group>
              {node.heading ? (
                <div data-action-menu-group-heading role="presentation">
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
                    />
                    <SubmenuContent
                      menu={{
                        id: child.id,
                        title: child.title ?? child.label,
                        nodes: child.nodes,
                      }}
                      renderers={renderers as any}
                    />
                  </Sub>
                )
              })}
            </div>
          )
        }
        if (node.kind === 'submenu') {
          const childMenu: MenuData<any> = {
            id: node.id,
            title: node.title ?? node.label,
            nodes: node.nodes,
          }
          return (
            <Sub key={node.id}>
              <SubTriggerRow
                node={node as SubmenuNode<any>}
                renderer={renderers.submenuTrigger as any}
              />
              <SubmenuContent menu={childMenu} renderers={renderers as any} />
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
  store,
}: {
  node: ItemNode<T>
  renderer: Renderers<T>['item']
  store: SurfaceStore
}) {
  const ref = React.useRef<HTMLElement | null>(null)

  // Register/unregister with surface
  React.useEffect(() => {
    store.registerRow(node.id, {
      ref: ref as any,
      disabled: false,
      kind: 'item',
    })
    return () => store.unregisterRow(node.id)
  }, [store, node.id])

  const activeId = useSurfaceSel(store, (s) => s.activeId)
  const focused = activeId === node.id

  const baseRowProps = React.useMemo(
    () =>
      ({
        id: node.id,
        ref: ref as any,
        role: 'option' as const,
        tabIndex: -1,
        'data-action-menu-item-id': node.id,
        'data-focused': focused,
        'aria-selected': focused,
        'aria-disabled': false,
        onPointerDown: (e: React.PointerEvent) => {
          // keep click semantics predictable
          if (e.button === 0 && e.ctrlKey === false) e.preventDefault()
        },
        onMouseMove: () => {
          if (!focused) store.setActiveId(node.id)
        },
        onClick: (e: React.MouseEvent) => {
          e.preventDefault()
          node.onSelect?.()
        },
      }) as const,
    [node.id, node.onSelect, focused, store],
  )

  const bind: RowBindAPI = {
    focused,
    disabled: false,
    getRowProps: (overrides) =>
      mergeProps(baseRowProps as any, overrides as any),
  }

  const visual = renderer({ node, bind })

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
}: {
  store: SurfaceStore
  value: string
  onChange: (v: string) => void
  renderer: Renderers<T>['input']
}) {
  const activeId = useSurfaceSel(store, (s) => s.activeId ?? undefined)
  const listId = useSurfaceSel(store, (s) => s.listId ?? undefined)
  const onKeyDown = useNavKeydown('input')

  const baseInputProps = {
    ref: store.inputRef as any,
    role: 'combobox' as const,
    'data-slot': 'action-menu-input' as const,
    'data-action-menu-input': true as const,
    'aria-autocomplete': 'list' as const,
    'aria-expanded': true as const,
    'aria-controls': listId,
    'aria-activedescendant': activeId,
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
}: {
  store: SurfaceStore
  menu: MenuData<T>
  renderers: Renderers<T>
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
    onKeyDown,
  }
  const bind: ListBindAPI = {
    getListProps: (overrides) =>
      mergeProps(baseListProps as any, overrides as any),
  }

  const children = renderMenu<T>(menu, renderers, store)
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
}) {
  const defaults = {
    ...defaultRenderers<T>(),
    ...(opts?.renderers as any),
  } as Renderers<T>

  const ContentTyped = React.forwardRef<
    HTMLDivElement,
    ActionMenuContentProps<T>
  >(({ renderers, ...rest }, ref) => {
    const merged = React.useMemo<Renderers<T>>(
      () => ({ ...defaults, ...(renderers as any) }),
      [renderers],
    )
    return <ContentBase<T> {...(rest as any)} renderers={merged} ref={ref} />
  })
  ContentTyped.displayName = 'ActionMenu.Content'

  return {
    Root,
    Trigger,
    Positioner,
    Content: ContentTyped,
  }
}
