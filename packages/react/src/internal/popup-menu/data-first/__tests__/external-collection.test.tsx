import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import { useSurfaceContext } from '../../../listbox/index.js'
import type { DisplayNode, NodeDef } from '../types.js'

// A data-first list hands the store its row Collection, and its rows bind
// instead of registering. These pin what rows used to get from registering:
// groups, virtualized lists, JSX rows next to data rows, and the part's own
// props.

function item(value: string, extra: Partial<NodeDef> = {}): NodeDef {
  return {
    kind: 'item',
    value,
    render: ({ props }) => (
      <DropdownMenu.Item {...props} data-testid={`row:${value}`}>
        {value}
      </DropdownMenu.Item>
    ),
    ...extra,
  } as NodeDef
}

function DataRows({ children }: { children?: React.ReactNode }) {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return (
    <>
      {nodes.map(renderNode)}
      {children}
    </>
  )
}

function rowIds(nodes: readonly DisplayNode[]): string[] {
  return nodes.flatMap((node) =>
    'items' in node
      ? node.items.map((row) => row.node.id)
      : node.kind === 'row'
        ? [node.node.id]
        : [],
  )
}

/**
 * A windowed list, as a virtualizer renders it: the store knows every row
 * through `setVirtualItems`, and only the first `window` rows mount.
 */
function VirtualRows({
  window = Number.POSITIVE_INFINITY,
  start = 0,
  children,
  after,
}: {
  window?: number
  start?: number
  children?: React.ReactNode
  after?: React.ReactNode
}) {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  const { store } = useSurfaceContext()
  const ids = rowIds(nodes)
  const key = ids.join('|')
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` stands in for `ids`
  React.useEffect(() => {
    store.setVirtualized(true)
    store.setVirtualItems(ids.map((value) => ({ value })))
  }, [store, key])
  React.useEffect(
    () => () => {
      store.setVirtualized(false)
      store.setVirtualItems([])
    },
    [store],
  )
  return (
    <>
      {children}
      {nodes.slice(start, start + window).map(renderNode)}
      {after}
    </>
  )
}

function DataMenu({
  content,
  rows = <DataRows />,
  input = true,
  onOpenChange,
}: {
  content: NodeDef[]
  rows?: React.ReactNode
  input?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <DropdownMenu.Root defaultOpen onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup">
            <DropdownMenu.Surface content={content}>
              {input && <DropdownMenu.Input data-testid="input" />}
              <DropdownMenu.List data-testid="list">{rows}</DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function highlighted() {
  return document
    .querySelector('[data-highlighted]')
    ?.getAttribute('data-testid')
}

async function ready(input = true) {
  if (input) {
    await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus())
  } else {
    await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())
  }
}

describe('groups a data-first row renders with parts', () => {
  it('show when they mount during a search', async () => {
    const user = userEvent.setup()
    render(
      <DataMenu
        content={[
          item('Zebra'),
          {
            kind: 'group',
            id: 'fruits',
            label: 'Fruits',
            nodes: [item('Apple'), item('Avocado')],
            render: ({ children }) => (
              <DropdownMenu.Group data-testid="group">
                {children}
              </DropdownMenu.Group>
            ),
          },
        ]}
      />,
    )
    await ready()

    // "aq" matches nothing, so the group unmounts; "a" mounts it again.
    await user.type(screen.getByTestId('input'), 'aq')
    expect(screen.queryByTestId('group')).toBeNull()
    await user.keyboard('{Backspace}')

    expect(screen.getByTestId('group')).not.toHaveAttribute('data-hidden')
    expect(screen.getByTestId('row:Apple')).toBeVisible()
    expect(screen.getByTestId('row:Avocado')).toBeVisible()
  })
})

describe('virtualized data-first lists', () => {
  it('move the highlight with the keyboard during a search', async () => {
    const user = userEvent.setup()
    render(
      <DataMenu
        content={['Alpha', 'Bravo', 'Charlie', 'Delta'].map((value) =>
          item(value),
        )}
        rows={<VirtualRows />}
      />,
    )
    await ready()

    await user.type(screen.getByTestId('input'), 'a')
    // Every row matches "a"; the search orders them by score.
    const order = () =>
      Array.from(document.querySelectorAll('[role="option"]'), (row) =>
        row.getAttribute('data-testid'),
      )
    await waitFor(() => expect(highlighted()).toBe(order()[0]))
    expect(order()).toHaveLength(4)
    await user.keyboard('{ArrowDown}')
    expect(highlighted()).toBe(order()[1])
    await user.keyboard('{End}')
    expect(highlighted()).toBe(order()[3])
    await user.keyboard('{Home}')
    expect(highlighted()).toBe(order()[0])
  })

  it('select a range with Shift during a search', async () => {
    const user = userEvent.setup()
    const spies = ['Alpha', 'Bravo', 'Charlie'].map(() => vi.fn())
    const content: NodeDef[] = ['Alpha', 'Bravo', 'Charlie'].map(
      (value, index) => ({
        kind: 'checkbox-item',
        value,
        onCheckedChange: spies[index],
        render: ({ props }) => (
          <DropdownMenu.CheckboxItem {...props} data-testid={`row:${value}`}>
            {value}
          </DropdownMenu.CheckboxItem>
        ),
      }),
    )
    render(<DataMenu content={content} rows={<VirtualRows />} />)
    await ready()

    await user.type(screen.getByTestId('input'), 'a')
    await waitFor(() => expect(highlighted()).toBe('row:Alpha'))
    await user.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}')
    for (const spy of spies) {
      expect(spy).toHaveBeenCalledExactlyOnceWith(
        true,
        expect.objectContaining({ reason: 'drag-selection' }),
      )
    }
  })

  it('keep a checkbox row open on Enter', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onCheckedChange = vi.fn()
    render(
      <DataMenu
        onOpenChange={onOpenChange}
        content={[
          {
            kind: 'checkbox-item',
            value: 'Bold',
            onCheckedChange,
            render: ({ props }) => (
              <DropdownMenu.CheckboxItem {...props} data-testid="row:Bold">
                Bold
              </DropdownMenu.CheckboxItem>
            ),
          },
        ]}
        rows={<VirtualRows />}
      />,
    )
    await ready()
    await waitFor(() => expect(highlighted()).toBe('row:Bold'))

    await user.keyboard('{Enter}')
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalledWith(false, expect.anything())
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })

  it('open a submenu trigger with ArrowRight', async () => {
    const user = userEvent.setup()
    render(
      <DataMenu
        input={false}
        content={[
          {
            kind: 'submenu',
            id: 'more',
            value: 'More',
            nodes: [item('Nested')],
            render: ({ props, nodes, renderNode }) => (
              <DropdownMenu.Submenu>
                <DropdownMenu.SubmenuTrigger {...props} data-testid="row:More">
                  More
                </DropdownMenu.SubmenuTrigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Positioner>
                    <DropdownMenu.Popup data-testid="submenu-popup">
                      <DropdownMenu.Surface>
                        <DropdownMenu.List>
                          {nodes.map(renderNode)}
                        </DropdownMenu.List>
                      </DropdownMenu.Surface>
                    </DropdownMenu.Popup>
                  </DropdownMenu.Positioner>
                </DropdownMenu.Portal>
              </DropdownMenu.Submenu>
            ),
          },
        ]}
        rows={<VirtualRows />}
      />,
    )
    await ready(false)
    await waitFor(() => expect(highlighted()).toBe('row:More'))

    await user.keyboard('{ArrowRight}')
    expect(await screen.findByTestId('submenu-popup')).toBeInTheDocument()
  })

  it('leave a header tree row unactivated on Enter', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <DataMenu
        content={[
          {
            kind: 'tree-item',
            value: 'Archive',
            selectable: false,
            onSelect,
            nodes: [],
            render: ({ props }) => (
              <DropdownMenu.TreeItem {...props} data-testid="row:Archive">
                Archive
              </DropdownMenu.TreeItem>
            ),
          },
        ]}
        rows={<VirtualRows />}
      />,
    )
    await ready()
    await waitFor(() => expect(highlighted()).toBe('row:Archive'))

    await user.keyboard('{Enter}')
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })

  it("doesn't select an unmounted row by its shortcut", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onSelect = vi.fn()
    render(
      <DataMenu
        input={false}
        onOpenChange={onOpenChange}
        content={[item('Alpha'), item('Zulu', { shortcut: 'z', onSelect })]}
        rows={<VirtualRows window={1} />}
      />,
    )
    await ready(false)
    expect(screen.queryByTestId('row:Zulu')).toBeNull()

    await user.keyboard('z')
    expect(onSelect).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalledWith(false, expect.anything())
  })
})

describe('JSX rows in a data-first list', () => {
  it('register: the keyboard reaches them and Empty counts them', async () => {
    const user = userEvent.setup()
    render(
      <DataMenu
        content={[item('Apple'), item('Banana')]}
        rows={
          <DataRows>
            <DropdownMenu.Item value="create" data-testid="row:create">
              Create
            </DropdownMenu.Item>
            <DropdownMenu.Empty data-testid="empty">
              No results
            </DropdownMenu.Empty>
          </DataRows>
        }
      />,
    )
    await ready()

    await user.type(screen.getByTestId('input'), 'zz')
    expect(screen.queryByTestId('row:Apple')).toBeNull()
    expect(screen.queryByTestId('empty')).toBeNull()
    await user.keyboard('{ArrowDown}')
    expect(highlighted()).toBe('row:create')
  })

  it('take their place among data rows in navigation', async () => {
    const user = userEvent.setup()
    render(
      <DataMenu
        content={[item('Apple'), item('Banana')]}
        rows={
          <DataRows>
            <DropdownMenu.Item value="create" data-testid="row:create">
              Create
            </DropdownMenu.Item>
          </DataRows>
        }
      />,
    )
    await ready()
    await waitFor(() => expect(highlighted()).toBe('row:Apple'))

    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(highlighted()).toBe('row:create')
    expect(screen.getByTestId('row:create')).toHaveAttribute('data-last')
    expect(screen.getByTestId('row:Banana')).not.toHaveAttribute('data-last')
  })
})

describe("a data-first row's part props", () => {
  it('disabled on the part skips the row in navigation', async () => {
    const user = userEvent.setup()
    const content: NodeDef[] = ['Apple', 'Banana', 'Cherry'].map((value) => ({
      kind: 'item',
      value,
      render: ({ props }) => (
        <DropdownMenu.Item
          {...props}
          disabled={value === 'Banana'}
          data-testid={`row:${value}`}
        >
          {value}
        </DropdownMenu.Item>
      ),
    }))
    render(<DataMenu content={content} />)
    await ready()
    await waitFor(() => expect(highlighted()).toBe('row:Apple'))

    await user.keyboard('{ArrowDown}')
    expect(highlighted()).toBe('row:Cherry')
  })

  it('closeOnClick on the part keeps the menu open on Enter', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onSelect = vi.fn()
    render(
      <DataMenu
        onOpenChange={onOpenChange}
        content={[
          {
            kind: 'item',
            value: 'Apple',
            onSelect,
            render: ({ props }) => (
              <DropdownMenu.Item
                {...props}
                closeOnClick={false}
                data-testid="row:Apple"
              >
                Apple
              </DropdownMenu.Item>
            ),
          },
        ]}
      />,
    )
    await ready()
    await waitFor(() => expect(highlighted()).toBe('row:Apple'))

    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalledWith(false, expect.anything())
  })
})

function firstRow() {
  return document
    .querySelector('[data-testid^="row:"]')
    ?.getAttribute('data-testid')
}

describe('the highlight after rows mount above the kept ones', () => {
  it('moves to the first row when a Backspace brings rows back', async () => {
    const user = userEvent.setup()
    render(<DataMenu content={['New', 'Open', 'Zebra'].map((v) => item(v))} />)
    await ready()

    await user.type(screen.getByTestId('input'), 'z')
    await waitFor(() => expect(highlighted()).toBe('row:Zebra'))
    await user.keyboard('{Backspace}')
    expect(firstRow()).toBe('row:New')
    expect(highlighted()).toBe('row:New')
  })

  it('moves to a better match that mounts above the kept row', async () => {
    const user = userEvent.setup()
    render(<DataMenu content={[item('Abc'), item('A')]} />)
    await ready()

    await user.type(screen.getByTestId('input'), 'ab')
    await waitFor(() => expect(highlighted()).toBe('row:Abc'))
    await user.keyboard('{Backspace}')
    expect(firstRow()).toBe('row:A')
    expect(highlighted()).toBe('row:A')
  })

  it('shows Group parts and highlights the first row on returning from a subpage with a search', async () => {
    const user = userEvent.setup()
    render(
      <DataMenu
        content={[
          {
            kind: 'group',
            id: 'fruits',
            label: 'Fruits',
            nodes: [item('Apple'), item('Avocado')],
            render: ({ children }) => (
              <DropdownMenu.Group data-testid="group">
                {children}
              </DropdownMenu.Group>
            ),
          },
          {
            kind: 'subpage',
            id: 'archive',
            value: 'Archive',
            nodes: [item('Old')],
            renderTrigger: ({ props }) => (
              <DropdownMenu.SubpageTrigger {...props} data-testid="row:Archive">
                Archive
              </DropdownMenu.SubpageTrigger>
            ),
            renderContent: ({ pageId, nodes, renderNode }) => (
              <DropdownMenu.Subpage pageId={pageId}>
                <DropdownMenu.Surface>
                  <DropdownMenu.List>
                    <DropdownMenu.SubpageBackItem data-testid="back">
                      Back
                    </DropdownMenu.SubpageBackItem>
                    {nodes.map(renderNode)}
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Subpage>
            ),
          },
        ]}
      />,
    )
    await ready()

    await user.type(screen.getByTestId('input'), 'a')
    await user.click(await screen.findByTestId('row:Archive'))
    await user.click(await screen.findByTestId('back'))

    await waitFor(() => expect(screen.getByTestId('group')).toBeVisible())
    expect(screen.getByTestId('group')).not.toHaveAttribute('data-hidden')
    expect(highlighted()).toBe(firstRow())
    expect(firstRow()).not.toBe('row:Archive')
  })
})

describe('a data-first row part shortcut', () => {
  it('selects the row by the shortcut its part was given', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <DataMenu
        input={false}
        content={[
          item('Alpha'),
          {
            kind: 'item',
            value: 'Bravo',
            onSelect,
            render: ({ props }) => (
              <DropdownMenu.Item
                {...props}
                shortcut="3"
                data-testid="row:Bravo"
              >
                Bravo
              </DropdownMenu.Item>
            ),
          },
        ]}
      />,
    )
    await ready(false)

    await user.keyboard('3')
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})

describe('a JSX row above a virtualized window', () => {
  it('comes before the rows above the window in navigation', async () => {
    const user = userEvent.setup()
    render(
      <DataMenu
        input={false}
        content={['Alpha', 'Bravo', 'Charlie', 'Delta'].map((v) => item(v))}
        rows={
          <VirtualRows start={2}>
            <DropdownMenu.Item value="create" data-testid="row:create">
              Create
            </DropdownMenu.Item>
          </VirtualRows>
        }
      />,
    )
    await ready(false)

    await user.keyboard('{Home}')
    expect(highlighted()).toBe('row:create')
  })
})

describe('a JSX row below a virtualized window', () => {
  it('comes after the rows below the window in navigation', async () => {
    const user = userEvent.setup()
    render(
      <DataMenu
        input={false}
        content={['Alpha', 'Bravo', 'Charlie', 'Delta'].map((v) => item(v))}
        rows={
          <VirtualRows
            window={2}
            after={
              <DropdownMenu.Item value="create" data-testid="row:create">
                Create
              </DropdownMenu.Item>
            }
          />
        }
      />,
    )
    await ready(false)

    await user.keyboard('{End}')
    expect(highlighted()).toBe('row:create')

    // From the last row in the window: Charlie and Delta, below the window
    // and unmounted, then the JSX row.
    await user.keyboard('{Home}{ArrowDown}')
    expect(highlighted()).toBe('row:Bravo')
    await user.keyboard('{ArrowDown}')
    expect(highlighted()).toBeUndefined()
    await user.keyboard('{ArrowDown}')
    expect(highlighted()).toBeUndefined()
    await user.keyboard('{ArrowDown}')
    expect(highlighted()).toBe('row:create')
  })
})

/** A row element that only takes the ref on its second render, or never. */
const LateElement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { never?: boolean }
>(function LateElement({ never = false, ...props }, ref) {
  const [attached, setAttached] = React.useState(false)
  React.useEffect(() => setAttached(true), [])
  return attached && !never ? <div ref={ref} {...props} /> : <div {...props} />
})

describe('a data row whose element attaches late', () => {
  it.each([
    { when: 'one commit later', never: false },
    { when: 'never', never: true },
  ])('is reachable by keyboard when its ref attaches $when', async ({
    never,
  }) => {
    const user = userEvent.setup()
    render(
      <DataMenu
        input={false}
        content={[
          item('Alpha'),
          {
            kind: 'item',
            value: 'Late',
            render: ({ props }) => (
              <DropdownMenu.Item
                {...props}
                render={<LateElement never={never} data-testid="row:Late" />}
              >
                Late
              </DropdownMenu.Item>
            ),
          },
        ]}
      />,
    )
    await ready(false)
    await waitFor(() => expect(highlighted()).toBe('row:Alpha'))

    await user.keyboard('{ArrowDown}')
    expect(highlighted()).toBe('row:Late')
  })
})
