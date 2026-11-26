import { fireEvent, render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Combobox } from '../index.js'

function ComboboxWithIcon(props: {
  defaultValue?: string
  onInputValueChange?: (value: string) => void
  onOpenChange?: (open: boolean) => void
  onIconClick?: (event: React.MouseEvent<HTMLSpanElement>) => void
  onIconPointerDown?: (event: React.PointerEvent<HTMLSpanElement>) => void
}) {
  return (
    <Combobox.Root
      defaultValue={props.defaultValue}
      onInputValueChange={props.onInputValueChange}
      onOpenChange={props.onOpenChange}
    >
      <Combobox.Input data-testid="input" />
      <Combobox.Icon
        data-testid="icon"
        onClick={props.onIconClick}
        onPointerDown={props.onIconPointerDown}
      />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup data-testid="popup">
            <Combobox.Surface>
              <Combobox.List>
                <Combobox.Item value="apple">Apple</Combobox.Item>
                <Combobox.Item value="banana">Banana</Combobox.Item>
              </Combobox.List>
            </Combobox.Surface>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

describe('Combobox.Icon', () => {
  it('opens the popup on click, and closes it on the next click', async () => {
    render(<ComboboxWithIcon />)
    const icon = screen.getByTestId('icon')

    expect(screen.queryByTestId('popup')).not.toBeInTheDocument()
    expect(icon).not.toHaveAttribute('data-popup-open')

    fireEvent.click(icon)
    expect(await screen.findByTestId('popup')).toBeInTheDocument()
    expect(icon).toHaveAttribute('data-popup-open')

    fireEvent.click(icon)
    expect(icon).not.toHaveAttribute('data-popup-open')
  })

  it('fills the input with the selected label before it opens', () => {
    const onInputValueChange = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <ComboboxWithIcon
        defaultValue="banana"
        onInputValueChange={onInputValueChange}
        onOpenChange={onOpenChange}
      />,
    )

    fireEvent.click(screen.getByTestId('icon'))

    expect(onInputValueChange).toHaveBeenCalledWith('banana')
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true)
    expect(onInputValueChange.mock.invocationCallOrder[0]).toBeLessThan(
      onOpenChange.mock.invocationCallOrder[0] ?? 0,
    )
  })

  it('carries the bazzaui-combobox-icon slot attribute', () => {
    render(<ComboboxWithIcon />)

    expect(screen.getByTestId('icon')).toHaveAttribute(
      'bazzaui-combobox-icon',
      '',
    )
  })

  it("doesn't toggle when the consumer's onClick prevents default", () => {
    const onIconClick = vi.fn((event: React.MouseEvent) =>
      event.preventDefault(),
    )
    render(<ComboboxWithIcon onIconClick={onIconClick} />)

    fireEvent.click(screen.getByTestId('icon'))

    expect(onIconClick).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument()
  })

  it('prevents pointerdown default, then calls the consumer handler', () => {
    const onIconPointerDown = vi.fn((event: React.PointerEvent) => {
      expect(event.defaultPrevented).toBe(true)
    })
    render(<ComboboxWithIcon onIconPointerDown={onIconPointerDown} />)

    expect(fireEvent.pointerDown(screen.getByTestId('icon'))).toBe(false)
    expect(onIconPointerDown).toHaveBeenCalledOnce()
  })
})
