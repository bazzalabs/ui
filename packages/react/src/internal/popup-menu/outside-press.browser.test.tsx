import { render, screen, waitFor } from '@testing-library/react'
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
