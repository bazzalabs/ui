import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import { useSurfaceContext } from '../listbox/index.js'

const VALUES = Array.from({ length: 50 }, (_, i) => `v${i + 1}`)

/**
 * A windowed list, as a virtualizer renders it: the store knows every row
 * through `setVirtualItems`, and only the rows from `start` mount.
 */
function VirtualRows({
  start,
  size,
  onHighlight,
}: {
  start: number
  size: number
  onHighlight: (id: string | null, index: number) => void
}) {
  const { store } = useSurfaceContext()
  React.useEffect(() => {
    store.setVirtualized(true)
    store.setVirtualItems(VALUES.map((value) => ({ value })))
    store.setOnHighlightChange(onHighlight)
  }, [store, onHighlight])
  return (
    <>
      {VALUES.slice(start, start + size).map((value) => (
        <DropdownMenu.Item key={value} value={value} data-testid={value}>
          {value}
        </DropdownMenu.Item>
      ))}
    </>
  )
}

function VirtualMenu(props: React.ComponentProps<typeof VirtualRows>) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List data-testid="list">
                <VirtualRows {...props} />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

describe('a virtualized list', () => {
  it('navigates past the rows that are mounted, in the items order', async () => {
    const user = userEvent.setup()
    const highlights: [string | null, number][] = []
    const onHighlight = (id: string | null, index: number) => {
      highlights.push([id, index])
    }
    // Rows 21-25 are mounted; the rest only the items array knows.
    render(<VirtualMenu start={20} size={5} onHighlight={onHighlight} />)
    const list = screen.getByTestId('list')
    await waitFor(() => expect(list).toHaveFocus())
    // The first item highlights, mounted or not.
    await waitFor(() =>
      expect(list).toHaveAttribute('aria-activedescendant', 'v1'),
    )

    for (let i = 0; i < 7; i++) await user.keyboard('{ArrowDown}')
    expect(list).toHaveAttribute('aria-activedescendant', 'v8')
    // The virtualizer hears the row's index in the items, to scroll to it.
    expect(highlights.at(-1)).toEqual(['v8', 7])
    expect(screen.queryByTestId('v8')).toBeNull()

    // On through the mounted window and past it.
    for (let i = 0; i < 18; i++) await user.keyboard('{ArrowDown}')
    expect(screen.getByTestId('v25')).not.toHaveAttribute('data-highlighted')
    expect(list).toHaveAttribute('aria-activedescendant', 'v26')

    // End goes to the last item, which never mounted.
    await user.keyboard('{End}')
    expect(list).toHaveAttribute('aria-activedescendant', 'v50')
  })
})
