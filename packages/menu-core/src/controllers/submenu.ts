import { REASONS } from '../events/reasons.js'
import { type Clock, type ClockHandle, realClock } from '../platform/clock.js'
import type { OpenRequestResult } from './open-change.js'

/** A pointer position in viewport coordinates. */
export interface Point {
  readonly x: number
  readonly y: number
}

/**
 * What the pointer or keyboard is doing with the trigger; whether the
 * submenu is open is the store's, which the controller learns from
 * `open.change`.
 * - `idle`: nothing pending.
 * - `open-pending`: waiting out the open delay.
 * - `guarded`: the pointer left the trigger aiming at the popup; the aim
 *   guard holds the parent's highlight while its moves are tracked. The
 *   submenu is open, or the open it asked for is pending (a controlled
 *   `open` the consumer took).
 * - `close-pending`: waiting out the close delay (its moves may still be
 *   tracked, and a hit keeps it open).
 */
export type SubmenuState = 'idle' | 'open-pending' | 'guarded' | 'close-pending'

/**
 * Where a pointer is, against the submenu's popup: no popup to aim at, inside
 * it, or outside it, with whether its heading hits the popup and whether it
 * moved back, away from it. Geometry only; the controller decides what it
 * means.
 */
export type SubmenuAim =
  | { readonly type: 'no-popup' }
  | { readonly type: 'inside' }
  | {
      readonly type: 'outside'
      readonly hit: boolean
      readonly movedAway: boolean
    }

/** What the controller made of the pointer's aim, for a debug overlay. */
export type SubmenuAimDecision = 'hover' | 'hit' | 'miss' | 'none'

/**
 * The aim guard as one submenu trigger sees it: the tree's guard, scoped to
 * the trigger's depth, and the geometry that reads a pointer's heading.
 */
export interface SubmenuAimGuard {
  /** Whether another trigger at this depth holds the guard. */
  isBlocked(): boolean
  /** Reads a pointer leaving the trigger at `point`; an exit starts there. */
  leave(point: Point): SubmenuAim
  /** Reads a later move of that exit. */
  track(point: Point): SubmenuAim
  /** Calls `onMove` with every pointer move until the returned stop. */
  watch(onMove: (point: Point) => void): () => void
  /** Holds the guard for this trigger for `timeoutMs`. */
  hold(timeoutMs: number): void
  /** Releases the guard, whoever holds it. */
  release(): void
  /** Releases the guard if this trigger holds it. */
  releaseOwn(): void
  /** What the controller made of the pointer's last aim. */
  show(decision: SubmenuAimDecision): void
}

export interface SubmenuDelay {
  /** Before a pointer resting on the trigger opens it. */
  readonly pointer: number
  /** Before a keyboard highlight of the trigger opens it. */
  readonly keyboard: number
}

/** What the trigger's props set; `configure` changes them. */
export interface SubmenuSettings {
  readonly delay: SubmenuDelay
  /** Before a pointer that left without aiming at the popup closes it. */
  readonly closeDelay: number
  /** Whether a pointer leaving without aiming at the popup closes it. */
  readonly closeOnPointerLeave: boolean
  /** Whether a pointer or keyboard highlight opens it. */
  readonly openOnHighlight: boolean
}

export type SubmenuOpenChangeReason =
  | typeof REASONS.triggerHover
  | typeof REASONS.listNavigation
  | typeof REASONS.siblingOpen
  | typeof REASONS.none

/**
 * What became of a change the controller asked of the submenu: its store's,
 * or `refused` when the close policy didn't let it through (a disabled
 * submenu opening).
 */
export type SubmenuRequestResult = OpenRequestResult

export interface SubmenuControllerOptions {
  readonly settings: SubmenuSettings
  readonly aimGuard: SubmenuAimGuard
  /**
   * Asks the submenu's store to open or close, and returns what became of
   * it. The store reports the submenu's open state with `open.change`,
   * whatever changed it; the controller never assumes it.
   */
  readonly onOpenChange: (
    open: boolean,
    reason: SubmenuOpenChangeReason,
  ) => SubmenuRequestResult
  /**
   * Whether the submenu's store still has an open pending (a controlled
   * `open` the consumer took that its prop hasn't applied). Another request
   * can take back the open the controller asked for (a key, the parent
   * closing it, the consumer itself) without the prop changing, which the
   * controller reads here.
   */
  readonly isOpenPending: () => boolean
  /**
   * A key asked to open the submenu, and the store opened it (now, or once a
   * controlled `open` follows): move focus into it.
   */
  readonly onFocus: () => void
  /** The pointer is on the trigger: it takes its menu's highlight. */
  readonly onHighlight: () => void
  readonly clock?: Clock
}

export type SubmenuEvent =
  /** The pointer entered the trigger. */
  | { readonly type: 'pointer.enter' }
  /** The pointer moved over the trigger. */
  | { readonly type: 'pointer.move' }
  /** The pointer left the trigger at `point`. */
  | { readonly type: 'pointer.leave'; readonly point: Point }
  /** The pointer entered or moved over the submenu's popup. */
  | { readonly type: 'pointer.enterPopup' }
  /** The trigger was pressed. Opening on press is the popover trigger's. */
  | { readonly type: 'press' }
  /** A key asked to open the submenu (ArrowRight, Ctrl+L). */
  | { readonly type: 'key' }
  /**
   * The submenu closed for an explicit close (ArrowLeft, Ctrl+H, Escape or
   * Tab in it): a highlight doesn't reopen it while the trigger keeps it.
   */
  | { readonly type: 'close.explicit' }
  /** Whatever suppresses reopening on a highlight no longer does. */
  | { readonly type: 'suppression.clear' }
  /** The trigger's highlight changed; `keyboard` if a key moved it there. */
  | {
      readonly type: 'highlight'
      readonly highlighted: boolean
      readonly keyboard: boolean
    }
  /** Another row of the trigger's menu took the highlight. */
  | { readonly type: 'sibling.highlight' }
  /** The trigger's menu closed (Escape, an outside press, an item press). */
  | { readonly type: 'parent.close' }
  /** The submenu's store opened or closed it, whatever asked. */
  | { readonly type: 'open.change'; readonly open: boolean }
  /** The trigger stopped showing (a search hid it). */
  | { readonly type: 'hide' }

export interface SubmenuSnapshot {
  readonly state: SubmenuState
  /**
   * An explicit close, or a press on the open trigger, suppresses opening
   * on a highlight until the trigger loses it.
   */
  readonly suppressed: boolean
}

/** How long a hit holds the aim guard, and how long its moves are tracked. */
const GUARD_MS = 600

/**
 * When a submenu opens and closes: hover and keyboard delays, the aim guard
 * on a pointer leaving toward the popup, the close delay, and a sibling's
 * highlight. It decides what to ask of the submenu's store
 * (`onOpenChange`) and what to highlight (`onHighlight`); the store decides
 * whether the submenu is open, and the binding tells the controller
 * (`open.change`), with what else happens (`send`). It keeps interaction
 * intent only: an open it asked for that a controlled `open` hasn't applied
 * yet, a hover that didn't open it for the rest of its gesture, a key's wish
 * to move focus in once the submenu opens, and an explicit close's
 * suppression. Whether the submenu is open is only ever what the store said
 * last. Subscribers hear of a new snapshot once per event or timer.
 */
export class SubmenuController {
  readonly #options: SubmenuControllerOptions
  readonly #clock: Clock
  readonly #listeners = new Set<() => void>()
  #settings: SubmenuSettings
  #state: SubmenuState = 'idle'
  #snapshot: SubmenuSnapshot = { state: 'idle', suppressed: false }
  #depth = 0
  /** Whether the submenu is open, as the store last said (`open.change`). */
  #open = false
  /**
   * It asked to open the closed submenu and the consumer took it, for a
   * controlled `open` that hasn't followed (it opens when the prop does, if
   * it does). Not whether it's open: only what this gesture asked, so it
   * doesn't ask again, and so the pointer leaving, a sibling's highlight or
   * the trigger hiding takes it back (asks to close), as do the exit's
   * tracking timing out and the popup going while it's tracked. Dropped when
   * the store opens or closes it, or no longer has it pending (another
   * request took it back, `isOpenPending`), the trigger's menu closes or the
   * highlight is lost, the trigger hides, on dispose, and with any close it
   * asks for.
   */
  #pendingOpen = false
  /**
   * A hover asked to open the submenu and it didn't open (the consumer
   * canceled it, the policy refused it, or a controlled `open` took it): the
   * rest of the gesture doesn't ask again. Dropped when the pointer leaves,
   * and as `#pendingOpen` is.
   */
  #hoverRefused = false
  /**
   * A key asked to open the submenu before it opened: focus moves in when it
   * does. Dropped when the highlight is lost, a sibling takes it, the
   * trigger's menu closes or the trigger hides, with any close it asks for,
   * and on dispose.
   */
  #focusOnOpen = false
  /** See `SubmenuSnapshot.suppressed`. */
  #suppressed = false
  /** The open delay in `open-pending`, the close delay in `close-pending`. */
  #timer: ClockHandle | null = null
  #trackTimer: ClockHandle | null = null
  #unwatch: (() => void) | null = null
  /** The last highlight the binding reported, and whether a key made it. */
  #highlighted = false
  #keyboardHighlight = false

  constructor(options: SubmenuControllerOptions) {
    this.#options = options
    this.#clock = options.clock ?? realClock
    this.#settings = options.settings
  }

  getSnapshot(): SubmenuSnapshot {
    const snapshot = this.#snapshot
    if (
      snapshot.state !== this.#state ||
      snapshot.suppressed !== this.#suppressed
    ) {
      this.#snapshot = { state: this.#state, suppressed: this.#suppressed }
    }
    return this.#snapshot
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  /**
   * Takes new settings. What is pending keeps the timing it started with,
   * but turning `openOnHighlight` off cancels a pending open, and turning it
   * on while a key holds the trigger's highlight schedules the keyboard open
   * that highlight would have.
   */
  configure(settings: SubmenuSettings) {
    const wasOpenOnHighlight = this.#settings.openOnHighlight
    this.#settings = settings
    if (!settings.openOnHighlight) {
      this.#run(() => this.#cancelPending())
    } else if (!wasOpenOnHighlight) {
      this.#run(() =>
        this.#highlight(this.#highlighted, this.#keyboardHighlight),
      )
    }
  }

  send(event: SubmenuEvent) {
    this.#run(() => this.#handle(event))
  }

  /**
   * Stops its timers and tracking, releases its guard and drops its intents,
   * without deciding anything. It takes events again afterwards.
   */
  dispose() {
    this.#run(() => {
      this.#dropIntents()
      this.#toIdle()
    })
  }

  #handle(event: SubmenuEvent) {
    switch (event.type) {
      case 'pointer.enter':
        return this.#pointerEnter()
      case 'pointer.move':
        return this.#pointerMove()
      case 'pointer.leave':
        return this.#pointerLeave(event.point)
      case 'pointer.enterPopup':
        return this.#settle()
      case 'press':
        if (this.#open) this.#suppressed = true
        return
      case 'key':
        return this.#key()
      case 'close.explicit':
        this.#suppressed = true
        return
      case 'suppression.clear':
        this.#suppressed = false
        return
      case 'highlight':
        return this.#highlight(event.highlighted, event.keyboard)
      case 'sibling.highlight':
        this.#focusOnOpen = false
        if (this.#asked()) return this.#close(REASONS.siblingOpen)
        return this.#cancelPending()
      case 'parent.close':
        this.#dropIntents()
        return this.#toIdle()
      case 'open.change':
        return this.#openChange(event.open)
      case 'hide':
        if (this.#asked()) return this.#close(REASONS.none)
        this.#dropIntents()
        return this.#toIdle()
    }
  }

  #pointerEnter() {
    const { aimGuard } = this.#options
    if (aimGuard.isBlocked()) return
    aimGuard.show('hover')
    this.#options.onHighlight()
    if (!this.#settings.openOnHighlight || this.#suppressed) return
    if (this.#hoverRefused) return

    this.#stopTracking()
    aimGuard.release()
    this.#clearTimer()
    if (this.#asked()) {
      this.#set('idle')
      return
    }
    this.#scheduleOpen(this.#settings.delay.pointer, REASONS.triggerHover)
  }

  #pointerMove() {
    const { aimGuard } = this.#options
    if (aimGuard.isBlocked()) return
    this.#options.onHighlight()
    if (!this.#settings.openOnHighlight || this.#asked()) return
    if (this.#suppressed || this.#hoverRefused) return

    this.#stopTracking()
    const ms = this.#settings.delay.pointer
    if (ms > 0 && this.#state === 'open-pending') return
    this.#scheduleOpen(ms, REASONS.triggerHover)
  }

  #pointerLeave(point: Point) {
    // The hover gesture ends: the next one asks again
    this.#hoverRefused = false
    this.#cancelPending()
    const { aimGuard } = this.#options
    if (aimGuard.isBlocked()) return

    const aim = aimGuard.leave(point)
    if (aim.type === 'no-popup') {
      aimGuard.show('none')
      this.#stopTracking()
      aimGuard.release()
      return this.#missed()
    }
    // Shown once the guard is held or released, so the overlay reads it
    if (aim.type === 'inside') {
      aimGuard.release()
      aimGuard.show('hit')
      return this.#settle()
    }
    if (aim.hit) {
      // A refused open leaves nothing guarded to show
      const guarded = this.#guard()
      aimGuard.show(guarded ? 'hit' : 'none')
      if (guarded) this.#startTracking(GUARD_MS)
      return
    }
    aimGuard.show('miss')
    aimGuard.release()
    this.#stopTracking()
    this.#missed()
    if (this.#state === 'close-pending') {
      this.#startTracking(this.#settings.closeDelay)
    }
  }

  #track(point: Point) {
    const { aimGuard } = this.#options
    const aim = aimGuard.track(point)
    const guarded = this.#state === 'guarded'
    if (aim.type === 'no-popup') {
      this.#stopTracking()
      // Nothing left to aim at: an open still pending doesn't outlive it
      if (this.#pending()) return this.#close(REASONS.triggerHover)
      if (guarded) this.#set('idle')
      return
    }
    if (aim.type === 'inside') return this.#settle()
    if (guarded) {
      // Moving back, or heading past the popup, ends the guard.
      if (aim.hit && !aim.movedAway) return
      aimGuard.show('miss')
      aimGuard.release()
      this.#missed()
      // Tracked for as long as the close delay it now waits out
      if (this.#state === 'close-pending') {
        this.#timeTracking(this.#settings.closeDelay)
      }
      return
    }
    // Waiting out the close delay: a heading that hits the popup keeps it,
    // tracked for as long as the guard it now holds.
    if (!aim.hit) return
    const held = this.#guard()
    aimGuard.show(held ? 'hit' : 'none')
    if (held) this.#timeTracking(GUARD_MS)
  }

  #key() {
    this.#stopTracking()
    this.#clearTimer()
    this.#set('idle')
    if (this.#open) {
      this.#options.onFocus()
      return
    }
    const result = this.#request(true, REASONS.listNavigation)
    if (result === 'canceled' || result === 'refused') return
    // Focus moves in once the store says it's open: now, or when a
    // controlled `open` follows
    if (this.#open) this.#options.onFocus()
    else this.#focusOnOpen = true
  }

  #highlight(highlighted: boolean, keyboard: boolean) {
    this.#highlighted = highlighted
    this.#keyboardHighlight = keyboard
    if (!highlighted) {
      this.#suppressed = false
      this.#dropIntents()
    }
    if (!this.#settings.openOnHighlight || !highlighted || !keyboard) {
      // Whatever started the open delay: a keyboard highlight's, or a
      // pointer's that a move restarts.
      return this.#cancelPending()
    }
    if (this.#suppressed || this.#asked()) return
    this.#clearTimer()
    this.#scheduleOpen(this.#settings.delay.keyboard, REASONS.listNavigation)
  }

  #openChange(open: boolean) {
    this.#open = open
    this.#pendingOpen = false
    this.#hoverRefused = false
    if (open) {
      if (this.#state === 'open-pending') {
        this.#clearTimer()
        this.#set('idle')
      }
      if (this.#focusOnOpen) {
        this.#focusOnOpen = false
        this.#options.onFocus()
      }
      return
    }
    // Whatever the pointer was doing with the open submenu is over
    if (this.#state !== 'open-pending') this.#toIdle()
  }

  /** The pointer reached the popup: nothing pending closes it. */
  #settle() {
    if (this.#state === 'close-pending') this.#clearTimer()
    this.#stopTracking()
    if (this.#state === 'guarded' || this.#state === 'close-pending') {
      this.#set('idle')
    }
  }

  /** The pointer is leaving without aiming at the popup. */
  #missed() {
    if (!this.#asked()) {
      this.#stopTracking()
      return
    }
    const { closeDelay, closeOnPointerLeave } = this.#settings
    if (!closeOnPointerLeave) {
      this.#stopTracking()
      this.#set('idle')
      // An open still pending (a controlled `open` the consumer hasn't
      // applied) ends with the gesture: the next one asks again
      this.#pendingOpen = false
      return
    }
    if (closeDelay <= 0) {
      this.#close(REASONS.triggerHover)
      return
    }
    this.#clearTimer()
    this.#timer = this.#clock.setTimeout(() => {
      this.#timer = null
      this.#run(() => this.#close(REASONS.triggerHover))
    }, closeDelay)
    this.#set('close-pending')
  }

  /**
   * The pointer aims at the popup: guard the trigger's highlight while the
   * submenu is open or the open it asked for is pending; ask for it if it's
   * neither. A canceled or refused open holds nothing.
   */
  #guard(): boolean {
    this.#options.aimGuard.hold(GUARD_MS)
    this.#options.onHighlight()
    this.#clearTimer()
    this.#set('guarded')
    if (this.#asked()) return true
    const result = this.#request(true, REASONS.triggerHover)
    if (result !== 'canceled' && result !== 'refused') return true
    this.#toIdle()
    return false
  }

  #scheduleOpen(ms: number, reason: SubmenuOpenChangeReason) {
    if (ms <= 0) {
      this.#askOpen(reason)
      return
    }
    const keyboard = reason === REASONS.listNavigation
    this.#timer = this.#clock.setTimeout(() => {
      this.#timer = null
      this.#run(() => {
        // A keyboard delay outlives an explicit close made while it ran.
        if (keyboard && this.#suppressed) {
          this.#set('idle')
          return
        }
        this.#askOpen(reason)
      })
    }, ms)
    this.#set('open-pending')
  }

  /**
   * Asks to open the submenu. A hover that doesn't open it (canceled,
   * refused, or left to a controlled `open`) doesn't ask again until its
   * gesture ends.
   */
  #askOpen(reason: SubmenuOpenChangeReason) {
    this.#clearTimer()
    this.#set('idle')
    const result = this.#request(true, reason)
    if (
      reason === REASONS.triggerHover &&
      (result === 'canceled' || result === 'refused' || result === 'controlled')
    ) {
      this.#hoverRefused = true
    }
  }

  #cancelPending() {
    if (this.#state !== 'open-pending') return
    this.#clearTimer()
    this.#set('idle')
  }

  /**
   * Asks to close the submenu (or takes back the open it asked for), ending
   * the gesture and what it intended. A controlled `open` closes when the
   * prop follows; until the store says so, it's still open.
   */
  #close(reason: SubmenuOpenChangeReason) {
    this.#toIdle()
    this.#dropIntents()
    this.#request(false, reason)
  }

  /**
   * Asks the store for `open`. An open a controlled `open` took is pending
   * (`#pendingOpen`) until the store says what became of it.
   */
  #request(
    open: boolean,
    reason: SubmenuOpenChangeReason,
  ): SubmenuRequestResult {
    const result = this.#options.onOpenChange(open, reason)
    if (open && result === 'controlled' && !this.#open) {
      this.#pendingOpen = true
    }
    return result
  }

  /** Whether the submenu is open, or the open it asked for is pending. */
  #asked() {
    return this.#open || this.#pending()
  }

  /**
   * Whether the open it asked for is still pending: the store has it pending
   * too, unless another request took it back, which drops it.
   */
  #pending() {
    if (this.#pendingOpen && !this.#options.isOpenPending()) {
      this.#pendingOpen = false
    }
    return this.#pendingOpen
  }

  /** Forgets what it intended: the open it asked for, a refusal, a key's focus. */
  #dropIntents() {
    this.#pendingOpen = false
    this.#hoverRefused = false
    this.#focusOnOpen = false
  }

  /** Nothing pending, nothing tracked, no guard of its own. */
  #toIdle() {
    this.#clearTimer()
    this.#stopTracking()
    this.#options.aimGuard.releaseOwn()
    this.#set('idle')
  }

  #startTracking(ms: number) {
    this.#stopTracking()
    if (ms <= 0) return
    this.#unwatch = this.#options.aimGuard.watch((point) =>
      this.#run(() => this.#track(point)),
    )
    this.#timeTracking(ms)
  }

  /** Tracking the exit ends `ms` from now. */
  #timeTracking(ms: number) {
    if (this.#trackTimer !== null) this.#clock.clearTimeout(this.#trackTimer)
    this.#trackTimer = this.#clock.setTimeout(() => {
      this.#trackTimer = null
      this.#run(() => {
        this.#stopTracking()
        // An open still pending (a controlled `open` the consumer hasn't
        // applied) doesn't outlive the exit: it's taken back, as a pointer
        // leaving without aiming at the popup takes it back, and the next
        // hover asks again
        if (this.#pending()) return this.#close(REASONS.triggerHover)
        if (this.#state === 'guarded') this.#set('idle')
        this.#hoverRefused = false
      })
    }, ms)
  }

  #stopTracking() {
    if (this.#trackTimer !== null) {
      this.#clock.clearTimeout(this.#trackTimer)
      this.#trackTimer = null
    }
    const unwatch = this.#unwatch
    this.#unwatch = null
    unwatch?.()
  }

  #clearTimer() {
    if (this.#timer === null) return
    this.#clock.clearTimeout(this.#timer)
    this.#timer = null
  }

  #set(state: SubmenuState) {
    this.#state = state
  }

  /** Runs `fn`, then tells subscribers once if the snapshot changed. */
  #run(fn: () => void) {
    const before = this.#state
    const suppressedBefore = this.#suppressed
    this.#depth++
    try {
      fn()
    } finally {
      this.#depth--
    }
    if (this.#depth > 0) return
    if (this.#state === before && this.#suppressed === suppressedBefore) return
    for (const listener of this.#listeners) listener()
  }
}
