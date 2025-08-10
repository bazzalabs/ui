/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
/** biome-ignore-all lint/style/useSingleVarDeclarator: <explanation> */
/** biome-ignore-all lint/a11y/useAriaPropsSupportedByRole: <explanation> */

import { composeEventHandlers } from '@radix-ui/primitive'
import { composeRefs } from '@radix-ui/react-compose-refs'
import { DismissableLayer } from '@radix-ui/react-dismissable-layer'
import * as Popper from '@radix-ui/react-popper'
import { Presence } from '@radix-ui/react-presence'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'

/* =================================================================================================
 * Utilities (no public API impact)
 * =============================================================================================== */

/** Case-insensitive query normalization */
const normalize = (s: string) => s.toLowerCase().trim()

/** Dispatch a bubbling custom event on a node (used by keyboard bridge) */
function dispatch(node: HTMLElement | null | undefined, type: string) {
  if (!node) return
  node.dispatchEvent(new CustomEvent(type, { bubbles: true }))
}

/** Open submenu for current active element id (keyboard bridge helper) */
function openSubmenuForActive(activeId: string | null) {
  const el = activeId ? document.getElementById(activeId) : null
  if (el && el.dataset.subtrigger === 'true') {
    dispatch(el, 'actionmenu-open-sub')
  }
}

/** Close submenu for current active element id (keyboard bridge helper) */
function closeSubmenuForActive(activeId: string | null) {
  const el = activeId ? document.getElementById(activeId) : null
  if (el && el.dataset.subtrigger === 'true') {
    dispatch(el, 'actionmenu-close-sub')
  }
}

/** Geometric helper for pointer-intent triangle test */
function isInsideTriangle(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
) {
  const v0x = c.x - a.x,
    v0y = c.y - a.y
  const v1x = b.x - a.x,
    v1y = b.y - a.y
  const v2x = p.x - a.x,
    v2y = p.y - a.y
  const dot00 = v0x * v0x + v0y * v0y
  const dot01 = v0x * v1x + v0y * v1y
  const dot02 = v0x * v2x + v0y * v2y
  const dot11 = v1x * v1x + v1y * v1y
  const dot12 = v1x * v2x + v1y * v2y
  const invDenom = 1 / (dot00 * dot11 - dot01 * dot01 || 1)
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom
  return u >= 0 && v >= 0 && u + v <= 1
}

/* =================================================================================================
 * Root-level context (open state + anchor)
 * =============================================================================================== */

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

/* =================================================================================================
 * Collection context (owned by each Content/SubContent; shared by Input + List + Group + Item)
 * =============================================================================================== */

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
  // Search query
  query: string
  setQuery: (q: string) => void

  // Registration
  registerItem: (item: RegisteredItem) => void
  unregisterItem: (id: string) => void
  registerGroup: (group: RegisteredGroup) => void
  unregisterGroup: (id: string) => void

  // Visibility / filtering helpers
  getVisibleItemIds: () => string[]
  isItemVisible: (id: string) => boolean

  // Active (focused) item (for aria-activedescendant)
  activeId: string | null
  setActiveId: (id: string | null) => void
  moveActive: (dir: 1 | -1) => void
  setActiveToFirstVisible: () => void
  clickActive: () => void

  // Input/List presence & refs to coordinate focus
  inputPresent: boolean
  setInputPresent: (present: boolean) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  listRef: React.RefObject<HTMLDivElement | null>

  // Link input to list
  listId: string | null
  setListId: (id: string | null) => void
}

const CollectionCtx = React.createContext<CollectionContextValue | null>(null)
const useCollection = () => {
  const ctx = React.useContext(CollectionCtx)
  if (!ctx)
    throw new Error(
      'ActionMenu components must be rendered inside an ActionMenu.Content or SubContent',
    )
  return ctx
}

/** Create and manage the per-surface collection state */
function useCollectionState(): CollectionContextValue {
  const [query, setQuery] = React.useState('')
  const itemsRef = React.useRef<Map<string, RegisteredItem>>(new Map())
  const groupsRef = React.useRef<Map<string, RegisteredGroup>>(new Map())
  const [activeId, setActiveId] = React.useState<string | null>(null)

  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const [inputPresent, setInputPresent] = React.useState(false)
  const [listId, setListId] = React.useState<string | null>(null)

  const normQuery = normalize(query)

  const getVisibleItemIds = React.useCallback(() => {
    const ids: string[] = []
    itemsRef.current.forEach((item) => {
      if (!normQuery || normalize(item.value).includes(normQuery)) {
        ids.push(item.id)
      }
    })
    return ids
  }, [normQuery])

  const isItemVisible = React.useCallback(
    (id: string) => getVisibleItemIds().includes(id),
    [getVisibleItemIds],
  )

  const moveActive = React.useCallback(
    (dir: 1 | -1) => {
      const visible = getVisibleItemIds()
      if (visible.length === 0) {
        setActiveId(null)
        return
      }
      const currentIndex = activeId ? visible.indexOf(activeId) : -1
      const nextIndex =
        currentIndex === -1
          ? dir === 1
            ? 0
            : visible.length - 1
          : (currentIndex + dir + visible.length) % visible.length
      setActiveId(visible[nextIndex]!)
    },
    [activeId, getVisibleItemIds],
  )

  const setActiveToFirstVisible = React.useCallback(() => {
    const visible = getVisibleItemIds()
    setActiveId(visible[0] ?? null)
  }, [getVisibleItemIds])

  const clickActive = React.useCallback(() => {
    if (!activeId) return
    const node = itemsRef.current.get(activeId)?.ref.current
    node?.click()
  }, [activeId])

  const registerItem = React.useCallback((item: RegisteredItem) => {
    itemsRef.current.set(item.id, item)
  }, [])
  const unregisterItem = React.useCallback((id: string) => {
    itemsRef.current.delete(id)
  }, [])

  const registerGroup = React.useCallback((g: RegisteredGroup) => {
    groupsRef.current.set(g.id, g)
  }, [])
  const unregisterGroup = React.useCallback((id: string) => {
    groupsRef.current.delete(id)
  }, [])

  // Reset active when query changes
  React.useEffect(() => {
    setActiveToFirstVisible()
  }, [normQuery, setActiveToFirstVisible])

  return React.useMemo<CollectionContextValue>(
    () => ({
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
      moveActive,
      setActiveToFirstVisible,
      clickActive,
      inputPresent,
      setInputPresent,
      inputRef,
      listRef,
      listId,
      setListId,
    }),
    [
      query,
      registerItem,
      unregisterItem,
      registerGroup,
      unregisterGroup,
      getVisibleItemIds,
      isItemVisible,
      activeId,
      moveActive,
      setActiveToFirstVisible,
      clickActive,
      inputPresent,
      listId,
    ],
  )
}

/* =================================================================================================
 * Root
 * =============================================================================================== */

export interface ActionMenuProps extends React.ComponentPropsWithoutRef<'div'> {
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

    return (
      <RootCtx.Provider
        value={{
          open,
          onOpenChange: setOpen,
          onOpenToggle: () => setOpen((v) => !v),
          anchorRef,
        }}
      >
        <Popper.Root>
          <div ref={ref} {...props}>
            {children}
          </div>
        </Popper.Root>
      </RootCtx.Provider>
    )
  },
)
Root.displayName = 'ActionMenu.Root'

/* =================================================================================================
 * Trigger (Popper anchor)
 * =============================================================================================== */

export interface ActionMenuTriggerProps
  extends React.ComponentPropsWithoutRef<'button'> {}

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
        <button
          {...props}
          ref={composeRefs(forwardedRef, root.anchorRef)}
          disabled={disabled}
          onPointerDown={composeEventHandlers(onPointerDown, (event) => {
            if (!disabled && event.button === 0 && event.ctrlKey === false) {
              const willOpen = !root.open
              root.onOpenToggle()
              if (willOpen) event.preventDefault() // let content take focus
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
        </button>
      </Popper.Anchor>
    )
  },
)
Trigger.displayName = 'ActionMenu.Trigger'

/* =================================================================================================
 * Content (surface + provider for collection state)
 * =============================================================================================== */

export interface ActionMenuContentProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'dir'> {
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  collisionPadding?:
    | number
    | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  /** Keep open on pointer down within the anchor (trigger) */
  closeOnAnchorPointerDown?: boolean
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
      ...props
    },
    ref,
  ) => {
    const root = useRootCtx()
    const collectionValue = useCollectionState()

    // Autofocus when menu opens: prefer Input, else List
    const surfaceRef = React.useRef<HTMLDivElement | null>(null)
    const composedSurfaceRef = composeRefs(ref, surfaceRef)
    React.useEffect(() => {
      if (!root.open) return
      const id = requestAnimationFrame(() => {
        if (collectionValue.inputPresent)
          collectionValue.inputRef.current?.focus()
        else collectionValue.listRef.current?.focus()
      })
      return () => cancelAnimationFrame(id)
    }, [root.open, collectionValue.inputPresent])

    return (
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
            <div
              {...props}
              ref={composedSurfaceRef}
              role="menu"
              tabIndex={-1}
              data-action-menu-surface
            >
              <CollectionCtx.Provider value={collectionValue}>
                {children}
              </CollectionCtx.Provider>
            </div>
          </DismissableLayer>
        </Popper.Content>
      </Presence>
    )
  },
)
Content.displayName = 'ActionMenu.Content'

/* =================================================================================================
 * Input (NOT nested inside List). Owns keyboard nav + filtering + focus trap.
 * =============================================================================================== */

export interface ActionMenuInputProps
  extends React.ComponentPropsWithoutRef<'input'> {
  /** If true, selects text on mount */
  autoSelect?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, ActionMenuInputProps>(
  ({ autoSelect = false, onChange, onKeyDown, ...props }, ref) => {
    const {
      setQuery,
      query,
      moveActive,
      getVisibleItemIds,
      setActiveId,
      activeId,
      clickActive,
      setInputPresent,
      inputRef,
      listId,
    } = useCollection()

    const localRef = React.useRef<HTMLInputElement | null>(null)
    const composedRef = composeRefs(ref, localRef, inputRef as any)

    React.useEffect(() => {
      setInputPresent(true)
      return () => setInputPresent(false)
    }, [setInputPresent])

    React.useEffect(() => {
      if (localRef.current && autoSelect) {
        const id = requestAnimationFrame(() => {
          try {
            localRef.current?.select()
          } catch {
            /* ignore */
          }
        })
        return () => cancelAnimationFrame(id)
      }
    }, [autoSelect])

    return (
      <input
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
        onKeyDown={composeEventHandlers(onKeyDown, (e) => {
          // Trap focus within the Input (do not allow Tab to leave)
          if (e.key === 'Tab') {
            e.preventDefault()
            return
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            moveActive(1)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            moveActive(-1)
          } else if (e.key === 'Home') {
            e.preventDefault()
            const ids = getVisibleItemIds()
            setActiveId(ids[0] ?? null)
          } else if (e.key === 'End') {
            e.preventDefault()
            const ids = getVisibleItemIds()
            setActiveId(ids[ids.length - 1] ?? null)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            clickActive()
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            openSubmenuForActive(activeId)
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            closeSubmenuForActive(activeId)
          }
        })}
      />
    )
  },
)
Input.displayName = 'ActionMenu.Input'

/* =================================================================================================
 * List (mandatory) + Group + Item
 * =============================================================================================== */

export interface ActionMenuListProps
  extends React.ComponentPropsWithoutRef<'div'> {}

export const List = React.forwardRef<HTMLDivElement, ActionMenuListProps>(
  ({ children, onKeyDown, id, ...props }, ref) => {
    const {
      activeId,
      moveActive,
      getVisibleItemIds,
      setActiveId,
      clickActive,
      inputPresent,
      listRef,
      setListId,
    } = useCollection()

    const localId = React.useId()
    const listDomId = id ?? `action-menu-list-${localId}`

    React.useEffect(() => {
      setListId(listDomId)
      return () => setListId(null)
    }, [listDomId, setListId])

    return (
      <div
        {...props}
        id={listDomId}
        ref={composeRefs(ref, listRef)}
        data-action-menu-list
        role="listbox"
        tabIndex={-1}
        aria-activedescendant={activeId ?? undefined}
        onKeyDown={composeEventHandlers(onKeyDown, (e) => {
          // If no Input exists, List owns the focus trap + navigation
          if (!inputPresent && e.key === 'Tab') {
            e.preventDefault()
            return
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            moveActive(1)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            moveActive(-1)
          } else if (e.key === 'Home') {
            e.preventDefault()
            const ids = getVisibleItemIds()
            setActiveId(ids[0] ?? null)
          } else if (e.key === 'End') {
            e.preventDefault()
            const ids = getVisibleItemIds()
            setActiveId(ids[ids.length - 1] ?? null)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            clickActive()
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            openSubmenuForActive(activeId)
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            closeSubmenuForActive(activeId)
          }
        })}
      >
        {children}
      </div>
    )
  },
)
List.displayName = 'ActionMenu.List'

export interface ActionMenuGroupProps
  extends React.ComponentPropsWithoutRef<'div'> {
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
      <div
        {...props}
        ref={composeRefs(ref, groupRef)}
        role="group"
        data-action-menu-group
        aria-label={label}
        hidden={!hasVisibleChildren}
      >
        {label ? <div role="presentation">{label}</div> : null}
        {children}
      </div>
    )
  },
)
Group.displayName = 'ActionMenu.Group'

export interface ActionMenuItemProps
  extends React.ComponentPropsWithoutRef<'div'> {
  /** Required: used for filtering */
  value: string
  /** Optional stable id; otherwise auto-generated */
  id?: string
  disabled?: boolean
  /** Optional group id if rendered outside a Group wrapper */
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

    React.useEffect(() => {
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
      <div
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
          // Default: close menu on item click
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
      </div>
    )
  },
)
Item.displayName = 'ActionMenu.Item'

/* =================================================================================================
 * Submenu primitives: Sub, SubTrigger, SubContent
 * =============================================================================================== */

type SubContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
  triggerRef: React.RefObject<HTMLDivElement | HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>

  // Intent/hover helpers
  trackPointer: (x: number, y: number) => void
  scheduleCloseWithIntent: (
    reason?: 'trigger-leave' | 'content-leave' | 'focus-left',
  ) => void
  cancelScheduledClose: () => void
  setContentRect: (rect: DOMRect | null) => void
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
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
  })
  const triggerRef = React.useRef<HTMLDivElement | HTMLButtonElement | null>(
    null,
  )
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  // Pointer history for intent zones
  const pointsRef = React.useRef<Array<{ x: number; y: number; t: number }>>([])
  const contentRectRef = React.useRef<DOMRect | null>(null)
  const closeTimerRef = React.useRef<number | null>(null)

  const trackPointer = React.useCallback((x: number, y: number) => {
    const now = performance.now()
    const arr = pointsRef.current
    arr.push({ x, y, t: now })
    while (arr.length > 5 || (arr.length && now - arr[0]!.t > 300)) arr.shift()
  }, [])

  // Track pointer globally while submenu is open to keep recent points alive
  React.useEffect(() => {
    if (!open) return
    const onMove = (e: PointerEvent) => trackPointer(e.clientX, e.clientY)
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [open, trackPointer])

  const setContentRect = React.useCallback((rect: DOMRect | null) => {
    contentRectRef.current = rect
  }, [])

  // Determine if pointer is heading into submenu content (submenu assumed to open to the right)
  const shouldDelayCloseForIntent = React.useCallback(() => {
    const rect = contentRectRef.current
    const pts = pointsRef.current
    if (!rect || pts.length < 2) return false
    const last = pts[pts.length - 1]!
    // find a "stable" previous point ~100ms ago
    const prev = [...pts].reverse().find((p) => last.t - p.t >= 100) ?? pts[0]!
    const topCorner = { x: rect.left, y: rect.top }
    const bottomCorner = { x: rect.left, y: rect.bottom }
    return isInsideTriangle(last, prev, topCorner, bottomCorner)
  }, [])

  const cancelScheduledClose = React.useCallback(() => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const scheduleCloseWithIntent = React.useCallback(
    (reason?: 'trigger-leave' | 'content-leave' | 'focus-left') => {
      cancelScheduledClose()
      const baseDelay = reason === 'focus-left' ? 0 : 200 // base forgiveness on hover
      const extra = shouldDelayCloseForIntent() ? 150 : 0 // extra if aiming at submenu
      const delay = baseDelay + extra
      closeTimerRef.current = window.setTimeout(() => {
        closeTimerRef.current = null
        setOpen(false)
      }, delay)
    },
    [cancelScheduledClose, shouldDelayCloseForIntent, setOpen],
  )

  const value: SubContextValue = React.useMemo(
    () => ({
      open,
      onOpenChange: setOpen,
      onOpenToggle: () => setOpen((v) => !v),
      triggerRef,
      contentRef,
      trackPointer,
      scheduleCloseWithIntent,
      cancelScheduledClose,
      setContentRect,
    }),
    [
      open,
      setOpen,
      trackPointer,
      scheduleCloseWithIntent,
      cancelScheduledClose,
      setContentRect,
    ],
  )

  // Popper.Root wraps BOTH SubTrigger and SubContent so alignment works.
  return (
    <SubCtx.Provider value={value}>
      <Popper.Root>{children}</Popper.Root>
    </SubCtx.Provider>
  )
}
Sub.displayName = 'ActionMenu.Sub'

export interface ActionMenuSubTriggerProps
  extends React.ComponentPropsWithoutRef<'div'> {
  /** Required for filtering / registration in parent menu */
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
      onMouseMove,
      onMouseLeave,
      onFocus,
      onBlur,
      groupId,
      children,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId()
    const itemId = id ?? `action-menu-subtrigger-${generatedId}`
    const itemRef = React.useRef<HTMLDivElement | null>(null)
    const composedRef = composeRefs(ref, itemRef)
    const sub = useSubCtx()
    const {
      registerItem,
      unregisterItem,
      isItemVisible,
      activeId,
      setActiveId,
    } = useCollection()

    // Register as an item in the parent list so it participates in filtering and focus
    React.useEffect(() => {
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

    // Open when this row becomes the active (focused) option via roving focus
    React.useEffect(() => {
      if (visible && focused) {
        sub.onOpenChange(true)
      }
    }, [visible, focused, sub])

    // If the sub is open and this row loses focus (pointer/roving focus left), schedule a forgiving close
    React.useEffect(() => {
      if (sub.open && !focused) {
        sub.scheduleCloseWithIntent('trigger-leave')
      }
    }, [focused, sub])

    // Listen for custom events from Input/List ArrowRight/ArrowLeft
    React.useEffect(() => {
      const node = itemRef.current
      if (!node) return
      const onOpen = () => sub.onOpenChange(true)
      const onClose = () => sub.onOpenChange(false)
      node.addEventListener('actionmenu-open-sub', onOpen as EventListener)
      node.addEventListener('actionmenu-close-sub', onClose as EventListener)
      return () => {
        node.removeEventListener('actionmenu-open-sub', onOpen as EventListener)
        node.removeEventListener(
          'actionmenu-close-sub',
          onClose as EventListener,
        )
      }
    }, [sub])

    return (
      <Popper.Anchor asChild>
        <div
          {...props}
          ref={composeRefs(composedRef, sub.triggerRef as any)}
          role="option"
          data-role="option"
          data-subtrigger="true"
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
          })}
          onMouseMove={composeEventHandlers(onMouseMove, (e) => {
            sub.trackPointer(e.clientX, e.clientY)
            if (!visible || disabled) return
            if (!focused) setActiveId(itemId)
          })}
          onMouseLeave={composeEventHandlers(onMouseLeave as any, () => {
            sub.scheduleCloseWithIntent('trigger-leave')
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
            } else if (e.key === 'ArrowRight') {
              e.preventDefault()
              sub.onOpenChange(true)
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault()
              sub.onOpenChange(false)
            }
          })}
          onFocus={composeEventHandlers(onFocus, () => {
            if (disabled || !visible) return
            sub.onOpenChange(true)
          })}
          onBlur={composeEventHandlers(onBlur as any, (e: React.FocusEvent) => {
            if (disabled) return
            const next = e.relatedTarget as Node | null
            const contentEl = sub.contentRef.current
            if (contentEl && next && contentEl.contains(next)) return
            sub.scheduleCloseWithIntent('focus-left')
          })}
        >
          {children}
        </div>
      </Popper.Anchor>
    )
  },
)
SubTrigger.displayName = 'ActionMenu.SubTrigger'

export interface ActionMenuSubContentProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'dir'> {
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  collisionPadding?:
    | number
    | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
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
      ...props
    },
    ref,
  ) => {
    const sub = useSubCtx()

    // Independent collection state for this submenu
    const collectionValue = useCollectionState()

    // Do NOT auto-focus input/list when opening — wait until user focuses inside.
    // If wrapper itself receives focus, redirect to List (not Input).
    const surfaceRef = React.useRef<HTMLDivElement | null>(null)
    const composedSurfaceRef = composeRefs(
      ref,
      surfaceRef,
      sub.contentRef as any,
    )

    const handleFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
      if (e.target === surfaceRef.current) {
        requestAnimationFrame(() => {
          collectionValue.listRef.current?.focus()
        })
      }
    }

    // Measure rect when open and keep updated (for intent zones)
    React.useEffect(() => {
      if (!sub.open) return
      const el = sub.contentRef.current
      if (el) sub.setContentRect(el.getBoundingClientRect())

      // cancel any pending close when content first renders/appears
      sub.cancelScheduledClose()
    }, [sub.open, sub])

    React.useEffect(() => {
      if (!sub.open) return
      const el = sub.contentRef.current
      if (!el) return
      const ro = new ResizeObserver(() =>
        sub.setContentRect(el.getBoundingClientRect()),
      )
      ro.observe(el)
      const onScroll = () => sub.setContentRect(el.getBoundingClientRect())
      window.addEventListener('scroll', onScroll, true)
      return () => {
        ro.disconnect()
        window.removeEventListener('scroll', onScroll, true)
      }
    }, [sub.open, sub])

    return (
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
            onEscapeKeyDown={() => sub.onOpenChange(false)}
            onDismiss={() => sub.onOpenChange(false)}
            // Close on ArrowLeft to return to trigger when focused inside content
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault()
                sub.onOpenChange(false)
                const trg = sub.triggerRef.current as HTMLElement | null
                trg?.focus()
              }
            }}
            asChild
          >
            <div
              {...props}
              ref={composedSurfaceRef}
              role="menu"
              tabIndex={-1}
              data-action-menu-surface
              onFocusCapture={handleFocusCapture}
              onPointerEnter={() => {
                sub.cancelScheduledClose()
              }}
              onPointerLeave={(e) => {
                sub.trackPointer(e.clientX, e.clientY)
                sub.scheduleCloseWithIntent('content-leave')
              }}
              onPointerMove={(e) => {
                sub.trackPointer(e.clientX, e.clientY)
              }}
            >
              <CollectionCtx.Provider value={collectionValue}>
                {children}
              </CollectionCtx.Provider>
            </div>
          </DismissableLayer>
        </Popper.Content>
      </Presence>
    )
  },
)
SubContent.displayName = 'ActionMenu.SubContent'
