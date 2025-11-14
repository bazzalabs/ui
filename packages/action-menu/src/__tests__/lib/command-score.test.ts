import { describe, expect, it } from 'vitest'
import { commandScore } from '../../lib/command-score.js'

describe('commandScore', () => {
  describe('exact matches', () => {
    it('should score exact match as 1.0', () => {
      expect(commandScore('test', 'test')).toBe(1.0)
    })

    it('should score exact match with same case as 1.0', () => {
      expect(commandScore('Test', 'Test')).toBe(1.0)
    })

    it('should score single character exact match as 1.0', () => {
      expect(commandScore('a', 'a')).toBe(1.0)
    })

    it('should score empty strings as 1.0', () => {
      expect(commandScore('', '')).toBe(1.0)
    })
  })

  describe('case sensitivity', () => {
    it('should match case-insensitively', () => {
      const score = commandScore('Test', 'test')
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThan(1.0)
    })

    it('should prefer exact case matches over case mismatches', () => {
      const exactCase = commandScore('HTML', 'HM')
      const wrongCase = commandScore('html', 'HM')
      expect(exactCase).toBeGreaterThan(wrongCase)
    })

    it('should handle mixed case in query', () => {
      const score = commandScore('JavaScript', 'jAvA')
      expect(score).toBeGreaterThan(0)
    })
  })

  describe('word boundary jumps', () => {
    it('should score space word jumps higher than character jumps', () => {
      const spaceJump = commandScore('new file', 'nf')
      const charJump = commandScore('newfile', 'nf')
      expect(spaceJump).toBeGreaterThan(charJump)
    })

    it('should score hyphen word jumps', () => {
      const score = commandScore('my-component', 'mc')
      expect(score).toBeGreaterThan(0.5)
    })

    it('should score slash word jumps', () => {
      const score = commandScore('src/components', 'sc')
      expect(score).toBeGreaterThan(0.5)
    })

    it('should score bracket word jumps', () => {
      const score = commandScore('function(params)', 'fp')
      expect(score).toBeGreaterThan(0.5)
    })

    it('should score dot word jumps', () => {
      const score = commandScore('file.test.ts', 'ftt')
      expect(score).toBeGreaterThan(0.5)
    })
  })

  describe('continuous matches', () => {
    it('should score continuous matches higher', () => {
      const continuous = commandScore('testing', 'test')
      const scattered = commandScore('tevsting', 'test')
      expect(continuous).toBeGreaterThan(scattered)
    })

    it('should prefer prefix matches', () => {
      const prefix = commandScore('component', 'comp')
      const suffix = commandScore('mycomponent', 'comp')
      expect(prefix).toBeGreaterThan(suffix)
    })
  })

  describe('character skipping', () => {
    it('should match with skipped characters', () => {
      const score = commandScore('component', 'cpt')
      expect(score).toBeGreaterThan(0)
    })

    it('should penalize skipped characters', () => {
      const fewSkips = commandScore('component', 'compo')
      const manySkips = commandScore('component', 'cpt')
      expect(fewSkips).toBeGreaterThan(manySkips)
    })

    it('should handle multiple gaps', () => {
      const score = commandScore('a_long_component_name', 'alcn')
      expect(score).toBeGreaterThan(0)
    })
  })

  describe('transpositions', () => {
    it('should handle transposed letters', () => {
      // "uc" should match "ouch" better than random
      const score = commandScore('ouch', 'uc')
      expect(score).toBeGreaterThan(0)
    })

    it('should penalize transpositions', () => {
      const normal = commandScore('test', 'te')
      const transposed = commandScore('test', 'et')
      expect(normal).toBeGreaterThan(transposed)
    })
  })

  describe('partial matches', () => {
    it('should match partial queries', () => {
      const score = commandScore('component', 'comp')
      expect(score).toBeGreaterThan(0.9)
    })

    it('should score shorter matches slightly lower (not complete penalty)', () => {
      const exact = commandScore('html', 'html')
      const partial = commandScore('html5', 'html')
      expect(exact).toBeGreaterThan(partial)
    })

    it('should handle single character matches', () => {
      const score = commandScore('component', 'c')
      expect(score).toBeGreaterThan(0)
    })
  })

  describe('no matches', () => {
    it('should return 0 for no match', () => {
      expect(commandScore('test', 'xyz')).toBe(0)
    })

    it('should return 0 when query is longer than string', () => {
      expect(commandScore('te', 'test')).toBe(0)
    })

    it('should return 0 for completely different strings', () => {
      expect(commandScore('apple', 'banana')).toBe(0)
    })
  })

  describe('alias matching', () => {
    it('should match against aliases', () => {
      const withAlias = commandScore('New File', 'create', ['create', 'add'])
      expect(withAlias).toBeGreaterThan(0)
    })

    it('should prefer main label over aliases', () => {
      const mainLabel = commandScore('create', 'create', ['new'])
      const aliasLabel = commandScore('new', 'create', ['create'])
      expect(mainLabel).toBeGreaterThan(aliasLabel)
    })

    it('should match multiple aliases', () => {
      const score = commandScore('File', 'doc', ['document', 'create', 'new'])
      expect(score).toBeGreaterThan(0)
    })

    it('should handle empty aliases array', () => {
      const score = commandScore('test', 'test', [])
      expect(score).toBe(1.0)
    })

    it('should handle undefined aliases', () => {
      const score = commandScore('test', 'test', undefined)
      expect(score).toBe(1.0)
    })
  })

  describe('special characters', () => {
    it('should handle strings with special regex characters', () => {
      const score = commandScore('test[0]', 'test')
      expect(score).toBeGreaterThan(0)
    })

    it('should match queries with special characters', () => {
      const score = commandScore('component.test.ts', '.test')
      expect(score).toBeGreaterThan(0)
    })

    it('should handle underscores', () => {
      const score = commandScore('my_component', 'mc')
      expect(score).toBeGreaterThan(0.5)
    })

    it('should handle @ symbols', () => {
      const score = commandScore('@component/test', 'ct')
      expect(score).toBeGreaterThan(0.5)
    })
  })

  describe('real-world scenarios', () => {
    it('should match file paths', () => {
      const score = commandScore('src/components/Button.tsx', 'scb')
      expect(score).toBeGreaterThan(0.5)
    })

    it('should match camelCase', () => {
      const score = commandScore('createElement', 'ce')
      expect(score).toBeGreaterThan(0)
    })

    it('should match command names', () => {
      const score = commandScore('git commit', 'gc')
      expect(score).toBeGreaterThan(0.7)
    })

    it('should rank relevant results higher', () => {
      const candidates = [
        'New File',
        'Open File',
        'New Folder',
        'File Settings',
      ]
      const query = 'nf'
      const scores = candidates.map((c) => ({
        label: c,
        score: commandScore(c, query),
      }))
      scores.sort((a, b) => b.score - a.score)

      // "New File" and "New Folder" should score highest (both start with NF)
      expect(scores[0]?.label).toMatch(/^New/)
      expect(scores[1]?.label).toMatch(/^New/)
    })

    it('should handle long strings', () => {
      const longString = 'this is a very long component name with many words'
      const score = commandScore(longString, 'comp')
      expect(score).toBeGreaterThan(0)
    })

    it('should handle unicode characters', () => {
      // Note: Unicode characters like é don't match 'e' in the scoring algorithm
      const score = commandScore('café', 'caf')
      expect(score).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle repeated characters', () => {
      const score = commandScore('aaa', 'aa')
      expect(score).toBeGreaterThan(0)
    })

    it('should handle query with repeated characters', () => {
      const score = commandScore('hello', 'll')
      expect(score).toBeGreaterThan(0)
    })

    it('should handle string with spaces', () => {
      const score = commandScore('new file', 'new file')
      expect(score).toBe(1.0)
    })

    it('should handle multiple spaces', () => {
      // Multiple spaces are treated as separate characters, so scores differ slightly
      const score1 = commandScore('new  file', 'nf')
      const score2 = commandScore('new file', 'nf')
      // Both should score well, though not identically
      expect(score1).toBeGreaterThan(0.8)
      expect(score2).toBeGreaterThan(0.8)
    })

    it('should handle very short strings', () => {
      expect(commandScore('a', 'a')).toBe(1.0)
      expect(commandScore('ab', 'a')).toBeGreaterThan(0.9)
    })
  })

  describe('scoring consistency', () => {
    it('should always return a number', () => {
      const score = commandScore('test', 'te')
      expect(typeof score).toBe('number')
    })

    it('should return values between 0 and 1', () => {
      const testCases: [string, string][] = [
        ['test', 'test'],
        ['component', 'comp'],
        ['no match', 'xyz'],
        ['New File', 'nf'],
      ]

      for (const [str, query] of testCases) {
        const score = commandScore(str, query)
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(1)
      }
    })

    it('should be deterministic (same inputs = same output)', () => {
      const score1 = commandScore('component', 'comp')
      const score2 = commandScore('component', 'comp')
      const score3 = commandScore('component', 'comp')
      expect(score1).toBe(score2)
      expect(score2).toBe(score3)
    })
  })
})
