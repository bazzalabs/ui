import { type Clock, type ClockHandle, realClock } from '../platform/clock.js'

// ============================================================================
// Types
// ============================================================================

/** How a pointer drag treats rows the pointer moves back over. */
export type DragSelectionMode = 'keep' | 'rubber-band'

/** The kind of gesture that owns the current preview. */
export type SelectionGestureKind = 'drag' | 'keyboard'

/** The checkbox group that owns a row's checked state. */
export interface SelectionRowOwner<Reason extends string = string> {
  /** The group's id; rows sharing an id are committed together. */
  id: string
  /** The group's committed value. */
  getValue: () => string[]
  /** Replace the group's value. Returns `false` when the consumer cancelled it. */
  setValue: (value: string[], reason: Reason, event?: Event) => boolean
}

/** A checkbox row the controller can select. */
export interface SelectionRow<Reason extends string = string> {
  /** Registration id (the id the surface navigates by). */
  id: string
  /** The row's `value`: the key inside its checkbox group's value array. */
  value: string
  /** The owning checkbox group, or `null` for a standalone row. */
  owner: SelectionRowOwner<Reason> | null
  /** Committed checked state (never the preview). */
  getChecked: () => boolean
  /**
   * Commit path for a standalone row. Returns `false` when the consumer
   * cancelled the change. Not called for group-owned rows.
   */
  commit: (checked: boolean, reason: Reason, event?: Event) => boolean
}

export interface SelectionGesture {
  kind: SelectionGestureKind
  /** The row the gesture started on. */
  startId: string
  /** The checked state every row in the span is set to (the start row's new state). */
  target: boolean
  mode: DragSelectionMode
  /** The row the gesture currently extends to. */
  currentId: string
  /** Every row reached so far, in the order first reached (keep mode). */
  reached: string[]
}

/** Outcome of a commit, for announcements. */
export interface SelectionCommitResult {
  /** Number of rows whose checked state changed (cancelled changes excluded). */
  count: number
  /** The state those rows were set to. */
  checked: boolean
}

export interface SelectionGestureSnapshot {
  /** The checkbox row of the latest interaction in this surface. */
  readonly anchorId: string | null
  /** The active gesture, if any. Its preview lives in `SelectionPreview`. */
  readonly gesture: SelectionGesture | null
  /**
   * Latest announcement for the surface's status region; `key` increments
   * per announcement so identical texts still mutate the region.
   */
  readonly announcement: { text: string; key: number } | null
}

/** Where the surface's rows and scroll area are, as the platform lays them out. */
export interface SelectionGestureLayout {
  /** The top edge of a row, or `null` while it isn't mounted. */
  rowTop(id: string): number | null
  /** The scroll area's edges, or `null` when the surface has none. */
  scrollArea(): {
    readonly top: number
    readonly bottom: number
    readonly height: number
  } | null
  /** Scrolls the area by `delta`; returns whether it moved. */
  scrollBy(delta: number): boolean
}

/**
 * Where a gesture's preview lives (the surface's store, which rows read it
 * from): the rows, by registration id, the gesture reached and would change,
 * each showing the gesture's target (the opposite of its committed state)
 * until it commits. The controller is the only writer.
 */
export interface SelectionPreview {
  get(): ReadonlySet<string>
  set(preview: ReadonlySet<string>): void
}

export interface SelectionGestureOptions<Reason extends string = string> {
  /** The surface's enabled, visible rows, in navigation order (its `navOrder`). */
  getNavOrder: () => readonly string[]
  readonly layout: SelectionGestureLayout
  readonly preview: SelectionPreview
  /** Moves the surface's highlight to a row a drag reached. */
  highlight: (id: string) => void
  /** The reason a pointer drag commits with. */
  readonly dragReason: Reason
  readonly clock?: Clock
}

/** A pointer press on a checkbox row. */
export interface SelectionPress {
  /** The pressed row's registration id. */
  id: string
  mode: DragSelectionMode
  clientY: number
}

/** What the platform does for a press: its listeners and pointer capture. */
export interface SelectionPressBinding {
  /** The press ended or was cancelled: stop listening, release the pointer. */
  release(): void
  /**
   * A drag was cancelled while the pointer may still be down: call
   * `onRelease` once it's released, so the click it fires is suppressed.
   * Returns a cleanup that stops waiting.
   */
  awaitRelease(onRelease: () => void): () => void
}

interface Press extends SelectionPress {
  readonly binding: SelectionPressBinding
  /** True once the pointer has reached a row other than the pressed one. */
  dragging: boolean
  lastClientY: number
}

const AUTO_SCROLL_ZONE_PX = 32
const AUTO_SCROLL_MAX_STEP_PX = 16

const pluralRules = new Intl.PluralRules('en')

/** Default English announcement, e.g. "3 items checked" / "1 item unchecked". */
function defaultSelectionText(count: number, checked: boolean): string {
  const noun = pluralRules.select(count) === 'one' ? 'item' : 'items'
  return `${count} ${noun} ${checked ? 'checked' : 'unchecked'}`
}

const INITIAL_SNAPSHOT: SelectionGestureSnapshot = {
  anchorId: null,
  gesture: null,
  announcement: null,
}

const NO_PREVIEW: ReadonlySet<string> = new Set()

// ============================================================================
// Controller
// ============================================================================

/**
 * Range and drag selection over one surface's checkbox rows: the registered
 * rows, the anchor, the active gesture (a pointer drag or a keyboard span)
 * and the rows it would change, which it previews (written to `preview`,
 * where rows read it), the commit that applies it
 * (one `setValue` per checkbox group, one `commit` per standalone row, in
 * navigation order), the announcement for it, the click a drag's release
 * fires, and auto-scroll while a drag holds the pointer past an edge. Spans
 * follow the surface's navigation order, not the DOM. One per surface, so a
 * gesture never crosses a surface.
 *
 * It reads layout and scrolls through `layout`, and times the click
 * suppression and auto-scroll frames on its clock; the binding owns the
 * pointer listeners and capture (`SelectionPressBinding`).
 */
export class SelectionGestureController<Reason extends string = string> {
  readonly #options: SelectionGestureOptions<Reason>
  readonly #clock: Clock
  readonly #listeners = new Set<() => void>()
  #snapshot: SelectionGestureSnapshot = INITIAL_SNAPSHOT
  #rows = new Map<string, SelectionRow<Reason>>()
  #warnedUnmounted = false
  #press: Press | null = null
  #suppressClick = false
  #suppressTimer: ClockHandle | null = null
  /** Waits for the release of drags that were cancelled. */
  readonly #releaseWaits = new Set<() => void>()
  #disposed = false
  #autoScrollFrame: ClockHandle | null = null
  #autoScrollVelocity = 0
  #formatAnnouncement: ((count: number, checked: boolean) => string) | undefined

  constructor(options: SelectionGestureOptions<Reason>) {
    this.#options = options
    this.#clock = options.clock ?? realClock
  }

  getSnapshot(): SelectionGestureSnapshot {
    return this.#snapshot
  }

  /** `listener` is told once per change to the snapshot. */
  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  /** Drops whatever is in flight and starts over, with no rows. */
  reset() {
    this.cancelPress()
    this.cancelGesture()
    this.#rows = new Map()
    this.#warnedUnmounted = false
    this.#press = null
    this.#suppressClick = false
    this.#stopAutoScroll()
    this.#formatAnnouncement = undefined
    this.#setPreview(NO_PREVIEW)
    this.#set(INITIAL_SNAPSHOT)
  }

  /**
   * Ends the controller: any press and gesture end without a commit, and
   * nothing it started stays behind (no frame, timer or release wait). Later
   * rows are ignored, so no press can start on one.
   */
  dispose() {
    if (this.#disposed) return
    this.#disposed = true
    this.#stopAutoScroll()
    const press = this.#press
    this.#press = null
    press?.binding.release()
    for (const stop of this.#releaseWaits) stop()
    this.#releaseWaits.clear()
    this.#clearClickSuppression()
    this.#rows = new Map()
    this.cancelGesture()
    this.#listeners.clear()
  }

  // --------------------------------------------------------------------------
  // Rows and anchor
  // --------------------------------------------------------------------------

  registerRow(row: SelectionRow<Reason>): () => void {
    if (this.#disposed) return () => {}
    this.#rows.set(row.id, row)
    return () => {
      if (this.#rows.get(row.id) === row) this.#rows.delete(row.id)
    }
  }

  /** Whether `id` is a registered row that is currently visible and enabled. */
  isSelectableRow(id: string): boolean {
    return this.#rows.has(id) && this.#options.getNavOrder().includes(id)
  }

  setAnchor(id: string | null) {
    this.#set({ anchorId: id })
  }

  /** The anchor if it is still a selectable row, else `null`. */
  getUsableAnchor(): string | null {
    const anchor = this.#snapshot.anchorId
    return anchor !== null && this.isSelectableRow(anchor) ? anchor : null
  }

  /**
   * Every row between `fromId` and `toId` in navigation order, inclusive,
   * regardless of row kind. Empty when either isn't in it.
   */
  #computeSpan(fromId: string, toId: string): string[] {
    const ids = this.#options.getNavOrder()
    const from = ids.indexOf(fromId)
    const to = ids.indexOf(toId)
    if (from === -1 || to === -1) return []
    const [start, end] = from <= to ? [from, to] : [to, from]
    return ids.slice(start, end + 1)
  }

  // --------------------------------------------------------------------------
  // Gestures (preview, then one commit)
  // --------------------------------------------------------------------------

  /**
   * Starts a gesture on `startId`. The target is the start row's new state.
   * Does nothing while a gesture is active or when the row isn't selectable.
   */
  beginGesture(
    kind: SelectionGestureKind,
    startId: string,
    mode: DragSelectionMode,
  ) {
    if (this.#snapshot.gesture) return
    const row = this.#rows.get(startId)
    if (!row || !this.isSelectableRow(startId)) return
    const gesture: SelectionGesture = {
      kind,
      startId,
      target: !row.getChecked(),
      mode,
      currentId: startId,
      reached: [startId],
    }
    this.#setPreview(this.#buildPreview(gesture))
    this.#set({ gesture })
  }

  /** Extends the active gesture to `toId` and rebuilds the preview. */
  extendGesture(toId: string) {
    const gesture = this.#snapshot.gesture
    if (!gesture) return
    const span = this.#computeSpan(gesture.startId, toId)
    if (span.length === 0) return
    const reached =
      gesture.mode === 'keep'
        ? [
            ...gesture.reached,
            ...span.filter((id) => !gesture.reached.includes(id)),
          ]
        : span
    const next: SelectionGesture = { ...gesture, currentId: toId, reached }
    this.#setPreview(this.#buildPreview(next))
    this.#set({ gesture: next })
  }

  /**
   * Commits the active gesture: every row it reached that's still visible and
   * selectable and isn't in its target state now, then clears the preview.
   */
  commitGesture(reason: Reason, event?: Event): SelectionCommitResult {
    const { gesture } = this.#snapshot
    if (!gesture) return { count: 0, checked: false }
    // From the rows it reached as they are now, not the preview: a row
    // changed from outside since the preview was built still commits.
    const changes = new Map<string, boolean>()
    for (const id of this.#buildPreview(gesture)) {
      changes.set(id, gesture.target)
    }
    this.#setPreview(NO_PREVIEW)
    this.#set({ gesture: null, anchorId: gesture.startId })
    const count = this.#commitChanges(changes, reason, event)
    this.announce(count, gesture.target)
    return { count, checked: gesture.target }
  }

  /** Drops the active gesture without committing. */
  cancelGesture() {
    if (!this.#snapshot.gesture) return
    this.#setPreview(NO_PREVIEW)
    this.#set({ gesture: null })
  }

  // --------------------------------------------------------------------------
  // Range selection (immediate commit)
  // --------------------------------------------------------------------------

  /**
   * Toggles `targetId` and sets every selectable row between `anchorId` and
   * it to the same state, committing at once. The target becomes the anchor.
   */
  applyRange(
    anchorId: string,
    targetId: string,
    reason: Reason,
    event?: Event,
  ): SelectionCommitResult {
    const targetRow = this.#rows.get(targetId)
    if (!targetRow) return { count: 0, checked: false }
    const target = !targetRow.getChecked()
    const changes = new Map<string, boolean>()
    // A stale anchor (filtered out, disabled, unmounted) yields an empty span;
    // the target row still toggles as a one-row range.
    const span = this.#computeSpan(anchorId, targetId)
    for (const id of span.length > 0 ? span : [targetId]) {
      const row = this.#rows.get(id)
      if (!row) {
        this.#warnUnmountedRow(id)
        continue
      }
      if (row.getChecked() !== target) changes.set(id, target)
    }
    this.#set({ anchorId: targetId })
    const count = this.#commitChanges(changes, reason, event)
    this.announce(count, target)
    return { count, checked: target }
  }

  // --------------------------------------------------------------------------
  // Pointer drag
  // --------------------------------------------------------------------------

  /**
   * Starts tracking a press on a checkbox row, through `binding`. Nothing
   * changes until the pointer reaches another row (`movePress`). Returns
   * whether it started: not while a press or a gesture is active, nor on a
   * row that isn't selectable.
   */
  beginPress(press: SelectionPress, binding: SelectionPressBinding): boolean {
    if (this.#press || this.#snapshot.gesture) return false
    if (!this.isSelectableRow(press.id)) return false
    this.#press = {
      ...press,
      binding,
      dragging: false,
      lastClientY: press.clientY,
    }
    return true
  }

  /** Whether a press is being tracked (dragging or not). */
  isPressActive(): boolean {
    return this.#press !== null
  }

  /** Whether the tracked press has become a drag. */
  isDragging(): boolean {
    return this.#press?.dragging ?? false
  }

  /** The pointer moved: re-evaluates the row under it and extends the drag. */
  movePress(clientY: number) {
    const press = this.#press
    if (!press) return
    press.lastClientY = clientY
    const area = this.#options.layout.scrollArea()
    // Clamp to the scroll area so a pointer past its edge only reaches rows
    // as they scroll in (a zero-height area means no layout; skip).
    const hasArea = area !== null && area.height > 0
    const clampedY = hasArea
      ? Math.min(Math.max(clientY, area.top), area.bottom - 1)
      : clientY
    const pastEdge = hasArea && (clientY < area.top || clientY >= area.bottom)
    const rowId = this.#resolveRowAtY(clampedY)
    if (rowId === null) return
    if (!press.dragging) {
      // Still on the pressed row: not a drag yet, unless the pointer left the
      // list through an edge (then the drag starts so auto-scroll can run).
      if (rowId === press.id && !pastEdge) return
      press.dragging = true
      this.beginGesture('drag', press.id, press.mode)
      if (!this.#snapshot.gesture) {
        this.cancelPress()
        return
      }
    }
    this.extendGesture(rowId)
    this.#options.highlight(rowId)
    this.#updateAutoScroll(clientY)
  }

  /** The pointer was released: commits a drag, or leaves a press as a click. */
  endPress(clientY: number, event?: Event) {
    const press = this.#press
    if (!press) return
    // A release on another row the pointer reached without a move event
    // (a fast flick) still counts as reaching it.
    this.movePress(clientY)
    if (this.#press !== press) return
    this.#press = null
    // After the final move, so the frame it may have scheduled is dropped too.
    this.#stopAutoScroll()
    press.binding.release()
    if (!press.dragging) return
    this.commitGesture(this.#options.dragReason, event)
    this.#armClickSuppression()
  }

  /** Cancels the tracked press and, if it had become a drag, its preview. */
  cancelPress() {
    this.#stopAutoScroll()
    const press = this.#press
    if (!press) return
    this.#press = null
    press.binding.release()
    if (!press.dragging) return
    this.cancelGesture()
    // The pointer may still be down; suppress the click the eventual release
    // fires, not just clicks within the next tick.
    const stop = press.binding.awaitRelease(() => {
      this.#releaseWaits.delete(stop)
      this.#armClickSuppression()
    })
    this.#releaseWaits.add(stop)
    this.#armClickSuppression()
  }

  /**
   * Returns true once, right after a drag ended, so the click the browser
   * fires after the release doesn't toggle the pressed row again.
   */
  consumeClickSuppression(): boolean {
    const suppressed = this.#suppressClick
    this.#suppressClick = false
    return suppressed
  }

  /** The row under a vertical position, clamped to the first and last mounted rows. */
  #resolveRowAtY(clientY: number): string | null {
    let current: string | null = null
    for (const id of this.#options.getNavOrder()) {
      const top = this.#options.layout.rowTop(id)
      if (top === null) continue
      if (current === null || clientY >= top) current = id
      else break
    }
    return current
  }

  // --------------------------------------------------------------------------
  // Announcements
  // --------------------------------------------------------------------------

  setAnnouncementFormatter(
    formatter: ((count: number, checked: boolean) => string) | undefined,
  ) {
    this.#formatAnnouncement = formatter
  }

  /** Queues an announcement of a commit; none for zero changes. */
  announce(count: number, checked: boolean) {
    if (count === 0) return
    const text =
      this.#formatAnnouncement?.(count, checked) ??
      defaultSelectionText(count, checked)
    const key = (this.#snapshot.announcement?.key ?? 0) + 1
    this.#set({ announcement: { text, key } })
  }

  /** Drops the pending announcement (the surface is no longer active). */
  clearAnnouncement() {
    if (this.#snapshot.announcement !== null) this.#set({ announcement: null })
  }

  // --------------------------------------------------------------------------
  // Internals
  // --------------------------------------------------------------------------

  #set(changes: Partial<SelectionGestureSnapshot>) {
    const current = this.#snapshot
    let changed = false
    for (const key in changes) {
      const field = key as keyof SelectionGestureSnapshot
      if (changes[field] !== current[field]) changed = true
    }
    if (!changed) return
    this.#snapshot = { ...current, ...changes }
    for (const listener of this.#listeners) listener()
  }

  /** Writes the preview, unless it stays empty. */
  #setPreview(preview: ReadonlySet<string>) {
    const { preview: sink } = this.#options
    if (preview.size === 0 && sink.get().size === 0) return
    sink.set(preview)
  }

  #armClickSuppression() {
    this.#clearClickSuppression()
    this.#suppressClick = true
    this.#suppressTimer = this.#clock.setTimeout(() => {
      this.#suppressTimer = null
      this.#suppressClick = false
    }, 0)
  }

  #clearClickSuppression() {
    if (this.#suppressTimer !== null) {
      this.#clock.clearTimeout(this.#suppressTimer)
      this.#suppressTimer = null
    }
    this.#suppressClick = false
  }

  /** Recomputes the auto-scroll velocity for the pointer and keeps the frame loop going. */
  #updateAutoScroll(clientY: number) {
    const area = this.#options.layout.scrollArea()
    if (!this.#press?.dragging || !area) {
      this.#stopAutoScroll()
      return
    }
    const topEdge = area.top + AUTO_SCROLL_ZONE_PX
    const bottomEdge = area.bottom - AUTO_SCROLL_ZONE_PX
    let velocity = 0
    if (clientY < topEdge) {
      velocity = -Math.min(1, (topEdge - clientY) / AUTO_SCROLL_ZONE_PX)
    } else if (clientY > bottomEdge) {
      velocity = Math.min(1, (clientY - bottomEdge) / AUTO_SCROLL_ZONE_PX)
    }
    this.#autoScrollVelocity = velocity
    if (velocity === 0) {
      this.#stopAutoScroll()
      return
    }
    if (this.#autoScrollFrame === null) this.#scheduleAutoScrollFrame()
  }

  #scheduleAutoScrollFrame() {
    this.#autoScrollFrame = this.#clock.requestFrame(() => {
      this.#autoScrollFrame = null
      const press = this.#press
      const velocity = this.#autoScrollVelocity
      if (!press?.dragging || velocity === 0) return
      // At least one whole pixel per frame, so a slow ramp still moves.
      const step =
        Math.sign(velocity) *
        Math.max(1, Math.round(Math.abs(velocity) * AUTO_SCROLL_MAX_STEP_PX))
      if (!this.#options.layout.scrollBy(step)) {
        // Reached the end of the list; wait for the pointer to move again.
        this.#autoScrollVelocity = 0
        return
      }
      this.movePress(press.lastClientY)
    })
  }

  #stopAutoScroll() {
    if (this.#autoScrollFrame !== null) {
      this.#clock.cancelFrame(this.#autoScrollFrame)
      this.#autoScrollFrame = null
    }
    this.#autoScrollVelocity = 0
  }

  /** The rows the gesture reached that it would change (it pends only those). */
  #buildPreview(gesture: SelectionGesture): Set<string> {
    const preview = new Set<string>()
    const visible = new Set(this.#options.getNavOrder())
    for (const id of gesture.reached) {
      if (!visible.has(id)) continue
      const row = this.#rows.get(id)
      if (!row) {
        this.#warnUnmountedRow(id)
        continue
      }
      if (row.getChecked() !== gesture.target) preview.add(id)
    }
    return preview
  }

  /**
   * A row in the navigation order with no registration and no mounted
   * element is a virtualized row that isn't mounted; it can't join a span.
   * Warns once per surface in development.
   */
  #warnUnmountedRow(id: string) {
    if (this.#warnedUnmounted) return
    if (process.env.NODE_ENV === 'production') return
    if (this.#options.layout.rowTop(id) !== null) return
    this.#warnedUnmounted = true
    console.warn(
      `PopupMenu: range or drag selection skipped the unmounted row "${id}". Rows that are not mounted (virtualized lists) cannot be part of a span; keep them mounted or use a checkbox group.`,
    )
  }

  /**
   * Applies `changes` (registration id → next checked) in navigation order:
   * one `setValue` per checkbox group, where that group's first changed row
   * sits; one `commit` per standalone row. Returns the number of rows whose
   * change was accepted.
   */
  #commitChanges(
    changes: Map<string, boolean>,
    reason: Reason,
    event?: Event,
  ): number {
    if (changes.size === 0) return 0
    const orderedIds = this.#options
      .getNavOrder()
      .filter((id) => changes.has(id))
    const entriesByOwner = new Map<
      string,
      Array<{ value: string; checked: boolean }>
    >()
    for (const id of orderedIds) {
      const row = this.#rows.get(id)
      const checked = changes.get(id)
      if (!row?.owner || checked === undefined) continue
      const list = entriesByOwner.get(row.owner.id) ?? []
      list.push({ value: row.value, checked })
      entriesByOwner.set(row.owner.id, list)
    }
    const emittedOwners = new Set<string>()
    let count = 0
    for (const id of orderedIds) {
      const row = this.#rows.get(id)
      const checked = changes.get(id)
      if (!row || checked === undefined) continue
      if (row.owner === null) {
        if (row.commit(checked, reason, event)) count += 1
        continue
      }
      if (emittedOwners.has(row.owner.id)) continue
      emittedOwners.add(row.owner.id)
      const entries = entriesByOwner.get(row.owner.id) ?? []
      const current = row.owner.getValue()
      const removed = new Set(
        entries.filter((entry) => !entry.checked).map((entry) => entry.value),
      )
      const added = entries
        .filter((entry) => entry.checked && !current.includes(entry.value))
        .map((entry) => entry.value)
      const next = [...current.filter((value) => !removed.has(value)), ...added]
      if (row.owner.setValue(next, reason, event)) count += entries.length
    }
    return count
  }
}
