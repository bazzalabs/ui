import {
  createSelector,
  createSelectorMemoized,
  ReactStore,
} from '@base-ui/utils/store'
import { useRefWithInit } from '@base-ui/utils/useRefWithInit'

export type Key = string
export type SelectionMode = 'none' | 'single' | 'multiple'

export interface SelectionChangeDetails {
  type: 'set' | 'toggle' | 'range' | 'all' | 'clear' | 'prune'
  anchorKey: Key | null
  addedKeys: ReadonlySet<Key>
  removedKeys: ReadonlySet<Key>
}

export interface SelectionState {
  selectedKeys: ReadonlySet<Key>
  selectedKeysProp: ReadonlySet<Key> | undefined
  anchorKey: Key | null
  rangeHeadKey: Key | null
  orderedKeys: readonly Key[]
  disabledKeys: ReadonlySet<Key>
}

export interface SelectionContext {
  mode: SelectionMode
  onSelectionChange?: (
    keys: ReadonlySet<Key>,
    details: SelectionChangeDetails,
  ) => void
}

const selectors = {
  selectedKeys: createSelectorMemoized(
    (state: SelectionState) => state.selectedKeysProp ?? state.selectedKeys,
    (state: SelectionState) => state.orderedKeys,
    (source, orderedKeys) => {
      const ordered = new Set(orderedKeys)
      return new Set([...source].filter((key) => ordered.has(key)))
    },
  ),
  anchorKey: createSelector((state: SelectionState) => state.anchorKey),
  isSelected: createSelector((state: SelectionState, key: Key) =>
    effectiveKeys(state).has(key),
  ),
  isFirstOfRun: createSelector((state: SelectionState, key: Key) => {
    const selected = effectiveKeys(state)
    const index = state.orderedKeys.indexOf(key)
    const previousKey = index > 0 ? state.orderedKeys[index - 1] : undefined
    return (
      index >= 0 &&
      selected.has(key) &&
      (previousKey === undefined || !selected.has(previousKey))
    )
  }),
  isLastOfRun: createSelector((state: SelectionState, key: Key) => {
    const selected = effectiveKeys(state)
    const index = state.orderedKeys.indexOf(key)
    const nextKey = index >= 0 ? state.orderedKeys[index + 1] : undefined
    return (
      index >= 0 &&
      selected.has(key) &&
      (nextKey === undefined || !selected.has(nextKey))
    )
  }),
}

function effectiveKeys(state: SelectionState): ReadonlySet<Key> {
  const source = state.selectedKeysProp ?? state.selectedKeys
  const ordered = new Set(state.orderedKeys)
  return new Set([...source].filter((key) => ordered.has(key)))
}

function sameKeys(a: ReadonlySet<Key>, b: ReadonlySet<Key>): boolean {
  if (a.size !== b.size) return false
  for (const key of a) if (!b.has(key)) return false
  return true
}

function difference(a: ReadonlySet<Key>, b: ReadonlySet<Key>): Set<Key> {
  return new Set([...a].filter((key) => !b.has(key)))
}

function rangeKeys(
  orderedKeys: readonly Key[],
  fromKey: Key,
  toKey: Key,
  disabledKeys: ReadonlySet<Key>,
): Set<Key> {
  const from = orderedKeys.indexOf(fromKey)
  const to = orderedKeys.indexOf(toKey)
  if (from < 0 || to < 0) return new Set()
  const start = Math.min(from, to)
  const end = Math.max(from, to)
  return new Set(
    orderedKeys.slice(start, end + 1).filter((key) => !disabledKeys.has(key)),
  )
}

export class SelectionStore extends ReactStore<
  SelectionState,
  SelectionContext,
  typeof selectors
> {
  constructor(
    initialState?: Partial<SelectionState>,
    context?: Partial<SelectionContext>,
  ) {
    super(
      {
        selectedKeys: new Set(),
        selectedKeysProp: undefined,
        anchorKey: null,
        rangeHeadKey: null,
        orderedKeys: [],
        disabledKeys: new Set(),
        ...initialState,
      },
      { mode: 'none', onSelectionChange: undefined, ...context },
      selectors,
    )
  }

  setSelectedKeysProp(keys: Iterable<Key> | undefined): void {
    this.update({
      selectedKeysProp: keys === undefined ? undefined : new Set(keys),
    })
  }

  setMode(mode: SelectionMode): void {
    this.context.mode = mode
  }

  setOrderedKeys(
    keys: readonly Key[],
    disabledKeys: ReadonlySet<Key> = new Set(),
  ): void {
    const previousEffective = effectiveKeys(this.state)
    const nextOrdered = [...keys]
    const ordered = new Set(nextOrdered)
    const pruned = new Set(
      [...previousEffective].filter((key) => !ordered.has(key)),
    )
    const anchorPruned =
      (this.state.anchorKey !== null && !ordered.has(this.state.anchorKey)) ||
      (this.state.rangeHeadKey !== null &&
        !ordered.has(this.state.rangeHeadKey))
    const nextState: Partial<SelectionState> = {
      orderedKeys: nextOrdered,
      disabledKeys: new Set(disabledKeys),
    }
    if (anchorPruned) {
      nextState.anchorKey =
        this.state.anchorKey !== null && ordered.has(this.state.anchorKey)
          ? this.state.anchorKey
          : null
      nextState.rangeHeadKey = null
    }
    if (this.state.selectedKeysProp === undefined && pruned.size > 0) {
      nextState.selectedKeys = new Set(
        [...previousEffective].filter((key) => ordered.has(key)),
      )
    }
    this.update(nextState)
    if (this.state.selectedKeysProp === undefined && pruned.size > 0) {
      this.context.onSelectionChange?.(effectiveKeys(this.state), {
        type: 'prune',
        anchorKey: this.state.anchorKey,
        addedKeys: new Set(),
        removedKeys: pruned,
      })
    }
  }

  override set<T>(key: keyof SelectionState, value: T): void
  override set(keys: Iterable<Key>): void
  override set<T>(...args: [keyof SelectionState, T] | [Iterable<Key>]): void {
    if (args.length === 2) {
      super.set(args[0], args[1])
      return
    }
    if (this.context.mode === 'none') return
    const input = [...args[0]]
    const allowed = new Set(input.filter((key) => this.isAllowed(key)))
    const next =
      this.context.mode === 'single'
        ? new Set(input.slice(-1).filter((key) => this.isAllowed(key)))
        : allowed
    this.commit(next, 'set', input.at(-1) ?? null, null)
  }

  toggle(key: Key): void {
    if (this.context.mode === 'none' || !this.isAllowed(key)) return
    const next = new Set(effectiveKeys(this.state))
    if (this.context.mode === 'single') {
      if (next.has(key)) next.clear()
      else {
        next.clear()
        next.add(key)
      }
    } else if (!next.has(key)) {
      next.add(key)
    } else {
      next.delete(key)
    }
    this.commit(next, 'toggle', key, null)
  }

  selectRange(toKey: Key): void {
    if (this.context.mode !== 'multiple') return
    if (!this.state.orderedKeys.includes(toKey)) return
    if (this.state.anchorKey === null) {
      this.set([toKey])
      return
    }
    this.commit(
      rangeKeys(
        this.state.orderedKeys,
        this.state.anchorKey,
        toKey,
        this.state.disabledKeys,
      ),
      'range',
      this.state.anchorKey,
      toKey,
    )
  }

  extendRange(toKey: Key): void {
    if (this.context.mode !== 'multiple' || this.state.anchorKey === null)
      return
    if (!this.state.orderedKeys.includes(toKey)) return
    const next = new Set(effectiveKeys(this.state))
    if (this.state.rangeHeadKey !== null) {
      for (const key of rangeKeys(
        this.state.orderedKeys,
        this.state.anchorKey,
        this.state.rangeHeadKey,
        this.state.disabledKeys,
      ))
        next.delete(key)
    }
    for (const key of rangeKeys(
      this.state.orderedKeys,
      this.state.anchorKey,
      toKey,
      this.state.disabledKeys,
    ))
      next.add(key)
    this.commit(next, 'range', this.state.anchorKey, toKey)
  }

  selectAll(): void {
    if (this.context.mode !== 'multiple') return
    this.commit(
      new Set(
        this.state.orderedKeys.filter(
          (key) => !this.state.disabledKeys.has(key),
        ),
      ),
      'all',
      this.state.anchorKey,
      null,
    )
  }

  clear(): void {
    if (this.context.mode === 'none') return
    if (effectiveKeys(this.state).size === 0) return
    this.commit(new Set(), 'clear', null, null)
  }

  private isAllowed(key: Key): boolean {
    return (
      this.state.orderedKeys.includes(key) && !this.state.disabledKeys.has(key)
    )
  }

  private commit(
    next: ReadonlySet<Key>,
    type: SelectionChangeDetails['type'],
    anchorKey: Key | null,
    rangeHeadKey: Key | null,
  ): void {
    const previous = effectiveKeys(this.state)
    if (sameKeys(previous, next)) return
    const details: SelectionChangeDetails = {
      type,
      anchorKey,
      addedKeys: difference(next, previous),
      removedKeys: difference(previous, next),
    }
    const state: Partial<SelectionState> = { anchorKey, rangeHeadKey }
    if (this.state.selectedKeysProp === undefined)
      state.selectedKeys = new Set(next)
    this.update(state)
    this.context.onSelectionChange?.(next, details)
  }

  static useStore(
    externalStore: SelectionStore | undefined,
    initialState?: Partial<SelectionState>,
    context?: Partial<SelectionContext>,
  ): SelectionStore {
    return useRefWithInit(
      () => externalStore ?? new SelectionStore(initialState, context),
    ).current
  }
}
