import { Popover } from '@base-ui/react/popover'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Combobox } from '../../combobox/index.js'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import {
  type MenuTreeTier,
  useMaybeMenuTree,
  useMaybeMenuTreeTier,
} from './contexts/menu-tree-context.js'
import {
  type PopupMenuContextValue,
  useMaybePopupMenuContext,
} from './contexts/popup-menu-context.js'
import { usePopupMenuDebug } from './contexts/popup-menu-debug-context.js'
import {
  FocusOwnerStore,
  PopupMenuList,
  PopupMenuPopup,
  PopupMenuPortal,
  PopupMenuPositioner,
  PopupMenuProviders,
  PopupMenuSubmenuRoot,
  PopupMenuSubmenuTrigger,
  PopupMenuSurface,
  usePopupMenuRoot,
} from './index.js'
import { createMenuTreeResolver } from './menu-tree/resolver.js'
import { askRootOpen, MenuTreeStore } from './store/MenuTreeStore.js'

type ListboxStoreOf = NonNullable<
  ReturnType<typeof useMaybePopupMenuContext>
>['store']

/**
 * The root's settings and own surfaces live in its tree (`MenuTreeStore`):
 * its debug flags, its `disabled` (prop and actions) and the submenus and
 * subpages it closes with it. The published contexts still carry them.
 */

interface Seen {
  tree: MenuTreeStore | null
  disabled: boolean | undefined
  context: PopupMenuContextValue | null
}

function Probe({ log }: { log: Seen[] }) {
  const tree = useMaybeMenuTree()
  const context = useMaybePopupMenuContext()
  log.push({ tree, disabled: context?.disabled, context })
  return null
}

function Menu({
  log,
  disabled,
  actionsRef,
  debug,
  onSubmenuOpenChange,
}: {
  log: Seen[]
  disabled?: boolean
  actionsRef?: React.Ref<DropdownMenu.Root.Actions>
  debug?: boolean
  onSubmenuOpenChange?: DropdownMenu.Submenu.Props['onOpenChange']
}) {
  return (
    <DropdownMenu.Root
      defaultOpen
      disabled={disabled}
      actionsRef={actionsRef}
      debug={{ logAimGuardEvents: debug }}
    >
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <Probe log={log} />
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                <DropdownMenu.Item>Apple</DropdownMenu.Item>
                <DropdownMenu.Submenu onOpenChange={onSubmenuOpenChange}>
                  <DropdownMenu.SubmenuTrigger data-testid="more">
                    More
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup data-testid="nested">
                        <DropdownMenu.Surface>
                          <DropdownMenu.List>
                            <DropdownMenu.Item>Nested</DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger data-testid="other">
                    Other
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup>
                        <DropdownMenu.Surface>
                          <DropdownMenu.List>
                            <DropdownMenu.Item>Other nested</DropdownMenu.Item>
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

describe('a menu root’s disabled', () => {
  it('is its prop or its actions’, kept in its tree, and the published context carries it in the same render', async () => {
    const log: Seen[] = []
    const actions = React.createRef<DropdownMenu.Root.Actions>()
    const { rerender } = render(<Menu log={log} actionsRef={actions} />)
    await screen.findByText('Apple')
    const tree = log.at(-1)?.tree
    expect(tree).toBeInstanceOf(MenuTreeStore)
    expect(tree?.select('disabled')).toBe(false)

    act(() => actions.current?.setDisabled(true))
    expect(log.at(-1)?.disabled).toBe(true)
    expect(tree?.select('disabled')).toBe(true)
    act(() => actions.current?.setDisabled(false))
    expect(log.at(-1)?.disabled).toBe(false)
    expect(tree?.select('disabled')).toBe(false)

    // The prop, on and off again: every render the probe sees carries the
    // prop it was given.
    const from = log.length
    rerender(<Menu log={log} actionsRef={actions} disabled />)
    expect(log.slice(from).map((seen) => seen.disabled)).not.toContain(false)
    expect(tree?.select('disabled')).toBe(true)
    const off = log.length
    rerender(<Menu log={log} actionsRef={actions} disabled={false} />)
    expect(log.slice(off).map((seen) => seen.disabled)).not.toContain(true)
    expect(tree?.select('disabled')).toBe(false)
    expect(log.every((seen) => seen.tree === tree)).toBe(true)
  })

  it('is read by the gate when a change is asked, so closeAll stays the same function', async () => {
    const log: Seen[] = []
    const actions = React.createRef<DropdownMenu.Root.Actions>()
    const { rerender } = render(<Menu log={log} actionsRef={actions} />)
    await screen.findByText('Apple')
    const closeAll = log.at(-1)?.context?.closeAll
    act(() => actions.current?.setDisabled(true))
    // Disabled by its actions, the gate refuses a user's close at once.
    expect(log.at(-1)?.tree?.ask?.(false, 'escape-key')).toBe('refused')
    rerender(<Menu log={log} actionsRef={actions} disabled />)
    act(() => actions.current?.setDisabled(false))
    rerender(<Menu log={log} actionsRef={actions} />)
    expect(new Set(log.map((seen) => seen.context?.closeAll))).toEqual(
      new Set([closeAll]),
    )

    // Disabled, the tree's gate refuses a user's close, and lets the
    // engine's through.
    rerender(<Menu log={log} actionsRef={actions} disabled />)
    const tree = log.at(-1)?.tree
    expect(tree?.ask?.(false, 'escape-key')).toBe('refused')
    expect(screen.getByText('Apple')).toBeInTheDocument()
    act(() => closeAll?.())
    await waitFor(() => expect(screen.queryByText('Apple')).toBeNull())
  })
})

describe('a menu root’s disabled in the commit it changes', () => {
  function Box({
    disabled,
    input,
    asks,
    onOpenChange,
  }: {
    disabled: boolean
    input?: 'autofocus' | 'plain'
    /** A child that asks the root to open from its layout effect. */
    asks?: boolean
    onOpenChange: (open: boolean) => void
  }) {
    return (
      <Combobox.Root
        disabled={disabled}
        openOnFocus
        onOpenChange={onOpenChange}
      >
        {input && (
          <Combobox.Input
            data-testid="input"
            autoFocus={input === 'autofocus'}
          />
        )}
        {asks && <AsksToOpen />}
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup data-testid="popup">
              <Combobox.Surface>
                <Combobox.List>
                  <Combobox.Item value="a">A</Combobox.Item>
                </Combobox.List>
              </Combobox.Surface>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    )
  }

  function AsksToOpen() {
    const store = useMaybePopupMenuContext()?.store
    React.useLayoutEffect(() => {
      if (store) askRootOpen(store, true, 'trigger-press')
    }, [store])
    return null
  }

  it('lets an open a child asks for in the commit that enables the root through', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(<Box disabled onOpenChange={onOpenChange} />)
    // The input mounts focused (`autoFocus`) as the root is enabled.
    rerender(
      <Box disabled={false} input="autofocus" onOpenChange={onOpenChange} />,
    )
    await act(async () => {})
    expect(screen.getByTestId('input')).toHaveFocus()
    expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true])
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })

  it('refuses an open a child asks for in the commit that disables the root', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Box disabled={false} input="plain" onOpenChange={onOpenChange} />,
    )
    await act(async () => {})
    rerender(<Box disabled input="plain" asks onOpenChange={onOpenChange} />)
    await act(async () => {})
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.queryByTestId('popup')).toBeNull()
  })
})

describe('a menu root’s disabled in a transition that hasn’t committed', () => {
  const never = new Promise<void>(() => {})
  /** Suspends while `active`, holding the transition back. */
  function Suspender({ active }: { active: boolean }) {
    if (active) throw never
    return null
  }
  let store: ListboxStoreOf | null = null
  function StoreProbe() {
    store = useMaybePopupMenuContext()?.store ?? null
    return null
  }
  let toggle: () => void = () => {}
  function App({ initial }: { initial: boolean }) {
    const [disabled, setDisabled] = React.useState(initial)
    const [, startTransition] = React.useTransition()
    toggle = () => startTransition(() => setDisabled((d) => !d))
    return (
      <React.Suspense fallback={<p>loading</p>}>
        <DropdownMenu.Root disabled={disabled}>
          <DropdownMenu.Trigger
            data-testid="trigger"
            data-disabled-prop={String(disabled)}
          >
            Open
          </DropdownMenu.Trigger>
          <StoreProbe />
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup data-testid="popup">
                <DropdownMenu.Surface>
                  <DropdownMenu.List>
                    <DropdownMenu.Item>A</DropdownMenu.Item>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        {/* It suspends in the render that changes `disabled`. */}
        <Suspender active={disabled !== initial} />
      </React.Suspense>
    )
  }

  /** Starts the transition, which suspends, and leaves it pending. */
  async function holdTransition(shown: boolean) {
    await act(async () => {
      toggle()
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    // The screen still shows the committed `disabled`.
    expect(screen.getByTestId('trigger')).toHaveAttribute(
      'data-disabled-prop',
      String(shown),
    )
    expect(screen.queryByText('loading')).toBeNull()
  }

  it('lets the still-enabled trigger open the menu while a transition to disabled is pending', async () => {
    render(<App initial={false} />)
    await act(async () => {})
    await holdTransition(false)
    await act(async () => {
      fireEvent.click(screen.getByTestId('trigger'))
    })
    await waitFor(() => expect(screen.getByTestId('popup')).toBeInTheDocument())
  })

  it('keeps refusing an open while a transition to enabled is pending', async () => {
    render(<App initial />)
    await act(async () => {})
    await holdTransition(true)
    expect(store).not.toBeNull()
    let result: string | undefined
    act(() => {
      result = store ? askRootOpen(store, true, 'trigger-press') : undefined
    })
    expect(result).toBe('refused')
    expect(screen.queryByTestId('popup')).toBeNull()
  })
})

describe('a menu root’s own surfaces', () => {
  it('register with its tree, which closes them with the cause of its close', () => {
    const tree = new MenuTreeStore({ resolver: createMenuTreeResolver() })
    const closed: unknown[][] = []
    const first = vi.fn((...args: unknown[]) => closed.push(['first', ...args]))
    const second = vi.fn((...args: unknown[]) =>
      closed.push(['second', ...args]),
    )
    tree.registerSurface(1, first)
    const unregister = tree.registerSurface(1, second)
    const event = new Event('keydown')
    tree.closeSurfaces('escape-key', event)
    expect(closed).toEqual([
      ['first', false, 'escape-key', event],
      ['second', false, 'escape-key', event],
    ])
    unregister()
    closed.length = 0
    tree.closeSurfaces('item-press')
    expect(closed).toEqual([['first', false, 'item-press', undefined]])
  })

  it('close when the root closes, told its reason', async () => {
    const log: Seen[] = []
    const user = userEvent.setup()
    const changes: [boolean, string][] = []
    render(
      <Menu
        log={log}
        onSubmenuOpenChange={(open, details) =>
          changes.push([open, details.reason])
        }
      />,
    )
    await user.hover(await screen.findByTestId('more'))
    await screen.findByTestId('nested')
    act(() => log.at(-1)?.context?.closeAll('escape-key'))
    await waitFor(() => expect(screen.queryByTestId('nested')).toBeNull())
    expect(screen.queryByText('Apple')).toBeNull()
    expect(changes.at(-1)).toEqual([false, 'escape-key'])
  })
})

describe('a menu root’s debug flags', () => {
  it('render their readers once as the root mounts, and once for each change', async () => {
    const seen: boolean[] = []
    function DebugReader() {
      seen.push(usePopupMenuDebug().logAimGuardEvents)
      return null
    }
    function Root({ log }: { log: boolean }) {
      return (
        <DropdownMenu.Root debug={{ logAimGuardEvents: log }}>
          <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
          {/* The same element each render: it renders only for its reads. */}
          {reader}
        </DropdownMenu.Root>
      )
    }
    const reader = <DebugReader />
    const { rerender } = render(<Root log />)
    await act(async () => {})
    expect(seen).toEqual([true])
    rerender(<Root log={false} />)
    await act(async () => {})
    expect(seen).toEqual([true, false])
  })

  it('reach an aim guard made before they changed', async () => {
    const log: Seen[] = []
    const user = userEvent.setup()
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      const { rerender } = render(<Menu log={log} debug={false} />)
      // The first submenu trigger hovered makes the guard, with logging off.
      await user.hover(await screen.findByTestId('more'))
      await screen.findByTestId('nested')
      const aimGuardLogs = () =>
        logSpy.mock.calls.filter(
          ([message]) =>
            typeof message === 'string' && message.startsWith('[PopupMenu]['),
        ).length
      expect(aimGuardLogs()).toBe(0)

      rerender(<Menu log={log} debug />)
      await user.hover(screen.getByTestId('other'))
      await waitFor(() => expect(aimGuardLogs()).toBeGreaterThan(0))
    } finally {
      logSpy.mockRestore()
    }
  })
})

describe('the aim guard of a root whose tree is made again', () => {
  // A root that supplies its own focus owner gets a new tree, and a new tree
  // tier, whenever it supplies another.
  let tier: MenuTreeTier | null = null
  function TierProbe() {
    tier = useMaybeMenuTreeTier()
    return null
  }
  function CustomRoot({
    focusOwner,
    log,
  }: {
    focusOwner: FocusOwnerStore
    log: boolean
  }) {
    const root = usePopupMenuRoot({ defaultOpen: true })
    const open = root.store.useState('open')
    return (
      <PopupMenuProviders
        menuTreeResolver={root.menuTreeResolver}
        store={root.store}
        focusOwnerStore={focusOwner}
        openChainStore={root.openChainStore}
        disabled={root.disabled}
        depth={0}
        closeAll={root.closeAll}
        registerSurface={root.registerSurface}
        virtualization={root.virtualization}
        debug={{ logAimGuardEvents: log }}
        componentName="dropdown-menu"
      >
        <Popover.Root open={open}>
          <PopupMenuPortal>
            <PopupMenuPositioner>
              <PopupMenuPopup>
                <PopupMenuSurface>
                  <PopupMenuList>
                    <TierProbe />
                    <PopupMenuSubmenuRoot>
                      <PopupMenuSubmenuTrigger>More</PopupMenuSubmenuTrigger>
                    </PopupMenuSubmenuRoot>
                  </PopupMenuList>
                </PopupMenuSurface>
              </PopupMenuPopup>
            </PopupMenuPositioner>
          </PopupMenuPortal>
        </Popover.Root>
      </PopupMenuProviders>
    )
  }

  it('reads the debug flags of the tree the root has now', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      const { rerender } = render(
        <CustomRoot focusOwner={new FocusOwnerStore()} log={false} />,
      )
      await act(async () => {})
      const first = tier
      const guard = first?.aimGuard
      expect(guard).toBeTruthy()

      rerender(<CustomRoot focusOwner={new FocusOwnerStore()} log />)
      await act(async () => {})
      expect(tier).not.toBe(first)
      expect(tier?.aimGuard).toBe(guard)

      const aim = guard!.trigger({
        triggerId: 'more',
        depth: 0,
        submenuSurfaceId: 'more-surface',
        getPopupRect: () => null,
        getTriggerRect: () => null,
      })
      act(() => aim.hold(1000))
      act(() => aim.releaseOwn())
      expect(
        logSpy.mock.calls.some(
          ([message]) =>
            typeof message === 'string' && message.startsWith('[PopupMenu]['),
        ),
      ).toBe(true)
    } finally {
      logSpy.mockRestore()
    }
  })
})
