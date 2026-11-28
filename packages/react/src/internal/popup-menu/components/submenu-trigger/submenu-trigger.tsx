'use client'

import { Popover } from '@base-ui/react/popover'
import { useRender } from '@base-ui/react/use-render'
import type { SubmenuSettings, SubmenuTriggerFields } from '@bazza-ui/menu-core'
import * as React from 'react'
import {
  resolveClassName,
  resolveStyle,
} from '../../../../utils/resolve-state-props.js'
import type { ComponentProps } from '../../../../utils/types.js'
import { composeHandlers } from '../../../../utils/use-part.js'
import { ItemContext, useSurfaceContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useSubmenuContext } from '../../contexts/submenu-context.js'
import { useMenuSurfaceTier } from '../../contexts/surface-tier-context.js'
import { usePopupMenuItem } from '../../hooks/use-popup-menu-item.js'
import { isMouseLikePointerType } from '../../utils/is-mouse-like-pointer.js'
import { PopupMenuSubmenuSafeTriangleArea } from './submenu-safe-triangle-area.js'
import { PopupMenuSubmenuTriggerDataAttributes } from './submenu-trigger-indicator.js'
import { useSubmenuAimGuard } from './use-submenu-aim-guard.js'
import { useSubmenuController } from './use-submenu-controller.js'

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
  extends SubmenuTriggerFields,
    ComponentProps<'div', PopupMenuSubmenuTrigger.State> {}

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
    'aria-describedby': ariaDescribedBy,
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

  // The submenu's depth, from its tier (the trigger sits under it); its
  // parent's is one less.
  const { depth } = useMenuSurfaceTier('listbox')
  const parentDepth = depth - 1

  // Get submenu context for open state and refs
  const submenuContext = useSubmenuContext()
  const { open, triggerRef, contentRef, childSurfaceId } = submenuContext

  // Get focus owner store for keyboard focus transfer
  const focusOwnerStore = useFocusOwner()

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
    describedBy: ariaDescribedBy,
  })

  const disabled = item.disabled

  const { aimGuard, holdHoverTrail, releaseHoverTrail, safeTriangle } =
    useSubmenuAimGuard({
      triggerId: item.id,
      triggerStoreId: item.storeId,
      parentDepth,
      childSurfaceId,
      contentRef,
      triggerRef,
    })

  const settings: SubmenuSettings = React.useMemo(
    () => ({
      delay,
      closeDelay,
      closeOnPointerLeave,
      openOnHighlight,
    }),
    [delay, closeDelay, closeOnPointerLeave, openOnHighlight],
  )

  const controller = useSubmenuController({
    settings,
    aimGuard,
    parentStore,
    storeId: item.storeId,
    highlighted: item.isHighlighted,
    visible: item.isVisible,
    open,
    contentRef,
    focusOwnerStore,
    childSurfaceId,
  })

  // A hidden trigger's element is gone, so no pointerleave will release the
  // trail
  React.useEffect(() => {
    if (!item.isVisible) releaseHoverTrail()
  }, [item.isVisible, releaseHoverTrail])

  // Check if this submenu owns keyboard focus
  const isPopupFocused = focusOwnerStore.useState('isOwner', childSurfaceId)

  // Set the trigger ref when element mounts
  React.useEffect(() => {
    ;(triggerRef as React.MutableRefObject<HTMLElement | null>).current =
      item.ref.current
    return () => {
      ;(triggerRef as React.MutableRefObject<HTMLElement | null>).current = null
    }
  }, [triggerRef, item.ref])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Prevent focus from leaving the input
    event.preventDefault()
    controller.send({ type: 'press' })
    onPointerDown?.(event)
  }

  // Unlike usePopupMenuItem's handler, the controller lets the guarded
  // trigger highlight itself
  // Each pointer handler holds or releases the hover trail whatever the
  // consumer's handler does; the rest runs after it (`composeHandlers`), and
  // a consumer's `preventDefault()` or `preventBaseUIHandler()` skips it.
  const handleOwnPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return
    if (disabled) return
    if (!isMouseLikePointerType(event.pointerType)) return

    // Check if pointer has actually moved (prevents phantom highlights)
    if (
      !parentStore.shouldAllowPointerHighlight(event.clientX, event.clientY)
    ) {
      return
    }

    controller.send({ type: 'pointer.move' })
  }
  const composedPointerMove = composeHandlers(
    onPointerMove,
    handleOwnPointerMove,
  )
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    // Also covers a pointer that was already over the trigger when it mounted
    holdHoverTrail()
    composedPointerMove(event)
  }

  const handleOwnPointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return
    if (disabled) return
    if (!isMouseLikePointerType(event.pointerType)) return

    controller.send({ type: 'pointer.enter' })
  }
  const composedPointerEnter = composeHandlers(
    onPointerEnter,
    handleOwnPointerEnter,
  )
  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    holdHoverTrail()
    composedPointerEnter(event)
  }

  // The trail is released after the controller reads the leave, which may
  // track the exit (holding the trail itself)
  const handleOwnPointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      !event.defaultPrevented &&
      !disabled &&
      isMouseLikePointerType(event.pointerType)
    ) {
      controller.send({
        type: 'pointer.leave',
        point: { x: event.clientX, y: event.clientY },
      })
    }
  }
  const composedPointerLeave = composeHandlers(
    onPointerLeave,
    handleOwnPointerLeave,
  )
  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    composedPointerLeave(event)
    releaseHoverTrail()
  }

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
      'aria-describedby': item.describedBy,
      'aria-haspopup': 'menu',
      'aria-expanded': open,
      tabIndex: -1,
      'aria-disabled': disabled || undefined,
      className: resolveClassName(className, state),
      style: resolveStyle(style, state),
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
      children: wrappedChildren,
    },
    defaultTagName: 'div',
  })

  const trigger = (
    <Popover.Trigger
      nativeButton={false}
      disabled={disabled}
      render={element}
    />
  )

  // Don't render if not visible
  if (!item.isVisible) return null

  // The overlay is a development tool: a production build has none to draw,
  // and drops the component.
  return process.env.NODE_ENV !== 'production' && safeTriangle ? (
    <>
      {trigger}
      <PopupMenuSubmenuSafeTriangleArea
        config={safeTriangle.config}
        contentRef={contentRef}
        triggerRef={triggerRef}
        tone={safeTriangle.snapshot.tone}
        contentRectOverride={safeTriangle.snapshot.frozen?.popupRect}
        triggerRectOverride={safeTriangle.snapshot.frozen?.triggerRect}
        mousePointOverride={
          safeTriangle.snapshot.frozen
            ? [
                safeTriangle.snapshot.frozen.point.x,
                safeTriangle.snapshot.frozen.point.y,
              ]
            : null
        }
      />
    </>
  ) : (
    trigger
  )
})

export namespace PopupMenuSubmenuTrigger {
  export type State = PopupMenuSubmenuTriggerState
  export interface Props extends PopupMenuSubmenuTriggerProps {}
}
