import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../../../../dropdown-menu/index.js'

// ============================================================================
// Test Fixtures
// ============================================================================

function FocusZoneMenu({
  header,
  footer,
  includeInput = true,
}: {
  header?: React.ReactNode
  footer?: React.ReactNode
  includeInput?: boolean
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              {header}
              {includeInput ? <DropdownMenu.Input data-testid="input" /> : null}
              <DropdownMenu.List data-testid="list">
                <DropdownMenu.Item
                  id="zone-item-one"
                  data-testid="item-one"
                  value="One"
                >
                  One
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  id="zone-item-two"
                  data-testid="item-two"
                  value="Two"
                >
                  Two
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  id="zone-item-three"
                  data-testid="item-three"
                  value="Three"
                >
                  Three
                </DropdownMenu.Item>
              </DropdownMenu.List>
              {footer}
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

async function openMenu() {
  const user = userEvent.setup()
  await user.click(screen.getByTestId('trigger'))

  await waitFor(() => {
    expect(screen.getByTestId('surface')).toBeInTheDocument()
  })

  return user
}

async function waitForInputFocus() {
  const input = screen.getByTestId('input')

  await waitFor(() => {
    expect(input).toHaveFocus()
  })

  return input
}

// ============================================================================
// Tests
// ============================================================================

describe('PopupMenu focus zones', () => {
  it('moves Tab from input to footer while preserving highlight state', async () => {
    render(
      <FocusZoneMenu
        footer={
          <DropdownMenu.Footer data-testid="footer">
            <button type="button" data-testid="footer-button">
              Footer action
            </button>
          </DropdownMenu.Footer>
        }
      />,
    )

    const user = await openMenu()
    const input = await waitForInputFocus()

    await waitFor(() => {
      expect(input).toHaveAttribute('aria-activedescendant', 'zone-item-one')
    })
    const activeDescendant = input.getAttribute('aria-activedescendant')

    await user.tab()

    expect(screen.getByTestId('footer-button')).toHaveFocus()
    await waitFor(() => {
      expect(screen.getByTestId('list')).toHaveAttribute('data-zone-focused')
    })
    expect(input.getAttribute('aria-activedescendant')).toBe(activeDescendant)
  })

  it('moves Shift+Tab from input to a header control', async () => {
    render(
      <FocusZoneMenu
        header={
          <DropdownMenu.Header data-testid="header">
            <button type="button" data-testid="header-button">
              Header action
            </button>
          </DropdownMenu.Header>
        }
      />,
    )

    const user = await openMenu()
    await waitForInputFocus()

    await user.tab({ shift: true })

    expect(screen.getByTestId('header-button')).toHaveFocus()
  })

  it('wraps Tab from footer to header', async () => {
    render(
      <FocusZoneMenu
        header={
          <DropdownMenu.Header data-testid="header">
            <button type="button" data-testid="header-button">
              Header action
            </button>
          </DropdownMenu.Header>
        }
        footer={
          <DropdownMenu.Footer data-testid="footer">
            <button type="button" data-testid="footer-button">
              Footer action
            </button>
          </DropdownMenu.Footer>
        }
      />,
    )

    const user = await openMenu()
    await waitForInputFocus()

    await user.tab()
    expect(screen.getByTestId('footer-button')).toHaveFocus()

    await user.tab()

    expect(screen.getByTestId('header-button')).toHaveFocus()
  })

  it('moves ArrowUp from footer to the primary target and highlights the last item', async () => {
    render(
      <FocusZoneMenu
        footer={
          <DropdownMenu.Footer data-testid="footer">
            <button type="button" data-testid="footer-button">
              Footer action
            </button>
          </DropdownMenu.Footer>
        }
      />,
    )

    const user = await openMenu()
    const input = await waitForInputFocus()

    await user.tab()
    expect(screen.getByTestId('footer-button')).toHaveFocus()

    await user.keyboard('{ArrowUp}')

    expect(input).toHaveFocus()
    expect(screen.getByTestId('item-three')).toHaveAttribute('data-highlighted')
    expect(input).toHaveAttribute('aria-activedescendant', 'zone-item-three')
  })

  it('moves ArrowDown from header to the primary target and highlights the first item', async () => {
    render(
      <FocusZoneMenu
        header={
          <DropdownMenu.Header data-testid="header">
            <button type="button" data-testid="header-button">
              Header action
            </button>
          </DropdownMenu.Header>
        }
      />,
    )

    const user = await openMenu()
    const input = await waitForInputFocus()

    await user.keyboard('{ArrowUp}')
    expect(screen.getByTestId('item-three')).toHaveAttribute('data-highlighted')

    await user.tab({ shift: true })
    expect(screen.getByTestId('header-button')).toHaveFocus()

    await user.keyboard('{ArrowDown}')

    expect(input).toHaveFocus()
    expect(screen.getByTestId('item-one')).toHaveAttribute('data-highlighted')
    expect(input).toHaveAttribute('aria-activedescendant', 'zone-item-one')
  })

  it('closes the menu on Escape while footer is focused', async () => {
    render(
      <FocusZoneMenu
        footer={
          <DropdownMenu.Footer data-testid="footer">
            <button type="button" data-testid="footer-button">
              Footer action
            </button>
          </DropdownMenu.Footer>
        }
      />,
    )

    const user = await openMenu()
    await waitForInputFocus()

    await user.tab()
    expect(screen.getByTestId('footer-button')).toHaveFocus()

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
    })
  })

  it('roves focus within a header and lets Tab leave the zone', async () => {
    render(
      <FocusZoneMenu
        header={
          <DropdownMenu.Header data-testid="header">
            <button type="button" data-testid="header-button-one">
              First
            </button>
            <button type="button" data-testid="header-button-two">
              Second
            </button>
          </DropdownMenu.Header>
        }
      />,
    )

    const user = await openMenu()
    const input = await waitForInputFocus()

    await user.tab({ shift: true })
    expect(screen.getByTestId('header-button-one')).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByTestId('header-button-two')).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByTestId('header-button-one')).toHaveFocus()

    await user.tab()
    expect(input).toHaveFocus()
  })

  it('leaves Tab behavior loose when no zones are registered', async () => {
    render(<FocusZoneMenu />)

    await openMenu()
    await waitForInputFocus()

    // Dispatch only the keydown here: full Tab simulation is owned by the
    // focus trap when no zones exist, and differs across test runners.
    expect(fireEvent.keyDown(screen.getByTestId('input'), { key: 'Tab' })).toBe(
      true,
    )

    expect(screen.getByTestId('surface')).toBeInTheDocument()
  })
})
