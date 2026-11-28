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

  it('runs no animation frames while idle over or past a submenu', async () => {
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
                  <ContextMenu.Submenu>
                    <ContextMenu.SubmenuTrigger data-testid="submenu-trigger">
                      More
                    </ContextMenu.SubmenuTrigger>
                    <ContextMenu.Portal>
                      <ContextMenu.Positioner data-testid="submenu-positioner">
                        <ContextMenu.Popup data-testid="submenu-popup">
                          <ContextMenu.Surface>
                            <ContextMenu.List>
                              <ContextMenu.Item data-testid="nested">
                                Nested
                              </ContextMenu.Item>
                            </ContextMenu.List>
                          </ContextMenu.Surface>
                        </ContextMenu.Popup>
                      </ContextMenu.Positioner>
                    </ContextMenu.Portal>
                  </ContextMenu.Submenu>
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

    const settle = async () => {
      await vi.waitFor(() => {
        expect(document.getAnimations()).toHaveLength(0)
      })
      await nextFrame()
      await nextFrame()
    }
    const idleFrames = () =>
      countAnimationFrames(
        () => new Promise((resolve) => setTimeout(resolve, IDLE_MS)),
      )

    // Resting on the trigger: its pointer trail is held, the submenu open
    await userEvent.hover(screen.getByTestId('submenu-trigger'))
    await findPositioned('submenu-positioner')
    await settle()
    expect(await idleFrames()).toBe(0)

    // Moved into the submenu: its exit tracked, then settled
    await userEvent.hover(screen.getByTestId('nested'))
    await settle()
    expect(await idleFrames()).toBe(0)

    // Moved back to a sibling row: the submenu closes
    await userEvent.hover(screen.getByText('Item 3'))
    await vi.waitFor(() => {
      expect(screen.queryByTestId('submenu-popup')).toBeNull()
    })
    await settle()
    expect(await idleFrames()).toBe(0)
  })

  it('runs no animation frames while idle after a drag selection, and stops its auto-scroll frames on release', async () => {
    render(
      <ContextMenu.Root dragSelection="keep">
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
                <ContextMenu.List
                  data-testid="list"
                  style={{ maxHeight: 128, overflowY: 'auto' }}
                >
                  {Array.from({ length: 20 }, (_, index) => (
                    <ContextMenu.CheckboxItem
                      // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list
                      key={index}
                      data-testid={`cb-${index}`}
                      style={{ height: 32, boxSizing: 'border-box' }}
                    >
                      Row {index}
                    </ContextMenu.CheckboxItem>
                  ))}
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
    const settle = async () => {
      await vi.waitFor(() => {
        expect(document.getAnimations()).toHaveLength(0)
      })
      await nextFrame()
      await nextFrame()
    }
    const idleFrames = () =>
      countAnimationFrames(
        () => new Promise((resolve) => setTimeout(resolve, IDLE_MS)),
      )
    await settle()

    const list = screen.getByTestId('list')
    const first = screen.getByTestId('cb-0')
    const box = first.getBoundingClientRect()
    const pointer = (type: string, target: EventTarget, clientY: number) =>
      target.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          pointerId: 7,
          pointerType: 'mouse',
          button: 0,
          buttons: type === 'pointerup' ? 0 : 1,
          clientX: box.left + 10,
          clientY,
        }),
      )

    // Pressed and dragged inside the list, clear of its edges: no frames.
    pointer('pointerdown', first, box.top + 16)
    pointer('pointermove', document, box.top + 48)
    await vi.waitFor(() => {
      expect(screen.getByTestId('cb-1')).toHaveAttribute('data-pending')
    })
    expect(await idleFrames()).toBe(0)

    // Held past the bottom edge: auto-scroll runs a frame at a time.
    const bottom = list.getBoundingClientRect().bottom
    const scrolling = await countAnimationFrames(async () => {
      pointer('pointermove', document, bottom + 40)
      await vi.waitFor(() => expect(list.scrollTop).toBeGreaterThan(64))
    })
    expect(scrolling).toBeGreaterThan(0)

    // Released: the drag commits, and nothing runs while idle.
    pointer('pointerup', document, bottom + 40)
    await vi.waitFor(() => {
      expect(first).toHaveAttribute('aria-checked', 'true')
    })
    await settle()
    expect(await idleFrames()).toBe(0)
  })
})
