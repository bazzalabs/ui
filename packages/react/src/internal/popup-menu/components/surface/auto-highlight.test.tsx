import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import { Select } from '../../../../select/index.js'

// A string `autoHighlightFirst` highlights its row when the menu opens and
// when it changes. A re-render that changes another setting (a new
// `onHighlightChange`, a new `items` array) leaves the highlight where the
// user moved it.

const VALUES = ['apple', 'banana', 'cherry']

const highlighted = () =>
  document.querySelector('[data-highlighted]')?.getAttribute('data-testid')

function Menu({
  autoHighlightFirst = 'banana',
  rootProps,
  values = VALUES,
  keepMounted = false,
}: {
  autoHighlightFirst?: string
  rootProps?: Partial<DropdownMenu.Root.Props>
  values?: readonly string[]
  keepMounted?: boolean
}) {
  return (
    <DropdownMenu.Root defaultOpen {...rootProps}>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal keepMounted={keepMounted}>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface autoHighlightFirst={autoHighlightFirst}>
              <DropdownMenu.List data-testid="list">
                {values.map((value) => (
                  <DropdownMenu.Item
                    key={value}
                    value={value}
                    data-testid={value}
                  >
                    {value}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/** Opens on `banana`, then moves the highlight to `cherry`. */
async function moveOffTheOpeningRow(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())
  await waitFor(() => expect(highlighted()).toBe('banana'))
  await user.keyboard('{ArrowDown}')
  expect(highlighted()).toBe('cherry')
}

describe('a string autoHighlightFirst', () => {
  it('keeps a moved highlight when the root gets a new onHighlightChange', async () => {
    const user = userEvent.setup()
    // A new function on every render, as an inline prop is.
    const props = () => ({ onHighlightChange: () => {} })
    const { rerender } = render(<Menu rootProps={props()} />)
    await moveOffTheOpeningRow(user)

    rerender(<Menu rootProps={props()} />)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(highlighted()).toBe('cherry')
  })

  it('keeps a moved highlight when a virtualized root gets a new items array', async () => {
    const user = userEvent.setup()
    const props = () => ({
      virtualized: true,
      items: VALUES.map((value) => ({ value })),
    })
    const { rerender } = render(<Menu rootProps={props()} />)
    await moveOffTheOpeningRow(user)

    rerender(<Menu rootProps={props()} />)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(highlighted()).toBe('cherry')
  })

  it('applies again when it changes while open', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Menu />)
    await moveOffTheOpeningRow(user)

    rerender(<Menu autoHighlightFirst="apple" />)
    await waitFor(() => expect(highlighted()).toBe('apple'))
  })

  it('applies when its rows register after the menu opened', async () => {
    const props = () => ({ onHighlightChange: () => {} })
    const { rerender } = render(<Menu rootProps={props()} values={[]} />)
    await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())

    rerender(<Menu rootProps={props()} />)
    await waitFor(() => expect(highlighted()).toBe('banana'))
  })

  it("doesn't take a highlight the user moved when its row arrives later", async () => {
    const user = userEvent.setup()
    const props = () => ({ onHighlightChange: () => {} })
    const { rerender } = render(
      <Menu rootProps={props()} values={['apple', 'cherry']} />,
    )
    await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())
    // `banana` isn't there yet, so the first row has the highlight.
    await waitFor(() => expect(highlighted()).toBe('apple'))
    await user.keyboard('{ArrowDown}')
    expect(highlighted()).toBe('cherry')

    rerender(<Menu rootProps={props()} />)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(highlighted()).toBe('cherry')
  })

  it('applies again when a kept-mounted menu opens again', async () => {
    const user = userEvent.setup()
    // A controlled `open`, as an app that re-renders with it, and an inline
    // callback.
    const menu = (open: boolean) => (
      <Menu keepMounted rootProps={{ open, onHighlightChange: () => {} }} />
    )
    const { rerender } = render(menu(true))
    await moveOffTheOpeningRow(user)

    rerender(menu(false))
    rerender(menu(true))
    await waitFor(() => expect(highlighted()).toBe('banana'))
  })

  it('applies again when the menu opens again', async () => {
    const user = userEvent.setup()
    render(<Menu />)
    await moveOffTheOpeningRow(user)

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByTestId('list')).toBeNull())
    await user.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(highlighted()).toBe('banana'))
  })
})

function DataMenu({ values }: { values: readonly string[] }) {
  const content = values.map((value) => ({
    kind: 'item' as const,
    id: value,
    value,
    render: ({ props }: { props: object }) => (
      <DropdownMenu.Item {...props} data-testid={value}>
        {value}
      </DropdownMenu.Item>
    ),
  }))
  return (
    <DropdownMenu.Root defaultOpen onHighlightChange={() => {}}>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface content={content} autoHighlightFirst="banana">
              <DropdownMenu.List data-testid="list">
                <DataRows />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function DataRows() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

describe('a string autoHighlightFirst on a data-first list', () => {
  it('applies when its rows arrive after the menu opened', async () => {
    const { rerender } = render(<DataMenu values={[]} />)
    await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())

    rerender(<DataMenu values={VALUES} />)
    await waitFor(() => expect(highlighted()).toBe('banana'))
  })
})

function SubpageMenu({ onHighlightChange }: { onHighlightChange: () => void }) {
  return (
    <DropdownMenu.Root defaultOpen onHighlightChange={onHighlightChange}>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List data-testid="root-list">
                <DropdownMenu.SubpageTrigger targetPageId="page">
                  Page
                </DropdownMenu.SubpageTrigger>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
            <DropdownMenu.Subpage pageId="page">
              <DropdownMenu.Surface autoHighlightFirst="banana">
                <DropdownMenu.List data-testid="page-list">
                  {VALUES.map((value) => (
                    <DropdownMenu.Item
                      key={value}
                      value={value}
                      data-testid={value}
                    >
                      {value}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Subpage>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

describe('a string autoHighlightFirst in a subpage', () => {
  it('highlights its row when the subpage opens', async () => {
    const user = userEvent.setup()
    render(<SubpageMenu onHighlightChange={() => {}} />)
    await waitFor(() => expect(screen.getByTestId('root-list')).toHaveFocus())
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByTestId('page-list')).toHaveFocus())
    await waitFor(() => expect(highlighted()).toBe('banana'))
  })

  it('keeps a moved highlight when the root gets a new onHighlightChange', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<SubpageMenu onHighlightChange={() => {}} />)
    await waitFor(() => expect(screen.getByTestId('root-list')).toHaveFocus())
    await user.keyboard('{Enter}')
    // The subpage is the active page: its list takes the focus.
    await waitFor(() => expect(screen.getByTestId('page-list')).toHaveFocus())
    await user.keyboard('{End}')
    expect(highlighted()).toBe('cherry')

    rerender(<SubpageMenu onHighlightChange={() => {}} />)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(highlighted()).toBe('cherry')
  })
})

function FruitSelect({
  virtualItems,
  defaultValue = 'banana',
  rowsFromItems = false,
}: {
  virtualItems: NonNullable<Select.Root.Props['virtualItems']>
  defaultValue?: string
  /** Mount only the items' rows, as a virtualizer does. */
  rowsFromItems?: boolean
}) {
  const rows = rowsFromItems ? virtualItems.map((item) => item.value) : VALUES
  return (
    <Select.Root
      defaultOpen
      defaultValue={defaultValue}
      virtualized
      virtualItems={virtualItems}
    >
      <Select.Trigger data-testid="trigger">
        <Select.Value />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner alignItemWithTrigger={false}>
          <Select.Popup>
            <Select.Surface autoHighlightFirst="selected">
              <Select.List data-testid="list">
                {rows.map((value) => (
                  <Select.Item key={value} value={value} data-testid={value}>
                    {value}
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Surface>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

describe('a Select highlighting its selected value', () => {
  afterEach(() => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView
  })

  it('highlights it, scrolled into view, when its items arrive after it opened', async () => {
    // jsdom has no scrollIntoView: record what the menu scrolls to.
    const scrolled: Element[] = []
    HTMLElement.prototype.scrollIntoView = vi.fn(function (this: Element) {
      scrolled.push(this)
    })
    const { rerender } = render(
      <FruitSelect defaultValue="cherry" virtualItems={[]} rowsFromItems />,
    )
    await waitFor(() => expect(screen.getByTestId('list')).toBeInTheDocument())

    rerender(
      <FruitSelect
        defaultValue="cherry"
        virtualItems={VALUES.map((value) => ({ value }))}
        rowsFromItems
      />,
    )
    await waitFor(() => expect(highlighted()).toBe('cherry'))
    await waitFor(() =>
      expect(scrolled).toContain(screen.getByTestId('cherry')),
    )
  })

  it('highlights it when its items replace a placeholder row', async () => {
    const { rerender } = render(
      <FruitSelect
        defaultValue="cherry"
        virtualItems={[{ value: 'loading' }]}
        rowsFromItems
      />,
    )
    await waitFor(() => expect(highlighted()).toBe('loading'))

    rerender(
      <FruitSelect
        defaultValue="cherry"
        virtualItems={VALUES.map((value) => ({ value }))}
        rowsFromItems
      />,
    )
    await waitFor(() => expect(highlighted()).toBe('cherry'))
  })

  it('opens on the first row once its value is cleared while closed', async () => {
    const user = userEvent.setup()
    const scrolled: Element[] = []
    HTMLElement.prototype.scrollIntoView = vi.fn(function (this: Element) {
      scrolled.push(this)
    })
    const highlights: (string | null)[] = []
    const onHighlightChange = (id: string | null) => {
      highlights.push(id)
    }
    const select = (value: string | null) => (
      <Select.Root
        value={value}
        virtualized
        virtualItems={VALUES.map((v) => ({ value: v }))}
        onHighlightChange={onHighlightChange}
      >
        <Select.Trigger data-testid="trigger">
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner alignItemWithTrigger={false}>
            <Select.Popup>
              <Select.Surface autoHighlightFirst="selected">
                <Select.List data-testid="list">
                  {VALUES.map((v) => (
                    <Select.Item key={v} value={v} data-testid={v}>
                      {v}
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Surface>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    )
    const { rerender } = render(select('cherry'))
    await user.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(highlighted()).toBe('cherry'))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByTestId('list')).toBeNull())

    rerender(select(null))
    scrolled.length = 0
    highlights.length = 0
    await user.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(highlighted()).toBe('apple'))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(highlighted()).toBe('apple')
    expect(highlights).not.toContain('cherry')
    expect(scrolled).not.toContain(screen.getByTestId('cherry'))
  })

  it('keeps a moved highlight when it gets a new virtualItems array', async () => {
    const user = userEvent.setup()
    const items = () => VALUES.map((value) => ({ value }))
    const { rerender } = render(<FruitSelect virtualItems={items()} />)
    await moveOffTheOpeningRow(user)

    rerender(<FruitSelect virtualItems={items()} />)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(highlighted()).toBe('cherry')
  })
})
