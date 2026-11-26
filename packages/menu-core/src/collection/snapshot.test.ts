import { describe, expect, it } from 'vitest'
import {
  buildSnapshot,
  buildSnapshotWithoutPositions,
  emptyCollection,
} from './snapshot.js'
import { container, item } from './test-helpers.js'
import { Pos, type RowMeta, type SnapshotInput } from './types.js'

/** A menu with a loose row, a radio group and a trailing separator. */
const rows = (): RowMeta[] => [
  item('home'),
  container('size', { selection: 'single' }),
  item('small', { containerId: 'size' }),
  item('large', { containerId: 'size', disabled: true }),
  { id: 'sep', kind: 'separator' },
]

describe('buildSnapshot', () => {
  it('builds an empty collection as the empty snapshot', () => {
    expect(buildSnapshot({ rows: [] })).toBe(emptyCollection)
    expect(emptyCollection.version).toBe(0)
  })

  it('orders every row and navigates the visible enabled items', () => {
    const snapshot = buildSnapshot({ rows: rows() })

    expect(snapshot.orderedIds).toEqual([
      'home',
      'size',
      'small',
      'large',
      'sep',
    ])
    // Disabled rows show but navigation skips them, as
    // ListboxStore.getVisibleItemIds() does.
    expect(snapshot.navOrder).toEqual(['home', 'small'])
    expect([...snapshot.visible]).toEqual(snapshot.orderedIds)
    expect([...snapshot.visibleContainers]).toEqual(['size'])
    expect(snapshot.rows.get('small')).toEqual(rows()[2])
  })

  it('leaves positions empty when asked not to work them out', () => {
    const snapshot = buildSnapshot({ rows: rows() }, undefined, {
      positions: false,
    })
    expect(snapshot.positions.size).toBe(0)
    expect(snapshot.navOrder).toEqual(['home', 'small'])
  })

  it('builds without positions as buildSnapshot does with them left out', () => {
    const snapshot = buildSnapshotWithoutPositions({ rows: rows() })
    expect(snapshot.positions.size).toBe(0)
    expect(snapshot.orderedIds).toEqual(
      buildSnapshot({ rows: rows() }).orderedIds,
    )
  })

  it('scores every item row 1 with no search, as ListboxStore does', () => {
    // ListboxStore.ts:431-433 and 1879-1882: every item scores 1.
    const snapshot = buildSnapshot({ rows: rows() })
    expect(snapshot.scores).toEqual(
      new Map([
        ['home', 1],
        ['small', 1],
        ['large', 1],
      ]),
    )
  })

  it('keeps rows a search hides in rows and orderedIds', () => {
    const snapshot = buildSnapshot({
      rows: rows(),
      hidden: new Set(['home']),
      scores: new Map([['small', 0.8]]),
    })

    expect(snapshot.rows.has('home')).toBe(true)
    expect(snapshot.orderedIds).toContain('home')
    expect(snapshot.visible.has('home')).toBe(false)
    expect(snapshot.navOrder).toEqual(['small'])
    expect(snapshot.positions.has('home')).toBe(false)
    expect(snapshot.scores.get('home')).toBe(0)
    expect(snapshot.scores.get('small')).toBe(0.8)
    // Positions are recomputed without it: the Container is now first.
    expect(snapshot.positions.get('size')).toBe(
      Pos.First | Pos.FirstContainer | Pos.LastContainer,
    )
  })

  it('shows a row that scores 0: only `hidden` hides rows', () => {
    // A preserve-show-all Container shows its rows that don't match.
    const snapshot = buildSnapshot({
      rows: rows(),
      scores: new Map([['small', 0]]),
    })
    expect(snapshot.visible.has('small')).toBe(true)
    expect(snapshot.navOrder).toContain('small')
    expect(snapshot.scores.get('small')).toBe(0)
  })

  it('hides the rows of a hidden Container', () => {
    const snapshot = buildSnapshot({
      rows: [
        item('home'),
        container('outer'),
        container('inner', { containerId: 'outer' }),
        item('deep', { containerId: 'inner' }),
        item('shallow', { containerId: 'outer' }),
      ],
      hidden: new Set(['outer']),
    })

    expect(snapshot.orderedIds).toHaveLength(5)
    expect([...snapshot.visible]).toEqual(['home'])
    expect(snapshot.visibleContainers.size).toBe(0)
    expect(snapshot.navOrder).toEqual(['home'])
    expect(snapshot.scores.get('deep')).toBe(0)
    expect(snapshot.positions).toEqual(
      new Map([['home', Pos.First | Pos.Last]]),
    )
  })

  it('shows a Container while its rows are hidden unless it is hidden too', () => {
    // A Container's visibility is its adapter's call: with no search a
    // group with no visible rows still shows (ListboxStore.ts:395-398).
    const snapshot = buildSnapshot({
      rows: rows(),
      hidden: new Set(['small', 'large']),
    })
    expect(snapshot.visibleContainers.has('size')).toBe(true)
    expect(snapshot.positions.get('size')).toBe(
      Pos.FirstContainer | Pos.LastContainer,
    )
  })

  it("doesn't hide rows naming a Container with no row", () => {
    const snapshot = buildSnapshot({
      rows: [item('a', { containerId: 'unregistered' })],
    })
    expect(snapshot.navOrder).toEqual(['a'])
    expect(snapshot.positions.get('a')).toBe(
      Pos.FirstInContainer | Pos.LastInContainer,
    )
  })

  it('keeps the first of two rows with one id', () => {
    const snapshot = buildSnapshot({
      rows: [item('a'), item('a', { disabled: true })],
    })
    expect(snapshot.orderedIds).toEqual(['a'])
    expect(snapshot.navOrder).toEqual(['a'])
  })

  describe('version', () => {
    const input = (): SnapshotInput => ({ rows: rows() })

    it('adds one to the previous version on each change', () => {
      const first = buildSnapshot(input())
      const second = buildSnapshot(
        { ...input(), hidden: new Set(['home']) },
        first,
      )
      const third = buildSnapshot(input(), second)

      expect(first.version).toBe(1)
      expect(second.version).toBe(2)
      expect(third.version).toBe(3)
    })

    it('returns the previous snapshot when nothing changed', () => {
      const first = buildSnapshot(input())
      // New row objects, the same values.
      expect(buildSnapshot(input(), first)).toBe(first)
    })

    it('builds value-equal snapshots from equal input', () => {
      expect(buildSnapshot(input())).toEqual(buildSnapshot(input()))
    })

    it.each<[string, (rows: RowMeta[]) => SnapshotInput]>([
      [
        'a row changes',
        (rows) => ({
          rows: rows.map((row) =>
            row.id === 'small' ? { ...row, disabled: true } : row,
          ),
        }),
      ],
      [
        'a row stops being activatable',
        (rows) => ({
          rows: rows.map((row) =>
            row.id === 'home' ? { ...row, activatable: false } : row,
          ),
        }),
      ],
      [
        'a keyword changes',
        (rows) => ({
          rows: rows.map((row) =>
            row.id === 'home' ? { ...row, keywords: ['house'] } : row,
          ),
        }),
      ],
      ['the order changes', (rows) => ({ rows: [...rows].reverse() })],
      [
        'a score changes',
        (rows) => ({ rows, scores: new Map([['home', 0.5]]) }),
      ],
      ['a row hides', (rows) => ({ rows, hidden: new Set(['sep']) })],
      ['a row leaves', (rows) => ({ rows: rows.slice(0, -1) })],
    ])('builds a new snapshot when %s', (_, change) => {
      const first = buildSnapshot(input())
      const next = buildSnapshot(change(rows()), first)
      expect(next).not.toBe(first)
      expect(next.version).toBe(first.version + 1)
    })
  })
})
