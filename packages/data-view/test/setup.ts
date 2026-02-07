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
