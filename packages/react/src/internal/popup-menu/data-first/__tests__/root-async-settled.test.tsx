import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useRootAsyncSettled } from '../data-list.js'
import type { AsyncLoaderResult, NodeDef, QueryLoaderConfig } from '../types.js'

const config: QueryLoaderConfig = {
  type: 'query',
  Loader: () => null,
  minQueryLength: 0,
}

function result(
  data: NodeDef[] | undefined,
  fetching: boolean,
  error: Error | null = null,
): AsyncLoaderResult<NodeDef[]> {
  const hasData = data !== undefined
  return {
    data,
    error,
    status: error ? 'error' : hasData ? 'success' : 'pending',
    fetchStatus: fetching ? 'fetching' : 'idle',
    loadingPhase: fetching ? (hasData ? 'background' : 'initial') : 'none',
    isLoading: fetching && !hasData,
    isFetching: fetching,
    isInitialLoading: fetching && !hasData,
    isRefetching: fetching && hasData,
    isPending: !hasData && !error,
    isSuccess: hasData && !error,
    isError: error !== null,
    isPaused: false,
    hasData,
    hasFetched: hasData || error !== null,
  }
}

function setup() {
  return renderHook(
    (props: {
      query: string
      result: AsyncLoaderResult<NodeDef[]>
      rendered?: boolean
    }) =>
      useRootAsyncSettled(
        config,
        props.query,
        props.result,
        props.rendered ?? true,
      ).settled,
    {
      initialProps: {
        query: 'a',
        result: result(undefined, true),
      } as {
        query: string
        result: AsyncLoaderResult<NodeDef[]>
        rendered?: boolean
      },
    },
  )
}

describe('useRootAsyncSettled', () => {
  it('settles once the loader stops fetching', () => {
    const hook = setup()
    expect(hook.result.current).toBe(false)
    const a: NodeDef[] = []
    hook.rerender({ query: 'a', result: result(a, false) })
    expect(hook.result.current).toBe(true)
  })

  it("does not treat the previous search's unchanged result as settled", () => {
    const hook = setup()
    const a: NodeDef[] = []
    hook.rerender({ query: 'a', result: result(a, false) })
    hook.rerender({ query: 'ab', result: result(a, false) })
    expect(hook.result.current).toBe(false)
  })

  it('settles when the search returns to the last settled one and its data is showing', () => {
    const hook = setup()
    const a: NodeDef[] = []
    hook.rerender({ query: 'a', result: result(a, false) })
    hook.rerender({ query: 'ab', result: result(a, false) })
    hook.rerender({ query: 'a', result: result(a, false) })
    expect(hook.result.current).toBe(true)
  })

  it("does not settle on the previous search's error", () => {
    const hook = setup()
    const failure = new Error('offline')
    hook.rerender({ query: 'a', result: result(undefined, false, failure) })
    expect(hook.result.current).toBe(true)
    hook.rerender({ query: 'ab', result: result(undefined, false, failure) })
    expect(hook.result.current).toBe(false)
  })

  it('stays settled through a background refetch of the same search', () => {
    const hook = setup()
    const a: NodeDef[] = []
    hook.rerender({ query: 'a', result: result(a, false) })
    hook.rerender({ query: 'a', result: result(a, true) })
    expect(hook.result.current).toBe(true)
  })

  it('does not stay settled through a first load of the same search', () => {
    const hook = setup()
    const a: NodeDef[] = []
    hook.rerender({ query: 'a', result: result(a, false) })
    hook.rerender({ query: 'a', result: result(undefined, true) })
    expect(hook.result.current).toBe(false)
  })

  it('starts over after the loader stops being rendered', () => {
    const hook = setup()
    const a: NodeDef[] = []
    hook.rerender({ query: 'a', result: result(a, false) })
    hook.rerender({ query: 'a', result: result(a, false), rendered: false })
    expect(hook.result.current).toBe(true)
    // Rendered again with the same search and the old result still showing.
    hook.rerender({ query: 'a', result: result(a, false), rendered: true })
    expect(hook.result.current).toBe(true)
    hook.rerender({
      query: 'a',
      result: result(undefined, true),
      rendered: true,
    })
    expect(hook.result.current).toBe(false)
  })

  it('settles when the search returns to the last settled one and its error is showing', () => {
    const hook = setup()
    const failure = new Error('offline')
    hook.rerender({ query: 'a', result: result(undefined, false, failure) })
    hook.rerender({ query: 'ab', result: result(undefined, false, failure) })
    expect(hook.result.current).toBe(false)
    hook.rerender({ query: 'a', result: result(undefined, false, failure) })
    expect(hook.result.current).toBe(true)
  })
})
