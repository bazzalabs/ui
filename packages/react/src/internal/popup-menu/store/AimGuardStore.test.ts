import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  type AimGuard,
  AimGuardStore,
  DEFAULT_AIM_GUARD_TTL_MS,
} from './AimGuardStore.js'

const guard: AimGuard = {
  triggerId: 'trigger-1',
  depth: 1,
  submenuSurfaceId: 'surface-1',
}

describe('AimGuardStore', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts empty and activates a guard', () => {
    vi.useFakeTimers()
    const store = new AimGuardStore()

    expect(store.get()).toBeNull()
    store.activate(guard)
    expect(store.get()).toEqual(guard)
  })

  it('auto-clears after the default ttl', () => {
    vi.useFakeTimers()
    const store = new AimGuardStore()
    store.activate(guard)

    vi.advanceTimersByTime(DEFAULT_AIM_GUARD_TTL_MS - 1)
    expect(store.get()).toEqual(guard)
    vi.advanceTimersByTime(1)
    expect(store.get()).toBeNull()
  })

  it('respects a custom ttl', () => {
    vi.useFakeTimers()
    const store = new AimGuardStore()
    store.activate(guard, 1000)

    vi.advanceTimersByTime(999)
    expect(store.get()).toEqual(guard)
    vi.advanceTimersByTime(1)
    expect(store.get()).toBeNull()
  })

  it('replaces the guard and restarts its timer', () => {
    vi.useFakeTimers()
    const store = new AimGuardStore()
    const replacement = { ...guard, triggerId: 'trigger-2' }
    store.activate(guard, 100)
    vi.advanceTimersByTime(75)
    store.activate(replacement, 100)

    expect(store.get()).toEqual(replacement)
    vi.advanceTimersByTime(75)
    expect(store.get()).toEqual(replacement)
    vi.advanceTimersByTime(25)
    expect(store.get()).toBeNull()
  })

  it('clear cancels the timer and logs even when idle', () => {
    vi.useFakeTimers()
    const events: string[] = []
    const store = new AimGuardStore({ log: (event) => events.push(event) })
    store.clear()
    expect(events).toEqual(['clear'])

    store.activate(guard, 100)
    store.clear()
    vi.advanceTimersByTime(100)
    expect(store.get()).toBeNull()
    expect(events).toEqual(['clear', 'activate', 'clear'])
  })

  it('dispose clears the guard', () => {
    vi.useFakeTimers()
    const store = new AimGuardStore()
    store.activate(guard)
    store.dispose()
    expect(store.get()).toBeNull()
    vi.advanceTimersByTime(DEFAULT_AIM_GUARD_TTL_MS)
    expect(store.get()).toBeNull()
  })

  it('logs lifecycle events with guard details', () => {
    vi.useFakeTimers()
    const logs: Array<[string, Record<string, unknown> | undefined]> = []
    const store = new AimGuardStore({
      log: (event, details) => logs.push([event, details]),
    })

    store.activate(guard, 25)
    // Base fields reflect the state *before* activation (idle here).
    expect(logs[0]).toEqual([
      'activate',
      {
        aimGuardActive: false,
        guardedTriggerId: null,
        guardedDepth: null,
        guardedSubmenuSurfaceId: null,
        triggerId: guard.triggerId,
        depth: guard.depth,
        submenuSurfaceId: guard.submenuSurfaceId,
        timeoutMs: 25,
      },
    ])
    store.clear()
    expect(logs[1]).toEqual([
      'clear',
      {
        aimGuardActive: true,
        guardedTriggerId: guard.triggerId,
        guardedDepth: guard.depth,
        guardedSubmenuSurfaceId: guard.submenuSurfaceId,
      },
    ])

    store.activate(guard, 25)
    vi.advanceTimersByTime(25)
    expect(logs[3]).toEqual([
      'timeout-expired',
      {
        aimGuardActive: true,
        guardedTriggerId: guard.triggerId,
        guardedDepth: guard.depth,
        guardedSubmenuSurfaceId: guard.submenuSurfaceId,
        triggerId: guard.triggerId,
        depth: guard.depth,
        submenuSurfaceId: guard.submenuSurfaceId,
      },
    ])
  })

  it('notifies subscribers and supports unsubscribe', () => {
    vi.useFakeTimers()
    const store = new AimGuardStore()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    store.activate(guard)
    store.clear()
    store.activate(guard)
    vi.advanceTimersByTime(DEFAULT_AIM_GUARD_TTL_MS)
    expect(listener).toHaveBeenCalledTimes(4)
    expect(listener).toHaveBeenNthCalledWith(1, guard)
    expect(listener).toHaveBeenNthCalledWith(2, null)
    expect(listener).toHaveBeenNthCalledWith(3, guard)
    expect(listener).toHaveBeenNthCalledWith(4, null)

    unsubscribe()
    store.activate(guard)
    expect(listener).toHaveBeenCalledTimes(4)
  })
})
