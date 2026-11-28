import { render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { CommandMenu } from '../../command-menu/index.js'
import { DropdownMenu } from '../../dropdown-menu/index.js'

/**
 * A press that closes a popup (an outside press, a backdrop) closes it on
 * `pointerdown`, and the press's `mousedown` moves focus after that, in the
 * same task. Focus returns where it did before closes completed in one
 * frame: the trigger after a press on nothing focusable, the pressed element
 * otherwise, and the trigger is never focused and then blurred on the way.
 */

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

/** The focus and blur events `element` gets from now on. */
function focusEvents(element: HTMLElement) {
  const events: string[] = []
  element.addEventListener('focus', () => events.push('focus'))
  element.addEventListener('blur', () => events.push('blur'))
  return events
}

let frame = 0
let closeFrame: number | null = null
let completeFrame: number | null = null
const callbacks = {
  onOpenChange: (open: boolean) => {
    if (!open && closeFrame === null) closeFrame = frame
  },
  onOpenChangeComplete: (open: boolean) => {
    if (!open && completeFrame === null) completeFrame = frame
  },
}

function Menu({ submenu = false }: { submenu?: boolean }) {
  return (
    <>
      <div
        data-testid="blank"
        style={{
          position: 'fixed',
          top: 300,
          left: 300,
          width: 100,
          height: 100,
        }}
      />
      <input
        data-testid="outside"
        style={{ position: 'fixed', top: 300, left: 20, width: 100 }}
      />
      {/* Not modal, so a press reaches what it lands on, not Base UI's
          backdrop over the page. */}
      <DropdownMenu.Root modal={false} {...callbacks}>
        <DropdownMenu.Trigger
          data-testid="trigger"
          style={{ position: 'fixed', top: 0, left: 0 }}
        >
          Open
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup data-testid="popup">
              <DropdownMenu.Surface>
                <DropdownMenu.List data-testid="list">
                  <DropdownMenu.Item data-testid="item">One</DropdownMenu.Item>
                  {submenu && (
                    <DropdownMenu.Submenu>
                      <DropdownMenu.SubmenuTrigger data-testid="more">
                        More
                      </DropdownMenu.SubmenuTrigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Positioner>
                          <DropdownMenu.Popup data-testid="submenu">
                            <DropdownMenu.Surface>
                              <DropdownMenu.List data-testid="sublist">
                                <DropdownMenu.Item>Sub</DropdownMenu.Item>
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
    </>
  )
}

async function openMenu(submenu = false) {
  render(<Menu submenu={submenu} />)
  await userEvent.click(screen.getByTestId('trigger'))
  await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())
  if (submenu) {
    await userEvent.keyboard('{ArrowDown}{ArrowRight}')
    await waitFor(() => expect(screen.getByTestId('sublist')).toHaveFocus())
  }
  await sleep(50)
}

/** Waits for the press's close and anything focus does after it. */
async function settle() {
  await waitFor(() =>
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
  )
  await sleep(100)
}

describe('a press that closes a menu', () => {
  it('on nothing focusable returns focus to the trigger, which keeps it', async () => {
    await openMenu()
    const trigger = focusEvents(screen.getByTestId('trigger'))
    await userEvent.click(screen.getByTestId('blank'))
    await settle()
    expect(document.activeElement).toBe(screen.getByTestId('trigger'))
    expect(trigger).toEqual(['focus'])
  })

  it('on an input leaves focus there, and never focuses the trigger', async () => {
    await openMenu()
    const trigger = focusEvents(screen.getByTestId('trigger'))
    await userEvent.click(screen.getByTestId('outside'))
    await settle()
    expect(document.activeElement).toBe(screen.getByTestId('outside'))
    expect(trigger).toEqual([])
  })

  it('with a submenu open returns focus to the trigger, which keeps it', async () => {
    await openMenu(true)
    const trigger = focusEvents(screen.getByTestId('trigger'))
    await userEvent.click(screen.getByTestId('blank'))
    await settle()
    expect(screen.queryByTestId('submenu')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(screen.getByTestId('trigger'))
    expect(trigger).toEqual(['focus'])
  })
})

describe('a press on the CommandMenu backdrop', () => {
  it('returns focus to what opened the menu, which keeps it', async () => {
    render(
      <CommandMenu.Root>
        <CommandMenu.Trigger data-testid="opener">Search</CommandMenu.Trigger>
        <CommandMenu.Portal>
          <CommandMenu.Backdrop
            data-testid="backdrop"
            style={{ position: 'fixed', inset: 0 }}
          />
          <CommandMenu.Popup
            data-testid="popup"
            style={{ position: 'fixed', top: 10, left: 10, width: 200 }}
          >
            <CommandMenu.Surface>
              <CommandMenu.Input data-testid="input" />
              <CommandMenu.List>
                <CommandMenu.Item>One</CommandMenu.Item>
              </CommandMenu.List>
            </CommandMenu.Surface>
          </CommandMenu.Popup>
        </CommandMenu.Portal>
      </CommandMenu.Root>,
    )
    await userEvent.click(screen.getByTestId('opener'))
    await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus())
    await sleep(50)
    const opener = focusEvents(screen.getByTestId('opener'))
    const backdrop = screen.getByTestId('backdrop').getBoundingClientRect()
    await userEvent.click(screen.getByTestId('backdrop'), {
      position: { x: backdrop.width - 20, y: backdrop.height - 20 },
    })
    await settle()
    expect(document.activeElement).toBe(screen.getByTestId('opener'))
    expect(opener).toEqual(['focus'])
  })
})

/**
 * Frames from the close (`onOpenChange(false)`) to its completion
 * (`onOpenChangeComplete(false)`) when `close` closes the open menu.
 */
async function framesToComplete(close: () => Promise<void>) {
  await openMenu()
  frame = 0
  closeFrame = null
  completeFrame = null
  let running = true
  const tick = () => {
    if (!running) return
    frame++
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  await close()
  await waitFor(() => expect(completeFrame).not.toBeNull())
  running = false
  return completeFrame! - closeFrame!
}

describe('a keyboard close, or an item press', () => {
  it('completes in the frame it closes (Escape)', async () => {
    expect(await framesToComplete(() => userEvent.keyboard('{Escape}'))).toBe(0)
  })

  it('completes in the frame it closes (an item press)', async () => {
    expect(
      await framesToComplete(() => userEvent.click(screen.getByTestId('item'))),
    ).toBe(0)
  })
})

describe('a press the consumer closes the menu on', () => {
  it('returns focus to the trigger, which keeps it, though no press is the close’s cause', async () => {
    function Consumer() {
      const [open, setOpen] = React.useState(false)
      return (
        <>
          <div
            data-testid="blank"
            onPointerDown={() => setOpen(false)}
            style={{
              position: 'fixed',
              top: 300,
              left: 300,
              width: 100,
              height: 100,
            }}
          />
          <DropdownMenu.Root
            open={open}
            onOpenChange={setOpen}
            modal={false}
            closeOnOutsidePress="click"
          >
            <DropdownMenu.Trigger
              data-testid="trigger"
              style={{ position: 'fixed', top: 0, left: 0 }}
            >
              Open
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Positioner>
                <DropdownMenu.Popup data-testid="popup">
                  <DropdownMenu.Surface>
                    <DropdownMenu.List data-testid="list">
                      <DropdownMenu.Item>One</DropdownMenu.Item>
                    </DropdownMenu.List>
                  </DropdownMenu.Surface>
                </DropdownMenu.Popup>
              </DropdownMenu.Positioner>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </>
      )
    }
    render(<Consumer />)
    await userEvent.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())
    await sleep(50)
    const trigger = focusEvents(screen.getByTestId('trigger'))
    await userEvent.click(screen.getByTestId('blank'))
    await settle()
    expect(document.activeElement).toBe(screen.getByTestId('trigger'))
    expect(trigger).toEqual(['focus'])
  })
})
