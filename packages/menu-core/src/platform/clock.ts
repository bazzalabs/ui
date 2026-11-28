/** A timer or frame handle a `Clock` returns. Opaque to its callers. */
export type ClockHandle = unknown

/**
 * Time, as a controller reads it. Controllers never call `setTimeout` or
 * `requestAnimationFrame` themselves: they take a clock, so tests can run
 * them on a fake one.
 */
export interface Clock {
  /** Milliseconds, from any fixed origin. */
  now(): number
  setTimeout(callback: () => void, ms: number): ClockHandle
  clearTimeout(handle: ClockHandle): void
  requestFrame(callback: () => void): ClockHandle
  cancelFrame(handle: ClockHandle): void
}

/** The platform's clock: `performance.now`, timers and animation frames. */
export const realClock: Clock = {
  now: () => performance.now(),
  setTimeout: (callback, ms) => setTimeout(callback, ms),
  clearTimeout: (handle) =>
    clearTimeout(handle as ReturnType<typeof setTimeout>),
  requestFrame: (callback) => requestAnimationFrame(() => callback()),
  cancelFrame: (handle) => cancelAnimationFrame(handle as number),
}

/** A clock that moves only when told to. */
export interface FakeClock extends Clock {
  /**
   * Moves time forward by `ms`, running each timer that falls due, in due
   * order, at its due time. A timer a callback sets runs too if it falls
   * due within the same advance.
   */
  advance(ms: number): void
  /** Runs the frames requested so far; frames they request wait. */
  flushFrames(): void
  /** How many timers are waiting. */
  pendingTimers(): number
}

interface FakeTimer {
  readonly id: number
  readonly due: number
  readonly callback: () => void
}

/** A clock for tests, starting at 0. */
export function createFakeClock(): FakeClock {
  let now = 0
  let nextId = 1
  const timers = new Map<number, FakeTimer>()
  const frames = new Map<number, () => void>()

  const nextDue = (until: number): FakeTimer | undefined => {
    let next: FakeTimer | undefined
    for (const timer of timers.values()) {
      if (timer.due > until) continue
      if (!next || timer.due < next.due) next = timer
    }
    return next
  }

  return {
    now: () => now,
    setTimeout(callback, ms) {
      const id = nextId++
      timers.set(id, { id, due: now + Math.max(0, ms), callback })
      return id
    },
    clearTimeout(handle) {
      timers.delete(handle as number)
    },
    requestFrame(callback) {
      const id = nextId++
      frames.set(id, callback)
      return id
    },
    cancelFrame(handle) {
      frames.delete(handle as number)
    },
    advance(ms) {
      const until = now + ms
      for (let timer = nextDue(until); timer; timer = nextDue(until)) {
        timers.delete(timer.id)
        now = timer.due
        timer.callback()
      }
      now = until
    },
    flushFrames() {
      const due = [...frames]
      frames.clear()
      for (const [, callback] of due) callback()
    },
    pendingTimers: () => timers.size,
  }
}
