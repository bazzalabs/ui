import { Popover } from '@base-ui-components/react/popover'
import {
  MenuItemPrimitive,
  MenuListPrimitive,
  createSurfaceStore,
  instantiateMenuFromDef,
  useInputActivation,
  type MenuDef,
  type Node,
  type SubmenuNode,
  type ItemNode,
  type GroupNode,
} from '@bazza-ui/menu'
import {
  HoverPolicyCtx,
  useMouseTrail,
  type HoverPolicy,
} from '@bazza-ui/popup-menu'
import * as React from 'react'
import { useRootCtx } from '../contexts/root-context.js'
import { SubCtx, type SubContextValue } from '../contexts/submenu-context.js'
import {
  useScopedTheme,
  ScopedThemeProvider,
} from '../contexts/theme-context.js'
import { mergeProps, cn } from '@bazza-ui/theming'
import type {
  RowBindAPI,
  ListBindAPI,
  ContentBindAPI,
  GroupHeadingBindAPI,
} from '../types.js'
import {
  getSmoothedHeading,
  resolveAnchorSide,
  willHitSubmenu,
} from '@bazza-ui/popup-menu'
import { ContextMenuInput } from './input.js'

export interface ContextMenuContentProps<T = unknown> {
  menu: MenuDef<T>
}

/**
 * Renders a submenu with hover behavior and safe polygon
 */
function Submenu<T>({ node }: { node: SubmenuNode<T> }) {
  const root = useRootCtx()
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLDivElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const mouseTrailRef = useMouseTrail(4)
  const hoverPolicy = React.useContext(HoverPolicyCtx)
  const { slots, classNames, slotProps } = useScopedTheme<T>()

  const subValue: SubContextValue<T> = React.useMemo(
    () => ({
      node,
      open,
      onOpenChange: setOpen,
      triggerRef,
      contentRef,
    }),
    [node, open],
  )

  // Instantiate submenu
  const submenuInstance = React.useMemo(
    () => instantiateMenuFromDef({ nodes: node.children }),
    [node.children],
  )

  const store = React.useMemo(
    () => createSurfaceStore(submenuInstance.nodes),
    [submenuInstance],
  )

  const handleItemSelect = React.useCallback(
    (childNode: Node<T>) => {
      if (
        childNode.kind === 'item' &&
        'onSelect' in childNode &&
        childNode.onSelect
      ) {
        childNode.onSelect()
      }
      root.closeAllSurfaces()
    },
    [root],
  )

  const handlePointerEnter = () => {
    if (
      hoverPolicy.aimGuardActive &&
      hoverPolicy.guardedTriggerId !== node.id
    ) {
      return
    }
    setOpen(true)
  }

  const handlePointerLeave = (e: React.PointerEvent) => {
    const contentRect = contentRef.current?.getBoundingClientRect()
    if (!contentRect) {
      hoverPolicy.clearAimGuard()
      return
    }

    const tRect = triggerRef.current?.getBoundingClientRect() ?? null
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
      hoverPolicy.activateAimGuard(node.id, 600)
    } else {
      hoverPolicy.clearAimGuard()
      setOpen(false)
    }
  }

  // Create bind API for submenu trigger
  const bind: RowBindAPI = {
    focused: false,
    disabled: false,
    getRowProps: (overrides) =>
      mergeProps(
        {
          ref: triggerRef,
          tabIndex: 0,
          'data-focused': false,
          onPointerEnter: handlePointerEnter,
          onPointerLeave: handlePointerLeave,
          className: classNames?.subtrigger,
        },
        overrides,
      ) as any,
  }

  // Get positioner props (check if it's conditional root/sub format)
  const positionerProps = React.useMemo(() => {
    const props = slotProps?.positioner
    if (!props)
      return { side: 'right' as const, align: 'start' as const, sideOffset: 4 }

    // Check if it's the conditional format { root?, sub? }
    if ('sub' in props || 'root' in props) {
      return (
        props.sub || {
          side: 'right' as const,
          align: 'start' as const,
          sideOffset: 4,
        }
      )
    }

    // It's a flat format, return as-is
    return props
  }, [slotProps])

  return (
    <SubCtx.Provider value={subValue}>
      <ScopedThemeProvider __scopeId={node.id} theme={node.ui as any}>
        <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
          {slots.SubmenuTrigger({ node, bind })}
          {open && (
            <Popover.Portal>
              <Popover.Positioner
                {...positionerProps}
                className={classNames?.positioner}
              >
                <Popover.Popup>
                  <SubmenuContent
                    node={node}
                    store={store}
                    contentRef={contentRef}
                    submenuInstance={submenuInstance}
                    onItemSelect={handleItemSelect}
                  />
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          )}
        </Popover.Root>
      </ScopedThemeProvider>
    </SubCtx.Provider>
  )
}

/**
 * Renders submenu content using themed slots
 */
function SubmenuContent<T>({
  store,
  contentRef,
  submenuInstance,
  onItemSelect,
}: {
  node: SubmenuNode<T>
  store: ReturnType<typeof createSurfaceStore>
  contentRef: React.MutableRefObject<HTMLDivElement | null>
  submenuInstance: ReturnType<typeof instantiateMenuFromDef>
  onItemSelect: (node: Node<T>) => void
}) {
  const root = useRootCtx()
  const { slots, classNames, slotProps } = useScopedTheme<T>()

  // Create bind APIs
  const contentBind: ContentBindAPI = {
    getContentProps: (overrides) =>
      mergeProps(
        {
          ref: contentRef,
          role: 'menu' as const,
          tabIndex: -1,
          'data-slot': 'context-menu-content',
          'data-context-menu-surface': true,
          ...slotProps?.content,
          className: classNames?.content,
        },
        overrides,
      ) as any,
  }

  const listBind: ListBindAPI = {
    getListProps: (overrides) =>
      mergeProps(
        {
          role: 'menu' as const,
          tabIndex: 0,
          'data-slot': 'context-menu-list',
          'data-context-menu-list': true,
          ...slotProps?.list,
          className: classNames?.list,
        },
        overrides,
      ) as any,
    getItemOrder: () => submenuInstance.nodes.map((n) => n.id),
    getActiveId: () => null,
  }

  return slots.Content({
    children: (
      <MenuListPrimitive
        store={store}
        role="menu"
        vimBindings={true}
        onEscape={() => root.closeAllSurfaces()}
        {...listBind.getListProps()}
      >
        {slots.List({
          children: submenuInstance.nodes.map((child) => {
            if (child.kind === 'separator') {
              return slots.Separator?.({ node: child }) ?? null
            }

            if (child.kind === 'item') {
              return (
                <MenuItemPrimitive
                  key={child.id}
                  store={store}
                  node={child}
                  onSelect={() => onItemSelect(child)}
                >
                  {(primitiveBind) => {
                    const bind: RowBindAPI = {
                      focused: primitiveBind.focused,
                      disabled: primitiveBind.disabled,
                      getRowProps: (overrides) =>
                        mergeProps(
                          {
                            ...primitiveBind.getRowProps(),
                            className: classNames?.item,
                          },
                          overrides,
                        ) as any,
                    }
                    return slots.Item({ node: child as ItemNode<T>, bind })
                  }}
                </MenuItemPrimitive>
              )
            }

            if (child.kind === 'submenu') {
              return <Submenu key={child.id} node={child} />
            }

            return null
          }),
          bind: listBind,
        })}
      </MenuListPrimitive>
    ),
    bind: contentBind,
  })
}

/**
 * Renders the menu content using primitives from @bazza-ui/menu
 */
export function ContextMenuContent<T>({ menu }: ContextMenuContentProps<T>) {
  const root = useRootCtx()
  const { slots, classNames, slotProps } = useScopedTheme<T>()

  // Instantiate menu from definition
  const menuInstance = React.useMemo(() => instantiateMenuFromDef(menu), [menu])

  // Create surface store for state management
  const store = React.useMemo(
    () => createSurfaceStore(menuInstance.nodes),
    [menuInstance],
  )

  // Input activation hook (default hideSearchUntilActive: true for context menus)
  const hideSearchUntilActive = menu.hideSearchUntilActive ?? false
  const { inputActive, setInputActive, query, setQuery, handleTypeStart } =
    useInputActivation(hideSearchUntilActive)

  // Update store hasInput state when inputActive changes
  React.useEffect(() => {
    store.set('hasInput', inputActive)
  }, [inputActive, store])

  // Focus input when it becomes active
  React.useEffect(() => {
    if (inputActive && query) {
      requestAnimationFrame(() => {
        store.inputRef.current?.focus()
      })
    }
  }, [inputActive, query, store.inputRef])

  // Hover policy state for aim guard
  const [aimGuardActive, setAimGuardActive] = React.useState(false)
  const [guardedTriggerId, setGuardedTriggerId] = React.useState<string | null>(
    null,
  )
  const aimGuardActiveRef = React.useRef(false)
  const guardedTriggerIdRef = React.useRef<string | null>(null)
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  const hoverPolicy: HoverPolicy = React.useMemo(
    () => ({
      suppressHoverOpen: false,
      clearSuppression: () => {},
      aimGuardActive,
      guardedTriggerId,
      activateAimGuard: (triggerId: string, timeoutMs = 600) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setAimGuardActive(true)
        setGuardedTriggerId(triggerId)
        aimGuardActiveRef.current = true
        guardedTriggerIdRef.current = triggerId
        timeoutRef.current = setTimeout(() => {
          setAimGuardActive(false)
          setGuardedTriggerId(null)
          aimGuardActiveRef.current = false
          guardedTriggerIdRef.current = null
        }, timeoutMs)
      },
      clearAimGuard: () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setAimGuardActive(false)
        setGuardedTriggerId(null)
        aimGuardActiveRef.current = false
        guardedTriggerIdRef.current = null
      },
      aimGuardActiveRef,
      guardedTriggerIdRef,
      isGuardBlocking: (rowId: string) => {
        return (
          aimGuardActiveRef.current && guardedTriggerIdRef.current !== rowId
        )
      },
    }),
    [aimGuardActive, guardedTriggerId],
  )

  // Close menu on item select
  const handleItemSelect = React.useCallback(
    (node: Node<T>) => {
      if (node.kind === 'item' && 'onSelect' in node && node.onSelect) {
        node.onSelect()
      }
      root.closeAllSurfaces()
    },
    [root],
  )

  // Create bind APIs
  const contentBind: ContentBindAPI = {
    getContentProps: (overrides) =>
      mergeProps(
        {
          role: 'menu' as const,
          tabIndex: -1,
          'data-slot': 'context-menu-content',
          'data-context-menu-surface': true,
          ...slotProps?.content,
          className: classNames?.content,
        },
        overrides,
      ) as any,
  }

  const listBind: ListBindAPI = {
    getListProps: (overrides) =>
      mergeProps(
        {
          role: 'menu' as const,
          tabIndex: inputActive ? -1 : 0, // Not focusable if input is active
          'data-slot': 'context-menu-list',
          'data-context-menu-list': true,
          ...slotProps?.list,
          className: classNames?.list,
        },
        overrides,
      ) as any,
    getItemOrder: () => menuInstance.nodes.map((n) => n.id),
    getActiveId: () => null,
  }

  // Keyboard handler to activate input on typing
  const handleListKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const activated = handleTypeStart(e)
      if (activated) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    [handleTypeStart],
  )

  return (
    <HoverPolicyCtx.Provider value={hoverPolicy}>
      {slots.Content({
        children: (
          <>
            {inputActive && (
              <ContextMenuInput
                store={store}
                value={query}
                onValueChange={setQuery}
                vimBindings={true}
                onClose={() => root.closeAllSurfaces()}
              />
            )}
            <MenuListPrimitive
              store={store}
              role="menu"
              vimBindings={true}
              onEscape={() => root.closeAllSurfaces()}
              onKeyDown={handleListKeyDown}
              {...listBind.getListProps()}
            >
              {slots.List({
                children: menuInstance.nodes.map((node) => {
                  if (node.kind === 'separator') {
                    return (
                      <React.Fragment key={node.id}>
                        {slots.Separator?.({ node })}
                      </React.Fragment>
                    )
                  }

                  if (node.kind === 'item') {
                    return (
                      <MenuItemPrimitive
                        key={node.id}
                        store={store}
                        node={node}
                        onSelect={() => handleItemSelect(node)}
                      >
                        {(primitiveBind) => {
                          const bind: RowBindAPI = {
                            focused: primitiveBind.focused,
                            disabled: primitiveBind.disabled,
                            getRowProps: (overrides) =>
                              mergeProps(
                                {
                                  ...primitiveBind.getRowProps(),
                                  className: classNames?.item,
                                },
                                overrides,
                              ) as any,
                          }
                          return slots.Item({ node: node as ItemNode<T>, bind })
                        }}
                      </MenuItemPrimitive>
                    )
                  }

                  if (node.kind === 'group') {
                    return (
                      <React.Fragment key={node.id}>
                        {node.label &&
                          slots.GroupHeading?.({
                            node: node as GroupNode<T>,
                            bind: {
                              getGroupHeadingProps: (overrides) =>
                                mergeProps(
                                  {
                                    className: classNames?.groupHeading,
                                    'data-group-size': node.children.length,
                                  },
                                  overrides,
                                ) as any,
                            },
                          })}
                        {node.children.map((child) => {
                          if (child.kind === 'item') {
                            return (
                              <MenuItemPrimitive
                                key={child.id}
                                store={store}
                                node={child}
                                onSelect={() => handleItemSelect(child)}
                              >
                                {(primitiveBind) => {
                                  const bind: RowBindAPI = {
                                    focused: primitiveBind.focused,
                                    disabled: primitiveBind.disabled,
                                    getRowProps: (overrides) =>
                                      mergeProps(
                                        {
                                          ...primitiveBind.getRowProps(),
                                          className: classNames?.item,
                                        },
                                        overrides,
                                      ) as any,
                                  }
                                  return slots.Item({
                                    node: child as ItemNode<T>,
                                    bind,
                                  })
                                }}
                              </MenuItemPrimitive>
                            )
                          }
                          return null
                        })}
                      </React.Fragment>
                    )
                  }

                  if (node.kind === 'submenu') {
                    return <Submenu key={node.id} node={node} />
                  }

                  return null
                }),
                bind: listBind,
              })}
            </MenuListPrimitive>
          </>
        ),
        bind: contentBind,
      })}
    </HoverPolicyCtx.Provider>
  )
}
