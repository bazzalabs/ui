import { render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import { findPositioned } from '../../../test/browser.js'
import { DropdownMenu } from '../../dropdown-menu/index.js'

// Characterization test for the side a submenu opens on: it pins today's
// placement, read from the DOM, so an engine rewrite that changes it fails
// here.

// Base UI's default collision padding, which keeps a shifted popup this far
// inside the viewport.
const COLLISION_PADDING = 5
const POPUP_WIDTH = 160

function EdgeMenu({
  triggerPosition,
}: {
  triggerPosition: React.CSSProperties
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger
        data-testid="root-trigger"
        style={{
          position: 'fixed',
          top: 20,
          ...triggerPosition,
          width: 120,
          height: 32,
        }}
      >
        Open
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner data-testid="root-positioner">
          <DropdownMenu.Popup
            data-testid="root-popup"
            style={{ width: POPUP_WIDTH }}
          >
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                <DropdownMenu.Submenu defaultOpen>
                  <DropdownMenu.SubmenuTrigger
                    data-testid="submenu-trigger"
                    style={{ height: 32 }}
                  >
                    More
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner data-testid="submenu-positioner">
                      <DropdownMenu.Popup
                        data-testid="submenu-popup"
                        style={{ width: POPUP_WIDTH }}
                      >
                        <DropdownMenu.Surface>
                          <DropdownMenu.List>
                            <DropdownMenu.Item style={{ height: 32 }}>
                              Sub item
                            </DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

const MAX_SETTLE_FRAMES = 60

function describeRect(rect: DOMRect) {
  return `{ left: ${rect.left}, top: ${rect.top}, right: ${rect.right}, bottom: ${rect.bottom} }`
}

// The root popup shifts into the viewport first and the submenu follows it a
// frame or more later, so wait until the submenu holds still for 3 frames.
async function waitForStableRect(element: HTMLElement) {
  let previous = element.getBoundingClientRect()
  let next = previous
  let stableFrames = 0
  for (let frame = 0; frame < MAX_SETTLE_FRAMES; frame++) {
    await nextFrame()
    previous = next
    next = element.getBoundingClientRect()
    stableFrames =
      next.left === previous.left && next.top === previous.top
        ? stableFrames + 1
        : 0
    if (stableFrames === 3) return next
  }
  throw new Error(
    `Submenu popup still moving after ${MAX_SETTLE_FRAMES} frames: ${describeRect(previous)} then ${describeRect(next)}`,
  )
}

async function renderEdgeMenu(triggerPosition: React.CSSProperties) {
  render(<EdgeMenu triggerPosition={triggerPosition} />)
  await findPositioned('root-positioner')
  const positioner = await findPositioned('submenu-positioner')
  const popup = await waitForStableRect(screen.getByTestId('submenu-popup'))
  return {
    positioner,
    rootTrigger: screen.getByTestId('root-trigger').getBoundingClientRect(),
    rootPopup: screen.getByTestId('root-popup').getBoundingClientRect(),
    trigger: screen.getByTestId('submenu-trigger').getBoundingClientRect(),
    popup,
  }
}

describe('submenu side near the viewport edge', () => {
  it('opens to the right of its trigger when the right side has room', async () => {
    const { positioner, rootTrigger, rootPopup, trigger, popup } =
      await renderEdgeMenu({ left: 40 })

    // Nothing collides: the root trigger sits inside the viewport and the root
    // popup is centred under it, unshifted.
    expect(rootTrigger.left).toBeGreaterThanOrEqual(0)
    expect(rootTrigger.right).toBeLessThanOrEqual(window.innerWidth)
    expect(
      Math.abs(
        (rootPopup.left + rootPopup.right) / 2 -
          (rootTrigger.left + rootTrigger.right) / 2,
      ),
    ).toBeLessThanOrEqual(1)

    expect(positioner).toHaveAttribute('data-side', 'right')
    expect(Math.abs(popup.left - trigger.right)).toBeLessThanOrEqual(1)
  })

  it('stays on the right and shifts over its own trigger when the right side overflows', async () => {
    const { positioner, trigger, popup } = await renderEdgeMenu({ right: 0 })

    // The left side has room for the whole submenu here.
    expect(trigger.left).toBeGreaterThan(POPUP_WIDTH + COLLISION_PADDING)

    // Suspected bug: the submenu never flips to the side that overflows less;
    // it keeps side "right" and shifts left until it covers its trigger.
    expect(positioner).toHaveAttribute('data-side', 'right')
    expect(
      Math.abs(popup.right - (window.innerWidth - COLLISION_PADDING)),
    ).toBeLessThanOrEqual(1)
    expect(Math.abs(popup.left - trigger.left)).toBeLessThanOrEqual(1)
  })
})
