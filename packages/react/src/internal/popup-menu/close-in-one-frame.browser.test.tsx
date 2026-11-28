import { Popover } from '@base-ui/react/popover'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Combobox } from '../../combobox/index.js'
import { CommandMenu } from '../../command-menu/index.js'
import { ContextMenu } from '../../context-menu/index.js'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import { Select } from '../../select/index.js'
import { SuggestionMenu } from '../../suggestion-menu/index.js'

/**
 * A popup with nothing to animate completes its close in the frame it closes
 * (design §6.2): `onOpenChangeComplete(false)` runs, once, before the next
 * frame, and no frame paints the closed popup. One with an exit animation
 * keeps `[data-ending-style]` until it finishes, then completes, once.
 */

const ANIMATED = `
  [data-testid="popup"] { transition: opacity 100ms linear; }
  [data-testid="popup"][data-ending-style] { opacity: 0; }
`

let completes: boolean[] = []
let frame = 0
let completeFrame: number | null = null
const complete = (open: boolean) => {
  completes.push(open)
  if (!open && completeFrame === null) completeFrame = frame
}

let setOpen: (open: boolean) => void = () => {}
function Open({
  children,
}: {
  children: (
    open: boolean,
    onOpenChange: (open: boolean) => void,
  ) => React.ReactNode
}) {
  const [open, set] = React.useState(true)
  setOpen = set
  return <>{children(open, set)}</>
}

const Rows = ({ Item }: { Item: React.ElementType }) => (
  <>
    <Item>One</Item>
    <Item>Two</Item>
  </>
)

interface Member {
  render: (keepMounted: boolean) => React.ReactElement
  /** Opens, if it opens some other way than starting open; returns the close. */
  open?: () => () => void
}

const suggestion = SuggestionMenu.createHandle()

const MEMBERS: Record<string, Member> = {
  DropdownMenu: {
    render: (keepMounted) => (
      <Open>
        {(open, onOpenChange) => (
          <DropdownMenu.Root
            open={open}
            onOpenChange={onOpenChange}
            onOpenChangeComplete={complete}
          >
            <DropdownMenu.Trigger data-testid="trigger">
              Open
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal keepMounted={keepMounted}>
              <DropdownMenu.Positioner>
                <DropdownMenu.Popup data-testid="popup">
                  <DropdownMenu.Surface>
                    <DropdownMenu.List>
                      <Rows Item={DropdownMenu.Item} />
                    </DropdownMenu.List>
                  </DropdownMenu.Surface>
                </DropdownMenu.Popup>
              </DropdownMenu.Positioner>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </Open>
    ),
  },
  'DropdownMenu submenu': {
    render: () => (
      <Open>
        {(open, onOpenChange) => (
          <DropdownMenu.Root defaultOpen>
            <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Positioner>
                <DropdownMenu.Popup>
                  <DropdownMenu.Surface>
                    <DropdownMenu.List>
                      <DropdownMenu.Submenu
                        open={open}
                        onOpenChange={onOpenChange}
                        onOpenChangeComplete={complete}
                      >
                        <DropdownMenu.SubmenuTrigger>
                          More
                        </DropdownMenu.SubmenuTrigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Positioner>
                            <DropdownMenu.Popup data-testid="popup">
                              <DropdownMenu.Surface>
                                <DropdownMenu.List>
                                  <Rows Item={DropdownMenu.Item} />
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
        )}
      </Open>
    ),
  },
  ContextMenu: {
    render: () => (
      <Open>
        {(open, onOpenChange) => (
          <ContextMenu.Root
            open={open}
            onOpenChange={onOpenChange}
            onOpenChangeComplete={complete}
          >
            <ContextMenu.Trigger style={{ width: 200, height: 200 }} />
            <ContextMenu.Portal>
              <ContextMenu.Positioner>
                <ContextMenu.Popup data-testid="popup">
                  <ContextMenu.Surface>
                    <ContextMenu.List>
                      <Rows Item={ContextMenu.Item} />
                    </ContextMenu.List>
                  </ContextMenu.Surface>
                </ContextMenu.Popup>
              </ContextMenu.Positioner>
            </ContextMenu.Portal>
          </ContextMenu.Root>
        )}
      </Open>
    ),
  },
  CommandMenu: {
    render: () => (
      <Open>
        {(open, onOpenChange) => (
          <CommandMenu.Root
            open={open}
            onOpenChange={onOpenChange}
            onOpenChangeComplete={complete}
          >
            <CommandMenu.Portal>
              {/* Its backdrop closes with it. */}
              <CommandMenu.Backdrop />
              <CommandMenu.Popup data-testid="popup">
                <CommandMenu.Surface>
                  <CommandMenu.Input />
                  <CommandMenu.List>
                    <Rows Item={CommandMenu.Item} />
                  </CommandMenu.List>
                </CommandMenu.Surface>
              </CommandMenu.Popup>
            </CommandMenu.Portal>
          </CommandMenu.Root>
        )}
      </Open>
    ),
  },
  Select: {
    render: () => (
      <Open>
        {(open, onOpenChange) => (
          <Select.Root
            open={open}
            onOpenChange={onOpenChange}
            onOpenChangeComplete={complete}
          >
            <Select.Trigger>Pick</Select.Trigger>
            <Select.Portal>
              <Select.Backdrop />
              <Select.Positioner>
                <Select.Popup data-testid="popup">
                  <Select.Surface>
                    <Select.List>
                      <Select.Item value="a">A</Select.Item>
                      <Select.Item value="b">B</Select.Item>
                    </Select.List>
                  </Select.Surface>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        )}
      </Open>
    ),
  },
  Combobox: {
    render: () => (
      <Open>
        {(open, onOpenChange) => (
          <Combobox.Root
            open={open}
            onOpenChange={onOpenChange}
            onOpenChangeComplete={complete}
          >
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup data-testid="popup">
                  <Combobox.Surface>
                    <Combobox.List>
                      <Combobox.Item value="a">A</Combobox.Item>
                      <Combobox.Item value="b">B</Combobox.Item>
                    </Combobox.List>
                  </Combobox.Surface>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        )}
      </Open>
    ),
  },
  SuggestionMenu: {
    render: () => (
      <SuggestionMenu.Root handle={suggestion} onOpenChangeComplete={complete}>
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup data-testid="popup">
              <SuggestionMenu.Surface>
                <SuggestionMenu.List>
                  <Rows Item={SuggestionMenu.Item} />
                </SuggestionMenu.List>
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>
    ),
    open: () => {
      act(() =>
        suggestion.update({
          query: '',
          anchor: () => new DOMRect(10, 10, 0, 16),
        }),
      )
      return () => suggestion.close()
    },
  },
}

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

afterEach(() => {
  cleanup()
  for (const style of document.querySelectorAll('style[data-test-animation]')) {
    style.remove()
  }
})

/**
 * Opens `member`, closes it, and counts frames until its close completed
 * and the exit (if any) is over. `endingFrames` counts the frames that start
 * with the closed popup still shown, each of which paints it.
 */
async function close(
  member: Member,
  { animated = false, keepMounted = false } = {},
) {
  if (animated) {
    const style = document.createElement('style')
    style.dataset.testAnimation = ''
    style.textContent = ANIMATED
    document.head.append(style)
  }
  render(member.render(keepMounted))
  const closeIt = member.open?.() ?? (() => setOpen(false))
  const popup = await screen.findByTestId('popup')
  for (let i = 0; i < 10; i++) await nextFrame()
  completes = []
  frame = 0
  completeFrame = null
  let endingFrames = 0
  let sawEndingStyle = false
  let running = true
  const tick = () => {
    if (!running) return
    frame++
    const mounted = document.querySelector('[data-testid="popup"]')
    if (mounted?.checkVisibility()) {
      endingFrames++
      if (mounted.hasAttribute('data-ending-style')) sawEndingStyle = true
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  act(() => closeIt())
  while (completeFrame === null && frame < 60) await nextFrame()
  // A few frames more, so a second completion would show.
  for (let i = 0; i < 3; i++) await nextFrame()
  running = false
  return {
    completeFrame,
    completesFalse: completes.filter((open) => !open).length,
    endingFrames,
    sawEndingStyle,
    popup,
  }
}

describe('a popup with nothing to animate completes its close in the frame it closes', () => {
  for (const [name, member] of Object.entries(MEMBERS)) {
    it(name, async () => {
      const result = await close(member)
      expect(result.completeFrame).toBe(0)
      expect(result.completesFalse).toBe(1)
      expect(result.endingFrames).toBe(0)
      expect(result.popup.isConnected).toBe(false)
    })
  }

  it('DropdownMenu: unmounts before any other task, so no paint can come first', async () => {
    render(MEMBERS.DropdownMenu!.render(false))
    const popup = await screen.findByTestId('popup')
    for (let i = 0; i < 10; i++) await nextFrame()
    completes = []
    act(() => setOpen(false))
    // Only microtasks run here: the close's own, and none of React's tasks.
    for (let i = 0; i < 3; i++) await Promise.resolve()
    expect(popup.isConnected).toBe(false)
    expect(completes).toEqual([false])
  })

  it('DropdownMenu with a kept-mounted portal: hidden, not removed', async () => {
    const result = await close(MEMBERS.DropdownMenu!, { keepMounted: true })
    expect(result.completeFrame).toBe(0)
    expect(result.completesFalse).toBe(1)
    expect(result.endingFrames).toBe(0)
    expect(result.popup.isConnected).toBe(true)
    expect(result.popup.checkVisibility()).toBe(false)
  })
})

describe('a popup with an exit animation keeps [data-ending-style] until it finishes', () => {
  for (const [name, member] of Object.entries(MEMBERS)) {
    it(name, async () => {
      const result = await close(member, { animated: true })
      // Not unmounted in the frame it closed: the exit painted, whatever the
      // refresh rate.
      expect(result.completeFrame).toBeGreaterThanOrEqual(1)
      expect(result.endingFrames).toBeGreaterThanOrEqual(1)
      expect(result.sawEndingStyle).toBe(true)
      expect(result.completesFalse).toBe(1)
      expect(result.popup.isConnected).toBe(false)
    })
  }
})

describe('a popup that opens again before its close completes', () => {
  it('stays open: the close it left doesn’t unmount it', async () => {
    render(MEMBERS.DropdownMenu!.render(false))
    await screen.findByTestId('popup')
    for (let i = 0; i < 10; i++) await nextFrame()
    completes = []
    // Closed and opened again in one task, before the close's microtask.
    act(() => setOpen(false))
    act(() => setOpen(true))
    for (let i = 0; i < 5; i++) await nextFrame()
    const popup = screen.getByTestId('popup')
    expect(popup.checkVisibility()).toBe(true)
    expect(popup).not.toHaveAttribute('data-ending-style')
    expect(completes.filter((open) => !open)).toEqual([])
  })
})

describe('a kept-mounted popup when Base UI completes closes at once', () => {
  it('reports the close complete once', async () => {
    const flags = globalThis as { BASE_UI_ANIMATIONS_DISABLED?: boolean }
    flags.BASE_UI_ANIMATIONS_DISABLED = true
    try {
      const result = await close(MEMBERS.DropdownMenu!, { keepMounted: true })
      expect(result.completesFalse).toBe(1)
      expect(result.popup.isConnected).toBe(true)
    } finally {
      delete flags.BASE_UI_ANIMATIONS_DISABLED
    }
  })
})

describe('a tree that closes together', () => {
  const order: string[] = []
  const frames: Record<string, number> = {}
  // The frame the root's close was asked in: frames count from it.
  let closedAt: number | null = null
  const completeAs = (name: string) => (open: boolean) => {
    if (open) return
    order.push(name)
    frames[name] = frame - (closedAt ?? frame)
  }
  let setRootOpen: (open: boolean) => void = () => {}
  // An error the submenu's onOpenChangeComplete throws, if any.
  let subThrows: Error | null = null
  afterEach(() => {
    subThrows = null
  })

  function Tree({ depth }: { depth: 1 | 2 }) {
    const [open, setOpenState] = React.useState(false)
    setRootOpen = (next) => {
      if (!next && closedAt === null) closedAt = frame
      setOpenState(next)
    }
    const nested = (
      <DropdownMenu.Submenu onOpenChangeComplete={completeAs('subsub')}>
        <DropdownMenu.SubmenuTrigger data-testid="more2">
          More
        </DropdownMenu.SubmenuTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup data-testid="subsub">
              <DropdownMenu.Surface>
                <DropdownMenu.List data-testid="subsub-list">
                  <DropdownMenu.Item>Deep</DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    )
    return (
      <DropdownMenu.Root
        open={open}
        onOpenChange={(next) => {
          if (!next && closedAt === null) closedAt = frame
          setOpenState(next)
        }}
        onOpenChangeComplete={completeAs('root')}
      >
        <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup data-testid="root">
              <DropdownMenu.Surface>
                <DropdownMenu.List data-testid="root-list">
                  <DropdownMenu.Item>One</DropdownMenu.Item>
                  <DropdownMenu.Submenu
                    onOpenChangeComplete={(next) => {
                      completeAs('sub')(next)
                      if (!next && subThrows) throw subThrows
                    }}
                  >
                    <DropdownMenu.SubmenuTrigger data-testid="more">
                      More
                    </DropdownMenu.SubmenuTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Positioner>
                        <DropdownMenu.Popup data-testid="sub">
                          <DropdownMenu.Surface>
                            <DropdownMenu.List data-testid="sub-list">
                              <DropdownMenu.Item data-testid="sub-item">
                                Sub
                              </DropdownMenu.Item>
                              {depth === 2 && nested}
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

  /** Opens the tree to `depth` with the keyboard, focus in the deepest list. */
  async function openTree(depth: 1 | 2) {
    render(<Tree depth={depth} />)
    await userEvent.click(screen.getByTestId('trigger'))
    await waitFor(() => expect(screen.getByTestId('root-list')).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}{ArrowRight}')
    await waitFor(() => expect(screen.getByTestId('sub-list')).toHaveFocus())
    if (depth === 2) {
      await userEvent.keyboard('{ArrowDown}{ArrowRight}')
      await waitFor(() =>
        expect(screen.getByTestId('subsub-list')).toHaveFocus(),
      )
    }
    for (let i = 0; i < 5; i++) await nextFrame()
  }

  /** Closes the open tree with `close`, then waits a few frames. */
  async function closeTree(close: () => Promise<void> | void) {
    order.length = 0
    for (const key of Object.keys(frames)) delete frames[key]
    frame = 0
    closedAt = null
    let running = true
    const tick = () => {
      if (!running) return
      frame++
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    await close()
    await waitFor(() => expect(order).toContain('root'))
    for (let i = 0; i < 3; i++) await nextFrame()
    running = false
  }

  for (const [how, close] of [
    [
      'a submenu item press',
      () => userEvent.click(screen.getByTestId('sub-item')),
    ],
    ['Escape in the submenu', () => userEvent.keyboard('{Escape}')],
    ['the root’s open set to false', () => act(() => setRootOpen(false))],
  ] as const) {
    it(`reports each popup’s close once, in the frame it closes, the submenu first: ${how}`, async () => {
      await openTree(1)
      await closeTree(close)
      expect(order).toEqual(['sub', 'root'])
      expect(frames).toEqual({ sub: 0, root: 0 })
    })
  }

  it('reports a two-level tree’s closes deepest first', async () => {
    await openTree(2)
    await closeTree(() => act(() => setRootOpen(false)))
    expect(order).toEqual(['subsub', 'sub', 'root'])
    expect(frames).toEqual({ subsub: 0, sub: 0, root: 0 })
  })

  it('completes the root’s close when the submenu’s completion throws, and reports the error after', async () => {
    const reported = vi
      .spyOn(globalThis, 'reportError')
      .mockImplementation(() => {})
    try {
      await openTree(1)
      subThrows = new Error('sub complete')
      await closeTree(() => act(() => setRootOpen(false)))
      expect(order).toEqual(['sub', 'root'])
      expect(frames).toEqual({ sub: 0, root: 0 })
      expect(reported).toHaveBeenCalledTimes(1)
      expect(reported).toHaveBeenCalledWith(subThrows)
    } finally {
      reported.mockRestore()
    }
  })
})

describe('a popup that closes with a popup it holds of another tree', () => {
  const order: string[] = []
  const completeAs = (name: string) => (open: boolean) => {
    if (!open) order.push(name)
  }
  let closeBoth: () => void = () => {}

  function Inner({ kind }: { kind: 'menu' | 'popover' }) {
    const [open, set] = React.useState(true)
    closeInner = () => set(false)
    if (kind === 'popover') {
      return (
        <Popover.Root
          open={open}
          onOpenChange={set}
          onOpenChangeComplete={completeAs('inner')}
        >
          <Popover.Trigger>Inner</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup data-testid="inner">Popover</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      )
    }
    return (
      <DropdownMenu.Root
        open={open}
        onOpenChange={set}
        onOpenChangeComplete={completeAs('inner')}
        modal={false}
      >
        <DropdownMenu.Trigger>Inner</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup data-testid="inner">
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <DropdownMenu.Item>B</DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }
  let closeInner: () => void = () => {}

  function Outer({ kind }: { kind: 'menu' | 'popover' | 'submenu' }) {
    const [open, set] = React.useState(true)
    closeBoth = () => {
      closeInner()
      set(false)
    }
    return (
      <DropdownMenu.Root
        open={open}
        onOpenChange={set}
        onOpenChangeComplete={completeAs('outer')}
        modal={false}
      >
        <DropdownMenu.Trigger>Outer</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup data-testid="outer">
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <DropdownMenu.Item>A</DropdownMenu.Item>
                  {kind === 'submenu' && (
                    <DropdownMenu.Submenu
                      defaultOpen
                      onOpenChangeComplete={completeAs('sub')}
                    >
                      <DropdownMenu.SubmenuTrigger>
                        More
                      </DropdownMenu.SubmenuTrigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Positioner>
                          <DropdownMenu.Popup data-testid="sub">
                            <DropdownMenu.Surface>
                              <DropdownMenu.List>
                                <DropdownMenu.Item>S</DropdownMenu.Item>
                              </DropdownMenu.List>
                            </DropdownMenu.Surface>
                            <Inner kind="menu" />
                          </DropdownMenu.Popup>
                        </DropdownMenu.Positioner>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Submenu>
                  )}
                </DropdownMenu.List>
              </DropdownMenu.Surface>
              {kind !== 'submenu' && <Inner kind={kind} />}
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  for (const [kind, what] of [
    ['menu', 'a DropdownMenu in a DropdownMenu’s popup'],
    ['popover', 'a Base UI Popover in a DropdownMenu’s popup'],
    ['submenu', 'a DropdownMenu in a DropdownMenu’s submenu popup'],
  ] as const) {
    it(`reports each close once, the inner one first: ${what}`, async () => {
      order.length = 0
      render(<Outer kind={kind} />)
      await screen.findByTestId('inner')
      for (let i = 0; i < 6; i++) await nextFrame()
      act(() => closeBoth())
      await waitFor(() => expect(order).toContain('outer'))
      for (let i = 0; i < 6; i++) await nextFrame()
      expect(order).toEqual(
        kind === 'submenu' ? ['inner', 'sub', 'outer'] : ['inner', 'outer'],
      )
      expect(screen.queryByTestId('outer')).toBeNull()
    })
  }
})

describe('a popup whose element changes while it’s mounted', () => {
  it('completes its close in the frame it closes on the element it has then', async () => {
    let swap: () => void = () => {}
    function Swapping() {
      const [section, setSection] = React.useState(false)
      swap = () => setSection(true)
      return (
        <Open>
          {(open, onOpenChange) => (
            <DropdownMenu.Root
              open={open}
              onOpenChange={onOpenChange}
              onOpenChangeComplete={complete}
            >
              <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Positioner>
                  <DropdownMenu.Popup
                    data-testid="popup"
                    render={section ? <section /> : <div />}
                  >
                    <DropdownMenu.Surface>
                      <DropdownMenu.List>
                        <Rows Item={DropdownMenu.Item} />
                      </DropdownMenu.List>
                    </DropdownMenu.Surface>
                  </DropdownMenu.Popup>
                </DropdownMenu.Positioner>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </Open>
      )
    }
    const result = await close({
      render: () => <Swapping />,
      open: () => {
        act(() => swap())
        return () => setOpen(false)
      },
    })
    expect(result.popup.tagName).toBe('SECTION')
    expect(result.completeFrame).toBe(0)
    expect(result.completesFalse).toBe(1)
  })
})
