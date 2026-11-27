import { describe, expect, it } from 'vitest'
import { computePositions } from './positions.js'
import { container, item, named } from './test-helpers.js'
import type { RowId, RowMeta } from './types.js'

// The rules of the positional data attributes. The React store reads them
// through `computePositions` too: `rowPositionBits` in
// packages/react/src/internal/listbox/store/ListboxStore.ts maps its
// `orderedRows` (the rows the JSX parts register with `registerRow`) to
// `RowMeta`, and its key selector `positionBits` and the `isFirstRow` …
// `isLastInGroup` selectors read the result:
//
// - items register `kind: 'item'` with the `groupId` of the group around them
//   (`useListboxItem` in listbox/hooks/use-listbox-item.ts), disabled or not;
// - a group, radio group or checkbox group registers its own row,
//   `kind: 'group'`, with no `groupId`, even inside another group
//   (`useGroupVisibility` in popup-menu/components/group/);
// - separators, empty and loading rows register with no `groupId`
//   (the Separator, Empty and Loading parts in popup-menu/components/);
// - group labels register no row: they read their group's positions
//   (`useRowPosition` with the group's id, in the GroupLabel part);
// - a row registers only while it shows, so hidden rows have no position.
//
// Each case names the DOM test or ListboxStore test it mirrors where one
// exists.

const separator = (id: RowId, containerId?: string): RowMeta => ({
  id,
  kind: 'separator',
  containerId,
})

/** Each row's position bits by name, with every row visible in order. */
function positionsOf(rows: RowMeta[]): Record<RowId, string[]> {
  return named(
    computePositions(
      rows.map((row) => row.id),
      new Map(rows.map((row) => [row.id, row])),
    ),
  )
}

describe('computePositions', () => {
  it('gives no row a position in an empty collection', () => {
    expect(computePositions([], new Map()).size).toBe(0)
  })

  it('marks the first and last loose rows', () => {
    // positional-attrs.test.tsx: "tracks first and last among loose items
    // without group attributes".
    expect(positionsOf([item('first'), item('middle'), item('last')])).toEqual({
      first: ['First'],
      middle: [],
      last: ['Last'],
    })
  })

  it('marks a single row as both first and last', () => {
    expect(positionsOf([item('only')])).toEqual({ only: ['First', 'Last'] })
  })

  it('counts Container rows, not the items in them, for First and Last', () => {
    // positional-attrs.test.tsx: "tracks mixed rows, group rows, filtering,
    // and empty state", before the search. ListboxStore.ts:332-335 skips rows
    // with a groupId; 336-339 track group rows; 340-345 each group's rows.
    expect(
      positionsOf([
        item('home'),
        container('fruits'),
        item('apple', { containerId: 'fruits' }),
        item('banana', { containerId: 'fruits' }),
        separator('sep'),
        container('vegetables'),
        item('carrot', { containerId: 'vegetables' }),
        item('potato', { containerId: 'vegetables' }),
      ]),
    ).toEqual({
      home: ['First'],
      fruits: ['FirstContainer'],
      apple: ['FirstInContainer'],
      banana: ['LastInContainer'],
      sep: [],
      vegetables: ['Last', 'LastContainer'],
      carrot: ['FirstInContainer'],
      potato: ['LastInContainer'],
    })
  })

  it('marks the only visible Container as every edge', () => {
    // The same test after typing "banana": the loose row, the separator and
    // the other group stop rendering, so they leave the order.
    expect(
      positionsOf([
        container('fruits'),
        item('banana', { containerId: 'fruits' }),
      ]),
    ).toEqual({
      fruits: ['First', 'Last', 'FirstContainer', 'LastContainer'],
      banana: ['FirstInContainer', 'LastInContainer'],
    })
  })

  it('marks the first and last visible Containers', () => {
    // positional-attrs.test.tsx: "marks first and last visible groups".
    // A Container's label has no row; it shows its Container's bits.
    expect(
      positionsOf([
        container('fruits'),
        item('apple', { containerId: 'fruits' }),
        item('banana', { containerId: 'fruits' }),
        container('vegetables'),
        item('carrot', { containerId: 'vegetables' }),
        item('potato', { containerId: 'vegetables' }),
      ]),
    ).toEqual({
      fruits: ['First', 'FirstContainer'],
      apple: ['FirstInContainer'],
      banana: ['LastInContainer'],
      vegetables: ['Last', 'LastContainer'],
      carrot: ['FirstInContainer'],
      potato: ['LastInContainer'],
    })
  })

  it('matches the ListboxStore test of a group followed by loose rows', () => {
    // ListboxStore.test.ts: "reads the row order a bounded number of times
    // per order change": a group holding the first half of 100 items, then
    // loose rows.
    const rows: RowMeta[] = [container('g')]
    for (let i = 1; i <= 100; i++) {
      rows.push(item(`row-${i}`, { containerId: i <= 50 ? 'g' : undefined }))
    }
    const positions = positionsOf(rows)
    expect(positions.g).toEqual(['First', 'FirstContainer', 'LastContainer'])
    expect(positions['row-1']).toEqual(['FirstInContainer'])
    expect(positions['row-50']).toEqual(['LastInContainer'])
    expect(positions['row-51']).toEqual([])
    expect(positions['row-100']).toEqual(['Last'])
  })

  it('counts separators at the edges as the first and last rows', () => {
    // Separators register with no groupId, so they take First and Last
    // like any loose row.
    expect(
      positionsOf([separator('top'), item('a'), item('b'), separator('end')]),
    ).toEqual({ top: ['First'], a: [], b: [], end: ['Last'] })
  })

  it('counts a separator inside a Container as a loose row', () => {
    // separator.tsx registers no groupId even inside a group, so it ends the
    // loose rows while the items around it stay the group's ends.
    expect(
      positionsOf([
        container('g'),
        item('a', { containerId: 'g' }),
        separator('s', 'g'),
        item('b', { containerId: 'g' }),
      ]),
    ).toEqual({
      g: ['First', 'FirstContainer', 'LastContainer'],
      a: ['FirstInContainer'],
      s: ['Last'],
      b: ['LastInContainer'],
    })
  })

  it('counts a nested Container row as a loose row and a Container', () => {
    // use-group-visibility.ts registers a nested group's row with no
    // groupId: it can be the last loose row and the last Container, and it
    // isn't a row of the group around it.
    expect(
      positionsOf([
        container('outer'),
        container('inner', { containerId: 'outer' }),
        item('x', { containerId: 'inner' }),
        item('y', { containerId: 'outer' }),
      ]),
    ).toEqual({
      outer: ['First', 'FirstContainer'],
      inner: ['Last', 'LastContainer'],
      x: ['FirstInContainer', 'LastInContainer'],
      y: ['FirstInContainer', 'LastInContainer'],
    })
  })

  it('gives disabled rows positions', () => {
    // Items register their row whether or not they're disabled; only
    // navigation skips them (ListboxStore.ts:1685).
    expect(
      positionsOf([
        item('a', { disabled: true }),
        item('b'),
        container('g'),
        item('c', { containerId: 'g', disabled: true }),
        item('d', { disabled: true }),
      ]),
    ).toEqual({
      a: ['First'],
      b: [],
      g: ['FirstContainer', 'LastContainer'],
      c: ['FirstInContainer', 'LastInContainer'],
      d: ['Last'],
    })
  })

  it('counts the empty row as the only row', () => {
    // positional-attrs.test.tsx: the search "zzz" leaves only Empty.
    expect(positionsOf([{ id: 'empty', kind: 'empty' }])).toEqual({
      empty: ['First', 'Last'],
    })
  })

  it('counts a loading row after the items as the last row', () => {
    expect(
      positionsOf([item('a'), item('b'), { id: 'loading', kind: 'loading' }]),
    ).toEqual({ a: ['First'], b: [], loading: ['Last'] })
  })
})
