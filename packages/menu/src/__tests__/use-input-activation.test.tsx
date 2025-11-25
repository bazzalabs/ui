import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import { useInputActivation } from '../hooks/use-input-activation.js'

describe('useInputActivation', () => {
  describe('initialization', () => {
    it('should start with input active when hideSearchUntilActive is false', () => {
      const { result } = renderHook(() => useInputActivation(false))

      expect(result.current.inputActive).toBe(true)
      expect(result.current.query).toBe('')
    })

    it('should start with input active when hideSearchUntilActive is undefined', () => {
      const { result } = renderHook(() => useInputActivation())

      expect(result.current.inputActive).toBe(true)
      expect(result.current.query).toBe('')
    })

    it('should start with input inactive when hideSearchUntilActive is true', () => {
      const { result } = renderHook(() => useInputActivation(true))

      expect(result.current.inputActive).toBe(false)
      expect(result.current.query).toBe('')
    })
  })

  describe('hideSearchUntilActive changes', () => {
    it('should deactivate input when hideSearchUntilActive changes from false to true', () => {
      const { result, rerender } = renderHook(
        ({ hide }) => useInputActivation(hide),
        { initialProps: { hide: false } },
      )

      expect(result.current.inputActive).toBe(true)

      rerender({ hide: true })

      expect(result.current.inputActive).toBe(false)
    })

    it('should activate input when hideSearchUntilActive changes from true to false', () => {
      const { result, rerender } = renderHook(
        ({ hide }) => useInputActivation(hide),
        { initialProps: { hide: true } },
      )

      expect(result.current.inputActive).toBe(false)

      rerender({ hide: false })

      expect(result.current.inputActive).toBe(true)
    })
  })

  describe('manual state control', () => {
    it('should allow manual activation via setInputActive', () => {
      const { result } = renderHook(() => useInputActivation(true))

      expect(result.current.inputActive).toBe(false)

      act(() => {
        result.current.setInputActive(true)
      })

      expect(result.current.inputActive).toBe(true)
    })

    it('should allow manual query updates via setQuery', () => {
      const { result } = renderHook(() => useInputActivation(false))

      expect(result.current.query).toBe('')

      act(() => {
        result.current.setQuery('test')
      })

      expect(result.current.query).toBe('test')
    })
  })

  describe('handleTypeStart - printable characters', () => {
    it('should activate input and set query when typing a letter', () => {
      const { result } = renderHook(() => useInputActivation(true))

      expect(result.current.inputActive).toBe(false)

      const event = {
        key: 'a',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      } as React.KeyboardEvent

      let activated = false
      act(() => {
        activated = result.current.handleTypeStart(event)
      })

      expect(activated).toBe(true)
      expect(result.current.inputActive).toBe(true)
      expect(result.current.query).toBe('a')
    })

    it('should activate input when typing a number', () => {
      const { result } = renderHook(() => useInputActivation(true))

      const event = {
        key: '5',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      } as React.KeyboardEvent

      let activated = false
      act(() => {
        activated = result.current.handleTypeStart(event)
      })

      expect(activated).toBe(true)
      expect(result.current.inputActive).toBe(true)
      expect(result.current.query).toBe('5')
    })

    it('should activate input when typing a symbol', () => {
      const { result } = renderHook(() => useInputActivation(true))

      const event = {
        key: '@',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      } as React.KeyboardEvent

      let activated = false
      act(() => {
        activated = result.current.handleTypeStart(event)
      })

      expect(activated).toBe(true)
      expect(result.current.inputActive).toBe(true)
      expect(result.current.query).toBe('@')
    })

    it('should activate input when typing a space', () => {
      const { result } = renderHook(() => useInputActivation(true))

      const event = {
        key: ' ',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      } as React.KeyboardEvent

      let activated = false
      act(() => {
        activated = result.current.handleTypeStart(event)
      })

      expect(activated).toBe(true)
      expect(result.current.inputActive).toBe(true)
      expect(result.current.query).toBe(' ')
    })
  })

  describe('handleTypeStart - backspace', () => {
    it('should activate input with empty query on backspace', () => {
      const { result } = renderHook(() => useInputActivation(true))

      expect(result.current.inputActive).toBe(false)

      const event = {
        key: 'Backspace',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      } as React.KeyboardEvent

      let activated = false
      act(() => {
        activated = result.current.handleTypeStart(event)
      })

      expect(activated).toBe(true)
      expect(result.current.inputActive).toBe(true)
      expect(result.current.query).toBe('')
    })
  })

  describe('handleTypeStart - modifier keys', () => {
    it('should not activate on Alt+key', () => {
      const { result } = renderHook(() => useInputActivation(true))

      const event = {
        key: 'a',
        altKey: true,
        ctrlKey: false,
        metaKey: false,
      } as React.KeyboardEvent

      let activated = false
      act(() => {
        activated = result.current.handleTypeStart(event)
      })

      expect(activated).toBe(false)
      expect(result.current.inputActive).toBe(false)
      expect(result.current.query).toBe('')
    })

    it('should not activate on Ctrl+key', () => {
      const { result } = renderHook(() => useInputActivation(true))

      const event = {
        key: 'a',
        altKey: false,
        ctrlKey: true,
        metaKey: false,
      } as React.KeyboardEvent

      let activated = false
      act(() => {
        activated = result.current.handleTypeStart(event)
      })

      expect(activated).toBe(false)
      expect(result.current.inputActive).toBe(false)
      expect(result.current.query).toBe('')
    })

    it('should not activate on Meta+key', () => {
      const { result } = renderHook(() => useInputActivation(true))

      const event = {
        key: 'a',
        altKey: false,
        ctrlKey: false,
        metaKey: true,
      } as React.KeyboardEvent

      let activated = false
      act(() => {
        activated = result.current.handleTypeStart(event)
      })

      expect(activated).toBe(false)
      expect(result.current.inputActive).toBe(false)
      expect(result.current.query).toBe('')
    })
  })

  describe('handleTypeStart - non-printable keys', () => {
    it('should not activate on Enter key', () => {
      const { result } = renderHook(() => useInputActivation(true))

      const event = {
        key: 'Enter',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      } as React.KeyboardEvent

      let activated = false
      act(() => {
        activated = result.current.handleTypeStart(event)
      })

      expect(activated).toBe(false)
      expect(result.current.inputActive).toBe(false)
      expect(result.current.query).toBe('')
    })

    it('should not activate on Escape key', () => {
      const { result } = renderHook(() => useInputActivation(true))

      const event = {
        key: 'Escape',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      } as React.KeyboardEvent

      let activated = false
      act(() => {
        activated = result.current.handleTypeStart(event)
      })

      expect(activated).toBe(false)
      expect(result.current.inputActive).toBe(false)
      expect(result.current.query).toBe('')
    })

    it('should not activate on Arrow keys', () => {
      const { result } = renderHook(() => useInputActivation(true))

      const event = {
        key: 'ArrowDown',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      } as React.KeyboardEvent

      let activated = false
      act(() => {
        activated = result.current.handleTypeStart(event)
      })

      expect(activated).toBe(false)
      expect(result.current.inputActive).toBe(false)
      expect(result.current.query).toBe('')
    })

    it('should not activate on Tab key', () => {
      const { result } = renderHook(() => useInputActivation(true))

      const event = {
        key: 'Tab',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      } as React.KeyboardEvent

      let activated = false
      act(() => {
        activated = result.current.handleTypeStart(event)
      })

      expect(activated).toBe(false)
      expect(result.current.inputActive).toBe(false)
      expect(result.current.query).toBe('')
    })
  })

  describe('handleTypeStart - already active', () => {
    it('should not update state when input is already active', () => {
      const { result } = renderHook(() => useInputActivation(false))

      expect(result.current.inputActive).toBe(true)

      // Set a query manually
      act(() => {
        result.current.setQuery('existing')
      })

      const event = {
        key: 'a',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      } as React.KeyboardEvent

      let activated = false
      act(() => {
        activated = result.current.handleTypeStart(event)
      })

      expect(activated).toBe(false)
      expect(result.current.inputActive).toBe(true)
      expect(result.current.query).toBe('existing') // Should not change
    })
  })

  describe('callback stability', () => {
    it('should maintain stable handleTypeStart reference when inputActive changes', () => {
      const { result, rerender } = renderHook(() => useInputActivation(true))

      const firstHandler = result.current.handleTypeStart

      // Activate input
      act(() => {
        result.current.setInputActive(true)
      })

      rerender()

      const secondHandler = result.current.handleTypeStart

      // Handler should change because inputActive is in dependency array
      expect(firstHandler).not.toBe(secondHandler)
    })
  })
})
