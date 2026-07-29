import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { List } from './index.js'

const columns = [
  { name: 'check', size: '40px' },
  { name: 'date', size: '112px' },
]

function Example(props: {
  items?: string[]
  selectionMode?: 'none' | 'single' | 'multiple'
  defaultSelectedKeys?: Iterable<string>
  selectedKeys?: Iterable<string>
  onSelectionChange?: (...args: any[]) => void
  onAction?: (...args: any[]) => void
  layout?: boolean
  disabledItems?: string[]
  rowStyle?: { display?: string }
}) {
  const items = props.items ?? ['a', 'b', 'c']
  const store = List.useStore({
    items,
    getKey: (item) => item,
    selectionMode: props.selectionMode,
    defaultSelectedKeys: props.defaultSelectedKeys,
    selectedKeys: props.selectedKeys,
    onSelectionChange: props.onSelectionChange,
    onAction: props.onAction,
  })
  return (
    <List.Root
      store={store}
      columns={columns}
      layout={props.layout}
      data-testid="root"
    >
      {items.map((item) => (
        <List.Row
          key={item}
          value={item}
          disabled={props.disabledItems?.includes(item) ?? item === 'c'}
          style={props.rowStyle}
        >
          <List.Cell column="check">{item}</List.Cell>
          <List.Cell column="date">value</List.Cell>
        </List.Row>
      ))}
    </List.Root>
  )
}

describe('List', () => {
  it('renders listbox options and named-column layout', () => {
    render(<Example selectionMode="multiple" />)
    expect(screen.getByRole('listbox')).toHaveAttribute(
      'aria-multiselectable',
      'true',
    )
    expect(screen.getAllByRole('option')).toHaveLength(3)
    expect(screen.getByTestId('root')).toHaveStyle({
      '--list-template': '[check] 40px [date] 112px',
    })
    expect(screen.getAllByRole('option')[0]).toHaveStyle({
      display: 'grid',
      gridTemplateColumns: 'subgrid',
    })
    expect(screen.getAllByRole('option')[0]?.firstElementChild).toHaveAttribute(
      'data-list-column',
      'check',
    )
  })

  it('supports set, toggle, range, action, and disabled pointer interactions', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onAction = vi.fn()
    render(
      <Example
        items={['a', 'b', 'c', 'd']}
        disabledItems={['d']}
        selectionMode="multiple"
        onSelectionChange={onChange}
        onAction={onAction}
      />,
    )
    const rows = screen.getAllByRole('option')
    await user.click(rows[0]!)
    expect(rows[0]).toHaveAttribute('data-selected', '')
    expect(onAction).toHaveBeenCalledWith(
      'a',
      expect.objectContaining({ method: 'pointer' }),
    )
    fireEvent.click(rows[2]!, { shiftKey: true })
    expect(rows[0]).toHaveAttribute('data-first-selected', '')
    expect(rows[2]).toHaveAttribute('data-last-selected', '')
    expect(
      rows.slice(0, 3).every((row) => row.hasAttribute('data-selected')),
    ).toBe(true)
    expect(onChange.mock.calls.map(([_, details]) => details.type)).toEqual([
      'set',
      'range',
    ])
    fireEvent.click(rows[1]!, { ctrlKey: true })
    expect(rows[1]).not.toHaveAttribute('data-selected')
    expect(onChange.mock.calls.map(([_, details]) => details.type)).toEqual([
      'set',
      'range',
      'toggle',
    ])
    await user.click(rows[3]!)
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('does not fire action for Alt+Click but still selects', () => {
    const onAction = vi.fn()
    render(<Example selectionMode="multiple" onAction={onAction} />)
    const row = screen.getAllByRole('option')[0]!
    fireEvent.click(row, { altKey: true })
    expect(row).toHaveAttribute('data-selected', '')
    expect(onAction).not.toHaveBeenCalled()
  })

  it('allows consumer row styles to override layout defaults', () => {
    render(<Example rowStyle={{ display: 'flex' }} />)
    const row = screen.getAllByRole('option')[0]!
    expect(row).toHaveStyle({ display: 'flex' })
  })

  it('keeps attrs while disabling layout and does not self-mutate controlled selection', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Example
        layout={false}
        selectionMode="multiple"
        selectedKeys={new Set(['b'])}
        onSelectionChange={onChange}
      />,
    )
    const root = screen.getByTestId('root')
    const row = screen.getAllByRole('option')[1]!
    expect(root).not.toHaveStyle({ display: 'grid' })
    expect(row).not.toHaveStyle({ display: 'grid' })
    expect(row.firstElementChild).toHaveAttribute('data-list-column', 'check')
    expect(row.firstElementChild).not.toHaveStyle({ gridColumn: 'check' })
    expect(row).toHaveAttribute('data-selected', '')
    await user.click(screen.getAllByRole('option')[0]!)
    expect(onChange).toHaveBeenCalled()
    expect(row).toHaveAttribute('data-selected', '')
  })

  it('prunes uncontrolled selection when data is removed', async () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Example selectionMode="multiple" onSelectionChange={onChange} />,
    )
    await userEvent.setup().click(screen.getAllByRole('option')[1]!)
    rerender(
      <Example
        items={['a', 'c']}
        selectionMode="multiple"
        onSelectionChange={onChange}
      />,
    )
    expect(onChange.mock.calls.at(-1)?.[1].type).toBe('prune')
  })

  it('updates selection accessibility attributes when selection mode changes', () => {
    const { rerender } = render(<Example selectionMode="multiple" />)
    const root = screen.getByTestId('root')
    const rows = screen.getAllByRole('option')
    expect(root).toHaveAttribute('aria-multiselectable', 'true')
    expect(rows[0]).toHaveAttribute('aria-selected')

    rerender(<Example selectionMode="none" />)

    expect(root).not.toHaveAttribute('aria-multiselectable')
    expect(screen.getAllByRole('option')[0]).not.toHaveAttribute(
      'aria-selected',
    )
  })

  it('renders only the known controlled selection', () => {
    render(<Example selectionMode="multiple" selectedKeys={['b', 'unknown']} />)
    const rows = screen.getAllByRole('option')
    expect(screen.getByTestId('root')).not.toHaveAttribute('data-empty')
    expect(rows[1]).toHaveAttribute('data-selected', '')
    expect(rows[0]).not.toHaveAttribute('data-selected')
    expect(rows[2]).not.toHaveAttribute('data-selected')
  })

  it('does not call onSelectionChange when mounting with selection', () => {
    for (const selection of [
      { selectedKeys: ['b'] },
      { defaultSelectedKeys: ['b'] },
    ]) {
      const onChange = vi.fn()
      const { unmount } = render(
        <Example
          selectionMode="multiple"
          {...selection}
          onSelectionChange={onChange}
        />,
      )
      expect(onChange).not.toHaveBeenCalled()
      unmount()
    }
  })
})
