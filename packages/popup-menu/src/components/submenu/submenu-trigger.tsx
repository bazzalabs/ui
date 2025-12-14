import { Popover } from '@base-ui-components/react/popover'
import { getRowId, type SearchContext, type SubmenuNode } from '@bazza-ui/menu'
import { mergeProps } from '@bazza-ui/theming'
import { composeRefs } from '@radix-ui/react-compose-refs'
import * as React from 'react'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import {
  getSmoothedHeading,
  resolveAnchorSide,
  willHitSubmenu,
} from '../../features/hover-policy/aim-guard.js'
import { useHoverPolicy } from '../../features/hover-policy/hover-policy-context.js'
import { useMouseTrail } from '../../features/hover-policy/use-mouse-trail.js'
import { OPEN_SUB_EVENT } from '../../features/interaction/events.js'
import {
  useActiveId,
  usePopupMenuActions,
  useSurfaceRefs,
} from '../../store/index.js'
import type {
  PopupMenuClassNames,
  PopupSubmenuNode,
  RowBindAPI,
} from '../../types.js'
import { findWidgetsWithinSurface } from '../../utils/dom.js'
import { useSub } from '../submenu/submenu-context.js'
import { useSurface } from '../surface/surface-provider.js'

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
  const { surfaceId, control } = useSurface()
  const storeActions = usePopupMenuActions()
  const surfaceRefs = useSurfaceRefs(surfaceId)
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

  const rowId = getRowId(node)

  // Track whether the submenu content has focus
  const menuFocused = sub.childSurfaceId === ownerId

  // Check menu-wide disabled state from control (if provided)
  const menuDisabled = control?.getState().disabled ?? false

  // Combine: menu-wide OR node-level disabled
  const disabled = menuDisabled || node.disabled || false

  // Register this submenu trigger as a row in the parent surface store
  React.useEffect(() => {
    storeActions.registerRow(surfaceId, rowId, {
      ref: ref as any,
      disabled,
      kind: 'submenu',
      openSub: () => sub.onOpenChange(true),
      closeSub: () => sub.onOpenChange(false),
    })
    return () => storeActions.unregisterRow(surfaceId, rowId)
  }, [storeActions, surfaceId, rowId, sub, disabled])

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

  const activeId = useActiveId(surfaceId)
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
      if (disabled) return
      if (e.button === 0 && e.ctrlKey === false) {
        e.preventDefault()
        sub.pendingOpenModalityRef.current = 'pointer'
        // Only open the submenu if it's not already open
        if (!sub.open) {
          sub.onOpenChange(true)
        }
      }
    },
    [sub, disabled],
  )

  const onPointerEnter = React.useCallback(
    (e: any) => {
      e.preventBaseUIHandler?.()

      if (disabled) return
      if (surfaceRefs?.ignorePointerRef.current) return
      if (aimGuardActiveRef.current && guardedTriggerIdRef.current !== rowId)
        return

      if (!focused) {
        storeActions.setSurfaceActiveId(surfaceId, rowId, 'pointer')
      }

      clearAimGuard()
      if (!sub.open) sub.onOpenChange(true)
    },
    [
      disabled,
      aimGuardActiveRef,
      guardedTriggerIdRef,
      rowId,
      focused,
      surfaceRefs,
      storeActions,
      surfaceId,
      clearAimGuard,
      sub,
    ],
  )

  const onPointerMove = React.useCallback(
    (e: any) => {
      e.preventBaseUIHandler?.()

      if (disabled) return
      if (surfaceRefs?.ignorePointerRef.current) return
      if (aimGuardActiveRef.current && guardedTriggerIdRef.current !== rowId)
        return

      if (!focused) {
        storeActions.setSurfaceActiveId(surfaceId, rowId, 'pointer')
      }
      if (!sub.open) sub.onOpenChange(true)
    },
    [
      disabled,
      aimGuardActiveRef,
      guardedTriggerIdRef,
      rowId,
      focused,
      surfaceRefs,
      storeActions,
      surfaceId,
      sub,
    ],
  )

  // CRITICAL: Safe polygon logic for diagonal navigation
  const onPointerLeave = React.useCallback(
    (e: any) => {
      e.preventBaseUIHandler?.()

      if (disabled) return
      if (surfaceRefs?.ignorePointerRef.current) return
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
        storeActions.setSurfaceActiveId(surfaceId, rowId, 'pointer')
        sub.onOpenChange(true)
      } else {
        clearAimGuard()
      }
    },
    [
      disabled,
      aimGuardActiveRef,
      guardedTriggerIdRef,
      rowId,
      sub,
      clearAimGuard,
      mouseTrailRef,
      activateAimGuard,
      surfaceRefs,
      storeActions,
      surfaceId,
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
      'aria-disabled': disabled,
      'data-disabled': disabled,
      disabled,
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
      disabled,
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
      disabled,
      getRowProps: (overrides) => mergeProps(baseRowProps, overrides) as any,
    }),
    [focused, disabled, baseRowProps],
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
