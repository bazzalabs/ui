import type { SuggestionMenuHandle } from '../handle.js'
import { measureTextPosition } from './caret.js'
import {
  matchTextTrigger,
  type SuggestionMenuTextTrigger,
  type SuggestionMenuTextTriggerMatch,
} from './match.js'

/** What the binding needs from a handle. */
export type SuggestionMenuTextTriggerHandle = Pick<
  SuggestionMenuHandle<SuggestionMenuTextTriggerMatch>,
  | 'attach'
  | 'update'
  | 'close'
  | 'handleKeyDown'
  | 'host'
  | 'subscribeOpenChange'
>

export interface AttachTextTriggerOptions {
  /** The characters that open the menu. */
  triggers: readonly SuggestionMenuTextTrigger[]
}

/** `beforeinput` types that replace the current selection. */
const REPLACING_INPUT_TYPES = new Set([
  'insertText',
  'insertFromPaste',
  'insertLineBreak',
  'insertParagraph',
])

/** Closes that end the trigger: it stays closed until it's typed again. */
const ENDING_REASONS = new Set(['escape-key', 'item-press'])

/** A run of the old value that was replaced: `[start, end)`. */
interface Edit {
  start: number
  end: number
}

/**
 * The run of `before` that was replaced to make `after`, found from their
 * common prefix and suffix. Ambiguous when the edit repeats a neighbouring
 * character, so an edit known from `beforeinput` is preferred.
 */
function diffEdit(before: string, after: string): Edit {
  const max = Math.min(before.length, after.length)
  let start = 0
  while (start < max && before[start] === after[start]) start++
  let end = 0
  while (
    end < max - start &&
    before[before.length - 1 - end] === after[after.length - 1 - end]
  ) {
    end++
  }
  return { start, end: before.length - end }
}

/**
 * Maps a position through an edit. Returns `null` when the position was inside
 * the replaced run (e.g. a trigger character that was deleted or typed over).
 */
function mapPosition(edit: Edit, delta: number, position: number) {
  if (position < edit.start) return position
  if (position >= edit.end) return position + delta
  return null
}

/**
 * Makes an `<input>` or `<textarea>` the suggestion menu's host. Typing a
 * trigger opens the menu with the text after it as the query, anchored at the
 * trigger character; the payload (`menu.payload`) is the match, with the
 * range to replace. Keys the menu uses are forwarded to it and go no further.
 * After Escape, or once a row is chosen, the menu stays closed until the
 * trigger is typed again. A handle shared by several fields follows the one
 * the user is typing in. Returns a function that detaches the field.
 */
export function attachTextTrigger(
  menu: SuggestionMenuTextTriggerHandle,
  field: HTMLInputElement | HTMLTextAreaElement,
  options: AttachTextTriggerOptions,
): () => void {
  const doc = field.ownerDocument
  const root = () => field.getRootNode() as Document | ShadowRoot
  const isFocused = () => root().activeElement === field
  let detachHost: (() => void) | null = null
  const takeHost = () => {
    if (menu.host !== field) detachHost = menu.attach(field)
  }
  // A shared handle stays with the field that has it, unless this one is
  // where the user is.
  if (menu.host === null || isFocused()) takeHost()

  let value = field.value
  // The selection an insertion or replacement is about to replace, from
  // `beforeinput`: exact where a diff would guess.
  let pendingEdit: Edit | null = null
  // The trigger this field opened the menu for, until it's closed here: its
  // start, and how far its query has been typed.
  let session: { char: string; from: number; end: number } | null = null
  // A session this field just closed, until the menu reports how it closed:
  // choosing a row usually edits the text first, which ends the match.
  let closing: { char: string; from: number } | null = null
  // Triggers that ended (Escape, or a row was chosen): they stay closed while
  // their character is in place.
  let ended: Array<{ char: string; from: number }> = []

  /** Moves remembered positions through whatever changed the value. */
  const syncValue = () => {
    const next = field.value
    const known = pendingEdit
    pendingEdit = null
    if (next === value) return
    const before = value
    value = next
    // Trust the selection only if the text outside it really is unchanged.
    const edit =
      known &&
      before.slice(0, known.start) === next.slice(0, known.start) &&
      next.endsWith(before.slice(known.end))
        ? known
        : diffEdit(before, next)
    const delta = next.length - before.length
    const map = (position: number) => mapPosition(edit, delta, position)
    ended = ended.flatMap((trigger) => {
      const from = map(trigger.from)
      return from === null ? [] : [{ ...trigger, from }]
    })
    if (session) {
      const from = map(session.from)
      if (from === null) {
        // The trigger character was deleted or typed over.
        session = null
        menu.close()
      } else {
        session = { ...session, from, end: map(session.end) ?? from }
      }
    }
    if (closing) {
      const from = map(closing.from)
      closing = from === null ? null : { ...closing, from }
    }
  }

  const endSession = () => {
    if (!session) return
    closing = { char: session.char, from: session.from }
    session = null
    menu.close()
  }

  const evaluate = () => {
    if (menu.host !== field) return
    syncValue()
    const caret = field.selectionStart
    const collapsed = caret !== null && caret === field.selectionEnd
    const match = collapsed
      ? matchTextTrigger(field.value, caret, options.triggers)
      : null
    const isEnded =
      match !== null &&
      ended.some(
        (trigger) =>
          trigger.from === match.from && trigger.char === match.trigger.char,
      )
    if (!match || isEnded) return endSession()

    const same =
      session?.char === match.trigger.char && session.from === match.from
    // What was typed for this trigger: typing moves `end` along (through the
    // edit mapping); moving the caret doesn't, so text that was already there
    // is never replaced.
    const end = same && session ? session.end : match.to
    session = { char: match.trigger.char, from: match.from, end }
    closing = null
    const from = match.from
    menu.update({
      query: match.query,
      payload: { ...match, to: end },
      // The trigger character, not the caret, so typing doesn't move it.
      anchor: () => measureTextPosition(field, from),
    })
  }

  const stopListening = menu.subscribeOpenChange((open, reason) => {
    if (open || menu.host !== field) return
    syncValue()
    const target = session ?? closing
    closing = null
    if (target && ENDING_REASONS.has(reason)) {
      ended.push({ char: target.char, from: target.from })
    }
  })

  const onFocus = () => {
    takeHost()
    evaluate()
  }
  const onBeforeInput = (event: Event) => {
    const { inputType } = event as InputEvent
    const start = field.selectionStart
    const end = field.selectionEnd
    if (start === null || end === null) return
    // These replace the selection; others (undo, drop, deleting beside a
    // collapsed caret) change text elsewhere, which the diff finds.
    const replacesSelection =
      REPLACING_INPUT_TYPES.has(inputType) ||
      (start !== end && inputType.startsWith('delete'))
    if (replacesSelection) {
      syncValue()
      pendingEdit = { start, end }
    }
  }
  const onInput = () => {
    if (isFocused()) takeHost()
    evaluate()
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (menu.host !== field) return
    // A key the menu used (e.g. Enter choosing a row) goes no further, so an
    // app's own Enter-to-send doesn't also run.
    if (menu.handleKeyDown(event)) event.stopPropagation()
  }
  const onSelectionChange = () => {
    if (isFocused()) evaluate()
  }
  // Scrolling the field moves the text under the popup.
  const onScroll = () => {
    if (session) evaluate()
  }

  // One element type, so the event map types `keydown` as a KeyboardEvent.
  const element: HTMLElement = field
  element.addEventListener('beforeinput', onBeforeInput)
  element.addEventListener('input', onInput)
  element.addEventListener('focus', onFocus)
  element.addEventListener('keydown', onKeyDown)
  element.addEventListener('scroll', onScroll)
  doc.addEventListener('selectionchange', onSelectionChange)
  return () => {
    stopListening()
    element.removeEventListener('beforeinput', onBeforeInput)
    element.removeEventListener('input', onInput)
    element.removeEventListener('focus', onFocus)
    element.removeEventListener('keydown', onKeyDown)
    element.removeEventListener('scroll', onScroll)
    doc.removeEventListener('selectionchange', onSelectionChange)
    if (menu.host === field) endSession()
    detachHost?.()
  }
}
