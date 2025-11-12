import { Popover } from '@base-ui-components/react/popover'
import { composeRefs } from '@radix-ui/react-compose-refs'
import type { VirtualItem } from '@tanstack/react-virtual'
import * as React from 'react'
import { Drawer } from 'vaul'
import {
  useDisplayMode,
  useFocusOwner,
  useHoverPolicy,
  useSubCtx,
  useSurface,
  useSurfaceId,
} from '../contexts/index.js'
import { useMouseTrail } from '../hooks/use-mouse-trail.js'
import { useSurfaceSel } from '../hooks/use-surface-sel.js'
import {
  getSmoothedHeading,
  resolveAnchorSide,
  willHitSubmenu,
} from '../lib/aim-guard.js'
import { findWidgetsWithinSurface } from '../lib/dom-utils.js'
import { OPEN_SUB_EVENT } from '../lib/events.js'
import { mergeProps } from '../lib/merge-props.js'
import { hasDescendantWithProp } from '../lib/react-utils.js'
import type {
  RowBindAPI,
  SearchContext,
  SubmenuNode,
  SurfaceClassNames,
  SurfaceSlots,
} from '../types.js'

function makeRowId(
  baseId: string,
  search: SearchContext | undefined,
  surfaceId: string | null,
) {
  if (!search || !search.isDeep || !surfaceId) return baseId
  return baseId // keep stable to avoid breaking references
}

interface SubmenuTriggerProps<T> {
  virtualItem?: VirtualItem
  node: SubmenuNode<T>
  slot: NonNullable<SurfaceSlots<T>['SubmenuTrigger']>
  classNames?: Partial<SurfaceClassNames>
  search?: SearchContext
  ref?: React.Ref<HTMLDivElement>
}

export function SubmenuTrigger<T>({
  virtualItem,
  node,
  slot,
  classNames,
  search,
  ref: refProp,
}: SubmenuTriggerProps<T>) {
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
      virtualItem,
      disabled: false,
      kind: 'submenu',
      openSub: () => sub.onOpenChange(true),
      closeSub: () => sub.onOpenChange(false),
    })
    return () => store.unregisterRow(rowId)
  }, [store, rowId, sub, virtualItem])

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

  const onClick = React.useCallback((e: any) => {
    // Prevent Base UI's default toggle behavior using the official API
    e.preventBaseUIHandler?.()
  }, [])

  const onPointerUp = React.useCallback((e: any) => {
    // Also prevent on pointer up since Base UI may use this event
    e.preventBaseUIHandler?.()
  }, [])

  const onPointerDown = React.useCallback(
    (e: any) => {
      // Prevent Base UI's handler on pointer down as well
      e.preventBaseUIHandler?.()
      if (e.button === 0 && e.ctrlKey === false) {
        e.preventDefault()
        sub.pendingOpenModalityRef.current = 'pointer'
        sub.onOpenToggle()
      }
    },
    [sub],
  )

  const onPointerEnter = React.useCallback(() => {
    if (aimGuardActiveRef.current && guardedTriggerIdRef.current !== rowId)
      return

    if (!focused) {
      // setActiveId will close other submenus
      store.setActiveId(rowId, 'pointer')
    }

    clearAimGuard()
    if (!sub.open) sub.onOpenChange(true)
  }, [
    aimGuardActiveRef,
    guardedTriggerIdRef,
    rowId,
    focused,
    store,
    clearAimGuard,
    sub,
  ])

  const onPointerMove = React.useCallback(() => {
    if (aimGuardActiveRef.current && guardedTriggerIdRef.current !== rowId)
      return
    if (!focused) {
      // setActiveId will close other submenus
      store.setActiveId(rowId, 'pointer')
    }
    if (!sub.open) sub.onOpenChange(true)
  }, [aimGuardActiveRef, guardedTriggerIdRef, rowId, focused, store, sub])

  const onPointerLeave = React.useCallback(
    (e: React.PointerEvent) => {
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
    [
      aimGuardActiveRef,
      guardedTriggerIdRef,
      rowId,
      sub,
      clearAimGuard,
      mouseTrailRef,
      activateAimGuard,
      store,
    ],
  )

  const onKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    // Keep keyboard navigation; Enter will bubble to Drawer.Trigger
    if (
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End'
    ) {
      // let list/input handlers deal with it via useNavKeydown
    }
  }, [])

  const baseRowProps = React.useMemo(() => {
    const common = {
      id: rowId,
      ref: composeRefs(refProp as any, ref as any, sub.triggerRef as any),
      role: 'option' as const,
      tabIndex: -1,
      'action-menu-row': '',
      'data-index': virtualItem?.index,
      'data-action-menu-item-id': rowId,
      'data-focused': focused,
      'data-menu-state': sub.open ? 'open' : 'closed',
      'data-menu-focused': menuFocused,
      'data-group-position': node.groupPosition,
      'data-group-index': node.groupIndex,
      'data-group-size': node.groupSize,
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
        onKeyDown,
      } as const
    }

    // Dropdown (Popper) mode: keep your original hover + aim-guard behavior
    return {
      ...common,
      onClick,
      onPointerUp,
      onPointerDown,
      onPointerEnter,
      onPointerMove,
      onPointerLeave,
    } as const
  }, [
    mode,
    rowId,
    virtualItem?.index,
    refProp,
    sub,
    focused,
    menuFocused,
    node.groupPosition,
    node.groupIndex,
    node.groupSize,
    classNames?.subtrigger,
    onClick,
    onPointerUp,
    onPointerDown,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
    onKeyDown,
  ])

  const bind: RowBindAPI = React.useMemo(
    () => ({
      focused,
      disabled: false,
      getRowProps: (overrides) =>
        mergeProps(baseRowProps as any, overrides as any),
    }),
    [focused, baseRowProps],
  )

  const visual = slot({ node, bind, search })
  const content = hasDescendantWithProp(visual, 'data-action-menu-item-id') ? (
    visual
  ) : (
    <div {...(baseRowProps as any)}>{visual ?? node.label ?? node.title}</div>
  )

  return mode === 'drawer' ? (
    <Drawer.Trigger asChild>{content as any}</Drawer.Trigger>
  ) : (
    <Popover.Trigger render={content as any} nativeButton={false} />
  )
}
