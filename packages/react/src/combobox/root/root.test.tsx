import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Combobox } from '../index.js'

// ============================================================================
// Test Fixtures
// ============================================================================

function BasicCombobox({
  defaultOpen,
  onValueChange,
  defaultValue,
}: {
  defaultOpen?: boolean
  onValueChange?: (value: string) => void
  defaultValue?: string
}) {
  return (
    <Combobox.Root
      defaultOpen={defaultOpen}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
    >
      <Combobox.Input data-testid="input" />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.Surface data-testid="surface">
              <Combobox.List data-testid="list">
                <Combobox.Item data-testid="item-apple" value="apple">
                  Apple
                </Combobox.Item>
                <Combobox.Item data-testid="item-banana" value="banana">
                  Banana
                </Combobox.Item>
                <Combobox.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </Combobox.Item>
              </Combobox.List>
              <Combobox.Empty data-testid="empty">No results</Combobox.Empty>
            </Combobox.Surface>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

function ComboboxWithOpenOnFocus({ openOnFocus }: { openOnFocus?: boolean }) {
  return (
    <Combobox.Root openOnFocus={openOnFocus}>
      <Combobox.Input data-testid="input" />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.Surface data-testid="surface">
              <Combobox.List>
                <Combobox.Item data-testid="item-apple" value="apple">
                  Apple
                </Combobox.Item>
              </Combobox.List>
            </Combobox.Surface>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

function ComboboxWithCloseOnSelect({
  closeOnSelect,
}: {
  closeOnSelect?: boolean
}) {
  return (
    <Combobox.Root closeOnSelect={closeOnSelect}>
      <Combobox.Input data-testid="input" />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.Surface data-testid="surface">
              <Combobox.List>
                <Combobox.Item data-testid="item-apple" value="apple">
                  Apple
                </Combobox.Item>
                <Combobox.Item data-testid="item-banana" value="banana">
                  Banana
                </Combobox.Item>
              </Combobox.List>
            </Combobox.Surface>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

function MultiSelectCombobox({
  onValuesChange,
}: {
  onValuesChange?: (values: string[]) => void
}) {
  return (
    <Combobox.Root multiple onValuesChange={onValuesChange}>
      <Combobox.Input data-testid="input" />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.Surface data-testid="surface">
              <Combobox.List>
                <Combobox.Item data-testid="item-apple" value="apple">
                  Apple
                </Combobox.Item>
                <Combobox.Item data-testid="item-banana" value="banana">
                  Banana
                </Combobox.Item>
                <Combobox.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </Combobox.Item>
              </Combobox.List>
            </Combobox.Surface>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

function ControlledInputCombobox({
  inputValue,
  onInputValueChange,
}: {
  inputValue: string
  onInputValueChange: (value: string) => void
}) {
  return (
    <Combobox.Root
      defaultOpen
      inputValue={inputValue}
      onInputValueChange={onInputValueChange}
    >
      <Combobox.Input data-testid="input" />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.Surface data-testid="surface">
              <Combobox.List>
                <Combobox.Item data-testid="item-apple" value="apple">
                  Apple
                </Combobox.Item>
                <Combobox.Item data-testid="item-banana" value="banana">
                  Banana
                </Combobox.Item>
              </Combobox.List>
            </Combobox.Surface>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

// ============================================================================
// Tests
// ============================================================================

describe('<Combobox.Root />', () => {
  describe('open/close behavior', () => {
    it('opens when input is focused (openOnFocus=true by default)', async () => {
      const user = userEvent.setup()
      render(<BasicCombobox />)

      const input = screen.getByTestId('input')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })
    })

    it('does not open on focus when openOnFocus=false', async () => {
      const user = userEvent.setup()
      render(<ComboboxWithOpenOnFocus openOnFocus={false} />)

      const input = screen.getByTestId('input')

      // Use tab to focus without clicking (click might trigger open regardless)
      await user.tab()
      expect(input).toHaveFocus()

      // Wait a bit to ensure it doesn't open
      await new Promise((r) => setTimeout(r, 50))
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
    })

    it('closes when Escape is pressed', async () => {
      const user = userEvent.setup()
      render(<BasicCombobox defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })
  })

  describe('filtering', () => {
    it('filters items as user types', async () => {
      const user = userEvent.setup()
      render(<BasicCombobox defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('input')
      await user.type(input, 'app')

      // Only apple should match
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-cherry')).not.toBeInTheDocument()
    })

    it('shows empty state when no items match', async () => {
      const user = userEvent.setup()
      render(<BasicCombobox defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('input')
      await user.type(input, 'xyz')

      // All items should be filtered out
      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-cherry')).not.toBeInTheDocument()

      // Empty state should be visible
      expect(screen.getByTestId('empty')).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('selects item on click', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<BasicCombobox defaultOpen onValueChange={onValueChange} />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-apple'))

      expect(onValueChange).toHaveBeenCalledWith('apple')
    })

    it('selects item with Enter key', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<BasicCombobox defaultOpen onValueChange={onValueChange} />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('input')
      // Navigate to first item and select
      await user.type(input, '{ArrowDown}{Enter}')

      expect(onValueChange).toHaveBeenCalled()
    })

    it('closes after selection by default (single-select)', async () => {
      const user = userEvent.setup()
      render(<BasicCombobox defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-apple'))

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })

    it('respects closeOnSelect={false}', async () => {
      const user = userEvent.setup()
      render(<ComboboxWithCloseOnSelect closeOnSelect={false} />)

      const input = screen.getByTestId('input')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-apple'))

      // Should still be open
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })
  })

  describe('multi-select', () => {
    it('allows selecting multiple items', async () => {
      const user = userEvent.setup()
      const onValuesChange = vi.fn()
      render(<MultiSelectCombobox onValuesChange={onValuesChange} />)

      const input = screen.getByTestId('input')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-apple'))
      expect(onValuesChange).toHaveBeenLastCalledWith(['apple'])

      await user.click(screen.getByTestId('item-banana'))
      expect(onValuesChange).toHaveBeenLastCalledWith(['apple', 'banana'])
    })

    it('stays open after selection in multi-select mode', async () => {
      const user = userEvent.setup()
      render(<MultiSelectCombobox />)

      const input = screen.getByTestId('input')
      await user.click(input)

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
      render(<MultiSelectCombobox onValuesChange={onValuesChange} />)

      const input = screen.getByTestId('input')
      await user.click(input)

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
  })

  describe('keyboard navigation', () => {
    it('navigates with ArrowDown', async () => {
      const user = userEvent.setup()
      render(<BasicCombobox defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // First item is auto-highlighted on open
      await waitFor(() => {
        expect(screen.getByTestId('item-apple')).toHaveAttribute(
          'data-highlighted',
        )
      })

      const input = screen.getByTestId('input')
      await user.type(input, '{ArrowDown}')

      // Second item should now be highlighted
      await waitFor(() => {
        expect(screen.getByTestId('item-banana')).toHaveAttribute(
          'data-highlighted',
        )
      })

      await user.type(input, '{ArrowDown}')

      // Third item should be highlighted
      await waitFor(() => {
        expect(screen.getByTestId('item-cherry')).toHaveAttribute(
          'data-highlighted',
        )
      })
    })

    it('navigates with ArrowUp', async () => {
      const user = userEvent.setup()
      render(<BasicCombobox defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('input')

      // First item is auto-highlighted, navigate down then up
      await user.type(input, '{ArrowDown}{ArrowUp}')

      // First item should be highlighted again
      await waitFor(() => {
        expect(screen.getByTestId('item-apple')).toHaveAttribute(
          'data-highlighted',
        )
      })
    })
  })

  describe('controlled input', () => {
    it('uses controlled inputValue', async () => {
      const onInputValueChange = vi.fn()
      render(
        <ControlledInputCombobox
          inputValue="test"
          onInputValueChange={onInputValueChange}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('input')
      expect(input).toHaveValue('test')
    })

    it('calls onInputValueChange when user types', async () => {
      const user = userEvent.setup()
      const onInputValueChange = vi.fn()
      render(
        <ControlledInputCombobox
          inputValue=""
          onInputValueChange={onInputValueChange}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('input')
      await user.type(input, 'a')

      expect(onInputValueChange).toHaveBeenCalledWith('a')
    })
  })

  // ============================================================================
  // Object Values Support
  // ============================================================================

  describe('object values', () => {
    // Standard { value, label } shape - auto-detected
    interface Fruit {
      value: string
      label: string
    }

    const fruits: Fruit[] = [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'cherry', label: 'Cherry' },
    ]

    function ObjectValueCombobox({
      defaultValue,
      onValueChange,
    }: {
      defaultValue?: Fruit
      onValueChange?: (value: Fruit) => void
    }) {
      return (
        <Combobox.Root
          defaultValue={defaultValue}
          onValueChange={onValueChange}
        >
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Surface data-testid="surface">
                  <Combobox.List>
                    {fruits.map((fruit) => (
                      <Combobox.Item
                        key={fruit.value}
                        data-testid={`item-${fruit.value}`}
                        value={fruit}
                      >
                        <Combobox.ItemLabel />
                      </Combobox.Item>
                    ))}
                  </Combobox.List>
                  <Combobox.Empty data-testid="empty">
                    No results
                  </Combobox.Empty>
                </Combobox.Surface>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      )
    }

    it('displays label from { value, label } object in input (auto-detected)', async () => {
      const user = userEvent.setup()
      render(<ObjectValueCombobox defaultValue={fruits[1]} />)

      // Open the combobox to display the selected value
      const input = screen.getByTestId('input')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Input should show the label
      expect(input).toHaveValue('Banana')
    })

    it('selects object value and calls onValueChange with object', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<ObjectValueCombobox onValueChange={onValueChange} />)

      const input = screen.getByTestId('input')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-cherry'))

      expect(onValueChange).toHaveBeenCalledWith(fruits[2])
    })

    it('marks correct item as selected with object value', async () => {
      const user = userEvent.setup()
      render(<ObjectValueCombobox defaultValue={fruits[0]} />)

      const input = screen.getByTestId('input')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      expect(screen.getByTestId('item-apple')).toHaveAttribute('data-selected')
      expect(screen.getByTestId('item-banana')).not.toHaveAttribute(
        'data-selected',
      )
    })

    it('filters items based on typed text with object values', async () => {
      const user = userEvent.setup()
      render(<ObjectValueCombobox />)

      const input = screen.getByTestId('input')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Type to filter
      await user.type(input, 'ban')

      // Only banana should match
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-cherry')).not.toBeInTheDocument()
    })

    // Custom object shape with isItemEqualToValue
    describe('custom equality comparison', () => {
      interface User {
        id: number
        name: string
        email: string
      }

      const users: User[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        { id: 3, name: 'Bob Wilson', email: 'bob@example.com' },
      ]

      function UserCombobox({
        defaultValue,
        onValueChange,
      }: {
        defaultValue?: User
        onValueChange?: (value: User) => void
      }) {
        return (
          <Combobox.Root
            defaultValue={defaultValue}
            onValueChange={onValueChange}
            isItemEqualToValue={(a, b) => a.id === b.id}
            itemToStringLabel={(u) => u.name}
            itemToStringValue={(u) => String(u.id)}
          >
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.Surface data-testid="surface">
                    <Combobox.List>
                      {users.map((user) => (
                        <Combobox.Item
                          key={user.id}
                          data-testid={`item-${user.id}`}
                          value={user}
                        >
                          <Combobox.ItemLabel />
                        </Combobox.Item>
                      ))}
                    </Combobox.List>
                  </Combobox.Surface>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        )
      }

      it('displays label using itemToStringLabel', async () => {
        const user = userEvent.setup()
        render(<UserCombobox defaultValue={users[1]} />)

        const input = screen.getByTestId('input')
        await user.click(input)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        expect(input).toHaveValue('Jane Smith')
      })

      it('matches values using isItemEqualToValue (by ID)', async () => {
        const user = userEvent.setup()
        // Create a new object with same ID but different reference
        const defaultUser = {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
        }
        render(<UserCombobox defaultValue={defaultUser} />)

        const input = screen.getByTestId('input')
        await user.click(input)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // Item with id=2 should be selected even though object reference differs
        expect(screen.getByTestId('item-2')).toHaveAttribute('data-selected')
        expect(screen.getByTestId('item-1')).not.toHaveAttribute(
          'data-selected',
        )
      })

      it('calls onValueChange with the item value from the list', async () => {
        const user = userEvent.setup()
        const onValueChange = vi.fn()
        render(<UserCombobox onValueChange={onValueChange} />)

        const input = screen.getByTestId('input')
        await user.click(input)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        await user.click(screen.getByTestId('item-1'))

        expect(onValueChange).toHaveBeenCalledWith(users[0])
      })
    })

    // Form integration with object values
    describe('form integration with object values', () => {
      function ObjectValueComboboxWithForm() {
        return (
          <form data-testid="form">
            <Combobox.Root
              name="user"
              defaultValue={{ value: 'user-123', label: 'John Doe' }}
            >
              <Combobox.Input data-testid="input" />
              <Combobox.Portal>
                <Combobox.Positioner>
                  <Combobox.Popup>
                    <Combobox.Surface data-testid="surface">
                      <Combobox.List>
                        <Combobox.Item
                          value={{ value: 'user-123', label: 'John Doe' }}
                        >
                          <Combobox.ItemLabel />
                        </Combobox.Item>
                        <Combobox.Item
                          data-testid="item-456"
                          value={{ value: 'user-456', label: 'Jane Smith' }}
                        >
                          <Combobox.ItemLabel />
                        </Combobox.Item>
                      </Combobox.List>
                    </Combobox.Surface>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
          </form>
        )
      }

      it('serializes object value to hidden input using auto-detected .value property', () => {
        render(<ObjectValueComboboxWithForm />)

        const hiddenInput = document.querySelector(
          'input[type="hidden"][name="user"]',
        )
        expect(hiddenInput).toBeInTheDocument()
        expect(hiddenInput).toHaveValue('user-123')
      })

      it('updates hidden input when selection changes', async () => {
        const user = userEvent.setup()
        render(<ObjectValueComboboxWithForm />)

        const input = screen.getByTestId('input')
        await user.click(input)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        await user.click(screen.getByTestId('item-456'))

        const hiddenInput = document.querySelector(
          'input[type="hidden"][name="user"]',
        )
        expect(hiddenInput).toHaveValue('user-456')
      })
    })

    // Multi-select with object values
    describe('multi-select with object values', () => {
      function MultiObjectCombobox({
        defaultValues,
        onValuesChange,
      }: {
        defaultValues?: Fruit[]
        onValuesChange?: (values: Fruit[]) => void
      }) {
        return (
          <Combobox.Root
            multiple
            defaultValues={defaultValues}
            onValuesChange={onValuesChange}
          >
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.Surface data-testid="surface">
                    <Combobox.List>
                      {fruits.map((fruit) => (
                        <Combobox.Item
                          key={fruit.value}
                          data-testid={`item-${fruit.value}`}
                          value={fruit}
                        >
                          <Combobox.ItemLabel />
                        </Combobox.Item>
                      ))}
                    </Combobox.List>
                  </Combobox.Surface>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        )
      }

      it('allows selecting multiple object values', async () => {
        const user = userEvent.setup()
        const onValuesChange = vi.fn()
        render(<MultiObjectCombobox onValuesChange={onValuesChange} />)

        const input = screen.getByTestId('input')
        await user.click(input)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        await user.click(screen.getByTestId('item-apple'))
        expect(onValuesChange).toHaveBeenLastCalledWith([fruits[0]])

        await user.click(screen.getByTestId('item-cherry'))
        expect(onValuesChange).toHaveBeenLastCalledWith([fruits[0], fruits[2]])
      })

      it('marks multiple items as selected', async () => {
        const user = userEvent.setup()
        render(<MultiObjectCombobox defaultValues={[fruits[0], fruits[2]]} />)

        const input = screen.getByTestId('input')
        await user.click(input)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        expect(screen.getByTestId('item-apple')).toHaveAttribute(
          'data-selected',
        )
        expect(screen.getByTestId('item-banana')).not.toHaveAttribute(
          'data-selected',
        )
        expect(screen.getByTestId('item-cherry')).toHaveAttribute(
          'data-selected',
        )
      })

      it('toggles object value selection', async () => {
        const user = userEvent.setup()
        const onValuesChange = vi.fn()
        render(<MultiObjectCombobox onValuesChange={onValuesChange} />)

        const input = screen.getByTestId('input')
        await user.click(input)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // Select apple
        await user.click(screen.getByTestId('item-apple'))
        expect(onValuesChange).toHaveBeenLastCalledWith([fruits[0]])

        // Deselect apple
        await user.click(screen.getByTestId('item-apple'))
        expect(onValuesChange).toHaveBeenLastCalledWith([])
      })
    })

    // Controlled mode with object values
    describe('controlled mode with object values', () => {
      function ControlledObjectCombobox({
        value,
        onValueChange,
      }: {
        value: Fruit | null
        onValueChange: (value: Fruit) => void
      }) {
        return (
          <Combobox.Root value={value} onValueChange={onValueChange}>
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.Surface data-testid="surface">
                    <Combobox.List>
                      {fruits.map((fruit) => (
                        <Combobox.Item
                          key={fruit.value}
                          data-testid={`item-${fruit.value}`}
                          value={fruit}
                        >
                          <Combobox.ItemLabel />
                        </Combobox.Item>
                      ))}
                    </Combobox.List>
                  </Combobox.Surface>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        )
      }

      it('displays controlled object value in input', async () => {
        const user = userEvent.setup()
        const onValueChange = vi.fn()
        render(
          <ControlledObjectCombobox
            value={fruits[1]}
            onValueChange={onValueChange}
          />,
        )

        const input = screen.getByTestId('input')
        await user.click(input)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        expect(input).toHaveValue('Banana')
      })

      it('updates selection when controlled value changes', async () => {
        const user = userEvent.setup()
        const onValueChange = vi.fn()
        const { rerender } = render(
          <ControlledObjectCombobox
            value={fruits[0]}
            onValueChange={onValueChange}
          />,
        )

        const input = screen.getByTestId('input')
        await user.click(input)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // First item should be selected
        expect(screen.getByTestId('item-apple')).toHaveAttribute(
          'data-selected',
        )
        expect(screen.getByTestId('item-cherry')).not.toHaveAttribute(
          'data-selected',
        )

        // Change the controlled value
        rerender(
          <ControlledObjectCombobox
            value={fruits[2]}
            onValueChange={onValueChange}
          />,
        )

        // Selection should update to cherry
        await waitFor(() => {
          expect(screen.getByTestId('item-cherry')).toHaveAttribute(
            'data-selected',
          )
        })
        expect(screen.getByTestId('item-apple')).not.toHaveAttribute(
          'data-selected',
        )
      })
    })

    // Keyboard navigation with object values
    describe('keyboard navigation with object values', () => {
      it('highlights and selects object values with keyboard', async () => {
        const user = userEvent.setup()
        const onValueChange = vi.fn()
        render(<ObjectValueCombobox onValueChange={onValueChange} />)

        const input = screen.getByTestId('input')
        await user.click(input)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        // First item should be auto-highlighted
        await waitFor(() => {
          expect(screen.getByTestId('item-apple')).toHaveAttribute(
            'data-highlighted',
          )
        })

        // Navigate down and select
        await user.type(input, '{ArrowDown}{Enter}')

        expect(onValueChange).toHaveBeenCalledWith(fruits[1])
      })
    })
  })
})
