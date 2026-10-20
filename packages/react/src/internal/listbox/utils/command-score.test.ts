import { describe, expect, it } from 'vitest'
import { commandScore, defaultFilter } from './command-score.js'

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
    expect(commandScore('United States', 'america')).toBe(0)
    expect(
      commandScore('United States', 'america', ['usa', 'america']),
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

    it('matches accented keywords as well as unaccented ones', () => {
      expect(commandScore('Brazil', 'sao', ['São Paulo'])).toBeCloseTo(
        commandScore('Brazil', 'sao', ['Sao Paulo']),
        3,
      )
    })
  })
})

describe('defaultFilter', () => {
  it.each([
    ['apple', 'app'],
    ['apple', 'ale'],
    ['apple', 'xyz'],
    ['Dark Mode', 'dark-mode'],
    ['New project', '  proj  '],
    ['anything', ''],
  ])('scores %j against the single-word query %j exactly as commandScore', (value, query) => {
    expect(defaultFilter(value, query, ['Navattic'])).toBe(
      commandScore(value, query, ['Navattic']),
    )
  })

  it('keeps the single-word ranking of commandScore', () => {
    const values = ['Delete', 'Duplicate', 'Edit details', 'Deploy']
    const rank = (score: typeof commandScore) =>
      values
        .map((value) => ({ value, score: score(value, 'de') }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ value }) => value)

    expect(rank(defaultFilter)).toEqual(rank(commandScore))
    expect(rank(defaultFilter)).toEqual([
      'Delete',
      'Deploy',
      'Edit details',
      'Duplicate',
    ])
  })

  it('matches the words of a query in any order', () => {
    expect(commandScore('New project', 'navattic new', ['Navattic'])).toBe(0)
    expect(
      defaultFilter('New project', 'navattic new', ['Navattic']),
    ).toBeGreaterThan(0)
    expect(
      defaultFilter('New project', 'new navattic', ['Navattic']),
    ).toBeGreaterThan(0)
  })

  it('matches each word fuzzily', () => {
    expect(
      defaultFilter('New project', 'nav proj', ['Navattic']),
    ).toBeGreaterThan(0)
  })

  it('returns 0 when any word does not match', () => {
    expect(defaultFilter('New project', 'navattic xyz', ['Navattic'])).toBe(0)
  })

  it('never scores a multi-word query below its in-order score', () => {
    expect(defaultFilter('Dark Mode', 'dark mode')).toBe(
      commandScore('Dark Mode', 'dark mode'),
    )
    expect(defaultFilter('Dark Mode', 'dark mode')).toBeGreaterThan(
      defaultFilter('Dark Mode', 'mode dark'),
    )
  })
})
