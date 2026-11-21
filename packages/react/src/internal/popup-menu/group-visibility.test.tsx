import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import type { NodeDef } from './data-first/types.js'

function JsxMenu() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input data-testid="search-input" />
              <DropdownMenu.List>
                <DropdownMenu.Group data-testid="group-fruits">
                  <DropdownMenu.GroupLabel data-testid="label-fruits">
                    Fruits
                  </DropdownMenu.GroupLabel>
                  <DropdownMenu.Item data-testid="item-apple" value="apple">
                    Apple
                  </DropdownMenu.Item>
                  <DropdownMenu.Item data-testid="item-banana" value="banana">
                    Banana
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    forceMount
                    data-testid="item-always"
                    value="always"
                  >
                    Always
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator
                    alwaysRender
                    data-testid="separator-fruits"
                  />
                </DropdownMenu.Group>
                <DropdownMenu.Group data-testid="group-cars">
                  <DropdownMenu.GroupLabel data-testid="label-cars">
                    Cars
                  </DropdownMenu.GroupLabel>
                  {/* No value: the store reads it from the item's text. */}
                  <DropdownMenu.Item data-testid="item-audi">
                    Audi
                  </DropdownMenu.Item>
                  <DropdownMenu.Item data-testid="item-volvo">
                    Volvo
                  </DropdownMenu.Item>
                </DropdownMenu.Group>
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty">
                No results
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function SelectionGroupsMenu() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input data-testid="search-input" />
              <DropdownMenu.List>
                <DropdownMenu.Group data-testid="group-fruits">
                  <DropdownMenu.Item data-testid="item-apple" value="apple">
                    Apple
                  </DropdownMenu.Item>
                </DropdownMenu.Group>
                <DropdownMenu.Group data-testid="group-view">
                  <DropdownMenu.GroupLabel data-testid="label-view">
                    View
                  </DropdownMenu.GroupLabel>
                  <DropdownMenu.RadioGroup
                    data-testid="radio-layout"
                    defaultValue="board"
                  >
                    <DropdownMenu.RadioItem
                      data-testid="item-list"
                      value="list"
                    >
                      List
                    </DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem
                      data-testid="item-board"
                      value="board"
                    >
                      Board
                    </DropdownMenu.RadioItem>
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.Group>
                <DropdownMenu.CheckboxGroup
                  data-testid="checkbox-columns"
                  defaultValue={['name']}
                >
                  <DropdownMenu.GroupLabel data-testid="label-columns">
                    Columns
                  </DropdownMenu.GroupLabel>
                  <DropdownMenu.CheckboxItem
                    data-testid="item-name"
                    value="name"
                  >
                    Name
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItem
                    data-testid="item-email"
                    value="email"
                  >
                    Email
                  </DropdownMenu.CheckboxItem>
                </DropdownMenu.CheckboxGroup>
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty">
                No results
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function itemDef(value: string): NodeDef {
  return {
    kind: 'item',
    value,
    render: ({ props }) => (
      <DropdownMenu.Item {...props} data-testid={`item-${value.toLowerCase()}`}>
        {value}
      </DropdownMenu.Item>
    ),
  }
}

function DataItems() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

function DataFirstMenu() {
  const content: NodeDef[] = React.useMemo(
    () => [
      {
        kind: 'group',
        id: 'fruits',
        label: 'Fruits',
        nodes: [itemDef('Apple'), itemDef('Banana')],
      },
      {
        kind: 'group',
        id: 'cars',
        label: 'Cars',
        nodes: [itemDef('Audi'), itemDef('Volvo')],
      },
    ],
    [],
  )

  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface content={content}>
              <DropdownMenu.Input data-testid="search-input" />
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

describe('popup menu groups hidden by a search', () => {
  it('bring back a group whose items match a later search', async () => {
    const user = userEvent.setup()
    render(<JsxMenu />)

    const input = screen.getByTestId('search-input')
    await user.type(input, 'audi')

    await waitFor(() => {
      expect(screen.getByTestId('item-audi')).toBeInTheDocument()
      expect(screen.queryByTestId('label-fruits')).not.toBeInTheDocument()
      expect(screen.queryByTestId('separator-fruits')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-always')).not.toBeInTheDocument()
    })

    // Replace the query without passing through an empty search.
    await user.tripleClick(input)
    await user.keyboard('apple')

    await waitFor(() => {
      expect(screen.getByTestId('group-fruits')).toBeVisible()
      expect(screen.getByTestId('label-fruits')).toBeInTheDocument()
      expect(screen.getByTestId('separator-fruits')).toBeInTheDocument()
      expect(screen.getByTestId('item-always')).toBeInTheDocument()
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()
      expect(screen.getByTestId('group-cars')).not.toBeVisible()
      expect(screen.queryByTestId('label-cars')).not.toBeInTheDocument()
      expect(screen.queryByTestId('empty')).not.toBeInTheDocument()
    })

    await user.tripleClick(input)
    await user.keyboard('vol')

    await waitFor(() => {
      expect(screen.getByTestId('group-cars')).toBeVisible()
      expect(screen.getByTestId('label-cars')).toBeInTheDocument()
      expect(screen.getByTestId('item-volvo')).toBeInTheDocument()
      expect(screen.queryByTestId('item-audi')).not.toBeInTheDocument()
      expect(screen.getByTestId('group-fruits')).not.toBeVisible()
      expect(screen.queryByTestId('empty')).not.toBeInTheDocument()
    })
  })

  it('bring back radio groups, checkbox groups and groups around them', async () => {
    const user = userEvent.setup()
    render(<SelectionGroupsMenu />)

    const input = screen.getByTestId('search-input')
    await user.type(input, 'apple')

    await waitFor(() => {
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.queryByTestId('label-view')).not.toBeInTheDocument()
      expect(screen.queryByTestId('label-columns')).not.toBeInTheDocument()
    })

    await user.tripleClick(input)
    await user.keyboard('list')

    await waitFor(() => {
      expect(screen.getByTestId('group-view')).toBeVisible()
      expect(screen.getByTestId('label-view')).toBeInTheDocument()
      expect(screen.getByTestId('radio-layout')).toBeVisible()
      expect(screen.getByTestId('item-list')).toBeVisible()
      expect(screen.queryByTestId('item-board')).not.toBeInTheDocument()
      expect(screen.getByTestId('checkbox-columns')).not.toBeVisible()
      expect(screen.getByTestId('group-fruits')).not.toBeVisible()
    })

    await user.tripleClick(input)
    await user.keyboard('email')

    await waitFor(() => {
      expect(screen.getByTestId('checkbox-columns')).toBeVisible()
      expect(screen.getByTestId('label-columns')).toBeInTheDocument()
      expect(screen.getByTestId('item-email')).toBeVisible()
      expect(screen.queryByTestId('item-name')).not.toBeInTheDocument()
      expect(screen.getByTestId('group-view')).not.toBeVisible()
      expect(screen.queryByTestId('item-list')).not.toBeInTheDocument()
      expect(screen.queryByTestId('empty')).not.toBeInTheDocument()
    })
  })

  it('bring back a data-first group whose items match a later search', async () => {
    const user = userEvent.setup()
    render(<DataFirstMenu />)

    const input = screen.getByTestId('search-input')
    await user.type(input, 'audi')

    await waitFor(() => {
      expect(screen.getByTestId('item-audi')).toBeInTheDocument()
      expect(screen.queryByText('Fruits')).not.toBeInTheDocument()
    })

    await user.tripleClick(input)
    await user.keyboard('apple')

    await waitFor(() => {
      expect(screen.getByText('Fruits')).toBeInTheDocument()
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.queryByTestId('item-audi')).not.toBeInTheDocument()
      expect(screen.queryByText('Cars')).not.toBeInTheDocument()
    })
  })
})
