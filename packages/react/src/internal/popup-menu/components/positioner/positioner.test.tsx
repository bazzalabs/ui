import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'

// ============================================================================
// Test Fixtures
// ============================================================================

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = []

  private callback: ResizeObserverCallback
  private observedElements = new Set<Element>()

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    ResizeObserverMock.instances.push(this)
  }

  observe(target: Element): void {
    this.observedElements.add(target)
  }

  unobserve(target: Element): void {
    this.observedElements.delete(target)
  }

  disconnect(): void {
    this.observedElements.clear()
  }

  static reset(): void {
    ResizeObserverMock.instances = []
  }

  static trigger(target: Element): void {
    const entry = {
      target,
      contentRect: target.getBoundingClientRect(),
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: [],
    } as unknown as ResizeObserverEntry

    for (const instance of ResizeObserverMock.instances) {
      if (!instance.observedElements.has(target)) {
        continue
      }

      instance.callback([entry], instance as unknown as ResizeObserver)
    }
  }
}

async function flushAnimationFrames(frameCount = 1): Promise<void> {
  await act(async () => {
    for (let index = 0; index < frameCount; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  })
}

function triggerResize(target: Element): void {
  act(() => {
    ResizeObserverMock.trigger(target)
  })
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

function getPositionerStyleSignature(element: HTMLElement): string {
  return element.style.cssText
}

/**
 * Basic submenu with configurable align prop for testing list-start alignment.
 */
function SubmenuWithAlign({
  align,
  side = 'right',
}: {
  align?: 'start' | 'center' | 'end' | 'list-start'
  side?: 'left' | 'right' | 'top' | 'bottom'
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner data-testid="root-positioner">
          <DropdownMenu.Popup data-testid="root-popup">
            <DropdownMenu.Surface data-testid="root-surface">
              <DropdownMenu.List data-testid="root-list">
                <DropdownMenu.Item data-testid="item-1">
                  Item 1
                </DropdownMenu.Item>
                <DropdownMenu.Submenu defaultOpen>
                  <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger">
                    Open Submenu
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner
                      data-testid="submenu-positioner"
                      align={align}
                      side={side}
                    >
                      <DropdownMenu.Popup data-testid="submenu-popup">
                        <DropdownMenu.Surface data-testid="submenu-surface">
                          <DropdownMenu.List data-testid="submenu-list">
                            <DropdownMenu.Item data-testid="submenu-item-1">
                              Sub Item 1
                            </DropdownMenu.Item>
                            <DropdownMenu.Item data-testid="submenu-item-2">
                              Sub Item 2
                            </DropdownMenu.Item>
                            <DropdownMenu.Item data-testid="submenu-item-3">
                              Sub Item 3
                            </DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
                <DropdownMenu.Item data-testid="item-2">
                  Item 2
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Submenu that opens on hover for testing measurement timing.
 */
function SubmenuOpenOnHover({
  align,
}: {
  align?: 'start' | 'center' | 'end' | 'list-start'
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List data-testid="root-list">
                <DropdownMenu.Item data-testid="item-1">
                  Item 1
                </DropdownMenu.Item>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger">
                    Open Submenu
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner
                      data-testid="submenu-positioner"
                      align={align}
                      side="right"
                    >
                      <DropdownMenu.Popup data-testid="submenu-popup">
                        <DropdownMenu.Surface data-testid="submenu-surface">
                          <DropdownMenu.List
                            data-testid="submenu-list"
                            style={{ padding: '8px' }}
                          >
                            <DropdownMenu.Item data-testid="submenu-item-1">
                              Sub Item 1
                            </DropdownMenu.Item>
                            <DropdownMenu.Item data-testid="submenu-item-2">
                              Sub Item 2
                            </DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
                <DropdownMenu.Item data-testid="item-2">
                  Item 2
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Submenu with dynamic banner content above the list.
 * Used to test resize-driven list-start re-measurement behavior.
 */
function SubmenuWithDynamicBanner() {
  const [showBanner, setShowBanner] = React.useState(false)

  return (
    <>
      <button
        type="button"
        data-testid="toggle-banner"
        onClick={() => setShowBanner((previous) => !previous)}
      >
        Toggle banner
      </button>
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger data-testid="trigger">
          Open Menu
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <DropdownMenu.Item data-testid="item-1">
                    Item 1
                  </DropdownMenu.Item>
                  <DropdownMenu.Submenu defaultOpen>
                    <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger">
                      Open Submenu
                    </DropdownMenu.SubmenuTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Positioner
                        data-testid="submenu-positioner"
                        align="list-start"
                        side="right"
                      >
                        <DropdownMenu.Popup data-testid="submenu-popup">
                          {showBanner ? (
                            <div data-testid="submenu-banner">Extra banner</div>
                          ) : null}
                          <DropdownMenu.Surface data-testid="submenu-surface">
                            <DropdownMenu.List data-testid="submenu-list">
                              <DropdownMenu.Item data-testid="submenu-item-1">
                                Sub Item 1
                              </DropdownMenu.Item>
                              <DropdownMenu.Item data-testid="submenu-item-2">
                                Sub Item 2
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
    </>
  )
}

/**
 * Submenu with hideUntilActive Input for testing suppression logic.
 */
function SubmenuWithHideUntilActiveInput() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger data-testid="trigger">
        Open Menu
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List data-testid="root-list">
                <DropdownMenu.Item data-testid="item-1">
                  Item 1
                </DropdownMenu.Item>
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger">
                    Open Submenu
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner
                      data-testid="submenu-positioner"
                      align="list-start"
                      side="right"
                    >
                      <DropdownMenu.Popup data-testid="submenu-popup">
                        <DropdownMenu.Surface data-testid="submenu-surface">
                          <DropdownMenu.Input
                            data-testid="submenu-input"
                            hideUntilActive
                            placeholder="Search..."
                          />
                          <DropdownMenu.List data-testid="submenu-list">
                            <DropdownMenu.Item data-testid="submenu-item-1">
                              Sub Item 1
                            </DropdownMenu.Item>
                            <DropdownMenu.Item data-testid="submenu-item-2">
                              Sub Item 2
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
  )
}

// ============================================================================
// Tests
// ============================================================================

describe('PopupMenuPositioner', () => {
  describe('align="list-start"', () => {
    describe('data attributes', () => {
      it('sets data-align="list-start" when align is list-start on horizontal side', async () => {
        render(<SubmenuWithAlign align="list-start" side="right" />)

        await waitFor(() => {
          expect(screen.getByTestId('submenu-positioner')).toBeInTheDocument()
        })

        const positioner = screen.getByTestId('submenu-positioner')
        expect(positioner).toHaveAttribute('data-align', 'list-start')
      })

      it('sets data-side correctly for horizontal sides', async () => {
        render(<SubmenuWithAlign align="list-start" side="left" />)

        await waitFor(() => {
          expect(screen.getByTestId('submenu-positioner')).toBeInTheDocument()
        })

        const positioner = screen.getByTestId('submenu-positioner')
        expect(positioner).toHaveAttribute('data-side', 'left')
        expect(positioner).toHaveAttribute('data-align', 'list-start')
      })
    })

    describe('measurement timing', () => {
      it('does not apply transition:none after measurement is complete', async () => {
        render(<SubmenuWithAlign align="list-start" side="right" />)

        await waitFor(() => {
          expect(screen.getByTestId('submenu-positioner')).toBeInTheDocument()
        })

        // Transitions are only disabled for the first, pre-measurement render.
        const positioner = screen.getByTestId('submenu-positioner')
        expect(positioner).toHaveAttribute('data-align', 'list-start')
        await waitFor(() => {
          expect(positioner.style.transition).not.toBe('none')
        })
      })

      it('opens a list-start submenu via keyboard', async () => {
        const user = userEvent.setup()
        render(<SubmenuOpenOnHover align="list-start" />)

        await waitFor(() => {
          expect(screen.getByTestId('root-list')).toBeInTheDocument()
        })

        // Focus the list
        const list = screen.getByTestId('root-list')
        list.focus()

        // Navigate to submenu trigger
        await user.keyboard('{ArrowDown}')

        // Verify submenu trigger is highlighted
        await waitFor(() => {
          expect(screen.getByTestId('submenu-trigger')).toHaveAttribute(
            'data-highlighted',
          )
        })

        // Open submenu with ArrowRight
        await user.keyboard('{ArrowRight}')

        await waitFor(() => {
          expect(screen.getByTestId('submenu-surface')).toBeInTheDocument()
        })

        // Verify list-start alignment is applied
        const positioner = screen.getByTestId('submenu-positioner')
        expect(positioner).toHaveAttribute('data-align', 'list-start')
      })

      it('reopens a list-start submenu via keyboard', async () => {
        const user = userEvent.setup()
        render(<SubmenuOpenOnHover align="list-start" />)

        await waitFor(() => {
          expect(screen.getByTestId('root-list')).toBeInTheDocument()
        })

        const list = screen.getByTestId('root-list')
        list.focus()

        // Open submenu
        await user.keyboard('{ArrowDown}')
        await user.keyboard('{ArrowRight}')

        await waitFor(() => {
          expect(screen.getByTestId('submenu-surface')).toBeInTheDocument()
        })

        // Close submenu with ArrowLeft
        await user.keyboard('{ArrowLeft}')

        await waitFor(() => {
          expect(
            screen.queryByTestId('submenu-surface'),
          ).not.toBeInTheDocument()
        })

        // Reopen submenu
        await user.keyboard('{ArrowRight}')

        await waitFor(() => {
          expect(screen.getByTestId('submenu-surface')).toBeInTheDocument()
        })

        // Verify list-start alignment is still applied after reopen
        const positioner = screen.getByTestId('submenu-positioner')
        expect(positioner).toHaveAttribute('data-align', 'list-start')
      })
    })

    describe('resize-driven updates', () => {
      beforeEach(() => {
        ResizeObserverMock.reset()
        vi.stubGlobal('ResizeObserver', ResizeObserverMock)
      })

      afterEach(() => {
        ResizeObserverMock.reset()
        vi.unstubAllGlobals()
      })

      it('re-measures list-start offset when popup height changes', async () => {
        render(<SubmenuWithDynamicBanner />)

        await waitFor(() => {
          expect(screen.getByTestId('submenu-list')).toBeInTheDocument()
          expect(screen.getByTestId('submenu-positioner')).toBeInTheDocument()
          expect(screen.getByTestId('submenu-popup')).toBeInTheDocument()
        })

        const positioner = screen.getByTestId('submenu-positioner')
        const submenuList = screen.getByTestId('submenu-list')
        const submenuPopup = screen.getByTestId('submenu-popup')
        let listTop = 20

        vi.spyOn(submenuList, 'getBoundingClientRect').mockImplementation(() =>
          createRect({ top: listTop, left: 0, width: 180, height: 120 }),
        )

        triggerResize(submenuPopup)
        await flushAnimationFrames(2)

        const beforeResizeStyle = getPositionerStyleSignature(positioner)

        fireEvent.click(screen.getByTestId('toggle-banner'))
        listTop = 60

        triggerResize(submenuPopup)
        await flushAnimationFrames(2)

        expect(getPositionerStyleSignature(positioner)).not.toBe(
          beforeResizeStyle,
        )
      })

      it('skips the first resize re-measure when hideUntilActive input activates', async () => {
        const user = userEvent.setup()
        render(<SubmenuWithHideUntilActiveInput />)

        await waitFor(() => {
          expect(screen.getByTestId('root-list')).toBeInTheDocument()
        })

        const rootList = screen.getByTestId('root-list')
        rootList.focus()

        await user.keyboard('{ArrowDown}')
        await waitFor(() => {
          expect(screen.getByTestId('submenu-trigger')).toHaveAttribute(
            'data-highlighted',
          )
        })

        await user.keyboard('{ArrowRight}')

        await waitFor(() => {
          expect(screen.getByTestId('submenu-list')).toBeInTheDocument()
          expect(screen.getByTestId('submenu-positioner')).toBeInTheDocument()
          expect(screen.getByTestId('submenu-popup')).toBeInTheDocument()
        })

        const positioner = screen.getByTestId('submenu-positioner')
        const submenuList = screen.getByTestId('submenu-list')
        const submenuPopup = screen.getByTestId('submenu-popup')
        let listTop = 20

        const listRectSpy = vi
          .spyOn(submenuList, 'getBoundingClientRect')
          .mockImplementation(() =>
            createRect({ top: listTop, left: 0, width: 180, height: 120 }),
          )

        triggerResize(submenuPopup)
        await flushAnimationFrames(2)

        const beforeActivationStyle = getPositionerStyleSignature(positioner)

        listTop = 60

        submenuList.focus()
        fireEvent.keyDown(submenuList, { key: 'a', code: 'KeyA' })

        const beforeSuppressedResizeCallCount = listRectSpy.mock.calls.length

        triggerResize(submenuPopup)
        await flushAnimationFrames(1)

        expect(getPositionerStyleSignature(positioner)).toBe(
          beforeActivationStyle,
        )
        expect(listRectSpy.mock.calls.length).toBe(
          beforeSuppressedResizeCallCount,
        )

        await flushAnimationFrames(2)

        const beforeNormalResizeCallCount = listRectSpy.mock.calls.length

        triggerResize(submenuPopup)
        await flushAnimationFrames(1)

        expect(listRectSpy.mock.calls.length).toBeGreaterThan(
          beforeNormalResizeCallCount,
        )

        await waitFor(() => {
          expect(screen.getByTestId('submenu-input')).toBeInTheDocument()
        })
      })
    })

    describe('fallback behavior', () => {
      it('falls back to start alignment on vertical sides (top)', async () => {
        render(<SubmenuWithAlign align="list-start" side="top" />)

        await waitFor(() => {
          expect(screen.getByTestId('submenu-positioner')).toBeInTheDocument()
        })

        const positioner = screen.getByTestId('submenu-positioner')
        expect(positioner).toHaveAttribute('data-side', 'top')
        // On vertical sides, should fall back to 'start', not 'list-start'
        expect(positioner).not.toHaveAttribute('data-align', 'list-start')
      })

      it('falls back to start alignment on vertical sides (bottom)', async () => {
        render(<SubmenuWithAlign align="list-start" side="bottom" />)

        await waitFor(() => {
          expect(screen.getByTestId('submenu-positioner')).toBeInTheDocument()
        })

        const positioner = screen.getByTestId('submenu-positioner')
        expect(positioner).toHaveAttribute('data-side', 'bottom')
        expect(positioner).not.toHaveAttribute('data-align', 'list-start')
      })
    })

    describe('standard align values', () => {
      it.each([
        'start',
        'center',
        'end',
        undefined,
      ] as const)('does not apply the list-start override for align=%s', async (align) => {
        render(<SubmenuWithAlign align={align} side="right" />)

        await waitFor(() => {
          expect(screen.getByTestId('submenu-positioner')).toBeInTheDocument()
        })

        const positioner = screen.getByTestId('submenu-positioner')
        expect(positioner).toHaveAttribute('data-side', 'right')
        expect(positioner).not.toHaveAttribute('data-align', 'list-start')
      })
    })

    describe('style prop', () => {
      it('passes through custom styles when using list-start', async () => {
        function SubmenuWithCustomStyle() {
          return (
            <DropdownMenu.Root defaultOpen>
              <DropdownMenu.Trigger data-testid="trigger">
                Open Menu
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Positioner>
                  <DropdownMenu.Popup>
                    <DropdownMenu.Surface>
                      <DropdownMenu.List>
                        <DropdownMenu.Submenu defaultOpen>
                          <DropdownMenu.SubmenuTrigger data-testid="submenu-trigger">
                            Open Submenu
                          </DropdownMenu.SubmenuTrigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Positioner
                              data-testid="submenu-positioner"
                              align="list-start"
                              side="right"
                              style={{ zIndex: '9999' }}
                            >
                              <DropdownMenu.Popup data-testid="submenu-popup">
                                <DropdownMenu.Surface>
                                  <DropdownMenu.List data-testid="submenu-list">
                                    <DropdownMenu.Item data-testid="submenu-item-1">
                                      Sub Item 1
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
          )
        }

        render(<SubmenuWithCustomStyle />)

        await waitFor(() => {
          expect(screen.getByTestId('submenu-positioner')).toBeInTheDocument()
        })

        const positioner = screen.getByTestId('submenu-positioner')
        expect(positioner).toHaveAttribute('data-align', 'list-start')
        // Custom style should be preserved
        expect(positioner).toHaveStyle({ zIndex: '9999' })
      })
    })
  })
})
