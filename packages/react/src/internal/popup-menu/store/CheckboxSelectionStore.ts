import { createSelector, ReactStore } from '@base-ui/utils/store'
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
      { listbox, rows: new Map(), warnedUnmounted: false },
      selectors,
    )
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
