'use client'

import { useDirection } from '@base-ui/react/internals/direction-context'
import { Popover, type PopoverPositionerProps } from '@base-ui/react/popover'
import * as React from 'react'
import { usePopupMenuContext } from '../../internal/popup-menu/contexts/popup-menu-context.js'
import { clamp } from '../../utils/clamp.js'
import { getScale, normalizeRect, normalizeSize } from '../../utils/scale.js'
import {
  getMaxScrollOffset,
  SCROLL_EDGE_TOLERANCE_PX,
} from '../../utils/scroll-edges.js'
import { useSelectContext } from '../contexts/select-context.js'
import {
  type Align,
  SelectPositionerContext,
  type SelectPositionerContextValue,
  type Side,
} from '../contexts/select-positioner-context.js'
import {
  type AlignmentResult,
  computeAlignment,
  computeScrollGrowth,
  DEFAULT_MARGIN,
  DEFAULT_MIN_HEIGHT,
} from './alignment.js'
import { SelectPositionerDataAttributes } from './positioner.data-attrs.js'

export { SelectPositionerDataAttributes }

// ============================================================================
// Types
// ============================================================================

export interface SelectPositionerProps extends PopoverPositionerProps {
  /**
   * Whether the positioner overlaps the trigger so the selected item's text is
   * aligned with the trigger's value text (a native-select feel).
   *
   * Only applies to mouse/pen/keyboard input. It is automatically disabled when:
   * - the select was opened by touch (the full list is shown instead);
   * - the trigger is too close to a viewport edge; or
   * - there isn't enough room for a reasonably sized popup.
   *
   * @default true
   */
  alignItemWithTrigger?: boolean
}

interface AlignmentPlacement {
  left: number
  top: number | null
  bottom: number | null
  marginTop: number
  marginBottom: number
}

// ============================================================================
// Component
// ============================================================================

/**
 * Positions the select popup against its trigger.
 *
 * When `alignItemWithTrigger` is active, the popup overlaps the trigger so the
 * selected item's text lines up with the trigger's value, the list is
 * pre-scrolled to that item, and the popup is sized/anchored to fit the
 * viewport (Base UI parity). Otherwise it delegates to the standard anchored
 * positioning of `Popover.Positioner`.
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
  const direction = useDirection() === 'rtl' ? 'rtl' : 'ltr'

  const store = popupMenuContext.store
  const open = store.useState('open')
  const openMethod = store.useState('openMethod')

  // `controlled*` reflects the prop plus any runtime fallback to standard
  // positioning. Alignment additionally requires a non-touch open.
  const [controlledAlignItemWithTrigger, setControlledAlignItemWithTrigger] =
    React.useState(alignItemWithTrigger)
  const alignItemWithTriggerActive =
    controlledAlignItemWithTrigger && openMethod !== 'touch'

  const [positioned, setPositioned] = React.useState(false)
  const [placement, setPlacement] = React.useState<AlignmentPlacement | null>(
    null,
  )

  const positionerRef = React.useRef<HTMLDivElement | null>(null)
  const scrollUpArrowRef = React.useRef<HTMLDivElement | null>(null)
  const scrollDownArrowRef = React.useRef<HTMLDivElement | null>(null)
  const reachedMaxHeightRef = React.useRef(false)
  const initialPlacedRef = React.useRef(false)

  // Remove the imperative styles we apply during alignment so the element can
  // return to standard positioning (on fallback or after close).
  const clearImperativeStyles = React.useCallback(() => {
    const positioner = positionerRef.current
    const popup = store.context.refs.popupRef.current
    if (positioner) {
      positioner.style.height = ''
    }
    if (popup) {
      popup.style.height = ''
      popup.style.removeProperty('--transform-origin')
    }
    reachedMaxHeightRef.current = false
    initialPlacedRef.current = false
  }, [store])

  // Reset after the close animation completes so positioning is preserved
  // during the exit transition.
  const resetPositioningState = React.useCallback(() => {
    clearImperativeStyles()
    setControlledAlignItemWithTrigger(alignItemWithTrigger)
    setPositioned(false)
    setPlacement(null)
  }, [alignItemWithTrigger, clearImperativeStyles])

  React.useEffect(() => {
    const cleanup = selectContext.registerResetPositioningCallback(
      resetPositioningState,
    )
    return cleanup
  }, [selectContext, resetPositioningState])

  // Compute alignment once the popup is open. We use a passive effect (not
  // layout) because the popup/list elements register with the store in their
  // own effects, which run before this parent effect; `visibility: hidden`
  // keeps the measuring pass from flashing.
  React.useEffect(() => {
    if (!open || !alignItemWithTriggerActive || positioned) {
      return
    }

    const positioner = positionerRef.current
    const trigger = selectContext.triggerRef.current
    const popup = store.context.refs.popupRef.current
    const scroller = store.context.refs.listRef.current

    if (!positioner || !trigger || !popup || !scroller) {
      return
    }

    // Prefer the selected item's text; fall back to the first item when there
    // is no selection. Re-validate connectedness (items may have remounted).
    let textElement = selectContext.selectedItemTextRef.current
    if (!textElement?.isConnected) {
      const firstItemText = selectContext.firstItemTextRef.current
      textElement = firstItemText?.isConnected ? firstItemText : null
    }
    const valueElement = selectContext.valueRef.current

    // Neutralize any popup transform (entry animation / starting-style) so
    // measured geometry isn't skewed.
    const restoreTransforms = unsetTransformStyles(popup)

    let result: AlignmentResult
    try {
      const win = ownerWindow(positioner)
      const doc = positioner.ownerDocument
      const scale = getScale(trigger)

      const positionerStyles = win.getComputedStyle(positioner)
      const popupStyles = win.getComputedStyle(popup)

      result = computeAlignment({
        triggerRect: normalizeRect(trigger.getBoundingClientRect(), scale),
        positionerRect: normalizeRect(
          positioner.getBoundingClientRect(),
          scale,
        ),
        valueRect: valueElement
          ? normalizeRect(valueElement.getBoundingClientRect(), scale)
          : null,
        textRect: textElement
          ? normalizeRect(textElement.getBoundingClientRect(), scale)
          : null,
        scrollHeight: scroller.scrollHeight,
        documentClientHeight: doc.documentElement.clientHeight,
        documentClientWidth: doc.documentElement.clientWidth,
        marginTop:
          Number.parseFloat(positionerStyles.marginTop) || DEFAULT_MARGIN,
        marginBottom:
          Number.parseFloat(positionerStyles.marginBottom) || DEFAULT_MARGIN,
        minHeight:
          Number.parseFloat(positionerStyles.minHeight) || DEFAULT_MIN_HEIGHT,
        maxPopupHeight: getMaxPopupHeight(popupStyles),
        borderBottom: Number.parseFloat(popupStyles.borderBottomWidth) || 0,
        direction,
      })

      // Safari mispositions fixed popups while pinch-zoomed; fall back.
      const isPinchZoomed =
        (win.visualViewport?.scale ?? 1) !== 1 && isWebkit(win)

      if (result.fallback || isPinchZoomed) {
        setControlledAlignItemWithTrigger(false)
        setPositioned(true)
        return
      }

      // Imperative styles: height/scroll are mutated here (and, later, on
      // scroll) and must not be owned by React's style reconciliation.
      positioner.style.height = `${result.height}px`
      popup.style.height = '100%'
      if (result.transformOrigin) {
        popup.style.setProperty('--transform-origin', result.transformOrigin)
      }
      scroller.scrollTop = result.scrollTop
      reachedMaxHeightRef.current = result.reachedMaxHeight
      initialPlacedRef.current = true
    } finally {
      restoreTransforms()
    }

    setPlacement({
      left: result.left,
      top: result.isTopPositioned ? result.top : null,
      bottom: result.isTopPositioned ? null : 0,
      marginTop: result.marginTop,
      marginBottom: result.marginBottom,
    })
    setPositioned(true)
  }, [
    open,
    alignItemWithTriggerActive,
    positioned,
    store,
    selectContext,
    direction,
  ])

  // Grow the popup toward the viewport edge as the user scrolls (native-select
  // feel): scroll input first expands the popup until it reaches the maximum
  // available height, after which it scrolls normally. Mutates height/scrollTop
  // imperatively so there's no re-render per scroll frame.
  const handleScroll = React.useCallback(
    (scroller: HTMLElement) => {
      const positioner = positionerRef.current
      const popup = store.context.refs.popupRef.current
      if (!positioner || !popup || !initialPlacedRef.current) {
        return
      }
      // Once fully grown (or no longer aligned), the list scrolls normally.
      if (reachedMaxHeightRef.current || !alignItemWithTriggerActive) {
        return
      }

      const isTopPositioned = positioner.style.top === '0px'
      const isBottomPositioned = positioner.style.bottom === '0px'
      if (!isTopPositioned && !isBottomPositioned) {
        return
      }

      const win = ownerWindow(positioner)
      const doc = positioner.ownerDocument
      const scale = getScale(positioner)
      const currentHeight = normalizeSize(
        positioner.getBoundingClientRect().height,
        'y',
        scale,
      )
      const positionerStyles = win.getComputedStyle(positioner)
      const marginTop = Number.parseFloat(positionerStyles.marginTop) || 0
      const marginBottom = Number.parseFloat(positionerStyles.marginBottom) || 0
      const maxPopupHeight = getMaxPopupHeight(win.getComputedStyle(popup))
      const maxAvailableHeight = Math.min(
        doc.documentElement.clientHeight - marginTop - marginBottom,
        maxPopupHeight,
      )

      const result = computeScrollGrowth({
        isTopPositioned,
        currentHeight,
        scrollTop: scroller.scrollTop,
        maxScrollTop: getMaxScrollOffset(
          scroller.scrollHeight,
          scroller.clientHeight,
        ),
        maxAvailableHeight,
      })

      if (result.height != null) {
        positioner.style.height = `${result.height}px`
      }

      switch (result.scroll.kind) {
        case 'set':
          scroller.scrollTop = result.scroll.value
          break
        case 'max': {
          const nextMax = getMaxScrollOffset(
            scroller.scrollHeight,
            scroller.clientHeight,
          )
          if (
            Math.abs(scroller.scrollTop - nextMax) > SCROLL_EDGE_TOLERANCE_PX
          ) {
            scroller.scrollTop = nextMax
          }
          break
        }
        case 'clamp': {
          const nextMax = getMaxScrollOffset(
            scroller.scrollHeight,
            scroller.clientHeight,
          )
          const target = clamp(result.scroll.value, 0, nextMax)
          if (
            Math.abs(scroller.scrollTop - target) > SCROLL_EDGE_TOLERANCE_PX
          ) {
            scroller.scrollTop = target
          }
          break
        }
        default:
          break
      }

      if (result.reachedMaxHeight) {
        reachedMaxHeightRef.current = true
      }
    },
    [store, alignItemWithTriggerActive],
  )

  // Drive the grow-on-scroll handler from the scroller's scroll events. The
  // existing scroll arrows nudge `scrollTop`, so they feed growth for free.
  React.useEffect(() => {
    if (!open || !alignItemWithTriggerActive || !positioned) {
      return
    }
    const scroller = store.context.refs.listRef.current
    if (!scroller) {
      return
    }
    const onScroll = () => handleScroll(scroller)
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
    }
  }, [open, alignItemWithTriggerActive, positioned, handleScroll, store])

  const renderedSide: Side | 'none' = alignItemWithTriggerActive
    ? 'none'
    : (sideProp as Side)

  const contextValue: SelectPositionerContextValue = React.useMemo(
    () => ({
      alignItemWithTriggerActive,
      side: renderedSide,
      align: alignProp as Align,
      scrollUpArrowRef,
      scrollDownArrowRef,
      setAlignItemWithTriggerActive: setControlledAlignItemWithTrigger,
      resetPositioningState,
    }),
    [
      alignItemWithTriggerActive,
      renderedSide,
      alignProp,
      resetPositioningState,
    ],
  )

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

  // Hidden (but laid out) while measuring so the pass doesn't flash.
  const shouldHide = open && alignItemWithTriggerActive && !positioned

  // React-owned styles in alignment mode. These explicitly override the
  // anchored styles `Popover.Positioner` applies (position/transform/inset) so
  // there's no conflict; `height` is intentionally omitted (managed
  // imperatively above and on scroll).
  const alignmentStyles: React.CSSProperties =
    alignItemWithTriggerActive && placement
      ? {
          position: 'fixed',
          transform: 'none',
          left: placement.left,
          top: placement.top ?? 'auto',
          bottom: placement.bottom ?? 'auto',
          marginTop: placement.marginTop,
          marginBottom: placement.marginBottom,
          maxHeight: 'none',
        }
      : {}

  return (
    <SelectPositionerContext.Provider value={contextValue}>
      <Popover.Positioner
        ref={mergedRef}
        side={alignItemWithTriggerActive ? undefined : sideProp}
        align={alignItemWithTriggerActive ? undefined : alignProp}
        sideOffset={alignItemWithTriggerActive ? 0 : sideOffset}
        disableAnchorTracking={alignItemWithTriggerActive || undefined}
        className={className}
        style={{
          ...style,
          ...alignmentStyles,
          ...(shouldHide ? { visibility: 'hidden' } : {}),
        }}
        {...(alignItemWithTriggerActive
          ? { 'data-side': 'none', 'data-align': alignProp }
          : {})}
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

// ============================================================================
// Helpers
// ============================================================================

function ownerWindow(node: Element): Window {
  return node.ownerDocument?.defaultView ?? window
}

function getMaxPopupHeight(popupStyles: CSSStyleDeclaration): number {
  const maxHeight = popupStyles.maxHeight || ''
  return maxHeight.endsWith('px')
    ? Number.parseFloat(maxHeight) || Number.POSITIVE_INFINITY
    : Number.POSITIVE_INFINITY
}

function isWebkit(win: Window): boolean {
  const nav = win.navigator
  if (!nav) {
    return false
  }
  return (
    /AppleWebKit/.test(nav.userAgent) &&
    !/Chrome|Chromium|Edg|OPR/.test(nav.userAgent)
  )
}

const TRANSFORM_STYLE_RESETS = [
  ['transform', 'none'],
  ['scale', '1'],
  ['translate', '0 0'],
] as const

/**
 * Temporarily clear transform-related styles on an element so geometry reads
 * aren't affected by an in-flight transform. Returns a restore function.
 */
function unsetTransformStyles(element: HTMLElement): () => void {
  const { style } = element
  const original: Record<string, string> = {}

  for (const [property, value] of TRANSFORM_STYLE_RESETS) {
    original[property] = style.getPropertyValue(property)
    style.setProperty(property, value, 'important')
  }

  return () => {
    for (const [property] of TRANSFORM_STYLE_RESETS) {
      const value = original[property]
      if (value) {
        style.setProperty(property, value)
      } else {
        style.removeProperty(property)
      }
    }
  }
}
