import { Popover } from '@base-ui/react/popover'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import { Select } from '../../select/index.js'
import { useMenuTree } from './contexts/menu-tree-context.js'
import {
  FocusOwnerStore,
  PopupMenuItem,
  PopupMenuList,
  PopupMenuPopup,
  PopupMenuPortal,
  PopupMenuPositioner,
  PopupMenuProviders,
  PopupMenuSurface,
  useFocusOwner,
  useOpenChain,
  usePopupMenuRoot,
} from './index.js'
import type { MenuTreeStore } from './store/MenuTreeStore.js'

// The menu tree's store keeps the root's open state, and owns the open chain
// and focus owner the root publishes (`useOpenChain`, `useFocusOwner`).

type Stores = {
  tree: MenuTreeStore
  openChain: ReturnType<typeof useOpenChain>
  focusOwner: ReturnType<typeof useFocusOwner>
}

function Probe({ stores }: { stores: Partial<Stores> }) {
  stores.tree = useMenuTree()
  stores.openChain = useOpenChain()
  stores.focusOwner = useFocusOwner()
  return null
}

function Menu(props: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: DropdownMenu.Root.Props['onOpenChange']
  stores?: Partial<Stores>
}) {
  return (
    <DropdownMenu.Root
      open={props.open}
      defaultOpen={props.defaultOpen}
      onOpenChange={props.onOpenChange}
    >
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      {props.stores && <Probe stores={props.stores} />}
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup">
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                <DropdownMenu.Item>Item</DropdownMenu.Item>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger>
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
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function openChangeCalls(spy: ReturnType<typeof vi.fn>) {
  return spy.mock.calls.map(([open, details]) => [open, details.reason])
}

describe('the root open state', () => {
  it('stays closed while controlled, whoever asks the tree to open it', async () => {
    const onOpenChange = vi.fn()
    const stores: Partial<Stores> = {}
    render(<Menu open={false} onOpenChange={onOpenChange} stores={stores} />)

    await userEvent.click(screen.getByText('Open'))
    act(() => stores.tree?.setOpen(true, 'trigger-press'))

    expect(openChangeCalls(onOpenChange)).toEqual([
      [true, 'trigger-press'],
      [true, 'trigger-press'],
    ])
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('stays open while controlled', async () => {
    const onOpenChange = vi.fn()
    const stores: Partial<Stores> = {}
    render(<Menu open onOpenChange={onOpenChange} stores={stores} />)

    act(() => stores.tree?.setOpen(false, 'escape-key'))
    await userEvent.keyboard('{Escape}')

    expect(openChangeCalls(onOpenChange)).toEqual([
      [false, 'escape-key'],
      [false, 'escape-key'],
    ])
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })

  it('opens and closes through the tree when uncontrolled', async () => {
    const onOpenChange = vi.fn()
    const stores: Partial<Stores> = {}
    render(<Menu onOpenChange={onOpenChange} stores={stores} />)

    act(() => stores.tree?.setOpen(true, 'trigger-press'))
    expect(screen.getByTestId('popup')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByTestId('popup')).toBeNull())
    expect(openChangeCalls(onOpenChange)).toEqual([
      [true, 'trigger-press'],
      [false, 'escape-key'],
    ])
  })

  it('follows the controlled prop', () => {
    const { rerender } = render(<Menu open={false} />)
    expect(screen.queryByTestId('popup')).toBeNull()
    rerender(<Menu open />)
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })

  it('records how it was opened', async () => {
    // A Select aligns its selected item with the trigger, except when opened by touch.
    const rect = (left: number, top: number, width: number, height: number) =>
      DOMRect.fromRect({ x: left, y: top, width, height })
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        switch (this.getAttribute('data-testid')) {
          case 'trigger':
            return rect(100, 100, 220, 32)
          case 'value':
            return rect(116, 106, 120, 20)
          case 'item-label':
            return rect(116, 150, 80, 20)
          default:
            return rect(100, 132, 220, 160)
        }
      })
    const viewportSpies = [
      vi
        .spyOn(document.documentElement, 'clientHeight', 'get')
        .mockReturnValue(768),
      vi
        .spyOn(document.documentElement, 'clientWidth', 'get')
        .mockReturnValue(1024),
    ]
    const user = userEvent.setup()
    try {
      render(
        <Select.Root>
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" placeholder="Select..." />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner data-testid="positioner" alignItemWithTrigger>
              <Select.Popup>
                <Select.Surface>
                  <Select.List>
                    <Select.Item value="apple">
                      <Select.ItemLabel data-testid="item-label">
                        Apple
                      </Select.ItemLabel>
                    </Select.Item>
                  </Select.List>
                </Select.Surface>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      )
      const trigger = screen.getByTestId('trigger')

      await user.click(trigger)
      await waitFor(() =>
        expect(screen.getByTestId('positioner')).toHaveAttribute(
          'data-side',
          'none',
        ),
      )
      await user.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByTestId('positioner')).toBeNull())

      await user.pointer({ keys: '[TouchA]', target: trigger })
      const positioner = await screen.findByTestId('positioner')
      expect(positioner).not.toHaveAttribute('data-side', 'none')
    } finally {
      rectSpy.mockRestore()
      for (const spy of viewportSpies) spy.mockRestore()
    }
  })

  it('stays closed when onOpenChange cancels the change', async () => {
    const onOpenChange = vi.fn((_open: boolean, details) => details.cancel())
    render(<Menu onOpenChange={onOpenChange} />)

    await userEvent.click(screen.getByText('Open'))

    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('popup')).toBeNull()
  })
})

describe('the open chain and focus owner', () => {
  it('follow a submenu opening and closing', async () => {
    render(<Menu defaultOpen />)
    const popup = screen.getByTestId('popup')
    await waitFor(() => expect(popup).toHaveAttribute('data-focused'))

    await userEvent.keyboard('{ArrowDown}{ArrowRight}')
    const submenu = await screen.findByTestId('submenu-popup')
    await waitFor(() => expect(submenu).toHaveAttribute('data-focused'))
    expect(popup).toHaveAttribute('data-has-open-submenu')
    expect(popup).not.toHaveAttribute('data-focused')

    await userEvent.keyboard('{ArrowLeft}')
    await waitFor(() => expect(popup).toHaveAttribute('data-focused'))
    expect(popup).not.toHaveAttribute('data-has-open-submenu')
  })

  it('take writes made through the published stores', async () => {
    const stores: Partial<Stores> = {}
    render(<Menu defaultOpen stores={stores} />)
    const popup = screen.getByTestId('popup')
    await waitFor(() => expect(popup).toHaveAttribute('data-focused'))

    act(() => stores.openChain?.set('chain', ['outside']))
    expect(popup).toHaveAttribute('data-has-open-submenu')
    act(() => stores.openChain?.clear())
    expect(popup).not.toHaveAttribute('data-has-open-submenu')

    act(() => stores.focusOwner?.setOwnerId(null))
    expect(popup).not.toHaveAttribute('data-focused')
  })

  it('empty the open chain when the menu closes', async () => {
    const stores: Partial<Stores> = {}
    render(<Menu defaultOpen stores={stores} />)
    act(() => stores.openChain?.set('chain', ['outside']))

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByTestId('popup')).toBeNull())
    await userEvent.click(screen.getByText('Open'))

    expect(await screen.findByTestId('popup')).not.toHaveAttribute(
      'data-has-open-submenu',
    )
  })
})

describe('stores a root supplies to PopupMenuProviders', () => {
  function CustomRoot(props: {
    focusOwner: FocusOwnerStore
    children: React.ReactNode
  }) {
    const root = usePopupMenuRoot({ defaultOpen: true })
    const open = root.store.useState('open')
    return (
      <PopupMenuProviders
        menuTreeResolver={root.menuTreeResolver}
        store={root.store}
        focusOwnerStore={props.focusOwner}
        openChainStore={root.openChainStore}
        disabled={root.disabled}
        depth={0}
        closeAll={root.closeAll}
        registerSurface={root.registerSurface}
        virtualization={root.virtualization}
        componentName="dropdown-menu"
      >
        <Popover.Root
          open={open}
          onOpenChange={(next, details) =>
            root.handleOpenChange(next, details.reason, details.event)
          }
        >
          {props.children}
        </Popover.Root>
      </PopupMenuProviders>
    )
  }

  it('drive the engine', async () => {
    const focusOwner = new FocusOwnerStore()
    render(
      <CustomRoot focusOwner={focusOwner}>
        <PopupMenuPortal>
          <PopupMenuPositioner>
            <PopupMenuPopup data-testid="popup">
              <PopupMenuSurface>
                <PopupMenuList>
                  <PopupMenuItem>Item</PopupMenuItem>
                </PopupMenuList>
              </PopupMenuSurface>
            </PopupMenuPopup>
          </PopupMenuPositioner>
        </PopupMenuPortal>
      </CustomRoot>,
    )
    const popup = screen.getByTestId('popup')

    // The root surface took focus ownership in the supplied store.
    await waitFor(() => expect(popup).toHaveAttribute('data-focused'))
    expect(focusOwner.state.ownerId).not.toBeNull()

    act(() => focusOwner.setOwnerId(null))
    expect(popup).not.toHaveAttribute('data-focused')
  })
})
