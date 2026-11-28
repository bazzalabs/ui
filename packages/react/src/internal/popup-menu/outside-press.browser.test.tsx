import { render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { DropdownMenu } from '../../dropdown-menu/index.js'

// Real input, so a press also moves focus, as it doesn't in jsdom.

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function openChangeCalls(spy: ReturnType<typeof vi.fn>) {
  return spy.mock.calls.map(([open, details]) => [open, details.reason])
}

function Menu(props: DropdownMenu.Root.Props) {
  return (
    <DropdownMenu.Root {...props}>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup">
            <DropdownMenu.Surface>
              <DropdownMenu.List data-testid="list">
                <DropdownMenu.Item value="a">A</DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

describe('outside press', () => {
  it('reports one outside press when an ancestor stops the press before its target, though focus still moves', async () => {
    const onOpenChange = vi.fn()
    render(
      <>
        <div data-testid="blocker">
          <button type="button" data-testid="outside">
            Outside
          </button>
        </div>
        <Menu modal={false} onOpenChange={onOpenChange} />
      </>,
    )
    screen
      .getByTestId('blocker')
      .addEventListener('pointerdown', (event) => event.stopPropagation(), {
        capture: true,
      })
    await userEvent.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())
    onOpenChange.mockClear()

    await userEvent.click(screen.getByTestId('outside'))

    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    await sleep(50)
    expect(screen.getByTestId('outside')).toHaveFocus()
    expect(openChangeCalls(onOpenChange)).toEqual([[false, 'outside-press']])
  })

  it('reports a stopped outside press once when the consumer keeps a controlled menu open', async () => {
    const onOpenChange = vi.fn()
    render(
      <>
        <div data-testid="blocker">
          <button type="button" data-testid="outside">
            Outside
          </button>
        </div>
        <Menu modal={false} open onOpenChange={onOpenChange} />
      </>,
    )
    screen
      .getByTestId('blocker')
      .addEventListener('pointerdown', (event) => event.stopPropagation(), {
        capture: true,
      })
    await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())

    await userEvent.click(screen.getByTestId('outside'))
    await sleep(50)

    // The focus-out reports the press; the deferred decision mustn't again.
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(openChangeCalls(onOpenChange)).toEqual([[false, 'outside-press']])
  })

  it("doesn't turn a later focus-out into an outside press after the consumer cancels a trigger press", async () => {
    const onOpenChange = vi.fn<
      NonNullable<DropdownMenu.Root.Props['onOpenChange']>
    >((open, details) => {
      if (!open && details.reason === 'trigger-press') details.cancel()
    })
    render(<Menu onOpenChange={onOpenChange} />)
    await userEvent.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())
    onOpenChange.mockClear()

    await userEvent.click(screen.getByTestId('trigger'))
    await sleep(50)
    expect(openChangeCalls(onOpenChange)).toEqual([[false, 'trigger-press']])
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    onOpenChange.mockClear()

    screen.getByTestId('list').focus()
    await userEvent.keyboard('{Tab}')

    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    // The close repeats as Base UI sees focus leave too (as on 7889b894);
    // none of the repeats may read as an outside press.
    const calls = openChangeCalls(onOpenChange)
    expect(calls[0]).toEqual([false, 'focus-out'])
    expect(new Set(calls.map(([, reason]) => reason))).toEqual(
      new Set(['focus-out']),
    )
  })
})

function NestedMenu({
  onSubmenuOpenChange,
  backdrop,
  ...props
}: DropdownMenu.Root.Props & {
  onSubmenuOpenChange?: DropdownMenu.Submenu.Props['onOpenChange']
  backdrop?: boolean
}) {
  return (
    <DropdownMenu.Root {...props}>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        {backdrop ? (
          <DropdownMenu.Backdrop
            data-testid="backdrop"
            style={{ position: 'fixed', inset: 0, pointerEvents: 'auto' }}
          />
        ) : null}
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup">
            <DropdownMenu.Surface>
              <DropdownMenu.List data-testid="list">
                <DropdownMenu.Item value="a">A</DropdownMenu.Item>
                <DropdownMenu.Submenu onOpenChange={onSubmenuOpenChange}>
                  <DropdownMenu.SubmenuTrigger
                    data-testid="submenu-trigger"
                    value="more"
                  >
                    More
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup data-testid="submenu-popup">
                        <DropdownMenu.Surface>
                          <DropdownMenu.List data-testid="submenu-list">
                            <DropdownMenu.Item value="b">B</DropdownMenu.Item>
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

describe('outside press with a submenu open', () => {
  async function openSubmenu() {
    await userEvent.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() =>
      expect(screen.getByTestId('submenu-popup')).toBeInTheDocument(),
    )
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() =>
      expect(screen.getByTestId('submenu-list')).toHaveFocus(),
    )
  }

  it('keeps the submenu open when the root cancels the press', async () => {
    const onSubmenuOpenChange = vi.fn()
    const onOpenChange = vi.fn<
      NonNullable<DropdownMenu.Root.Props['onOpenChange']>
    >((open, details) => {
      if (!open) details.cancel()
    })
    render(
      <>
        <button type="button" data-testid="outside">
          Outside
        </button>
        <NestedMenu
          modal={false}
          onOpenChange={onOpenChange}
          onSubmenuOpenChange={onSubmenuOpenChange}
        />
      </>,
    )
    await openSubmenu()
    onSubmenuOpenChange.mockClear()
    onOpenChange.mockClear()

    await userEvent.click(screen.getByTestId('outside'))
    await sleep(50)

    expect(openChangeCalls(onOpenChange)[0]).toEqual([false, 'outside-press'])
    expect(screen.getByTestId('submenu-popup')).toBeInTheDocument()
    expect(screen.getByTestId('submenu-trigger')).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(onSubmenuOpenChange).not.toHaveBeenCalled()
  })

  it('closes the submenu with the press when a controlled root applies it', async () => {
    const onSubmenuOpenChange = vi.fn()
    function Controlled() {
      const [open, setOpen] = React.useState(false)
      return (
        <NestedMenu
          modal={false}
          open={open}
          onOpenChange={(next) => setOpen(next)}
          onSubmenuOpenChange={onSubmenuOpenChange}
        />
      )
    }
    render(
      <>
        <button type="button" data-testid="outside">
          Outside
        </button>
        <Controlled />
      </>,
    )
    await openSubmenu()
    onSubmenuOpenChange.mockClear()

    await userEvent.click(screen.getByTestId('outside'))
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(openChangeCalls(onSubmenuOpenChange)).toEqual([
      [false, 'outside-press'],
    ])
  })

  it('closes the submenu on an outside press its root never hears', async () => {
    const onSubmenuOpenChange = vi.fn()
    function Menu({ disabled }: { disabled: boolean }) {
      return (
        <>
          <button type="button" data-testid="outside">
            Outside
          </button>
          <NestedMenu
            modal={false}
            disabled={disabled}
            onSubmenuOpenChange={onSubmenuOpenChange}
          />
        </>
      )
    }
    const { rerender } = render(<Menu disabled={false} />)
    await openSubmenu()
    // A disabled root ignores the press, and doesn't listen for it
    rerender(<Menu disabled />)
    onSubmenuOpenChange.mockClear()

    await userEvent.click(screen.getByTestId('outside'))

    // The focus-out the press causes isn't the root's to decide, so the
    // submenu closes itself, as before
    await waitFor(() =>
      expect(screen.queryByTestId('submenu-popup')).not.toBeInTheDocument(),
    )
    expect(openChangeCalls(onSubmenuOpenChange)).toEqual([[false, 'focus-out']])
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    // Focus stays where the press put it: the parent menu doesn't take it
    await sleep(50)
    expect(screen.getByTestId('outside')).toHaveFocus()
  })

  it('keeps the submenu open when the root cancels a press on its backdrop', async () => {
    const onSubmenuOpenChange = vi.fn()
    const onOpenChange = vi.fn<
      NonNullable<DropdownMenu.Root.Props['onOpenChange']>
    >((open, details) => {
      if (!open) details.cancel()
    })
    render(
      <NestedMenu
        backdrop
        onOpenChange={onOpenChange}
        onSubmenuOpenChange={onSubmenuOpenChange}
      />,
    )
    await openSubmenu()
    onSubmenuOpenChange.mockClear()
    onOpenChange.mockClear()

    await userEvent.click(screen.getByTestId('backdrop'), {
      position: { x: 5, y: 5 },
    })
    await sleep(50)

    expect(openChangeCalls(onOpenChange)).toContainEqual([
      false,
      'outside-press',
    ])
    expect(screen.getByTestId('submenu-popup')).toBeInTheDocument()
    expect(onSubmenuOpenChange).not.toHaveBeenCalled()
  })

  it('closes the submenu with the press when a controlled root applies it from a non-discrete update', async () => {
    const onSubmenuOpenChange = vi.fn()
    function Controlled() {
      const [open, setOpen] = React.useState(false)
      return (
        <NestedMenu
          modal={false}
          open={open}
          onOpenChange={(next) => setOpen(next)}
          onSubmenuOpenChange={onSubmenuOpenChange}
        />
      )
    }
    render(
      <>
        <div data-testid="blocker">
          <button type="button" data-testid="outside">
            Outside
          </button>
        </div>
        <Controlled />
      </>,
    )
    // The press never reaches its target, so the root decides it from a
    // timer: the consumer's update isn't discrete, and React commits it in
    // a later task
    screen
      .getByTestId('blocker')
      .addEventListener('pointerdown', (event) => event.stopPropagation(), {
        capture: true,
      })
    await openSubmenu()
    onSubmenuOpenChange.mockClear()

    await userEvent.click(screen.getByTestId('outside'))
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(openChangeCalls(onSubmenuOpenChange)).toEqual([
      [false, 'outside-press'],
    ])
  })
})

describe('focus when a controlled submenu closes after its menu', () => {
  // Exit transitions keep each closing popup on screen, focusable, a while
  const exitStyle = `
    [data-testid^='popup'] { transition: opacity 300ms }
    [data-testid^='popup'][data-ending-style] { opacity: 0 }
  `
  function Menu({ nested }: { nested: boolean }) {
    const [aOpen, setAOpen] = React.useState(false)
    const [bOpen, setBOpen] = React.useState(false)
    return (
      <DropdownMenu.Root modal={false}>
        <style>{exitStyle}</style>
        <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal keepMounted>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup data-testid="popup">
              <DropdownMenu.Surface>
                <DropdownMenu.List data-testid="list">
                  <DropdownMenu.Item value="a">A</DropdownMenu.Item>
                  <DropdownMenu.Submenu
                    open={aOpen}
                    onOpenChange={(next) => setAOpen(next)}
                  >
                    <DropdownMenu.SubmenuTrigger
                      data-testid="trigger-a"
                      value="more"
                    >
                      More
                    </DropdownMenu.SubmenuTrigger>
                    <DropdownMenu.Portal keepMounted>
                      <DropdownMenu.Positioner>
                        <DropdownMenu.Popup data-testid="popup-a">
                          <DropdownMenu.Surface>
                            <DropdownMenu.List data-testid="list-a">
                              <DropdownMenu.Item value="b">B</DropdownMenu.Item>
                              {nested ? (
                                <DropdownMenu.Submenu
                                  open={bOpen}
                                  onOpenChange={(next) => setBOpen(next)}
                                >
                                  <DropdownMenu.SubmenuTrigger
                                    data-testid="trigger-b"
                                    value="deeper"
                                  >
                                    Deeper
                                  </DropdownMenu.SubmenuTrigger>
                                  <DropdownMenu.Portal keepMounted>
                                    <DropdownMenu.Positioner>
                                      <DropdownMenu.Popup data-testid="popup-b">
                                        <DropdownMenu.Surface>
                                          <DropdownMenu.List data-testid="list-b">
                                            <DropdownMenu.Item value="c">
                                              C
                                            </DropdownMenu.Item>
                                          </DropdownMenu.List>
                                        </DropdownMenu.Surface>
                                      </DropdownMenu.Popup>
                                    </DropdownMenu.Positioner>
                                  </DropdownMenu.Portal>
                                </DropdownMenu.Submenu>
                              ) : null}
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

  for (const nested of [false, true]) {
    it(`leaves focus on the trigger after Escape closes the menu (${nested ? 'a nested submenu' : 'a submenu'} has focus)`, async () => {
      render(<Menu nested={nested} />)
      await userEvent.click(screen.getByTestId('trigger'))
      await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())
      await userEvent.keyboard('{ArrowDown}')
      await waitFor(() =>
        expect(screen.getByTestId('trigger-a')).toHaveAttribute(
          'aria-expanded',
          'true',
        ),
      )
      await userEvent.keyboard('{ArrowRight}')
      await waitFor(() => expect(screen.getByTestId('list-a')).toHaveFocus())
      if (nested) {
        await userEvent.keyboard('{ArrowDown}')
        await waitFor(() =>
          expect(screen.getByTestId('trigger-b')).toHaveAttribute(
            'aria-expanded',
            'true',
          ),
        )
        await userEvent.keyboard('{ArrowRight}')
        await waitFor(() => expect(screen.getByTestId('list-b')).toHaveFocus())
      }
      await sleep(50)

      await userEvent.keyboard('{Escape}')
      // A submenu closing after its menu doesn't hand focus to the closed
      // menu, still on screen as it exits, which would take it
      const closedMenu = screen.getByTestId(nested ? 'list-a' : 'list')
      for (const ms of [50, 100]) {
        await sleep(ms)
        expect(closedMenu.contains(document.activeElement)).toBe(false)
      }
      await waitFor(() => expect(screen.getByTestId('trigger')).toHaveFocus())
      await sleep(50)
      expect(screen.getByTestId('trigger')).toHaveFocus()
    })
  }
})
