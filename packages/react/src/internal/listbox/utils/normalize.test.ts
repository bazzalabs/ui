import { describe, expect, it } from 'vitest'
import { deburr, normalizeValue, slugify } from './normalize.js'

describe('deburr', () => {
  it('strips accents from Latin characters', () => {
    expect(deburr('café')).toBe('cafe')
    expect(deburr('niño')).toBe('nino')
    expect(deburr('munição')).toBe('municao')
    expect(deburr('Málaga')).toBe('Malaga')
  })

  it('handles combining marks across a whole word', () => {
    expect(deburr('résumé')).toBe('resume')
    expect(deburr('naïve')).toBe('naive')
  })

  it('leaves non-decomposable characters unchanged', () => {
    // ø and ł do not decompose into base letter + combining mark
    expect(deburr('smørrebrød')).toBe('smørrebrød')
    expect(deburr('Łódź')).toBe('Łodz')
  })

  it('leaves plain ASCII untouched', () => {
    expect(deburr('hello world')).toBe('hello world')
  })

  it('handles empty string', () => {
    expect(deburr('')).toBe('')
  })
})

describe('normalizeValue', () => {
  it('trims leading whitespace', () => {
    expect(normalizeValue('  hello')).toBe('hello')
  })

  it('trims trailing whitespace', () => {
    expect(normalizeValue('hello  ')).toBe('hello')
  })

  it('trims both leading and trailing whitespace', () => {
    expect(normalizeValue('  hello  ')).toBe('hello')
  })

  it('preserves internal whitespace', () => {
    expect(normalizeValue('hello world')).toBe('hello world')
  })

  it('handles tabs and newlines', () => {
    expect(normalizeValue('\t\nhello\t\n')).toBe('hello')
  })

  it('returns empty string for undefined', () => {
    expect(normalizeValue(undefined)).toBe('')
  })

  it('returns empty string for null', () => {
    expect(normalizeValue(null)).toBe('')
  })

  it('returns empty string for whitespace-only string', () => {
    expect(normalizeValue('   ')).toBe('')
  })

  it('returns unchanged string when no trimming needed', () => {
    expect(normalizeValue('hello')).toBe('hello')
  })

  it('handles empty string', () => {
    expect(normalizeValue('')).toBe('')
  })
})

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('Hello')).toBe('hello')
    expect(slugify('HELLO')).toBe('hello')
    expect(slugify('HeLLo WoRLD')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world')
    expect(slugify('hello  world')).toBe('hello-world') // multiple spaces
  })

  it('removes non-alphanumeric characters', () => {
    expect(slugify('hello!')).toBe('hello')
    expect(slugify('hello@world')).toBe('helloworld')
    expect(slugify("what's up?")).toBe('whats-up')
    expect(slugify('Café & Co.')).toBe('caf-co')
  })

  it('trims whitespace', () => {
    expect(slugify('  hello  ')).toBe('hello')
    expect(slugify('  hello world  ')).toBe('hello-world')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('hello--world')).toBe('hello-world')
    expect(slugify('hello - world')).toBe('hello-world')
    expect(slugify('hello---world')).toBe('hello-world')
  })

  it('removes leading/trailing hyphens', () => {
    expect(slugify('-hello-')).toBe('hello')
    expect(slugify('--hello--')).toBe('hello')
    expect(slugify('!hello!')).toBe('hello')
  })

  it('handles complex strings', () => {
    expect(slugify('User Settings')).toBe('user-settings')
    expect(slugify('  User Settings  ')).toBe('user-settings')
    expect(slugify('Notifications & Alerts')).toBe('notifications-alerts')
    expect(slugify('100% Complete!')).toBe('100-complete')
  })

  it('returns empty string for undefined', () => {
    expect(slugify(undefined)).toBe('')
  })

  it('returns empty string for null', () => {
    expect(slugify(null)).toBe('')
  })

  it('returns empty string for whitespace-only string', () => {
    expect(slugify('   ')).toBe('')
  })

  it('returns empty string for special-chars-only string', () => {
    expect(slugify('!@#$%')).toBe('')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('preserves numbers', () => {
    expect(slugify('item1')).toBe('item1')
    expect(slugify('123')).toBe('123')
    expect(slugify('item 123')).toBe('item-123')
  })
})
