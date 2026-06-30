import { clamp } from '../../utils/clamp.js'
import type { NormalizedRect } from '../../utils/scale.js'
import {
  getMaxScrollOffset,
  SCROLL_EDGE_TOLERANCE_PX,
} from '../../utils/scroll-edges.js'

// ============================================================================
// Constants (Base UI parity)
// ============================================================================

/** Horizontal viewport padding kept between the popup and the viewport edges. */
export const ALIGNMENT_PADDING_X = 5
/** Distance from a viewport edge within which we abandon alignment. */
export const TRIGGER_COLLISION_THRESHOLD = 20
/** Default outer margins when the positioner has no explicit margin CSS. */
export const DEFAULT_MARGIN = 10
/** Default minimum popup height before falling back to trigger alignment. */
export const DEFAULT_MIN_HEIGHT = 100

// ============================================================================
// Types
// ============================================================================

export interface AlignmentInput {
  /** Scale-normalized rect of the trigger. */
  triggerRect: NormalizedRect
  /** Scale-normalized rect of the positioner (natural, pre-alignment). */
  positionerRect: NormalizedRect
  /** Scale-normalized rect of the trigger's value text, if available. */
  valueRect: NormalizedRect | null
  /** Scale-normalized rect of the item text to align (selected or first). */
  textRect: NormalizedRect | null
  /** Natural scroll height of the scroller (content height). */
  scrollHeight: number
  /** `document.documentElement.clientHeight`. */
  documentClientHeight: number
  /** `document.documentElement.clientWidth`. */
  documentClientWidth: number
  /** Resolved top margin (px). */
  marginTop: number
  /** Resolved bottom margin (px). */
  marginBottom: number
  /** Resolved minimum popup height (px). */
  minHeight: number
  /** Popup `max-height` in px, or `Infinity` when unconstrained. */
  maxPopupHeight: number
  /** Popup bottom border width (px). */
  borderBottom: number
  /** Writing direction. */
  direction: 'ltr' | 'rtl'
}

export interface AlignmentResult {
  /** When true, alignment is not viable; fall back to trigger-anchored placement. */
  fallback: boolean
  /** Final clamped left in viewport pixels. */
  left: number
  /** Pin via `top` (true) or via `bottom: 0` (false). */
  isTopPositioned: boolean
  /** Top offset in px when {@link isTopPositioned}. */
  top: number
  /** Final popup height in px. */
  height: number
  /** Scroll offset to apply to the scroller so the item aligns with the trigger. */
  scrollTop: number
  /** Resolved top margin (px). */
  marginTop: number
  /** Resolved bottom margin (px). */
  marginBottom: number
  /** Whether the popup opened at its maximum height (no room to grow on scroll). */
  reachedMaxHeight: boolean
  /** Value for the popup `--transform-origin`, or `null` when not computed. */
  transformOrigin: string | null
}

// ============================================================================
// Core computation (pure)
// ============================================================================

/**
 * Compute the overlap ("align item with trigger") placement for a select popup,
 * porting Base UI's `SelectPopup` geometry.
 *
 * Pure and deterministic: the scroller's client height is modeled as the
 * computed popup `height`, so no live DOM reads are required. The caller applies
 * the result and may refine `scrollTop` against the live scroller.
 */
export function computeAlignment(input: AlignmentInput): AlignmentResult {
  const {
    triggerRect,
    positionerRect,
    valueRect,
    textRect,
    scrollHeight,
    documentClientHeight,
    documentClientWidth,
    marginTop,
    marginBottom,
    minHeight,
    maxPopupHeight,
    borderBottom,
    direction,
  } = input

  const fallback = (): AlignmentResult => ({
    fallback: true,
    left: 0,
    isTopPositioned: false,
    top: 0,
    height: 0,
    scrollTop: 0,
    marginTop,
    marginBottom,
    reachedMaxHeight: false,
    transformOrigin: null,
  })

  const viewportHeight = documentClientHeight - marginTop - marginBottom
  const viewportWidth = documentClientWidth
  const triggerHeight = triggerRect.height
  const availableSpaceBeneathTrigger =
    viewportHeight - triggerRect.bottom + triggerHeight

  let alignedLeft =
    direction === 'rtl'
      ? triggerRect.right - positionerRect.width
      : triggerRect.left
  let offsetY = 0
  let textCenterY: number | null = null

  if (textRect && valueRect) {
    alignedLeft =
      positionerRect.left +
      (direction === 'rtl'
        ? valueRect.right - textRect.right
        : valueRect.left - textRect.left)

    const valueCenterFromTriggerTop =
      valueRect.top - triggerRect.top + valueRect.height / 2
    const textCenterFromPositionerTop =
      textRect.top - positionerRect.top + textRect.height / 2

    offsetY = textCenterFromPositionerTop - valueCenterFromTriggerTop
    textCenterY = textRect.top + textRect.height / 2
  }

  const idealHeight =
    availableSpaceBeneathTrigger + offsetY + marginBottom + borderBottom
  let height = Math.min(viewportHeight, idealHeight)
  // Faithful to Base UI: margins are subtracted again here (used only by the
  // top-positioned `top` heuristic below).
  const maxHeight = viewportHeight - marginTop - marginBottom
  const scrollTop = idealHeight - height

  const maxRight = viewportWidth - ALIGNMENT_PADDING_X
  const left = clamp(
    alignedLeft,
    ALIGNMENT_PADDING_X,
    maxRight - positionerRect.width,
  )

  // Model the scroller's client height as the applied popup height.
  const maxScrollTop = getMaxScrollOffset(scrollHeight, height)
  const isTopPositioned = scrollTop >= maxScrollTop - SCROLL_EDGE_TOLERANCE_PX

  if (isTopPositioned) {
    height =
      Math.min(viewportHeight, positionerRect.height) -
      (scrollTop - maxScrollTop)
  }

  // Bail to trigger-anchored placement when the trigger hugs a viewport edge or
  // the aligned popup would be shorter than the (content-capped) minimum.
  const triggerEdgeFallback =
    triggerRect.top < TRIGGER_COLLISION_THRESHOLD ||
    triggerRect.bottom > viewportHeight - TRIGGER_COLLISION_THRESHOLD ||
    Math.ceil(height) + SCROLL_EDGE_TOLERANCE_PX <
      Math.min(scrollHeight, minHeight)

  if (triggerEdgeFallback) {
    return fallback()
  }

  const initialHeight = Math.max(minHeight, height)

  // Base UI folds the bottom margin and the popup's bottom border into
  // `idealHeight`, which then drives the placement (`topOffset`/`scrollTop`).
  // That leaks into the vertical position: the aligned item lands off the
  // trigger value by exactly `marginTop - marginBottom - borderBottom` (e.g. 1px
  // too high for a popup with a 1px border and symmetric margins). Cancel that
  // here so the selected item's text lines up with the value pixel-for-pixel.
  // This is a no-op in the default case (no border, equal margins).
  const alignmentCorrection = marginBottom + borderBottom - marginTop

  let top = 0
  let finalScrollTop = scrollTop
  if (isTopPositioned) {
    const topOffset = Math.max(0, viewportHeight - idealHeight)
    top =
      positionerRect.height >= maxHeight
        ? 0
        : Math.max(0, topOffset + alignmentCorrection)
    finalScrollTop = maxScrollTop
  } else {
    finalScrollTop = Math.max(0, scrollTop - alignmentCorrection)
  }

  let transformOrigin: string | null = null
  if (textCenterY != null) {
    const popupTop = positionerRect.top
    const popupHeight = positionerRect.height
    const transformOriginY =
      popupHeight > 0 ? ((textCenterY - popupTop) / popupHeight) * 100 : 50
    transformOrigin = `50% ${clamp(transformOriginY, 0, 100)}%`
  }

  const reachedMaxHeight =
    initialHeight === viewportHeight || height >= maxPopupHeight

  return {
    fallback: false,
    left,
    isTopPositioned,
    top,
    height,
    scrollTop: finalScrollTop,
    marginTop,
    marginBottom,
    reachedMaxHeight,
    transformOrigin,
  }
}

// ============================================================================
// Grow-on-scroll (pure)
// ============================================================================

export interface ScrollGrowthInput {
  /** Whether the popup is pinned to the top edge (`top: 0`). */
  isTopPositioned: boolean
  /** Current popup height in px. */
  currentHeight: number
  /** Current scroller scroll offset. */
  scrollTop: number
  /** Current maximum scroll offset of the scroller. */
  maxScrollTop: number
  /** Maximum height the popup may grow to (viewport- and max-height-bound). */
  maxAvailableHeight: number
}

/** How the caller should adjust the scroller after resizing. */
export type ScrollGrowthIntent =
  | { kind: 'none' }
  /** Set `scrollTop` directly to `value`. */
  | { kind: 'set'; value: number }
  /** Set `scrollTop` to the scroller's (recomputed) maximum. */
  | { kind: 'max' }
  /** Set `scrollTop` to `clamp(value, 0, recomputedMax)`. */
  | { kind: 'clamp'; value: number }

export interface ScrollGrowthResult {
  /** New popup height in px, or `null` to leave it unchanged. */
  height: number | null
  /** Scroller adjustment to apply after resizing. */
  scroll: ScrollGrowthIntent
  /** Whether the popup has now reached its maximum height (latches scrolling). */
  reachedMaxHeight: boolean
}

/**
 * Decide how a scroll gesture should be split between *growing* the popup and
 * actually *scrolling* its content, while the popup is pinned to a viewport
 * edge and hasn't yet reached its maximum height. Ported from Base UI's
 * `SelectPopup` scroll handler.
 *
 * The caller must ensure the popup is edge-pinned (top or bottom) and that
 * {@link ScrollGrowthResult.reachedMaxHeight} hasn't already latched.
 */
export function computeScrollGrowth(
  input: ScrollGrowthInput,
): ScrollGrowthResult {
  const {
    isTopPositioned,
    currentHeight,
    scrollTop,
    maxScrollTop,
    maxAvailableHeight,
  } = input

  const diff = isTopPositioned ? maxScrollTop - scrollTop : scrollTop

  // Tiny remaining gap: consume it as a final bit of growth and snap to the edge.
  if (diff <= SCROLL_EDGE_TOLERANCE_PX) {
    const heightDelta = clamp(diff, 0, maxAvailableHeight - currentHeight)
    const newHeight = currentHeight + heightDelta
    return {
      height: heightDelta > 0 ? newHeight : null,
      scroll: { kind: 'set', value: isTopPositioned ? maxScrollTop : 0 },
      reachedMaxHeight:
        maxAvailableHeight - newHeight <= SCROLL_EDGE_TOLERANCE_PX,
    }
  }

  const nextHeight = Math.min(currentHeight + diff, maxAvailableHeight)
  let scroll: ScrollGrowthIntent = { kind: 'none' }
  let reachedMax = false

  if (maxAvailableHeight - nextHeight > SCROLL_EDGE_TOLERANCE_PX) {
    // Still room to grow: keep the content anchored to the pinned edge.
    scroll = isTopPositioned ? { kind: 'max' } : { kind: 'clamp', value: 0 }
  } else {
    reachedMax = true
    if (!isTopPositioned && scrollTop < maxScrollTop) {
      // Consume the overshoot beyond max as real scrolling.
      const overshoot = currentHeight + diff - maxAvailableHeight
      scroll = { kind: 'clamp', value: scrollTop - (diff - overshoot) }
    }
  }

  const height = Math.ceil(nextHeight)

  return {
    height,
    scroll,
    reachedMaxHeight:
      reachedMax || height >= maxAvailableHeight - SCROLL_EDGE_TOLERANCE_PX,
  }
}
