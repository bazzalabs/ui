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
import { useAimMonitor } from '../../hooks/use-aim-monitor.js'
import { usePopupMenuItem } from '../../hooks/use-popup-menu-item.js'
import type { AimGuard } from '../../store/AimGuardStore.js'
import { isMouseLikePointerType } from '../../utils/is-mouse-like-pointer.js'
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
  first: boolean
  last: boolean
  firstInGroup: boolean
  lastInGroup: boolean
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
  first: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.first]: '' } : null,
  last: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.last]: '' } : null,
  firstInGroup: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.firstInGroup]: '' } : null,
  lastInGroup: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.lastInGroup]: '' } : null,
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
   * Whether the submenu closes when the pointer leaves the trigger without aiming at the submenu popup.
   * When `false`, the submenu stays open until closed by another path (sibling highlight, keyboard, outside click, etc.).
   * @default true
   */
  closeOnPointerLeave?: boolean

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
    closeOnPointerLeave = true,
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
  const {
    open,
    setOpen,
    suppressAutoOpenRef,
    triggerRef,
    contentRef,
    childSurfaceId,
  } = submenuContext

  // Timer for delayed opening (pointer / keyboard navigation)
  const openTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearOpenTimer = React.useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
  }, [])
  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      clearOpenTimer()
    }
  }, [clearOpenTimer])

  // Get focus owner store for keyboard focus transfer
  const focusOwnerStore = useFocusOwner()

  // Aim Guard: shields sibling rows while the pointer aims at the open submenu
  const aimGuardStore = useAimGuard()

  const item = usePopupMenuItem({
    id: idProp,
    value,
    keywords,
    disabled: disabledProp,
    forceMount,
    forceOrder,
    forceScore,
    isSubmenuTrigger: true,
    closeOnClick: false,
    children,
  })

  const disabled = item.disabled

  const isBlockedByAimGuard = React.useCallback(() => {
    const guard = aimGuardStore.get()
    return (
      guard !== null &&
      guard.depth === parentDepth &&
      guard.triggerId !== item.id
    )
  }, [aimGuardStore, parentDepth, item.id])

  const { showSafeTriangleArea, logAimGuardEvents } = usePopupMenuDebug()
  const showSafeTriangleAreaEnabled = showSafeTriangleArea.enabled

  const logAimTrace = React.useCallback(
    (eventName: string, details?: Record<string, unknown>) => {
      if (!logAimGuardEvents) return
      console.log(`[PopupMenu][AimGuard] ${eventName}`, {
        triggerId: item.id,
        triggerStoreId: item.storeId,
        parentDepth,
        aimGuardActive: aimGuardStore.get() !== null,
        guardedTriggerId: aimGuardStore.get()?.triggerId ?? null,
        guardedDepth: aimGuardStore.get()?.depth ?? null,
        ...details,
      })
    },
    [logAimGuardEvents, item.id, item.storeId, parentDepth, aimGuardStore],
  )

  const aimMonitor = useAimMonitor({
    getContentRect: () => contentRef.current?.getBoundingClientRect() ?? null,
    getAnchorRect: () => triggerRef.current?.getBoundingClientRect() ?? null,
    anchorMode: 'anchor-rect',
    closeDelay,
    closeOnPointerLeave,
    onHit: () => {
      aimGuardStore.activate(
        {
          triggerId: item.id,
          depth: parentDepth,
          submenuSurfaceId: childSurfaceId,
        },
        600,
      )
      parentStore.setHighlightedId(item.storeId)
      setOpen(true)
    },
    onMiss: () => {
      aimGuardStore.clear()
    },
    onClose: () => {
      setOpen(false)
    },
    onSettled: (cause) => {
      if (cause === 'inside-at-leave') aimGuardStore.clear()
    },
    logContext: () => ({
      triggerId: item.id,
      triggerStoreId: item.storeId,
      parentDepth,
      aimGuardActive: aimGuardStore.get() !== null,
      guardedTriggerId: aimGuardStore.get()?.triggerId ?? null,
      guardedDepth: aimGuardStore.get()?.depth ?? null,
    }),
  })

  React.useEffect(() => {
    const guard = aimGuardStore.get()
    if (open || guard?.triggerId !== item.id || guard?.depth !== parentDepth) {
      return
    }

    aimGuardStore.clear()
  }, [open, item.id, parentDepth, aimGuardStore])

  React.useEffect(() => {
    const guard = aimGuardStore.get()
    if (
      item.isVisible ||
      guard?.triggerId !== item.id ||
      guard?.depth !== parentDepth
    ) {
      return
    }

    aimGuardStore.clear()
  }, [item.isVisible, item.id, parentDepth, aimGuardStore])

  React.useEffect(() => {
    return () => {
      if (
        aimGuardStore.get()?.triggerId === item.id &&
        aimGuardStore.get()?.depth === parentDepth
      ) {
        aimGuardStore.clear()
      }
    }
  }, [item.id, parentDepth, aimGuardStore])

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

  // Reset suppression when highlight leaves this trigger
  React.useEffect(() => {
    if (!item.isHighlighted) {
      suppressAutoOpenRef.current = false
    }
  }, [item.isHighlighted, suppressAutoOpenRef])

  // When highlighted via keyboard, schedule open after keyboard delay
  // This effect only handles *navigation* highlight (ArrowUp/Down).
  // Explicit open actions (ArrowRight, Ctrl+L) bypass this by calling registerSubmenuOpen directly.
  // biome-ignore lint/correctness/useExhaustiveDependencies(suppressAutoOpenRef.current): read via ref on purpose — suppression must not (re)schedule this effect, it is only consulted when the highlight changes
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
        // An armed timer survives an explicit close (opening doesn't clear it
        // and the highlight doesn't change), so consult the latch here too.
        if (suppressAutoOpenRef.current) return
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

      if (open) {
        suppressAutoOpenRef.current = true
        logAimTrace('pointerdown-suppress-auto-open', {
          clientX: event.clientX,
          clientY: event.clientY,
        })
      }

      onPointerDown?.(event)
    },
    [open, logAimTrace, onPointerDown, suppressAutoOpenRef],
  )

  // Custom pointer move handler for submenu triggers
  // Different from usePopupMenuItem's handler: allows the guarded trigger to highlight itself
  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)

      if (event.defaultPrevented) return
      if (disabled) return
      if (!isMouseLikePointerType(event.pointerType)) return

      // Check if pointer has actually moved (prevents phantom highlights)
      if (
        !parentStore.shouldAllowPointerHighlight(event.clientX, event.clientY)
      ) {
        return
      }

      // Don't highlight if aim guard is active at this depth for a different trigger
      const guard = aimGuardStore.get()
      if (isBlockedByAimGuard()) {
        logAimTrace('pointermove-blocked-by-guard', {
          clientX: event.clientX,
          clientY: event.clientY,
          blockedByTriggerId: guard?.triggerId,
        })
        return
      }

      // Highlight on hover (use storeId for store operations)
      parentStore.setHighlightedId(item.storeId)

      // Pointer move can be the first allowed event after aim-guard unblocks
      // this row (e.g. pointerenter was blocked earlier), so allow it to open.
      if (!openOnHighlight || open) {
        return
      }

      if (suppressAutoOpenRef.current) {
        logAimTrace('pointermove-open-suppressed-after-explicit-close', {
          clientX: event.clientX,
          clientY: event.clientY,
        })
        return
      }

      aimMonitor.cancel()

      const pointerDelay = delay.pointer
      if (pointerDelay <= 0) {
        setOpen(true)
        return
      }

      if (openTimerRef.current !== null) {
        return
      }

      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null
        setOpen(true)
      }, pointerDelay)
    },
    [
      onPointerMove,
      disabled,
      aimGuardStore,
      isBlockedByAimGuard,
      item.storeId,
      openOnHighlight,
      open,
      suppressAutoOpenRef,
      aimMonitor,
      delay.pointer,
      setOpen,
      logAimTrace,
      parentStore,
    ],
  )

  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerEnter?.(event)
      if (event.defaultPrevented) return
      if (disabled) return
      if (!isMouseLikePointerType(event.pointerType)) return
      const guard = aimGuardStore.get()
      if (isBlockedByAimGuard()) {
        logAimTrace('pointerenter-blocked-by-guard', {
          clientX: event.clientX,
          clientY: event.clientY,
          blockedByTriggerId: guard?.triggerId,
          blockedByDepth: guard?.depth,
        })
        return
      }
      logAimTrace('pointerenter-submenu-trigger', {
        clientX: event.clientX,
        clientY: event.clientY,
      })
      aimMonitor.debug.markHover()
      parentStore.setHighlightedId(item.storeId)
      if (!openOnHighlight) return
      if (suppressAutoOpenRef.current) {
        logAimTrace('pointerenter-open-suppressed-after-explicit-close', {
          clientX: event.clientX,
          clientY: event.clientY,
        })
        return
      }
      aimMonitor.cancel()
      aimGuardStore.clear()
      clearOpenTimer()
      const pointerDelay = delay.pointer
      if (pointerDelay <= 0) setOpen(true)
      else
        openTimerRef.current = setTimeout(() => {
          openTimerRef.current = null
          setOpen(true)
        }, pointerDelay)
    },
    [
      onPointerEnter,
      disabled,
      aimGuardStore,
      isBlockedByAimGuard,
      item.storeId,
      parentStore,
      openOnHighlight,
      suppressAutoOpenRef,
      aimMonitor,
      clearOpenTimer,
      delay.pointer,
      setOpen,
      logAimTrace,
    ],
  )

  const handlePointerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(event)
      if (event.defaultPrevented) return
      if (disabled) return
      if (!isMouseLikePointerType(event.pointerType)) return
      clearOpenTimer()
      logAimTrace('pointerleave-submenu-trigger', {
        clientX: event.clientX,
        clientY: event.clientY,
      })
      const guard = aimGuardStore.get()
      if (isBlockedByAimGuard()) {
        logAimTrace('pointerleave-blocked-by-guard', {
          clientX: event.clientX,
          clientY: event.clientY,
          blockedByTriggerId: guard?.triggerId,
          blockedByDepth: guard?.depth,
        })
        return
      }
      if (!contentRef.current) aimGuardStore.clear()
      aimMonitor.pointerLeft(event)
    },
    [
      onPointerLeave,
      disabled,
      clearOpenTimer,
      logAimTrace,
      aimGuardStore,
      isBlockedByAimGuard,
      contentRef,
      aimMonitor,
    ],
  )

  const aimMonitorDebugState = aimMonitor.debug.state

  // Non-persistent overlay: hide the 'activated' triangle as soon as the Aim
  // Guard is no longer this trigger's. Evaluate on debug-state change (the
  // guard may already be idle, in which case the store never notifies) and on
  // every subsequent guard change.
  React.useEffect(() => {
    if (
      !showSafeTriangleArea.enabled ||
      showSafeTriangleArea.persistOnSuccess ||
      aimMonitorDebugState !== 'activated'
    ) {
      return
    }
    const resetUnlessMine = (guard: AimGuard | null) => {
      if (guard?.triggerId !== item.id || guard?.depth !== parentDepth) {
        aimMonitor.debug.reset()
      }
    }
    resetUnlessMine(aimGuardStore.get())
    return aimGuardStore.subscribe(resetUnlessMine)
  }, [
    showSafeTriangleArea.enabled,
    showSafeTriangleArea.persistOnSuccess,
    aimMonitor,
    aimMonitorDebugState,
    aimGuardStore,
    item.id,
    parentDepth,
  ])

  React.useEffect(() => {
    if (!open) {
      aimMonitor.cancel()
      if (aimMonitorDebugState === 'activated') aimMonitor.debug.reset()
    }
  }, [open, aimMonitor, aimMonitorDebugState])

  React.useEffect(() => {
    if (!open) return
    const contentEl = contentRef.current
    if (!contentEl) return
    const handlePointerEnterContent = () => aimMonitor.cancel()
    contentEl.addEventListener('pointerenter', handlePointerEnterContent)
    return () =>
      contentEl.removeEventListener('pointerenter', handlePointerEnterContent)
  }, [open, contentRef, aimMonitor])

  const state: PopupMenuSubmenuTrigger.State = React.useMemo(
    () => ({
      submenuTrigger: true,
      popupOpen: open,
      popupFocused: isPopupFocused,
      highlighted: item.isHighlighted,
      disabled,
      first: item.positional.first,
      last: item.positional.last,
      firstInGroup: item.positional.firstInGroup,
      lastInGroup: item.positional.lastInGroup,
    }),
    [open, isPopupFocused, item.isHighlighted, disabled, item.positional],
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
    ref: [item.ref, item.rowRef, forwardedRef],
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
      if (aimMonitor.debug.state === 'hover') {
        return 'hover'
      }

      if (aimMonitor.debug.state === 'activated') {
        return 'activated'
      }

      if (aimMonitor.debug.state === 'missed') {
        return 'missed'
      }

      return null
    }, [aimMonitor.debug.state])

  const trigger = (
    <Popover.Trigger
      nativeButton={false}
      disabled={disabled}
      render={element}
    />
  )

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
        contentRectOverride={aimMonitor.debug.snapshot?.contentRect}
        triggerRectOverride={aimMonitor.debug.snapshot?.anchorRect}
        mousePointOverride={
          aimMonitor.debug.snapshot
            ? [
                aimMonitor.debug.snapshot.pointerX,
                aimMonitor.debug.snapshot.pointerY,
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
