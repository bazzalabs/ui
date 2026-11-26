import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { findPositioned } from '../../../test/browser.js'
import { ContextMenu } from '../index.js'

const IDLE_MS = 500

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

/**
 * Runs `during` with `window.requestAnimationFrame` wrapped, and counts the
 * callbacks that ran.
 */
async function countAnimationFrames(during: () => Promise<void>) {
  const original = window.requestAnimationFrame
  let ran = 0
  window.requestAnimationFrame = (callback) =>
    original.call(window, (time) => {
      ran++
      callback(time)
    })
  try {
    await during()
  } finally {
    window.requestAnimationFrame = original
  }
  return ran
}

describe('ContextMenu idle frames in the browser', () => {
  it('runs no animation frames while open and idle', async () => {
    render(
      <ContextMenu.Root>
        <ContextMenu.Trigger
          data-testid="trigger"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: 400,
            height: 400,
          }}
        />
        <ContextMenu.Portal>
          <ContextMenu.Positioner data-testid="positioner">
            <ContextMenu.Popup data-testid="popup">
              <ContextMenu.Surface>
                <ContextMenu.List>
                  <ContextMenu.Item>Item 1</ContextMenu.Item>
                  <ContextMenu.Item>Item 2</ContextMenu.Item>
                  <ContextMenu.Item>Item 3</ContextMenu.Item>
                </ContextMenu.List>
              </ContextMenu.Surface>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    )

    await userEvent.click(screen.getByTestId('trigger'), {
      button: 'right',
      position: { x: 150, y: 200 },
    })
    await findPositioned('positioner')
    const popup = screen.getByTestId('popup')
    await vi.waitFor(() => {
      expect(popup.getAnimations({ subtree: true })).toHaveLength(0)
    })
    await nextFrame()
    await nextFrame()

    // The pointer stays where it right-clicked, over the popup's corner.
    const frames = await countAnimationFrames(
      () => new Promise((resolve) => setTimeout(resolve, IDLE_MS)),
    )

    expect(frames).toBe(0)
  })
})
