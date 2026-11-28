import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { CommandMenu } from '../index.js'

function Menu(props: Omit<CommandMenu.Root.Props, 'children'>) {
  return (
    <>
      <button
        type="button"
        data-testid="exempt"
        style={{ position: 'fixed', top: 0, left: 0, width: 80, height: 40 }}
      >
        Exempt
      </button>
      <CommandMenu.Root {...props}>
        <CommandMenu.Portal>
          <CommandMenu.Popup
            data-testid="popup"
            style={{ position: 'fixed', top: 200, left: 200, width: 200 }}
          >
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

const settle = () => new Promise((resolve) => setTimeout(resolve, 50))

describe('CommandMenu.Root getDismissExemptElements in the browser', () => {
  it('keeps a non-modal menu open on a press on an exempt element', async () => {
    const onOpenChange = vi.fn()
    render(
      <Menu
        defaultOpen
        modal={false}
        onOpenChange={onOpenChange}
        getDismissExemptElements={() => [screen.getByTestId('exempt')]}
      />,
    )
    await vi.waitFor(() =>
      expect(screen.getByTestId('input')).toBe(document.activeElement),
    )

    await userEvent.click(screen.getByTestId('exempt'))
    await settle()
    expect(screen.getByTestId('popup')).toBeTruthy()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  // A modal menu's backdrop takes the press, so the element under it is
  // never pressed: the exemption applies to non-modal menus
  it('closes a modal menu on a press over an exempt element', async () => {
    const onOpenChange = vi.fn()
    render(
      <Menu
        defaultOpen
        onOpenChange={onOpenChange}
        getDismissExemptElements={() => [screen.getByTestId('exempt')]}
      />,
    )
    await vi.waitFor(() =>
      expect(screen.getByTestId('input')).toBe(document.activeElement),
    )

    await userEvent.click(document.body, { position: { x: 20, y: 20 } })
    await vi.waitFor(() => expect(screen.queryByTestId('popup')).toBeNull())
    expect(
      onOpenChange.mock.calls.map(([open, details]) => [open, details.reason]),
    ).toEqual([[false, 'outside-press']])
  })
})
