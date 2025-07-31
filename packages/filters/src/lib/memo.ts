// Overloads for up to 6 dependencies
// TypeScript can't infer the exact tuple types when destructuring
export function memo<T1, TResult>(
  getDeps: () => readonly [T1],
  compute: (deps: readonly [T1]) => TResult,
  options: { key: string },
): () => TResult

// 2 dependencies
export function memo<T1, T2, TResult>(
  getDeps: () => readonly [T1, T2],
  compute: (deps: readonly [T1, T2]) => TResult,
  options: { key: string },
): () => TResult

// 3 dependencies
export function memo<T1, T2, T3, TResult>(
  getDeps: () => readonly [T1, T2, T3],
  compute: (deps: readonly [T1, T2, T3]) => TResult,
  options: { key: string },
): () => TResult

// 4 dependencies
export function memo<T1, T2, T3, T4, TResult>(
  getDeps: () => readonly [T1, T2, T3, T4],
  compute: (deps: readonly [T1, T2, T3, T4]) => TResult,
  options: { key: string },
): () => TResult

// 5 dependencies
export function memo<T1, T2, T3, T4, T5, TResult>(
  getDeps: () => readonly [T1, T2, T3, T4, T5],
  compute: (deps: readonly [T1, T2, T3, T4, T5]) => TResult,
  options: { key: string },
): () => TResult

// General fallback for 6+ dependencies
export function memo<TDeps extends readonly any[], TResult>(
  getDeps: () => TDeps,
  compute: (deps: TDeps) => TResult,
  options: { key: string },
): () => TResult

export function memo<TDeps extends readonly any[], TResult>(
  getDeps: () => TDeps,
  compute: (deps: TDeps) => TResult,
  options: { key: string },
): () => TResult {
  let prevDeps: TDeps | undefined
  let cachedResult: TResult | undefined

  return () => {
    const deps = getDeps()

    // If no previous deps or deps have changed, recompute
    if (!prevDeps || !shallowEqual(prevDeps, deps)) {
      cachedResult = compute(deps)
      prevDeps = deps
    }

    return cachedResult!
  }
}

function shallowEqual<T>(arr1: readonly T[], arr2: readonly T[]): boolean {
  if (arr1 === arr2) return true
  if (arr1.length !== arr2.length) return false

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }
  return true
}
