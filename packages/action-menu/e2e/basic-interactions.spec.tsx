import React from 'react'
import { afterEach, describe, expect, test } from 'vitest'
import { basicMenuDef, checkboxMenuDef } from './fixtures/test-menu.js'
import { ControlledTestApp } from './test-app.js'
import {
  cleanup,
  click,
  delay,
  keyboard,
  render,
  waitFor,
  waitForElement,
} from './test-utils.js'

// Helper to check if element is visible
function isVisible(element: Element | null): boolean {
  if (!element) return false
  const htmlElement = element as HTMLElement
  const style = window.getComputedStyle(htmlElement)

  // Check if element or any parent has display: none
  if (style.display === 'none') return false
  if (style.visibility === 'hidden') return false

  // For menu items in a virtualized list, offsetParent might be null
  // but they can still be visible, so check the rect instead
  const rect = htmlElement.getBoundingClientRect()

  return (
    rect.width > 0 && rect.height > 0 && Number.parseFloat(style.opacity) > 0
  )
}

describe('Basic Interactions', () => {
  afterEach(async () => {
    cleanup()
    // wait 100ms
    await delay(100)
  })

  test('should open menu when trigger is clicked', async () => {
    await render(<ControlledTestApp menuDef={basicMenuDef} />)

    // Wait for trigger to be rendered
    const trigger = await waitForElement('[data-testid="menu-trigger"]')
    const getList = () => document.querySelector('[data-testid="menu-list"]')

    // Menu should be closed initially
    await waitFor(() => {
      const list = getList()
      return list === null || !isVisible(list)
    })

    // Click trigger
    click(trigger)

    // Menu should now be open
    await waitFor(() => {
      const list = getList()
      return list !== null && isVisible(list)
    })

    expect(isVisible(getList())).toBe(true)
  })

  test('should close menu when clicking outside', async () => {
    await render(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    const getList = () => document.querySelector('[data-testid="menu-list"]')

    // Menu should be open initially
    await waitFor(() => {
      const list = getList()
      return list !== null && isVisible(list)
    })

    // Click outside the menu using pointer events (like trigger click)
    document.body.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        clientX: 5,
        clientY: 5,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
      }),
    )
    await delay(50)

    // Menu should close
    await waitFor(() => {
      const list = getList()
      return list === null || !isVisible(list)
    })
  })

  test('should close menu when pressing Escape', async () => {
    await render(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    const getList = () => document.querySelector('[data-testid="menu-list"]')

    // Menu should be open
    await waitFor(() => {
      const list = getList()
      return list !== null && isVisible(list)
    })

    // Press Escape - dispatch to the surface element
    const surface = document.querySelector('[data-action-menu-surface]')
    if (surface) {
      surface.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      )
    }
    await delay(100)

    // Menu should close
    await waitFor(() => {
      const list = getList()
      return list === null || !isVisible(list)
    })
  })

  test('should display all menu items', async () => {
    await render(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Wait for menu to be visible
    await waitFor(() => {
      const list = document.querySelector('[data-testid="menu-list"]')
      return list !== null && isVisible(list)
    })

    // Check that all items from basicMenuDef exist using data-action-menu-item-id
    await waitForElement('[data-action-menu-item-id="new"]')
    await waitForElement('[data-action-menu-item-id="open"]')
    await waitForElement('[data-action-menu-item-id="save"]')
    await waitForElement('[data-action-menu-item-id="exit"]')

    // Verify they all exist
    const newItem = document.querySelector('[data-action-menu-item-id="new"]')
    const openItem = document.querySelector('[data-action-menu-item-id="open"]')
    const saveItem = document.querySelector('[data-action-menu-item-id="save"]')
    const exitItem = document.querySelector('[data-action-menu-item-id="exit"]')

    expect(newItem).toBeTruthy()
    expect(openItem).toBeTruthy()
    expect(saveItem).toBeTruthy()
    expect(exitItem).toBeTruthy()
  })

  test('should handle item selection', async () => {
    await render(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    await waitFor(() => {
      const list = document.querySelector('[data-testid="menu-list"]')
      return list !== null && isVisible(list)
    })

    // Wait for item to exist
    await waitForElement('[data-action-menu-item-id="new"]')

    // Click an item
    const newItem = document.querySelector('[data-action-menu-item-id="new"]')!
    click(newItem)

    await delay(50)

    // Check that selection was registered
    const selectedId = document.querySelector('[data-testid="selected-id"]')
    await waitFor(() => selectedId?.textContent === 'new')
    expect(selectedId?.textContent).toBe('new')
  })

  test('should not allow selecting disabled items', async () => {
    await render(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    await waitFor(() => {
      const list = document.querySelector('[data-testid="menu-list"]')
      return list !== null && isVisible(list)
    })

    // Wait for save item
    await waitForElement('[data-action-menu-item-id="save"]')

    // The 'save' item is disabled in basicMenuDef
    const saveItem = document.querySelector(
      '[data-action-menu-item-id="save"]',
    ) as HTMLElement

    // Item should be visible but disabled
    expect(isVisible(saveItem)).toBe(true)
    expect(saveItem.getAttribute('aria-disabled')).toBe('true')

    // Try to click it
    click(saveItem)
    await delay(50)

    // Selection should not change
    const selectedId = document.querySelector('[data-testid="selected-id"]')
    expect(selectedId?.textContent).toBe('')
  })

  test('should close menu after selecting an item by default', async () => {
    await render(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    const getList = () => document.querySelector('[data-testid="menu-list"]')

    await waitFor(() => {
      const list = getList()
      return list !== null && isVisible(list)
    })

    // Wait for item
    await waitForElement('[data-action-menu-item-id="new"]')

    // Click an item
    const newItem = document.querySelector('[data-action-menu-item-id="new"]')!
    click(newItem)

    // Menu should close
    await waitFor(() => {
      const list = getList()
      return list === null || !isVisible(list)
    })
  })

  test('should handle multiple open/close cycles', async () => {
    await render(<ControlledTestApp menuDef={basicMenuDef} />)

    const trigger = await waitForElement('[data-testid="menu-trigger"]')
    const getList = () => document.querySelector('[data-testid="menu-list"]')

    // Open
    click(trigger)
    await delay(100) // Give time for animation/state update
    await waitFor(() => {
      const list = getList()
      return list !== null && isVisible(list)
    })

    // Close
    click(trigger)
    await delay(100)
    await waitFor(() => {
      const list = getList()
      return list === null || !isVisible(list)
    })

    // Open again
    click(trigger)
    await delay(100)
    await waitFor(() => {
      const list = getList()
      return list !== null && isVisible(list)
    })

    // Close again
    click(trigger)
    await delay(100)
    await waitFor(() => {
      const list = getList()
      return list === null || !isVisible(list)
    })
  })

  test('should handle checkbox items', async () => {
    await render(
      <ControlledTestApp menuDef={checkboxMenuDef} initialOpen={true} />,
    )

    const getList = () => document.querySelector('[data-testid="menu-list"]')

    await waitFor(() => {
      const list = getList()
      return list !== null && isVisible(list)
    })

    // Wait for checkbox item
    await waitForElement('[data-action-menu-item-id="option1"]')

    const checkbox1 = document.querySelector(
      '[data-action-menu-item-id="option1"]',
    )!

    // Checkbox should be visible
    expect(isVisible(checkbox1)).toBe(true)

    // Click checkbox
    click(checkbox1)
    await delay(50)

    // Menu should stay open for checkboxes
    expect(isVisible(getList())).toBe(true)
  })

  test('should return focus to trigger when menu closes', async () => {
    await render(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    const getList = () => document.querySelector('[data-testid="menu-list"]')

    await waitFor(() => {
      const list = getList()
      return list !== null && isVisible(list)
    })

    // Close menu with Escape
    const surface = document.querySelector('[data-action-menu-surface]')
    if (surface) {
      surface.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      )
    }
    await delay(200) // Give more time for focus management

    // Focus should return to trigger
    const trigger = document.querySelector('[data-testid="menu-trigger"]')
    await waitFor(() => document.activeElement === trigger, { timeout: 2000 })
    expect(document.activeElement).toBe(trigger)
  })
})
