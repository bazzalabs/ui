/**
 * The visual scale applied to an element by CSS `zoom` or a transformed
 * ancestor. Used to convert `getBoundingClientRect()` values (which are in
 * scaled, visual pixels) back into layout pixels so geometry math is correct
 * under zoom/transform.
 */
export interface Scale {
  x: number
  y: number
}

/**
 * A plain, fully-resolved rectangle (all of `x/y/width/height` plus the
 * derived edges), independent of the live `DOMRect`.
 */
export interface NormalizedRect {
  x: number
  y: number
  width: number
  height: number
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Compute an element's visual scale by comparing its rendered rect against its
 * layout `offsetWidth`/`offsetHeight`. Returns `{ x: 1, y: 1 }` when the
 * element has no layout box (so callers can divide safely).
 *
 * Mirrors Floating UI's `platform.getScale`, but dependency-free.
 */
export function getScale(element: HTMLElement): Scale {
  const rect = element.getBoundingClientRect()
  const { offsetWidth, offsetHeight } = element

  let x = offsetWidth > 0 ? Math.round(rect.width) / offsetWidth : 1
  let y = offsetHeight > 0 ? Math.round(rect.height) / offsetHeight : 1

  if (!Number.isFinite(x) || x === 0) {
    x = 1
  }
  if (!Number.isFinite(y) || y === 0) {
    y = 1
  }

  return { x, y }
}

/**
 * Convert a scaled size into layout pixels for the given axis.
 */
export function normalizeSize(
  size: number,
  axis: 'x' | 'y',
  scale: Scale,
): number {
  return size / scale[axis]
}

/**
 * Convert a (possibly scaled) `DOMRect` into a {@link NormalizedRect} in layout
 * pixels using the supplied {@link Scale}.
 */
export function normalizeRect(
  rect: DOMRect | DOMRectReadOnly,
  scale: Scale,
): NormalizedRect {
  const x = rect.x / scale.x
  const y = rect.y / scale.y
  const width = rect.width / scale.x
  const height = rect.height / scale.y

  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
  }
}
