import { fireEvent, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  defaultPopupMenuSafeTriangleAreaDebugSettings,
  PopupMenuDebugContext,
} from '../contexts/popup-menu-debug-context.js'
import {
  HIT_MONITOR_LIFETIME_MS,
  type UseAimMonitorParams,
  useAimMonitor,
} from './use-aim-monitor.js'

function createRect({
  top,
  left,
  width,
  height,
}: {
  top: number
  left: number
  width: number
  height: number
}): DOMRect {
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect
}

const content = createRect({ top: 40, left: 240, width: 180, height: 160 })
const anchor = createRect({ top: 60, left: 80, width: 120, height: 30 })

function setup(
  overrides: Partial<UseAimMonitorParams> = {},
  wrapper?: React.ComponentType<{ children: React.ReactNode }>,
) {
  const onHit = vi.fn()
  const onMiss = vi.fn()
  const onClose = vi.fn()
  const onSettled = vi.fn()
  const result = renderHook(
    () =>
      useAimMonitor({
        getContentRect: () => content,
        getAnchorRect: () => anchor,
        anchorMode: 'anchor-rect',
        closeDelay: 0,
        closeOnPointerLeave: true,
        onHit,
        onMiss,
        onClose,
        onSettled,
        ...overrides,
      }),
    { wrapper },
  )
  return { ...result, onHit, onMiss, onClose, onSettled }
}

function move(x: number, y: number) {
  fireEvent.pointerMove(window, {
    clientX: x,
    clientY: y,
    pointerType: 'mouse',
  })
}

function hitPath() {
  move(120, 90)
  move(150, 92)
  move(180, 94)
}

function missPath() {
  move(180, 220)
  move(160, 230)
  move(140, 240)
}

function trackMonitorListeners() {
  const added = vi.spyOn(window, 'addEventListener')
  const removed = vi.spyOn(window, 'removeEventListener')
  added.mockClear()
  removed.mockClear()
  const monitorHandlers = () =>
    added.mock.calls
      .filter(([type]) => type === 'pointermove')
      .map(([, handler]) => handler)
  const removedHandlers = () =>
    removed.mock.calls
      .filter(([type]) => type === 'pointermove')
      .map(([, handler]) => handler)
  return { monitorHandlers, removedHandlers }
}

describe('useAimMonitor', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('HIT calls onHit and starts a monitor', () => {
    const h = setup()
    hitPath()
    const listeners = trackMonitorListeners()
    h.result.current.pointerLeft({
      clientX: 190,
      clientY: 94,
      pointerType: 'mouse',
    })
    expect(h.onHit).toHaveBeenCalledTimes(1)
    expect(h.onClose).not.toHaveBeenCalled()
    expect(h.result.current.isActive()).toBe(true)
    expect(listeners.monitorHandlers()).toHaveLength(1)
  })

  it('MISS with immediate close calls onMiss and onClose synchronously', () => {
    const h = setup()
    missPath()
    const listeners = trackMonitorListeners()
    h.result.current.pointerLeft({
      clientX: 130,
      clientY: 260,
      pointerType: 'mouse',
    })
    expect(h.onMiss).toHaveBeenCalledTimes(1)
    expect(h.onMiss.mock.calls[0]![0].anchor).toBe('left')
    expect(h.onClose).toHaveBeenCalledTimes(1)
    expect(h.result.current.isActive()).toBe(false)
    expect(listeners.monitorHandlers()).toHaveLength(0)
  })

  it('MISS with a delay closes after the delay', () => {
    const h = setup({ closeDelay: 240 })
    missPath()
    const listeners = trackMonitorListeners()
    h.result.current.pointerLeft({
      clientX: 130,
      clientY: 260,
      pointerType: 'mouse',
    })
    vi.advanceTimersByTime(239)
    expect(h.onClose).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(h.onClose).toHaveBeenCalledTimes(1)
    expect(listeners.monitorHandlers()).toHaveLength(1)
    expect(listeners.removedHandlers()).toContain(
      listeners.monitorHandlers()[0],
    )
  })

  it('HIT then REVERSAL misses and closes', () => {
    const h = setup({ closeDelay: 100 })
    hitPath()
    h.result.current.pointerLeft({
      clientX: 190,
      clientY: 94,
      pointerType: 'mouse',
    })
    move(186, 96)
    expect(h.onMiss).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(100)
    expect(h.onClose).toHaveBeenCalledTimes(1)
  })

  it('HIT then INTO CONTENT settles without closing', () => {
    const h = setup()
    hitPath()
    const listeners = trackMonitorListeners()
    h.result.current.pointerLeft({
      clientX: 190,
      clientY: 94,
      pointerType: 'mouse',
    })
    move(250, 100)
    expect(h.onSettled).toHaveBeenCalledWith('inside-content')
    expect(h.onClose).not.toHaveBeenCalled()
    expect(listeners.removedHandlers()).toContain(
      listeners.monitorHandlers()[0],
    )
  })

  it('settles inside at leave without a monitor', () => {
    const h = setup()
    move(300, 100)
    move(310, 100)
    const listeners = trackMonitorListeners()
    h.result.current.pointerLeft({
      clientX: 320,
      clientY: 100,
      pointerType: 'mouse',
    })
    expect(h.onSettled).toHaveBeenCalledWith('inside-at-leave')
    expect(h.result.current.isActive()).toBe(false)
    expect(listeners.monitorHandlers()).toHaveLength(0)
  })

  it('MISS can transition back to HIT', () => {
    const h = setup({ closeDelay: 240 })
    missPath()
    h.result.current.pointerLeft({
      clientX: 130,
      clientY: 260,
      pointerType: 'mouse',
    })
    move(170, 200)
    move(210, 170)
    move(250, 140)
    expect(h.onHit).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(500)
    expect(h.onClose).not.toHaveBeenCalled()
  })

  it('does not monitor misses when closeOnPointerLeave is false', () => {
    const h = setup({ closeOnPointerLeave: false })
    missPath()
    const listeners = trackMonitorListeners()
    h.result.current.pointerLeft({
      clientX: 130,
      clientY: 260,
      pointerType: 'mouse',
    })
    expect(h.onMiss).toHaveBeenCalledTimes(1)
    expect(h.onClose).not.toHaveBeenCalled()
    expect(h.result.current.isActive()).toBe(false)
    expect(listeners.monitorHandlers()).toHaveLength(0)
  })

  it('closes immediately when content is unavailable', () => {
    const h = setup({ getContentRect: () => null })
    const listeners = trackMonitorListeners()
    h.result.current.pointerLeft({
      clientX: 130,
      clientY: 260,
      pointerType: 'mouse',
    })
    expect(h.onClose).toHaveBeenCalledTimes(1)
    expect(h.result.current.isActive()).toBe(false)
    expect(listeners.monitorHandlers()).toHaveLength(0)
  })

  it('stops when content disappears during monitoring', () => {
    let rect: DOMRect | null = content
    const h = setup({ getContentRect: () => rect })
    hitPath()
    const listeners = trackMonitorListeners()
    h.result.current.pointerLeft({
      clientX: 190,
      clientY: 94,
      pointerType: 'mouse',
    })
    rect = null
    move(200, 90)
    expect(h.onHit).toHaveBeenCalledTimes(1)
    expect(h.onMiss).not.toHaveBeenCalled()
    expect(h.result.current.isActive()).toBe(false)
    expect(listeners.removedHandlers()).toContain(
      listeners.monitorHandlers()[0],
    )
  })

  it('ignores touch leaves', () => {
    const h = setup()
    const listeners = trackMonitorListeners()
    h.result.current.pointerLeft({
      clientX: 130,
      clientY: 260,
      pointerType: 'touch',
    })
    expect(h.onHit).not.toHaveBeenCalled()
    expect(h.onMiss).not.toHaveBeenCalled()
    expect(h.onClose).not.toHaveBeenCalled()
    expect(listeners.monitorHandlers()).toHaveLength(0)
  })

  it('cancel clears a pending close and settles once', () => {
    const h = setup({ closeDelay: 240 })
    missPath()
    h.result.current.pointerLeft({
      clientX: 130,
      clientY: 260,
      pointerType: 'mouse',
    })
    h.result.current.cancel()
    vi.advanceTimersByTime(500)
    expect(h.onClose).not.toHaveBeenCalled()
    expect(h.onSettled).toHaveBeenCalledTimes(1)
    expect(h.result.current.isActive()).toBe(false)
    h.result.current.cancel()
    expect(h.onSettled).toHaveBeenCalledTimes(1)
  })

  it('expires a HIT monitor without callbacks', () => {
    const h = setup()
    hitPath()
    const listeners = trackMonitorListeners()
    h.result.current.pointerLeft({
      clientX: 190,
      clientY: 94,
      pointerType: 'mouse',
    })
    vi.advanceTimersByTime(HIT_MONITOR_LIFETIME_MS)
    expect(h.result.current.isActive()).toBe(false)
    expect(h.onClose).not.toHaveBeenCalled()
    expect(listeners.removedHandlers()).toContain(
      listeners.monitorHandlers()[0],
    )
  })

  function pendingSetup(overrides: Partial<UseAimMonitorParams> = {}) {
    let rect: DOMRect = content
    const h = setup({
      anchorMode: 'pointer',
      getContentRect: () => rect,
      ...overrides,
    })
    move(300, 120)
    move(300, 150)
    move(300, 190)
    rect = createRect({ top: 40, left: 240, width: 180, height: 100 })
    const listeners = trackMonitorListeners()
    h.result.current.pointerLeft({
      clientX: 300,
      clientY: 190,
      pointerType: 'mouse',
    })
    return { ...h, listeners }
  }

  it('layout-induced leave enters pending mode and resolves away', () => {
    const h = pendingSetup()
    expect(h.onHit).not.toHaveBeenCalled()
    expect(h.onMiss).not.toHaveBeenCalled()
    move(300, 230)
    expect(h.onMiss).toHaveBeenCalledTimes(1)
    expect(h.onClose).toHaveBeenCalledTimes(1)
    expect(h.listeners.monitorHandlers()).toHaveLength(1)
  })

  it('pending mode resolves to a hit and then settles inside', () => {
    const h = pendingSetup()
    move(300, 170)
    expect(h.onHit).toHaveBeenCalledTimes(1)
    move(300, 150)
    expect(h.onHit).toHaveBeenCalledTimes(1)
    move(300, 120)
    expect(h.onSettled).toHaveBeenCalledWith('inside-content')
  })

  it('pending mode hit adopts the hit lifetime', () => {
    const h = pendingSetup()
    expect(h.listeners.monitorHandlers()).toHaveLength(1)
    move(300, 170)
    expect(h.onHit).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(HIT_MONITOR_LIFETIME_MS - 1)
    expect(h.result.current.isActive()).toBe(true)
    vi.advanceTimersByTime(1)
    expect(h.result.current.isActive()).toBe(false)
    expect(h.listeners.removedHandlers()).toContain(
      h.listeners.monitorHandlers()[0],
    )
    expect(h.onClose).not.toHaveBeenCalled()
  })

  it('pending mode delayed miss stops after closeDelay', () => {
    const h = pendingSetup({ closeDelay: 240 })
    move(300, 230)
    expect(h.onMiss).toHaveBeenCalledTimes(1)
    expect(h.onClose).not.toHaveBeenCalled()
    vi.advanceTimersByTime(240)
    expect(h.onClose).toHaveBeenCalledTimes(1)
    expect(h.result.current.isActive()).toBe(false)
    expect(h.listeners.removedHandlers()).toContain(
      h.listeners.monitorHandlers()[0],
    )
    move(300, 180)
    expect(h.onHit).toHaveBeenCalledTimes(0)
  })

  it('pointer anchor mode resolves a real leave and re-resolves to a hit', () => {
    const h = setup({ anchorMode: 'pointer', closeDelay: 240 })
    move(300, 150)
    move(300, 180)
    move(300, 210)
    h.result.current.pointerLeft({
      clientX: 300,
      clientY: 230,
      pointerType: 'mouse',
    })
    expect(h.onMiss).toHaveBeenCalledTimes(1)
    expect(h.onMiss.mock.calls[0]![0].anchor).toBe('bottom')
    move(300, 225)
    move(300, 215)
    move(300, 205)
    expect(h.onHit).toHaveBeenCalledTimes(1)
    expect(h.onMiss).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(300)
    expect(h.onClose).not.toHaveBeenCalled()
  })

  it('reevaluate skips the layout-induced rule', () => {
    let rect: DOMRect = content
    const h = setup({ anchorMode: 'pointer', getContentRect: () => rect })
    move(300, 120)
    move(300, 150)
    move(300, 190)
    rect = createRect({ top: 40, left: 240, width: 180, height: 100 })
    h.result.current.pointerLeft({
      clientX: 300,
      clientY: 190,
      pointerType: 'mouse',
      source: 'reevaluate',
    })
    expect(h.onMiss).toHaveBeenCalledTimes(1)
    expect(h.onClose).toHaveBeenCalledTimes(1)
  })

  it('debug state tracks hit, miss, hover, and reset', () => {
    const settings = {
      ...defaultPopupMenuSafeTriangleAreaDebugSettings,
      enabled: true,
      showMissState: true,
      missFreezeDuration: 100,
    }
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PopupMenuDebugContext.Provider
        value={{ showSafeTriangleArea: settings, logAimGuardEvents: false }}
      >
        {children}
      </PopupMenuDebugContext.Provider>
    )
    const h = setup({}, wrapper)
    hitPath()
    h.result.current.pointerLeft({
      clientX: 190,
      clientY: 94,
      pointerType: 'mouse',
    })
    expect(h.result.current.debug.state).toBe('activated')
    expect(h.result.current.debug.snapshot).not.toBeNull()
    h.result.current.debug.reset()
    expect(h.result.current.debug.state).toBe('hidden')
    missPath()
    h.result.current.pointerLeft({
      clientX: 130,
      clientY: 260,
      pointerType: 'mouse',
    })
    expect(h.result.current.debug.state).toBe('missed')
    vi.advanceTimersByTime(100)
    expect(h.result.current.debug.state).toBe('hidden')
    h.result.current.debug.markHover()
    expect(h.result.current.debug.state).toBe('hover')
    h.result.current.debug.reset()
    expect(h.result.current.debug.state).toBe('hidden')
  })

  it('debug disabled stays hidden through HIT and MISS', () => {
    const h = setup()
    hitPath()
    h.result.current.pointerLeft({
      clientX: 190,
      clientY: 94,
      pointerType: 'mouse',
    })
    expect(h.result.current.debug.state).toBe('hidden')
    expect(h.result.current.debug.snapshot).toBeNull()

    missPath()
    h.result.current.pointerLeft({
      clientX: 130,
      clientY: 260,
      pointerType: 'mouse',
    })
    expect(h.result.current.debug.state).toBe('hidden')
    expect(h.result.current.debug.snapshot).toBeNull()
  })
})
