import { afterEach, describe, expect, it, vi } from 'vitest'
import { CheckboxSelectionStore } from './CheckboxSelectionStore.js'

// The store binds a press to the document: it listens to the pressed
// pointer only, and stops listening when the press ends.

const ROW = 32

function setup() {
  const ids = ['a', 'b', 'c']
  const elements = new Map(
    ids.map((id, index) => {
      const element = document.createElement('div')
      element.getBoundingClientRect = () =>
        ({
          top: index * ROW,
          bottom: index * ROW + ROW,
          height: ROW,
        }) as DOMRect
      document.body.append(element)
      return [id, element]
    }),
  )
  const store = new CheckboxSelectionStore({
    getVisibleItemIds: () => ids,
    getItemElement: (id) => elements.get(id) ?? null,
    getScrollElement: () => null,
    setHighlightedId: vi.fn(),
    observeOpen: () => () => {},
  })
  const commits = new Map(ids.map((id) => [id, vi.fn(() => true)]))
  for (const id of ids) {
    store.registerRow({
      id,
      value: id,
      owner: null,
      getChecked: () => false,
      commit: commits.get(id) as () => boolean,
    })
  }
  const pointer = (type: string, pointerId: number, clientY: number) => {
    const event = new Event(type, { bubbles: true }) as PointerEvent
    Object.assign(event, { pointerId, clientY })
    document.dispatchEvent(event)
  }
  const press = () =>
    store.beginPress({
      id: 'a',
      pointerId: 1,
      element: elements.get('a') as HTMLElement,
      mode: 'keep',
      clientY: ROW / 2,
    })
  return { store, pointer, press, elements, commits }
}

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('CheckboxSelectionStore press binding', () => {
  it('follows only the pressed pointer', () => {
    const { store, pointer, press } = setup()
    press()
    pointer('pointermove', 2, ROW * 2 + 8)
    expect(store.state.gesture).toBeNull()
    pointer('pointermove', 1, ROW * 2 + 8)
    expect(store.state.gesture?.currentId).toBe('c')
    pointer('pointerup', 2, ROW * 2 + 8)
    expect(store.isPressActive()).toBe(true)
  })

  it('stops listening to the document once the press ends', () => {
    const added = vi.spyOn(document, 'addEventListener')
    const removed = vi.spyOn(document, 'removeEventListener')
    const { store, pointer, press, commits } = setup()
    press()
    pointer('pointermove', 1, ROW + 8)
    pointer('pointerup', 1, ROW + 8)
    expect(store.isPressActive()).toBe(false)
    // The release committed the drag over rows a and b.
    expect(commits.get('a')).toHaveBeenCalledOnce()
    expect(commits.get('b')).toHaveBeenCalledOnce()
    expect(commits.get('c')).not.toHaveBeenCalled()
    const listening = added.mock.calls.filter(
      ([type, listener, options]) =>
        !removed.mock.calls.some(
          (call) =>
            call[0] === type && call[1] === listener && call[2] === options,
        ),
    )
    expect(listening).toEqual([])
  })

  it('stops waiting for the release of a drag cancelled by Escape once it comes', () => {
    const added = vi.spyOn(document, 'addEventListener')
    const removed = vi.spyOn(document, 'removeEventListener')
    const { store, pointer, press } = setup()
    press()
    pointer('pointermove', 1, ROW + 8)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(store.state.gesture).toBeNull()
    pointer('pointerup', 1, ROW + 8)
    // The click that release fires is suppressed, and nothing still listens.
    expect(store.consumeClickSuppression()).toBe(true)
    const listening = added.mock.calls.filter(
      ([type, listener, options]) =>
        !removed.mock.calls.some(
          (call) =>
            call[0] === type && call[1] === listener && call[2] === options,
        ),
    )
    expect(listening).toEqual([])
  })
})
