import { describe, expect, it } from 'vitest'
import {
  FIRST_KEYS,
  getDir,
  isCloseKey,
  isFirstKey,
  isLastKey,
  isOpenKey,
  isSelectionKey,
  isVimClose,
  isVimNext,
  isVimOpen,
  isVimPrev,
  LAST_KEYS,
  SELECTION_KEYS,
  SUB_CLOSE_KEYS,
  SUB_OPEN_KEYS,
} from '../../lib/keyboard.js'

describe('keyboard utilities', () => {
  describe('key constants', () => {
    it('should define selection keys', () => {
      expect(SELECTION_KEYS).toEqual(['Enter'])
    })

    it('should define first keys', () => {
      expect(FIRST_KEYS).toEqual(['ArrowDown', 'PageUp', 'Home'])
    })

    it('should define last keys', () => {
      expect(LAST_KEYS).toEqual(['ArrowUp', 'PageDown', 'End'])
    })

    it('should define submenu open keys for LTR', () => {
      expect(SUB_OPEN_KEYS.ltr).toContain('Enter')
      expect(SUB_OPEN_KEYS.ltr).toContain('ArrowRight')
    })

    it('should define submenu open keys for RTL', () => {
      expect(SUB_OPEN_KEYS.rtl).toContain('Enter')
      expect(SUB_OPEN_KEYS.rtl).toContain('ArrowLeft')
    })

    it('should define submenu close keys for LTR', () => {
      expect(SUB_CLOSE_KEYS.ltr).toEqual(['ArrowLeft'])
    })

    it('should define submenu close keys for RTL', () => {
      expect(SUB_CLOSE_KEYS.rtl).toEqual(['ArrowRight'])
    })
  })

  describe('isSelectionKey', () => {
    it('should return true for Enter', () => {
      expect(isSelectionKey('Enter')).toBe(true)
    })

    it('should return false for non-selection keys', () => {
      expect(isSelectionKey('Space')).toBe(false)
      expect(isSelectionKey('a')).toBe(false)
      expect(isSelectionKey('ArrowDown')).toBe(false)
    })
  })

  describe('isFirstKey', () => {
    it('should return true for ArrowDown', () => {
      expect(isFirstKey('ArrowDown')).toBe(true)
    })

    it('should return true for PageUp', () => {
      expect(isFirstKey('PageUp')).toBe(true)
    })

    it('should return true for Home', () => {
      expect(isFirstKey('Home')).toBe(true)
    })

    it('should return false for non-first keys', () => {
      expect(isFirstKey('ArrowUp')).toBe(false)
      expect(isFirstKey('Enter')).toBe(false)
      expect(isFirstKey('a')).toBe(false)
    })
  })

  describe('isLastKey', () => {
    it('should return true for ArrowUp', () => {
      expect(isLastKey('ArrowUp')).toBe(true)
    })

    it('should return true for PageDown', () => {
      expect(isLastKey('PageDown')).toBe(true)
    })

    it('should return true for End', () => {
      expect(isLastKey('End')).toBe(true)
    })

    it('should return false for non-last keys', () => {
      expect(isLastKey('ArrowDown')).toBe(false)
      expect(isLastKey('Enter')).toBe(false)
      expect(isLastKey('a')).toBe(false)
    })
  })

  describe('isOpenKey', () => {
    it('should return true for Enter in LTR', () => {
      expect(isOpenKey('ltr', 'Enter')).toBe(true)
    })

    it('should return true for ArrowRight in LTR', () => {
      expect(isOpenKey('ltr', 'ArrowRight')).toBe(true)
    })

    it('should return false for ArrowLeft in LTR', () => {
      expect(isOpenKey('ltr', 'ArrowLeft')).toBe(false)
    })

    it('should return true for Enter in RTL', () => {
      expect(isOpenKey('rtl', 'Enter')).toBe(true)
    })

    it('should return true for ArrowLeft in RTL', () => {
      expect(isOpenKey('rtl', 'ArrowLeft')).toBe(true)
    })

    it('should return false for ArrowRight in RTL', () => {
      expect(isOpenKey('rtl', 'ArrowRight')).toBe(false)
    })
  })

  describe('isCloseKey', () => {
    it('should return true for ArrowLeft in LTR', () => {
      expect(isCloseKey('ltr', 'ArrowLeft')).toBe(true)
    })

    it('should return false for ArrowRight in LTR', () => {
      expect(isCloseKey('ltr', 'ArrowRight')).toBe(false)
    })

    it('should return true for ArrowRight in RTL', () => {
      expect(isCloseKey('rtl', 'ArrowRight')).toBe(true)
    })

    it('should return false for ArrowLeft in RTL', () => {
      expect(isCloseKey('rtl', 'ArrowLeft')).toBe(false)
    })

    it('should return false for other keys', () => {
      expect(isCloseKey('ltr', 'Enter')).toBe(false)
      expect(isCloseKey('rtl', 'Enter')).toBe(false)
    })
  })

  describe('isVimNext', () => {
    it('should return true for Ctrl+n', () => {
      const event = {
        ctrlKey: true,
        key: 'n',
      } as React.KeyboardEvent
      expect(isVimNext(event)).toBe(true)
    })

    it('should return true for Ctrl+j', () => {
      const event = {
        ctrlKey: true,
        key: 'j',
      } as React.KeyboardEvent
      expect(isVimNext(event)).toBe(true)
    })

    it('should return false without Ctrl', () => {
      const event = {
        ctrlKey: false,
        key: 'n',
      } as React.KeyboardEvent
      expect(isVimNext(event)).toBe(false)
    })

    it('should return false for other keys', () => {
      const event = {
        ctrlKey: true,
        key: 'a',
      } as React.KeyboardEvent
      expect(isVimNext(event)).toBe(false)
    })
  })

  describe('isVimPrev', () => {
    it('should return true for Ctrl+p', () => {
      const event = {
        ctrlKey: true,
        key: 'p',
      } as React.KeyboardEvent
      expect(isVimPrev(event)).toBe(true)
    })

    it('should return true for Ctrl+k', () => {
      const event = {
        ctrlKey: true,
        key: 'k',
      } as React.KeyboardEvent
      expect(isVimPrev(event)).toBe(true)
    })

    it('should return false without Ctrl', () => {
      const event = {
        ctrlKey: false,
        key: 'p',
      } as React.KeyboardEvent
      expect(isVimPrev(event)).toBe(false)
    })

    it('should return false for other keys', () => {
      const event = {
        ctrlKey: true,
        key: 'a',
      } as React.KeyboardEvent
      expect(isVimPrev(event)).toBe(false)
    })
  })

  describe('isVimOpen', () => {
    it('should return true for Ctrl+l', () => {
      const event = {
        ctrlKey: true,
        key: 'l',
      } as React.KeyboardEvent
      expect(isVimOpen(event)).toBe(true)
    })

    it('should return false without Ctrl', () => {
      const event = {
        ctrlKey: false,
        key: 'l',
      } as React.KeyboardEvent
      expect(isVimOpen(event)).toBe(false)
    })

    it('should return false for other keys', () => {
      const event = {
        ctrlKey: true,
        key: 'h',
      } as React.KeyboardEvent
      expect(isVimOpen(event)).toBe(false)
    })
  })

  describe('isVimClose', () => {
    it('should return true for Ctrl+h', () => {
      const event = {
        ctrlKey: true,
        key: 'h',
      } as React.KeyboardEvent
      expect(isVimClose(event)).toBe(true)
    })

    it('should return false without Ctrl', () => {
      const event = {
        ctrlKey: false,
        key: 'h',
      } as React.KeyboardEvent
      expect(isVimClose(event)).toBe(false)
    })

    it('should return false for other keys', () => {
      const event = {
        ctrlKey: true,
        key: 'l',
      } as React.KeyboardEvent
      expect(isVimClose(event)).toBe(false)
    })
  })

  describe('getDir', () => {
    it('should return explicit direction when provided', () => {
      expect(getDir('ltr')).toBe('ltr')
      expect(getDir('rtl')).toBe('rtl')
    })

    it('should return ltr as default', () => {
      expect(getDir()).toBe('ltr')
    })

    it('should read from document.dir when available', () => {
      // Save original
      const originalDir = document.dir

      // Test RTL
      document.dir = 'rtl'
      expect(getDir()).toBe('rtl')

      // Test LTR
      document.dir = 'ltr'
      expect(getDir()).toBe('ltr')

      // Test uppercase (should be lowercased)
      document.dir = 'RTL'
      expect(getDir()).toBe('rtl')

      // Test invalid value (should fallback to ltr)
      document.dir = 'invalid' as any
      expect(getDir()).toBe('ltr')

      // Restore
      document.dir = originalDir
    })

    it('should prefer explicit direction over document.dir', () => {
      const originalDir = document.dir
      document.dir = 'rtl'

      expect(getDir('ltr')).toBe('ltr')

      document.dir = originalDir
    })
  })

  describe('key combinations', () => {
    it('should not have overlapping first and last keys', () => {
      const firstSet = new Set(FIRST_KEYS as readonly string[])
      const lastSet = new Set(LAST_KEYS as readonly string[])

      for (const key of firstSet) {
        expect(lastSet.has(key)).toBe(false)
      }
    })

    it('should have Enter in both selection and open keys', () => {
      expect(SELECTION_KEYS.includes('Enter')).toBe(true)
      expect(SUB_OPEN_KEYS.ltr.includes('Enter')).toBe(true)
      expect(SUB_OPEN_KEYS.rtl.includes('Enter')).toBe(true)
    })

    it('should have opposite open/close keys for LTR and RTL', () => {
      // ArrowRight opens in LTR, closes in RTL
      expect(SUB_OPEN_KEYS.ltr.includes('ArrowRight')).toBe(true)
      expect(SUB_CLOSE_KEYS.rtl).toContain('ArrowRight')

      // ArrowLeft closes in LTR, opens in RTL
      expect(SUB_CLOSE_KEYS.ltr).toContain('ArrowLeft')
      expect(SUB_OPEN_KEYS.rtl.includes('ArrowLeft')).toBe(true)
    })
  })
})
