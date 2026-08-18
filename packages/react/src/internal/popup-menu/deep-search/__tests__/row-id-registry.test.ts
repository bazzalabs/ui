import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRowIdRegistry } from '../row-id-registry.js'

describe('RowIdRegistry', () => {
  afterEach(() => vi.restoreAllMocks())

  it('warns once for a duplicate id across surfaces', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const registry = createRowIdRegistry()

    registry.report('surface-a', ['shared'])
    registry.report('surface-b', ['shared'])
    registry.report('surface-b', ['shared'])
    registry.unregister('surface-b')
    registry.report('surface-b', ['shared'])

    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('does not warn for disjoint ids', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const registry = createRowIdRegistry()

    registry.report('surface-a', ['one'])
    registry.report('surface-b', ['two'])

    expect(warn).not.toHaveBeenCalled()
  })
})
