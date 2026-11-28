import { describe, expect, it } from 'vitest'
import { createFakeClock } from '../platform/clock.js'
import {
  AimGuardController,
  type AimGuardDebugSettings,
  type AimGuardTriggerOptions,
} from './aim-guard.js'
import { type Point, SubmenuController } from './submenu.js'

function rect(left: number, top: number, width: number, height: number) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect
}

// The trigger sits at y 60-90 with its submenu to the right (x >= 240).
const TRIGGER = rect(80, 60, 120, 30)
const POPUP = rect(240, 40, 180, 160)

// A stand-in for the window's pointer moves.
function fakePointer() {
  const listeners = new Set<(point: Point, mouseLike: boolean) => void>()
  return {
    listen(onMove: (point: Point, mouseLike: boolean) => void) {
      listeners.add(onMove)
      return () => {
        listeners.delete(onMove)
      }
    },
    get listeners() {
      return listeners.size
    },
    move(x: number, y: number, mouseLike = true) {
      for (const listener of [...listeners]) listener({ x, y }, mouseLike)
    },
  }
}

const DEBUG: AimGuardDebugSettings = {
  enabled: true,
  freezeOnPointerLeave: true,
  persistOnSuccess: false,
  showMissState: true,
  missFreezeDuration: 300,
}

function setup(debug: Partial<AimGuardDebugSettings> = {}) {
  const clock = createFakeClock()
  const pointer = fakePointer()
  const logs: Array<[string, string, Record<string, unknown>]> = []
  const rects = { popup: POPUP as DOMRect | null, trigger: TRIGGER }
  const guard = new AimGuardController({
    pointer,
    clock,
    log: (scope, event, details) => logs.push([scope, event, details()]),
    getDebugSettings: () => ({ ...DEBUG, ...debug }),
  })
  const trigger = (options: Partial<AimGuardTriggerOptions> = {}) =>
    guard.trigger({
      triggerId: 'more',
      depth: 0,
      submenuSurfaceId: 'more-surface',
      getPopupRect: () => rects.popup,
      getTriggerRect: () => rects.trigger,
      logDetails: () => ({ triggerStoreId: 'more-store' }),
      ...options,
    })
  const events = (scope: 'tree' | 'trigger') =>
    logs.filter(([s]) => s === scope).map(([, event]) => event)
  return { clock, pointer, logs, rects, guard, trigger, events }
}

/** Hovers the trigger, moving right toward the popup, and leaves it. */
function leaveToward(t: ReturnType<typeof setup>, aim = t.trigger()) {
  aim.holdTrail('hover')
  t.pointer.move(120, 90)
  t.pointer.move(150, 92)
  t.pointer.move(180, 94)
  const result = aim.leave({ x: 190, y: 94 })
  return { aim, result }
}

/** Hovers the trigger, moving down and left, away from the popup. */
function leaveAway(t: ReturnType<typeof setup>, aim = t.trigger()) {
  aim.holdTrail('hover')
  t.pointer.move(180, 220)
  t.pointer.move(160, 230)
  t.pointer.move(140, 240)
  const result = aim.leave({ x: 130, y: 260 })
  return { aim, result }
}

describe('AimGuardController guard', () => {
  it('blocks the other triggers of its depth only, while held', () => {
    const t = setup()
    const more = t.trigger({ depth: 1 })
    const sibling = t.trigger({ triggerId: 'sibling', depth: 1 })
    const nested = t.trigger({ triggerId: 'nested', depth: 2 })
    more.hold(600)
    expect(t.guard.getSnapshot()).toEqual({
      active: true,
      triggerId: 'more',
      depth: 1,
      submenuSurfaceId: 'more-surface',
    })
    expect(sibling.isBlocked()).toBe(true)
    expect(more.isBlocked()).toBe(false)
    expect(nested.isBlocked()).toBe(false)
  })

  it('times out by itself', () => {
    const t = setup()
    t.trigger().hold(600)
    t.clock.advance(599)
    expect(t.guard.getSnapshot().active).toBe(true)
    t.clock.advance(1)
    expect(t.guard.getSnapshot().active).toBe(false)
    expect(t.events('tree')).toEqual(['activate', 'timeout-expired'])
  })

  it('restarts its timeout when held again', () => {
    const t = setup()
    const aim = t.trigger()
    aim.hold(600)
    t.clock.advance(400)
    aim.hold(600)
    t.clock.advance(400)
    expect(t.guard.getSnapshot().active).toBe(true)
    t.clock.advance(200)
    expect(t.guard.getSnapshot().active).toBe(false)
  })

  it('releases for anyone, or only for its own trigger and depth', () => {
    const t = setup()
    const more = t.trigger()
    const other = t.trigger({ triggerId: 'other' })
    const deeper = t.trigger({ depth: 1 })
    more.hold(600)
    other.releaseOwn()
    deeper.releaseOwn()
    expect(t.guard.getSnapshot().active).toBe(true)
    more.releaseOwn()
    expect(t.guard.getSnapshot().active).toBe(false)

    more.hold(600)
    other.release()
    expect(t.guard.getSnapshot().active).toBe(false)
    t.clock.advance(1000)
    expect(t.events('tree')).not.toContain('timeout-expired')
  })

  it('tells subscribers once per change of who holds it', () => {
    const t = setup()
    const more = t.trigger()
    const snapshots: unknown[] = []
    t.guard.subscribe(() => snapshots.push(t.guard.getSnapshot()))
    more.release()
    more.hold(600)
    const held = t.guard.getSnapshot()
    more.hold(600)
    // Held again by the same trigger: the same snapshot, nobody told
    expect(t.guard.getSnapshot()).toBe(held)
    t.trigger({ triggerId: 'other' }).hold(600)
    t.clock.advance(600)
    expect(snapshots).toEqual([
      held,
      expect.objectContaining({ triggerId: 'other' }),
      expect.objectContaining({ active: false }),
    ])
  })

  it('logs each event with the guard as it was', () => {
    const t = setup()
    const aim = t.trigger()
    aim.hold(600)
    aim.release()
    t.guard.dispose()
    expect(
      t.logs.map(([scope, event, details]) => [scope, event, details]),
    ).toEqual([
      [
        'tree',
        'activate',
        {
          aimGuardActive: false,
          guardedTriggerId: null,
          guardedDepth: null,
          guardedSubmenuSurfaceId: null,
          triggerId: 'more',
          depth: 0,
          submenuSurfaceId: 'more-surface',
          timeoutMs: 600,
        },
      ],
      [
        'tree',
        'clear',
        {
          aimGuardActive: true,
          guardedTriggerId: 'more',
          guardedDepth: 0,
          guardedSubmenuSurfaceId: 'more-surface',
        },
      ],
      [
        'tree',
        'provider-unmount-clear',
        {
          aimGuardActive: false,
          guardedTriggerId: null,
          guardedDepth: null,
          guardedSubmenuSurfaceId: null,
        },
      ],
    ])
  })

  it('logs a release even when nobody holds it', () => {
    const t = setup()
    t.trigger().release()
    expect(t.events('tree')).toEqual(['clear'])
  })

  it('stops a pending timeout on dispose', () => {
    const t = setup()
    t.trigger().hold(600)
    t.guard.dispose()
    expect(t.clock.pendingTimers()).toBe(0)
  })

  it('releases its guard, and tells the trigger, when the pointer reaches the guarded popup', () => {
    const t = setup()
    const more = t.trigger()
    const other = t.trigger({
      triggerId: 'other',
      submenuSurfaceId: 'other-surface',
    })
    const heard: string[] = []
    more.onPopupPointer(() => heard.push('more'))
    const stop = other.onPopupPointer(() => heard.push('other'))

    more.hold(600)
    t.guard.pointerInPopup('other-surface')
    expect(t.guard.getSnapshot().active).toBe(true)
    t.guard.pointerInPopup('more-surface')
    expect(t.guard.getSnapshot().active).toBe(false)

    stop()
    t.guard.pointerInPopup('other-surface')
    expect(heard).toEqual(['other', 'more'])
  })
})

describe('AimGuardController pointer trail', () => {
  it('listens to the pointer only while a trail or an exit is held', () => {
    const t = setup()
    const more = t.trigger()
    const other = t.trigger({ triggerId: 'other' })
    expect(t.pointer.listeners).toBe(0)

    more.holdTrail('hover')
    other.holdTrail('hover')
    // One listener records every held trail
    expect(t.pointer.listeners).toBe(1)

    const stop = more.watch(() => {})
    expect(t.pointer.listeners).toBe(2)
    more.releaseTrail('hover')
    other.releaseTrail('hover')
    expect(t.pointer.listeners).toBe(2)
    stop()
    expect(t.pointer.listeners).toBe(0)
  })

  it('reads the heading from its own trail, which starts when it is held', () => {
    const t = setup()
    const aim = t.trigger()
    // Moves before the hold, and from an earlier hold, are not part of it
    t.pointer.move(150, 300)
    aim.holdTrail('hover')
    t.pointer.move(180, 220)
    t.pointer.move(160, 230)
    t.pointer.move(140, 240)
    aim.releaseTrail('hover')
    t.pointer.move(150, 300)
    expect(leaveToward(t, aim).result).toEqual({
      type: 'outside',
      hit: true,
      movedAway: false,
    })
  })

  it('keeps the last four points only', () => {
    const t = setup()
    const aim = t.trigger()
    aim.holdTrail('hover')
    // A jump up from far below, then four small steps toward the popup: a
    // fifth point would take the jump into the heading
    t.pointer.move(100, 300)
    for (const x of [180, 181, 182, 183]) t.pointer.move(x, 94)
    expect(aim.leave({ x: 190, y: 94 })).toMatchObject({ hit: true })
  })

  it('records moves of every pointer type, but tracks mouse-like moves only', () => {
    const t = setup()
    const aim = t.trigger()
    aim.holdTrail('hover')
    t.pointer.move(120, 90, false)
    t.pointer.move(150, 92, false)
    t.pointer.move(180, 94, false)
    expect(aim.leave({ x: 190, y: 94 })).toMatchObject({ hit: true })

    const moves: Point[] = []
    const stop = aim.watch((point) => moves.push(point))
    t.pointer.move(200, 94, false)
    t.pointer.move(210, 94)
    stop()
    expect(moves).toEqual([{ x: 210, y: 94 }])
  })

  it('stops recording when disposed, and records again afterwards', () => {
    const t = setup()
    const aim = t.trigger()
    aim.holdTrail('hover')
    aim.dispose()
    expect(t.pointer.listeners).toBe(0)
    expect(leaveToward(t, aim).result).toMatchObject({ hit: true })
  })
})

describe('AimGuardTrigger geometry', () => {
  it('reads a pointer leaving toward the popup as a hit', () => {
    const t = setup()
    expect(leaveToward(t).result).toEqual({
      type: 'outside',
      hit: true,
      movedAway: false,
    })
  })

  it('reads a pointer leaving away from the popup as a miss', () => {
    const t = setup()
    expect(leaveAway(t).result).toEqual({
      type: 'outside',
      hit: false,
      movedAway: false,
    })
  })

  it('reads a leave with no popup rect, or into the popup', () => {
    const t = setup()
    const aim = t.trigger()
    expect(aim.leave({ x: 250, y: 90 })).toEqual({ type: 'inside' })
    t.rects.popup = null
    expect(aim.leave({ x: 190, y: 94 })).toEqual({ type: 'no-popup' })
  })

  it('aims at nothing when the pointer never moved over the trigger', () => {
    const t = setup()
    const aim = t.trigger()
    aim.holdTrail('hover')
    expect(aim.leave({ x: 190, y: 94 })).toMatchObject({ hit: false })
  })

  it('takes a one-sample pass from its sample and the leave point', () => {
    const t = setup()
    const aim = t.trigger()
    aim.holdTrail('hover')
    t.pointer.move(122, 75)
    // Straight down, out of the trigger: not toward the popup
    expect(aim.leave({ x: 122, y: 91 })).toMatchObject({ hit: false })
  })

  it('tracks the exit: inside the popup, moving back, or still heading for it', () => {
    const t = setup()
    const { aim } = leaveToward(t)
    t.pointer.move(200, 94)
    expect(aim.track({ x: 200, y: 94 })).toEqual({
      type: 'outside',
      hit: true,
      movedAway: false,
    })
    expect(aim.track({ x: 190, y: 94 })).toMatchObject({ movedAway: true })
    expect(aim.track({ x: 250, y: 94 })).toEqual({ type: 'inside' })
  })

  it('tracks nothing before a leave, or once the popup has no rect', () => {
    const t = setup()
    const aim = t.trigger()
    expect(aim.track({ x: 200, y: 94 })).toEqual({ type: 'no-popup' })
    leaveToward(t, aim)
    t.rects.popup = null
    expect(aim.track({ x: 200, y: 94 })).toEqual({ type: 'no-popup' })
  })

  it('holds and releases the tree guard for its own trigger and depth', () => {
    const t = setup()
    const aim = t.trigger({ depth: 2 })
    const other = t.trigger({ triggerId: 'other', depth: 2 })
    aim.hold(600)
    expect(t.guard.getSnapshot()).toMatchObject({
      triggerId: 'more',
      depth: 2,
      submenuSurfaceId: 'more-surface',
    })
    expect(other.isBlocked()).toBe(true)
    expect(aim.isBlocked()).toBe(false)
    other.releaseOwn()
    expect(t.guard.getSnapshot().active).toBe(true)
    aim.releaseOwn()
    expect(t.guard.getSnapshot().active).toBe(false)
    aim.hold(600)
    other.release()
    expect(t.guard.getSnapshot().active).toBe(false)
  })

  it('reads a configured id and depth', () => {
    const t = setup()
    const aim = t.trigger()
    aim.configure({
      triggerId: 'renamed',
      depth: 3,
      submenuSurfaceId: 'more-surface',
      getPopupRect: () => POPUP,
      getTriggerRect: () => TRIGGER,
    })
    aim.hold(600)
    expect(t.guard.getSnapshot()).toMatchObject({
      triggerId: 'renamed',
      depth: 3,
    })
  })

  it('logs its reading of the pointer, with the decision it led to', () => {
    const t = setup()
    const { aim } = leaveToward(t)
    aim.show('hit')
    const logged = t.logs.filter(([scope]) => scope === 'trigger')
    expect(logged.map(([, event]) => event)).toEqual([
      'pointerleave-submenu-trigger',
      'pointerleave-hit-eval',
      'pointerleave-hit-activate-guard',
    ])
    expect(logged[0]![2]).toEqual({
      triggerId: 'more',
      triggerStoreId: 'more-store',
      parentDepth: 0,
      aimGuardActive: false,
      guardedTriggerId: null,
      guardedDepth: null,
      clientX: 190,
      clientY: 94,
    })

    const away = setup()
    leaveAway(away).aim.show('miss')
    expect(away.events('trigger')).toContain('pointerleave-miss-close')
  })

  it('logs decisions on tracked moves by what they read', () => {
    const t = setup()
    const { aim } = leaveToward(t)
    aim.track({ x: 180, y: 94 })
    aim.show('miss')
    aim.track({ x: 200, y: 94 })
    aim.show('hit')
    aim.track({ x: 202, y: 300 })
    aim.show('miss')
    expect(
      t
        .events('trigger')
        .filter(
          (event) => event.includes('-transition') || event.endsWith('-close'),
        ),
    ).toEqual([
      'leave-monitor-reversal-close',
      'leave-monitor-hit-transition',
      'leave-monitor-miss-transition',
    ])
  })
})

describe('AimGuardTrigger debug overlay', () => {
  const listen = (aim: ReturnType<ReturnType<typeof setup>['trigger']>) => {
    let changes = 0
    const stop = aim.subscribeDebug(() => changes++)
    return { stop, changes: () => changes }
  }

  it('works out nothing while nothing listens', () => {
    const t = setup()
    const { aim } = leaveToward(t)
    aim.show('hit')
    expect(aim.getDebugSnapshot()).toBe(null)
  })

  it('shows nothing while the overlay is off', () => {
    const t = setup({ enabled: false })
    const { aim } = leaveToward(t)
    listen(aim)
    aim.show('hover')
    aim.show('hit')
    expect(aim.getDebugSnapshot()).toBe(null)
  })

  it('shows a hovered trigger on the live rects', () => {
    const t = setup()
    const aim = t.trigger()
    const listener = listen(aim)
    aim.show('hover')
    expect(aim.getDebugSnapshot()).toEqual({ tone: 'hover', frozen: null })
    expect(listener.changes()).toBe(1)
  })

  it('freezes an activated triangle on the reading it left with', () => {
    const t = setup()
    const aim = t.trigger()
    listen(aim)
    leaveToward(t, aim)
    aim.hold(600)
    aim.show('hit')
    expect(aim.getDebugSnapshot()).toEqual({
      tone: 'activated',
      frozen: {
        popupRect: POPUP,
        triggerRect: TRIGGER,
        point: { x: 190, y: 94 },
      },
    })

    const live = setup({ freezeOnPointerLeave: false })
    const liveAim = live.trigger()
    listen(liveAim)
    leaveToward(live, liveAim)
    liveAim.hold(600)
    liveAim.show('hit')
    expect(liveAim.getDebugSnapshot()).toEqual({
      tone: 'activated',
      frozen: null,
    })
  })

  it('shows a miss for its freeze duration', () => {
    const t = setup()
    const aim = t.trigger()
    listen(aim)
    leaveAway(t, aim)
    aim.show('miss')
    expect(aim.getDebugSnapshot()?.tone).toBe('missed')
    t.clock.advance(299)
    expect(aim.getDebugSnapshot()?.tone).toBe('missed')
    t.clock.advance(1)
    expect(aim.getDebugSnapshot()).toBe(null)
  })

  it('hides a miss at once with no freeze duration or no miss state', () => {
    for (const debug of [{ missFreezeDuration: 0 }, { showMissState: false }]) {
      const t = setup(debug)
      const aim = t.trigger()
      listen(aim)
      aim.show('hover')
      leaveAway(t, aim)
      aim.show('miss')
      expect(aim.getDebugSnapshot()).toBe(null)
    }
  })

  it('hides on a decision of none, or a leave with no popup', () => {
    const t = setup()
    const aim = t.trigger()
    listen(aim)
    aim.show('hover')
    aim.show('none')
    expect(aim.getDebugSnapshot()).toBe(null)
    aim.show('hover')
    t.rects.popup = null
    aim.leave({ x: 190, y: 94 })
    aim.show('hit')
    expect(aim.getDebugSnapshot()).toBe(null)
  })

  it('hides an activated triangle once the guard is not this trigger’s', () => {
    const t = setup()
    const aim = t.trigger()
    listen(aim)
    leaveToward(t, aim)
    aim.hold(600)
    aim.show('hit')
    expect(aim.getDebugSnapshot()?.tone).toBe('activated')
    t.clock.advance(600)
    expect(aim.getDebugSnapshot()).toBe(null)
  })

  it('keeps an activated triangle after the guard with persistOnSuccess', () => {
    const t = setup({ persistOnSuccess: true })
    const aim = t.trigger()
    listen(aim)
    leaveToward(t, aim)
    aim.hold(600)
    aim.show('hit')
    t.clock.advance(600)
    expect(aim.getDebugSnapshot()?.tone).toBe('activated')
  })

  it('hides a hit shown with no guard held, unless it persists on success', () => {
    for (const [persistOnSuccess, shown] of [
      [false, null],
      [true, 'activated'],
    ] as const) {
      const t = setup({ persistOnSuccess })
      const aim = t.trigger()
      listen(aim)
      // The pointer left into the popup: the guard released, then the hit
      leaveToward(t, aim)
      aim.release()
      aim.show('hit')
      expect(aim.getDebugSnapshot()?.tone ?? null).toBe(shown)
    }
  })

  it('hides an activated triangle when its submenu closes', () => {
    const t = setup({ persistOnSuccess: true })
    const aim = t.trigger()
    listen(aim)
    leaveToward(t, aim)
    aim.show('hit')
    aim.releaseOwn()
    expect(aim.getDebugSnapshot()).toBe(null)
  })

  it('hides, and stops watching the guard, when the last listener leaves', () => {
    const t = setup()
    const aim = t.trigger()
    const first = listen(aim)
    const second = listen(aim)
    aim.show('hover')
    first.stop()
    expect(aim.getDebugSnapshot()?.tone).toBe('hover')
    second.stop()
    expect(aim.getDebugSnapshot()).toBe(null)

    // No listener: a later hit while the guard is released stays unworked
    leaveToward(t, aim)
    aim.show('hit')
    aim.release()
    expect(aim.getDebugSnapshot()).toBe(null)
  })
})

describe('AimGuardTrigger under a SubmenuController', () => {
  it('shows no activated triangle for a hit whose open the submenu refuses', () => {
    const t = setup({ persistOnSuccess: true })
    const aim = t.trigger()
    aim.subscribeDebug(() => {})
    const changes: boolean[] = []
    const controller = new SubmenuController({
      clock: t.clock,
      aimGuard: aim,
      settings: {
        delay: { pointer: 0, keyboard: 150 },
        closeDelay: 0,
        closeOnPointerLeave: true,
        openOnHighlight: true,
      },
      // A disabled submenu, or a consumer canceling the open: it stays closed
      onOpenChange: (open) => {
        changes.push(open)
        return 'canceled'
      },
      isOpenPending: () => false,
      onFocus: () => {},
      onHighlight: () => {},
    })

    aim.holdTrail('hover')
    t.pointer.move(120, 90)
    t.pointer.move(150, 92)
    t.pointer.move(180, 94)
    controller.send({ type: 'pointer.leave', point: { x: 190, y: 94 } })

    expect(changes).toEqual([true])
    expect(controller.getSnapshot().state).toBe('idle')
    expect(t.guard.getSnapshot().active).toBe(false)
    expect(aim.getDebugSnapshot()).toBe(null)
  })
})
