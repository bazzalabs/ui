import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Menu with shortcuts and no input.
 */
function MenuWithShortcutsNoInput({
  onSelect,
}: {
  onSelect?: (item: string) => void
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List data-testid="list">
                <DropdownMenu.Item
                  data-testid="item-1"
                  value="item-1"
                  shortcut="1"
                  onSelect={() => onSelect?.('item-1')}
                >
                  Item 1
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  data-testid="item-2"
                  value="item-2"
                  shortcut="2"
                  onSelect={() => onSelect?.('item-2')}
                >
                  Item 2
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  data-testid="item-3"
                  value="item-3"
                  shortcut="3"
                  onSelect={() => onSelect?.('item-3')}
                >
                  Item 3
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Menu with shortcuts and a visible input (always shown).
 */
function MenuWithShortcutsAndInput({
  onSelect,
}: {
  onSelect?: (item: string) => void
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.Input
                data-testid="search-input"
                placeholder="Search..."
              />
              <DropdownMenu.List data-testid="list">
                <DropdownMenu.Item
                  data-testid="item-1"
                  value="item-1"
                  shortcut="1"
                  onSelect={() => onSelect?.('item-1')}
                >
                  Item 1
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  data-testid="item-2"
                  value="item-2"
                  shortcut="2"
                  onSelect={() => onSelect?.('item-2')}
                >
                  Item 2
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  data-testid="item-3"
                  value="item-3"
                  shortcut="3"
                  onSelect={() => onSelect?.('item-3')}
                >
                  Item 3
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Menu with shortcuts and hideUntilActive input.
 */
function MenuWithShortcutsAndHideUntilActive({
  onSelect,
}: {
  onSelect?: (item: string) => void
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.Input
                data-testid="search-input"
                hideUntilActive
                placeholder="Search..."
              />
              <DropdownMenu.List data-testid="list">
                <DropdownMenu.Item
                  data-testid="item-1"
                  value="item-1"
                  shortcut="1"
                  onSelect={() => onSelect?.('item-1')}
                >
                  Item 1
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  data-testid="item-2"
                  value="item-2"
                  shortcut="2"
                  onSelect={() => onSelect?.('item-2')}
                >
                  Item 2
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  data-testid="item-3"
                  value="item-3"
                  shortcut="3"
                  onSelect={() => onSelect?.('item-3')}
                >
                  Item 3
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

// ============================================================================
// Tests
// ============================================================================

describe('Keyboard Shortcuts', () => {
  describe('without input', () => {
    it('selects item when shortcut key is pressed', async () => {
      const onSelect = vi.fn()
      const user = userEvent.setup()
      render(<MenuWithShortcutsNoInput onSelect={onSelect} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Focus the list and press shortcut
      const list = screen.getByTestId('list')
      list.focus()
      await user.keyboard('2')

      expect(onSelect).toHaveBeenCalledWith('item-2')
    })

    it('closes menu after shortcut selection', async () => {
      const onSelect = vi.fn()
      const user = userEvent.setup()
      render(<MenuWithShortcutsNoInput onSelect={onSelect} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const list = screen.getByTestId('list')
      list.focus()
      await user.keyboard('1')

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })

    it('does not trigger shortcut for unregistered keys', async () => {
      const onSelect = vi.fn()
      const user = userEvent.setup()
      render(<MenuWithShortcutsNoInput onSelect={onSelect} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const list = screen.getByTestId('list')
      list.focus()
      await user.keyboard('9') // Not a registered shortcut

      expect(onSelect).not.toHaveBeenCalled()
      // Menu should still be open
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })
  })

  describe('with visible input', () => {
    it('selects item when shortcut is pressed with empty search', async () => {
      const onSelect = vi.fn()
      const user = userEvent.setup()
      render(<MenuWithShortcutsAndInput onSelect={onSelect} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Focus the input (which handles keyboard when present) and press shortcut
      const input = screen.getByTestId('search-input')
      input.focus()
      await user.keyboard('3')

      // Shortcut should trigger and prevent character from being typed
      expect(onSelect).toHaveBeenCalledWith('item-3')
      expect(input).toHaveValue('')
    })

    it('does not trigger shortcut when there is active search text', async () => {
      const onSelect = vi.fn()
      const user = userEvent.setup()
      render(<MenuWithShortcutsAndInput onSelect={onSelect} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Type in the input first to create active search
      const input = screen.getByTestId('search-input')
      await user.type(input, 'item')

      // Now try pressing a shortcut key - should type into input, not trigger shortcut
      await user.keyboard('1')

      expect(onSelect).not.toHaveBeenCalled()
      expect(input).toHaveValue('item1')
    })

    it('triggers shortcut after search is cleared', async () => {
      const onSelect = vi.fn()
      const user = userEvent.setup()
      render(<MenuWithShortcutsAndInput onSelect={onSelect} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Type in the input
      const input = screen.getByTestId('search-input')
      await user.type(input, 'x')

      // Clear the input
      await user.clear(input)

      // Input still has focus, press shortcut
      await user.keyboard('2')

      // Shortcut should trigger since search is now empty
      expect(onSelect).toHaveBeenCalledWith('item-2')
    })
  })

  describe('with hideUntilActive input', () => {
    it('selects item when shortcut is pressed before input is activated', async () => {
      const onSelect = vi.fn()
      const user = userEvent.setup()
      render(<MenuWithShortcutsAndHideUntilActive onSelect={onSelect} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Input should not be rendered initially
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()

      // Focus the list and press shortcut
      const list = screen.getByTestId('list')
      list.focus()
      await user.keyboard('1')

      // Shortcut should work
      expect(onSelect).toHaveBeenCalledWith('item-1')
    })

    it('closes menu after shortcut selection with hideUntilActive', async () => {
      const onSelect = vi.fn()
      const user = userEvent.setup()
      render(<MenuWithShortcutsAndHideUntilActive onSelect={onSelect} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const list = screen.getByTestId('list')
      list.focus()
      await user.keyboard('2')

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })

    it('does not activate input when shortcut key is pressed', async () => {
      const onSelect = vi.fn()
      const user = userEvent.setup()
      render(<MenuWithShortcutsAndHideUntilActive onSelect={onSelect} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Input should not be rendered initially
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()

      const list = screen.getByTestId('list')
      list.focus()
      await user.keyboard('1')

      // Input should still not be rendered (shortcut took priority)
      // Note: Menu closes after shortcut, so we can't check input state
      expect(onSelect).toHaveBeenCalledWith('item-1')
    })

    it('activates input when non-shortcut printable key is pressed', async () => {
      const onSelect = vi.fn()
      const user = userEvent.setup()
      render(<MenuWithShortcutsAndHideUntilActive onSelect={onSelect} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Input should not be rendered initially
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()

      const list = screen.getByTestId('list')
      list.focus()
      // Press a key that is NOT a registered shortcut
      await user.keyboard('a')

      // Input should now be rendered (type-to-search activated)
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      // Shortcut should not have been triggered
      expect(onSelect).not.toHaveBeenCalled()

      // Input should have the typed character
      const input = screen.getByTestId('search-input')
      expect(input).toHaveValue('a')
    })

    it('shortcuts do not work after input is activated and has text', async () => {
      const onSelect = vi.fn()
      const user = userEvent.setup()
      render(<MenuWithShortcutsAndHideUntilActive onSelect={onSelect} />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const list = screen.getByTestId('list')
      list.focus()

      // Type a non-shortcut key to activate input
      await user.keyboard('a')

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      // Now type a shortcut key - should add to search, not trigger shortcut
      await user.keyboard('1')

      expect(onSelect).not.toHaveBeenCalled()
      const input = screen.getByTestId('search-input')
      expect(input).toHaveValue('a1')
    })
  })
})
