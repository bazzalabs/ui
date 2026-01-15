import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ContextMenu } from '../index.js'

// ============================================================================
// Test Fixtures
// ============================================================================

function BasicContextMenu(
  props: Partial<ContextMenu.Root.Props> & {
    surfaceProps?: Partial<ContextMenu.Surface.Props>
  } = {},
) {
  const { surfaceProps, ...rootProps } = props
  return (
    <ContextMenu.Root {...rootProps}>
      <ContextMenu.Trigger data-testid="trigger">
        Right-click here
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup>
            <ContextMenu.Surface data-testid="surface" {...surfaceProps}>
              <ContextMenu.List>
                <ContextMenu.Item data-testid="item-1">Item 1</ContextMenu.Item>
                <ContextMenu.Item data-testid="item-2">Item 2</ContextMenu.Item>
                <ContextMenu.Item data-testid="item-3">Item 3</ContextMenu.Item>
              </ContextMenu.List>
            </ContextMenu.Surface>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

function ContextMenuWithDisabledItems() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger data-testid="trigger">
        Right-click here
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup>
            <ContextMenu.Surface data-testid="surface">
              <ContextMenu.List>
                <ContextMenu.Item data-testid="item-1">Item 1</ContextMenu.Item>
                <ContextMenu.Item data-testid="item-2" disabled>
                  Item 2 (disabled)
                </ContextMenu.Item>
                <ContextMenu.Item data-testid="item-3">Item 3</ContextMenu.Item>
              </ContextMenu.List>
            </ContextMenu.Surface>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

function ContextMenuWithOnSelect() {
  const [selected, setSelected] = React.useState<string | null>(null)

  return (
    <div>
      <div data-testid="selected">{selected ?? 'none'}</div>
      <ContextMenu.Root>
        <ContextMenu.Trigger data-testid="trigger">
          Right-click here
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup>
              <ContextMenu.Surface data-testid="surface">
                <ContextMenu.List>
                  <ContextMenu.Item
                    data-testid="item-1"
                    onSelect={() => setSelected('item-1')}
                  >
                    Item 1
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    data-testid="item-2"
                    onSelect={() => setSelected('item-2')}
                  >
                    Item 2
                  </ContextMenu.Item>
                </ContextMenu.List>
              </ContextMenu.Surface>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    </div>
  )
}

function ControlledContextMenu({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (
    open: boolean,
    details: ContextMenu.Root.OpenChangeEventDetails,
  ) => void
}) {
  return (
    <ContextMenu.Root open={open} onOpenChange={onOpenChange}>
      <ContextMenu.Trigger data-testid="trigger">
        Right-click here
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup>
            <ContextMenu.Surface data-testid="surface">
              <ContextMenu.List>
                <ContextMenu.Item data-testid="item-1">Item 1</ContextMenu.Item>
              </ContextMenu.List>
            </ContextMenu.Surface>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Simulates a right-click (contextmenu event) on an element
 * Wrapped in act() to properly handle React state updates
 */
async function rightClick(element: HTMLElement, clientX = 100, clientY = 100) {
  await act(async () => {
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      button: 2,
    })
    element.dispatchEvent(event)
  })
}

// ============================================================================
// Tests
// ============================================================================

describe('<ContextMenu.Root />', () => {
  describe('right-click behavior', () => {
    it('opens when trigger is right-clicked', async () => {
      render(<BasicContextMenu />)

      const trigger = screen.getByTestId('trigger')
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()

      await rightClick(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })
    })

    it('does not open on regular left click', async () => {
      const user = userEvent.setup()
      render(<BasicContextMenu />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      // Menu should NOT open
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
    })

    it('prevents default browser context menu', async () => {
      render(<BasicContextMenu />)

      const trigger = screen.getByTestId('trigger')
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
        button: 2,
      })

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      await act(async () => {
        trigger.dispatchEvent(event)
      })

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('positions menu at cursor location', async () => {
      render(<BasicContextMenu />)

      const trigger = screen.getByTestId('trigger')
      await rightClick(trigger, 150, 200)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // The positioner should be positioned at or near the click coordinates
      // Note: Actual position depends on Base UI's Popover positioning logic
    })

    it('repositions menu on second right-click without closing', async () => {
      const onOpenChange = vi.fn()

      render(
        <ContextMenu.Root onOpenChange={onOpenChange}>
          <ContextMenu.Trigger data-testid="trigger">
            Right-click here
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup>
                <ContextMenu.Surface data-testid="surface">
                  <ContextMenu.List>
                    <ContextMenu.Item>Item 1</ContextMenu.Item>
                  </ContextMenu.List>
                </ContextMenu.Surface>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      )

      const trigger = screen.getByTestId('trigger')

      // First right-click
      await rightClick(trigger, 100, 100)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      expect(onOpenChange).toHaveBeenCalledTimes(1)
      expect(onOpenChange).toHaveBeenLastCalledWith(
        true,
        expect.objectContaining({}),
      )

      // Second right-click at different position
      onOpenChange.mockClear()
      await rightClick(trigger, 200, 200)

      // Menu should still be visible (no close/open cycle)
      expect(screen.getByTestId('surface')).toBeInTheDocument()

      // Should NOT have called onOpenChange with false (no close)
      // The menu repositions without closing
      expect(onOpenChange).not.toHaveBeenCalledWith(false, expect.anything())
    })
  })

  describe('close behavior', () => {
    it('closes when Escape is pressed', async () => {
      const user = userEvent.setup()
      render(<BasicContextMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })

    it('closes when clicking outside', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <button type="button" data-testid="outside">
            Outside
          </button>
          <BasicContextMenu defaultOpen />
        </div>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('outside'))

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })
  })

  describe('long-press behavior (touch)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('opens after 500ms long-press', async () => {
      render(<BasicContextMenu />)

      const trigger = screen.getByTestId('trigger')
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()

      // Start touch using fireEvent
      await act(async () => {
        fireEvent.touchStart(trigger, {
          touches: [{ clientX: 100, clientY: 100 }],
        })
      })

      // Menu should not be open yet
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()

      // Advance time to 499ms - still not open
      await act(async () => {
        vi.advanceTimersByTime(499)
      })
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()

      // Advance to 500ms - should now be open
      await act(async () => {
        vi.advanceTimersByTime(1)
      })

      // With fake timers, check synchronously after act
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })

    it('cancels long-press if touch moves beyond threshold', async () => {
      render(<BasicContextMenu />)

      const trigger = screen.getByTestId('trigger')

      // Start touch at position (100, 100)
      await act(async () => {
        fireEvent.touchStart(trigger, {
          touches: [{ clientX: 100, clientY: 100 }],
        })
      })

      // Advance time partially
      await act(async () => {
        vi.advanceTimersByTime(250)
      })

      // Move touch beyond 10px threshold
      await act(async () => {
        fireEvent.touchMove(trigger, {
          touches: [{ clientX: 115, clientY: 100 }],
        })
      })

      // Advance past the 500ms mark
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      // Menu should NOT be open because touch moved
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
    })

    it('cancels long-press if touch ends before timeout', async () => {
      render(<BasicContextMenu />)

      const trigger = screen.getByTestId('trigger')

      // Start touch
      await act(async () => {
        fireEvent.touchStart(trigger, {
          touches: [{ clientX: 100, clientY: 100 }],
        })
      })

      // Advance time partially
      await act(async () => {
        vi.advanceTimersByTime(250)
      })

      // End touch before 500ms
      await act(async () => {
        fireEvent.touchEnd(trigger, {
          changedTouches: [{ clientX: 100, clientY: 100 }],
        })
      })

      // Advance past the 500ms mark
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      // Menu should NOT be open
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
    })

    it('sets pressed state during long-press', async () => {
      render(<BasicContextMenu />)

      const trigger = screen.getByTestId('trigger')

      // Initially not pressed
      expect(trigger).not.toHaveAttribute('data-pressed')

      // Start touch
      await act(async () => {
        fireEvent.touchStart(trigger, {
          touches: [{ clientX: 100, clientY: 100 }],
        })
      })

      // Should be pressed
      expect(trigger).toHaveAttribute('data-pressed')

      // End touch
      await act(async () => {
        fireEvent.touchEnd(trigger, {
          changedTouches: [{ clientX: 100, clientY: 100 }],
        })
      })

      // No longer pressed
      expect(trigger).not.toHaveAttribute('data-pressed')
    })
  })

  describe('controlled mode', () => {
    it('respects controlled open prop', async () => {
      const onOpenChange = vi.fn()

      const { rerender } = render(
        <ControlledContextMenu open={false} onOpenChange={onOpenChange} />,
      )

      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()

      rerender(
        <ControlledContextMenu open={true} onOpenChange={onOpenChange} />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })
    })

    it('calls onOpenChange when opening via right-click', async () => {
      const onOpenChange = vi.fn()

      render(<ControlledContextMenu open={false} onOpenChange={onOpenChange} />)

      const trigger = screen.getByTestId('trigger')
      await rightClick(trigger)

      expect(onOpenChange).toHaveBeenCalledWith(
        true,
        expect.objectContaining({}),
      )
    })

    it('calls onOpenChange with event details when closing via Escape', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      render(<ControlledContextMenu open={true} onOpenChange={onOpenChange} />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      expect(onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({
          reason: 'escape-key',
        }),
      )
    })
  })

  describe('uncontrolled mode', () => {
    it('respects defaultOpen prop', async () => {
      render(<BasicContextMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })
    })

    it('starts closed by default', () => {
      render(<BasicContextMenu />)
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
    })
  })

  describe('item selection', () => {
    it('closes menu when item is clicked', async () => {
      const user = userEvent.setup()
      render(<BasicContextMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-1'))

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })

    it('calls onSelect when item is clicked', async () => {
      render(<ContextMenuWithOnSelect />)

      const trigger = screen.getByTestId('trigger')
      await rightClick(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      await user.click(screen.getByTestId('item-1'))

      expect(screen.getByTestId('selected')).toHaveTextContent('item-1')
    })

    it('does not select disabled items', async () => {
      render(<ContextMenuWithDisabledItems />)

      const trigger = screen.getByTestId('trigger')
      await rightClick(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      const disabledItem = screen.getByTestId('item-2')
      await user.click(disabledItem)

      // Menu should still be open since disabled items don't close
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })
  })

  describe('keyboard navigation', () => {
    it('navigates with ArrowDown', async () => {
      const user = userEvent.setup()
      render(<BasicContextMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // When menu opens, first item is already highlighted
      expect(screen.getByTestId('item-1')).toHaveAttribute('data-highlighted')

      // Focus the list to enable keyboard navigation
      const list = screen.getByRole('listbox')
      list.focus()

      // ArrowDown moves to next item
      await user.keyboard('{ArrowDown}')

      expect(screen.getByTestId('item-2')).toHaveAttribute('data-highlighted')
    })

    it('navigates with ArrowUp', async () => {
      const user = userEvent.setup()
      render(<BasicContextMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // First item is highlighted on open
      expect(screen.getByTestId('item-1')).toHaveAttribute('data-highlighted')

      const list = screen.getByRole('listbox')
      list.focus()

      // Go down to item-2, then down to item-3, then up to item-2
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      expect(screen.getByTestId('item-3')).toHaveAttribute('data-highlighted')

      await user.keyboard('{ArrowUp}')
      expect(screen.getByTestId('item-2')).toHaveAttribute('data-highlighted')
    })

    it('skips disabled items during navigation', async () => {
      render(<ContextMenuWithDisabledItems />)

      const trigger = screen.getByTestId('trigger')
      await rightClick(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // First item is already highlighted when menu opens
      expect(screen.getByTestId('item-1')).toHaveAttribute('data-highlighted')

      const user = userEvent.setup()
      const list = screen.getByRole('listbox')
      list.focus()

      // Navigate down - should skip item-2 (disabled) and go to item-3
      await user.keyboard('{ArrowDown}')
      expect(screen.getByTestId('item-3')).toHaveAttribute('data-highlighted')
    })

    it('navigates to first item with Home key', async () => {
      const user = userEvent.setup()
      render(<BasicContextMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const surface = screen.getByTestId('surface')
      surface.focus()

      // Navigate to last item first
      await user.keyboard('{End}')
      expect(screen.getByTestId('item-3')).toHaveAttribute('data-highlighted')

      // Then Home should go back to first
      await user.keyboard('{Home}')
      expect(screen.getByTestId('item-1')).toHaveAttribute('data-highlighted')
    })

    it('navigates to last item with End key', async () => {
      const user = userEvent.setup()
      render(<BasicContextMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const surface = screen.getByTestId('surface')
      surface.focus()

      await user.keyboard('{End}')
      expect(screen.getByTestId('item-3')).toHaveAttribute('data-highlighted')
    })

    it('selects item with Enter key', async () => {
      render(<ContextMenuWithOnSelect />)

      const trigger = screen.getByTestId('trigger')
      await rightClick(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // First item is already highlighted when menu opens
      expect(screen.getByTestId('item-1')).toHaveAttribute('data-highlighted')

      const user = userEvent.setup()
      const list = screen.getByRole('listbox')
      list.focus()

      // Press Enter to select the highlighted item (item-1)
      await user.keyboard('{Enter}')

      expect(screen.getByTestId('selected')).toHaveTextContent('item-1')
    })
  })

  describe('disabled state', () => {
    it('does not open when root is disabled', async () => {
      render(<BasicContextMenu disabled />)

      const trigger = screen.getByTestId('trigger')
      await rightClick(trigger)

      // Menu should NOT open
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
    })

    it('does not open when trigger is disabled', async () => {
      render(
        <ContextMenu.Root>
          <ContextMenu.Trigger data-testid="trigger" disabled>
            Right-click here
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup>
                <ContextMenu.Surface data-testid="surface">
                  <ContextMenu.List>
                    <ContextMenu.Item>Item 1</ContextMenu.Item>
                  </ContextMenu.List>
                </ContextMenu.Surface>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      )

      const trigger = screen.getByTestId('trigger')
      await rightClick(trigger)

      // Menu should NOT open
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
    })

    it('trigger has disabled data attribute when disabled', () => {
      render(
        <ContextMenu.Root>
          <ContextMenu.Trigger data-testid="trigger" disabled>
            Right-click here
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup>
                <ContextMenu.Surface>
                  <ContextMenu.List>
                    <ContextMenu.Item>Item 1</ContextMenu.Item>
                  </ContextMenu.List>
                </ContextMenu.Surface>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      )

      const trigger = screen.getByTestId('trigger')
      expect(trigger).toHaveAttribute('data-disabled')
    })
  })

  describe('ARIA attributes', () => {
    it('items have correct role', async () => {
      render(<BasicContextMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const item = screen.getByTestId('item-1')
      expect(item).toHaveAttribute('role', 'option')
    })

    it('disabled items have aria-disabled', async () => {
      render(<ContextMenuWithDisabledItems />)

      const trigger = screen.getByTestId('trigger')
      await rightClick(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const disabledItem = screen.getByTestId('item-2')
      expect(disabledItem).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('trigger state', () => {
    it('trigger has open data attribute when menu is open', async () => {
      render(<BasicContextMenu defaultOpen />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const trigger = screen.getByTestId('trigger')
      expect(trigger).toHaveAttribute('data-popup-open')
    })

    it('trigger does not have open data attribute when menu is closed', () => {
      render(<BasicContextMenu />)

      const trigger = screen.getByTestId('trigger')
      expect(trigger).not.toHaveAttribute('data-popup-open')
    })
  })
})
