import { Popover } from '@base-ui/react/popover'
import { Tooltip } from '@base-ui/react/tooltip'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import { Select } from '../../select/index.js'

// Whether a node is part of a menu tree is read from the elements the tree's
// parts registered, never from attributes another popup on the page carries.

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function openChangeCalls(spy: ReturnType<typeof vi.fn>) {
  return spy.mock.calls.map(([open, details]) => [
    open,
    details.reason,
    details.event.type,
  ])
}

function SubmenuMenu({
  onOpenChange,
  modal,
  submenuHeader,
  besideTrigger,
  firstItem = 'First',
}: {
  onOpenChange?: DropdownMenu.Root.Props['onOpenChange']
  modal?: boolean
  submenuHeader?: React.ReactNode
  besideTrigger?: React.ReactNode
  firstItem?: React.ReactNode
}) {
  return (
    <DropdownMenu.Root onOpenChange={onOpenChange} modal={modal}>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      {besideTrigger}
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="root-popup">
            <DropdownMenu.Surface data-testid="root-surface">
              <DropdownMenu.List data-testid="root-list">
                <DropdownMenu.Item value="first">{firstItem}</DropdownMenu.Item>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger">
                    More
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup data-testid="submenu-popup">
                        {submenuHeader}
                        <DropdownMenu.Surface>
                          <DropdownMenu.List data-testid="submenu-list">
                            <DropdownMenu.Item
                              data-testid="nested-item"
                              value="nested"
                            >
                              Nested
                            </DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

async function openSubmenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('trigger'))
  await waitFor(() => expect(screen.getByTestId('root-list')).toHaveFocus())
  await user.keyboard('{ArrowDown}')
  await user.keyboard('{ArrowRight}')
  await waitFor(() => expect(screen.getByTestId('submenu-list')).toHaveFocus())
}

describe('outside press', () => {
  function UnrelatedPopups() {
    return (
      <>
        <Popover.Root open>
          <Popover.Trigger data-testid="other-trigger">Other</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup data-testid="other-popup">
                <button type="button" data-testid="other-popup-button">
                  Inside another popover
                </button>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
        <div data-open="" data-testid="data-open">
          <span data-testid="data-open-child">x</span>
        </div>
        <div data-popup-open="" data-testid="data-popup-open">
          <span data-testid="data-popup-open-child">x</span>
        </div>
      </>
    )
  }

  it.each([
    'other-popup-button',
    'other-trigger',
    'data-open-child',
    'data-popup-open-child',
  ])('a press in an unrelated open popup or attribute-carrying element (%s) closes the menu', async (testId) => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <>
        <UnrelatedPopups />
        <SubmenuMenu onOpenChange={onOpenChange} modal={false} />
      </>,
    )
    await user.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(screen.getByTestId('root-list')).toHaveFocus())
    expect(screen.getByTestId('other-popup')).toHaveAttribute('data-open')
    onOpenChange.mockClear()

    fireEvent.pointerDown(screen.getByTestId(testId))

    await waitFor(() =>
      expect(screen.queryByTestId('root-popup')).not.toBeInTheDocument(),
    )
    expect(openChangeCalls(onOpenChange)[0]).toEqual([
      false,
      'outside-press',
      'pointerdown',
    ])
  })

  it('an outside press whose propagation an ancestor stops in the capture phase still closes the menu', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <>
        <div data-testid="blocker">
          <button type="button" data-testid="blocked-outside">
            Outside
          </button>
        </div>
        <SubmenuMenu onOpenChange={onOpenChange} modal={false} />
      </>,
    )
    const blocker = screen.getByTestId('blocker')
    blocker.addEventListener(
      'pointerdown',
      (event) => event.stopPropagation(),
      {
        capture: true,
      },
    )
    await user.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(screen.getByTestId('root-list')).toHaveFocus())
    onOpenChange.mockClear()

    const reachedTarget = vi.fn()
    const button = screen.getByTestId('blocked-outside')
    button.addEventListener('pointerdown', reachedTarget, { capture: true })
    fireEvent.pointerDown(button)

    await waitFor(() =>
      expect(screen.queryByTestId('root-popup')).not.toBeInTheDocument(),
    )
    // The event never reached its target.
    expect(reachedTarget).not.toHaveBeenCalled()
    expect(openChangeCalls(onOpenChange)).toEqual([
      [false, 'outside-press', 'pointerdown'],
    ])
  })

  it('a press inside a portaled submenu keeps the whole tree open', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<SubmenuMenu onOpenChange={onOpenChange} />)
    await openSubmenu(user)
    onOpenChange.mockClear()

    // The submenu is portaled: it isn't inside the root popup's DOM.
    expect(
      screen
        .getByTestId('root-popup')
        .contains(screen.getByTestId('nested-item')),
    ).toBe(false)

    fireEvent.pointerDown(screen.getByTestId('nested-item'))
    await sleep(30)

    expect(screen.getByTestId('root-popup')).toBeInTheDocument()
    expect(screen.getByTestId('submenu-popup')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('a press on the trigger is no outside press: the trigger closes the menu', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<SubmenuMenu onOpenChange={onOpenChange} />)
    await user.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(screen.getByTestId('root-list')).toHaveFocus())
    onOpenChange.mockClear()

    await user.click(screen.getByTestId('trigger'))

    await waitFor(() =>
      expect(screen.queryByTestId('root-popup')).not.toBeInTheDocument(),
    )
    expect(openChangeCalls(onOpenChange)).toEqual([
      [false, 'trigger-press', 'pointerdown'],
    ])
  })
})

function NestedSelect({
  open,
  item = 'Apple',
}: {
  open?: boolean
  item?: React.ReactNode
}) {
  return (
    <Select.Root defaultOpen open={open}>
      <Select.Trigger data-testid="select-trigger">
        <Select.Value placeholder="Pick" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup data-testid="select-popup">
            <Select.Surface>
              <Select.List>
                <Select.Item data-testid="select-item" value="apple">
                  {item}
                </Select.Item>
              </Select.List>
            </Select.Surface>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

describe('content opened from inside the menu', () => {
  async function expectPressKeepsMenuOpen(
    menuProps: React.ComponentProps<typeof SubmenuMenu>,
    pressTestId: string,
  ) {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<SubmenuMenu onOpenChange={onOpenChange} {...menuProps} />)
    await user.click(screen.getByTestId('trigger'))
    const pressed = await screen.findByTestId(pressTestId)
    onOpenChange.mockClear()

    // Portaled: outside every element the menu registered.
    expect(screen.getByTestId('root-popup').contains(pressed)).toBe(false)
    expect(screen.getByTestId('trigger').contains(pressed)).toBe(false)

    fireEvent.pointerDown(pressed)
    await sleep(30)

    expect(screen.getByTestId('root-popup')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalled()
  }

  it('a press in a select opened from the menu popup keeps the menu open', async () => {
    await expectPressKeepsMenuOpen(
      { firstItem: <NestedSelect /> },
      'select-item',
    )
    expect(screen.getByTestId('select-popup')).toBeInTheDocument()
  })

  it('a press in an open select rendered beside the trigger keeps the menu open', async () => {
    // Outside the menu popup's subtree too: only the nested registry links it.
    await expectPressKeepsMenuOpen(
      { besideTrigger: <NestedSelect open /> },
      'select-item',
    )
  })

  it("a press in a consumer's popover opened from an item of a select beside the trigger keeps the menu open", async () => {
    // The select's popup claims the press, and the select's tree is nested
    // in the menu's.
    await expectPressKeepsMenuOpen(
      {
        besideTrigger: (
          <NestedSelect
            open
            item={
              <Popover.Root open>
                <Popover.Trigger>Details</Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup>
                      <button type="button" data-testid="select-item-popover">
                        In the item's popover
                      </button>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
            }
          />
        ),
      },
      'select-item-popover',
    )
  })

  it('a press on a closed select beside the trigger is an outside press', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <SubmenuMenu
        onOpenChange={onOpenChange}
        modal={false}
        besideTrigger={<NestedSelect open={false} />}
      />,
    )
    await user.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(screen.getByTestId('root-list')).toHaveFocus())
    onOpenChange.mockClear()

    fireEvent.pointerDown(screen.getByTestId('select-trigger'))

    await waitFor(() =>
      expect(screen.queryByTestId('root-popup')).not.toBeInTheDocument(),
    )
    expect(openChangeCalls(onOpenChange)[0]).toEqual([
      false,
      'outside-press',
      'pointerdown',
    ])
  })

  it("a press in a consumer's popover opened from a menu item keeps the menu open", async () => {
    await expectPressKeepsMenuOpen(
      {
        firstItem: (
          <Popover.Root open>
            <Popover.Trigger>Details</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>
                  <button type="button" data-testid="item-popover-button">
                    In the item's popover
                  </button>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        ),
      },
      'item-popover-button',
    )
  })

  it("a press in a consumer's tooltip opened from a menu item keeps the menu open", async () => {
    await expectPressKeepsMenuOpen(
      {
        firstItem: (
          <Tooltip.Root open>
            <Tooltip.Trigger render={<span />}>Hint</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="item-tooltip">Tip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        ),
      },
      'item-tooltip',
    )
  })
})

describe('pointer ownership', () => {
  it('a submenu popup claims ownership for a pointer over its own content, whatever attributes that content carries', async () => {
    const user = userEvent.setup()
    render(
      <SubmenuMenu
        submenuHeader={
          <div data-base-ui-focusable="" data-testid="submenu-header">
            Header
          </div>
        }
      />,
    )
    await openSubmenu(user)
    const rootPopup = screen.getByTestId('root-popup')
    const submenuPopup = screen.getByTestId('submenu-popup')
    await waitFor(() => expect(submenuPopup).toHaveAttribute('data-focused'))

    // Past the debounce that ignores a pointer resting where a popup opens.
    await sleep(150)
    fireEvent.pointerMove(screen.getByTestId('root-surface'))
    await waitFor(() => expect(rootPopup).toHaveAttribute('data-focused'))
    expect(submenuPopup).not.toHaveAttribute('data-focused')
    // Let the root surface finish taking focus back.
    await waitFor(() => expect(screen.getByTestId('root-list')).toHaveFocus())
    await sleep(30)

    // The header sits in the submenu popup, outside its Surface, so only the
    // popup can claim ownership for it.
    fireEvent.pointerMove(screen.getByTestId('submenu-header'))

    await waitFor(() => expect(submenuPopup).toHaveAttribute('data-focused'))
    await sleep(30)
    expect(submenuPopup).toHaveAttribute('data-focused')
    expect(rootPopup).not.toHaveAttribute('data-focused')
  })
})
