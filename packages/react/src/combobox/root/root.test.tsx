import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
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
})
