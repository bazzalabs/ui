import { createSelector, ReactStore } from '@base-ui/utils/store'
import {
  type DragSelectionMode,
  type SelectionCommitResult,
  type SelectionGesture,
  SelectionGestureController,
  type SelectionGestureKind,
  type SelectionGestureSnapshot,
  type SelectionRow,
  type SelectionRowOwner,
} from '@bazza-ui/menu-core'
import { REASONS } from '../../../utils/events/index.js'
import type { SelectionCommitReason } from '../events.js'

// ============================================================================
// Types
// ============================================================================

export type {
  DragSelectionMode,
  SelectionCommitResult,
  SelectionGesture,
  SelectionGestureKind,
}

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
  /** The rows the gesture would change, where the surface's rows read it (`isPending`). */
  getPreview: () => ReadonlySet<string>
  /** Replace the rows the gesture would change: the controller's only write. */
  setPreview: (preview: ReadonlySet<string>) => void
}

/** The checkbox group that owns a row's checked state. */
export type CheckboxRowOwner = SelectionRowOwner<SelectionCommitReason>

/** A checkbox item registered with the store. */
export type CheckboxRowRegistration = SelectionRow<SelectionCommitReason>

export interface PointerPressParams {
  /** The pressed row's registration id. */
  id: string
  pointerId: number
  /** The pressed row's element; receives pointer capture. */
  element: HTMLElement
  mode: DragSelectionMode
  clientY: number
}

export type CheckboxSelectionState = SelectionGestureSnapshot

export interface CheckboxSelectionContext {
  listbox: SelectionListbox
}

// ============================================================================
// Selectors
// ============================================================================

const selectors = {
  anchorId: createSelector((state: CheckboxSelectionState) => state.anchorId),
  gesture: createSelector((state: CheckboxSelectionState) => state.gesture),
  announcement: createSelector(
    (state: CheckboxSelectionState) => state.announcement,
  ),
}

// ============================================================================
// Store
// ============================================================================

/**
 * One surface's range and drag selection, for its parts: a binding of the
 * surface's `SelectionGestureController` (`@bazza-ui/menu-core`), which owns
 * the rows, the anchor, the gestures, the preview, the commits and the
 * announcements. The store's state is the controller's snapshot, so parts
 * read the gesture and the announcement through its selectors; the preview
 * (the rows the gesture would change) the controller writes to the
 * surface's store (`listbox.setPreview`), where rows read it with the
 * `isPending` key selector. The binding reads
 * the layout and scrolls for it, and listens to the pointer while a press is
 * tracked. One per surface, so a gesture never crosses a surface.
 */
export class CheckboxSelectionStore extends ReactStore<
  CheckboxSelectionState,
  CheckboxSelectionContext,
  typeof selectors
> {
  #owner: object | undefined
  readonly #controller: SelectionGestureController<SelectionCommitReason>

  constructor(listbox: SelectionListbox) {
    const controller = new SelectionGestureController<SelectionCommitReason>({
      getNavOrder: () => listbox.getVisibleItemIds(),
      layout: {
        rowTop: (id) =>
          listbox.getItemElement(id)?.getBoundingClientRect().top ?? null,
        scrollArea: () =>
          listbox.getScrollElement()?.getBoundingClientRect() ?? null,
        scrollBy: (delta) => {
          const element = listbox.getScrollElement()
          if (!element) return false
          const before = element.scrollTop
          element.scrollTop = before + delta
          return element.scrollTop !== before
        },
      },
      preview: { get: listbox.getPreview, set: listbox.setPreview },
      highlight: (id) => listbox.setHighlightedId(id),
      dragReason: REASONS.dragSelection,
    })
    super(controller.getSnapshot(), { listbox }, selectors)
    this.#controller = controller
    controller.subscribe(() => this.setState(controller.getSnapshot()))
  }

  /**
   * Makes `owner`, a mounted Surface, the one this store serves. A new owner
   * gets the store as a new store starts; the same one again (shown again
   * by `<Activity>`, or after Fast Refresh) keeps it as it was. Call from a
   * layout effect.
   */
  claim(owner: object) {
    if (this.#owner === owner) return
    const fresh = this.#owner === undefined
    this.#owner = owner
    if (fresh) return
    this.#controller.reset()
  }

  /**
   * Subscribe to the surface's open state so closing the menu cancels any
   * press or gesture. Call from an effect; returns the cleanup, which also
   * cancels whatever is in flight.
   */
  attach(): () => void {
    const unsubscribe = this.context.listbox.observeOpen((open) => {
      if (!open) {
        this.#controller.cancelPress()
        this.cancelGesture()
      }
    })
    return () => {
      unsubscribe()
      this.#controller.cancelPress()
      this.cancelGesture()
    }
  }

  // --------------------------------------------------------------------------
  // Rows, anchor and gestures: the controller's
  // --------------------------------------------------------------------------

  registerRow(registration: CheckboxRowRegistration): () => void {
    return this.#controller.registerRow(registration)
  }

  /** Whether `id` is a registered checkbox row that is currently visible and enabled. */
  isSelectableRow(id: string): boolean {
    return this.#controller.isSelectableRow(id)
  }

  setAnchor(id: string | null) {
    this.#controller.setAnchor(id)
  }

  /** The anchor if it is still a selectable row, else `null`. */
  getUsableAnchor(): string | null {
    return this.#controller.getUsableAnchor()
  }

  beginGesture(
    kind: SelectionGestureKind,
    startId: string,
    mode: DragSelectionMode,
  ) {
    this.#controller.beginGesture(kind, startId, mode)
  }

  extendGesture(toId: string) {
    this.#controller.extendGesture(toId)
  }

  commitGesture(
    reason: SelectionCommitReason,
    event?: Event,
  ): SelectionCommitResult {
    return this.#controller.commitGesture(reason, event)
  }

  cancelGesture() {
    this.#controller.cancelGesture()
  }

  applyRange(
    anchorId: string,
    targetId: string,
    reason: SelectionCommitReason,
    event?: Event,
  ): SelectionCommitResult {
    return this.#controller.applyRange(anchorId, targetId, reason, event)
  }

  // --------------------------------------------------------------------------
  // Pointer drag: the press's listeners and pointer capture
  // --------------------------------------------------------------------------

  /**
   * Start tracking a press on a checkbox row. Nothing changes until the
   * pointer reaches another row; the controller decides from its moves.
   */
  beginPress(params: PointerPressParams) {
    const { element, pointerId } = params
    const controller = this.#controller
    const doc = element.ownerDocument
    const win = doc.defaultView
    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      controller.movePress(event.clientY)
    }
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      controller.endPress(event.clientY, event)
    }
    const onCancel = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      controller.cancelPress()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (controller.isDragging()) {
        event.preventDefault()
        event.stopPropagation()
      }
      controller.cancelPress()
    }
    const onBlur = () => controller.cancelPress()
    const onLostCapture = () => controller.cancelPress()
    const supportsCapture = typeof element.setPointerCapture === 'function'
    const release = () => {
      doc.removeEventListener('pointermove', onMove, true)
      doc.removeEventListener('pointerup', onUp, true)
      doc.removeEventListener('pointercancel', onCancel, true)
      doc.removeEventListener('keydown', onKeyDown, true)
      win?.removeEventListener('blur', onBlur)
      element.removeEventListener('lostpointercapture', onLostCapture)
      if (
        supportsCapture &&
        typeof element.hasPointerCapture === 'function' &&
        element.hasPointerCapture(pointerId)
      ) {
        element.releasePointerCapture(pointerId)
      }
    }
    const awaitRelease = (onRelease: () => void) => {
      const onPointerRelease = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) return
        doc.removeEventListener('pointerup', onPointerRelease, true)
        doc.removeEventListener('pointercancel', onPointerRelease, true)
        onRelease()
      }
      doc.addEventListener('pointerup', onPointerRelease, true)
      doc.addEventListener('pointercancel', onPointerRelease, true)
      return () => {
        doc.removeEventListener('pointerup', onPointerRelease, true)
        doc.removeEventListener('pointercancel', onPointerRelease, true)
      }
    }
    const started = controller.beginPress(
      { id: params.id, mode: params.mode, clientY: params.clientY },
      { release, awaitRelease },
    )
    if (!started) return
    doc.addEventListener('pointermove', onMove, true)
    doc.addEventListener('pointerup', onUp, true)
    doc.addEventListener('pointercancel', onCancel, true)
    doc.addEventListener('keydown', onKeyDown, true)
    win?.addEventListener('blur', onBlur)
    element.addEventListener('lostpointercapture', onLostCapture)
    if (supportsCapture) {
      try {
        element.setPointerCapture(pointerId)
      } catch {
        // The pointer may already be gone; the document listeners still work.
      }
    }
  }

  /** Whether a press is being tracked (dragging or not). */
  isPressActive(): boolean {
    return this.#controller.isPressActive()
  }

  /** Returns true once, right after a drag committed, so the click the browser fires after the release does not toggle the pressed row again. */
  consumeClickSuppression(): boolean {
    return this.#controller.consumeClickSuppression()
  }

  // --------------------------------------------------------------------------
  // Announcements
  // --------------------------------------------------------------------------

  setAnnouncementFormatter(
    formatter: ((count: number, checked: boolean) => string) | undefined,
  ) {
    this.#controller.setAnnouncementFormatter(formatter)
  }

  /** Drop the pending announcement (the surface is no longer active). */
  clearAnnouncement() {
    this.#controller.clearAnnouncement()
  }

  /** Queue an announcement for the surface's status region. */
  announce(count: number, checked: boolean) {
    this.#controller.announce(count, checked)
  }
}

export type { CheckboxSelectionState as State }
