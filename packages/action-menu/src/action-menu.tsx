/** biome-ignore-all lint/a11y/useSemanticElements: x */
/** biome-ignore-all lint/style/useSingleVarDeclarator: x */
/** biome-ignore-all lint/a11y/useAriaPropsSupportedByRole: x */

/**
 * ActionMenu — simplified version with NO intent-zone logic.
 * - Removed grace polygons, pointer tracking, geometry holds, hover guard, modality.
 * - Straightforward open/close semantics for submenus.
 * - Focus moves predictably on open; ArrowRight opens sub, ArrowLeft closes.
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
 * Utilities
 * ============================================================================================== */

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

  activeId: string | null
  setActiveId: (id: string | null) => void
  moveActive: (dir: 1 | -1) => void
  setActiveToFirstVisible: () => void
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
    moveActive,
    setActiveToFirstVisible,
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
 * Root
 * ============================================================================================== */

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
    const [ownerId, setOwnerId] = React.useState<string | null>(null)

    const handleOwnerIdChange = (id: string | null) => {
      console.log('handleOwnerIdChange', id)
      setOwnerId(id)
    }

    return (
      <RootCtx.Provider
        value={{
          open,
          onOpenChange: setOpen,
          onOpenToggle: () => setOpen((v) => !v),
          anchorRef,
        }}
      >
        <FocusOwnerCtx.Provider
          value={{ ownerId, setOwnerId: handleOwnerIdChange }}
        >
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
    const surfaceId = React.useId()

    const collectionValue = useCollectionState()

    const { ownerId, setOwnerId } = useFocusOwner()
    const isOwner = ownerId === surfaceId

    React.useEffect(() => {
      if (root.open && ownerId === null) setOwnerId(surfaceId)
    }, [root.open, ownerId, surfaceId, setOwnerId])

    // Focus when this surface is the owner
    React.useEffect(() => {
      if (!root.open || !isOwner) return
      const id = requestAnimationFrame(() => {
        ;(
          collectionValue.inputRef.current ?? collectionValue.listRef.current
        )?.focus()
      })
      return () => cancelAnimationFrame(id)
    }, [root.open, isOwner, collectionValue.inputPresent])

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
              <Primitive.div
                {...props}
                ref={ref}
                role="menu"
                tabIndex={-1}
                data-action-menu-surface
                data-surface-id={surfaceId}
                onPointerEnter={() => {
                  console.log('in root content!')
                  setOwnerId(surfaceId)
                }}
              >
                <CollectionCtx.Provider value={collectionValue}>
                  {children}
                  <span className="absolute right-0 top-0 text-xs font-medium">
                    {surfaceId}
                  </span>
                </CollectionCtx.Provider>
              </Primitive.div>
            </DismissableLayer>
          </Popper.Content>
        </Presence>
      </SurfaceCtx.Provider>
    )
  },
)
Content.displayName = 'ActionMenu.Content'

/* ================================================================================================
 * Input (keyboard nav + filtering)
 * ============================================================================================== */

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
          }
        })}
      />
    )
  },
)
Input.displayName = 'ActionMenu.Input'

/* ================================================================================================
 * List + Group + Item
 * ============================================================================================== */

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
      <Primitive.div
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
          }
        })}
      >
        {children}
      </Primitive.div>
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

  // Close when parent activeId is not my trigger
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
    }),
    [open, setOpen, parentSurfaceId, triggerItemId],
  )

  // Wrap BOTH SubTrigger and SubContent so alignment works.
  return (
    <SubCtx.Provider value={value}>
      <Popper.Root>{children}</Popper.Root>
    </SubCtx.Provider>
  )
}
Sub.displayName = 'ActionMenu.Sub'

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

    React.useEffect(() => {
      sub.setTriggerItemId(itemId)
      return () => sub.setTriggerItemId(null)
    }, [itemId])

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

    // When this row becomes active, ensure submenu opens
    React.useEffect(() => {
      if (visible && focused) sub.onOpenChange(true)
    }, [visible, focused, sub])

    return (
      <Popper.Anchor asChild>
        <Primitive.div
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
            } else if (e.key === 'ArrowRight') {
              e.preventDefault()
              sub.onOpenChange(true)
              // Move focus inside on next frame
              const contentEl = sub.contentRef.current
              requestAnimationFrame(() => {
                const input = contentEl?.querySelector<HTMLInputElement>(
                  '[data-action-menu-input]',
                )
                const list = contentEl?.querySelector<HTMLElement>(
                  '[data-action-menu-list]',
                )
                ;(input ?? list)?.focus()
              })
            }
          })}
          onFocus={composeEventHandlers(onFocus, () => {
            if (disabled || !visible) return
            sub.onOpenChange(true)
          })}
          onBlur={composeEventHandlers(onBlur as any, (e: React.FocusEvent) => {
            if (disabled) return
            // const next = e.relatedTarget as Node | null
            // const contentEl = sub.contentRef.current
            // if (contentEl && next && contentEl.contains(next)) return
            // sub.onOpenChange(false)
          })}
        >
          {children}
        </Primitive.div>
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
    const surfaceId = React.useId()

    const collectionValue = useCollectionState()

    const { ownerId, setOwnerId } = useFocusOwner()
    const isOwner = ownerId === surfaceId

    React.useEffect(() => {
      console.log('isOwner', isOwner)
      if (!sub.open || !isOwner) return
      collectionValue.inputRef.current?.focus()
    }, [ownerId])

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
              }}
              onDismiss={() => {
                sub.onOpenChange(false)
              }}
              onKeyDown={(e) => {
                // Only react if the keydown originated within this submenu
                const isInside = (e.currentTarget as HTMLElement).contains(
                  e.target as Node,
                )
                if (!isInside) return
                if (e.key === 'ArrowLeft') {
                  e.preventDefault()
                  e.stopPropagation()
                  sub.onOpenChange(false)
                  setOwnerId(sub.parentSurfaceId) // hand ownership back
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
              <Primitive.div
                {...props}
                ref={composedSurfaceRef}
                role="menu"
                tabIndex={-1}
                data-action-menu-surface
                data-submenu
                data-surface-id={surfaceId}
                onFocusCapture={handleFocusCapture}
                onPointerEnter={() => {
                  console.log(
                    'Pointer enter',
                    surfaceId,
                    'current owner:',
                    ownerId,
                  )
                  setOwnerId(surfaceId)
                }}
              >
                <CollectionCtx.Provider value={collectionValue}>
                  {children}
                  <span className="absolute right-0 top-0 text-xs font-medium">
                    {surfaceId}
                  </span>
                </CollectionCtx.Provider>
              </Primitive.div>
            </DismissableLayer>
          </Popper.Content>
        </Presence>
      </SurfaceCtx.Provider>
    )
  },
)
SubContent.displayName = 'ActionMenu.SubContent'
