import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import type {
  GroupDef,
  ItemDef,
  NodeDef,
  SubpageDef,
  TreeItemDef,
} from '../internal/popup-menu/index.js'
import type { SuggestionMenuHandle } from './handle.js'
import { SuggestionMenu } from './index.js'
import { withoutBranches } from './surface/surface.js'

function item(value: string): ItemDef {
  return {
    kind: 'item',
    value,
    render: ({ props }) => (
      <SuggestionMenu.Item
        {...props}
        data-testid={`item-${value.toLowerCase()}`}
      >
        {value}
      </SuggestionMenu.Item>
    ),
  }
}

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

function Menu<P>(props: {
  handle: SuggestionMenuHandle<P>
  content?: NodeDef[]
  open?: boolean
  query?: string
  onOpenChange?: SuggestionMenu.Root.Props<P>['onOpenChange']
  header?: (state: { payload: P | undefined; query: string }) => React.ReactNode
}) {
  return (
    <SuggestionMenu.Root
      handle={props.handle}
      open={props.open}
      query={props.query}
      onOpenChange={props.onOpenChange}
    >
      {(state) => (
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup data-testid="popup">
              <SuggestionMenu.Surface
                content={props.content ?? [item('Alice'), item('Bob')]}
              >
                {props.header?.(state)}
                <SuggestionMenu.List>
                  <Rows />
                </SuggestionMenu.List>
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      )}
    </SuggestionMenu.Root>
  )
}

const rowIds = () =>
  [...document.querySelectorAll('[role="option"]')].map((el) =>
    el.getAttribute('data-testid'),
  )

describe('SuggestionMenu handle', () => {
  it('is created outside React and opens and closes the menu', async () => {
    const menu = SuggestionMenu.createHandle()
    render(<Menu handle={menu} />)
    expect(menu.isOpen).toBe(false)
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument()

    act(() => menu.update({ query: '' }))
    await screen.findByTestId('popup')
    expect(menu.isOpen).toBe(true)

    act(() => menu.close())
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(menu.isOpen).toBe(false)
  })

  it('opens a menu requested before the Root mounted', async () => {
    const menu = SuggestionMenu.createHandle()
    menu.update({ query: 'a' })
    render(<Menu handle={menu} />)
    await screen.findByTestId('popup')
  })

  it('filters rows by the query from update()', async () => {
    const menu = SuggestionMenu.createHandle()
    render(<Menu handle={menu} />)
    act(() => menu.update({ query: '' }))
    await screen.findByTestId('item-bob')

    act(() => menu.update({ query: 'bo' }))

    await waitFor(() => expect(rowIds()).toEqual(['item-bob']))
  })

  it("passes the payload and query to the Root's children function", async () => {
    const menu = SuggestionMenu.createHandle<{ trigger: string }>()
    render(
      <Menu
        handle={menu}
        header={(state) => (
          <div data-testid="state">
            {state.payload?.trigger}:{state.query}
          </div>
        )}
      />,
    )
    act(() => menu.update({ query: 'al', payload: { trigger: '@' } }))
    expect(await screen.findByTestId('state')).toHaveTextContent('@:al')
  })

  it('asks a controlled Root to open instead of opening it', async () => {
    const menu = SuggestionMenu.createHandle()
    const onOpenChange = vi.fn()
    render(<Menu handle={menu} open={false} onOpenChange={onOpenChange} />)

    act(() => menu.update({ query: '' }))

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'imperative-action' }),
    )
    expect(screen.queryByTestId('popup')).not.toBeInTheDocument()
  })

  it('lets the query prop win over update() and warns in development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const menu = SuggestionMenu.createHandle()
    render(<Menu handle={menu} query="al" />)

    act(() => menu.update({ query: 'bo' }))

    await waitFor(() => expect(rowIds()).toEqual(['item-alice']))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`query` prop'))
    warn.mockRestore()
  })

  it('skips subpage definitions and warns', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const menu = SuggestionMenu.createHandle()
    const subpage: SubpageDef = {
      kind: 'subpage',
      value: 'More',
      nodes: [item('Carol')],
    }
    render(<Menu handle={menu} content={[item('Alice'), subpage]} />)
    act(() => menu.update({ query: '' }))

    await waitFor(() => expect(rowIds()).toEqual(['item-alice']))
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Submenu and subpage definitions'),
    )
    warn.mockRestore()
  })
})

describe('SuggestionMenu host input', () => {
  it('keeps DOM focus in the host input when it opens', async () => {
    const user = userEvent.setup()
    const menu = SuggestionMenu.createHandle()
    render(
      <>
        <textarea data-testid="host" ref={(el) => el && menu.attach(el)} />
        <Menu handle={menu} />
      </>,
    )
    await user.click(screen.getByTestId('host'))

    act(() => menu.update({ query: '' }))
    await screen.findByTestId('popup')
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(screen.getByTestId('host')).toHaveFocus()
  })

  it('stays open when the host input is pressed, closes on other presses', async () => {
    const user = userEvent.setup()
    const menu = SuggestionMenu.createHandle()
    render(
      <>
        <textarea data-testid="host" ref={(el) => el && menu.attach(el)} />
        <button type="button" data-testid="elsewhere">
          Elsewhere
        </button>
        <Menu handle={menu} />
      </>,
    )
    act(() => menu.update({ query: '' }))
    await screen.findByTestId('popup')

    await user.click(screen.getByTestId('host'))
    expect(screen.getByTestId('popup')).toBeInTheDocument()

    await user.click(screen.getByTestId('elsewhere'))
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
  })

  it('closes when a different host input is attached', async () => {
    const menu = SuggestionMenu.createHandle()
    render(
      <>
        <textarea data-testid="first" />
        <textarea data-testid="second" />
        <Menu handle={menu} />
      </>,
    )
    act(() => {
      menu.attach(screen.getByTestId('first'))
      menu.update({ query: '' })
    })
    await screen.findByTestId('popup')

    act(() => {
      menu.attach(screen.getByTestId('second'))
    })

    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(menu.host).toBe(screen.getByTestId('second'))
  })
})

describe('SuggestionMenu content', () => {
  it('skips submenus nested two levels deep', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const menu = SuggestionMenu.createHandle()
    const folder: NodeDef = {
      kind: 'tree-item',
      value: 'Folder',
      nodes: [
        item('Alice'),
        {
          kind: 'submenu',
          id: 'more',
          label: 'More',
          nodes: [item('Zed')],
        } as NodeDef,
      ],
      render: ({ props, context }) => (
        <SuggestionMenu.TreeItem
          {...props}
          depth={context.tree?.depth}
          data-testid="tree-folder"
        >
          Folder
        </SuggestionMenu.TreeItem>
      ),
    }
    const nested: NodeDef = { kind: 'group', id: 'files', nodes: [folder] }

    const [group] = withoutBranches([nested]) as GroupDef[]
    const [tree] = group?.nodes as TreeItemDef[]

    expect(tree?.nodes?.map((node) => node.kind)).toEqual(['item'])
    warn.mockRestore()
  })
})

describe('SuggestionMenu handle with two Roots', () => {
  it('warns and stops the replaced Root watching the host', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const menu = SuggestionMenu.createHandle()
    const host = document.createElement('textarea')
    document.body.append(host)
    menu.attach(host)
    render(
      <>
        <Menu handle={menu} />
        <Menu handle={menu} />
      </>,
    )

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('one Root at a time'),
    )
    warn.mockRestore()
    host.remove()
  })
})

describe('SuggestionMenu parts', () => {
  it("names the listbox 'Suggestions' by default", async () => {
    const menu = SuggestionMenu.createHandle()
    render(<Menu handle={menu} />)
    act(() => menu.update({ query: '' }))

    const listbox = await screen.findByRole('listbox')
    expect(listbox).toHaveAttribute('aria-label', 'Suggestions')
  })

  it("doesn't make the popup a dialog", async () => {
    const menu = SuggestionMenu.createHandle()
    render(<Menu handle={menu} />)
    act(() => menu.update({ query: '' }))

    const popup = await screen.findByTestId('popup')
    expect(popup).toHaveAttribute('role', 'presentation')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('SuggestionMenu onOpenChange', () => {
  it('reports a close once when a controlled parent closes on choose', async () => {
    const user = userEvent.setup()
    const menu = SuggestionMenu.createHandle()
    const calls: boolean[] = []
    const choose: ItemDef = {
      kind: 'item',
      value: 'Alice',
      onSelect: () => menu.close(),
      render: ({ props }) => (
        <SuggestionMenu.Item {...props} data-testid="item-alice">
          Alice
        </SuggestionMenu.Item>
      ),
    }
    function Controlled() {
      const [open, setOpen] = React.useState(false)
      return (
        <Menu
          handle={menu}
          content={[choose]}
          open={open}
          onOpenChange={(next) => {
            calls.push(next)
            setOpen(next)
          }}
        />
      )
    }
    render(<Controlled />)
    act(() => menu.update({ query: '' }))
    await user.click(await screen.findByTestId('item-alice'))

    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(calls).toEqual([true, false])
  })

  it('reports once when the handler itself asks for the same change', async () => {
    const menu = SuggestionMenu.createHandle()
    const calls: boolean[] = []
    render(
      <Menu
        handle={menu}
        onOpenChange={(next) => {
          calls.push(next)
          // An editor exits the trigger, and its plugin closes the menu.
          if (!next) menu.close()
        }}
      />,
    )
    act(() => menu.update({ query: '' }))
    await screen.findByTestId('popup')

    act(() => menu.close())

    expect(calls).toEqual([true, false])
  })

  it('reports the next request after the consumer cancels one', () => {
    const menu = SuggestionMenu.createHandle()
    const calls: boolean[] = []
    let cancelNext = true
    render(
      <Menu
        handle={menu}
        onOpenChange={(next, details) => {
          calls.push(next)
          if (cancelNext) details.cancel()
        }}
      />,
    )

    act(() => {
      menu.update({ query: '' })
      cancelNext = false
      menu.update({ query: 'a' })
    })

    expect(calls).toEqual([true, true])
    expect(menu.isOpen).toBe(true)
  })

  it('reports a close the consumer refused again later', async () => {
    const menu = SuggestionMenu.createHandle()
    const calls: boolean[] = []
    render(
      <Menu handle={menu} open onOpenChange={(next) => calls.push(next)} />,
    )
    await screen.findByTestId('popup')

    act(() => menu.close())
    await act(async () => {})
    act(() => menu.close())

    expect(calls).toEqual([false, false])
  })

  it('reports each change once when choosing a row closes it from outside', async () => {
    const user = userEvent.setup()
    const menu = SuggestionMenu.createHandle()
    const onOpenChange = vi.fn()
    const choose: ItemDef = {
      kind: 'item',
      value: 'Alice',
      // An editor's trigger code closes the menu once the text changes.
      onSelect: () => menu.close(),
      render: ({ props }) => (
        <SuggestionMenu.Item {...props} data-testid="item-alice">
          Alice
        </SuggestionMenu.Item>
      ),
    }
    render(
      <Menu handle={menu} content={[choose]} onOpenChange={onOpenChange} />,
    )
    act(() => menu.update({ query: '' }))
    await user.click(await screen.findByTestId('item-alice'))

    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true, false])
  })
})
