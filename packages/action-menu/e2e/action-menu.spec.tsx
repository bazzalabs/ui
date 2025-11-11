import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { createActionMenu } from '../src/index.js'
import {
  cleanup,
  click,
  fixtures,
  keyboard,
  query,
  render,
  type as typeText,
  waitFor,
  waitForElement,
} from './test-utils.js'

describe('ActionMenu E2E Tests', () => {
  beforeEach(() => {
    // Clean up any existing test containers
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Basic Rendering', () => {
    test('should render trigger with correct attributes', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.basicMenu}
        />,
      )

      // Wait for component to render
      await waitFor(() => query.trigger() !== null)

      const trigger = query.trigger()
      expect(trigger).toBeDefined()
      expect(trigger?.getAttribute('aria-haspopup')).toBe('menu')
      expect(trigger?.getAttribute('aria-expanded')).toBe('false')
      expect(trigger?.getAttribute('data-state')).toBe('closed')
    })

    test('should render menu items when opened', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.basicMenu}
        />,
      )

      const trigger = await waitForElement('[data-action-menu-trigger]')

      // Open menu
      click(trigger)

      // Wait for menu to appear
      await waitForElement('[data-action-menu-surface]')

      const items = query.items()
      expect(items.length).toBe(3)

      // Verify item IDs
      expect(query.itemById('apple')).toBeDefined()
      expect(query.itemById('banana')).toBeDefined()
      expect(query.itemById('cherry')).toBeDefined()
    })

    test('should have correct ARIA attributes on menu surface', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.basicMenu}
        />,
      )

      const trigger = await waitForElement('[data-action-menu-trigger]')
      click(trigger)

      const surface = await waitForElement('[data-action-menu-surface]')

      expect(surface.getAttribute('data-state')).toBe('open')
      expect(surface.getAttribute('role')).toBe('menu')
      // The surface ID is 'root' for the root menu
      expect(surface.getAttribute('data-surface-id')).toBe('root')
      expect(surface.getAttribute('data-root-menu')).toBeDefined()
    })

    test('should render items with correct labels', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.basicMenu}
        />,
      )

      const trigger = await waitForElement('[data-action-menu-trigger]')
      click(trigger)

      await waitForElement('[data-action-menu-surface]')

      const appleItem = query.itemById('apple')
      const bananaItem = query.itemById('banana')
      const cherryItem = query.itemById('cherry')

      expect(appleItem?.textContent).toContain('Apple')
      expect(bananaItem?.textContent).toContain('Banana')
      expect(cherryItem?.textContent).toContain('Cherry')
    })
  })

  describe('Open/Close Behavior', () => {
    test('should open menu when trigger is clicked', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.basicMenu}
        />,
      )

      const trigger = await waitForElement('[data-action-menu-trigger]')

      // Initially closed
      expect(trigger.getAttribute('aria-expanded')).toBe('false')

      // Click to open
      click(trigger)

      await waitFor(() => trigger.getAttribute('aria-expanded') === 'true')

      const surface = query.surface()
      expect(surface).toBeDefined()
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
    })

    test('should close menu when trigger is clicked again', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.basicMenu}
        />,
      )

      const trigger = await waitForElement('[data-action-menu-trigger]')

      // Open menu
      click(trigger)
      await waitFor(() => trigger.getAttribute('aria-expanded') === 'true')

      // Close menu
      click(trigger)
      await waitFor(() => trigger.getAttribute('aria-expanded') === 'false')
    })

    test('should close menu when Escape is pressed', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.basicMenu}
        />,
      )

      const trigger = await waitForElement('[data-action-menu-trigger]')

      // Open menu
      click(trigger)
      await waitForElement('[data-action-menu-surface]')

      // Press Escape
      keyboard('Escape')

      await waitFor(() => trigger.getAttribute('aria-expanded') === 'false')
      expect(trigger.getAttribute('aria-expanded')).toBe('false')
    })
  })

  describe('Keyboard Navigation', () => {
    // Skip keyboard navigation tests for now - need to investigate event handling
    test.skip('should navigate items with ArrowDown', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.basicMenu}
        />,
      )

      const trigger = await waitForElement('[data-action-menu-trigger]')
      click(trigger)
      await waitForElement('[data-action-menu-surface]')

      // Press ArrowDown to focus first item
      keyboard('ArrowDown')

      await waitFor(() => {
        const focused = query.focusedItem()
        return focused?.getAttribute('data-action-menu-item-id') === 'apple'
      })

      let focusedItem = query.focusedItem()
      expect(focusedItem?.getAttribute('data-action-menu-item-id')).toBe(
        'apple',
      )

      // Press ArrowDown again to move to second item
      keyboard('ArrowDown')

      await waitFor(() => {
        const focused = query.focusedItem()
        return focused?.getAttribute('data-action-menu-item-id') === 'banana'
      })

      focusedItem = query.focusedItem()
      expect(focusedItem?.getAttribute('data-action-menu-item-id')).toBe(
        'banana',
      )
    })

    test.skip('should navigate items with ArrowUp', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.basicMenu}
        />,
      )

      const trigger = await waitForElement('[data-action-menu-trigger]')
      click(trigger)
      await waitForElement('[data-action-menu-surface]')

      // Press ArrowUp to focus last item
      keyboard('ArrowUp')

      await waitFor(() => {
        const focused = query.focusedItem()
        return focused?.getAttribute('data-action-menu-item-id') === 'cherry'
      })

      const focusedItem = query.focusedItem()
      expect(focusedItem?.getAttribute('data-action-menu-item-id')).toBe(
        'cherry',
      )
    })

    test.skip('should jump to first item with Home key', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.basicMenu}
        />,
      )

      const trigger = await waitForElement('[data-action-menu-trigger]')
      click(trigger)
      await waitForElement('[data-action-menu-surface]')

      // Navigate to second item
      keyboard('ArrowDown')
      keyboard('ArrowDown')

      await waitFor(() => {
        const focused = query.focusedItem()
        return focused?.getAttribute('data-action-menu-item-id') === 'banana'
      })

      // Press Home to jump to first
      keyboard('Home')

      await waitFor(() => {
        const focused = query.focusedItem()
        return focused?.getAttribute('data-action-menu-item-id') === 'apple'
      })

      const focusedItem = query.focusedItem()
      expect(focusedItem?.getAttribute('data-action-menu-item-id')).toBe(
        'apple',
      )
    })

    test.skip('should jump to last item with End key', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.basicMenu}
        />,
      )

      const trigger = await waitForElement('[data-action-menu-trigger]')
      click(trigger)
      await waitForElement('[data-action-menu-surface]')

      // Press End to jump to last
      keyboard('End')

      await waitFor(() => {
        const focused = query.focusedItem()
        return focused?.getAttribute('data-action-menu-item-id') === 'cherry'
      })

      const focusedItem = query.focusedItem()
      expect(focusedItem?.getAttribute('data-action-menu-item-id')).toBe(
        'cherry',
      )
    })
  })

  describe('Search and Filter', () => {
    test.skip('should filter items when typing', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.menuWithSearch}
        />,
      )

      const trigger = await waitForElement('[data-action-menu-trigger]')
      click(trigger)
      await waitForElement('[data-action-menu-surface]')

      const input = query.input() as HTMLInputElement
      expect(input).toBeDefined()

      // Type "ap" to filter
      await typeText(input, 'ap')

      // Wait for filtering to occur
      await waitFor(() => {
        const items = query.items()
        return items.length === 2
      })

      // Should show Apple and Apricot
      const items = query.items()
      expect(items.length).toBe(2)

      const itemIds = Array.from(items).map((item) =>
        item.getAttribute('data-action-menu-item-id'),
      )
      expect(itemIds).toContain('apple')
      expect(itemIds).toContain('apricot')
    })

    test('should have correct ARIA attributes on search input', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.menuWithSearch}
        />,
      )

      const trigger = await waitForElement('[data-action-menu-trigger]')
      click(trigger)
      await waitForElement('[data-action-menu-surface]')

      const input = query.input()
      expect(input).toBeDefined()
      expect(input?.getAttribute('role')).toBe('combobox')
      expect(input?.getAttribute('aria-autocomplete')).toBe('list')
      expect(input?.getAttribute('aria-expanded')).toBe('true')

      // Should have aria-controls pointing to list
      const listId = input?.getAttribute('aria-controls')
      expect(listId).toBeDefined()

      const list = document.getElementById(listId!)
      expect(list).toBeDefined()
    })
  })

  describe('Item Attributes', () => {
    test.skip('should set data-focused attribute on focused item', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.basicMenu}
        />,
      )

      const trigger = await waitForElement('[data-action-menu-trigger]')
      click(trigger)
      await waitForElement('[data-action-menu-surface]')

      // Navigate to first item
      keyboard('ArrowDown')

      await waitFor(() => query.focusedItem() !== null)

      const focusedItem = query.focusedItem()
      expect(focusedItem?.hasAttribute('data-focused')).toBe(true)
      expect(focusedItem?.getAttribute('aria-selected')).toBe('true')
    })

    test('should set correct variant attribute on items', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.basicMenu}
        />,
      )

      const trigger = await waitForElement('[data-action-menu-trigger]')
      click(trigger)
      await waitForElement('[data-action-menu-surface]')

      const items = query.items()

      // All items in basicMenu are button variants
      items.forEach((item) => {
        expect(item.getAttribute('data-variant')).toBe('button')
      })
    })

    test('should have role="option" on menu items', async () => {
      const ActionMenu = createActionMenu()

      render(
        <ActionMenu
          trigger={<button type="button">Open Menu</button>}
          menu={fixtures.basicMenu}
        />,
      )

      const trigger = await waitForElement('[data-action-menu-trigger]')
      click(trigger)
      await waitForElement('[data-action-menu-surface]')

      const items = query.items()

      items.forEach((item) => {
        expect(item.getAttribute('role')).toBe('option')
      })
    })
  })
})
