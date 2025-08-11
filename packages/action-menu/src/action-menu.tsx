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
 * Tunables
 * =============================================================================================== */

// How long we "hold" geometry after a resize/scroll to avoid flicker when the user is inside submenu.
const GEOMETRY_HOLD_DURATION_MS = 200
// Extra forgiveness time added on top of the intent delay while geometry-hold is active.
const GEOMETRY_HOLD_EXTRA_MS = 150
// Grace polygon clears after this many ms (while pointer is "in flight" from trigger to content)
const GRACE_CLEAR_MS = 300

/* =================================================================================================
 * Utilities (no public API impact)
 * =============================================================================================== */

type Point = { x: number; y: number }
type Polygon = Point[]
type Side = 'left' | 'right'

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

function closeSubmenuForActive(activeId: string | null) {
  const el = activeId ? document.getElementById(activeId) : null
  if (el && el.dataset.subtrigger === 'true')
    dispatch(el, 'actionmenu-close-sub')
}

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
  const inv = 1 / (dot00 * dot11 - dot01 * dot01 || 1)
  const u = (dot11 * dot02 - dot01 * dot12) * inv
  const v = (dot00 * dot12 - dot01 * dot02) * inv
  return u >= 0 && v >= 0 && u + v <= 1
}

// Point-in-polygon (ray casting)
function isPointInPolygon(point: Point, polygon?: Polygon | null) {
  if (!polygon || polygon.length < 3) return false
  const { x, y } = point
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]!.x,
      yi = polygon[i]!.y
    const xj = polygon[j]!.x,
      yj = polygon[j]!.y
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
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

function __amShouldTrace() {
  try {
    return (window as any).__ACTION_MENU_TRACE__ === true
  } catch {
    return false
  }
}
function __amTrace(...args: any[]) {
  if (!__amShouldTrace()) return
  // eslint-disable-next-line no-console
  console.log('[ActionMenu]', ...args)
}

/* =================================================================================================
 * Root-level context (open state + anchor) + Ownership (active surface) + Hover guard + Config
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

/** Which menu surface currently owns real DOM focus (Input/List) */
type InputModality = 'pointer' | 'keyboard' | 'unknown'

type OwnerContextValue = {
  activeOwnerId: string | null
  setActiveOwner: (id: string | null) => void
  /** Suppress parent item hover updates while traversing an intent corridor */
  hoverGuardActive: boolean
  setHoverGuardActive: (v: boolean) => void
  /** Best-effort modality tracker (keyboard vs pointer) */
  inputModality: InputModality
  setInputModality: (m: InputModality) => void
  /** Global config: base intent delay (ms) when pointer plausibly heads into submenu */
  intentDelayMs: number
}

const OwnerCtx = React.createContext<OwnerContextValue | null>(null)
const useOwner = () => {
  const ctx = React.useContext(OwnerCtx)
  if (!ctx) throw new Error('OwnerCtx missing')
  return ctx
}

/** Surface id context so children know which surface they belong to */
const SurfaceCtx = React.createContext<string | null>(null)
const useSurfaceId = () => React.useContext(SurfaceCtx)

/* =================================================================================================
 * Collection context (owned by each Content/SubContent)
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
      'ActionMenu components must be inside Content or SubContent',
    )
  return ctx
}

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
      if (!normQuery || normalize(item.value).includes(normQuery))
        ids.push(item.id)
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
    itemsRef.current.get(activeId)?.ref.current?.click()
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

  React.useEffect(() => {
    setActiveToFirstVisible()
  }, [normQuery, setActiveToFirstVisible])

  return React.useMemo(
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
  ) as CollectionContextValue
}

/* =================================================================================================
 * Root
 * =============================================================================================== */

export interface ActionMenuProps extends React.ComponentPropsWithoutRef<'div'> {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Global base delay (ms) applied when pointer intent toward a submenu is detected. Default: 250 */
  intentDelay?: number
}

export const Root = React.forwardRef<HTMLDivElement, ActionMenuProps>(
  (
    {
      children,
      open: openProp,
      defaultOpen,
      onOpenChange,
      intentDelay,
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

    // Ownership + hover guard + modality live at the root so all surfaces can coordinate
    const [activeOwnerId, setActiveOwner] = React.useState<string | null>(null)
    const [hoverGuardActive, setHoverGuardActive] = React.useState(false)
    const [inputModality, setInputModality] =
      React.useState<InputModality>('unknown')

    // Global configuration
    const intentDelayMs = Number.isFinite(intentDelay as number)
      ? (intentDelay as number)
      : 250

    React.useEffect(() => {
      const onKey = () => setInputModality('keyboard')
      const onPtr = () => setInputModality('pointer')
      window.addEventListener('keydown', onKey, { passive: true })
      window.addEventListener('pointerdown', onPtr, { passive: true })
      window.addEventListener('pointermove', onPtr, { passive: true })
      return () => {
        window.removeEventListener('keydown', onKey)
        window.removeEventListener('pointerdown', onPtr)
        window.removeEventListener('pointermove', onPtr)
      }
    }, [])

    return (
      <RootCtx.Provider
        value={{
          open,
          onOpenChange: setOpen,
          onOpenToggle: () => setOpen((v) => !v),
          anchorRef,
        }}
      >
        <OwnerCtx.Provider
          value={{
            activeOwnerId,
            setActiveOwner,
            hoverGuardActive,
            setHoverGuardActive,
            inputModality,
            setInputModality,
            intentDelayMs,
          }}
        >
          <Popper.Root>
            <div ref={ref} {...props}>
              {children}
            </div>
          </Popper.Root>
        </OwnerCtx.Provider>
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
    const owner = useOwner()
    const surfaceId = React.useId()

    const collectionValue = useCollectionState()

    // Focus only if this surface is the active owner and menu is open
    React.useEffect(() => {
      if (!root.open) return
      if (owner.activeOwnerId !== surfaceId) return
      const id = requestAnimationFrame(() => {
        if (collectionValue.inputPresent)
          collectionValue.inputRef.current?.focus()
        else collectionValue.listRef.current?.focus()
      })
      return () => cancelAnimationFrame(id)
    }, [
      root.open,
      owner.activeOwnerId,
      surfaceId,
      collectionValue.inputPresent,
    ])

    return (
      <SurfaceCtx.Provider value={surfaceId}>
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
                ref={ref}
                role="menu"
                tabIndex={-1}
                data-action-menu-surface
                data-surface-id={surfaceId}
                onPointerEnter={() => {
                  // Pointer back into parent content → parent takes ownership
                  owner.setActiveOwner(surfaceId)
                  owner.setHoverGuardActive(false)
                }}
              >
                <CollectionCtx.Provider value={collectionValue}>
                  {children}
                </CollectionCtx.Provider>
              </div>
            </DismissableLayer>
          </Popper.Content>
        </Presence>
      </SurfaceCtx.Provider>
    )
  },
)
Content.displayName = 'ActionMenu.Content'

/* =================================================================================================
 * Input (NOT nested inside List). Owns keyboard nav + filtering + focus trap.
 * =============================================================================================== */

export interface ActionMenuInputProps
  extends React.ComponentPropsWithoutRef<'input'> {
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
          } catch {}
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
    const owner = useOwner()

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
        onPointerEnter={() => {
          owner.setHoverGuardActive(false)
        }}
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
    const owner = useOwner()

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
          // Suppress hover updates during corridor traversal to submenu
          if (owner.hoverGuardActive) return
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
      </div>
    )
  },
)
Item.displayName = 'ActionMenu.Item'

/* =================================================================================================
 * Submenu primitives: Sub, SubTrigger, SubContent (+ debug overlay)
 * =============================================================================================== */

type SubContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
  triggerRef: React.RefObject<HTMLDivElement | HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  parentSurfaceId: string

  // Intent/hover helpers
  trackPointer: (x: number, y: number) => void
  scheduleCloseWithIntent: (
    reason?:
      | 'trigger-leave'
      | 'content-leave'
      | 'focus-left'
      | 'keyboard-roving',
  ) => void
  cancelScheduledClose: () => void
  setContentRect: (rect: DOMRect | null) => void

  // Debug accessors
  getIntentDebug: () => {
    prev: { x: number; y: number } | null
    last: { x: number; y: number } | null
    topCorner: { x: number; y: number } | null
    bottomCorner: { x: number; y: number } | null
    active: boolean
    polygon?: Polygon | null
    insidePolygon?: boolean
  } | null
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
  const owner = useOwner()

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
  const geometryHoldUntilRef = React.useRef<number>(0)
  const lastTraceTsRef = React.useRef(0)

  // Grace polygon + direction
  const graceRef = React.useRef<{ area: Polygon; side: Side } | null>(null)
  const graceTimerRef = React.useRef<number | null>(null)
  const lastPointerXRef = React.useRef(0)
  const pointerDirRef = React.useRef<Side>('right')

  const clearGrace = React.useCallback(() => {
    if (graceTimerRef.current != null) {
      window.clearTimeout(graceTimerRef.current)
      graceTimerRef.current = null
    }
    graceRef.current = null
    __amTrace('grace:clear')
  }, [])

  const setGrace = React.useCallback(
    (intent: { area: Polygon; side: Side }) => {
      clearGrace()
      graceRef.current = intent
      __amTrace('grace:set', intent)
      graceTimerRef.current = window.setTimeout(() => {
        graceRef.current = null
        graceTimerRef.current = null
        __amTrace('grace:expired')
      }, GRACE_CLEAR_MS)
    },
    [clearGrace],
  )

  const trackPointer = React.useCallback((x: number, y: number) => {
    const now = performance.now()
    const arr = pointsRef.current
    arr.push({ x, y, t: now })
    while (arr.length > 5 || (arr.length && now - arr[0]!.t > 300)) arr.shift()

    // Track coarse horizontal direction like Radix
    if (x !== lastPointerXRef.current) {
      pointerDirRef.current = x > lastPointerXRef.current ? 'right' : 'left'
      lastPointerXRef.current = x
    }

    if (__amShouldTrace()) {
      if (now - lastTraceTsRef.current > 80) {
        lastTraceTsRef.current = now
        __amTrace('pointer', { x, y })
      }
    }
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

  const computePrevLast = React.useCallback(() => {
    const pts = pointsRef.current
    if (pts.length < 2) return { prev: null as any, last: null as any }
    const last = pts[pts.length - 1]!
    const prev = [...pts].reverse().find((p) => last.t - p.t >= 100) ?? pts[0]!
    return { prev, last }
  }, [])

  // Radix-style: only delay if the pointer is both moving toward the submenu side AND within the grace polygon
  const shouldDelayCloseForIntent = React.useCallback(() => {
    const rect = contentRectRef.current
    const { prev, last } = computePrevLast()
    const grace = graceRef.current
    if (!prev || !last || !grace) {
      __amTrace('intent-check: insufficient-data', {
        hasRect: !!rect,
        hasPrevLast: !!(prev && last),
        hasGrace: !!grace,
      })
      return false
    }

    const inside = isPointInPolygon({ x: last.x, y: last.y }, grace.area)
    const movingToward =
      grace.side === 'right' ? last.x > prev.x : last.x < prev.x

    // If (very rarely) rect is still missing but we do have a grace area and direction,
    // treat it as intent-true when the pointer is moving toward the submenu.
    if (!rect && inside && movingToward) {
      __amTrace('intent-check: optimistic-true (grace present, no rect yet)')
      return true
    }

    const result = inside && movingToward

    __amTrace('intent-check', {
      prev: { x: prev.x, y: prev.y },
      last: { x: last.x, y: last.y },
      rect: {
        left: rect?.left,
        top: rect?.top,
        right: rect?.right,
        bottom: rect?.bottom,
      },
      graceSide: grace.side,
      inside,
      movingToward,
      result,
    })

    return result
  }, [computePrevLast])

  const cancelScheduledClose = React.useCallback(() => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
      __amTrace('close: canceled')
    }
  }, [])

  const scheduleCloseWithIntent = React.useCallback(
    (
      reason?:
        | 'trigger-leave'
        | 'content-leave'
        | 'focus-left'
        | 'keyboard-roving',
    ) => {
      cancelScheduledClose()
      const now = performance.now()
      const inGeometryHold = now < geometryHoldUntilRef.current

      let delay = 0
      let intent = false

      if (reason === 'keyboard-roving' || reason === 'focus-left') {
        delay = 0
      } else if (reason === 'trigger-leave' || reason === 'content-leave') {
        intent = shouldDelayCloseForIntent()
        console.log('intent', intent)
        delay = intent
          ? (inGeometryHold ? GEOMETRY_HOLD_EXTRA_MS : 0) + owner.intentDelayMs
          : 0
      }

      __amTrace('close: schedule', {
        reason,
        delay,
        intent,
        inGeometryHold,
        intentDelayMs: owner.intentDelayMs,
      })

      closeTimerRef.current = window.setTimeout(() => {
        closeTimerRef.current = null
        __amTrace('close: fired', { reason })
        setOpen(false)
        clearGrace()
        owner.setHoverGuardActive(false)
        owner.setActiveOwner(parentSurfaceId)
      }, delay)
    },
    [
      cancelScheduledClose,
      shouldDelayCloseForIntent,
      owner,
      parentSurfaceId,
      setOpen,
      clearGrace,
    ],
  )

  const getIntentDebug = React.useCallback(() => {
    // Enable by setting window.__ACTION_MENU_DEBUG__ = true
    if (typeof window === 'undefined' || !(window as any).__ACTION_MENU_DEBUG__)
      return null
    const rect = contentRectRef.current
    const { prev, last } = computePrevLast()
    const grace = graceRef.current
    if (!rect || !prev || !last) {
      return {
        prev: prev ?? null,
        last: last ?? null,
        topCorner: null,
        bottomCorner: null,
        active: false,
        polygon: grace?.area ?? null,
        insidePolygon: false,
      }
    }
    const topCorner = { x: rect.left, y: rect.top }
    const bottomCorner = { x: rect.left, y: rect.bottom }
    const active = isInsideTriangle(last, prev, topCorner, bottomCorner)
    const insidePolygon = isPointInPolygon(
      { x: last.x, y: last.y },
      grace?.area,
    )
    return {
      prev,
      last,
      topCorner,
      bottomCorner,
      active,
      polygon: grace?.area ?? null,
      insidePolygon,
    }
  }, [computePrevLast])

  const value: SubContextValue = React.useMemo(
    () => ({
      open,
      onOpenChange: setOpen,
      onOpenToggle: () => setOpen((v) => !v),
      triggerRef,
      contentRef,
      parentSurfaceId,
      trackPointer,
      scheduleCloseWithIntent,
      cancelScheduledClose,
      setContentRect,
      getIntentDebug,
    }),
    [
      open,
      setOpen,
      parentSurfaceId,
      trackPointer,
      scheduleCloseWithIntent,
      cancelScheduledClose,
      setContentRect,
      getIntentDebug,
    ],
  )

  // Popper.Root wraps BOTH SubTrigger and SubContent so alignment works.
  return (
    <SubCtx.Provider value={value}>
      <Popper.Root>
        <GeometryHoldBridge
          holderRef={geometryHoldUntilRef}
          contentRef={contentRef}
          setContentRect={setContentRect}
        />
        {/* Internal helper to manage grace polygon from the SubTrigger */}
        <GracePolygonBridge
          triggerRef={triggerRef}
          contentRef={contentRef}
          setGrace={setGrace}
          setContentRect={setContentRect}
        />
        {children}
      </Popper.Root>
    </SubCtx.Provider>
  )
}
Sub.displayName = 'ActionMenu.Sub'

/** Observes submenu content size changes and sets a short hold to ignore transient pointerleave */
function GeometryHoldBridge({
  holderRef,
  contentRef,
  setContentRect,
}: {
  holderRef: React.MutableRefObject<number>
  contentRef: React.RefObject<HTMLDivElement | null>
  setContentRect: (rect: DOMRect | null) => void
}) {
  React.useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const update = () => {
      setContentRect(el.getBoundingClientRect())
      holderRef.current = performance.now() + GEOMETRY_HOLD_DURATION_MS
      __amTrace('geometry-hold: set', {
        until: holderRef.current,
        rect: el.getBoundingClientRect(),
      })
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    const onScroll = () => update()
    window.addEventListener('scroll', onScroll, true)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [contentRef, setContentRect])
  return null
}

/** Builds a grace polygon when leaving the sub-trigger, like Radix. */
function GracePolygonBridge({
  triggerRef,
  contentRef,
  setGrace,
  setContentRect,
}: {
  triggerRef: React.RefObject<HTMLElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  setGrace: (intent: { area: Polygon; side: Side }) => void
  setContentRect: (rect: DOMRect | null) => void
}) {
  const handleLeave = React.useCallback(
    (e: PointerEvent) => {
      const triggerEl = triggerRef.current
      const contentEl = contentRef.current
      if (!triggerEl || !contentEl) return

      const contentRect = contentEl.getBoundingClientRect()
      // Write the rect immediately to avoid “hasRect: false” in the very next tick.
      setContentRect(contentRect)

      // Determine side: prefer DOM position, fallback to dataset
      const triggerRect = triggerEl.getBoundingClientRect()
      const side: Side =
        contentRect.left >= triggerRect.right ? 'right' : 'left'

      const rightSide = side === 'right'
      const near = rightSide ? contentRect.left : contentRect.right
      const far = rightSide ? contentRect.right : contentRect.left

      // bleed keeps the starting pointer point inside the polygon reliably
      const bleed = rightSide ? -5 : +5

      const area: Polygon = [
        { x: e.clientX + bleed, y: e.clientY },
        { x: near, y: contentRect.top },
        { x: far, y: contentRect.top },
        { x: far, y: contentRect.bottom },
        { x: near, y: contentRect.bottom },
      ]
      setGrace({ area, side })
    },
    [triggerRef, contentRef, setGrace, setContentRect],
  )

  React.useEffect(() => {
    const trg = triggerRef.current
    if (!trg) return
    const onLeave = (ev: Event) => {
      const e = ev as PointerEvent
      if (e.pointerType !== 'mouse') return
      handleLeave(e)
    }
    trg.addEventListener('pointerleave', onLeave)
    return () => trg.removeEventListener('pointerleave', onLeave)
  }, [triggerRef, handleLeave])

  return null
}

/** Debug overlay: paints intent triangle + points + grace polygon when window.__ACTION_MENU_DEBUG__ === true */
function IntentDebugOverlay({
  getDebug,
}: {
  getDebug: () => {
    prev: { x: number; y: number } | null
    last: { x: number; y: number } | null
    topCorner: { x: number; y: number } | null
    bottomCorner: { x: number; y: number } | null
    active: boolean
    polygon?: Polygon | null
    insidePolygon?: boolean
  } | null
}) {
  const [tick, setTick] = React.useState(0)
  React.useEffect(() => {
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(() => {
        setTick((t) => (t + 1) % 1000000)
        loop()
      })
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])
  const dbg = getDebug()
  if (typeof window === 'undefined' || !(window as any).__ACTION_MENU_DEBUG__) {
    return null
  }
  if (!dbg) return null
  const {
    prev,
    last,
    topCorner,
    bottomCorner,
    active,
    polygon,
    insidePolygon,
  } = dbg
  if (!prev || !last) return null

  const tri =
    topCorner && bottomCorner
      ? `${prev.x},${prev.y} ${topCorner.x},${topCorner.y} ${bottomCorner.x},${bottomCorner.y}`
      : null

  return (
    <svg
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        pointerEvents: 'none',
      }}
      width="100%"
      height="100%"
      aria-hidden
    >
      {tri ? (
        <polygon
          points={tri}
          fill={active ? 'rgba(0,200,0,0.12)' : 'rgba(200,0,0,0.08)'}
        />
      ) : null}
      {polygon && polygon.length >= 3 ? (
        <polygon
          points={polygon.map((p) => `${p.x},${p.y}`).join(' ')}
          fill={insidePolygon ? 'rgba(0,0,255,0.10)' : 'rgba(0,0,255,0.05)'}
          stroke="rgba(0,0,255,0.4)"
          strokeWidth={1}
        />
      ) : null}
      <circle cx={prev.x} cy={prev.y} r="4" fill="orange" />
      <circle cx={last.x} cy={last.y} r="4" fill="blue" />
      {topCorner && bottomCorner ? (
        <>
          <line
            x1={prev.x}
            y1={prev.y}
            x2={last.x}
            y2={last.y}
            stroke="blue"
            strokeDasharray="4 4"
          />
          <rect
            x={topCorner.x}
            y={topCorner.y}
            width={Math.max(1, bottomCorner.x - topCorner.x)}
            height={Math.max(1, bottomCorner.y - topCorner.y)}
            fill="transparent"
            stroke="purple"
            strokeDasharray="6 6"
          />
        </>
      ) : null}
      <text x={prev.x + 6} y={prev.y - 6} fill="orange" fontSize="12">
        prev
      </text>
      <text x={last.x + 6} y={last.y - 6} fill="blue" fontSize="12">
        last
      </text>
      <text x={10} y={20} fill="black" fontSize="12">
        dbg {tick}
      </text>
    </svg>
  )
}

export interface ActionMenuSubTriggerProps
  extends React.ComponentPropsWithoutRef<'div'> {
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
    const owner = useOwner()

    const {
      registerItem,
      unregisterItem,
      isItemVisible,
      activeId,
      setActiveId,
    } = useCollection()

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

    // When this row becomes the active (virtual) focus, ensure submenu opens
    React.useEffect(() => {
      if (visible && focused) sub.onOpenChange(true)
    }, [visible, focused, sub])

    // If open and we’re no longer the active virtual item:
    // - keyboard roving → close immediately
    // - pointer hover-out → use intent-based delay
    React.useEffect(() => {
      if (!sub.open || focused) return
      if (owner.inputModality === 'keyboard') {
        sub.scheduleCloseWithIntent('keyboard-roving')
      } else {
        sub.scheduleCloseWithIntent('trigger-leave')
      }
    }, [focused, sub, owner.inputModality])

    // Keyboard bridge from Input/List events
    React.useEffect(() => {
      const node = itemRef.current
      if (!node) return
      const onOpen = () => {
        sub.onOpenChange(true)
        // Activate submenu ownership and focus inside
        const contentEl = sub.contentRef.current
        requestAnimationFrame(() => {
          const input = contentEl?.querySelector<HTMLInputElement>(
            '[data-action-menu-input]',
          )
          const list = contentEl?.querySelector<HTMLElement>(
            '[data-action-menu-list]',
          )
          if (contentEl) {
            const subSurfaceId = contentEl.getAttribute('data-surface-id')
            if (subSurfaceId) owner.setActiveOwner(subSurfaceId)
          }
          ;(input ?? list)?.focus()
        })
      }
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
    }, [owner, sub])

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
            // During corridor traversal, avoid letting sibling subtriggers steal attention
            if (owner.hoverGuardActive && !focused) {
              __amTrace(
                'submenu: pointer-enter trigger (blocked by hoverGuard)',
              )
              return
            }
            __amTrace('submenu: pointer-enter trigger')
            sub.onOpenChange(true)
            // Starting or continuing traversal: suppress parent hover updates
            owner.setHoverGuardActive(true)
          })}
          onMouseMove={composeEventHandlers(onMouseMove, (e) => {
            sub.trackPointer(e.clientX, e.clientY)
            if (!visible || disabled) return
            // While corridor is active, don't allow *other* triggers to grab focus
            if (owner.hoverGuardActive && !focused) return
            if (!focused) setActiveId(itemId)
          })}
          onMouseLeave={composeEventHandlers(onMouseLeave as any, () => {
            __amTrace('submenu: pointer-leave trigger')
            // Leaving trigger → may traverse corridor or leave entirely
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
              __amTrace('submenu: ArrowRight → open & focus inside')
              sub.onOpenChange(true)
              // Transfer ownership to submenu and move focus inside
              const contentEl = sub.contentRef.current
              requestAnimationFrame(() => {
                const input = contentEl?.querySelector<HTMLInputElement>(
                  '[data-action-menu-input]',
                )
                const list = contentEl?.querySelector<HTMLElement>(
                  '[data-action-menu-list]',
                )
                if (contentEl) {
                  const subSurfaceId = contentEl.getAttribute('data-surface-id')
                  if (subSurfaceId) owner.setActiveOwner(subSurfaceId)
                }
                ;(input ?? list)?.focus()
              })
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault()
              __amTrace('submenu: ArrowLeft → close & return to parent')
              sub.onOpenChange(false)
              owner.setActiveOwner(sub.parentSurfaceId)
            }
          })}
          onFocus={composeEventHandlers(onFocus, () => {
            if (disabled || !visible) return
            __amTrace('submenu: focus trigger')
            sub.onOpenChange(true)
            // While focused on trigger, ownership stays with parent until we enter content
            owner.setHoverGuardActive(true)
          })}
          onBlur={composeEventHandlers(onBlur as any, (e: React.FocusEvent) => {
            if (disabled) return
            const next = e.relatedTarget as Node | null
            const contentEl = sub.contentRef.current
            if (contentEl && next && contentEl.contains(next)) return
            __amTrace('submenu: blur trigger', {
              toContent: !!(contentEl && next && contentEl.contains(next)),
            })
            sub.scheduleCloseWithIntent('focus-left')
            owner.setHoverGuardActive(false)
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
    const owner = useOwner()
    const surfaceId = React.useId()

    const collectionValue = useCollectionState()

    // We DO NOT auto-focus on open; we only focus when ownership transfers here.
    // If wrapper itself receives focus, redirect to Input (then List).
    const surfaceRef = React.useRef<HTMLDivElement | null>(null)
    const composedSurfaceRef = composeRefs(
      ref,
      surfaceRef,
      sub.contentRef as any,
    )

    const handleFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
      if (e.target === surfaceRef.current) {
        requestAnimationFrame(() => {
          const input = collectionValue.inputRef.current
          if (input) input.focus()
          else collectionValue.listRef.current?.focus()
        })
      }
    }

    const debugEnabled =
      typeof window !== 'undefined' &&
      (window as any).__ACTION_MENU_DEBUG__ === true

    return (
      <SurfaceCtx.Provider value={surfaceId}>
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
                owner.setActiveOwner(sub.parentSurfaceId)
                owner.setHoverGuardActive(false)
              }}
              onDismiss={() => {
                sub.onOpenChange(false)
                owner.setActiveOwner(sub.parentSurfaceId)
                owner.setHoverGuardActive(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') {
                  e.preventDefault()
                  sub.onOpenChange(false)
                  owner.setActiveOwner(sub.parentSurfaceId)
                  const parentEl =
                    (document.querySelector(
                      `[data-surface-id="${sub.parentSurfaceId}"]`,
                    ) as HTMLElement | null) ?? null
                  requestAnimationFrame(() => {
                    const parentInput =
                      parentEl?.querySelector<HTMLInputElement>(
                        '[data-action-menu-input]',
                      )
                    const parentList = parentEl?.querySelector<HTMLElement>(
                      '[data-action-menu-list]',
                    )
                    ;(parentInput ?? parentList)?.focus()
                  })
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
                data-surface-id={surfaceId}
                onFocusCapture={handleFocusCapture}
                onPointerEnter={() => {
                  __amTrace('submenu: pointer-enter content')
                  sub.cancelScheduledClose()
                  owner.setHoverGuardActive(false)
                  owner.setActiveOwner(surfaceId)
                  requestAnimationFrame(() => {
                    const input = collectionValue.inputRef.current
                    if (input) input.focus()
                    else collectionValue.listRef.current?.focus()
                  })
                }}
                onPointerLeave={(e) => {
                  sub.trackPointer(e.clientX, e.clientY)
                  __amTrace('submenu: pointer-leave content')
                  sub.scheduleCloseWithIntent('content-leave')
                }}
                onPointerMove={(e) => {
                  sub.trackPointer(e.clientX, e.clientY)
                }}
              >
                <CollectionCtx.Provider value={collectionValue}>
                  {children}
                </CollectionCtx.Provider>
                {debugEnabled ? (
                  <MouseSafeArea parentRef={sub.contentRef} />
                ) : null}
                {debugEnabled ? (
                  <IntentDebugOverlay getDebug={sub.getIntentDebug} />
                ) : null}
              </div>
            </DismissableLayer>
          </Popper.Content>
        </Presence>
      </SurfaceCtx.Provider>
    )
  },
)
SubContent.displayName = 'ActionMenu.SubContent'

/** Debug-only: paints a corridor between the current mouse and the submenu content (left edge). */
function MouseSafeArea({
  parentRef,
}: {
  parentRef: React.RefObject<HTMLDivElement | null>
}) {
  const [mouseX, mouseY] = useMousePosition()
  const rect = parentRef.current?.getBoundingClientRect()
  if (!rect) return null
  const { x = 0, y = 0, height: h = 0, width: w = 0 } = rect

  const getLeft = (x: number, mouseX: number) =>
    mouseX > x ? undefined : -Math.max(x - mouseX, 10) + 'px'
  const getRight = (x: number, w: number, mouseX: number) =>
    mouseX > x ? -Math.max(mouseX - (x + w), 10) + 'px' : undefined
  const getWidth = (x: number, w: number, mouseX: number) =>
    mouseX > x
      ? Math.max(mouseX - (x + w), 10) + 'px'
      : Math.max(x - mouseX, 10) + 'px'
  const getClipPath = (
    x: number,
    y: number,
    h: number,
    mouseX: number,
    mouseY: number,
  ) =>
    mouseX > x
      ? `polygon(0% 0%, 0% 100%, 100% ${(100 * (mouseY - y)) / h}%)`
      : `polygon(100% 0%, 0% ${(100 * (mouseY - y)) / h}%, 100% 100%)`

  return (
    <div
      style={{
        position: 'fixed', // fixed to match viewport coords from getBoundingClientRect
        top: 0,
        left: getLeft(x, mouseX),
        right: getRight(x, w, mouseX),
        height: h,
        width: getWidth(x, w, mouseX),
        clipPath: getClipPath(x, y, h, mouseX, mouseY),
        pointerEvents: 'none',
        zIndex: 2147483646, // just below our SVG overlay if both enabled
        backgroundColor: 'rgba(0, 128, 255, 0.08)', // subtle; tweak if you want
      }}
    />
  )
}
