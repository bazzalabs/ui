import { fireEvent, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useHotkey } from './use-hotkey.js'

describe('useHotkey', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fires on an exact chord', () => {
    const handler = vi.fn()

    renderHook(() => useHotkey('ctrl+k', handler))

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not fire with extra or missing modifiers', () => {
    const handler = vi.fn()

    renderHook(() => useHotkey('ctrl+k', handler))

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true, shiftKey: true })
    fireEvent.keyDown(document, { key: 'k' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('guards editable targets unless allowInInput is true', () => {
    const handler = vi.fn()
    const input = document.createElement('input')
    document.body.appendChild(input)

    const { rerender } = renderHook(
      ({ allowInInput }) => useHotkey('ctrl+k', handler, { allowInInput }),
      { initialProps: { allowInInput: false } },
    )

    fireEvent.keyDown(input, { key: 'k', ctrlKey: true })

    expect(handler).not.toHaveBeenCalled()

    rerender({ allowInInput: true })
    fireEvent.keyDown(input, { key: 'k', ctrlKey: true })

    expect(handler).toHaveBeenCalledTimes(1)

    input.remove()
  })

  it('respects enabled false and removes the listener on unmount', () => {
    const handler = vi.fn()

    const { rerender, unmount } = renderHook(
      ({ enabled }) => useHotkey('ctrl+k', handler, { enabled }),
      { initialProps: { enabled: false } },
    )

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(handler).not.toHaveBeenCalled()

    rerender({ enabled: true })
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(handler).toHaveBeenCalledTimes(1)

    unmount()
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('warns in dev and never fires for sequence bindings', () => {
    const handler = vi.fn()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    renderHook(() => useHotkey('g i', handler))

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('sequences are not supported by useHotkey'),
    )

    fireEvent.keyDown(document, { key: 'g' })
    fireEvent.keyDown(document, { key: 'i' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('silently ignores an empty binding', () => {
    const handler = vi.fn()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const addEventListener = vi.spyOn(document, 'addEventListener')

    renderHook(() => useHotkey('', handler))

    expect(warn).not.toHaveBeenCalled()
    expect(
      addEventListener.mock.calls.some(
        ([eventName]) => eventName === 'keydown',
      ),
    ).toBe(false)

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(handler).not.toHaveBeenCalled()
  })
})
