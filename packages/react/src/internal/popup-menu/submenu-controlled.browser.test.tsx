import { render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import {
  type SubmenuContextValue,
  useSubmenuContext,
} from './contexts/submenu-context.js'

// A submenu whose consumer controls `open`, applying each change in a real
// browser in one of three ways: React state set in the handler (committed
// at the end of the event), React state set in a transition (committed in a
// later task), or an external store outside React (subscribe/getSnapshot)
// that publishes the change in a later task. The store is the only
// authority: the trigger's controller acts on what it asked for until the
// prop arrives.

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Pointer events dispatched natively, outside `act`, so React schedules the
// consumer's update as it would in the app (a transition commits later).
// React makes enter and leave from `pointerover` and `pointerout`.
type Point = { clientX: number; clientY: number }
function pointer(target: EventTarget, type: string, point: Point) {
  target.dispatchEvent(
    new PointerEvent(type, {
      ...point,
      bubbles: true,
      pointerType: 'mouse',
      relatedTarget:
        type === 'pointerover' || type === 'pointerout' ? document.body : null,
    }),
  )
}
const enter = (target: Element, point: Point) =>
  pointer(target, 'pointerover', point)
const leave = (target: Element, point: Point) =>
  pointer(target, 'pointerout', point)
const move = (target: EventTarget, point: Point) =>
  pointer(target, 'pointermove', point)

// Updates the tests make outside `act` are the point
const actEnvironment = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
let wasActEnvironment: boolean | undefined
beforeAll(() => {
  wasActEnvironment = actEnvironment.IS_REACT_ACT_ENVIRONMENT
  actEnvironment.IS_REACT_ACT_ENVIRONMENT = false
})
afterAll(() => {
  actEnvironment.IS_REACT_ACT_ENVIRONMENT = wasActEnvironment
})

type Mode = 'useState' | 'startTransition' | 'external store' | 'ignored'

/** How long the external store takes to publish a change. */
const STORE_DELAY_MS = 20

/** A store outside React that publishes each change in a later task. */
function createOpenStore() {
  let open = false
  const listeners = new Set<() => void>()
  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => open,
    set(next: boolean) {
      setTimeout(() => {
        open = next
        for (const listener of listeners) listener()
      }, STORE_DELAY_MS)
    },
  }
}

/** The submenu's `open` and `onOpenChange`, applied as `mode` says. */
function useControlledOpen(
  mode: Mode,
  onRequest: (open: boolean, reason: string) => void,
) {
  const [state, setState] = React.useState(false)
  const [store] = React.useState(createOpenStore)
  const fromStore = React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )
  const open = mode === 'external store' ? fromStore : state
  const onOpenChange = (next: boolean, details: { reason: string }) => {
    onRequest(next, details.reason)
    if (mode === 'useState') setState(next)
    else if (mode === 'startTransition') {
      React.startTransition(() => setState(next))
    } else if (mode === 'external store') store.set(next)
  }
  return { open, onOpenChange }
}

/** Hands out the submenu's context, as a part under it can read it. */
function Capture({
  onContext,
}: {
  onContext: (context: SubmenuContextValue) => void
}) {
  onContext(useSubmenuContext())
  return null
}

function Menu({
  mode,
  onRequest,
  delay,
  keepMounted,
  openOnHighlight,
  onContext,
}: {
  mode: Mode
  onRequest: (open: boolean, reason: string) => void
  delay?: number
  keepMounted?: boolean
  openOnHighlight?: boolean
  onContext?: (context: SubmenuContextValue) => void
}) {
  const { open, onOpenChange } = useControlledOpen(mode, onRequest)
  return (
    <DropdownMenu.Root defaultOpen modal={false}>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup">
            <DropdownMenu.Surface>
              <DropdownMenu.List data-testid="list">
                <DropdownMenu.Item data-testid="first" value="first">
                  First
                </DropdownMenu.Item>
                <DropdownMenu.Submenu open={open} onOpenChange={onOpenChange}>
                  {onContext && <Capture onContext={onContext} />}
                  <DropdownMenu.SubmenuTrigger
                    data-testid="submenu-trigger"
                    value="more"
                    delay={delay}
                    openOnHighlight={openOnHighlight}
                  >
                    More
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal keepMounted={keepMounted}>
                    <DropdownMenu.Positioner data-testid="submenu-positioner">
                      <DropdownMenu.Popup data-testid="submenu-popup">
                        <DropdownMenu.Surface>
                          <DropdownMenu.List data-testid="submenu-list">
                            {['one', 'two', 'three', 'four', 'five'].map(
                              (value) => (
                                <DropdownMenu.Item key={value} value={value}>
                                  {value}
                                </DropdownMenu.Item>
                              ),
                            )}
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
                <DropdownMenu.Item data-testid="sibling" value="sibling">
                  Sibling
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

const MODES: Mode[] = ['useState', 'startTransition', 'external store']

function setup(
  mode: Mode,
  props: {
    delay?: number
    keepMounted?: boolean
    openOnHighlight?: boolean
    onContext?: (context: SubmenuContextValue) => void
  } = {},
) {
  const requests: Array<[boolean, string]> = []
  const onRequest = vi.fn((open: boolean, reason: string) => {
    requests.push([open, reason])
  })
  render(<Menu mode={mode} onRequest={onRequest} {...props} />)
  return { requests }
}

const expanded = (value: 'true' | 'false') =>
  waitFor(() =>
    expect(screen.getByTestId('submenu-trigger')).toHaveAttribute(
      'aria-expanded',
      value,
    ),
  )

/**
 * The closed, kept-mounted popup stays laid out, beside the trigger, so a
 * pointer can aim at it before it opens; it stays there once it opens.
 * Returns the style to remove.
 */
function layOutClosedPopup(): HTMLStyleElement {
  const rect = screen.getByTestId('submenu-trigger').getBoundingClientRect()
  const rootPopup = screen.getByTestId('popup').getBoundingClientRect()
  const style = document.createElement('style')
  style.textContent = `[data-testid='submenu-positioner'] {
    display: block !important;
    left: ${rect.right + 40}px !important;
    top: ${rect.top}px !important;
  }
  [data-testid='submenu-popup'] { min-height: ${rootPopup.height + 200}px }`
  document.head.append(style)
  return style
}

describe.each(MODES)('a controlled submenu applied with %s', (mode) => {
  it('asks once per hover gesture, and opens when the prop arrives', async () => {
    const { requests } = setup(mode)
    const trigger = await screen.findByTestId('submenu-trigger')
    await userEvent.hover(trigger)
    const rect = trigger.getBoundingClientRect()
    for (let index = 1; index <= 3; index++) {
      move(trigger, {
        clientX: rect.left + 5 + index,
        clientY: rect.top + rect.height / 2,
      })
    }
    await expanded('true')
    expect(requests).toEqual([[true, 'trigger-hover']])
  })

  it('moves focus into it on ArrowRight once it opens', async () => {
    setup(mode)
    await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}')
    await expanded('true')
    // The keyboard highlight opened it; ArrowRight moves focus in
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() =>
      expect(screen.getByTestId('submenu-list')).toHaveFocus(),
    )
  })

  it('moves focus into it on ArrowRight that opens it', async () => {
    // A highlight doesn't open it: only the key does
    const { requests } = setup(mode, { openOnHighlight: false })
    await waitFor(() => expect(screen.getByTestId('list')).toHaveFocus())
    const trigger = screen.getByTestId('submenu-trigger')
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(trigger).toHaveAttribute('data-highlighted'))
    await sleep(200)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(requests).toEqual([])

    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() =>
      expect(screen.getByTestId('submenu-list')).toHaveFocus(),
    )
    expect(requests).toEqual([[true, 'list-navigation']])
  })

  it('holds the aim guard for a hit before it opens, and while the prop arrives', async () => {
    setup(mode, { delay: 5000, keepMounted: true })
    const trigger = await screen.findByTestId('submenu-trigger')
    const sibling = screen.getByTestId('sibling')
    const rect = trigger.getBoundingClientRect()
    const style = layOutClosedPopup()

    try {
      const y = rect.top + rect.height / 2
      enter(trigger, { clientX: rect.left + 10, clientY: y })
      for (const dx of [20, 40, 60]) {
        move(window, { clientX: rect.left + dx, clientY: y })
      }
      leave(trigger, { clientX: rect.right - 10, clientY: y })

      // Still heading for the popup (it extends down beside the menu), over
      // the row below: the guard holds, so the sibling doesn't take the
      // pointer
      const siblingRect = sibling.getBoundingClientRect()
      move(sibling, {
        clientX: rect.right - 5,
        clientY: siblingRect.top + siblingRect.height / 2,
      })
      expect(sibling).not.toHaveAttribute('data-highlighted')

      await expanded('true')
      move(sibling, {
        clientX: rect.right - 4,
        clientY: siblingRect.top + siblingRect.height / 2,
      })
      expect(sibling).not.toHaveAttribute('data-highlighted')
    } finally {
      style.remove()
    }
  })

  if (mode !== 'useState') {
    it('tells the consumer of a reversal before the prop arrives', async () => {
      const { requests } = setup(mode)
      const trigger = await screen.findByTestId('submenu-trigger')
      const rect = trigger.getBoundingClientRect()
      const y = rect.top + rect.height / 2
      enter(trigger, { clientX: rect.left + 10, clientY: y })
      move(trigger, { clientX: rect.left + 12, clientY: y })
      // The prop hasn't arrived
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      // The pointer leaves without aiming at the popup, before the prop
      leave(trigger, { clientX: rect.left + 10, clientY: 500 })
      expect(requests).toEqual([
        [true, 'trigger-hover'],
        [false, 'trigger-hover'],
      ])
      // The consumer applies both (the store publishes each after its delay,
      // a transition commits sooner): the submenu ends closed
      await sleep(STORE_DELAY_MS * 4)
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByTestId('submenu-popup')).not.toBeInTheDocument()
    })
  }
})

describe('a controlled submenu whose consumer never applies an open', () => {
  it('asks again for an aim hit once another request took back the open it asked for', async () => {
    let context: SubmenuContextValue | null = null
    const { requests } = setup('ignored', {
      delay: 0,
      keepMounted: true,
      onContext: (value) => {
        context = value
      },
    })
    const trigger = await screen.findByTestId('submenu-trigger')
    const rect = trigger.getBoundingClientRect()
    const style = layOutClosedPopup()
    try {
      const y = rect.top + rect.height / 2
      enter(trigger, { clientX: rect.left + 10, clientY: y })
      expect(requests).toEqual([[true, 'trigger-hover']])

      // Something else asks the submenu to close: the open isn't pending
      ;(context as SubmenuContextValue | null)?.setOpen(false, 'none')
      expect(requests).toEqual([
        [true, 'trigger-hover'],
        [false, 'none'],
      ])

      for (const dx of [20, 40, 60]) {
        move(window, { clientX: rect.left + dx, clientY: y })
      }
      leave(trigger, { clientX: rect.right - 10, clientY: y })
      // The hit asks for it again, as for a closed submenu
      expect(requests).toEqual([
        [true, 'trigger-hover'],
        [false, 'none'],
        [true, 'trigger-hover'],
      ])
    } finally {
      style.remove()
    }
  })
})
