import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import { useSurfaceContext } from '../../../listbox/index.js'
import type { NodeDef } from '../types.js'

// Pins the positional data attributes data-first rows render. Default
// containers aren't rows and default separators aren't rows, so `data-first`
// and `data-last` count item rows only, and no row is first or last in a
// group. Rows a consumer renders with parts (a `Group`, a `Separator`, an
// `Empty`) are rows, and count as they do in a JSX menu.

const POSITIONAL = [
  'data-first',
  'data-last',
  'data-first-in-group',
  'data-last-in-group',
  'data-first-group',
  'data-last-group',
] as const

/** Each positional row's name and the positional attributes it has. */
function readPositions() {
  const rows = document.querySelectorAll<HTMLElement>('[data-testid^="row:"]')
  return Array.from(rows, (row) => {
    const name = row.dataset.testid?.slice('row:'.length)
    const attributes = POSITIONAL.filter((name) => row.hasAttribute(name))
    return `${name}: ${attributes.join(' ')}`.trim()
  })
}

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

const representative: NodeDef[] = [
  item('New'),
  { kind: 'separator', id: 'sep' },
  {
    kind: 'group',
    id: 'fruits',
    label: 'Fruits',
    nodes: [item('Apple'), item('Banana', { disabled: true }), item('Cherry')],
  },
  {
    kind: 'radio-group',
    id: 'size',
    label: 'Size',
    value: 'Small',
    nodes: ['Small', 'Large'].map((value) => ({
      kind: 'radio-item' as const,
      value,
      render: ({ props }) => (
        <DropdownMenu.RadioGroupValue value="Small">
          <DropdownMenu.RadioItem {...props} data-testid={`row:${value}`}>
            {value}
          </DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroupValue>
      ),
    })),
  },
  {
    kind: 'checkbox-item',
    value: 'Bold',
    render: ({ props }) => (
      <DropdownMenu.CheckboxItem {...props} data-testid="row:Bold">
        Bold
      </DropdownMenu.CheckboxItem>
    ),
  },
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
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>{nodes.map(renderNode)}</DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    ),
  },
  item('Zebra'),
]

/** The same rows, rendered with parts that are rows of their own. */
const withPartRows: NodeDef[] = [
  item('New'),
  {
    kind: 'separator',
    id: 'sep',
    render: () => <DropdownMenu.Separator data-testid="row:separator" />,
  },
  {
    kind: 'group',
    id: 'fruits',
    label: 'Fruits',
    nodes: [item('Apple'), item('Cherry')],
    render: ({ children }) => (
      <DropdownMenu.Group data-testid="row:group">
        {children}
      </DropdownMenu.Group>
    ),
  },
  item('Zebra'),
]

function DataRows({ empty }: { empty: boolean }) {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return (
    <>
      {nodes.map(renderNode)}
      {empty && (
        <DropdownMenu.Empty data-testid="row:empty">
          No results
        </DropdownMenu.Empty>
      )}
    </>
  )
}

/** Every row mounts, and the store knows them as virtual items. */
function VirtualRows() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  const { store } = useSurfaceContext()
  const ids = nodes.flatMap((node) =>
    'items' in node
      ? node.items.map((row) => row.node.id)
      : node.kind === 'row'
        ? [node.node.id]
        : [],
  )
  const key = ids.join('|')
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` stands in for `ids`
  React.useEffect(() => {
    store.setVirtualized(true)
    store.setVirtualItems(ids.map((value) => ({ value })))
  }, [store, key])
  return <>{nodes.map(renderNode)}</>
}

function DataMenu({
  content,
  empty = false,
  virtualized = false,
}: {
  content: NodeDef[]
  empty?: boolean
  virtualized?: boolean
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface content={content}>
              <DropdownMenu.Input data-testid="input" />
              <DropdownMenu.List>
                {virtualized ? <VirtualRows /> : <DataRows empty={empty} />}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

async function settle(expected: string[]) {
  await waitFor(() => expect(readPositions()).toEqual(expected))
}

describe('data-first positional attributes', () => {
  it('count item rows only under default containers and separators', async () => {
    const user = userEvent.setup()
    render(<DataMenu content={representative} />)

    await settle([
      'New: data-first',
      'Apple:',
      'Banana:',
      'Cherry:',
      'Small:',
      'Large:',
      'Bold:',
      'More:',
      'Zebra: data-last',
    ])

    // A search that keeps rows from the group, the radio group and the
    // submenu (a deep search result), in score order.
    await user.type(screen.getByTestId('input'), 'e')
    await settle([
      'Apple: data-first',
      'Cherry:',
      'Large:',
      'New:',
      'Nested:',
      'Zebra:',
      'More: data-last',
    ])

    // A search that leaves one row.
    await user.type(screen.getByTestId('input'), 'br')
    await settle(['Zebra: data-first data-last'])
  })

  it('count rows rendered by Separator, Group and Empty parts', async () => {
    const user = userEvent.setup()
    render(<DataMenu content={withPartRows} empty />)

    await settle([
      'New: data-first',
      'separator:',
      'group: data-first-group data-last-group',
      'Apple: data-first-in-group',
      'Cherry: data-last-in-group',
      'Zebra: data-last',
    ])

    await user.type(screen.getByTestId('input'), 'a')
    await settle([
      'group: data-first data-first-group data-last-group',
      'Apple: data-first-in-group data-last-in-group',
      'Zebra: data-last',
    ])

    await user.type(screen.getByTestId('input'), 'qq')
    await settle(['empty: data-first data-last'])
  })

  it('mark the first and last groups rendered with the Group part, and a group that remounts during a search', async () => {
    const user = userEvent.setup()
    const group = (id: string, values: string[]): NodeDef => ({
      kind: 'group',
      id,
      label: id,
      nodes: values.map((value) => item(value)),
      render: ({ children }) => (
        <DropdownMenu.Group data-testid={`row:${id}`}>
          {children}
        </DropdownMenu.Group>
      ),
    })
    render(
      <DataMenu
        content={[
          item('New'),
          group('fruits', ['Apple', 'Cherry']),
          group('veg', ['Carrot', 'Leek']),
          item('Zebra'),
        ]}
      />,
    )
    await settle([
      'New: data-first',
      'fruits: data-first-group',
      'Apple: data-first-in-group',
      'Cherry: data-last-in-group',
      'veg: data-last-group',
      'Carrot: data-first-in-group',
      'Leek: data-last-in-group',
      'Zebra: data-last',
    ])

    // "e" sorts the groups first. Rows that registered kept their old order
    // until a row mounted, so `New` used to keep `data-first` here, in the
    // middle of the list; the list's order now decides it.
    const searched = [
      'fruits: data-first data-first-group',
      'Apple: data-first-in-group',
      'Cherry: data-last-in-group',
      'veg: data-last-group',
      'Leek: data-first-in-group data-last-in-group',
      'New:',
      'Zebra: data-last',
    ]
    await user.type(screen.getByTestId('input'), 'e')
    await settle(searched)

    // "eq" matches nothing: every group unmounts, and "e" mounts them again.
    await user.type(screen.getByTestId('input'), 'q')
    await settle([])
    await user.keyboard('{Backspace}')
    await settle(searched)
  })

  it('mark no positions in a virtualized list', async () => {
    const user = userEvent.setup()
    render(<DataMenu content={representative} virtualized />)
    await settle([
      'New:',
      'Apple:',
      'Banana:',
      'Cherry:',
      'Small:',
      'Large:',
      'Bold:',
      'More:',
      'Zebra:',
    ])
    await user.type(screen.getByTestId('input'), 'e')
    await settle([
      'Apple:',
      'Cherry:',
      'Large:',
      'New:',
      'Nested:',
      'Zebra:',
      'More:',
    ])
  })

  it('mark the first and last groups in their new order when a search swaps them', async () => {
    const user = userEvent.setup()
    const group = (id: string, values: string[]): NodeDef => ({
      kind: 'group',
      id,
      label: id,
      nodes: values.map((value) => item(value)),
      render: ({ children }) => (
        <DropdownMenu.Group data-testid={`row:${id}`}>
          {children}
        </DropdownMenu.Group>
      ),
    })
    render(
      <DataMenu
        content={[group('one', ['Alpha beta']), group('two', ['Beta'])]}
      />,
    )
    await settle([
      'one: data-first data-first-group',
      'Alpha beta: data-first-in-group data-last-in-group',
      'two: data-last data-last-group',
      'Beta: data-first-in-group data-last-in-group',
    ])

    // "beta" scores the second group's row higher, so the groups swap.
    await user.type(screen.getByTestId('input'), 'beta')
    await settle([
      'two: data-first data-first-group',
      'Beta: data-first-in-group data-last-in-group',
      'one: data-last data-last-group',
      'Alpha beta: data-first-in-group data-last-in-group',
    ])
  })
})
