import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { Select } from '../select/index.js'
import { DropdownMenu } from './index.js'

function createRect(rect: {
  top: number
  left: number
  width: number
  height: number
}) {
  return {
    ...rect,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    x: rect.left,
    y: rect.top,
    toJSON: () => rect,
  } as DOMRect
}

function DropdownFixture({
  onOpenChange = vi.fn(),
  closeDelay = 0,
  hover = true,
  delay = 0,
  withSubmenu = false,
  closeOnOutsidePress,
}: any) {
  return (
    <DropdownMenu.Root
      onOpenChange={onOpenChange}
      closeOnOutsidePress={closeOnOutsidePress}
    >
      <DropdownMenu.Trigger
        openOnHover={hover || undefined}
        delay={delay}
        closeDelay={closeDelay}
        data-testid="trigger"
      >
        Open
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup">
            <DropdownMenu.Surface>
              <DropdownMenu.Input data-testid="input" />
              <DropdownMenu.List>
                {[
                  'apple',
                  'apricot',
                  'banana',
                  'blueberry',
                  'cherry',
                  'date',
                ].map((item) => (
                  <DropdownMenu.Item key={item} value={item}>
                    {item}
                  </DropdownMenu.Item>
                ))}
                {withSubmenu && (
                  <DropdownMenu.Submenu>
                    <DropdownMenu.SubmenuTrigger data-testid="sub-trigger">
                      More
                    </DropdownMenu.SubmenuTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Positioner>
                        <DropdownMenu.Popup data-testid="sub-popup">
                          <DropdownMenu.Surface>
                            <DropdownMenu.List>
                              <DropdownMenu.Item value="fig">
                                fig
                              </DropdownMenu.Item>
                              <DropdownMenu.Item value="grape">
                                grape
                              </DropdownMenu.Item>
                            </DropdownMenu.List>
                          </DropdownMenu.Surface>
                        </DropdownMenu.Popup>
                      </DropdownMenu.Positioner>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Submenu>
                )}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

async function openHover(user: ReturnType<typeof userEvent.setup>) {
  await user.hover(screen.getByTestId('trigger'))
  await waitFor(() => expect(screen.getByTestId('popup')).toBeInTheDocument())
  const trigger = screen.getByTestId('trigger')
  const popup = screen.getByTestId('popup')
  vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(
    createRect({ top: 100, left: 100, width: 120, height: 32 }),
  )
  vi.spyOn(popup, 'getBoundingClientRect').mockReturnValue(
    createRect({ top: 140, left: 100, width: 240, height: 300 }),
  )
  return { trigger, popup }
}

describe('root hover guard', () => {
  it('keeps a shrinking popup open under a stationary pointer', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<DropdownFixture onOpenChange={spy} />)
    const { popup } = await openHover(user)
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 300,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 400,
      pointerType: 'mouse',
    })
    vi.spyOn(popup, 'getBoundingClientRect').mockReturnValue(
      createRect({ top: 140, left: 100, width: 240, height: 120 }),
    )
    fireEvent.mouseLeave(popup, { clientX: 200, clientY: 400 })
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(spy).not.toHaveBeenCalledWith(false, expect.anything())
  })

  it('closes after moving away with trigger-hover details', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<DropdownFixture onOpenChange={spy} />)
    const { popup } = await openHover(user)
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 300,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 400,
      pointerType: 'mouse',
    })
    vi.spyOn(popup, 'getBoundingClientRect').mockReturnValue(
      createRect({ top: 140, left: 100, width: 240, height: 120 }),
    )
    fireEvent.mouseLeave(popup, { clientX: 200, clientY: 400 })
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 440,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 480,
      pointerType: 'mouse',
    })
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(spy).toHaveBeenCalledWith(
      false,
      expect.objectContaining({
        reason: 'trigger-hover',
        event: expect.any(MouseEvent),
      }),
    )
    const falseCalls = spy.mock.calls.filter(([open]) => open === false)
    expect(falseCalls).toHaveLength(1)
    const [, details] = falseCalls[0]
    expect(details.event).toBeInstanceOf(MouseEvent)
    expect((details.event as MouseEvent).clientY).toBe(400)
  })

  it('honours consumer cancellation', async () => {
    const user = userEvent.setup()
    const spy = vi.fn((_open: boolean, details: any) => {
      if (!_open) details.cancel()
    })
    render(<DropdownFixture onOpenChange={spy} />)
    const { popup } = await openHover(user)
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 300,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 400,
      pointerType: 'mouse',
    })
    vi.spyOn(popup, 'getBoundingClientRect').mockReturnValue(
      createRect({ top: 140, left: 100, width: 240, height: 120 }),
    )
    fireEvent.mouseLeave(popup, { clientX: 200, clientY: 400 })
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 440,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 480,
      pointerType: 'mouse',
    })
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'trigger-hover' }),
      ),
    )
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })

  it('keeps open when aiming back at the popup', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<DropdownFixture onOpenChange={spy} />)
    const { popup } = await openHover(user)
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 300,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 400,
      pointerType: 'mouse',
    })
    vi.spyOn(popup, 'getBoundingClientRect').mockReturnValue(
      createRect({ top: 140, left: 100, width: 240, height: 120 }),
    )
    fireEvent.mouseLeave(popup, { clientX: 200, clientY: 400 })
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 380,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 330,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 250,
      pointerType: 'mouse',
    })
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(spy).not.toHaveBeenCalledWith(false, expect.anything())
  })

  it('closes when the trigger is left away from the menu', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<DropdownFixture onOpenChange={spy} />)
    const { trigger } = await openHover(user)
    fireEvent.pointerMove(window, {
      clientX: 160,
      clientY: 116,
      pointerType: 'mouse',
    })
    fireEvent.mouseLeave(trigger, { clientX: 160, clientY: 90 })
    fireEvent.pointerMove(window, {
      clientX: 160,
      clientY: 60,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 160,
      clientY: 20,
      pointerType: 'mouse',
    })
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(spy).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'trigger-hover' }),
    )
  })

  it('keeps open when the trigger is left toward the popup', async () => {
    const user = userEvent.setup()
    render(<DropdownFixture />)
    const { trigger } = await openHover(user)
    fireEvent.pointerMove(window, {
      clientX: 160,
      clientY: 116,
      pointerType: 'mouse',
    })
    fireEvent.mouseLeave(trigger, { clientX: 160, clientY: 136 })
    fireEvent.pointerMove(window, {
      clientX: 160,
      clientY: 150,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 160,
      clientY: 200,
      pointerType: 'mouse',
    })
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })

  it('starts closeDelay from the miss decision', async () => {
    const user = userEvent.setup()
    render(<DropdownFixture closeDelay={200} />)
    const { popup } = await openHover(user)
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 300,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 400,
      pointerType: 'mouse',
    })
    vi.spyOn(popup, 'getBoundingClientRect').mockReturnValue(
      createRect({ top: 140, left: 100, width: 240, height: 120 }),
    )
    fireEvent.mouseLeave(popup, { clientX: 200, clientY: 400 })
    fireEvent.pointerMove(window, {
      clientX: 600,
      clientY: 600,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 700,
      clientY: 700,
      pointerType: 'mouse',
    })
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    await waitFor(
      () => expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
      { timeout: 600 },
    )
  })

  it('passes non-hover closes through and cancels the monitor', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<DropdownFixture onOpenChange={spy} />)
    const { popup } = await openHover(user)
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 300,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 400,
      pointerType: 'mouse',
    })
    vi.spyOn(popup, 'getBoundingClientRect').mockReturnValue(
      createRect({ top: 140, left: 100, width: 240, height: 120 }),
    )
    fireEvent.mouseLeave(popup, { clientX: 200, clientY: 400 })
    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'escape-key' }),
      ),
    )
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 480,
      pointerType: 'mouse',
    })
    await new Promise((resolve) => setTimeout(resolve, 400))
    const falseCalls = spy.mock.calls.filter(([open]) => open === false)
    expect(falseCalls).toHaveLength(1)
    expect(falseCalls[0][1]).toEqual(
      expect.objectContaining({ reason: 'escape-key' }),
    )
  })

  it('does not emit a second close when a non-hover close lands during closeDelay', async () => {
    // Miss decision arms a `closeDelay` timer; Escape closes first. The timer
    // must not re-emit `onOpenChange(false, trigger-hover)` for a popup that
    // is already closed.
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<DropdownFixture onOpenChange={spy} closeDelay={300} />)
    const { popup } = await openHover(user)
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 300,
      pointerType: 'mouse',
    })
    fireEvent.mouseLeave(popup, { clientX: 500, clientY: 500 })
    fireEvent.pointerMove(window, {
      clientX: 600,
      clientY: 600,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 700,
      clientY: 700,
      pointerType: 'mouse',
    })
    // Close timer is now armed (300 ms). Escape before it fires.
    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'escape-key' }),
      ),
    )
    await new Promise((resolve) => setTimeout(resolve, 500))
    const closes = spy.mock.calls.filter(([open]) => open === false)
    expect(closes).toHaveLength(1)
    expect(closes[0]![1].reason).toBe('escape-key')
  })

  it('does not hover-close a click-opened popup', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<DropdownFixture onOpenChange={spy} delay={300} />)
    const trigger = screen.getByTestId('trigger')
    await user.click(trigger)
    await waitFor(() => expect(screen.getByTestId('popup')).toBeInTheDocument())
    expect(spy).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-press' }),
    )
    fireEvent.mouseLeave(screen.getByTestId('popup'), {
      clientX: 500,
      clientY: 500,
    })
    fireEvent.pointerMove(window, {
      clientX: 600,
      clientY: 600,
      pointerType: 'mouse',
    })
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(spy).not.toHaveBeenCalledWith(false, expect.anything())
  })

  it('stops hover-closing once a hover-opened popup is click-stuck', async () => {
    // Base UI keeps a hover-opened popup open on a "patient" click and re-emits
    // an accepted `trigger-press` open; `open` never flips, so the guard must
    // react to the reason change itself.
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<DropdownFixture onOpenChange={spy} closeOnOutsidePress="click" />)
    const { popup } = await openHover(user)
    expect(spy).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-hover' }),
    )
    await user.click(screen.getByTestId('trigger'))
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith(
        true,
        expect.objectContaining({ reason: 'trigger-press' }),
      ),
    )
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 300,
      pointerType: 'mouse',
    })
    fireEvent.mouseLeave(popup, { clientX: 500, clientY: 500 })
    fireEvent.pointerMove(window, {
      clientX: 600,
      clientY: 600,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 700,
      clientY: 700,
      pointerType: 'mouse',
    })
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(spy).not.toHaveBeenCalledWith(false, expect.anything())
  })

  it('does not inherit hover ownership across a controlled close and reopen', async () => {
    // Controlled from the start. The controller accepts the hover open, then
    // closes and reopens purely via the prop (never through `onOpenChange`),
    // so `setOpen` is bypassed and the guard must forget hover ownership.
    const user = userEvent.setup()
    const spy = vi.fn()
    let setOpenFromOutside: ((open: boolean) => void) | null = null
    function Controlled() {
      const [open, setOpen] = React.useState(false)
      setOpenFromOutside = setOpen
      return (
        <DropdownMenu.Root
          open={open}
          onOpenChange={(next, details) => {
            spy(next, details)
            setOpen(next)
          }}
        >
          <DropdownMenu.Trigger openOnHover delay={0} data-testid="trigger">
            Open
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup data-testid="popup">
                <DropdownMenu.Surface>
                  <DropdownMenu.List>
                    <DropdownMenu.Item value="apple">apple</DropdownMenu.Item>
                    <DropdownMenu.Item value="banana">banana</DropdownMenu.Item>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }
    render(<Controlled />)
    await openHover(user)
    expect(spy).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-hover' }),
    )
    act(() => setOpenFromOutside?.(false))
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    act(() => setOpenFromOutside?.(true))
    await waitFor(() => expect(screen.getByTestId('popup')).toBeInTheDocument())
    const popup = screen.getByTestId('popup')
    vi.spyOn(popup, 'getBoundingClientRect').mockReturnValue(
      createRect({ top: 140, left: 100, width: 240, height: 300 }),
    )
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 300,
      pointerType: 'mouse',
    })
    fireEvent.mouseLeave(popup, { clientX: 500, clientY: 500 })
    fireEvent.pointerMove(window, {
      clientX: 600,
      clientY: 600,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 700,
      clientY: 700,
      pointerType: 'mouse',
    })
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(spy).not.toHaveBeenCalledWith(false, expect.anything())
  })

  it('hover-closes a controlled popup whose controller accepted the hover open', async () => {
    // `<Root open={open} onOpenChange={setOpen}>`: the hover open is accepted
    // one render later via the parent's state; hover ownership must survive
    // that gap so the guard still decides the close.
    const user = userEvent.setup()
    const spy = vi.fn()
    function ControlledByState() {
      const [open, setOpen] = React.useState(false)
      return (
        <DropdownMenu.Root
          open={open}
          onOpenChange={(next, details) => {
            spy(next, details)
            setOpen(next)
          }}
        >
          <DropdownMenu.Trigger openOnHover delay={0} data-testid="trigger">
            Open
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup data-testid="popup">
                <DropdownMenu.Surface>
                  <DropdownMenu.List>
                    <DropdownMenu.Item value="apple">apple</DropdownMenu.Item>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }
    render(<ControlledByState />)
    const { popup } = await openHover(user)
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 300,
      pointerType: 'mouse',
    })
    fireEvent.mouseLeave(popup, { clientX: 500, clientY: 500 })
    fireEvent.pointerMove(window, {
      clientX: 600,
      clientY: 600,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 700,
      clientY: 700,
      pointerType: 'mouse',
    })
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(spy).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'trigger-hover' }),
    )
  })

  it('does nothing without openOnHover', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<DropdownFixture hover={false} onOpenChange={spy} />)
    await user.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(screen.getByTestId('popup')).toBeInTheDocument())
    fireEvent.mouseLeave(screen.getByTestId('popup'), {
      clientX: 500,
      clientY: 500,
    })
    fireEvent.pointerMove(window, {
      clientX: 600,
      clientY: 600,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 700,
      clientY: 700,
      pointerType: 'mouse',
    })
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('ignores a leave into one of its own open submenus', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<DropdownFixture onOpenChange={spy} withSubmenu />)
    const { popup } = await openHover(user)
    await user.hover(screen.getByTestId('sub-trigger'))
    await waitFor(() =>
      expect(screen.getByTestId('sub-popup')).toBeInTheDocument(),
    )
    fireEvent.mouseLeave(popup, {
      clientX: 350,
      clientY: 200,
      relatedTarget: screen.getByTestId('sub-popup'),
    })
    fireEvent.pointerMove(window, {
      clientX: 600,
      clientY: 300,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 700,
      clientY: 300,
      pointerType: 'mouse',
    })
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(spy).not.toHaveBeenCalledWith(false, expect.anything())
  })

  it('does not suppress a leave into a foreign submenu', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<DropdownFixture onOpenChange={spy} withSubmenu />)
    const { popup } = await openHover(user)
    await user.hover(screen.getByTestId('sub-trigger'))
    await waitFor(() =>
      expect(screen.getByTestId('sub-popup')).toBeInTheDocument(),
    )
    fireEvent.pointerMove(window, {
      clientX: 300,
      clientY: 200,
      pointerType: 'mouse',
    })
    const foreign = document.createElement('div')
    foreign.setAttribute('data-submenu', '')
    foreign.setAttribute('data-bazzaui-surface-id', 'foreign')
    document.body.appendChild(foreign)
    onTestFinished(() => foreign.remove())
    fireEvent.mouseLeave(popup, {
      clientX: 350,
      clientY: 200,
      relatedTarget: foreign,
    })
    fireEvent.pointerMove(window, {
      clientX: 400,
      clientY: 200,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 450,
      clientY: 200,
      pointerType: 'mouse',
    })
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(spy.mock.calls.filter(([open]) => open === false)).toHaveLength(1)
    expect(spy).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'trigger-hover' }),
    )
  })

  it('re-evaluates after an open submenu closes', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<DropdownFixture onOpenChange={spy} withSubmenu />)
    const { popup } = await openHover(user)
    fireEvent.pointerMove(window, {
      clientX: 350,
      clientY: 200,
      pointerType: 'mouse',
    })
    const subTrigger = screen.getByTestId('sub-trigger')
    await user.hover(subTrigger)
    await waitFor(() =>
      expect(screen.getByTestId('sub-popup')).toBeInTheDocument(),
    )
    const subPopup = screen.getByTestId('sub-popup')
    vi.spyOn(subTrigger, 'getBoundingClientRect').mockReturnValue(
      createRect({ top: 300, left: 500, width: 120, height: 30 }),
    )
    vi.spyOn(subPopup, 'getBoundingClientRect').mockReturnValue(
      createRect({ top: 280, left: 660, width: 180, height: 160 }),
    )
    fireEvent.pointerMove(window, {
      clientX: 600,
      clientY: 300,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 620,
      clientY: 320,
      pointerType: 'mouse',
    })
    fireEvent.mouseLeave(popup, {
      clientX: 620,
      clientY: 320,
      relatedTarget: subPopup,
    })
    fireEvent.pointerEnter(subTrigger, { clientX: 560, clientY: 315 })
    fireEvent.pointerMove(window, {
      clientX: 560,
      clientY: 315,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 540,
      clientY: 340,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 520,
      clientY: 365,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 510,
      clientY: 380,
      pointerType: 'mouse',
    })
    // Leave at a point that differs from the last move so the submenu's own
    // Aim Monitor decides immediately (an identical point would be treated as
    // a layout-induced leave and go pending).
    fireEvent.pointerLeave(subTrigger, { clientX: 505, clientY: 392 })
    await waitFor(() =>
      expect(screen.queryByTestId('sub-popup')).not.toBeInTheDocument(),
    )
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(spy.mock.calls.filter(([open]) => open === false)).toHaveLength(1)
    expect(spy).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'trigger-hover' }),
    )
  })

  it('supports hover-opened Select popups', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(
      <Select.Root onOpenChange={spy}>
        <Select.Trigger openOnHover delay={0} data-testid="trigger">
          Open
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">
              <Select.Surface>
                <Select.List>
                  <Select.Item value="a">A</Select.Item>
                  <Select.Item value="b">B</Select.Item>
                  <Select.Item value="c">C</Select.Item>
                </Select.List>
              </Select.Surface>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    )
    await user.hover(screen.getByTestId('trigger'))
    await waitFor(() => expect(screen.getByTestId('popup')).toBeInTheDocument())
    const popup = screen.getByTestId('popup')
    vi.spyOn(popup, 'getBoundingClientRect').mockReturnValue(
      createRect({ top: 140, left: 100, width: 240, height: 120 }),
    )
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 400,
      pointerType: 'mouse',
    })
    fireEvent.mouseLeave(popup, { clientX: 200, clientY: 400 })
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 440,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 480,
      pointerType: 'mouse',
    })
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(spy).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'trigger-hover' }),
    )
  })
})
