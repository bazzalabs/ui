import { describe, expect, it, vi } from 'vitest'
import type { SelectionContext, SelectionState } from './SelectionStore.js'
import { SelectionStore } from './SelectionStore.js'

function createStore(
  initialState?: Partial<SelectionState>,
  context?: Partial<SelectionContext>,
) {
  return new SelectionStore(initialState, context)
}

const setOf = (...keys: string[]) => new Set(keys)

describe('SelectionStore', () => {
  it('has the expected default state', () => {
    const store = createStore()
    expect(store.state.selectedKeys).toEqual(setOf())
    expect(store.state.anchorKey).toBeNull()
    expect(store.context.mode).toBe('none')
  })

  it('does nothing in none mode and supports single mode', () => {
    const onSelectionChange = vi.fn()
    const store = createStore({}, { onSelectionChange })
    store.setOrderedKeys(['a', 'b'])
    store.set(['a'])
    store.toggle('a')
    expect(store.state.selectedKeys).toEqual(setOf())
    expect(onSelectionChange).not.toHaveBeenCalled()

    store.setMode('single')
    store.set(['a', 'b'])
    expect(store.select('selectedKeys')).toEqual(setOf('b'))
    store.toggle('b')
    expect(store.select('selectedKeys')).toEqual(setOf())
  })

  it('sets and toggles membership, anchor, and details', () => {
    const onSelectionChange = vi.fn()
    const store = createStore({}, { mode: 'multiple', onSelectionChange })
    store.setOrderedKeys(['a', 'b', 'c'])
    store.set(['a', 'b'])
    expect(store.select('anchorKey')).toBe('b')
    expect(onSelectionChange.mock.calls[0][1]).toMatchObject({
      type: 'set',
      anchorKey: 'b',
    })
    expect(onSelectionChange.mock.calls[0][1].addedKeys).toEqual(
      setOf('a', 'b'),
    )
    store.toggle('a')
    expect(store.select('selectedKeys')).toEqual(setOf('b'))
    expect(onSelectionChange.mock.calls[1][1].removedKeys).toEqual(setOf('a'))
  })

  it('selects forward, backward, disabled, and null-anchor ranges', () => {
    const store = createStore({}, { mode: 'multiple' })
    store.setOrderedKeys(['a', 'b', 'c', 'd'], setOf('c'))
    store.set(['a'])
    store.selectRange('d')
    expect(store.select('selectedKeys')).toEqual(setOf('a', 'b', 'd'))
    store.selectRange('b')
    expect(store.select('selectedKeys')).toEqual(setOf('a', 'b'))

    const fallback = createStore({}, { mode: 'multiple' })
    fallback.setOrderedKeys(['a', 'b'])
    const callback = vi.fn()
    fallback.context.onSelectionChange = callback
    fallback.selectRange('b')
    expect(fallback.select('selectedKeys')).toEqual(setOf('b'))
    expect(callback.mock.calls[0][1].type).toBe('set')
  })

  it('selects a true backward range', () => {
    const store = createStore({}, { mode: 'multiple' })
    store.setOrderedKeys(['a', 'b', 'c', 'd'])
    store.set(['c'])
    store.selectRange('a')
    expect(store.select('selectedKeys')).toEqual(setOf('a', 'b', 'c'))
  })

  it('does nothing for range operations and select all in single mode', () => {
    const onSelectionChange = vi.fn()
    const store = createStore({}, { mode: 'single', onSelectionChange })
    store.setOrderedKeys(['a', 'b'])
    store.set(['a'])
    onSelectionChange.mockClear()
    store.selectRange('b')
    store.extendRange('b')
    store.selectAll()
    expect(store.select('selectedKeys')).toEqual(setOf('a'))
    expect(onSelectionChange).not.toHaveBeenCalled()
  })

  it('does nothing when a range target is missing', () => {
    const onSelectionChange = vi.fn()
    const store = createStore({}, { mode: 'multiple', onSelectionChange })
    store.setOrderedKeys(['a', 'b', 'c'])
    store.set(['b'])
    onSelectionChange.mockClear()
    store.selectRange('missing-key')
    store.extendRange('missing-key')
    expect(store.select('selectedKeys')).toEqual(setOf('b'))
    expect(onSelectionChange).not.toHaveBeenCalled()
  })

  it('supports the base store set form', () => {
    const store = createStore({}, { mode: 'multiple' })
    store.setOrderedKeys(['a', 'b'])
    store.set(['a'])
    store.set('anchorKey', 'b')
    expect(store.state.anchorKey).toBe('b')
    expect(store.select('selectedKeys')).toEqual(setOf('a'))
  })

  it('extends ranges while preserving out-of-range selection', () => {
    const store = createStore(
      { selectedKeys: setOf('a', 'e'), anchorKey: 'a' },
      { mode: 'multiple' },
    )
    store.setOrderedKeys(['a', 'b', 'c', 'd', 'e'])
    store.extendRange('c')
    store.extendRange('d')
    expect(store.select('selectedKeys')).toEqual(setOf('a', 'b', 'c', 'd', 'e'))
    store.extendRange('b')
    expect(store.select('selectedKeys')).toEqual(setOf('a', 'b', 'e'))
    store.toggle('e')
    store.extendRange('d')
    expect(store.select('selectedKeys')).toEqual(setOf('a', 'b', 'd', 'e'))
  })

  it('selects all, clears, and does not callback for no-ops', () => {
    const onSelectionChange = vi.fn()
    const store = createStore({}, { mode: 'multiple', onSelectionChange })
    store.setOrderedKeys(['a', 'b', 'c'], setOf('b'))
    store.selectAll()
    expect(store.select('selectedKeys')).toEqual(setOf('a', 'c'))
    store.selectAll()
    expect(onSelectionChange).toHaveBeenCalledTimes(1)
    store.clear()
    store.clear()
    expect(onSelectionChange).toHaveBeenCalledTimes(2)
  })

  it('prunes uncontrolled selections and clears a pruned anchor', () => {
    const onSelectionChange = vi.fn()
    const store = createStore({}, { mode: 'multiple', onSelectionChange })
    store.setOrderedKeys(['a', 'b'])
    store.set(['a', 'b'])
    store.setOrderedKeys(['a'])
    expect(store.select('selectedKeys')).toEqual(setOf('a'))
    expect(store.select('anchorKey')).toBeNull()
    expect(onSelectionChange.mock.calls[1][1]).toMatchObject({ type: 'prune' })
    expect(onSelectionChange.mock.calls[1][1].removedKeys).toEqual(setOf('b'))
  })

  it('uses controlled selection as the effective set', () => {
    const onSelectionChange = vi.fn()
    const store = createStore(
      { selectedKeys: setOf('a'), selectedKeysProp: setOf('a', 'missing') },
      { mode: 'multiple', onSelectionChange },
    )
    store.setOrderedKeys(['a', 'b'])
    expect(store.select('selectedKeys')).toEqual(setOf('a'))
    store.toggle('b')
    expect(store.state.selectedKeys).toEqual(setOf('a'))
    expect(store.select('selectedKeys')).toEqual(setOf('a'))
    expect(onSelectionChange.mock.calls[0][0]).toEqual(setOf('a', 'b'))
  })

  it('detects first and last edges of selection runs', () => {
    const store = createStore({}, { mode: 'multiple' })
    store.setOrderedKeys(['a', 'b', 'c', 'd', 'e'])
    store.set(['a', 'b', 'd'])
    expect(store.select('isFirstOfRun', 'a')).toBe(true)
    expect(store.select('isLastOfRun', 'b')).toBe(true)
    expect(store.select('isFirstOfRun', 'd')).toBe(true)
    expect(store.select('isLastOfRun', 'd')).toBe(true)
    expect(store.select('isFirstOfRun', 'b')).toBe(false)
  })
})
