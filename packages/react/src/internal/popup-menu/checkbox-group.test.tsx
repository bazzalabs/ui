import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'

function Menu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
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

function Checkbox({ value }: { value: string }) {
  return (
    <DropdownMenu.CheckboxItem value={value} data-testid={value}>
      {value}
    </DropdownMenu.CheckboxItem>
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('PopupMenu.CheckboxGroup', () => {
  it('controls checked state and reports array changes', async () => {
    const spy = vi.fn()
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.CheckboxGroup value={['a']} onValueChange={spy}>
          <Checkbox value="a" />
          <Checkbox value="b" />
          <Checkbox value="c" />
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await openMenu(user)
    expect(screen.getByTestId('a')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('a')).toHaveAttribute('data-checked')
    expect(screen.getByTestId('b')).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByTestId('b')).toHaveAttribute('data-unchecked')
    await user.click(screen.getByTestId('b'))
    expect(spy).toHaveBeenCalledExactlyOnceWith(
      ['a', 'b'],
      expect.objectContaining({ reason: 'item-press' }),
    )
    await user.click(screen.getByTestId('a'))
    expect(spy).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({ reason: 'item-press' }),
    )
  })

  it('updates uncontrolled values from defaultValue', async () => {
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.CheckboxGroup defaultValue={['b']}>
          <Checkbox value="a" />
          <Checkbox value="b" />
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await openMenu(user)
    await user.click(screen.getByTestId('a'))
    expect(screen.getByTestId('a')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('b')).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByTestId('b'))
    expect(screen.getByTestId('b')).toHaveAttribute('aria-checked', 'false')
  })

  it('leaves uncontrolled state unchanged when onValueChange cancels', async () => {
    const user = userEvent.setup()
    const cancel = vi.fn((_value, eventDetails) => eventDetails.cancel())
    render(
      <Menu>
        <DropdownMenu.CheckboxGroup onValueChange={cancel}>
          <Checkbox value="a" />
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await openMenu(user)
    await user.click(screen.getByTestId('a'))
    expect(cancel).toHaveBeenCalledOnce()
    expect(screen.getByTestId('a')).toHaveAttribute('aria-checked', 'false')
  })

  it('disables all items when the group is disabled', async () => {
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.CheckboxGroup disabled defaultValue={[]}>
          <Checkbox value="a" />
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await openMenu(user)
    expect(screen.getByTestId('a')).toHaveAttribute('aria-disabled', 'true')
    await user.click(screen.getByTestId('a'))
    expect(screen.getByTestId('a')).toHaveAttribute('aria-checked', 'false')
  })

  it('renders role, data-testid, and checkbox group slot attributes', async () => {
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.CheckboxGroup data-testid="group">
          <Checkbox value="a" />
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await openMenu(user)
    expect(screen.getByRole('group')).toHaveAttribute('data-testid', 'group')
    expect(screen.getByRole('group')).toHaveAttribute(
      'bazzaui-dropdown-menu-checkbox-group',
    )
  })

  it('supports the headless value provider', async () => {
    const spy = vi.fn()
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.CheckboxGroupValue value={['c']} onValueChange={spy}>
          <Checkbox value="a" />
          <Checkbox value="c" />
        </DropdownMenu.CheckboxGroupValue>
      </Menu>,
    )
    await openMenu(user)
    expect(screen.getByTestId('c')).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByTestId('a'))
    expect(spy).toHaveBeenCalledWith(
      ['c', 'a'],
      expect.objectContaining({ reason: 'item-press' }),
    )
  })

  it('toggles the group value with Enter', async () => {
    const spy = vi.fn()
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.CheckboxGroup onValueChange={spy}>
          <Checkbox value="first" />
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await openMenu(user)
    screen.getByTestId('list').focus()
    await user.keyboard('{Enter}')
    expect(spy).toHaveBeenCalledExactlyOnceWith(['first'], expect.anything())
  })

  it('warns when item state props are ignored inside a group', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.CheckboxGroup>
          <DropdownMenu.CheckboxItem checked value="one">
            one
          </DropdownMenu.CheckboxItem>
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await openMenu(user)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('ignored inside a checkbox group'),
    )
  })

  it('warns when an item in a group has no value', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.CheckboxGroup>
          <DropdownMenu.CheckboxItem>missing</DropdownMenu.CheckboxItem>
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await openMenu(user)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('needs a `value` prop'),
    )
  })

  it('warns when checkbox items in a group have duplicate values', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.CheckboxGroup>
          <Checkbox value="dup" />
          <Checkbox value="dup" />
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await openMenu(user)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('duplicate item value "dup"'),
    )
  })

  it('keeps standalone checkbox state behavior', async () => {
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.CheckboxItem defaultChecked data-testid="alone">
          alone
        </DropdownMenu.CheckboxItem>
      </Menu>,
    )
    await openMenu(user)
    await user.click(screen.getByTestId('alone'))
    expect(screen.getByTestId('alone')).toHaveAttribute('aria-checked', 'false')
  })
})
