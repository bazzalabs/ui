/** Hit-test a point (x,y) against a DOMRect. */
export function isInBounds(x: number, y: number, rect: DOMRect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}
