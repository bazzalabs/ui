import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { List } from './index.js'

const columns = [
  { name: 'check', size: '40px' },
  { name: 'date', size: '112px' },
  { name: 'name', size: '1fr' },
]

const items = ['a', 'b', 'c', 'd']

function expectNoLayoutStyles(root: HTMLElement) {
  expect(root.style.getPropertyValue('--list-template')).toBe('')

  for (const element of [root, ...root.querySelectorAll('*')]) {
    const style = element.getAttribute('style') ?? ''
    expect(style).not.toMatch(/display:\s*grid/)
    expect(style).not.toMatch(/display:\s*contents/)
    expect(style).not.toMatch(/grid-template-columns/)
    expect(style).not.toMatch(/grid-column/)
    expect(style).not.toMatch(/position:\s*sticky/)
  }
}

function TableList(props: {
  onAction?: (...args: any[]) => void
  onSelectionChange?: (...args: any[]) => void
  defaultSelectedKeys?: Iterable<string>
  defaultCollapsedGroups?: Iterable<string>
  selectionFollowsFocus?: boolean
  grouped?: boolean
}) {
  const store = List.useStore({
    items,
    getKey: (item) => item,
    getGroupId: props.grouped
      ? (item: string) => (item < 'c' ? 'g1' : 'g2')
      : undefined,
    selectionMode: 'multiple',
    defaultSelectedKeys: props.defaultSelectedKeys,
    defaultCollapsedGroups: props.defaultCollapsedGroups,
    selectionFollowsFocus: props.selectionFollowsFocus,
    onAction: props.onAction,
    onSelectionChange: props.onSelectionChange,
  })

  const rows = (values: string[]) =>
    values.map((item) => (
      <List.Row
        key={item}
        value={item}
        data-testid={`row-${item}`}
        render={<tr />}
      >
        <List.Cell column="check" render={<td />}>
          {item}
        </List.Cell>
        <List.Cell column="date" render={<td />}>
          date
        </List.Cell>
        <List.Cell column="name" render={<td />}>
          name
        </List.Cell>
      </List.Row>
    ))

  return (
    <List.Root
      store={store}
      columns={columns}
      layout={false}
      data-testid="root"
      render={<table />}
    >
      {props.grouped ? (
        (['g1', 'g2'] as const).map((group) => (
          <List.Group key={group} value={group} render={<tbody />}>
            <List.GroupHeader data-testid={`header-${group}`} render={<tr />}>
              <td colSpan={3}>{group}</td>
            </List.GroupHeader>
            <List.GroupRows>
              {rows(group === 'g1' ? ['a', 'b'] : ['c', 'd'])}
            </List.GroupRows>
          </List.Group>
        ))
      ) : (
        <tbody>{rows(items)}</tbody>
      )}
    </List.Root>
  )
}

describe('List table mode', () => {
  it('renders table structure and emits no layout styles', () => {
    render(<TableList />)

    const root = screen.getByTestId('root')
    expect(root.tagName).toBe('TABLE')
    expect(root).toHaveAttribute('role', 'listbox')
    expectNoLayoutStyles(root)

    const rows = screen.getAllByRole('option')
    expect(rows).toHaveLength(items.length)
    expect(rows.every((row) => row.tagName === 'TR')).toBe(true)
    expect(rows.every((row) => row.querySelectorAll('td').length === 3)).toBe(
      true,
    )
    expect(
      rows.every(
        (row) =>
          row.querySelector('[data-list-column="check"]')?.tagName === 'TD',
      ),
    ).toBe(true)
  })

  it('supports keyboard navigation, multi-select, escape, and action on table rows', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    const onChange = vi.fn()
    render(<TableList onAction={onAction} onSelectionChange={onChange} />)
    const root = screen.getByTestId('root')
    const rows = screen.getAllByRole('option')
    root.focus()

    await user.keyboard('{ArrowDown}')
    expect(rows[0]).toHaveAttribute('data-keyboard-active', '')
    await user.keyboard('j')
    expect(rows[1]).toHaveAttribute('data-keyboard-active', '')
    await user.keyboard('k')
    expect(rows[0]).toHaveAttribute('data-keyboard-active', '')
    expect(rows[0]).toHaveAttribute('data-selected', '')
    await user.keyboard('x')
    expect(rows[0]).not.toHaveAttribute('data-selected')
    expect(rows[1]).toHaveAttribute('data-keyboard-active', '')
    await user.keyboard('x')
    expect(rows[1]).toHaveAttribute('data-selected', '')
    expect(rows[2]).toHaveAttribute('data-keyboard-active', '')
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    expect(rows[3]).toHaveAttribute('data-selected', '')
    await user.keyboard('{Meta>}a{/Meta}')
    expect(rows.every((row) => row.hasAttribute('data-selected'))).toBe(true)
    await user.keyboard('{Escape}')
    expect(rows.every((row) => !row.hasAttribute('data-selected'))).toBe(true)
    await user.keyboard('{Enter}')
    expect(onAction).toHaveBeenCalledWith(
      'd',
      expect.objectContaining({ method: 'keyboard' }),
    )
    expect(onChange.mock.calls.map((call) => call[1].type)).toEqual([
      'set',
      'set',
      'set',
      'toggle',
      'toggle',
      'range',
      'all',
      'clear',
    ])
  })

  it('supports pointer selection and marks selected runs on table rows', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TableList onSelectionChange={onChange} />)
    const rows = screen.getAllByRole('option')

    await user.click(rows[0]!)
    fireEvent.click(rows[2]!, { shiftKey: true })
    fireEvent.click(rows[1]!, { ctrlKey: true })
    expect(rows[0]).toHaveAttribute('data-first-selected', '')
    expect(rows[2]).toHaveAttribute('data-last-selected', '')
    expect(rows[1]).not.toHaveAttribute('data-selected')
    expect(onChange.mock.calls.map((call) => call[1].type)).toEqual([
      'set',
      'range',
      'toggle',
    ])
  })

  it('uses table rows for roving focus', async () => {
    const user = userEvent.setup()
    render(<TableList />)
    const root = screen.getByTestId('root')
    const rows = screen.getAllByRole('option')
    expect(rows.filter((row) => row.tabIndex === 0)).toHaveLength(1)
    expect(rows[0]).toHaveAttribute('tabindex', '0')
    root.focus()
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(rows[1]).toHaveFocus()
    expect(rows[1]).toHaveAttribute('tabindex', '0')
    expect(root).not.toHaveFocus()
  })

  it('skips group headers and retains selected rows while collapsed', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <TableList
        grouped
        defaultSelectedKeys={['a']}
        selectionFollowsFocus={false}
      />,
    )
    const root = screen.getByTestId('root')
    try {
      root.focus()
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
      expect(screen.getByTestId('row-c')).toHaveAttribute(
        'data-keyboard-active',
        '',
      )
      expect(screen.getByTestId('header-g2')).not.toHaveAttribute(
        'data-keyboard-active',
      )
      await user.keyboard('{ArrowUp}')
      expect(screen.getByTestId('row-b')).toHaveAttribute(
        'data-keyboard-active',
        '',
      )
      expect(screen.getByTestId('header-g1')).not.toHaveAttribute(
        'data-keyboard-active',
      )
      expect(screen.getByTestId('row-a')).toHaveAttribute(
        'aria-selected',
        'true',
      )
      expect(screen.getByTestId('row-b')).toHaveAttribute(
        'aria-selected',
        'false',
      )
      expectNoLayoutStyles(root)
      expect(
        consoleError.mock.calls.filter((call) =>
          call.some(
            (argument) =>
              typeof argument === 'string' &&
              (argument.includes('validateDOMNesting') ||
                argument.includes('cannot appear as a child') ||
                argument.includes('cannot be a child of') ||
                argument.includes('cannot be a descendant of')),
          ),
        ),
      ).toHaveLength(0)
    } finally {
      consoleError.mockRestore()
    }
    await user.click(screen.getByTestId('header-g1'))
    expect(screen.queryByTestId('row-a')).toBeNull()
    expect(screen.getByTestId('header-g1')).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await user.click(screen.getByTestId('header-g1'))
    expect(screen.getByTestId('row-a')).toHaveAttribute('data-selected', '')
  })

  it('renders a spacer as an aria-hidden table row with its height on the row', () => {
    function SpacerExample() {
      const store = List.useStore({ items: [], getKey: (item) => item })
      return (
        <List.Root store={store} layout={false} render={<table />}>
          <tbody>
            <List.Spacer
              height={12}
              data-testid="spacer"
              render={
                <tr>
                  <td colSpan={3}>spacer</td>
                </tr>
              }
            />
          </tbody>
        </List.Root>
      )
    }
    render(<SpacerExample />)
    const spacer = screen.getByTestId('spacer')
    expect(spacer.tagName).toBe('TR')
    expect(spacer).toHaveAttribute('aria-hidden', 'true')
    expect(spacer).toHaveStyle({ height: '12px' })
    expect(spacer.querySelector('td')).toHaveAttribute('colspan', '3')
    expectNoLayoutStyles(spacer.closest('table') as HTMLElement)
  })
})
