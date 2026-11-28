import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Combobox } from '../../combobox/index.js'
import { DropdownMenu, useItem } from '../../dropdown-menu/index.js'
import { RowWidthQueue } from '../listbox/contexts/surface-tier-context.js'
import {
  ListboxStore,
  RowWidthContext,
  SurfaceContext,
  type SurfaceContextValue,
  useMaybeSurfaceContext,
} from '../listbox/index.js'
import { useFocusOwner } from './contexts/focus-owner-context.js'
import { usePopupSurfaceId } from './contexts/popup-surface-id-context.js'
import { useMaybeSubmenuContext } from './contexts/submenu-context.js'
import { useMenuSurfaceSettings } from './contexts/surface-settings-context.js'
import {
  type MenuSurfaceTier,
  useMaybeMenuSurfaceTier,
  useMenuSurfaceTier,
} from './contexts/surface-tier-context.js'
import {
  type ForwardKeyDown,
  useForwardedKeyDown,
} from './hooks/use-forwarded-key-down.js'

/**
 * A surface's identity (its id and store) and its rows' width queue are on
 * its tier: parts read them there. The published `SurfaceContext`,
 * `PopupSurfaceIdContext` and `RowWidthContext` are still provided where they
 * were, from the tier, and no longer steer the parts below them.
 */

interface Seen {
  surface: SurfaceContextValue | null
  popupId: string | null
  tier: MenuSurfaceTier | null
  submenuId: string | null
}

function Probe({ log }: { log: Seen[] }) {
  log.push({
    surface: useMaybeSurfaceContext(),
    popupId: usePopupSurfaceId(),
    tier: useMaybeMenuSurfaceTier(),
    submenuId: useMaybeSubmenuContext()?.childSurfaceId ?? null,
  })
  return null
}

function Menu({
  root,
  sub,
  page,
}: {
  root: Seen[]
  sub: Seen[]
  page: Seen[]
}) {
  return (
    <DropdownMenu.Root defaultOpen>
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

describe('a surface’s identity', () => {
  it('is its tier’s, which the published SurfaceContext and PopupSurfaceIdContext carry, at every level', async () => {
    const root: Seen[] = []
    const sub: Seen[] = []
    const page: Seen[] = []
    render(<Menu root={root} sub={sub} page={page} />)
    await screen.findByText('Nested')

    const r = root.at(-1)
    expect(r?.surface?.surfaceId).toBe(r?.popupId)
    expect(r?.surface?.store).toBe(r?.tier?.store)
    expect(r?.tier?.surfaceId ?? '').toBe(r?.popupId)

    // A submenu's is its handle's child surface id.
    const s = sub.at(-1)
    expect(s?.surface?.surfaceId).toBe(s?.popupId)
    expect(s?.surface?.surfaceId).toBe(s?.submenuId)
    expect(s?.tier?.surfaceId).toBe(s?.submenuId)
    expect(s?.surface?.store).toBe(s?.tier?.store)
    expect(s?.surface?.surfaceId).not.toBe(r?.surface?.surfaceId)

    // A subpage's is its own.
    act(() => screen.getByText('Page').click())
    await screen.findByText('On the page')
    const p = page.at(-1)
    expect(p?.surface?.surfaceId).toBe(p?.popupId)
    expect(p?.tier?.surfaceId).toBe(p?.popupId)
    expect(p?.surface?.store).toBe(p?.tier?.store)
    expect(p?.surface?.surfaceId).not.toBe(r?.surface?.surfaceId)

    // Fixed for the tier's life.
    expect(new Set(root.map((seen) => seen.surface?.surfaceId)).size).toBe(1)
  })

  it('of a menu nested in a submenu’s content is that submenu’s, as its popup’s was', async () => {
    const inner: Seen[] = []
    const sub: Seen[] = []
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Outer</DropdownMenu.Trigger>
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
                              <Probe log={sub} />
                              <DropdownMenu.Item>Nested</DropdownMenu.Item>
                            </DropdownMenu.List>
                          </DropdownMenu.Surface>
                          <DropdownMenu.Root defaultOpen modal={false}>
                            <DropdownMenu.Trigger>Inner</DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Positioner>
                                <DropdownMenu.Popup>
                                  <DropdownMenu.Surface>
                                    <DropdownMenu.List>
                                      <Probe log={inner} />
                                      <DropdownMenu.Item>
                                        Inner item
                                      </DropdownMenu.Item>
                                    </DropdownMenu.List>
                                  </DropdownMenu.Surface>
                                </DropdownMenu.Popup>
                              </DropdownMenu.Positioner>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>
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
    await screen.findByText('Inner item')
    expect(inner.at(-1)?.popupId).toBe(sub.at(-1)?.submenuId)
    expect(inner.at(-1)?.surface?.surfaceId).toBe(inner.at(-1)?.popupId)
    expect(inner.at(-1)?.surface?.store).not.toBe(sub.at(-1)?.surface?.store)
  })

  it('of a submenu’s trigger row is the surface above', async () => {
    const inTrigger: Seen[] = []
    const root: Seen[] = []
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <Probe log={root} />
                  <DropdownMenu.Submenu>
                    <DropdownMenu.SubmenuTrigger data-testid="more">
                      More
                      <Probe log={inTrigger} />
                    </DropdownMenu.SubmenuTrigger>
                  </DropdownMenu.Submenu>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    await screen.findByTestId('more')
    const rootStore = root.at(-1)?.tier?.store
    // The trigger sits under its submenu's tier, but is a row of the root's
    // surface: it registers in the root's store.
    expect(inTrigger.at(-1)?.tier?.store).not.toBe(rootStore)
    expect(inTrigger.at(-1)?.tier?.parent?.store).toBe(rootStore)
    expect(inTrigger.at(-1)?.surface?.store).toBe(rootStore)
    await waitFor(() => expect(rootStore?.getVisibleItemIds()).toHaveLength(1))
  })
})

describe('a surface’s rows’ width queue', () => {
  it('holds a row until the List it’s in attaches, which takes it; null drops it', () => {
    const queue = new RowWidthQueue()
    const list = document.createElement('div')
    const other = document.createElement('div')
    const row = list.appendChild(document.createElement('div'))
    const outside = other.appendChild(document.createElement('div'))
    queue.queue(row, 'a')
    queue.queue(outside, 'x')
    const measured: string[] = []
    const detach = queue.attach(list, (_element, id) => measured.push(id))
    expect(measured).toEqual(['a'])
    queue.queue(row, 'b')
    expect(measured).toEqual(['a', 'b'])
    // Another List that doesn't measure takes its own rows, and leaves this
    // one's measurer.
    queue.attach(other, null)
    queue.queue(row, 'c')
    expect(measured).toEqual(['a', 'b', 'c'])
    detach()
    queue.queue(row, 'd')
    queue.attach(list, null)
    queue.queue(row, 'e')
    expect(measured).toEqual(['a', 'b', 'c'])
  })

  it('drops a waiting row when it unmounts', () => {
    const queue = new RowWidthQueue()
    const list = document.createElement('div')
    const row = list.appendChild(document.createElement('div'))
    const remove = queue.queue(row, 'gone')
    remove()
    const measured: string[] = []
    queue.attach(list, (_element, id) => measured.push(id))
    expect(measured).toEqual([])
  })

  it('reaches the List when it starts measuring after its rows mounted', async () => {
    const getWidth = (element: HTMLElement) =>
      Number.parseFloat(element.getAttribute('data-measure-width') ?? '0') || 0
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0)
        return 1
      })
    const caf = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {})
    const scroll = vi
      .spyOn(HTMLElement.prototype, 'scrollWidth', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return getWidth(this)
      })
    const offset = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return getWidth(this)
      })
    try {
      function Measured({ measure }: { measure: boolean }) {
        return (
          <DropdownMenu.Root defaultOpen>
            <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Positioner>
                <DropdownMenu.Popup data-testid="popup">
                  <DropdownMenu.Surface>
                    <DropdownMenu.List measureRowWidth={measure}>
                      <DropdownMenu.Item data-measure-width="300">
                        Wide
                      </DropdownMenu.Item>
                    </DropdownMenu.List>
                  </DropdownMenu.Surface>
                </DropdownMenu.Popup>
              </DropdownMenu.Positioner>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )
      }
      const { rerender } = render(<Measured measure={false} />)
      const popup = await screen.findByTestId('popup')
      await act(async () => {})
      expect(popup.style.getPropertyValue('--row-width')).toBe('')
      rerender(<Measured measure />)
      await waitFor(() =>
        expect(popup.style.getPropertyValue('--row-width')).not.toBe(''),
      )
    } finally {
      raf.mockRestore()
      caf.mockRestore()
      scroll.mockRestore()
      offset.mockRestore()
    }
  })
})

describe('a consumer’s own provider of SurfaceContext or RowWidthContext', () => {
  it('gives the consumer’s code its value, and doesn’t steer the rows below it', async () => {
    const other = new ListboxStore()
    const seen: (SurfaceContextValue | null)[] = []
    const queued: string[] = []
    function ConsumerProbe() {
      seen.push(useMaybeSurfaceContext())
      return null
    }
    const tiers: (MenuSurfaceTier | null)[] = []
    function TierProbe() {
      tiers.push(useMaybeMenuSurfaceTier())
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
                  <TierProbe />
                  <SurfaceContext.Provider
                    value={{ store: other, surfaceId: 'consumer' }}
                  >
                    <RowWidthContext.Provider
                      value={{ queueMeasurement: (_e, id) => queued.push(id) }}
                    >
                      <ConsumerProbe />
                      <DropdownMenu.Item>Apple</DropdownMenu.Item>
                    </RowWidthContext.Provider>
                  </SurfaceContext.Provider>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    await screen.findByText('Apple')
    await act(async () => {})
    expect(seen.at(-1)?.store).toBe(other)
    // The row is the menu surface's: it registers in its store, and its
    // width goes to its List, not to the consumer's queue.
    expect(other.getVisibleItemIds()).toEqual([])
    expect(tiers.at(-1)?.store.getVisibleItemIds()).toHaveLength(1)
    expect(queued).toEqual([])
  })
})

/** Rows report `data-w` as their width, and frames run at once. */
function mockRowWidths() {
  const width = (element: HTMLElement) =>
    Number(element.getAttribute('data-w') ?? 0)
  const spies = [
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 1
    }),
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {}),
    vi
      .spyOn(HTMLElement.prototype, 'scrollWidth', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return width(this)
      }),
    vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return width(this)
      }),
  ]
  return () => {
    for (const spy of spies) spy.mockRestore()
  }
}

describe('a surface’s rows’ width queue, in a menu', () => {
  it('keeps nothing for a row that unmounts before a List takes it', async () => {
    // Rows outside any List wait in the queue: each takes itself out when
    // it unmounts.
    const removals = new Map<string, number>()
    const queue = RowWidthQueue.prototype.queue
    const spy = vi
      .spyOn(RowWidthQueue.prototype, 'queue')
      .mockImplementation(function (this: RowWidthQueue, element, id) {
        const remove = queue.call(this, element, id)
        removals.set(id, 0)
        return () => {
          removals.set(id, (removals.get(id) ?? 0) + 1)
          remove()
        }
      })
    function Row({ label }: { label: string }) {
      const item = useItem({ value: label })
      return <div ref={item.ref}>{label}</div>
    }
    function Menu({ batch }: { batch: number }) {
      return (
        <DropdownMenu.Root defaultOpen>
          <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface>
                  {[0, 1, 2].map((i) => (
                    <Row key={`${batch}-${i}`} label={`row-${batch}-${i}`} />
                  ))}
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }
    try {
      const { rerender } = render(<Menu batch={0} />)
      await screen.findByText('row-0-0')
      rerender(<Menu batch={1} />)
      await screen.findByText('row-1-0')
      expect(Object.fromEntries(removals)).toEqual({
        'row-0-0': 1,
        'row-0-1': 1,
        'row-0-2': 1,
        'row-1-0': 0,
        'row-1-1': 0,
        'row-1-2': 0,
      })
    } finally {
      spy.mockRestore()
    }
  })

  it('follows a List whose render prop swaps its element', async () => {
    const restore = mockRowWidths()
    try {
      function Menu({ swapped, wide }: { swapped: boolean; wide: boolean }) {
        return (
          <DropdownMenu.Root defaultOpen>
            <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Positioner>
                <DropdownMenu.Popup data-testid="popup">
                  <DropdownMenu.Surface>
                    <DropdownMenu.List
                      measureRowWidth
                      render={swapped ? <section /> : <div />}
                    >
                      <DropdownMenu.Item data-w="100">A</DropdownMenu.Item>
                      {wide && (
                        <DropdownMenu.Item data-w="350">Wide</DropdownMenu.Item>
                      )}
                    </DropdownMenu.List>
                  </DropdownMenu.Surface>
                </DropdownMenu.Popup>
              </DropdownMenu.Positioner>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )
      }
      const { rerender } = render(<Menu swapped={false} wide={false} />)
      const popup = await screen.findByTestId('popup')
      await act(async () => {})
      const before = popup.style.getPropertyValue('--row-width')
      expect(before).not.toBe('')
      rerender(<Menu swapped wide={false} />)
      await act(async () => {})
      rerender(<Menu swapped wide />)
      await screen.findByText('Wide')
      await act(async () => {})
      const after = popup.style.getPropertyValue('--row-width')
      expect(Number.parseFloat(after)).toBeGreaterThan(
        Number.parseFloat(before),
      )
    } finally {
      restore()
    }
  })

  it('reaches each List in a surface: one that doesn’t measure leaves the other’s', async () => {
    const restore = mockRowWidths()
    try {
      function Menu({ wide }: { wide: boolean }) {
        return (
          <DropdownMenu.Root defaultOpen>
            <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Positioner>
                <DropdownMenu.Popup data-testid="popup">
                  <DropdownMenu.Surface>
                    <DropdownMenu.List measureRowWidth>
                      <DropdownMenu.Item data-w="100">A</DropdownMenu.Item>
                      {wide && (
                        <DropdownMenu.Item data-w="350">Wide</DropdownMenu.Item>
                      )}
                    </DropdownMenu.List>
                    <DropdownMenu.List measureRowWidth={false}>
                      <DropdownMenu.Item data-w="50">B</DropdownMenu.Item>
                    </DropdownMenu.List>
                  </DropdownMenu.Surface>
                </DropdownMenu.Popup>
              </DropdownMenu.Positioner>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )
      }
      const { rerender } = render(<Menu wide={false} />)
      const popup = await screen.findByTestId('popup')
      await act(async () => {})
      const before = popup.style.getPropertyValue('--row-width')
      expect(before).not.toBe('')
      rerender(<Menu wide />)
      await screen.findByText('Wide')
      await act(async () => {})
      const after = popup.style.getPropertyValue('--row-width')
      expect(Number.parseFloat(after)).toBeGreaterThan(
        Number.parseFloat(before),
      )
    } finally {
      restore()
    }
  })
})

/**
 * A submenu's trigger, and anything beside it in its `Submenu`, is in the
 * submenu's level and mounted in the surface above: it's a part of that
 * surface.
 */
function MenuWithSubmenu({
  beside,
  inTrigger,
  search,
}: {
  beside?: React.ReactNode
  inTrigger?: React.ReactNode
  search?: boolean
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="root-popup">
            <DropdownMenu.Surface>
              {search && <DropdownMenu.Input data-testid="search" />}
              <DropdownMenu.List data-testid="root-list">
                <DropdownMenu.Item>Apple</DropdownMenu.Item>
                <DropdownMenu.Submenu>
                  {beside}
                  <DropdownMenu.SubmenuTrigger>
                    More
                    {inTrigger}
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup>
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

const highlighted = () =>
  document.querySelector('[data-highlighted]')?.textContent ?? null

describe('a part beside a submenu’s trigger', () => {
  it('a FocusZone in the trigger takes Tab from the surface above', async () => {
    render(
      <MenuWithSubmenu
        inTrigger={
          <DropdownMenu.FocusZone>
            <button type="button" data-testid="action">
              Action
            </button>
          </DropdownMenu.FocusZone>
        }
      />,
    )
    const list = await screen.findByTestId('root-list')
    act(() => list.focus())
    fireEvent.keyDown(list, { key: 'Tab' })
    await act(async () => {})
    expect(document.activeElement).toBe(screen.getByTestId('action'))
    expect(screen.queryByTestId('root-popup')).not.toBeNull()
  })

  it('an Item, a Group’s item and a CheckboxItem are rows of the surface above, reached by ArrowDown', async () => {
    render(
      <MenuWithSubmenu
        beside={
          <>
            <DropdownMenu.Group>
              <DropdownMenu.Item>Grouped</DropdownMenu.Item>
            </DropdownMenu.Group>
            <DropdownMenu.CheckboxItem>Check</DropdownMenu.CheckboxItem>
            <DropdownMenu.Item>Sibling</DropdownMenu.Item>
          </>
        }
      />,
    )
    const list = await screen.findByTestId('root-list')
    act(() => list.focus())
    const order = [highlighted()]
    for (let i = 0; i < 4; i++) {
      fireEvent.keyDown(list, { key: 'ArrowDown' })
      order.push(highlighted())
    }
    expect(order).toEqual(['Apple', 'Grouped', 'Check', 'Sibling', 'More'])
  })

  it('a Separator and a Group are rows of the surface above: positioned among its rows, and hidden by its search', async () => {
    render(
      <MenuWithSubmenu
        search
        beside={
          <>
            <DropdownMenu.Separator data-testid="separator" />
            <DropdownMenu.Group data-testid="group">
              <DropdownMenu.Item>Grouped</DropdownMenu.Item>
            </DropdownMenu.Group>
          </>
        }
      />,
    )
    const separator = await screen.findByTestId('separator')
    expect(separator).not.toHaveAttribute('data-first')
    expect(screen.getByTestId('group')).not.toHaveAttribute('data-first')
    fireEvent.change(screen.getByTestId('search'), {
      target: { value: 'apple' },
    })
    await act(async () => {})
    expect(screen.queryByTestId('separator')).toBeNull()
    expect(screen.queryByText('Grouped')).toBeNull()
    expect(screen.getByTestId('group')).toHaveAttribute('data-hidden')
  })

  it('a CheckboxItem is in the surface above’s checkbox selection: a range reaches it, and previews it', async () => {
    const box = (value: string) => (
      <DropdownMenu.CheckboxItem data-testid={value}>
        {value}
      </DropdownMenu.CheckboxItem>
    )
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List data-testid="root-list">
                  {box('one')}
                  {box('mid')}
                  <DropdownMenu.Submenu>
                    {box('two')}
                    <DropdownMenu.SubmenuTrigger>
                      More
                    </DropdownMenu.SubmenuTrigger>
                  </DropdownMenu.Submenu>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    const checked = () =>
      ['one', 'mid', 'two'].map((id) =>
        screen.getByTestId(id).getAttribute('aria-checked'),
      )
    const list = await screen.findByTestId('root-list')
    await act(async () => {})
    act(() => list.focus())
    // A keyboard span previews the rows it would change while Shift is held.
    fireEvent.keyDown(list, { key: 'ArrowDown', shiftKey: true })
    fireEvent.keyDown(list, { key: 'ArrowDown', shiftKey: true })
    expect(checked()).toEqual(['true', 'true', 'true'])
    fireEvent.keyUp(document, { key: 'Shift' })
    await act(async () => {})
    expect(checked()).toEqual(['true', 'true', 'true'])
    // A Shift+click range from the first row reaches it.
    act(() => {
      fireEvent.click(screen.getByTestId('one'))
    })
    act(() => {
      fireEvent.click(screen.getByTestId('two'), { shiftKey: true })
    })
    expect(checked()).toEqual(['false', 'false', 'false'])
  })

  it('a custom useItem row registers in the surface above', async () => {
    const tiers: (MenuSurfaceTier | null)[] = []
    function TierProbe() {
      tiers.push(useMaybeMenuSurfaceTier())
      return null
    }
    function Row() {
      const item = useItem({ value: 'Custom' })
      return <div ref={item.ref}>Custom</div>
    }
    render(
      <MenuWithSubmenu
        beside={
          <>
            <TierProbe />
            <Row />
          </>
        }
      />,
    )
    await screen.findByText('Custom')
    await act(async () => {})
    const submenuTier = tiers.at(-1)
    expect(submenuTier?.parent?.store.getVisibleItemIds()).toContain('Custom')
    expect(submenuTier?.store.getVisibleItemIds()).not.toContain('Custom')
  })
})

describe('the checkbox selection outside a Surface', () => {
  it('is none: Shift+ArrowDown in a Combobox’s input toggles no checkbox', async () => {
    const onCheckedChange = vi.fn()
    render(
      <Combobox.Root defaultOpen>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Surface>
                <Combobox.List>
                  <DropdownMenu.CheckboxItem
                    value="a"
                    onCheckedChange={onCheckedChange}
                  >
                    A
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItem
                    value="b"
                    onCheckedChange={onCheckedChange}
                  >
                    B
                  </DropdownMenu.CheckboxItem>
                </Combobox.List>
              </Combobox.Surface>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    )
    const input = await screen.findByTestId('input')
    await screen.findByText('A')
    act(() => input.focus())
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown', shiftKey: true })
    fireEvent.keyUp(document, { key: 'Shift' })
    await act(async () => {})
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('is none: a forwarded Shift+ArrowDown over checkboxes checks none', async () => {
    const onCheckedChange = vi.fn()
    let forward: ForwardKeyDown | null = null
    // Mounted in the menu, outside its Surface, as SuggestionMenu's is.
    function Forwarder() {
      const { store } = useMenuSurfaceTier()
      const { closeAll } = useMenuSurfaceSettings()
      forward = useForwardedKeyDown({
        store,
        surfaceId: 'host',
        focusOwnerStore: useFocusOwner(),
        depth: 0,
        submenuContext: null,
        enabled: true,
        closeAll,
      })
      return null
    }
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <Forwarder />
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  {['a', 'b', 'c'].map((value) => (
                    <DropdownMenu.CheckboxItem
                      key={value}
                      value={value}
                      onCheckedChange={onCheckedChange}
                    >
                      {value}
                    </DropdownMenu.CheckboxItem>
                  ))}
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    await screen.findByText('c')
    await act(async () => {})
    const press = (shiftKey: boolean) =>
      act(() => {
        ;(forward as ForwardKeyDown | null)?.(
          new KeyboardEvent('keydown', {
            key: 'ArrowDown',
            shiftKey,
            bubbles: true,
            cancelable: true,
          }),
        )
      })
    press(false)
    press(true)
    press(true)
    fireEvent.keyUp(document, { key: 'Shift' })
    await act(async () => {})
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('makes a CheckboxItem outside a Surface throw', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(() =>
        render(
          <DropdownMenu.Root defaultOpen>
            <DropdownMenu.CheckboxItem value="x">X</DropdownMenu.CheckboxItem>
          </DropdownMenu.Root>,
        ),
      ).toThrow(/Surface/)
    } finally {
      error.mockRestore()
    }
  })
})
