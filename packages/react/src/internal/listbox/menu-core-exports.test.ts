import { describe, expect, it } from 'vitest'
import {
  commandScore,
  defaultFilter,
  normalizeValue,
  slugify,
} from './index.js'

// `@bazza-ui/react/internal/listbox` keeps exporting the text helpers that
// moved to `@bazza-ui/menu-core`.
describe('internal/listbox entry', () => {
  it('serves the text helpers from menu-core', () => {
    expect(commandScore('apple', 'app')).toBeGreaterThan(
      commandScore('apple', 'ale'),
    )
    expect(defaultFilter).toBe(commandScore)
    expect(normalizeValue('  Settings ')).toBe('Settings')
    expect(slugify('User Settings')).toBe('user-settings')
  })
})
