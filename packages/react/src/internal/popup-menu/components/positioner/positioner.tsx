'use client'

import { Popover, type PopoverPositionerProps } from '@base-ui/react/popover'
import * as React from 'react'
import { flushSync } from 'react-dom'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { usePopupMenuContext } from '../../contexts/popup-menu-context.js'
import { useMaybeSubmenuContext } from '../../contexts/submenu-context.js'

// ============================================================================
// Types
// ============================================================================

type Side = 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'

const LIST_START_OFFSET_EPSILON = 0.5

/**
 * Extended align options for popup menus.
 * - 'start' | 'center' | 'end': Standard Base UI alignment
 * - 'list-start': Align trigger top with the top of the List component (horizontal sides only)
 */
export type PopupMenuPositionerAlign =
  | PopoverPositionerProps['align']
  | 'list-start'

export interface PopupMenuPositionerProps
  extends Omit<PopoverPositionerProps, 'align' | 'style'> {
  /**
   * Override the virtual anchor from context.
   * Useful for nested menus that need different positioning.
   */
  virtualAnchor?: { getBoundingClientRect(): DOMRect }

  /**
   * How to align the popup relative to the specified side.
   * - 'start': align to start of anchor
   * - 'center': align to center of anchor
   * - 'end': align to end of anchor
   * - 'list-start': align the List component's top with the anchor top (horizontal sides only)
   * @default 'start' for submenus, 'center' for root dropdowns
   */
  align?: PopupMenuPositionerAlign

  /**
   * Custom styles for the positioner.
   * Note: During list-start alignment measurement, `transition: 'none'` is
   * temporarily applied to prevent visual flash.
   */
  style?: React.CSSProperties
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Returns the default collision avoidance strategy based on the side.
 *
 * - For horizontal sides (left/right): use shift to keep submenus visible
 *   without flipping to the opposite side, which can be disorienting
 * - For vertical sides (top/bottom): use flip as the standard behavior
 */
function getDefaultCollisionAvoidance(
  side: Side,
): PopoverPositionerProps['collisionAvoidance'] {
  if (isHorizontalSide(side)) {
    return {
      side: 'shift',
      align: 'shift',
    }
  }

  // Vertical sides use flip (default Base UI behavior)
  return undefined
}

/**
 * Check if the side is horizontal (for list-start alignment).
 */
function isHorizontalSide(side: Side): boolean {
  return (
    side === 'left' ||
    side === 'right' ||
    side === 'inline-start' ||
    side === 'inline-end'
  )
}

// ============================================================================
// Component
// ============================================================================

/**
 * Positions the popup menu against its anchor.
 * Wraps Popover.Positioner with:
 * - Automatic virtualAnchor from PopupMenuContext (for context menus)
 * - Smart default positioning based on depth and menu type
 * - Smart collision avoidance: shift for horizontal menus, flip for vertical
 * - 'list-start' alignment for horizontal submenus
 *
 * Renders a `<div>` element.
 */
export const PopupMenuPositioner = React.forwardRef<
  HTMLDivElement,
  PopupMenuPositioner.Props
>(function PopupMenuPositioner(props, ref) {
  const {
    side: sideProp,
    align: alignProp,
    alignOffset: alignOffsetProp,
    collisionAvoidance: collisionAvoidanceProp,
    virtualAnchor: virtualAnchorProp,
    style: styleProp,
    ...rest
  } = props

  const {
    store,
    depth,
    virtualAnchor: contextVirtualAnchor,
    menuType,
  } = usePopupMenuContext()

  // Get submenu context to access contentRef for list-start measurement
  const submenuContext = useMaybeSubmenuContext()

  // Ref for calculated list-start offset
  // Using a ref instead of state to avoid re-renders that cause visual flash
  const listStartOffsetRef = React.useRef(0)

  // Track if the initial measurement has completed for this open cycle
  const hasMeasuredRef = React.useRef(false)

  // Counter to force re-render after measurement
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0)

  // Suppress resize-driven re-measurements during hideUntilActive activation.
  // We intentionally avoid repositioning when the input appears.
  const suppressResizeMeasurementRef = React.useRef(false)
  const suppressionRafIdsRef = React.useRef<{
    first: number | null
    second: number | null
  }>({
    first: null,
    second: null,
  })

  const clearSuppressionRafs = React.useCallback(() => {
    if (typeof window === 'undefined') {
      suppressionRafIdsRef.current.first = null
      suppressionRafIdsRef.current.second = null
      return
    }

    if (suppressionRafIdsRef.current.first !== null) {
      window.cancelAnimationFrame(suppressionRafIdsRef.current.first)
      suppressionRafIdsRef.current.first = null
    }

    if (suppressionRafIdsRef.current.second !== null) {
      window.cancelAnimationFrame(suppressionRafIdsRef.current.second)
      suppressionRafIdsRef.current.second = null
    }
  }, [])

  const clearInputActivationSuppression = React.useCallback(() => {
    clearSuppressionRafs()
    suppressResizeMeasurementRef.current = false
  }, [clearSuppressionRafs])

  const suppressResizeForInputActivation = React.useCallback(() => {
    clearSuppressionRafs()
    suppressResizeMeasurementRef.current = true

    if (typeof window === 'undefined') {
      return
    }

    suppressionRafIdsRef.current.first = window.requestAnimationFrame(() => {
      suppressionRafIdsRef.current.first = null

      suppressionRafIdsRef.current.second = window.requestAnimationFrame(() => {
        suppressionRafIdsRef.current.second = null
        suppressResizeMeasurementRef.current = false
      })
    })
  }, [clearSuppressionRafs])

  // For submenus (depth > 0), we should NOT use the context's virtualAnchor
  // because the submenu should anchor to its trigger element, not the cursor position.
  // Only the root menu (depth 0) should use the virtual anchor for context menus.
  const isSubmenu = depth > 0
  const virtualAnchor = isSubmenu
    ? virtualAnchorProp // Only use explicit prop for submenus (usually undefined)
    : (virtualAnchorProp ?? contextVirtualAnchor)

  // Default side based on depth:
  // - Root menu (depth 0): bottom for dropdown, start for context
  // - Submenu (depth > 0): right
  const defaultSide = isSubmenu ? 'right' : 'bottom'
  const side = sideProp ?? defaultSide

  // Align defaults to start for submenus, center for root dropdown, start for context
  const defaultAlign = isSubmenu
    ? 'start'
    : menuType === 'context'
      ? 'start'
      : 'center'
  const align = alignProp ?? defaultAlign

  // Determine if list-start alignment should be used
  // Only for horizontal sides
  const useListStartAlign = align === 'list-start' && isHorizontalSide(side)

  // Map to Base UI align (list-start -> start)
  const baseUIAlign = align === 'list-start' ? 'start' : align

  // Get open state from submenu context
  const isOpen = submenuContext?.open ?? false

  // Track hideUntilActive activation to suppress its size-change repositioning.
  const inputActive = store.useState('inputActive')
  const hideUntilActive = store.context.hideUntilActive
  const prevInputActiveRef = React.useRef(inputActive)

  // Measurement function for list-start offset.
  // Returns true when the offset changed enough to require repositioning.
  const measureListStartOffset = React.useCallback(() => {
    if (!useListStartAlign) return false

    const contentEl = submenuContext?.contentRef.current
    if (!contentEl) return false

    const contentRect = contentEl.getBoundingClientRect()

    // Find the List component by role="listbox"
    const listEl = contentEl.querySelector<HTMLElement>('[role="listbox"]')
    if (!listEl) {
      const previousOffset = listStartOffsetRef.current
      listStartOffsetRef.current = 0
      return Math.abs(previousOffset) > LIST_START_OFFSET_EPSILON
    }

    const listRect = listEl.getBoundingClientRect()

    // Get the list's padding-top to align to content start
    const listStyles = getComputedStyle(listEl)
    const listPaddingTop = Number.parseFloat(listStyles.paddingTop) || 0

    // Calculate offset: negative distance from popup top to list content top
    const nextOffset = -(listRect.top + listPaddingTop - contentRect.top)
    const previousOffset = listStartOffsetRef.current

    listStartOffsetRef.current = nextOffset

    return Math.abs(nextOffset - previousOffset) > LIST_START_OFFSET_EPSILON
  }, [useListStartAlign, submenuContext])

  // Measure on open before paint.
  React.useLayoutEffect(() => {
    if (!useListStartAlign || !isOpen) {
      return
    }

    if (hasMeasuredRef.current) return

    // Measure synchronously - by this point, all children have rendered
    // and contentRef should be populated
    measureListStartOffset()
    hasMeasuredRef.current = true

    // Force a synchronous re-render to apply the measured offset
    // This happens within useLayoutEffect, so it completes before browser paint
    forceUpdate()
  }, [useListStartAlign, isOpen, measureListStartOffset])

  // Re-measure when popup content size changes while open.
  React.useLayoutEffect(() => {
    if (!useListStartAlign || !isOpen) {
      return
    }

    const contentEl = submenuContext?.contentRef.current
    if (!contentEl || typeof ResizeObserver === 'undefined') {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      if (suppressResizeMeasurementRef.current) {
        return
      }

      if (!measureListStartOffset()) {
        return
      }

      // Keep list-start alignment visually stable in the same frame as size changes.
      // Using flushSync here prevents a one-frame jump when content updates.
      flushSync(() => {
        forceUpdate()
      })
    })

    resizeObserver.observe(contentEl)

    const listEl = contentEl.querySelector<HTMLElement>('[role="listbox"]')
    if (listEl) {
      resizeObserver.observe(listEl)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [useListStartAlign, isOpen, submenuContext, measureListStartOffset])

  // Suppress repositioning for hideUntilActive input activation only.
  React.useLayoutEffect(() => {
    const wasInputActive = prevInputActiveRef.current
    prevInputActiveRef.current = inputActive

    if (!useListStartAlign || !isOpen) {
      return
    }

    if (hideUntilActive && !wasInputActive && inputActive) {
      suppressResizeForInputActivation()
    }
  }, [
    useListStartAlign,
    isOpen,
    hideUntilActive,
    inputActive,
    suppressResizeForInputActivation,
  ])

  // Reset measurement state when menu closes.
  React.useEffect(() => {
    if (!isOpen) {
      hasMeasuredRef.current = false
      listStartOffsetRef.current = 0
      clearInputActivationSuppression()
    }
  }, [isOpen, clearInputActivationSuppression])

  React.useEffect(() => {
    return clearInputActivationSuppression
  }, [clearInputActivationSuppression])

  // Calculate effective alignOffset
  // User's alignOffset is additive to the calculated offset (only if it's a number)
  const effectiveAlignOffset = useListStartAlign
    ? listStartOffsetRef.current +
      (typeof alignOffsetProp === 'number' ? alignOffsetProp : 0)
    : alignOffsetProp

  // Default collision avoidance based on side:
  // - Horizontal (left/right): shift to avoid disorienting flip
  // - Vertical (top/bottom): flip (standard behavior)
  const collisionAvoidance =
    collisionAvoidanceProp ?? getDefaultCollisionAvoidance(side)

  // Only pass anchor if we have one - otherwise let Popover use its default (Trigger element)
  const anchorProps = virtualAnchor ? { anchor: virtualAnchor } : {}

  // Disable transitions during measurement to prevent visual flash.
  // When using list-start alignment, the first render positions at 'start',
  // then measurement occurs and we re-render with the correct offset.
  // By disabling transitions during this phase, both renders happen
  // synchronously without any visible movement.
  const isMeasuring = useListStartAlign && !hasMeasuredRef.current && isOpen
  const style: React.CSSProperties | undefined = isMeasuring
    ? { ...styleProp, transition: 'none' }
    : styleProp

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'positioner')

  return (
    <Popover.Positioner
      ref={ref}
      side={side}
      align={baseUIAlign}
      alignOffset={effectiveAlignOffset}
      collisionAvoidance={collisionAvoidance}
      style={style}
      {...(slotAttr ? { [slotAttr]: '' } : {})}
      // Override data-align to show 'list-start' when using list-start alignment
      data-align={useListStartAlign ? 'list-start' : undefined}
      {...anchorProps}
      {...rest}
    />
  )
})

export namespace PopupMenuPositioner {
  export type Props = PopupMenuPositionerProps
  export type State = Popover.Positioner.State
}
