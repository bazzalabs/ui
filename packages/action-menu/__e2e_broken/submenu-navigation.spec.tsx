import { expect, test } from '@playwright/experimental-ct-react'
import { submenuDef } from './fixtures/test-menu.js'
import { ControlledTestApp } from './test-app.js'

test.describe('Submenu Navigation', () => {
  test('should open submenu on hover', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    const submenuTrigger = component.getByTestId('submenu-trigger-file-sub')

    // Hover over submenu trigger
    await submenuTrigger.hover()

    // Wait a bit for hover delay
    await page.waitForTimeout(200)

    // Submenu content should be visible
    // Check for submenu items
    await expect(component.getByTestId('menu-item-file-new')).toBeVisible()
    await expect(component.getByTestId('menu-item-file-open')).toBeVisible()
  })

  test('should open submenu with keyboard ArrowRight', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Navigate to submenu trigger
    await page.keyboard.press('ArrowDown') // item1 -> file-sub

    const submenuTrigger = component.getByTestId('submenu-trigger-file-sub')
    await expect(submenuTrigger).toBeFocused()

    // Open with ArrowRight
    await page.keyboard.press('ArrowRight')

    // Submenu should open
    await expect(component.getByTestId('menu-item-file-new')).toBeVisible()
  })

  test('should open submenu with Enter key', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Navigate to submenu
    await page.keyboard.press('ArrowDown')

    // Press Enter to open
    await page.keyboard.press('Enter')

    // Submenu should open
    await expect(component.getByTestId('menu-item-file-new')).toBeVisible()
  })

  test('should close submenu with ArrowLeft', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Open submenu
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowRight')

    // Verify submenu is open
    await expect(component.getByTestId('menu-item-file-new')).toBeVisible()

    // Close with ArrowLeft
    await page.keyboard.press('ArrowLeft')

    // Submenu should close
    await expect(component.getByTestId('menu-item-file-new')).not.toBeVisible()

    // Focus should return to trigger
    await expect(
      component.getByTestId('submenu-trigger-file-sub'),
    ).toBeFocused()
  })

  test('should close submenu with Escape', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Open submenu
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowRight')

    // Close with Escape
    await page.keyboard.press('Escape')

    // Submenu should close
    await expect(component.getByTestId('menu-item-file-new')).not.toBeVisible()
  })

  test('should navigate to nested submenu', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Navigate to first submenu
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowRight')

    // Now in File submenu, navigate to Recent submenu
    await page.keyboard.press('ArrowDown') // file-new
    await page.keyboard.press('ArrowDown') // file-open
    await page.keyboard.press('ArrowDown') // file-recent

    // Open nested submenu
    await page.keyboard.press('ArrowRight')

    // Nested submenu items should be visible
    await expect(component.getByTestId('menu-item-recent-1')).toBeVisible()
    await expect(component.getByTestId('menu-item-recent-2')).toBeVisible()
  })

  test('should close all submenus when pressing Escape multiple times', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Open first level submenu
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowRight')

    // Open second level submenu
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowRight')

    // Verify nested submenu is open
    await expect(component.getByTestId('menu-item-recent-1')).toBeVisible()

    // Press Escape once - closes nested submenu
    await page.keyboard.press('Escape')
    await expect(component.getByTestId('menu-item-recent-1')).not.toBeVisible()
    await expect(component.getByTestId('menu-item-file-new')).toBeVisible()

    // Press Escape again - closes first level submenu
    await page.keyboard.press('Escape')
    await expect(component.getByTestId('menu-item-file-new')).not.toBeVisible()

    // Press Escape again - closes main menu
    await page.keyboard.press('Escape')
    await expect(component.getByTestId('menu-list')).not.toBeVisible()
  })

  test('should handle mouse hover on nested submenus', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Hover on first submenu trigger
    const fileTrigger = component.getByTestId('submenu-trigger-file-sub')
    await fileTrigger.hover()
    await page.waitForTimeout(200)

    // File submenu should be open
    await expect(component.getByTestId('menu-item-file-new')).toBeVisible()

    // Hover on nested submenu trigger
    const recentTrigger = component.getByTestId('submenu-trigger-file-recent')
    await recentTrigger.hover()
    await page.waitForTimeout(200)

    // Nested submenu should be open
    await expect(component.getByTestId('menu-item-recent-1')).toBeVisible()
  })

  test('should select item in submenu', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Navigate into submenu
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowRight')

    // Select an item
    await page.keyboard.press('Enter')

    // Item should be selected
    await expect(component.getByTestId('selected-id')).toHaveText('file-new')

    // Menu should close
    await expect(component.getByTestId('menu-list')).not.toBeVisible()
  })

  test('should handle clicking submenu item', async ({ mount }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    const fileTrigger = component.getByTestId('submenu-trigger-file-sub')
    await fileTrigger.click()

    // Click a submenu item
    await component.getByTestId('menu-item-file-open').click()

    // Should be selected
    await expect(component.getByTestId('selected-id')).toHaveText('file-open')
  })

  test('should maintain focus when moving mouse between items', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Use keyboard to navigate
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown') // on item2

    const item2 = component.getByTestId('menu-item-item2')
    await expect(item2).toBeFocused()

    // Move mouse to different item (should not change keyboard focus)
    const item1 = component.getByTestId('menu-item-item1')
    await item1.hover()

    // Keyboard focus should stay on item2
    await expect(item2).toBeFocused()
  })

  test('should navigate back through submenu levels', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Navigate deep into nested submenus
    await page.keyboard.press('ArrowDown') // to file-sub
    await page.keyboard.press('ArrowRight') // open file-sub
    await page.keyboard.press('ArrowDown') // file-new
    await page.keyboard.press('ArrowDown') // file-open
    await page.keyboard.press('ArrowDown') // file-recent
    await page.keyboard.press('ArrowRight') // open file-recent

    // We're now in the nested Recent submenu
    await expect(component.getByTestId('menu-item-recent-1')).toBeVisible()

    // Navigate back with ArrowLeft
    await page.keyboard.press('ArrowLeft')

    // Back to File submenu
    await expect(component.getByTestId('menu-item-file-new')).toBeVisible()
    await expect(component.getByTestId('menu-item-recent-1')).not.toBeVisible()

    // Navigate back again
    await page.keyboard.press('ArrowLeft')

    // Back to root menu
    await expect(component.getByTestId('menu-item-item1')).toBeVisible()
    await expect(component.getByTestId('menu-item-file-new')).not.toBeVisible()
  })

  test('should close submenu when hovering different root item', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Open submenu with hover
    const fileTrigger = component.getByTestId('submenu-trigger-file-sub')
    await fileTrigger.hover()
    await page.waitForTimeout(200)

    // Submenu should be open
    await expect(component.getByTestId('menu-item-file-new')).toBeVisible()

    // Hover over a different root item
    const item2 = component.getByTestId('menu-item-item2')
    await item2.hover()
    await page.waitForTimeout(200)

    // Submenu should close
    await expect(component.getByTestId('menu-item-file-new')).not.toBeVisible()
  })

  test('should handle rapid submenu open/close', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Rapidly open and close submenu
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowLeft')

    // Should end up closed
    await expect(component.getByTestId('menu-item-file-new')).not.toBeVisible()

    // Trigger should be focused
    await expect(
      component.getByTestId('submenu-trigger-file-sub'),
    ).toBeFocused()
  })
})
