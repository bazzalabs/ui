'use client'

import { Popover, type PopoverPositionerProps } from '@base-ui/react/popover'
import * as React from 'react'
import { usePopupMenuContext } from '../../internal/popup-menu/contexts/popup-menu-context.js'
import { useSelectContext } from '../contexts/select-context.js'
import {
  type Align,
  SelectPositionerContext,
  type SelectPositionerContextValue,
  type Side,
} from '../contexts/select-positioner-context.js'
import { SelectPositionerDataAttributes } from './positioner.data-attrs.js'

export { SelectPositionerDataAttributes }

// ============================================================================
// Types
// ============================================================================

export interface SelectPositionerProps extends PopoverPositionerProps {
  /**
   * Whether the positioner overlaps the trigger so the selected item's text
   * is aligned with the trigger's value text.
   *
   * This is automatically disabled if:
   * - There is not enough space in the viewport
   * - The trigger is too close to the viewport edges
   * - Touch input is detected (better UX to show full list)
   *
   * @default true
   */
  alignItemWithTrigger?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const MARGIN = 10 // Viewport margin
const MIN_HEIGHT = 100 // Minimum popup height before fallback
const TRIGGER_COLLISION_THRESHOLD = 20 // Distance from viewport edge

// ============================================================================
// Helper: Calculate alignment position
// ============================================================================

interface CalculatePositionParams {
  triggerElement: HTMLElement
  positioner: HTMLDivElement
  valueElement: HTMLElement | null
  /** The text element to align with (selected item or first item) */
  itemText: HTMLElement | null
}

interface CalculatePositionResult {
  shouldFallback: boolean
  left: number
  top: number
  maxHeight?: number
}

function calculateAlignmentPosition(
  params: CalculatePositionParams,
): CalculatePositionResult {
  const { triggerElement, positioner, valueElement, itemText } = params

  const triggerRect = triggerElement.getBoundingClientRect()
  const positionerRect = positioner.getBoundingClientRect()
  const viewportHeight = document.documentElement.clientHeight
  const viewportWidth = document.documentElement.clientWidth

  // Check if trigger is too close to viewport edges
  const triggerTooCloseToTop = triggerRect.top < TRIGGER_COLLISION_THRESHOLD
  const triggerTooCloseToBottom =
    triggerRect.bottom > viewportHeight - TRIGGER_COLLISION_THRESHOLD

  // Check if popup is too small
  const popupTooSmall = positionerRect.height < MIN_HEIGHT

  if (triggerTooCloseToTop || triggerTooCloseToBottom || popupTooSmall) {
    return { shouldFallback: true, left: 0, top: 0 }
  }

  // Fallback if no item text element to align with
  if (!itemText) {
    return { shouldFallback: true, left: 0, top: 0 }
  }

  let offsetX = 0
  let offsetY = 0

  // Calculate offsets based on text elements if available
  if (itemText && valueElement) {
    const valueRect = valueElement.getBoundingClientRect()
    const textRect = itemText.getBoundingClientRect()

    // Align text baselines (horizontal)
    const valueLeftFromTrigger = valueRect.left - triggerRect.left
    const textLeftFromPositioner = textRect.left - positionerRect.left
    offsetX = valueLeftFromTrigger - textLeftFromPositioner

    // Align text centers (vertical)
    const valueCenterY = valueRect.top + valueRect.height / 2
    const textCenterFromPositioner =
      textRect.top - positionerRect.top + textRect.height / 2
    offsetY = valueCenterY - positionerRect.top - textCenterFromPositioner
  }

  // Calculate final position
  let left = triggerRect.left + offsetX
  let top = positionerRect.top + offsetY

  // Clamp to viewport with margins
  const maxLeft = viewportWidth - positionerRect.width - MARGIN
  const maxTop = viewportHeight - positionerRect.height - MARGIN

  left = Math.max(MARGIN, Math.min(left, maxLeft))
  top = Math.max(MARGIN, Math.min(top, maxTop))

  // Check if we have enough height
  const availableHeight = viewportHeight - 2 * MARGIN
  if (positionerRect.height > availableHeight) {
    return {
      shouldFallback: false,
      left,
      top: MARGIN,
      maxHeight: availableHeight,
    }
  }

  return { shouldFallback: false, left, top }
}

// ============================================================================
// Component
// ============================================================================

/**
 * Positions the select popup against its trigger.
 * Supports aligning the selected item with the trigger for a native select feel.
 *
 * Renders a `<div>` element.
 */
export const SelectPositioner = React.forwardRef<
  HTMLDivElement,
  SelectPositioner.Props
>(function SelectPositioner(props, forwardedRef) {
  const {
    alignItemWithTrigger = true,
    side: sideProp = 'bottom',
    align: alignProp = 'start',
    sideOffset = 0,
    className,
    style,
    children,
    ...rest
  } = props

  const popupMenuContext = usePopupMenuContext()
  const selectContext = useSelectContext()

  // Get open state from the store
  const open = popupMenuContext.store.useState('open')

  // Local state - track if alignment is active and if initial positioning is done
  const [alignItemWithTriggerActive, setAlignItemWithTriggerActive] =
    React.useState(alignItemWithTrigger)
  const [positionState, setPositionState] = React.useState<{
    positioned: boolean
    left?: number
    top?: number
    maxHeight?: number
  }>({ positioned: false })

  const positionerRef = React.useRef<HTMLDivElement | null>(null)
  const scrollUpArrowRef = React.useRef<HTMLDivElement | null>(null)
  const scrollDownArrowRef = React.useRef<HTMLDivElement | null>(null)

  // Reset positioning state after close animation completes
  // This preserves positioning during exit animations via onOpenChangeComplete
  const resetPositioningState = React.useCallback(() => {
    setAlignItemWithTriggerActive(alignItemWithTrigger)
    setPositionState({ positioned: false })
  }, [alignItemWithTrigger])

  // Register reset callback with SelectContext so Root can call it after animation
  React.useEffect(() => {
    const cleanup = selectContext.registerResetPositioningCallback(
      resetPositioningState,
    )
    return cleanup
  }, [selectContext, resetPositioningState])

  // Calculate position when alignItemWithTrigger is active
  // We use useLayoutEffect to calculate before paint, preventing flash
  // The calculation is done synchronously to ensure it completes before browser paint
  React.useLayoutEffect(() => {
    if (!open || !alignItemWithTriggerActive || positionState.positioned) {
      return
    }

    const positioner = positionerRef.current
    const triggerElement = selectContext.triggerRef.current
    const valueElement = selectContext.valueRef.current
    const selectedItemText = selectContext.selectedItemTextRef.current
    const firstItemText = selectContext.firstItemTextRef.current

    if (!positioner || !triggerElement) {
      return
    }

    // Use selected item text if available, otherwise fall back to first item text
    // This enables alignment even when no item is selected (aligns to first item)
    const itemText = selectedItemText ?? firstItemText

    // Calculate position synchronously - useLayoutEffect runs after DOM mutations
    // but before paint, so getBoundingClientRect will return correct values
    const result = calculateAlignmentPosition({
      triggerElement,
      positioner,
      valueElement,
      itemText,
    })

    if (result.shouldFallback) {
      setAlignItemWithTriggerActive(false)
      setPositionState({ positioned: true })
      return
    }

    setPositionState({
      positioned: true,
      left: result.left,
      top: result.top,
      maxHeight: result.maxHeight,
    })
  }, [
    open,
    alignItemWithTriggerActive,
    positionState.positioned,
    selectContext,
  ])

  // Determine rendered side - 'none' when align-item-with-trigger is active
  const renderedSide = alignItemWithTriggerActive ? 'none' : sideProp

  // Context value
  const contextValue: SelectPositionerContextValue = React.useMemo(
    () => ({
      alignItemWithTriggerActive,
      side: renderedSide as Side | 'none',
      align: alignProp as Align,
      scrollUpArrowRef,
      scrollDownArrowRef,
      setAlignItemWithTriggerActive,
      resetPositioningState,
    }),
    [
      alignItemWithTriggerActive,
      renderedSide,
      alignProp,
      resetPositioningState,
    ],
  )

  // Merge refs
  const mergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      positionerRef.current = node
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    [forwardedRef],
  )

  // When alignItemWithTrigger is active:
  // - Use visibility:hidden (NOT hidden attribute) to hide while measuring
  //   The hidden attribute prevents the element from having dimensions!
  // - Apply fixed positioning with calculated coordinates after measurement
  // - Show element after positioning is done

  const shouldHide =
    open && alignItemWithTriggerActive && !positionState.positioned

  // Build position styles for alignment mode
  const alignmentStyles: React.CSSProperties =
    alignItemWithTriggerActive && positionState.positioned
      ? {
          position: 'fixed',
          left: positionState.left,
          top: positionState.top,
          ...(positionState.maxHeight
            ? { maxHeight: positionState.maxHeight }
            : {}),
        }
      : {}

  return (
    <SelectPositionerContext.Provider value={contextValue}>
      <Popover.Positioner
        ref={mergedRef}
        side={alignItemWithTriggerActive ? undefined : sideProp}
        align={alignItemWithTriggerActive ? undefined : alignProp}
        sideOffset={alignItemWithTriggerActive ? 0 : sideOffset}
        className={className}
        style={{
          ...style,
          ...alignmentStyles,
          // Use visibility:hidden instead of hidden attribute so element can be measured
          ...(shouldHide ? { visibility: 'hidden' } : {}),
        }}
        {...{ [SelectPositionerDataAttributes.slot]: '' }}
        {...rest}
      >
        {children}
      </Popover.Positioner>
    </SelectPositionerContext.Provider>
  )
})

export namespace SelectPositioner {
  export type Props = SelectPositionerProps
  export type State = Popover.Positioner.State
}
