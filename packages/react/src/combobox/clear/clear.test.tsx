import { fireEvent, render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Combobox } from '../index.js'

function ComboboxWithClear(props: {
  selected?: boolean
  keepMounted?: boolean
  onValueChange?: (value: string) => void
  onClearPointerDown?: (e: React.PointerEvent) => void
}) {
  const { selected = true } = props
  return (
    <Combobox.Root
      defaultValue={selected ? 'apple' : undefined}
      onValueChange={props.onValueChange}
    >
      <Combobox.Input data-testid="input" />
      <Combobox.Clear
        data-testid="clear"
        keepMounted={props.keepMounted}
        onPointerDown={props.onClearPointerDown}
      />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.Surface>
              <Combobox.List>
                <Combobox.Item value="apple">Apple</Combobox.Item>
              </Combobox.List>
            </Combobox.Surface>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

describe('Combobox.Clear pointerdown', () => {
  it('calls the consumer onPointerDown', () => {
    const onClearPointerDown = vi.fn()

    render(<ComboboxWithClear onClearPointerDown={onClearPointerDown} />)

    fireEvent.pointerDown(screen.getByTestId('clear'))

    expect(onClearPointerDown).toHaveBeenCalledOnce()
  })

  it('still prevents default (preserves focus protection)', () => {
    render(<ComboboxWithClear />)

    expect(fireEvent.pointerDown(screen.getByTestId('clear'))).toBe(false)
  })
})

describe('Combobox.Clear value state', () => {
  it('does not render when nothing is selected', () => {
    render(<ComboboxWithClear selected={false} />)

    expect(screen.queryByTestId('clear')).not.toBeInTheDocument()
  })

  it('stays disabled with keepMounted when nothing is selected', () => {
    render(<ComboboxWithClear selected={false} keepMounted />)

    expect(screen.getByTestId('clear')).toBeDisabled()
  })

  it('clears the selection and typed text, then hides itself', () => {
    const onValueChange = vi.fn()
    render(<ComboboxWithClear onValueChange={onValueChange} />)

    fireEvent.change(screen.getByTestId('input'), { target: { value: 'app' } })
    fireEvent.click(screen.getByTestId('clear'))

    expect(onValueChange).toHaveBeenCalledOnce()
    expect(onValueChange.mock.calls[0]?.[0]).toBe('')
    expect(screen.getByTestId('input')).toHaveValue('')
    expect(screen.queryByTestId('clear')).not.toBeInTheDocument()
  })
})
