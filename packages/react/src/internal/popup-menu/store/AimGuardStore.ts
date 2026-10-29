export interface AimGuard {
  triggerId: string
  depth: number
  submenuSurfaceId: string
}

export const DEFAULT_AIM_GUARD_TTL_MS = 450

export class AimGuardStore {
  private guard: AimGuard | null = null
  private timer: ReturnType<typeof setTimeout> | null = null
  private readonly log: (
    event: string,
    details?: Record<string, unknown>,
  ) => void
  private readonly listeners = new Set<(guard: AimGuard | null) => void>()

  constructor(options?: {
    log?: (event: string, details?: Record<string, unknown>) => void
  }) {
    this.log = options?.log ?? (() => {})
  }

  /** Current guard, or `null` when none is active. Safe to call from event handlers. */
  get(): AimGuard | null {
    return this.guard
  }

  /** Activate (or replace) the guard; auto-clears after `ttlMs` (default 450). */
  activate(guard: AimGuard, ttlMs = DEFAULT_AIM_GUARD_TTL_MS): void {
    // Log before mutating so the base fields show the outgoing guard (parity
    // with the original provider).
    this.logEvent('activate', {
      triggerId: guard.triggerId,
      depth: guard.depth,
      submenuSurfaceId: guard.submenuSurfaceId,
      timeoutMs: ttlMs,
    })
    this.clearTimer()
    this.guard = guard
    this.notify()
    this.timer = setTimeout(() => {
      const activeGuard = this.guard
      if (activeGuard === null) return
      this.logEvent('timeout-expired', {
        triggerId: activeGuard.triggerId,
        depth: activeGuard.depth,
        submenuSurfaceId: activeGuard.submenuSurfaceId,
      })
      this.guard = null
      this.timer = null
      this.notify()
    }, ttlMs)
  }

  /** Clear the guard and its timer. Always logs `'clear'` (even when idle). */
  clear(): void {
    this.logEvent('clear')
    this.clearTimer()
    if (this.guard === null) return
    this.guard = null
    this.notify()
  }

  /** Clear everything; call on provider unmount. */
  dispose(): void {
    this.logEvent('provider-unmount-clear')
    this.clearTimer()
    if (this.guard !== null) {
      this.guard = null
      this.notify()
    }
    this.listeners.clear()
  }

  /** Notified after every guard change. Returns an unsubscribe. */
  subscribe(listener: (guard: AimGuard | null) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  private logEvent(event: string, details?: Record<string, unknown>): void {
    this.log(event, {
      aimGuardActive: this.guard !== null,
      guardedTriggerId: this.guard?.triggerId ?? null,
      guardedDepth: this.guard?.depth ?? null,
      guardedSubmenuSurfaceId: this.guard?.submenuSurfaceId ?? null,
      ...details,
    })
  }

  private notify(): void {
    for (const listener of this.listeners) listener(this.guard)
  }
}
