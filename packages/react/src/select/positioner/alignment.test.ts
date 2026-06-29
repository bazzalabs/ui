import { describe, expect, it } from 'vitest'
import type { NormalizedRect } from '../../utils/scale.js'
import {
  type AlignmentInput,
  computeAlignment,
  computeScrollGrowth,
} from './alignment.js'

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
): NormalizedRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
  }
}

// A trigger comfortably in the middle of an 800x1000 viewport with a selected
// item whose text sits just below the trigger's value text.
const base: AlignmentInput = {
  triggerRect: rect(100, 400, 200, 30),
  positionerRect: rect(100, 430, 200, 150),
  valueRect: rect(110, 405, 100, 20),
  textRect: rect(110, 445, 80, 20),
  scrollHeight: 150,
  documentClientHeight: 800,
  documentClientWidth: 1000,
  marginTop: 10,
  marginBottom: 10,
  minHeight: 100,
  maxPopupHeight: Number.POSITIVE_INFINITY,
  borderBottom: 0,
  direction: 'ltr',
}

describe('computeAlignment', () => {
  it('aligns a mid-viewport trigger', () => {
    const result = computeAlignment(base)

    expect(result.fallback).toBe(false)
    // alignedLeft = positioner.left + (value.left - text.left) = 100 + 0
    expect(result.left).toBe(100)
    expect(result.transformOrigin).toMatch(/^50% /)
  })

  it('mirrors horizontal alignment in RTL', () => {
    const ltr = computeAlignment(base)
    const rtl = computeAlignment({ ...base, direction: 'rtl' })

    // RTL: positioner.left + (value.right - text.right) = 100 + (210 - 190)
    expect(rtl.left).toBe(120)
    expect(ltr.left).toBe(100)
  })

  it('falls back when the trigger hugs the top edge', () => {
    const result = computeAlignment({
      ...base,
      triggerRect: rect(100, 10, 200, 30),
    })

    expect(result.fallback).toBe(true)
  })

  it('falls back when the trigger hugs the bottom edge', () => {
    // bottom = 780 > viewportHeight(780) - threshold(20)
    const result = computeAlignment({
      ...base,
      triggerRect: rect(100, 750, 200, 30),
    })

    expect(result.fallback).toBe(true)
  })

  it('does not fall back for a short list (regression)', () => {
    // A 60px list is shorter than the 100px default min height. The old logic
    // fell back whenever the natural popup height was < minHeight; the ported
    // logic compares against min(scrollHeight, minHeight), so short lists align.
    const result = computeAlignment({
      ...base,
      positionerRect: rect(100, 430, 200, 60),
      scrollHeight: 60,
    })

    expect(result.fallback).toBe(false)
    expect(result.height).toBe(60)
  })

  it('aligns to the trigger left and skips transform-origin without item text', () => {
    const result = computeAlignment({
      ...base,
      valueRect: null,
      textRect: null,
    })

    expect(result.fallback).toBe(false)
    expect(result.left).toBe(100)
    expect(result.transformOrigin).toBeNull()
  })

  it('reports reaching max height when capped by the popup max-height', () => {
    const result = computeAlignment({ ...base, maxPopupHeight: 120 })

    // height (150 natural) >= maxPopupHeight (120)
    expect(result.reachedMaxHeight).toBe(true)
  })

  it('keeps a top-positioned item aligned regardless of the popup bottom border', () => {
    // A popup bottom border must not shift the aligned item off the trigger
    // value: Base UI folds `borderBottom` into the placement, which would move
    // `top` up by 1px. The correction cancels it, so `top` is border-invariant.
    const noBorder = computeAlignment(base)
    const withBorder = computeAlignment({ ...base, borderBottom: 1 })

    expect(noBorder.isTopPositioned).toBe(true)
    expect(withBorder.isTopPositioned).toBe(true)
    expect(noBorder.top).toBe(380)
    expect(withBorder.top).toBe(noBorder.top)
  })

  it('keeps a bottom-positioned item aligned regardless of the popup bottom border', () => {
    // Force bottom-positioning with a large offset so the popup overflows the
    // viewport (idealHeight > viewportHeight). The applied `scrollTop` must not
    // change when a bottom border is present.
    const bottomBase: AlignmentInput = {
      ...base,
      textRect: rect(110, 835, 80, 20),
      scrollHeight: 1000,
    }
    const noBorder = computeAlignment(bottomBase)
    const withBorder = computeAlignment({ ...bottomBase, borderBottom: 1 })

    expect(noBorder.isTopPositioned).toBe(false)
    expect(withBorder.isTopPositioned).toBe(false)
    expect(noBorder.scrollTop).toBe(10)
    expect(withBorder.scrollTop).toBe(noBorder.scrollTop)
  })
})

describe('computeScrollGrowth', () => {
  it('grows a bottom-pinned popup and keeps content anchored while there is room', () => {
    const result = computeScrollGrowth({
      isTopPositioned: false,
      currentHeight: 200,
      scrollTop: 50,
      maxScrollTop: 500,
      maxAvailableHeight: 600,
    })

    expect(result.height).toBe(250)
    expect(result.scroll).toEqual({ kind: 'clamp', value: 0 })
    expect(result.reachedMaxHeight).toBe(false)
  })

  it('latches at max height and consumes overshoot as real scrolling (bottom)', () => {
    const result = computeScrollGrowth({
      isTopPositioned: false,
      currentHeight: 580,
      scrollTop: 50,
      maxScrollTop: 500,
      maxAvailableHeight: 600,
    })

    expect(result.height).toBe(600)
    // overshoot = 580 + 50 - 600 = 30; target = 50 - (50 - 30) = 30
    expect(result.scroll).toEqual({ kind: 'clamp', value: 30 })
    expect(result.reachedMaxHeight).toBe(true)
  })

  it('grows a top-pinned popup toward the max scroll position', () => {
    const result = computeScrollGrowth({
      isTopPositioned: true,
      currentHeight: 200,
      scrollTop: 100,
      maxScrollTop: 300,
      maxAvailableHeight: 600,
    })

    expect(result.height).toBe(400)
    expect(result.scroll).toEqual({ kind: 'max' })
    expect(result.reachedMaxHeight).toBe(false)
  })

  it('consumes a tiny remaining gap as a final bit of growth', () => {
    const result = computeScrollGrowth({
      isTopPositioned: false,
      currentHeight: 595,
      scrollTop: 1,
      maxScrollTop: 500,
      maxAvailableHeight: 600,
    })

    expect(result.height).toBe(596)
    expect(result.scroll).toEqual({ kind: 'set', value: 0 })
    expect(result.reachedMaxHeight).toBe(false)
  })

  it('latches reachedMaxHeight once fully grown with no further height change', () => {
    const result = computeScrollGrowth({
      isTopPositioned: false,
      currentHeight: 600,
      scrollTop: 0,
      maxScrollTop: 500,
      maxAvailableHeight: 600,
    })

    expect(result.height).toBeNull()
    expect(result.reachedMaxHeight).toBe(true)
  })
})
