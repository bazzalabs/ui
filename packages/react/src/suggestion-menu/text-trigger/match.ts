/** A character that opens the suggestion menu when typed in a text field. */
export interface SuggestionMenuTextTrigger {
  /** The trigger, e.g. `'@'`, `'/'` or `':'`. */
  char: string
  /**
   * Whether the query may contain spaces, e.g. `@Alice Smith`. A line break
   * always ends it.
   * @default false
   */
  allowSpaces?: boolean
  /**
   * Whether the trigger only counts at the start of a line.
   * @default false
   */
  startOfLine?: boolean
  /**
   * How many characters must follow the trigger before the menu opens.
   * @default 0
   */
  minLength?: number
}

/** A trigger typed in a text field: the menu's payload. */
export interface SuggestionMenuTextTriggerMatch {
  /** The trigger that matched. */
  trigger: SuggestionMenuTextTrigger
  /** The text typed after the trigger. */
  query: string
  /** Where the trigger character starts in the field's value. */
  from: number
  /**
   * Where the typed query ends: the caret, or further if the caret was moved
   * back inside it. Replace `from`–`to` to insert a choice.
   */
  to: number
}

/**
 * Finds the trigger the caret is in, if any. A trigger counts at the start of
 * the text or after whitespace (or only at the start of a line, with
 * `startOfLine`), and runs to the caret. The trigger closest to the caret
 * wins.
 */
export function matchTextTrigger(
  text: string,
  caret: number,
  triggers: readonly SuggestionMenuTextTrigger[],
): SuggestionMenuTextTriggerMatch | null {
  const before = text.slice(0, caret)
  let best: SuggestionMenuTextTriggerMatch | null = null
  for (const trigger of triggers) {
    if (!trigger.char) continue
    const from = before.lastIndexOf(trigger.char)
    if (from < 0 || (best && from <= best.from)) continue
    const query = before.slice(from + trigger.char.length)
    if (query.includes('\n')) continue
    if (!trigger.allowSpaces && /\s/.test(query)) continue
    if (query.length < (trigger.minLength ?? 0)) continue
    const previous = from === 0 ? '' : before.charAt(from - 1)
    const startsLine = from === 0 || previous === '\n'
    if (
      trigger.startOfLine ? !startsLine : !(startsLine || /\s/.test(previous))
    )
      continue
    best = { trigger, query, from, to: caret }
  }
  return best
}
