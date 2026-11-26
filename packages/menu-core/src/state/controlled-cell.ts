/**
 * A value a prop may control: the value kept while uncontrolled, and the
 * prop's value. Read it with `cellValue`, never through `internal`: while a
 * prop controls the cell, `internal` is stale.
 */
export interface ControlledCell<T> {
  /** The value while no prop controls the cell. */
  readonly internal: T
  /** The controlling prop's value, `undefined` while uncontrolled. */
  readonly controlled: T | undefined
}

/** What `changeCell` needs of a change's details: whether it was canceled. */
export interface CancelableDetails {
  readonly isCanceled: boolean
}

export function createCell<T>(internal: T, controlled?: T): ControlledCell<T> {
  return { internal, controlled }
}

/** The cell's effective value: the prop's while it controls the cell. */
export function cellValue<T>(cell: ControlledCell<T>): T {
  return cell.controlled === undefined ? cell.internal : cell.controlled
}

/**
 * Requests a change to `next`. The consumer's `onChange` runs first; when it
 * cancels the details, or a prop controls the cell, the cell stays as it is
 * (the same object). Otherwise the internal value becomes `next`.
 */
export function changeCell<T>(
  cell: ControlledCell<T>,
  next: T,
): ControlledCell<T>
export function changeCell<T, D extends CancelableDetails>(
  cell: ControlledCell<T>,
  next: T,
  details: D,
  onChange: ((next: T, details: D) => void) | undefined,
): ControlledCell<T>
export function changeCell<T, D extends CancelableDetails>(
  cell: ControlledCell<T>,
  next: T,
  details?: D,
  onChange?: (next: T, details: D) => void,
): ControlledCell<T> {
  if (details) onChange?.(next, details)
  if (details?.isCanceled) return cell
  if (cell.controlled !== undefined || Object.is(cell.internal, next)) {
    return cell
  }
  return { internal: next, controlled: undefined }
}
