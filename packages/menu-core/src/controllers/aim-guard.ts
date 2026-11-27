import {
  type AnchorSide,
  getSmoothedHeading,
  resolveAnchorSide,
  willHitSubmenu,
} from '../aim-guard/aim-guard.js'
import { type Clock, type ClockHandle, realClock } from '../platform/clock.js'
import type {
  Point,
  SubmenuAim,
  SubmenuAimDecision,
  SubmenuAimGuard,
} from './submenu.js'

/** Who holds a tree's aim guard, if anyone. */
export interface AimGuardState {
  readonly active: boolean
  /** The submenu trigger that holds it. */
  readonly triggerId: string | null
  /** The depth of the menu that trigger is in: its rows don't take the pointer. */
  readonly depth: number | null
  /** The surface of the submenu the pointer is heading to. */
  readonly submenuSurfaceId: string | null
}

/** Pointer moves, as the platform delivers them. */
export interface AimGuardPointer {
  /**
   * Calls `onMove` with every pointer move, and whether a mouse (or a pen,
   * which some platforms report a mouse as) made it, until the returned stop.
   */
  listen(onMove: (point: Point, mouseLike: boolean) => void): () => void
}

/**
 * A log line: `tree` for the guard's own events, `trigger` for one submenu
 * trigger's reading of the pointer. `details` is called only to log.
 */
export type AimGuardLog = (
  scope: 'tree' | 'trigger',
  event: string,
  details: () => Record<string, unknown>,
) => void

/** The debug overlay's settings that decide what it shows, and for how long. */
export interface AimGuardDebugSettings {
  readonly enabled: boolean
  /** An activated triangle keeps the rects and point the pointer left with. */
  readonly freezeOnPointerLeave: boolean
  /** An activated triangle stays after the guard is released. */
  readonly persistOnSuccess: boolean
  readonly showMissState: boolean
  /** How long a missed triangle shows; 0 hides it at once. */
  readonly missFreezeDuration: number
}

export interface AimGuardControllerOptions {
  readonly pointer: AimGuardPointer
  readonly clock?: Clock
  readonly log?: AimGuardLog
  /** Read each time the overlay decides; omitted, it never shows. */
  readonly getDebugSettings?: () => AimGuardDebugSettings
}

/** What a trigger reads the pointer against. */
export interface AimGuardTriggerOptions {
  readonly triggerId: string
  /** The depth of the menu the trigger is in. */
  readonly depth: number
  /** The surface of the submenu the trigger opens. */
  readonly submenuSurfaceId: string
  readonly getPopupRect: () => DOMRect | null
  readonly getTriggerRect: () => DOMRect | null
  /** More fields for the trigger's log lines. */
  readonly logDetails?: () => Record<string, unknown>
}

/** What a leave or an exit move read. */
export interface AimGuardReading {
  readonly popupRect: DOMRect
  readonly triggerRect: DOMRect | null
  readonly point: Point
}

export type AimGuardDebugTone = 'hover' | 'activated' | 'missed'

/** The safe triangle a debug overlay draws for one trigger. */
export interface AimGuardDebugSnapshot {
  readonly tone: AimGuardDebugTone
  /** The reading to draw, frozen; null to follow the live rects and pointer. */
  readonly frozen: AimGuardReading | null
}

const IDLE: AimGuardState = {
  active: false,
  triggerId: null,
  depth: null,
  submenuSurfaceId: null,
}

const TRAIL_LENGTH = 4

/**
 * The one way a trigger reaches its tree: the tree's guard, held and read
 * for a trigger and depth, its pointer, trails, popup reports and settings.
 */
interface TreeLink {
  readonly clock: Clock
  getSnapshot(): AimGuardState
  subscribe(listener: () => void): () => void
  hold(
    triggerId: string,
    depth: number,
    submenuSurfaceId: string,
    timeoutMs: number,
  ): void
  /** Releases the guard, whoever holds it. */
  release(): void
  /** Releases the guard if `triggerId` at `depth` holds it. */
  releaseFor(triggerId: string, depth: number): void
  isHeldBy(triggerId: string, depth: number): boolean
  /** Whether another trigger at `depth` holds the guard. */
  blocks(triggerId: string, depth: number): boolean
  log(
    scope: 'tree' | 'trigger',
    event: string,
    details: () => Record<string, unknown>,
  ): void
  debugSettings(): AimGuardDebugSettings | null
  pointerListen: AimGuardPointer['listen']
  startTrail(trail: Array<[number, number]>): void
  stopTrail(trail: Array<[number, number]>): void
  onPopupPointer(trigger: AimGuardTrigger, listener: () => void): () => void
}

const sameState = (a: AimGuardState, b: AimGuardState) =>
  a.active === b.active &&
  a.triggerId === b.triggerId &&
  a.depth === b.depth &&
  a.submenuSurfaceId === b.submenuSurfaceId

/**
 * The aim guard of one menu tree (K7): while the pointer leaves a submenu
 * trigger heading for its popup, the trigger holds the guard, and the other
 * rows of its menu, at its depth only, don't take the pointer. It times out
 * by itself. Each submenu trigger reads the pointer, and holds and releases
 * the guard, through its own `AimGuardTrigger` (`trigger()`), which records
 * the pointer's trail only while it is hovered or tracking an exit, and works
 * out its debug overlay only while something listens to it. Rows read who
 * holds it (`getSnapshot`); popups report the pointer over them
 * (`pointerInPopup`).
 */
export class AimGuardController {
  readonly #pointer: AimGuardPointer
  readonly #clock: Clock
  readonly #log: AimGuardLog | undefined
  readonly #getDebugSettings: (() => AimGuardDebugSettings) | undefined
  readonly #listeners = new Set<() => void>()
  readonly #trails = new Set<Array<[number, number]>>()
  readonly #popupListeners = new Set<{
    trigger: AimGuardTrigger
    listener: () => void
  }>()
  readonly #link: TreeLink
  #state: AimGuardState = IDLE
  #timer: ClockHandle | null = null
  #stopTrails: (() => void) | null = null

  constructor(options: AimGuardControllerOptions) {
    this.#pointer = options.pointer
    this.#clock = options.clock ?? realClock
    this.#log = options.log
    this.#getDebugSettings = options.getDebugSettings
    this.#link = {
      clock: this.#clock,
      getSnapshot: () => this.#state,
      subscribe: (listener) => this.subscribe(listener),
      hold: (triggerId, depth, submenuSurfaceId, timeoutMs) =>
        this.#hold(triggerId, depth, submenuSurfaceId, timeoutMs),
      release: () => this.#release(),
      releaseFor: (triggerId, depth) => {
        if (this.#isHeldBy(triggerId, depth)) this.#release()
      },
      isHeldBy: (triggerId, depth) => this.#isHeldBy(triggerId, depth),
      blocks: (triggerId, depth) =>
        this.#state.active &&
        this.#state.depth === depth &&
        this.#state.triggerId !== triggerId,
      log: (scope, event, details) => this.#log?.(scope, event, details),
      debugSettings: () => this.#getDebugSettings?.() ?? null,
      pointerListen: (onMove) => this.#pointer.listen(onMove),
      startTrail: (trail) => this.#startTrail(trail),
      stopTrail: (trail) => this.#stopTrail(trail),
      onPopupPointer: (trigger, listener) => {
        const entry = { trigger, listener }
        this.#popupListeners.add(entry)
        return () => {
          this.#popupListeners.delete(entry)
        }
      },
    }
  }

  /** Who holds the guard; a new object only when that changes. */
  getSnapshot(): AimGuardState {
    return this.#state
  }

  /** Told once each time who holds the guard changes. */
  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  /** A submenu trigger's side of this tree's guard. */
  trigger(options: AimGuardTriggerOptions): AimGuardTrigger {
    return new AimGuardTrigger(this.#link, options)
  }

  /**
   * The pointer is over the popup of the submenu whose surface is
   * `surfaceId`: it reached it, so a guard on the way there is released,
   * and the trigger that opens it hears of it.
   */
  pointerInPopup(surfaceId: string) {
    if (this.#state.active && this.#state.submenuSurfaceId === surfaceId) {
      this.#release()
    }
    for (const { trigger, listener } of this.#popupListeners) {
      if (trigger.submenuSurfaceId === surfaceId) listener()
    }
  }

  /** Stops a pending timeout: the tree unmounted. */
  dispose() {
    this.#clearTimer()
    this.#logTree('provider-unmount-clear')
  }

  #hold(
    triggerId: string,
    depth: number,
    submenuSurfaceId: string,
    timeoutMs: number,
  ) {
    this.#logTree('activate', {
      triggerId,
      depth,
      submenuSurfaceId,
      timeoutMs,
    })
    this.#set({ active: true, triggerId, depth, submenuSurfaceId })
    this.#clearTimer()
    this.#timer = this.#clock.setTimeout(() => {
      this.#timer = null
      this.#logTree('timeout-expired', { triggerId, depth, submenuSurfaceId })
      this.#set(IDLE)
    }, timeoutMs)
  }

  #release() {
    this.#clearTimer()
    this.#logTree('clear')
    this.#set(IDLE)
  }

  #isHeldBy(triggerId: string, depth: number): boolean {
    const state = this.#state
    return (
      state.active && state.triggerId === triggerId && state.depth === depth
    )
  }

  #set(state: AimGuardState) {
    if (sameState(this.#state, state)) return
    this.#state = state
    for (const listener of this.#listeners) listener()
  }

  #logTree(event: string, details?: Record<string, unknown>) {
    this.#log?.('tree', event, () => ({
      aimGuardActive: this.#state.active,
      guardedTriggerId: this.#state.triggerId,
      guardedDepth: this.#state.depth,
      guardedSubmenuSurfaceId: this.#state.submenuSurfaceId,
      ...details,
    }))
  }

  #clearTimer() {
    if (this.#timer === null) return
    this.#clock.clearTimeout(this.#timer)
    this.#timer = null
  }

  // One pointer listener records every trail of the tree that is held.
  #startTrail(trail: Array<[number, number]>) {
    this.#trails.add(trail)
    if (this.#stopTrails) return
    this.#stopTrails = this.#pointer.listen((point) => {
      for (const recording of this.#trails) {
        recording.push([point.x, point.y])
        if (recording.length > TRAIL_LENGTH) recording.shift()
      }
    })
  }

  #stopTrail(trail: Array<[number, number]>) {
    this.#trails.delete(trail)
    trail.length = 0
    if (this.#trails.size > 0 || !this.#stopTrails) return
    const stop = this.#stopTrails
    this.#stopTrails = null
    stop()
  }
}

/** Why a trigger records the pointer's trail. */
export type AimGuardTrailReason = 'hover' | 'monitor'

/** Where the pointer left the trigger, for the moves that follow. */
interface Exit {
  anchor: AnchorSide
  triggerRect: DOMRect | null
  x: number
  y: number
}

const isInside = (rect: DOMRect, x: number, y: number) =>
  x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom

/** The log line for what the controller made of an aim, as it was named. */
function decisionTrace(
  phase: 'leave' | 'track',
  aim: SubmenuAim,
  decision: 'hit' | 'miss',
): string {
  if (phase === 'leave') {
    if (aim.type === 'inside') return 'pointerleave-inside-popup-success'
    return decision === 'hit'
      ? 'pointerleave-hit-activate-guard'
      : 'pointerleave-miss-close'
  }
  if (decision === 'hit') return 'leave-monitor-hit-transition'
  return aim.type === 'outside' && aim.movedAway
    ? 'leave-monitor-reversal-close'
    : 'leave-monitor-miss-transition'
}

/**
 * One submenu trigger's side of its tree's aim guard, the interface its
 * `SubmenuController` takes: the geometry of the pointer leaving the trigger
 * and moving on (against the rects the binding reads), the pointer's trail
 * it reads that from, the guard held for this trigger, and its debug
 * overlay. Made by `AimGuardController.trigger()`.
 */
export class AimGuardTrigger implements SubmenuAimGuard {
  readonly #link: TreeLink
  #options: AimGuardTriggerOptions
  readonly #trail: Array<[number, number]> = []
  readonly #holds = new Set<AimGuardTrailReason>()
  #exit: Exit | null = null
  #last: {
    phase: 'leave' | 'track'
    aim: SubmenuAim
    reading: AimGuardReading | null
  } | null = null
  readonly #debugListeners = new Set<() => void>()
  #debug: AimGuardDebugSnapshot | null = null
  #debugTimer: ClockHandle | null = null
  #stopWatchingGuard: (() => void) | null = null

  constructor(link: TreeLink, options: AimGuardTriggerOptions) {
    this.#link = link
    this.#options = options
  }

  get submenuSurfaceId(): string {
    return this.#options.submenuSurfaceId
  }

  /** Takes the trigger's latest ids and depth. */
  configure(options: AimGuardTriggerOptions) {
    this.#options = options
  }

  /** Records the pointer's trail while any reason holds it. */
  holdTrail(reason: AimGuardTrailReason) {
    const first = this.#holds.size === 0
    this.#holds.add(reason)
    if (first) this.#link.startTrail(this.#trail)
  }

  releaseTrail(reason: AimGuardTrailReason) {
    if (!this.#holds.delete(reason) || this.#holds.size > 0) return
    this.#link.stopTrail(this.#trail)
  }

  /** The pointer is over this trigger's submenu popup. */
  onPopupPointer(listener: () => void): () => void {
    return this.#link.onPopupPointer(this, listener)
  }

  /** Stops recording and hides the overlay; it can be used again. */
  dispose() {
    this.#holds.clear()
    this.#link.stopTrail(this.#trail)
    this.#hideDebug()
  }

  // SubmenuAimGuard

  isBlocked(): boolean {
    return this.#link.blocks(this.#options.triggerId, this.#options.depth)
  }

  leave(point: Point): SubmenuAim {
    const { x: clientX, y: clientY } = point
    this.#trace('pointerleave-submenu-trigger', () => ({ clientX, clientY }))
    const read = (
      aim: SubmenuAim,
      reading: AimGuardReading | null,
    ): SubmenuAim => {
      this.#last = { phase: 'leave', aim, reading }
      return aim
    }

    const popupRect = this.#options.getPopupRect()
    if (!popupRect) {
      this.#trace('pointerleave-no-content-rect')
      return read({ type: 'no-popup' }, null)
    }

    const triggerRect = this.#options.getTriggerRect()
    const reading: AimGuardReading = { popupRect, triggerRect, point }

    // The pointer can already be inside the popup (fast movement,
    // overlapping elements)
    if (isInside(popupRect, clientX, clientY)) {
      return read({ type: 'inside' }, reading)
    }

    const anchor = resolveAnchorSide(popupRect, triggerRect, clientX, clientY)
    // A fast pass can leave a single sample; the leave point gives the
    // heading its second point instead of falling back to aiming at the
    // submenu
    const trail = this.#trail
    const heading = getSmoothedHeading(
      trail.length < 2 ? [...trail, [clientX, clientY]] : trail,
      clientX,
      clientY,
      anchor,
      triggerRect,
      popupRect,
    )
    // An empty trail means the pointer never moved over the trigger: the
    // trigger moved under it (scrolling, a layout shift), so nothing says
    // it is aiming at the submenu
    const hit =
      trail.length > 0 &&
      willHitSubmenu(clientX, clientY, heading, popupRect, anchor, triggerRect)

    this.#trace('pointerleave-hit-eval', () => ({
      anchor,
      hit,
      clientX,
      clientY,
      heading,
    }))

    this.#exit = { anchor, triggerRect, x: clientX, y: clientY }
    return read({ type: 'outside', hit, movedAway: false }, reading)
  }

  track(point: Point): SubmenuAim {
    const popupRect = this.#options.getPopupRect()
    const exit = this.#exit
    if (!popupRect || !exit) {
      this.#trace('leave-monitor-stop-no-content-rect')
      this.#last = null
      return { type: 'no-popup' }
    }

    const { x: clientX, y: clientY } = point
    const { anchor, triggerRect } = exit
    const axisDelta =
      anchor === 'left' || anchor === 'right'
        ? clientX - exit.x
        : clientY - exit.y
    exit.x = clientX
    exit.y = clientY
    const reading: AimGuardReading = { popupRect, triggerRect, point }

    if (isInside(popupRect, clientX, clientY)) {
      this.#trace('leave-monitor-inside-popup', () => ({ clientX, clientY }))
      this.#last = { phase: 'track', aim: { type: 'inside' }, reading }
      return { type: 'inside' }
    }

    const movedAway =
      (anchor === 'left' && axisDelta <= -2) ||
      (anchor === 'right' && axisDelta >= 2) ||
      (anchor === 'top' && axisDelta <= -2) ||
      (anchor === 'bottom' && axisDelta >= 2)

    const heading = getSmoothedHeading(
      this.#trail,
      clientX,
      clientY,
      anchor,
      triggerRect,
      popupRect,
    )
    const hit = willHitSubmenu(
      clientX,
      clientY,
      heading,
      popupRect,
      anchor,
      triggerRect,
    )

    this.#trace('leave-monitor-pointermove', () => ({
      anchor,
      clientX,
      clientY,
      axisDelta,
      movedAway,
      hit,
      heading,
    }))

    const aim: SubmenuAim = { type: 'outside', hit, movedAway }
    this.#last = { phase: 'track', aim, reading }
    return aim
  }

  watch(onMove: (point: Point) => void): () => void {
    this.#trace('leave-monitor-start', () => ({ ...this.#exit }))
    // Keep the trail running for the heading checks. Held before the
    // listener is added, so each move reaches the trail first.
    this.holdTrail('monitor')
    const stop = this.#link.pointerListen((point, mouseLike) => {
      if (mouseLike) onMove(point)
    })
    return () => {
      this.#trace('leave-monitor-cleanup-remove-listener')
      stop()
      this.releaseTrail('monitor')
    }
  }

  hold(timeoutMs: number) {
    const { triggerId, depth, submenuSurfaceId } = this.#options
    this.#link.hold(triggerId, depth, submenuSurfaceId, timeoutMs)
  }

  release() {
    this.#link.release()
  }

  releaseOwn() {
    // Its submenu closed: an activated triangle goes with it
    if (this.#debug?.tone === 'activated') this.#hideDebug()
    this.#link.releaseFor(this.#options.triggerId, this.#options.depth)
  }

  show(decision: SubmenuAimDecision) {
    if (decision === 'hover') {
      this.#trace('pointerenter-submenu-trigger')
      if (this.#debugSettings()) this.#setDebug({ tone: 'hover', frozen: null })
      return
    }

    const last = this.#last
    if (decision === 'none' || !last?.reading) {
      this.#hideDebug()
      return
    }
    this.#trace(decisionTrace(last.phase, last.aim, decision))

    const settings = this.#debugSettings()
    if (!settings) return
    if (decision === 'hit') {
      this.#setDebug({
        tone: 'activated',
        frozen: settings.freezeOnPointerLeave ? last.reading : null,
      })
      // Shown after the guard was held or released for it
      this.#checkActivated()
      return
    }
    if (!settings.showMissState || settings.missFreezeDuration <= 0) {
      this.#hideDebug()
      return
    }
    this.#setDebug({ tone: 'missed', frozen: last.reading })
    this.#debugTimer = this.#link.clock.setTimeout(() => {
      this.#debugTimer = null
      this.#hideDebug()
    }, settings.missFreezeDuration)
  }

  // Debug overlay

  /** The triangle to draw, while something listens; null draws nothing. */
  getDebugSnapshot(): AimGuardDebugSnapshot | null {
    return this.#debug
  }

  /**
   * Listens to the overlay. The overlay is worked out only while something
   * listens, and starts hidden.
   */
  subscribeDebug(listener: () => void): () => void {
    this.#debugListeners.add(listener)
    if (this.#debugListeners.size === 1) {
      this.#stopWatchingGuard = this.#link.subscribe(() =>
        this.#checkActivated(),
      )
    }
    return () => {
      if (!this.#debugListeners.delete(listener)) return
      if (this.#debugListeners.size > 0) return
      this.#stopWatchingGuard?.()
      this.#stopWatchingGuard = null
      this.#hideDebug()
    }
  }

  /** An activated triangle goes once the guard isn't this trigger's. */
  #checkActivated() {
    if (this.#debug?.tone !== 'activated') return
    const settings = this.#debugSettings()
    if (settings?.persistOnSuccess) return
    if (this.#link.isHeldBy(this.#options.triggerId, this.#options.depth)) {
      return
    }
    this.#hideDebug()
  }

  #debugSettings(): AimGuardDebugSettings | null {
    if (this.#debugListeners.size === 0) return null
    const settings = this.#link.debugSettings()
    return settings?.enabled ? settings : null
  }

  #setDebug(snapshot: AimGuardDebugSnapshot) {
    this.#clearDebugTimer()
    this.#debug = snapshot
    for (const listener of this.#debugListeners) listener()
  }

  #hideDebug() {
    this.#clearDebugTimer()
    if (this.#debug === null) return
    this.#debug = null
    for (const listener of this.#debugListeners) listener()
  }

  #clearDebugTimer() {
    if (this.#debugTimer === null) return
    this.#link.clock.clearTimeout(this.#debugTimer)
    this.#debugTimer = null
  }

  #trace(event: string, details?: () => Record<string, unknown>) {
    this.#link.log('trigger', event, () => {
      const state = this.#link.getSnapshot()
      return {
        triggerId: this.#options.triggerId,
        ...this.#options.logDetails?.(),
        parentDepth: this.#options.depth,
        aimGuardActive: state.active,
        guardedTriggerId: state.triggerId,
        guardedDepth: state.depth,
        ...details?.(),
      }
    })
  }
}
