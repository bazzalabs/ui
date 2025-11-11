import { expect, test } from '@playwright/experimental-ct-react'
import type { MenuDef } from '../src/types.js'
import { ControlledTestApp } from './test-app.js'

const testMenuDef: MenuDef = {
  id: 'test-menu',
  nodes: [
    { kind: 'item', id: 'item1', label: 'Item 1' },
    { kind: 'item', id: 'item2', label: 'Item 2' },
    { kind: 'item', id: 'item3', label: 'Item 3' },
    { kind: 'item', id: 'apple', label: 'Apple' },
    { kind: 'item', id: 'apricot', label: 'Apricot' },
  ],
}

const submenuTestDef: MenuDef = {
  id: 'submenu-test-menu',
  nodes: [
    { kind: 'item', id: 'root-item', label: 'Root Item' },
    {
      kind: 'submenu',
      id: 'submenu',
      label: 'Submenu',
      nodes: [
        { kind: 'item', id: 'sub-item1', label: 'Sub Item 1' },
        { kind: 'item', id: 'sub-item2', label: 'Sub Item 2' },
        { kind: 'item', id: 'sub-apple', label: 'Sub Apple' },
      ],
    },
  ],
}

test.describe('hideSearchUntilActive', () => {
  test('input should be hidden by default when hideSearchUntilActive is true', async ({
    mount,
  }) => {
    const component = await mount(
      <ControlledTestApp
        menuDef={testMenuDef}
        initialOpen={true}
        hideSearchUntilActive={true}
      />,
    )

    // Input should not be visible on initial open
    const input = component.getByTestId('menu-input')
    await expect(input).not.toBeVisible()
  })

  test('input should be visible by default when hideSearchUntilActive is false', async ({
    mount,
  }) => {
    const component = await mount(
      <ControlledTestApp
        menuDef={testMenuDef}
        initialOpen={true}
        hideSearchUntilActive={false}
      />,
    )

    // Input should be visible on initial open
    const input = component.getByTestId('menu-input')
    await expect(input).toBeVisible()
  })

  test('input should be visible by default when hideSearchUntilActive is not set', async ({
    mount,
  }) => {
    const component = await mount(
      <ControlledTestApp menuDef={testMenuDef} initialOpen={true} />,
    )

    // Input should be visible on initial open (default behavior)
    const input = component.getByTestId('menu-input')
    await expect(input).toBeVisible()
  })

  test('keyboard navigation should NOT make input visible', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp
        menuDef={testMenuDef}
        initialOpen={true}
        hideSearchUntilActive={true}
      />,
    )

    const input = component.getByTestId('menu-input')
    await expect(input).not.toBeVisible()

    // Try various keyboard navigation keys
    await page.keyboard.press('ArrowDown')
    await expect(input).not.toBeVisible()

    await page.keyboard.press('ArrowDown')
    await expect(input).not.toBeVisible()

    await page.keyboard.press('ArrowUp')
    await expect(input).not.toBeVisible()

    await page.keyboard.press('Home')
    await expect(input).not.toBeVisible()

    await page.keyboard.press('End')
    await expect(input).not.toBeVisible()
  })

  test('typing should make input visible', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp
        menuDef={testMenuDef}
        initialOpen={true}
        hideSearchUntilActive={true}
      />,
    )

    const input = component.getByTestId('menu-input')
    await expect(input).not.toBeVisible()

    // Start typing
    await page.keyboard.type('a')

    // Input should now be visible
    await expect(input).toBeVisible()

    // Input should have the typed character
    await expect(input).toHaveValue('a')
  })

  test('input should stay visible after clearing query', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp
        menuDef={testMenuDef}
        initialOpen={true}
        hideSearchUntilActive={true}
      />,
    )

    const input = component.getByTestId('menu-input')
    await expect(input).not.toBeVisible()

    // Type something to make input visible
    await page.keyboard.type('apple')
    await expect(input).toBeVisible()
    await expect(input).toHaveValue('apple')

    // Clear the input
    await input.fill('')
    await expect(input).toHaveValue('')

    // Input should STILL be visible
    await expect(input).toBeVisible()
  })

  test('input should reset (hide) when menu is closed and reopened', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp
        menuDef={testMenuDef}
        initialOpen={true}
        hideSearchUntilActive={true}
      />,
    )

    const input = component.getByTestId('menu-input')
    const menuList = component.getByTestId('menu-list')

    // Make input visible by typing
    await page.keyboard.type('apple')
    await expect(input).toBeVisible()

    // Close menu
    await page.keyboard.press('Escape')
    await expect(menuList).not.toBeVisible()

    // Reopen menu
    await component.getByTestId('menu-trigger').click()
    await expect(menuList).toBeVisible()

    // Input should be hidden again
    await expect(input).not.toBeVisible()
  })

  test('should work correctly in submenus', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp
        menuDef={submenuTestDef}
        initialOpen={true}
        hideSearchUntilActive={true}
      />,
    )

    const input = component.getByTestId('menu-input')
    await expect(input).not.toBeVisible()

    // Navigate to submenu
    await page.keyboard.press('ArrowDown') // to submenu trigger
    await page.keyboard.press('ArrowRight') // open submenu

    // Input should still not be visible in submenu
    await expect(input).not.toBeVisible()

    // Navigate within submenu
    await page.keyboard.press('ArrowDown')
    await expect(input).not.toBeVisible()

    // Type to make input visible
    await page.keyboard.type('apple')
    await expect(input).toBeVisible()

    // Should filter submenu items
    await expect(component.getByTestId('menu-item-sub-apple')).toBeVisible()
  })

  test('should allow selecting items without visible input', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp
        menuDef={testMenuDef}
        initialOpen={true}
        hideSearchUntilActive={true}
      />,
    )

    const input = component.getByTestId('menu-input')
    await expect(input).not.toBeVisible()

    // Navigate and select item using keyboard only
    await page.keyboard.press('ArrowDown') // to item2
    await page.keyboard.press('Enter')

    // Item should be selected
    await expect(component.getByTestId('selected-id')).toHaveText('item2')

    // Menu should close
    await expect(component.getByTestId('menu-list')).not.toBeVisible()
  })

  test('input should become visible and filter results when typing', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp
        menuDef={testMenuDef}
        initialOpen={true}
        hideSearchUntilActive={true}
      />,
    )

    const input = component.getByTestId('menu-input')
    await expect(input).not.toBeVisible()

    // Type search query
    await page.keyboard.type('appl')

    // Input should be visible
    await expect(input).toBeVisible()

    // Results should be filtered
    await expect(component.getByTestId('menu-item-apple')).toBeVisible()
    await expect(component.getByTestId('menu-item-item1')).not.toBeVisible()
    await expect(component.getByTestId('menu-item-item2')).not.toBeVisible()
  })

  test('clicking trigger should hide input again on reopen', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp
        menuDef={testMenuDef}
        initialOpen={true}
        hideSearchUntilActive={true}
      />,
    )

    const input = component.getByTestId('menu-input')
    const trigger = component.getByTestId('menu-trigger')

    // Make input visible
    await page.keyboard.type('test')
    await expect(input).toBeVisible()

    // Close with trigger (click outside or escape)
    await page.keyboard.press('Escape')

    // Reopen with trigger
    await trigger.click()

    // Input should be hidden again
    await expect(input).not.toBeVisible()
  })
})
