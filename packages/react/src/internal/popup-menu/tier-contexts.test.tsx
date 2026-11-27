import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import * as Listbox from '../listbox/index.js'
import { MenuTreeContext } from './contexts/menu-tree-context.js'
import * as PopupMenuDebug from './contexts/popup-menu-debug-context.js'
import { SurfaceTierContext } from './contexts/surface-tier-context.js'
import * as PopupMenu from './index.js'

interface Seen {
  tree: unknown
  tier: unknown
  submenu: PopupMenu.SubmenuContextValue | null
  popupMenu: PopupMenu.PopupMenuContextValue | null
}

/**
 * Records the tier contexts, and what published reads yield, on every
 * render. It subscribes to its surface's search and highlight, so it renders
 * on each store update.
 */
function Probe({ log }: { log: Seen[] }) {
  const tree = React.useContext(MenuTreeContext)
  const tier = React.useContext(SurfaceTierContext)
  const submenu = PopupMenu.useMaybeSubmenuContext()
  const popupMenu = React.useContext(PopupMenu.PopupMenuContext)
  const { store } = Listbox.useSurfaceContext()
  store.useState('search')
  store.useState('highlightedId')
  log.push({ tree, tier, submenu, popupMenu })
  return null
}

function Menu(props: {
  root: Seen[]
  nested: Seen[]
  loop?: boolean
  debug?: boolean
  disabled?: boolean
  closeRootOnEsc?: boolean
}) {
  const { root, nested, loop, debug, disabled, closeRootOnEsc } = props
  return (
    <DropdownMenu.Root defaultOpen debug={{ logAimGuardEvents: debug }}>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface loop={loop}>
              <DropdownMenu.Input data-testid="root-input" />
              <DropdownMenu.List>
                <Probe log={root} />
                <DropdownMenu.Item>Apple</DropdownMenu.Item>
                <DropdownMenu.Item>Banana</DropdownMenu.Item>
                <DropdownMenu.Submenu
                  defaultOpen
                  disabled={disabled}
                  closeRootOnEsc={closeRootOnEsc}
                >
                  <DropdownMenu.SubmenuTrigger>
                    More
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup>
                        <DropdownMenu.Surface loop={loop}>
                          <DropdownMenu.Input data-testid="nested-input" />
                          <DropdownMenu.List>
                            <Probe log={nested} />
                            <DropdownMenu.Item>Cherry</DropdownMenu.Item>
                            <DropdownMenu.Item>Date</DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

const distinct = (log: Seen[], key: 'tree' | 'tier') =>
  new Set(log.map((seen) => seen[key])).size

describe('popup menu tier contexts', () => {
  it('keep the same tree and surface tier values across store updates and new props', async () => {
    const user = userEvent.setup()
    const root: Seen[] = []
    const nested: Seen[] = []
    const { rerender } = render(<Menu root={root} nested={nested} />)
    await screen.findByTestId('nested-input')

    // Store updates in the submenu: a search and a highlight.
    await user.type(screen.getByTestId('nested-input'), 'd')
    await user.keyboard('{ArrowDown}')

    // New props on the root, the submenu and both surfaces.
    rerender(
      <Menu
        root={root}
        nested={nested}
        loop={false}
        debug
        disabled
        closeRootOnEsc={false}
      />,
    )
    await act(async () => {})

    // Store updates in the root (which may close the submenu).
    await user.type(screen.getByTestId('root-input'), 'an')
    await user.keyboard('{ArrowDown}')

    // Each probe rendered for those updates, with one value per tier.
    expect(root.length).toBeGreaterThan(3)
    expect(nested.length).toBeGreaterThan(3)
    expect(distinct(root, 'tree')).toBe(1)
    expect(distinct(root, 'tier')).toBe(1)
    expect(distinct(nested, 'tree')).toBe(1)
    expect(distinct(nested, 'tier')).toBe(1)
    // One tree for the menu; a tier per surface.
    expect(nested[0]?.tree).toBe(root[0]?.tree)
    expect(nested[0]?.tier).not.toBe(root[0]?.tier)
    expect(root[0]?.tree).not.toBeNull()
    expect(root[0]?.tier).not.toBeNull()
  })

  it('still yield the submenu and the published contexts, with the latest values', async () => {
    const root: Seen[] = []
    const nested: Seen[] = []
    const { rerender } = render(<Menu root={root} nested={nested} />)
    await screen.findByTestId('nested-input')

    const first = nested.at(-1)
    expect(root.at(-1)?.submenu).toBeNull()
    expect(first?.submenu).toMatchObject({
      open: true,
      closeRootOnEsc: true,
    })
    expect(first?.popupMenu).toMatchObject({ depth: 1, disabled: false })

    rerender(
      <Menu root={root} nested={nested} disabled closeRootOnEsc={false} />,
    )
    await act(async () => {})

    const last = nested.at(-1)
    expect(last?.submenu).toMatchObject({ open: true, closeRootOnEsc: false })
    // The submenu's handle stays the same: only its state changed.
    expect(last?.submenu?.setOpen).toBe(first?.submenu?.setOpen)
    expect(last?.submenu?.triggerRef).toBe(first?.submenu?.triggerRef)
    expect(last?.popupMenu).toMatchObject({ depth: 1, disabled: true })
  })
})

function CoordinatorProbe({
  name,
  log,
}: {
  name: string
  log: Record<string, unknown[]>
}) {
  const coordinator = PopupMenu.useMaybeAsyncMenuCoordinator()
  const required = PopupMenu.useAsyncMenuCoordinator()
  log[name] = [...(log[name] ?? []), coordinator, required]
  return null
}

describe('popup menu loader scope', () => {
  it('gives every reader in a data-first surface one coordinator, and none outside one', async () => {
    const user = userEvent.setup()
    const log: Record<string, unknown[]> = {}
    const content: DropdownMenu.NodeDef[] = [
      {
        kind: 'item',
        id: 'apple',
        value: 'Apple',
        render: ({ props }) => (
          <DropdownMenu.Item {...props}>Apple</DropdownMenu.Item>
        ),
      },
    ]
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface content={content}>
                <DropdownMenu.Input data-testid="data-input" />
                <CoordinatorProbe name="a" log={log} />
                <CoordinatorProbe name="b" log={log} />
                <DropdownMenu.List />
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    await user.type(screen.getByTestId('data-input'), 'ap')

    const a = log.a?.at(-1) as PopupMenu.AsyncMenuCoordinatorValue
    expect(a).not.toBeNull()
    expect(a.searchQuery).toBe('ap')
    expect(log.a?.at(-2)).toBe(a)
    expect(log.b?.at(-1)).toBe(a)
  })

  it('gives a JSX surface no coordinator', () => {
    const log: Record<string, unknown[]> = {}
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <CoordinatorProbe name="jsx" log={log} />
                <DropdownMenu.List />
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    expect(log.jsx?.length).toBeGreaterThan(0)
    expect(log.jsx?.every((value) => value === null)).toBe(true)
  })
})

function CheckboxMenu({
  open,
  mode = 'visible',
}: {
  open: boolean
  mode?: 'visible' | 'hidden'
}) {
  return (
    <DropdownMenu.Root open={open}>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <React.Activity mode={mode}>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  {['A', 'B', 'C'].map((label) => (
                    <DropdownMenu.CheckboxItem
                      key={label}
                      value={label}
                      data-testid={label}
                    >
                      {label}
                    </DropdownMenu.CheckboxItem>
                  ))}
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </React.Activity>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

describe('popup menu surface tier selection', () => {
  it('keeps the selection of a Surface hidden and shown again by <Activity>', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<CheckboxMenu open />)
    await user.click(await screen.findByTestId('A'))

    rerender(<CheckboxMenu open mode="hidden" />)
    await act(async () => {})
    rerender(<CheckboxMenu open />)
    await act(async () => {})

    // The anchor survived: Shift-click checks A through C.
    await user.keyboard('{Shift>}')
    await user.click(screen.getByTestId('C'))
    await user.keyboard('{/Shift}')
    for (const label of ['A', 'B', 'C']) {
      expect(screen.getByTestId(label)).toHaveAttribute('aria-checked', 'true')
    }
  })

  it('starts each Surface with a fresh selection: no anchor from the last time it was open', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<CheckboxMenu open />)
    await user.click(await screen.findByTestId('A'))
    expect(screen.getByTestId('A')).toHaveAttribute('aria-checked', 'true')

    rerender(<CheckboxMenu open={false} />)
    await act(async () => {})
    expect(screen.queryByTestId('A')).toBeNull()
    rerender(<CheckboxMenu open />)

    // Shift-click with no anchor toggles that row alone.
    await user.keyboard('{Shift>}')
    await user.click(await screen.findByTestId('C'))
    await user.keyboard('{/Shift}')
    expect(screen.getByTestId('C')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('B')).toHaveAttribute('aria-checked', 'false')
  })
})

describe('popup menu submenu context', () => {
  it('gives every caller in a render the same value', async () => {
    const seen: Record<string, unknown[]> = { a: [], b: [] }
    function Reader({ name }: { name: string }) {
      seen[name]?.push(PopupMenu.useMaybeSubmenuContext())
      return null
    }
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <DropdownMenu.Submenu defaultOpen>
                    <DropdownMenu.SubmenuTrigger>
                      More
                    </DropdownMenu.SubmenuTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Positioner>
                        <DropdownMenu.Popup>
                          <DropdownMenu.Surface>
                            <DropdownMenu.List>
                              <Reader name="a" />
                              <Reader name="b" />
                              <DropdownMenu.Item>Nested</DropdownMenu.Item>
                            </DropdownMenu.List>
                          </DropdownMenu.Surface>
                        </DropdownMenu.Popup>
                      </DropdownMenu.Positioner>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Submenu>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    await screen.findByText('Nested')
    const a = seen.a?.at(-1)
    expect(a).not.toBeNull()
    expect(a).toMatchObject({ open: true })
    expect(seen.b?.at(-1)).toBe(a)
  })
})

describe('popup menu tree tier settings', () => {
  it('reads the debug flags from the first render, and their later values', async () => {
    const seen: boolean[] = []
    function DebugProbe() {
      seen.push(PopupMenuDebug.usePopupMenuDebug().logAimGuardEvents)
      return null
    }
    function DebugMenu({ log }: { log: boolean }) {
      return (
        <DropdownMenu.Root debug={{ logAimGuardEvents: log }}>
          {/* Beside the trigger, so it renders in the root's first pass. */}
          <DebugProbe />
          <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        </DropdownMenu.Root>
      )
    }
    const { rerender } = render(<DebugMenu log />)
    expect(seen[0]).toBe(true)
    rerender(<DebugMenu log={false} />)
    await act(async () => {})
    expect(seen.at(-1)).toBe(false)
  })
})
