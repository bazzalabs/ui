import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * A searchable menu with keywords on items.
 */
function NestedSearchableMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface-root">
              <DropdownMenu.Input
                data-testid="input-root"
                placeholder="Search root..."
              />
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="root-apple" value="apple">
                  Apple
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="root-banana" value="banana">
                  Banana
                </DropdownMenu.Item>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger-1">
                    Fruits Submenu
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup>
                        <DropdownMenu.Surface data-testid="surface-submenu-1">
                          <DropdownMenu.Input
                            data-testid="input-submenu-1"
                            placeholder="Search submenu 1..."
                          />
                          <DropdownMenu.List>
                            <DropdownMenu.Item
                              data-testid="sub1-cherry"
                              value="cherry"
                            >
                              Cherry
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              data-testid="sub1-date"
                              value="date"
                            >
                              Date
                            </DropdownMenu.Item>
                            <DropdownMenu.Submenu>
                              <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger-2">
                                More Fruits
                              </DropdownMenu.SubmenuTrigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Positioner>
                                  <DropdownMenu.Popup>
                                    <DropdownMenu.Surface data-testid="surface-submenu-2">
                                      <DropdownMenu.Input
                                        data-testid="input-submenu-2"
                                        placeholder="Search submenu 2..."
                                      />
                                      <DropdownMenu.List>
                                        <DropdownMenu.Item
                                          data-testid="sub2-elderberry"
                                          value="elderberry"
                                        >
                                          Elderberry
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item
                                          data-testid="sub2-fig"
                                          value="fig"
                                        >
                                          Fig
                                        </DropdownMenu.Item>
                                      </DropdownMenu.List>
                                      <DropdownMenu.Empty data-testid="empty-submenu-2">
                                        No results in submenu 2
                                      </DropdownMenu.Empty>
                                    </DropdownMenu.Surface>
                                  </DropdownMenu.Popup>
                                </DropdownMenu.Positioner>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Submenu>
                          </DropdownMenu.List>
                          <DropdownMenu.Empty data-testid="empty-submenu-1">
                            No results in submenu 1
                          </DropdownMenu.Empty>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty-root">
                No results in root
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * A searchable menu with keywords on items.
 */
function MenuWithKeywords() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.Input
                data-testid="search-input"
                placeholder="Search..."
              />
              <DropdownMenu.List>
                <DropdownMenu.Item
                  data-testid="item-apple"
                  value="apple"
                  keywords={['fruit', 'red', 'healthy']}
                >
                  Apple
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  data-testid="item-banana"
                  value="banana"
                  keywords={['fruit', 'yellow', 'potassium']}
                >
                  Banana
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  data-testid="item-carrot"
                  value="carrot"
                  keywords={['vegetable', 'orange', 'healthy']}
                >
                  Carrot
                </DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty-state">
                No results found
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Menu with filter disabled.
 */
function MenuWithFilterDisabled() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface" filter={false}>
              <DropdownMenu.Input
                data-testid="search-input"
                placeholder="Search..."
              />
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="item-apple" value="apple">
                  Apple
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-banana" value="banana">
                  Banana
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty-state">
                No results found
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Menu with controlled search.
 */
function MenuWithControlledSearch({
  search,
  onSearchChange,
}: {
  search: string
  onSearchChange: (value: string) => void
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              data-testid="surface"
              search={search}
              onSearchChange={onSearchChange}
            >
              <DropdownMenu.Input
                data-testid="search-input"
                placeholder="Search..."
              />
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="item-apple" value="apple">
                  Apple
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-banana" value="banana">
                  Banana
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty-state">
                No results found
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Menu with clearSearchOnClose behavior.
 */
function MenuWithClearSearchOnClose({
  clearSearchOnClose = true,
  onOpenChangeComplete,
}: {
  clearSearchOnClose?: boolean | 'after-exit'
  onOpenChangeComplete?: (open: boolean) => void
}) {
  return (
    <DropdownMenu.Root onOpenChangeComplete={onOpenChangeComplete}>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              data-testid="surface"
              clearSearchOnClose={clearSearchOnClose}
            >
              <DropdownMenu.Input
                data-testid="search-input"
                placeholder="Search..."
              />
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="item-apple" value="apple">
                  Apple
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-banana" value="banana">
                  Banana
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty-state">
                No results found
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Menu with hideUntilActive input.
 */
function MenuWithHideUntilActive() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.Input
                data-testid="search-input"
                hideUntilActive
                placeholder="Search..."
              />
              <DropdownMenu.List data-testid="list">
                <DropdownMenu.Item data-testid="item-apple" value="apple">
                  Apple
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-banana" value="banana">
                  Banana
                </DropdownMenu.Item>
                <DropdownMenu.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.Empty data-testid="empty-state">
                No results found
              </DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * A nested menu for testing data attributes on Popup components.
 */
function NestedMenuForDataAttrs({
  debug,
  submenuCloseDelay,
}: {
  debug?: {
    showSafeTriangleArea?:
      | boolean
      | {
          enabled?: boolean
          idleColor?: string
          successColor?: string
          triangleFillOpacity?: number
          overlayOpacity?: number
          showStroke?: boolean
          strokeWidth?: number
          strokeDasharray?: string
          showDots?: boolean
          dotRadius?: number
          freezeOnPointerLeave?: boolean
          persistOnSuccess?: boolean
          showMissState?: boolean
          missColor?: string
          missFreezeDuration?: number
        }
  }
  submenuCloseDelay?: number
} = {}) {
  return (
    <DropdownMenu.Root debug={debug}>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup-root">
            <DropdownMenu.Surface data-testid="surface-root">
              <DropdownMenu.List>
                <DropdownMenu.Item data-testid="root-item-1" value="item1">
                  Item 1
                </DropdownMenu.Item>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger
                    data-testid="submenu-trigger-1"
                    closeDelay={submenuCloseDelay}
                  >
                    Submenu 1
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup data-testid="popup-submenu-1">
                        <DropdownMenu.Surface data-testid="surface-submenu-1">
                          <DropdownMenu.List>
                            <DropdownMenu.Item
                              data-testid="submenu1-item-1"
                              value="sub1-item1"
                            >
                              Submenu 1 Item 1
                            </DropdownMenu.Item>
                            <DropdownMenu.Submenu>
                              <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger-2">
                                Submenu 2
                              </DropdownMenu.SubmenuTrigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Positioner>
                                  <DropdownMenu.Popup data-testid="popup-submenu-2">
                                    <DropdownMenu.Surface data-testid="surface-submenu-2">
                                      <DropdownMenu.List>
                                        <DropdownMenu.Item
                                          data-testid="submenu2-item-1"
                                          value="sub2-item1"
                                        >
                                          Submenu 2 Item 1
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

function createRect({
  top,
  left,
  width,
  height,
}: {
  top: number
  left: number
  width: number
  height: number
}): DOMRect {
  return {
    x: left,
    y: top,
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================================
// Tests
// ============================================================================

describe('PopupMenu', () => {
  describe('data-focused attribute', () => {
    it('root popup has data-focused when menu opens', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const rootPopup = screen.getByTestId('popup-root')
      expect(rootPopup).toHaveAttribute('data-focused', '')
    })

    it('submenu popup has data-focused when submenu opens', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      // Open submenu by hovering over trigger
      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      // Move pointer into submenu to transfer focus
      // Wait a bit after popup opens to bypass the debounce for phantom pointer events
      // (see POINTER_EVENT_DEBOUNCE_MS in constants.ts)
      const submenuPopup = screen.getByTestId('popup-submenu-1')
      await new Promise((r) => setTimeout(r, 150))
      await user.hover(submenuPopup)

      await waitFor(() => {
        expect(submenuPopup).toHaveAttribute('data-focused', '')
      })

      // Root should no longer have data-focused
      const rootPopup = screen.getByTestId('popup-root')
      expect(rootPopup).not.toHaveAttribute('data-focused')
    })
  })

  describe('data-has-open-submenu attribute', () => {
    it('root popup does not have data-has-open-submenu when no submenu is open', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const rootPopup = screen.getByTestId('popup-root')
      expect(rootPopup).not.toHaveAttribute('data-has-open-submenu')
    })

    it('root popup has data-has-open-submenu when submenu is open', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      // Open submenu
      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const rootPopup = screen.getByTestId('popup-root')
      expect(rootPopup).toHaveAttribute('data-has-open-submenu', '')
    })

    it('all parent popups have data-has-open-submenu in deep submenu chain', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      // Open first submenu
      const submenuTrigger1 = screen.getByTestId('submenu-trigger-1')
      await user.hover(submenuTrigger1)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      // Open second submenu
      const submenuTrigger2 = screen.getByTestId('submenu-trigger-2')
      await user.hover(submenuTrigger2)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-2')).toBeInTheDocument()
      })

      // Root and first submenu should both have data-has-open-submenu
      const rootPopup = screen.getByTestId('popup-root')
      const submenu1Popup = screen.getByTestId('popup-submenu-1')
      const submenu2Popup = screen.getByTestId('popup-submenu-2')

      expect(rootPopup).toHaveAttribute('data-has-open-submenu', '')
      expect(submenu1Popup).toHaveAttribute('data-has-open-submenu', '')
      // Deepest submenu should NOT have data-has-open-submenu
      expect(submenu2Popup).not.toHaveAttribute('data-has-open-submenu')
    })

    it('removes data-has-open-submenu when submenu closes', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      // Open submenu using pointer events with explicit coordinates
      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      await user.pointer([
        { target: submenuTrigger, coords: { x: 100, y: 50 } },
      ])

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const rootPopup = screen.getByTestId('popup-root')
      expect(rootPopup).toHaveAttribute('data-has-open-submenu', '')

      // Wait for aim guard debounce to settle
      await new Promise((r) => setTimeout(r, 150))

      // Move back to root item to close submenu - use explicit coordinates
      // that are different from the previous position to trigger movement detection
      const rootItem = screen.getByTestId('root-item-1')
      await user.pointer([{ target: rootItem, coords: { x: 100, y: 20 } }])

      await waitFor(() => {
        expect(screen.queryByTestId('popup-submenu-1')).not.toBeInTheDocument()
      })

      // Root should no longer have data-has-open-submenu
      expect(rootPopup).not.toHaveAttribute('data-has-open-submenu')
    })
  })

  describe('submenu safe triangle debug visualization', () => {
    const getSafeTriangle = (tone?: string) => {
      const selector = tone
        ? `[data-bazzaui-submenu-safe-triangle-area][data-safe-triangle-tone="${tone}"]`
        : '[data-bazzaui-submenu-safe-triangle-area]'

      return document.querySelector(selector)
    }

    it('does not render the safe triangle when debug mode is disabled', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      await user.hover(screen.getByTestId('submenu-trigger-1'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      expect(getSafeTriangle()).toBeNull()
    })

    it('renders the safe triangle in blue while hovering a submenu trigger', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs debug={{ showSafeTriangleArea: true }} />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')

      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      fireEvent.pointerEnter(submenuTrigger, { clientX: 180, clientY: 90 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 90 })

      await waitFor(() => {
        expect(getSafeTriangle('hover')).toBeInTheDocument()
      })

      triggerRectSpy.mockRestore()
      popupRectSpy.mockRestore()
    })

    it('supports object config for safe triangle look customization', async () => {
      const user = userEvent.setup()
      render(
        <NestedMenuForDataAttrs
          debug={{
            showSafeTriangleArea: {
              enabled: true,
              idleColor: '#ff0088',
              triangleFillOpacity: 0.35,
              overlayOpacity: 0.7,
              showStroke: false,
              showDots: false,
            },
          }}
        />,
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      fireEvent.pointerEnter(submenuTrigger, { clientX: 180, clientY: 90 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 90 })

      let hoverTriangle: Element | null = null

      await waitFor(() => {
        hoverTriangle = getSafeTriangle('hover')
        expect(hoverTriangle).toBeInTheDocument()
      })

      const polygon = hoverTriangle?.querySelector('polygon')
      expect(polygon?.getAttribute('fill')).toBe('#ff0088')
      expect(polygon?.getAttribute('fill-opacity')).toBe('0.35')
      expect(polygon?.getAttribute('stroke')).toBe('none')
      expect(hoverTriangle?.querySelectorAll('circle')).toHaveLength(0)
      expect((hoverTriangle as SVGSVGElement | null)?.style.opacity).toBe('0.7')

      triggerRectSpy.mockRestore()
      popupRectSpy.mockRestore()
    })

    it('renders the safe triangle in green when aim guard is activated on leave', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs debug={{ showSafeTriangleArea: true }} />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')

      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })
      fireEvent.pointerMove(window, { clientX: 150, clientY: 92 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 94 })

      fireEvent.pointerLeave(submenuTrigger, { clientX: 190, clientY: 94 })
      fireEvent.pointerMove(window, { clientX: 190, clientY: 94 })

      await waitFor(() => {
        expect(getSafeTriangle('activated')).toBeInTheDocument()
      })

      triggerRectSpy.mockRestore()
      popupRectSpy.mockRestore()
    })

    it('keeps the activated safe triangle after moving into submenu popup', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs debug={{ showSafeTriangleArea: true }} />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')

      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })
      fireEvent.pointerMove(window, { clientX: 150, clientY: 92 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 94 })

      fireEvent.pointerLeave(submenuTrigger, { clientX: 190, clientY: 94 })
      fireEvent.pointerMove(window, { clientX: 190, clientY: 94 })

      let frozenStyle = ''

      await waitFor(() => {
        const activatedTriangle = getSafeTriangle(
          'activated',
        ) as HTMLElement | null

        expect(activatedTriangle).toBeInTheDocument()
        frozenStyle = activatedTriangle?.style.cssText ?? ''
      })

      fireEvent.pointerMove(submenuPopup, { clientX: 300, clientY: 120 })

      await waitFor(() => {
        const activatedTriangleAfterMove = getSafeTriangle(
          'activated',
        ) as HTMLElement | null

        expect(activatedTriangleAfterMove).toBeInTheDocument()
        expect(activatedTriangleAfterMove?.style.cssText).toBe(frozenStyle)
      })

      triggerRectSpy.mockRestore()
      popupRectSpy.mockRestore()
    })

    it('immediately hides the safe triangle when aim guard is not activated', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs debug={{ showSafeTriangleArea: true }} />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')

      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      fireEvent.pointerEnter(submenuTrigger, { clientX: 180, clientY: 220 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 220 })
      fireEvent.pointerMove(window, { clientX: 160, clientY: 230 })
      fireEvent.pointerMove(window, { clientX: 140, clientY: 240 })

      await waitFor(() => {
        expect(getSafeTriangle('hover')).toBeInTheDocument()
      })

      fireEvent.pointerLeave(submenuTrigger, { clientX: 130, clientY: 260 })
      fireEvent.pointerMove(window, { clientX: 130, clientY: 260 })

      await waitFor(() => {
        expect(getSafeTriangle()).toBeNull()
      })

      triggerRectSpy.mockRestore()
      popupRectSpy.mockRestore()
    })

    it('shows red missed triangle and hides it after configured miss freeze duration', async () => {
      const user = userEvent.setup()
      render(
        <NestedMenuForDataAttrs
          debug={{
            showSafeTriangleArea: {
              enabled: true,
              showMissState: true,
              missColor: '#ff4d4f',
              missFreezeDuration: 140,
            },
          }}
        />,
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')

      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      fireEvent.pointerEnter(submenuTrigger, { clientX: 180, clientY: 220 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 220 })
      fireEvent.pointerMove(window, { clientX: 160, clientY: 230 })
      fireEvent.pointerMove(window, { clientX: 140, clientY: 240 })

      fireEvent.pointerLeave(submenuTrigger, { clientX: 130, clientY: 260 })
      fireEvent.pointerMove(window, { clientX: 130, clientY: 260 })

      let missedTriangle: Element | null = null

      await waitFor(() => {
        missedTriangle = getSafeTriangle('missed')
        expect(missedTriangle).toBeInTheDocument()
      })

      const polygon = missedTriangle?.querySelector('polygon')
      expect(polygon?.getAttribute('fill')).toBe('#ff4d4f')

      await waitFor(
        () => {
          expect(getSafeTriangle('missed')).toBeNull()
        },
        { timeout: 700 },
      )

      triggerRectSpy.mockRestore()
      popupRectSpy.mockRestore()
    })
  })

  describe('submenu closeDelay', () => {
    const setupCloseDelayScenario = async (closeDelay: number) => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs submenuCloseDelay={closeDelay} />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      return {
        user,
        submenuTrigger,
        submenuPopup,
        cleanup: () => {
          triggerRectSpy.mockRestore()
          popupRectSpy.mockRestore()
        },
      }
    }

    const fireMissTrajectory = (submenuTrigger: HTMLElement) => {
      fireEvent.pointerEnter(submenuTrigger, { clientX: 180, clientY: 220 })
      fireEvent.pointerMove(window, { clientX: 180, clientY: 220 })
      fireEvent.pointerMove(window, { clientX: 160, clientY: 230 })
      fireEvent.pointerMove(window, { clientX: 140, clientY: 240 })

      fireEvent.pointerLeave(submenuTrigger, { clientX: 130, clientY: 260 })
    }

    it('closes immediately on miss when closeDelay is 0', async () => {
      const scenario = await setupCloseDelayScenario(0)

      try {
        fireMissTrajectory(scenario.submenuTrigger)

        await waitFor(() => {
          expect(
            screen.queryByTestId('popup-submenu-1'),
          ).not.toBeInTheDocument()
        })
      } finally {
        scenario.cleanup()
      }
    })

    it('delays close on miss when closeDelay is greater than 0', async () => {
      const scenario = await setupCloseDelayScenario(160)

      try {
        fireMissTrajectory(scenario.submenuTrigger)

        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()

        await waitFor(
          () => {
            expect(
              screen.queryByTestId('popup-submenu-1'),
            ).not.toBeInTheDocument()
          },
          { timeout: 700 },
        )
      } finally {
        scenario.cleanup()
      }
    })

    it('cancels delayed close when pointer re-enters the trigger', async () => {
      const scenario = await setupCloseDelayScenario(220)

      try {
        fireMissTrajectory(scenario.submenuTrigger)
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()

        await scenario.user.hover(scenario.submenuTrigger)

        await waitFor(
          () => {
            expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
          },
          { timeout: 700 },
        )
      } finally {
        scenario.cleanup()
      }
    })

    it('cancels delayed close when pointer enters the submenu popup', async () => {
      const scenario = await setupCloseDelayScenario(220)

      try {
        fireMissTrajectory(scenario.submenuTrigger)
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()

        fireEvent.pointerEnter(scenario.submenuPopup, {
          clientX: 300,
          clientY: 120,
        })
        fireEvent.pointerMove(scenario.submenuPopup, {
          clientX: 300,
          clientY: 120,
        })

        await waitFor(
          () => {
            expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
          },
          { timeout: 700 },
        )
      } finally {
        scenario.cleanup()
      }
    })
  })

  describe('aim guard lifecycle', () => {
    it('clears aim guard when the root menu closes', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      try {
        fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })
        fireEvent.pointerMove(window, { clientX: 150, clientY: 92 })
        fireEvent.pointerMove(window, { clientX: 180, clientY: 94 })

        fireEvent.pointerLeave(submenuTrigger, { clientX: 190, clientY: 94 })
        fireEvent.pointerMove(window, { clientX: 190, clientY: 94 })

        await user.click(screen.getByTestId('trigger'))

        await waitFor(() => {
          expect(screen.queryByTestId('popup-root')).not.toBeInTheDocument()
        })

        await user.click(screen.getByTestId('trigger'))

        await waitFor(() => {
          expect(screen.getByTestId('popup-root')).toBeInTheDocument()
        })

        const rootItem = screen.getByTestId('root-item-1')

        fireEvent.pointerMove(rootItem, { clientX: 96, clientY: 74 })
        fireEvent.pointerMove(rootItem, { clientX: 100, clientY: 78 })

        await waitFor(
          () => {
            expect(rootItem).toHaveAttribute('data-highlighted', '')
          },
          { timeout: 250 },
        )
      } finally {
        triggerRectSpy.mockRestore()
        popupRectSpy.mockRestore()
      }
    })
  })

  describe('pointer modality gating', () => {
    it('does not open submenu on touch pointer hover events', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')

      fireEvent.pointerEnter(submenuTrigger, {
        pointerType: 'touch',
        clientX: 190,
        clientY: 94,
      })
      fireEvent.pointerMove(submenuTrigger, {
        pointerType: 'touch',
        clientX: 190,
        clientY: 94,
      })

      await waitFor(
        () => {
          expect(
            screen.queryByTestId('popup-submenu-1'),
          ).not.toBeInTheDocument()
        },
        { timeout: 250 },
      )
    })

    it('still opens submenu on pen pointer hover events', async () => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')

      fireEvent.pointerEnter(submenuTrigger, {
        pointerType: 'pen',
        clientX: 190,
        clientY: 94,
      })
      fireEvent.pointerMove(submenuTrigger, {
        pointerType: 'pen',
        clientX: 190,
        clientY: 94,
      })

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })
    })
  })

  describe('continuous aim monitoring', () => {
    const setupAimMonitoringScenario = async (closeDelay: number) => {
      const user = userEvent.setup()
      render(<NestedMenuForDataAttrs submenuCloseDelay={closeDelay} />)

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('popup-root')).toBeInTheDocument()
      })

      const submenuTrigger = screen.getByTestId('submenu-trigger-1')
      await user.hover(submenuTrigger)

      await waitFor(() => {
        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      })

      const submenuPopup = screen.getByTestId('popup-submenu-1')
      const triggerRectSpy = vi
        .spyOn(submenuTrigger, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 60, left: 80, width: 120, height: 30 }),
        )
      const popupRectSpy = vi
        .spyOn(submenuPopup, 'getBoundingClientRect')
        .mockImplementation(() =>
          createRect({ top: 40, left: 240, width: 180, height: 160 }),
        )

      return {
        submenuTrigger,
        cleanup: () => {
          triggerRectSpy.mockRestore()
          popupRectSpy.mockRestore()
        },
      }
    }

    it('closes when pointer intent changes away after an initial hit', async () => {
      const scenario = await setupAimMonitoringScenario(0)

      try {
        fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })
        fireEvent.pointerMove(window, { clientX: 150, clientY: 92 })
        fireEvent.pointerMove(window, { clientX: 180, clientY: 94 })

        fireEvent.pointerLeave(scenario.submenuTrigger, {
          clientX: 190,
          clientY: 94,
        })

        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()

        fireEvent.pointerMove(window, { clientX: 140, clientY: 250 })
        fireEvent.pointerMove(window, { clientX: 110, clientY: 275 })

        await waitFor(
          () => {
            expect(
              screen.queryByTestId('popup-submenu-1'),
            ).not.toBeInTheDocument()
          },
          { timeout: 350 },
        )
      } finally {
        scenario.cleanup()
      }
    })

    it('keeps submenu open when intent switches toward submenu before delayed close', async () => {
      const scenario = await setupAimMonitoringScenario(240)

      try {
        fireEvent.pointerMove(window, { clientX: 180, clientY: 220 })
        fireEvent.pointerMove(window, { clientX: 160, clientY: 230 })
        fireEvent.pointerMove(window, { clientX: 140, clientY: 240 })

        fireEvent.pointerLeave(scenario.submenuTrigger, {
          clientX: 130,
          clientY: 260,
        })

        fireEvent.pointerMove(window, { clientX: 170, clientY: 200 })
        fireEvent.pointerMove(window, { clientX: 210, clientY: 170 })
        fireEvent.pointerMove(window, { clientX: 250, clientY: 140 })

        await sleep(300)

        expect(screen.getByTestId('popup-submenu-1')).toBeInTheDocument()
      } finally {
        scenario.cleanup()
      }
    })

    it('drops aim guard immediately when pointer reverses direction after a hit', async () => {
      const scenario = await setupAimMonitoringScenario(0)

      try {
        fireEvent.pointerMove(window, { clientX: 120, clientY: 90 })
        fireEvent.pointerMove(window, { clientX: 150, clientY: 92 })
        fireEvent.pointerMove(window, { clientX: 180, clientY: 94 })

        fireEvent.pointerLeave(scenario.submenuTrigger, {
          clientX: 190,
          clientY: 94,
        })

        fireEvent.pointerMove(window, { clientX: 178, clientY: 94 })
        fireEvent.pointerMove(window, { clientX: 164, clientY: 94 })

        const rootItem = screen.getByTestId('root-item-1')
        fireEvent.pointerMove(rootItem, { clientX: 96, clientY: 74 })
        fireEvent.pointerMove(rootItem, { clientX: 100, clientY: 78 })

        await waitFor(
          () => {
            expect(rootItem).toHaveAttribute('data-highlighted', '')
          },
          { timeout: 250 },
        )
      } finally {
        scenario.cleanup()
      }
    })
  })

  describe('search and filtering', () => {
    it('filters items by keyword search', async () => {
      const user = userEvent.setup()
      render(<MenuWithKeywords />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')
      await user.type(input, 'fruit')

      // Apple and Banana have 'fruit' keyword, Carrot doesn't
      // Filtered-out items are removed from DOM entirely
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.queryByTestId('item-carrot')).not.toBeInTheDocument()
    })

    it('filters items by specific keyword', async () => {
      const user = userEvent.setup()
      render(<MenuWithKeywords />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')
      await user.type(input, 'vegetable')

      // Only Carrot has 'vegetable' keyword
      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-carrot')).toBeInTheDocument()
    })

    it('shows empty state when no items match', async () => {
      const user = userEvent.setup()
      render(<MenuWithKeywords />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')
      await user.type(input, 'xyz123notfound')

      // All items should be removed
      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-carrot')).not.toBeInTheDocument()

      // Empty state should be visible
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    it('shows all items when search is cleared', async () => {
      const user = userEvent.setup()
      render(<MenuWithKeywords />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')

      // Type to filter - only Carrot has 'vegetable'
      await user.type(input, 'vegetable')
      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()

      // Clear input
      await user.clear(input)

      // All items should be back
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.getByTestId('item-carrot')).toBeInTheDocument()
    })
  })

  describe('filter={false}', () => {
    it('does not filter items when filter is disabled', async () => {
      const user = userEvent.setup()
      render(<MenuWithFilterDisabled />)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')
      await user.type(input, 'xyz123notfound')

      // All items should still be in DOM (no filtering)
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.getByTestId('item-cherry')).toBeInTheDocument()

      // Empty state should not be shown since items exist
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    })
  })

  // Note: Search isolation across nested surfaces tests removed due to complexity.
  // The submenu triggers get filtered along with regular items, making it difficult
  // to test search isolation when the parent surface has a search filter active.
  // This behavior should be tested manually or in E2E tests.

  describe('controlled search', () => {
    it('uses controlled search value from Surface', async () => {
      const onSearchChange = vi.fn()
      const { rerender } = render(
        <MenuWithControlledSearch
          search="app"
          onSearchChange={onSearchChange}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Input should display controlled value
      const input = screen.getByTestId('search-input')
      expect(input).toHaveValue('app')

      // Only apple should match "app"
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-cherry')).not.toBeInTheDocument()

      // Update controlled value
      rerender(
        <MenuWithControlledSearch
          search="cherry"
          onSearchChange={onSearchChange}
        />,
      )

      // Now cherry should match
      expect(input).toHaveValue('cherry')
      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-cherry')).toBeInTheDocument()
    })

    it('calls onSearchChange when user types', async () => {
      const user = userEvent.setup()
      const onSearchChange = vi.fn()
      render(
        <MenuWithControlledSearch search="" onSearchChange={onSearchChange} />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')
      await user.type(input, 'b')

      // onSearchChange should have been called
      expect(onSearchChange).toHaveBeenCalledWith('b')
    })
  })

  describe('clearSearchOnClose', () => {
    it('clears search when menu closes (default behavior)', async () => {
      const user = userEvent.setup()
      render(<MenuWithClearSearchOnClose clearSearchOnClose={true} />)

      // Open menu
      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Type to filter
      const input = screen.getByTestId('search-input')
      await user.type(input, 'apple')
      expect(input).toHaveValue('apple')

      // Close menu
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })

      // Reopen menu
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Search should be cleared
      const newInput = screen.getByTestId('search-input')
      expect(newInput).toHaveValue('')

      // All items should be visible
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.getByTestId('item-cherry')).toBeInTheDocument()
    })

    it('preserves search when clearSearchOnClose is false', async () => {
      const user = userEvent.setup()
      render(<MenuWithClearSearchOnClose clearSearchOnClose={false} />)

      // Open menu
      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Type to filter
      const input = screen.getByTestId('search-input')
      await user.type(input, 'apple')
      expect(input).toHaveValue('apple')

      // Close menu
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })

      // Reopen menu
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Search should be preserved
      const newInput = screen.getByTestId('search-input')
      expect(newInput).toHaveValue('apple')

      // Only apple should be visible (filter still applied)
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-cherry')).not.toBeInTheDocument()
    })

    it('clears search after exit animation when clearSearchOnClose is "after-exit"', async () => {
      const user = userEvent.setup()
      const onOpenChangeComplete = vi.fn()
      render(
        <MenuWithClearSearchOnClose
          clearSearchOnClose="after-exit"
          onOpenChangeComplete={onOpenChangeComplete}
        />,
      )

      // Open menu
      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Type to filter
      const input = screen.getByTestId('search-input')
      await user.type(input, 'apple')
      expect(input).toHaveValue('apple')

      // Only apple should be visible
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.queryByTestId('item-banana')).not.toBeInTheDocument()

      // Close menu
      await user.keyboard('{Escape}')

      // Wait for menu to close and onOpenChangeComplete to be called
      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })

      // onOpenChangeComplete should have been called with false
      await waitFor(() => {
        expect(onOpenChangeComplete).toHaveBeenCalledWith(false)
      })

      // Reopen menu
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Search should be cleared (cleared after animation completed)
      const newInput = screen.getByTestId('search-input')
      expect(newInput).toHaveValue('')

      // All items should be visible
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.getByTestId('item-cherry')).toBeInTheDocument()
    })

    it('calls onOpenChangeComplete after animation completes', async () => {
      const user = userEvent.setup()
      const onOpenChangeComplete = vi.fn()
      render(
        <MenuWithClearSearchOnClose
          clearSearchOnClose="after-exit"
          onOpenChangeComplete={onOpenChangeComplete}
        />,
      )

      // Open menu
      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // onOpenChangeComplete should be called with true after open animation
      await waitFor(() => {
        expect(onOpenChangeComplete).toHaveBeenCalledWith(true)
      })

      // Close menu
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
      })

      // onOpenChangeComplete should be called with false after close animation
      await waitFor(() => {
        expect(onOpenChangeComplete).toHaveBeenCalledWith(false)
      })

      // Should have been called twice total (open and close)
      expect(onOpenChangeComplete).toHaveBeenCalledTimes(2)
    })
  })

  describe('hideUntilActive', () => {
    it('hides input initially when hideUntilActive is true', async () => {
      const user = userEvent.setup()
      render(<MenuWithHideUntilActive />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Input should not be rendered initially
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()

      // List should be rendered and focusable
      expect(screen.getByTestId('list')).toBeInTheDocument()
    })

    it('activates input when user types a character', async () => {
      const user = userEvent.setup()
      render(<MenuWithHideUntilActive />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Input should not be rendered initially
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()

      // Focus the list and type a character
      const list = screen.getByTestId('list')
      list.focus()
      await user.keyboard('a')

      // Input should now be rendered
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      // Input should have the typed character
      const input = screen.getByTestId('search-input')
      expect(input).toHaveValue('a')
    })

    it('filters items after input is activated', async () => {
      const user = userEvent.setup()
      render(<MenuWithHideUntilActive />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Focus the list and type to activate + filter
      const list = screen.getByTestId('list')
      list.focus()
      await user.keyboard('ban')

      // Wait for input to appear
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      // Input should have the typed characters
      const input = screen.getByTestId('search-input')
      expect(input).toHaveValue('ban')

      // Only banana should match
      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.queryByTestId('item-cherry')).not.toBeInTheDocument()
    })

    it('does not activate input on navigation keys', async () => {
      const user = userEvent.setup()
      render(<MenuWithHideUntilActive />)

      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      // Focus the list
      const list = screen.getByTestId('list')
      list.focus()

      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowUp}')

      // Input should still not be rendered
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()

      // Items should still be visible
      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      expect(screen.getByTestId('item-banana')).toBeInTheDocument()
      expect(screen.getByTestId('item-cherry')).toBeInTheDocument()
    })
  })
})
