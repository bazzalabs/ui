import { describe, expect, it } from 'vitest'
import type { LoaderResultLike } from '../data/loader-state.js'
import { createFakeClock } from '../platform/clock.js'
import type { AsyncNodesConfigBase } from '../tree/branch-config.js'
import { LoaderManager } from './loader-manager.js'

type Rows = string[]
type Result = LoaderResultLike<Rows>

function result(
  data: Rows | undefined,
  fetching = false,
  error: Error | null = null,
): Result {
  return {
    data,
    error,
    isLoading: fetching && data === undefined,
    isFetching: fetching,
    isError: error !== null,
    hasData: data !== undefined,
  }
}

const query = (debounce = 0): AsyncNodesConfigBase => ({
  type: 'query',
  Loader: null,
  minQueryLength: 0,
  debounce,
})

function setup(config: AsyncNodesConfigBase = query(), search = 'a') {
  const clock = createFakeClock()
  const manager = new LoaderManager<Rows, Result>({ clock })
  const told: string[] = []
  manager.subscribe((scope) => told.push(scope))
  manager.start('s', null, config, search)
  const entry = () => {
    const found = manager.get('s', null)
    if (!found) throw new Error('no root loader')
    return found
  }
  /** Reports `value` for what the loader was given. */
  const report = (value: Result) =>
    manager.report('s', null, entry().given, value)
  return { clock, manager, told, entry, report }
}

/** A loader that settled on `rows` for 'a'. */
function settledOnA(config: AsyncNodesConfigBase = query()) {
  const loader = setup(config)
  loader.report(result(undefined, true))
  const rows = ['A']
  loader.report(result(rows))
  return { ...loader, rows }
}

describe('LoaderManager', () => {
  it('is idle until its adapter reports, then loads and settles', () => {
    const { entry, report } = setup()
    expect(entry().state).toEqual({ status: 'idle' })
    expect(entry().settled).toBe(false)

    report(result(undefined, true))
    expect(entry().state).toMatchObject({
      status: 'loading',
      token: { query: 'a' },
    })

    const rows = ['A']
    report(result(rows))
    expect(entry().state).toMatchObject({
      status: 'settled',
      token: { query: 'a' },
      data: rows,
    })
    expect(entry()).toMatchObject({ settled: true, settledOnce: true })
  })

  describe('debounce', () => {
    it('holds a new query back for the debounce, reporting it as debouncing', () => {
      const { clock, manager, entry, rows } = settledOnA(query(80))
      manager.setSearch('s', 'ab')
      expect(entry().given).toEqual({ query: 'a', enabled: true })
      expect(entry().state).toMatchObject({
        status: 'debouncing',
        token: { query: 'ab' },
        previous: rows,
      })
      expect(entry().settled).toBe(false)

      clock.advance(79)
      expect(entry().given.query).toBe('a')
      clock.advance(1)
      expect(entry().given).toEqual({ query: 'ab', enabled: true })
      // The loader still shows 'a''s rows, not fetching: not settled yet.
      expect(entry().state).toMatchObject({
        status: 'refreshing',
        token: { query: 'ab' },
        data: rows,
      })
    })

    it('starts the wait over on each newer search, and passes only the last', () => {
      const { clock, manager, entry } = settledOnA(query(80))
      manager.setSearch('s', 'ab')
      clock.advance(50)
      manager.setSearch('s', 'abc')
      clock.advance(50)
      expect(entry().given.query).toBe('a')
      clock.advance(30)
      expect(entry().given.query).toBe('abc')
      expect(clock.pendingTimers()).toBe(0)
    })

    it('ends the wait when the search goes back to what the loader has', () => {
      const { clock, manager, entry } = settledOnA(query(80))
      manager.setSearch('s', 'ab')
      manager.setSearch('s', 'a')
      expect(clock.pendingTimers()).toBe(0)
      expect(entry().state.status).toBe('settled')
      expect(entry().settled).toBe(true)
    })

    it("doesn't count the wait as the loader having fetched", () => {
      const { clock, manager, entry, report, rows } = settledOnA(query(80))
      manager.setSearch('s', 'ab')
      clock.advance(80)
      // The loader answers with what it showed, never having fetched.
      report(result(rows))
      expect(entry().settled).toBe(false)
      report(result(rows, true))
      report(result(['AB']))
      expect(entry()).toMatchObject({
        settled: true,
        state: { status: 'settled', token: { query: 'ab' }, data: ['AB'] },
      })
    })

    it("doesn't settle the waited-for query on the earlier query's answer landing during the wait", () => {
      const { clock, manager, entry, report } = setup(query(80), '')
      const alice = ['Alice']
      report(result(undefined, true))
      manager.setSearch('s', 'zz')
      // The '' fetch answers while 'zz' waits.
      report(result(alice))
      expect(entry().settled).toBe(false)

      clock.advance(80)
      expect(entry()).toMatchObject({
        given: { query: 'zz', enabled: true },
        settled: false,
        outdated: true,
        state: { status: 'refreshing', token: { query: 'zz' } },
      })
      // A hook adapter's first report for 'zz' can still show '''s rows, a
      // render late: they aren't an answer for 'zz'.
      report(result(alice))
      expect(entry()).toMatchObject({ settled: false, outdated: false })
      report(result(alice, true))
      expect(entry()).toMatchObject({ settled: false, outdated: false })
      report(result([]))
      expect(entry()).toMatchObject({
        settled: true,
        state: { status: 'settled', token: { query: 'zz' }, data: [] },
      })
    })

    it("reads a result as outdated from the wait's end until the loader reports for the new query", () => {
      const { clock, manager, entry, report, rows } = settledOnA(query(80))
      manager.setSearch('s', 'ab')
      expect(entry().outdated).toBe(true)
      clock.advance(80)
      expect(entry().outdated).toBe(true)
      report(result(rows, true))
      expect(entry().outdated).toBe(false)
    })

    it('passes the first search at once', () => {
      const { entry, clock } = setup(query(80), 'x')
      expect(entry().given.query).toBe('x')
      expect(clock.pendingTimers()).toBe(0)
    })
  })

  describe('stale tokens', () => {
    it('drops a result reported for a query the loader no longer has', () => {
      const { clock, manager, entry, told } = settledOnA(query(80))
      manager.setSearch('s', 'ab')
      clock.advance(80)
      const before = entry()
      const count = told.length
      manager.report('s', null, { query: 'a', enabled: true }, result(['old']))
      expect(entry()).toBe(before)
      expect(told).toHaveLength(count)
    })

    it('gives each new query a new token, and keeps it while the query stays', () => {
      const { manager, entry, report } = settledOnA()
      const first = entry().state
      manager.setSearch('s', 'ab')
      report(result(undefined, true))
      const loading = entry().state
      expect(loading.status).toBe('loading')
      if (first.status !== 'settled' || loading.status !== 'loading') return
      expect(loading.token.seq).toBeGreaterThan(first.token.seq)
      report(result(['AB']))
      expect(entry().state).toMatchObject({ token: loading.token })
    })
  })

  describe('abort', () => {
    it("ends a loader's wait and drops what it reports once it's removed", () => {
      const { clock, manager, told } = settledOnA(query(80))
      manager.setSearch('s', 'ab')
      expect(clock.pendingTimers()).toBe(1)
      manager.remove('s', null)
      expect(clock.pendingTimers()).toBe(0)
      expect(manager.get('s', null)).toBeUndefined()
      expect(manager.scope('s').root).toBeNull()
      const count = told.length
      manager.report('s', null, { query: 'ab', enabled: true }, result([]))
      expect(told).toHaveLength(count)
    })

    it('forgets a dropped scope and its waits', () => {
      const { clock, manager } = settledOnA(query(80))
      manager.setSearch('s', 'ab')
      manager.drop('s')
      expect(clock.pendingTimers()).toBe(0)
      expect(manager.scope('s').root).toBeNull()
    })

    it('stops every wait on dispose', () => {
      const { clock, manager } = settledOnA(query(80))
      manager.setSearch('s', 'ab')
      manager.dispose()
      expect(clock.pendingTimers()).toBe(0)
      expect(manager.get('s', null)).toBeUndefined()
    })
  })

  describe('errors', () => {
    it('settles on an error, keeping the rows the loader still shows', () => {
      const { manager, entry, report, rows } = settledOnA()
      manager.setSearch('s', 'ab')
      report(result(rows, true))
      const failure = new Error('offline')
      report(result(rows, false, failure))
      expect(entry()).toMatchObject({
        settled: true,
        error: failure,
        state: {
          status: 'error',
          token: { query: 'ab' },
          error: failure,
          previous: rows,
        },
      })
    })

    it('keeps the last error while the loader reports failing without one', () => {
      const { entry, report } = setup()
      const failure = new Error('offline')
      report(result(undefined, false, failure))
      report({ ...result(undefined), isError: true })
      expect(entry().error).toBe(failure)
      report(result([]))
      expect(entry().error).toBeNull()
      expect(entry().state.status).toBe('settled')
    })

    it("doesn't settle on the previous search's error", () => {
      const { manager, entry, report } = setup()
      const failure = new Error('offline')
      report(result(undefined, false, failure))
      expect(entry().settled).toBe(true)
      manager.setSearch('s', 'ab')
      expect(entry().settled).toBe(false)
      report(result(undefined, false, failure))
      expect(entry().settled).toBe(false)
    })
  })

  describe('refreshing', () => {
    it('reports a new query loading behind kept rows as refreshing', () => {
      const { manager, entry, report, rows } = settledOnA()
      manager.setSearch('s', 'ab')
      report(result(rows, true))
      expect(entry()).toMatchObject({
        settled: false,
        state: { status: 'refreshing', token: { query: 'ab' }, data: rows },
      })
    })

    it('stays settled through a background refetch of the same query', () => {
      const { entry, report, rows } = settledOnA()
      const token = entry().state
      report(result(rows, true))
      expect(entry()).toMatchObject({ settled: true, state: token })
    })

    it("doesn't stay settled through a first load of the same query", () => {
      const { entry, report } = settledOnA()
      report(result(undefined, true))
      expect(entry().settled).toBe(false)
      expect(entry().state.status).toBe('loading')
    })
  })

  it("doesn't settle on rows a loader shows a render late for a new query", () => {
    const { manager, entry, report, rows } = settledOnA()
    manager.setSearch('s', 'ab')
    report(result(rows))
    expect(entry().settled).toBe(false)
    report(result(rows, true))
    report(result(['AB']))
    expect(entry().settled).toBe(true)
  })

  it('settles on the same rows once it was seen fetching the new query', () => {
    const { manager, entry, report, rows } = settledOnA()
    manager.setSearch('s', 'ab')
    report(result(rows, true))
    // The server answered 'ab' with the very rows 'a' had.
    report(result(rows))
    expect(entry()).toMatchObject({
      settled: true,
      state: { status: 'settled', token: { query: 'ab' }, data: rows },
    })
  })

  it('settles on the first report after the search goes back to the last settled one', () => {
    const { manager, entry, report, rows } = settledOnA()
    manager.setSearch('s', 'ab')
    report(result(rows))
    expect(entry().settled).toBe(false)
    manager.setSearch('s', 'a')
    // What it shows was reported for 'ab': it hasn't answered 'a' yet.
    expect(entry()).toMatchObject({ settled: false, outdated: true })
    // The same rows 'a' settled on, not fetching: settled without a fetch.
    report(result(rows))
    expect(entry()).toMatchObject({
      settled: true,
      outdated: false,
      state: { status: 'settled', token: { query: 'a' } },
    })
  })

  it('is idle and settled while the search asks nothing of it', () => {
    const { manager, entry } = settledOnA({
      type: 'query',
      Loader: null,
      minQueryLength: 2,
      initialQueryBehavior: false,
    })
    manager.setSearch('s', 'x')
    expect(entry()).toMatchObject({
      given: { query: '', enabled: false },
      settled: true,
      state: { status: 'idle' },
    })
  })

  it('gives a static loader the search, and settles once for every search', () => {
    const { manager, entry } = settledOnA({ type: 'static', Loader: null })
    const state = entry().state
    manager.setSearch('s', 'anything')
    expect(entry().given).toEqual({ query: 'anything', enabled: true })
    expect(entry().state).toBe(state)
    expect(entry().settled).toBe(true)
    expect(manager.isTreeSettled('else')).toBe(true)
  })

  it('forgets what a withdrawn loader showed', () => {
    const { manager, entry } = settledOnA()
    const results = manager.scope('s').results
    expect(results.get(null)?.result.data).toEqual(['A'])
    manager.withdraw('s', null)
    expect(entry()).toMatchObject({ result: undefined, settled: false })
    expect(manager.scope('s').results.size).toBe(0)
  })

  it('remembers what settled across a restart, but not what it showed', () => {
    const { manager, entry, report, rows } = settledOnA()
    manager.remove('s', null)
    manager.start('s', null, query(), 'a')
    expect(entry().settledOnce).toBe(true)
    // What it reports first counts as new, as it showed nothing meanwhile.
    report(result(rows))
    expect(entry().settled).toBe(true)
  })

  it('keeps the results object while only the search changes', () => {
    const { manager } = settledOnA({ type: 'static', Loader: null })
    const { results } = manager.scope('s')
    manager.setSearch('s', 'b')
    expect(manager.scope('s').results).toBe(results)
  })

  it('tells its listeners once per change, and not for one that changes nothing', () => {
    const { manager, told, report } = settledOnA()
    told.length = 0
    const same = manager.get('s', null)?.result
    if (same) report(same)
    expect(told).toEqual([])
    manager.setSearch('s', 'ab')
    expect(told).toEqual(['s'])
  })

  it('keeps branch loaders apart from the root loader', () => {
    const { manager } = settledOnA()
    manager.start('s', 'files', { type: 'static', Loader: null }, 'a')
    const branch = manager.get('s', 'files')
    expect(branch?.id).toBe('files')
    expect(manager.scope('s').branches.get('files')).toBe(branch)
    expect(manager.scope('s').root?.id).toBeNull()
  })

  it('is settled for a query only when every loader is', () => {
    const { manager, report } = settledOnA()
    expect(manager.isTreeSettled('a')).toBe(true)
    expect(manager.isTreeSettled('ab')).toBe(false)
    manager.start('s', 'files', query(), 'a')
    // Started but not reporting yet: it hasn't settled.
    expect(manager.get('s', 'files')?.settled).toBe(false)
    expect(manager.isTreeSettled('a')).toBe(false)
    manager.report(
      's',
      'files',
      { query: 'a', enabled: true },
      result(undefined, true),
    )
    expect(manager.isTreeSettled('a')).toBe(false)
    manager.report('s', 'files', { query: 'a', enabled: true }, result([]))
    expect(manager.isTreeSettled('a')).toBe(true)
    report(result(undefined, true))
    expect(manager.isTreeSettled('a')).toBe(false)
  })
})
