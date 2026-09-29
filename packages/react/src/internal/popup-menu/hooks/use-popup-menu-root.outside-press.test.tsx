import { Popover } from '@base-ui/react/popover'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../../dropdown-menu/index.js'
import { PopupMenuProviders } from '../components/providers.js'
import { usePopupMenuRoot } from './use-popup-menu-root.js'

function ExemptRoot(props: {
  exempt: boolean
  onRoot?: (root: ReturnType<typeof usePopupMenuRoot>) => void
}) {
  const hostRef = React.useRef<HTMLInputElement>(null)
  const root = usePopupMenuRoot({
    defaultOpen: true,
    getDismissExemptElements: () => (props.exempt ? [hostRef.current] : []),
  })
  const open = root.store.useState('open')
  props.onRoot?.(root)
  return (
    <>
      <input ref={hostRef} data-testid="host" />
      <button type="button" data-testid="elsewhere">
        Elsewhere
      </button>
      <PopupMenuProviders
        store={root.store}
        menuTreeResolver={root.menuTreeResolver}
        focusOwnerStore={root.focusOwnerStore}
        openChainStore={root.openChainStore}
        disabled={root.disabled}
        depth={0}
        closeAll={root.closeAll}
        registerSurface={root.registerSurface}
        menuType="dropdown"
        externalFocus
      >
        <Popover.Root
          open={open}
          modal={false}
          onOpenChange={(nextOpen, details) =>
            root.handleOpenChange(
              nextOpen,
              details.reason as Parameters<typeof root.handleOpenChange>[1],
              details.event,
            )
          }
        >
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup data-testid="popup">
                <DropdownMenu.Surface>
                  <DropdownMenu.List>
                    <DropdownMenu.Item>Apple</DropdownMenu.Item>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </Popover.Root>
      </PopupMenuProviders>
    </>
  )
}

describe('usePopupMenuRoot outside-press exemptions', () => {
  it('stays open when an exempt element is pressed', async () => {
    const user = userEvent.setup()
    render(<ExemptRoot exempt />)
    await screen.findByTestId('popup')

    await user.click(screen.getByTestId('host'))
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })

  it('still closes when something else outside is pressed', async () => {
    const user = userEvent.setup()
    render(<ExemptRoot exempt />)
    await screen.findByTestId('popup')

    await user.click(screen.getByTestId('elsewhere'))

    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
  })

  it('closes on a press on the element when it is not exempt', async () => {
    render(<ExemptRoot exempt={false} />)
    await screen.findByTestId('popup')

    fireEvent.pointerDown(screen.getByTestId('host'))

    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
  })

  describe('focus-out', () => {
    function focusOut(target: Element, relatedTarget: Element | null) {
      const event = new FocusEvent('focusout', { relatedTarget })
      Object.defineProperty(event, 'target', { value: target })
      return event
    }

    it('stays open when focus moves to an exempt element', async () => {
      let root!: ReturnType<typeof usePopupMenuRoot>
      render(<ExemptRoot exempt onRoot={(r) => (root = r)} />)
      const popup = await screen.findByTestId('popup')

      act(() => {
        root.handleOpenChange(
          false,
          'focus-out',
          focusOut(popup, screen.getByTestId('host')),
        )
      })

      expect(root.store.state.open).toBe(true)
    })

    it('closes when focus leaves an exempt element for somewhere else', async () => {
      let root!: ReturnType<typeof usePopupMenuRoot>
      render(<ExemptRoot exempt onRoot={(r) => (root = r)} />)
      await screen.findByTestId('popup')

      act(() => {
        root.handleOpenChange(
          false,
          'focus-out',
          focusOut(screen.getByTestId('host'), screen.getByTestId('elsewhere')),
        )
      })

      expect(root.store.state.open).toBe(false)
    })
  })
})
