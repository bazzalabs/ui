import { createSelector, ReactStore } from '@base-ui/utils/store'
import { REASONS } from '../../../utils/events/index.js'
import type { SelectionCommitReason } from '../events.js'

// ============================================================================
// Types
// ============================================================================

/** How a pointer drag treats rows the pointer moves back over. */
export type DragSelectionMode = 'keep' | 'rubber-band'

/** The kind of gesture that owns the current preview. */
export type SelectionGestureKind = 'drag' | 'keyboard'

/** What the store needs from the surface's listbox. */
export interface SelectionListbox {
  /** Registration ids of the enabled, visible rows in list order. */
  getVisibleItemIds: () => string[]
  /** The mounted element of a row, or `null` when it is not mounted. */
  getItemElement: (id: string) => HTMLElement | null
  /** The element the list scrolls in, or `null`. */
  getScrollElement: () => HTMLElement | null
  /** Move the highlight to a row (pointer cause). */
  setHighlightedId: (id: string) => void
  /** Subscribe to the surface's open state (controlled or not). Returns an unsubscribe function. */
  observeOpen: (listener: (open: boolean) => void) => () => void
}

/** The checkbox group that owns a row's checked state. */
export interface CheckboxRowOwner {
  /** The group's id; rows sharing an id are committed together. */
  id: string
  /** The group's committed value. */
  getValue: () => string[]
  /** Replace the group's value. Returns `false` when the consumer cancelled it. */
  setValue: (
    value: string[],
    reason: SelectionCommitReason,
    event?: Event,
  ) => boolean
}

/** A checkbox item registered with the store. */
export interface CheckboxRowRegistration {
  /** Registration id (the id the listbox uses in `getVisibleItemIds`). */
  id: string
  /** The item's `value` — the key inside its checkbox group's value array. */
  value: string
  /** The owning checkbox group, or `null` for a standalone item. */
  owner: CheckboxRowOwner | null
  /** Committed checked state (never the preview). */
  getChecked: () => boolean
  /**
   * Commit path for a standalone item. Returns `false` when the consumer
   * cancelled the change. Not called for group-owned rows.
   */
  commit: (
    checked: boolean,
    reason: SelectionCommitReason,
    event?: Event,
  ) => boolean
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

export interface PointerPressParams {
  /** The pressed row's registration id. */
  id: string
  pointerId: number
  /** The pressed row's element; receives pointer capture. */
  element: HTMLElement
  mode: DragSelectionMode
  clientY: number
}

interface PointerPress extends PointerPressParams {
  /** True once the pointer has reached a row other than the pressed one. */
  dragging: boolean
  lastClientY: number
  cleanup: () => void
}

/** Outcome of a commit, for announcements. */
export interface SelectionCommitResult {
  /** Number of rows whose checked state changed (cancelled changes excluded). */
  count: number
  /** The state those rows were set to. */
  checked: boolean
}

export interface CheckboxSelectionState {
  /** The checkbox item of the latest interaction in this surface. */
  anchorId: string | null
  /** The active gesture, if any. */
  gesture: SelectionGesture | null
  /** Preview overrides by registration id while a gesture is active. */
  preview: ReadonlyMap<string, boolean>
}

export interface CheckboxSelectionContext {
  listbox: SelectionListbox
  rows: Map<string, CheckboxRowRegistration>
  /** Whether the unmounted-row warning has been shown for this surface. */
  warnedUnmounted: boolean
  press: PointerPress | null
  suppressClick: boolean
  autoScrollFrame: number | null
  autoScrollVelocity: number
}

// ============================================================================
// Selectors
// ============================================================================

const selectors = {
  anchorId: createSelector((state: CheckboxSelectionState) => state.anchorId),
  gesture: createSelector((state: CheckboxSelectionState) => state.gesture),
  isGestureActive: createSelector(
    (state: CheckboxSelectionState) => state.gesture !== null,
  ),
  /** The preview for a row, or `undefined` when the row has no preview. */
  getPreview: createSelector((state: CheckboxSelectionState, id: string) =>
    state.preview.get(id),
  ),
}

const AUTO_SCROLL_ZONE_PX = 32
const AUTO_SCROLL_MAX_STEP_PX = 16

// ============================================================================
// Store
// ============================================================================

/**
 * Owns range selection and drag selection state for one surface: the
 * registered checkbox rows, the anchor, the active gesture, and the preview
 * of checked states. One instance per surface, so a gesture never crosses a
 * surface.
 */
export class CheckboxSelectionStore extends ReactStore<
  CheckboxSelectionState,
  CheckboxSelectionContext,
  typeof selectors
> {
  constructor(listbox: SelectionListbox) {
    super(
      { anchorId: null, gesture: null, preview: new Map() },
      {
        listbox,
        rows: new Map(),
        warnedUnmounted: false,
        press: null,
        suppressClick: false,
        autoScrollFrame: null,
        autoScrollVelocity: 0,
      },
      selectors,
    )
  }

  /**
   * Subscribe to the surface's open state so closing the menu cancels any
   * press or gesture. Call from an effect; returns the cleanup, which also
   * cancels whatever is in flight.
   */
  attach(): () => void {
    const unsubscribe = this.context.listbox.observeOpen((open) => {
      if (!open) {
        this.cancelPress()
        this.cancelGesture()
      }
    })
    return () => {
      unsubscribe()
      this.cancelPress()
      this.cancelGesture()
    }
  }

  // --------------------------------------------------------------------------
  // Registration
  // --------------------------------------------------------------------------

  registerRow(registration: CheckboxRowRegistration): () => void {
    this.context.rows.set(registration.id, registration)
    return () => {
      if (this.context.rows.get(registration.id) === registration) {
        this.context.rows.delete(registration.id)
      }
    }
  }

  /** Whether `id` is a registered checkbox row that is currently visible and enabled. */
  isSelectableRow(id: string): boolean {
    return (
      this.context.rows.has(id) &&
      this.context.listbox.getVisibleItemIds().includes(id)
    )
  }

  // --------------------------------------------------------------------------
  // Anchor
  // --------------------------------------------------------------------------

  setAnchor(id: string | null) {
    this.set('anchorId', id)
  }

  /** The anchor if it is still a selectable row, else `null`. */
  getUsableAnchor(): string | null {
    const anchor = this.state.anchorId
    return anchor !== null && this.isSelectableRow(anchor) ? anchor : null
  }

  // --------------------------------------------------------------------------
  // Span
  // --------------------------------------------------------------------------

  /**
   * Every visible row id between `fromId` and `toId` in list order, inclusive,
   * regardless of row kind. Empty when either id is not visible.
   */
  computeSpan(fromId: string, toId: string): string[] {
    const ids = this.context.listbox.getVisibleItemIds()
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
   * Start a gesture on `startId`. The target is the start row's new state.
   * Does nothing when a gesture is already active or the row is not selectable.
   */
  beginGesture(
    kind: SelectionGestureKind,
    startId: string,
    mode: DragSelectionMode,
  ) {
    if (this.state.gesture) return
    const row = this.context.rows.get(startId)
    if (!row || !this.isSelectableRow(startId)) return
    const gesture: SelectionGesture = {
      kind,
      startId,
      target: !row.getChecked(),
      mode,
      currentId: startId,
      reached: [startId],
    }
    this.update({ gesture, preview: this.buildPreview(gesture) })
  }

  /** Extend the active gesture to `toId` and rebuild the preview. */
  extendGesture(toId: string) {
    const gesture = this.state.gesture
    if (!gesture) return
    const span = this.computeSpan(gesture.startId, toId)
    if (span.length === 0) return
    const reached =
      gesture.mode === 'keep'
        ? [
            ...gesture.reached,
            ...span.filter((id) => !gesture.reached.includes(id)),
          ]
        : span
    const next: SelectionGesture = { ...gesture, currentId: toId, reached }
    this.update({ gesture: next, preview: this.buildPreview(next) })
  }

  /** Commit the active gesture's preview as real changes, then clear it. */
  commitGesture(
    reason: SelectionCommitReason,
    event?: Event,
  ): SelectionCommitResult {
    const gesture = this.state.gesture
    if (!gesture) return { count: 0, checked: false }
    const changes = new Map<string, boolean>()
    for (const [id, checked] of this.state.preview) {
      const row = this.context.rows.get(id)
      if (row && row.getChecked() !== checked) changes.set(id, checked)
    }
    this.update({
      gesture: null,
      preview: new Map(),
      anchorId: gesture.startId,
    })
    const count = this.commitChanges(changes, reason, event)
    return { count, checked: gesture.target }
  }

  /** Drop the active gesture without committing. */
  cancelGesture() {
    if (!this.state.gesture) return
    this.update({ gesture: null, preview: new Map() })
  }

  // --------------------------------------------------------------------------
  // Pointer drag
  // --------------------------------------------------------------------------

  /**
   * Start tracking a press on a checkbox row. Nothing changes until the pointer
   * reaches another row; see `handlePressMove`.
   */
  beginPress(params: PointerPressParams) {
    if (this.context.press || this.state.gesture) return
    if (!this.isSelectableRow(params.id)) return
    const doc = params.element.ownerDocument
    const win = doc.defaultView
    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== params.pointerId) return
      this.handlePressMove(event.clientY)
    }
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== params.pointerId) return
      this.endPress(event)
    }
    const onCancel = (event: PointerEvent) => {
      if (event.pointerId !== params.pointerId) return
      this.cancelPress()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (this.context.press?.dragging) {
        event.preventDefault()
        event.stopPropagation()
      }
      this.cancelPress()
    }
    const onBlur = () => this.cancelPress()
    const onLostCapture = () => this.cancelPress()
    doc.addEventListener('pointermove', onMove, true)
    doc.addEventListener('pointerup', onUp, true)
    doc.addEventListener('pointercancel', onCancel, true)
    doc.addEventListener('keydown', onKeyDown, true)
    win?.addEventListener('blur', onBlur)
    params.element.addEventListener('lostpointercapture', onLostCapture)
    const supportsCapture =
      typeof params.element.setPointerCapture === 'function'
    if (supportsCapture) {
      try {
        params.element.setPointerCapture(params.pointerId)
      } catch {
        // The pointer may already be gone; the document listeners still work.
      }
    }
    const cleanup = () => {
      doc.removeEventListener('pointermove', onMove, true)
      doc.removeEventListener('pointerup', onUp, true)
      doc.removeEventListener('pointercancel', onCancel, true)
      doc.removeEventListener('keydown', onKeyDown, true)
      win?.removeEventListener('blur', onBlur)
      params.element.removeEventListener('lostpointercapture', onLostCapture)
      if (
        supportsCapture &&
        typeof params.element.hasPointerCapture === 'function' &&
        params.element.hasPointerCapture(params.pointerId)
      ) {
        params.element.releasePointerCapture(params.pointerId)
      }
    }
    this.context.press = {
      ...params,
      dragging: false,
      lastClientY: params.clientY,
      cleanup,
    }
  }

  /** The row under a vertical pointer position, clamped to the first and last mounted rows. */
  resolveRowAtY(clientY: number): string | null {
    const rows: Array<{ id: string; top: number }> = []
    for (const id of this.context.listbox.getVisibleItemIds()) {
      const element = this.context.listbox.getItemElement(id)
      if (!element) continue
      rows.push({ id, top: element.getBoundingClientRect().top })
    }
    const first = rows[0]
    if (!first) return null
    let current = first.id
    for (const row of rows) {
      if (clientY >= row.top) current = row.id
      else break
    }
    return current
  }

  /** Whether a press is being tracked (dragging or not). */
  isPressActive(): boolean {
    return this.context.press !== null
  }

  /** Returns true once, right after a drag committed, so the click the browser fires after the release does not toggle the pressed row again. */
  consumeClickSuppression(): boolean {
    const suppressed = this.context.suppressClick
    this.context.suppressClick = false
    return suppressed
  }

  /** Cancel the tracked press and, if it had become a drag, its preview. */
  cancelPress() {
    this.stopAutoScroll()
    const press = this.context.press
    if (!press) return
    this.context.press = null
    press.cleanup()
    if (press.dragging) {
      this.cancelGesture()
      // The pointer may still be down; suppress the click the eventual
      // release fires, not just clicks within the next tick.
      const doc = press.element.ownerDocument
      const onRelease = (event: PointerEvent) => {
        if (event.pointerId !== press.pointerId) return
        doc.removeEventListener('pointerup', onRelease, true)
        doc.removeEventListener('pointercancel', onRelease, true)
        this.armClickSuppression()
      }
      doc.addEventListener('pointerup', onRelease, true)
      doc.addEventListener('pointercancel', onRelease, true)
      this.armClickSuppression()
    }
  }

  private armClickSuppression() {
    this.context.suppressClick = true
    setTimeout(() => {
      this.context.suppressClick = false
    }, 0)
  }

  /** Re-evaluate the row under a pointer position and extend the drag to it. */
  private handlePressMove(clientY: number) {
    const press = this.context.press
    if (!press) return
    press.lastClientY = clientY
    const scrollElement = this.context.listbox.getScrollElement()
    const rect = scrollElement?.getBoundingClientRect()
    // Clamp to the scroll element so a pointer past its edge only reaches
    // rows as they scroll in (a zero-height rect means no layout; skip).
    const hasRect = rect !== undefined && rect.height > 0
    const clampedY = hasRect
      ? Math.min(Math.max(clientY, rect.top), rect.bottom - 1)
      : clientY
    const pastEdge = hasRect && (clientY < rect.top || clientY >= rect.bottom)
    const rowId = this.resolveRowAtY(clampedY)
    if (rowId === null) return
    if (!press.dragging) {
      // Still on the pressed row: not a drag yet, unless the pointer left the
      // list through an edge (then the drag starts so auto-scroll can run).
      if (rowId === press.id && !pastEdge) return
      press.dragging = true
      this.beginGesture('drag', press.id, press.mode)
      if (!this.state.gesture) {
        this.cancelPress()
        return
      }
    }
    this.extendGesture(rowId)
    this.context.listbox.setHighlightedId(rowId)
    this.updateAutoScroll(clientY)
  }

  private endPress(event: PointerEvent) {
    const press = this.context.press
    if (!press) return
    // A release on another row the pointer reached without a move event
    // (a fast flick) still counts as reaching it.
    this.handlePressMove(event.clientY)
    if (this.context.press !== press) return
    this.context.press = null
    // After the final move, so the frame it may have scheduled is dropped too.
    this.stopAutoScroll()
    press.cleanup()
    if (!press.dragging) return
    this.commitGesture(REASONS.dragSelection, event)
    this.armClickSuppression()
  }

  // --------------------------------------------------------------------------
  // Auto-scroll
  // --------------------------------------------------------------------------

  /** Recompute the auto-scroll velocity for the pointer's position and keep the frame loop going. */
  private updateAutoScroll(clientY: number) {
    const press = this.context.press
    const scrollElement = this.context.listbox.getScrollElement()
    if (!press?.dragging || !scrollElement) {
      this.stopAutoScroll()
      return
    }
    const rect = scrollElement.getBoundingClientRect()
    const topEdge = rect.top + AUTO_SCROLL_ZONE_PX
    const bottomEdge = rect.bottom - AUTO_SCROLL_ZONE_PX
    let velocity = 0
    if (clientY < topEdge) {
      velocity = -Math.min(1, (topEdge - clientY) / AUTO_SCROLL_ZONE_PX)
    } else if (clientY > bottomEdge) {
      velocity = Math.min(1, (clientY - bottomEdge) / AUTO_SCROLL_ZONE_PX)
    }
    this.context.autoScrollVelocity = velocity
    if (velocity === 0) {
      this.stopAutoScroll()
      return
    }
    if (this.context.autoScrollFrame === null) {
      this.scheduleAutoScrollFrame()
    }
  }

  private scheduleAutoScrollFrame() {
    this.context.autoScrollFrame = requestAnimationFrame(() => {
      this.context.autoScrollFrame = null
      const press = this.context.press
      const scrollElement = this.context.listbox.getScrollElement()
      const velocity = this.context.autoScrollVelocity
      if (!press?.dragging || !scrollElement || velocity === 0) return
      const before = scrollElement.scrollTop
      // At least one whole pixel per frame, so a slow ramp still moves.
      const step =
        Math.sign(velocity) *
        Math.max(1, Math.round(Math.abs(velocity) * AUTO_SCROLL_MAX_STEP_PX))
      scrollElement.scrollTop = before + step
      if (scrollElement.scrollTop === before) {
        // Reached the end of the list; wait for the pointer to move again.
        this.context.autoScrollVelocity = 0
        return
      }
      this.handlePressMove(press.lastClientY)
    })
  }

  private stopAutoScroll() {
    if (this.context.autoScrollFrame !== null) {
      cancelAnimationFrame(this.context.autoScrollFrame)
      this.context.autoScrollFrame = null
    }
    this.context.autoScrollVelocity = 0
  }

  // --------------------------------------------------------------------------
  // Range selection (immediate commit)
  // --------------------------------------------------------------------------

  /**
   * Toggle `targetId` and set every selectable row between `anchorId` and it
   * to the same state, committing at once. The target becomes the anchor.
   */
  applyRange(
    anchorId: string,
    targetId: string,
    reason: SelectionCommitReason,
    event?: Event,
  ): SelectionCommitResult {
    const targetRow = this.context.rows.get(targetId)
    if (!targetRow) return { count: 0, checked: false }
    const target = !targetRow.getChecked()
    const changes = new Map<string, boolean>()
    // A stale anchor (filtered out, disabled, unmounted) yields an empty span;
    // the target row still toggles as a one-row range.
    const span = this.computeSpan(anchorId, targetId)
    for (const id of span.length > 0 ? span : [targetId]) {
      const row = this.context.rows.get(id)
      if (!row) {
        this.warnUnmountedRow(id)
        continue
      }
      if (row.getChecked() !== target) changes.set(id, target)
    }
    this.set('anchorId', targetId)
    const count = this.commitChanges(changes, reason, event)
    return { count, checked: target }
  }

  // --------------------------------------------------------------------------
  // Internals
  // --------------------------------------------------------------------------

  private buildPreview(gesture: SelectionGesture): Map<string, boolean> {
    const preview = new Map<string, boolean>()
    const visible = new Set(this.context.listbox.getVisibleItemIds())
    for (const id of gesture.reached) {
      if (!visible.has(id)) continue
      if (!this.context.rows.has(id)) {
        this.warnUnmountedRow(id)
        continue
      }
      preview.set(id, gesture.target)
    }
    return preview
  }

  /**
   * A visible id with no row registration and no mounted element is a
   * virtualized row that is not mounted; it cannot join a span. Warn once
   * per surface in development.
   */
  private warnUnmountedRow(id: string) {
    if (this.context.warnedUnmounted) return
    if (process.env.NODE_ENV === 'production') return
    if (this.context.listbox.getItemElement(id) !== null) return
    this.context.warnedUnmounted = true
    console.warn(
      `PopupMenu: range or drag selection skipped the unmounted row "${id}". Rows that are not mounted (virtualized lists) cannot be part of a span; keep them mounted or use a checkbox group.`,
    )
  }

  /**
   * Apply `changes` (registration id → next checked) in list order: one
   * `setValue` per checkbox group, emitted where that group's first changed
   * row sits; one `commit` per standalone row. Returns the number of rows
   * whose change was accepted.
   */
  private commitChanges(
    changes: Map<string, boolean>,
    reason: SelectionCommitReason,
    event?: Event,
  ): number {
    if (changes.size === 0) return 0
    const orderedIds = this.context.listbox
      .getVisibleItemIds()
      .filter((id) => changes.has(id))
    const entriesByOwner = new Map<
      string,
      Array<{ value: string; checked: boolean }>
    >()
    for (const id of orderedIds) {
      const row = this.context.rows.get(id)
      const checked = changes.get(id)
      if (!row?.owner || checked === undefined) continue
      const list = entriesByOwner.get(row.owner.id) ?? []
      list.push({ value: row.value, checked })
      entriesByOwner.set(row.owner.id, list)
    }
    const emittedOwners = new Set<string>()
    let count = 0
    for (const id of orderedIds) {
      const row = this.context.rows.get(id)
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

export type { CheckboxSelectionState as State }
