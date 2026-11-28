import { Popover } from '@base-ui/react/popover'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type * as React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import {
  type MenuTreeTier,
  useMaybeMenuTreeTier,
} from './contexts/menu-tree-context.js'
import {
  type MenuSurfaceTier,
  useMaybeMenuSurfaceTier,
} from './contexts/surface-tier-context.js'
import {
  FocusOwnerStore,
  PopupMenuItem,
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

/**
 * The aim guard and the checkbox selection are made only where a menu uses
 * them: by the tree's first submenu trigger, and by a surface's first
 * checkbox row.
 */

const seen: { tree: MenuTreeTier | null; surface: MenuSurfaceTier | null } = {
  tree: null,
  surface: null,
}

/** Records the tiers the rows around it read. */
function TierProbe() {
  seen.tree = useMaybeMenuTreeTier()
  seen.surface = useMaybeMenuSurfaceTier()
  return null
}

function Menu({
  children,
  getAriaSelectionText,
}: {
  children: React.ReactNode
  getAriaSelectionText?: (count: number, checked: boolean) => string
}) {
  return (
    <DropdownMenu.Root defaultOpen getAriaSelectionText={getAriaSelectionText}>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                <TierProbe />
                {children}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

afterEach(() => {
  cleanup()
  seen.tree = null
  seen.surface = null
})

describe('the aim guard', () => {
  it('isn’t made for a tree with no submenu trigger', async () => {
    render(
      <Menu>
        <DropdownMenu.Item data-testid="a">A</DropdownMenu.Item>
        <DropdownMenu.Item data-testid="b">B</DropdownMenu.Item>
      </Menu>,
    )
    await act(async () => {})
    // Rows read the guard as they take the pointer.
    fireEvent.pointerMove(screen.getByTestId('b'), { clientX: 5, clientY: 5 })
    expect(screen.getByTestId('b')).toHaveAttribute('data-highlighted')
    expect(seen.tree).not.toBeNull()
    expect(seen.tree?.aimGuard).toBeNull()
  })

  it('is made once, by the tree’s first submenu trigger', async () => {
    function Tree({ second }: { second: boolean }) {
      return (
        <Menu>
          <DropdownMenu.Item>A</DropdownMenu.Item>
          <DropdownMenu.Submenu>
            <DropdownMenu.SubmenuTrigger>More</DropdownMenu.SubmenuTrigger>
          </DropdownMenu.Submenu>
          {second && (
            <DropdownMenu.Submenu>
              <DropdownMenu.SubmenuTrigger>Other</DropdownMenu.SubmenuTrigger>
            </DropdownMenu.Submenu>
          )}
        </Menu>
      )
    }
    const { rerender } = render(<Tree second={false} />)
    await act(async () => {})
    const guard = seen.tree?.aimGuard
    expect(guard).toBeTruthy()
    rerender(<Tree second />)
    await act(async () => {})
    expect(seen.tree?.aimGuard).toBe(guard)
  })
})

describe('the aim guard of a root whose tree tier is made again', () => {
  // A root that supplies its own focus owner gets a new tree, and a new tree
  // tier, whenever it supplies another.
  function CustomRoot({ focusOwner }: { focusOwner: FocusOwnerStore }) {
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
        componentName="dropdown-menu"
      >
        <Popover.Root
          open={open}
          onOpenChange={(next, details) =>
            root.handleOpenChange(next, details.reason, details.event)
          }
        >
          <PopupMenuPortal>
            <PopupMenuPositioner>
              <PopupMenuPopup>
                <PopupMenuSurface>
                  <PopupMenuList>
                    <TierProbe />
                    <PopupMenuItem data-testid="a">A</PopupMenuItem>
                    <PopupMenuSubmenuRoot>
                      <PopupMenuSubmenuTrigger>More</PopupMenuSubmenuTrigger>
                    </PopupMenuSubmenuRoot>
                    <PopupMenuItem data-testid="b">B</PopupMenuItem>
                  </PopupMenuList>
                </PopupMenuSurface>
              </PopupMenuPopup>
            </PopupMenuPositioner>
          </PopupMenuPortal>
        </Popover.Root>
      </PopupMenuProviders>
    )
  }

  it('is the one its mounted triggers hold, so rows still wait while it’s held', async () => {
    const { rerender } = render(
      <CustomRoot focusOwner={new FocusOwnerStore()} />,
    )
    await act(async () => {})
    const firstTier = seen.tree
    const guard = firstTier?.aimGuard
    expect(guard).toBeTruthy()

    rerender(<CustomRoot focusOwner={new FocusOwnerStore()} />)
    await act(async () => {})
    expect(seen.tree).not.toBe(firstTier)
    expect(seen.tree?.aimGuard).toBe(guard)

    // The pointer heads for the submenu: the trigger's guard holds rows at
    // its depth, so the row it crosses doesn't take the highlight.
    const aim = guard!.trigger({
      triggerId: 'more',
      depth: 0,
      submenuSurfaceId: 'more-surface',
      getPopupRect: () => null,
      getTriggerRect: () => null,
    })
    act(() => aim.hold(1000))
    fireEvent.pointerMove(screen.getByTestId('b'), { clientX: 5, clientY: 5 })
    expect(screen.getByTestId('b')).not.toHaveAttribute('data-highlighted')

    // Released, the row takes it.
    act(() => aim.releaseOwn())
    fireEvent.pointerMove(screen.getByTestId('b'), { clientX: 6, clientY: 6 })
    expect(screen.getByTestId('b')).toHaveAttribute('data-highlighted')
  })
})

describe('the checkbox selection', () => {
  it('isn’t made for a surface with no checkbox row', async () => {
    render(
      <Menu>
        <DropdownMenu.Item data-testid="a">A</DropdownMenu.Item>
        <DropdownMenu.RadioGroup defaultValue="x">
          <DropdownMenu.RadioItem value="x">X</DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
      </Menu>,
    )
    await act(async () => {})
    act(() => {
      fireEvent.keyDown(screen.getByRole('listbox'), {
        key: 'ArrowDown',
        shiftKey: true,
      })
    })
    expect(seen.surface).not.toBeNull()
    expect(seen.surface?.selection.state.current).toBeNull()
  })

  it('is made by the first checkbox row, once', async () => {
    render(
      <Menu>
        <DropdownMenu.CheckboxItem value="a">A</DropdownMenu.CheckboxItem>
        <DropdownMenu.CheckboxItem value="b">B</DropdownMenu.CheckboxItem>
      </Menu>,
    )
    await act(async () => {})
    const selection = seen.surface?.selection.state.current
    expect(selection).toBeTruthy()
    act(() => {
      fireEvent.click(screen.getByText('A'))
    })
    expect(seen.surface?.selection.state.current).toBe(selection)
  })

  it('is tied to its Surface when a checkbox row appears after the Surface mounted', async () => {
    function Tree({ rows }: { rows: boolean }) {
      return (
        <Menu getAriaSelectionText={(count) => `${count} picked`}>
          <DropdownMenu.Item>Plain</DropdownMenu.Item>
          {rows &&
            ['A', 'B', 'C'].map((label) => (
              <DropdownMenu.CheckboxItem
                key={label}
                value={label}
                data-testid={label}
              >
                {label}
              </DropdownMenu.CheckboxItem>
            ))}
        </Menu>
      )
    }
    const { rerender } = render(<Tree rows={false} />)
    await act(async () => {})
    expect(seen.surface?.selection.state.current).toBeNull()
    rerender(<Tree rows />)
    await act(async () => {})
    act(() => {
      fireEvent.click(screen.getByTestId('A'))
    })
    act(() => {
      fireEvent.click(screen.getByTestId('C'), { shiftKey: true })
    })
    for (const label of ['A', 'B', 'C']) {
      expect(screen.getByTestId(label)).toHaveAttribute('aria-checked', 'true')
    }
    // The Surface's announcement text reached the selection made later.
    expect(screen.getByRole('status')).toHaveTextContent('2 picked')
  })

  it('isn’t made by disabled checkbox rows, hovered, pressed and clicked', async () => {
    render(
      <Menu>
        <DropdownMenu.CheckboxItem value="a" disabled data-testid="a">
          A
        </DropdownMenu.CheckboxItem>
        <DropdownMenu.CheckboxGroup defaultValue={[]}>
          <DropdownMenu.CheckboxItem value="b" disabled data-testid="b">
            B
          </DropdownMenu.CheckboxItem>
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await act(async () => {})
    for (const id of ['a', 'b']) {
      const row = screen.getByTestId(id)
      fireEvent.pointerMove(row, {
        pointerType: 'mouse',
        clientX: 5,
        clientY: 5,
      })
      fireEvent.pointerDown(row, { pointerType: 'mouse', button: 0 })
      fireEvent.pointerUp(row, { pointerType: 'mouse', button: 0 })
      fireEvent.click(row)
      fireEvent.click(row, { shiftKey: true })
    }
    await act(async () => {})
    expect(seen.surface).not.toBeNull()
    expect(seen.surface?.selection.state.current).toBeNull()
  })

  it('doesn’t announce a range again when its surface comes back from a subpage', async () => {
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  {['a', 'b'].map((label) => (
                    <DropdownMenu.CheckboxItem
                      key={label}
                      value={label}
                      data-testid={label}
                    >
                      {label}
                    </DropdownMenu.CheckboxItem>
                  ))}
                  <DropdownMenu.SubpageTrigger
                    targetPageId="page"
                    data-testid="to-page"
                  >
                    Page
                  </DropdownMenu.SubpageTrigger>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
              <DropdownMenu.Subpage pageId="page">
                <DropdownMenu.Surface>
                  <DropdownMenu.List>
                    <DropdownMenu.SubpageBackItem data-testid="back">
                      Back
                    </DropdownMenu.SubpageBackItem>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Subpage>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    await act(async () => {})
    act(() => {
      fireEvent.click(screen.getByTestId('a'))
    })
    act(() => {
      fireEvent.click(screen.getByTestId('b'), { shiftKey: true })
    })
    expect(screen.getByRole('status')).toHaveTextContent('1 item checked')

    act(() => {
      fireEvent.click(screen.getByTestId('to-page'))
    })
    await act(async () => {})
    expect(screen.queryByTestId('a')).toBeNull()
    act(() => {
      fireEvent.click(screen.getByTestId('back'))
    })
    await act(async () => {})
    expect(screen.getByTestId('a')).toBeInTheDocument()
    expect(screen.getByRole('status')).not.toHaveTextContent('checked')
  })
})
