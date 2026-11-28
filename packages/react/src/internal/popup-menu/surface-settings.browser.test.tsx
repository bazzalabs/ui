import { act, cleanup, render, screen } from '@testing-library/react'
import * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CommandMenu } from '../../command-menu/index.js'
import { DropdownMenu } from '../../dropdown-menu/index.js'

/**
 * A part renders its level's settings in the commit that changes them (the
 * level's settings context, rendered with the level): an element a root
 * enables is enabled in that commit, so what focuses or presses it then
 * reaches it.
 */

afterEach(() => {
  cleanup()
  focused.length = 0
})

type Reach = 'effect' | 'layout effect' | 'layout effect click'

/** Reaches the element `find` returns, once `on`, in an effect of its kind. */
/** Whether the element took the focus it was given, when it was given it. */
const focused: boolean[] = []

function reach(on: boolean, find: () => HTMLElement | null, how: Reach) {
  if (!on) return
  const element = find()
  element?.focus()
  focused.push(element !== null && document.activeElement === element)
  if (how === 'layout effect click') element?.click()
}

function Reacher({
  on,
  find,
  how,
}: {
  on: boolean
  find: () => HTMLElement | null
  how: Reach
}) {
  // Once, in the commit `on` changes in.
  React.useEffect(() => {
    if (how === 'effect') reach(on, find, how)
  }, [on, find, how])
  React.useLayoutEffect(() => {
    if (how !== 'effect') reach(on, find, how)
  }, [on, find, how])
  return null
}

const trigger = () =>
  document.querySelector<HTMLElement>('[data-testid="trigger"]')

function Dropdown({
  disabled,
  reach,
  autoFocusTrigger,
  onOpenChange,
}: {
  disabled: boolean
  reach?: Reach
  autoFocusTrigger?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <DropdownMenu.Root disabled={disabled} onOpenChange={onOpenChange}>
      {autoFocusTrigger === false ? null : (
        <DropdownMenu.Trigger
          data-testid="trigger"
          autoFocus={autoFocusTrigger}
        >
          Open
        </DropdownMenu.Trigger>
      )}
      {reach && <Reacher on={!disabled} find={trigger} how={reach} />}
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup">
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                <DropdownMenu.Item>Apple</DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

describe('DropdownMenu.Trigger in the commit that enables its root', () => {
  it('takes focus from a consumer’s effect', async () => {
    const { rerender } = render(<Dropdown disabled reach="effect" />)
    await act(async () => {})
    rerender(<Dropdown disabled={false} reach="effect" />)
    await act(async () => {})
    expect(focused).toEqual([true])
    expect(screen.getByTestId('trigger')).toHaveFocus()
  })

  it('takes focus and a click from a consumer’s layout effect', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Dropdown
        disabled
        reach="layout effect click"
        onOpenChange={onOpenChange}
      />,
    )
    await act(async () => {})
    rerender(
      <Dropdown
        disabled={false}
        reach="layout effect click"
        onOpenChange={onOpenChange}
      />,
    )
    await act(async () => {})
    // Focused when the layout effect reached it; the click then opened the
    // menu, which takes the focus into its popup.
    expect(focused).toEqual([true])
    expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true])
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })

  it('takes focus with autoFocus, mounting in that commit', async () => {
    const { rerender } = render(<Dropdown disabled autoFocusTrigger={false} />)
    await act(async () => {})
    rerender(<Dropdown disabled={false} autoFocusTrigger />)
    await act(async () => {})
    expect(screen.getByTestId('trigger')).toHaveFocus()
  })
})

describe('CommandMenu.Trigger in the commit that enables its root', () => {
  function Command({ disabled }: { disabled: boolean }) {
    return (
      <CommandMenu.Root disabled={disabled}>
        <CommandMenu.Trigger data-testid="trigger">Open</CommandMenu.Trigger>
        <Reacher on={!disabled} find={trigger} how="effect" />
        <CommandMenu.Portal>
          <CommandMenu.Popup>
            <CommandMenu.Surface>
              <CommandMenu.Input />
              <CommandMenu.List>
                <CommandMenu.Item>Apple</CommandMenu.Item>
              </CommandMenu.List>
            </CommandMenu.Surface>
          </CommandMenu.Popup>
        </CommandMenu.Portal>
      </CommandMenu.Root>
    )
  }

  it('takes focus from a consumer’s effect', async () => {
    const { rerender } = render(<Command disabled />)
    await act(async () => {})
    rerender(<Command disabled={false} />)
    await act(async () => {})
    expect(focused).toEqual([true])
    expect(screen.getByTestId('trigger')).toHaveFocus()
  })
})

describe('a menu’s Input in the commit that enables its root', () => {
  const input = () =>
    document.querySelector<HTMLElement>('[data-testid="input"]')

  function Open({ disabled }: { disabled: boolean }) {
    return (
      <DropdownMenu.Root defaultOpen disabled={disabled}>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.Input data-testid="input" />
                <DropdownMenu.List>
                  <DropdownMenu.Item>Apple</DropdownMenu.Item>
                </DropdownMenu.List>
                <Reacher on={!disabled} find={input} how="layout effect" />
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  it('takes focus from a layout effect in the popup', async () => {
    const { rerender } = render(<Open disabled={false} />)
    await screen.findByTestId('input')
    rerender(<Open disabled />)
    await act(async () => {})
    expect(screen.getByTestId('input')).toBeDisabled()
    // Away from the input, then enabled: the layout effect focuses it.
    act(() => (document.activeElement as HTMLElement | null)?.blur())
    focused.length = 0
    rerender(<Open disabled={false} />)
    await act(async () => {})
    // It took the focus when the layout effect gave it (the menu may move
    // focus to it later itself).
    expect(focused).toEqual([true])
  })
})
