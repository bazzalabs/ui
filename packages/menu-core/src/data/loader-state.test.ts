import { describe, expect, it } from 'vitest'
import type { QueryLoaderConfigBase } from '../tree/branch-config.js'
import {
  decideSettled,
  EMPTY_SETTLE_MEMO,
  isSettled,
  type LoaderResultLike,
  loaderTarget,
} from './loader-state.js'

const token = { query: 'a', seq: 1 }

describe('isSettled', () => {
  it('is true for a settled or failed state of the same query only', () => {
    expect(isSettled({ status: 'settled', token, data: [] }, 'a')).toBe(true)
    expect(
      isSettled({ status: 'error', token, error: new Error('x') }, 'a'),
    ).toBe(true)
    expect(isSettled({ status: 'settled', token, data: [] }, 'ab')).toBe(false)
    expect(isSettled({ status: 'refreshing', token, data: [] }, 'a')).toBe(
      false,
    )
    expect(isSettled({ status: 'idle' }, 'a')).toBe(false)
  })
})

describe('loaderTarget', () => {
  const config = (
    fields: Partial<QueryLoaderConfigBase> = {},
  ): QueryLoaderConfigBase => ({ type: 'query', Loader: null, ...fields })

  it('passes a search that reaches the minimum length', () => {
    expect(loaderTarget(config(), 'a')).toMatchObject({
      query: 'a',
      enabled: true,
    })
  })

  it('uses the initial query below the minimum length', () => {
    expect(loaderTarget(config(), '')).toMatchObject({
      query: '',
      enabled: true,
      isBelowMinLength: false,
    })
    expect(
      loaderTarget(
        config({ minQueryLength: 3, initialQueryBehavior: { value: 'top' } }),
        'ab',
      ),
    ).toMatchObject({ query: 'top', enabled: true })
    expect(
      loaderTarget(config({ minQueryLength: 3, initialQuery: 'old' }), 'ab'),
    ).toMatchObject({ query: 'old', enabled: true })
  })

  it('asks nothing below the minimum length without an initial query', () => {
    expect(loaderTarget(config({ initialQueryBehavior: false }), '')).toEqual({
      query: '',
      enabled: false,
      isBelowMinLength: true,
    })
  })

  it('gives a static loader the search as it is', () => {
    expect(loaderTarget({ type: 'static', Loader: null }, 'x')).toMatchObject({
      query: 'x',
      enabled: true,
    })
  })
})

describe('decideSettled', () => {
  const shown = (
    data: string[],
    fetching = false,
  ): LoaderResultLike<string[]> => ({
    data,
    error: null,
    isLoading: false,
    isFetching: fetching,
    isError: false,
    hasData: true,
  })

  it('settles when an inactive loader is asked nothing, and starts over after', () => {
    const rows = ['A']
    let decision = decideSettled<string[]>(EMPTY_SETTLE_MEMO, {
      active: false,
      key: 'a',
      result: shown(rows),
      waiting: false,
    })
    expect(decision.settled).toBe(true)
    expect(decision.memo.track).toBeNull()
    decision = decideSettled(decision.memo, {
      active: true,
      key: 'a',
      result: shown(rows),
      waiting: false,
    })
    // The rows it showed while inactive aren't new.
    expect(decision.settled).toBe(false)
  })

  it('stays pending while waiting, even when it already shows rows', () => {
    const decision = decideSettled<string[]>(EMPTY_SETTLE_MEMO, {
      active: true,
      key: 'a',
      result: shown(['A']),
      waiting: true,
    })
    expect(decision.settled).toBe(false)
    expect(decision.memo.track?.sawFetching).toBe(false)
  })
})
