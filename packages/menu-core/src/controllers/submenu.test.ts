import { describe, expect, it } from 'vitest'
import { createFakeClock } from '../platform/clock.js'
import {
  type Point,
  type SubmenuAim,
  type SubmenuAimDecision,
  SubmenuController,
  type SubmenuSettings,
} from './submenu.js'

const POINT: Point = { x: 10, y: 10 }

const HIT: SubmenuAim = { type: 'outside', hit: true, movedAway: false }
const MISS: SubmenuAim = { type: 'outside', hit: false, movedAway: false }
const AWAY: SubmenuAim = { type: 'outside', hit: true, movedAway: true }
const AWAY_MISS: SubmenuAim = { type: 'outside', hit: false, movedAway: true }
const INSIDE: SubmenuAim = { type: 'inside' }
const NO_POPUP: SubmenuAim = { type: 'no-popup' }

// A stand-in for the tree's aim guard: the test sets what the geometry
// reads, and the guard records what the controller does with it.
function fakeAimGuard() {
  const guard = {
    blocked: false,
    aim: MISS as SubmenuAim,
    /** The guard's hold, by its timeout; null while nobody holds it. */
    held: null as number | null,
    releases: 0,
    ownReleases: 0,
    shown: [] as SubmenuAimDecision[],
    /** Holds, releases and shows, in order. */
    calls: [] as string[],
    onMove: null as ((point: Point) => void) | null,
    isBlocked: () => guard.blocked,
    leave: () => guard.aim,
    track: () => guard.aim,
    watch: (onMove: (point: Point) => void) => {
      guard.onMove = onMove
      return () => {
        guard.onMove = null
      }
    },
    hold: (ms: number) => {
      guard.calls.push('hold')
      guard.held = ms
    },
    release: () => {
      guard.calls.push('release')
      guard.releases++
      guard.held = null
    },
    releaseOwn: () => {
      guard.ownReleases++
      guard.held = null
    },
    show: (decision: SubmenuAimDecision) => {
      guard.calls.push(`show:${decision}`)
      guard.shown.push(decision)
    },
    /** Whether the controller is tracking the pointer's exit. */
    get tracking() {
      return guard.onMove !== null
    },
    /** A pointer move while the controller tracks an exit. */
    move(aim: SubmenuAim) {
      guard.aim = aim
      if (!guard.onMove) throw new Error('not tracking')
      guard.onMove(POINT)
    },
  }
  return guard
}

function setup(settings: Partial<SubmenuSettings> = {}) {
  const clock = createFakeClock()
  const aimGuard = fakeAimGuard()
  const changes: Array<[boolean, string]> = []
  // The submenu's store: it refuses (cancels) a change, or a consumer
  // controls `open` and applies it later (`apply()`); otherwise it applies
  // it and reports it at once, as the binding's store observer does
  // A controlled request is the store's pending one until the prop applies
  // it or another request replaces it (`pending`: an open is pending)
  const submenu = {
    open: false,
    refuses: false,
    controlled: false,
    pending: false,
  }
  let highlights = 0
  let notifications = 0
  let focuses = 0
  const controller: SubmenuController = new SubmenuController({
    clock,
    aimGuard,
    settings: {
      delay: { pointer: 0, keyboard: 150 },
      closeDelay: 0,
      closeOnPointerLeave: true,
      openOnHighlight: true,
      ...settings,
    },
    onOpenChange: (open, reason) => {
      changes.push([open, reason])
      if (submenu.refuses) return 'canceled'
      if (submenu.controlled) {
        submenu.pending = open && !submenu.open
        return 'controlled'
      }
      if (submenu.open === open) return 'noop'
      submenu.open = open
      controller.send({ type: 'open.change', open })
      return 'applied'
    },
    isOpenPending: () => submenu.pending,
    onFocus: () => {
      focuses++
    },
    onHighlight: () => {
      highlights++
    },
  })
  // What the published `suppressAutoOpenRef` does: reads the controller's
  // suppression; setting it is an explicit close, clearing it clears it
  const suppressAutoOpen = {
    get current() {
      return controller.getSnapshot().suppressed
    },
    set current(value: boolean) {
      controller.send({
        type: value ? 'close.explicit' : 'suppression.clear',
      })
    },
  }
  controller.subscribe(() => {
    notifications++
  })
  return {
    clock,
    aimGuard,
    suppressAutoOpen,
    changes,
    submenu,
    controller,
    // The interaction state, read as before the store owned `open`: idle
    // with the submenu open reads `open`
    state: () => {
      const { state } = controller.getSnapshot()
      return state === 'idle' && submenu.open ? 'open' : state
    },
    /** A consumer controlling `open` applies `open` (its prop follows). */
    apply(open: boolean) {
      submenu.open = open
      submenu.pending = false
      controller.send({ type: 'open.change', open })
    },
    /**
     * A request the controller didn't make takes the pending open back (a
     * key, the parent closing it), and the prop doesn't change.
     */
    takeBack() {
      submenu.pending = false
    },
    focuses: () => focuses,
    highlights: () => highlights,
    notifications: () => notifications,
    leave(aim: SubmenuAim) {
      aimGuard.aim = aim
      controller.send({ type: 'pointer.leave', point: POINT })
    },
  }
}

/** Opened by the pointer with no delay, as a hover opens it by default. */
function openSetup(settings: Partial<SubmenuSettings> = {}) {
  const t = setup(settings)
  t.controller.send({ type: 'pointer.enter' })
  expect(t.state()).toBe('open')
  t.changes.length = 0
  t.aimGuard.shown.length = 0
  t.aimGuard.releases = 0
  return t
}

function guardedSetup(settings: Partial<SubmenuSettings> = {}) {
  const t = openSetup(settings)
  t.leave(HIT)
  expect(t.state()).toBe('guarded')
  t.aimGuard.shown.length = 0
  return t
}

function closePendingSetup(closeDelay = 200) {
  const t = openSetup({ closeDelay })
  t.leave(MISS)
  expect(t.state()).toBe('close-pending')
  t.aimGuard.shown.length = 0
  t.aimGuard.releases = 0
  return t
}

describe('SubmenuController from idle', () => {
  it('opens at once on pointer enter with no delay, and takes the highlight', () => {
    const t = setup()
    t.controller.send({ type: 'pointer.enter' })
    expect(t.state()).toBe('open')
    expect(t.changes).toEqual([[true, 'trigger-hover']])
    expect(t.highlights()).toBe(1)
    expect(t.aimGuard.shown).toEqual(['hover'])
    expect(t.aimGuard.releases).toBe(1)
  })

  it('waits out the pointer delay on pointer enter', () => {
    const t = setup({ delay: { pointer: 100, keyboard: 150 } })
    t.controller.send({ type: 'pointer.enter' })
    expect(t.state()).toBe('open-pending')
    t.clock.advance(99)
    expect(t.changes).toEqual([])
    t.clock.advance(1)
    expect(t.state()).toBe('open')
    expect(t.changes).toEqual([[true, 'trigger-hover']])
  })

  it('opens on pointer move over the trigger', () => {
    const t = setup()
    t.controller.send({ type: 'pointer.move' })
    expect(t.state()).toBe('open')
    expect(t.changes).toEqual([[true, 'trigger-hover']])
  })

  it('opens at once on a key, whatever the delays', () => {
    const t = setup({ delay: { pointer: 100, keyboard: 150 } })
    t.controller.send({ type: 'key' })
    expect(t.state()).toBe('open')
    expect(t.changes).toEqual([[true, 'list-navigation']])
  })

  it('opens after the keyboard delay when a key highlights the trigger', () => {
    const t = setup()
    t.controller.send({ type: 'highlight', highlighted: true, keyboard: true })
    expect(t.state()).toBe('open-pending')
    t.clock.advance(150)
    expect(t.state()).toBe('open')
    expect(t.changes).toEqual([[true, 'list-navigation']])
  })

  it('opens at once on a keyboard highlight with no keyboard delay', () => {
    const t = setup({ delay: { pointer: 0, keyboard: 0 } })
    t.controller.send({ type: 'highlight', highlighted: true, keyboard: true })
    expect(t.state()).toBe('open')
  })

  it('does not open on a highlight that no key made', () => {
    const t = setup()
    t.controller.send({ type: 'highlight', highlighted: true, keyboard: false })
    t.clock.advance(1000)
    expect(t.state()).toBe('idle')
    expect(t.changes).toEqual([])
  })

  it('follows an open the binding reports, without deciding one', () => {
    const t = setup()
    t.apply(true)
    expect(t.state()).toBe('open')
    expect(t.changes).toEqual([])
  })

  it('ignores the pointer while another trigger holds the guard', () => {
    const t = setup()
    t.aimGuard.blocked = true
    t.controller.send({ type: 'pointer.enter' })
    t.controller.send({ type: 'pointer.move' })
    expect(t.state()).toBe('idle')
    expect(t.highlights()).toBe(0)
    expect(t.aimGuard.shown).toEqual([])
  })

  it('highlights but does not open while an explicit close suppresses it', () => {
    const t = setup()
    t.suppressAutoOpen.current = true
    t.controller.send({ type: 'pointer.enter' })
    t.controller.send({ type: 'pointer.move' })
    t.controller.send({ type: 'highlight', highlighted: true, keyboard: true })
    t.clock.advance(1000)
    expect(t.state()).toBe('idle')
    expect(t.highlights()).toBe(2)
  })

  it('clears the suppression when the trigger loses the highlight', () => {
    const t = setup()
    t.suppressAutoOpen.current = true
    t.controller.send({
      type: 'highlight',
      highlighted: false,
      keyboard: false,
    })
    expect(t.suppressAutoOpen.current).toBe(false)
    t.controller.send({ type: 'pointer.enter' })
    expect(t.state()).toBe('open')
  })

  it('only highlights with openOnHighlight off', () => {
    const t = setup({ openOnHighlight: false })
    t.controller.send({ type: 'pointer.enter' })
    t.controller.send({ type: 'pointer.move' })
    t.controller.send({ type: 'highlight', highlighted: true, keyboard: true })
    t.clock.advance(1000)
    expect(t.state()).toBe('idle')
    expect(t.highlights()).toBe(2)
  })

  it('does not suppress on a press while closed', () => {
    const t = setup()
    t.controller.send({ type: 'press' })
    expect(t.suppressAutoOpen.current).toBe(false)
  })

  it('leaves a closed trigger without a close delay to wait out', () => {
    const t = setup({ closeDelay: 200 })
    t.leave(NO_POPUP)
    expect(t.state()).toBe('idle')
    expect(t.clock.pendingTimers()).toBe(0)
    expect(t.aimGuard.shown).toEqual(['none'])
  })

  it('does not track a miss from a closed trigger whose popup still shows', () => {
    const t = setup({ closeDelay: 200 })
    t.leave(MISS)
    expect(t.state()).toBe('idle')
    expect(t.aimGuard.tracking).toBe(false)
    expect(t.clock.pendingTimers()).toBe(0)
  })
})

describe('SubmenuController when the submenu refuses a change', () => {
  it('stays idle when an open is refused', () => {
    const t = setup()
    t.submenu.refuses = true
    t.controller.send({ type: 'pointer.enter' })
    expect(t.state()).toBe('idle')
    expect(t.changes).toEqual([[true, 'trigger-hover']])
  })

  it('does not suppress on a press after a refused open', () => {
    const t = setup()
    t.submenu.refuses = true
    t.controller.send({ type: 'pointer.enter' })
    t.controller.send({ type: 'press' })
    expect(t.suppressAutoOpen.current).toBe(false)
  })

  it('opens on a key once the submenu stops refusing', () => {
    const t = setup()
    t.submenu.refuses = true
    t.controller.send({ type: 'key' })
    expect(t.state()).toBe('idle')
    t.submenu.refuses = false
    t.controller.send({ type: 'key' })
    expect(t.state()).toBe('open')
    expect(t.changes).toEqual([
      [true, 'list-navigation'],
      [true, 'list-navigation'],
    ])
  })

  it('stays idle when the keyboard delay ends in a refused open', () => {
    const t = setup()
    t.controller.send({ type: 'highlight', highlighted: true, keyboard: true })
    t.submenu.refuses = true
    t.clock.advance(150)
    expect(t.state()).toBe('idle')
  })

  it('drops its guard and tracks nothing when a hit cannot open the popup', () => {
    const t = setup()
    t.submenu.refuses = true
    t.leave(HIT)
    expect(t.state()).toBe('idle')
    expect(t.aimGuard.held).toBe(null)
    expect(t.aimGuard.ownReleases).toBe(1)
    expect(t.aimGuard.tracking).toBe(false)
    expect(t.aimGuard.shown).toEqual(['none'])
  })

  it('stays open when a close is refused', () => {
    const t = openSetup()
    t.submenu.refuses = true
    t.leave(MISS)
    expect(t.state()).toBe('open')
    expect(t.changes).toEqual([[false, 'trigger-hover']])
    t.controller.send({ type: 'press' })
    expect(t.suppressAutoOpen.current).toBe(true)
  })

  it('stays open when its close delay ends in a refused close', () => {
    const t = closePendingSetup()
    t.submenu.refuses = true
    t.clock.advance(200)
    expect(t.state()).toBe('open')
  })
})

describe('SubmenuController when a hover is refused', () => {
  it('asks once per hover gesture: a move after a refusal does not ask again', () => {
    const t = setup()
    t.submenu.refuses = true
    t.controller.send({ type: 'pointer.enter' })
    t.controller.send({ type: 'pointer.move' })
    t.controller.send({ type: 'pointer.move' })
    expect(t.changes).toEqual([[true, 'trigger-hover']])
    expect(t.state()).toBe('idle')
    // Still takes the highlight on each move
    expect(t.highlights()).toBe(3)
  })

  it('does not ask again on another enter within the gesture', () => {
    const t = setup()
    t.submenu.refuses = true
    t.controller.send({ type: 'pointer.enter' })
    t.controller.send({ type: 'pointer.enter' })
    expect(t.changes).toEqual([[true, 'trigger-hover']])
    expect(t.highlights()).toBe(2)
  })

  it('asks once per gesture after its pointer delay too', () => {
    const t = setup({ delay: { pointer: 100, keyboard: 150 } })
    t.submenu.refuses = true
    t.controller.send({ type: 'pointer.enter' })
    t.clock.advance(100)
    expect(t.changes).toEqual([[true, 'trigger-hover']])
    t.controller.send({ type: 'pointer.move' })
    expect(t.state()).toBe('idle')
    t.clock.advance(500)
    expect(t.changes).toHaveLength(1)
  })

  it('asks again once the pointer leaves and comes back', () => {
    const t = setup()
    t.submenu.refuses = true
    t.controller.send({ type: 'pointer.enter' })
    t.controller.send({ type: 'pointer.move' })
    t.leave(MISS)
    t.controller.send({ type: 'pointer.enter' })
    expect(t.changes).toEqual([
      [true, 'trigger-hover'],
      [true, 'trigger-hover'],
    ])
  })

  it('asks again once the trigger loses the highlight', () => {
    const t = setup()
    t.submenu.refuses = true
    t.controller.send({ type: 'pointer.enter' })
    t.controller.send({
      type: 'highlight',
      highlighted: false,
      keyboard: false,
    })
    t.controller.send({ type: 'pointer.move' })
    expect(t.changes).toHaveLength(2)
  })

  it('asks again after the trigger hides', () => {
    const t = setup()
    t.submenu.refuses = true
    t.controller.send({ type: 'pointer.enter' })
    t.controller.send({ type: 'hide' })
    t.controller.send({ type: 'pointer.move' })
    expect(t.changes).toHaveLength(2)
  })

  it('opens when a controlled consumer applies the open later, and asks again after it closes', () => {
    const t = setup()
    t.submenu.refuses = true
    t.controller.send({ type: 'pointer.enter' })
    // The consumer's prop follows on its next render
    t.apply(true)
    expect(t.state()).toBe('open')
    t.apply(false)
    expect(t.state()).toBe('idle')
    t.controller.send({ type: 'pointer.move' })
    expect(t.changes).toEqual([
      [true, 'trigger-hover'],
      [true, 'trigger-hover'],
    ])
  })

  it('still opens on a key in the same gesture', () => {
    const t = setup()
    t.submenu.refuses = true
    t.controller.send({ type: 'pointer.enter' })
    t.submenu.refuses = false
    t.controller.send({ type: 'key' })
    expect(t.state()).toBe('open')
    expect(t.changes).toEqual([
      [true, 'trigger-hover'],
      [true, 'list-navigation'],
    ])
  })
})

describe('SubmenuController when a consumer controls open', () => {
  /** A submenu whose consumer controls `open`: it applies with `apply`. */
  const controlled = (settings: Partial<SubmenuSettings> = {}) => {
    const t = setup(settings)
    t.submenu.controlled = true
    return t
  }

  it('asks once per hover gesture, and opens when the prop follows', () => {
    const t = controlled()
    t.controller.send({ type: 'pointer.enter' })
    t.controller.send({ type: 'pointer.move' })
    t.controller.send({ type: 'pointer.move' })
    expect(t.changes).toEqual([[true, 'trigger-hover']])
    expect(t.state()).toBe('idle')
    t.apply(true)
    expect(t.state()).toBe('open')
  })

  it('asks again on the next gesture after the consumer kept it closed', () => {
    const t = controlled({ closeOnPointerLeave: false })
    t.controller.send({ type: 'pointer.enter' })
    t.leave(NO_POPUP)
    t.controller.send({ type: 'pointer.enter' })
    expect(t.changes).toEqual([
      [true, 'trigger-hover'],
      [true, 'trigger-hover'],
    ])
  })

  it('holds the guard and tracks for an aim hit while the open is pending, bounded by the guard timeout', () => {
    const t = controlled({ delay: { pointer: 5000, keyboard: 150 } })
    t.controller.send({ type: 'pointer.enter' })
    t.leave(HIT)
    expect(t.changes).toEqual([[true, 'trigger-hover']])
    expect(t.state()).toBe('guarded')
    expect(t.aimGuard.held).toBe(600)
    expect(t.aimGuard.tracking).toBe(true)
    // The prop follows on the consumer's next render: the guard survives
    t.apply(true)
    expect(t.state()).toBe('guarded')
    expect(t.aimGuard.tracking).toBe(true)
    t.clock.advance(600)
    expect(t.state()).toBe('open')
    expect(t.aimGuard.tracking).toBe(false)
  })

  it('ends the guard of a pending open that never applies at the guard timeout', () => {
    const t = controlled({ delay: { pointer: 5000, keyboard: 150 } })
    t.controller.send({ type: 'pointer.enter' })
    t.leave(HIT)
    t.clock.advance(600)
    expect(t.state()).toBe('idle')
    expect(t.aimGuard.tracking).toBe(false)
  })

  it('holds the guard for an aim hit an uncontrolled submenu applies', () => {
    const t = setup({ delay: { pointer: 5000, keyboard: 150 } })
    t.controller.send({ type: 'pointer.enter' })
    t.leave(HIT)
    expect(t.state()).toBe('guarded')
    expect(t.aimGuard.held).toBe(600)
  })

  it('holds nothing for an aim hit the consumer cancels', () => {
    const t = setup({ delay: { pointer: 5000, keyboard: 150 } })
    t.submenu.refuses = true
    t.controller.send({ type: 'pointer.enter' })
    t.leave(HIT)
    expect(t.state()).toBe('idle')
    expect(t.aimGuard.held).toBe(null)
    expect(t.aimGuard.tracking).toBe(false)
  })

  it('tells the consumer of a reversal before the prop arrives', () => {
    const t = controlled()
    t.controller.send({ type: 'pointer.enter' })
    // The pointer leaves without aiming at the popup, before the prop
    t.leave(MISS)
    expect(t.changes).toEqual([
      [true, 'trigger-hover'],
      [false, 'trigger-hover'],
    ])
    expect(t.state()).toBe('idle')
    // Nothing is pending any more: the next gesture asks again
    t.controller.send({ type: 'pointer.enter' })
    expect(t.changes).toHaveLength(3)
    expect(t.changes[2]).toEqual([true, 'trigger-hover'])
  })

  it('tells the consumer of a reversal a missed aim makes while guarding a pending open', () => {
    const t = controlled({ delay: { pointer: 5000, keyboard: 150 } })
    t.controller.send({ type: 'pointer.enter' })
    t.leave(HIT)
    t.aimGuard.move(AWAY_MISS)
    expect(t.changes).toEqual([
      [true, 'trigger-hover'],
      [false, 'trigger-hover'],
    ])
    expect(t.state()).toBe('idle')
    expect(t.aimGuard.held).toBe(null)
  })

  describe('a close the consumer ignores', () => {
    /** Open, then a controlled `open` takes a close and never follows. */
    const ignoredClose = () => {
      const t = setup()
      t.controller.send({ type: 'pointer.enter' })
      t.submenu.controlled = true
      t.controller.send({ type: 'sibling.highlight' })
      expect(t.changes).toEqual([
        [true, 'trigger-hover'],
        [false, 'sibling-open'],
      ])
      return t
    }

    it('leaves the submenu open, as the store says', () => {
      const t = ignoredClose()
      expect(t.state()).toBe('open')
      expect(t.clock.pendingTimers()).toBe(0)
    })

    it('asks nothing of a hover, as for an open submenu', () => {
      const t = ignoredClose()
      t.controller.send({ type: 'pointer.enter' })
      t.controller.send({ type: 'pointer.move' })
      expect(t.changes).toHaveLength(2)
    })

    it('suppresses reopening on a press, as for an open submenu', () => {
      const t = ignoredClose()
      t.controller.send({ type: 'press' })
      expect(t.controller.getSnapshot().suppressed).toBe(true)
    })

    it('asks to close again when the trigger hides, or a sibling takes the highlight', () => {
      const t = ignoredClose()
      t.controller.send({ type: 'hide' })
      t.controller.send({ type: 'sibling.highlight' })
      expect(t.changes.slice(2)).toEqual([
        [false, 'none'],
        [false, 'sibling-open'],
      ])
    })
  })

  describe('an aim hit whose open the consumer took and never applies', () => {
    /** Guarding an open that's pending: the pointer left aiming at it. */
    const guardingPending = () => {
      const t = controlled()
      t.controller.send({ type: 'pointer.enter' })
      t.leave(HIT)
      expect(t.state()).toBe('guarded')
      expect(t.aimGuard.tracking).toBe(true)
      return t
    }

    it('takes the open back when the exit tracking times out, and the next hover asks again', () => {
      const t = guardingPending()
      t.clock.advance(600)
      expect(t.state()).toBe('idle')
      expect(t.aimGuard.tracking).toBe(false)
      t.controller.send({ type: 'pointer.enter' })
      expect(t.changes).toEqual([
        [true, 'trigger-hover'],
        [false, 'trigger-hover'],
        [true, 'trigger-hover'],
      ])
    })

    it('leaves nothing pending for a sibling to take back after the timeout', () => {
      const t = guardingPending()
      t.clock.advance(600)
      t.controller.send({ type: 'sibling.highlight' })
      expect(t.changes).toEqual([
        [true, 'trigger-hover'],
        [false, 'trigger-hover'],
      ])
    })

    it('takes the open back when the popup goes while the exit is tracked', () => {
      const t = guardingPending()
      t.aimGuard.move(NO_POPUP)
      expect(t.changes).toEqual([
        [true, 'trigger-hover'],
        [false, 'trigger-hover'],
      ])
      expect(t.state()).toBe('idle')
      expect(t.aimGuard.tracking).toBe(false)
      expect(t.clock.pendingTimers()).toBe(0)
    })
  })

  describe('an open it asked for that another request takes back', () => {
    // The prop never changes: the store no longer has the open pending
    const takenBack = () => {
      const t = controlled()
      t.controller.send({ type: 'pointer.enter' })
      t.takeBack()
      return t
    }

    it('asks nothing when the pointer leaves, or a sibling takes the highlight', () => {
      const t = takenBack()
      t.leave(NO_POPUP)
      t.controller.send({ type: 'sibling.highlight' })
      expect(t.changes).toEqual([[true, 'trigger-hover']])
    })

    it('asks again on the next hover', () => {
      const t = takenBack()
      t.leave(NO_POPUP)
      t.controller.send({ type: 'pointer.enter' })
      expect(t.changes).toEqual([
        [true, 'trigger-hover'],
        [true, 'trigger-hover'],
      ])
    })

    it("doesn't hold the guard for an aim hit on it", () => {
      const t = takenBack()
      t.submenu.controlled = false
      t.submenu.refuses = true
      t.leave(HIT)
      // The hit asks for it again (the consumer cancels it this time)
      expect(t.changes).toEqual([
        [true, 'trigger-hover'],
        [true, 'trigger-hover'],
      ])
      expect(t.state()).toBe('idle')
    })
  })

  for (const [name, end] of [
    [
      "the trigger's menu closes",
      (t: ReturnType<typeof setup>) =>
        t.controller.send({ type: 'parent.close' }),
    ],
    [
      'the trigger loses the highlight',
      (t: ReturnType<typeof setup>) =>
        t.controller.send({
          type: 'highlight',
          highlighted: false,
          keyboard: false,
        }),
    ],
    [
      'the controller is disposed',
      (t: ReturnType<typeof setup>) => t.controller.dispose(),
    ],
  ] as const) {
    it(`forgets a pending open when ${name}: the next hover asks, and leaving takes only that back`, () => {
      const t = controlled()
      t.controller.send({ type: 'pointer.enter' })
      end(t)
      t.controller.send({ type: 'pointer.enter' })
      t.leave(NO_POPUP)
      expect(t.changes).toEqual([
        [true, 'trigger-hover'],
        [true, 'trigger-hover'],
        [false, 'trigger-hover'],
      ])
    })
  }

  describe('while the open it asked for is pending', () => {
    it('asks nothing when the pointer comes back to the trigger', () => {
      const t = controlled()
      t.controller.send({ type: 'pointer.enter' })
      t.leave(HIT)
      t.controller.send({ type: 'pointer.enter' })
      t.controller.send({ type: 'pointer.move' })
      expect(t.changes).toEqual([[true, 'trigger-hover']])
    })

    it('takes it back when a sibling takes the highlight', () => {
      const t = controlled()
      t.controller.send({ type: 'pointer.enter' })
      t.controller.send({ type: 'sibling.highlight' })
      expect(t.changes).toEqual([
        [true, 'trigger-hover'],
        [false, 'sibling-open'],
      ])
    })

    it("doesn't read a press as one on the open trigger", () => {
      const t = controlled()
      t.controller.send({ type: 'pointer.enter' })
      t.controller.send({ type: 'press' })
      expect(t.controller.getSnapshot().suppressed).toBe(false)
    })

    it('drops it once the store opens the submenu: a later close leaves nothing pending', () => {
      const t = controlled()
      t.controller.send({ type: 'pointer.enter' })
      t.apply(true)
      // Closed by something else, with the pointer still on the trigger
      t.apply(false)
      t.controller.send({ type: 'pointer.move' })
      expect(t.changes).toEqual([
        [true, 'trigger-hover'],
        [true, 'trigger-hover'],
      ])
    })
  })

  it('keeps nothing pending after it takes an open back', () => {
    const t = controlled()
    t.controller.send({ type: 'pointer.enter' })
    t.leave(NO_POPUP)
    // Nothing pending: a sibling's highlight asks nothing
    t.controller.send({ type: 'sibling.highlight' })
    expect(t.changes).toEqual([
      [true, 'trigger-hover'],
      [false, 'trigger-hover'],
    ])
  })

  describe('a key', () => {
    it('moves focus in once the prop follows, not before', () => {
      const t = controlled()
      t.controller.send({ type: 'key' })
      expect(t.changes).toEqual([[true, 'list-navigation']])
      expect(t.focuses()).toBe(0)
      t.apply(true)
      expect(t.focuses()).toBe(1)
      // Only once
      t.apply(false)
      t.apply(true)
      expect(t.focuses()).toBe(1)
    })

    it('moves focus in at once when the submenu opens with it', () => {
      const t = setup()
      t.controller.send({ type: 'key' })
      expect(t.focuses()).toBe(1)
      t.controller.send({ type: 'key' })
      expect(t.focuses()).toBe(2)
      expect(t.changes).toHaveLength(1)
    })

    it('moves no focus for an open the consumer cancels', () => {
      const t = setup()
      t.submenu.refuses = true
      t.controller.send({ type: 'key' })
      t.submenu.refuses = false
      t.apply(true)
      expect(t.focuses()).toBe(0)
    })

    for (const [name, event] of [
      [
        'the highlight is lost',
        { type: 'highlight', highlighted: false, keyboard: false },
      ],
      ['a sibling takes the highlight', { type: 'sibling.highlight' }],
      ["the trigger's menu closes", { type: 'parent.close' }],
    ] as const) {
      it(`drops its focus intent when ${name}`, () => {
        const t = controlled()
        t.controller.send({ type: 'key' })
        t.controller.send(event)
        t.apply(true)
        expect(t.focuses()).toBe(0)
      })
    }

    for (const [name, take] of [
      [
        'the pointer leaves without aiming at it',
        (t: ReturnType<typeof setup>) => t.leave(NO_POPUP),
      ],
      [
        'the trigger hides',
        (t: ReturnType<typeof setup>) => t.controller.send({ type: 'hide' }),
      ],
    ] as const) {
      it(`drops its focus intent when it takes the open back as ${name}`, () => {
        const t = controlled()
        t.controller.send({ type: 'key' })
        take(t)
        expect(t.changes).toHaveLength(2)
        expect(t.changes[1]?.[0]).toBe(false)
        // The submenu opens later, for something else (a hover)
        t.apply(true)
        expect(t.focuses()).toBe(0)
      })
    }

    it('drops its focus intent on dispose', () => {
      const t = controlled()
      t.controller.send({ type: 'key' })
      t.controller.dispose()
      t.apply(true)
      expect(t.focuses()).toBe(0)
    })
  })

  describe('suppression', () => {
    it('is set by an explicit close, and keeps a highlight from reopening', () => {
      const t = setup({ delay: { pointer: 0, keyboard: 0 } })
      t.controller.send({ type: 'close.explicit' })
      expect(t.controller.getSnapshot().suppressed).toBe(true)
      t.controller.send({
        type: 'highlight',
        highlighted: true,
        keyboard: true,
      })
      t.controller.send({ type: 'pointer.enter' })
      expect(t.changes).toEqual([])
    })

    it('ends when cleared, and a highlight opens it again', () => {
      const t = setup({ delay: { pointer: 0, keyboard: 0 } })
      t.suppressAutoOpen.current = true
      t.suppressAutoOpen.current = false
      expect(t.controller.getSnapshot().suppressed).toBe(false)
      t.controller.send({ type: 'pointer.enter' })
      expect(t.changes).toEqual([[true, 'trigger-hover']])
    })

    it('ends when the trigger loses the highlight, and tells subscribers', () => {
      const t = setup()
      t.controller.send({ type: 'close.explicit' })
      const before = t.notifications()
      t.controller.send({
        type: 'highlight',
        highlighted: false,
        keyboard: false,
      })
      expect(t.controller.getSnapshot().suppressed).toBe(false)
      expect(t.notifications()).toBe(before + 1)
      t.controller.send({ type: 'pointer.enter' })
      expect(t.changes).toEqual([[true, 'trigger-hover']])
    })
  })
})

describe("SubmenuController when the trigger's menu closes", () => {
  it('stops tracking an exit it guards, and holds no guard', () => {
    const t = setup()
    t.controller.send({ type: 'pointer.enter' })
    t.leave(HIT)
    expect(t.state()).toBe('guarded')
    const released = t.aimGuard.ownReleases
    t.controller.send({ type: 'parent.close' })
    expect(t.controller.getSnapshot().state).toBe('idle')
    expect(t.aimGuard.tracking).toBe(false)
    expect(t.aimGuard.ownReleases).toBe(released + 1)
    expect(t.clock.pendingTimers()).toBe(0)
  })

  it('stops a close delay and the tracking it waits out', () => {
    const t = setup({ closeDelay: 300 })
    t.controller.send({ type: 'pointer.enter' })
    t.leave(MISS)
    expect(t.state()).toBe('close-pending')
    expect(t.aimGuard.tracking).toBe(true)
    t.controller.send({ type: 'parent.close' })
    expect(t.controller.getSnapshot().state).toBe('idle')
    expect(t.aimGuard.tracking).toBe(false)
    expect(t.clock.pendingTimers()).toBe(0)
  })
})

describe('SubmenuController from open-pending', () => {
  const pending = () => {
    const t = setup({ delay: { pointer: 100, keyboard: 150 } })
    t.controller.send({ type: 'pointer.enter' })
    expect(t.state()).toBe('open-pending')
    return t
  }
  const keyboardPending = () => {
    const t = setup()
    t.controller.send({ type: 'highlight', highlighted: true, keyboard: true })
    expect(t.state()).toBe('open-pending')
    return t
  }

  it('goes back to idle when the pointer leaves', () => {
    const t = pending()
    t.leave(NO_POPUP)
    expect(t.state()).toBe('idle')
    t.clock.advance(1000)
    expect(t.changes).toEqual([])
  })

  it('goes back to idle when a sibling takes the highlight', () => {
    const t = pending()
    t.controller.send({ type: 'sibling.highlight' })
    expect(t.state()).toBe('idle')
    t.clock.advance(1000)
    expect(t.changes).toEqual([])
  })

  it('goes back to idle when its menu closes', () => {
    const t = keyboardPending()
    t.controller.send({ type: 'parent.close' })
    expect(t.state()).toBe('idle')
    t.clock.advance(1000)
    expect(t.changes).toEqual([])
  })

  it('goes back to idle when the trigger loses the highlight', () => {
    const t = keyboardPending()
    t.controller.send({
      type: 'highlight',
      highlighted: false,
      keyboard: false,
    })
    expect(t.state()).toBe('idle')
    t.clock.advance(1000)
    expect(t.changes).toEqual([])
  })

  it('goes back to idle when the highlight changes without a key', () => {
    const t = pending()
    t.controller.send({ type: 'highlight', highlighted: true, keyboard: false })
    expect(t.state()).toBe('idle')
    t.clock.advance(1000)
    expect(t.changes).toEqual([])
  })

  it('goes back to idle when openOnHighlight turns off', () => {
    const t = keyboardPending()
    t.controller.configure({
      delay: { pointer: 0, keyboard: 150 },
      closeDelay: 0,
      closeOnPointerLeave: true,
      openOnHighlight: false,
    })
    expect(t.state()).toBe('idle')
    t.clock.advance(1000)
    expect(t.changes).toEqual([])
  })

  it('goes back to idle when the trigger hides', () => {
    const t = pending()
    t.controller.send({ type: 'hide' })
    expect(t.state()).toBe('idle')
    t.clock.advance(1000)
    expect(t.changes).toEqual([])
  })

  it('keeps its delay running when the pointer moves on', () => {
    const t = pending()
    t.clock.advance(60)
    t.controller.send({ type: 'pointer.move' })
    t.clock.advance(40)
    expect(t.state()).toBe('open')
  })

  it('restarts its delay when the pointer enters again', () => {
    const t = pending()
    t.clock.advance(60)
    t.controller.send({ type: 'pointer.enter' })
    t.clock.advance(40)
    expect(t.state()).toBe('open-pending')
    t.clock.advance(60)
    expect(t.state()).toBe('open')
  })

  it('does not open from a keyboard delay an explicit close outlived', () => {
    const t = keyboardPending()
    t.suppressAutoOpen.current = true
    t.clock.advance(150)
    expect(t.state()).toBe('idle')
    expect(t.changes).toEqual([])
  })

  it('follows an open the binding reports, and drops its delay', () => {
    const t = pending()
    t.apply(true)
    expect(t.state()).toBe('open')
    t.clock.advance(1000)
    expect(t.changes).toEqual([])
  })
})

describe('SubmenuController from open', () => {
  it('goes guarded when the pointer leaves aiming at the popup', () => {
    const t = openSetup()
    const highlights = t.highlights()
    t.leave(HIT)
    expect(t.state()).toBe('guarded')
    expect(t.aimGuard.tracking).toBe(true)
    expect(t.aimGuard.held).toBe(600)
    expect(t.aimGuard.shown).toEqual(['hit'])
    expect(t.highlights()).toBe(highlights + 1)
    expect(t.changes).toEqual([])
  })

  it('goes close-pending on a miss with a close delay, tracking for that long', () => {
    const t = openSetup({ closeDelay: 200 })
    t.leave(MISS)
    expect(t.state()).toBe('close-pending')
    expect(t.aimGuard.tracking).toBe(true)
    expect(t.aimGuard.shown).toEqual(['miss'])
    expect(t.aimGuard.releases).toBe(1)
    t.clock.advance(199)
    expect(t.changes).toEqual([])
    t.clock.advance(1)
    expect(t.state()).toBe('idle')
    expect(t.aimGuard.tracking).toBe(false)
    expect(t.changes).toEqual([[false, 'trigger-hover']])
  })

  it('closes at once on a miss with no close delay', () => {
    const t = openSetup()
    t.leave(MISS)
    expect(t.state()).toBe('idle')
    expect(t.aimGuard.tracking).toBe(false)
    expect(t.changes).toEqual([[false, 'trigger-hover']])
  })

  it('stays open on a miss with closeOnPointerLeave off', () => {
    const t = openSetup({ closeOnPointerLeave: false, closeDelay: 200 })
    t.leave(MISS)
    t.clock.advance(1000)
    expect(t.state()).toBe('open')
    expect(t.aimGuard.tracking).toBe(false)
    expect(t.changes).toEqual([])
  })

  it('closes when the pointer leaves and the popup has no rect', () => {
    const t = openSetup()
    t.leave(NO_POPUP)
    expect(t.state()).toBe('idle')
    expect(t.aimGuard.shown).toEqual(['none'])
    expect(t.changes).toEqual([[false, 'trigger-hover']])
  })

  it('stays open, and drops the guard, when the pointer leaves into the popup', () => {
    const t = openSetup()
    t.aimGuard.held = 450
    t.leave(INSIDE)
    expect(t.state()).toBe('open')
    expect(t.aimGuard.held).toBe(null)
    expect(t.aimGuard.releases).toBe(1)
    expect(t.aimGuard.shown).toEqual(['hit'])
    expect(t.changes).toEqual([])
  })

  it('closes when a sibling takes the highlight', () => {
    const t = openSetup()
    t.controller.send({ type: 'sibling.highlight' })
    expect(t.state()).toBe('idle')
    expect(t.changes).toEqual([[false, 'sibling-open']])
  })

  it('closes when the trigger hides', () => {
    const t = openSetup()
    t.controller.send({ type: 'hide' })
    expect(t.state()).toBe('idle')
    expect(t.changes).toEqual([[false, 'none']])
  })

  it('stays open when its menu closes: the submenu root closes it', () => {
    const t = openSetup()
    t.controller.send({ type: 'parent.close' })
    expect(t.state()).toBe('open')
    expect(t.changes).toEqual([])
  })

  it('follows a close the binding reports, without deciding one', () => {
    const t = openSetup()
    const ownReleases = t.aimGuard.ownReleases
    t.apply(false)
    expect(t.state()).toBe('idle')
    expect(t.aimGuard.ownReleases).toBe(ownReleases + 1)
    expect(t.changes).toEqual([])
  })

  it('suppresses auto-open on a press while open', () => {
    const t = openSetup()
    t.controller.send({ type: 'press' })
    expect(t.suppressAutoOpen.current).toBe(true)
  })

  it('decides no second open on a key or a pointer move', () => {
    const t = openSetup()
    t.controller.send({ type: 'key' })
    t.controller.send({ type: 'pointer.move' })
    t.controller.send({ type: 'pointer.enter' })
    expect(t.state()).toBe('open')
    expect(t.changes).toEqual([])
  })

  it('arms no open delay when the pointer enters the open trigger', () => {
    const t = openSetup()
    t.controller.configure({
      delay: { pointer: 100, keyboard: 150 },
      closeDelay: 0,
      closeOnPointerLeave: true,
      openOnHighlight: true,
    })
    t.controller.send({ type: 'pointer.enter' })
    expect(t.clock.pendingTimers()).toBe(0)
  })

  it('reopens from a hit on a popup still showing while it closes', () => {
    const t = setup()
    t.leave(HIT)
    expect(t.state()).toBe('guarded')
    expect(t.changes).toEqual([[true, 'trigger-hover']])
  })
})

describe('SubmenuController from guarded', () => {
  it('goes open when the pointer reaches the popup, keeping the guard', () => {
    const t = guardedSetup()
    t.controller.send({ type: 'pointer.enterPopup' })
    expect(t.state()).toBe('open')
    expect(t.aimGuard.tracking).toBe(false)
    expect(t.aimGuard.held).toBe(600)
  })

  it('goes open, and drops the guard, when the pointer enters the trigger', () => {
    const t = guardedSetup()
    t.controller.send({ type: 'pointer.enter' })
    expect(t.state()).toBe('open')
    expect(t.aimGuard.tracking).toBe(false)
    expect(t.aimGuard.held).toBe(null)
    expect(t.aimGuard.releases).toBe(1)
  })

  it('goes close-pending when the pointer moves back, with a close delay', () => {
    const t = guardedSetup({ closeDelay: 200 })
    t.aimGuard.move(AWAY)
    expect(t.state()).toBe('close-pending')
    expect(t.aimGuard.held).toBe(null)
    expect(t.aimGuard.releases).toBe(1)
    expect(t.aimGuard.shown).toEqual(['miss'])
    expect(t.aimGuard.tracking).toBe(true)
    t.clock.advance(200)
    expect(t.changes).toEqual([[false, 'trigger-hover']])
  })

  it('closes at once when the pointer moves back, with no close delay', () => {
    const t = guardedSetup()
    t.aimGuard.move(AWAY)
    expect(t.state()).toBe('idle')
    expect(t.aimGuard.tracking).toBe(false)
    expect(t.changes).toEqual([[false, 'trigger-hover']])
  })

  it('closes on a miss as on moving back', () => {
    const t = guardedSetup()
    t.aimGuard.move(MISS)
    expect(t.state()).toBe('idle')
    expect(t.aimGuard.shown).toEqual(['miss'])
    expect(t.changes).toEqual([[false, 'trigger-hover']])
  })

  it('stops tracking, and stays open, on moving back with closeOnPointerLeave off', () => {
    const t = guardedSetup({ closeOnPointerLeave: false, closeDelay: 200 })
    t.aimGuard.move(AWAY)
    expect(t.state()).toBe('open')
    expect(t.aimGuard.tracking).toBe(false)
    t.clock.advance(1000)
    expect(t.changes).toEqual([])
  })

  it('goes open when a move reaches the popup', () => {
    const t = guardedSetup()
    t.aimGuard.move(INSIDE)
    expect(t.state()).toBe('open')
    expect(t.aimGuard.tracking).toBe(false)
  })

  it('goes open when the popup loses its rect', () => {
    const t = guardedSetup()
    t.aimGuard.move(NO_POPUP)
    expect(t.state()).toBe('open')
    expect(t.aimGuard.tracking).toBe(false)
  })

  it('stays guarded, showing nothing new, while moves keep hitting', () => {
    const t = guardedSetup()
    t.aimGuard.move(HIT)
    t.aimGuard.move(HIT)
    expect(t.state()).toBe('guarded')
    expect(t.aimGuard.shown).toEqual([])
  })

  it('goes open, still showing, when tracking times out', () => {
    const t = guardedSetup()
    t.clock.advance(599)
    expect(t.state()).toBe('guarded')
    t.clock.advance(1)
    expect(t.state()).toBe('open')
    expect(t.aimGuard.tracking).toBe(false)
    expect(t.changes).toEqual([])
  })

  it('closes when the binding reports a close, dropping its own guard', () => {
    const t = guardedSetup()
    t.apply(false)
    expect(t.state()).toBe('idle')
    expect(t.aimGuard.tracking).toBe(false)
    expect(t.aimGuard.held).toBe(null)
    expect(t.aimGuard.releases).toBe(0)
    expect(t.aimGuard.ownReleases).toBeGreaterThan(0)
  })
})

describe('SubmenuController from close-pending', () => {
  it('goes idle when its close delay ends', () => {
    const t = closePendingSetup()
    t.clock.advance(200)
    expect(t.state()).toBe('idle')
    expect(t.changes).toEqual([[false, 'trigger-hover']])
  })

  it('goes guarded on a hit, keeping the submenu open', () => {
    const t = closePendingSetup()
    const highlights = t.highlights()
    t.aimGuard.move(HIT)
    expect(t.state()).toBe('guarded')
    expect(t.aimGuard.held).toBe(600)
    expect(t.aimGuard.shown).toEqual(['hit'])
    expect(t.highlights()).toBe(highlights + 1)
    t.clock.advance(1000)
    expect(t.changes).toEqual([])
  })

  it('keeps its close delay running on a miss or moving back', () => {
    const t = closePendingSetup(200)
    t.clock.advance(100)
    t.aimGuard.move(MISS)
    t.aimGuard.move(AWAY_MISS)
    expect(t.state()).toBe('close-pending')
    expect(t.aimGuard.shown).toEqual([])
    expect(t.aimGuard.releases).toBe(0)
    t.clock.advance(100)
    expect(t.state()).toBe('idle')
  })

  it('goes open when the pointer enters the trigger again', () => {
    const t = closePendingSetup()
    t.controller.send({ type: 'pointer.enter' })
    expect(t.state()).toBe('open')
    t.clock.advance(1000)
    expect(t.changes).toEqual([])
  })

  it('goes open when the pointer reaches the popup', () => {
    const t = closePendingSetup()
    t.controller.send({ type: 'pointer.enterPopup' })
    expect(t.state()).toBe('open')
    expect(t.aimGuard.tracking).toBe(false)
    t.clock.advance(1000)
    expect(t.changes).toEqual([])
  })

  it('goes open on a key', () => {
    const t = closePendingSetup()
    t.controller.send({ type: 'key' })
    expect(t.state()).toBe('open')
    t.clock.advance(1000)
    expect(t.changes).toEqual([])
  })

  it('goes guarded when the pointer leaves again aiming at the popup', () => {
    const t = closePendingSetup()
    t.leave(HIT)
    expect(t.state()).toBe('guarded')
    t.clock.advance(1000)
    expect(t.changes).toEqual([])
  })

  it('keeps its close delay when tracking ends first', () => {
    const t = closePendingSetup(200)
    t.aimGuard.move(NO_POPUP)
    expect(t.state()).toBe('close-pending')
    expect(t.aimGuard.tracking).toBe(false)
    t.clock.advance(200)
    expect(t.state()).toBe('idle')
  })

  it('closes when a sibling takes the highlight', () => {
    const t = closePendingSetup()
    t.controller.send({ type: 'sibling.highlight' })
    expect(t.state()).toBe('idle')
    expect(t.changes).toEqual([[false, 'sibling-open']])
    t.clock.advance(1000)
    expect(t.changes).toHaveLength(1)
  })
})

describe('SubmenuController and its guard overlay', () => {
  // The overlay reads who holds the guard as the hit is shown
  it('holds or releases the guard before it shows a hit', () => {
    const inside = openSetup()
    inside.aimGuard.calls.length = 0
    inside.leave(INSIDE)
    expect(inside.aimGuard.calls).toEqual(['release', 'show:hit'])

    const leaving = openSetup()
    leaving.aimGuard.calls.length = 0
    leaving.leave(HIT)
    expect(leaving.aimGuard.calls).toEqual(['hold', 'show:hit'])

    const tracked = closePendingSetup()
    tracked.aimGuard.calls.length = 0
    tracked.aimGuard.move(HIT)
    expect(tracked.aimGuard.calls).toEqual(['hold', 'show:hit'])
  })
})

describe('SubmenuController exit tracking window', () => {
  it('tracks for the guard once a hit turns close-pending into guarded', () => {
    const t = closePendingSetup(200)
    t.clock.advance(150)
    t.aimGuard.move(HIT)
    expect(t.state()).toBe('guarded')
    // Past the close delay's tracking window: the guard's runs on
    t.clock.advance(100)
    expect(t.state()).toBe('guarded')
    expect(t.aimGuard.tracking).toBe(true)
    t.clock.advance(499)
    expect(t.aimGuard.tracking).toBe(true)
    t.clock.advance(1)
    expect(t.state()).toBe('open')
    expect(t.aimGuard.tracking).toBe(false)
  })

  it('tracks for the close delay once moving back turns guarded into close-pending', () => {
    const t = guardedSetup({ closeDelay: 200 })
    t.clock.advance(550)
    t.aimGuard.move(AWAY)
    expect(t.state()).toBe('close-pending')
    // Past the guard's tracking window: a hit still keeps the submenu
    t.clock.advance(100)
    expect(t.aimGuard.tracking).toBe(true)
    t.aimGuard.move(HIT)
    expect(t.state()).toBe('guarded')
    t.clock.advance(1000)
    expect(t.changes).toEqual([])
  })
})

describe('SubmenuController lifecycle', () => {
  it('stops its timers and tracking on dispose, deciding nothing', () => {
    const t = closePendingSetup()
    t.aimGuard.held = 600
    t.controller.dispose()
    expect(t.controller.getSnapshot().state).toBe('idle')
    expect(t.aimGuard.tracking).toBe(false)
    expect(t.aimGuard.held).toBe(null)
    expect(t.aimGuard.releases).toBe(0)
    expect(t.clock.pendingTimers()).toBe(0)
    expect(t.changes).toEqual([])
  })

  describe('when openOnHighlight turns on', () => {
    const on: SubmenuSettings = {
      delay: { pointer: 0, keyboard: 150 },
      closeDelay: 0,
      closeOnPointerLeave: true,
      openOnHighlight: true,
    }

    it('schedules the keyboard open a key-held highlight would have', () => {
      const t = setup({ openOnHighlight: false })
      t.controller.send({
        type: 'highlight',
        highlighted: true,
        keyboard: true,
      })
      expect(t.state()).toBe('idle')
      t.controller.configure(on)
      expect(t.state()).toBe('open-pending')
      expect(t.notifications()).toBe(1)
      t.clock.advance(150)
      expect(t.state()).toBe('open')
      expect(t.changes).toEqual([[true, 'list-navigation']])
    })

    it('opens nothing for a pointer highlight, a lost one, or a suppressed one', () => {
      const pointer = setup({ openOnHighlight: false })
      pointer.controller.send({
        type: 'highlight',
        highlighted: true,
        keyboard: false,
      })
      pointer.controller.configure(on)

      const lost = setup({ openOnHighlight: false })
      lost.controller.send({
        type: 'highlight',
        highlighted: true,
        keyboard: true,
      })
      // A key moved the highlight on to the next row
      lost.controller.send({
        type: 'highlight',
        highlighted: false,
        keyboard: true,
      })
      lost.controller.configure(on)

      const suppressed = setup({ openOnHighlight: false })
      suppressed.controller.send({
        type: 'highlight',
        highlighted: true,
        keyboard: true,
      })
      suppressed.suppressAutoOpen.current = true
      suppressed.controller.configure(on)

      for (const t of [pointer, lost, suppressed]) {
        t.clock.advance(1000)
        expect(t.state()).toBe('idle')
        expect(t.changes).toEqual([])
      }
    })

    it('leaves a running keyboard delay alone when it was already on', () => {
      const t = setup()
      t.controller.send({
        type: 'highlight',
        highlighted: true,
        keyboard: true,
      })
      t.clock.advance(100)
      t.controller.configure(on)
      t.clock.advance(50)
      expect(t.state()).toBe('open')
    })
  })

  it('reads new settings from configure', () => {
    const t = setup()
    t.controller.configure({
      delay: { pointer: 50, keyboard: 150 },
      closeDelay: 0,
      closeOnPointerLeave: true,
      openOnHighlight: true,
    })
    t.controller.send({ type: 'pointer.enter' })
    expect(t.state()).toBe('open-pending')
  })

  it('notifies subscribers once per event that changes the state', () => {
    const t = openSetup({ closeDelay: 200 })
    const before = t.notifications()
    // One event that goes through guarded on the way to close-pending
    t.leave(HIT)
    expect(t.notifications()).toBe(before + 1)
    t.aimGuard.move(AWAY)
    expect(t.notifications()).toBe(before + 2)
    t.aimGuard.move(MISS)
    expect(t.notifications()).toBe(before + 2)
    t.clock.advance(200)
    expect(t.state()).toBe('idle')
    expect(t.notifications()).toBe(before + 3)
  })

  it('notifies only once the outer event is done when the binding re-enters it', () => {
    const clock = createFakeClock()
    const seen: string[] = []
    const aimGuard = fakeAimGuard()
    const controller: SubmenuController = new SubmenuController({
      clock,
      aimGuard,
      settings: {
        delay: { pointer: 0, keyboard: 150 },
        closeDelay: 0,
        closeOnPointerLeave: true,
        openOnHighlight: true,
      },
      // The store applies the open and reports it before it returns
      onOpenChange: (open) => {
        controller.send({ type: 'open.change', open })
        return 'applied'
      },
      isOpenPending: () => false,
      onFocus: () => {},
      onHighlight: () => {},
    })
    controller.subscribe(() => seen.push(controller.getSnapshot().state))
    aimGuard.aim = HIT
    controller.send({ type: 'pointer.leave', point: POINT })
    expect(seen).toEqual(['guarded'])
  })

  it('notifies nobody for an event that changes nothing', () => {
    const t = setup()
    const before = t.notifications()
    t.controller.send({ type: 'press' })
    t.controller.send({ type: 'parent.close' })
    expect(t.notifications()).toBe(before)
    expect(t.controller.getSnapshot()).toBe(t.controller.getSnapshot())
  })
})
