import { describe, expect, it } from 'vitest'
import { commandScore } from './command-score.js'

describe('commandScore', () => {
  it('returns 1 for an empty query', () => {
    expect(commandScore('anything', '')).toBe(1)
  })

  it('returns 0 when the query does not match', () => {
    expect(commandScore('apple', 'xyz')).toBe(0)
  })

  it('scores a contiguous match higher than a fuzzy one', () => {
    expect(commandScore('apple', 'app')).toBeGreaterThan(
      commandScore('apple', 'ale'),
    )
  })

  it('matches against keywords', () => {
    expect(
      commandScore('United States', 'usa', ['usa', 'america']),
    ).toBeGreaterThan(0)
  })

  describe('queries that diacritic folding could shorten', () => {
    it.each([
      '^',
      '`',
      'a^',
      '^a',
    ])('matches the ASCII accent query %j literally', (query) => {
      expect(commandScore('Apple', query)).toBe(0)
    })

    it.each([
      'ˆ',
      '´',
    ])('scores the query %j, which folds to nothing, without throwing', (query) => {
      expect(() => commandScore('Apple', query)).not.toThrow()
    })

    it('scores a query that contains a standalone combining mark', () => {
      expect(commandScore('café', 'cafe\u0301')).toBeGreaterThan(0)
    })

    it('scores decomposed content as a full contiguous match', () => {
      expect(commandScore('cafe\u0301', 'cafe')).toBeCloseTo(1, 3)
    })

    it('matches accent-like punctuation literally', () => {
      expect(commandScore('x^2', '^')).toBeGreaterThan(0)
    })
  })

  describe('diacritics-insensitive matching', () => {
    it('matches an unaccented query against accented content', () => {
      expect(commandScore('café', 'cafe')).toBeGreaterThan(0)
      expect(commandScore('München', 'munchen')).toBeGreaterThan(0)
      expect(commandScore('São Paulo', 'sao')).toBeGreaterThan(0)
    })

    it('matches an accented query against unaccented content', () => {
      expect(commandScore('cafe', 'café')).toBeGreaterThan(0)
    })

    it('ranks an exact-accent match above an unaccented one', () => {
      expect(commandScore('Café', 'café')).toBeGreaterThan(
        commandScore('Cafe', 'café'),
      )
    })

    it('matches accented keywords', () => {
      expect(commandScore('Brazil', 'sao', ['São Paulo'])).toBeGreaterThan(0)
    })
  })
})
