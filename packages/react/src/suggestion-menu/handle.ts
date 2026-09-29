import type * as React from 'react'
import { REASONS } from '../utils/events/index.js'
import type { SuggestionMenuOpenChangeReason } from './events.js'

/** Where the popup is anchored: usually the trigger character's rect. */
export type SuggestionMenuAnchor = () => DOMRect | null

/** What the host input tells the menu when a trigger is typed or updated. */
export interface SuggestionMenuUpdate<Payload = unknown> {
  /** The text typed after the trigger. */
  query?: string
  /** Measures where the popup is anchored. */
  anchor?: SuggestionMenuAnchor
  /** Data for the Root's `children` function, e.g. which trigger was typed. */
  payload?: Payload
}

/** The handle's state, read by the Root. */
export interface SuggestionMenuHandleState<Payload = unknown> {
  query: string
  anchor: SuggestionMenuAnchor | null
  payload: Payload | undefined
  /** The attached host input, if any. */
  host: Element | null
  /** Fields last set through `update()`, for the Root's precedence warnings. */
  updated: { query: boolean; anchor: boolean }
}

/** @internal How a mounted Root serves the handle. */
export interface SuggestionMenuConnection {
  isOpen: () => boolean
  requestOpenChange: (
    open: boolean,
    reason: SuggestionMenuOpenChangeReason,
    event?: Event,
  ) => void
  handleKeyDown: (event: KeyboardEvent | React.KeyboardEvent) => boolean
  attachHost: (host: Element | null, previous: Element | null) => void
}

/**
 * Connects a suggestion menu's Root to its host input: an `<input>`, a
 * `<textarea>` or a contenteditable editor that owns DOM focus and the typed
 * text. Created outside React, so non-React editor code (a ProseMirror plugin,
 * a CodeMirror extension) can drive the menu. One host input is attached at a
 * time.
 */
export class SuggestionMenuHandle<Payload = unknown> {
  #state: SuggestionMenuHandleState<Payload> = {
    query: '',
    anchor: null,
    payload: undefined,
    host: null,
    updated: { query: false, anchor: false },
  }

  #listeners = new Set<() => void>()
  #connection: SuggestionMenuConnection | null = null
  // An open/close requested before any Root was connected.
  #pendingOpen: boolean | null = null

  /** The attached host input, if any. */
  get host(): Element | null {
    return this.#state.host
  }

  /** Whether the menu is open. `false` while no Root is connected. */
  get isOpen(): boolean {
    return this.#connection?.isOpen() ?? false
  }

  /** @internal */
  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  /** @internal */
  getState = (): SuggestionMenuHandleState<Payload> => this.#state

  #set(next: Partial<SuggestionMenuHandleState<Payload>>) {
    this.#state = { ...this.#state, ...next }
    for (const listener of this.#listeners) listener()
  }

  #requestOpen(open: boolean) {
    if (this.#connection) {
      this.#connection.requestOpenChange(open, REASONS.imperativeAction)
    } else {
      this.#pendingOpen = open
    }
  }

  /**
   * Attaches the host input. Attaching another element detaches the previous
   * one and closes the menu if it was open for it. Returns a function that
   * detaches this element.
   */
  attach(element: Element): () => void {
    const previous = this.#state.host
    if (previous !== element) {
      if (previous && this.isOpen) this.#requestOpen(false)
      this.#set({ host: element })
      this.#connection?.attachHost(element, previous)
    }
    return () => {
      if (this.#state.host !== element) return
      if (this.isOpen) this.#requestOpen(false)
      this.#set({ host: null })
      this.#connection?.attachHost(null, element)
    }
  }

  /** Opens the menu, or updates its query, anchor and payload while open. */
  update(next: SuggestionMenuUpdate<Payload>): void {
    const changes: Partial<SuggestionMenuHandleState<Payload>> = {
      updated: {
        query: this.#state.updated.query || next.query !== undefined,
        anchor: this.#state.updated.anchor || next.anchor !== undefined,
      },
    }
    if (next.query !== undefined) changes.query = next.query
    if (next.anchor !== undefined) changes.anchor = next.anchor
    if ('payload' in next) changes.payload = next.payload
    this.#set(changes)
    if (!this.isOpen) this.#requestOpen(true)
  }

  /**
   * Closes the menu. Call it whenever the trigger ends (deleted, or the caret
   * left it), even if the menu is already closed: it also resets what the
   * menu remembers about the trigger, such as a query that had no results.
   */
  close(): void {
    this.#requestOpen(false)
  }

  /**
   * Passes a key press from the host input to the menu. Returns `true` when
   * the menu used the key and prevented its default action; `false` means the
   * key keeps its normal meaning in the host.
   */
  handleKeyDown(event: KeyboardEvent | React.KeyboardEvent): boolean {
    return this.#connection?.handleKeyDown(event) ?? false
  }

  /** @internal Connects a mounted Root. Returns a disconnect function. */
  connect(connection: SuggestionMenuConnection): () => void {
    const previous = this.#connection
    if (previous && previous !== connection) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[SuggestionMenu] A handle serves one Root at a time; the Root mounted last takes it over.',
        )
      }
      // The replaced Root stops watching the host.
      previous.attachHost(null, this.#state.host)
    }
    this.#connection = connection
    connection.attachHost(this.#state.host, null)
    if (this.#pendingOpen !== null) {
      const open = this.#pendingOpen
      this.#pendingOpen = null
      connection.requestOpenChange(open, REASONS.imperativeAction)
    }
    return () => {
      if (this.#connection !== connection) return
      connection.attachHost(null, this.#state.host)
      this.#connection = null
    }
  }
}

/** Creates a handle that connects a suggestion menu to its host input. */
export function createSuggestionMenuHandle<
  Payload = unknown,
>(): SuggestionMenuHandle<Payload> {
  return new SuggestionMenuHandle<Payload>()
}
