import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'

function MenuWithGroupedItems() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.Input
                data-testid="search-input"
                placeholder="Search..."
              />
              <DropdownMenu.List>
                <DropdownMenu.Group data-testid="group-fruits">
                  <DropdownMenu.GroupLabel data-testid="label-fruits">
                    Fruits
                  </DropdownMenu.GroupLabel>
                  <DropdownMenu.Item data-testid="item-apple" value="apple">
                    Apple
                  </DropdownMenu.Item>
                  <DropdownMenu.Item data-testid="item-banana" value="banana">
                    Banana
                  </DropdownMenu.Item>
                </DropdownMenu.Group>
                <DropdownMenu.Group data-testid="group-vegetables">
                  <DropdownMenu.GroupLabel data-testid="label-vegetables">
                    Vegetables
                  </DropdownMenu.GroupLabel>
                  <DropdownMenu.Item data-testid="item-carrot" value="carrot">
                    Carrot
                  </DropdownMenu.Item>
                  <DropdownMenu.Item data-testid="item-potato" value="potato">
                    Potato
                  </DropdownMenu.Item>
                </DropdownMenu.Group>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function SingleGroupMenu() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List>
                <DropdownMenu.Group data-testid="group-fruits">
                  <DropdownMenu.GroupLabel data-testid="label-fruits">
                    Fruits
                  </DropdownMenu.GroupLabel>
                  <DropdownMenu.Item data-testid="item-apple" value="apple">
                    Apple
                  </DropdownMenu.Item>
                </DropdownMenu.Group>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

describe('popup menu positional group attributes', () => {
  it('marks first and last visible groups and updates when filtering changes visibility', async () => {
    const user = userEvent.setup()
    render(<MenuWithGroupedItems />)

    await waitFor(() => {
      expect(screen.getByTestId('group-fruits')).toHaveAttribute(
        'data-first-group',
        '',
      )
      expect(screen.getByTestId('group-fruits')).not.toHaveAttribute(
        'data-last-group',
      )
      expect(screen.getByTestId('group-vegetables')).toHaveAttribute(
        'data-last-group',
        '',
      )
      expect(screen.getByTestId('group-vegetables')).not.toHaveAttribute(
        'data-first-group',
      )
      expect(screen.getByTestId('label-fruits')).toHaveAttribute(
        'data-first-group',
        '',
      )
      expect(screen.getByTestId('label-fruits')).not.toHaveAttribute(
        'data-last-group',
      )
      expect(screen.getByTestId('label-vegetables')).toHaveAttribute(
        'data-last-group',
        '',
      )
      expect(screen.getByTestId('label-vegetables')).not.toHaveAttribute(
        'data-first-group',
      )
    })

    const input = screen.getByTestId('search-input')
    await user.type(input, 'car')

    await waitFor(() => {
      expect(screen.queryByTestId('group-fruits')).not.toBeInTheDocument()
      expect(screen.getByTestId('group-vegetables')).toHaveAttribute(
        'data-first-group',
        '',
      )
      expect(screen.getByTestId('group-vegetables')).toHaveAttribute(
        'data-last-group',
        '',
      )
      expect(screen.getByTestId('label-vegetables')).toHaveAttribute(
        'data-first-group',
        '',
      )
      expect(screen.getByTestId('label-vegetables')).toHaveAttribute(
        'data-last-group',
        '',
      )
    })

    await user.clear(input)

    await waitFor(() => {
      expect(screen.getByTestId('group-fruits')).toHaveAttribute(
        'data-first-group',
        '',
      )
      expect(screen.getByTestId('group-fruits')).not.toHaveAttribute(
        'data-last-group',
      )
      expect(screen.getByTestId('group-vegetables')).toHaveAttribute(
        'data-last-group',
        '',
      )
      expect(screen.getByTestId('group-vegetables')).not.toHaveAttribute(
        'data-first-group',
      )
      expect(screen.getByTestId('label-fruits')).toHaveAttribute(
        'data-first-group',
        '',
      )
      expect(screen.getByTestId('label-fruits')).not.toHaveAttribute(
        'data-last-group',
      )
      expect(screen.getByTestId('label-vegetables')).toHaveAttribute(
        'data-last-group',
        '',
      )
      expect(screen.getByTestId('label-vegetables')).not.toHaveAttribute(
        'data-first-group',
      )
    })
  })

  it('marks a single group as both first and last', async () => {
    render(<SingleGroupMenu />)

    await waitFor(() => {
      expect(screen.getByTestId('group-fruits')).toHaveAttribute(
        'data-first-group',
        '',
      )
      expect(screen.getByTestId('group-fruits')).toHaveAttribute(
        'data-last-group',
        '',
      )
      expect(screen.getByTestId('label-fruits')).toHaveAttribute(
        'data-first-group',
        '',
      )
      expect(screen.getByTestId('label-fruits')).toHaveAttribute(
        'data-last-group',
        '',
      )
    })
  })
})
