import { fireEvent, render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Combobox } from '../index.js'

function ComboboxWithClear(props: {
  onClearPointerDown?: (e: React.PointerEvent) => void
}) {
  return (
    <Combobox.Root defaultValue="apple">
      <Combobox.Input data-testid="input" />
      <Combobox.Clear
        data-testid="clear"
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
