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

function createRect(
  x: number,
  y: number,
  width: number,
  height: number,
): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({}),
  } as DOMRect
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

  describe('positioning', () => {
    it('clears transform styles when aligning an item with the trigger', async () => {
      const rectSpy = vi
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockImplementation(function (this: HTMLElement) {
          switch (this.getAttribute('data-testid')) {
            case 'trigger':
              return createRect(100, 100, 220, 32)
            case 'value':
              return createRect(116, 106, 120, 20)
            case 'positioner':
              return createRect(100, 132, 220, 160)
            case 'item-label':
              return createRect(116, 150, 80, 20)
            default:
              return createRect(100, 132, 220, 160)
          }
        })
      const clientHeightSpy = vi
        .spyOn(document.documentElement, 'clientHeight', 'get')
        .mockReturnValue(768)
      const clientWidthSpy = vi
        .spyOn(document.documentElement, 'clientWidth', 'get')
        .mockReturnValue(1024)

      try {
        render(
          <Select.Root defaultOpen>
            <Select.Trigger data-testid="trigger">
              <Select.Value data-testid="value" placeholder="Select..." />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner data-testid="positioner" alignItemWithTrigger>
                <Select.Popup>
                  <Select.Surface data-testid="surface">
                    <Select.List>
                      <Select.Item value="apple">
                        <Select.ItemLabel data-testid="item-label">
                          Apple
                        </Select.ItemLabel>
                      </Select.Item>
                    </Select.List>
                  </Select.Surface>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>,
        )

        const positioner = await screen.findByTestId('positioner')

        await waitFor(() => {
          expect(positioner).toHaveStyle({
            position: 'fixed',
            transform: 'none',
          })
        })
      } finally {
        rectSpy.mockRestore()
        clientHeightSpy.mockRestore()
        clientWidthSpy.mockRestore()
      }
    })
  })

  describe('animation', () => {
    it('calls onOpenChangeComplete after animation completes', async () => {
      const user = userEvent.setup()
      const onOpenChangeComplete = vi.fn()

      render(
        <Select.Root defaultOpen onOpenChangeComplete={onOpenChangeComplete}>
          <Select.Trigger data-testid="trigger">
            <Select.Value placeholder="Select..." />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Surface data-testid="surface">
                  <Select.List>
                    <Select.Item value="apple">Apple</Select.Item>
                  </Select.List>
                </Select.Surface>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Close the select
      await user.keyboard('{Escape}')

      // onOpenChangeComplete should be called with false after close animation
      await waitFor(() => {
        expect(onOpenChangeComplete).toHaveBeenCalledWith(false)
      })
    })

    it('preserves positioning state until close animation completes', async () => {
      const user = userEvent.setup()
      const onOpenChangeComplete = vi.fn()

      render(
        <Select.Root defaultOpen onOpenChangeComplete={onOpenChangeComplete}>
          <Select.Trigger data-testid="trigger">
            <Select.Value placeholder="Select..." />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner alignItemWithTrigger>
              <Select.Popup data-testid="popup">
                <Select.Surface data-testid="surface">
                  <Select.List>
                    <Select.Item value="apple">Apple</Select.Item>
                  </Select.List>
                </Select.Surface>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Close the select
      await user.keyboard('{Escape}')

      // onOpenChangeComplete should be called with false after close animation
      await waitFor(() => {
        expect(onOpenChangeComplete).toHaveBeenCalledWith(false)
      })
    })

    it('calls onOpenChangeComplete after open animation completes', async () => {
      const user = userEvent.setup()
      const onOpenChangeComplete = vi.fn()

      render(
        <Select.Root onOpenChangeComplete={onOpenChangeComplete}>
          <Select.Trigger data-testid="trigger">
            <Select.Value placeholder="Select..." />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Surface data-testid="surface">
                  <Select.List>
                    <Select.Item value="apple">Apple</Select.Item>
                  </Select.List>
                </Select.Surface>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      )

      // Open the select
      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // onOpenChangeComplete should be called with true after open animation
      await waitFor(() => {
        expect(onOpenChangeComplete).toHaveBeenCalledWith(true)
      })
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

    function ObjectValueSelect({
      defaultValue,
      onValueChange,
    }: {
      defaultValue?: Fruit
      onValueChange?: (value: Fruit) => void
    }) {
      return (
        <Select.Root defaultValue={defaultValue} onValueChange={onValueChange}>
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" placeholder="Select a fruit..." />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Surface data-testid="surface">
                  <Select.List>
                    {fruits.map((fruit) => (
                      <Select.Item
                        key={fruit.value}
                        data-testid={`item-${fruit.value}`}
                        value={fruit}
                      >
                        <Select.ItemLabel />
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Surface>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      )
    }

    it('displays label from { value, label } object (auto-detected)', () => {
      render(<ObjectValueSelect defaultValue={fruits[1]} />)

      const value = screen.getByTestId('value')
      expect(value).toHaveTextContent('Banana')
    })

    it('selects object value and calls onValueChange with object', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<ObjectValueSelect onValueChange={onValueChange} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-cherry'))

      expect(onValueChange).toHaveBeenCalledWith(fruits[2])
    })

    it('marks correct item as selected with object value', async () => {
      const user = userEvent.setup()
      render(<ObjectValueSelect defaultValue={fruits[0]} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      expect(screen.getByTestId('item-apple')).toHaveAttribute('data-selected')
      expect(screen.getByTestId('item-banana')).not.toHaveAttribute(
        'data-selected',
      )
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

      function UserSelect({
        defaultValue,
        onValueChange,
      }: {
        defaultValue?: User
        onValueChange?: (value: User) => void
      }) {
        return (
          <Select.Root
            defaultValue={defaultValue}
            onValueChange={onValueChange}
            isItemEqualToValue={(a, b) => a.id === b.id}
            itemToStringLabel={(u) => u.name}
            itemToStringValue={(u) => String(u.id)}
          >
            <Select.Trigger data-testid="trigger">
              <Select.Value
                data-testid="value"
                placeholder="Select a user..."
              />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Surface data-testid="surface">
                    <Select.List>
                      {users.map((user) => (
                        <Select.Item
                          key={user.id}
                          data-testid={`item-${user.id}`}
                          value={user}
                        >
                          <Select.ItemLabel />
                        </Select.Item>
                      ))}
                    </Select.List>
                  </Select.Surface>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        )
      }

      it('displays label using itemToStringLabel', () => {
        render(<UserSelect defaultValue={users[1]} />)

        const value = screen.getByTestId('value')
        expect(value).toHaveTextContent('Jane Smith')
      })

      it('matches values using isItemEqualToValue (by ID)', async () => {
        const user = userEvent.setup()
        // Create a new object with same ID but different reference
        const defaultUser = {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
        }
        render(<UserSelect defaultValue={defaultUser} />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

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
        render(<UserSelect onValueChange={onValueChange} />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        await user.click(screen.getByTestId('item-1'))

        expect(onValueChange).toHaveBeenCalledWith(users[0])
      })
    })

    // Form integration with object values
    describe('form integration with object values', () => {
      function ObjectValueSelectWithForm() {
        return (
          <form data-testid="form">
            <Select.Root
              name="user"
              defaultValue={{ value: 'user-123', label: 'John Doe' }}
            >
              <Select.Trigger data-testid="trigger">
                <Select.Value placeholder="Select..." />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Surface data-testid="surface">
                      <Select.List>
                        <Select.Item
                          value={{ value: 'user-123', label: 'John Doe' }}
                        >
                          <Select.ItemLabel />
                        </Select.Item>
                        <Select.Item
                          value={{ value: 'user-456', label: 'Jane Smith' }}
                        >
                          <Select.ItemLabel />
                        </Select.Item>
                      </Select.List>
                    </Select.Surface>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </form>
        )
      }

      it('serializes object value to hidden input using auto-detected .value property', () => {
        render(<ObjectValueSelectWithForm />)

        const hiddenInput = document.querySelector(
          'input[type="hidden"][name="user"]',
        )
        expect(hiddenInput).toBeInTheDocument()
        expect(hiddenInput).toHaveValue('user-123')
      })

      it('updates hidden input when selection changes', async () => {
        const user = userEvent.setup()
        render(<ObjectValueSelectWithForm />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

        await waitFor(() => {
          expect(screen.getByTestId('surface')).toBeInTheDocument()
        })

        await user.click(screen.getByText('Jane Smith'))

        const hiddenInput = document.querySelector(
          'input[type="hidden"][name="user"]',
        )
        expect(hiddenInput).toHaveValue('user-456')
      })
    })

    // Multi-select with object values
    describe('multi-select with object values', () => {
      function MultiObjectSelect({
        defaultValues,
        onValuesChange,
      }: {
        defaultValues?: Fruit[]
        onValuesChange?: (values: Fruit[]) => void
      }) {
        return (
          <Select.Root
            multiple
            defaultValues={defaultValues}
            onValuesChange={onValuesChange}
          >
            <Select.Trigger data-testid="trigger">
              <Select.Value
                data-testid="value"
                placeholder="Select fruits..."
              />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Surface data-testid="surface">
                    <Select.List>
                      {fruits.map((fruit) => (
                        <Select.Item
                          key={fruit.value}
                          data-testid={`item-${fruit.value}`}
                          value={fruit}
                        >
                          <Select.ItemLabel />
                        </Select.Item>
                      ))}
                    </Select.List>
                  </Select.Surface>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        )
      }

      it('allows selecting multiple object values', async () => {
        const user = userEvent.setup()
        const onValuesChange = vi.fn()
        render(<MultiObjectSelect onValuesChange={onValuesChange} />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

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
        render(<MultiObjectSelect defaultValues={[fruits[0], fruits[2]]} />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

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
        render(<MultiObjectSelect onValuesChange={onValuesChange} />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

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
      function ControlledObjectSelect({
        value,
        onValueChange,
      }: {
        value: Fruit | null
        onValueChange: (value: Fruit) => void
      }) {
        return (
          <Select.Root value={value} onValueChange={onValueChange}>
            <Select.Trigger data-testid="trigger">
              <Select.Value
                data-testid="value"
                placeholder="Select a fruit..."
              />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Surface data-testid="surface">
                    <Select.List>
                      {fruits.map((fruit) => (
                        <Select.Item
                          key={fruit.value}
                          data-testid={`item-${fruit.value}`}
                          value={fruit}
                        >
                          <Select.ItemLabel />
                        </Select.Item>
                      ))}
                    </Select.List>
                  </Select.Surface>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        )
      }

      it('displays controlled object value', () => {
        const onValueChange = vi.fn()
        render(
          <ControlledObjectSelect
            value={fruits[1]}
            onValueChange={onValueChange}
          />,
        )

        expect(screen.getByTestId('value')).toHaveTextContent('Banana')
      })

      it('updates display when controlled value changes', () => {
        const onValueChange = vi.fn()
        const { rerender } = render(
          <ControlledObjectSelect
            value={fruits[0]}
            onValueChange={onValueChange}
          />,
        )

        expect(screen.getByTestId('value')).toHaveTextContent('Apple')

        rerender(
          <ControlledObjectSelect
            value={fruits[2]}
            onValueChange={onValueChange}
          />,
        )

        expect(screen.getByTestId('value')).toHaveTextContent('Cherry')
      })
    })

    // Keyboard navigation with object values
    describe('keyboard navigation with object values', () => {
      it('highlights and selects object values with keyboard', async () => {
        const user = userEvent.setup()
        const onValueChange = vi.fn()
        render(<ObjectValueSelect onValueChange={onValueChange} />)

        const trigger = screen.getByTestId('trigger')
        await user.click(trigger)

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
        const list = screen.getByRole('listbox')
        list.focus()
        await user.keyboard('{ArrowDown}{Enter}')

        expect(onValueChange).toHaveBeenCalledWith(fruits[1])
      })
    })
  })
})
