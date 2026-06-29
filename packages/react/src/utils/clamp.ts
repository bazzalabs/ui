/**
 * Clamp a number to the inclusive range `[min, max]`.
 */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}
