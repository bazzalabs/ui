import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { List } from './index.js'

const columns = [
  { name: 'check', size: '40px' },
  { name: 'date', size: '112px' },
]

function Example(props: { focusMode?: 'roving' | 'virtual' }) {
  const items = ['a', 'b', 'c']
  const store = List.useStore({
    items,
    getKey: (item) => item,
    focusMode: props.focusMode,
  })

  return (
    <>
      <input data-testid="outside" />
      <List.Root store={store} columns={columns} data-testid="root">
        {items.map((item) => (
          <List.Row key={item} value={item}>
            <List.Cell column="check">{item}</List.Cell>
            <List.Cell column="date">value</List.Cell>
          </List.Row>
        ))}
      </List.Root>
    </>
  )
}

describe('List pointer focus', () => {
  it('focuses the highlighted row from body in roving mode', () => {
    render(<Example />)
    document.body.focus()
    const row = screen.getAllByRole('option')[0]!

    fireEvent.pointerMove(row)

    expect(document.activeElement).toBe(row)
  })

  it('does not move focus from an outside input', () => {
    render(<Example />)
    const outside = screen.getByTestId('outside')
    outside.focus()
    const row = screen.getAllByRole('option')[0]!

    fireEvent.pointerMove(row)

    expect(document.activeElement).toBe(outside)
  })

  it('does not move focus already inside the list', () => {
    render(<Example />)
    const rows = screen.getAllByRole('option')
    rows[0]!.focus()

    fireEvent.pointerMove(rows[1]!)

    expect(document.activeElement).toBe(rows[0])
  })

  it('focuses the root from body in virtual mode', () => {
    render(<Example focusMode="virtual" />)
    document.body.focus()
    const root = screen.getByTestId('root')
    const row = screen.getAllByRole('option')[0]!

    fireEvent.pointerMove(row)

    expect(document.activeElement).toBe(root)
  })
})
