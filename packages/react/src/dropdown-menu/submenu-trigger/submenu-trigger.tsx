'use client'

import { Popover } from '@base-ui/react/popover'
import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useAimGuard } from '../contexts/aim-guard-context.js'
import { useFocusOwner } from '../contexts/focus-owner-context.js'
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
   * Whether the submenu popup is open.
   */
  popupOpen: boolean
  /**
   * Whether the submenu owns keyboard focus.
   */
  popupFocused: boolean
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
  popupOpen: (value: unknown) =>
    value ? { [DropdownMenuSubmenuTriggerDataAttributes.popupOpen]: '' } : null,
  popupFocused: (value: unknown) =>
    value
      ? { [DropdownMenuSubmenuTriggerDataAttributes.popupFocused]: '' }
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

  /**
   * Whether the submenu opens when this trigger is highlighted.
   * @default true
   */
  openOnHighlight?: boolean

  /**
   * Delay before opening the submenu (in milliseconds).
   * Can be a number (applies to both pointer and keyboard) or an object
   * with separate `pointer` and `keyboard` values.
   * @default { pointer: 0, keyboard: 150 }
   */
  delay?: number | { pointer?: number; keyboard?: number }

  /**
   * Delay before closing the submenu when pointer leaves (in milliseconds).
   * @default 0
   */
  closeDelay?: number
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
    openOnHighlight = true,
    delay: delayProp,
    closeDelay = 0,
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

  // Normalize delay prop to { pointer, keyboard } format
  const delay = React.useMemo(() => {
    if (typeof delayProp === 'number') {
      return { pointer: delayProp, keyboard: delayProp }
    }
    return {
      pointer: delayProp?.pointer ?? 0,
      keyboard: delayProp?.keyboard ?? 150,
    }
  }, [delayProp])

  // Get parent menu's store (from Surface context)
  const { store: parentStore } = useSurfaceContext()
  const groupContext = useGroupContext()

  // Get depth from root context (this is the submenu's depth, parent is depth - 1)
  const { depth } = useRootContext()
  const parentDepth = depth - 1

  // Get submenu context for open state and refs
  const submenuContext = useSubmenuContext()
  const { open, setOpen, triggerRef, contentRef, childSurfaceId } =
    submenuContext

  // Timer for delayed opening (pointer / keyboard navigation)
  const openTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearOpenTimer = React.useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
  }, [])

  // Cleanup timer on unmount
  React.useEffect(() => clearOpenTimer, [clearOpenTimer])

  // Track if submenu was just closed while highlighted (e.g. ArrowLeft back)
  // to suppress the keyboard auto-open until highlight leaves and returns
  const suppressAutoOpenRef = React.useRef(false)

  // Get focus owner store for keyboard focus transfer
  const focusOwnerStore = useFocusOwner()

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
  // When submenu is opened via keyboard (ArrowRight/Ctrl+L), transfer focus ownership
  React.useEffect(() => {
    return parentStore.registerSubmenuOpen(id, () => {
      console.log(
        '[SubmenuTrigger] registerSubmenuOpen callback - opening via KEYBOARD, transferring focus to:',
        childSurfaceId,
      )
      setOpen(true)
      // Transfer focus ownership to the submenu surface
      focusOwnerStore.setOwnerId(childSurfaceId)
      // Auto-focus after DOM is ready
      requestAnimationFrame(() => {
        const input = contentRef.current?.querySelector('input')
        const list = contentRef.current?.querySelector('[role="listbox"]')
        const focusTarget = input ?? list
        console.log(
          '[SubmenuTrigger] Keyboard open - focusing element:',
          focusTarget?.tagName,
        )
        if (focusTarget && focusTarget instanceof HTMLElement) {
          focusTarget.focus()
        }
      })
    })
  }, [id, parentStore, setOpen, focusOwnerStore, childSurfaceId, contentRef])

  // Register submenu close callback with parent store
  // This allows the store to close this submenu when another item is highlighted
  React.useEffect(() => {
    return parentStore.registerSubmenuClose(id, () => setOpen(false))
  }, [id, parentStore, setOpen])

  // Use selectors to get derived state from parent store
  const search = parentStore.useState('search')
  const isHighlighted = parentStore.useState('isHighlighted', id)
  const score = parentStore.useState('getItemScore', id)

  // Check if this submenu owns keyboard focus
  const isPopupFocused = focusOwnerStore.useState('isOwner', childSurfaceId)

  // Determine visibility based on filter score
  const hasSearch = search.length > 0
  const isVisible = forceMount || !hasSearch || score > 0

  // Close submenu when trigger becomes invisible (e.g., filtered out by search)
  // This prevents the popup from rendering without its anchor element
  React.useEffect(() => {
    if (!isVisible && open) {
      setOpen(false)
    }
  }, [isVisible, open, setOpen])

  // Scroll into view when highlighted via keyboard
  React.useEffect(() => {
    if (isHighlighted && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest' })
    }
  }, [isHighlighted])

  // When submenu closes while this trigger is highlighted, suppress auto-open
  const prevOpenRef = React.useRef(open)
  React.useEffect(() => {
    if (prevOpenRef.current && !open && isHighlighted) {
      suppressAutoOpenRef.current = true
    }
    prevOpenRef.current = open
  }, [open, isHighlighted])

  // Reset suppression when highlight leaves this trigger
  React.useEffect(() => {
    if (!isHighlighted) {
      suppressAutoOpenRef.current = false
    }
  }, [isHighlighted])

  // When highlighted via keyboard, schedule open after keyboard delay
  // This effect only handles *navigation* highlight (ArrowUp/Down).
  // Explicit open actions (ArrowRight, Ctrl+L) bypass this by calling registerSubmenuOpen directly.
  React.useEffect(() => {
    // Skip if openOnHighlight is disabled
    if (!openOnHighlight) {
      return
    }

    // Only schedule open when highlighted via keyboard
    if (!isHighlighted || parentStore.state.highlightSource !== 'keyboard') {
      clearOpenTimer()
      return
    }

    // Don't auto-open if user just explicitly closed the submenu (e.g. ArrowLeft)
    if (suppressAutoOpenRef.current) {
      return
    }

    const keyboardDelay = delay.keyboard
    if (keyboardDelay <= 0) {
      setOpen(true)
    } else {
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null
        setOpen(true)
      }, keyboardDelay)
    }

    return clearOpenTimer
  }, [
    isHighlighted,
    parentStore,
    delay.keyboard,
    setOpen,
    clearOpenTimer,
    openOnHighlight,
  ])

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

      // Skip if openOnHighlight is disabled
      if (!openOnHighlight) return

      // Check if aim guard is blocking this trigger
      if (aimGuardActiveRef.current && guardedTriggerIdRef.current !== id)
        return

      // Clear any existing aim guard and schedule open with delay
      clearAimGuard()
      clearOpenTimer()

      const pointerDelay = delay.pointer
      if (pointerDelay <= 0) {
        setOpen(true)
      } else {
        openTimerRef.current = setTimeout(() => {
          openTimerRef.current = null
          setOpen(true)
        }, pointerDelay)
      }
    },
    [
      onPointerEnter,
      disabled,
      openOnHighlight,
      aimGuardActiveRef,
      guardedTriggerIdRef,
      id,
      clearAimGuard,
      clearOpenTimer,
      delay.pointer,
      setOpen,
    ],
  )

  const handlePointerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(event)

      if (event.defaultPrevented) return
      if (disabled) return

      // Cancel any pending open timer
      clearOpenTimer()

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
      clearOpenTimer,
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
      popupOpen: open,
      popupFocused: isPopupFocused,
      highlighted: isHighlighted,
      disabled,
    }),
    [open, isPopupFocused, isHighlighted, disabled],
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

  return <Popover.Trigger nativeButton={false} render={element} />
})

export namespace DropdownMenuSubmenuTrigger {
  export type State = DropdownMenuSubmenuTriggerState
  export interface Props extends DropdownMenuSubmenuTriggerProps {}
}
