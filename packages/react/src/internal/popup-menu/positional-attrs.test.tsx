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

function MixedRowMenu() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input data-testid="search-input" />
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="loose-home" value="home">
                  Home
                </DropdownMenu.Item>
                <DropdownMenu.Group data-testid="group-fruits">
                  <DropdownMenu.GroupLabel>Fruits</DropdownMenu.GroupLabel>
                  <DropdownMenu.Item data-testid="item-apple" value="apple">
                    Apple
                  </DropdownMenu.Item>
                  <DropdownMenu.Item data-testid="item-banana" value="banana">
                    Banana
                  </DropdownMenu.Item>
                </DropdownMenu.Group>
                <DropdownMenu.Separator data-testid="sep" />
                <DropdownMenu.Group data-testid="group-vegetables">
                  <DropdownMenu.GroupLabel>Vegetables</DropdownMenu.GroupLabel>
                  <DropdownMenu.Item data-testid="item-carrot" value="carrot">
                    Carrot
                  </DropdownMenu.Item>
                  <DropdownMenu.Item data-testid="item-potato" value="potato">
                    Potato
                  </DropdownMenu.Item>
                </DropdownMenu.Group>
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty-state">
                No results
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function LooseOnlyMenu() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="loose-first" value="first">
                  First
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="loose-middle" value="middle">
                  Middle
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="loose-last" value="last">
                  Last
                </DropdownMenu.Item>
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

describe('list-level and in-group attributes', () => {
  it('tracks mixed rows, group rows, filtering, and empty state', async () => {
    const user = userEvent.setup()
    render(<MixedRowMenu />)

    await waitFor(() => {
      expect(screen.getByTestId('loose-home')).toHaveAttribute('data-first', '')
      expect(screen.getByTestId('loose-home')).not.toHaveAttribute('data-last')
      expect(screen.getByTestId('group-vegetables')).toHaveAttribute(
        'data-last',
        '',
      )
      for (const id of [
        'item-apple',
        'item-banana',
        'item-carrot',
        'item-potato',
      ]) {
        expect(screen.getByTestId(id)).not.toHaveAttribute('data-first')
        expect(screen.getByTestId(id)).not.toHaveAttribute('data-last')
      }
      expect(screen.getByTestId('item-apple')).toHaveAttribute(
        'data-first-in-group',
        '',
      )
      expect(screen.getByTestId('item-apple')).not.toHaveAttribute(
        'data-last-in-group',
      )
      expect(screen.getByTestId('item-banana')).toHaveAttribute(
        'data-last-in-group',
        '',
      )
      expect(screen.getByTestId('item-potato')).toHaveAttribute(
        'data-last-in-group',
        '',
      )
      expect(screen.getByTestId('sep')).not.toHaveAttribute('data-first')
      expect(screen.getByTestId('sep')).not.toHaveAttribute('data-last')
    })

    const input = screen.getByTestId('search-input')
    await user.type(input, 'banana')
    await waitFor(() => {
      expect(screen.getByTestId('group-fruits')).toHaveAttribute(
        'data-first',
        '',
      )
      expect(screen.getByTestId('group-fruits')).toHaveAttribute(
        'data-last',
        '',
      )
      expect(screen.getByTestId('item-banana')).toHaveAttribute(
        'data-first-in-group',
        '',
      )
      expect(screen.getByTestId('item-banana')).toHaveAttribute(
        'data-last-in-group',
        '',
      )
      expect(screen.queryByTestId('loose-home')).toBeNull()
      expect(screen.queryByTestId('sep')).toBeNull()
    })

    await user.clear(input)
    await user.type(input, 'zzz')
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toHaveAttribute(
        'data-first',
        '',
      )
      expect(screen.getByTestId('empty-state')).toHaveAttribute('data-last', '')
    })
  })

  it('tracks first and last among loose items without group attributes', async () => {
    render(<LooseOnlyMenu />)
    await waitFor(() => {
      expect(screen.getByTestId('loose-first')).toHaveAttribute(
        'data-first',
        '',
      )
      expect(screen.getByTestId('loose-last')).toHaveAttribute('data-last', '')
      expect(screen.getByTestId('loose-middle')).not.toHaveAttribute(
        'data-first',
      )
      expect(screen.getByTestId('loose-middle')).not.toHaveAttribute(
        'data-last',
      )
      for (const id of ['loose-first', 'loose-middle', 'loose-last']) {
        expect(screen.getByTestId(id)).not.toHaveAttribute(
          'data-first-in-group',
        )
        expect(screen.getByTestId(id)).not.toHaveAttribute('data-last-in-group')
      }
    })
  })
})

describe('GroupValue positional override', () => {
  it('overrides item in-group positional attributes', async () => {
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  {/* Flags deliberately contradict mount order so the test
                      fails if context overrides stop winning over the store */}
                  <DropdownMenu.GroupValue
                    groupId="g1"
                    positional={{ firstInGroup: false, lastInGroup: true }}
                  >
                    <DropdownMenu.Item
                      data-testid="override-first"
                      value="first"
                    >
                      First
                    </DropdownMenu.Item>
                  </DropdownMenu.GroupValue>
                  <DropdownMenu.GroupValue
                    groupId="g1"
                    positional={{ firstInGroup: true, lastInGroup: false }}
                  >
                    <DropdownMenu.Item data-testid="override-last" value="last">
                      Last
                    </DropdownMenu.Item>
                  </DropdownMenu.GroupValue>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('override-first')).not.toHaveAttribute(
        'data-first-in-group',
      )
      expect(screen.getByTestId('override-first')).toHaveAttribute(
        'data-last-in-group',
        '',
      )
      expect(screen.getByTestId('override-last')).toHaveAttribute(
        'data-first-in-group',
        '',
      )
      expect(screen.getByTestId('override-last')).not.toHaveAttribute(
        'data-last-in-group',
      )
    })
  })

  it('overrides group label positional attributes', async () => {
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <DropdownMenu.GroupValue positional={{ firstGroup: true }}>
                    <DropdownMenu.GroupLabel data-testid="override-label">
                      Group
                    </DropdownMenu.GroupLabel>
                  </DropdownMenu.GroupValue>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('override-label')).toHaveAttribute(
        'data-first-group',
        '',
      )
    })
  })
})
