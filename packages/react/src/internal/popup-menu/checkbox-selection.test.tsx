import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'

function Menu({
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Root>) {
  return (
    <DropdownMenu.Root {...props}>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List data-testid="list">
                {children}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('trigger'))
  screen.getByTestId('list').focus()
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('PopupMenu checkbox selection foundation', () => {
  it('accepts root selection settings', async () => {
    const user = userEvent.setup()
    render(
      <Menu rangeSelection={false} dragSelection="keep">
        <DropdownMenu.CheckboxItem data-testid="item">
          Item
        </DropdownMenu.CheckboxItem>
      </Menu>,
    )
    await openMenu(user)
    expect(screen.getByTestId('item')).toBeInTheDocument()
  })

  it('does not mark a checkbox item pending by default', async () => {
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.CheckboxItem data-testid="item">
          Item
        </DropdownMenu.CheckboxItem>
      </Menu>,
    )
    await openMenu(user)
    expect(screen.getByTestId('item')).not.toHaveAttribute('data-pending')
  })

  it('toggles standalone checked state and reports item-press', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(
      <Menu>
        <DropdownMenu.CheckboxItem
          data-testid="item"
          onCheckedChange={onCheckedChange}
        >
          Item
        </DropdownMenu.CheckboxItem>
      </Menu>,
    )
    await openMenu(user)
    await user.click(screen.getByTestId('item'))
    expect(screen.getByTestId('item')).toHaveAttribute('aria-checked', 'true')
    expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(
      true,
      expect.objectContaining({ reason: 'item-press' }),
    )
  })

  it('keeps checkbox group clicks to one value change', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Menu>
        <DropdownMenu.CheckboxGroup onValueChange={onValueChange}>
          <DropdownMenu.CheckboxItem value="one" data-testid="item">
            Item
          </DropdownMenu.CheckboxItem>
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await openMenu(user)
    await user.click(screen.getByTestId('item'))
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(
      ['one'],
      expect.objectContaining({ reason: 'item-press' }),
    )
  })
})

describe('range selection', () => {
  const makeRows = (
    spies: ReturnType<typeof vi.fn>[],
    plainSelect: ReturnType<typeof vi.fn> = vi.fn(),
    closeOnClickName?: string,
  ) => (
    <>
      {(['a', 'b', 'c'] as const).map((name) => (
        <DropdownMenu.CheckboxItem
          key={name}
          data-testid={`cb-${name}`}
          onCheckedChange={spies[name.charCodeAt(0) - 97]}
          {...(name === closeOnClickName ? { closeOnClick: true } : {})}
          {...(name === 'a' ? { value: 'a' } : {})}
        >
          {name}
        </DropdownMenu.CheckboxItem>
      ))}
      <DropdownMenu.Item value="plain" onSelect={plainSelect}>
        Plain
      </DropdownMenu.Item>
      {(['d', 'e'] as const).map((name) => (
        <DropdownMenu.CheckboxItem
          key={name}
          data-testid={`cb-${name}`}
          onCheckedChange={spies[name.charCodeAt(0) - 97]}
        >
          {name}
        </DropdownMenu.CheckboxItem>
      ))}
    </>
  )

  const clickWithShift = async (
    user: ReturnType<typeof userEvent.setup>,
    element: HTMLElement,
  ) => {
    await user.keyboard('{Shift>}')
    await user.click(element)
    await user.keyboard('{/Shift}')
  }

  it('commits an enabled checkbox span together and leaves the menu open', async () => {
    const user = userEvent.setup()
    const spies = Array.from({ length: 5 }, () => vi.fn())
    const plainSelect = vi.fn()
    render(<Menu>{makeRows(spies, plainSelect)}</Menu>)
    await openMenu(user)
    await user.click(screen.getByTestId('cb-a'))
    await clickWithShift(user, screen.getByTestId('cb-d'))
    for (const name of ['a', 'b', 'c', 'd']) {
      expect(screen.getByTestId(`cb-${name}`)).toHaveAttribute(
        'aria-checked',
        'true',
      )
    }
    expect(spies[0]).toHaveBeenCalledExactlyOnceWith(true, expect.anything())
    for (const spy of spies.slice(1, 4)) {
      expect(spy).toHaveBeenCalledExactlyOnceWith(
        true,
        expect.objectContaining({ reason: 'range-selection' }),
      )
    }
    expect(screen.getByText('Plain')).toBeInTheDocument()
    expect(plainSelect).not.toHaveBeenCalled()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('uses a plain click when shift-click has no anchor', async () => {
    const user = userEvent.setup()
    const spies = Array.from({ length: 5 }, () => vi.fn())
    render(<Menu>{makeRows(spies)}</Menu>)
    await openMenu(user)
    await clickWithShift(user, screen.getByTestId('cb-c'))
    expect(spies[2]).toHaveBeenCalledExactlyOnceWith(
      true,
      expect.objectContaining({ reason: 'item-press' }),
    )
    for (const [index, spy] of spies.entries()) {
      if (index !== 2) expect(spy).not.toHaveBeenCalled()
    }
  })

  it('ranges from the anchor to itself and does not close', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <Menu open onOpenChange={onOpenChange}>
        <DropdownMenu.CheckboxItem
          data-testid="cb-a"
          closeOnClick
          onCheckedChange={spy}
        >
          A
        </DropdownMenu.CheckboxItem>
      </Menu>,
    )
    await openMenu(user)
    // A plain click sets the anchor (the controlled `open` keeps the menu up
    // even though the row has `closeOnClick`).
    await user.click(screen.getByTestId('cb-a'))
    expect(spy).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'item-press' }),
    )
    onOpenChange.mockClear()
    await clickWithShift(user, screen.getByTestId('cb-a'))
    expect(spy).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'range-selection' }),
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false, expect.anything())
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('chains the anchor to each range target', async () => {
    const user = userEvent.setup()
    const spies = Array.from({ length: 5 }, () => vi.fn())
    render(<Menu>{makeRows(spies)}</Menu>)
    await openMenu(user)
    await user.click(screen.getByTestId('cb-a'))
    await clickWithShift(user, screen.getByTestId('cb-c'))
    await clickWithShift(user, screen.getByTestId('cb-e'))
    await clickWithShift(user, screen.getByTestId('cb-b'))
    expect(spies[1]).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'range-selection' }),
    )
    expect(spies[2]).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'range-selection' }),
    )
    expect(spies[0]).toHaveBeenCalledTimes(1)
    expect(spies[3]).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'range-selection' }),
    )
    expect(spies[4]).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'range-selection' }),
    )
    expect(spies[0]).toHaveBeenCalledTimes(1)
  })

  it('sets the span unchecked when the anchor is unchecked', async () => {
    const user = userEvent.setup()
    const spies = Array.from({ length: 3 }, () => vi.fn())
    render(
      <Menu>
        {(['a', 'b', 'c'] as const).map((name, index) => (
          <DropdownMenu.CheckboxItem
            key={name}
            data-testid={`cb-${name}`}
            defaultChecked
            onCheckedChange={spies[index]}
          >
            {name}
          </DropdownMenu.CheckboxItem>
        ))}
      </Menu>,
    )
    await openMenu(user)
    await user.click(screen.getByTestId('cb-a'))
    await clickWithShift(user, screen.getByTestId('cb-c'))
    for (const spy of spies.slice(1))
      expect(spy).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'range-selection' }),
      )
  })

  it('commits a checkbox group range once', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Menu>
        <DropdownMenu.CheckboxGroup value={['b']} onValueChange={onValueChange}>
          {(['a', 'b', 'c', 'd'] as const).map((name) => (
            <DropdownMenu.CheckboxItem
              key={name}
              value={name}
              data-testid={`cb-${name}`}
            >
              {name}
            </DropdownMenu.CheckboxItem>
          ))}
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await openMenu(user)
    await user.click(screen.getByTestId('cb-a'))
    await clickWithShift(user, screen.getByTestId('cb-d'))
    expect(onValueChange).toHaveBeenNthCalledWith(
      1,
      ['b', 'a'],
      expect.objectContaining({ reason: 'item-press' }),
    )
    expect(onValueChange).toHaveBeenNthCalledWith(
      2,
      ['b', 'a', 'c', 'd'],
      expect.objectContaining({ reason: 'range-selection' }),
    )
    expect(onValueChange).toHaveBeenCalledTimes(2)
  })

  it('can disable range selection at the root', async () => {
    const user = userEvent.setup()
    const spies = Array.from({ length: 5 }, () => vi.fn())
    render(<Menu rangeSelection={false}>{makeRows(spies)}</Menu>)
    await openMenu(user)
    await user.click(screen.getByTestId('cb-a'))
    await clickWithShift(user, screen.getByTestId('cb-d'))
    expect(spies[0]).toHaveBeenCalledExactlyOnceWith(
      true,
      expect.objectContaining({ reason: 'item-press' }),
    )
    expect(spies[3]).toHaveBeenCalledExactlyOnceWith(
      true,
      expect.objectContaining({ reason: 'item-press' }),
    )
    expect(spies[1]).not.toHaveBeenCalled()
    expect(spies[2]).not.toHaveBeenCalled()
    expect(spies[4]).not.toHaveBeenCalled()
  })

  it('supports Shift+Enter on the highlighted checkbox', async () => {
    const user = userEvent.setup()
    const spies = Array.from({ length: 5 }, () => vi.fn())
    render(<Menu>{makeRows(spies)}</Menu>)
    await openMenu(user)
    screen.getByTestId('list').focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{ArrowDown}{ArrowDown}{Shift>}{Enter}{/Shift}')
    expect(spies[1]).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'range-selection' }),
    )
    expect(spies[2]).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'range-selection' }),
    )
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('lets the consumer prevent Shift+Enter range selection', async () => {
    const user = userEvent.setup()
    const spies = Array.from({ length: 5 }, () => vi.fn())
    render(
      <DropdownMenu.Root>
        <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List
                  data-testid="list"
                  onKeyDown={(event) => {
                    if (event.shiftKey && event.key === 'Enter')
                      event.preventDefault()
                  }}
                >
                  {makeRows(spies)}
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    await openMenu(user)
    const list = screen.getByTestId('list')
    list.focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{ArrowDown}{ArrowDown}{Shift>}{Enter}{/Shift}')
    expect(spies[0]).toHaveBeenCalledTimes(1)
    expect(spies.slice(1).every((spy) => spy.mock.calls.length === 0)).toBe(
      true,
    )
  })

  it('keeps the menu open for a Shift+Enter range targeting a closeOnClick row', async () => {
    const user = userEvent.setup()
    const spies = Array.from({ length: 5 }, () => vi.fn())
    const onOpenChange = vi.fn()
    render(
      <Menu onOpenChange={onOpenChange}>{makeRows(spies, vi.fn(), 'c')}</Menu>,
    )
    await openMenu(user)
    await user.click(screen.getByTestId('cb-a'))
    screen.getByTestId('list').focus()
    await user.keyboard('{ArrowDown}{ArrowDown}{Shift>}{Enter}{/Shift}')
    expect(spies[1]).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'range-selection' }),
    )
    expect(spies[2]).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'range-selection' }),
    )
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false, expect.anything())
  })

  it('keeps the menu open for a range targeting closeOnClick, but closes on plain click', async () => {
    const user = userEvent.setup()
    const aSpy = vi.fn()
    const dSpy = vi.fn()
    render(
      <Menu>
        <DropdownMenu.CheckboxItem data-testid="cb-a" onCheckedChange={aSpy}>
          A
        </DropdownMenu.CheckboxItem>
        <DropdownMenu.CheckboxItem
          data-testid="cb-d"
          closeOnClick
          onCheckedChange={dSpy}
        >
          D
        </DropdownMenu.CheckboxItem>
      </Menu>,
    )
    await openMenu(user)
    await user.click(screen.getByTestId('cb-a'))
    await clickWithShift(user, screen.getByTestId('cb-d'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.click(screen.getByTestId('cb-d'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
