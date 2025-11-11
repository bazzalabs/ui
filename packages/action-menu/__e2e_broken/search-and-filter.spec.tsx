import { expect, test } from '@playwright/experimental-ct-react'
import { largeMenuDef, searchableMenuDef } from './fixtures/test-menu.js'
import { ControlledTestApp } from './test-app.js'

test.describe('Search and Filter', () => {
  test('should filter items based on search query', async ({ mount }) => {
    const component = await mount(
      <ControlledTestApp menuDef={searchableMenuDef} initialOpen={true} />,
    )

    const input = component.getByTestId('menu-input')

    // All items should be visible initially
    await expect(component.getByTestId('menu-item-apple')).toBeVisible()
    await expect(component.getByTestId('menu-item-banana')).toBeVisible()
    await expect(component.getByTestId('menu-item-carrot')).toBeVisible()

    // Type search query
    await input.fill('app')

    // Only matching items should be visible
    await expect(component.getByTestId('menu-item-apple')).toBeVisible()
    await expect(component.getByTestId('menu-item-banana')).not.toBeVisible()
    await expect(component.getByTestId('menu-item-carrot')).not.toBeVisible()
  })

  test('should match on keywords', async ({ mount }) => {
    const component = await mount(
      <ControlledTestApp menuDef={searchableMenuDef} initialOpen={true} />,
    )

    const input = component.getByTestId('menu-input')

    // Search for keyword
    await input.fill('fruit')

    // Should match items with 'fruit' keyword
    await expect(component.getByTestId('menu-item-apple')).toBeVisible()
    await expect(component.getByTestId('menu-item-banana')).toBeVisible()
    await expect(component.getByTestId('menu-item-date')).toBeVisible()

    // Vegetables should not match
    await expect(component.getByTestId('menu-item-carrot')).not.toBeVisible()
    await expect(component.getByTestId('menu-item-eggplant')).not.toBeVisible()
  })

  test('should handle fuzzy matching', async ({ mount }) => {
    const component = await mount(
      <ControlledTestApp menuDef={searchableMenuDef} initialOpen={true} />,
    )

    const input = component.getByTestId('menu-input')

    // Type partial/fuzzy query
    await input.fill('bna')

    // Should match 'banana' with fuzzy search
    await expect(component.getByTestId('menu-item-banana')).toBeVisible()
  })

  test('should show empty state when no results', async ({ mount }) => {
    const component = await mount(
      <ControlledTestApp menuDef={searchableMenuDef} initialOpen={true} />,
    )

    const input = component.getByTestId('menu-input')

    // Search for something that doesn't exist
    await input.fill('xyz123')

    // No items should be visible
    await expect(component.getByTestId('menu-item-apple')).not.toBeVisible()
    await expect(component.getByTestId('menu-item-banana')).not.toBeVisible()

    // Empty state should be shown
    const list = component.getByTestId('menu-list')
    await expect(list).toContainText('No results')
  })

  test('should clear search when menu closes', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={searchableMenuDef} initialOpen={true} />,
    )

    const input = component.getByTestId('menu-input')

    // Type search query
    await input.fill('apple')

    // Close menu
    await page.keyboard.press('Escape')

    // Reopen menu
    await component.getByTestId('menu-trigger').click()

    // Input should be cleared
    await expect(input).toHaveValue('')

    // All items should be visible again
    await expect(component.getByTestId('menu-item-apple')).toBeVisible()
    await expect(component.getByTestId('menu-item-banana')).toBeVisible()
  })

  test('should be case insensitive', async ({ mount }) => {
    const component = await mount(
      <ControlledTestApp menuDef={searchableMenuDef} initialOpen={true} />,
    )

    const input = component.getByTestId('menu-input')

    // Search with uppercase
    await input.fill('APPLE')

    // Should still match
    await expect(component.getByTestId('menu-item-apple')).toBeVisible()
  })

  test('should update results as user types', async ({ mount }) => {
    const component = await mount(
      <ControlledTestApp menuDef={searchableMenuDef} initialOpen={true} />,
    )

    const input = component.getByTestId('menu-input')

    // Type 'a'
    await input.fill('a')
    await expect(component.getByTestId('menu-item-apple')).toBeVisible()
    await expect(component.getByTestId('menu-item-banana')).toBeVisible()

    // Type 'ap'
    await input.fill('ap')
    await expect(component.getByTestId('menu-item-apple')).toBeVisible()
    await expect(component.getByTestId('menu-item-banana')).not.toBeVisible()

    // Type 'app'
    await input.fill('app')
    await expect(component.getByTestId('menu-item-apple')).toBeVisible()
  })

  test('should handle search with large lists', async ({ mount }) => {
    const component = await mount(
      <ControlledTestApp menuDef={largeMenuDef} initialOpen={true} />,
    )

    const input = component.getByTestId('menu-input')

    // Search for specific item
    await input.fill('Item 50')

    // Should find the item
    await expect(component.getByTestId('menu-item-item-49')).toBeVisible()

    // Other items should not be visible
    await expect(component.getByTestId('menu-item-item-0')).not.toBeVisible()
    await expect(component.getByTestId('menu-item-item-99')).not.toBeVisible()
  })

  test('should navigate filtered results with keyboard', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp menuDef={searchableMenuDef} initialOpen={true} />,
    )

    const input = component.getByTestId('menu-input')

    // Filter to only fruits
    await input.fill('fruit')

    // Focus should move to first result
    await page.keyboard.press('ArrowDown')

    // Should be able to navigate through filtered results
    await expect(component.getByTestId('menu-item-apple')).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(component.getByTestId('menu-item-banana')).toBeFocused()
  })

  test('should select filtered item with Enter', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={searchableMenuDef} initialOpen={true} />,
    )

    const input = component.getByTestId('menu-input')

    // Filter
    await input.fill('banana')

    // Navigate to result and select
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    // Should select the item
    await expect(component.getByTestId('selected-id')).toHaveText('banana')
  })

  test('should clear search with Escape', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={searchableMenuDef} initialOpen={true} />,
    )

    const input = component.getByTestId('menu-input')

    // Type search
    await input.fill('apple')

    // Press Escape once to clear search
    await page.keyboard.press('Escape')

    // Input should be cleared but menu stays open
    await expect(input).toHaveValue('')
    await expect(component.getByTestId('menu-list')).toBeVisible()

    // Press Escape again to close menu
    await page.keyboard.press('Escape')
    await expect(component.getByTestId('menu-list')).not.toBeVisible()
  })

  test('should handle empty search query', async ({ mount }) => {
    const component = await mount(
      <ControlledTestApp menuDef={searchableMenuDef} initialOpen={true} />,
    )

    const input = component.getByTestId('menu-input')

    // Empty query should show all items
    await expect(input).toHaveValue('')
    await expect(component.getByTestId('menu-item-apple')).toBeVisible()
    await expect(component.getByTestId('menu-item-banana')).toBeVisible()
    await expect(component.getByTestId('menu-item-carrot')).toBeVisible()
  })

  test('should preserve search when navigating with keyboard', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp menuDef={searchableMenuDef} initialOpen={true} />,
    )

    const input = component.getByTestId('menu-input')

    // Type search
    await input.fill('apple')

    // Navigate with keyboard
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowUp')

    // Search query should still be there
    await expect(input).toHaveValue('apple')
  })

  test('should handle special characters in search', async ({ mount }) => {
    const component = await mount(
      <ControlledTestApp menuDef={searchableMenuDef} initialOpen={true} />,
    )

    const input = component.getByTestId('menu-input')

    // Search with special chars should not crash
    await input.fill('test@#$%')

    // Should show no results gracefully
    const list = component.getByTestId('menu-list')
    await expect(list).toBeVisible()
  })
})
