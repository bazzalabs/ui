import { Popover } from '@base-ui-components/react/popover'
import type { SearchContext, SubmenuNode } from '@bazza-ui/menu'
import { mergeProps } from '@bazza-ui/theming'
import { composeRefs } from '@radix-ui/react-compose-refs'
import * as React from 'react'
import { useFocusOwner } from '../contexts/focus-owner-context.js'
import { useHoverPolicy } from '../contexts/hover-policy-context.js'
import { useSub } from '../contexts/submenu-context.js'
import { useMouseTrail } from '../hooks/use-mouse-trail.js'
import { useSurfaceSel } from '../hooks/use-surface-sel.js'
import {
  getSmoothedHeading,
  resolveAnchorSide,
  willHitSubmenu,
} from '../lib/aim-guard.js'
import { OPEN_SUB_EVENT } from '../lib/events.js'
import type {
  PopupMenuClassNames,
  PopupSubmenuNode,
  RowBindAPI,
} from '../types.js'
import { findWidgetsWithinSurface } from '../utils/dom.js'
import { useSurface } from './surface-provider.js'

interface PopupMenuSubmenuTriggerProps<T> {
  node: PopupSubmenuNode<T>
  slot: (args: {
    node: PopupSubmenuNode<T>
    bind: RowBindAPI
    search?: SearchContext
  }) => React.ReactNode
  classNames?: PopupMenuClassNames
  search?: SearchContext
  ref?: React.Ref<HTMLDivElement>
}

/**
 * PopupMenuSubmenuTrigger handles the interactive trigger element for submenus.
 * Implements safe polygon logic for diagonal mouse navigation.
 */
export function PopupMenuSubmenuTrigger<T>({
  node,
  slot,
  classNames,
  search,
  ref: refProp,
}: PopupMenuSubmenuTriggerProps<T>) {
  const surfaceCtx = useSurface()
  const store = surfaceCtx.store
  const sub = useSub()!
  const { setOwnerId, ownerId } = useFocusOwner()
  const {
    guardedTriggerIdRef,
    aimGuardActiveRef,
    activateAimGuard,
    clearAimGuard,
  } = useHoverPolicy()
  const mouseTrailRef = useMouseTrail(4)
  const ref = React.useRef<HTMLElement | null>(null)

  const rowId = node.id

  // Track whether the submenu content has focus
  const menuFocused = sub.childSurfaceId === ownerId

  // Register this submenu trigger as a row in the parent surface store
  React.useEffect(() => {
    store.registerRow(rowId, {
      ref: ref as any,
      disabled: false,
      kind: 'submenu',
      openSub: () => sub.onOpenChange(true),
      closeSub: () => sub.onOpenChange(false),
    })
    return () => store.unregisterRow(rowId)
  }, [store, rowId, sub])

  // Listen for keyboard-triggered open events
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

  // Update trigger item ID
  React.useEffect(() => {
    if (sub.triggerItemId !== rowId) sub.setTriggerItemId(rowId)
    return () => {
      if (sub.triggerItemId === rowId) sub.setTriggerItemId(null)
    }
  }, [rowId, sub])

  const activeId = useSurfaceSel(store, (s) => s.activeId)
  const focused = activeId === rowId

  const onClick = React.useCallback((e: any) => {
    e.preventBaseUIHandler?.()
  }, [])

  const onPointerUp = React.useCallback((e: any) => {
    e.preventBaseUIHandler?.()
  }, [])

  const onPointerDown = React.useCallback(
    (e: any) => {
      e.preventBaseUIHandler?.()
      if (e.button === 0 && e.ctrlKey === false) {
        e.preventDefault()
        sub.pendingOpenModalityRef.current = 'pointer'
        // Only open the submenu if it's not already open
        if (!sub.open) {
          sub.onOpenChange(true)
        }
      }
    },
    [sub],
  )

  const onPointerEnter = React.useCallback(
    (e: any) => {
      e.preventBaseUIHandler?.()

      if (store.ignorePointerRef.current) return
      if (aimGuardActiveRef.current && guardedTriggerIdRef.current !== rowId)
        return

      if (!focused) {
        store.setActiveId(rowId, 'pointer')
      }

      clearAimGuard()
      if (!sub.open) sub.onOpenChange(true)
    },
    [
      aimGuardActiveRef,
      guardedTriggerIdRef,
      rowId,
      focused,
      store,
      clearAimGuard,
      sub,
    ],
  )

  const onPointerMove = React.useCallback(
    (e: any) => {
      e.preventBaseUIHandler?.()

      if (store.ignorePointerRef.current) return
      if (aimGuardActiveRef.current && guardedTriggerIdRef.current !== rowId)
        return

      if (!focused) {
        store.setActiveId(rowId, 'pointer')
      }
      if (!sub.open) sub.onOpenChange(true)
    },
    [aimGuardActiveRef, guardedTriggerIdRef, rowId, focused, store, sub],
  )

  // CRITICAL: Safe polygon logic for diagonal navigation
  const onPointerLeave = React.useCallback(
    (e: any) => {
      e.preventBaseUIHandler?.()

      if (store.ignorePointerRef.current) return
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
        // User is aiming at submenu - activate aim guard for 600ms
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

  const baseRowProps = React.useMemo(
    () => ({
      id: rowId,
      ref: composeRefs(refProp as any, ref as any, sub.triggerRef as any),
      role: 'option' as const,
      tabIndex: -1,
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
      className: classNames?.subtrigger,
      onClick,
      onPointerUp,
      onPointerDown,
      onPointerEnter,
      onPointerMove,
      onPointerLeave,
    }),
    [
      rowId,
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
    ],
  )

  const bind: RowBindAPI = React.useMemo(
    () => ({
      focused,
      disabled: false,
      getRowProps: (overrides) => mergeProps(baseRowProps, overrides) as any,
    }),
    [focused, baseRowProps],
  )

  const visual = slot({ node, bind, search })

  // Check if the slot already rendered the row props
  const content =
    React.isValidElement(visual) &&
    (visual.props as any)['data-action-menu-item-id']
      ? visual
      : React.createElement('div', baseRowProps as any, visual ?? node.label)

  return <Popover.Trigger render={content as any} nativeButton={false} />
}
