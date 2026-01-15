import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Select } from '../index.js'

// ============================================================================
// Test Fixtures
// ============================================================================

function BasicSelect({
  defaultOpen,
  defaultValue,
  onValueChange,
  disabled,
}: {
  defaultOpen?: boolean
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}) {
  return (
    <Select.Root
      defaultOpen={defaultOpen}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <Select.Trigger data-testid="trigger">
        <Select.Value data-testid="value" placeholder="Select a fruit..." />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.Surface data-testid="surface">
              <Select.List data-testid="list">
                <Select.Item data-testid="item-apple" value="apple">
                  Apple
                </Select.Item>
                <Select.Item data-testid="item-banana" value="banana">
                  Banana
                </Select.Item>
                <Select.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </Select.Item>
              </Select.List>
            </Select.Surface>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

function MultiSelect({
  defaultValues,
  onValuesChange,
}: {
  defaultValues?: string[]
  onValuesChange?: (values: string[]) => void
}) {
  return (
    <Select.Root
      multiple
      defaultValues={defaultValues}
      onValuesChange={onValuesChange}
    >
      <Select.Trigger data-testid="trigger">
        <Select.Value data-testid="value" placeholder="Select fruits..." />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.Surface data-testid="surface">
              <Select.List>
                <Select.Item data-testid="item-apple" value="apple">
                  Apple
                </Select.Item>
                <Select.Item data-testid="item-banana" value="banana">
                  Banana
                </Select.Item>
                <Select.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </Select.Item>
              </Select.List>
            </Select.Surface>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

function SelectWithDisabledItem() {
  return (
    <Select.Root defaultOpen>
      <Select.Trigger data-testid="trigger">
        <Select.Value placeholder="Select..." />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.Surface data-testid="surface">
              <Select.List>
                <Select.Item data-testid="item-apple" value="apple">
                  Apple
                </Select.Item>
                <Select.Item data-testid="item-banana" value="banana" disabled>
                  Banana (disabled)
                </Select.Item>
                <Select.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </Select.Item>
              </Select.List>
            </Select.Surface>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

function SelectWithSearch() {
  return (
    <Select.Root defaultOpen>
      <Select.Trigger data-testid="trigger">
        <Select.Value placeholder="Select..." />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.Surface data-testid="surface">
              <Select.Input
                data-testid="search-input"
                placeholder="Search..."
              />
              <Select.List>
                <Select.Item data-testid="item-apple" value="apple">
                  Apple
                </Select.Item>
                <Select.Item data-testid="item-banana" value="banana">
                  Banana
                </Select.Item>
                <Select.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </Select.Item>
              </Select.List>
              <Select.Empty data-testid="empty">No results</Select.Empty>
            </Select.Surface>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

function SelectWithFormName({ name = 'fruit' }: { name?: string }) {
  return (
    <form data-testid="form">
      <Select.Root name={name} defaultValue="banana">
        <Select.Trigger data-testid="trigger">
          <Select.Value placeholder="Select..." />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Surface data-testid="surface">
                <Select.List>
                  <Select.Item value="apple">Apple</Select.Item>
                  <Select.Item value="banana">Banana</Select.Item>
                  <Select.Item value="cherry">Cherry</Select.Item>
                </Select.List>
              </Select.Surface>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </form>
  )
}

function ControlledSelect({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <Select.Root
      value={value}
      onValueChange={onValueChange}
      items={{ apple: 'Apple', banana: 'Banana' }}
    >
      <Select.Trigger data-testid="trigger">
        <Select.Value data-testid="value" placeholder="Select..." />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.Surface data-testid="surface">
              <Select.List>
                <Select.Item data-testid="item-apple" value="apple">
                  Apple
                </Select.Item>
                <Select.Item data-testid="item-banana" value="banana">
                  Banana
                </Select.Item>
              </Select.List>
            </Select.Surface>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

// ============================================================================
// Tests
// ============================================================================

describe('<Select.Root />', () => {
  describe('open/close behavior', () => {
    it('opens when trigger is clicked', async () => {
      const user = userEvent.setup()
      render(<BasicSelect />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })
    })

    it('closes when item is selected (single-select)', async () => {
      const user = userEvent.setup()
      render(<BasicSelect defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-apple'))

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })

    it('closes when Escape is pressed', async () => {
      const user = userEvent.setup()
      render(<BasicSelect defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })

    it('does not open when disabled', async () => {
      const user = userEvent.setup()
      render(<BasicSelect disabled />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      // Wait a moment to ensure it doesn't open
      await new Promise((r) => setTimeout(r, 50))
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('selects item on click', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<BasicSelect defaultOpen onValueChange={onValueChange} />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-apple'))

      expect(onValueChange).toHaveBeenCalledWith('apple')
    })

    it('selects item with Enter key', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<BasicSelect defaultOpen onValueChange={onValueChange} />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // First item is auto-highlighted, navigate and select
      const list = screen.getByTestId('list')
      list.focus()
      await user.keyboard('{ArrowDown}{Enter}')

      expect(onValueChange).toHaveBeenCalled()
    })

    it('displays selected value in trigger', async () => {
      render(<BasicSelect defaultValue="banana" />)

      // Value shows the raw value initially before items mount
      // To show formatted labels, use the `items` prop on Select.Root
      const value = screen.getByTestId('value')
      expect(value).toHaveTextContent('banana')
    })

    it('displays formatted label when items prop is provided', () => {
      render(
        <Select.Root
          defaultValue="banana"
          items={{ apple: 'Apple', banana: 'Banana', cherry: 'Cherry' }}
        >
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" placeholder="Select..." />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Surface>
                  <Select.List>
                    <Select.Item value="apple">Apple</Select.Item>
                    <Select.Item value="banana">Banana</Select.Item>
                    <Select.Item value="cherry">Cherry</Select.Item>
                  </Select.List>
                </Select.Surface>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      )

      const value = screen.getByTestId('value')
      expect(value).toHaveTextContent('Banana')
    })

    it('shows placeholder when no value selected', () => {
      render(<BasicSelect />)

      const value = screen.getByTestId('value')
      expect(value).toHaveTextContent('Select a fruit...')
    })

    it('does not select disabled items', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(
        <Select.Root defaultOpen onValueChange={onValueChange}>
          <Select.Trigger data-testid="trigger">
            <Select.Value placeholder="Select..." />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Surface>
                  <Select.List>
                    <Select.Item
                      data-testid="item-disabled"
                      value="disabled"
                      disabled
                    >
                      Disabled
                    </Select.Item>
                  </Select.List>
                </Select.Surface>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('item-disabled')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-disabled'))

      expect(onValueChange).not.toHaveBeenCalled()
    })
  })

  describe('multi-select', () => {
    it('allows selecting multiple items', async () => {
      const user = userEvent.setup()
      const onValuesChange = vi.fn()
      render(<MultiSelect onValuesChange={onValuesChange} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-apple'))
      expect(onValuesChange).toHaveBeenLastCalledWith(['apple'])

      await user.click(screen.getByTestId('item-banana'))
      expect(onValuesChange).toHaveBeenLastCalledWith(['apple', 'banana'])
    })

    it('stays open after selection', async () => {
      const user = userEvent.setup()
      render(<MultiSelect />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-apple'))

      // Should still be open
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })

    it('toggles selection on re-click', async () => {
      const user = userEvent.setup()
      const onValuesChange = vi.fn()
      render(<MultiSelect onValuesChange={onValuesChange} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Select apple
      await user.click(screen.getByTestId('item-apple'))
      expect(onValuesChange).toHaveBeenLastCalledWith(['apple'])

      // Deselect apple
      await user.click(screen.getByTestId('item-apple'))
      expect(onValuesChange).toHaveBeenLastCalledWith([])
    })

    it('marks selected items with data-selected', async () => {
      const user = userEvent.setup()
      render(<MultiSelect defaultValues={['apple', 'cherry']} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      expect(screen.getByTestId('item-apple')).toHaveAttribute('data-selected')
      expect(screen.getByTestId('item-banana')).not.toHaveAttribute(
        'data-selected',
      )
      expect(screen.getByTestId('item-cherry')).toHaveAttribute('data-selected')
    })
  })

  describe('keyboard navigation', () => {
    it('navigates with ArrowDown', async () => {
      const user = userEvent.setup()
      render(<BasicSelect defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // First item is auto-highlighted
      await waitFor(() => {
        expect(screen.getByTestId('item-apple')).toHaveAttribute(
          'data-highlighted',
        )
      })

      const list = screen.getByTestId('list')
      list.focus()
      await user.keyboard('{ArrowDown}')

      await waitFor(() => {
        expect(screen.getByTestId('item-banana')).toHaveAttribute(
          'data-highlighted',
        )
      })
    })

    it('navigates with ArrowUp', async () => {
      const user = userEvent.setup()
      render(<BasicSelect defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const list = screen.getByTestId('list')
      list.focus()

      // Navigate down then up
      await user.keyboard('{ArrowDown}{ArrowUp}')

      await waitFor(() => {
        expect(screen.getByTestId('item-apple')).toHaveAttribute(
          'data-highlighted',
        )
      })
    })

    it('skips disabled items during navigation', async () => {
      const user = userEvent.setup()
      render(<SelectWithDisabledItem />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // First item should be highlighted (apple)
      await waitFor(() => {
        expect(screen.getByTestId('item-apple')).toHaveAttribute(
          'data-highlighted',
        )
      })

      const list = screen.getByRole('listbox')
      list.focus()

      // ArrowDown should skip banana (disabled) and go to cherry
      await user.keyboard('{ArrowDown}')

      await waitFor(() => {
        expect(screen.getByTestId('item-cherry')).toHaveAttribute(
          'data-highlighted',
        )
      })
    })
  })

  describe('search/filter', () => {
    it('filters items as user types', async () => {
      const user = userEvent.setup()
      render(<SelectWithSearch />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')
      await user.type(input, 'app')

      // Only apple should match
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-cherry')).not.toBeInTheDocument()
    })

    it('shows empty state when no items match', async () => {
      const user = userEvent.setup()
      render(<SelectWithSearch />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')
      await user.type(input, 'xyz')

      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()
      expect(screen.getByTestId('empty')).toBeInTheDocument()
    })
  })

  describe('controlled mode', () => {
    it('uses controlled value', async () => {
      const onValueChange = vi.fn()
      const { rerender } = render(
        <ControlledSelect value="apple" onValueChange={onValueChange} />,
      )

      expect(screen.getByTestId('value')).toHaveTextContent('Apple')

      rerender(
        <ControlledSelect value="banana" onValueChange={onValueChange} />,
      )

      expect(screen.getByTestId('value')).toHaveTextContent('Banana')
    })

    it('calls onValueChange but does not change display until prop changes', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<ControlledSelect value="apple" onValueChange={onValueChange} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-banana'))

      // Callback should be called
      expect(onValueChange).toHaveBeenCalledWith('banana')

      // But display should still show apple (controlled)
      expect(screen.getByTestId('value')).toHaveTextContent('Apple')
    })
  })

  describe('form integration', () => {
    it('renders hidden input with name prop', () => {
      render(<SelectWithFormName name="fruit" />)

      const hiddenInput = document.querySelector(
        'input[type="hidden"][name="fruit"]',
      )
      expect(hiddenInput).toBeInTheDocument()
      expect(hiddenInput).toHaveValue('banana')
    })

    it('updates hidden input when value changes', async () => {
      const user = userEvent.setup()
      render(
        <form data-testid="form">
          <Select.Root name="fruit">
            <Select.Trigger data-testid="trigger">
              <Select.Value placeholder="Select..." />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Surface data-testid="surface">
                    <Select.List>
                      <Select.Item value="apple">Apple</Select.Item>
                      <Select.Item value="banana">Banana</Select.Item>
                    </Select.List>
                  </Select.Surface>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </form>,
      )

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Apple'))

      const hiddenInput = document.querySelector(
        'input[type="hidden"][name="fruit"]',
      )
      expect(hiddenInput).toHaveValue('apple')
    })

    it('renders multiple hidden inputs for multi-select', async () => {
      const user = userEvent.setup()
      render(
        <form data-testid="form">
          <Select.Root
            multiple
            name="fruits"
            defaultValues={['apple', 'cherry']}
          >
            <Select.Trigger data-testid="trigger">
              <Select.Value placeholder="Select..." />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Surface>
                    <Select.List>
                      <Select.Item value="apple">Apple</Select.Item>
                      <Select.Item value="banana">Banana</Select.Item>
                      <Select.Item value="cherry">Cherry</Select.Item>
                    </Select.List>
                  </Select.Surface>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </form>,
      )

      const hiddenInputs = document.querySelectorAll(
        'input[type="hidden"][name="fruits"]',
      )
      expect(hiddenInputs).toHaveLength(2)

      const values = Array.from(hiddenInputs).map(
        (input) => (input as HTMLInputElement).value,
      )
      expect(values).toContain('apple')
      expect(values).toContain('cherry')
    })
  })

  describe('ARIA attributes', () => {
    it('trigger has correct ARIA attributes', async () => {
      const user = userEvent.setup()
      render(<BasicSelect />)

      const trigger = screen.getByTestId('trigger')
      expect(trigger).toHaveAttribute('role', 'combobox')
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    it('items have correct ARIA attributes', async () => {
      const user = userEvent.setup()
      render(<BasicSelect defaultValue="banana" />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const apple = screen.getByTestId('item-apple')
      const banana = screen.getByTestId('item-banana')

      expect(apple).toHaveAttribute('role', 'option')
      expect(apple).toHaveAttribute('aria-selected', 'false')

      expect(banana).toHaveAttribute('role', 'option')
      expect(banana).toHaveAttribute('aria-selected', 'true')
    })

    it('disabled items have aria-disabled', async () => {
      render(<SelectWithDisabledItem />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const banana = screen.getByTestId('item-banana')
      expect(banana).toHaveAttribute('aria-disabled', 'true')
    })
  })
})
