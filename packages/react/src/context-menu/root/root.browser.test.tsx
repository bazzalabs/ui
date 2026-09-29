import { render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { findPositioned } from '../../../test/browser.js'
import { ContextMenu } from '../index.js'

// The popup has a fixed size that fits below and to the right of every click
// point, so collision handling never moves it.
function CursorContextMenu(props: {
  onContextMenu: React.MouseEventHandler<HTMLDivElement>
}) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        data-testid="trigger"
        onContextMenu={props.onContextMenu}
        style={{ position: 'fixed', top: 0, left: 0, width: 400, height: 400 }}
      />
      <ContextMenu.Portal>
        <ContextMenu.Positioner data-testid="positioner">
          <ContextMenu.Popup style={{ width: 120, height: 80 }}>
            <ContextMenu.Surface>
              <ContextMenu.List>
                <ContextMenu.Item>Item 1</ContextMenu.Item>
              </ContextMenu.List>
            </ContextMenu.Surface>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

interface Point {
  x: number
  y: number
}

// The test iframe can sit at a fractional offset in the runner page, so a
// click lands within a pixel of the requested `position`, and the reported
// coordinates may be fractional. Record what the browser reported and compare
// the menu's position to it with a 1px tolerance.
function renderCursorContextMenu() {
  const cursor: Point = { x: Number.NaN, y: Number.NaN }
  render(
    <CursorContextMenu
      onContextMenu={(event) => {
        cursor.x = event.clientX
        cursor.y = event.clientY
      }}
    />,
  )
  return cursor
}

// While the menu is open, its modal backdrop covers the trigger, so
// Playwright's hit-target check refuses a second right-click. `force` skips
// that check and sends real input at the point. The right button's
// `pointerdown` lands on the backdrop and closes the menu (the default
// `closeOnOutsidePress="pointerdown"`), so by the time `contextmenu` fires the
// backdrop is gone and the event reaches the trigger, which reopens the menu
// at the new point.
async function rightClickAt(point: Point) {
  await userEvent.click(screen.getByTestId('trigger'), {
    button: 'right',
    position: point,
    force: true,
  })
}

function readTranslate(element: HTMLElement): Point {
  const match = /^translate\((-?[\d.]+)px, (-?[\d.]+)px\)$/.exec(
    element.style.transform,
  )
  if (!match) {
    throw new Error(`Unexpected transform: "${element.style.transform}"`)
  }
  return { x: Number(match[1]), y: Number(match[2]) }
}

function expectWithinOnePixel(actual: Point, expected: Point) {
  expect(Math.abs(actual.x - expected.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(actual.y - expected.y)).toBeLessThanOrEqual(1)
}

describe('ContextMenu.Root in the browser', () => {
  it('opens the menu at the cursor', async () => {
    const cursor = renderCursorContextMenu()

    await rightClickAt({ x: 150, y: 200 })

    const positioner = await findPositioned('positioner')
    expectWithinOnePixel(cursor, { x: 150, y: 200 })
    expectWithinOnePixel(readTranslate(positioner), cursor)
  })

  it('moves the menu to the cursor of a second right-click', async () => {
    const cursor = renderCursorContextMenu()
    await rightClickAt({ x: 150, y: 200 })
    await findPositioned('positioner')

    await rightClickAt({ x: 60, y: 90 })

    expectWithinOnePixel(cursor, { x: 60, y: 90 })
    await vi.waitFor(() => {
      expectWithinOnePixel(
        readTranslate(screen.getByTestId('positioner')),
        cursor,
      )
    })
  })
})
