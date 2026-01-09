/**
 * Fuzzy matching algorithm for command palette-style filtering.
 * Vendored from cmdk (https://github.com/pacocoursey/cmdk)
 *
 * The scores are arranged so that a continuous match of characters will
 * result in a total score of 1.
 */

// The best case: this character is a match, and either this is the start
// of the string, or the previous character was also a match.
const SCORE_CONTINUE_MATCH = 1

// A new match at the start of a word scores better than a new match
// elsewhere as it's more likely that the user will type the starts
// of fragments.
// NOTE: We score word jumps between spaces slightly higher than slashes, brackets, hyphens, etc.
const SCORE_SPACE_WORD_JUMP = 0.9
const SCORE_NON_SPACE_WORD_JUMP = 0.8

// Any other match isn't ideal, but we include it for completeness.
const SCORE_CHARACTER_JUMP = 0.17

// If the user transposed two letters, it should be significantly penalized.
// i.e. "ouch" is more likely than "curtain" when "uc" is typed.
const SCORE_TRANSPOSITION = 0.1

// The goodness of a match should decay slightly with each missing character.
// i.e. "bad" is more likely than "bard" when "bd" is typed.
// This will not change the order of suggestions based on SCORE_* until
// 100 characters are inserted between matches.
const PENALTY_SKIPPED = 0.999

// The goodness of an exact-case match should be higher than a
// case-insensitive match by a small amount.
// i.e. "HTML" is more likely than "haml" when "HM" is typed.
// This will not change the order of suggestions based on SCORE_* until
// 1000 characters are inserted between matches.
const PENALTY_CASE_MISMATCH = 0.9999

// Match higher for letters closer to the beginning of the word
const PENALTY_DISTANCE_FROM_START = 0.9

// If the word has more characters than the user typed, it should
// be penalised slightly.
// i.e. "html" is more likely than "html5" if I type "html".
// However, it may well be the case that there's a sensible secondary
// ordering (like alphabetical) that it makes sense to rely on when
// there are many prefix matches, so we don't make the penalty increase
// with the number of tokens.
const PENALTY_NOT_COMPLETE = 0.99

const IS_GAP_REGEXP = /[\\/_+.#"@[({&]/
const COUNT_GAPS_REGEXP = /[\\/_+.#"@[({&]/g
const IS_SPACE_REGEXP = /[\s-]/
const COUNT_SPACE_REGEXP = /[\s-]/g

type MemoizedResults = Record<string, number>

function commandScoreInner(
  string: string,
  abbreviation: string,
  lowerString: string,
  lowerAbbreviation: string,
  stringIndex: number,
  abbreviationIndex: number,
  memoizedResults: MemoizedResults,
): number {
  if (abbreviationIndex === abbreviation.length) {
    if (stringIndex === string.length) {
      return SCORE_CONTINUE_MATCH
    }
    return PENALTY_NOT_COMPLETE
  }

  const memoizeKey = `${stringIndex},${abbreviationIndex}`
  if (memoizedResults[memoizeKey] !== undefined) {
    return memoizedResults[memoizeKey]
  }

  const abbreviationChar = lowerAbbreviation.charAt(abbreviationIndex)
  let index = lowerString.indexOf(abbreviationChar, stringIndex)
  let highScore = 0

  let score: number
  let transposedScore: number
  let wordBreaks: RegExpMatchArray | null
  let spaceBreaks: RegExpMatchArray | null

  while (index >= 0) {
    score = commandScoreInner(
      string,
      abbreviation,
      lowerString,
      lowerAbbreviation,
      index + 1,
      abbreviationIndex + 1,
      memoizedResults,
    )

    if (score > highScore) {
      if (index === stringIndex) {
        score *= SCORE_CONTINUE_MATCH
      } else if (IS_GAP_REGEXP.test(string.charAt(index - 1))) {
        score *= SCORE_NON_SPACE_WORD_JUMP
        wordBreaks = string
          .slice(stringIndex, index - 1)
          .match(COUNT_GAPS_REGEXP)
        if (wordBreaks && stringIndex > 0) {
          score *= PENALTY_SKIPPED ** wordBreaks.length
        }
      } else if (IS_SPACE_REGEXP.test(string.charAt(index - 1))) {
        score *= SCORE_SPACE_WORD_JUMP
        spaceBreaks = string
          .slice(stringIndex, index - 1)
          .match(COUNT_SPACE_REGEXP)
        if (spaceBreaks && stringIndex > 0) {
          score *= PENALTY_SKIPPED ** spaceBreaks.length
        }
      } else {
        score *= SCORE_CHARACTER_JUMP
        if (stringIndex > 0) {
          score *= PENALTY_SKIPPED ** (index - stringIndex)
        }
      }

      if (string.charAt(index) !== abbreviation.charAt(abbreviationIndex)) {
        score *= PENALTY_CASE_MISMATCH
      }
    }

    if (
      (score < SCORE_TRANSPOSITION &&
        lowerString.charAt(index - 1) ===
          lowerAbbreviation.charAt(abbreviationIndex + 1)) ||
      (lowerAbbreviation.charAt(abbreviationIndex + 1) ===
        lowerAbbreviation.charAt(abbreviationIndex) &&
        lowerString.charAt(index - 1) !==
          lowerAbbreviation.charAt(abbreviationIndex))
    ) {
      transposedScore = commandScoreInner(
        string,
        abbreviation,
        lowerString,
        lowerAbbreviation,
        index + 1,
        abbreviationIndex + 2,
        memoizedResults,
      )

      if (transposedScore * SCORE_TRANSPOSITION > score) {
        score = transposedScore * SCORE_TRANSPOSITION
      }
    }

    if (score > highScore) {
      highScore = score
    }

    index = lowerString.indexOf(abbreviationChar, index + 1)
  }

  memoizedResults[memoizeKey] = highScore
  return highScore
}

function formatInput(string: string): string {
  // Convert all valid space characters to space so they match each other
  return string.toLowerCase().replace(COUNT_SPACE_REGEXP, ' ')
}

/**
 * Calculates a fuzzy match score between a string and an abbreviation.
 *
 * @param string - The string to match against
 * @param abbreviation - The search query
 * @param keywords - Optional additional keywords to include in matching
 * @returns A score between 0 and 1, where 1 is a perfect match and 0 is no match
 */
export function commandScore(
  string: string,
  abbreviation: string,
  keywords?: string[],
): number {
  if (!abbreviation) return 1
  if (!string) return 0

  // Combine string with keywords for matching
  const fullString =
    keywords && keywords.length > 0 ? `${string} ${keywords.join(' ')}` : string

  return commandScoreInner(
    fullString,
    abbreviation,
    formatInput(fullString),
    formatInput(abbreviation),
    0,
    0,
    {},
  )
}

/**
 * Default filter function for dropdown menu items.
 * Returns a score > 0 for matches, 0 for non-matches.
 */
export const defaultFilter = commandScore
