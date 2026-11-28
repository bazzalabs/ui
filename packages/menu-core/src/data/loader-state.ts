// ============================================================================
// Loader State
// ============================================================================

import type { AsyncNodesConfigBase } from '../tree/branch-config.js'

/**
 * The query a loader's results answer, with a sequence number that tells
 * apart two runs of the same query: a new token each time the query a loader
 * is asked changes, or it starts again after not being asked anything.
 */
export interface QueryToken {
  readonly query: string
  readonly seq: number
}

/**
 * Where one loader stands, tied to the query its results answer:
 * - `idle`: asked nothing (not yet reporting, or a query below its minimum
 *   length with no initial query)
 * - `debouncing`: a new query waits out the loader's `debounce`; `previous` is
 *   what the loader still shows
 * - `loading`: the query is loading, with nothing to show
 * - `refreshing`: the query is loading while the loader still shows `data`
 *   from an earlier query
 * - `settled`: `data` is final for the query (a background refetch of it
 *   keeps it settled); `undefined` when the loader settled without rows
 * - `error`: the query failed; `previous` is what the loader still shows
 */
export type LoaderState<T> =
  | { readonly status: 'idle' }
  | {
      readonly status: 'debouncing'
      readonly token: QueryToken
      readonly previous?: T
    }
  | { readonly status: 'loading'; readonly token: QueryToken }
  | {
      readonly status: 'refreshing'
      readonly token: QueryToken
      readonly data: T
    }
  | {
      readonly status: 'settled'
      readonly token: QueryToken
      readonly data: T | undefined
    }
  | {
      readonly status: 'error'
      readonly token: QueryToken
      readonly error: Error
      readonly previous?: T
    }

/** Whether `state` is final (settled or failed) for `query`. */
export function isSettled<T>(state: LoaderState<T>, query: string): boolean {
  return (
    (state.status === 'settled' || state.status === 'error') &&
    state.token.query === query
  )
}

/**
 * What the engine reads of a loader adapter's result (`AsyncLoaderResult` in
 * packages/react).
 */
export interface LoaderResultLike<T> {
  readonly data: T | undefined
  readonly error: Error | null
  readonly isLoading: boolean
  readonly isFetching: boolean
  readonly isError: boolean
  readonly hasData: boolean
}

/** The query a loader is given, and whether it may run it. */
export interface LoaderTarget {
  readonly query: string
  readonly enabled: boolean
}

/** Whether two targets ask the same thing. */
export function sameTarget(a: LoaderTarget, b: LoaderTarget): boolean {
  return a.query === b.query && a.enabled === b.enabled
}

/**
 * What a search asks of a loader. A static loader gets the search as it is
 * and always runs. A query loader gets the search once it reaches
 * `minQueryLength`; below it, its initial query (`initialQueryBehavior`, or
 * the deprecated `initialQuery`), or nothing when that's `false`.
 */
export function loaderTarget(
  config: AsyncNodesConfigBase,
  search: string,
): LoaderTarget & { readonly isBelowMinLength: boolean } {
  if (config.type !== 'query') {
    return { query: search, enabled: true, isBelowMinLength: false }
  }
  if (search.length >= (config.minQueryLength ?? 1)) {
    return { query: search, enabled: true, isBelowMinLength: false }
  }
  const initial =
    config.initialQueryBehavior !== undefined
      ? config.initialQueryBehavior && (config.initialQueryBehavior.value ?? '')
      : (config.initialQuery ?? '')
  return initial === false
    ? { query: '', enabled: false, isBelowMinLength: true }
    : { query: initial, enabled: true, isBelowMinLength: false }
}

/** The query a loader's results answer: a static loader's answer every search. */
export function tokenQuery(
  config: AsyncNodesConfigBase,
  target: LoaderTarget,
): string {
  return config.type === 'query' ? target.query : ''
}

/**
 * Which query a loader's results answer when it's given `target`: its
 * `tokenQuery`, or `null` when it's asked nothing. Two targets with the same
 * key ask for the same results (a static loader's targets all do).
 */
export function answerKey(
  config: AsyncNodesConfigBase,
  target: LoaderTarget,
): string | null {
  return target.enabled ? tokenQuery(config, target) : null
}

/** How long a loader holds a new query back. */
export function loaderDebounce(config: AsyncNodesConfigBase): number {
  return config.type === 'query' ? (config.debounce ?? 0) : 0
}

// ============================================================================
// Settle policy
// ============================================================================

/**
 * What the settle policy remembers of one loader between decisions. Kept
 * while the loader stops and starts again, so a search it settled before can
 * settle again at once.
 */
export interface SettleMemo<T> {
  /** The query being tracked, from the moment it was first asked. */
  readonly track: {
    readonly key: string
    readonly dataAtChange: T | undefined
    readonly errorAtChange: Error | null | undefined
    readonly sawFetching: boolean
    readonly settled: boolean
  } | null
  /** The last query that settled, with what it showed. */
  readonly lastSettled: {
    readonly key: string
    readonly data: T | undefined
    readonly error: Error | null | undefined
  } | null
  /** What the loader showed at the last decision. */
  readonly previous: {
    readonly data: T | undefined
    readonly error: Error | null | undefined
  }
}

export const EMPTY_SETTLE_MEMO: SettleMemo<never> = {
  track: null,
  lastSettled: null,
  previous: { data: undefined, error: undefined },
}

export interface SettleInput<T> {
  /**
   * Whether the loader is asked anything: it runs, and its query is enabled.
   * An inactive loader has nothing pending, and tracking starts over when
   * it's asked again.
   */
  readonly active: boolean
  /** The query the search asks of it (`tokenQuery`). */
  readonly key: string
  /** The adapter's last result; `undefined` until it reports. */
  readonly result: LoaderResultLike<T> | undefined
  /**
   * The loader hasn't been asked `key` yet (a newer query waits out the
   * debounce), or hasn't answered what it was asked: it counts as fetching,
   * but that doesn't count as having fetched `key`, and what it shows
   * meanwhile isn't new for `key`.
   */
  readonly waiting: boolean
}

export interface SettleDecision<T> {
  readonly memo: SettleMemo<T>
  /** The loader's results are final for `key`. */
  readonly settled: boolean
  /** Some query has settled since the memo started. */
  readonly settledOnce: boolean
}

/**
 * Whether a loader has settled for the query it's asked, from the result it
 * shows. A hook adapter can't say which query its result answers, and may
 * report a new query a render late, still showing the old rows as not
 * fetching. So after the query changes, the loader is pending until it isn't
 * loading or fetching and one of these holds: it was seen fetching since the
 * change, it shows new data or a new error, or the query went back to the
 * last settled one and that query's data (or error) is what it shows. Once
 * settled, a background refetch that keeps its data stays settled; a first
 * load doesn't.
 */
export function decideSettled<T>(
  memo: SettleMemo<T>,
  input: SettleInput<T>,
): SettleDecision<T> {
  const { active, key, result, waiting } = input
  const next = (
    track: SettleMemo<T>['track'],
    settled: boolean,
    lastSettled = memo.lastSettled,
  ): SettleDecision<T> => ({
    memo: {
      track,
      lastSettled,
      previous: { data: result?.data, error: result?.error },
    },
    settled,
    settledOnce: lastSettled !== null,
  })

  if (!active) return next(null, true)

  let track = memo.track
  if (!track || track.key !== key) {
    track = {
      key,
      dataAtChange: memo.previous.data,
      errorAtChange: memo.previous.error,
      sawFetching: false,
      settled: false,
    }
  }
  // What it shows while waiting answers an earlier query, so it's the
  // baseline the answer for `key` must differ from.
  if (
    waiting &&
    (track.dataAtChange !== result?.data ||
      track.errorAtChange !== result?.error)
  ) {
    track = {
      ...track,
      dataAtChange: result?.data,
      errorAtChange: result?.error,
    }
  }
  if (!result) return next(track, false)

  // While waiting, the loader reads as fetching what it shows, a first load
  // when it shows nothing.
  const loading = waiting ? !result.hasData : result.isLoading
  if (track.settled && !loading) return next(track, true)
  if (waiting || loading || result.isFetching) {
    return next(waiting ? track : { ...track, sawFetching: true }, false)
  }

  const last = memo.lastSettled
  const returnedToLastSettled =
    last?.key === key &&
    last.data === result.data &&
    last.error === result.error
  const settled =
    returnedToLastSettled ||
    track.sawFetching ||
    (result.isError
      ? result.error !== track.errorAtChange
      : result.data !== track.dataAtChange)
  if (!settled) return next(track, false)
  return next({ ...track, settled: true }, true, {
    key,
    data: result.data,
    error: result.error,
  })
}
