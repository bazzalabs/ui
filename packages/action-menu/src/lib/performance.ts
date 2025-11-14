type PerformanceMetrics = {
  totalCalls: number
  totalTime: number
  recentTimes: number[]
  maxRecentSamples: number
}

const metrics = new Map<string, PerformanceMetrics>()
let enableLogging = true

function getOrCreateMetric(key: string, maxSamples = 50): PerformanceMetrics {
  if (!metrics.has(key)) {
    metrics.set(key, {
      totalCalls: 0,
      totalTime: 0,
      recentTimes: [],
      maxRecentSamples: maxSamples,
    })
  }
  return metrics.get(key)!
}

export function logPerformance<T>(
  operation: string,
  location: string,
  fn: () => T,
): T {
  const key = `${location}:${operation}`
  const metric = getOrCreateMetric(key)

  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start

  metric.totalCalls++
  metric.totalTime += duration
  metric.recentTimes.push(duration)

  if (metric.recentTimes.length > metric.maxRecentSamples) {
    metric.recentTimes.shift()
  }

  if (enableLogging) {
    const avg =
      metric.recentTimes.reduce((a, b) => a + b, 0) / metric.recentTimes.length
    const overallAvg = metric.totalTime / metric.totalCalls

    console.log(
      `[PERF] ${key} | ${duration.toFixed(2)}ms | recent avg: ${avg.toFixed(2)}ms | overall avg: ${overallAvg.toFixed(2)}ms | calls: ${metric.totalCalls}`,
    )
  }

  return result
}

export function resetMetrics() {
  metrics.clear()
}

export function getMetrics() {
  const result: Record<
    string,
    { totalCalls: number; avgTime: number; recentAvg: number }
  > = {}

  for (const [key, metric] of metrics.entries()) {
    const recentAvg =
      metric.recentTimes.length > 0
        ? metric.recentTimes.reduce((a, b) => a + b, 0) /
          metric.recentTimes.length
        : 0

    result[key] = {
      totalCalls: metric.totalCalls,
      avgTime: metric.totalTime / metric.totalCalls,
      recentAvg,
    }
  }

  return result
}

export function setLogging(enabled: boolean) {
  enableLogging = enabled
  console.log(`[PERF] Logging ${enabled ? 'enabled' : 'disabled'}`)
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  ;(window as any).perf = {
    avgs: getMetrics,
    reset: resetMetrics,
    raw: () => metrics,
    log: setLogging,
    silent: () => setLogging(false),
    verbose: () => setLogging(true),
  }
}
