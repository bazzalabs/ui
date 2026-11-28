import { afterEach, describe, expect, it, vi } from 'vitest'
import { type Clock, createFakeClock } from '../platform/clock.js'
import {
  SelectionGestureController,
  type SelectionGestureSnapshot,
  type SelectionPressBinding,
  type SelectionRowOwner,
} from './selection-gesture.js'

const ROW = 32

/**
 * A surface whose navigation order is `ids`; the rows in `mounted` are laid
 * out 32px apart from the top of a 128px scroll area, which scrolls them.
 */
function setup(
  initialIds: string[],
  options: { mounted?: string[]; area?: boolean } = {},
) {
  let ids = [...initialIds]
  const mounted = new Set(options.mounted ?? initialIds)
  const fake = createFakeClock()
  const frames = { requested: 0, ran: 0 }
  const clock: Clock = {
    ...fake,
    requestFrame: (callback) => {
      frames.requested++
      return fake.requestFrame(() => {
        frames.ran++
        callback()
      })
    },
  }
  let scrollTop = 0
  const maxScroll = Math.max(0, initialIds.length * ROW - 128)
  const scrollBy = vi.fn((delta: number) => {
    const next = Math.min(maxScroll, Math.max(0, scrollTop + delta))
    const moved = next !== scrollTop
    scrollTop = next
    return moved
  })
  const highlight = vi.fn()
  let preview: ReadonlySet<string> = new Set()
  const previewWrites = vi.fn((next: ReadonlySet<string>) => {
    preview = next
  })
  const controller = new SelectionGestureController<'range' | 'drag'>({
    getNavOrder: () => ids,
    layout: {
      rowTop: (id) =>
        mounted.has(id) ? ids.indexOf(id) * ROW - scrollTop : null,
      scrollArea: () =>
        options.area === false ? null : { top: 0, bottom: 128, height: 128 },
      scrollBy,
    },
    preview: { get: () => preview, set: previewWrites },
    highlight,
    dragReason: 'drag',
    clock,
  })
  const checked = new Map<string, boolean>()
  function row(
    id: string,
    rowOptions: {
      value?: string
      owner?: SelectionRowOwner<'range' | 'drag'> | null
      checked?: boolean
      accept?: boolean
    } = {},
  ) {
    checked.set(id, rowOptions.checked ?? false)
    const commit = vi.fn((next: boolean) => {
      if (rowOptions.accept === false) return false
      checked.set(id, next)
      return true
    })
    const unregister = controller.registerRow({
      id,
      value: rowOptions.value ?? id,
      owner: rowOptions.owner ?? null,
      getChecked: () => checked.get(id) ?? false,
      commit,
    })
    return { commit, unregister }
  }
  function owner(id: string, initial: string[], accept = true) {
    let value = [...initial]
    const setValue = vi.fn((next: string[]) => {
      if (accept) value = next
      return accept
    })
    return { id, getValue: () => value, setValue }
  }
  function binding() {
    const awaited: Array<() => void> = []
    const stopped = vi.fn()
    const press: SelectionPressBinding & {
      awaited: Array<() => void>
      stopped: typeof stopped
    } = {
      release: vi.fn(),
      awaitRelease: vi.fn((onRelease: () => void) => {
        awaited.push(onRelease)
        return stopped
      }),
      awaited,
      stopped,
    }
    return press
  }
  /** The pointer's y over the middle of row `index`. */
  const over = (index: number) => index * ROW + ROW / 2 - scrollTop
  return {
    controller,
    /** The preview as the controller last wrote it. */
    preview: () => preview,
    previewWrites,
    fake,
    frames,
    scrollBy,
    highlight,
    checked,
    row,
    owner,
    binding,
    over,
    setIds: (next: string[]) => (ids = next),
    get scrollTop() {
      return scrollTop
    },
  }
}

const snapshot = (controller: {
  getSnapshot(): SelectionGestureSnapshot
}): SelectionGestureSnapshot => controller.getSnapshot()

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SelectionGestureController', () => {
  describe('rows and anchor', () => {
    it('selects only registered rows in the navigation order', () => {
      const { controller, row, setIds } = setup(['a', 'b'])
      row('a')
      row('hidden')
      expect(controller.isSelectableRow('a')).toBe(true)
      expect(controller.isSelectableRow('b')).toBe(false)
      expect(controller.isSelectableRow('hidden')).toBe(false)
      setIds(['b'])
      expect(controller.isSelectableRow('a')).toBe(false)
    })

    it("doesn't let a stale unregister remove the row that replaced it", () => {
      const { controller, row } = setup(['a'])
      const stale = row('a')
      row('a', { checked: true })
      stale.unregister()
      expect(controller.isSelectableRow('a')).toBe(true)
    })

    it('uses the anchor only while it is selectable', () => {
      const { controller, row, setIds } = setup(['a', 'b'])
      row('a')
      controller.setAnchor('a')
      expect(controller.getUsableAnchor()).toBe('a')
      setIds(['b'])
      expect(controller.getUsableAnchor()).toBeNull()
    })

    it('spans the navigation order, mounted or not', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { controller, row } = setup(['a', 'virtual', 'b'], {
        mounted: ['a', 'b'],
      })
      row('a')
      row('b')
      controller.beginGesture('keyboard', 'b', 'keep')
      controller.extendGesture('a')
      expect(snapshot(controller).gesture?.reached).toEqual([
        'b',
        'a',
        'virtual',
      ])
      // A row outside the navigation order ends no span.
      controller.extendGesture('ghost')
      expect(snapshot(controller).gesture?.currentId).toBe('a')
    })
  })

  describe('keyboard gesture', () => {
    it("previews the start row's new state on the rows of the span it would change, then commits it once", () => {
      const { controller, row, preview } = setup(['a', 'b', 'c'])
      const a = row('a')
      const b = row('b')
      row('c', { checked: true })
      controller.beginGesture('keyboard', 'a', 'rubber-band')
      controller.extendGesture('c')
      // c is checked already: the span doesn't change it, so it isn't pending.
      expect([...preview()]).toEqual(['a', 'b'])
      expect(controller.commitGesture('range')).toEqual({
        count: 2,
        checked: true,
      })
      expect(a.commit).toHaveBeenCalledExactlyOnceWith(true, 'range', undefined)
      expect(b.commit).toHaveBeenCalledOnce()
      expect(snapshot(controller)).toMatchObject({
        anchorId: 'a',
        gesture: null,
      })
      expect(preview().size).toBe(0)
    })

    it('shrinks a rubber-band span, and keeps every row reached in keep mode', () => {
      const rubber = setup(['a', 'b', 'c'])
      for (const id of ['a', 'b', 'c']) rubber.row(id)
      rubber.controller.beginGesture('keyboard', 'a', 'rubber-band')
      rubber.controller.extendGesture('c')
      rubber.controller.extendGesture('b')
      expect([...rubber.preview()]).toEqual(['a', 'b'])

      const keep = setup(['a', 'b', 'c'])
      for (const id of ['a', 'b', 'c']) keep.row(id)
      keep.controller.beginGesture('drag', 'a', 'keep')
      keep.controller.extendGesture('c')
      keep.controller.extendGesture('a')
      expect([...keep.preview()]).toEqual(['a', 'b', 'c'])
    })

    it("doesn't start while one is active, or on a row it can't select", () => {
      const { controller, row } = setup(['a', 'b'])
      row('a')
      row('b')
      controller.beginGesture('keyboard', 'ghost', 'keep')
      expect(snapshot(controller).gesture).toBeNull()
      controller.beginGesture('keyboard', 'a', 'keep')
      controller.beginGesture('drag', 'b', 'keep')
      expect(snapshot(controller).gesture).toMatchObject({
        kind: 'keyboard',
        startId: 'a',
      })
    })

    it('commits every reached row that differs from the target when it commits, even one that changed since the preview', () => {
      const { controller, row, preview, checked } = setup(['a', 'b', 'c'])
      const a = row('a')
      const b = row('b', { checked: true })
      const c = row('c')
      controller.beginGesture('keyboard', 'a', 'rubber-band')
      controller.extendGesture('c')
      expect([...preview()]).toEqual(['a', 'c'])
      // b is unchecked from outside while Shift is held.
      checked.set('b', false)
      expect(controller.commitGesture('range')).toEqual({
        count: 3,
        checked: true,
      })
      for (const reached of [a, b, c]) {
        expect(reached.commit).toHaveBeenCalledExactlyOnceWith(
          true,
          'range',
          undefined,
        )
      }
      expect(preview().size).toBe(0)
    })

    it('drops the preview when cancelled', () => {
      const { controller, row, preview } = setup(['a'])
      const a = row('a')
      controller.beginGesture('keyboard', 'a', 'keep')
      expect(preview().size).toBe(1)
      controller.cancelGesture()
      expect(snapshot(controller).gesture).toBeNull()
      expect(preview().size).toBe(0)
      expect(controller.commitGesture('range').count).toBe(0)
      expect(a.commit).not.toHaveBeenCalled()
    })
  })

  describe('commits', () => {
    it('commits a group once where its first changed row sits, and standalone rows in order', () => {
      const { controller, row, owner } = setup(['s1', 'x', 's2', 'y'])
      const calls: string[] = []
      const group = owner('g', ['z'])
      group.setValue.mockImplementation(() => {
        calls.push('g')
        return true
      })
      const s1 = row('s1')
      s1.commit.mockImplementation(() => {
        calls.push('s1')
        return true
      })
      row('x', { owner: group })
      const s2 = row('s2')
      s2.commit.mockImplementation(() => {
        calls.push('s2')
        return true
      })
      row('y', { owner: group })
      controller.beginGesture('drag', 's1', 'keep')
      controller.extendGesture('y')
      expect(controller.commitGesture('drag').count).toBe(4)
      expect(calls).toEqual(['s1', 'g', 's2'])
      expect(group.setValue).toHaveBeenCalledExactlyOnceWith(
        ['z', 'x', 'y'],
        'drag',
        undefined,
      )
    })

    it('commits in navigation order when a drag ran upward', () => {
      const { controller, row, owner } = setup(['s1', 'x', 's2', 'y'])
      const calls: string[] = []
      const group = owner('g', [])
      group.setValue.mockImplementation(() => {
        calls.push('g')
        return true
      })
      for (const id of ['s1', 's2']) {
        row(id).commit.mockImplementation(() => {
          calls.push(id)
          return true
        })
      }
      row('x', { owner: group })
      row('y', { owner: group })
      controller.beginGesture('drag', 'y', 'keep')
      controller.extendGesture('s1')
      controller.commitGesture('drag')
      expect(calls).toEqual(['s1', 'g', 's2'])
    })

    it('keeps the group value order when unchecking, and counts only accepted changes', () => {
      const { controller, row, owner } = setup(['x', 'y', 'z', 's'])
      const group = owner('g', ['x', 'y', 'z'])
      for (const id of ['x', 'y', 'z']) row(id, { owner: group, checked: true })
      row('s', { checked: true, accept: false })
      controller.beginGesture('drag', 'y', 'keep')
      controller.extendGesture('s')
      expect(controller.commitGesture('drag')).toEqual({
        count: 2,
        checked: false,
      })
      expect(group.setValue).toHaveBeenCalledWith(['x'], 'drag', undefined)
    })

    it('announces commits, not zero changes, with the formatter when given', () => {
      const { controller, row } = setup(['a', 'b'])
      row('a')
      row('b', { accept: false })
      controller.announce(0, true)
      expect(snapshot(controller).announcement).toBeNull()
      controller.applyRange('a', 'a', 'range')
      expect(snapshot(controller).announcement).toEqual({
        text: '1 item checked',
        key: 1,
      })
      controller.setAnnouncementFormatter((count, checked) =>
        checked ? `+${count}` : `-${count}`,
      )
      controller.applyRange('a', 'a', 'range')
      expect(snapshot(controller).announcement).toEqual({ text: '-1', key: 2 })
      controller.applyRange('b', 'b', 'range')
      expect(snapshot(controller).announcement?.key).toBe(2)
      controller.clearAnnouncement()
      expect(snapshot(controller).announcement).toBeNull()
    })
  })

  describe('range', () => {
    it("sets the span to the target's new state at once, and moves the anchor", () => {
      const { controller, row } = setup(['a', 'b', 'c'])
      row('a', { checked: true })
      const b = row('b')
      const c = row('c')
      expect(controller.applyRange('a', 'c', 'range')).toEqual({
        count: 2,
        checked: true,
      })
      expect(b.commit).toHaveBeenCalledOnce()
      expect(c.commit).toHaveBeenCalledOnce()
      expect(snapshot(controller).anchorId).toBe('c')
    })

    it('toggles only the target from a stale anchor', () => {
      const { controller, row } = setup(['a', 'b'])
      const a = row('a')
      const b = row('b')
      expect(controller.applyRange('ghost', 'b', 'range').count).toBe(1)
      expect(a.commit).not.toHaveBeenCalled()
      expect(b.commit).toHaveBeenCalledOnce()
    })

    it('skips an unmounted row, warning once per surface', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { controller, row } = setup(['a', 'virtual', 'b'], {
        mounted: ['a', 'b'],
      })
      const a = row('a')
      const b = row('b')
      expect(controller.applyRange('a', 'b', 'range').count).toBe(2)
      controller.applyRange('a', 'b', 'range')
      expect(warn).toHaveBeenCalledOnce()
      expect(a.commit).toHaveBeenCalledTimes(2)
      expect(b.commit).toHaveBeenCalledTimes(2)
    })

    it("doesn't warn for a mounted row that isn't a checkbox", () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { controller, row } = setup(['a', 'plain', 'b'])
      row('a')
      row('b')
      controller.applyRange('a', 'b', 'range')
      expect(warn).not.toHaveBeenCalled()
    })
  })

  describe('pointer drag', () => {
    it('leaves a press released on its row as a click', () => {
      const { controller, row, binding, over } = setup(['a', 'b'])
      const a = row('a')
      row('b')
      const press = binding()
      expect(
        controller.beginPress(
          { id: 'a', mode: 'keep', clientY: over(0) },
          press,
        ),
      ).toBe(true)
      controller.movePress(over(0) + 4)
      expect(controller.isDragging()).toBe(false)
      controller.endPress(over(0))
      expect(press.release).toHaveBeenCalledOnce()
      expect(a.commit).not.toHaveBeenCalled()
      expect(controller.consumeClickSuppression()).toBe(false)
      expect(controller.isPressActive()).toBe(false)
    })

    it('becomes a drag on reaching another row, follows it, and commits on release', () => {
      const { controller, fake, row, binding, over, highlight, preview } =
        setup(['a', 'b', 'c'])
      for (const id of ['a', 'b', 'c']) row(id)
      const press = binding()
      controller.beginPress({ id: 'a', mode: 'keep', clientY: over(0) }, press)
      controller.movePress(over(1))
      expect(controller.isDragging()).toBe(true)
      expect(highlight).toHaveBeenLastCalledWith('b')
      expect([...preview()]).toEqual(['a', 'b'])
      // A release on a row the pointer reached without a move counts.
      const event = new Event('pointerup')
      controller.endPress(over(2), event)
      expect(snapshot(controller).announcement?.text).toBe('3 items checked')
      expect(press.release).toHaveBeenCalledOnce()
      // The click the release fires is suppressed, once.
      expect(controller.consumeClickSuppression()).toBe(true)
      expect(controller.consumeClickSuppression()).toBe(false)
      expect(fake.pendingTimers()).toBe(1)
    })

    it('stops suppressing the click in the next task', () => {
      const { controller, fake, row, binding, over } = setup(['a', 'b'])
      row('a')
      row('b')
      controller.beginPress(
        { id: 'a', mode: 'keep', clientY: over(0) },
        binding(),
      )
      controller.movePress(over(1))
      controller.endPress(over(1))
      fake.advance(0)
      expect(controller.consumeClickSuppression()).toBe(false)
    })

    it('keeps one suppression timer however often it is armed', () => {
      const { controller, fake, row, binding, over } = setup(['a', 'b'])
      row('a')
      row('b')
      for (let drag = 0; drag < 2; drag++) {
        controller.beginPress(
          { id: 'a', mode: 'keep', clientY: over(0) },
          binding(),
        )
        controller.movePress(over(1))
        controller.endPress(over(1))
      }
      expect(fake.pendingTimers()).toBe(1)
    })

    it('commits a drag with the drag reason', () => {
      const { controller, row, binding, over } = setup(['a', 'b'])
      const a = row('a')
      row('b')
      controller.beginPress(
        { id: 'a', mode: 'keep', clientY: over(0) },
        binding(),
      )
      controller.movePress(over(1))
      const event = new Event('pointerup')
      controller.endPress(over(1), event)
      expect(a.commit).toHaveBeenCalledExactlyOnceWith(true, 'drag', event)
    })

    it('cancels a drag, suppressing the click its eventual release fires', () => {
      const { controller, fake, row, binding, over } = setup(['a', 'b'])
      const a = row('a')
      row('b')
      const press = binding()
      controller.beginPress({ id: 'a', mode: 'keep', clientY: over(0) }, press)
      controller.movePress(over(1))
      controller.cancelPress()
      expect(snapshot(controller).gesture).toBeNull()
      expect(press.release).toHaveBeenCalledOnce()
      expect(press.awaitRelease).toHaveBeenCalledOnce()
      fake.advance(0)
      expect(controller.consumeClickSuppression()).toBe(false)
      press.awaited[0]?.()
      expect(controller.consumeClickSuppression()).toBe(true)
      expect(a.commit).not.toHaveBeenCalled()
    })

    it('cancels a press that never dragged without suppressing anything', () => {
      const { controller, row, binding, over } = setup(['a'])
      row('a')
      const press = binding()
      controller.beginPress({ id: 'a', mode: 'keep', clientY: over(0) }, press)
      controller.cancelPress()
      expect(press.awaitRelease).not.toHaveBeenCalled()
      expect(controller.consumeClickSuppression()).toBe(false)
    })

    it("doesn't start on an unselectable row, or while a press or gesture is active", () => {
      const { controller, row, binding, over } = setup(['a', 'b'])
      row('a')
      row('b')
      expect(
        controller.beginPress(
          { id: 'ghost', mode: 'keep', clientY: 0 },
          binding(),
        ),
      ).toBe(false)
      controller.beginPress(
        { id: 'a', mode: 'keep', clientY: over(0) },
        binding(),
      )
      expect(
        controller.beginPress(
          { id: 'b', mode: 'keep', clientY: over(1) },
          binding(),
        ),
      ).toBe(false)
    })

    it('clamps the pointer to the mounted rows and the scroll area', () => {
      const { controller, row, binding, over } = setup(['a', 'b', 'c', 'd'], {
        mounted: ['b', 'c'],
      })
      for (const id of ['a', 'b', 'c', 'd']) row(id)
      controller.beginPress(
        { id: 'b', mode: 'keep', clientY: over(1) },
        binding(),
      )
      controller.movePress(over(2))
      expect(snapshot(controller).gesture?.currentId).toBe('c')
    })

    it('clamps the pointer to the first and last mounted rows without a scroll area', () => {
      const { controller, row, binding, over } = setup(['a', 'b', 'c', 'd'], {
        mounted: ['b', 'c'],
        area: false,
      })
      for (const id of ['a', 'b', 'c', 'd']) row(id)
      controller.beginPress(
        { id: 'b', mode: 'rubber-band', clientY: over(1) },
        binding(),
      )
      controller.movePress(500)
      expect(snapshot(controller).gesture?.currentId).toBe('c')
      controller.movePress(-50)
      expect(snapshot(controller).gesture?.currentId).toBe('b')
    })
  })

  describe('auto-scroll', () => {
    const ids = Array.from({ length: 10 }, (_, index) => `cb-${index}`)

    it('requests no frame for a press, or a drag away from the edges', () => {
      const { controller, frames, row, binding, over } = setup(ids)
      for (const id of ids) row(id)
      controller.beginPress(
        { id: 'cb-0', mode: 'keep', clientY: over(0) },
        binding(),
      )
      expect(frames.requested).toBe(0)
      controller.movePress(over(1) + 8)
      expect(controller.isDragging()).toBe(true)
      expect(frames.requested).toBe(0)
    })

    it('scrolls a frame at a time past the bottom edge, extending the span as rows come in', () => {
      const t = setup(ids)
      for (const id of ids) t.row(id)
      t.controller.beginPress(
        { id: 'cb-0', mode: 'keep', clientY: t.over(0) },
        t.binding(),
      )
      // Past the bottom: clamped to the last visible row, at full speed.
      t.controller.movePress(200)
      expect(snapshot(t.controller).gesture?.currentId).toBe('cb-3')
      expect(t.frames.requested).toBe(1)
      t.fake.flushFrames()
      expect(t.scrollBy).toHaveBeenLastCalledWith(16)
      expect(snapshot(t.controller).gesture?.currentId).toBe('cb-4')
      expect(t.frames.requested).toBe(2)
      // Back inside the list, clear of the edge zone: the loop stops.
      t.controller.movePress(t.over(3))
      t.fake.flushFrames()
      expect(t.scrollBy).toHaveBeenCalledOnce()
      expect(t.frames.requested).toBe(2)
    })

    it("ramps the step with the pointer's depth into the edge zone, at least a pixel", () => {
      const t = setup(ids)
      for (const id of ids) t.row(id)
      t.controller.beginPress(
        { id: 'cb-0', mode: 'keep', clientY: t.over(0) },
        t.binding(),
      )
      t.controller.movePress(100)
      t.fake.flushFrames()
      expect(t.scrollBy).toHaveBeenLastCalledWith(2)
      t.controller.movePress(96.5)
      t.fake.flushFrames()
      expect(t.scrollBy).toHaveBeenLastCalledWith(1)
    })

    it('scrolls up past the top edge', () => {
      const t = setup(ids)
      for (const id of ids) t.row(id)
      t.controller.beginPress(
        { id: 'cb-0', mode: 'keep', clientY: t.over(0) },
        t.binding(),
      )
      t.controller.movePress(200)
      for (let frame = 0; frame < 4; frame++) t.fake.flushFrames()
      const scrolled = t.scrollTop
      t.controller.movePress(-40)
      t.fake.flushFrames()
      expect(t.scrollBy).toHaveBeenLastCalledWith(-16)
      expect(t.scrollTop).toBe(scrolled - 16)
    })

    it('stops at the end of the list until the pointer moves again', () => {
      const t = setup(ids)
      for (const id of ids) t.row(id)
      t.controller.beginPress(
        { id: 'cb-0', mode: 'keep', clientY: t.over(0) },
        t.binding(),
      )
      t.controller.movePress(200)
      for (let frame = 0; frame < 30; frame++) t.fake.flushFrames()
      // 192px of overflow at 16px a frame, then one frame that can't move.
      expect(t.scrollTop).toBe(192)
      expect(t.frames.requested).toBe(13)
      expect(snapshot(t.controller).gesture?.currentId).toBe('cb-9')
    })

    it('drops the frame when the drag ends', () => {
      const t = setup(ids)
      for (const id of ids) t.row(id)
      t.controller.beginPress(
        { id: 'cb-0', mode: 'keep', clientY: t.over(0) },
        t.binding(),
      )
      t.controller.movePress(200)
      t.controller.endPress(200)
      t.fake.flushFrames()
      expect(t.scrollBy).not.toHaveBeenCalled()
      expect(t.frames.ran).toBe(0)
    })

    it('drops the frame when the drag is cancelled', () => {
      const t = setup(ids)
      for (const id of ids) t.row(id)
      t.controller.beginPress(
        { id: 'cb-0', mode: 'keep', clientY: t.over(0) },
        t.binding(),
      )
      t.controller.movePress(200)
      t.controller.cancelPress()
      t.fake.flushFrames()
      expect(t.scrollBy).not.toHaveBeenCalled()
      expect(t.frames.ran).toBe(0)
    })

    it('starts a drag when the pointer leaves through an edge from the pressed row', () => {
      const t = setup(ids)
      for (const id of ids) t.row(id)
      t.controller.beginPress(
        { id: 'cb-3', mode: 'keep', clientY: t.over(3) },
        t.binding(),
      )
      t.controller.movePress(200)
      expect(t.controller.isDragging()).toBe(true)
      expect(t.frames.requested).toBe(1)
    })

    it("doesn't scroll without a scroll area", () => {
      const t = setup(ids, { area: false })
      for (const id of ids) t.row(id)
      t.controller.beginPress(
        { id: 'cb-0', mode: 'keep', clientY: t.over(0) },
        t.binding(),
      )
      t.controller.movePress(t.over(2))
      t.controller.movePress(500)
      expect(t.frames.requested).toBe(0)
    })
  })

  it('starts over on reset: no rows, gesture, press, or announcement', () => {
    const { controller, row, binding, over, preview } = setup(['a', 'b'])
    row('a')
    row('b')
    controller.applyRange('a', 'a', 'range')
    const press = binding()
    controller.beginPress({ id: 'a', mode: 'keep', clientY: over(0) }, press)
    controller.movePress(over(1))
    // a was checked by the range, so the drag unchecks; b is unchecked already.
    expect([...preview()]).toEqual(['a'])
    controller.reset()
    expect(preview().size).toBe(0)
    expect(press.release).toHaveBeenCalledOnce()
    expect(controller.isPressActive()).toBe(false)
    expect(controller.isSelectableRow('a')).toBe(false)
    expect(snapshot(controller)).toMatchObject({
      anchorId: null,
      gesture: null,
      announcement: null,
    })
  })

  it('tells its listeners once per change, and not for one that changes nothing', () => {
    const { controller, row } = setup(['a'])
    row('a')
    const listener = vi.fn()
    controller.subscribe(listener)
    controller.setAnchor('a')
    controller.setAnchor('a')
    controller.cancelGesture()
    expect(listener).toHaveBeenCalledOnce()
    controller.beginGesture('keyboard', 'a', 'keep')
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('writes the preview only while a gesture shows one', () => {
    const { controller, row, previewWrites, preview } = setup(['a', 'b'])
    row('a')
    row('b')
    controller.cancelGesture()
    controller.applyRange('a', 'b', 'range')
    controller.reset()
    expect(previewWrites).not.toHaveBeenCalled()
    row('a')
    row('b')
    controller.beginGesture('keyboard', 'a', 'keep')
    controller.extendGesture('b')
    controller.commitGesture('range')
    expect(previewWrites.mock.calls.map(([rows]) => [...rows])).toEqual([
      ['a'],
      ['a', 'b'],
      [],
    ])
    expect(preview().size).toBe(0)
  })

  describe('dispose', () => {
    const ids = Array.from({ length: 10 }, (_, index) => `cb-${index}`)

    it('ends a drag mid-scroll without a commit, a wait or a timer', () => {
      const t = setup(ids)
      const rows = ids.map((id) => t.row(id))
      const press = t.binding()
      t.controller.beginPress(
        { id: 'cb-0', mode: 'keep', clientY: t.over(0) },
        press,
      )
      t.controller.movePress(200)
      expect(t.frames.requested).toBe(1)
      expect(t.preview().size).toBeGreaterThan(0)
      t.controller.dispose()
      expect(t.preview().size).toBe(0)
      expect(press.release).toHaveBeenCalledOnce()
      expect(press.awaitRelease).not.toHaveBeenCalled()
      expect(snapshot(t.controller).gesture).toBeNull()
      expect(t.fake.pendingTimers()).toBe(0)
      t.fake.flushFrames()
      expect(t.frames.ran).toBe(0)
      expect(t.controller.consumeClickSuppression()).toBe(false)
      for (const row of rows) expect(row.commit).not.toHaveBeenCalled()
    })

    it('drops the suppression timer a release armed', () => {
      const { controller, fake, row, binding, over } = setup(['a', 'b'])
      row('a')
      row('b')
      controller.beginPress(
        { id: 'a', mode: 'keep', clientY: over(0) },
        binding(),
      )
      controller.movePress(over(1))
      controller.endPress(over(1))
      expect(fake.pendingTimers()).toBe(1)
      controller.dispose()
      expect(fake.pendingTimers()).toBe(0)
      expect(controller.consumeClickSuppression()).toBe(false)
    })

    it("stops waiting for a cancelled drag's release", () => {
      const { controller, fake, row, binding, over } = setup(['a', 'b'])
      row('a')
      row('b')
      const press = binding()
      controller.beginPress({ id: 'a', mode: 'keep', clientY: over(0) }, press)
      controller.movePress(over(1))
      controller.cancelPress()
      expect(press.awaitRelease).toHaveBeenCalledOnce()
      controller.dispose()
      expect(press.stopped).toHaveBeenCalledOnce()
      expect(fake.pendingTimers()).toBe(0)
    })

    it('ignores rows and presses that come after it', () => {
      const { controller, fake, frames, row, binding, over } = setup(['a', 'b'])
      controller.dispose()
      row('a')
      row('b')
      expect(controller.isSelectableRow('a')).toBe(false)
      const press = binding()
      expect(
        controller.beginPress(
          { id: 'a', mode: 'keep', clientY: over(0) },
          press,
        ),
      ).toBe(false)
      controller.movePress(200)
      controller.endPress(200)
      expect(fake.pendingTimers()).toBe(0)
      expect(frames.requested).toBe(0)
      expect(press.release).not.toHaveBeenCalled()
    })
  })
})
