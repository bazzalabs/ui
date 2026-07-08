import { renderHook } from '@testing-library/react'
import type * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useListboxKeyboard } from '../hooks/use-listbox-keyboard.js'
import { FocusZoneStore } from './FocusZoneStore.js'
import { ListboxStore } from './ListboxStore.js'

// ============================================================================
// Test Helpers
// ============================================================================

function createStore() {
  return new FocusZoneStore()
}

function registerZone(
  store: FocusZoneStore,
  id: string,
  surfaceId: string,
  placement: 'header' | 'footer',
  element: HTMLElement | null = null,
) {
  return store.registerZone({
    id,
    surfaceId,
    placement,
    getElement: () => element,
  })
}

function createKeyDownEvent(key: string, shiftKey = false) {
  const event = {
    key,
    shiftKey,
    defaultPrevented: false,
    nativeEvent: { isComposing: false },
    keyCode: 0,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    preventDefault: vi.fn(() => {
      event.defaultPrevented = true
    }),
    stopPropagation: vi.fn(),
  }

  return event as React.KeyboardEvent & typeof event
}

// ============================================================================
// Tests
// ============================================================================

describe('FocusZoneStore', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('zone registration', () => {
    it('registers zones and cleans them up', () => {
      const store = createStore()

      expect(store.hasZones('s1')).toBe(false)
      expect(store.state.registrationVersion).toBe(0)

      const cleanup = registerZone(store, 'z1', 's1', 'header')

      expect(store.hasZones('s1')).toBe(true)
      expect(store.state.registrationVersion).toBe(1)

      cleanup()

      expect(store.hasZones('s1')).toBe(false)
      expect(store.state.registrationVersion).toBe(2)
    })
  })

  describe('zone order', () => {
    it('returns headers, primary, then footers for a surface', () => {
      const store = createStore()

      registerZone(store, 'h1', 's1', 'header')
      registerZone(store, 'other', 's2', 'header')
      registerZone(store, 'h2', 's1', 'header')
      registerZone(store, 'f1', 's1', 'footer')

      expect(store.getZoneOrder('s1')).toEqual([
        { type: 'zone', id: 'h1' },
        { type: 'zone', id: 'h2' },
        { type: 'primary' },
        { type: 'zone', id: 'f1' },
      ])
    })
  })

  describe('adjacent targets', () => {
    it('moves from primary to footer/header and wraps across zones', () => {
      const store = createStore()

      registerZone(store, 'h1', 's1', 'header')
      registerZone(store, 'h2', 's1', 'header')
      registerZone(store, 'f1', 's1', 'footer')

      expect(store.getAdjacentTarget('s1', 'primary', 1)).toEqual({
        type: 'zone',
        id: 'f1',
      })
      expect(store.getAdjacentTarget('s1', 'primary', -1)).toEqual({
        type: 'zone',
        id: 'h2',
      })
      expect(store.getAdjacentTarget('s1', 'f1', 1)).toEqual({
        type: 'zone',
        id: 'h1',
      })
      expect(store.getAdjacentTarget('s1', 'h1', -1)).toEqual({
        type: 'zone',
        id: 'f1',
      })
    })

    it('returns null when no zones are registered', () => {
      const store = createStore()

      expect(store.getAdjacentTarget('s1', 'primary', 1)).toBe(null)
    })
  })

  describe('primary target focus', () => {
    it('prefers input and falls back to list', () => {
      const store = createStore()
      const input = document.createElement('input')
      const list = document.createElement('div')
      list.tabIndex = -1
      document.body.append(input, list)

      store.registerPrimaryTarget('s1', 'list', () => list)
      const cleanupInput = store.registerPrimaryTarget(
        's1',
        'input',
        () => input,
      )

      expect(store.focusTarget('s1', { type: 'primary' })).toBe(true)
      expect(document.activeElement).toBe(input)

      cleanupInput()

      expect(store.focusTarget('s1', { type: 'primary' })).toBe(true)
      expect(document.activeElement).toBe(list)
    })
  })

  describe('zone target focus', () => {
    it('focuses the active roving item before other candidates', () => {
      const store = createStore()
      const container = document.createElement('div')
      const rovingItem = document.createElement('div')
      rovingItem.tabIndex = 0
      const button = document.createElement('button')
      container.append(rovingItem, button)
      document.body.append(container)
      registerZone(store, 'z1', 's1', 'footer', container)

      expect(store.focusTarget('s1', { type: 'zone', id: 'z1' })).toBe(true)
      expect(document.activeElement).toBe(rovingItem)
    })

    it('focuses the first plain button when no roving item is present', () => {
      const store = createStore()
      const container = document.createElement('div')
      const button = document.createElement('button')
      container.append(button)
      document.body.append(container)
      registerZone(store, 'z1', 's1', 'footer', container)

      expect(store.focusTarget('s1', { type: 'zone', id: 'z1' })).toBe(true)
      expect(document.activeElement).toBe(button)
    })

    it('returns false and leaves focus unchanged for an empty container', () => {
      const store = createStore()
      const sentinel = document.createElement('button')
      const container = document.createElement('div')
      document.body.append(sentinel, container)
      registerZone(store, 'z1', 's1', 'footer', container)
      sentinel.focus()

      expect(store.focusTarget('s1', { type: 'zone', id: 'z1' })).toBe(false)
      expect(document.activeElement).toBe(sentinel)
    })
  })

  describe('keyboard integration', () => {
    it('moves Tab and Shift+Tab from primary to adjacent zones', () => {
      const zones = createStore()
      registerZone(zones, 'h1', 's1', 'header')
      registerZone(zones, 'f1', 's1', 'footer')
      const focusTarget = vi.spyOn(zones, 'focusTarget').mockReturnValue(true)
      const { result } = renderHook(() =>
        useListboxKeyboard({
          store: new ListboxStore(),
          surfaceId: 's1',
          enabled: true,
          closeAll: vi.fn(),
          zones,
        }),
      )

      const tabEvent = createKeyDownEvent('Tab')
      result.current.handleKeyDown(tabEvent)

      expect(tabEvent.preventDefault).toHaveBeenCalled()
      expect(focusTarget).toHaveBeenCalledWith('s1', {
        type: 'zone',
        id: 'f1',
      })

      const shiftTabEvent = createKeyDownEvent('Tab', true)
      result.current.handleKeyDown(shiftTabEvent)

      expect(shiftTabEvent.preventDefault).toHaveBeenCalled()
      expect(focusTarget).toHaveBeenLastCalledWith('s1', {
        type: 'zone',
        id: 'h1',
      })
    })

    it('does not prevent Tab when no zones are registered', () => {
      const { result } = renderHook(() =>
        useListboxKeyboard({
          store: new ListboxStore(),
          surfaceId: 's1',
          enabled: true,
          closeAll: vi.fn(),
          zones: createStore(),
        }),
      )
      const tabEvent = createKeyDownEvent('Tab')

      result.current.handleKeyDown(tabEvent)

      expect(tabEvent.preventDefault).not.toHaveBeenCalled()
    })
  })
})
