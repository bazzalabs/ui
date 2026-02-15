import { describe, expect, it, vi } from 'vitest'
import { toAsyncLoaderResultFromSWR } from './swr.js'

describe('toAsyncLoaderResultFromSWR', () => {
  it('maps initial load state', () => {
    const result = toAsyncLoaderResultFromSWR({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: true,
      mutate: vi.fn(),
    })

    expect(result.source).toBe('swr')
    expect(result.status).toBe('pending')
    expect(result.fetchStatus).toBe('fetching')
    expect(result.loadingPhase).toBe('initial')
    expect(result.isInitialLoading).toBe(true)
    expect(result.isRefetching).toBe(false)
    expect(result.isFetching).toBe(true)
  })

  it('maps background revalidation when data exists', () => {
    const result = toAsyncLoaderResultFromSWR({
      data: ['A'],
      error: undefined,
      isLoading: false,
      isValidating: true,
      mutate: vi.fn(),
    })

    expect(result.status).toBe('success')
    expect(result.loadingPhase).toBe('background')
    expect(result.isInitialLoading).toBe(false)
    expect(result.isRefetching).toBe(true)
    expect(result.hasData).toBe(true)
    expect(result.hasFetched).toBe(true)
  })

  it('normalizes unknown errors to Error', () => {
    const result = toAsyncLoaderResultFromSWR({
      data: undefined,
      error: 'boom',
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    })

    expect(result.isError).toBe(true)
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('boom')
    expect(result.status).toBe('error')
  })
})
