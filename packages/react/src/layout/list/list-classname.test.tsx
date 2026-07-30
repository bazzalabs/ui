import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { List } from './index.js'

describe('List className resolution', () => {
  it('resolves function classNames for every list part', () => {
    const items = ['a', 'b']

    function Example() {
      const store = List.useStore({
        items,
        getKey: (item) => item,
        getGroupId: () => 'group',
        selectionMode: 'multiple',
        defaultSelectedKeys: ['a'],
      })
      return (
        <List.Root
          store={store}
          className={() => 'root-from-fn'}
          data-testid="root"
        >
          <List.Group
            value="group"
            className={() => 'group-from-fn'}
            data-testid="group"
          >
            <List.GroupHeader
              className={() => 'group-header-from-fn'}
              data-testid="group-header"
            >
              Group
            </List.GroupHeader>
            <List.GroupRows>
              {items.map((item) => (
                <List.Row
                  key={item}
                  value={item}
                  className={(state) =>
                    state.selected ? 'is-selected' : 'not-selected'
                  }
                  data-testid={`row-${item}`}
                >
                  <List.Cell
                    column="name"
                    className={() => 'cell-from-fn'}
                    data-testid={`cell-${item}`}
                  >
                    {item}
                  </List.Cell>
                </List.Row>
              ))}
            </List.GroupRows>
            <List.Spacer
              height={10}
              className={() => 'spacer-from-fn'}
              data-testid="spacer"
            />
          </List.Group>
        </List.Root>
      )
    }

    render(<Example />)

    expect(screen.getByTestId('root').className).toContain('root-from-fn')
    expect(screen.getByTestId('group').className).toContain('group-from-fn')
    expect(screen.getByTestId('group-header').className).toContain(
      'group-header-from-fn',
    )
    expect(screen.getByTestId('spacer').className).toContain('spacer-from-fn')
    expect(screen.getByTestId('cell-a').className).toContain('cell-from-fn')
    expect(screen.getByTestId('cell-b').className).toContain('cell-from-fn')
    expect(screen.getByTestId('row-a').className).toContain('is-selected')
    expect(screen.getByTestId('row-b').className).toContain('not-selected')
  })
})
