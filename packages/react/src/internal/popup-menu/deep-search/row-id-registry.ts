/**
 * Dev-only registry detecting duplicate data-first row ids across the
 * surfaces of one menu tree. Instantiated per menu root; stripped from
 * production builds by the NODE_ENV guards at every call site.
 */
export interface RowIdRegistry {
  /** Replace the given surface's full set of computed row ids. */
  report(surfaceKey: string, ids: readonly string[]): void
  /** Remove a surface's ids (surface unmounted). */
  unregister(surfaceKey: string): void
}

export function createRowIdRegistry(): RowIdRegistry {
  const surfaceIds = new Map<string, Set<string>>()
  const warnedIds = new Set<string>()

  return {
    report(surfaceKey, ids) {
      surfaceIds.set(surfaceKey, new Set(ids))
      const idSurfaceCount = new Map<string, number>()
      for (const registeredIds of surfaceIds.values()) {
        for (const id of registeredIds) {
          idSurfaceCount.set(id, (idSurfaceCount.get(id) ?? 0) + 1)
        }
      }
      for (const [id, surfaceCount] of idSurfaceCount) {
        if (surfaceCount >= 2 && !warnedIds.has(id)) {
          warnedIds.add(id)
          console.warn(
            `[PopupMenu] Duplicate row id "${id}" is used by multiple surfaces in the same menu. Row ids must be unique for stable highlight, keyboard navigation, and persistent row state. Give the rows distinct explicit \`id\`s or distinct \`value\`s.`,
          )
        }
      }
    },
    unregister(surfaceKey) {
      surfaceIds.delete(surfaceKey)
    },
  }
}
