import type React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { MenuDef } from '../src/types'

/**
 * Test utilities for E2E tests in Vitest browser mode
 */

// Track active roots for cleanup
const activeRoots: Set<Root> = new Set()

/**
 * Render a React component in the browser test environment
 */
export async function render(element: React.ReactElement) {
  const container = document.createElement('div')
  container.setAttribute('data-testid', 'test-container')
  document.body.appendChild(container)

  const root = createRoot(container)
  activeRoots.add(root)

  root.render(element)

  // Give React time to render
  await new Promise((resolve) => setTimeout(resolve, 50))

  return {
    container,
    root,
    unmount: () => {
      root.unmount()
      activeRoots.delete(root)
      container.remove()
    },
  }
}

/**
 * Cleanup all rendered components
 */
export function cleanup() {
  activeRoots.forEach((root) => {
    root.unmount()
  })
  activeRoots.clear()

  // Remove all test containers
  document.querySelectorAll('[data-testid="test-container"]').forEach((el) => {
    el.remove()
  })
}

/**
 * Simple delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  callback: () => boolean | void,
  options: { timeout?: number; interval?: number } = {},
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options
  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const check = () => {
      try {
        const result = callback()
        if (result !== false) {
          resolve()
          return
        }
      } catch (error) {
        // Continue checking
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error('waitFor timeout exceeded'))
        return
      }

      setTimeout(check, interval)
    }

    check()
  })
}

/**
 * Wait for an element to appear in the DOM
 */
export async function waitForElement(
  selector: string,
  options?: { timeout?: number },
): Promise<Element> {
  let element: Element | null = null

  await waitFor(() => {
    element = document.querySelector(selector)
    return element !== null
  }, options)

  return element!
}

/**
 * Simulate keyboard event
 */
export function keyboard(key: string, options: KeyboardEventInit = {}) {
  // Try to find the menu surface first, fallback to active element
  const surface = document.querySelector('[data-action-menu-surface]')
  const target = (surface ||
    document.activeElement ||
    document.body) as HTMLElement

  const keydownEvent = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    composed: true,
    ...options,
  })

  const keyupEvent = new KeyboardEvent('keyup', {
    key,
    bubbles: true,
    cancelable: true,
    composed: true,
    ...options,
  })

  target.dispatchEvent(keydownEvent)
  target.dispatchEvent(keyupEvent)
}

/**
 * Simulate typing text
 */
export async function type(element: HTMLElement, text: string) {
  element.focus()

  for (const char of text) {
    // Fire input event to trigger React's onChange
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      data: char,
    })

    if (element instanceof HTMLInputElement) {
      element.value += char
    }

    element.dispatchEvent(inputEvent)

    // Small delay between keystrokes
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

/**
 * Simulate click
 */
export function click(element: Element) {
  // Action menu uses pointer events, so we need to dispatch those
  const pointerDownEvent = new PointerEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    view: window,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
  })

  const pointerUpEvent = new PointerEvent('pointerup', {
    bubbles: true,
    cancelable: true,
    view: window,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
  })

  element.dispatchEvent(pointerDownEvent)
  element.dispatchEvent(pointerUpEvent)

  // Also dispatch click for good measure
  if (element instanceof HTMLElement) {
    element.click()
  }
}

/**
 * Query helpers
 */
export const query = {
  trigger: () => document.querySelector('[data-action-menu-trigger]'),
  surface: () => document.querySelector('[data-action-menu-surface]'),
  input: () => document.querySelector('[data-action-menu-input]'),
  list: () => document.querySelector('[data-action-menu-list]'),
  items: () => document.querySelectorAll('[data-action-menu-item-id]'),
  itemById: (id: string) =>
    document.querySelector(`[data-action-menu-item-id="${id}"]`),
  focusedItem: () =>
    document.querySelector('[data-action-menu-item-id][data-focused]'),
}

/**
 * Sample menu definitions for testing
 */
export const fixtures = {
  basicMenu: {
    id: 'test-menu',
    nodes: [
      {
        kind: 'item' as const,
        id: 'apple',
        label: 'Apple',
        icon: '🍎',
      },
      {
        kind: 'item' as const,
        id: 'banana',
        label: 'Banana',
        icon: '🍌',
      },
      {
        kind: 'item' as const,
        id: 'cherry',
        label: 'Cherry',
        icon: '🍒',
      },
    ],
  } satisfies MenuDef,

  menuWithSearch: {
    id: 'search-menu',
    nodes: [
      {
        kind: 'item' as const,
        id: 'apple',
        label: 'Apple',
      },
      {
        kind: 'item' as const,
        id: 'apricot',
        label: 'Apricot',
      },
      {
        kind: 'item' as const,
        id: 'banana',
        label: 'Banana',
      },
      {
        kind: 'item' as const,
        id: 'cherry',
        label: 'Cherry',
      },
    ],
  } satisfies MenuDef,
}
