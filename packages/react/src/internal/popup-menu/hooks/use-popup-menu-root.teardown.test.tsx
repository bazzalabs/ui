import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { REASONS } from '../../../utils/events/index.js'
import { usePopupMenuRoot } from './use-popup-menu-root.js'

describe('usePopupMenuRoot tree teardown', () => {
  it('tears the tree down when a controlled open prop goes false', () => {
    const { result } = renderHook(() => usePopupMenuRoot({}))
    const { store, registerSurface, focusOwnerStore, openChainStore } =
      result.current
    const setSurfaceOpen = vi.fn()
    act(() => {
      registerSurface(1, setSurfaceOpen)
      store.update({ openProp: true })
      focusOwnerStore.setOwnerId('submenu-surface')
      openChainStore.open('submenu-surface')
    })
    expect(setSurfaceOpen).not.toHaveBeenCalled()

    act(() => {
      store.update({ openProp: false })
      // Torn down in the same update that applied the prop.
      expect(setSurfaceOpen).toHaveBeenCalledWith(false)
      expect(focusOwnerStore.state.ownerId).toBeNull()
    })
  })

  it('leaves the tree as it was when a close is cancelled', () => {
    const { result } = renderHook(() =>
      usePopupMenuRoot({
        defaultOpen: true,
        onOpenChange: (_open, details) => details.cancel(),
      }),
    )
    const { registerSurface, focusOwnerStore, closeAll, handleOpenChange } =
      result.current
    const setSurfaceOpen = vi.fn()
    act(() => {
      registerSurface(1, setSurfaceOpen)
      focusOwnerStore.setOwnerId('submenu-surface')
    })

    act(() => {
      closeAll(REASONS.escapeKey)
      handleOpenChange(false, REASONS.escapeKey)
    })

    expect(result.current.store.select('open')).toBe(true)
    expect(setSurfaceOpen).not.toHaveBeenCalled()
    expect(focusOwnerStore.state.ownerId).toBe('submenu-surface')
  })
})
