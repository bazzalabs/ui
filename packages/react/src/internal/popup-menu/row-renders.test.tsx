import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
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
})
