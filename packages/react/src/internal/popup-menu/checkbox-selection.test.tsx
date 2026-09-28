import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'

function Menu({
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Root>) {
  return (
    <DropdownMenu.Root {...props}>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List data-testid="list">
                {children}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('trigger'))
  screen.getByTestId('list').focus()
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('PopupMenu checkbox selection foundation', () => {
  it('accepts root selection settings', async () => {
    const user = userEvent.setup()
    render(
      <Menu rangeSelection={false} dragSelection="keep">
        <DropdownMenu.CheckboxItem data-testid="item">
          Item
        </DropdownMenu.CheckboxItem>
      </Menu>,
    )
    await openMenu(user)
    expect(screen.getByTestId('item')).toBeInTheDocument()
  })

  it('does not mark a checkbox item pending by default', async () => {
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.CheckboxItem data-testid="item">
          Item
        </DropdownMenu.CheckboxItem>
      </Menu>,
    )
    await openMenu(user)
    expect(screen.getByTestId('item')).not.toHaveAttribute('data-pending')
  })

  it('toggles standalone checked state and reports item-press', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(
      <Menu>
        <DropdownMenu.CheckboxItem
          data-testid="item"
          onCheckedChange={onCheckedChange}
        >
          Item
        </DropdownMenu.CheckboxItem>
      </Menu>,
    )
    await openMenu(user)
    await user.click(screen.getByTestId('item'))
    expect(screen.getByTestId('item')).toHaveAttribute('aria-checked', 'true')
    expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(
      true,
      expect.objectContaining({ reason: 'item-press' }),
    )
  })

  it('keeps checkbox group clicks to one value change', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Menu>
        <DropdownMenu.CheckboxGroup onValueChange={onValueChange}>
          <DropdownMenu.CheckboxItem value="one" data-testid="item">
            Item
          </DropdownMenu.CheckboxItem>
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await openMenu(user)
    await user.click(screen.getByTestId('item'))
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(
      ['one'],
      expect.objectContaining({ reason: 'item-press' }),
    )
  })
})
