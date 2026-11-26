import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import type { ItemDef, NodeDef, SubmenuDef } from '../../data-first/types.js'
import type { GetResolvedIdFn, PopupMenuIdScope } from '../types.js'

/**
 * The menu nodes each row was last rendered with, by Resolved ID. Row render
 * functions receive their node, so this is what an app sees.
 */
type Rendered = Map<string, DropdownMenu.Node>

function item(rendered: Rendered, value: string): ItemDef {
  return {
    kind: 'item',
    value,
    render: ({ props, node }) => {
      rendered.set(node.id, node)
      return (
        <DropdownMenu.Item {...props} data-node-id={node.id}>
          {value}
        </DropdownMenu.Item>
      )
    },
  }
}

function Rows() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

function Menu({
  content,
  getResolvedId,
  idScope,
}: {
  content: NodeDef[]
  getResolvedId?: GetResolvedIdFn
  idScope?: PopupMenuIdScope
}) {
  return (
    <DropdownMenu.Root
      defaultOpen
      getResolvedId={getResolvedId}
      idScope={idScope}
    >
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface content={content}>
              <DropdownMenu.List>
                <Rows />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function submenu(
  rendered: Rendered,
  value: string,
  nodes: NodeDef[],
  nestedContent: NodeDef[] | (() => NodeDef[]),
): SubmenuDef {
  return {
    kind: 'submenu',
    value,
    nodes,
    render: ({ props, context, node }) => {
      rendered.set(node.id, node)
      return (
        <DropdownMenu.Submenu>
          <DropdownMenu.SubmenuTrigger {...props}>
            {context.value}
          </DropdownMenu.SubmenuTrigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface
                  content={
                    typeof nestedContent === 'function'
                      ? nestedContent()
                      : nestedContent
                  }
                >
                  <DropdownMenu.List>
                    <Rows />
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Submenu>
      )
    },
  }
}

const childIds = (node: DropdownMenu.Node | undefined) =>
  node?.children.map((child) => child.id)

describe('mounted menu-tree resolution', () => {
  it('uses the public surface default and explicit menu scope', async () => {
    const rendered: Rendered = new Map()
    const content = () => [
      submenu(rendered, 'Status', [item(rendered, 'Backlog')], []),
    ]
    const view = render(<Menu content={content()} />)
    await waitFor(() => expect(rendered.get('status')).toBeDefined())
    expect(childIds(rendered.get('status'))).toEqual(['status/backlog'])

    // The scope is read once, when the menu mounts.
    view.rerender(<Menu idScope="menu" content={content()} />)
    expect(childIds(rendered.get('status'))).toEqual(['status/backlog'])

    view.unmount()
    rendered.clear()
    render(<Menu idScope="menu" content={content()} />)
    await waitFor(() => expect(rendered.get('status')).toBeDefined())
    expect(childIds(rendered.get('status'))).toEqual(['backlog'])

    cleanup()
    rendered.clear()
    render(<Menu content={content()} />)
    await waitFor(() => expect(rendered.get('status')).toBeDefined())
    expect(childIds(rendered.get('status'))).toEqual(['status/backlog'])
  })

  it('reads idScope and getResolvedId once for the root lifetime', async () => {
    const rendered: Rendered = new Map()
    const view = render(
      <Menu
        getResolvedId={() => 'first'}
        content={[item(rendered, 'Backlog')]}
      />,
    )
    const row = await screen.findByRole('option', { name: 'Backlog' })
    expect(row).toHaveAttribute('data-node-id', 'first')

    view.rerender(
      <Menu
        idScope="menu"
        getResolvedId={() => 'second'}
        content={[item(rendered, 'Backlog')]}
      />,
    )
    expect(screen.getByRole('option', { name: 'Backlog' })).toHaveAttribute(
      'data-node-id',
      'first',
    )
    expect(rendered.has('second')).toBe(false)
  })

  it('keeps node instances stable across recreated content', async () => {
    const rendered: Rendered = new Map()
    const content = () => [
      item(rendered, 'Settings'),
      submenu(
        rendered,
        'Status',
        [item(rendered, 'Backlog'), item(rendered, 'In Progress')],
        [],
      ),
    ]
    const view = render(<Menu content={content()} />)
    await waitFor(() => expect(rendered.get('status')).toBeDefined())
    const backlog = () =>
      rendered.get('status')?.children.find((n) => n.id === 'status/backlog')
    const before = backlog()
    expect(before).toBeDefined()

    view.rerender(<Menu content={content()} />)

    expect(backlog()).toBe(before)
  })

  it('grafts nested-surface defs outside the static def tree', async () => {
    const rendered: Rendered = new Map()
    const leaf = item(rendered, 'Leaf')
    const extra = item(rendered, 'Extra')
    const user = userEvent.setup()
    render(<Menu content={[submenu(rendered, 'A', [leaf], [leaf, extra])]} />)
    await waitFor(() => expect(rendered.get('a')).toBeDefined())
    expect(childIds(rendered.get('a'))).toEqual(['a/leaf'])

    await user.click(screen.getByRole('menuitem', { name: 'A' }))

    await waitFor(() => expect(rendered.get('a/extra')).toBeDefined())
    const parent = rendered.get('a')!
    const grafted = rendered.get('a/extra')
    expect(grafted?.parent).toBe(parent)
    expect(grafted?.definitionPath).toEqual(['a', 'extra'])
    expect(childIds(parent)?.filter((id) => id === 'a/leaf')).toHaveLength(1)
  })

  it('grafts late defs without replacing stable siblings', async () => {
    const rendered: Rendered = new Map()
    const leaf = item(rendered, 'Leaf')
    const late = item(rendered, 'Late')
    const user = userEvent.setup()
    let nestedContent: NodeDef[] = [leaf]
    const submenuDef = submenu(rendered, 'A', [leaf], () => nestedContent)
    const view = render(<Menu content={[submenuDef]} />)
    await user.click(screen.getByRole('menuitem', { name: 'A' }))
    await waitFor(() => expect(rendered.get('a/leaf')).toBeDefined())
    const before = rendered.get('a/leaf')
    expect(before).toBeDefined()

    nestedContent = [leaf, late]
    view.rerender(<Menu content={[submenuDef]} />)
    await user.click(screen.getByRole('menuitem', { name: 'A' }))

    await waitFor(() => expect(rendered.get('a/late')).toBeDefined())
    expect(rendered.get('a/late')?.parent).toBe(rendered.get('a'))
    expect(rendered.get('a/leaf')).toBe(before)
  })
})
