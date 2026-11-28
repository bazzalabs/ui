import { REASONS } from '../events/reasons.js'
import { type Clock, type ClockHandle, realClock } from '../platform/clock.js'

/** A pointer position in viewport coordinates. */
export interface Point {
  readonly x: number
  readonly y: number
}

/**
 * - `idle`: closed, nothing pending.
 * - `open-pending`: closed, waiting out the open delay.
 * - `open`: open, nothing pending.
 * - `guarded`: open, the pointer left the trigger aiming at the popup; the
 *   aim guard holds the parent's highlight while its moves are tracked.
 * - `close-pending`: open, waiting out the close delay (its moves may still
 *   be tracked, and a hit keeps it open).
 */
export type SubmenuState =
  | 'idle'
  | 'open-pending'
  | 'open'
  | 'guarded'
  | 'close-pending'

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

export interface SubmenuControllerOptions {
  readonly settings: SubmenuSettings
  readonly aimGuard: SubmenuAimGuard
  /**
   * Set by an explicit close (ArrowLeft, Escape or Tab in the submenu, or
   * a press on its open trigger); while set, a highlight doesn't open the
   * submenu. Cleared when the trigger loses the highlight.
   */
  readonly suppressAutoOpen: { current: boolean }
  /**
   * The submenu should open or close. Returns whether it is open afterwards:
   * a disabled or controlled submenu, or a canceled change, can refuse.
   */
  readonly onOpenChange: (
    open: boolean,
    reason: SubmenuOpenChangeReason,
  ) => boolean
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
  /** The submenu opened or closed, whatever did it. */
  | { readonly type: 'open.change'; readonly open: boolean }
  /** The trigger stopped showing (a search hid it). */
  | { readonly type: 'hide' }

export interface SubmenuSnapshot {
  readonly state: SubmenuState
}

/** How long a hit holds the aim guard, and how long its moves are tracked. */
const GUARD_MS = 600

/**
 * When a submenu opens and closes: hover and keyboard delays, the aim guard
 * on a pointer leaving toward the popup, the close delay, and a sibling's
 * highlight. It decides; the binding applies its decisions (`onOpenChange`,
 * `onHighlight`) and tells it what happened (`send`). Subscribers hear of a
 * new state once per event or timer.
 */
export class SubmenuController {
  readonly #options: SubmenuControllerOptions
  readonly #clock: Clock
  readonly #listeners = new Set<() => void>()
  #settings: SubmenuSettings
  #state: SubmenuState = 'idle'
  #snapshot: SubmenuSnapshot = { state: 'idle' }
  #depth = 0
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
    if (this.#snapshot.state !== this.#state) {
      this.#snapshot = { state: this.#state }
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
   * Stops its timers and tracking and releases its guard, without deciding
   * anything. It takes events again afterwards.
   */
  dispose() {
    this.#run(() => this.#toIdle())
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
        if (this.#isOpen()) this.#options.suppressAutoOpen.current = true
        return
      case 'key':
        this.#stopTracking()
        this.#open(REASONS.listNavigation, 'open')
        return
      case 'highlight':
        return this.#highlight(event.highlighted, event.keyboard)
      case 'sibling.highlight':
        if (this.#isOpen()) return this.#close(REASONS.siblingOpen)
        return this.#cancelPending()
      case 'parent.close':
        return this.#cancelPending()
      case 'open.change':
        return this.#openChange(event.open)
      case 'hide':
        if (this.#isOpen()) return this.#close(REASONS.none)
        return this.#toIdle()
    }
  }

  #pointerEnter() {
    const { aimGuard, suppressAutoOpen } = this.#options
    if (aimGuard.isBlocked()) return
    aimGuard.show('hover')
    this.#options.onHighlight()
    if (!this.#settings.openOnHighlight || suppressAutoOpen.current) return

    this.#stopTracking()
    aimGuard.release()
    this.#clearTimer()
    if (this.#isOpen()) {
      this.#set('open')
      return
    }
    this.#scheduleOpen(this.#settings.delay.pointer, REASONS.triggerHover)
  }

  #pointerMove() {
    const { aimGuard, suppressAutoOpen } = this.#options
    if (aimGuard.isBlocked()) return
    this.#options.onHighlight()
    if (!this.#settings.openOnHighlight || this.#isOpen()) return
    if (suppressAutoOpen.current) return

    this.#stopTracking()
    const ms = this.#settings.delay.pointer
    if (ms > 0 && this.#state === 'open-pending') return
    this.#scheduleOpen(ms, REASONS.triggerHover)
  }

  #pointerLeave(point: Point) {
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
      const opened = this.#guard()
      aimGuard.show(opened ? 'hit' : 'none')
      if (opened) this.#startTracking(GUARD_MS)
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
      if (guarded) this.#set('open')
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
    const opened = this.#guard()
    aimGuard.show(opened ? 'hit' : 'none')
    if (opened) this.#timeTracking(GUARD_MS)
  }

  #highlight(highlighted: boolean, keyboard: boolean) {
    this.#highlighted = highlighted
    this.#keyboardHighlight = keyboard
    const { suppressAutoOpen } = this.#options
    if (!highlighted) suppressAutoOpen.current = false
    if (!this.#settings.openOnHighlight || !highlighted || !keyboard) {
      // Whatever started the open delay: a keyboard highlight's, or a
      // pointer's that a move restarts.
      return this.#cancelPending()
    }
    if (suppressAutoOpen.current || this.#isOpen()) return
    this.#clearTimer()
    this.#scheduleOpen(this.#settings.delay.keyboard, REASONS.listNavigation)
  }

  #openChange(open: boolean) {
    if (open) {
      if (!this.#isOpen()) {
        this.#clearTimer()
        this.#set('open')
      }
      return
    }
    if (this.#isOpen()) this.#toIdle()
  }

  /** The pointer reached the popup: nothing pending closes it. */
  #settle() {
    if (this.#state === 'close-pending') this.#clearTimer()
    this.#stopTracking()
    if (this.#isOpen()) this.#set('open')
  }

  /** The pointer is leaving without aiming at the popup. */
  #missed() {
    if (!this.#isOpen()) {
      this.#stopTracking()
      return
    }
    const { closeDelay, closeOnPointerLeave } = this.#settings
    if (!closeOnPointerLeave) {
      this.#stopTracking()
      this.#set('open')
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

  /** The pointer aims at the popup: guard the trigger's highlight, open. */
  #guard(): boolean {
    this.#options.aimGuard.hold(GUARD_MS)
    this.#options.onHighlight()
    return this.#open(REASONS.triggerHover, 'guarded')
  }

  #scheduleOpen(ms: number, reason: SubmenuOpenChangeReason) {
    if (ms <= 0) {
      this.#open(reason, 'open')
      return
    }
    const keyboard = reason === REASONS.listNavigation
    this.#timer = this.#clock.setTimeout(() => {
      this.#timer = null
      this.#run(() => {
        // A keyboard delay outlives an explicit close made while it ran.
        if (keyboard && this.#options.suppressAutoOpen.current) {
          this.#set('idle')
          return
        }
        this.#open(reason, 'open')
      })
    }, ms)
    this.#set('open-pending')
  }

  #cancelPending() {
    if (this.#state !== 'open-pending') return
    this.#clearTimer()
    this.#set('idle')
  }

  /** Opens the submenu as `next`; back to idle if it refuses. */
  #open(reason: SubmenuOpenChangeReason, next: 'open' | 'guarded'): boolean {
    const wasOpen = this.#isOpen()
    this.#clearTimer()
    this.#set(next)
    if (wasOpen) return true
    if (this.#options.onOpenChange(true, reason)) return true
    this.#toIdle()
    return false
  }

  /** Closes the submenu; still open if it refuses. */
  #close(reason: SubmenuOpenChangeReason) {
    this.#toIdle()
    if (this.#options.onOpenChange(false, reason)) this.#set('open')
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
        if (this.#state === 'guarded') this.#set('open')
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

  #isOpen() {
    const state = this.#state
    return state === 'open' || state === 'guarded' || state === 'close-pending'
  }

  #set(state: SubmenuState) {
    this.#state = state
  }

  /** Runs `fn`, then tells subscribers once if the state changed. */
  #run(fn: () => void) {
    const before = this.#state
    this.#depth++
    try {
      fn()
    } finally {
      this.#depth--
    }
    if (this.#depth > 0 || this.#state === before) return
    for (const listener of this.#listeners) listener()
  }
}
