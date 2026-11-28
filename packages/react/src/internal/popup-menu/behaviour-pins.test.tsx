import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'

// Characterization tests: each one pins what the menu family does today, read
// through the DOM, ARIA and public callbacks, so an engine rewrite that changes
// any of it fails here. A comment marks the pins that look like bugs.

type Spy = ReturnType<typeof vi.fn>

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function openChangeCalls(spy: Spy) {
  return spy.mock.calls.map(([open, details]) => [
    open,
    details.reason,
    details.event.type,
  ])
}

function checkedChangeCalls(spy: Spy) {
  return spy.mock.calls.map(([checked, details]) => [
    checked,
    details.reason,
    details.event.type,
  ])
}

function highlightChangeCalls(spy: Spy) {
  return spy.mock.calls.map(([id, node, index, details]) => [
    id,
    node?.id ?? null,
    index,
    details.reason,
    details.index,
  ])
}

function highlightedTestIds() {
  return Array.from(document.querySelectorAll('[data-highlighted]')).map(
    (element) => element.getAttribute('data-testid'),
  )
}

function Menu({
  children,
  beforeList,
  surfaceProps,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Root> & {
  beforeList?: React.ReactNode
  surfaceProps?: DropdownMenu.Surface.Props
}) {
  return (
    <DropdownMenu.Root {...props}>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup">
            <DropdownMenu.Surface {...surfaceProps}>
              {beforeList}
              <DropdownMenu.List data-testid="list">
                {children}
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

describe('aria-activedescendant points at the value id (design §0.1)', () => {
  it('JSX rows: the Input names the highlighted row by its value, and the List carries none', async () => {
    const user = userEvent.setup()
    render(
      <Menu defaultOpen beforeList={<DropdownMenu.Input data-testid="input" />}>
        <DropdownMenu.Item data-testid="apple" value="apple">
          Apple
        </DropdownMenu.Item>
        <DropdownMenu.Item data-testid="banana" value="banana">
          Banana
        </DropdownMenu.Item>
      </Menu>,
    )
    const input = screen.getByTestId('input')
    await waitFor(() => expect(input).toHaveFocus())

    expect(input).toHaveAttribute('aria-activedescendant', 'apple')
    expect(screen.getByTestId('list')).not.toHaveAttribute(
      'aria-activedescendant',
    )

    await user.keyboard('{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant', 'banana')

    // Suspected bug: a JSX row's DOM id is generated (`item-…`), so the value
    // id that aria-activedescendant names matches no element.
    expect(screen.getByTestId('banana').id).toMatch(/^item-/)
    expect(document.getElementById('banana')).toBeNull()
  })

  it('JSX rows without an Input: the List names the row, falling back to its text for a row with no value', async () => {
    const user = userEvent.setup()
    render(
      <Menu defaultOpen>
        <DropdownMenu.Item value="apple">Apple</DropdownMenu.Item>
        <DropdownMenu.Item>Banana Split</DropdownMenu.Item>
      </Menu>,
    )
    const list = screen.getByTestId('list')
    await waitFor(() => expect(list).toHaveFocus())

    expect(list).toHaveAttribute('aria-activedescendant', 'apple')
    await user.keyboard('{ArrowDown}')
    expect(list).toHaveAttribute('aria-activedescendant', 'Banana Split')
  })

  it('data-first rows: the List names the Resolved ID, which is also the row element id', async () => {
    const user = userEvent.setup()
    const content: DropdownMenu.NodeDef[] = [
      {
        kind: 'item',
        value: 'Apple',
        render: ({ props }) => (
          <DropdownMenu.Item {...props} data-testid="apple">
            Apple
          </DropdownMenu.Item>
        ),
      },
      {
        kind: 'item',
        id: 'b-id',
        value: 'Banana',
        render: ({ props }) => (
          <DropdownMenu.Item {...props} data-testid="banana">
            Banana
          </DropdownMenu.Item>
        ),
      },
    ]
    render(
      <Menu defaultOpen surfaceProps={{ content }}>
        <DataRows />
      </Menu>,
    )
    const list = screen.getByTestId('list')
    await waitFor(() => expect(list).toHaveFocus())

    expect(list).toHaveAttribute('aria-activedescendant', 'apple')
    expect(screen.getByTestId('apple')).toHaveAttribute('id', 'apple')

    await user.keyboard('{ArrowDown}')
    expect(list).toHaveAttribute('aria-activedescendant', 'b-id')
    expect(screen.getByTestId('banana')).toHaveAttribute('id', 'b-id')
  })
})

describe('Home and End report highlight changes', () => {
  function HomeEndMenu({ onHighlightChange }: { onHighlightChange: Spy }) {
    return (
      <Menu defaultOpen onHighlightChange={onHighlightChange}>
        <DropdownMenu.Item value="a">A</DropdownMenu.Item>
        <DropdownMenu.Item value="b">B</DropdownMenu.Item>
        <DropdownMenu.Item value="c">C</DropdownMenu.Item>
      </Menu>
    )
  }

  it('reports a cleared highlight (reason pointer), then the target row (reason keyboard), on every press', async () => {
    const user = userEvent.setup()
    const onHighlightChange = vi.fn()
    render(<HomeEndMenu onHighlightChange={onHighlightChange} />)
    await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())

    // The first row's highlight on open is not reported.
    expect(onHighlightChange).not.toHaveBeenCalled()

    // Suspected bug: each Home/End first reports a null highlight with reason
    // 'pointer' before reporting the row it lands on.
    await user.keyboard('{End}')
    expect(highlightChangeCalls(onHighlightChange)).toEqual([
      [null, null, -1, 'pointer', -1],
      ['c', null, 2, 'keyboard', 2],
    ])

    onHighlightChange.mockClear()
    await user.keyboard('{End}')
    expect(highlightChangeCalls(onHighlightChange)).toEqual([
      [null, null, -1, 'pointer', -1],
      ['c', null, 2, 'keyboard', 2],
    ])

    onHighlightChange.mockClear()
    await user.keyboard('{Home}')
    expect(highlightChangeCalls(onHighlightChange)).toEqual([
      [null, null, -1, 'pointer', -1],
      ['a', null, 0, 'keyboard', 0],
    ])
  })
})

describe('subpage Back', () => {
  function SubpageMenu({
    onOpenChange,
    onHighlightChange,
    closeRootOnEsc,
    pageInput = false,
  }: {
    onOpenChange: Spy
    onHighlightChange: Spy
    closeRootOnEsc?: boolean
    pageInput?: boolean
  }) {
    return (
      <DropdownMenu.Root
        onOpenChange={onOpenChange}
        onHighlightChange={onHighlightChange}
      >
        <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup data-testid="popup">
              <DropdownMenu.Surface data-testid="root-surface">
                <DropdownMenu.List data-testid="root-list">
                  <DropdownMenu.Item data-testid="first" value="first">
                    First
                  </DropdownMenu.Item>
                  <DropdownMenu.SubpageTrigger
                    data-testid="page-trigger"
                    value="page-trigger"
                    targetPageId="page"
                  >
                    Page
                  </DropdownMenu.SubpageTrigger>
                  <DropdownMenu.Item data-testid="last" value="last">
                    Last
                  </DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
              <DropdownMenu.Subpage
                pageId="page"
                closeRootOnEsc={closeRootOnEsc}
              >
                <DropdownMenu.Surface data-testid="page-surface">
                  {pageInput ? (
                    <DropdownMenu.Input
                      data-testid="page-input"
                      backspaceGoesBack
                    />
                  ) : null}
                  <DropdownMenu.SubpageBack data-testid="back">
                    Back
                  </DropdownMenu.SubpageBack>
                  <DropdownMenu.List data-testid="page-list">
                    <DropdownMenu.SubpageBackItem
                      data-testid="back-item"
                      value="back-item"
                    >
                      Back item
                    </DropdownMenu.SubpageBackItem>
                    <DropdownMenu.Item
                      data-testid="page-item"
                      value="page-item"
                    >
                      Page item
                    </DropdownMenu.Item>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Subpage>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  type User = ReturnType<typeof userEvent.setup>

  async function renderInSubpage(
    props: Partial<React.ComponentProps<typeof SubpageMenu>> = {},
  ) {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onHighlightChange = vi.fn()
    render(
      <SubpageMenu
        onOpenChange={onOpenChange}
        onHighlightChange={onHighlightChange}
        {...props}
      />,
    )
    await user.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(screen.getByTestId('root-list')).toHaveFocus())
    await user.keyboard('{ArrowDown}')
    expect(highlightedTestIds()).toEqual(['page-trigger'])
    await user.keyboard('{Enter}')
    const pageFocus = props.pageInput ? 'page-input' : 'page-list'
    await waitFor(() => expect(screen.getByTestId(pageFocus)).toHaveFocus())
    expect(openChangeCalls(onOpenChange)).toEqual([
      [true, 'trigger-press', 'click'],
    ])
    onOpenChange.mockClear()
    onHighlightChange.mockClear()
    return { user, onOpenChange, onHighlightChange }
  }

  it('highlights the subpage first row on entry', async () => {
    await renderInSubpage()

    expect(highlightedTestIds()).toEqual(['back-item'])
  })

  it.each([
    ['ArrowLeft', {}, (user: User) => user.keyboard('{ArrowLeft}')],
    ['Ctrl+H', {}, (user: User) => user.keyboard('{Control>}h{/Control}')],
    ['Escape', {}, (user: User) => user.keyboard('{Escape}')],
    [
      'Backspace in an empty Input',
      { pageInput: true },
      (user: User) => user.keyboard('{Backspace}'),
    ],
    ['SubpageBack', {}, (user: User) => user.click(screen.getByTestId('back'))],
    [
      'SubpageBackItem',
      {},
      (user: User) => user.click(screen.getByTestId('back-item')),
    ],
  ] as const)('%s returns to the parent page with its first row highlighted, unreported', async (_name, props, goBack) => {
    const { user, onOpenChange, onHighlightChange } =
      await renderInSubpage(props)

    await goBack(user)
    await waitFor(() => expect(screen.getByTestId('root-list')).toHaveFocus())
    await sleep(30)

    // Suspected bug: Back lands on the parent page's first row, not on the
    // SubpageTrigger the user came through.
    expect(highlightedTestIds()).toEqual(['first'])
    expect(screen.queryByTestId('page-surface')).not.toBeInTheDocument()
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(onHighlightChange).not.toHaveBeenCalled()
  })

  it('Escape with closeRootOnEsc closes the whole menu, which the root reports as item-press', async () => {
    const { user, onOpenChange, onHighlightChange } = await renderInSubpage({
      closeRootOnEsc: true,
    })

    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    await sleep(30)

    // Suspected bug: an Escape close reaches the root as 'item-press', not
    // 'escape-key'.
    expect(openChangeCalls(onOpenChange)).toEqual([
      [false, 'item-press', 'ui-event'],
    ])
    expect(onHighlightChange).not.toHaveBeenCalled()
    expect(screen.getByTestId('trigger')).toHaveFocus()
  })
})

describe('Escape in a submenu', () => {
  function SubmenuMenu({
    onRootOpenChange,
    onSubmenuOpenChange,
    closeRootOnEsc,
  }: {
    onRootOpenChange: Spy
    onSubmenuOpenChange: Spy
    closeRootOnEsc?: boolean
  }) {
    return (
      <DropdownMenu.Root onOpenChange={onRootOpenChange}>
        <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup data-testid="root-popup">
              <DropdownMenu.Surface>
                <DropdownMenu.List data-testid="root-list">
                  <DropdownMenu.Item data-testid="first" value="first">
                    First
                  </DropdownMenu.Item>
                  <DropdownMenu.Submenu
                    onOpenChange={onSubmenuOpenChange}
                    closeRootOnEsc={closeRootOnEsc}
                  >
                    <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger">
                      More
                    </DropdownMenu.SubmenuTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Positioner>
                        <DropdownMenu.Popup data-testid="submenu-popup">
                          <DropdownMenu.Surface>
                            <DropdownMenu.List data-testid="submenu-list">
                              <DropdownMenu.Item value="nested">
                                Nested
                              </DropdownMenu.Item>
                            </DropdownMenu.List>
                          </DropdownMenu.Surface>
                        </DropdownMenu.Popup>
                      </DropdownMenu.Positioner>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Submenu>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  async function openSubmenuByKeyboard(
    user: ReturnType<typeof userEvent.setup>,
  ) {
    await user.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(screen.getByTestId('root-list')).toHaveFocus())
    await user.keyboard('{ArrowDown}')
    expect(highlightedTestIds()).toEqual(['submenu-trigger'])
    await user.keyboard('{ArrowRight}')
    await waitFor(() =>
      expect(screen.getByTestId('submenu-list')).toHaveFocus(),
    )
  }

  it('closes the whole tree by default, which the root reports as item-press', async () => {
    const user = userEvent.setup()
    const onRootOpenChange = vi.fn()
    const onSubmenuOpenChange = vi.fn()
    render(
      <SubmenuMenu
        onRootOpenChange={onRootOpenChange}
        onSubmenuOpenChange={onSubmenuOpenChange}
      />,
    )
    await openSubmenuByKeyboard(user)
    expect(openChangeCalls(onRootOpenChange)).toEqual([
      [true, 'trigger-press', 'click'],
    ])
    onRootOpenChange.mockClear()

    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByTestId('root-popup')).not.toBeInTheDocument(),
    )
    await sleep(30)

    // Suspected bug: an Escape close reaches the root as 'item-press', not
    // 'escape-key'.
    expect(openChangeCalls(onRootOpenChange)).toEqual([
      [false, 'item-press', 'ui-event'],
    ])
    // The submenu reports every change with its reason (design §8): the
    // ArrowRight open, and the tree closing it for the Escape.
    expect(openChangeCalls(onSubmenuOpenChange)).toEqual([
      [true, 'list-navigation', 'ui-event'],
      [false, 'escape-key', 'keydown'],
    ])
    expect(screen.queryByTestId('submenu-popup')).not.toBeInTheDocument()
    expect(screen.getByTestId('trigger')).toHaveFocus()
  })

  it('closes only the submenu with closeRootOnEsc={false}, which only the submenu reports', async () => {
    const user = userEvent.setup()
    const onRootOpenChange = vi.fn()
    const onSubmenuOpenChange = vi.fn()
    render(
      <SubmenuMenu
        onRootOpenChange={onRootOpenChange}
        onSubmenuOpenChange={onSubmenuOpenChange}
        closeRootOnEsc={false}
      />,
    )
    await openSubmenuByKeyboard(user)
    onRootOpenChange.mockClear()

    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByTestId('submenu-popup')).not.toBeInTheDocument(),
    )
    await sleep(30)

    expect(onRootOpenChange).not.toHaveBeenCalled()
    // The submenu reports every change with its reason (design §8): the
    // ArrowRight open and the Escape close.
    expect(openChangeCalls(onSubmenuOpenChange)).toEqual([
      [true, 'list-navigation', 'ui-event'],
      [false, 'escape-key', 'keydown'],
    ])
    expect(screen.getByTestId('root-popup')).toBeInTheDocument()
    expect(screen.getByTestId('root-list')).toHaveFocus()
    expect(highlightedTestIds()).toEqual(['submenu-trigger'])
  })
})

describe('onOpenChangeComplete for a menu that starts open', () => {
  it('reports true on mount without an onOpenChange, then false once closed', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onOpenChangeComplete = vi.fn()
    render(
      <Menu
        defaultOpen
        onOpenChange={onOpenChange}
        onOpenChangeComplete={onOpenChangeComplete}
      >
        <DropdownMenu.Item value="a">A</DropdownMenu.Item>
      </Menu>,
    )
    await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())
    await sleep(30)

    expect(onOpenChangeComplete.mock.calls).toEqual([[true]])
    expect(onOpenChange).not.toHaveBeenCalled()

    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    await sleep(30)

    expect(onOpenChangeComplete.mock.calls).toEqual([[true], [false]])
    expect(openChangeCalls(onOpenChange)).toEqual([
      [false, 'escape-key', 'keydown'],
    ])
  })
})

describe('consumer preventDefault() in a CheckboxItem onPointerDown', () => {
  it('still starts a drag selection, which commits on release', async () => {
    const user = userEvent.setup()
    const spies = [vi.fn(), vi.fn(), vi.fn()]
    const onPointerDown = vi.fn((event: React.PointerEvent) =>
      event.preventDefault(),
    )
    render(
      <Menu dragSelection="keep">
        {(['a', 'b', 'c'] as const).map((name, index) => (
          <DropdownMenu.CheckboxItem
            key={name}
            data-testid={`cb-${name}`}
            onCheckedChange={spies[index]}
            onPointerDown={onPointerDown}
          >
            {name}
          </DropdownMenu.CheckboxItem>
        ))}
      </Menu>,
    )
    await user.click(screen.getByTestId('trigger'))
    const list = screen.getByTestId('list')
    const rect = (top: number, height: number) => ({
      top,
      bottom: top + height,
      left: 0,
      right: 100,
      width: 100,
      height,
      x: 0,
      y: top,
      toJSON: () => ({}),
    })
    Object.defineProperty(list, 'getBoundingClientRect', {
      configurable: true,
      value: () => rect(0, 1000),
    })
    for (const [index, name] of ['a', 'b', 'c'].entries()) {
      Object.defineProperty(
        screen.getByTestId(`cb-${name}`),
        'getBoundingClientRect',
        { configurable: true, value: () => rect(index * 32, 32) },
      )
    }

    fireEvent.pointerDown(screen.getByTestId('cb-a'), {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      clientY: 16,
    })
    expect(onPointerDown).toHaveBeenCalledTimes(1)
    expect(onPointerDown.mock.calls[0]?.[0].defaultPrevented).toBe(true)

    fireEvent.pointerMove(document, { pointerId: 1, clientY: 80 })
    for (const name of ['a', 'b', 'c']) {
      expect(screen.getByTestId(`cb-${name}`)).toHaveAttribute('data-pending')
    }

    fireEvent.pointerUp(document, { pointerId: 1, clientY: 80 })
    fireEvent.click(screen.getByTestId('cb-a'))
    expect(spies.map(checkedChangeCalls)).toEqual([
      [[true, 'drag-selection', 'pointerup']],
      [[true, 'drag-selection', 'pointerup']],
      [[true, 'drag-selection', 'pointerup']],
    ])
  })
})

describe('closing the root menu', () => {
  it.each([
    [
      'outside press',
      (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByTestId('outside')),
      [false, 'outside-press', 'pointerdown'],
    ],
    [
      'item press',
      (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByTestId('item')),
      [false, 'item-press', 'ui-event'],
    ],
    [
      'Escape',
      (user: ReturnType<typeof userEvent.setup>) => user.keyboard('{Escape}'),
      [false, 'escape-key', 'keydown'],
    ],
  ] as const)('%s reports one close with its reason and returns focus to the trigger', async (_name, close, expected) => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onOpenChangeComplete = vi.fn()
    render(
      <>
        <button type="button" data-testid="outside">
          Outside
        </button>
        <Menu
          onOpenChange={onOpenChange}
          onOpenChangeComplete={onOpenChangeComplete}
        >
          <DropdownMenu.Item data-testid="item" value="a">
            A
          </DropdownMenu.Item>
        </Menu>
      </>,
    )
    await user.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())
    expect(openChangeCalls(onOpenChange)).toEqual([
      [true, 'trigger-press', 'click'],
    ])
    onOpenChange.mockClear()

    await close(user)
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    await sleep(30)

    expect(openChangeCalls(onOpenChange)).toEqual([expected])
    expect(onOpenChangeComplete.mock.calls).toEqual([[true], [false]])
    expect(screen.getByTestId('trigger')).toHaveFocus()
  })
})
