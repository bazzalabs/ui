import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
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

describe('drag selection', () => {
  const makeRows = (
    spies: ReturnType<typeof vi.fn>[],
    checked: string[] = [],
    onClick: Record<string, ReturnType<typeof vi.fn>> = {},
  ) => (
    <>
      {(['a', 'b', 'c'] as const).map((name) => (
        <DropdownMenu.CheckboxItem
          key={name}
          data-testid={`cb-${name}`}
          defaultChecked={checked.includes(name)}
          onClick={onClick[name]}
          onCheckedChange={spies[name.charCodeAt(0) - 97]}
        >
          {name}
        </DropdownMenu.CheckboxItem>
      ))}
      <DropdownMenu.Item data-testid="item-x">Plain</DropdownMenu.Item>
      {(['d', 'e'] as const).map((name) => (
        <DropdownMenu.CheckboxItem
          key={name}
          data-testid={`cb-${name}`}
          defaultChecked={checked.includes(name)}
          onClick={onClick[name]}
          onCheckedChange={spies[name.charCodeAt(0) - 97]}
        >
          {name}
        </DropdownMenu.CheckboxItem>
      ))}
    </>
  )
  const layoutRows = () => {
    const rows = screen
      .getByTestId('list')
      .querySelectorAll<HTMLElement>(
        '[role="menuitemcheckbox"], [role="option"], [role="menuitem"]',
      )
    rows.forEach((el, index) => {
      const top = index * 32
      Object.defineProperty(el, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
          top,
          bottom: top + 32,
          left: 0,
          right: 100,
          width: 100,
          height: 32,
          x: 0,
          y: top,
          toJSON: () => ({}),
        }),
      })
    })
  }
  const down = (id: string, y: number, pointerType = 'mouse') =>
    fireEvent.pointerDown(screen.getByTestId(id), {
      pointerId: 1,
      pointerType,
      button: 0,
      clientY: y,
    })
  const move = (y: number) =>
    fireEvent.pointerMove(document, { pointerId: 1, clientY: y })
  const up = (y: number) =>
    fireEvent.pointerUp(document, { pointerId: 1, clientY: y })
  const prepare = async (
    spies: ReturnType<typeof vi.fn>[],
    mode: 'keep' | 'rubber-band' = 'keep',
    checked: string[] = [],
    onClick: Record<string, ReturnType<typeof vi.fn>> = {},
  ) => {
    const user = userEvent.setup()
    render(
      <Menu dragSelection={mode}>{makeRows(spies, checked, onClick)}</Menu>,
    )
    await openMenu(user)
    layoutRows()
  }

  it('uses a normal click when pressed and released on the same row', async () => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    await prepare(spies)
    down('cb-a', 16)
    up(16)
    fireEvent.click(screen.getByTestId('cb-a'))
    expect(spies[0]).toHaveBeenCalledExactlyOnceWith(
      true,
      expect.objectContaining({ reason: 'item-press' }),
    )
  })
  it('previews the span and follows the pointer highlight', async () => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    await prepare(spies)
    down('cb-a', 16)
    move(80)
    for (const id of ['cb-a', 'cb-b', 'cb-c']) {
      expect(screen.getByTestId(id)).toHaveAttribute('data-pending')
      expect(screen.getByTestId(id)).toHaveAttribute('aria-checked', 'true')
    }
    expect(spies.every((spy) => !spy.mock.calls.length)).toBe(true)
    expect(screen.getByTestId('cb-c')).toHaveAttribute('data-highlighted')
  })
  it('commits on release once, suppresses the following click, and stays open', async () => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    const onClick = vi.fn()
    await prepare(spies, 'keep', [], { a: onClick })
    down('cb-a', 16)
    move(80)
    up(80)
    for (const index of [0, 1, 2])
      expect(spies[index]).toHaveBeenCalledExactlyOnceWith(
        true,
        expect.objectContaining({ reason: 'drag-selection' }),
      )
    fireEvent.click(screen.getByTestId('cb-a'))
    expect(onClick).not.toHaveBeenCalled()
    expect(spies[0]).toHaveBeenCalledTimes(1)
    for (const id of ['cb-a', 'cb-b', 'cb-c', 'cb-d', 'cb-e'])
      expect(screen.getByTestId(id)).not.toHaveAttribute('data-pending')
    expect(spies[3]).not.toHaveBeenCalled()
    expect(spies[4]).not.toHaveBeenCalled()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })
  it('keeps every row reached in keep mode', async () => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    await prepare(spies)
    down('cb-a', 16)
    move(144)
    move(48)
    up(48)
    for (const index of [0, 1, 2, 3])
      expect(spies[index]).toHaveBeenCalledExactlyOnceWith(
        true,
        expect.objectContaining({ reason: 'drag-selection' }),
      )
    expect(spies[4]).not.toHaveBeenCalled()
  })
  it('tracks only the current span in rubber-band mode', async () => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    await prepare(spies, 'rubber-band')
    down('cb-a', 16)
    move(144)
    move(48)
    up(48)
    expect(spies[0]).toHaveBeenCalledExactlyOnceWith(
      true,
      expect.objectContaining({ reason: 'drag-selection' }),
    )
    expect(spies[1]).toHaveBeenCalledExactlyOnceWith(
      true,
      expect.objectContaining({ reason: 'drag-selection' }),
    )
    expect(spies[2]).not.toHaveBeenCalled()
    expect(spies[3]).not.toHaveBeenCalled()
    expect(spies[4]).not.toHaveBeenCalled()
  })
  it('takes the target state from the pressed row', async () => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    await prepare(spies, 'keep', ['b'])
    down('cb-b', 48)
    move(144)
    up(144)
    expect(spies[1]).toHaveBeenCalledExactlyOnceWith(
      false,
      expect.objectContaining({ reason: 'drag-selection' }),
    )
    expect(spies[2]).not.toHaveBeenCalled()
    expect(spies[3]).not.toHaveBeenCalled()
    expect(spies[4]).not.toHaveBeenCalled()
  })
  it('skips plain rows', async () => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    await prepare(spies)
    down('cb-c', 80)
    move(176)
    up(176)
    for (const index of [2, 3, 4])
      expect(spies[index]).toHaveBeenCalledExactlyOnceWith(
        true,
        expect.objectContaining({ reason: 'drag-selection' }),
      )
    expect(screen.getByTestId('item-x')).not.toHaveAttribute('aria-checked')
  })
  it('clamps pointer positions', async () => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    await prepare(spies)
    down('cb-e', 176)
    move(-500)
    for (const id of ['cb-a', 'cb-b', 'cb-c', 'cb-d', 'cb-e'])
      expect(screen.getByTestId(id)).toHaveAttribute('data-pending')
  })
  it('clamps pointer positions in rubber-band mode', async () => {
    const second = Array.from({ length: 5 }, () => vi.fn())
    await prepare(second, 'rubber-band')
    down('cb-a', 16)
    move(5000)
    move(-500)
    expect(screen.getByTestId('cb-a')).toHaveAttribute('data-pending')
    for (const id of ['cb-b', 'cb-c', 'cb-d', 'cb-e'])
      expect(screen.getByTestId(id)).not.toHaveAttribute('data-pending')
  })
  it.each([
    'Escape',
    'pointercancel',
    'blur',
  ] as const)('cancels a drag on %s', async (kind) => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    await prepare(spies)
    down('cb-a', 16)
    move(80)
    if (kind === 'Escape')
      fireEvent.keyDown(screen.getByTestId('list'), { key: 'Escape' })
    else if (kind === 'pointercancel')
      fireEvent.pointerCancel(document, { pointerId: 1 })
    else fireEvent.blur(window)
    expect(spies.every((spy) => !spy.mock.calls.length)).toBe(true)
    expect(screen.getByTestId('cb-a')).not.toHaveAttribute('data-pending')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    up(16)
    fireEvent.click(screen.getByTestId('cb-a'))
    expect(spies.every((spy) => !spy.mock.calls.length)).toBe(true)
  })
  it('Escape closes a press that never became a drag', async () => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    await prepare(spies)
    down('cb-a', 16)
    fireEvent.keyDown(screen.getByTestId('list'), { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
    expect(spies.every((spy) => !spy.mock.calls.length)).toBe(true)
  })
  it('does not start a drag for touch', async () => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    await prepare(spies)
    down('cb-a', 16, 'touch')
    move(80)
    expect(screen.getByTestId('cb-a')).not.toHaveAttribute('data-pending')
    expect(spies.every((spy) => !spy.mock.calls.length)).toBe(true)
  })
  it('does nothing when drag selection is unset but preserves click behavior', async () => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    const user = userEvent.setup()
    render(<Menu>{makeRows(spies)}</Menu>)
    await openMenu(user)
    layoutRows()
    down('cb-a', 16)
    move(80)
    expect(screen.getByTestId('cb-a')).not.toHaveAttribute('data-pending')
    up(80)
    fireEvent.click(screen.getByTestId('cb-a'))
    expect(spies[0]).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'item-press' }),
    )
  })
  it('release row without a move commits the release span', async () => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    await prepare(spies)
    down('cb-a', 16)
    up(80)
    for (const index of [0, 1, 2])
      expect(spies[index]).toHaveBeenCalledExactlyOnceWith(
        true,
        expect.objectContaining({ reason: 'drag-selection' }),
      )
  })
  it('commits checkbox group changes once', async () => {
    const spy = vi.fn()
    const user = userEvent.setup()
    render(
      <Menu dragSelection="keep">
        <DropdownMenu.CheckboxGroup value={[]} onValueChange={spy}>
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
    layoutRows()
    down('cb-a', 16)
    move(80)
    up(80)
    expect(spy).toHaveBeenCalledExactlyOnceWith(
      ['a', 'b', 'c'],
      expect.objectContaining({ reason: 'drag-selection' }),
    )
  })
  it('cancels when the controlled menu closes and on unmount', async () => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    const user = userEvent.setup()
    const view = render(
      <Menu open dragSelection="keep">
        {makeRows(spies)}
      </Menu>,
    )
    await openMenu(user)
    layoutRows()
    down('cb-a', 16)
    move(80)
    view.rerender(
      <Menu open={false} dragSelection="keep">
        {makeRows(spies)}
      </Menu>,
    )
    expect(spies.every((spy) => !spy.mock.calls.length)).toBe(true)
    expect(screen.queryByTestId('cb-a')).toBeNull()
    up(80)
    expect(spies.every((spy) => !spy.mock.calls.length)).toBe(true)
    view.unmount()
  })
  it('unmounting mid-drag commits nothing and throws nothing', async () => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    await prepare(spies)
    down('cb-a', 16)
    move(80)
    cleanup()
    expect(() => up(80)).not.toThrow()
    expect(spies.every((spy) => !spy.mock.calls.length)).toBe(true)
  })
  it('keeps the open subscription through StrictMode remounts', async () => {
    const spies = Array.from({ length: 5 }, () => vi.fn())
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const view = render(
      <React.StrictMode>
        <Menu open onOpenChange={onOpenChange} dragSelection="keep">
          {makeRows(spies)}
        </Menu>
      </React.StrictMode>,
    )
    await openMenu(user)
    layoutRows()
    down('cb-a', 16)
    move(80)
    expect(screen.getByTestId('cb-c')).toHaveAttribute('data-pending')
    view.rerender(
      <React.StrictMode>
        <Menu open={false} onOpenChange={onOpenChange} dragSelection="keep">
          {makeRows(spies)}
        </Menu>
      </React.StrictMode>,
    )
    up(80)
    expect(spies.every((spy) => !spy.mock.calls.length)).toBe(true)
  })
})
