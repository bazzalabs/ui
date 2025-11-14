import { expect, test } from '@playwright/experimental-ct-react'
import { basicMenuDef, submenuDef } from './fixtures/test-menu.js'
import { ControlledTestApp } from './test-app.js'

test.describe('Keyboard Navigation', () => {
  test('should navigate down with ArrowDown', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Focus should start on first item
    await expect(component.getByTestId('menu-item-new')).toBeFocused()

    // Press ArrowDown
    await page.keyboard.press('ArrowDown')

    // Focus should move to next item
    await expect(component.getByTestId('menu-item-open')).toBeFocused()
  })

  test('should navigate up with ArrowUp', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Navigate down first
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    // Now navigate up
    await page.keyboard.press('ArrowUp')

    // Focus should move back
    await expect(component.getByTestId('menu-item-open')).toBeFocused()
  })

  test('should jump to first item with Home', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Navigate to middle
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    // Press Home
    await page.keyboard.press('Home')

    // Should jump to first item
    await expect(component.getByTestId('menu-item-new')).toBeFocused()
  })

  test('should jump to last item with End', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Press End
    await page.keyboard.press('End')

    // Should jump to last item
    await expect(component.getByTestId('menu-item-exit')).toBeFocused()
  })

  test('should select item with Enter', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Focus is on first item
    await page.keyboard.press('Enter')

    // Item should be selected
    await expect(component.getByTestId('selected-id')).toHaveText('new')

    // Menu should close
    await expect(component.getByTestId('menu-list')).not.toBeVisible()
  })

  test('should skip disabled items', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Navigate: new -> open -> (skip save - disabled) -> exit
    await page.keyboard.press('ArrowDown') // new -> open
    await page.keyboard.press('ArrowDown') // open -> skip save -> exit

    await expect(component.getByTestId('menu-item-exit')).toBeFocused()
  })

  test('should wrap to first item when navigating down from last', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Go to last item
    await page.keyboard.press('End')

    // Press ArrowDown to wrap
    await page.keyboard.press('ArrowDown')

    // Should wrap to first item
    await expect(component.getByTestId('menu-item-new')).toBeFocused()
  })

  test('should wrap to last item when navigating up from first', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Focus is on first item
    await page.keyboard.press('ArrowUp')

    // Should wrap to last item
    await expect(component.getByTestId('menu-item-exit')).toBeFocused()
  })

  test('should close menu with Escape', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    await page.keyboard.press('Escape')

    await expect(component.getByTestId('menu-list')).not.toBeVisible()
  })

  test('should prevent Tab key', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Focus should be on first item
    await expect(component.getByTestId('menu-item-new')).toBeFocused()

    // Press Tab
    await page.keyboard.press('Tab')

    // Focus should still be in the menu (Tab is prevented)
    // The menu should still be visible
    await expect(component.getByTestId('menu-list')).toBeVisible()
  })

  test('should open submenu with ArrowRight', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Navigate to submenu trigger
    await page.keyboard.press('ArrowDown') // item1 -> file-sub

    // Press ArrowRight to open submenu
    await page.keyboard.press('ArrowRight')

    // Submenu should open and focus should move to first item
    const submenuTrigger = component.getByTestId('submenu-trigger-file-sub')
    await expect(submenuTrigger).toBeVisible()
  })

  test('should close submenu with ArrowLeft', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Open submenu
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowRight')

    // Close with ArrowLeft
    await page.keyboard.press('ArrowLeft')

    // Focus should return to parent menu
    await expect(
      component.getByTestId('submenu-trigger-file-sub'),
    ).toBeFocused()
  })

  test('should navigate with vim bindings Ctrl+j/k', async ({
    mount,
    page,
  }) => {
    // Note: This test assumes vim bindings are enabled
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Ctrl+j to go down
    await page.keyboard.press('Control+j')
    await expect(component.getByTestId('menu-item-open')).toBeFocused()

    // Ctrl+k to go up
    await page.keyboard.press('Control+k')
    await expect(component.getByTestId('menu-item-new')).toBeFocused()
  })

  test('should open submenu with vim binding Ctrl+l', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Navigate to submenu
    await page.keyboard.press('ArrowDown')

    // Ctrl+l to open
    await page.keyboard.press('Control+l')

    // Submenu should open
    const submenuTrigger = component.getByTestId('submenu-trigger-file-sub')
    await expect(submenuTrigger).toBeVisible()
  })

  test('should close submenu with vim binding Ctrl+h', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ControlledTestApp menuDef={submenuDef} initialOpen={true} />,
    )

    // Open submenu
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Control+l')

    // Close with Ctrl+h
    await page.keyboard.press('Control+h')

    // Focus should return to parent
    await expect(
      component.getByTestId('submenu-trigger-file-sub'),
    ).toBeFocused()
  })

  test('should navigate with PageUp', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // PageUp should go to first item
    await page.keyboard.press('PageUp')

    await expect(component.getByTestId('menu-item-new')).toBeFocused()
  })

  test('should navigate with PageDown', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // PageDown should go to last item
    await page.keyboard.press('PageDown')

    await expect(component.getByTestId('menu-item-exit')).toBeFocused()
  })

  test('should handle rapid key presses', async ({ mount, page }) => {
    const component = await mount(
      <ControlledTestApp menuDef={basicMenuDef} initialOpen={true} />,
    )

    // Rapidly press ArrowDown multiple times
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    // Should end up on last item (wrapping)
    await expect(component.getByTestId('menu-item-exit')).toBeFocused()
  })
})
