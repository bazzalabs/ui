import { describe, expect, it } from 'vitest'
import { commandScore } from '../text/command-score.js'
import { filteredSnapshotInput } from './filtered.js'
import { buildSnapshotWithoutPositions } from './snapshot.js'
import { item } from './test-helpers.js'
import type { ItemRowMeta } from './types.js'

const items: ItemRowMeta[] = [
  item('apple', { textValue: 'Apple', containerId: 'fruit' }),
  item('banana', { textValue: 'Banana', containerId: 'fruit' }),
  item('carrot', { textValue: 'Carrot', containerId: 'veg' }),
  item('pinned', { textValue: 'Zzz', forceScore: 5 }),
  item('off', { textValue: 'Apricot', disabled: true }),
]

function build(search: string, filter: typeof commandScore | false) {
  return buildSnapshotWithoutPositions(
    filteredSnapshotInput({
      items,
      containers: ['fruit', 'veg', 'empty'],
      containerParents: new Map([['fruit', 'food']]),
      search,
      filter,
    }),
  )
}

describe('filteredSnapshotInput', () => {
  it('shows every row and Container while browsing', () => {
    const snapshot = build('', commandScore)
    expect(snapshot.navOrder).toEqual(['apple', 'banana', 'carrot', 'pinned'])
    expect([...snapshot.visibleContainers]).toEqual(['fruit', 'veg', 'empty'])
    expect(snapshot.scores.get('carrot')).toBe(1)
  })

  it('shows every row with no filter, searching or not', () => {
    const snapshot = build('zzz', false)
    expect(snapshot.navOrder).toEqual(['apple', 'banana', 'carrot', 'pinned'])
    expect(snapshot.visible.has('off')).toBe(true)
  })

  it('hides rows that score nothing, and the Containers with none showing', () => {
    const snapshot = build('ap', commandScore)
    // `forceScore` shows a row whatever its text.
    expect(snapshot.navOrder).toEqual(['apple', 'pinned'])
    // A disabled row that matches shows, but navigation skips it.
    expect(snapshot.visible.has('off')).toBe(true)
    expect(snapshot.visible.has('banana')).toBe(false)
    expect(snapshot.scores.get('banana')).toBe(0)
    expect(snapshot.scores.get('pinned')).toBe(5)
    // The Container around a shown row's Container shows too, registered or
    // not.
    expect([...snapshot.visibleContainers].sort()).toEqual(['food', 'fruit'])
  })

  it('keeps hidden rows in the Collection', () => {
    const snapshot = build('carrot', commandScore)
    expect(snapshot.orderedIds).toContain('apple')
    expect(snapshot.navOrder).toEqual(['carrot', 'pinned'])
    expect(snapshot.visible.has('apple')).toBe(false)
    expect([...snapshot.visibleContainers]).toEqual(['veg'])
  })
})
