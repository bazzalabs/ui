import { describe, expect, it } from 'vitest'
import { createFakeClock } from './clock.js'

describe('createFakeClock', () => {
  it('runs timers in due order, each at its due time', () => {
    const clock = createFakeClock()
    const ran: Array<[string, number]> = []
    clock.setTimeout(() => ran.push(['b', clock.now()]), 20)
    clock.setTimeout(() => ran.push(['a', clock.now()]), 10)
    clock.advance(15)
    expect(ran).toEqual([['a', 10]])
    clock.advance(5)
    expect(ran).toEqual([
      ['a', 10],
      ['b', 20],
    ])
    expect(clock.now()).toBe(20)
  })

  it('runs a timer a callback sets when it falls due in the same advance', () => {
    const clock = createFakeClock()
    const ran: number[] = []
    clock.setTimeout(() => {
      clock.setTimeout(() => ran.push(clock.now()), 10)
    }, 10)
    clock.advance(25)
    expect(ran).toEqual([20])
  })

  it('skips cleared timers and cancelled frames', () => {
    const clock = createFakeClock()
    const ran: string[] = []
    const timer = clock.setTimeout(() => ran.push('timer'), 10)
    const frame = clock.requestFrame(() => ran.push('frame'))
    clock.requestFrame(() => ran.push('kept'))
    clock.clearTimeout(timer)
    clock.cancelFrame(frame)
    clock.advance(100)
    clock.flushFrames()
    expect(ran).toEqual(['kept'])
    expect(clock.pendingTimers()).toBe(0)
  })
})
