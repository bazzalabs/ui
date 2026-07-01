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

  describe('diacritics-insensitive matching', () => {
    it('matches an unaccented query against accented content', () => {
      expect(commandScore('café', 'cafe')).toBeGreaterThan(0)
      expect(commandScore('München', 'munchen')).toBeGreaterThan(0)
      expect(commandScore('São Paulo', 'sao')).toBeGreaterThan(0)
    })

    it('matches an accented query against unaccented content', () => {
      expect(commandScore('cafe', 'café')).toBeGreaterThan(0)
    })

    it('matches accented keywords', () => {
      expect(commandScore('Brazil', 'sao', ['São Paulo'])).toBeGreaterThan(0)
    })
  })
})
