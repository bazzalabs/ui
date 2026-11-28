import { act, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { CommandMenu } from '../../command-menu/index.js'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import {
  ListboxContextProvider,
  useMaybeListboxContext,
} from '../listbox/index.js'
import {
  PopupMenuContext,
  type PopupMenuContextValue,
  useMaybePopupMenuContext,
} from './contexts/popup-menu-context.js'
import { useMaybeSubmenuContext } from './contexts/submenu-context.js'
import {
  type MenuSurfaceSettings,
  useMaybeMenuSurfaceSettings,
} from './contexts/surface-settings-context.js'
import {
  type MenuSurfaceTier,
  useMaybeMenuSurfaceTier,
} from './contexts/surface-tier-context.js'

/**
 * A menu level's settings ride `SurfaceSettingsContext`, rendered with the
 * level: the engine's and the members' parts read them there, in the commit
 * that changes them. Gates read committed refs (`isLevelDisabled`). The
 * published `PopupMenuContext` and `ListboxContext` are still provided with
 * the same values, for consumer code, and no longer steer the parts below
 * them.
 */

interface Seen {
  menu: PopupMenuContextValue | null
  listbox: ReturnType<typeof useMaybeListboxContext>
  tier: MenuSurfaceTier | null
  settings: MenuSurfaceSettings | null
}

function Probe({ log }: { log: Seen[] }) {
  log.push({
    menu: useMaybePopupMenuContext(),
    listbox: useMaybeListboxContext(),
    tier: useMaybeMenuSurfaceTier(),
    settings: useMaybeMenuSurfaceSettings(),
  })
  return null
}

/** The published values a consumer reads, without the functions' identity. */
function published(seen: Seen | undefined) {
  if (!seen?.menu || !seen.listbox) return null
  const { menu, listbox } = seen
  return {
    store: menu.store,
    depth: menu.depth,
    disabled: menu.disabled,
    explicitTabBehavior: menu.explicitTabBehavior,
    tabWithoutZones: menu.tabWithoutZones,
    externalFocus: menu.externalFocus,
    inputEmbedded: menu.inputEmbedded,
    virtualization: menu.virtualization,
    virtualAnchor: menu.virtualAnchor,
    menuType: menu.menuType,
    closeOnOutsidePress: menu.closeOnOutsidePress,
    rangeSelection: menu.rangeSelection,
    dragSelection: menu.dragSelection,
    getAriaSelectionText: menu.getAriaSelectionText,
    closeAll: typeof menu.closeAll,
    registerSurface: typeof menu.registerSurface,
    listbox: {
      store: listbox.store,
      depth: listbox.depth,
      virtualization: listbox.virtualization,
      closeAll: typeof listbox.closeAll,
      registerSurface: typeof listbox.registerSurface,
    },
  }
}

const ariaText = (count: number) => `${count} selected`

function Menu({
  root,
  sub,
  page,
  disabled = false,
  submenuDisabled = false,
}: {
  root: Seen[]
  sub: Seen[]
  page: Seen[]
  disabled?: boolean
  submenuDisabled?: boolean
}) {
  return (
    <DropdownMenu.Root
      defaultOpen
      disabled={disabled}
      closeOnOutsidePress="click"
      rangeSelection={false}
      getAriaSelectionText={ariaText}
    >
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                <Probe log={root} />
                <DropdownMenu.Item>Apple</DropdownMenu.Item>
                <DropdownMenu.SubpageTrigger targetPageId="page">
                  Page
                </DropdownMenu.SubpageTrigger>
                <DropdownMenu.Submenu defaultOpen disabled={submenuDisabled}>
                  <DropdownMenu.SubmenuTrigger>
                    More
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup>
                        <DropdownMenu.Surface>
                          <DropdownMenu.List>
                            <Probe log={sub} />
                            <DropdownMenu.Item>Nested</DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
            <DropdownMenu.Subpage pageId="page">
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <Probe log={page} />
                  <DropdownMenu.Item>On the page</DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Subpage>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

describe('the published PopupMenuContext and ListboxContext', () => {
  it('carry the same values at the root, in a submenu and on a subpage', async () => {
    const root: Seen[] = []
    const sub: Seen[] = []
    const page: Seen[] = []
    const { rerender } = render(<Menu root={root} sub={sub} page={page} />)
    await screen.findByText('Nested')
    const rootStore = root.at(-1)?.menu?.store
    const subStore = sub.at(-1)?.menu?.store
    const common = {
      disabled: false,
      explicitTabBehavior: true,
      tabWithoutZones: 'close',
      externalFocus: false,
      inputEmbedded: false,
      virtualization: undefined,
      virtualAnchor: undefined,
      menuType: 'dropdown',
      closeOnOutsidePress: 'click',
      rangeSelection: false,
      dragSelection: false,
      getAriaSelectionText: ariaText,
      closeAll: 'function',
      registerSurface: 'function',
    }
    expect(published(root.at(-1))).toEqual({
      ...common,
      store: rootStore,
      depth: 0,
      listbox: {
        store: rootStore,
        depth: 0,
        virtualization: undefined,
        closeAll: 'function',
        registerSurface: 'function',
      },
    })
    expect(subStore).not.toBe(rootStore)
    expect(published(sub.at(-1))).toEqual({
      ...common,
      store: subStore,
      depth: 1,
      listbox: {
        store: subStore,
        depth: 1,
        virtualization: undefined,
        closeAll: 'function',
        registerSurface: 'function',
      },
    })

    // A submenu's `disabled` is its parent's or its own.
    rerender(<Menu root={root} sub={sub} page={page} submenuDisabled />)
    await act(async () => {})
    expect(sub.at(-1)?.menu?.disabled).toBe(true)
    expect(root.at(-1)?.menu?.disabled).toBe(false)

    // The page shares its popup's level, with a store of its own.
    act(() => screen.getByText('Page').click())
    await screen.findByText('On the page')
    const pageStore = page.at(-1)?.menu?.store
    expect(pageStore).not.toBe(rootStore)
    expect(published(page.at(-1))).toEqual({
      ...common,
      store: pageStore,
      depth: 0,
      listbox: {
        store: pageStore,
        depth: 0,
        virtualization: undefined,
        closeAll: 'function',
        registerSurface: 'function',
      },
    })
  })

  it('carry the root’s settings in a submenu in the render that changes them', async () => {
    const root: Seen[] = []
    const sub: Seen[] = []
    const page: Seen[] = []
    const { rerender } = render(<Menu root={root} sub={sub} page={page} />)
    await screen.findByText('Nested')
    const fromSub = sub.length
    rerender(<Menu root={root} sub={sub} page={page} disabled />)
    await act(async () => {})
    expect(sub.slice(fromSub).map((seen) => seen.menu?.disabled)).toEqual(
      sub.slice(fromSub).map(() => true),
    )
    expect(sub.length).toBeGreaterThan(fromSub)
  })

  it('carry the root’s settings on a subpage in the render that changes them', async () => {
    const root: Seen[] = []
    const sub: Seen[] = []
    const page: Seen[] = []
    const { rerender } = render(<Menu root={root} sub={sub} page={page} />)
    await screen.findByText('Nested')
    act(() => screen.getByText('Page').click())
    await screen.findByText('On the page')
    const fromPage = page.length
    rerender(<Menu root={root} sub={sub} page={page} disabled />)
    await act(async () => {})
    expect(page.slice(fromPage).map((seen) => seen.menu?.disabled)).toEqual(
      page.slice(fromPage).map(() => true),
    )
    expect(page.length).toBeGreaterThan(fromPage)
  })

  it('carry the root’s settings in the render that changes them', async () => {
    const root: Seen[] = []
    const sub: Seen[] = []
    const page: Seen[] = []
    const { rerender } = render(<Menu root={root} sub={sub} page={page} />)
    await screen.findByText('Nested')
    const from = root.length
    rerender(<Menu root={root} sub={sub} page={page} disabled />)
    await act(async () => {})
    expect(root.slice(from).map((seen) => seen.menu?.disabled)).not.toContain(
      false,
    )
    expect(sub.at(-1)?.menu?.disabled).toBe(true)
  })
})

describe('a level’s settings', () => {
  it('are the ones it renders; a submenu’s are its parent’s with its own disabled', async () => {
    const root: Seen[] = []
    const sub: Seen[] = []
    const page: Seen[] = []
    const { rerender } = render(<Menu root={root} sub={sub} page={page} />)
    await screen.findByText('Nested')
    const rootTier = root.at(-1)?.tier
    const subTier = sub.at(-1)?.tier
    expect(rootTier?.depth).toBe(0)
    expect(subTier?.depth).toBe(1)
    expect(subTier?.parent).toBe(rootTier)
    expect(root.at(-1)?.settings).toMatchObject({
      disabled: false,
      closeOnOutsidePress: 'click',
      rangeSelection: false,
      getAriaSelectionText: ariaText,
    })
    expect(sub.at(-1)?.settings).toMatchObject({
      disabled: false,
      closeOnOutsidePress: 'click',
      rangeSelection: false,
    })

    // In the render that changes them, at every level.
    const fromRoot = root.length
    const fromSub = sub.length
    rerender(<Menu root={root} sub={sub} page={page} disabled />)
    await act(async () => {})
    expect(
      root.slice(fromRoot).map((seen) => seen.settings?.disabled),
    ).not.toContain(false)
    expect(
      sub.slice(fromSub).map((seen) => seen.settings?.disabled),
    ).not.toContain(false)
    // The same tiers: what changes is the settings.
    expect(root.at(-1)?.tier).toBe(rootTier)
    expect(sub.at(-1)?.tier).toBe(subTier)

    rerender(<Menu root={root} sub={sub} page={page} submenuDisabled />)
    await act(async () => {})
    expect(sub.at(-1)?.settings?.disabled).toBe(true)
    expect(root.at(-1)?.settings?.disabled).toBe(false)
  })

  it('of a subpage are its popup’s', async () => {
    const root: Seen[] = []
    const sub: Seen[] = []
    const page: Seen[] = []
    render(<Menu root={root} sub={sub} page={page} />)
    await screen.findByText('Nested')
    const rootTier = root.at(-1)?.tier
    act(() => screen.getByText('Page').click())
    await screen.findByText('On the page')
    const pageTier = page.at(-1)?.tier
    expect(pageTier).not.toBe(rootTier)
    expect(pageTier?.depth).toBe(0)
    expect(page.at(-1)?.settings).toBe(root.at(-1)?.settings)
  })

  it('keep their identity when an unrelated root prop changes', async () => {
    const root: Seen[] = []
    const sub: Seen[] = []
    const page: Seen[] = []
    function Outer({ n }: { n: number }) {
      return (
        <div data-n={n}>
          <Menu root={root} sub={sub} page={page} />
        </div>
      )
    }
    const { rerender } = render(<Outer n={0} />)
    await screen.findByText('Nested')
    const rootSettings = root.at(-1)?.settings
    const subSettings = sub.at(-1)?.settings
    rerender(<Outer n={1} />)
    await act(async () => {})
    expect(root.at(-1)?.settings).toBe(rootSettings)
    expect(sub.at(-1)?.settings).toBe(subSettings)
  })
})

describe('a submenu’s gate in the commit its root’s disabled changes', () => {
  /** Asks its submenu to open from a layout effect, as it mounts. */
  function AsksToOpen() {
    const submenu = useMaybeSubmenuContext()
    React.useLayoutEffect(() => {
      submenu?.setOpen(true, 'trigger-press')
    }, [submenu])
    return null
  }

  function Tree({
    disabled,
    asks,
    onSubmenuOpenChange,
  }: {
    disabled: boolean
    asks: boolean
    onSubmenuOpenChange: (open: boolean) => void
  }) {
    return (
      <DropdownMenu.Root defaultOpen disabled={disabled}>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <DropdownMenu.Item>Apple</DropdownMenu.Item>
                  <DropdownMenu.Submenu onOpenChange={onSubmenuOpenChange}>
                    <DropdownMenu.SubmenuTrigger>
                      More
                    </DropdownMenu.SubmenuTrigger>
                    {asks && <AsksToOpen />}
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
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  it('refuses an open asked in the commit that disables the root', async () => {
    const onSubmenuOpenChange = vi.fn()
    const { rerender } = render(
      <Tree
        disabled={false}
        asks={false}
        onSubmenuOpenChange={onSubmenuOpenChange}
      />,
    )
    await screen.findByText('Apple')
    rerender(<Tree disabled asks onSubmenuOpenChange={onSubmenuOpenChange} />)
    await act(async () => {})
    expect(onSubmenuOpenChange).not.toHaveBeenCalled()
    expect(screen.queryByTestId('nested')).toBeNull()
  })

  it('lets an open asked in the commit that enables the root through', async () => {
    const onSubmenuOpenChange = vi.fn()
    const { rerender } = render(
      <Tree disabled asks={false} onSubmenuOpenChange={onSubmenuOpenChange} />,
    )
    await screen.findByText('Apple')
    rerender(
      <Tree disabled={false} asks onSubmenuOpenChange={onSubmenuOpenChange} />,
    )
    await act(async () => {})
    expect(onSubmenuOpenChange.mock.calls.map(([open]) => open)).toEqual([true])
    expect(screen.getByTestId('nested')).toBeInTheDocument()
  })
})

describe('a nested submenu’s gate in the commit its root’s disabled changes', () => {
  function AsksToOpen() {
    const submenu = useMaybeSubmenuContext()
    React.useLayoutEffect(() => {
      submenu?.setOpen(true, 'trigger-press')
    }, [submenu])
    return null
  }

  function Tree({
    disabled,
    asks,
    onOpenChange,
  }: {
    disabled: boolean
    asks: boolean
    onOpenChange: (open: boolean) => void
  }) {
    return (
      <DropdownMenu.Root defaultOpen disabled={disabled}>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <DropdownMenu.Item>Apple</DropdownMenu.Item>
                  <DropdownMenu.Submenu defaultOpen>
                    <DropdownMenu.SubmenuTrigger>
                      One
                    </DropdownMenu.SubmenuTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Positioner>
                        <DropdownMenu.Popup>
                          <DropdownMenu.Surface>
                            <DropdownMenu.List>
                              <DropdownMenu.Item>In one</DropdownMenu.Item>
                              <DropdownMenu.Submenu onOpenChange={onOpenChange}>
                                <DropdownMenu.SubmenuTrigger>
                                  Two
                                </DropdownMenu.SubmenuTrigger>
                                {asks && <AsksToOpen />}
                                <DropdownMenu.Portal>
                                  <DropdownMenu.Positioner>
                                    <DropdownMenu.Popup data-testid="two">
                                      <DropdownMenu.Surface>
                                        <DropdownMenu.List>
                                          <DropdownMenu.Item>
                                            In two
                                          </DropdownMenu.Item>
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
                  </DropdownMenu.Submenu>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  it('refuses an open asked two levels down in the commit that disables the root', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Tree disabled={false} asks={false} onOpenChange={onOpenChange} />,
    )
    await screen.findByText('In one')
    rerender(<Tree disabled asks onOpenChange={onOpenChange} />)
    await act(async () => {})
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.queryByTestId('two')).toBeNull()
  })

  it('lets an open asked two levels down through in the commit that enables the root', async () => {
    const onOpenChange = vi.fn()
    // Opened, then disabled: the open submenus stay open.
    const { rerender } = render(
      <Tree disabled={false} asks={false} onOpenChange={onOpenChange} />,
    )
    await screen.findByText('In one')
    rerender(<Tree disabled asks={false} onOpenChange={onOpenChange} />)
    await act(async () => {})
    expect(screen.getByText('In one')).toBeInTheDocument()
    rerender(<Tree disabled={false} asks onOpenChange={onOpenChange} />)
    await act(async () => {})
    expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true])
    expect(screen.getByTestId('two')).toBeInTheDocument()
  })
})

describe('a submenu’s published PopupMenuContext', () => {
  it('keeps its identity when the root’s virtualization changes (a submenu keeps its own)', async () => {
    const sub: Seen[] = []
    const onHighlightChange = () => {}
    function Root({ items }: { items: { id: string }[] }) {
      return (
        <DropdownMenu.Root
          defaultOpen
          items={items as never}
          onHighlightChange={onHighlightChange}
        >
          <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface>
                  <DropdownMenu.List>
                    <DropdownMenu.Item>Apple</DropdownMenu.Item>
                    <DropdownMenu.Submenu defaultOpen>
                      <DropdownMenu.SubmenuTrigger>
                        More
                      </DropdownMenu.SubmenuTrigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Positioner>
                          <DropdownMenu.Popup>
                            <DropdownMenu.Surface>
                              <DropdownMenu.List>
                                <Probe log={sub} />
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
        </DropdownMenu.Root>
      )
    }
    const { rerender } = render(<Root items={[{ id: 'a' }]} />)
    await screen.findByText('Nested')
    const before = sub.at(-1)
    expect(before?.menu?.virtualization).toBeUndefined()
    rerender(<Root items={[{ id: 'a' }, { id: 'b' }]} />)
    await act(async () => {})
    expect(sub.at(-1)?.menu).toBe(before?.menu)
    expect(sub.at(-1)?.settings).toBe(before?.settings)
  })
})

describe('a submenu’s and a subpage’s published ListboxContext', () => {
  it('keeps its identity when a setting it doesn’t carry changes', async () => {
    const root: Seen[] = []
    const sub: Seen[] = []
    const page: Seen[] = []
    const { rerender } = render(<Menu root={root} sub={sub} page={page} />)
    await screen.findByText('Nested')
    const before = sub.at(-1)?.listbox
    rerender(<Menu root={root} sub={sub} page={page} disabled />)
    await act(async () => {})
    expect(sub.at(-1)?.menu?.disabled).toBe(true)
    expect(sub.at(-1)?.listbox).toBe(before)
  })

  it('on a subpage keeps its identity when a setting it doesn’t carry changes', async () => {
    const root: Seen[] = []
    const sub: Seen[] = []
    const page: Seen[] = []
    const { rerender } = render(<Menu root={root} sub={sub} page={page} />)
    await screen.findByText('Nested')
    act(() => screen.getByText('Page').click())
    await screen.findByText('On the page')
    const pageBefore = page.at(-1)?.listbox
    rerender(<Menu root={root} sub={sub} page={page} disabled />)
    await act(async () => {})
    expect(page.at(-1)?.menu?.disabled).toBe(true)
    expect(page.at(-1)?.listbox).toBe(pageBefore)
  })
})

describe('a gate below a disabled submenu, or in a menu nested in a disabled one', () => {
  function AsksToOpen() {
    const submenu = useMaybeSubmenuContext()
    React.useLayoutEffect(() => {
      submenu?.setOpen(true, 'trigger-press')
    }, [submenu])
    return null
  }

  it('refuses an open asked below a submenu, in the commit its own prop disables it', async () => {
    const onOpenChange = vi.fn()
    function Tree({
      asks,
      oneDisabled,
    }: {
      asks: boolean
      oneDisabled: boolean
    }) {
      return (
        <DropdownMenu.Root defaultOpen>
          <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface>
                  <DropdownMenu.List>
                    <DropdownMenu.Submenu defaultOpen disabled={oneDisabled}>
                      <DropdownMenu.SubmenuTrigger>
                        One
                      </DropdownMenu.SubmenuTrigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Positioner>
                          <DropdownMenu.Popup>
                            <DropdownMenu.Surface>
                              <DropdownMenu.List>
                                <DropdownMenu.Item>In one</DropdownMenu.Item>
                                <DropdownMenu.Submenu
                                  onOpenChange={onOpenChange}
                                >
                                  <DropdownMenu.SubmenuTrigger>
                                    Two
                                  </DropdownMenu.SubmenuTrigger>
                                  {asks && <AsksToOpen />}
                                  <DropdownMenu.Portal>
                                    <DropdownMenu.Positioner>
                                      <DropdownMenu.Popup data-testid="two">
                                        <DropdownMenu.Surface>
                                          <DropdownMenu.List>
                                            <DropdownMenu.Item>
                                              In two
                                            </DropdownMenu.Item>
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
                    </DropdownMenu.Submenu>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }
    const { rerender } = render(<Tree asks={false} oneDisabled={false} />)
    await screen.findByText('In one')
    rerender(<Tree asks oneDisabled />)
    await act(async () => {})
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.queryByTestId('two')).toBeNull()
  })

  it('lets a menu nested in a disabled menu’s popup open its submenu: its own root decides', async () => {
    const onOpenChange = vi.fn()
    function Outer({ disabled, asks }: { disabled: boolean; asks: boolean }) {
      return (
        <DropdownMenu.Root defaultOpen disabled={disabled}>
          <DropdownMenu.Trigger>Outer</DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface>
                  <DropdownMenu.List>
                    <DropdownMenu.Item>Outer item</DropdownMenu.Item>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
                <DropdownMenu.Root defaultOpen modal={false}>
                  <DropdownMenu.Trigger>Inner</DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup>
                        <DropdownMenu.Surface>
                          <DropdownMenu.List>
                            <DropdownMenu.Item>Inner item</DropdownMenu.Item>
                            <DropdownMenu.Submenu onOpenChange={onOpenChange}>
                              <DropdownMenu.SubmenuTrigger>
                                More
                              </DropdownMenu.SubmenuTrigger>
                              {asks && <AsksToOpen />}
                              <DropdownMenu.Portal>
                                <DropdownMenu.Positioner>
                                  <DropdownMenu.Popup data-testid="inner-sub">
                                    <DropdownMenu.Surface>
                                      <DropdownMenu.List>
                                        <DropdownMenu.Item>
                                          Deep
                                        </DropdownMenu.Item>
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
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }
    const { rerender } = render(<Outer disabled={false} asks={false} />)
    await screen.findByText('Inner item')
    rerender(<Outer disabled asks={false} />)
    await act(async () => {})
    rerender(<Outer disabled asks />)
    await act(async () => {})
    expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true])
  })
})

describe('a trigger and a backdrop of a disabled root', () => {
  it('render the root’s disabled in the commit that changes it', async () => {
    const seen: boolean[] = []
    function Seen() {
      React.useLayoutEffect(() => {
        const trigger = document.querySelector('[data-testid="trigger"]')
        seen.push(trigger instanceof HTMLButtonElement && trigger.disabled)
      })
      return null
    }
    function Root({ disabled }: { disabled: boolean }) {
      return (
        <DropdownMenu.Root disabled={disabled}>
          <DropdownMenu.Trigger data-testid="trigger">
            Open
          </DropdownMenu.Trigger>
          <Seen />
        </DropdownMenu.Root>
      )
    }
    const { rerender } = render(<Root disabled={false} />)
    rerender(<Root disabled />)
    rerender(<Root disabled={false} />)
    expect(seen).toEqual([false, true, false])
  })

  it('CommandMenu.Backdrop doesn’t close a disabled menu', async () => {
    function Command({ disabled }: { disabled: boolean }) {
      return (
        <CommandMenu.Root defaultOpen disabled={disabled}>
          <CommandMenu.Portal>
            <CommandMenu.Backdrop data-testid="backdrop" />
            <CommandMenu.Popup data-testid="popup">
              <CommandMenu.Surface>
                <CommandMenu.Input />
                <CommandMenu.List>
                  <CommandMenu.Item>Apple</CommandMenu.Item>
                </CommandMenu.List>
              </CommandMenu.Surface>
            </CommandMenu.Popup>
          </CommandMenu.Portal>
        </CommandMenu.Root>
      )
    }
    const { rerender } = render(<Command disabled={false} />)
    await screen.findByTestId('popup')
    rerender(<Command disabled />)
    await act(async () => {})
    fireEvent.pointerDown(screen.getByTestId('backdrop'))
    await act(async () => {})
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })
})

describe('a consumer’s own provider of a published context', () => {
  it('gives the consumer’s code its value, and doesn’t steer the menu’s parts', async () => {
    const seen: (PopupMenuContextValue | null)[] = []
    function ConsumerProbe() {
      seen.push(useMaybePopupMenuContext())
      return null
    }
    function Disabling({ children }: { children: React.ReactNode }) {
      const menu = useMaybePopupMenuContext()
      const listbox = useMaybeListboxContext()
      if (!menu || !listbox) return null
      return (
        <PopupMenuContext.Provider value={{ ...menu, disabled: true }}>
          <ListboxContextProvider.Provider value={{ ...listbox, depth: 5 }}>
            {children}
          </ListboxContextProvider.Provider>
        </PopupMenuContext.Provider>
      )
    }
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <Disabling>
                    <ConsumerProbe />
                    <DropdownMenu.Item data-testid="item">
                      Apple
                    </DropdownMenu.Item>
                  </Disabling>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    const item = await screen.findByTestId('item')
    expect(seen.at(-1)?.disabled).toBe(true)
    expect(item).not.toHaveAttribute('data-disabled')
    expect(item).not.toHaveAttribute('aria-disabled', 'true')
  })
})
