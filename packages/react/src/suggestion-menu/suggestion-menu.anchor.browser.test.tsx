import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { findPositioned } from '../../test/browser.js'
import type { ItemDef } from '../internal/popup-menu/index.js'
import { SuggestionMenu } from './index.js'

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

const item = (value: string): ItemDef => ({
  kind: 'item',
  value,
  render: ({ props }) => (
    <SuggestionMenu.Item {...props} data-testid={value}>
      {value}
    </SuggestionMenu.Item>
  ),
})

function Parts() {
  return (
    <SuggestionMenu.Portal>
      <SuggestionMenu.Positioner data-testid="positioner">
        {/* A fixed size, so filtering never resizes the popup and repositions it. */}
        <SuggestionMenu.Popup
          data-testid="popup"
          style={{ width: 160, height: 96 }}
        >
          <SuggestionMenu.Surface
            content={[item('Alice'), item('Carla'), item('Dana')]}
          >
            <SuggestionMenu.List>
              <Rows />
            </SuggestionMenu.List>
          </SuggestionMenu.Surface>
        </SuggestionMenu.Popup>
      </SuggestionMenu.Positioner>
    </SuggestionMenu.Portal>
  )
}

const rect = (x: number, y: number) => new DOMRect(x, y, 0, 16)

/** Where the popup's top-left corner is in the viewport. */
function popupCorner() {
  const box = screen.getByTestId('popup').getBoundingClientRect()
  return { x: box.left, y: box.top }
}

/** The popup opens below the anchor, aligned to its start. */
async function expectBelow(anchor: DOMRect) {
  await vi.waitFor(() => {
    const corner = popupCorner()
    expect(Math.abs(corner.x - anchor.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(corner.y - anchor.bottom)).toBeLessThanOrEqual(1)
  })
}

const frames = (count: number) =>
  new Promise<void>((resolve) => {
    let left = count
    const tick = () => {
      left -= 1
      if (left <= 0) resolve()
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

/** Wraps an anchor function to count how often the menu measures it. */
function counted(anchor: () => DOMRect | null) {
  let calls = 0
  return {
    anchor: () => {
      calls += 1
      return anchor()
    },
    calls: () => calls,
  }
}

/**
 * Waits until the opening's own position passes (observers reporting the
 * anchor's first layout) have stopped measuring the anchor, so only what the
 * test does next can move the popup.
 */
async function settled(calls: () => number) {
  let last = calls()
  let quiet = 0
  while (quiet < 5) {
    await frames(1)
    const now = calls()
    quiet = now === last ? quiet + 1 : 0
    last = now
  }
}

describe('SuggestionMenu anchor in the browser', () => {
  it('positions the popup against the rect the anchor measures', async () => {
    const menu = SuggestionMenu.createHandle()
    render(
      <SuggestionMenu.Root handle={menu}>
        <Parts />
      </SuggestionMenu.Root>,
    )

    act(() => menu.update({ query: '', anchor: () => rect(10, 20) }))

    await findPositioned('positioner')
    await expectBelow(rect(10, 20))
  })

  it('follows the host input when its scroll container scrolls', async () => {
    const menu = SuggestionMenu.createHandle()
    render(
      <>
        <div
          data-testid="scroller"
          style={{
            position: 'fixed',
            top: 100,
            left: 40,
            width: 300,
            height: 120,
            overflow: 'auto',
          }}
        >
          <textarea
            data-testid="host"
            style={{ display: 'block', marginTop: 40, height: 20 }}
            ref={(el) => {
              if (el) menu.attach(el)
            }}
          />
          <div style={{ height: 400 }} />
        </div>
        <SuggestionMenu.Root handle={menu}>
          <Parts />
        </SuggestionMenu.Root>
      </>,
    )
    const host = screen.getByTestId('host')
    // The trigger character sits at the host's top-left corner.
    const measure = () => {
      const box = host.getBoundingClientRect()
      return rect(box.left, box.top)
    }
    const opening = counted(measure)
    act(() => menu.update({ query: '', anchor: opening.anchor }))
    await findPositioned('positioner')
    const opened = measure()
    await expectBelow(opened)
    await settled(opening.calls)

    screen.getByTestId('scroller').scrollTop = 30

    await expectBelow(rect(opened.x, opened.y - 30))
  })

  it('measures again on each update, even with the same function', async () => {
    const menu = SuggestionMenu.createHandle()
    render(
      <SuggestionMenu.Root handle={menu}>
        <Parts />
      </SuggestionMenu.Root>,
    )
    let y = 20
    const opening = counted(() => rect(10, y))
    act(() => menu.update({ query: '', anchor: opening.anchor }))
    await findPositioned('positioner')
    await expectBelow(rect(10, 20))
    await settled(opening.calls)

    // The trigger wrapped to the next line; the host only updates the query.
    y = 40
    act(() => menu.update({ query: 'a' }))

    await expectBelow(rect(10, 40))
  })

  it('anchors once a stable anchor starts measuring', async () => {
    const menu = SuggestionMenu.createHandle()
    let ready = false
    const stable = () => (ready ? rect(10, 20) : null)
    render(
      <SuggestionMenu.Root handle={menu} anchor={stable}>
        <Parts />
      </SuggestionMenu.Root>,
    )

    ready = true
    act(() => menu.update({ query: '' }))

    await findPositioned('positioner')
    await expectBelow(rect(10, 20))
  })

  it('measures when a controlled menu opens', async () => {
    const menu = SuggestionMenu.createHandle()
    let ready = false
    const stable = () => (ready ? rect(10, 20) : null)
    const view = render(
      <SuggestionMenu.Root handle={menu} anchor={stable} open={false}>
        <Parts />
      </SuggestionMenu.Root>,
    )
    ready = true

    view.rerender(
      <SuggestionMenu.Root handle={menu} anchor={stable} open>
        <Parts />
      </SuggestionMenu.Root>,
    )

    await findPositioned('positioner')
    await expectBelow(rect(10, 20))
  })

  it('keeps the last position when the anchor returns null', async () => {
    const menu = SuggestionMenu.createHandle()
    render(
      <SuggestionMenu.Root handle={menu}>
        <Parts />
      </SuggestionMenu.Root>,
    )
    const opening = counted(() => rect(10, 20))
    act(() => menu.update({ query: '', anchor: opening.anchor }))
    await findPositioned('positioner')
    await expectBelow(rect(10, 20))
    await settled(opening.calls)

    const missing = counted(() => null)
    act(() => menu.update({ query: 'a', anchor: missing.anchor }))
    const measuredOnUpdate = missing.calls()
    // Resizing the window repositions the popup, measuring the anchor again.
    window.dispatchEvent(new Event('resize'))
    await vi.waitFor(() => {
      expect(missing.calls()).toBeGreaterThan(measuredOnUpdate)
    })

    await expectBelow(rect(10, 20))
  })

  // Base UI repositions the popup whenever it gets a new anchor object, which
  // measures the anchor again. An update whose rect is unchanged keeps the
  // object, so the anchor is measured once, for the update itself.
  it.each([
    ['with a host input', true],
    ['without a host input', false],
  ] as const)('repositions only when the measured rect changes, %s', async (_, withHost) => {
    const menu = SuggestionMenu.createHandle()
    render(
      <>
        {withHost ? (
          <textarea
            style={{ position: 'fixed', top: 300, left: 300, height: 20 }}
            ref={(el) => {
              if (el) menu.attach(el)
            }}
          />
        ) : null}
        <SuggestionMenu.Root handle={menu}>
          <Parts />
        </SuggestionMenu.Root>
      </>,
    )
    const opening = counted(() => rect(10, 20))
    act(() => menu.update({ query: '', anchor: opening.anchor }))
    await findPositioned('positioner')
    await expectBelow(rect(10, 20))
    await settled(opening.calls)

    const same = counted(() => rect(10, 20))
    act(() => menu.update({ query: 'a', anchor: same.anchor }))
    await frames(5)
    expect(same.calls()).toBe(1)

    act(() => menu.update({ query: 'al', anchor: () => rect(30, 20) }))
    await expectBelow(rect(30, 20))
  })
})
