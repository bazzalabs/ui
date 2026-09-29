import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach } from 'vitest'
import { resetBrowserPointer } from './browser.js'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

// Browser tests drive real input through Playwright, and those events reach
// React outside any `act()` scope. Testing Library turns React's act
// environment on in its own `beforeAll`; turn it back off so React doesn't
// warn about every update. `render()` still enables it for its own duration.
beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = false
})

beforeEach(async () => {
  await resetBrowserPointer()
})

afterEach(() => {
  cleanup()
})
