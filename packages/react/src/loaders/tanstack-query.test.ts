import { describe, expect, it, vi } from 'vitest'
import {
  type TanStackQueryResult,
  toAsyncLoaderResult,
} from './tanstack-query.js'

describe('toAsyncLoaderResult (TanStack)', () => {
  it('maps initial load state', () => {
    const raw: TanStackQueryResult<string[]> = {
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
      error: null,
      isLoading: true,
      isPending: true,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    }

    const result = toAsyncLoaderResult(raw)

    expect(result.source).toBe('tanstack-query')
    expect(result.raw).toBe(raw)
    expect(result.status).toBe('pending')
    expect(result.fetchStatus).toBe('fetching')
    expect(result.loadingPhase).toBe('initial')
    expect(result.isInitialLoading).toBe(true)
    expect(result.isRefetching).toBe(false)
    expect(result.isLoading).toBe(true)
    expect(result.isFetching).toBe(true)
  })

  it('maps background refetch state', () => {
    const result = toAsyncLoaderResult({
      status: 'success',
      fetchStatus: 'fetching',
      data: ['A'],
      error: null,
      isLoading: false,
      isPending: false,
      isFetching: true,
      isRefetching: true,
      isError: false,
      isSuccess: true,
      isFetched: true,
      refetch: vi.fn(),
    })

    expect(result.status).toBe('success')
    expect(result.loadingPhase).toBe('background')
    expect(result.isInitialLoading).toBe(false)
    expect(result.isRefetching).toBe(true)
    expect(result.hasData).toBe(true)
    expect(result.hasFetched).toBe(true)
  })

  it('normalizes unknown errors to Error', () => {
    const result = toAsyncLoaderResult({
      data: undefined,
      error: 'boom',
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as TanStackQueryResult<string[], unknown>)

    expect(result.isError).toBe(true)
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('boom')
    expect(result.status).toBe('error')
  })
})
