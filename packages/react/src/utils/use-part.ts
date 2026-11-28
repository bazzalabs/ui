'use client'

import { makeEventPreventable } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'

type Handler = (event: any, ...args: any[]) => unknown

/** What a composed handler reads and writes of Base UI's flag on an event. */
interface PreventableEvent {
  preventBaseUIHandler?: () => void
  baseUIHandlerPrevented?: boolean
}

const isSyntheticEvent = (event: unknown): event is React.SyntheticEvent =>
  event != null && typeof event === 'object' && 'nativeEvent' in event

/**
 * What `scopeFlagToCurrentTarget` keeps of an event's flag: the skip a part's
 * consumer handler called (`preventedOn`, the element it was called on), and
 * a flag that was set before the first part's handler saw the event
 * (`inherited`).
 */
interface FlagState {
  inherited: boolean
  prevented: boolean
  preventedOn: EventTarget | null | undefined
}

const flagStates = new WeakMap<object, FlagState>()

/**
 * Scopes Base UI's `event.baseUIHandlerPrevented` to the element whose
 * handler set it (`event.currentTarget`, as React dispatches the event), for
 * the skips called once a part's handler has seen the event: a
 * `preventBaseUIHandler()` call from a part's consumer handler skips the
 * handlers merged on that element (ours, and a Base UI component's), not
 * those of the parts and Base UI components the event bubbles to. A flag set
 * before (by a `render` element's handler, or by Base UI itself lower in the
 * tree) stays Base UI's: everything outside this helper still reads it on
 * every element, as Base UI does, and `composeHandlers` doesn't take it as a
 * skip of ours. Installed once per event, for the rest of its dispatch, since
 * a Base UI component reads the flag after our handler has returned.
 */
function scopeFlagToCurrentTarget(
  event: React.SyntheticEvent & PreventableEvent,
): FlagState {
  const existing = flagStates.get(event)
  if (existing) return existing
  const state: FlagState = {
    inherited: event.baseUIHandlerPrevented === true,
    prevented: false,
    preventedOn: undefined,
  }
  flagStates.set(event, state)
  Object.defineProperty(event, 'baseUIHandlerPrevented', {
    configurable: true,
    enumerable: true,
    get: () => state.inherited || preventedHere(event, state),
    set: (value: boolean) => {
      if (value === true) {
        state.prevented = true
        state.preventedOn = event.currentTarget
      } else {
        state.inherited = false
        state.prevented = false
      }
    },
  })
  return state
}

/** Whether a part's consumer handler skipped the handlers on this element. */
const preventedHere = (event: React.SyntheticEvent, state: FlagState) =>
  state.prevented && state.preventedOn === event.currentTarget

/**
 * One handler for an event both a part and its consumer handle, by the
 * part handler contract ("Event handlers" in packages/react/AGENTS.md): the
 * consumer's handler runs first, and ours (`engine`) after it, unless the
 * consumer called `event.preventBaseUIHandler()`. That skips the handlers
 * on the element it was called on: ours, a part's composed over ours there,
 * and a Base UI component's the composed handler is passed to. It doesn't
 * skip the handlers of the parts the event bubbles to, and a flag set before
 * any part's handler saw the event isn't a skip of ours
 * (`scopeFlagToCurrentTarget`).
 *
 * What `preventDefault()` means is the engine handler's own business: the
 * handlers that skip themselves for it check `event.defaultPrevented` first.
 */
export function composeHandlers<H extends Handler>(
  consumer: H | undefined,
  engine: H,
): H {
  if (!consumer) return engine
  return ((event: unknown, ...args: unknown[]) => {
    if (!isSyntheticEvent(event)) {
      const result = consumer(event, ...args)
      engine(event, ...args)
      return result
    }
    const preventable = event as React.SyntheticEvent & PreventableEvent
    makeEventPreventable(
      preventable as Parameters<typeof makeEventPreventable>[0],
    )
    const flag = scopeFlagToCurrentTarget(preventable)
    const result = consumer(event, ...args)
    if (!preventedHere(preventable, flag)) engine(event, ...args)
    return result
  }) as H
}

const isHandlerKey = (key: string) =>
  key.charCodeAt(0) === 111 /* o */ &&
  key.charCodeAt(1) === 110 /* n */ &&
  key.charCodeAt(2) >= 65 /* A */ &&
  key.charCodeAt(2) <= 90 /* Z */

/**
 * `composeHandlers(consumer, engine)`, the same function while both are: for
 * a handler a part passes on to a hook, a Base UI component or another part.
 */
export function useComposedHandler<H extends Handler>(
  consumer: H | undefined,
  engine: H,
): H {
  return React.useMemo(
    () => composeHandlers(consumer, engine),
    [consumer, engine],
  )
}

/**
 * A part's element props from its own (`engine`) and its consumer's: the
 * part's attributes win, as `{ ...rest, ...ours }` does, and each handler
 * both set is `composeHandlers(consumer's, ours)`. A handler only one of
 * them sets is passed as it is; an `undefined` one counts as unset, as in
 * Base UI's `mergeProps`.
 */
export function composePartProps(
  engine: Record<string, unknown>,
  consumer: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!consumer) return engine
  const props: Record<string, unknown> = { ...consumer, ...engine }
  for (const key in engine) {
    if (!isHandlerKey(key)) continue
    const ours = engine[key]
    const theirs = consumer[key]
    if (typeof ours === 'function' && typeof theirs === 'function') {
      props[key] = composeHandlers(theirs as Handler, ours as Handler)
    } else if (ours === undefined) {
      props[key] = theirs
    }
  }
  return props
}

export interface UsePartParameters<
  State,
  RenderedElementType extends Element,
  Enabled extends boolean | undefined,
> extends Omit<
    useRender.Parameters<State, RenderedElementType, Enabled>,
    'props'
  > {
  /** The part's own element props: its attributes and its handlers. */
  props?: Record<string, unknown> | undefined
  /**
   * The consumer's element props the part passes through (the rest of its
   * props, with `className` and `style` taken out, as `useRender`'s `props`
   * take them).
   */
  consumer?: Record<string, unknown> | undefined
}

/**
 * `useRender` for a part whose consumer may handle the events it handles:
 * renders `props` over `consumer`, each handler both set composed by the
 * part handler contract (`composePartProps`).
 */
export function usePart<
  State extends Record<string, unknown>,
  RenderedElementType extends Element,
  Enabled extends boolean | undefined = undefined,
>(
  params: UsePartParameters<State, RenderedElementType, Enabled>,
): useRender.ReturnValue<Enabled> {
  const { props, consumer, ...options } = params
  // oxlint-disable-next-line bazza/resolve-state-props -- passes its caller's options on; the rule checks `props` and `consumer` at each `usePart` call
  return useRender<State, RenderedElementType, Enabled>({
    ...options,
    props: composePartProps(props ?? {}, consumer),
  })
}
