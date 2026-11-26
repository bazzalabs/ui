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
  const snapshot = () => new Map(counts)
  return {
    onRender,
    get: (id: string) => counts.get(id) ?? 0,
    snapshot,
    /** Commits per row since `before`, for rows that committed at all. */
    since: (before: ReturnType<typeof snapshot>) =>
      Object.fromEntries(
        [...counts]
          .map(([id, count]) => [id, count - (before.get(id) ?? 0)] as const)
          .filter(([, delta]) => delta > 0),
      ),
  }
}

type RenderCounter = ReturnType<typeof createRenderCounter>

const ITEM_LABELS = Array.from(
  { length: 20 },
  (_, index) => `Item ${String(index + 1).padStart(2, '0')}`,
)

function FilterableMenu({
  counter,
  input = true,
  separator = true,
}: {
  counter: RenderCounter
  input?: boolean
  separator?: boolean
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              {input && <DropdownMenu.Input data-testid="search-input" />}
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
                {separator && (
                  <React.Profiler id="separator" onRender={counter.onRender}>
                    <DropdownMenu.Separator alwaysRender />
                  </React.Profiler>
                )}
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

const GROUPS = [
  { label: 'Fruits', items: ['Apple', 'Banana', 'Cherry'] },
  { label: 'Vegetables', items: ['Carrot', 'Potato', 'Pepper'] },
]

const GROUPED_LABELS = GROUPS.flatMap((group) => group.items)

function GroupedMenu({ counter }: { counter: RenderCounter }) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input data-testid="search-input" />
              <DropdownMenu.List>
                {GROUPS.map((group) => (
                  <DropdownMenu.Group key={group.label}>
                    <DropdownMenu.GroupLabel>
                      {group.label}
                    </DropdownMenu.GroupLabel>
                    {group.items.map((label) => (
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
                  </DropdownMenu.Group>
                ))}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function DataRows() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

/** `FilterableMenu` and `GroupedMenu`'s rows, as data-first content. */
function DataFilterableMenu({
  counter,
  grouped = false,
}: {
  counter: RenderCounter
  grouped?: boolean
}) {
  const content = React.useMemo(() => {
    const row = (label: string): DropdownMenu.NodeDef => ({
      kind: 'item',
      id: label,
      value: label,
      render: ({ props }) => (
        <React.Profiler id={label} onRender={counter.onRender}>
          <DropdownMenu.Item {...props} data-testid={label}>
            {label}
          </DropdownMenu.Item>
        </React.Profiler>
      ),
    })
    if (!grouped) return ITEM_LABELS.map(row)
    return GROUPS.map(
      (group): DropdownMenu.NodeDef => ({
        kind: 'group',
        id: group.label,
        label: group.label,
        nodes: group.items.map(row),
      }),
    )
  }, [counter, grouped])

  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface content={content}>
              <DropdownMenu.Input data-testid="search-input" />
              <DropdownMenu.List>
                <DataRows />
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
    row.hasAttribute('data-first-in-group'),
    row.hasAttribute('data-last-in-group'),
  ].join()
}

/** Rows whose output differs between two reads of `readRowOutput`. */
function changedRows(
  labels: readonly string[],
  before: readonly (string | null)[],
) {
  return labels.filter((label, index) => readRowOutput(label) !== before[index])
}

/**
 * Types one key into a menu's input and reports the rows whose output changed
 * and the commits per row the key cost.
 */
async function measureKey(
  menu: {
    user: ReturnType<typeof userEvent.setup>
    input: HTMLElement
    counter: RenderCounter
    labels: readonly string[]
  },
  key: string,
) {
  const outputBefore = menu.labels.map(readRowOutput)
  const before = menu.counter.snapshot()
  await menu.user.type(menu.input, key)
  return {
    changed: changedRows(menu.labels, outputBefore),
    commits: menu.counter.since(before),
  }
}

describe('popup menu row registration', () => {
  it('publishes rows and items that mount together once, before the render returns', () => {
    const counter = createRenderCounter()
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  {ITEM_LABELS.map((label) => (
                    <React.Profiler
                      key={label}
                      id={label}
                      onRender={counter.onRender}
                    >
                      <DropdownMenu.Item value={label} data-testid={label}>
                        {label}
                      </DropdownMenu.Item>
                    </React.Profiler>
                  ))}
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )

    // Synchronously after the render: published by the list, not a microtask.
    expect(screen.getAllByRole('option')).toHaveLength(ITEM_LABELS.length)
    expect(ITEM_LABELS.map(readRowOutput)).toEqual(
      ITEM_LABELS.map((_, index) =>
        [
          index === 0,
          index === 0,
          index === ITEM_LABELS.length - 1,
          false,
          false,
        ].join(),
      ),
    )
    // One publish of the whole batch costs at most two commits per row, three
    // for the first and last (whose edge attributes change). Rows publishing
    // one at a time commit every row a third time.
    ITEM_LABELS.forEach((label, index) => {
      const edge = index === 0 || index === ITEM_LABELS.length - 1
      expect(counter.get(label)).toBeLessThanOrEqual(edge ? 3 : 2)
    })
  })
})

describe('popup menu row re-renders', () => {
  it.each([
    { from: 'the input', input: true },
    { from: 'the list', input: false },
  ])('ArrowDown from $from re-renders only the two rows whose highlight moves', async ({
    input,
  }) => {
    const user = userEvent.setup()
    const counter = createRenderCounter()
    render(<FilterableMenu counter={counter} input={input} />)
    await waitFor(() => {
      expect(screen.getByTestId('Item 01')).toHaveAttribute('data-highlighted')
    })
    const focusTarget = input
      ? screen.getByTestId('search-input')
      : screen.getByRole('listbox')
    focusTarget.focus()

    let before = counter.snapshot()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByTestId('Item 02')).toHaveAttribute('data-highlighted')
    expect(counter.since(before)).toEqual({ 'Item 01': 1, 'Item 02': 1 })

    before = counter.snapshot()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByTestId('Item 03')).toHaveAttribute('data-highlighted')
    expect(counter.since(before)).toEqual({ 'Item 02': 1, 'Item 03': 1 })
  })

  it('re-renders no row for a key that changes no row, and not the separator for one that hides rows', async () => {
    const user = userEvent.setup()
    const counter = createRenderCounter()
    render(<FilterableMenu counter={counter} />)
    const input = screen.getByTestId('search-input')
    await waitFor(() => {
      expect(screen.getByTestId('Item 01')).toHaveAttribute('data-highlighted')
    })
    const menu = { user, input, counter, labels: ITEM_LABELS }

    // Known extra render, tracked separately: the separator subscribes to
    // `hasSearch` even though `alwaysRender` keeps its output the same.
    expect(await measureKey(menu, 'i')).toEqual({
      changed: [],
      commits: { separator: 1 },
    })

    // Every row still matches "item ", in the same place, with the same
    // highlight.
    for (const key of ['t', 'e', 'm', ' ']) {
      expect(await measureKey(menu, key), key).toEqual({
        changed: [],
        commits: {},
      })
    }
    expect(input).toHaveValue('item ')

    // A key that hides rows leaves the separator alone too: it stays the last
    // row, and `alwaysRender` keeps it visible.
    const { commits } = await measureKey(menu, '1')
    expect(commits).not.toHaveProperty('separator')
    expect(Object.keys(commits).length).toBeGreaterThan(0)
  })

  // Commit costs of a narrowing key (a known cost, pinned by the exact counts
  // in this test and the grouped one). Per row, each applies separately:
  // - hidden by the key: 2 (it hides, then its row element ref clears);
  // - gains or loses an edge (first, last, first or last in group): +1, in a
  //   later commit once the hidden rows unregister;
  // - gains or loses the highlight while staying visible: +1 (a row the key
  //   hides loses it in the commit that hides it).
  // A row whose output doesn't change doesn't commit.
  it('re-renders only the rows a narrowing key hides or moves to an edge', async () => {
    const user = userEvent.setup()
    const counter = createRenderCounter()
    render(<FilterableMenu counter={counter} separator={false} />)
    const input = screen.getByTestId('search-input')
    await waitFor(() => {
      expect(screen.getByTestId('Item 01')).toHaveAttribute('data-highlighted')
    })
    await user.type(input, 'item ')
    const menu = { user, input, counter, labels: ITEM_LABELS }

    // "1" hides Item 02-09 and Item 20, so Item 19 becomes the last row.
    const hiddenByOne = ITEM_LABELS.slice(1, 9)
    expect(await measureKey(menu, '1')).toEqual({
      changed: [...hiddenByOne, 'Item 19', 'Item 20'],
      commits: {
        ...Object.fromEntries(hiddenByOne.map((label) => [label, 2])),
        'Item 19': 1,
        'Item 20': 3,
      },
    })
    expect(readRowOutput('Item 19')).toBe('false,false,true,false,false')

    // "9" hides Item 01 and Item 10-18, so Item 19 becomes the first row and
    // takes the highlight. Rows that stay hidden don't re-render.
    const hiddenByNine = ITEM_LABELS.slice(9, 18)
    expect(await measureKey(menu, '9')).toEqual({
      changed: ['Item 01', ...hiddenByNine, 'Item 19'],
      commits: {
        'Item 01': 3,
        ...Object.fromEntries(hiddenByNine.map((label) => [label, 2])),
        'Item 19': 2,
      },
    })
    expect(readRowOutput('Item 19')).toBe('true,true,true,false,false')
  })

  it('re-renders only the rows a narrowing key hides or moves to a group edge', async () => {
    const user = userEvent.setup()
    const counter = createRenderCounter()
    render(<GroupedMenu counter={counter} />)
    const input = screen.getByTestId('search-input')
    await waitFor(() => {
      expect(screen.getByTestId('Apple')).toHaveAttribute('data-highlighted')
    })
    const menu = { user, input, counter, labels: GROUPED_LABELS }

    // "a" hides Cherry and Pepper, so Banana and Potato become last in group.
    // Counts follow "Commit costs of a narrowing key" above.
    expect(await measureKey(menu, 'a')).toEqual({
      changed: ['Banana', 'Cherry', 'Potato', 'Pepper'],
      commits: { Banana: 1, Cherry: 3, Potato: 1, Pepper: 3 },
    })
    expect(readRowOutput('Banana')).toBe('false,false,false,false,true')
    expect(readRowOutput('Potato')).toBe('false,false,false,false,true')

    // "p" hides Banana, Carrot and Potato, so Apple becomes last in group.
    expect(await measureKey(menu, 'p')).toEqual({
      changed: ['Apple', 'Banana', 'Carrot', 'Potato'],
      commits: { Apple: 1, Banana: 3, Carrot: 3, Potato: 3 },
    })
    expect(readRowOutput('Apple')).toBe('true,false,false,true,true')

    // "e" keeps Apple and changes nothing.
    expect(await measureKey(menu, 'e')).toEqual({ changed: [], commits: {} })
  })

  it('re-renders only the two rows whose highlight moves when the pointer moves onto a row', async () => {
    const counter = createRenderCounter()
    render(<FilterableMenu counter={counter} input={false} />)
    await waitFor(() => {
      expect(screen.getByTestId('Item 01')).toHaveAttribute('data-highlighted')
    })

    // The store ignores a pointer that hasn't moved, so each move goes to a
    // new point.
    let before = counter.snapshot()
    fireEvent.pointerMove(screen.getByTestId('Item 05'), {
      clientX: 10,
      clientY: 50,
    })
    expect(screen.getByTestId('Item 05')).toHaveAttribute('data-highlighted')
    expect(counter.since(before)).toEqual({ 'Item 01': 1, 'Item 05': 1 })

    before = counter.snapshot()
    fireEvent.pointerMove(screen.getByTestId('Item 07'), {
      clientX: 10,
      clientY: 70,
    })
    expect(screen.getByTestId('Item 07')).toHaveAttribute('data-highlighted')
    expect(counter.since(before)).toEqual({ 'Item 05': 1, 'Item 07': 1 })
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

  // Data-first rows bind to the list's Collection instead of registering,
  // and a row's `render` only runs when what it renders from changes. A row a
  // key hides unmounts (no commit); a row that stays commits once when its
  // output changes (an edge or the highlight), and not at all otherwise.
  it('data-first: re-renders no row for a key that changes no row', async () => {
    const user = userEvent.setup()
    const counter = createRenderCounter()
    render(<DataFilterableMenu counter={counter} />)
    const input = screen.getByTestId('search-input')
    await waitFor(() => {
      expect(screen.getByTestId('Item 01')).toHaveAttribute('data-highlighted')
    })
    const menu = { user, input, counter, labels: ITEM_LABELS }

    // The first key starts a search: every row still matches, in the same
    // place, with the same highlight.
    for (const key of ['i', 't', 'e', 'm', ' ']) {
      expect(await measureKey(menu, key), key).toEqual({
        changed: [],
        commits: {},
      })
    }
    expect(input).toHaveValue('item ')
  })

  it('data-first: re-renders only the rows a narrowing key moves to an edge or highlights', async () => {
    const user = userEvent.setup()
    const counter = createRenderCounter()
    render(<DataFilterableMenu counter={counter} />)
    const input = screen.getByTestId('search-input')
    await waitFor(() => {
      expect(screen.getByTestId('Item 01')).toHaveAttribute('data-highlighted')
    })
    await user.type(input, 'item ')
    const menu = { user, input, counter, labels: ITEM_LABELS }

    // "1" hides Item 02-09 and Item 20, and scores Item 10 first and Item 01
    // last: Item 10 takes the first edge and the highlight, and Item 01 the
    // last edge.
    expect(await measureKey(menu, '1')).toEqual({
      changed: ITEM_LABELS.slice(0, 10).concat('Item 20'),
      commits: { 'Item 01': 1, 'Item 10': 1 },
    })
    expect(readRowOutput('Item 10')).toBe('true,true,false,false,false')
    expect(readRowOutput('Item 01')).toBe('false,false,true,false,false')

    // "9" hides every row but Item 19, which takes both edges and the
    // highlight.
    // Rows that stay hidden don't re-render.
    expect(await measureKey(menu, '9')).toEqual({
      changed: ['Item 01', ...ITEM_LABELS.slice(9, 19)],
      commits: { 'Item 19': 1 },
    })
    expect(readRowOutput('Item 19')).toBe('true,true,true,false,false')
  })

  it('data-first: re-renders only the rows a narrowing key moves to an edge in a grouped menu', async () => {
    const user = userEvent.setup()
    const counter = createRenderCounter()
    render(<DataFilterableMenu counter={counter} grouped />)
    const input = screen.getByTestId('search-input')
    await waitFor(() => {
      expect(screen.getByTestId('Apple')).toHaveAttribute('data-highlighted')
    })
    const menu = { user, input, counter, labels: GROUPED_LABELS }

    // Default data-first groups aren't rows: positions count item rows only.
    // "a" hides Cherry and Pepper, so Potato becomes the last row.
    expect(await measureKey(menu, 'a')).toEqual({
      changed: ['Cherry', 'Potato', 'Pepper'],
      commits: { Potato: 1 },
    })
    expect(readRowOutput('Potato')).toBe('false,false,true,false,false')

    // "p" hides Banana, Carrot and Potato, so Apple becomes the last row.
    expect(await measureKey(menu, 'p')).toEqual({
      changed: ['Apple', 'Banana', 'Carrot', 'Potato'],
      commits: { Apple: 1 },
    })
    expect(readRowOutput('Apple')).toBe('true,true,true,false,false')

    // "e" keeps Apple and changes nothing.
    expect(await measureKey(menu, 'e')).toEqual({ changed: [], commits: {} })
  })

  it('data-first: re-renders no submenu or subpage trigger row for a key that changes neither', async () => {
    const user = userEvent.setup()
    const counter = createRenderCounter()
    const content: DropdownMenu.NodeDef[] = [
      {
        kind: 'submenu',
        id: 'sub',
        value: 'Item submenu',
        nodes: [{ kind: 'item', value: 'Nested', render: () => null }],
        render: ({ props }) => (
          <React.Profiler id="submenu" onRender={counter.onRender}>
            <DropdownMenu.Submenu>
              <DropdownMenu.SubmenuTrigger {...props} data-testid="submenu">
                Item submenu
              </DropdownMenu.SubmenuTrigger>
            </DropdownMenu.Submenu>
          </React.Profiler>
        ),
      },
      {
        kind: 'subpage',
        id: 'page',
        value: 'Item subpage',
        nodes: [],
        renderTrigger: ({ props }) => (
          <React.Profiler id="subpage" onRender={counter.onRender}>
            <DropdownMenu.SubpageTrigger {...props} data-testid="subpage">
              Item subpage
            </DropdownMenu.SubpageTrigger>
          </React.Profiler>
        ),
        renderContent: () => null,
      },
    ]
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface content={content}>
                <DropdownMenu.Input data-testid="search-input" />
                <DropdownMenu.List>
                  <DataRows />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    const input = screen.getByTestId('search-input')
    await waitFor(() => {
      expect(screen.getByTestId('submenu')).toHaveAttribute('data-highlighted')
    })
    const menu = { user, input, counter, labels: ['submenu', 'subpage'] }

    // Both rows match every key of "item", in the same place.
    for (const key of ['i', 't', 'e', 'm']) {
      expect(await measureKey(menu, key), key).toEqual({
        changed: [],
        commits: {},
      })
    }
  })
})
