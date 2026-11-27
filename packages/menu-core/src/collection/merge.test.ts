import { describe, expect, it } from 'vitest'
import { mergeByPosition } from './merge.js'

// Entries are named by their place in the document, as numbers; `null` is an
// entry with no element (outside a virtualized window).
type Entry = { id: string; at: number | null }

const at = (id: string, position: number | null): Entry => ({
  id,
  at: position,
})

const merge = (base: Entry[], extras: Entry[]) =>
  mergeByPosition(
    base,
    extras,
    (entry) => entry.at,
    (a, b) => a < b,
  ).map((entry) => entry.id)

describe('mergeByPosition', () => {
  it('returns the base when there are no extras', () => {
    const base = [at('a', 1)]
    expect(
      mergeByPosition(
        base,
        [],
        () => 1,
        () => true,
      ),
    ).toBe(base)
  })

  it('places each extra after the last base entry before it', () => {
    expect(
      merge([at('a', 1), at('b', 3), at('c', 5)], [at('x', 2), at('y', 6)]),
    ).toEqual(['a', 'x', 'b', 'c', 'y'])
  })

  it('places an extra above a virtualized window before the rows above it', () => {
    expect(
      merge([at('a', null), at('b', 5), at('c', null)], [at('x', 1)]),
    ).toEqual(['x', 'a', 'b', 'c'])
  })

  it('places an extra below a virtualized window after the rows below it', () => {
    expect(
      merge([at('a', null), at('b', 5), at('c', null)], [at('x', 9)]),
    ).toEqual(['a', 'b', 'c', 'x'])
  })

  it('places an extra with no element last', () => {
    expect(merge([at('a', 1), at('b', 2)], [at('x', null)])).toEqual([
      'a',
      'b',
      'x',
    ])
  })
})
