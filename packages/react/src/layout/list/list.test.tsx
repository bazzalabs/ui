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
  selectionFollowsFocus?: boolean
  focusMode?: 'roving' | 'virtual'
  layout?: boolean
  disabledItems?: string[]
  isDisabledItems?: string[]
  omitRowDisabled?: boolean
  rowStyle?: { display?: string }
}) {
  const items = props.items ?? ['a', 'b', 'c']
  const store = List.useStore({
    items,
    getKey: (item) => item,
    isDisabled: (item) => props.isDisabledItems?.includes(item) ?? false,
    selectionMode: props.selectionMode,
    defaultSelectedKeys: props.defaultSelectedKeys,
    selectedKeys: props.selectedKeys,
    onSelectionChange: props.onSelectionChange,
    onAction: props.onAction,
    selectionFollowsFocus: props.selectionFollowsFocus,
    focusMode: props.focusMode,
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
          disabled={
            props.omitRowDisabled
              ? undefined
              : (props.disabledItems?.includes(item) ?? item === 'c')
          }
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

  it('navigates with arrows and vim keys, following focus by default', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Example
        items={['a', 'b', 'c']}
        selectionMode="multiple"
        onSelectionChange={onChange}
      />,
    )
    const root = screen.getByTestId('root')
    const rows = screen.getAllByRole('option')
    root.focus()
    await user.keyboard('{ArrowDown}')
    expect(rows[0]).toHaveAttribute('data-keyboard-active', '')
    await user.keyboard('j')
    expect(rows[1]).toHaveAttribute('data-keyboard-active', '')
    await user.keyboard('k')
    expect(rows[0]).toHaveAttribute('data-keyboard-active', '')
    expect(onChange.mock.calls.map((call) => call[1].type)).toEqual([
      'set',
      'set',
      'set',
    ])
  })

  it('does not follow selection when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Example
        selectionMode="multiple"
        selectionFollowsFocus={false}
        onSelectionChange={onChange}
      />,
    )
    const root = screen.getByTestId('root')
    root.focus()
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('supports explicit multi-select, actions, boundaries, and disabled rows', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onAction = vi.fn()
    render(
      <Example
        items={['a', 'b', 'c', 'd']}
        disabledItems={['c']}
        selectionMode="multiple"
        onSelectionChange={onChange}
        onAction={onAction}
      />,
    )
    const root = screen.getByTestId('root')
    const rows = screen.getAllByRole('option')
    root.focus()
    await user.keyboard('{ArrowDown}x')
    expect(rows[0]).not.toHaveAttribute('data-selected')
    expect(rows[1]).toHaveAttribute('data-keyboard-active', '')
    await user.keyboard('{ArrowDown}')
    expect(rows[3]).toHaveAttribute('data-keyboard-active', '')
    await user.keyboard('{Home}{Enter}')
    expect(onAction).toHaveBeenCalledWith(
      'a',
      expect.objectContaining({ method: 'keyboard' }),
    )
    await user.keyboard('{End}')
    expect(rows[3]).toHaveAttribute('data-keyboard-active', '')
    await user.keyboard('{Escape}{ArrowUp}')
    expect(rows[1]).toHaveAttribute('data-selected', '')
  })

  it('keeps x selections while keyboard multi-select is active', async () => {
    const user = userEvent.setup()
    render(
      <Example
        items={['a', 'b', 'c', 'd']}
        disabledItems={[]}
        selectionMode="multiple"
      />,
    )
    const root = screen.getByTestId('root')
    const rows = screen.getAllByRole('option')
    fireEvent.pointerMove(rows[0]!)
    root.focus()
    await user.keyboard('xx{ArrowDown}')
    expect(rows[0]).toHaveAttribute('data-selected', '')
    expect(rows[1]).toHaveAttribute('data-selected', '')
    expect(rows[2]).not.toHaveAttribute('data-selected')
    expect(rows[3]).toHaveAttribute('data-keyboard-active', '')
  })

  it('updates the roving tab stop for a row-disabled first item', () => {
    render(<Example items={['a', 'b']} disabledItems={['a']} />)
    const rows = screen.getAllByRole('option')
    expect(rows[0]).toHaveAttribute('aria-disabled', 'true')
    expect(rows[0]).toHaveAttribute('tabindex', '-1')
    expect(rows[1]).toHaveAttribute('tabindex', '0')
  })

  it('uses option-level disabled state when the row omits its disabled prop', async () => {
    const user = userEvent.setup()
    render(
      <Example items={['a', 'b']} isDisabledItems={['a']} omitRowDisabled />,
    )
    const root = screen.getByTestId('root')
    const rows = screen.getAllByRole('option')
    expect(rows[0]).toHaveAttribute('aria-disabled', 'true')
    root.focus()
    await user.keyboard('{ArrowDown}')
    expect(rows[1]).toHaveAttribute('data-keyboard-active', '')
  })

  it('preserves an initial pointer range after a plain arrow', async () => {
    const user = userEvent.setup()
    render(
      <Example
        items={['a', 'b', 'c', 'd']}
        disabledItems={[]}
        selectionMode="multiple"
      />,
    )
    const root = screen.getByTestId('root')
    const rows = screen.getAllByRole('option')
    await user.click(rows[0]!)
    fireEvent.click(rows[2]!, { shiftKey: true })
    root.focus()
    await user.keyboard('{ArrowDown}')
    expect(
      rows.slice(0, 3).every((row) => row.hasAttribute('data-selected')),
    ).toBe(true)
  })

  it('supports empty-string keys for keyboard activation and actions', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(
      <Example
        items={['', 'b']}
        disabledItems={[]}
        focusMode="virtual"
        onAction={onAction}
      />,
    )
    const root = screen.getByTestId('root')
    const row = screen.getAllByRole('option')[0]!
    root.focus()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(row).toHaveAttribute('data-keyboard-active', '')
    expect(root).toHaveAttribute('aria-activedescendant', row.id)
    expect(onAction).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ method: 'keyboard' }),
    )
  })

  it('extends and shrinks a keyboard range around its anchor', async () => {
    const user = userEvent.setup()
    render(
      <Example
        items={['a', 'b', 'c', 'd']}
        disabledItems={[]}
        selectionMode="multiple"
      />,
    )
    const root = screen.getByTestId('root')
    const rows = screen.getAllByRole('option')
    await user.click(rows[0]!)
    root.focus()
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    expect(
      rows.slice(0, 3).every((row) => row.hasAttribute('data-selected')),
    ).toBe(true)
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}')
    expect(rows[0]).toHaveAttribute('data-selected', '')
    expect(rows[1]).toHaveAttribute('data-selected', '')
    expect(rows[2]).not.toHaveAttribute('data-selected')
  })

  it('provides roving and virtual focus modes', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Example />)
    const root = screen.getByTestId('root')
    const rows = screen.getAllByRole('option')
    expect(rows.filter((row) => row.tabIndex === 0)).toHaveLength(1)
    rows[0]!.focus()
    await user.keyboard('{ArrowDown}')
    expect(rows[0]).toHaveFocus()
    expect(rows[0]).toHaveAttribute('data-keyboard-active', '')
    await user.keyboard('{ArrowDown}')
    expect(rows[1]).toHaveFocus()
    rerender(<Example focusMode="virtual" />)
    expect(root).toHaveAttribute('tabindex', '0')
    expect(
      screen.getAllByRole('option').every((row) => row.tabIndex === -1),
    ).toBe(true)
  })

  it('keeps focus on the root in virtual mode while updating the active descendant', async () => {
    const user = userEvent.setup()
    render(<Example focusMode="virtual" items={['a', 'b']} />)
    const root = screen.getByTestId('root')
    const rows = screen.getAllByRole('option')
    root.focus()
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(root)
    expect(root).toHaveAttribute('aria-activedescendant', rows[0]!.id)
    expect(rows.every((row) => row.tabIndex === -1)).toBe(true)
  })

  it('does not select row-level disabled rows with ranges or select all', async () => {
    const user = userEvent.setup()
    render(
      <Example
        items={['a', 'b', 'c', 'd']}
        disabledItems={['c']}
        selectionMode="multiple"
      />,
    )
    const root = screen.getByTestId('root')
    const rows = screen.getAllByRole('option')
    await user.click(rows[0]!)
    root.focus()
    await user.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}')
    expect(rows[2]).not.toHaveAttribute('data-selected')
    await user.keyboard('{Meta>}a{/Meta}')
    expect(rows[2]).not.toHaveAttribute('data-selected')
    expect(rows[0]).toHaveAttribute('data-selected', '')
    expect(rows[1]).toHaveAttribute('data-selected', '')
    expect(rows[3]).toHaveAttribute('data-selected', '')
  })

  it('lands on the first row on the first downward move', async () => {
    const user = userEvent.setup()
    render(<Example items={['a', 'b']} disabledItems={[]} />)
    const root = screen.getByTestId('root')
    const rows = screen.getAllByRole('option')
    root.focus()
    await user.keyboard('{ArrowDown}')
    expect(rows[0]).toHaveAttribute('data-keyboard-active', '')
  })

  it('flips a pointer highlight to a keyboard highlight on Home', async () => {
    const user = userEvent.setup()
    render(<Example items={['a', 'b']} />)
    const rows = screen.getAllByRole('option')
    fireEvent.pointerMove(rows[0]!)
    expect(rows[0]).toHaveAttribute('data-active', '')
    screen.getByTestId('root').focus()
    await user.keyboard('{Home}')
    expect(rows[0]).toHaveAttribute('data-keyboard-active', '')
    expect(rows[0]).not.toHaveAttribute('data-active')
  })

  it('establishes a selection anchor on an initial Shift+Arrow', async () => {
    const user = userEvent.setup()
    render(
      <Example
        items={['a', 'b']}
        disabledItems={[]}
        selectionMode="multiple"
      />,
    )
    const rows = screen.getAllByRole('option')
    screen.getByTestId('root').focus()
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}{ArrowDown}')
    expect(rows[0]).toHaveAttribute('data-selected', '')
    expect(rows[1]).not.toHaveAttribute('data-selected')
  })

  it('clears keyboard activation when the active row becomes disabled', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    const { rerender } = render(
      <Example items={['a', 'b']} disabledItems={[]} onAction={onAction} />,
    )
    const root = screen.getByTestId('root')
    root.focus()
    await user.keyboard('{ArrowDown}')
    rerender(
      <Example items={['a', 'b']} disabledItems={['a']} onAction={onAction} />,
    )
    await user.keyboard('{Enter}')
    expect(screen.getAllByRole('option')[0]).not.toHaveAttribute(
      'data-keyboard-active',
    )
    expect(onAction).not.toHaveBeenCalled()
  })
})
