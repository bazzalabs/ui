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

/* ================================================================================================
 * General purpose types
 * ============================================================================================== */

type DivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>
type InputProps = React.ComponentPropsWithoutRef<typeof Primitive.input>
type ButtonProps = React.ComponentPropsWithoutRef<typeof Primitive.button>

/* ================================================================================================
 * Key maps & helpers
 * ============================================================================================== */

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

/* ================================================================================================
 * Root-level context (open state + anchor)
 * ============================================================================================== */

type ActionMenuRootContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
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
  surfaceId,
}: {
  surfaceId: string
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
    const ids: string[] = []
    itemsRef.current.forEach((item) => {
      if (!normQuery || normalize(item.value).includes(normQuery))
        ids.push(item.id)
    })
    return ids
  }, [normQuery])

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
}

export const Root = React.forwardRef<HTMLDivElement, ActionMenuProps>(
  ({ children, open: openProp, defaultOpen, onOpenChange, ...props }, ref) => {
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
      ...props
    },
    ref,
  ) => {
    const root = useRootCtx()
    const surfaceId = React.useId()
    const collectionValue = useCollectionState({ surfaceId })
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
            clickActive()
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
          console.log('here!')
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
        clickActive()
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

    return (
      <Primitive.input
        {...props}
        ref={composedRef}
        role="combobox"
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
    const { activeId, listRef, setListId } = useCollection()
    const localId = React.useId()
    const listDomId = id ?? `action-menu-list-${localId}`
    const handleKeys = useMenuKeydown('list')

    React.useEffect(() => {
      setListId(listDomId)
      return () => setListId(null)
    }, [listDomId, setListId])

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
        {children}
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

export interface ActionMenuItemProps extends DivProps {
  value: string
  id?: string
  disabled?: boolean
  groupId?: string | null
}

export const Item = React.forwardRef<HTMLDivElement, ActionMenuItemProps>(
  (
    { children, value, id, disabled, onClick, onKeyDown, groupId, ...props },
    ref,
  ) => {
    const generatedId = React.useId()
    const itemId = id ?? `action-menu-item-${generatedId}`
    const itemRef = React.useRef<HTMLDivElement | null>(null)
    const composedRef = composeRefs(ref, itemRef)

    const {
      registerItem,
      unregisterItem,
      isItemVisible,
      activeId,
      setActiveId,
    } = useCollection()
    const { onOpenChange } = useRootCtx()

    React.useLayoutEffect(() => {
      registerItem({
        id: itemId,
        value,
        ref: itemRef,
        groupId: groupId ?? null,
      })
      return () => unregisterItem(itemId)
    }, [itemId, registerItem, unregisterItem, value, groupId])

    const visible = isItemVisible(itemId)
    const focused = activeId === itemId

    return (
      <Primitive.div
        {...props}
        ref={composedRef}
        role="option"
        data-role="option"
        aria-selected={focused || undefined}
        aria-disabled={disabled || undefined}
        data-action-menu-item-id={itemId}
        data-focused={focused ? 'true' : 'false'}
        hidden={!visible}
        tabIndex={-1}
        id={itemId}
        onMouseMove={() => {
          if (!visible || disabled) return
          if (!focused) setActiveId(itemId)
        }}
        onClick={composeEventHandlers(onClick, () => {
          if (disabled || !visible) return
          onOpenChange(false)
        })}
        onKeyDown={composeEventHandlers(onKeyDown, (e) => {
          if (disabled) return
          if (e.key === 'Enter') {
            e.preventDefault()
            itemRef.current?.click()
          }
        })}
      >
        {children}
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
      onOpenChange: (value) => {
        // console.log(`[${parentSurfaceId}] onOpenChange`, value)
        setOpen(value)
      },
      onOpenToggle: () => {
        // console.log(`[${parentSurfaceId}] onOpenToggle`)
        setOpen((v) => !v)
      },
      triggerRef,
      contentRef,
      parentSurfaceId,
      triggerItemId,
      setTriggerItemId,
      parentSetActiveId: parent.setActiveId,
    }),
    [open, setOpen, parentSurfaceId, triggerItemId, parent.setActiveId],
  )

  return (
    <SubCtx.Provider value={value}>
      <Popper.Root>{children}</Popper.Root>
    </SubCtx.Provider>
  )
}
Sub.displayName = 'ActionMenu.Sub'

export interface ActionMenuSubTriggerProps extends DivProps {
  value: string
  id?: string
  disabled?: boolean
  groupId?: string | null
}

export const SubTrigger = React.forwardRef<
  HTMLDivElement,
  ActionMenuSubTriggerProps
>(
  (
    {
      value,
      id,
      disabled,
      onKeyDown,
      onPointerDown,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      groupId,
      children,
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

    React.useEffect(() => {
      sub.setTriggerItemId(itemId)
      return () => sub.setTriggerItemId(null)
    }, [itemId])

    // Listen for programmatic open (ArrowRight from the parent surface)
    React.useEffect(() => {
      const node = itemRef.current
      if (!node) return

      const onOpen = () => {
        // 1) Open submenu
        sub.onOpenChange(true)

        // 2) On next frame(s), hand focus + ownership to the submenu surface
        const tryFocus = (attempt = 0) => {
          const content = sub.contentRef.current as HTMLElement | null
          if (content) {
            // Set owner to the child surface so its key handler receives keys
            const surfaceId = content.dataset.surfaceId
            if (surfaceId) setOwnerId(surfaceId)

            // Focus input first, else list
            const input = content.querySelector<HTMLInputElement>(
              '[data-action-menu-input]',
            )
            const list = content.querySelector<HTMLElement>(
              '[data-action-menu-list]',
            )
            ;(input ?? list)?.focus()
            return
          }
          // SubContent might not be mounted yet — retry a few times
          if (attempt < 5) requestAnimationFrame(() => tryFocus(attempt + 1))
        }
        requestAnimationFrame(() => tryFocus())
      }

      node.addEventListener('actionmenu-open-sub', onOpen as any)
      return () =>
        node.removeEventListener('actionmenu-open-sub', onOpen as any)
    }, [sub, setOwnerId])

    const {
      registerItem,
      unregisterItem,
      isItemVisible,
      activeId,
      setActiveId,
    } = useCollection()

    React.useLayoutEffect(() => {
      registerItem({
        id: itemId,
        value,
        ref: itemRef,
        groupId: groupId ?? null,
      })
      return () => unregisterItem(itemId)
    }, [itemId, value, registerItem, unregisterItem, groupId])

    const visible = isItemVisible(itemId)
    const focused = activeId === itemId

    const isMenuFocused = ownerId === sub.parentSurfaceId

    return (
      <Popper.Anchor asChild>
        <Primitive.div
          {...props}
          ref={composeRefs(composedRef, sub.triggerRef as any)}
          role="option"
          data-role="option"
          data-subtrigger="true"
          data-menu-focused={!isMenuFocused ? 'true' : 'false'}
          aria-selected={focused || undefined}
          aria-disabled={disabled || undefined}
          aria-haspopup="menu"
          aria-expanded={sub.open || undefined}
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
        >
          {children}
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
      ...props
    },
    ref,
  ) => {
    const sub = useSubCtx()
    const surfaceId = React.useId()
    const collectionValue = useCollectionState({ surfaceId })
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
      <SurfaceCtx.Provider value={surfaceId}>
        <KeyboardCtx.Provider value={{ dir, vimBindings }}>
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
                  data-action-menu-surface
                  data-submenu
                  data-surface-id={surfaceId}
                  data-dir={dir}
                  onFocusCapture={handleFocusCapture}
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
SubContent.displayName = 'ActionMenu.SubContent'
