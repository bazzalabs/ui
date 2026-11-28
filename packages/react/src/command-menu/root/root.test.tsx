import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CommandMenu } from '../index.js'

function Menu(props: Omit<CommandMenu.Root.Props, 'children'>) {
  return (
    <>
      <button type="button" data-testid="outside">
        Outside
      </button>
      <input data-testid="exempt" aria-label="Exempt" />
      <CommandMenu.Root hotkey="ctrl+k" {...props}>
        <CommandMenu.Trigger data-testid="trigger">Open</CommandMenu.Trigger>
        <CommandMenu.Portal>
          <CommandMenu.Popup data-testid="popup">
            <CommandMenu.Surface>
              <CommandMenu.Input aria-label="Search" data-testid="input" />
              <CommandMenu.List>
                <CommandMenu.Item value="first">First</CommandMenu.Item>
              </CommandMenu.List>
            </CommandMenu.Surface>
          </CommandMenu.Popup>
        </CommandMenu.Portal>
      </CommandMenu.Root>
    </>
  )
}

const calls = (spy: ReturnType<typeof vi.fn>) =>
  spy.mock.calls.map(([open, details]) => [open, details.reason])

const waitForOpen = () =>
  waitFor(() => expect(screen.getByTestId('input')).toHaveFocus())

const waitForClosed = () =>
  waitFor(() => expect(screen.queryByTestId('popup')).not.toBeInTheDocument())

describe('CommandMenu.Root onOpenChange', () => {
  it('reports the hotkey, Escape and an outside press with their reasons', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Menu onOpenChange={onOpenChange} modal={false} />)

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    await waitForOpen()
    await user.keyboard('{Escape}')
    await waitForClosed()

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    await waitForOpen()
    await user.click(screen.getByTestId('outside'))
    await waitForClosed()

    expect(calls(onOpenChange)).toEqual([
      [true, 'imperative-action'],
      [false, 'escape-key'],
      [true, 'imperative-action'],
      [false, 'outside-press'],
    ])
  })

  it('keeps the menu open when the details are canceled', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn(
      (open: boolean, eventDetails: CommandMenu.Root.ChangeEventDetails) => {
        if (!open) eventDetails.cancel()
      },
    )
    render(<Menu defaultOpen onOpenChange={onOpenChange} />)
    await waitForOpen()

    await user.keyboard('{Escape}')
    fireEvent.keyDown(screen.getByTestId('input'), { key: 'k', ctrlKey: true })
    await new Promise((resolve) => setTimeout(resolve, 30))

    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(calls(onOpenChange)).toEqual([
      [false, 'escape-key'],
      [false, 'imperative-action'],
    ])
  })

  it('takes a handler that only reads `open`', () => {
    const onOpenChange: (open: boolean) => void = () => {}
    render(<Menu onOpenChange={onOpenChange} />)
  })
})

describe('CommandMenu.Root getDismissExemptElements', () => {
  it('keeps a non-modal menu open on a press on an exempt element, and closes it on a press elsewhere', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <Menu
        defaultOpen
        modal={false}
        onOpenChange={onOpenChange}
        getDismissExemptElements={() => [screen.getByTestId('exempt')]}
      />,
    )
    await waitForOpen()

    await user.click(screen.getByTestId('exempt'))
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalled()

    await user.click(screen.getByTestId('outside'))
    await waitForClosed()
    expect(calls(onOpenChange)).toEqual([[false, 'outside-press']])
  })

  it('reads the elements when the event happens', async () => {
    const user = userEvent.setup()
    let exempt: Element | null = null
    render(
      <Menu
        defaultOpen
        modal={false}
        getDismissExemptElements={() => [exempt]}
      />,
    )
    await waitForOpen()

    exempt = screen.getByTestId('outside')
    await user.click(screen.getByTestId('outside'))
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })
})
