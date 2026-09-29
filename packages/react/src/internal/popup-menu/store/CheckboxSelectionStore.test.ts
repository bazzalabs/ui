import { describe, expect, it, vi } from 'vitest'
import {
  type CheckboxRowOwner,
  CheckboxSelectionStore,
} from './CheckboxSelectionStore.js'

function setup(initialIds: string[]) {
  let ids = [...initialIds]
  const checked = new Map<string, boolean>()
  const store = new CheckboxSelectionStore({
    getVisibleItemIds: () => ids,
    getItemElement: () => null,
    getScrollElement: () => null,
    setHighlightedId: vi.fn(),
    observeOpen: () => () => {},
  })
  function owner(id: string, initial: string[], accept = true) {
    let value = [...initial]
    const getValue = () => value
    const setValue = vi.fn((next: string[]) => {
      if (accept) value = next
      return accept
    })
    return { id, getValue, setValue }
  }
  function row(
    id: string,
    options: {
      value?: string
      owner?: CheckboxRowOwner | null
      checked: boolean
      commit?: (next: boolean) => boolean
    },
  ) {
    checked.set(id, options.checked)
    const commit = vi.fn((next: boolean) => {
      if (options.commit?.(next) === false) return false
      checked.set(id, next)
      return true
    })
    const unregister = store.registerRow({
      id,
      value: options.value ?? id,
      owner: options.owner ?? null,
      getChecked: () => checked.get(id) ?? false,
      commit,
    })
    return { commit, unregister }
  }
  return {
    store,
    row,
    owner,
    checked,
    setIds: (next: string[]) => (ids = next),
  }
}

describe('CheckboxSelectionStore', () => {
  it('does not announce zero changes or cancelled gesture changes', () => {
    const { store, row } = setup(['a'])
    store.announce(0, true)
    expect(store.state.announcement).toBeNull()
    row('a', { checked: false, commit: () => false })
    store.beginGesture('drag', 'a', 'keep')
    store.commitGesture('drag-selection')
    expect(store.state.announcement).toBeNull()
  })

  it('clears a pending announcement', () => {
    const { store } = setup([])
    store.announce(2, true)
    store.clearAnnouncement()
    expect(store.state.announcement).toBeNull()
  })

  it('cancels an in-flight gesture when the surface closes and on detach', () => {
    let emitOpen: (open: boolean) => void = () => {}
    const listbox = {
      getVisibleItemIds: () => ['a', 'b'],
      getItemElement: () => null,
      getScrollElement: () => null,
      setHighlightedId: vi.fn(),
      observeOpen: (listener: (open: boolean) => void) => {
        emitOpen = listener
        return () => {
          emitOpen = () => {}
        }
      },
    }
    const store = new CheckboxSelectionStore(listbox)
    const commit = vi.fn(() => true)
    for (const id of ['a', 'b']) {
      store.registerRow({
        id,
        value: id,
        owner: null,
        getChecked: () => false,
        commit,
      })
    }
    const detach = store.attach()

    store.beginGesture('drag', 'a', 'keep')
    store.extendGesture('b')
    emitOpen(false)
    expect(store.state.gesture).toBeNull()
    expect(store.state.preview.size).toBe(0)

    store.beginGesture('drag', 'a', 'keep')
    detach()
    expect(store.state.gesture).toBeNull()

    // StrictMode runs attach → detach → attach: the second subscription works
    store.attach()
    store.beginGesture('drag', 'a', 'keep')
    emitOpen(false)
    expect(store.state.gesture).toBeNull()
    store.commitGesture('drag-selection')
    expect(commit).not.toHaveBeenCalled()
  })

  it('does nothing when beginning on an unregistered or invisible row', () => {
    const { store, row } = setup(['a'])
    row('a', { checked: false })
    row('hidden', { checked: false })
    store.beginGesture('drag', 'missing', 'keep')
    store.beginGesture('drag', 'hidden', 'keep')
    expect(store.state.gesture).toBeNull()
  })

  it('excludes unregistered ids and counts only changed rows', () => {
    const { store, row } = setup(['a', 'sep', 'b'])
    row('a', { checked: true })
    row('b', { checked: false })
    store.beginGesture('drag', 'b', 'rubber-band')
    store.extendGesture('a')
    expect(store.state.preview.has('sep')).toBe(false)
    expect(store.state.preview.has('a')).toBe(true)
    expect(store.commitGesture('drag-selection').count).toBe(1)
  })

  it('commits groups once and standalones in list order, then clears preview', () => {
    const { store, row, owner } = setup(['x', 'y', 's'])
    const group = owner('g', ['x'])
    row('x', { value: 'x', owner: group, checked: true })
    row('y', { value: 'y', owner: group, checked: false })
    const standalone = row('s', { checked: false })
    const event = new Event('pointerup')
    store.beginGesture('drag', 'y', 'keep')
    store.extendGesture('s')
    expect(store.commitGesture('drag-selection', event)).toEqual({
      count: 2,
      checked: true,
    })
    expect(group.setValue).toHaveBeenCalledExactlyOnceWith(
      ['x', 'y'],
      'drag-selection',
      event,
    )
    expect(standalone.commit).toHaveBeenCalledExactlyOnceWith(
      true,
      'drag-selection',
      event,
    )
    expect(store.state.anchorId).toBe('y')
    expect(store.state.gesture).toBeNull()
    expect(store.state.preview.size).toBe(0)
  })

  it('emits commits in visible list order', () => {
    const { store, row, owner } = setup(['s1', 'x', 's2', 'y'])
    const calls: string[] = []
    const group = owner('g', [])
    group.setValue.mockImplementation(() => {
      calls.push('g')
      return true
    })
    const first = row('s1', { checked: false })
    first.commit.mockImplementation(() => {
      calls.push('s1')
      return true
    })
    row('x', { owner: group, value: 'x', checked: false })
    const second = row('s2', { checked: false })
    second.commit.mockImplementation(() => {
      calls.push('s2')
      return true
    })
    row('y', { owner: group, value: 'y', checked: false })
    store.beginGesture('drag', 's1', 'keep')
    store.extendGesture('y')
    store.commitGesture('drag-selection')
    expect(calls).toEqual(['s1', 'g', 's2'])
    expect(group.setValue).toHaveBeenCalledOnce()
    expect(group.setValue).toHaveBeenCalledWith(
      ['x', 'y'],
      'drag-selection',
      undefined,
    )
  })

  it('excludes cancelled changes from the count', () => {
    const { store, row, owner } = setup(['g', 's'])
    const group = owner('g', [], false)
    const standalone = row('s', { checked: false, commit: () => false })
    row('g', { owner: group, value: 'g', checked: false })
    store.beginGesture('drag', 'g', 'keep')
    store.extendGesture('s')
    expect(store.commitGesture('drag-selection').count).toBe(0)
    expect(group.setValue).toHaveBeenCalledOnce()
    expect(standalone.commit).toHaveBeenCalledOnce()
  })

  it('preserves group value order when unchecking', () => {
    const { store, row, owner } = setup(['x', 'y', 'z'])
    const group = owner('g', ['x', 'y', 'z'])
    for (const value of ['x', 'y', 'z'])
      row(value, { owner: group, value, checked: true })
    store.beginGesture('drag', 'y', 'keep')
    store.commitGesture('drag-selection')
    expect(group.setValue).toHaveBeenCalledWith(
      ['x', 'z'],
      'drag-selection',
      undefined,
    )
  })

  it('returns no usable anchor after it is no longer visible', () => {
    const { store, row, setIds } = setup(['a'])
    row('a', { checked: false })
    store.setAnchor('a')
    expect(store.getUsableAnchor()).toBe('a')
    setIds([])
    expect(store.getUsableAnchor()).toBeNull()
  })

  it('toggles the target when the range anchor is stale', () => {
    const { store, row } = setup(['a', 'b', 'c'])
    const a = row('a', { checked: false })
    const b = row('b', { checked: false })
    const c = row('c', { checked: false })

    expect(store.applyRange('ghost', 'b', 'range-selection')).toEqual({
      count: 1,
      checked: true,
    })
    expect(b.commit).toHaveBeenCalledExactlyOnceWith(
      true,
      'range-selection',
      undefined,
    )
    expect(a.commit).not.toHaveBeenCalled()
    expect(c.commit).not.toHaveBeenCalled()
    expect(store.state.anchorId).toBe('b')
  })

  it('unregisters rows without letting stale unregister callbacks remove replacements', () => {
    const { store, row } = setup(['a'])
    const old = row('a', { checked: false })
    old.unregister()
    expect(store.isSelectableRow('a')).toBe(false)
    const stale = row('a', { checked: false })
    const replacement = row('a', { checked: true })
    stale.unregister()
    expect(store.isSelectableRow('a')).toBe(true)
    replacement.unregister()
  })

  it('warns once for unmounted unregistered rows, but not mounted rows', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const ids = ['a', 'virtual', 'b']
    const store = new CheckboxSelectionStore({
      getVisibleItemIds: () => ids,
      getItemElement: (id) =>
        id === 'mounted' ? document.createElement('div') : null,
      setHighlightedId: vi.fn(),
      observeOpen: () => () => {},
    })
    for (const id of ['a', 'b'])
      store.registerRow({
        id,
        value: id,
        owner: null,
        getChecked: () => false,
        commit: () => true,
      })
    store.applyRange('a', 'b', 'range-selection')
    store.applyRange('a', 'b', 'range-selection')
    expect(warn).toHaveBeenCalledOnce()
    const mountedStore = new CheckboxSelectionStore({
      getVisibleItemIds: () => ['a', 'mounted', 'b'],
      getItemElement: (id) =>
        id === 'mounted' ? document.createElement('div') : null,
      setHighlightedId: vi.fn(),
      observeOpen: () => () => {},
    })
    for (const id of ['a', 'b'])
      mountedStore.registerRow({
        id,
        value: id,
        owner: null,
        getChecked: () => false,
        commit: () => true,
      })
    mountedStore.applyRange('a', 'b', 'range-selection')
    expect(warn).toHaveBeenCalledOnce()
  })
})
