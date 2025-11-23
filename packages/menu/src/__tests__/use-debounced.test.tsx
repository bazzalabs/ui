/**
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useDebounced } from '../hooks/use-debounced.js'

describe('useDebounced', () => {
  describe('basic debouncing', () => {
    it('debounces value changes by specified delay', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounced(value, delay),
        {
          initialProps: { value: 'first', delay: 100 },
        },
      )

      // Initial value should be set immediately
      expect(result.current).toBe('first')

      // Change value
      rerender({ value: 'second', delay: 100 })

      // Value should still be 'first' before delay
      expect(result.current).toBe('first')

      // Wait for debounce delay
      await waitFor(() => expect(result.current).toBe('second'), {
        timeout: 200,
      })
    })

    it('returns value immediately when delay is 0', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounced(value, delay),
        {
          initialProps: { value: 'first', delay: 0 },
        },
      )

      expect(result.current).toBe('first')

      // Change value
      rerender({ value: 'second', delay: 0 })

      // Should update immediately
      expect(result.current).toBe('second')
    })

    it('handles multiple rapid value changes', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounced(value, delay),
        {
          initialProps: { value: 'first', delay: 100 },
        },
      )

      // Make multiple rapid changes
      rerender({ value: 'second', delay: 100 })
      rerender({ value: 'third', delay: 100 })
      rerender({ value: 'fourth', delay: 100 })

      // Value should still be 'first'
      expect(result.current).toBe('first')

      // Wait for debounce delay - should only apply the last value
      await waitFor(() => expect(result.current).toBe('fourth'), {
        timeout: 200,
      })
    })
  })

  describe('cleanup behavior', () => {
    it('cleans up timeout on unmount', async () => {
      vi.useFakeTimers()

      const { result, rerender, unmount } = renderHook(
        ({ value, delay }) => useDebounced(value, delay),
        {
          initialProps: { value: 'first', delay: 100 },
        },
      )

      rerender({ value: 'second', delay: 100 })

      // Unmount before timeout fires
      unmount()

      // Advance time
      vi.advanceTimersByTime(100)

      // Value should not have changed
      expect(result.current).toBe('first')

      vi.useRealTimers()
    })

    it('respects timeout cleanup on value changes', async () => {
      // This test verifies the debounce only applies the latest value
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounced(value, delay),
        {
          initialProps: { value: 'first', delay: 50 },
        },
      )

      // Make multiple rapid changes
      rerender({ value: 'second', delay: 50 })
      rerender({ value: 'third', delay: 50 })
      rerender({ value: 'fourth', delay: 50 })

      // Wait for debounce - should skip intermediate values
      await waitFor(
        () => {
          expect(result.current).toBe('fourth')
        },
        { timeout: 150 },
      )
    })
  })

  describe('delay changes', () => {
    it('applies new delay when delay changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounced(value, delay),
        {
          initialProps: { value: 'first', delay: 100 },
        },
      )

      // Change delay to 0 (immediate)
      rerender({ value: 'second', delay: 0 })

      // Should update immediately with delay:0
      expect(result.current).toBe('second')
    })
  })

  describe('type safety', () => {
    it('preserves type of debounced value', () => {
      const { result } = renderHook(() => useDebounced(42, 100))
      expect(typeof result.current).toBe('number')
    })

    it('works with string values', () => {
      const { result } = renderHook(() => useDebounced('hello', 0))
      expect(typeof result.current).toBe('string')
      expect(result.current).toBe('hello')
    })

    it('works with object values', () => {
      const obj = { name: 'test' }
      const { result } = renderHook(() => useDebounced(obj, 0))
      expect(result.current).toBe(obj)
    })
  })
})
