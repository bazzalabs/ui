'use client'

import { Popover } from '@base-ui/react/popover'
import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useAimGuard } from '../contexts/aim-guard-context.js'
import { useRootContext } from '../contexts/root-context.js'
import { useSubmenuContext } from '../contexts/submenu-context.js'
import {
  useGroupContext,
  useSurfaceContext,
} from '../contexts/surface-context.js'
import {
  getSmoothedHeading,
  resolveAnchorSide,
  willHitSubmenu,
} from '../utils/aim-guard.js'
import { useMouseTrail } from '../utils/use-mouse-trail.js'
import { DropdownMenuSubmenuTriggerDataAttributes } from './submenu-trigger.data-attrs.js'

export interface DropdownMenuSubmenuTriggerState
  extends Record<string, unknown> {
  /**
   * Whether this is a submenu trigger (always true).
   */
  submenuTrigger: boolean
  /**
   * Whether the submenu is open.
   */
  submenuOpen: boolean
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean
  /**
   * Whether the item is disabled.
   */
  disabled: boolean
}

// Custom mapping to convert state to kebab-case data attributes
const stateAttributesMapping = {
  submenuTrigger: (value: unknown) =>
    value
      ? { [DropdownMenuSubmenuTriggerDataAttributes.submenuTrigger]: '' }
      : null,
  submenuOpen: (value: unknown) =>
    value
      ? { [DropdownMenuSubmenuTriggerDataAttributes.submenuOpen]: '' }
      : null,
  highlighted: (value: unknown) =>
    value
      ? { [DropdownMenuSubmenuTriggerDataAttributes.highlighted]: '' }
      : null,
  disabled: (value: unknown) =>
    value ? { [DropdownMenuSubmenuTriggerDataAttributes.disabled]: '' } : null,
}

export interface DropdownMenuSubmenuTriggerProps
  extends ComponentProps<'div', DropdownMenuSubmenuTriggerState> {
  /**
   * Unique value for this item used for filtering.
   * If not provided, will be inferred from textContent.
   */
  value?: string

  /**
   * Additional keywords to match against when filtering.
   * Useful for aliases or synonyms.
   */
  keywords?: string[]

  /**
   * Whether this item is disabled.
   * Disabled items are not selectable and are skipped during keyboard navigation.
   */
  disabled?: boolean

  /**
   * Whether to force render this item regardless of filter results.
   * @default false
   */
  forceMount?: boolean
}

/**
 * A menu item that opens a submenu when hovered.
 * Must be used within DropdownMenu.Submenu.
 * Renders a `<div>` element with role="menuitem" wrapped in Popover.Trigger.
 */
export const DropdownMenuSubmenuTrigger = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSubmenuTriggerProps
>(function DropdownMenuSubmenuTrigger(props, forwardedRef) {
  const {
    value: valueProp,
    keywords,
    disabled = false,
    forceMount = false,
    render,
    className,
    style,
    onPointerDown,
    onPointerMove,
    onPointerEnter,
    onPointerLeave,
    children,
    ...rest
  } = props

  // Get parent menu's store (from Surface context)
  const { store: parentStore } = useSurfaceContext()
  const groupContext = useGroupContext()

  // Get depth from root context (this is the submenu's depth, parent is depth - 1)
  const { depth } = useRootContext()
  const parentDepth = depth - 1

  // Get submenu context for open state and refs
  const submenuContext = useSubmenuContext()
  const { open, setOpen, triggerRef, contentRef } = submenuContext

  // Get aim guard for safe polygon navigation
  const {
    aimGuardActiveRef,
    guardedTriggerIdRef,
    guardedDepthRef,
    activateAimGuard,
    clearAimGuard,
  } = useAimGuard()

  // Track mouse positions for aim guard trajectory calculation
  const mouseTrailRef = useMouseTrail(4)

  const id = React.useId()
  const ref = React.useRef<HTMLDivElement>(null)

  // Infer value from textContent if not provided
  const [inferredValue, setInferredValue] = React.useState<string>('')

  React.useLayoutEffect(() => {
    if (valueProp === undefined && ref.current) {
      const textContent = ref.current.textContent?.trim() ?? ''
      setInferredValue(textContent)
    }
  }, [valueProp, children])

  const value = valueProp ?? inferredValue

  // Register item with parent store (as submenu trigger)
  React.useEffect(() => {
    if (!value && !forceMount) return

    const unregister = parentStore.registerItem(id, {
      value,
      keywords,
      groupId: groupContext?.groupId,
      disabled,
      isSubmenuTrigger: true,
    })

    return unregister
  }, [
    id,
    value,
    keywords,
    groupContext?.groupId,
    disabled,
    parentStore,
    forceMount,
  ])

  // Register submenu open callback with parent store
  React.useEffect(() => {
    return parentStore.registerSubmenuOpen(id, () => setOpen(true))
  }, [id, parentStore, setOpen])

  // Register submenu close callback with parent store
  // This allows the store to close this submenu when another item is highlighted
  React.useEffect(() => {
    return parentStore.registerSubmenuClose(id, () => setOpen(false))
  }, [id, parentStore, setOpen])

  // Use selectors to get derived state from parent store
  const search = parentStore.useState('search')
  const isHighlighted = parentStore.useState('isHighlighted', id)
  const score = parentStore.useState('getItemScore', id)

  // Determine visibility based on filter score
  const hasSearch = search.length > 0
  const isVisible = forceMount || !hasSearch || score > 0

  // Scroll into view when highlighted via keyboard
  React.useEffect(() => {
    if (isHighlighted && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest' })
    }
  }, [isHighlighted])

  // Set the trigger ref when element mounts
  React.useEffect(() => {
    ;(triggerRef as React.MutableRefObject<HTMLElement | null>).current =
      ref.current
    return () => {
      ;(triggerRef as React.MutableRefObject<HTMLElement | null>).current = null
    }
  }, [triggerRef])

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Prevent focus from leaving the input
      event.preventDefault()
      onPointerDown?.(event)
    },
    [onPointerDown],
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)

      if (event.defaultPrevented) return
      if (disabled) return

      // Don't highlight if aim guard is active at this depth for a different trigger
      if (
        aimGuardActiveRef.current &&
        guardedDepthRef.current === parentDepth &&
        guardedTriggerIdRef.current !== id
      )
        return

      // Highlight on hover
      parentStore.setHighlightedId(id)
    },
    [
      onPointerMove,
      disabled,
      aimGuardActiveRef,
      guardedDepthRef,
      parentDepth,
      guardedTriggerIdRef,
      id,
      parentStore,
    ],
  )

  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerEnter?.(event)

      if (event.defaultPrevented) return
      if (disabled) return

      // Check if aim guard is blocking this trigger
      if (aimGuardActiveRef.current && guardedTriggerIdRef.current !== id)
        return

      // Clear any existing aim guard and open submenu
      clearAimGuard()
      setOpen(true)
    },
    [
      onPointerEnter,
      disabled,
      aimGuardActiveRef,
      guardedTriggerIdRef,
      id,
      clearAimGuard,
      setOpen,
    ],
  )

  const handlePointerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(event)

      if (event.defaultPrevented) return
      if (disabled) return

      // Check if aim guard is blocking this trigger
      if (aimGuardActiveRef.current && guardedTriggerIdRef.current !== id)
        return

      // Get the submenu content rect for safe polygon calculation
      const contentRect = contentRef.current?.getBoundingClientRect()
      if (!contentRect) {
        clearAimGuard()
        setOpen(false)
        return
      }

      // Check if pointer is already inside the popup (can happen with fast movement or overlapping elements)
      const { clientX, clientY } = event
      const isInsidePopup =
        clientX >= contentRect.left &&
        clientX <= contentRect.right &&
        clientY >= contentRect.top &&
        clientY <= contentRect.bottom

      if (isInsidePopup) {
        // Pointer is already in the popup, clear guard and keep open
        clearAimGuard()
        return
      }

      // Get trigger rect for aim guard calculation
      const tRect = triggerRef.current?.getBoundingClientRect() ?? null

      // Calculate safe polygon and check if user is aiming toward submenu
      const anchor = resolveAnchorSide(contentRect, tRect, clientX)
      const heading = getSmoothedHeading(
        mouseTrailRef.current,
        clientX,
        clientY,
        anchor,
        tRect,
        contentRect,
      )
      const hit = willHitSubmenu(
        clientX,
        clientY,
        heading,
        contentRect,
        anchor,
        tRect,
      )

      // DEBUG: Uncomment to debug aim guard issues
      // console.log('[AimGuard]', { clientX, clientY, contentRect, anchor, heading, hit, trail: [...mouseTrailRef.current] })

      if (hit) {
        // User is aiming at submenu - activate aim guard for 600ms
        // Guard is activated at parentDepth to block highlighting in the parent menu only
        activateAimGuard(id, parentDepth, 600)
        parentStore.setHighlightedId(id)
        setOpen(true)
      } else {
        // User is not aiming at submenu - close it
        clearAimGuard()
        setOpen(false)
      }
    },
    [
      onPointerLeave,
      disabled,
      aimGuardActiveRef,
      guardedTriggerIdRef,
      id,
      contentRef,
      clearAimGuard,
      setOpen,
      triggerRef,
      mouseTrailRef,
      activateAimGuard,
      parentDepth,
      parentStore,
    ],
  )

  const state: DropdownMenuSubmenuTriggerState = React.useMemo(
    () => ({
      submenuTrigger: true,
      submenuOpen: open,
      highlighted: isHighlighted,
      disabled,
    }),
    [open, isHighlighted, disabled],
  )

  // Use useRender to create the element with state-based data attributes
  const element = useRender({
    render,
    ref: [ref, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      id,
      role: 'menuitem',
      'aria-haspopup': 'menu',
      'aria-expanded': open,
      tabIndex: -1,
      'aria-disabled': disabled || undefined,
      className,
      style,
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
      children,
    },
    defaultTagName: 'div',
  })

  // Don't render if not visible
  if (!isVisible) return null

  return <Popover.Trigger render={element} />
})

export namespace DropdownMenuSubmenuTrigger {
  export type State = DropdownMenuSubmenuTriggerState
  export interface Props extends DropdownMenuSubmenuTriggerProps {}
}
