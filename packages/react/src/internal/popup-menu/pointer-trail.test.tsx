import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'

function MenuWithSubmenu({ withInput = false }: { withInput?: boolean }) {
  return (
    <DropdownMenu.Root defaultOpen debug={{ logAimGuardEvents: true }}>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              {withInput && <DropdownMenu.Input data-testid="search-input" />}
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="item-above">
                  Above
                </DropdownMenu.Item>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger">
                    More
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup data-testid="submenu-popup">
                        <DropdownMenu.Surface>
                          <DropdownMenu.List>
                            <DropdownMenu.Item>Nested</DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
                <DropdownMenu.Item data-testid="item-below">
                  Below
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function createRect(rect: {
  top: number
  left: number
  width: number
  height: number
}): DOMRect {
  return {
    ...rect,
    x: rect.left,
    y: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    toJSON: () => ({}),
  }
}

/** Tracks `pointermove` listeners currently attached to `window`. */
function spyOnWindowPointerMoveListeners() {
  const active = new Set<EventListenerOrEventListenerObject>()
  const add = window.addEventListener.bind(window)
  const remove = window.removeEventListener.bind(window)
  vi.spyOn(window, 'addEventListener').mockImplementation(
    (type: string, listener, options) => {
      if (type === 'pointermove' && listener) active.add(listener)
      add(type, listener, options)
    },
  )
  vi.spyOn(window, 'removeEventListener').mockImplementation(
    (type: string, listener, options) => {
      if (type === 'pointermove' && listener) active.delete(listener)
      remove(type, listener, options)
    },
  )
  return () => active.size
}

// The trigger sits at y 60-90 with its submenu to the right (x >= 240).
const TRIGGER_RECT = { top: 60, left: 80, width: 120, height: 30 }
const SUBMENU_RECT = { top: 40, left: 240, width: 180, height: 160 }

function mockTriggerRect(submenuTrigger: HTMLElement) {
  vi.spyOn(submenuTrigger, 'getBoundingClientRect').mockImplementation(() =>
    createRect(TRIGGER_RECT),
  )
}

function mockSubmenuRect(submenuPopup: HTMLElement) {
  vi.spyOn(submenuPopup, 'getBoundingClientRect').mockImplementation(() =>
    createRect(SUBMENU_RECT),
  )
}

function spyOnAimGuardLogs() {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  return (eventName: string) =>
    logSpy.mock.calls.some(([message]) => String(message).endsWith(eventName))
}

/**
 * Enters the trigger with no earlier pointer movement in the menu, and
 * records a single pointer sample inside it before the test leaves it.
 */
async function passIntoTrigger(inside: { clientX: number; clientY: number }) {
  const submenuTrigger = await screen.findByTestId('submenu-trigger')
  mockTriggerRect(submenuTrigger)

  fireEvent.pointerEnter(submenuTrigger, { clientX: 122, clientY: 61 })
  mockSubmenuRect(await screen.findByTestId('submenu-popup'))
  fireEvent.pointerMove(submenuTrigger, inside)

  return submenuTrigger
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('submenu pointer trail', () => {
  it('listens to window pointer moves only while a submenu trigger is hovered or its leave monitor runs', async () => {
    const user = userEvent.setup()
    const hasLogged = spyOnAimGuardLogs()
    const windowPointerMoveListeners = spyOnWindowPointerMoveListeners()

    render(<MenuWithSubmenu />)
    const submenuTrigger = await screen.findByTestId('submenu-trigger')

    // Mounted, but no trigger hovered.
    expect(windowPointerMoveListeners()).toBe(0)
    await user.hover(screen.getByTestId('item-above'))
    expect(windowPointerMoveListeners()).toBe(0)

    await user.hover(submenuTrigger)
    const submenuPopup = await screen.findByTestId('submenu-popup')
    expect(windowPointerMoveListeners()).toBeGreaterThan(0)

    mockTriggerRect(submenuTrigger)
    mockSubmenuRect(submenuPopup)

    // Leaving toward the submenu activates the guard from the recorded trail
    // and starts the leave monitor, which keeps the trail running.
    fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })
    fireEvent.pointerMove(window, { clientX: 150, clientY: 92 })
    fireEvent.pointerMove(window, { clientX: 180, clientY: 94 })
    fireEvent.pointerLeave(submenuTrigger, { clientX: 190, clientY: 94 })
    await waitFor(() => {
      expect(hasLogged('pointerleave-hit-activate-guard')).toBe(true)
    })
    // The trail and the leave monitor.
    expect(windowPointerMoveListeners()).toBe(2)

    // Reaching the submenu ends the leave monitor; nothing is listening now.
    fireEvent.pointerMove(window, { clientX: 250, clientY: 94 })
    expect(windowPointerMoveListeners()).toBe(0)
  })

  it('stops listening right after a leave that misses the submenu', async () => {
    const user = userEvent.setup()
    const hasLogged = spyOnAimGuardLogs()
    const windowPointerMoveListeners = spyOnWindowPointerMoveListeners()

    render(<MenuWithSubmenu />)
    const submenuTrigger = await screen.findByTestId('submenu-trigger')
    await user.hover(submenuTrigger)
    mockTriggerRect(submenuTrigger)
    mockSubmenuRect(await screen.findByTestId('submenu-popup'))
    expect(windowPointerMoveListeners()).toBe(1)

    // Move left across the trigger, away from the submenu. Four samples fill
    // the trail, so the heading comes only from this leftward path.
    fireEvent.pointerMove(submenuTrigger, { clientX: 190, clientY: 75 })
    fireEvent.pointerMove(window, { clientX: 150, clientY: 75 })
    fireEvent.pointerMove(window, { clientX: 120, clientY: 75 })
    fireEvent.pointerMove(window, { clientX: 90, clientY: 75 })
    fireEvent.pointerLeave(submenuTrigger, { clientX: 79, clientY: 75 })

    expect(hasLogged('pointerleave-miss-close')).toBe(true)
    expect(windowPointerMoveListeners()).toBe(0)
  })

  it('stops listening when a hovered trigger is filtered out', async () => {
    const user = userEvent.setup()
    spyOnAimGuardLogs()
    const windowPointerMoveListeners = spyOnWindowPointerMoveListeners()

    render(<MenuWithSubmenu withInput />)
    const submenuTrigger = await screen.findByTestId('submenu-trigger')
    await user.hover(submenuTrigger)
    expect(windowPointerMoveListeners()).toBe(1)

    // The trigger's element goes away, so it never gets a pointerleave.
    fireEvent.change(screen.getByTestId('search-input'), {
      target: { value: 'below' },
    })
    await waitFor(() => {
      expect(screen.queryByTestId('submenu-trigger')).not.toBeInTheDocument()
    })
    expect(windowPointerMoveListeners()).toBe(0)
  })

  it('takes the heading of a one-sample pass from its sample and the leave point', async () => {
    const hasLogged = spyOnAimGuardLogs()
    render(<MenuWithSubmenu />)

    // A fast flick straight down through the trigger onto the row below. With
    // one sample alone the heading would fall back to aiming at the submenu.
    const submenuTrigger = await passIntoTrigger({ clientX: 122, clientY: 75 })
    fireEvent.pointerLeave(submenuTrigger, { clientX: 122, clientY: 91 })

    expect(hasLogged('pointerleave-miss-close')).toBe(true)
    expect(hasLogged('pointerleave-hit-activate-guard')).toBe(false)

    const below = screen.getByTestId('item-below')
    fireEvent.pointerMove(below, { clientX: 122, clientY: 100 })
    expect(below).toHaveAttribute('data-highlighted')
  })

  it('still guards a one-sample pass that leaves toward the submenu', async () => {
    const hasLogged = spyOnAimGuardLogs()
    render(<MenuWithSubmenu />)

    const submenuTrigger = await passIntoTrigger({ clientX: 170, clientY: 70 })
    fireEvent.pointerLeave(submenuTrigger, { clientX: 201, clientY: 82 })

    expect(hasLogged('pointerleave-hit-activate-guard')).toBe(true)
  })
})
