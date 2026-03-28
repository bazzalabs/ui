import '@testing-library/jest-dom/vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import { afterEach, expect, vi } from 'vitest'

// Extend vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock requestAnimationFrame for jsdom
if (typeof window !== 'undefined') {
  window.requestAnimationFrame = (callback) => {
    return setTimeout(() => callback(Date.now()), 0) as unknown as number
  }
  window.cancelAnimationFrame = (id) => {
    clearTimeout(id)
  }
}

// Suppress specific React warnings in tests
const originalError = console.error
console.error = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
      args[0].includes('Warning: An update to'))
  ) {
    return
  }
  originalError.call(console, ...args)
}
