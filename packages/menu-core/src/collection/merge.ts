// Placing a few rows that registered (a JSX row next to data-first rows, a
// `Separator` or `Group` part) among rows a Collection orders, by where their
// elements are in the document.

/**
 * Inserts `extras` (few, in document order) among `base` (in a Collection's
 * order) by position: each extra goes right after the last base entry with
 * an element that comes before it, or after every base entry when none with
 * an element comes after it. Base entries with no element (a virtualized
 * list's rows outside its window) stay in place around the ones that have
 * one, so an extra above the window goes before the rows above the window,
 * and one below it after the rows below it. An extra with no element goes
 * last.
 *
 * `elementOf` returns an entry's element while it's in the document;
 * `precedes(a, b)` whether `a` comes before `b`.
 */
export function mergeByPosition<T, E>(
  base: readonly T[],
  extras: readonly T[],
  elementOf: (entry: T) => E | null | undefined,
  precedes: (a: E, b: E) => boolean,
): T[] {
  if (extras.length === 0) return base as T[]
  const merged: T[] = []
  let next = 0
  for (const extra of extras) {
    const element = elementOf(extra)
    let cut = base.length
    if (element) {
      cut = next
      let followed = false
      for (let i = next; i < base.length; i++) {
        const baseElement = elementOf(base[i]!)
        if (!baseElement) continue
        if (!precedes(baseElement, element)) {
          followed = true
          break
        }
        cut = i + 1
      }
      // No element follows the extra: it goes after every base entry, the
      // ones below a virtualized window included.
      if (!followed) cut = base.length
    }
    while (next < cut) merged.push(base[next++]!)
    merged.push(extra)
  }
  while (next < base.length) merged.push(base[next++]!)
  return merged
}
