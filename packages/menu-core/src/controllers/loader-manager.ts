import {
  answerKey,
  decideSettled,
  EMPTY_SETTLE_MEMO,
  isSettled,
  type LoaderResultLike,
  type LoaderState,
  type LoaderTarget,
  loaderDebounce,
  loaderTarget,
  type QueryToken,
  type SettleMemo,
  sameTarget,
  tokenQuery,
} from '../data/loader-state.js'
import { type Clock, type ClockHandle, realClock } from '../platform/clock.js'
import type { AsyncNodesConfigBase } from '../tree/branch-config.js'

/** One loader, as its scope's snapshot holds it. Replaced, never changed. */
export interface LoaderEntry<T, R, C> {
  /** The branch's id; `null` for the scope's root loader. */
  readonly id: string | null
  readonly config: C
  /**
   * What the loader is given: what the search asks of it, or the query its
   * `debounce` still holds while a newer one waits.
   */
  readonly given: LoaderTarget
  readonly state: LoaderState<T>
  /** The adapter's last result, while it reports one. */
  readonly result: R | undefined
  /**
   * `result` answers an earlier query than the search asks: a newer one
   * waits out the debounce, or the loader hasn't reported for what it was
   * given yet. Read it as fetching meanwhile.
   */
  readonly outdated: boolean
  /** The last error it reported, kept until a result that isn't an error. */
  readonly error: Error | null
  /**
   * Its results are final for what the search asks (`decideSettled`); true
   * when the search asks nothing of it.
   */
  readonly settled: boolean
  /** Some query has settled since the loader first started in its scope. */
  readonly settledOnce: boolean
}

/** What a graft reads of one loader: its last result and error. */
export interface LoaderResultRecord<R> {
  readonly result: R
  readonly error: Error | null
}

/** One scope's loaders. Replaced, never changed, on each change. */
export interface LoaderScopeSnapshot<T, R, C> {
  /** The scope's own loader (its surface's content), while it runs. */
  readonly root: LoaderEntry<T, R, C> | null
  /** Its branch loaders, by the branch's id. */
  readonly branches: ReadonlyMap<string, LoaderEntry<T, R, C>>
  /**
   * Each reporting loader's result and error, by id (`null`: the root
   * loader). The same object until one of them changes, or a reporting
   * loader stops.
   */
  readonly results: ReadonlyMap<string | null, LoaderResultRecord<R>>
}

export interface LoaderManagerOptions {
  readonly clock?: Clock
}

export const EMPTY_LOADER_SCOPE_SNAPSHOT: LoaderScopeSnapshot<
  never,
  never,
  never
> = {
  root: null,
  branches: new Map(),
  results: new Map(),
}

const IDLE: LoaderState<never> = { status: 'idle' }

interface Slot<T, R, C> {
  readonly id: string | null
  config: C
  /** What the search asks of the loader. */
  current: LoaderTarget
  given: LoaderTarget
  timer: ClockHandle | null
  result: R | undefined
  /** Which query `result` answers (`answerKey` of what the loader had). */
  answered: string | null
  error: Error | null
  memo: SettleMemo<T>
  token: QueryToken | null
  entry: LoaderEntry<T, R, C>
}

interface ScopeRecord<T, R, C> {
  readonly id: string
  search: string
  readonly slots: Map<string | null, Slot<T, R, C>>
  /** The settle memos of loaders that stopped, for when they start again. */
  readonly memos: Map<string | null, SettleMemo<T>>
  snapshot: LoaderScopeSnapshot<T, R, C>
}

/**
 * The state of every data-first loader in a menu tree, by scope (one per
 * data surface) and loader (a branch's id, or `null` for the surface's own
 * content). The one authority for it: each loader's adapter reports what it
 * shows here, and readers read the scopes' snapshots.
 *
 * For each loader it works out what the scope's search asks of it, holds a
 * new query back for the loader's `debounce` (each newer search starts the
 * wait over), drops a result reported for a query the loader no longer has,
 * keeps its last error, and decides, through `decideSettled`, the loader's
 * `LoaderState` and whether its results are final for the search. It never
 * runs a loader: a loader runs in its framework's binding, which reports.
 */
export class LoaderManager<
  T,
  R extends LoaderResultLike<T>,
  C extends AsyncNodesConfigBase = AsyncNodesConfigBase,
> {
  readonly #clock: Clock
  readonly #scopes = new Map<string, ScopeRecord<T, R, C>>()
  readonly #listeners = new Set<(scope: string) => void>()
  #seq = 0

  constructor(options: LoaderManagerOptions = {}) {
    this.#clock = options.clock ?? realClock
  }

  /**
   * A loader starts in `scope`, or its config changed. `search` is the
   * scope's search when this is the scope's first loader; after that, the
   * scope's search is what `setSearch` last said.
   */
  start(scope: string, id: string | null, config: C, search: string): void {
    let record = this.#scopes.get(scope)
    if (!record) {
      record = {
        id: scope,
        search,
        slots: new Map(),
        memos: new Map(),
        snapshot: EMPTY_LOADER_SCOPE_SNAPSHOT,
      }
      this.#scopes.set(scope, record)
    }
    let slot = record.slots.get(id)
    if (slot) {
      if (slot.config === config) return
      const restart = loaderDebounce(slot.config) !== loaderDebounce(config)
      slot.config = config
      this.#retarget(record, slot, restart)
    } else {
      const { query, enabled } = loaderTarget(config, record.search)
      const target: LoaderTarget = { query, enabled }
      slot = {
        id,
        config,
        current: target,
        given: target,
        timer: null,
        result: undefined,
        answered: null,
        error: null,
        memo: record.memos.get(id) ?? EMPTY_SETTLE_MEMO,
        token: null,
        entry: {
          id,
          config,
          given: target,
          state: IDLE,
          result: undefined,
          outdated: false,
          error: null,
          settled: false,
          settledOnce: false,
        },
      }
      record.memos.delete(id)
      record.slots.set(id, slot)
    }
    this.#decide(slot)
    this.#publish(record, false)
  }

  /**
   * The scope's search changed: each of its loaders is asked what it asks,
   * through the loader's debounce.
   */
  setSearch(scope: string, search: string): void {
    const record = this.#scopes.get(scope)
    if (!record || record.search === search) return
    record.search = search
    for (const slot of record.slots.values()) {
      this.#retarget(record, slot, true)
      this.#decide(slot)
    }
    this.#publish(record, false)
  }

  /**
   * The adapter's result, shown for `given` (what the loader was given when
   * it rendered it). A result for another query than the loader has now
   * (`answerKey`) is dropped: the loader reports again for the one it has.
   */
  report(
    scope: string,
    id: string | null,
    given: LoaderTarget,
    result: R,
  ): void {
    const record = this.#scopes.get(scope)
    const slot = record?.slots.get(id)
    if (!record || !slot) return
    const answered = answerKey(slot.config, given)
    if (answered !== answerKey(slot.config, slot.given)) return
    const error = result.isError ? (result.error ?? slot.error) : null
    const changed = slot.result !== result || slot.error !== error
    slot.result = result
    slot.answered = answered
    slot.error = error
    this.#decide(slot)
    this.#publish(record, changed)
  }

  /** The loader's adapter stopped reporting: it shows nothing. */
  withdraw(scope: string, id: string | null): void {
    const record = this.#scopes.get(scope)
    const slot = record?.slots.get(id)
    if (!record || !slot || slot.result === undefined) return
    slot.result = undefined
    slot.answered = null
    slot.error = null
    this.#decide(slot)
    this.#publish(record, true)
  }

  /** The loader stopped: its wait ends, and what it reports later is dropped. */
  remove(scope: string, id: string | null): void {
    const record = this.#scopes.get(scope)
    const slot = record?.slots.get(id)
    if (!record || !slot) return
    this.#cancel(slot)
    record.slots.delete(id)
    // It shows nothing while it's stopped: when it starts again, a result it
    // reports counts as new.
    record.memos.set(id, {
      ...slot.memo,
      track: null,
      previous: EMPTY_SETTLE_MEMO.previous,
    })
    this.#publish(record, slot.result !== undefined)
  }

  /** The scope ended: its loaders, and what they remembered, are forgotten. */
  drop(scope: string): void {
    const record = this.#scopes.get(scope)
    if (!record) return
    for (const slot of record.slots.values()) this.#cancel(slot)
    this.#scopes.delete(scope)
    this.#notify(scope)
  }

  /** A loader's entry, while it runs. */
  get(scope: string, id: string | null): LoaderEntry<T, R, C> | undefined {
    return this.#scopes.get(scope)?.slots.get(id)?.entry
  }

  /** A scope's loaders; an empty snapshot for a scope with none. */
  scope(scope: string): LoaderScopeSnapshot<T, R, C> {
    return (
      this.#scopes.get(scope)?.snapshot ??
      (EMPTY_LOADER_SCOPE_SNAPSHOT as LoaderScopeSnapshot<T, R, C>)
    )
  }

  /**
   * Whether every loader in the tree has settled for `query`: its state is
   * final for what `query` asks of it, or `query` asks nothing of it. A
   * loader that hasn't reported yet hasn't settled.
   */
  isTreeSettled(query: string): boolean {
    for (const record of this.#scopes.values()) {
      for (const slot of record.slots.values()) {
        const target = loaderTarget(slot.config, query)
        if (!target.enabled) continue
        if (!isSettled(slot.entry.state, tokenQuery(slot.config, target))) {
          return false
        }
      }
    }
    return true
  }

  /** `listener` is told the scope of every change, once per change. */
  subscribe(listener: (scope: string) => void): () => void {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  dispose(): void {
    for (const record of this.#scopes.values()) {
      for (const slot of record.slots.values()) this.#cancel(slot)
    }
    this.#scopes.clear()
    this.#listeners.clear()
  }

  /**
   * Asks the loader what the scope's search asks. With a debounce, a new
   * query waits (`restart`: a newer search starts the wait over), and the
   * loader keeps what it was given until the wait ends.
   */
  #retarget(
    record: ScopeRecord<T, R, C>,
    slot: Slot<T, R, C>,
    restart: boolean,
  ) {
    const next = loaderTarget(slot.config, record.search)
    const changed = !sameTarget(next, slot.current)
    if (changed) slot.current = { query: next.query, enabled: next.enabled }
    const debounce = loaderDebounce(slot.config)
    if (debounce <= 0 || sameTarget(slot.current, slot.given)) {
      this.#cancel(slot)
      slot.given = slot.current
      return
    }
    if (!restart && !changed && slot.timer !== null) return
    this.#cancel(slot)
    slot.timer = this.#clock.setTimeout(() => {
      slot.timer = null
      slot.given = slot.current
      this.#decide(slot)
      this.#publish(record, false)
    }, debounce)
  }

  #cancel(slot: Slot<T, R, C>) {
    if (slot.timer === null) return
    this.#clock.clearTimeout(slot.timer)
    slot.timer = null
  }

  /** Works out the loader's verdict and state, and a new entry if they changed. */
  #decide(slot: Slot<T, R, C>) {
    const { current, given, result, config } = slot
    const active = current.enabled
    const asked = answerKey(config, given)
    // A newer query waits out the debounce.
    const debouncing = active && answerKey(config, current) !== asked
    // The loader has the query, but hasn't reported for it yet.
    const unanswered = active && result !== undefined && slot.answered !== asked
    const outdated = result !== undefined && (debouncing || unanswered)
    const key = tokenQuery(config, current)
    const decision = decideSettled(slot.memo, {
      active,
      key,
      result,
      waiting: debouncing || unanswered,
    })
    slot.memo = decision.memo
    if (!active) slot.token = null
    else if (!slot.token || slot.token.query !== key) {
      slot.token = { query: key, seq: ++this.#seq }
    }
    const entry = slot.entry
    const next = stateOf(slot, debouncing, decision.settled)
    const state = sameState(entry.state, next) ? entry.state : next
    if (
      entry.config === config &&
      entry.given === given &&
      entry.state === state &&
      entry.result === result &&
      entry.outdated === outdated &&
      entry.error === slot.error &&
      entry.settled === decision.settled &&
      entry.settledOnce === decision.settledOnce
    ) {
      return
    }
    slot.entry = {
      id: slot.id,
      config,
      given,
      state,
      result,
      outdated,
      error: slot.error,
      settled: decision.settled,
      settledOnce: decision.settledOnce,
    }
  }

  /**
   * Replaces the scope's snapshot when an entry changed, and tells the
   * listeners. `resultsChanged`: a reporting loader's result or error
   * changed, or it stopped.
   */
  #publish(record: ScopeRecord<T, R, C>, resultsChanged: boolean) {
    const previous = record.snapshot
    const root = record.slots.get(null)?.entry ?? null
    let branchesChanged = false
    const branches = new Map<string, LoaderEntry<T, R, C>>()
    for (const [id, slot] of record.slots) {
      if (id === null) continue
      branches.set(id, slot.entry)
      if (previous.branches.get(id) !== slot.entry) branchesChanged = true
    }
    if (branches.size !== previous.branches.size) branchesChanged = true
    if (root === previous.root && !branchesChanged && !resultsChanged) return
    let results = previous.results
    if (resultsChanged) {
      const next = new Map<string | null, LoaderResultRecord<R>>()
      for (const [id, slot] of record.slots) {
        if (slot.result !== undefined) {
          next.set(id, { result: slot.result, error: slot.error })
        }
      }
      results = next
    }
    record.snapshot = {
      root,
      branches: branchesChanged ? branches : previous.branches,
      results,
    }
    this.#notify(record.id)
  }

  #notify(scope: string) {
    for (const listener of this.#listeners) listener(scope)
  }
}

function stateOf<T, R extends LoaderResultLike<T>, C>(
  slot: Slot<T, R, C>,
  debouncing: boolean,
  settled: boolean,
): LoaderState<T> {
  const { result, token } = slot
  if (!token || result === undefined) return IDLE
  if (debouncing) {
    return { status: 'debouncing', token, previous: result.data }
  }
  if (settled) {
    return slot.error
      ? { status: 'error', token, error: slot.error, previous: result.data }
      : { status: 'settled', token, data: result.data }
  }
  return result.data !== undefined
    ? { status: 'refreshing', token, data: result.data }
    : { status: 'loading', token }
}

/** Whether two states say the same thing, so an entry can stay as it is. */
function sameState<T>(a: LoaderState<T>, b: LoaderState<T>): boolean {
  if (a === b) return true
  if (a.status !== b.status) return false
  const x = a as Partial<Record<string, unknown>>
  const y = b as Partial<Record<string, unknown>>
  return (
    x.token === y.token &&
    x.data === y.data &&
    x.previous === y.previous &&
    x.error === y.error
  )
}
