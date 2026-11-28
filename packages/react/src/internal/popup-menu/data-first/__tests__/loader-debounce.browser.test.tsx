import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import { createVanillaQueryLoader } from '../../../../loaders/vanilla.js'
import type { ItemDef, NodeDef } from '../types.js'

// The debounce runs on the menu tree's loader manager, on real timers, while
// React renders the keys and the loader's answers. jsdom runs both on fake
// time; here they race as they do in an app. The keys come 30 ms apart, far
// inside the debounce, so the timings hold on a slow machine too.

const DEBOUNCE = 600
const KEY_DELAY = 30

function item(value: string): ItemDef {
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

interface Commit {
  search: string
  fetching: boolean
  loading: boolean
  rows: number
}

function Rows({ commits }: { commits: Commit[] }) {
  const state = DropdownMenu.useDataList()
  React.useLayoutEffect(() => {
    commits.push({
      search: state.search,
      fetching: state.async.isFetching,
      loading: document.querySelector('[data-testid="loading"]') !== null,
      rows: state.nodes.length,
    })
  })
  return <>{state.nodes.map(state.renderNode)}</>
}

function Menu({
  fetcher,
  commits,
  minQueryLength,
}: {
  fetcher: (query: string) => Promise<NodeDef[]>
  commits: Commit[]
  minQueryLength: number
}) {
  const [loader] = React.useState(() =>
    createVanillaQueryLoader({
      fetcher,
      minQueryLength,
      initialQueryBehavior: minQueryLength > 0 ? false : undefined,
      debounce: DEBOUNCE,
    }),
  )
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup style={{ width: 200 }}>
            <DropdownMenu.Surface content={[]} asyncContent={loader}>
              <DropdownMenu.Input aria-label="Search" data-testid="input" />
              <DropdownMenu.List>
                <DropdownMenu.Loading data-testid="loading">
                  Loading
                </DropdownMenu.Loading>
                <DropdownMenu.Empty data-testid="empty">
                  None
                </DropdownMenu.Empty>
                <Rows commits={commits} />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/** Records every time an element with `testId` is added or removed. */
function watch(testId: string) {
  const changes: Array<'added' | 'removed'> = []
  const matches = (nodes: NodeList) =>
    [...nodes].some(
      (node) =>
        node instanceof Element &&
        (node.matches(`[data-testid="${testId}"]`) ||
          node.querySelector(`[data-testid="${testId}"]`) !== null),
    )
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (matches(record.removedNodes)) changes.push('removed')
      if (matches(record.addedNodes)) changes.push('added')
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
  return { changes, stop: () => observer.disconnect() }
}

describe('query loader debounce in the browser', () => {
  it('runs only the last search, keeping Loading up from the wait to its answer', async () => {
    const queries: string[] = []
    const commits: Commit[] = []
    const fetcher = async (query: string): Promise<NodeDef[]> => {
      queries.push(query)
      await new Promise((resolve) => setTimeout(resolve, 50))
      return [item('Bob')]
    }
    render(<Menu fetcher={fetcher} commits={commits} minQueryLength={2} />)
    // 'b' is too short to run: nothing loads, and the empty list says so.
    await userEvent.type(screen.getByTestId('input'), 'b')
    await vi.waitFor(() => expect(screen.getByTestId('empty')).toBeTruthy())
    expect(screen.queryByTestId('loading')).toBeNull()

    const loading = watch('loading')
    const empty = watch('empty')
    try {
      await userEvent.type(screen.getByTestId('input'), 'ob', {
        delay: KEY_DELAY,
      })
      await vi.waitFor(
        () => expect(screen.getByTestId('item-bob')).toBeTruthy(),
        { timeout: DEBOUNCE * 4 },
      )
    } finally {
      loading.stop()
      empty.stop()
    }

    expect(queries).toEqual(['bob'])
    // Loading came up once the search could run, and stayed until the rows.
    expect(loading.changes).toEqual(['added', 'removed'])
    // Empty went when the search could run, and never came back.
    expect(empty.changes).toEqual(['removed'])
    // Every commit from Loading's first to the rows' is fetching with it up.
    const waiting = commits.slice(
      commits.findIndex((commit) => commit.loading),
      commits.findIndex((commit) => commit.rows > 0),
    )
    expect(waiting.length).toBeGreaterThan(0)
    for (const commit of waiting) {
      expect(commit).toMatchObject({ fetching: true, loading: true })
    }
  })

  it('shows Empty only once the waited-for search settles with no rows', async () => {
    const commits: Commit[] = []
    const fetcher = async (query: string): Promise<NodeDef[]> =>
      query === '' ? [item('Alice')] : []
    render(<Menu fetcher={fetcher} commits={commits} minQueryLength={0} />)
    await vi.waitFor(() =>
      expect(screen.getByTestId('item-alice')).toBeTruthy(),
    )
    const empty = watch('empty')
    try {
      await userEvent.type(screen.getByTestId('input'), 'zz', {
        delay: KEY_DELAY,
      })
      // Well inside the debounce: the search still waits.
      expect(screen.queryByTestId('empty')).toBeNull()
      await vi.waitFor(() => expect(screen.getByTestId('empty')).toBeTruthy(), {
        timeout: DEBOUNCE * 4,
      })
    } finally {
      empty.stop()
    }
    expect(empty.changes).toEqual(['added'])
    expect(screen.queryByTestId('item-alice')).toBeNull()
  })
})
