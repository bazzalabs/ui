import { screen } from '@testing-library/react'
import { expect, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

/**
 * Waits until Base UI has positioned a popup. Positioners render with
 * `opacity: 0` until the first position is computed, so geometry read before
 * this resolves is the unpositioned placeholder.
 */
export async function waitForPositioned(positioner: HTMLElement) {
  await vi.waitFor(() => {
    expect(positioner.style.opacity).not.toBe('0')
    expect(positioner).toBeVisible()
  })
}

/** Finds a positioner by test ID and waits until Base UI has positioned it. */
export async function findPositioned(testId: string) {
  const positioner = await screen.findByTestId(testId)
  await waitForPositioned(positioner)
  return positioner
}

/**
 * Moves the Playwright pointer off whatever the previous test left it over.
 * The pointer position persists between tests in the same file, so without
 * this a test can start with a stale hover.
 */
export async function resetBrowserPointer() {
  await userEvent.unhover(document.body)
}
