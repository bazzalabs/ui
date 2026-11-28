/**
 * A change asked of a cell: its value, the task it was asked in (a
 * `currentTask()` token) and the event behind it. A caller extends it with
 * what else it records of the change (a reason, a cause), so the change has
 * one record with one lifecycle (see `ControlledCell.request`).
 */
export interface CellRequest<T> {
  readonly value: T
  readonly task: object
  /**
   * The event that asked for it (a native event), if any: the same change
   * asked again with the same event is a repeat, whatever task asks it (a
   * user event's listeners can run in separate tasks).
   */
  readonly event: unknown
}

/**
 * A value a prop may control: the value kept while uncontrolled, the prop's
 * value, and the change asked of it that's still pending. Read the value
 * with `cellValue`, never through `internal`: while a prop controls the
 * cell, `internal` is stale.
 */
export interface ControlledCell<T, R extends CellRequest<T> = CellRequest<T>> {
  /** The value while no prop controls the cell. */
  readonly internal: T
  /** The controlling prop's value, `undefined` while uncontrolled. */
  readonly controlled: T | undefined
  /**
   * The change last asked of the cell that's still pending, or that the
   * cell's readers are taking in: from when the consumer is asked (its
   * caller marks it, `markRequested`, so the same change asked from inside
   * the callback is a repeat), while a prop controls the cell and the
   * consumer took it, until the prop next syncs (`controlledBy`), and while
   * an uncontrolled change is written. The caller drops it when the change
   * is done (`settleRequest`); a canceled change leaves the one before it.
   * `undefined` when none is pending.
   */
  readonly request: R | undefined
}

/** What `requestCell` needs of a change's details: whether it was canceled. */
export interface CancelableDetails {
  readonly isCanceled: boolean
}

/**
 * What became of a change asked of a cell:
 * - `noop`: nothing to change, so nobody was asked: the cell already has the
 *   value and no other change is pending, or the same change was asked
 *   already in this task or with this event;
 * - `canceled`: the consumer canceled it; the cell is as it was;
 * - `applied`: uncontrolled, the cell has the value now;
 * - `controlled`: a prop controls the cell; the consumer took the change,
 *   which happens when (and if) the prop follows. The cell keeps it as its
 *   `request`.
 */
export type CellRequestResult = 'noop' | 'canceled' | 'applied' | 'controlled'

export function createCell<T, R extends CellRequest<T> = CellRequest<T>>(
  internal: T,
  controlled?: T,
): ControlledCell<T, R> {
  return { internal, controlled, request: undefined }
}

/** The cell's effective value: the prop's while it controls the cell. */
export function cellValue<T>(cell: ControlledCell<T, CellRequest<T>>): T {
  return cell.controlled === undefined ? cell.internal : cell.controlled
}

/**
 * Whether `ask` would change nothing (see `CellRequestResult`'s `noop`). A
 * change away from a pending request is a reversal, and asks the consumer
 * even when the value is already `ask.value`.
 */
export function isNoopRequest<T>(
  cell: ControlledCell<T, CellRequest<T>>,
  ask: CellRequest<T>,
): boolean {
  const { request } = cell
  const next = ask.value
  if (request === undefined) return Object.is(cellValue(cell), next)
  if (!Object.is(request.value, next)) return false
  return (
    request.task === ask.task ||
    (ask.event != null && request.event === ask.event) ||
    Object.is(cellValue(cell), next)
  )
}

/**
 * Asks `cell` for `request.value` and returns the new cell and what became
 * of the change. Unless it's a `noop`, the consumer's `onChange` runs first
 * and may cancel it; the cell is the same object when nothing changes. The
 * new cell keeps `request` (see `ControlledCell.request`). A caller that lets
 * `onChange` ask again marks the change first (`markRequested`) where the
 * callback reads the cell.
 */
export function requestCell<
  T,
  R extends CellRequest<T>,
  D extends CancelableDetails,
>(
  cell: ControlledCell<T, R>,
  request: R,
  details: D,
  onChange: ((next: T, details: D) => void) | undefined,
): { readonly cell: ControlledCell<T, R>; readonly result: CellRequestResult } {
  if (isNoopRequest(cell, request)) return { cell, result: 'noop' }
  onChange?.(request.value, details)
  if (details.isCanceled) return { cell, result: 'canceled' }
  if (cell.controlled !== undefined) {
    return { cell: { ...cell, request }, result: 'controlled' }
  }
  return {
    cell: { internal: request.value, controlled: undefined, request },
    result: 'applied',
  }
}

/** `cell` with `request` marked as asked, while the consumer decides. */
export function markRequested<T, R extends CellRequest<T>>(
  cell: ControlledCell<T, R>,
  request: R,
): ControlledCell<T, R> {
  return { ...cell, request }
}

/**
 * What became of `next`, asked of a cell that changed while its consumer
 * decided (the consumer synced the prop, or asked for something else, from
 * inside its callback): by what the cell says now. Taken back (a pending
 * change away from it, or the value isn't it) reads as `canceled`.
 */
export function settledResult<T>(
  cell: ControlledCell<T, CellRequest<T>>,
  next: T,
): CellRequestResult {
  const { request } = cell
  if (request !== undefined && !Object.is(request.value, next)) {
    return 'canceled'
  }
  if (Object.is(cellValue(cell), next)) return 'applied'
  return request !== undefined ? 'controlled' : 'canceled'
}

/** `cell` with its request done: the same object when none is pending. */
export function settleRequest<T, R extends CellRequest<T>>(
  cell: ControlledCell<T, R>,
): ControlledCell<T, R> {
  return cell.request === undefined ? cell : { ...cell, request: undefined }
}

/**
 * `cell` with `controlled` as its prop's value, or the same object when
 * that's what it has (or the prop isn't set). Its request stays, so what
 * reads the cell while the prop applies the change still reads it; the
 * caller settles it after (`settleRequest`).
 */
export function controlledBy<T, R extends CellRequest<T>>(
  cell: ControlledCell<T, R>,
  controlled: T | undefined,
): ControlledCell<T, R> {
  if (controlled === undefined || Object.is(controlled, cell.controlled)) {
    return cell
  }
  return { internal: cell.internal, controlled, request: cell.request }
}

/**
 * Changes an uncontrolled value with no consumer to ask (`search`): the cell
 * is the same object when a prop controls it or the value is unchanged.
 */
export function changeCell<T>(
  cell: ControlledCell<T>,
  next: T,
): ControlledCell<T> {
  if (cell.controlled !== undefined || Object.is(cell.internal, next)) {
    return cell
  }
  return createCell(next)
}
