import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Combobox } from '../../../../combobox/index.js'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'

describe('Popup focus', () => {
  it('keeps focus on the Combobox input when the popup opens', async () => {
    const user = userEvent.setup()
    render(
      <Combobox.Root>
        <Combobox.Input aria-label="Fruit" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Surface>
                <Combobox.List>
                  <Combobox.Item value="apple">Apple</Combobox.Item>
                </Combobox.List>
              </Combobox.Surface>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    )

    const input = screen.getByRole('combobox', { name: 'Fruit' })
    await user.click(input)
    await user.keyboard('{ArrowDown}')

    await screen.findByRole('option', { name: 'Apple' })
    // Give Base UI's focus manager a chance to move focus if it were going to.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(input).toHaveFocus()
  })

  it('moves focus into a DropdownMenu popup when it opens', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <DropdownMenu.Item>Edit</DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )

    const trigger = screen.getByRole('button', { name: 'Open' })
    await user.click(trigger)
    await screen.findByRole('option', { name: 'Edit' })

    const popup = document.querySelector('[bazzaui-dropdown-menu-popup]')
    await waitFor(() =>
      expect(popup?.contains(document.activeElement)).toBe(true),
    )
  })
})
