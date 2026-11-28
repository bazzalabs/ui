import { act, render, screen } from '@testing-library/react'
import * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'

/**
 * Whether a popup completes its close at once is decided from the exit
 * animations it plays (`getAnimations()`, mocked here: jsdom has none). The
 * browser test (`close-in-one-frame.browser.test.tsx`) shows the frames.
 */

type MockAnimation = Pick<Animation, 'playState' | 'pending'> & {
  finished: Promise<unknown>
}

const original = Element.prototype.getAnimations
let animations: MockAnimation[] = []

function mockExit(next: MockAnimation[]) {
  animations = next
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    value(this: Element) {
      return this.getAttribute('data-testid') === 'popup' &&
        this.hasAttribute('data-ending-style')
        ? animations
        : []
    },
  })
}

afterEach(() => {
  if (original) {
    Object.defineProperty(Element.prototype, 'getAnimations', {
      configurable: true,
      value: original,
    })
  } else {
    delete (Element.prototype as Partial<Element>).getAnimations
  }
})

let setOpen: (open: boolean) => void = () => {}
function Menu({
  onOpenChangeComplete,
  keepMounted = false,
}: {
  onOpenChangeComplete: () => void
  keepMounted?: boolean
}) {
  const [open, set] = React.useState(true)
  setOpen = set
  return (
    <DropdownMenu.Root
      open={open}
      onOpenChange={set}
      onOpenChangeComplete={(next) => {
        if (!next) onOpenChangeComplete()
      }}
    >
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal keepMounted={keepMounted}>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup">
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                <DropdownMenu.Item>One</DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

describe('closing a popup', () => {
  it('keeps it while an exit animation runs, then completes once', async () => {
    let finish: () => void = () => {}
    const finished = new Promise<void>((resolve) => {
      finish = resolve
    })
    mockExit([{ playState: 'running', pending: false, finished }])
    const closed = vi.fn()
    render(<Menu onOpenChangeComplete={closed} />)
    await act(async () => {})
    await act(async () => setOpen(false))
    // Past the close's microtask and a frame: the exit still plays.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(closed).not.toHaveBeenCalled()
    expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style')

    animations = []
    await act(async () => {
      finish()
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(closed).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('completes at once when its animations have all finished', async () => {
    // A finished animation that fills forwards stays listed; there's nothing
    // left to wait for.
    mockExit([
      { playState: 'finished', pending: false, finished: Promise.resolve() },
    ])
    const closed = vi.fn()
    render(<Menu onOpenChangeComplete={closed} />)
    await act(async () => {})
    // No frame comes while it closes: a completion that waited for one
    // wouldn't happen.
    const frame = window.requestAnimationFrame
    window.requestAnimationFrame = () => 0
    try {
      await act(async () => setOpen(false))
      expect(closed).toHaveBeenCalledOnce()
      expect(screen.queryByTestId('popup')).toBeNull()
    } finally {
      window.requestAnimationFrame = frame
    }
  })

  it('completes a kept-mounted popup’s close once when Base UI completes it at once', async () => {
    // jsdom has no getAnimations(): Base UI completes the close in its own
    // effect, and the popup stays in the document.
    delete (Element.prototype as Partial<Element>).getAnimations
    const closed = vi.fn()
    render(<Menu onOpenChangeComplete={closed} keepMounted />)
    await act(async () => {})
    await act(async () => setOpen(false))
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    expect(closed).toHaveBeenCalledOnce()
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })
})
