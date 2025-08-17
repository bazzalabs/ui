/** biome-ignore-all lint/a11y/useSemanticElements: x */
/** biome-ignore-all lint/style/useSingleVarDeclarator: x */
/** biome-ignore-all lint/a11y/useAriaPropsSupportedByRole: x */

/**
 * ActionMenu — simplified, keyboard-solid version.
 * - Centralized key handling with cmdk-like helpers (first/last/next/prev).
 * - Direction-aware open/close (LTR/RTL) + Vim bindings (Ctrl+N/P, Ctrl+J/K).
 * - ArrowRight opens submenu, ArrowLeft closes (mirrored under RTL).
 * - Back-nav restores parent selection and focus to the triggering row.
 */

import { composeEventHandlers } from '@radix-ui/primitive'
import { composeRefs } from '@radix-ui/react-compose-refs'
import { DismissableLayer } from '@radix-ui/react-dismissable-layer'
import * as Popper from '@radix-ui/react-popper'
import { Presence } from '@radix-ui/react-presence'
import { Primitive } from '@radix-ui/react-primitive'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import { commandScore } from './command-score.js'

/* ================================================================================================
 * General purpose types
 * ============================================================================================== */

type DivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>
type InputProps = React.ComponentPropsWithoutRef<typeof Primitive.input>
type ButtonProps = React.ComponentPropsWithoutRef<typeof Primitive.button>

/* ================================================================================================
 * Key maps & helpers
 * ============================================================================================== */

const SELECT_EVENT = 'actionmenu-item-select' as const

function dispatchSelect(el: HTMLElement | null) {
  if (!el) return
  el.dispatchEvent(new CustomEvent(SELECT_EVENT, { bubbles: true }))
}

export type Direction = 'ltr' | 'rtl'

const SELECTION_KEYS = ['Enter'] as const
const FIRST_KEYS = ['ArrowDown', 'PageUp', 'Home'] as const
const LAST_KEYS = ['ArrowUp', 'PageDown', 'End'] as const

const SUB_OPEN_KEYS: Record<Direction, readonly string[]> = {
  ltr: [...SELECTION_KEYS, 'ArrowRight'],
  rtl: [...SELECTION_KEYS, 'ArrowLeft'],
}
const SUB_CLOSE_KEYS: Record<Direction, readonly string[]> = {
  ltr: ['ArrowLeft'],
  rtl: ['ArrowRight'],
}

const isSelectionKey = (k: string) =>
  (SELECTION_KEYS as readonly string[]).includes(k)
const isFirstKey = (k: string) => (FIRST_KEYS as readonly string[]).includes(k)
const isLastKey = (k: string) => (LAST_KEYS as readonly string[]).includes(k)
const isOpenKey = (dir: Direction, k: string) => SUB_OPEN_KEYS[dir].includes(k)
const isCloseKey = (dir: Direction, k: string) =>
  SUB_CLOSE_KEYS[dir].includes(k)

const isVimNext = (e: React.KeyboardEvent) =>
  e.ctrlKey && (e.key === 'n' || e.key === 'j')
const isVimPrev = (e: React.KeyboardEvent) =>
  e.ctrlKey && (e.key === 'p' || e.key === 'k')

const getDir = (explicit?: Direction): Direction => {
  if (explicit) return explicit
  if (typeof document !== 'undefined') {
    const d = document?.dir?.toLowerCase()
    if (d === 'rtl' || d === 'ltr') return d
  }
  return 'ltr'
}

const normalize = (s: string) => s.toLowerCase().trim()

function dispatch(node: HTMLElement | null | undefined, type: string) {
  if (!node) return
  node.dispatchEvent(new CustomEvent(type, { bubbles: true }))
}

function openSubmenuForActive(activeId: string | null) {
  const el = activeId ? document.getElementById(activeId) : null
  if (el && el.dataset.subtrigger === 'true')
    dispatch(el, 'actionmenu-open-sub')
}

function isInBounds(x: number, y: number, rect: DOMRect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

function isActiveRowSubTrigger(activeId: string | null) {
  if (!activeId) return false
  return document.getElementById(activeId)?.dataset.subtrigger === 'true'
}

function inputCaretAtBackBoundary(
  input: HTMLInputElement,
  dir: Direction,
): boolean {
  // In LTR: caret at start = "back"
  // In RTL: caret at end   = "back"
  const start = input.selectionStart ?? 0
  const end = input.selectionEnd ?? 0
  if (dir === 'ltr') return start === 0 && end === 0
  const L = input.value?.length ?? 0
  return start === L && end === L
}

function useLayoutScheduler() {
  const [, bump] = React.useState(0)
  const queueRef = React.useRef<Map<string | number, () => void>>(new Map())
  React.useLayoutEffect(() => {
    const fns = Array.from(queueRef.current.values())
    queueRef.current.clear()
    for (const fn of fns) fn()
  })
  return (id: string | number, fn: () => void) => {
    queueRef.current.set(id, fn) // dedupe by id
    bump((i) => i + 1)
  }
}

export type FilterFn = (
  value: string,
  search: string,
  keywords?: string[],
) => number

const defaultFilter: FilterFn = (value, search, keywords = []) =>
  commandScore(value, search, keywords)

function relativeBreadcrumbs(
  rec: { breadcrumb: string[] },
  fromScopeId: string,
  recScopePath: string[],
  valueStr: string,
) {
  // slice breadcrumb from the first occurrence of fromScopeId (if present)
  const idx = recScopePath.lastIndexOf(fromScopeId)
  const base = idx >= 0 ? rec.breadcrumb.slice(idx) : rec.breadcrumb
  // include the leaf as the last segment
  return [...base, valueStr]
}

// =========================================
// Row context (no DOM) + public hook
// =========================================
export type RowCtx = {
  mode: 'browse' | 'search'
  breadcrumbs: string[] // context-aware (relative to the current list)
  query: string
  score: number
  focused: boolean
  disabled: boolean
}

const RowCtx = React.createContext<RowCtx | null>(null)

/** Read the current row presentation context (local vs search, breadcrumbs, focus, etc.) */
export function useRow(): RowCtx {
  const ctx = React.useContext(RowCtx)
  if (!ctx) throw new Error('useRow() must be used inside an ActionMenu row')
  return ctx
}

/* ================================================================================================
 * Search Registry
 * ============================================================================================== */

export type ItemRecord = {
  kind: 'item'
  id: string
  valueStr: string // from props.value (stringified)
  keywords?: string[]
  breadcrumb: string[] // ancestors only
  scopePath: string[]
  ownerScopeId: string
  perform: () => void
  searchText: string // built from breadcrumb + value + keywords
  render: () => React.ReactNode
  rowClassName?: string
}

export type SubmenuRecord = {
  kind: 'submenu'
  id: string
  valueStr: string // from props.value (stringified)
  breadcrumb: string[] // includes the submenu title as leaf
  scopePath: string[]
  ownerScopeId: string
  searchText: string
  renderInline: () => React.ReactNode
  rowClassName?: string
}

export type SearchRecord = ItemRecord | SubmenuRecord

type Registry = {
  items: Map<string, SearchRecord>
  byScope: Map<string, Set<string>>
}

const Ctx = React.createContext<{
  reg: Registry
  upsert(r: SearchRecord): void
  remove(id: string): void
  version: number
} | null>(null)

export function SearchRegistryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const regRef = React.useRef<Registry>({
    items: new Map(),
    byScope: new Map(),
  })
  const [version, setVersion] = React.useState(0)

  const upsert = React.useCallback((r: SearchRecord) => {
    const reg = regRef.current
    const prev = reg.items.get(r.id)
    if (prev)
      for (const s of prev.scopePath) reg.byScope.get(s)?.delete(prev.id)
    reg.items.set(r.id, r)
    for (const s of r.scopePath)
      (reg.byScope.get(s) ?? reg.byScope.set(s, new Set()).get(s))!.add(r.id)
    setVersion((v) => v + 1)
  }, [])

  const remove = React.useCallback((id: string) => {
    const reg = regRef.current
    const rec = reg.items.get(id)
    if (!rec) return
    reg.items.delete(id)
    for (const s of rec.scopePath) reg.byScope.get(s)?.delete(id)
    setVersion((v) => v + 1)
  }, [])

  return (
    <Ctx.Provider
      value={{ reg: regRef.current, upsert, remove, version } as any}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useSearchRegistry() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('Missing SearchRegistryProvider')
  return ctx
}

export function useScopedSearch(scopeId: string, query: string) {
  const { reg, version } = useSearchRegistry() as any
  const q = query.toLowerCase().trim()
  return React.useMemo(() => {
    if (!q) return [] as SearchRecord[]
    const ids = reg.byScope.get(scopeId)
    if (!ids) return []
    return Array.from(ids)
      .map((id) => reg.items.get(id)!)
      .map((rec) => ({
        rec,
        score: commandScore(
          rec.searchText,
          q,
          'keywords' in rec ? (rec.keywords ?? []) : [],
        ),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => ({ ...x.rec, score: x.score, query: q }) as any)
  }, [scopeId, q, reg, version])
}

export type Scope = {
  scopeId: string
  breadcrumb: string[]
  scopePath: string[]
}
const ScopeCtx = React.createContext<Scope>({
  scopeId: 'root',
  breadcrumb: [],
  scopePath: [],
})
export const useScope = () => React.useContext(ScopeCtx)

export function ScopeProvider({
  scopeId,
  title,
  children,
}: {
  scopeId: string
  title?: string
  children: React.ReactNode
}) {
  const parent = useScope()
  const value = React.useMemo<Scope>(
    () => ({
      scopeId,
      breadcrumb: title ? [...parent.breadcrumb, title] : parent.breadcrumb,
      scopePath: [...parent.scopePath, scopeId],
    }),
    [parent.breadcrumb, parent.scopePath, scopeId, title],
  )

  return <ScopeCtx.Provider value={value}>{children}</ScopeCtx.Provider>
}

/* ================================================================================================
 * Indexing
 * ============================================================================================== */

const IndexingCtx = React.createContext(false)
const useIndexing = () => React.useContext(IndexingCtx)

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

/** Surface id so children know which surface they belong to (for focus back-navigation) */
const SurfaceCtx = React.createContext<string | null>(null)
const useSurfaceId = () => React.useContext(SurfaceCtx)

/* ================================================================================================
 * Collection context (owned by each Content/SubContent)
 * ============================================================================================== */

type RegisteredItem = {
  id: string
  value: string
  keywords?: string[]
  ref: React.RefObject<HTMLDivElement | null>
  groupId?: string | null
}

type RegisteredGroup = {
  id: string
  label?: string
  ref: React.RefObject<HTMLDivElement | null>
}

type CollectionContextValue = {
  query: string
  setQuery: (q: string) => void

  registerItem: (item: RegisteredItem) => void
  unregisterItem: (id: string) => void
  registerGroup: (group: RegisteredGroup) => void
  unregisterGroup: (id: string) => void

  getVisibleItemIds: () => string[]
  isItemVisible: (id: string) => boolean

  // cmdk-like helpers
  activeId: string | null
  setActiveId: (id: string | null) => void
  setActiveByIndex: (index: number) => void
  first: () => void
  last: () => void
  next: () => void
  prev: () => void
  clickActive: () => void

  inputPresent: boolean
  setInputPresent: (present: boolean) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  listRef: React.RefObject<HTMLDivElement | null>

  listId: string | null
  setListId: (id: string | null) => void
}

const CollectionCtx = React.createContext<CollectionContextValue | null>(null)
const useCollection = () => {
  const ctx = React.useContext(CollectionCtx)
  if (!ctx)
    throw new Error(
      'ActionMenu components must be inside Content or SubContent',
    )
  return ctx
}

function useCollectionState({
  filterFn = defaultFilter,
}: {
  filterFn?: FilterFn
}): CollectionContextValue {
  const schedule = useLayoutScheduler()

  const [query, setQuery] = React.useState('')
  const itemsRef = React.useRef<Map<string, RegisteredItem>>(new Map())
  const groupsRef = React.useRef<Map<string, RegisteredGroup>>(new Map())
  const groupOrderRef = React.useRef<string[]>([]) // insertion order for groups
  const [activeId, setActiveId] = React.useState<string | null>(null)

  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const [inputPresent, setInputPresent] = React.useState(false)
  const [listId, setListId] = React.useState<string | null>(null)

  const normQuery = normalize(query)

  const getVisibleItemIds = React.useCallback(() => {
    const items = Array.from(itemsRef.current.values())
    if (!query) return items.map((i) => i.id) // keep original order when no query

    const scored = items
      .map((i) => ({
        id: i.id,
        score: filterFn(i.value, query, i.keywords),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)

    return scored.map((s) => s.id)
  }, [query, filterFn])

  const ensureValidActive = React.useCallback(() => {
    const visible = getVisibleItemIds()
    setActiveId((curr) => {
      if (curr && itemsRef.current.has(curr) && visible.includes(curr))
        return curr
      return visible[0] ?? null
    })
  }, [getVisibleItemIds])

  const isItemVisible = React.useCallback(
    (id: string) => getVisibleItemIds().includes(id),
    [getVisibleItemIds],
  )

  const setActiveByIndex = React.useCallback(
    (index: number) => {
      const visible = getVisibleItemIds()
      if (visible.length === 0) {
        setActiveId(null)
        return
      }
      const clamped =
        index < 0 ? 0 : index >= visible.length ? visible.length - 1 : index
      setActiveId(visible[clamped]!)
    },
    [getVisibleItemIds],
  )

  const first = React.useCallback(() => {
    const visible = getVisibleItemIds()
    setActiveId(visible[0] ?? null)
  }, [getVisibleItemIds])

  const last = React.useCallback(() => {
    const visible = getVisibleItemIds()
    setActiveId(visible.length ? visible[visible.length - 1]! : null)
  }, [getVisibleItemIds])

  const next = React.useCallback(() => {
    const visible = getVisibleItemIds()
    if (!visible.length) return setActiveId(null)
    const idx = activeId ? visible.indexOf(activeId) : -1
    const nextIndex = idx === -1 ? 0 : (idx + 1) % visible.length
    setActiveId(visible[nextIndex]!)
  }, [activeId, getVisibleItemIds])

  const prev = React.useCallback(() => {
    const visible = getVisibleItemIds()
    if (!visible.length) return setActiveId(null)
    const idx = activeId ? visible.indexOf(activeId) : 0
    const prevIndex = idx <= 0 ? visible.length - 1 : idx - 1
    setActiveId(visible[prevIndex]!)
  }, [activeId, getVisibleItemIds])

  const clickActive = React.useCallback(() => {
    if (!activeId) return
    itemsRef.current.get(activeId)?.ref.current?.click()
  }, [activeId])

  const registerItem = React.useCallback((item: RegisteredItem) => {
    itemsRef.current.set(item.id, item)
    // After all items from this commit register, pick a valid active.
    schedule('items:reconcile', ensureValidActive)
  }, [])
  const unregisterItem = React.useCallback((id: string) => {
    itemsRef.current.delete(id)
    schedule('items:reconcile', ensureValidActive)
  }, [])

  const registerGroup = React.useCallback((g: RegisteredGroup) => {
    groupsRef.current.set(g.id, g)
    if (!groupOrderRef.current.includes(g.id)) {
      groupOrderRef.current.push(g.id)
    }
  }, [])
  const unregisterGroup = React.useCallback((id: string) => {
    groupsRef.current.delete(id)
    groupOrderRef.current = groupOrderRef.current.filter((gid) => gid !== id)
  }, [])

  React.useEffect(() => {
    schedule('query:reconcile', ensureValidActive)
  }, [normQuery, getVisibleItemIds])

  return {
    query,
    setQuery,
    registerItem,
    unregisterItem,
    registerGroup,
    unregisterGroup,
    getVisibleItemIds,
    isItemVisible,
    activeId,
    setActiveId,
    setActiveByIndex,
    first,
    last,
    next,
    prev,
    clickActive,
    inputPresent,
    setInputPresent,
    inputRef,
    listRef,
    listId,
    setListId,
  }
}

//

const NOOP = () => {}
const refNull = { current: null as any }

const noopValue = {
  query: '',
  setQuery: NOOP,
  registerItem: NOOP,
  unregisterItem: NOOP,
  registerGroup: NOOP,
  unregisterGroup: NOOP,
  getVisibleItemIds: () => [] as string[],
  isItemVisible: () => false,
  activeId: null as string | null,
  setActiveId: NOOP,
  setActiveByIndex: NOOP,
  first: NOOP,
  last: NOOP,
  next: NOOP,
  prev: NOOP,
  clickActive: NOOP,
  inputPresent: false,
  setInputPresent: NOOP,
  inputRef: refNull,
  listRef: refNull,
  listId: null as string | null,
  setListId: NOOP,
}

export function NoopCollectionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CollectionCtx.Provider value={noopValue as any}>
      {children}
    </CollectionCtx.Provider>
  )
}

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
 * Keyboard options context (dir + vim)
 * ============================================================================================== */

type KeyboardOptions = { dir: Direction; vimBindings: boolean }
const KeyboardCtx = React.createContext<KeyboardOptions>({
  dir: 'ltr',
  vimBindings: true,
})
const useKeyboardOpts = () => React.useContext(KeyboardCtx)

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
          <SearchRegistryProvider>
            <ScopeProvider scopeId="root">
              <Popper.Root>
                <Primitive.div ref={ref} {...props}>
                  {children}
                </Primitive.div>
              </Popper.Root>
            </ScopeProvider>
          </SearchRegistryProvider>
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
 * Content (surface + provider for collection state)
 * ============================================================================================== */

export interface ActionMenuContentProps extends Omit<DivProps, 'dir'> {
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  collisionPadding?:
    | number
    | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  closeOnAnchorPointerDown?: boolean
  dir?: Direction
  vimBindings?: boolean
  filterFn?: FilterFn
}

export const Content = React.forwardRef<HTMLDivElement, ActionMenuContentProps>(
  (
    {
      children,
      side = 'bottom',
      align = 'start',
      sideOffset = 6,
      alignOffset = 0,
      avoidCollisions = true,
      collisionPadding = 8,
      closeOnAnchorPointerDown = false,
      dir: dirProp,
      vimBindings = true,
      filterFn,
      ...props
    },
    ref,
  ) => {
    const root = useRootCtx()
    const surfaceId = React.useId()
    const collectionValue = useCollectionState({
      filterFn: filterFn ?? defaultFilter,
    })
    const { ownerId, setOwnerId } = useFocusOwner()
    const isOwner = ownerId === surfaceId
    const surfaceRef = React.useRef<HTMLDivElement | null>(null)
    const composedRef = composeRefs(ref, surfaceRef)
    const dir = getDir(dirProp)

    React.useEffect(() => {
      // If root is closed, reset ownerId and activeId
      if (!root.open) {
        setOwnerId(null)
        collectionValue.setActiveId(null)
        return
      }

      // If root is open and ownerId is null, set ownerId and focus the surface
      if (root.open && ownerId === null) {
        setOwnerId(surfaceId)
        ;(
          collectionValue.inputRef.current ?? collectionValue.listRef.current
        )?.focus()
      }
    }, [root.open, ownerId, surfaceId, setOwnerId])

    React.useEffect(() => {
      if (!root.open || !isOwner) return
      const id = requestAnimationFrame(() => {
        ;(
          collectionValue.inputRef.current ?? collectionValue.listRef.current
        )?.focus()
        // if (!collectionValue.activeId) collectionValue.first()
      })
      return () => cancelAnimationFrame(id)
    }, [root.open, isOwner, collectionValue.inputPresent])

    return (
      <SurfaceCtx.Provider value={surfaceId}>
        <KeyboardCtx.Provider value={{ dir, vimBindings }}>
          <Presence present={root.open}>
            <Popper.Content
              side={side}
              align={align}
              sideOffset={sideOffset}
              alignOffset={alignOffset}
              avoidCollisions={avoidCollisions}
              collisionPadding={collisionPadding}
              asChild
            >
              <DismissableLayer
                onEscapeKeyDown={() => root.onOpenChange(false)}
                onDismiss={() => root.onOpenChange(false)}
                disableOutsidePointerEvents={root.modal}
                onInteractOutside={(event) => {
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
                }}
                asChild
              >
                <Primitive.div
                  {...props}
                  ref={composedRef}
                  role="menu"
                  tabIndex={-1}
                  data-slot="action-menu-content"
                  data-state={root.open ? 'open' : 'closed'}
                  data-action-menu-surface
                  data-surface-id={surfaceId}
                  data-dir={dir}
                  onMouseMove={(e) => {
                    const rect = surfaceRef.current?.getBoundingClientRect()
                    if (!rect || !isInBounds(e.clientX, e.clientY, rect)) return
                    setOwnerId(surfaceId)
                  }}
                >
                  <CollectionCtx.Provider value={collectionValue}>
                    {children}
                  </CollectionCtx.Provider>
                </Primitive.div>
              </DismissableLayer>
            </Popper.Content>
          </Presence>
        </KeyboardCtx.Provider>
      </SurfaceCtx.Provider>
    )
  },
)
Content.displayName = 'ActionMenu.Content'

/* ================================================================================================
 * Unified menu key handling (used by Input & List)
 * ============================================================================================== */

function useMenuKeydown(source: 'input' | 'list') {
  const {
    activeId,
    first,
    last,
    next,
    prev,
    clickActive,
    getVisibleItemIds,
    setActiveId,
    inputPresent,
  } = useCollection()
  const root = useRootCtx()
  const { setOwnerId } = useFocusOwner()
  const sub = React.useContext(SubCtx) as SubContextValue | null
  const { dir, vimBindings } = useKeyboardOpts()

  return React.useCallback(
    (e: React.KeyboardEvent) => {
      const k = e.key

      // Vim binds
      if (vimBindings) {
        if (isVimNext(e)) {
          e.preventDefault()
          next()
          return
        }
        if (isVimPrev(e)) {
          e.preventDefault()
          prev()
          return
        }
      }

      // Keep focus trapped
      if ((source === 'list' || !inputPresent) && k === 'Tab') {
        e.preventDefault()
        return
      }

      if (k === 'ArrowDown') {
        e.preventDefault()
        next()
        return
      }
      if (k === 'ArrowUp') {
        e.preventDefault()
        prev()
        return
      }

      if (isFirstKey(k)) {
        e.preventDefault()
        first()
        return
      }
      if (isLastKey(k)) {
        e.preventDefault()
        last()
        return
      }

      // Open / Select
      if (isOpenKey(dir, k)) {
        e.preventDefault()
        if (isSelectionKey(k)) {
          // If the active row is a subtrigger, open it; else "select" the item
          if (isActiveRowSubTrigger(activeId)) {
            openSubmenuForActive(activeId)
          } else {
            const el = activeId ? document.getElementById(activeId) : null
            dispatchSelect(el)
          }
        } else {
          openSubmenuForActive(activeId)
        }
        return
      }

      // Close / Back
      if (isCloseKey(dir, k)) {
        // In Input, only back out if caret is at the "back" boundary
        if (source === 'input') {
          const t = e.currentTarget as HTMLInputElement
          if (!inputCaretAtBackBoundary(t, dir)) return
        }
        e.preventDefault()
        e.stopPropagation()

        if (sub) {
          sub.onOpenChange(false)
          sub.parentSetActiveId(sub.triggerItemId)
          setOwnerId(sub.parentSurfaceId)
          const parentEl = document.querySelector<HTMLElement>(
            `[data-surface-id="${sub.parentSurfaceId}"]`,
          )
          requestAnimationFrame(() => {
            const parentInput = parentEl?.querySelector<HTMLInputElement>(
              '[data-action-menu-input]',
            )
            const parentList = parentEl?.querySelector<HTMLElement>(
              '[data-action-menu-list]',
            )
            ;(parentInput ?? parentList)?.focus()
          })
        } else {
          // At root: close and return focus to trigger
          // root.onOpenChange(false)
          requestAnimationFrame(() => root.anchorRef.current?.focus())
        }
        return
      }

      // Enter (selection when not captured by open-key case above)
      if (k === 'Enter') {
        e.preventDefault()
        const el = activeId ? document.getElementById(activeId) : null
        dispatchSelect(el)
        return
      }

      // Keep aria-activedescendant in sync when typing in Input
      if (source === 'input' && k.length === 1) {
        // typeahead occurs via onChange; ensure active is first visible
        const ids = getVisibleItemIds()
        setActiveId(ids[0] ?? null)
      }
    },
    [
      source,
      dir,
      vimBindings,
      inputPresent,
      next,
      prev,
      first,
      last,
      clickActive,
      activeId,
      getVisibleItemIds,
      setActiveId,
      root,
      setOwnerId,
      sub,
    ],
  )
}

/* ================================================================================================
 * Input (keyboard nav + filtering)
 * ============================================================================================== */

export interface ActionMenuInputProps extends InputProps {
  autoSelect?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, ActionMenuInputProps>(
  ({ autoSelect = false, onChange, onKeyDown, ...props }, ref) => {
    const indexing = useIndexing()
    const {
      setQuery,
      query,
      getVisibleItemIds,
      setActiveId,
      activeId,
      setInputPresent,
      inputRef,
      listId,
    } = useCollection()

    const localRef = React.useRef<HTMLInputElement | null>(null)
    const composedRef = composeRefs(ref, localRef, inputRef as any)
    const handleKeys = useMenuKeydown('input')

    React.useEffect(() => {
      setInputPresent(true)
      return () => setInputPresent(false)
    }, [setInputPresent])

    React.useEffect(() => {
      if (localRef.current && autoSelect) {
        const id = requestAnimationFrame(() => {
          try {
            localRef.current?.select()
          } catch {}
        })
        return () => cancelAnimationFrame(id)
      }
    }, [autoSelect])

    if (indexing) return null

    return (
      <Primitive.input
        {...props}
        ref={composedRef}
        role="combobox"
        data-slot="action-menu-input"
        aria-controls={listId ?? undefined}
        aria-autocomplete="list"
        aria-expanded={true}
        aria-activedescendant={activeId ?? undefined}
        data-action-menu-input
        value={props.value ?? query}
        onChange={composeEventHandlers(onChange as any, (e) => {
          const next = (e.target as HTMLInputElement).value
          setQuery(next)
          const ids = getVisibleItemIds()
          setActiveId(ids[0] ?? null)
        })}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeys)}
      />
    )
  },
)
Input.displayName = 'ActionMenu.Input'

/* ================================================================================================
 * List + Group + Item
 * ============================================================================================== */

export interface ActionMenuListProps extends DivProps {}

export const List = React.forwardRef<HTMLDivElement, ActionMenuListProps>(
  ({ children, onKeyDown, id, ...props }, ref) => {
    const { activeId, listRef, setListId, query } = useCollection()
    const { scopeId } = useScope()
    const results = useScopedSearch(scopeId, query) // SearchRecord[]
    const localId = React.useId()
    const listDomId = id ?? `action-menu-list-${localId}`
    const handleKeys = useMenuKeydown('list')

    React.useEffect(() => {
      setListId(listDomId)
      return () => setListId(null)
    }, [listDomId, setListId])

    // Only show descendants in the deep section.
    // - Items: local if their last scopePath segment === scopeId
    // - Submenus: local if their ownerScopeId === scopeId (the scope where the SubTrigger lives)
    const deepResults = React.useMemo(() => {
      if (!query) return []
      return results.filter((r) => {
        if (r.kind === 'item') {
          const last = r.scopePath[r.scopePath.length - 1]
          return last !== scopeId
        }
        // r.kind === 'submenu'
        return r.ownerScopeId !== scopeId
      })
    }, [results, query, scopeId])

    const deepSection = query
      ? deepResults.map((r: any) => {
          // Build context-aware breadcrumbs (relative to THIS list's scope)
          const crumbs = relativeBreadcrumbs(
            r,
            scopeId,
            r.scopePath,
            r.valueStr,
          )
          const rowBase: RowCtx = {
            mode: 'search',
            breadcrumbs: crumbs,
            query,
            score: r.score ?? 0,
            focused: false, // Item will overwrite with live focus
            disabled: false, // Item will overwrite
          }

          if (r.kind === 'submenu') {
            // Render the real SubTrigger row for submenu hits
            return (
              <RowCtx.Provider key={r.id} value={rowBase}>
                {r.renderInline()}
              </RowCtx.Provider>
            )
          }

          // r.kind === 'item'
          return (
            <RowCtx.Provider key={r.id} value={rowBase}>
              <Item
                className={r.rowClassName}
                value={r.valueStr}
                onSelect={r.perform}
              >
                {r.render()}
              </Item>
            </RowCtx.Provider>
          )
        })
      : null

    return (
      <Primitive.div
        {...props}
        id={listDomId}
        ref={composeRefs(ref, listRef)}
        data-action-menu-list
        role="listbox"
        tabIndex={-1}
        aria-activedescendant={activeId ?? undefined}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeys)}
      >
        {/* Local items render normally (your original subtree), even while searching */}
        {children}
        {/* Deep (descendant) hits appended when a query is present */}
        {deepSection}
      </Primitive.div>
    )
  },
)
List.displayName = 'ActionMenu.List'

export interface ActionMenuGroupProps extends DivProps {
  id?: string
  label?: string
}

export const Group = React.forwardRef<HTMLDivElement, ActionMenuGroupProps>(
  ({ id, label, children, ...props }, ref) => {
    const generatedId = React.useId()
    const groupId = id ?? `action-menu-group-${generatedId}`
    const groupRef = React.useRef<HTMLDivElement | null>(null)
    const { registerGroup, unregisterGroup, getVisibleItemIds } =
      useCollection()

    React.useEffect(() => {
      registerGroup({ id: groupId, label, ref: groupRef })
      return () => unregisterGroup(groupId)
    }, [groupId, label, registerGroup, unregisterGroup])

    const [hasVisibleChildren, setHasVisibleChildren] = React.useState(true)
    React.useEffect(() => {
      const frame = requestAnimationFrame(() => {
        const visible = new Set(getVisibleItemIds())
        const el = groupRef.current
        if (!el) return
        const items = Array.from(
          el.querySelectorAll<HTMLElement>('[data-action-menu-item-id]'),
        )
        const anyVisible = items.some((n) =>
          visible.has(n.dataset.actionMenuItemId || ''),
        )
        setHasVisibleChildren(anyVisible)
      })
      return () => cancelAnimationFrame(frame)
    })

    return (
      <Primitive.div
        {...props}
        ref={composeRefs(ref, groupRef)}
        role="group"
        data-slot="action-menu-group"
        data-action-menu-group
        aria-label={label}
        hidden={!hasVisibleChildren}
      >
        {label ? <div role="presentation">{label}</div> : null}
        {children}
      </Primitive.div>
    )
  },
)
Group.displayName = 'ActionMenu.Group'

export interface ActionMenuItemProps
  extends Omit<DivProps, 'value' | 'onSelect' | 'children'> {
  onSelect?: (value: string) => void
  value: string
  keywords?: string[]
  id?: string
  disabled?: boolean
  groupId?: string | null
  children?: React.ReactNode
}

export const Item = React.forwardRef<HTMLDivElement, ActionMenuItemProps>(
  (props, ref) => {
    const {
      children,
      value,
      keywords,
      id,
      disabled,
      onClick,
      onSelect,
      onKeyDown,
      onPointerDown,
      onMouseDown,
      groupId,
      className,
      ...rest
    } = props

    const onSelectRef = React.useRef<typeof onSelect>(null)
    React.useLayoutEffect(() => {
      onSelectRef.current = onSelect
    }, [onSelect])

    const generatedId = React.useId()
    const itemId = id ?? `action-menu-item-${generatedId}`
    const itemRef = React.useRef<HTMLDivElement | null>(null)
    const composedRef = composeRefs(ref, itemRef)

    const indexing = useIndexing()
    const { breadcrumb: scopeBreadcrumb, scopePath } = useScope()
    const { upsert, remove } = useSearchRegistry()

    // --- Register into search (unchanged) ---
    React.useLayoutEffect(() => {
      if (disabled) return
      const valueStr = String(value)
      const searchText = [...scopeBreadcrumb, valueStr, ...(keywords ?? [])]
        .join(' ')
        .toLowerCase()

      const rec: ItemRecord = {
        kind: 'item',
        id: `${scopePath.join('/')}::${valueStr}`,
        valueStr,
        keywords,
        breadcrumb: [...scopeBreadcrumb],
        scopePath,
        ownerScopeId: scopePath[scopePath.length - 1]!,
        perform: () => onSelectRef.current?.(valueStr),
        searchText,
        render: () => children as React.ReactNode,
        rowClassName: className,
      }

      const { rowClassName, ...rest } = rec

      console.log(
        JSON.stringify(
          {
            ...rest,
          },
          null,
          '\t',
        ),
      )

      upsert(rec)
      return () => remove(rec.id)
    }, [
      disabled,
      scopeBreadcrumb.join('>'),
      scopePath.join('>'),
      value,
      (keywords ?? []).join('|'),
      upsert,
      remove,
      className,
    ])

    const {
      registerItem,
      unregisterItem,
      isItemVisible,
      activeId,
      setActiveId,
      query,
    } = useCollection()

    React.useLayoutEffect(() => {
      if (indexing) return
      registerItem({
        id: itemId,
        value: String(value),
        keywords,
        ref: itemRef,
        groupId: groupId ?? null,
      })
      return () => unregisterItem(itemId)
    }, [
      indexing,
      itemId,
      registerItem,
      unregisterItem,
      value,
      keywords,
      groupId,
    ])

    const visible = isItemVisible(itemId)
    const focused = activeId === itemId

    React.useEffect(() => {
      const node = itemRef.current
      if (!node || disabled) return
      const handleSelect = () => {
        if (disabled || !visible) return
        if (!focused) setActiveId(itemId)
        onSelect?.(String(value))
        const surface = node.closest<HTMLElement>('[data-action-menu-surface]')
        const input = surface?.querySelector<HTMLInputElement>(
          '[data-action-menu-input]',
        )
        const list = surface?.querySelector<HTMLElement>(
          '[data-action-menu-list]',
        )
        ;(input ?? list)?.focus()
      }
      node.addEventListener(SELECT_EVENT, handleSelect as EventListener)
      return () =>
        node.removeEventListener(SELECT_EVENT, handleSelect as EventListener)
    }, [disabled, itemId, value, onSelect, visible, focused, setActiveId])

    // ---------- ALWAYS build row context FIRST ----------
    const parentRow = React.useContext(RowCtx)
    const row: RowCtx = React.useMemo(
      () => ({
        mode: parentRow?.mode ?? 'browse',
        breadcrumbs: parentRow?.breadcrumbs ?? [],
        query: parentRow?.query ?? query,
        score: parentRow?.score ?? 0,
        focused,
        disabled: !!disabled,
      }),
      [
        parentRow?.mode,
        parentRow?.breadcrumbs?.join('>'),
        parentRow?.query,
        parentRow?.score,
        focused,
        disabled,
        query,
      ],
    )

    // ---------- Indexing mirror path (no DOM), but WITH RowCtx ----------
    if (indexing) {
      return <RowCtx.Provider value={row}>{children}</RowCtx.Provider>
    }

    // ---------- Normal DOM row ----------
    return (
      <Primitive.div
        {...rest}
        className={className}
        ref={composedRef}
        role="option"
        data-role="option"
        data-slot="action-menu-item"
        action-menu-option
        aria-selected={focused || undefined}
        aria-disabled={disabled || undefined}
        data-action-menu-item-id={itemId}
        data-focused={focused ? 'true' : 'false'}
        hidden={!visible}
        id={itemId}
        onMouseMove={() => {
          if (visible && !disabled && !focused) setActiveId(itemId)
        }}
        onClick={composeEventHandlers(onClick, (e) => {
          if (disabled || !visible) return
          e.preventDefault()
          dispatchSelect(e.currentTarget as HTMLElement)
        })}
        onKeyDown={composeEventHandlers(onKeyDown, (e) => {
          if (!disabled && e.key === 'Enter') {
            e.preventDefault()
            dispatchSelect(e.currentTarget as HTMLElement)
          }
        })}
        onPointerDown={composeEventHandlers(onPointerDown as any, (e) => {
          if (e.button === 0 && e.ctrlKey === false) e.preventDefault()
        })}
        onMouseDown={composeEventHandlers(onMouseDown as any, (e) => {
          if (e.button === 0 && e.ctrlKey === false) e.preventDefault()
        })}
      >
        <RowCtx.Provider value={row}>{children}</RowCtx.Provider>
      </Primitive.div>
    )
  },
)
Item.displayName = 'ActionMenu.Item'

/* ================================================================================================
 * Submenu primitives: Sub, SubTrigger, SubContent (NO intent logic)
 * ============================================================================================== */

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
const useSubCtx = () => {
  const ctx = React.useContext(SubCtx)
  if (!ctx)
    throw new Error('ActionMenu.Sub components must be inside ActionMenu.Sub')
  return ctx
}

export interface ActionMenuSubProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export const Sub = ({
  open: openProp,
  defaultOpen,
  onOpenChange,
  children,
}: ActionMenuSubProps) => {
  const childSurfaceId = React.useId()
  const parentSurfaceId = useSurfaceId() || 'root'
  const [triggerItemId, setTriggerItemId] = React.useState<string | null>(null)

  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
  })

  const triggerRef = React.useRef<HTMLDivElement | HTMLButtonElement | null>(
    null,
  )
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  const parent = useCollection()

  React.useEffect(() => {
    if (!open) return
    if (!triggerItemId) return
    if (parent.activeId !== triggerItemId) setOpen(false)
  }, [open, setOpen, triggerItemId, parent.activeId])

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
      parentSetActiveId: parent.setActiveId,
      childSurfaceId,
    }),
    [
      open,
      setOpen,
      parentSurfaceId,
      triggerItemId,
      parent.setActiveId,
      childSurfaceId,
    ],
  )

  return (
    <SubCtx.Provider value={value}>
      <Popper.Root>{children}</Popper.Root>
    </SubCtx.Provider>
  )
}
Sub.displayName = 'ActionMenu.Sub'

export interface ActionMenuSubTriggerProps
  extends Omit<DivProps, 'value' | 'children'> {
  value: string
  keywords?: string[]
  id?: string
  disabled?: boolean
  groupId?: string | null
  children?: React.ReactNode
}

export const SubTrigger = React.forwardRef<
  HTMLDivElement,
  ActionMenuSubTriggerProps
>(
  (
    {
      className,
      children,
      value,
      keywords,
      id,
      disabled,
      onKeyDown,
      onPointerDown,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      groupId,
      ...props
    },
    ref,
  ) => {
    const { ownerId, setOwnerId } = useFocusOwner()
    const generatedId = React.useId()
    const itemId = id ?? `action-menu-subtrigger-${generatedId}`
    const itemRef = React.useRef<HTMLDivElement | null>(null)
    const composedRef = composeRefs(ref, itemRef)
    const sub = useSubCtx()
    const { breadcrumb, scopePath } = useScope()
    const { upsert, remove } = useSearchRegistry()

    const latestChildrenRef = React.useRef(children)
    React.useLayoutEffect(() => {
      latestChildrenRef.current = children
    }, [children])

    const parentRow = React.useContext(RowCtx)
    const isShortcut = parentRow?.mode === 'search'

    // For deep-search indexing (value + keywords + breadcrumb)
    React.useLayoutEffect(() => {
      if (disabled || isShortcut) return
      const valueStr = String(value)
      const recId = `submenu::${valueStr}::${sub.childSurfaceId}`
      const rec: SubmenuRecord = {
        kind: 'submenu',
        id: recId,
        valueStr,
        breadcrumb: [...breadcrumb, valueStr],
        scopePath: [...scopePath],
        ownerScopeId: sub.childSurfaceId,
        searchText: [...breadcrumb, valueStr, ...(keywords ?? [])]
          .join(' ')
          .toLowerCase(),
        rowClassName: className,
        renderInline: () => (
          <Sub>
            <SubTrigger value={valueStr} className={className}>
              {latestChildrenRef.current}
            </SubTrigger>
            {/* SubContent will be provided by the real subtree; deep inline is only the trigger row */}
          </Sub>
        ),
      }

      const { renderInline, rowClassName, ...rest } = rec

      console.log(
        JSON.stringify(
          {
            ...rest,
          },
          null,
          '\t',
        ),
      )

      upsert(rec)
      return () => remove(recId)
    }, [
      isShortcut,
      disabled,
      value,
      keywords,
      breadcrumb.join('>'),
      upsert,
      remove,
      className,
      sub.childSurfaceId,
    ])

    const {
      registerItem,
      unregisterItem,
      isItemVisible,
      activeId,
      setActiveId,
    } = useCollection()

    React.useLayoutEffect(() => {
      if (sub.triggerItemId !== itemId) sub.setTriggerItemId(itemId)
      return () => {
        if (sub.triggerItemId === itemId) sub.setTriggerItemId(null)
      }
    }, [itemId])

    React.useLayoutEffect(() => {
      registerItem({
        id: itemId,
        value: String(value),
        keywords,
        ref: itemRef,
        groupId: groupId ?? null,
      })
      return () => unregisterItem(itemId)
    }, [itemId, value, keywords, registerItem, unregisterItem, groupId])

    const visible = isItemVisible(itemId)
    const focused = activeId === itemId
    const isMenuFocused = ownerId === sub.childSurfaceId

    const row: RowCtx = React.useMemo(
      () => ({
        mode: parentRow?.mode ?? 'browse',
        breadcrumbs: parentRow?.breadcrumbs ?? [],
        query: parentRow?.query ?? '',
        score: parentRow?.score ?? 0,
        focused,
        disabled: !!disabled,
      }),
      [
        parentRow?.mode,
        parentRow?.breadcrumbs?.join('>'),
        parentRow?.query,
        parentRow?.score,
        focused,
        disabled,
      ],
    )

    // Open on programmatic request
    React.useEffect(() => {
      const node = itemRef.current
      if (!node) return
      const onOpen = () => {
        sub.onOpenChange(true)
        const tryFocus = (attempt = 0) => {
          const content = sub.contentRef.current as HTMLElement | null
          if (content) {
            const surfaceId = content.dataset.surfaceId
            if (surfaceId) setOwnerId(surfaceId)
            const input = content.querySelector<HTMLInputElement>(
              '[data-action-menu-input]',
            )
            const list = content.querySelector<HTMLElement>(
              '[data-action-menu-list]',
            )
            ;(input ?? list)?.focus()
            return
          }
          if (attempt < 5) requestAnimationFrame(() => tryFocus(attempt + 1))
        }
        requestAnimationFrame(() => tryFocus())
      }
      node.addEventListener('actionmenu-open-sub', onOpen as any)
      return () =>
        node.removeEventListener('actionmenu-open-sub', onOpen as any)
    }, [sub, setOwnerId])

    return (
      <Popper.Anchor asChild>
        <Primitive.div
          {...props}
          className={className}
          ref={composeRefs(composedRef, sub.triggerRef as any)}
          role="option"
          data-slot="action-menu-subtrigger"
          data-role="option"
          data-subtrigger="true"
          data-menu-focused={isMenuFocused ? 'true' : 'false'}
          aria-selected={focused || undefined}
          aria-disabled={disabled || undefined}
          aria-haspopup="menu"
          aria-expanded={sub.open || undefined}
          action-menu-option
          data-action-menu-item-id={itemId}
          data-focused={focused ? 'true' : 'false'}
          hidden={!visible}
          tabIndex={-1}
          id={itemId}
          onMouseEnter={composeEventHandlers(onMouseEnter, () => {
            if (disabled || !visible) return
            sub.onOpenChange(true)
            if (!focused) setActiveId(itemId)
          })}
          onPointerDown={composeEventHandlers(
            onPointerDown as any,
            (e: any) => {
              if (disabled || !visible) return
              if (e.button === 0 && e.ctrlKey === false) {
                sub.onOpenToggle()
                e.preventDefault()
              }
            },
          )}
          onKeyDown={composeEventHandlers(onKeyDown, (e) => {
            if (disabled) return
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              sub.onOpenToggle()
            }
          })}
          onFocus={composeEventHandlers(onFocus, () => {
            if (disabled || !visible) return
            sub.onOpenChange(true)
          })}
          onBlur={composeEventHandlers(onBlur as any, () => {})}
          onMouseMove={() => {
            if (disabled || !visible || focused) return
            setActiveId(itemId)
          }}
        >
          <RowCtx.Provider value={row}>{children}</RowCtx.Provider>
        </Primitive.div>
      </Popper.Anchor>
    )
  },
)
SubTrigger.displayName = 'ActionMenu.SubTrigger'

export interface ActionMenuSubContentProps extends Omit<DivProps, 'dir'> {
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  collisionPadding?:
    | number
    | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  dir?: Direction
  vimBindings?: boolean
  filterFn?: FilterFn
  title: string
  scopeId?: string
  disableIndexMirror?: boolean
}

export const SubContent = React.forwardRef<
  HTMLDivElement,
  ActionMenuSubContentProps
>(
  (
    {
      children,
      side = 'right',
      align = 'start',
      sideOffset = 6,
      alignOffset = 0,
      avoidCollisions = true,
      collisionPadding = 8,
      dir: dirProp,
      vimBindings = true,
      filterFn,
      title,
      scopeId: providedScopeId,
      disableIndexMirror,
      ...props
    },
    ref,
  ) => {
    const sub = useSubCtx()
    const surfaceId = sub.childSurfaceId
    const scopeId = React.useMemo(
      () => providedScopeId ?? title.toLowerCase().replace(/\s+/g, '-'),
      [providedScopeId, title],
    )

    const collectionValue = useCollectionState({
      filterFn: filterFn ?? defaultFilter,
    })
    const { ownerId, setOwnerId } = useFocusOwner()
    const isOwner = ownerId === surfaceId
    const surfaceRef = React.useRef<HTMLDivElement | null>(null)
    const composedSurfaceRef = composeRefs(ref, surfaceRef, sub.contentRef)
    const dir = getDir(dirProp)

    React.useEffect(() => {
      if (!sub.open && collectionValue.activeId)
        collectionValue.setActiveId(null)
    }, [sub.open])

    React.useEffect(() => {
      if (sub.open && isOwner) collectionValue.inputRef.current?.focus()
    }, [sub.open, isOwner])

    const handleFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
      if (e.target === surfaceRef.current) {
        requestAnimationFrame(() => {
          const input = collectionValue.inputRef.current
          if (input) input.focus()
          else collectionValue.listRef.current?.focus()
        })
      }
    }

    return (
      <>
        <SurfaceCtx.Provider value={surfaceId}>
          <KeyboardCtx.Provider value={{ dir, vimBindings }}>
            <ScopeProvider scopeId={scopeId} title={title}>
              <Presence present={sub.open}>
                <Popper.Content
                  side={side}
                  align={align}
                  sideOffset={sideOffset}
                  alignOffset={alignOffset}
                  avoidCollisions={avoidCollisions}
                  collisionPadding={collisionPadding}
                  asChild
                >
                  <DismissableLayer
                    onEscapeKeyDown={() => {
                      sub.onOpenChange(false)
                    }}
                    asChild
                  >
                    <Primitive.div
                      {...props}
                      ref={composedSurfaceRef}
                      role="menu"
                      tabIndex={-1}
                      data-slot="action-menu-subcontent"
                      data-action-menu-surface
                      data-submenu
                      data-surface-id={surfaceId}
                      data-dir={dir}
                      data-state={sub.open ? 'open' : 'closed'}
                      onFocusCapture={handleFocusCapture}
                      onMouseMove={(e) => {
                        const rect = surfaceRef.current?.getBoundingClientRect()
                        if (!rect || !isInBounds(e.clientX, e.clientY, rect))
                          return
                        setOwnerId(surfaceId)
                      }}
                    >
                      <CollectionCtx.Provider value={collectionValue}>
                        {children}
                      </CollectionCtx.Provider>
                    </Primitive.div>
                  </DismissableLayer>
                </Popper.Content>
              </Presence>
            </ScopeProvider>
          </KeyboardCtx.Provider>
        </SurfaceCtx.Provider>
        <ScopeProvider scopeId={scopeId} title={title}>
          <IndexingCtx.Provider value={true}>
            <NoopCollectionProvider>
              <Primitive.div
                data-index-mirror
                aria-hidden="true"
                hidden
                style={{
                  display: 'none',
                  visibility: 'hidden',
                  pointerEvents: 'none',
                }}
              >
                {children}
              </Primitive.div>
            </NoopCollectionProvider>
          </IndexingCtx.Provider>
        </ScopeProvider>
      </>
    )
  },
)
SubContent.displayName = 'ActionMenu.SubContent'
