import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'

// A row's visibility follows the store's filter as the surface's settings
// change: a row the store didn't filter when it rendered still hides once
// the store filters it.

const LABELS = ['Apple', 'Banana', 'Apricot', 'Cherry']

const shown = () => LABELS.filter((label) => screen.queryByTestId(label))

const highlighted = () =>
  document.querySelector('[data-highlighted]')?.getAttribute('data-testid')

function FilterMenu({
  filterOff,
  keepMounted = false,
}: {
  filterOff: boolean
  keepMounted?: boolean
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal keepMounted={keepMounted}>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface {...(filterOff ? { filter: false } : {})}>
              <DropdownMenu.Input data-testid="input" />
              <DropdownMenu.List>
                {LABELS.map((label) => (
                  <DropdownMenu.Item
                    key={label}
                    value={label}
                    data-testid={label}
                  >
                    {label}
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

async function searchAp(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId('input'), 'ap')
  await waitFor(() => expect(shown()).toEqual(['Apple', 'Apricot']))
  // Navigation visits the rows that show, and only those.
  await waitFor(() => expect(highlighted()).toBe('Apple'))
  await user.keyboard('{ArrowDown}')
  expect(highlighted()).toBe('Apricot')
  await user.keyboard('{ArrowDown}')
  expect(highlighted()).toBe('Apple')
}

describe('turning the filter on after filter={false}', () => {
  it('hides rows a search leaves out, switched while open', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<FilterMenu filterOff />)
    await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus())

    rerender(<FilterMenu filterOff={false} />)
    await searchAp(user)
  })

  // The rows stay mounted while closed, so the switch re-renders them, and
  // the trigger opens the menu again without re-rendering them.
  it('hides rows a search leaves out, switched while closed', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<FilterMenu filterOff keepMounted />)
    await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus())
    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.getByTestId('trigger')).toHaveAttribute(
        'aria-expanded',
        'false',
      ),
    )

    rerender(<FilterMenu filterOff={false} keepMounted />)
    await user.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus())
    await searchAp(user)
  })
})

function DataRows() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

// The JSX rows sit outside the list, so they stay mounted (and re-render)
// while the list goes from data-first to JSX.
function DataThenJsxMenu({ data }: { data: boolean }) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              {...(data
                ? {
                    content: [
                      {
                        kind: 'item' as const,
                        value: 'Avocado',
                        render: ({ props }: { props: object }) => (
                          <DropdownMenu.Item {...props}>
                            Avocado
                          </DropdownMenu.Item>
                        ),
                      },
                    ],
                  }
                : {})}
            >
              <DropdownMenu.Input data-testid="input" />
              <DropdownMenu.List>{data && <DataRows />}</DropdownMenu.List>
              {LABELS.map((label) => (
                <DropdownMenu.Item
                  key={label}
                  value={label}
                  data-testid={label}
                >
                  {label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

describe('JSX rows left after a data-first list goes', () => {
  it('hide when a search leaves them out', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<DataThenJsxMenu data />)
    await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus())

    act(() => rerender(<DataThenJsxMenu data={false} />))
    await user.type(screen.getByTestId('input'), 'ap')
    // Banana and Cherry sit between the edges, so nothing else re-renders
    // them.
    await waitFor(() => expect(shown()).toEqual(['Apple', 'Apricot']))
  })
})
