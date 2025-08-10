/** biome-ignore-all lint/a11y/useSemanticElements: required */
import { composeEventHandlers } from '@radix-ui/primitive'
import { composeRefs } from '@radix-ui/react-compose-refs'
import { DismissableLayer } from '@radix-ui/react-dismissable-layer'
import * as Popper from '@radix-ui/react-popper'
import { Presence } from '@radix-ui/react-presence'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'

/* -------------------------------------------------------------------------------------------------
 * Root-level context (open state + anchor)
 * -----------------------------------------------------------------------------------------------*/

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

/* -------------------------------------------------------------------------------------------------
 * Collection context (owned by Content; shared by Input + List + Group + Item)
 * -----------------------------------------------------------------------------------------------*/

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
      'ActionMenu components require being rendered inside ActionMenu.Content',
    )
  return ctx
}

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

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

/* -------------------------------------------------------------------------------------------------
 * Trigger (Popper anchor)
 * -----------------------------------------------------------------------------------------------*/

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

/* -------------------------------------------------------------------------------------------------
 * Content (surface + provider for collection state)
 * -----------------------------------------------------------------------------------------------*/

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

    // --- Collection state (shared by Input & List & Items) ---
    const [query, setQuery] = React.useState('')
    const itemsRef = React.useRef<Map<string, RegisteredItem>>(new Map())
    const groupsRef = React.useRef<Map<string, RegisteredGroup>>(new Map())
    const [activeId, setActiveId] = React.useState<string | null>(null)

    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const listRef = React.useRef<HTMLDivElement | null>(null)
    const [inputPresent, setInputPresent] = React.useState(false)
    const [listId, setListId] = React.useState<string | null>(null)

    const normalize = (s: string) => s.toLowerCase().trim()
    const normQuery = normalize(query)

    // biome-ignore lint/correctness/useExhaustiveDependencies: required
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
    // biome-ignore lint/correctness/useExhaustiveDependencies: required
    React.useEffect(() => {
      setActiveToFirstVisible()
    }, [normQuery, setActiveToFirstVisible])

    const collectionValue = React.useMemo<CollectionContextValue>(
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

    // Autofocus when menu opens: prefer Input, else List
    const surfaceRef = React.useRef<HTMLDivElement | null>(null)
    const composedSurfaceRef = composeRefs(ref, surfaceRef)
    React.useEffect(() => {
      if (!root.open) return
      const id = requestAnimationFrame(() => {
        if (inputPresent) inputRef.current?.focus()
        else listRef.current?.focus()
      })
      return () => cancelAnimationFrame(id)
    }, [root.open, inputPresent])

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

/* -------------------------------------------------------------------------------------------------
 * Input (NOT nested inside List). Owns keyboard nav + filtering + focus trap.
 * -----------------------------------------------------------------------------------------------*/

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
          }
        })}
      />
    )
  },
)
Input.displayName = 'ActionMenu.Input'

/* -------------------------------------------------------------------------------------------------
 * List (mandatory) + Group + Item
 * -----------------------------------------------------------------------------------------------*/

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
