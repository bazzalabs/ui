'use client'

import { Popover } from '@base-ui/react/popover'
import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import {
  ItemContext,
  useListboxContext,
  useSurfaceContext,
} from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { usePopupMenuDebug } from '../../contexts/popup-menu-debug-context.js'
import { useSubmenuContext } from '../../contexts/submenu-context.js'
import { useAimGuard } from '../../hooks/use-aim-guard.js'
import { usePopupMenuItem } from '../../hooks/use-popup-menu-item.js'
import {
  getSmoothedHeading,
  resolveAnchorSide,
  willHitSubmenu,
} from '../../utils/aim-guard.js'
import { useMouseTrail } from '../../utils/use-mouse-trail.js'
import {
  PopupMenuSubmenuSafeTriangleArea,
  type PopupMenuSubmenuSafeTriangleTone,
} from './submenu-safe-triangle-area.js'
import { PopupMenuSubmenuTriggerDataAttributes } from './submenu-trigger-indicator.js'

export interface PopupMenuSubmenuTriggerState extends Record<string, unknown> {
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
      ? { [PopupMenuSubmenuTriggerDataAttributes.submenuTrigger]: '' }
      : null,
  popupOpen: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.popupOpen]: '' } : null,
  popupFocused: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.popupFocused]: '' } : null,
  highlighted: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.disabled]: '' } : null,
}

export interface PopupMenuSubmenuTriggerProps
  extends ComponentProps<'div', PopupMenuSubmenuTrigger.State> {
  /**
   * Explicit unique identifier for this item in the store.
   * When provided (e.g., from data-first API's computed composite ID),
   * this takes priority over `value` for store registration.
   */
  id?: string

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

  /**
   * Forces this row's relative order during score-based sorting.
   * Lower values appear earlier.
   * @default 0
   */
  forceOrder?: number

  /**
   * Overrides this row's computed fuzzy-match score.
   */
  forceScore?: number
}

type SubmenuSafeTriangleDebugState = 'hidden' | 'hover' | 'activated'

interface SubmenuSafeTriangleDebugSnapshot {
  contentRect: DOMRect
  triggerRect: DOMRect | null
  pointerX: number
  pointerY: number
}

/**
 * A menu item that opens a submenu when hovered.
 * Must be used within PopupMenu.Submenu.
 * Renders a `<div>` element with role="menuitem" wrapped in Popover.Trigger.
 */
export const PopupMenuSubmenuTrigger = React.forwardRef<
  HTMLDivElement,
  PopupMenuSubmenuTrigger.Props
>(function PopupMenuSubmenuTrigger(props, forwardedRef) {
  const {
    id: idProp,
    value,
    keywords,
    disabled: disabledProp = false,
    forceMount = false,
    openOnHighlight = true,
    delay: delayProp,
    closeDelay = 0,
    forceOrder,
    forceScore,
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

  // Get depth from listbox context (this is the submenu's depth, parent is depth - 1)
  const { depth } = useListboxContext()
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
    aimGuardActive,
    guardedTriggerId,
    guardedDepth,
    aimGuardActiveRef,
    guardedTriggerIdRef,
    guardedDepthRef,
    activateAimGuard,
    clearAimGuard,
  } = useAimGuard()

  // Track mouse positions for aim guard trajectory calculation
  const mouseTrailRef = useMouseTrail(4)

  const { showSafeTriangleArea } = usePopupMenuDebug()
  const showSafeTriangleAreaEnabled = showSafeTriangleArea.enabled
  const [submenuSafeTriangleDebugState, setSubmenuSafeTriangleDebugState] =
    React.useState<SubmenuSafeTriangleDebugState>('hidden')
  const [
    submenuSafeTriangleDebugSnapshot,
    setSubmenuSafeTriangleDebugSnapshot,
  ] = React.useState<SubmenuSafeTriangleDebugSnapshot | null>(null)

  // Use the shared item hook for registration, visibility, and highlight state
  // When id is provided (e.g., from data-first API), it takes priority for store registration
  const item = usePopupMenuItem({
    id: idProp,
    value,
    keywords,
    disabled: disabledProp,
    forceMount,
    forceOrder,
    forceScore,
    isSubmenuTrigger: true,
    closeOnClick: false, // Submenu triggers don't close the menu
    children,
  })

  const disabled = item.disabled

  const showActivatedSafeTriangle = React.useCallback(
    (snapshot: SubmenuSafeTriangleDebugSnapshot) => {
      if (!showSafeTriangleAreaEnabled) {
        return
      }

      if (showSafeTriangleArea.freezeOnPointerLeave) {
        setSubmenuSafeTriangleDebugSnapshot(snapshot)
      } else {
        setSubmenuSafeTriangleDebugSnapshot(null)
      }

      setSubmenuSafeTriangleDebugState('activated')
    },
    [showSafeTriangleAreaEnabled, showSafeTriangleArea.freezeOnPointerLeave],
  )

  React.useEffect(() => {
    if (showSafeTriangleAreaEnabled) {
      return
    }

    setSubmenuSafeTriangleDebugState('hidden')
    setSubmenuSafeTriangleDebugSnapshot(null)
  }, [showSafeTriangleAreaEnabled])

  React.useEffect(() => {
    if (
      !showSafeTriangleAreaEnabled ||
      showSafeTriangleArea.persistOnSuccess ||
      submenuSafeTriangleDebugState !== 'activated'
    ) {
      return
    }

    const isGuardActiveForThisTrigger =
      aimGuardActive &&
      guardedTriggerId === item.id &&
      guardedDepth === parentDepth

    if (!isGuardActiveForThisTrigger) {
      setSubmenuSafeTriangleDebugState('hidden')
      setSubmenuSafeTriangleDebugSnapshot(null)
    }
  }, [
    showSafeTriangleAreaEnabled,
    showSafeTriangleArea.persistOnSuccess,
    submenuSafeTriangleDebugState,
    aimGuardActive,
    guardedTriggerId,
    guardedDepth,
    item.id,
    parentDepth,
  ])

  React.useEffect(() => {
    if (submenuSafeTriangleDebugState !== 'activated' || open) {
      return
    }

    setSubmenuSafeTriangleDebugState('hidden')
    setSubmenuSafeTriangleDebugSnapshot(null)
  }, [submenuSafeTriangleDebugState, open])

  // Register submenu open callback with parent store
  // When submenu is opened via keyboard (ArrowRight/Ctrl+L), transfer focus ownership
  React.useEffect(() => {
    return parentStore.registerSubmenuOpen(item.storeId, () => {
      setOpen(true)
      // Transfer focus ownership to the submenu surface
      focusOwnerStore.setOwnerId(childSurfaceId)
      // Auto-focus after DOM is ready
      requestAnimationFrame(() => {
        const input = contentRef.current?.querySelector('input')
        const list = contentRef.current?.querySelector('[role="listbox"]')
        const focusTarget = input ?? list
        if (focusTarget && focusTarget instanceof HTMLElement) {
          focusTarget.focus()
        }
      })
    })
  }, [
    item.storeId,
    parentStore,
    setOpen,
    focusOwnerStore,
    childSurfaceId,
    contentRef,
  ])

  // Register submenu close callback with parent store
  // This allows the store to close this submenu when another item is highlighted
  React.useEffect(() => {
    return parentStore.registerSubmenuClose(item.storeId, () => setOpen(false))
  }, [item.storeId, parentStore, setOpen])

  // Check if this submenu owns keyboard focus
  const isPopupFocused = focusOwnerStore.useState('isOwner', childSurfaceId)

  // Close submenu when trigger becomes invisible (e.g., filtered out by search)
  // This prevents the popup from rendering without its anchor element
  React.useEffect(() => {
    if (!item.isVisible && open) {
      setOpen(false)
    }
  }, [item.isVisible, open, setOpen])

  // When submenu closes while this trigger is highlighted, suppress auto-open
  const prevOpenRef = React.useRef(open)
  React.useEffect(() => {
    if (prevOpenRef.current && !open && item.isHighlighted) {
      suppressAutoOpenRef.current = true
    }
    prevOpenRef.current = open
  }, [open, item.isHighlighted])

  // Reset suppression when highlight leaves this trigger
  React.useEffect(() => {
    if (!item.isHighlighted) {
      suppressAutoOpenRef.current = false
    }
  }, [item.isHighlighted])

  // When highlighted via keyboard, schedule open after keyboard delay
  // This effect only handles *navigation* highlight (ArrowUp/Down).
  // Explicit open actions (ArrowRight, Ctrl+L) bypass this by calling registerSubmenuOpen directly.
  React.useEffect(() => {
    // Skip if openOnHighlight is disabled
    if (!openOnHighlight) {
      return
    }

    // Only schedule open when highlighted via explicit keyboard navigation
    // Don't auto-open for 'auto' highlights (search results, initial open)
    if (
      !item.isHighlighted ||
      parentStore.state.highlightSource !== 'keyboard'
    ) {
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
    item.isHighlighted,
    parentStore,
    delay.keyboard,
    setOpen,
    clearOpenTimer,
    openOnHighlight,
  ])

  // Set the trigger ref when element mounts
  React.useEffect(() => {
    ;(triggerRef as React.MutableRefObject<HTMLElement | null>).current =
      item.ref.current
    return () => {
      ;(triggerRef as React.MutableRefObject<HTMLElement | null>).current = null
    }
  }, [triggerRef, item.ref])

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Prevent focus from leaving the input
      event.preventDefault()
      onPointerDown?.(event)
    },
    [onPointerDown],
  )

  // Custom pointer move handler for submenu triggers
  // Different from usePopupMenuItem's handler: allows the guarded trigger to highlight itself
  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)

      if (event.defaultPrevented) return
      if (disabled) return

      // Check if pointer has actually moved (prevents phantom highlights)
      if (
        !parentStore.shouldAllowPointerHighlight(event.clientX, event.clientY)
      ) {
        return
      }

      // Don't highlight if aim guard is active at this depth for a different trigger
      if (
        aimGuardActiveRef.current &&
        guardedDepthRef.current === parentDepth &&
        guardedTriggerIdRef.current !== item.id
      ) {
        return
      }

      // Highlight on hover (use storeId for store operations)
      parentStore.setHighlightedId(item.storeId)
    },
    [
      onPointerMove,
      disabled,
      aimGuardActiveRef,
      guardedDepthRef,
      parentDepth,
      guardedTriggerIdRef,
      item.id,
      item.storeId,
      parentStore,
    ],
  )

  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerEnter?.(event)

      if (event.defaultPrevented) return
      if (disabled) return

      // Check if aim guard is blocking this trigger
      if (
        aimGuardActiveRef.current &&
        guardedTriggerIdRef.current !== item.id
      ) {
        return
      }

      if (showSafeTriangleAreaEnabled) {
        setSubmenuSafeTriangleDebugSnapshot(null)
        setSubmenuSafeTriangleDebugState('hover')
      }

      // Highlight the trigger on pointer enter (use storeId for store operations)
      parentStore.setHighlightedId(item.storeId)

      // Skip submenu opening if openOnHighlight is disabled
      if (!openOnHighlight) return

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
      aimGuardActiveRef,
      guardedTriggerIdRef,
      item.id,
      item.storeId,
      parentStore,
      openOnHighlight,
      clearAimGuard,
      clearOpenTimer,
      showSafeTriangleAreaEnabled,
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
      if (aimGuardActiveRef.current && guardedTriggerIdRef.current !== item.id)
        return

      // Get the submenu content rect for safe polygon calculation
      const contentRect = contentRef.current?.getBoundingClientRect()
      if (!contentRect) {
        setSubmenuSafeTriangleDebugState('hidden')
        setSubmenuSafeTriangleDebugSnapshot(null)
        clearAimGuard()
        setOpen(false)
        return
      }

      // Check if pointer is already inside the popup (can happen with fast movement or overlapping elements)
      const { clientX, clientY } = event

      // Get trigger rect for aim guard calculation
      const tRect = triggerRef.current?.getBoundingClientRect() ?? null
      const debugSnapshot: SubmenuSafeTriangleDebugSnapshot = {
        contentRect,
        triggerRect: tRect,
        pointerX: clientX,
        pointerY: clientY,
      }

      const isInsidePopup =
        clientX >= contentRect.left &&
        clientX <= contentRect.right &&
        clientY >= contentRect.top &&
        clientY <= contentRect.bottom

      if (isInsidePopup) {
        // Pointer is already in the popup, clear guard and keep open
        showActivatedSafeTriangle(debugSnapshot)
        clearAimGuard()
        return
      }

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

      if (hit) {
        // User is aiming at submenu - activate aim guard for 600ms
        // Guard is activated at parentDepth to block highlighting in the parent menu only
        showActivatedSafeTriangle(debugSnapshot)
        activateAimGuard(item.id, parentDepth, childSurfaceId, 600)
        parentStore.setHighlightedId(item.storeId)
        setOpen(true)
      } else {
        // User is not aiming at submenu - close it
        setSubmenuSafeTriangleDebugState('hidden')
        setSubmenuSafeTriangleDebugSnapshot(null)
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
      item.id,
      item.storeId,
      contentRef,
      clearAimGuard,
      showActivatedSafeTriangle,
      setOpen,
      triggerRef,
      mouseTrailRef,
      activateAimGuard,
      parentDepth,
      childSurfaceId,
      parentStore,
    ],
  )

  const state: PopupMenuSubmenuTrigger.State = React.useMemo(
    () => ({
      submenuTrigger: true,
      popupOpen: open,
      popupFocused: isPopupFocused,
      highlighted: item.isHighlighted,
      disabled,
    }),
    [open, isPopupFocused, item.isHighlighted, disabled],
  )

  // Wrap children with ItemContext.Provider so child components can access item state
  const wrappedChildren = (
    <ItemContext.Provider value={item.contextValue}>
      {children}
    </ItemContext.Provider>
  )

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'submenu-trigger')

  // Use useRender to create the element with state-based data attributes
  const element = useRender({
    render,
    ref: [item.ref, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      id: item.id,
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
      children: wrappedChildren,
    },
    defaultTagName: 'div',
  })

  const safeTriangleTone: PopupMenuSubmenuSafeTriangleTone | null =
    React.useMemo(() => {
      if (submenuSafeTriangleDebugState === 'hover') {
        return 'hover'
      }

      if (submenuSafeTriangleDebugState === 'activated') {
        return 'activated'
      }

      return null
    }, [submenuSafeTriangleDebugState])

  const trigger = <Popover.Trigger nativeButton={false} render={element} />

  // Don't render if not visible
  if (!item.isVisible) return null

  if (!showSafeTriangleAreaEnabled || safeTriangleTone === null) {
    return trigger
  }

  return (
    <>
      {trigger}
      <PopupMenuSubmenuSafeTriangleArea
        config={showSafeTriangleArea}
        contentRef={contentRef}
        triggerRef={triggerRef}
        tone={safeTriangleTone}
        contentRectOverride={submenuSafeTriangleDebugSnapshot?.contentRect}
        triggerRectOverride={submenuSafeTriangleDebugSnapshot?.triggerRect}
        mousePointOverride={
          submenuSafeTriangleDebugSnapshot
            ? [
                submenuSafeTriangleDebugSnapshot.pointerX,
                submenuSafeTriangleDebugSnapshot.pointerY,
              ]
            : null
        }
      />
    </>
  )
})

export namespace PopupMenuSubmenuTrigger {
  export type State = PopupMenuSubmenuTriggerState
  export interface Props extends PopupMenuSubmenuTriggerProps {}
}
