import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { List } from './index.js'

const items = ['a1', 'a2', 'b1', 'b2', 'c1']
const groupOf = (item: string) => item[0]

function GroupedList(props: {
  collapsedGroups?: Iterable<string>
  defaultCollapsedGroups?: Iterable<string>
  onCollapsedGroupsChange?: (groups: ReadonlySet<string>) => void
  selectedKeys?: Iterable<string>
  defaultSelectedKeys?: Iterable<string>
  onSelectionChange?: (...args: any[]) => void
  layout?: boolean
  headerClick?: (id: string, store: ReturnType<typeof List.useStore>) => void
}) {
  const store = List.useStore({
    items,
    getKey: (item) => item,
    getGroupId: groupOf,
    collapsedGroups: props.collapsedGroups,
    defaultCollapsedGroups: props.defaultCollapsedGroups,
    onCollapsedGroupsChange: props.onCollapsedGroupsChange,
    selectionMode: 'multiple',
    selectedKeys: props.selectedKeys,
    defaultSelectedKeys: props.defaultSelectedKeys,
    onSelectionChange: props.onSelectionChange,
  })
  return (
    <List.Root store={store} layout={props.layout} data-testid="root">
      <output data-testid="cursor">
        {store.collection.useState('highlightedId') ?? ''}
      </output>
      {(['a', 'b', 'c'] as const).map((id) => (
        <List.Group key={id} value={id} data-testid={`group-${id}`}>
          <List.GroupHeader
            data-testid={`header-${id}`}
            onClick={() => props.headerClick?.(id, store)}
          >
            {id}
          </List.GroupHeader>
          <List.GroupRows>
            {items
              .filter((item) => groupOf(item) === id)
              .map((item) => (
                <List.Row key={item} value={item} data-testid={`row-${item}`}>
                  {item}
                </List.Row>
              ))}
          </List.GroupRows>
        </List.Group>
      ))}
    </List.Root>
  )
}

function EmptyGroupList() {
  const emptyGroupItems = ['a1', 'a2']
  const store = List.useStore({
    items: emptyGroupItems,
    getKey: (item) => item,
    getGroupId: () => '',
  })
  store.collection.useState('filteredItems')
  const groupSize = [...store.collection.context.groups.values()][0]?.size ?? 0
  return (
    <List.Root store={store} data-testid="root">
      <output data-testid="empty-group-size">{groupSize}</output>
      <List.Group value="">
        <List.GroupRows>
          {emptyGroupItems.map((item) => (
            <List.Row key={item} value={item} data-testid={`row-${item}`}>
              {item}
            </List.Row>
          ))}
        </List.GroupRows>
      </List.Group>
    </List.Root>
  )
}

describe('List groups', () => {
  it('renders group, header, row, and positional attributes', () => {
    render(<GroupedList />)
    expect(screen.getByTestId('group-a')).toHaveAttribute(
      'data-bazzaui-list-group',
      '',
    )
    expect(screen.getByTestId('header-a')).toHaveAttribute(
      'data-bazzaui-list-group-header',
      '',
    )
    expect(screen.getByTestId('row-a1')).toHaveAttribute(
      'data-first-in-group',
      '',
    )
    expect(screen.getByTestId('row-a2')).toHaveAttribute(
      'data-last-in-group',
      '',
    )
  })

  it('supports an empty public group id for collection registration', () => {
    render(<EmptyGroupList />)
    expect(screen.getByTestId('row-a1')).toHaveAttribute(
      'data-first-in-group',
      '',
    )
    expect(screen.getByTestId('row-a1')).not.toHaveAttribute(
      'data-last-in-group',
    )
    expect(screen.getByTestId('row-a2')).toHaveAttribute(
      'data-last-in-group',
      '',
    )
    expect(screen.getByTestId('row-a2')).not.toHaveAttribute(
      'data-first-in-group',
    )
    expect(screen.getByTestId('empty-group-size')).toHaveTextContent('2')
  })

  it('moves across group boundaries without activating headers', async () => {
    const user = userEvent.setup()
    render(<GroupedList />)
    const root = screen.getByTestId('root')
    root.focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByTestId('row-a1')).toHaveAttribute(
      'data-keyboard-active',
      '',
    )
    await user.keyboard('{ArrowDown}')
    expect(screen.getByTestId('row-a2')).toHaveAttribute(
      'data-keyboard-active',
      '',
    )
    await user.keyboard('{ArrowDown}')
    expect(screen.getByTestId('row-b1')).toHaveAttribute(
      'data-keyboard-active',
      '',
    )
    for (const id of ['a', 'b', 'c']) {
      expect(screen.getByTestId(`header-${id}`)).not.toHaveAttribute(
        'data-keyboard-active',
      )
      expect(screen.getByTestId(`header-${id}`)).not.toHaveAttribute('tabindex')
    }
  })

  it('toggles aria-expanded and data-collapsed', async () => {
    const user = userEvent.setup()
    render(<GroupedList />)
    const header = screen.getByTestId('header-a')
    await user.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByTestId('group-a')).toHaveAttribute('data-collapsed', '')
  })

  it('unmounts collapsed selected rows without pruning and restores them on expansion', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <GroupedList defaultSelectedKeys={['a1']} onSelectionChange={onChange} />,
    )
    await user.click(screen.getByTestId('header-a'))
    expect(screen.queryByTestId('row-a1')).toBeNull()
    expect(onChange).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: 'prune' }),
    )
    await user.click(screen.getByTestId('header-a'))
    expect(screen.getByTestId('row-a1')).toHaveAttribute('data-selected', '')
  })

  it('selects hidden keys in a shift-click range', () => {
    const onChange = vi.fn()
    render(
      <GroupedList
        defaultCollapsedGroups={['b']}
        onSelectionChange={onChange}
      />,
    )
    fireEvent.click(screen.getByTestId('row-a1'))
    fireEvent.click(screen.getByTestId('row-c1'), { shiftKey: true })
    expect([...onChange.mock.calls.at(-1)![0]]).toEqual(items)
  })

  it('marks visible edges for runs separated by hidden selected rows', () => {
    render(
      <GroupedList
        defaultCollapsedGroups={['b']}
        defaultSelectedKeys={['a2', 'b1', 'b2', 'c1']}
      />,
    )
    expect(screen.getByTestId('row-a2')).toHaveAttribute(
      'data-first-selected',
      '',
    )
    expect(screen.getByTestId('row-a2')).not.toHaveAttribute(
      'data-last-selected',
    )
    expect(screen.getByTestId('row-c1')).toHaveAttribute(
      'data-last-selected',
      '',
    )
    expect(screen.getByTestId('row-c1')).not.toHaveAttribute(
      'data-first-selected',
    )
  })

  it('preserves the keyboard cursor for another group but clears it for its own group', async () => {
    const user = userEvent.setup()
    render(<GroupedList />)
    const root = screen.getByTestId('root')
    root.focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByTestId('cursor')).toHaveTextContent('a1')
    await user.click(screen.getByTestId('header-b'))
    expect(screen.getByTestId('cursor')).toHaveTextContent('a1')
    expect(screen.getByTestId('row-a1')).toHaveAttribute(
      'data-keyboard-active',
      '',
    )
    await user.click(screen.getByTestId('header-a'))
    expect(screen.getByTestId('cursor')).toHaveTextContent('')
    expect(screen.getByTestId('group-a')).toHaveAttribute('data-collapsed', '')
  })

  it('does not add a DOM wrapper for GroupRows', () => {
    render(<GroupedList />)
    expect(screen.getByTestId('row-a1').parentElement).toBe(
      screen.getByTestId('group-a'),
    )
  })

  it('does not warn about an unregistered ListboxStore group during collapse', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      render(<GroupedList />)
      await userEvent.setup().click(screen.getByTestId('header-a'))
      expect(warn.mock.calls.flat().join(' ')).not.toContain('not registered')
    } finally {
      warn.mockRestore()
    }
  })

  it('applies layout defaults only through Root context', () => {
    const { rerender } = render(<GroupedList layout />)
    expect(screen.getByTestId('group-a')).toHaveStyle({ display: 'contents' })
    expect(screen.getByTestId('header-a')).toHaveStyle({ position: 'sticky' })
    rerender(<GroupedList layout={false} />)
    expect(screen.getByTestId('group-a')).not.toHaveStyle({
      display: 'contents',
    })
    expect(screen.getByTestId('header-a')).not.toHaveStyle({
      position: 'sticky',
    })
  })

  it('waits for a controlled prop update before changing the UI', async () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <GroupedList
        collapsedGroups={new Set()}
        onCollapsedGroupsChange={onChange}
      />,
    )
    await userEvent.setup().click(screen.getByTestId('header-a'))
    expect(onChange).toHaveBeenCalledWith(new Set(['a']))
    expect(screen.getByTestId('header-a')).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    rerender(
      <GroupedList
        collapsedGroups={new Set(['a'])}
        onCollapsedGroupsChange={onChange}
      />,
    )
    expect(screen.getByTestId('header-a')).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('updates controlled collapse state for a stable iterable', () => {
    const collapsedGroups = new Set<string>()
    const { rerender } = render(
      <GroupedList collapsedGroups={collapsedGroups} />,
    )
    collapsedGroups.add('a')
    rerender(<GroupedList collapsedGroups={collapsedGroups} />)
    expect(screen.getByTestId('header-a')).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('gives the first enabled visible row the initial roving tab stop', () => {
    render(<GroupedList defaultCollapsedGroups={['a']} />)
    expect(screen.getByTestId('row-b1')).toHaveAttribute('tabindex', '0')
  })

  it('composes a consumer header operation with the internal toggle in controlled mode', async () => {
    const onChange = vi.fn()
    render(
      <GroupedList
        collapsedGroups={new Set()}
        onCollapsedGroupsChange={onChange}
        headerClick={(id, store) => {
          if (id === 'a') store.setGroupCollapsed('b', true)
        }}
      />,
    )
    await userEvent.setup().click(screen.getByTestId('header-a'))
    expect(onChange).toHaveBeenLastCalledWith(new Set(['a', 'b']))
  })

  it('resets controlled pending collapse state between interactions', async () => {
    const onChange = vi.fn()
    render(
      <GroupedList
        collapsedGroups={new Set()}
        onCollapsedGroupsChange={onChange}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByTestId('header-a'))
    await user.click(screen.getByTestId('header-a'))
    expect(onChange).toHaveBeenLastCalledWith(new Set(['a']))
  })
})
