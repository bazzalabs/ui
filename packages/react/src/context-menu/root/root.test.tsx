import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from 'vitest'
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
        <ContextMenu.Positioner data-testid="positioner">
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

function ContextMenuWithImperativeActions() {
  const actionsRef = React.useRef<ContextMenu.Root.Actions | null>(null)

  return (
    <div>
      <button
        type="button"
        data-testid="disable-menu"
        onClick={() => actionsRef.current?.setDisabled(true)}
      >
        Disable Menu
      </button>
      <button
        type="button"
        data-testid="enable-menu"
        onClick={() => actionsRef.current?.setDisabled(false)}
      >
        Enable Menu
      </button>
      <button
        type="button"
        data-testid="close-menu"
        onClick={() => actionsRef.current?.close()}
      >
        Close Menu
      </button>

      <ContextMenu.Root actionsRef={actionsRef}>
        <ContextMenu.Trigger data-testid="trigger">
          Right-click here
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup>
              <ContextMenu.Surface data-testid="surface">
                <ContextMenu.List>
                  <ContextMenu.Item data-testid="item-1">
                    Item 1
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

interface ContextMenuDisableHandle {
  setDisabled: (disabled: boolean) => void
}

const ContextMenuWithInputAndImperativeActions = React.forwardRef<
  ContextMenuDisableHandle,
  Record<string, never>
>(function ContextMenuWithInputAndImperativeActions(_props, forwardedRef) {
  const actionsRef = React.useRef<ContextMenu.Root.Actions | null>(null)

  React.useImperativeHandle(
    forwardedRef,
    () => ({
      setDisabled: (disabled) => actionsRef.current?.setDisabled(disabled),
    }),
    [],
  )

  return (
    <ContextMenu.Root actionsRef={actionsRef}>
      <ContextMenu.Trigger data-testid="trigger">
        Right-click here
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup>
            <ContextMenu.Surface data-testid="surface">
              <ContextMenu.Input data-testid="menu-input" />

              <ContextMenu.List>
                <ContextMenu.Item data-testid="item-1">Item 1</ContextMenu.Item>
              </ContextMenu.List>
            </ContextMenu.Surface>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * jsdom reports a 0×0 viewport, which makes the positioner clamp every menu
 * to the origin. Give it a size so the cursor position shows up.
 */
function withViewport() {
  const html = document.documentElement
  const width = vi.spyOn(html, 'clientWidth', 'get').mockReturnValue(1024)
  const height = vi.spyOn(html, 'clientHeight', 'get').mockReturnValue(768)
  onTestFinished(() => {
    width.mockRestore()
    height.mockRestore()
  })
}

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
      withViewport()
      render(<BasicContextMenu />)

      const trigger = screen.getByTestId('trigger')
      await rightClick(trigger, 150, 200)

      await waitFor(() => {
        expect(screen.getByTestId('positioner').style.transform).toBe(
          'translate(150px, 200px)',
        )
      })
    })

    it('repositions menu on second right-click without closing', async () => {
      withViewport()
      const onOpenChange = vi.fn()

      render(
        <ContextMenu.Root onOpenChange={onOpenChange}>
          <ContextMenu.Trigger data-testid="trigger">
            Right-click here
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner data-testid="positioner">
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
        expect.objectContaining({ reason: 'trigger-context-menu' }),
      )

      // Second right-click at different position
      onOpenChange.mockClear()
      await rightClick(trigger, 200, 200)

      // Menu should still be visible (no close/open cycle)
      expect(screen.getByTestId('surface')).toBeInTheDocument()

      // Should NOT have called onOpenChange with false (no close)
      // The menu repositions without closing
      expect(onOpenChange).not.toHaveBeenCalledWith(false, expect.anything())
      await waitFor(() => {
        expect(screen.getByTestId('positioner').style.transform).toBe(
          'translate(200px, 200px)',
        )
      })
    })
  })

  describe('close behavior', () => {
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
      const onOpenChange = vi.fn()
      render(<BasicContextMenu onOpenChange={onOpenChange} />)

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
      expect(onOpenChange).toHaveBeenCalledWith(
        true,
        expect.objectContaining({
          reason: 'trigger-context-menu',
          event: expect.objectContaining({ type: 'touchstart' }),
        }),
      )
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
        expect.objectContaining({
          reason: 'trigger-context-menu',
          event: expect.objectContaining({ type: 'contextmenu' }),
        }),
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

  describe('item selection', () => {
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
      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })
  })

  describe('keyboard navigation', () => {
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

  describe('imperative actions', () => {
    it('blocks opening when disabled imperatively and reopens when re-enabled', async () => {
      const user = userEvent.setup()
      render(<ContextMenuWithImperativeActions />)

      await user.click(screen.getByTestId('disable-menu'))
      await rightClick(screen.getByTestId('trigger'))

      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()

      await user.click(screen.getByTestId('enable-menu'))
      await rightClick(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })
    })

    it('can close imperatively even while disabled', async () => {
      const user = userEvent.setup()
      render(<ContextMenuWithImperativeActions />)

      await rightClick(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('disable-menu'))
      await user.click(screen.getByTestId('close-menu'))

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })
    })

    it('disables Input when setDisabled(true) is called', async () => {
      const actions = React.createRef<ContextMenuDisableHandle>()

      render(<ContextMenuWithInputAndImperativeActions ref={actions} />)

      await rightClick(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('menu-input')
      expect(input).not.toBeDisabled()

      act(() => {
        actions.current?.setDisabled(true)
      })

      expect(input).toBeDisabled()

      act(() => {
        actions.current?.setDisabled(false)
      })

      expect(input).not.toBeDisabled()
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
