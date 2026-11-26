import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import { Combobox } from '../../combobox/index.js'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import { Select } from '../../select/index.js'
import type {
  CheckboxGroupDef,
  GroupDef,
  GroupLabelRenderParams,
  NodeDef,
  RadioGroupDef,
} from './data-first/types.js'

// ADR-0005 item 2: groups are named with `aria-describedby` on each option,
// pointing at an always-mounted hidden node per group, never with
// `role="group"` / `role="radiogroup"`.

function Menu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>{children}</DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function DataItems() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

function DataMenu({ content }: { content: NodeDef[] }) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface content={content}>
              <DropdownMenu.List>
                <DataItems />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/** The nodes an element's `aria-describedby` points at, each of which must be mounted. */
function describedByNodes(element: HTMLElement): HTMLElement[] {
  const ids = element.getAttribute('aria-describedby')?.split(' ') ?? []
  return ids.map((id) => {
    const node = document.getElementById(id)
    expect(node, `#${id} is mounted`).not.toBeNull()
    return node as HTMLElement
  })
}

/** Asserts the row is described by its group's hidden node and nothing else. */
function expectDescribedByGroup(row: HTMLElement, label: string) {
  const nodes = describedByNodes(row)
  expect(nodes).toHaveLength(1)
  const [node] = nodes as [HTMLElement]
  expect(node).toHaveTextContent(label)
  // `hidden`, so its text isn't stray content in the listbox; a node that
  // aria-describedby references directly still describes (accname step 2A).
  expect(node).toHaveAttribute('hidden')
  expect(node).not.toBeVisible()
  // It's not a row: rows are the group's options.
  expect(node).not.toHaveAttribute('role')
  expect(row).toHaveAccessibleDescription(label)
}

function expectNoGroupRoles() {
  expect(screen.queryByRole('group')).not.toBeInTheDocument()
  expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
}

const WINDOW_ROWS = ['Fruits', 'Apple', 'Banana', 'Cherry']

/**
 * A group in a windowed list: only the two rows in the window render, as a
 * virtualizer does, and rows go through GroupValue for their positional flags.
 */
function WindowedMenu({ start, label }: { start: number; label?: string }) {
  return (
    <Menu>
      <DropdownMenu.Group label={label}>
        {WINDOW_ROWS.slice(start, start + 2).map((row, index) =>
          row === 'Fruits' ? (
            <DropdownMenu.GroupValue key={row} positional={{ first: true }}>
              <DropdownMenu.GroupLabel data-testid="label">
                {row}
              </DropdownMenu.GroupLabel>
            </DropdownMenu.GroupValue>
          ) : (
            <DropdownMenu.GroupValue
              key={row}
              positional={{ firstInGroup: start + index === 1 }}
            >
              <DropdownMenu.Item value={row}>{row}</DropdownMenu.Item>
            </DropdownMenu.GroupValue>
          ),
        )}
      </DropdownMenu.Group>
    </Menu>
  )
}

describe('composable groups name their options with aria-describedby', () => {
  it('Group', async () => {
    render(
      <Menu>
        <DropdownMenu.Group data-testid="group">
          <DropdownMenu.GroupLabel>Fruits</DropdownMenu.GroupLabel>
          <DropdownMenu.Item>Apple</DropdownMenu.Item>
          <DropdownMenu.Item>Banana</DropdownMenu.Item>
        </DropdownMenu.Group>
      </Menu>,
    )

    const apple = await screen.findByRole('option', {
      name: 'Apple',
      description: 'Fruits',
    })
    expectNoGroupRoles()
    expect(screen.getByTestId('group')).toHaveAttribute('role', 'presentation')
    expect(screen.getByTestId('group')).not.toHaveAttribute('aria-label')
    expectDescribedByGroup(apple, 'Fruits')
    expectDescribedByGroup(
      screen.getByRole('option', { name: 'Banana' }),
      'Fruits',
    )
    // Both options share the group's one description node.
    expect(apple.getAttribute('aria-describedby')).toBe(
      screen
        .getByRole('option', { name: 'Banana' })
        .getAttribute('aria-describedby'),
    )
  })

  it('RadioGroup', async () => {
    render(
      <Menu>
        <DropdownMenu.RadioGroup data-testid="group" defaultValue="small">
          <DropdownMenu.GroupLabel>Size</DropdownMenu.GroupLabel>
          <DropdownMenu.RadioItem value="small">Small</DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="large">Large</DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
      </Menu>,
    )

    const small = await screen.findByRole('menuitemradio', {
      name: 'Small',
      description: 'Size',
    })
    expectNoGroupRoles()
    expect(screen.getByTestId('group')).toHaveAttribute('role', 'presentation')
    expectDescribedByGroup(small, 'Size')
    expectDescribedByGroup(
      screen.getByRole('menuitemradio', { name: 'Large' }),
      'Size',
    )
  })

  it('CheckboxGroup', async () => {
    render(
      <Menu>
        <DropdownMenu.CheckboxGroup data-testid="group" defaultValue={[]}>
          <DropdownMenu.GroupLabel>Columns</DropdownMenu.GroupLabel>
          <DropdownMenu.CheckboxItem value="name">
            Name
          </DropdownMenu.CheckboxItem>
          <DropdownMenu.CheckboxItem value="email">
            Email
          </DropdownMenu.CheckboxItem>
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )

    const name = await screen.findByRole('menuitemcheckbox', {
      name: 'Name',
      description: 'Columns',
    })
    expectNoGroupRoles()
    expect(screen.getByTestId('group')).toHaveAttribute('role', 'presentation')
    expectDescribedByGroup(name, 'Columns')
    expectDescribedByGroup(
      screen.getByRole('menuitemcheckbox', { name: 'Email' }),
      'Columns',
    )
  })

  it('keeps the visible label out of the accessibility tree', async () => {
    render(
      <Menu>
        <DropdownMenu.Group>
          <DropdownMenu.GroupLabel data-testid="label">
            Fruits
          </DropdownMenu.GroupLabel>
          <DropdownMenu.Item>Apple</DropdownMenu.Item>
        </DropdownMenu.Group>
      </Menu>,
    )

    await screen.findByRole('option', { name: 'Apple' })
    expect(screen.getByTestId('label')).toHaveAttribute('aria-hidden', 'true')
  })

  it("keeps the consumer's aria-describedby after the group's", async () => {
    render(
      <Menu>
        <DropdownMenu.Group>
          <DropdownMenu.GroupLabel>Fruits</DropdownMenu.GroupLabel>
          <DropdownMenu.Item aria-describedby="apple-hint">
            Apple
          </DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.Item aria-describedby="plain-hint">
          Plain
        </DropdownMenu.Item>
        <span id="apple-hint">Crunchy</span>
        <span id="plain-hint">Ungrouped</span>
      </Menu>,
    )

    const apple = await screen.findByRole('option', { name: 'Apple' })
    const nodes = describedByNodes(apple)
    expect(nodes.map((node) => node.textContent)).toEqual(['Fruits', 'Crunchy'])
    expect(apple).toHaveAccessibleDescription('Fruits Crunchy')
    expect(screen.getByRole('option', { name: 'Plain' })).toHaveAttribute(
      'aria-describedby',
      'plain-hint',
    )
  })

  it('describes nothing for a group with no label', async () => {
    render(
      <Menu>
        <DropdownMenu.Group data-testid="group">
          <DropdownMenu.Item>Apple</DropdownMenu.Item>
        </DropdownMenu.Group>
      </Menu>,
    )

    const apple = await screen.findByRole('option', { name: 'Apple' })
    expect(apple).not.toHaveAttribute('aria-describedby')
    // No description node: the option is the only element with an id.
    expect([...screen.getByTestId('group').querySelectorAll('[id]')]).toEqual([
      apple,
    ])
  })

  it('gives every group its own description', async () => {
    render(
      <Menu>
        <DropdownMenu.Group>
          <DropdownMenu.GroupLabel>Fruits</DropdownMenu.GroupLabel>
          <DropdownMenu.Item>Apple</DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.Group>
          <DropdownMenu.GroupLabel>Vegetables</DropdownMenu.GroupLabel>
          <DropdownMenu.Item>Carrot</DropdownMenu.Item>
        </DropdownMenu.Group>
      </Menu>,
    )

    const apple = await screen.findByRole('option', { name: 'Apple' })
    const carrot = screen.getByRole('option', { name: 'Carrot' })
    expectDescribedByGroup(apple, 'Fruits')
    expectDescribedByGroup(carrot, 'Vegetables')
    expect(apple.getAttribute('aria-describedby')).not.toBe(
      carrot.getAttribute('aria-describedby'),
    )
  })

  it("keeps a GroupLabel's text after the label row scrolls out of a windowed group", async () => {
    const { rerender } = render(<WindowedMenu start={0} />)
    expectDescribedByGroup(
      await screen.findByRole('option', { name: 'Apple' }),
      'Fruits',
    )

    // Scroll the label row out of the window.
    rerender(<WindowedMenu start={2} />)
    await waitFor(() => {
      expect(screen.queryByTestId('label')).not.toBeInTheDocument()
    })
    expectDescribedByGroup(
      screen.getByRole('option', { name: 'Banana' }),
      'Fruits',
    )
    expectDescribedByGroup(
      screen.getByRole('option', { name: 'Cherry', description: 'Fruits' }),
      'Fruits',
    )
  })

  it('describes a windowed group opened past its label row by its label prop', async () => {
    render(<WindowedMenu start={2} label="Fruits" />)

    const banana = await screen.findByRole('option', {
      name: 'Banana',
      description: 'Fruits',
    })
    // The label row never mounted.
    expect(screen.queryByTestId('label')).not.toBeInTheDocument()
    expectDescribedByGroup(banana, 'Fruits')
    expectDescribedByGroup(
      screen.getByRole('option', { name: 'Cherry' }),
      'Fruits',
    )
  })

  it("prefers the group's label prop to its GroupLabel's text", async () => {
    render(<WindowedMenu start={0} label="Produce" />)

    expectDescribedByGroup(
      await screen.findByRole('option', { name: 'Apple' }),
      'Produce',
    )
  })

  it('names RadioGroup and CheckboxGroup by their label prop', async () => {
    render(
      <Menu>
        <DropdownMenu.RadioGroup label="Size" defaultValue="small">
          <DropdownMenu.RadioItem value="small">Small</DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
        <DropdownMenu.CheckboxGroup label="Columns" defaultValue={[]}>
          <DropdownMenu.CheckboxItem value="name">
            Name
          </DropdownMenu.CheckboxItem>
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )

    expectDescribedByGroup(
      await screen.findByRole('menuitemradio', { name: 'Small' }),
      'Size',
    )
    expectDescribedByGroup(
      screen.getByRole('menuitemcheckbox', { name: 'Name' }),
      'Columns',
    )
  })

  it('clears the name when its GroupLabel renders empty text', async () => {
    function Labelled({ text }: { text: string }) {
      return (
        <Menu>
          <DropdownMenu.Group>
            <DropdownMenu.GroupLabel>{text}</DropdownMenu.GroupLabel>
            <DropdownMenu.Item>Apple</DropdownMenu.Item>
          </DropdownMenu.Group>
        </Menu>
      )
    }
    const { rerender } = render(<Labelled text="Fruits" />)
    expectDescribedByGroup(
      await screen.findByRole('option', { name: 'Apple' }),
      'Fruits',
    )

    rerender(<Labelled text="" />)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Apple' })).not.toHaveAttribute(
        'aria-describedby',
      )
    })
  })
})

describe('data-first groups name their options with aria-describedby', () => {
  function itemDef(value: string) {
    return {
      kind: 'item' as const,
      value,
      render: ({ props }: { props: DropdownMenu.Item.Props }) => (
        <DropdownMenu.Item {...props}>{value}</DropdownMenu.Item>
      ),
    }
  }

  const fruits: GroupDef = {
    kind: 'group',
    id: 'fruits',
    label: 'Fruits',
    nodes: [itemDef('Apple'), itemDef('Banana')],
  }

  const size: RadioGroupDef = {
    kind: 'radio-group',
    id: 'size',
    label: 'Size',
    value: 'small',
    nodes: ['small', 'large'].map((value) => ({
      kind: 'radio-item' as const,
      value,
      // The default container doesn't provide the radio value: rows read it
      // from a RadioGroupValue of their own.
      render: ({ props }) => (
        <DropdownMenu.RadioGroupValue value="small">
          <DropdownMenu.RadioItem {...props}>{value}</DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroupValue>
      ),
    })),
  }

  const columns: CheckboxGroupDef = {
    kind: 'checkbox-group',
    id: 'columns',
    label: 'Columns',
    value: [],
    nodes: ['name', 'email'].map((value) => ({
      kind: 'checkbox-item' as const,
      value,
      render: ({ props }) => (
        <DropdownMenu.CheckboxItem {...props}>
          {value}
        </DropdownMenu.CheckboxItem>
      ),
    })),
  }

  it('group', async () => {
    render(<DataMenu content={[fruits]} />)

    const apple = await screen.findByRole('option', {
      name: 'Apple',
      description: 'Fruits',
    })
    expectNoGroupRoles()
    expectDescribedByGroup(apple, 'Fruits')
    expectDescribedByGroup(
      screen.getByRole('option', { name: 'Banana' }),
      'Fruits',
    )
    const wrapper = apple.parentElement as HTMLElement
    expect(wrapper).toHaveAttribute('role', 'presentation')
    expect(wrapper).not.toHaveAttribute('aria-label')
  })

  it('radio group', async () => {
    render(<DataMenu content={[size]} />)

    const small = await screen.findByRole('menuitemradio', {
      name: 'small',
      description: 'Size',
    })
    expectNoGroupRoles()
    expectDescribedByGroup(small, 'Size')
    expectDescribedByGroup(
      screen.getByRole('menuitemradio', { name: 'large' }),
      'Size',
    )
    expect(small.parentElement).toHaveAttribute('role', 'presentation')
  })

  it('checkbox group', async () => {
    render(<DataMenu content={[columns]} />)

    const name = await screen.findByRole('menuitemcheckbox', {
      name: 'name',
      description: 'Columns',
    })
    expectNoGroupRoles()
    expectDescribedByGroup(name, 'Columns')
    expectDescribedByGroup(
      screen.getByRole('menuitemcheckbox', { name: 'email' }),
      'Columns',
    )
    expect(name.parentElement).toHaveAttribute('role', 'presentation')
  })

  it('describes nothing for a group with no label', async () => {
    render(<DataMenu content={[{ ...fruits, label: undefined }]} />)

    const apple = await screen.findByRole('option', { name: 'Apple' })
    expect(apple).not.toHaveAttribute('aria-describedby')
    expectNoGroupRoles()
  })

  it("names a group by renderLabel's GroupLabel text when it has no label", async () => {
    const renderLabel = ({ props }: GroupLabelRenderParams) => (
      <DropdownMenu.GroupLabel {...props}>
        Custom fruits
      </DropdownMenu.GroupLabel>
    )
    render(
      <DataMenu content={[{ ...fruits, label: undefined, renderLabel }]} />,
    )

    expectDescribedByGroup(
      await screen.findByRole('option', {
        name: 'Apple',
        description: 'Custom fruits',
      }),
      'Custom fruits',
    )
  })

  it("prefers the def's label to renderLabel's text", async () => {
    const renderLabel = ({ props, context }: GroupLabelRenderParams) => (
      <DropdownMenu.GroupLabel {...props}>
        {context.label} <span>(3)</span>
      </DropdownMenu.GroupLabel>
    )
    render(<DataMenu content={[{ ...fruits, renderLabel }]} />)

    expectDescribedByGroup(
      await screen.findByRole('option', { name: 'Apple' }),
      'Fruits',
    )
  })

  it('in a submenu, with its own description id', async () => {
    const user = userEvent.setup()
    const submenu: NodeDef = {
      kind: 'submenu',
      id: 'more',
      value: 'More',
      nodes: [{ ...fruits, nodes: [itemDef('Mango')] }],
      render: ({ props, nodes, renderNode }) => (
        <DropdownMenu.Submenu>
          <DropdownMenu.SubmenuTrigger {...props}>
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
    }
    render(<DataMenu content={[fruits, submenu]} />)

    const apple = await screen.findByRole('option', { name: 'Apple' })
    await user.hover(screen.getByRole('menuitem', { name: 'More' }))
    const mango = await screen.findByRole('option', { name: 'Mango' })

    expectNoGroupRoles()
    expectDescribedByGroup(apple, 'Fruits')
    expectDescribedByGroup(mango, 'Fruits')
    // Both surfaces render a group with the def id "fruits".
    expect(mango.getAttribute('aria-describedby')).not.toBe(
      apple.getAttribute('aria-describedby'),
    )
  })

  it('in a subpage', async () => {
    const user = userEvent.setup()
    const subpage: NodeDef = {
      kind: 'subpage',
      id: 'sizes',
      value: 'Sizes',
      nodes: [size],
      renderTrigger: ({ props }) => (
        <DropdownMenu.SubpageTrigger {...props}>
          Sizes
        </DropdownMenu.SubpageTrigger>
      ),
      renderContent: ({ pageId, nodes, renderNode }) => (
        <DropdownMenu.Subpage pageId={pageId}>
          <DropdownMenu.Surface>
            <DropdownMenu.List>{nodes.map(renderNode)}</DropdownMenu.List>
          </DropdownMenu.Surface>
        </DropdownMenu.Subpage>
      ),
    }
    render(<DataMenu content={[subpage]} />)

    await user.click(await screen.findByRole('menuitem', { name: 'Sizes' }))
    const small = await screen.findByRole('menuitemradio', { name: 'small' })

    expectNoGroupRoles()
    expectDescribedByGroup(small, 'Size')
  })
})

describe('nested groups', () => {
  it('keeps the labelled outer group describing an unlabelled inner group', async () => {
    render(
      <Menu>
        <DropdownMenu.Group>
          <DropdownMenu.GroupLabel>View</DropdownMenu.GroupLabel>
          <DropdownMenu.Item>Zoom in</DropdownMenu.Item>
          <DropdownMenu.RadioGroup defaultValue="list">
            <DropdownMenu.RadioItem value="list">List</DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
          <DropdownMenu.CheckboxGroup defaultValue={[]}>
            <DropdownMenu.CheckboxItem value="grid">
              Grid
            </DropdownMenu.CheckboxItem>
          </DropdownMenu.CheckboxGroup>
          <DropdownMenu.Group>
            <DropdownMenu.Item>Reset</DropdownMenu.Item>
          </DropdownMenu.Group>
        </DropdownMenu.Group>
      </Menu>,
    )

    const zoom = await screen.findByRole('option', { name: 'Zoom in' })
    const id = zoom.getAttribute('aria-describedby')
    for (const row of [
      zoom,
      screen.getByRole('menuitemradio', { name: 'List' }),
      screen.getByRole('menuitemcheckbox', { name: 'Grid' }),
      screen.getByRole('option', { name: 'Reset' }),
    ]) {
      expectDescribedByGroup(row, 'View')
      expect(row).toHaveAttribute('aria-describedby', id)
    }
  })

  it('describes the options of a labelled inner group by the inner label', async () => {
    render(
      <Menu>
        <DropdownMenu.Group label="View">
          <DropdownMenu.Item>Zoom in</DropdownMenu.Item>
          <DropdownMenu.RadioGroup defaultValue="list">
            <DropdownMenu.GroupLabel>Layout</DropdownMenu.GroupLabel>
            <DropdownMenu.RadioItem value="list">List</DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Group>
      </Menu>,
    )

    expectDescribedByGroup(
      await screen.findByRole('option', { name: 'Zoom in' }),
      'View',
    )
    expectDescribedByGroup(
      screen.getByRole('menuitemradio', { name: 'List' }),
      'Layout',
    )
  })

  it('keeps a labelled outer group describing an unlabelled data-first group', async () => {
    const content: NodeDef[] = [
      {
        kind: 'group',
        id: 'unlabelled',
        nodes: [
          {
            kind: 'item',
            value: 'Apple',
            render: ({ props }) => (
              <DropdownMenu.Item {...props}>Apple</DropdownMenu.Item>
            ),
          },
        ],
      },
    ]
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface content={content}>
                <DropdownMenu.List>
                  <DropdownMenu.Group label="Fruits">
                    <DataItems />
                  </DropdownMenu.Group>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )

    expectDescribedByGroup(
      await screen.findByRole('option', { name: 'Apple' }),
      'Fruits',
    )
  })
})

describe('every row part in a labelled group is described', () => {
  it('LinkItem and SubmenuTrigger', async () => {
    render(
      <Menu>
        <DropdownMenu.Group label="Go">
          <DropdownMenu.LinkItem value="projects" href="#projects">
            Projects
          </DropdownMenu.LinkItem>
          <DropdownMenu.Submenu>
            <DropdownMenu.SubmenuTrigger>More</DropdownMenu.SubmenuTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Positioner>
                <DropdownMenu.Popup>
                  <DropdownMenu.Surface>
                    <DropdownMenu.List>
                      <DropdownMenu.Item>Nested</DropdownMenu.Item>
                    </DropdownMenu.List>
                  </DropdownMenu.Surface>
                </DropdownMenu.Popup>
              </DropdownMenu.Positioner>
            </DropdownMenu.Portal>
          </DropdownMenu.Submenu>
        </DropdownMenu.Group>
      </Menu>,
    )

    expectDescribedByGroup(
      await screen.findByRole('option', { name: 'Projects' }),
      'Go',
    )
    expectDescribedByGroup(screen.getByRole('menuitem', { name: 'More' }), 'Go')
  })

  it('SubpageTrigger and SubpageBackItem', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <DropdownMenu.Group label="Pages">
                    <DropdownMenu.SubpageTrigger
                      value="settings"
                      targetPageId="settings"
                    >
                      Settings
                    </DropdownMenu.SubpageTrigger>
                  </DropdownMenu.Group>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
              <DropdownMenu.Subpage pageId="settings">
                <DropdownMenu.Surface>
                  <DropdownMenu.List>
                    <DropdownMenu.Group label="Navigation">
                      <DropdownMenu.SubpageBackItem value="back">
                        Back
                      </DropdownMenu.SubpageBackItem>
                    </DropdownMenu.Group>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Subpage>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )

    const trigger = await screen.findByRole('menuitem', { name: 'Settings' })
    expectDescribedByGroup(trigger, 'Pages')
    await user.click(trigger)
    expectDescribedByGroup(
      await screen.findByRole('option', { name: 'Back' }),
      'Navigation',
    )
  })

  it('Select.Item', async () => {
    render(
      <Select.Root defaultOpen>
        <Select.Trigger>
          <Select.Value placeholder="Fruit" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Surface>
                <Select.List>
                  <Select.Group>
                    <Select.GroupLabel>Fruits</Select.GroupLabel>
                    <Select.Item value="apple">Apple</Select.Item>
                  </Select.Group>
                </Select.List>
              </Select.Surface>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    )

    expectDescribedByGroup(
      await screen.findByRole('option', { name: 'Apple' }),
      'Fruits',
    )
    expectNoGroupRoles()
  })

  it('Combobox.Item', async () => {
    render(
      <Combobox.Root defaultOpen>
        <Combobox.Input aria-label="Fruit" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Surface>
                <Combobox.List>
                  <Combobox.Group>
                    <Combobox.GroupLabel>Fruits</Combobox.GroupLabel>
                    <Combobox.Item value="apple">Apple</Combobox.Item>
                  </Combobox.Group>
                </Combobox.List>
              </Combobox.Surface>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    )

    expectDescribedByGroup(
      await screen.findByRole('option', { name: 'Apple' }),
      'Fruits',
    )
    expectNoGroupRoles()
  })
})

describe('every surface starts outside any group', () => {
  function SubmenuInGroup({ nested }: { nested: React.ReactNode }) {
    return (
      <Menu>
        <DropdownMenu.Group>
          <DropdownMenu.GroupLabel>Go</DropdownMenu.GroupLabel>
          <DropdownMenu.Item>Outer</DropdownMenu.Item>
          <DropdownMenu.Submenu>
            <DropdownMenu.SubmenuTrigger>More</DropdownMenu.SubmenuTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Positioner>
                <DropdownMenu.Popup data-testid="submenu-popup">
                  <DropdownMenu.Surface>
                    <DropdownMenu.List>{nested}</DropdownMenu.List>
                  </DropdownMenu.Surface>
                </DropdownMenu.Popup>
              </DropdownMenu.Positioner>
            </DropdownMenu.Portal>
          </DropdownMenu.Submenu>
        </DropdownMenu.Group>
      </Menu>
    )
  }

  it("gives a submenu's rows no description from the group around its trigger", async () => {
    const user = userEvent.setup()
    render(
      <SubmenuInGroup
        nested={
          <>
            <DropdownMenu.Item>Nested</DropdownMenu.Item>
            <DropdownMenu.Group>
              <DropdownMenu.Item>Inner</DropdownMenu.Item>
            </DropdownMenu.Group>
            <DropdownMenu.Group label="Sub">
              <DropdownMenu.Item>Own</DropdownMenu.Item>
            </DropdownMenu.Group>
          </>
        }
      />,
    )

    const trigger = await screen.findByRole('menuitem', { name: 'More' })
    expectDescribedByGroup(trigger, 'Go')
    await user.hover(trigger)
    const nested = await screen.findByRole('option', { name: 'Nested' })

    expect(nested).not.toHaveAttribute('aria-describedby')
    expect(screen.getByRole('option', { name: 'Inner' })).not.toHaveAttribute(
      'aria-describedby',
    )
    expectDescribedByGroup(screen.getByRole('option', { name: 'Own' }), 'Sub')
  })

  it("doesn't let a submenu's top-level GroupLabel rename the outer group", async () => {
    const user = userEvent.setup()
    render(
      <SubmenuInGroup
        nested={
          <>
            <DropdownMenu.GroupLabel>Renamed</DropdownMenu.GroupLabel>
            <DropdownMenu.Item>Nested</DropdownMenu.Item>
          </>
        }
      />,
    )

    await screen.findByRole('menuitem', { name: 'More' })
    // Open with the keyboard, so ArrowLeft can close it again.
    screen.getByRole('listbox').focus()
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Outer' })).toHaveAttribute(
        'data-highlighted',
      )
    })
    await user.keyboard('{ArrowDown}{ArrowRight}')
    expect(
      await screen.findByRole('option', { name: 'Nested' }),
    ).not.toHaveAttribute('aria-describedby')
    expectDescribedByGroup(screen.getByRole('option', { name: 'Outer' }), 'Go')

    // Close the submenu: the outer group keeps its own name.
    await user.keyboard('{ArrowLeft}')
    await waitFor(() => {
      expect(screen.queryByTestId('submenu-popup')).not.toBeInTheDocument()
    })
    expectDescribedByGroup(screen.getByRole('option', { name: 'Outer' }), 'Go')
  })

  it("doesn't make a submenu's rows members of the outer group", async () => {
    const user = userEvent.setup()
    render(
      <SubmenuInGroup
        nested={
          <>
            <DropdownMenu.Item data-testid="first">First</DropdownMenu.Item>
            <DropdownMenu.Item data-testid="last">Last</DropdownMenu.Item>
          </>
        }
      />,
    )

    await user.hover(await screen.findByRole('menuitem', { name: 'More' }))
    // Ungrouped rows of the submenu's own list, not the ends of a group.
    expect(await screen.findByTestId('first')).not.toHaveAttribute(
      'data-first-in-group',
    )
    expect(screen.getByTestId('last')).not.toHaveAttribute('data-last-in-group')
  })

  it("gives a data-first submenu's rows no description from the group around its trigger", async () => {
    const user = userEvent.setup()
    const item = (value: string) => ({
      kind: 'item' as const,
      value,
      render: ({ props }: { props: DropdownMenu.Item.Props }) => (
        <DropdownMenu.Item {...props}>{value}</DropdownMenu.Item>
      ),
    })
    const content: NodeDef[] = [
      {
        kind: 'group',
        id: 'go',
        label: 'Go',
        nodes: [
          {
            kind: 'submenu',
            id: 'more',
            value: 'More',
            nodes: [
              item('Nested'),
              { kind: 'group', id: 'inner', nodes: [item('Inner')] },
            ],
            render: ({ props, nodes, renderNode }) => (
              <DropdownMenu.Submenu>
                <DropdownMenu.SubmenuTrigger {...props}>
                  More
                </DropdownMenu.SubmenuTrigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Positioner>
                    <DropdownMenu.Popup>
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
        ],
      },
    ]
    render(<DataMenu content={content} />)

    const trigger = await screen.findByRole('menuitem', { name: 'More' })
    expectDescribedByGroup(trigger, 'Go')
    await user.hover(trigger)

    expect(
      await screen.findByRole('option', { name: 'Nested' }),
    ).not.toHaveAttribute('aria-describedby')
    expect(screen.getByRole('option', { name: 'Inner' })).not.toHaveAttribute(
      'aria-describedby',
    )
  })
})
