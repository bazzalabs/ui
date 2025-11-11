import { expect, test } from '@playwright/experimental-ct-react'
import { basicMenuDef, checkboxMenuDef } from './fixtures/test-menu.js'
import { ControlledTestApp } from './test-app.js'

test.describe('Basic Interactions', () => {
  test('should open menu when trigger is clicked', async ({ mount }) => {
    const component = await mount(<ControlledTestApp menuDef={basicMenuDef} />)

    // Menu should be closed initially
    await expect(component.getByTestId('menu-list')).not.toBeVisible()

    // Click trigger
    await component.getByTestId('menu-trigger').click()

    // Menu should now be open
    await expect(component.getByTestId('menu-list')).toBeVisible()
  })

  test('should close menu when clicking outside', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Menu should be open initially
    await expect(component.getByTestId('menu-list')).toBeVisible()

    // Click outside the menu
    await page.mouse.click(10, 10)

    // Menu should close
    await expect(component.getByTestId('menu-list')).not.toBeVisible()
  })

  test('should close menu when pressing Escape', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Menu should be open
    await expect(component.getByTestId('menu-list')).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Menu should close
    await expect(component.getByTestId('menu-list')).not.toBeVisible()
  })

  test('should display all menu items', async ({ mount }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Check that all items from basicMenuDef are visible
    await expect(component.getByTestId('menu-item-new')).toBeVisible()
    await expect(component.getByTestId('menu-item-open')).toBeVisible()
    await expect(component.getByTestId('menu-item-save')).toBeVisible()
    await expect(component.getByTestId('menu-item-exit')).toBeVisible()
  })

  test('should handle item selection', async ({ mount }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Click an item
    await component.getByTestId('menu-item-new').click()

    // Check that selection was registered
    await expect(component.getByTestId('selected-id')).toHaveText('new')
  })

  test('should not allow selecting disabled items', async ({ mount }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // The 'save' item is disabled in basicMenuDef
    const saveItem = component.getByTestId('menu-item-save')

    // Item should be visible but disabled
    await expect(saveItem).toBeVisible()
    await expect(saveItem).toBeDisabled()

    // Try to click it
    await saveItem.click({ force: true })

    // Selection should not change
    await expect(component.getByTestId('selected-id')).toHaveText('')
  })

  test('should close menu after selecting an item by default', async ({
    mount,
  }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Click an item
    await component.getByTestId('menu-item-new').click()

    // Menu should close
    await expect(component.getByTestId('menu-list')).not.toBeVisible()
  })

  test('should handle multiple open/close cycles', async ({ mount }) => {
    const component = await mount(<ControlledTestApp menuDef={basicMenuDef} />)

    const trigger = component.getByTestId('menu-trigger')
    const list = component.getByTestId('menu-list')

    // Open
    await trigger.click()
    await expect(list).toBeVisible()

    // Close
    await trigger.click()
    await expect(list).not.toBeVisible()

    // Open again
    await trigger.click()
    await expect(list).toBeVisible()

    // Close again
    await trigger.click()
    await expect(list).not.toBeVisible()
  })

  test('should handle checkbox items', async ({ mount }) => {
    const component = await mount(
      <ControlledTestApp menuDef={checkboxMenuDef} initialOpen={true} />,
    )

    const checkbox1 = component.getByTestId('menu-item-option1')

    // Checkbox should be visible
    await expect(checkbox1).toBeVisible()

    // Click checkbox
    await checkbox1.click()

    // Menu should stay open for checkboxes
    await expect(component.getByTestId('menu-list')).toBeVisible()
  })

  test('should return focus to trigger when menu closes', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Close menu with Escape
    await page.keyboard.press('Escape')

    // Focus should return to trigger
    const trigger = component.getByTestId('menu-trigger')
    await expect(trigger).toBeFocused()
  })
})
