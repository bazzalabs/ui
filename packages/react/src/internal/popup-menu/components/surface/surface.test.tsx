import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'

const LABELS = ['Apple', 'Banana', 'Cherry']

/**
 * Runs `run` from a layout effect in the commit where `when` changes: inside
 * the list, so after the Surface syncs its settings and before that commit's
 * passive effects.
 */
function InCommit({ when, run }: { when: unknown; run: () => void }) {
  const runRef = React.useRef(run)
  runRef.current = run
  const firstRef = React.useRef(true)
  // biome-ignore lint/correctness/useExhaustiveDependencies(when): `when` is the trigger, not something the effect reads
  React.useLayoutEffect(() => {
    if (firstRef.current) {
      firstRef.current = false
      return
    }
    runRef.current()
  }, [when])
  return null
}

function Menu({
  input = false,
  surfaceProps,
  inCommit,
}: {
  input?: boolean
  surfaceProps: Partial<DropdownMenu.Surface.Props>
  inCommit: { when: unknown; run: () => void }
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface {...surfaceProps}>
              {input && <DropdownMenu.Input data-testid="input" />}
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
                <InCommit {...inCommit} />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

const visibleLabels = () =>
  LABELS.filter((label) => screen.queryByTestId(label) !== null)

describe('PopupMenuSurface orderedItems', () => {
  // The consumer filters (`filter={false}`) and tells the Surface the order.
  function ConsumerFilteredMenu() {
    const [search, setSearch] = React.useState('')
    const shown = LABELS.filter((label) =>
      label.toLowerCase().includes(search.toLowerCase()),
    )
    return (
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface
                filter={false}
                onSearchChange={setSearch}
                orderedItems={shown}
              >
                <DropdownMenu.Input data-testid="input" />
                <DropdownMenu.List>
                  {shown.map((label) => (
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

  it('highlights the first of new orderedItems, a row that mounts with them included', async () => {
    render(<ConsumerFilteredMenu />)
    const input = screen.getByTestId('input')
    await waitFor(() => {
      expect(screen.getByTestId('Apple')).toHaveAttribute('data-highlighted')
    })

    fireEvent.change(input, { target: { value: 'b' } })
    await waitFor(() => {
      expect(screen.getByTestId('Banana')).toHaveAttribute('data-highlighted')
    })
    expect(visibleLabels()).toEqual(['Banana'])

    // Apple mounts again, first.
    fireEvent.change(input, { target: { value: '' } })
    await waitFor(() => {
      expect(screen.getByTestId('Apple')).toHaveAttribute('data-highlighted')
    })
    expect(screen.getByTestId('Banana')).not.toHaveAttribute('data-highlighted')
  })
})

describe('PopupMenuSurface settings', () => {
  it('turns `loop` off in the commit that renders it', async () => {
    let setLoop: (loop: boolean) => void = () => {}
    function LoopMenu() {
      const [loop, set] = React.useState(true)
      setLoop = set
      return (
        <Menu
          surfaceProps={{ loop }}
          inCommit={{
            when: loop,
            // ArrowUp from the first row, pressed before this commit's
            // passive effects: with `loop` off it stays on the first row.
            run: () =>
              fireEvent.keyDown(screen.getByRole('listbox'), {
                key: 'ArrowUp',
              }),
          }}
        />
      )
    }

    render(<LoopMenu />)
    await waitFor(() => {
      expect(screen.getByTestId('Apple')).toHaveAttribute('data-highlighted')
    })
    screen.getByRole('listbox').focus()

    act(() => setLoop(false))

    expect(screen.getByTestId('Apple')).toHaveAttribute('data-highlighted')
    expect(screen.getByTestId('Cherry')).not.toHaveAttribute('data-highlighted')
  })

  it('filters with a new `filter` in the commit that renders it', async () => {
    const onlyBanana: DropdownMenu.Surface.Props['filter'] = (value) =>
      value === 'Banana' ? 1 : 0

    let setCustom: (custom: boolean) => void = () => {}
    function FilterMenu() {
      const [custom, set] = React.useState(false)
      setCustom = set
      return (
        <Menu
          input
          surfaceProps={custom ? { filter: onlyBanana } : {}}
          inCommit={{
            when: custom,
            // A search typed before this commit's passive effects matches
            // with the new filter.
            run: () =>
              fireEvent.change(screen.getByTestId('input'), {
                target: { value: 'a' },
              }),
          }}
        />
      )
    }

    render(<FilterMenu />)
    await waitFor(() => {
      expect(screen.getByTestId('Apple')).toHaveAttribute('data-highlighted')
    })

    act(() => setCustom(true))

    await waitFor(() => {
      expect(screen.getByTestId('input')).toHaveValue('a')
    })
    expect(visibleLabels()).toEqual(['Banana'])
  })
})
