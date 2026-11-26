import { act, render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { findPositioned } from '../../../test/browser.js'
import { ContextMenu } from '../index.js'

// The popup has a fixed size that fits below and to the right of every click
// point, so collision handling never moves it.
function CursorContextMenu(props: {
  onContextMenu: React.MouseEventHandler<HTMLDivElement>
  onOpenChange?: ContextMenu.Root.Props['onOpenChange']
}) {
  return (
    <ContextMenu.Root onOpenChange={props.onOpenChange}>
      <ContextMenu.Trigger
        data-testid="trigger"
        onContextMenu={props.onContextMenu}
        style={{ position: 'fixed', top: 0, left: 0, width: 400, height: 400 }}
      />
      <ContextMenu.Portal>
        <ContextMenu.Positioner data-testid="positioner">
          <ContextMenu.Popup
            data-testid="popup"
            style={{ width: 120, height: 80 }}
          >
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
function renderCursorContextMenu(
  props: Pick<
    React.ComponentProps<typeof CursorContextMenu>,
    'onOpenChange'
  > = {},
) {
  const cursor: Point = { x: Number.NaN, y: Number.NaN }
  render(
    <CursorContextMenu
      {...props}
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

/** Where the popup's top-left corner is in the viewport. */
function popupCorner(): Point {
  const rect = screen.getByTestId('popup').getBoundingClientRect()
  return { x: rect.left, y: rect.top }
}

function expectWithinOnePixel(actual: Point, expected: Point) {
  expect(Math.abs(actual.x - expected.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(actual.y - expected.y)).toBeLessThanOrEqual(1)
}

describe('ContextMenu.Root in the browser', () => {
  it('opens the menu at the cursor', async () => {
    const cursor = renderCursorContextMenu()

    await rightClickAt({ x: 150, y: 200 })

    await findPositioned('positioner')
    expectWithinOnePixel(cursor, { x: 150, y: 200 })
    expectWithinOnePixel(popupCorner(), cursor)
  })

  it('moves the menu to the cursor of a second right-click', async () => {
    const cursor = renderCursorContextMenu()
    await rightClickAt({ x: 150, y: 200 })
    await findPositioned('positioner')

    await rightClickAt({ x: 60, y: 90 })

    expectWithinOnePixel(cursor, { x: 60, y: 90 })
    await vi.waitFor(() => {
      expectWithinOnePixel(popupCorner(), cursor)
    })
  })

  // A `contextmenu` that reaches the trigger while the menu is open (no
  // pointerdown closed it first) moves the open menu instead of reopening it.
  it('moves the open menu without closing it', async () => {
    const onOpenChange = vi.fn()
    const cursor = renderCursorContextMenu({ onOpenChange })
    await rightClickAt({ x: 150, y: 200 })
    await findPositioned('positioner')
    onOpenChange.mockClear()

    act(() => {
      screen.getByTestId('trigger').dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 60,
          clientY: 90,
          button: 2,
        }),
      )
    })

    expect(cursor).toEqual({ x: 60, y: 90 })
    await vi.waitFor(() => {
      expectWithinOnePixel(popupCorner(), cursor)
    })
    expect(onOpenChange).not.toHaveBeenCalledWith(false, expect.anything())
  })
})
