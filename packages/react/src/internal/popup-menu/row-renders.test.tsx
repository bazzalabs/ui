import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'

/**
 * Counts commits per row. A `<Profiler>` around a row reports every render of
 * the row's subtree, including renders caused by store subscriptions inside it.
 */
function createRenderCounter() {
  const counts = new Map<string, number>()
  const onRender: React.ProfilerOnRenderCallback = (id) => {
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return {
    onRender,
    get: (id: string) => counts.get(id) ?? 0,
    snapshot: () => new Map(counts),
  }
}

type RenderCounter = ReturnType<typeof createRenderCounter>

const ITEM_LABELS = Array.from(
  { length: 20 },
  (_, index) => `Item ${String(index + 1).padStart(2, '0')}`,
)

function FilterableMenu({ counter }: { counter: RenderCounter }) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input data-testid="search-input" />
              <DropdownMenu.List>
                {ITEM_LABELS.map((label) => (
                  <React.Profiler
                    key={label}
                    id={label}
                    onRender={counter.onRender}
                  >
                    <DropdownMenu.Item data-testid={label} value={label}>
                      {label}
                    </DropdownMenu.Item>
                  </React.Profiler>
                ))}
                <React.Profiler id="separator" onRender={counter.onRender}>
                  <DropdownMenu.Separator alwaysRender />
                </React.Profiler>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

const SIBLING_LABELS = ['Sibling 1', 'Sibling 2', 'Sibling 3', 'Sibling 4']

function SiblingRow({
  counter,
  label,
}: {
  counter: RenderCounter
  label: string
}) {
  return (
    <React.Profiler id={label} onRender={counter.onRender}>
      <DropdownMenu.Item data-testid={label}>{label}</DropdownMenu.Item>
    </React.Profiler>
  )
}

function SubmenuMenu({ counter }: { counter: RenderCounter }) {
  return (
    <DropdownMenu.Root defaultOpen debug={{ logAimGuardEvents: true }}>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                {SIBLING_LABELS.slice(0, 2).map((label) => (
                  <SiblingRow key={label} counter={counter} label={label} />
                ))}
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger">
                    More
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup data-testid="submenu-popup">
                        <DropdownMenu.Surface>
                          <DropdownMenu.List>
                            <DropdownMenu.Item>Nested</DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
                {SIBLING_LABELS.slice(2).map((label) => (
                  <SiblingRow key={label} counter={counter} label={label} />
                ))}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function createRect(rect: {
  top: number
  left: number
  width: number
  height: number
}): DOMRect {
  return {
    ...rect,
    x: rect.left,
    y: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    toJSON: () => ({}),
  }
}

/** Data attributes that change a row's output. */
function readRowOutput(label: string) {
  const row = screen.queryByTestId(label)
  if (!row) return null
  return [
    row.hasAttribute('data-highlighted'),
    row.hasAttribute('data-first'),
    row.hasAttribute('data-last'),
  ].join()
}

describe('popup menu row re-renders', () => {
  it('re-renders only rows whose output changes while filtering', async () => {
    const user = userEvent.setup()
    const counter = createRenderCounter()
    render(<FilterableMenu counter={counter} />)

    const input = screen.getByTestId('search-input')
    await waitFor(() => {
      expect(screen.getByTestId('Item 01')).toHaveAttribute('data-highlighted')
    })

    await user.type(input, 'i')
    const outputBefore = ITEM_LABELS.map(readRowOutput)
    let before = counter.snapshot()

    // Every row still matches, so no row's output changes.
    await user.type(input, 'tem')
    await waitFor(() => {
      expect(input).toHaveValue('item')
    })
    expect(ITEM_LABELS.map(readRowOutput)).toEqual(outputBefore)
    for (const label of ITEM_LABELS) {
      expect(counter.get(label), label).toBe(before.get(label))
    }
    // The separator's visibility depends only on whether a search is active.
    expect(counter.get('separator')).toBe(before.get('separator'))

    // " 1" hides Item 02-09 and Item 20.
    await user.type(input, ' 1')
    await waitFor(() => {
      expect(screen.queryByTestId('Item 02')).not.toBeInTheDocument()
    })
    const hidden = ITEM_LABELS.filter((label) => readRowOutput(label) === null)
    expect(hidden).toHaveLength(9)
    before = counter.snapshot()

    // Rows that stay hidden don't re-render.
    await user.type(input, '9')
    await waitFor(() => {
      expect(screen.queryByTestId('Item 10')).not.toBeInTheDocument()
    })
    for (const label of hidden) {
      expect(readRowOutput(label), label).toBeNull()
      expect(counter.get(label), label).toBe(before.get(label))
    }
  })

  it('keeps sibling rows still while the aim guard activates and clears', async () => {
    const user = userEvent.setup()
    const counter = createRenderCounter()
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const aimGuardEvents = () =>
      logSpy.mock.calls
        .map(([message]) => String(message))
        .filter((message) =>
          message.startsWith('[PopupMenu][AimGuardProvider]'),
        )

    try {
      render(<SubmenuMenu counter={counter} />)

      const submenuTrigger = await screen.findByTestId('submenu-trigger')
      await user.hover(submenuTrigger)
      const submenuPopup = await screen.findByTestId('submenu-popup')

      vi.spyOn(submenuTrigger, 'getBoundingClientRect').mockImplementation(() =>
        createRect({ top: 60, left: 80, width: 120, height: 30 }),
      )
      vi.spyOn(submenuPopup, 'getBoundingClientRect').mockImplementation(() =>
        createRect({ top: 40, left: 240, width: 180, height: 160 }),
      )

      const countEvents = (name: string) =>
        aimGuardEvents().filter((message) => message.endsWith(` ${name}`))
          .length
      const clearsBefore = countEvents('clear')
      const before = counter.snapshot()

      // Leave the trigger heading toward the submenu.
      fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })
      fireEvent.pointerMove(window, { clientX: 150, clientY: 92 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 94 })
      fireEvent.pointerLeave(submenuTrigger, { clientX: 190, clientY: 94 })
      fireEvent.pointerMove(window, { clientX: 190, clientY: 94 })
      await waitFor(() => {
        expect(countEvents('activate')).toBe(1)
      })

      // Moving inside the submenu clears the guard.
      fireEvent.pointerMove(submenuPopup, { clientX: 250, clientY: 90 })
      await waitFor(() => {
        expect(countEvents('clear')).toBe(clearsBefore + 1)
      })

      for (const label of SIBLING_LABELS) {
        expect(counter.get(label), label).toBe(before.get(label))
      }
    } finally {
      logSpy.mockRestore()
    }
  })
})
